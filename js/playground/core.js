/* ══════════════════════════════════════════════════════════════
   playground/core.js — 틈새 놀이터 공통 엔진
   · 저장소(localStorage) · 내 정보(반/이름) · 효과음 · 토스트 · 모달
   · 5분/10분 마무리 타이머 · 최고 기록(랭킹) · 화면 전환
   교실(index.html)과는 localStorage 값만 느슨하게 읽고, 실시간 세션·게임
   로직은 전혀 건드리지 않습니다. 모든 외부 연동은 try/catch 로 감쌉니다.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const PG = (window.PG = window.PG || {});
  PG.games = PG.games || {};

  PG.$ = (sel, root) => (root || document).querySelector(sel);
  PG.$$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
  PG.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  };
  PG.pad = n => String(n).padStart(2, '0');
  PG.randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  PG.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  PG.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  PG.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  /* ── 저장소 ─────────────────────────────────────────────── */
  PG.store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); return true; }
      catch (e) { return false; }
    },
    del(key) { try { localStorage.removeItem(key); } catch (e) {} }
  };

  const KEYS = PG.KEYS = {
    who: 'cc.playground.who.v1',
    sound: 'cc.playground.sound.v1',
    scores: 'cc.playground.scores.v1',
    shared: 'cc.playground.shared.v1',
    ccLast: 'cc.last.v3',
    ccRoster: 'cc.roster.v3',
    ccSettings: 'cc.settings.v3'
  };

  /* ── 교실 명단 읽기 (실패해도 안전) ────────────────────── */
  PG.classroom = function () {
    const roster = PG.store.get(KEYS.ccRoster, null);
    const last = PG.store.get(KEYS.ccLast, null);
    const classes = [];
    if (roster && roster.classes) {
      Object.keys(roster.classes).forEach(id => {
        const cls = roster.classes[id];
        const names = (cls && Array.isArray(cls.students))
          ? cls.students.slice().sort((a, b) => (a.num || 0) - (b.num || 0)).map(s => s.name)
          : [];
        classes.push({ id, names });
      });
    }
    return {
      classes,
      activeClass: (roster && roster.activeClass) || (classes[0] && classes[0].id) || '꾸러기',
      lastName: (last && last.name) || '',
      lastClass: (last && last.classId) || ''
    };
  };

  /* ── 내 정보 (반 · 이름) ───────────────────────────────── */
  PG.who = {
    name: '',
    cls: '',
    init() {
      const cc = PG.classroom();
      const saved = PG.store.get(KEYS.who, null) || {};
      this.cls = saved.cls || cc.lastClass || cc.activeClass || '꾸러기';
      this.name = saved.name || cc.lastName || '';
      if (!this.name) this.name = '게스트';
      this.paint();
      return this;
    },
    set(name, cls) {
      this.name = String(name || '').trim().slice(0, 12) || '게스트';
      this.cls = String(cls || '').trim() || '꾸러기';
      PG.store.set(KEYS.who, { name: this.name, cls: this.cls });
      this.paint();
    },
    get isGuest() { return this.name === '게스트'; },
    label() { return this.cls + ' · ' + this.name; },
    paint() {
      const n = document.getElementById('who-name');
      const c = document.getElementById('who-cls');
      if (n) n.textContent = this.name;
      if (c) c.textContent = this.cls;
      PG.$$('.who-pill').forEach(el => el.classList.toggle('is-guest', this.isGuest));
    }
  };

  /* ── 효과음 (WebAudio · 부드러운 종소리) ───────────────── */
  PG.sfx = {
    ctx: null,
    on: PG.store.get(KEYS.sound, true) !== false,
    ensure() {
      if (this.ctx) return this.ctx;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      } catch (e) { this.ctx = null; }
      return this.ctx;
    },
    setOn(v) {
      this.on = !!v;
      PG.store.set(KEYS.sound, this.on);
      const b = document.getElementById('t-sound');
      if (b) {
        b.classList.toggle('is-off', !this.on);
        b.textContent = this.on ? '🔊' : '🔇';
        b.setAttribute('aria-label', this.on ? '소리 끄기' : '소리 켜기');
      }
    },
    tone(freq, dur, opt) {
      if (!this.on) return;
      const ctx = this.ensure();
      if (!ctx) return;
      try {
        if (ctx.state === 'suspended') ctx.resume();
        const o = opt || {};
        const t0 = ctx.currentTime + (o.delay || 0);
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = o.type || 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
        const vol = (o.vol == null ? 0.16 : o.vol);
        // 부드러운 어택/릴리즈
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(t0); osc.stop(t0 + dur + 0.02);
      } catch (e) { /* 소리는 실패해도 게임은 계속 */ }
    },
    click() { this.tone(660, 0.06, { vol: 0.07, type: 'triangle' }); },
    pop() { this.tone(880, 0.09, { vol: 0.1, type: 'sine', slideTo: 1180 }); },
    correct() {
      this.tone(784, 0.11, { vol: 0.15, type: 'triangle' });
      this.tone(1046, 0.16, { vol: 0.13, type: 'triangle', delay: 0.09 });
    },
    wrong() {
      this.tone(300, 0.14, { vol: 0.11, type: 'sine', slideTo: 200 });
    },
    level() {
      [660, 880, 1100].forEach((f, i) => this.tone(f, 0.12, { vol: 0.13, delay: i * 0.08, type: 'triangle' }));
    },
    heart() { this.tone(392, 0.2, { vol: 0.12, type: 'sine', slideTo: 262 }); },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.22, { vol: 0.14, delay: i * 0.1, type: 'triangle' }));
    },
    chime() {
      // 수업 마무리 — 세 번 울리는 부드러운 종
      [0, 0.55, 1.1].forEach(d => {
        this.tone(1046, 0.9, { vol: 0.13, type: 'sine', delay: d });
        this.tone(1568, 0.7, { vol: 0.05, type: 'sine', delay: d + 0.02 });
      });
    }
  };

  /* ── 토스트 ─────────────────────────────────────────────── */
  let toastTimer = null;
  PG.toast = function (msg) {
    const el = document.getElementById('pg-toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => { el.hidden = true; }, 260);
    }, 1700);
  };

  /* ── 모달 ───────────────────────────────────────────────── */
  PG.modal = function (html, onMount) {
    const root = document.getElementById('pg-modals');
    if (!root) return null;
    root.hidden = false;
    root.innerHTML = '<div class="modal-card" role="dialog" aria-modal="true">' + html + '</div>';
    const card = root.firstElementChild;
    const close = () => { root.hidden = true; root.innerHTML = ''; };
    root.onclick = e => { if (e.target === root) close(); };
    PG.$$('[data-close]', card).forEach(b => b.addEventListener('click', close));
    if (typeof onMount === 'function') onMount(card, close);
    return { el: card, close };
  };

  /* ── 내 정보 바꾸기 ─────────────────────────────────────── */
  PG.openWho = function () {
    const cc = PG.classroom();
    const classes = cc.classes.length ? cc.classes : [{ id: '꾸러기', names: [] }];
    const cur = PG.who.cls;
    const clsOpts = classes.map(c =>
      `<option value="${PG.esc(c.id)}"${c.id === cur ? ' selected' : ''}>${PG.esc(c.id)}</option>`
    ).join('');
    const findNames = id => (classes.find(c => c.id === id) || {}).names || [];
    const listOpts = findNames(cur).map(n => `<option value="${PG.esc(n)}"></option>`).join('');

    const m = PG.modal(`
      <h3>내 정보</h3>
      <p>이름과 반을 넣으면 최고 기록에 내 기록이 남아요.</p>
      <label class="modal-field"><span>우리 반</span>
        <select id="mw-cls">${clsOpts}</select>
      </label>
      <label class="modal-field"><span>내 이름</span>
        <input id="mw-name" type="text" maxlength="12" list="mw-names" placeholder="이름을 입력하세요" value="${PG.esc(PG.who.isGuest ? '' : PG.who.name)}">
        <datalist id="mw-names">${listOpts}</datalist>
      </label>
      <p class="modal-note">교실에 입장한 이름이 있으면 자동으로 채워 둘게요.</p>
      <div class="modal-actions">
        <button class="btn btn-sm" data-close>취소</button>
        <button class="btn btn-sm btn-primary" id="mw-ok">저장</button>
      </div>
    `, (card, close) => {
      const sel = PG.$('#mw-cls', card);
      const inp = PG.$('#mw-name', card);
      const dl = PG.$('#mw-names', card);
      sel.addEventListener('change', () => {
        dl.innerHTML = findNames(sel.value).map(n => `<option value="${PG.esc(n)}"></option>`).join('');
      });
      const ok = () => {
        PG.who.set(inp.value, sel.value);
        PG.sfx.click();
        close();
        PG.toast(PG.who.label() + ' 님, 반가워요!');
        if (PG.rank) PG.rank.render();
      };
      PG.$('#mw-ok', card).addEventListener('click', ok);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ok(); } });
      setTimeout(() => inp.focus(), 60);
    });
    return m;
  };

  /* ── 화면(뷰) 전환 ─────────────────────────────────────── */
  PG.current = 'hub';
  PG.go = function (id) {
    const ids = ['hub'].concat(Object.keys(PG.games));
    ids.forEach(k => {
      const v = document.getElementById('view-' + k);
      if (v) v.hidden = (k !== id);
    });
    if (PG.current !== id && PG.games[PG.current] && PG.games[PG.current].unmount) {
      try { PG.games[PG.current].unmount(); } catch (e) { /* 무시 */ }
    }
    PG.current = id;
    const main = document.getElementById('pg-main');
    if (main) main.scrollTop = 0;
    if (id !== 'hub' && PG.games[id]) {
      const view = document.getElementById('view-' + id);
      try { PG.games[id].mount(view); } catch (e) {
        console.warn('[playground] game mount error', e);
      }
    }
    if (id === 'hub') {
      if (PG.rank) PG.rank.render();
      if (PG.hubPaint) PG.hubPaint();
    }
    try {
      if (history.replaceState) {
        history.replaceState(null, '', location.pathname + location.search + (id === 'hub' ? '' : '#' + id));
      }
    } catch (e) {}
  };

  /* ══════════════════════════════════════════════════════════
     최고 기록(랭킹) — localStorage 기본, Supabase는 선택
     ══════════════════════════════════════════════════════════ */
  const GAME_META = PG.GAME_META = {
    chosung: { name: '초성 퀴즈', short: '초성', ico: '🔤', unit: '점' },
    typing: { name: '타자 놀이', short: '타자', ico: '⌨️', unit: '점' },
    maze: { name: '미로 찾기', short: '미로', ico: '🌀', unit: '점' },
    spot: { name: '틀린 그림', short: '틀린그림', ico: '🔍', unit: '점' },
    hidden: { name: '숨은 그림', short: '숨은그림', ico: '🕵️', unit: '점' }
  };
  const GAME_IDS = Object.keys(GAME_META);

  PG.rank = {
    tab: 'all',
    remoteRows: null,
    remoteFailed: false,

    all() {
      const list = PG.store.get(KEYS.scores, []);
      return Array.isArray(list) ? list : [];
    },
    save(list) {
      // 너무 많이 쌓이지 않게 최근 400개만 유지
      const trimmed = list.slice(-400);
      PG.store.set(KEYS.scores, trimmed);
      return trimmed;
    },
    add(rec) {
      const row = {
        id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        g: rec.game,
        n: rec.name || PG.who.name,
        c: rec.cls || PG.who.cls,
        s: Math.max(0, Math.round(rec.score || 0)),
        d: rec.detail || '',
        t: Date.now()
      };
      const list = this.all();
      list.push(row);
      this.save(list);
      this.push(row);
      this.render();
      return row;
    },
    /* 한 사람의 게임별 최고 점수만 모으기 */
    bestByPlayer(gameId) {
      const map = new Map();
      this.all().forEach(r => {
        if (gameId && r.g !== gameId) return;
        const key = r.n + '|' + r.c;
        const cur = map.get(key);
        if (!cur || r.s > cur.s) map.set(key, r);
      });
      return Array.from(map.values());
    },
    top(gameId, n) {
      const rows = this.bestByPlayer(gameId)
        .slice()
        .sort((a, b) => b.s - a.s || a.t - b.t)
        .slice(0, n || 5);
      return rows;
    },
    overall(n) {
      // 게임별 최고 점수를 모두 더한 '종합 점수'
      const map = new Map();
      GAME_IDS.forEach(gid => {
        this.bestByPlayer(gid).forEach(r => {
          const key = r.n + '|' + r.c;
          const cur = map.get(key) || { n: r.n, c: r.c, s: 0, played: 0, t: r.t };
          cur.s += r.s;
          cur.played += 1;
          map.set(key, cur);
        });
      });
      return Array.from(map.values())
        .sort((a, b) => b.s - a.s || b.played - a.played)
        .slice(0, n || 5);
    },
    personalBest(gameId) {
      const rows = this.bestByPlayer(gameId)
        .filter(r => r.n === PG.who.name && r.c === PG.who.cls);
      return rows.length ? rows[0].s : 0;
    },
    /* ── Supabase 선택 연동 (표가 없으면 조용히 로컬만 사용) ── */
    remoteOn() {
      return PG.store.get(KEYS.shared, false) === true;
    },
    cfg() {
      let s = null;
      try { s = PG.store.get(KEYS.ccSettings, null); } catch (e) {}
      const url = (s && s.supabaseUrl) || 'https://sspmekdqtlzuezebnygc.supabase.co';
      const key = (s && s.supabaseKey) || '';
      return { url, key };
    },
    async push(row) {
      if (!this.remoteOn() || this.remoteFailed) return;
      const { url, key } = this.cfg();
      if (!url || !key) return;
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(url + '/rest/v1/playground_scores', {
          method: 'POST',
          headers: {
            apikey: key, Authorization: 'Bearer ' + key,
            'Content-Type': 'application/json', Prefer: 'return=minimal'
          },
          body: JSON.stringify({ game: row.g, name: row.n, class: row.c, score: row.s, detail: row.d }),
          signal: ctrl.signal
        });
        clearTimeout(timer);
        if (!res.ok) this.remoteFailed = true;
      } catch (e) {
        this.remoteFailed = true;
      }
    },
    async pull() {
      if (!this.remoteOn() || this.remoteFailed) return null;
      const { url, key } = this.cfg();
      if (!url || !key) return null;
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(url + '/rest/v1/playground_scores?select=score,name,class,game,detail&limit=200', {
          headers: { apikey: key, Authorization: 'Bearer ' + key },
          signal: ctrl.signal
        });
        clearTimeout(timer);
        if (!res.ok) { this.remoteFailed = true; return null; }
        const rows = await res.json();
        if (!Array.isArray(rows)) return null;
        return rows.map((r, i) => ({
          id: 'rem' + i, g: r.game, n: r.name, c: r.class, s: r.score || 0, d: r.detail || '', t: 0
        }));
      } catch (e) {
        this.remoteFailed = true;
        return null;
      }
    },

    /* ── 랭킹판 그리기 ── */
    render() {
      const card = document.getElementById('rank-card');
      if (!card) return;
      const tabs = [{ id: 'all', label: '종합' }].concat(
        GAME_IDS.map(g => ({ id: g, label: GAME_META[g].short }))
      );
      const shared = this.remoteOn() && !this.remoteFailed;
      let rows, myBest = '';
      if (this.tab === 'all') {
        rows = this.overall(5);
        myBest = '내 종합 ' + this.overall(999).filter(r => r.n === PG.who.name && r.c === PG.who.cls)
          .reduce((a, b) => a + b.s, 0) + '점';
      } else {
        rows = this.top(this.tab, 5);
        myBest = '내 최고 ' + this.personalBest(this.tab) + '점';
      }
      const isMe = r => r.n === PG.who.name && r.c === PG.who.cls;
      const medal = i => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1));

      let listHtml;
      if (!rows.length) {
        listHtml = `<div class="rank-empty">아직 기록이 없어요.<br>게임을 한 판 하고 1등을 차지해 보세요! 🏆</div>`;
      } else {
        listHtml = rows.map((r, i) => {
          const detail = this.tab === 'all'
            ? (r.played || 0) + '종목 · 합계'
            : (r.d || GAME_META[this.tab].name);
          return `<div class="rrow r${i + 1}${isMe(r) ? ' is-me' : ''}">
            <span class="r-medal">${medal(i)}</span>
            <span class="r-name">
              <b>${PG.esc(r.n)}<em>${PG.esc(r.c)}</em></b>
              <i>${PG.esc(detail)}</i>
            </span>
            <span class="r-score">${r.s.toLocaleString()}</span>
          </div>`;
        }).join('');
      }

      card.innerHTML = `
        <div class="rank-head">
          <h3>🏆 최고 기록</h3>
          <span class="rh-chip${shared ? ' is-share' : ''}">${shared ? '반 친구들과 공유' : '이 컴퓨터에 저장'}</span>
        </div>
        <div class="rank-tabs">${tabs.map(t =>
          `<button class="rt${this.tab === t.id ? ' is-on' : ''}" data-tab="${t.id}">${PG.esc(t.label)}</button>`
        ).join('')}</div>
        <div class="rank-list">${listHtml}</div>
        <div class="rank-foot">
          <button id="rank-share">공유 설정</button>
          <button id="rank-reset">기록 지우기</button>
          <span class="rf-note">${PG.esc(myBest)}</span>
        </div>`;

      PG.$$('.rt', card).forEach(b => b.addEventListener('click', () => {
        this.tab = b.dataset.tab;
        PG.sfx.click();
        this.render();
      }));
      const sh = PG.$('#rank-share', card);
      if (sh) sh.addEventListener('click', () => PG.openShare());
      const rs = PG.$('#rank-reset', card);
      if (rs) rs.addEventListener('click', () => {
        PG.modal(`
          <h3>기록 지우기</h3>
          <p>이 컴퓨터에 저장된 <b>틈새 놀이터 최고 기록</b>을 모두 지울까요?<br>지운 기록은 되돌릴 수 없어요.</p>
          <div class="modal-actions">
            <button class="btn btn-sm" data-close>그대로 두기</button>
            <button class="btn btn-sm btn-primary" id="rs-ok">기록 지우기</button>
          </div>
        `, (c2, close) => {
          PG.$('#rs-ok', c2).addEventListener('click', () => {
            PG.store.del(KEYS.scores);
            close(); this.render(); PG.toast('기록을 지웠어요.');
          });
        });
      });

      if (shared) this.mergeRemote();
    },

    async mergeRemote() {
      if (this.remoteRows) return;
      const rows = await this.pull();
      if (!rows) return;
      this.remoteRows = rows;
      const existing = this.all();
      const known = new Set(existing.map(r => [r.g, r.n, r.c, r.s].join('|')));
      const fresh = rows.filter(r => !known.has([r.g, r.n, r.c, r.s].join('|')));
      if (fresh.length) {
        this.save(existing.concat(fresh));
        this.render();
      }
    }
  };

  /* ── 반 공유 설정 안내 ─────────────────────────────────── */
  PG.openShare = function () {
    const on = PG.rank.remoteOn();
    PG.modal(`
      <h3>반 친구들과 기록 공유</h3>
      <p>기본은 <b>이 컴퓨터에만 저장</b>돼요. 선생님이 아래 표를 Supabase에 한 번 만들어 두면,
        같은 교실의 여러 PC가 <b>같은 최고 기록</b>을 함께 볼 수 있어요.</p>
      <div class="modal-code">create table if not exists public.playground_scores (
  id bigint generated by default as identity primary key,
  game text not null,
  name text not null,
  class text not null,
  score int not null,
  detail text,
  created_at timestamptz default now()
);
alter table public.playground_scores enable row level security;
create policy "누구나 읽기" on public.playground_scores for select using (true);
create policy "누구나 쓰기" on public.playground_scores for insert with check (true);</div>
      <p class="modal-note">표를 만든 뒤 아래 버튼을 켜면 됩니다. 표가 없으면 자동으로 이 컴퓨터 저장 모드로 돌아가요.</p>
      <div class="modal-actions">
        <button class="btn btn-sm" data-close>닫기</button>
        <button class="btn btn-sm ${on ? 'btn-mint' : 'btn-lav'}" id="sh-ok">${on ? '공유 끄기' : '공유 켜기'}</button>
      </div>
    `, (card, close) => {
      PG.$('#sh-ok', card).addEventListener('click', () => {
        const next = !PG.rank.remoteOn();
        PG.store.set(KEYS.shared, next);
        PG.rank.remoteFailed = false;
        PG.rank.remoteRows = null;
        if (next) PG.rank.mergeRemote();
        close(); PG.rank.render();
        PG.toast(next ? '공유를 켰어요. 표가 있으면 함께 보여요.' : '이 컴퓨터에만 저장해요.');
      });
    });
  };

  /* ══════════════════════════════════════════════════════════
     수업 마무리 타이머 (5분 / 10분)
     ══════════════════════════════════════════════════════════ */
  PG.timer = {
    dur: 300,
    remainMs: 300000,
    endAt: 0,
    running: false,
    iv: null,
    fired: false,

    init() {
      const self = this;
      const seg = PG.$$('.t-pick');
      seg.forEach(b => b.addEventListener('click', () => {
        PG.sfx.click();
        self.setMin(parseInt(b.dataset.min, 10));
      }));
      PG.$('#t-start').addEventListener('click', () => { PG.sfx.click(); self.toggle(); });
      PG.$('#t-reset').addEventListener('click', () => { PG.sfx.click(); self.reset(); });
      PG.$('#t-sound').addEventListener('click', () => {
        PG.sfx.setOn(!PG.sfx.on);
        if (PG.sfx.on) PG.sfx.pop();
      });
      PG.sfx.setOn(PG.sfx.on);
      this.paint();
    },
    setMin(m) {
      this.stop();
      this.dur = m * 60 * 1000;
      this.remainMs = this.dur;
      this.fired = false;
      PG.$$('.t-pick').forEach(b => b.classList.toggle('is-on', +b.dataset.min === m));
      this.hideBanner();
      this.paint();
    },
    toggle() { this.running ? this.pause() : this.start(); },
    start() {
      if (this.running) return;
      if (this.remainMs <= 0) { this.remainMs = this.dur; this.fired = false; this.hideBanner(); }
      this.endAt = Date.now() + this.remainMs;
      this.running = true;
      this.hideBanner();
      this.paint();
      const self = this;
      clearInterval(this.iv);
      this.iv = setInterval(() => self.tick(), 200);
    },
    pause() {
      if (!this.running) return;
      this.remainMs = Math.max(0, this.endAt - Date.now());
      this.running = false;
      clearInterval(this.iv);
      this.paint();
    },
    stop() {
      clearInterval(this.iv);
      this.iv = null;
      this.running = false;
    },
    reset() {
      this.stop();
      this.remainMs = this.dur;
      this.fired = false;
      this.hideBanner();
      this.paint();
    },
    tick() {
      if (!this.running) return;
      this.remainMs = Math.max(0, this.endAt - Date.now());
      this.paint();
      if (this.remainMs <= 0 && !this.fired) {
        this.fired = true;
        this.stop();
        this.onEnd();
      }
    },
    onEnd() {
      this.paint();
      this.showBanner();
      PG.sfx.chime();
      // 수업 마무리 알림은 부드럽게 두 번 더
      const self = this;
      setTimeout(() => { if (!self.running) PG.sfx.chime(); }, 2400);
    },
    paint() {
      const el = document.getElementById('t-clock');
      const btn = document.getElementById('t-start');
      if (!el) return;
      const total = Math.ceil(this.remainMs / 1000);
      const m = Math.floor(total / 60);
      const s = total % 60;
      el.textContent = PG.pad(m) + ':' + PG.pad(s);
      el.classList.toggle('is-warn', this.running && this.remainMs <= 30000);
      el.setAttribute('aria-label', '남은 시간 ' + m + '분 ' + s + '초');
      if (btn) {
        btn.textContent = this.running ? '일시정지' : (this.remainMs > 0 && this.remainMs < this.dur ? '계속' : '시작');
        btn.classList.toggle('is-run', this.running);
      }
    },
    showBanner() {
      const el = document.getElementById('timeup');
      if (!el) return;
      el.hidden = false;
      requestAnimationFrame(() => el.classList.add('show'));
    },
    hideBanner() {
      const el = document.getElementById('timeup');
      if (!el) return;
      el.classList.remove('show');
      setTimeout(() => { if (!el.classList.contains('show')) el.hidden = true; }, 360);
    }
  };

  /* ── 자주 쓰는 게임 머리글 ─────────────────────────────── */
  PG.gameHead = function (id, extraChips) {
    const meta = GAME_META[id] || { name: id, ico: '🎮' };
    return `<div class="gv-head">
      <button class="gv-back" data-back>← 놀이터</button>
      <span class="gv-title">${meta.ico} ${PG.esc(meta.name)}</span>
      <div class="gv-chips">${extraChips || ''}</div>
    </div>`;
  };
  PG.bindBack = function (root) {
    PG.$$('[data-back]', root).forEach(b => b.addEventListener('click', () => { PG.sfx.click(); PG.go('hub'); }));
  };
  PG.fmtTime = function (ms) {
    const t = Math.max(0, ms);
    const m = Math.floor(t / 60000);
    const s = Math.floor((t % 60000) / 1000);
    return PG.pad(m) + ':' + PG.pad(s);
  };
  PG.fmtSec = function (sec) {
    const s = Math.max(0, sec);
    return s >= 60 ? Math.floor(s / 60) + '분 ' + (s % 60).toFixed(0) + '초' : s.toFixed(1) + '초';
  };
})();
