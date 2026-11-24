/* ══════════════════════════════════════════════════════════════
   playground/game-hidden.js — 🕵️ 숨은 그림 찾기
   · 우리 교실 / 학교 공원 / 내 방 3장면
   · 장면마다 숨은 물건 7개 (아이콘 + 이름 목록에서 지워져요)
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const PG = window.PG;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const HINTS_PER_STAGE = 2;

  const G = PG.games.hidden = {
    id: 'hidden',
    st: null,
    iv: 0,

    mount(root) {
      this.st = {
        stage: 0, found: [], totalScore: 0, wrong: 0, hints: HINTS_PER_STAGE,
        startedAt: 0, elapsed: 0, playing: false, totalFound: 0
      };
      root.innerHTML = PG.gameHead('hidden', `
        <span class="chip">장면 <b id="hd-stage">1/3</b></span>
        <span class="chip is-hot">찾은 <b id="hd-found">0</b>/<b id="hd-total">7</b></span>
        <span class="chip is-mint">⭐ <b id="hd-score">0</b></span>
        <span class="chip is-sky">⏱ <b id="hd-time">0:00</b></span>
      `) + `
      <div class="hd-wrap">
        <div class="hd-stage stage-box" id="hd-stage">
          <div id="hd-scene"></div>
          <div class="ovl" id="hd-ovl"></div>
        </div>
        <div class="hd-side">
          <div class="hd-list">
            <h4>🕵️ 찾을 물건 <b id="hd-count">0/7</b></h4>
            <div class="hd-items" id="hd-items"></div>
          </div>
          <div class="hd-actions">
            <button id="hd-hint">💡 힌트 <b id="hd-hint-n">2</b></button>
            <button id="hd-retry">↺ 다시</button>
          </div>
        </div>
      </div>`;

      PG.bindBack(root);
      this.sceneEl = PG.$('#hd-scene', root);
      PG.$('#hd-hint', root).addEventListener('click', () => this.hint());
      PG.$('#hd-retry', root).addEventListener('click', () => this.loadStage(this.st.stage, true));
      this.showStart();
    },

    unmount() {
      clearInterval(this.iv);
      this.iv = 0;
      if (this.st) this.st.playing = false;
    },

    showStart() {
      const ovl = PG.$('#hd-ovl');
      ovl.hidden = false;
      ovl.innerHTML = `<div class="ovl-card">
        <span class="oc-emoji">🕵️</span>
        <h3>숨은 그림 찾기</h3>
        <p>아기자기한 그림 속에 <b>교묘하게 숨은 물건 7개</b>를 찾아요. 모두 3장면!</p>
        <div class="oc-keys">· 오른쪽 목록의 물건을 그림에서 찾아 콕!<br>· 찾으면 목록에서 지워져요<br>· 힌트는 장면마다 2번까지</div>
        <div class="ovl-actions"><button class="btn btn-primary" id="hd-start">시작하기 →</button></div>
      </div>`;
      PG.$('#hd-start', ovl).addEventListener('click', () => {
        this.st.playing = true;
        PG.$('#hd-ovl').hidden = true;
        this.loadStage(0);
      });
      this.sceneEl.innerHTML = `<div style="aspect-ratio:520/380;display:grid;place-items:center;color:#C8BCD6;font-weight:800;font-size:13px;background:#FFFDF8">시작하기를 누르면 그림이 나타나요</div>`;
      PG.$('#hd-items').innerHTML = '';
    },

    loadStage(idx, isRetry) {
      const st = this.st;
      const scene = PG.art.hiddenScenes[idx];
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

      this.sceneEl.innerHTML = PG.art.svg(scene.w, scene.h, scene.base + '<g class="marks"></g>');
      this.svg = this.sceneEl.querySelector('svg');
      this.svg.style.cursor = 'crosshair';
      this.svg.addEventListener('click', e => this.onClick(e));

      PG.$('#hd-items').innerHTML = scene.items.map(it =>
        `<div class="hd-item" data-id="${it.id}">${PG.art.iconSvg(it.id, 26)}<span>${PG.esc(it.name)}</span></div>`
      ).join('');
      PG.$('#hd-total').textContent = scene.items.length;
      PG.$('#hd-hint-n').textContent = st.hints;
      PG.$('#hd-hint').disabled = false;
      this.updateChips();
    },

    onClick(e) {
      const st = this.st;
      if (!st.playing) return;
      const scene = PG.art.hiddenScenes[st.stage];
      const pt = this.toSvg(e);
      let hit = null, hitIdx = -1;
      scene.items.forEach((it, i) => {
        if (st.found.indexOf(i) >= 0) return;
        const d = Math.hypot(pt.x - it.x, pt.y - it.y);
        if (d <= 21) { hit = it; hitIdx = i; }
      });
      if (!hit) {
        st.wrong++;
        PG.sfx.wrong();
        this.spark(pt, '✗', true);
        return;
      }
      st.found.push(hitIdx);
      st.totalFound++;
      PG.sfx.correct();
      this.mark(hit);
      this.spark(hit, '+' + 120);
      const li = PG.$(`.hd-item[data-id="${hit.id}"]`);
      if (li) li.classList.add('is-found');
      this.updateChips();
      if (st.found.length === scene.items.length) this.stageClear();
    },

    toSvg(e) {
      try {
        const pt = this.svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const m = this.svg.getScreenCTM();
        if (!m) return { x: 0, y: 0 };
        const p = pt.matrixTransform(m.inverse());
        return { x: p.x, y: p.y };
      } catch (err) { return { x: 0, y: 0 }; }
    },

    mark(it) {
      const g = this.svg.querySelector('g.marks');
      if (!g) return;
      const wrap = document.createElementNS(SVGNS, 'g');
      wrap.setAttribute('class', 'sd-mark');
      const c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('cx', it.x);
      c.setAttribute('cy', it.y);
      c.setAttribute('r', 19);
      wrap.appendChild(c);
      g.appendChild(wrap);
    },

    spark(pt, text, bad) {
      const stage = PG.$('#hd-stage');
      const sp = document.createElement('span');
      sp.className = 'sd-spark';
      sp.textContent = text;
      sp.style.left = (pt.x / 520 * 100) + '%';
      sp.style.top = (pt.y / 380 * 100) + '%';
      sp.style.color = bad ? '#E4694A' : '#1E9F7C';
      sp.style.fontWeight = '900';
      stage.appendChild(sp);
      setTimeout(() => sp.remove(), 760);
    },

    hint() {
      const st = this.st;
      if (!st.playing) return;
      if (st.hints <= 0) { PG.toast('이 장면의 힌트를 다 썼어요'); return; }
      const scene = PG.art.hiddenScenes[st.stage];
      const rest = scene.items.filter((it, i) => st.found.indexOf(i) < 0);
      if (!rest.length) return;
      st.hints--;
      PG.$('#hd-hint-n').textContent = st.hints;
      PG.$('#hd-hint').disabled = st.hints <= 0;
      const target = rest[0];
      const g = this.svg.querySelector('g.marks');
      if (g) {
        const c = document.createElementNS(SVGNS, 'circle');
        c.setAttribute('cx', target.x);
        c.setAttribute('cy', target.y);
        c.setAttribute('r', 26);
        c.setAttribute('class', 'sd-hintring');
        g.appendChild(c);
        setTimeout(() => c.remove(), 2000);
      }
      PG.sfx.pop();
      PG.toast('💡 ' + target.name + '이(가) 이 근처에 숨어 있어요!');
    },

    updateChips() {
      const st = this.st;
      const scene = PG.art.hiddenScenes[st.stage] || { items: [] };
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set('hd-stage', (st.stage + 1) + '/3');
      set('hd-found', st.found.length);
      set('hd-total', scene.items.length);
      set('hd-count', st.found.length + '/' + scene.items.length);
      set('hd-score', st.totalScore.toLocaleString());
      set('hd-time', PG.fmtTime(st.elapsed * 1000));
    },

    stageClear() {
      const st = this.st;
      st.playing = false;
      clearInterval(this.iv);
      const timeBonus = Math.max(0, 150 - Math.floor(st.elapsed) * 2);
      const gain = st.found.length * 120 + 200 + timeBonus - st.wrong * 10 - (HINTS_PER_STAGE - st.hints) * 30;
      st.totalScore += Math.max(0, gain);
      this.updateChips();
      PG.sfx.win();
      const last = st.stage >= PG.art.hiddenScenes.length - 1;
      const ovl = PG.$('#hd-ovl');
      ovl.hidden = false;
      ovl.innerHTML = `<div class="ovl-card">
        <span class="oc-emoji">${last ? '🏁' : '🎉'}</span>
        <h3>${st.stage + 1}번째 장면 완성!</h3>
        <p>${st.elapsed.toFixed(1)}초 만에 숨은 물건 7개를 모두 찾았어요. +${Math.max(0, gain)}점</p>
        <div class="oc-score">
          <span class="ocs"><b>${st.totalScore.toLocaleString()}</b><i>지금까지 점수</i></span>
          <span class="ocs"><b>${st.totalFound}</b><i>찾은 물건</i></span>
        </div>
        <div class="ovl-actions">
          <button class="btn btn-primary" id="hd-next">${last ? '결과 보기' : '다음 장면 →'}</button>
        </div>
      </div>`;
      PG.$('#hd-next', ovl).addEventListener('click', () => {
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
      const detail = '3장면 · ' + st.totalFound + '개 · 실수 ' + st.wrong;
      const prev = PG.rank.personalBest('hidden');
      PG.rank.add({ game: 'hidden', score: st.totalScore, detail });
      const best = PG.rank.personalBest('hidden');
      PG.sfx.win();
      const ovl = PG.$('#hd-ovl');
      ovl.hidden = false;
      ovl.innerHTML = `<div class="ovl-card">
        <span class="oc-emoji">🏆</span>
        <h3>숨은 그림 찾기 완주!</h3>
        <p>3장면에서 숨은 물건 ${st.totalFound}개를 모두 찾았어요. 관찰력 최고!</p>
        <div class="oc-score">
          <span class="ocs"><b>${st.totalScore.toLocaleString()}</b><i>점수</i></span>
          <span class="ocs"><b>${st.totalFound}</b><i>찾은 물건</i></span>
        </div>
        <div class="oc-best">🏆 내 최고 기록 ${best.toLocaleString()}점${st.totalScore > prev ? ' · 신기록!' : ''}</div>
        <div class="ovl-actions">
          <button class="btn btn-primary" id="hd-again">다시 하기</button>
          <button class="btn" id="hd-home">놀이터로</button>
        </div>
      </div>`;
      PG.$('#hd-again', ovl).addEventListener('click', () => {
        this.st.totalScore = 0; this.st.totalFound = 0; this.st.wrong = 0;
        this.st.playing = true;
        ovl.hidden = true;
        this.loadStage(0);
      });
      PG.$('#hd-home', ovl).addEventListener('click', () => PG.go('hub'));
    }
  };
})();
