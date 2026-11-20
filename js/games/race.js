/* ══════════════════════════════════════════════════════════════
   games/race.js — 실시간 타자 대결 (스피드 게임)
   선생님이 문장 출제 → 동시 입력 → 1등이 교실 대형 스크린에 표시
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CC = window.CC;
  CC.games = CC.games || {};

  const SENTENCES = [
    '손가락이 빨라졌어요!',
    '오늘도 즐겁게 코딩해요.',
    '컴퓨터 교실에 모여 봐요!',
    '파이썬은 정말 재미있어요.',
    '키보드로 세상을 그려요!',
    '한 글자도 틀리지 않고 쳐 봐요.',
    '우리 반 최고 타자는 누구일까?',
    '거북이야 앞으로 걸어가!',
    '별이처럼 반짝이는 아이디어!',
    '타자 대결 시작! 준비됐나요?'
  ];

  const R = (CC.race = {
    mode: 'idle',
    text: '',
    startLocal: 0,
    winner: null,
    ranks: [],
    root: null
  });

  let botTimers = [];

  function clearBots() { botTimers.forEach(t => clearTimeout(t)); botTimers = []; }

  function emit(payload, local) {
    CC.rt.send('race', payload);
    if (local) R.handle(payload, true);
  }

  /* ── 시작 ─────────────────────────────────────────────── */
  R.start = function (text, opts) {
    const o = opts || {};
    if (!text) text = CC.pick(SENTENCES);
    const payload = {
      kind: 'start',
      text,
      by: o.by || (CC.me ? CC.me.name : '선생님'),
      at: Date.now()
    };
    emit(payload, !o.remote);
    if (!o.remote) {
      CC.sfx.pop();
      CC.ui.toast('⚡ 타자 대결 시작! 문장을 정확히 입력하세요');
    }
  };

  R.handle = function (payload, fromMe) {
    if (!payload) return;
    if (payload.kind === 'start') {
      R.mode = 'running';
      R.text = payload.text;
      R.startLocal = Date.now();
      R.winner = null;
      R.ranks = [];
      clearBots();
      if (CC.rt.isDemo() || CC.rt.mode() === 'local') scheduleBots(R.text);
      R.paint();
      if (R.root && !fromMe) CC.sfx.pop();
      return;
    }
    if (payload.kind === 'finish') {
      const entry = {
        name: payload.name, num: payload.num,
        ms: payload.ms, cpm: payload.cpm || 0, me: payload.id === CC.rt.id()
      };
      if (R.ranks.some(r => r.name === entry.name && r.num === entry.num)) return;
      R.ranks.push(entry);
      R.ranks.sort((a, b) => a.ms - b.ms);
      R.winner = R.ranks[0];
      if (R.mode === 'idle') R.mode = 'running';
      R.paint();
      if (!fromMe) CC.sfx.tick();
      return;
    }
    if (payload.kind === 'reset') {
      R.mode = 'idle'; R.text = ''; R.winner = null; R.ranks = [];
      clearBots();
      R.paint();
    }
  };

  function scheduleBots(text) {
    const peers = CC.rt.peersList().filter(p => !p.teacher);
    const pool = peers.slice();
    const n = Math.min(4, pool.length);
    for (let i = 0; i < n; i++) {
      const p = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      if (!p) continue;
      const perChar = CC.rand(170, 320);
      const ms = Math.round(text.length * perChar + CC.rand(140, 900));
      const t = setTimeout(() => {
        R.handle({
          kind: 'finish', name: p.name, num: p.num, ms,
          cpm: Math.round((text.length / ms) * 60000), id: p.id
        }, false);
      }, ms);
      botTimers.push(t);
    }
    /* 아주 가끔 봇이 늦게 도착 */
    if (n === 0) {
      const ms = Math.round(text.length * 260 + 900);
      botTimers.push(setTimeout(() => {
        R.handle({ kind: 'finish', name: '연습 봇', num: 0, ms, cpm: Math.round((text.length / ms) * 60000), id: 'bot' }, false);
      }, ms));
    }
  }

  /* ── 내 기록 ──────────────────────────────────────────── */
  R.myFinish = function () {
    if (R.mode !== 'running' || !R.text) return;
    if (R.ranks.some(r => r.me)) return;
    const ms = Date.now() - R.startLocal;
    const cpm = Math.round((R.text.length / ms) * 60000);
    const payload = {
      kind: 'finish', id: CC.rt.id(),
      name: CC.me ? CC.me.name : '나',
      num: CC.me ? CC.me.num : 0,
      ms, cpm
    };
    if (cpm > (CC.best.race || 0)) CC.saveBest({ race: cpm });
    emit(payload, true);
    CC.sfx.cheer();
    const myRank = R.ranks.findIndex(r => r.me) + 1;
    CC.ui.toast(myRank === 1 ? '🏆 1등! 대결에서 이겼어요!' : `${myRank}등! ${(ms / 1000).toFixed(2)}초`);
  };

  /* ── 화면 갱신 ────────────────────────────────────────── */
  R.paint = function () {
    const root = R.root;
    if (root) {
      const status = root.querySelector('#rc-status');
      const sent = root.querySelector('#rc-sentence');
      const inputWrap = root.querySelector('#rc-input-wrap');
      const list = root.querySelector('#rc-list');
      if (!status) return;

      if (R.mode === 'idle') {
        status.innerHTML = `<div class="race-wait">⌨️ 아직 대결이 시작되지 않았어요.<br><b>선생님이 문장을 출제</b>하면 모두 함께 시작해요!</div>`;
        sent.textContent = '';
        inputWrap.innerHTML = '';
        list.innerHTML = '';
      } else {
        const meEntry = R.ranks.find(r => r.me);
        if (R.mode === 'running' && !meEntry) {
          status.innerHTML = `<div class="race-win"><span class="rw-ico">⚡</span><div><b>대결 중!</b><br><span>가장 먼저 정확히 입력하면 1등이에요</span></div></div>`;
        } else if (R.winner) {
          status.innerHTML = `<div class="race-win"><span class="rw-ico">🏆</span><div>
            <b>1등 ${CC.esc(R.winner.name)}</b> · ${(R.winner.ms / 1000).toFixed(2)}초
            <br><span>${R.winner.cpm}타/분 · 교실 대형 스크린에 표시돼요</span></div></div>`;
        }
        sent.textContent = R.text;
        /* 입력창은 최초 1회만 생성 */
        if (!inputWrap.querySelector('#rc-input')) {
          inputWrap.innerHTML = `<input class="race-input" id="rc-input" placeholder="여기를 누르고 문장을 따라 치세요!" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">`;
          bindInput(root);
        }
        bindInput(root);
      }

      /* 순위표 */
      if (R.ranks.length) {
        list.innerHTML = R.ranks.slice(0, 8).map((r, i) => `
          <div class="rank p${i + 1} ${r.me ? 'me' : ''}">
            <span class="pos">${i + 1}</span>
            <span class="nm">${CC.esc(r.name)}${r.me ? ' (나)' : ''}</span>
            <span class="tm">${(r.ms / 1000).toFixed(2)}초</span>
          </div>`).join('');
      } else if (R.mode !== 'idle') {
        list.innerHTML = `<div class="race-wait" style="padding:11px">아직 결승선을 통과한 사람이 없어요. 첫 번째 주자가 되어 보세요!</div>`;
      }
    }
    /* 교실 스크린 */
    if (CC.app && CC.app.syncScreen) CC.app.syncScreen();
  };

  function bindInput(root) {
    const input = root.querySelector('#rc-input');
    if (!input || input.dataset.bound === '1') {
      if (input && R.mode === 'running') input.focus();
      return;
    }
    input.dataset.bound = '1';
    const sentEl = root.querySelector('#rc-sentence');

    input.addEventListener('input', () => {
      if (R.mode !== 'running') return;
      let v = input.value;
      if (R.text.startsWith(v)) {
        /* 올바른 진행 */
      }
      /* 글자별 색칠 */
      if (sentEl) {
        sentEl.innerHTML = R.text.split('').map((ch, i) => {
          if (i >= v.length) return CC.esc(ch);
          return v[i] === ch ? `<span class="ok">${CC.esc(ch)}</span>` : `<span class="bad">${CC.esc(ch)}</span>`;
        }).join('');
      }
      if (v === R.text) {
        input.disabled = true;
        input.value = '';
        setTimeout(() => R.myFinish(), 60);
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && R.mode === 'running') {
        e.preventDefault();
        if (input.value === R.text) R.myFinish();
      }
    });
    setTimeout(() => { try { input.focus(); } catch (e) {} }, 40);
  }

  /* ── 모달 ─────────────────────────────────────────────── */
  CC.games.race = {
    open() {
      const isTeacher = CC.me && CC.me.teacher;
      const demo = CC.rt.isDemo() || CC.rt.mode() === 'local';
      const html = `
        <div class="race-wrap">
          <div id="rc-status"></div>
          <div class="race-sentence" id="rc-sentence"></div>
          <div id="rc-input-wrap"></div>
          <div id="rc-list" class="race-list"></div>

          <div class="race-set" id="rc-set">
            ${(isTeacher || demo) ? `
              <div class="row-inline" style="gap:6px;flex-wrap:wrap">
                <input id="rc-text" placeholder="출제할 문장을 입력하세요 (비우면 랜덤)" maxlength="60">
                <button class="btn btn-sm btn-yellow" id="rc-start">⚡ 출제하고 시작</button>
                <button class="btn btn-sm btn-sky" id="rc-random">🎲 랜덤 시작</button>
              </div>
              <p style="margin:0;font-size:10.5px;color:#8A7566">${isTeacher
                ? '선생님이 시작하면 우리 반 전체 화면에 같은 문장이 뜨고, 교실 대형 스크린에 1등이 표시돼요.'
                : '데모 모드에서는 내가 시작해 봇 친구 4명과 대결할 수 있어요. (Supabase 연결 시 선생님이 출제)'}</p>
            ` : `<p style="margin:0;font-size:11px;color:#8A7566">선생님이 문장을 출제하면 자동으로 시작돼요. 조금만 기다려 주세요!</p>`}
          </div>
        </div>`;

      CC.ui.openModal({
        icon: '⚡', title: '타자 대결', sub: '실시간 스피드 대결 — 가장 먼저 정확히!',
        size: 'md', body: html,
        onMount(root) {
          R.root = root;
          const t = root.querySelector('#rc-text');
          const startBtn = root.querySelector('#rc-start');
          const randBtn = root.querySelector('#rc-random');
          if (startBtn) startBtn.onclick = () => {
            CC.sfx.click();
            const val = (t.value || '').trim();
            R.start(val || CC.pick(SENTENCES));
          };
          if (randBtn) randBtn.onclick = () => {
            CC.sfx.click();
            if (t) t.value = CC.pick(SENTENCES);
            R.start((t && t.value) || CC.pick(SENTENCES));
          };
          if (R.mode === 'running' && !CC.rt.isDemo() && !isTeacher && R.winner == null) {
            /* 진행 중이면 바로 입력 가능 */
          }
          setTimeout(() => R.paint(), 30);
        },
        onClose() { R.root = null; }
      });
    },
    start: R.start,
    handle: R.handle
  };
})();
