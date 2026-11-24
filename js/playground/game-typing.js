/* ══════════════════════════════════════════════════════════════
   playground/game-typing.js — ⌨️ 재미있는 타자 놀이 (산성비 스타일)
   · 위에서 떨어지는 한국어 낱말을 입력창에 쳐서 없애요
   · 하트 3개 · 레벨업(8개마다) · 점수 · 분당 타수(타/분)
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const PG = window.PG;

  const POOL = {
    1: ['나무', '사과', '구름', '하늘', '바다', '토끼', '연필', '가방', '우유', '웃음', '노래', '그림',
      '친구', '학교', '교실', '책상', '의자', '창문', '꽃잎', '딸기', '수박', '김치', '만두', '국수',
      '라면', '피자', '치킨', '바나나', '고양이', '강아지', '다람쥐', '자전거'],
    2: ['타자연습', '즐거운날', '운동장', '도서관', '알림장', '숙제하기', '손을들기', '함께놀기',
      '노래부르기', '그림그리기', '줄넘기', '발표하기', '친구사랑', '웃음꽃', '행복한시간',
      '신나는하루', '박수치기', '정리정돈', '재미있는놀이', '우리반최고'],
    3: ['키보드', '마우스', '모니터', '프린터', '프로그래밍', '인공지능', '인터넷', '스마트폰',
      '이어폰', '폴더', '파일', '저장하기', '검색하기', '로봇', '코딩', '소프트웨어',
      '하드웨어', '데이터', '알고리즘', '화면보호기', '클릭하기', '컴퓨터']
  };
  const COLORS = ['#FFB3C7', '#8FD3FF', '#9BDD8A', '#FFD166', '#BDA9FF', '#FFB38A', '#7FE3C0'];
  const FONT = "700 27px Galmuri11, 'Noto Sans KR', sans-serif";

  const G = PG.games.typing = {
    id: 'typing',
    st: null,
    raf: 0,
    ro: null,

    mount(root) {
      const self = this;
      this.st = {
        playing: false, words: [], hearts: 3, level: 1, score: 0, cleared: 0,
        chars: 0, startedAt: 0, spawnAt: 0, cpm: 0, lastT: 0, flash: 0, best: PG.rank.personalBest('typing')
      };
      root.innerHTML = PG.gameHead('typing', `
        <span class="chip is-hot">⭐ <b id="tp-score">0</b></span>
        <span class="chip is-mint">Lv <b id="tp-level">1</b></span>
        <span class="chip">⌨️ <b id="tp-cpm">0</b> 타/분</span>
        <span class="chip is-sky"><span class="tp-hearts" id="tp-hearts">♥♥♥</span></span>
      `) + `
      <div class="tp-wrap">
        <div class="tp-stage stage-box" id="tp-stage">
          <canvas class="tp-canvas" id="tp-canvas"></canvas>
          <div class="tp-line"></div>
          <div class="ovl" id="tp-ovl"></div>
        </div>
        <div class="tp-inputrow">
          <input class="tp-input" id="tp-input" type="text" maxlength="14"
            placeholder="떨어지는 낱말을 입력하고 Enter!" autocomplete="off" spellcheck="false" disabled>
          <button class="tp-go" id="tp-go" disabled>치기!</button>
        </div>
      </div>`;

      PG.bindBack(root);
      this.canvas = PG.$('#tp-canvas', root);
      this.ctx = this.canvas.getContext('2d');
      this.stage = PG.$('#tp-stage', root);
      this.input = PG.$('#tp-input', root);

      const check = () => self.check();
      this.input.addEventListener('input', check);
      this.input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); self.check(true); }
      });
      PG.$('#tp-go', root).addEventListener('click', () => self.check(true));

      this.resize();
      const onResize = () => self.resize();
      window.addEventListener('resize', onResize);
      if (window.ResizeObserver) {
        this.ro = new ResizeObserver(onResize);
        this.ro.observe(this.stage);
      }
      this._onResize = onResize;

      this.showStart();
    },

    unmount() {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      if (this._onResize) window.removeEventListener('resize', this._onResize);
      if (this.ro) { try { this.ro.disconnect(); } catch (e) {} this.ro = null; }
      if (this.st) this.st.playing = false;
    },

    resize() {
      if (!this.canvas || !this.stage) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = this.stage.getBoundingClientRect();
      this.W = Math.max(280, r.width);
      this.H = Math.max(220, r.height);
      this.canvas.width = Math.round(this.W * dpr);
      this.canvas.height = Math.round(this.H * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.draw();
    },

    showStart() {
      const ovl = PG.$('#tp-ovl');
      ovl.hidden = false;
      ovl.innerHTML = `<div class="ovl-card">
        <span class="oc-emoji">⌨️</span>
        <h3>재미있는 타자 놀이</h3>
        <p>위에서 떨어지는 낱말을 입력창에 치면 <b>펑!</b> 하고 사라져요.</p>
        <div class="oc-keys">· 하트는 <b>3개</b> — 낱말이 바닥에 닿으면 하나 줄어요<br>· <b>8개</b>를 없애면 레벨업! 점점 빨라져요<br>· 컴퓨터 용어 낱말도 나와요</div>
        <div class="ovl-actions"><button class="btn btn-sky" id="tp-start">시작하기 →</button></div>
      </div>`;
      PG.$('#tp-start', ovl).addEventListener('click', () => this.start());
      this.paint();
    },

    start() {
      const st = this.st;
      st.playing = true;
      st.words = [];
      st.hearts = 3; st.level = 1; st.score = 0; st.cleared = 0; st.chars = 0;
      st.startedAt = performance.now();
      st.spawnAt = performance.now() + 500;
      st.lastT = performance.now();
      st.flash = 0;
      PG.$('#tp-ovl').hidden = true;
      this.input.disabled = false;
      PG.$('#tp-go').disabled = false;
      this.input.value = '';
      this.input.focus();
      this.paint();
      PG.sfx.pop();
      const self = this;
      cancelAnimationFrame(this.raf);
      const loop = t => {
        if (!st.playing) return;
        self.step(t);
        self.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
      this.spawn();
    },

    pool() {
      const lv = this.st.level;
      if (lv <= 2) return POOL[1];
      if (lv <= 4) return POOL[1].concat(POOL[2]);
      if (lv <= 6) return POOL[2].concat(POOL[3]);
      return POOL[3].concat(POOL[2]);
    },

    spawn() {
      const st = this.st;
      if (!st.playing) return;
      const pool = this.pool();
      let text = PG.pick(pool);
      let tries = 0;
      while (st.words.some(w => w.text === text) && tries++ < 12) text = PG.pick(pool);
      this.ctx.font = FONT;
      const tw = this.ctx.measureText(text).width;
      const w = tw + 34;
      let x = 14 + Math.random() * Math.max(10, this.W - w - 28);
      // 위쪽에 이미 있는 낱말과 겹치지 않게
      for (let i = 0; i < 10; i++) {
        const clash = st.words.some(o => o.y < 70 && Math.abs(o.x - x) < (o.w + w) / 2 + 6);
        if (!clash) break;
        x = 14 + Math.random() * Math.max(10, this.W - w - 28);
      }
      st.words.push({
        text, x, y: -26, w, h: 46,
        vy: 58 + st.level * 11 + Math.random() * 12,
        color: COLORS[(st.words.length + st.level) % COLORS.length],
        born: performance.now()
      });
      const gap = Math.max(500, 1050 - st.level * 80);
      st.spawnAt = performance.now() + gap * (0.75 + Math.random() * 0.5);
    },

    step(t) {
      const st = this.st;
      const dt = Math.min(0.05, (t - st.lastT) / 1000 || 0);
      st.lastT = t;
      const bottom = this.H - 46;
      for (let i = st.words.length - 1; i >= 0; i--) {
        const w = st.words[i];
        w.y += w.vy * dt;
        if (w.y >= bottom) {
          st.words.splice(i, 1);
          this.loseHeart();
        }
      }
      if (t >= st.spawnAt) this.spawn();
      if (st.playing) this.draw();
    },

    draw() {
      const ctx = this.ctx;
      if (!ctx) return;
      ctx.clearRect(0, 0, this.W, this.H);
      const st = this.st;
      const prefix = (this.input && this.input.value || '').replace(/\s+/g, '');
      // 바닥 위험선
      ctx.save();
      ctx.strokeStyle = 'rgba(255,140,170,.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(0, this.H - 46);
      ctx.lineTo(this.W, this.H - 46);
      ctx.stroke();
      ctx.restore();

      st.words.forEach(w => {
        const x = w.x, y = w.y;
        const match = prefix && w.text.startsWith(prefix);
        ctx.save();
        // 그림자
        ctx.fillStyle = 'rgba(126,104,86,.10)';
        this.roundRect(x + 2, y + 4, w.w, w.h, 13);
        ctx.fill();
        // 말풍선
        ctx.fillStyle = match ? '#FFFFFF' : '#FFFFFF';
        this.roundRect(x, y, w.w, w.h, 13);
        ctx.fill();
        ctx.lineWidth = match ? 3.5 : 2.2;
        ctx.strokeStyle = match ? '#FF7FA6' : w.color;
        this.roundRect(x, y, w.w, w.h, 13);
        ctx.stroke();
        // 꼬리
        ctx.beginPath();
        ctx.moveTo(x + w.w / 2 - 6, y + w.h - 1);
        ctx.lineTo(x + w.w / 2, y + w.h + 7);
        ctx.lineTo(x + w.w / 2 + 6, y + w.h - 1);
        ctx.closePath();
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = match ? '#FF7FA6' : w.color;
        ctx.lineWidth = match ? 3.5 : 2.2;
        ctx.stroke();
        // 글자
        ctx.font = FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#3E3355';
        ctx.fillText(w.text, x + w.w / 2, y + w.h / 2 + 1);
        ctx.restore();
      });

      // 바닥에 닿을 때 붉은 번짐
      if (st.flash > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,120,120,' + (st.flash * 0.35) + ')';
        ctx.fillRect(0, 0, this.W, this.H);
        ctx.restore();
      }
    },

    roundRect(x, y, w, h, r) {
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },

    check(force) {
      const st = this.st;
      if (!st.playing) return;
      const v = (this.input.value || '').replace(/\s+/g, '');
      if (!v) return;
      // 아래쪽(먼저 떨어지는) 낱말부터
      const hits = st.words.filter(w => w.text === v).sort((a, b) => b.y - a.y);
      const hit = hits[0];
      if (hit) {
        st.words.splice(st.words.indexOf(hit), 1);
        st.cleared++;
        st.chars += hit.text.length;
        st.score += hit.text.length * 10 + st.level * 5;
        this.input.value = '';
        this.popAt(hit);
        PG.sfx.pop();
        if (st.cleared % 8 === 0) this.levelUp();
        this.updateCpm();
        this.paint();
        this.draw();
      } else if (force) {
        PG.sfx.wrong();
        this.input.select();
      }
    },

    popAt(w) {
      const ctx = this.ctx;
      const cx = w.x + w.w / 2, cy = w.y + w.h / 2;
      const t0 = performance.now();
      const self = this;
      const anim = () => {
        const k = (performance.now() - t0) / 320;
        if (k >= 1) { self.draw(); return; }
        self.draw();
        ctx.save();
        ctx.globalAlpha = 1 - k;
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4;
          const d = 8 + k * 26;
          ctx.beginPath();
          ctx.fillStyle = w.color;
          ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 3.4 * (1 - k), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        requestAnimationFrame(anim);
      };
      anim();
    },

    levelUp() {
      const st = this.st;
      st.level++;
      PG.sfx.level();
      PG.toast('레벨 ' + st.level + '! 낱말이 빨라져요 🚀');
      this.paint();
    },

    loseHeart() {
      const st = this.st;
      st.hearts--;
      st.flash = 1;
      PG.sfx.heart();
      this.paint();
      const t0 = performance.now();
      const self = this;
      const fade = () => {
        const k = (performance.now() - t0) / 260;
        st.flash = Math.max(0, 1 - k);
        if (self.st.playing) self.draw();
        if (k < 1) requestAnimationFrame(fade);
      };
      fade();
      if (st.hearts <= 0) this.finish();
    },

    updateCpm() {
      const st = this.st;
      const min = Math.max(0.05, (performance.now() - st.startedAt) / 60000);
      st.cpm = Math.round(st.chars / min);
    },

    paint() {
      const st = this.st;
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set('tp-score', st.score.toLocaleString());
      set('tp-level', st.level);
      set('tp-cpm', st.cpm);
      const h = document.getElementById('tp-hearts');
      if (h) {
        h.innerHTML = [0, 1, 2].map(i =>
          `<span class="${i < st.hearts ? '' : 'lost'}">♥</span>`).join('');
      }
    },

    finish() {
      const st = this.st;
      if (!st.playing) return;
      st.playing = false;
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.updateCpm();
      const total = st.score + st.level * 20;
      const detail = st.cpm + '타/분 · Lv' + st.level;
      const prev = PG.rank.personalBest('typing');
      PG.rank.add({ game: 'typing', score: total, detail });
      const best = PG.rank.personalBest('typing');
      PG.sfx.win();
      this.input.disabled = true;
      PG.$('#tp-go').disabled = true;
      this.paint();
      const ovl = PG.$('#tp-ovl');
      ovl.hidden = false;
      ovl.innerHTML = `<div class="ovl-card">
        <span class="oc-emoji">${st.score >= 800 ? '🏆' : '⌨️'}</span>
        <h3>${st.cleared}개 낱말을 쳤어요!</h3>
        <p>${st.cpm >= 60 ? '손이 아주 빨라요! 타자 박사네요.' : '한 판 더 하면 손이 더 빨라져요.'}</p>
        <div class="oc-score">
          <span class="ocs"><b>${total.toLocaleString()}</b><i>점수</i></span>
          <span class="ocs"><b>${st.cpm}</b><i>타/분</i></span>
          <span class="ocs"><b>Lv${st.level}</b><i>레벨</i></span>
        </div>
        <div class="oc-best">🏆 내 최고 기록 ${best.toLocaleString()}점${total > prev ? ' · 신기록!' : ''}</div>
        <div class="ovl-actions">
          <button class="btn btn-sky" id="tp-again">한 판 더</button>
          <button class="btn" id="tp-home">놀이터로</button>
        </div>
      </div>`;
      PG.$('#tp-again', ovl).addEventListener('click', () => this.start());
      PG.$('#tp-home', ovl).addEventListener('click', () => PG.go('hub'));
    }
  };
})();
