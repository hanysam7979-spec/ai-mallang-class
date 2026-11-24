/* ══════════════════════════════════════════════════════════════
   playground/game-spot.js — 🔍 틀린 그림 찾기
   · 교실 풍경 / 우주 탐험 / 바다 속 3장면 × 다른 곳 5개
   · 클릭하면 동그라미 표시, 틀리면 살짝 흔들림, 힌트 2회
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const PG = window.PG;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const MAX_STAGE = 3;
  const HINTS_PER_STAGE = 2;

  const G = PG.games.spot = {
    id: 'spot',
    st: null,
    iv: 0,

    mount(root) {
      this.st = {
        stage: 0, found: [], totalScore: 0, wrong: 0,
        hints: HINTS_PER_STAGE, startedAt: 0, elapsed: 0, playing: false, totalFound: 0
      };
      root.innerHTML = PG.gameHead('spot', `
        <span class="chip">그림 <b id="sd-stage">1/3</b></span>
        <span class="chip is-hot">남은 <b id="sd-left">5</b>곳</span>
        <span class="chip is-mint">⭐ <b id="sd-score">0</b></span>
        <span class="chip is-sky">⏱ <b id="sd-time">0:00</b></span>
      `) + `
      <div class="sd-wrap">
        <div class="sd-stage stage-box" id="sd-stage">
          <div class="sd-pair" id="sd-pair"></div>
          <div class="ovl" id="sd-ovl"></div>
        </div>
        <div class="sd-foot">
          <div class="sd-left" id="sd-dots"></div>
          <span class="sd-msg" id="sd-msg">서로 다른 곳 5곳을 찾아 클릭!</span>
          <div class="sd-actions">
            <button class="btn btn-sm" id="sd-hint">💡 힌트 <b id="sd-hint-n">2</b></button>
            <button class="btn btn-sm" id="sd-retry">↺ 이 그림 다시</button>
          </div>
        </div>
      </div>`;

      PG.bindBack(root);
      this.pair = PG.$('#sd-pair', root);
      PG.$('#sd-hint', root).addEventListener('click', () => this.hint());
      PG.$('#sd-retry', root).addEventListener('click', () => this.loadStage(this.st.stage, true));
      this.showStart();
      this.updateChips();
    },

    unmount() {
      clearInterval(this.iv);
      this.iv = 0;
      if (this.st) this.st.playing = false;
    },

    showStart() {
      const ovl = PG.$('#sd-ovl');
      ovl.hidden = false;
      ovl.innerHTML = `<div class="ovl-card">
        <span class="oc-emoji">🔍</span>
        <h3>틀린 그림 찾기</h3>
        <p>두 그림에서 <b>서로 다른 곳 5곳</b>을 찾아 클릭해요. 그림은 모두 3장!</p>
        <div class="oc-keys">· 다르다고 생각하는 곳을 콕!<br>· 맞히면 빨간 동그라미가 그려져요<br>· 힌트는 그림마다 2번까지</div>
        <div class="ovl-actions"><button class="btn btn-lav" id="sd-start">시작하기 →</button></div>
      </div>`;
      PG.$('#sd-start', ovl).addEventListener('click', () => {
        this.st.playing = true;
        PG.$('#sd-ovl').hidden = true;
        this.loadStage(0);
      });
      PG.$('#sd-dots').innerHTML = '';
      this.pair.innerHTML = `<div class="sd-panel" style="grid-column:1/-1;aspect-ratio:460/340;display:grid;place-items:center;color:#C8BCD6;font-weight:800;font-size:13px">시작하기를 누르면 그림이 나타나요</div>`;
    },

    loadStage(idx, isRetry) {
      const st = this.st;
      const scene = PG.art.spotScenes[idx];
      if (!scene) { this.finish(); return; }
      if (!isRetry) { st.hints = HINTS_PER_STAGE; st.wrong = 0; }
      st.stage = idx;
      st.found = [];
      st.startedAt = Date.now();
      st.elapsed = 0;
      clearInterval(this.iv);
      const self = this;
      this.iv = setInterval(() => {
        if (!self.st.playing) return;
        self.st.elapsed = (Date.now() - self.st.startedAt) / 1000;
        self.updateChips();
      }, 500);

      const build = side => {
        const diffSvg = scene.diffs.map(d => (side === 'l' ? d.left : d.right)).join('');
        return PG.art.svg(scene.w, scene.h,
          scene.base + diffSvg + '<g class="marks"></g>', scene.defs);
      };
      this.pair.innerHTML = `
        <div class="sd-panel" data-side="l">${build('l')}<span class="sd-tag">왼쪽 그림</span></div>
        <div class="sd-panel" data-side="r">${build('r')}<span class="sd-tag">오른쪽 그림</span></div>`;
      this.panels = PG.$$('.sd-panel', this.pair);
      this.panels.forEach(p => {
        p.addEventListener('click', e => self.onClick(p, e));
      });
      PG.$('#sd-dots').innerHTML = scene.diffs.map(() => '<span class="sdl-dot"></span>').join('');
      PG.$('#sd-msg').textContent = '서로 다른 곳 ' + scene.diffs.length + '곳을 찾아 클릭!';
      PG.$('#sd-score').parentElement.style.display = '';
      this.updateChips();
    },

    onClick(panel, e) {
      const st = this.st;
      if (!st.playing) return;
      const scene = PG.art.spotScenes[st.stage];
      const svg = panel.querySelector('svg');
      if (!svg) return;
      const pt = this.toSvg(svg, e);
      let hit = null;
      scene.diffs.forEach((d, i) => {
        if (st.found.indexOf(i) >= 0) return;
        const dist = Math.hypot(pt.x - d.hot.x, pt.y - d.hot.y);
        if (dist <= d.hot.r) hit = { d, i };
      });
      if (hit) {
        st.found.push(hit.i);
        st.totalFound++;
        this.mark(hit.d);
        PG.sfx.correct();
        this.spark(panel, hit.d.hot, '+' + 100);
        this.updateChips();
        const left = scene.diffs.length - st.found.length;
        PG.$('#sd-msg').textContent = left ? '좋아요! ' + left + '곳 남았어요' : '모두 찾았어요! 🎉';
        if (!left) this.stageClear();
      } else {
        st.wrong++;
        PG.sfx.wrong();
        panel.classList.remove('is-wrong');
        void panel.offsetWidth;
        panel.classList.add('is-wrong');
        this.spark(panel, pt, '✗', true);
      }
    },

    toSvg(svg, e) {
      try {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const m = svg.getScreenCTM();
        if (!m) return { x: 0, y: 0 };
        const p = pt.matrixTransform(m.inverse());
        return { x: p.x, y: p.y };
      } catch (err) { return { x: 0, y: 0 }; }
    },

    mark(d) {
      this.panels.forEach(p => {
        const g = p.querySelector('g.marks');
        if (!g) return;
        const c = document.createElementNS(SVGNS, 'circle');
        c.setAttribute('cx', d.hot.x);
        c.setAttribute('cy', d.hot.y);
        c.setAttribute('r', Math.max(16, d.hot.r * 0.86).toFixed(1));
        c.setAttribute('class', 'sd-mark-circle');
        const wrap = document.createElementNS(SVGNS, 'g');
        wrap.setAttribute('class', 'sd-mark');
        wrap.appendChild(c);
        g.appendChild(wrap);
      });
    },

    spark(panel, hot, text, bad) {
      const svg = panel.querySelector('svg');
      if (!svg) return;
      const vb = svg.viewBox.baseVal;
      const sp = document.createElement('span');
      sp.className = 'sd-spark';
      sp.textContent = text;
      sp.style.left = (hot.x / (vb.width || 460) * 100) + '%';
      sp.style.top = (hot.y / (vb.height || 340) * 100) + '%';
      if (bad) sp.style.color = '#E4694A';
      else sp.style.color = '#1E9F7C';
      sp.style.fontWeight = '900';
      panel.appendChild(sp);
      setTimeout(() => sp.remove(), 760);
    },

    hint() {
      const st = this.st;
      if (!st.playing) return;
      if (st.hints <= 0) { PG.toast('이 그림의 힌트를 다 썼어요'); return; }
      const scene = PG.art.spotScenes[st.stage];
      const rest = scene.diffs.map((d, i) => ({ d, i })).filter(o => st.found.indexOf(o.i) < 0);
      if (!rest.length) return;
      st.hints--;
      PG.$('#sd-hint-n').textContent = st.hints;
      const target = rest[0];
      PG.sfx.pop();
      this.panels.forEach(p => {
        const g = p.querySelector('g.marks');
        if (!g) return;
        const c = document.createElementNS(SVGNS, 'circle');
        c.setAttribute('cx', target.d.hot.x);
        c.setAttribute('cy', target.d.hot.y);
        c.setAttribute('r', Math.max(20, target.d.hot.r).toFixed(1));
        c.setAttribute('class', 'sd-hintring');
        g.appendChild(c);
        setTimeout(() => c.remove(), 2000);
      });
      PG.toast('💡 여기를 살펴보세요!');
    },

    updateChips() {
      const st = this.st;
      const scene = PG.art.spotScenes[st.stage] || { diffs: [] };
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set('sd-stage', (st.stage + 1) + '/' + MAX_STAGE);
      set('sd-left', Math.max(0, scene.diffs.length - st.found.length));
      set('sd-score', st.totalScore.toLocaleString());
      set('sd-time', PG.fmtTime(st.elapsed * 1000));
      const dots = document.getElementById('sd-dots');
      if (dots) {
        Array.from(dots.children).forEach((d, i) => d.classList.toggle('found', st.found.indexOf(i) >= 0));
      }
      const hb = document.getElementById('sd-hint');
      if (hb) hb.disabled = st.hints <= 0;
    },

    stageClear() {
      const st = this.st;
      st.playing = false;
      clearInterval(this.iv);
      const timeBonus = Math.max(0, 120 - Math.floor(st.elapsed));
      const gain = st.found.length * 100 + 150 + timeBonus - st.wrong * 10 - (HINTS_PER_STAGE - st.hints) * 30;
      st.totalScore += Math.max(0, gain);
      this.updateChips();
      PG.sfx.win();
      const ovl = PG.$('#sd-ovl');
      ovl.hidden = false;
      const last = st.stage >= MAX_STAGE - 1;
      ovl.innerHTML = `<div class="ovl-card">
        <span class="oc-emoji">${last ? '🏁' : '🎉'}</span>
        <h3>${st.stage + 1}번째 그림 클리어!</h3>
        <p>${st.elapsed.toFixed(1)}초 만에 5곳을 모두 찾았어요. +${Math.max(0, gain)}점</p>
        <div class="oc-score">
          <span class="ocs"><b>${st.totalScore.toLocaleString()}</b><i>지금까지 점수</i></span>
          <span class="ocs"><b>${st.totalFound}</b><i>찾은 곳</i></span>
        </div>
        <div class="ovl-actions">
          <button class="btn btn-lav" id="sd-next">${last ? '결과 보기' : '다음 그림 →'}</button>
        </div>
      </div>`;
      PG.$('#sd-next', ovl).addEventListener('click', () => {
        ovl.hidden = true;
        if (last) { this.finish(); return; }
        st.playing = true;
        this.loadStage(st.stage + 1);
      });
    },

    finish() {
      const st = this.st;
      st.playing = false;
      clearInterval(this.iv);
      // 3장면을 모두 마쳤으면 기록
      const detail = '3장면 · ' + st.totalFound + '곳 · 실수 ' + st.wrong;
      const prev = PG.rank.personalBest('spot');
      PG.rank.add({ game: 'spot', score: st.totalScore, detail });
      const best = PG.rank.personalBest('spot');
      PG.sfx.win();
      const ovl = PG.$('#sd-ovl');
      ovl.hidden = false;
      ovl.innerHTML = `<div class="ovl-card">
        <span class="oc-emoji">🏆</span>
        <h3>틀린 그림 찾기 완주!</h3>
        <p>3장면에서 모두 ${st.totalFound}곳을 찾았어요. 눈썰미가 정말 좋아요!</p>
        <div class="oc-score">
          <span class="ocs"><b>${st.totalScore.toLocaleString()}</b><i>점수</i></span>
          <span class="ocs"><b>${st.totalFound}</b><i>찾은 곳</i></span>
        </div>
        <div class="oc-best">🏆 내 최고 기록 ${best.toLocaleString()}점${st.totalScore > prev ? ' · 신기록!' : ''}</div>
        <div class="ovl-actions">
          <button class="btn btn-lav" id="sd-again">다시 하기</button>
          <button class="btn" id="sd-home">놀이터로</button>
        </div>
      </div>`;
      PG.$('#sd-again', ovl).addEventListener('click', () => {
        this.st.totalScore = 0; this.st.totalFound = 0; this.st.wrong = 0;
        this.st.playing = true;
        ovl.hidden = true;
        this.loadStage(0);
      });
      PG.$('#sd-home', ovl).addEventListener('click', () => PG.go('hub'));
    }
  };
})();
