/* ══════════════════════════════════════════════════════════════
   playground/game-maze.js — 🌀 미로 찾기
   · 매번 새로 만들어지는 랜덤 미로 (초급/중급/고급)
   · 방향키·WASD·화면 버튼으로 이동, 걸린 시간·이동 횟수 기록
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const PG = window.PG;

  const DIFF = {
    easy: { label: '초급', n: 10, base: 600 },
    mid: { label: '중급', n: 14, base: 900 },
    hard: { label: '고급', n: 18, base: 1300 }
  };

  const G = PG.games.maze = {
    id: 'maze',
    st: null,
    raf: 0,
    iv: 0,

    mount(root) {
      const self = this;
      this.st = {
        diff: 'easy', active: false, grid: null, size: 0,
        px: 1, py: 1, goal: { x: 1, y: 1 }, moves: 0,
        startedAt: 0, elapsed: 0, running: false, hintUsed: false,
        hintPath: null, hintUntil: 0, anim: null, won: false
      };
      root.innerHTML = PG.gameHead('maze', `
        <span class="chip is-sky">⏱ <b id="mz-time">0.0초</b></span>
        <span class="chip">👣 <b id="mz-moves">0</b> 걸음</span>
        <span class="chip is-mint">난이도 <b id="mz-diff">초급</b></span>
      `) + `
      <div class="mz-wrap">
        <div class="mz-stage stage-box" id="mz-stage">
          <canvas class="mz-canvas" id="mz-canvas"></canvas>
          <div class="ovl" id="mz-ovl"></div>
        </div>
        <div class="mz-side">
          <div class="mz-diff" id="mz-diffbtns">
            ${Object.keys(DIFF).map(k => `<button data-d="${k}" class="${k === 'easy' ? 'is-on' : ''}">${DIFF[k].label}</button>`).join('')}
          </div>
          <div class="mz-stats">
            <div class="mzs"><span>시간</span><b id="mz-s-time">0.0초</b></div>
            <div class="mzs"><span>이동</span><b id="mz-s-moves">0걸음</b></div>
            <div class="mzs"><span>내 최고</span><b id="mz-s-best">0</b></div>
          </div>
          <div class="dpad">
            <button class="dpad-c" data-reset title="새 미로">↺</button>
            <button data-move="up">⬆</button>
            <button data-hint title="길 보기">💡</button>
            <button data-move="left">⬅</button>
            <button class="dpad-c" data-move="down">⬇</button>
            <button data-move="right">➡</button>
          </div>
          <p style="font-size:11px;color:#B0A4BF;font-weight:700;line-height:1.5;text-align:center">
            방향키 · WASD<br>화면 버튼으로도 이동!
          </p>
        </div>
      </div>`;

      PG.bindBack(root);
      this.canvas = PG.$('#mz-canvas', root);
      this.ctx = this.canvas.getContext('2d');
      this.stage = PG.$('#mz-stage', root);

      PG.$$('#mz-diffbtns [data-d]', root).forEach(b => b.addEventListener('click', () => {
        PG.$$('#mz-diffbtns [data-d]', root).forEach(x => x.classList.toggle('is-on', x === b));
        this.setDiff(b.dataset.d);
      }));
      PG.$$('[data-move]', root).forEach(b => b.addEventListener('click', () => {
        const m = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[b.dataset.move];
        if (m) this.move(m[0], m[1]);
      }));
      PG.$('[data-reset]', root).addEventListener('click', () => { PG.sfx.click(); this.newMaze(true); });
      PG.$('[data-hint]', root).addEventListener('click', () => this.hint());

      this._onKey = e => this.onKey(e);
      document.addEventListener('keydown', this._onKey);
      this._onResize = () => { this.resize(); this.draw(); };
      window.addEventListener('resize', this._onResize);

      this.setDiff('easy');
      const best = PG.rank.personalBest('maze');
      const bs = document.getElementById('mz-s-best');
      if (bs) bs.textContent = best.toLocaleString();
    },

    unmount() {
      cancelAnimationFrame(this.raf);
      clearInterval(this.iv);
      this.raf = 0; this.iv = 0;
      if (this._onKey) document.removeEventListener('keydown', this._onKey);
      if (this._onResize) window.removeEventListener('resize', this._onResize);
      if (this.st) this.st.active = false;
    },

    setDiff(key) {
      this.st.diff = DIFF[key] ? key : 'easy';
      const d = DIFF[this.st.diff];
      const el = document.getElementById('mz-diff');
      if (el) el.textContent = d.label;
      this.newMaze(true);
    },

    newMaze(showStart) {
      const st = this.st;
      const d = DIFF[st.diff];
      const n = d.n, size = n * 2 + 1;
      const g = Array.from({ length: size }, () => new Array(size).fill(1));
      const vis = Array.from({ length: n }, () => new Array(n).fill(false));
      const stack = [[0, 0]];
      vis[0][0] = true;
      g[1][1] = 0;
      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      while (stack.length) {
        const [cx, cy] = stack[stack.length - 1];
        const cand = PG.shuffle(dirs).filter(([dx, dy]) => {
          const nx = cx + dx, ny = cy + dy;
          return nx >= 0 && nx < n && ny >= 0 && ny < n && !vis[ny][nx];
        });
        if (!cand.length) { stack.pop(); continue; }
        const [dx, dy] = cand[0];
        const nx = cx + dx, ny = cy + dy;
        vis[ny][nx] = true;
        g[2 * cy + 1 + dy][2 * cx + 1 + dx] = 0;
        g[2 * ny + 1][2 * nx + 1] = 0;
        stack.push([nx, ny]);
      }
      st.grid = g;
      st.size = size;
      st.px = 1; st.py = 1;
      st.goal = { x: size - 2, y: size - 2 };
      st.moves = 0;
      st.elapsed = 0;
      st.running = false;
      st.won = false;
      st.hintUsed = false;
      st.hintPath = null;
      st.hintUntil = 0;
      st.anim = null;
      st.startedAt = 0;
      clearInterval(this.iv);
      this.updateStats();
      this.resize();
      this.draw();
      if (showStart) this.showStart();
      else PG.$('#mz-ovl').hidden = true;
    },

    showStart() {
      const st = this.st;
      const ovl = PG.$('#mz-ovl');
      ovl.hidden = false;
      ovl.innerHTML = `<div class="ovl-card">
        <span class="oc-emoji">🌀</span>
        <h3>미로 찾기</h3>
        <p>매번 새로 생기는 미로를 빠져나가요. 별이 있는 곳이 출구예요!</p>
        <div class="oc-keys">· <b>방향키 / WASD</b> 또는 화면 버튼<br>· 난이도는 초급 · 중급 · 고급<br>· 빨리, 적게 움직일수록 점수가 높아요</div>
        <div class="ovl-actions"><button class="btn btn-mint" id="mz-start">출발! →</button></div>
      </div>`;
      PG.$('#mz-start', ovl).addEventListener('click', () => this.begin());
    },

    begin() {
      const st = this.st;
      st.active = true;
      st.won = false;
      PG.$('#mz-ovl').hidden = true;
      this.updateStats();
      this.draw();
      const self = this;
      cancelAnimationFrame(this.raf);
      const loop = () => {
        if (!self.st || self.currentView !== 'maze') return;
        self.draw();
        self.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    },

    get currentView() { return PG.current; },

    onKey(e) {
      const st = this.st;
      if (!st || !st.active || st.won) return;
      if (PG.current !== 'maze') return;
      const k = e.key;
      let d = null;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') d = [0, -1];
      else if (k === 'ArrowDown' || k === 's' || k === 'S') d = [0, 1];
      else if (k === 'ArrowLeft' || k === 'a' || k === 'A') d = [-1, 0];
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') d = [1, 0];
      if (!d) return;
      e.preventDefault();
      this.move(d[0], d[1]);
    },

    move(dx, dy) {
      const st = this.st;
      if (!st || !st.grid || st.won) return;
      if (PG.$('#mz-ovl') && !PG.$('#mz-ovl').hidden) return;
      if (!st.active) this.begin();
      const nx = st.px + dx, ny = st.py + dy;
      if (nx < 0 || ny < 0 || nx >= st.size || ny >= st.size) return;
      if (st.grid[ny][nx] !== 0) return;
      if (!st.running) {
        st.running = true;
        st.startedAt = Date.now();
        const self = this;
        clearInterval(this.iv);
        this.iv = setInterval(() => {
          if (!self.st.running) return;
          self.st.elapsed = (Date.now() - self.st.startedAt) / 1000;
          self.updateStats();
        }, 100);
      }
      st.anim = { fx: st.px, fy: st.py, t0: performance.now() };
      st.px = nx; st.py = ny;
      st.moves++;
      PG.sfx.click();
      this.updateStats();
      if (st.px === st.goal.x && st.py === st.goal.y) this.win();
    },

    hint() {
      const st = this.st;
      if (!st.grid || st.won) return;
      // BFS 최단 경로
      const size = st.size;
      const prev = new Map();
      const q = [[st.px, st.py]];
      const seen = new Set([st.px + ',' + st.py]);
      const goalKey = st.goal.x + ',' + st.goal.y;
      let found = false;
      while (q.length) {
        const [x, y] = q.shift();
        if (x === st.goal.x && y === st.goal.y) { found = true; break; }
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= size || ny >= size) return;
          if (st.grid[ny][nx] !== 0) return;
          const key = nx + ',' + ny;
          if (seen.has(key)) return;
          seen.add(key);
          prev.set(key, x + ',' + y);
          q.push([nx, ny]);
        });
      }
      if (!found) { PG.toast('길을 찾지 못했어요. 새 미로로 다시!'); return; }
      const path = [];
      let cur = goalKey;
      while (cur) {
        const [x, y] = cur.split(',').map(Number);
        path.push({ x, y });
        cur = prev.get(cur);
      }
      path.reverse();
      st.hintPath = path;
      st.hintUntil = performance.now() + 1800;
      st.hintUsed = true;
      PG.sfx.pop();
      PG.toast('💡 길을 살짝 보여 줄게요 (점수 조금 줄어요)');
    },

    win() {
      const st = this.st;
      if (st.won) return;
      st.won = true;
      st.running = false;
      clearInterval(this.iv);
      st.elapsed = st.startedAt ? (Date.now() - st.startedAt) / 1000 : 0;
      const d = DIFF[st.diff];
      let score = Math.round(d.base - st.elapsed * 3 - st.moves * 1);
      if (st.hintUsed) score = Math.round(score * 0.8);
      score = Math.max(50, score);
      const detail = d.label + ' · ' + st.elapsed.toFixed(1) + '초 · ' + st.moves + '걸음';
      const prev = PG.rank.personalBest('maze');
      PG.rank.add({ game: 'maze', score, detail });
      const best = PG.rank.personalBest('maze');
      const bs = document.getElementById('mz-s-best');
      if (bs) bs.textContent = best.toLocaleString();
      PG.sfx.win();
      const ovl = PG.$('#mz-ovl');
      ovl.hidden = false;
      ovl.innerHTML = `<div class="ovl-card">
        <span class="oc-emoji">🎉</span>
        <h3>탈출 성공!</h3>
        <p>${d.label} 미로를 ${st.moves}걸음 만에 빠져나왔어요.</p>
        <div class="oc-score">
          <span class="ocs"><b>${score.toLocaleString()}</b><i>점수</i></span>
          <span class="ocs"><b>${st.elapsed.toFixed(1)}</b><i>초</i></span>
          <span class="ocs"><b>${st.moves}</b><i>걸음</i></span>
        </div>
        <div class="oc-best">🏆 내 최고 기록 ${best.toLocaleString()}점${score > prev ? ' · 신기록!' : ''}</div>
        <div class="ovl-actions">
          <button class="btn btn-mint" id="mz-again">새 미로</button>
          <button class="btn" id="mz-home">놀이터로</button>
        </div>
      </div>`;
      PG.$('#mz-again', ovl).addEventListener('click', () => this.newMaze(true));
      PG.$('#mz-home', ovl).addEventListener('click', () => PG.go('hub'));
      this.draw();
    },

    updateStats() {
      const st = this.st;
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      const t = st.running ? st.elapsed : st.elapsed;
      set('mz-time', t.toFixed(1) + '초');
      set('mz-s-time', t.toFixed(1) + '초');
      set('mz-moves', st.moves);
      set('mz-s-moves', st.moves + '걸음');
    },

    resize() {
      if (!this.canvas || !this.stage) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = this.stage.getBoundingClientRect();
      this.W = Math.max(200, r.width);
      this.H = Math.max(200, r.height);
      this.canvas.width = Math.round(this.W * dpr);
      this.canvas.height = Math.round(this.H * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    draw() {
      const st = this.st;
      const ctx = this.ctx;
      if (!ctx || !st.grid) return;
      const size = st.size;
      const cell = Math.min(this.W, this.H) / size;
      const ox = (this.W - cell * size) / 2;
      const oy = (this.H - cell * size) / 2;
      const now = performance.now();

      ctx.clearRect(0, 0, this.W, this.H);
      // 바닥
      ctx.fillStyle = '#FFFDF6';
      ctx.fillRect(ox, oy, cell * size, cell * size);

      // 벽
      ctx.fillStyle = '#C9B9F2';
      ctx.strokeStyle = '#B3A0E6';
      ctx.lineWidth = 1;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (st.grid[y][x] !== 1) continue;
          const px = ox + x * cell, py = oy + y * cell;
          this.clipRect(px + 0.4, py + 0.4, cell - 0.8, cell - 0.8, Math.min(4, cell * 0.3));
          ctx.fill();
        }
      }
      // 벽 하이라이트
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (st.grid[y][x] !== 1) continue;
          const px = ox + x * cell, py = oy + y * cell;
          if (y > 0 && st.grid[y - 1][x] !== 1) {
            ctx.fillRect(px + 1, py + 1.4, cell - 2, Math.max(1.4, cell * 0.13));
          }
        }
      }

      // 출구 별
      const gx = ox + st.goal.x * cell + cell / 2;
      const gy = oy + st.goal.y * cell + cell / 2;
      const pulse = 0.85 + Math.sin(now / 320) * 0.15;
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#FFD166';
      ctx.beginPath();
      ctx.arc(gx, gy, cell * 0.62 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      this.star(gx, gy, cell * 0.36, '#FFD166', '#C79018');

      // 힌트 길
      if (st.hintPath && now < st.hintUntil) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,140,170,.85)';
        ctx.lineWidth = Math.max(2, cell * 0.22);
        ctx.setLineDash([cell * 0.3, cell * 0.28]);
        ctx.lineCap = 'round';
        ctx.beginPath();
        st.hintPath.forEach((p, i) => {
          const px = ox + p.x * cell + cell / 2;
          const py = oy + p.y * cell + cell / 2;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.restore();
      }

      // 플레이어
      let px = ox + st.px * cell + cell / 2;
      let py = oy + st.py * cell + cell / 2;
      if (st.anim) {
        const k = Math.min(1, (now - st.anim.t0) / 95);
        px = ox + (st.anim.fx + (st.px - st.anim.fx) * k) * cell + cell / 2;
        py = oy + (st.anim.fy + (st.py - st.anim.fy) * k) * cell + cell / 2;
        if (k >= 1) st.anim = null;
      }
      const r = cell * 0.34;
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py + r * 0.2, r * 0.95, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(126,104,86,.14)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = '#FFB3C7';
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, cell * 0.08);
      ctx.strokeStyle = '#E4698C';
      ctx.stroke();
      // 눈
      const er = Math.max(1.2, r * 0.16);
      ctx.fillStyle = '#43385A';
      ctx.beginPath(); ctx.arc(px - r * 0.32, py - r * 0.12, er, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + r * 0.32, py - r * 0.12, er, 0, Math.PI * 2); ctx.fill();
      // 볼
      ctx.fillStyle = 'rgba(255,120,140,.35)';
      ctx.beginPath(); ctx.arc(px - r * 0.55, py + r * 0.22, er * 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + r * 0.55, py + r * 0.22, er * 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },

    clipRect(x, y, w, h, r) {
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },

    star(cx, cy, r, fill, stroke) {
      const ctx = this.ctx;
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const rr = i % 2 ? r * 0.45 : r;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = stroke;
      ctx.stroke();
      ctx.restore();
    }
  };
})();
