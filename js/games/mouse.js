/* ══════════════════════════════════════════════════════════════
   games/mouse.js — 🖱️ 마우스 게임 5종 v2
     ① 🌱 클릭 부자   ② 🧩 드래그 짝맞추기   ③ 🎨 내가 그리는 AI
     ④ 🎯 두더지 & 버그 잡기   ⑤ 🍎 하늘에서 떨어지는 별 받기
   · 마우스·터치 모두 pointer 이벤트로 동작 (좌표 스케일 보정)
   · 시작 전에는 캔버스를 누르면 바로 시작 + 큰 "게임 시작!" 안내
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CC = window.CC;
  CC.games = CC.games || {};
  const M = (CC.games.mouse = {});
  const TAU = Math.PI * 2;

  const GAMES = [
    { id: 'rich', ico: '🌱', name: '클릭 부자', best: 'rich' },
    { id: 'drag', ico: '🧩', name: '드래그 짝', best: 'drag' },
    { id: 'draw', ico: '🎨', name: '내가 그리는 AI', best: 'draw' },
    { id: 'mole', ico: '🎯', name: '두더지·버그', best: 'mole' },
    { id: 'star', ico: '🍎', name: '별 받기', best: 'star' }
  ];
  const DUR = 30;

  let S = null, root0 = null, cvs = null, ctx = null, raf = 0;
  let W = 640, H = 340;
  let cleanupResize = null;

  /* ══════════════════════════════════════════════════════════
     공통 그리기 도우미
     ══════════════════════════════════════════════════════════ */
  function rr(x, y, w, h, r, fill, stroke, lw) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, rad);
    else {
      ctx.moveTo(x + rad, y); ctx.arcTo(x + w, y, x + w, y + h, rad);
      ctx.arcTo(x + w, y + h, x, y + h, rad); ctx.arcTo(x, y + h, x, y, rad);
      ctx.arcTo(x, y, x + w, y, rad); ctx.closePath();
    }
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  }
  function text(s, x, y, size, color, align, weight) {
    ctx.font = `${weight || 800} ${size}px "Noto Sans KR","Apple SD Gothic Neo",sans-serif`;
    ctx.fillStyle = color || '#3A3350';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  }
  function emoji(s, x, y, size) {
    ctx.font = `${size}px "Apple Color Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  }

  function resizeCanvas() {
    if (!cvs) return;
    const box = cvs.parentElement.getBoundingClientRect();
    W = Math.max(320, Math.round(box.width));
    H = Math.max(240, Math.round(box.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cvs.width = Math.round(W * dpr);
    cvs.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    if (S) {
      if (S.game === 'rich') layoutPlots();
      if (S.game === 'drag') layoutDrag();
      if (S.game === 'mole') layoutHoles();
      if (S.game === 'star') S.basket = CC.clamp(S.basket || W / 2, 46, W - 46);
    }
  }

  /* 좌표 변환 — CSS 픽셀 기준 논리 좌표 */
  function local(e) {
    const r = cvs.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (W / r.width),
      y: (e.clientY - r.top) * (H / r.height)
    };
  }

  /* ══════════════════════════════════════════════════════════
     화면 틀
     ══════════════════════════════════════════════════════════ */
  M.open = function () {
    const html = `
      <div class="mouse-tabs" id="m-tabs">
        ${GAMES.map((g, i) => `<button class="mtab ${i === 0 ? 'is-on' : ''}" data-g="${g.id}">
          <span class="mi">${g.ico}</span>${g.name}</button>`).join('')}
      </div>
      <div class="play-area" id="m-area"><canvas id="m-canvas"></canvas></div>
      <div class="play-hud">
        <span class="ph-box" id="m-hud1">점수 <b id="m-score">0</b></span>
        <span class="ph-box time" id="m-hud2">남은 시간 <b id="m-time">${DUR}</b>초</span>
        <span class="ph-box coin" id="m-hud3" style="display:none">동전 <b id="m-coin">0</b></span>
        <span class="grow"></span>
        <span class="badge badge-warn">최고 <b id="m-best">0</b></span>
        <button class="btn btn-sm btn-yellow" id="m-start">▶ 게임 시작</button>
        <button class="btn btn-sm btn-gray" id="m-stop">■ 멈춤</button>
      </div>
      <div class="shop-row" id="m-shop" style="display:none"></div>
      <div class="tip-line" id="m-tip"></div>`;

    CC.ui.openModal({
      icon: '🖱️', title: '마우스 게임', sub: '클릭 · 드래그 · 그림 · 잡기 · 받기 — 5종',
      size: 'lg', body: html,
      onMount(root) {
        root0 = root;
        cvs = root.querySelector('#m-canvas');
        ctx = cvs.getContext('2d');
        resizeCanvas();
        wire(root);
        setGame('rich');
        loop();
      },
      onClose() {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        if (cleanupResize) { try { cleanupResize(); } catch (e) { } cleanupResize = null; }
        S = null; root0 = null; cvs = null; ctx = null;
      }
    });
  };

  function wire(root) {
    const $ = (s) => root.querySelector(s);

    root.querySelector('#m-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-g]');
      if (!b) return;
      CC.sfx.click();
      root.querySelectorAll('.mtab').forEach(x => x.classList.toggle('is-on', x === b));
      setGame(b.dataset.g);
    });
    $('#m-start').onclick = () => { CC.sfx.click(); begin(); };
    $('#m-stop').onclick = () => {
      CC.sfx.click();
      if (S && S.running) { S.running = false; end(); }
    };

    /* ── 포인터 ── */
    let dragging = false;
    cvs.addEventListener('pointerdown', (e) => {
      if (!S) return;
      const p = local(e);
      S.mx = p.x; S.my = p.y;
      try { cvs.setPointerCapture(e.pointerId); } catch (err) { }
      dragging = true;
      if (S.game === 'draw') { S.drawing = true; strokeStart(p.x, p.y); return; }
      if (!S.running) { begin(); return; }        /* 시작 전 캔버스를 누르면 바로 시작 */
      if (S.game === 'rich') richClick(p.x, p.y);
      if (S.game === 'drag') dragDown(p.x, p.y);
      if (S.game === 'mole') moleClick(p.x, p.y);
      if (S.game === 'star') S.basketTarget = p.x;
    });
    cvs.addEventListener('pointermove', (e) => {
      if (!S) return;
      const p = local(e);
      S.mx = p.x; S.my = p.y;
      if (!e.pointerType || e.pointerType === 'mouse') S.hover = true;
      if (S.game === 'draw' && S.drawing) strokeMove(p.x, p.y);
      if (S.game === 'drag' && S.drag) {
        S.drag.x = p.x; S.drag.y = p.y;
        if (Math.hypot(p.x - (S.downX || p.x), p.y - (S.downY || p.y)) > 10) S.tapMode = false;
      }
      if (S.game === 'star') S.basketTarget = p.x;
    });
    const up = (e) => {
      if (!S) return;
      if (S.game === 'draw') { S.drawing = false; S.lastPt = null; }
      if (S.game === 'drag' && S.drag && dragging) {
        /* 끌지 않고 톡 눌렀으면 '집은 채로' 두고, 다음 탭에서 칸에 놓는다 */
        const moved = Math.hypot((S.mx || 0) - (S.downX || 0), (S.my || 0) - (S.downY || 0));
        if (moved > 12) dropDrag();
        else { S.tapMode = true; }
      }
      dragging = false;
      if (e && e.pointerId != null) { try { cvs.releasePointerCapture(e.pointerId); } catch (err) { } }
    };
    cvs.addEventListener('pointerup', up);
    cvs.addEventListener('pointercancel', up);
    cvs.addEventListener('pointerleave', () => { S && (S.hover = false); });
    cvs.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('resize', onResize);
    function onResize() { if (cvs) resizeCanvas(); }
    cleanupResize = () => window.removeEventListener('resize', onResize);
  }

  /* ══════════════════════════════════════════════════════════
     게임 전환
     ══════════════════════════════════════════════════════════ */
  function setGame(id) {
    if (!S && !root0) return;
    const g = GAMES.find(x => x.id === id) || GAMES[0];
    if (S && S.timer) clearInterval(S.timer);
    if (S && S.timer2) clearInterval(S.timer2);
    const keepUp = (S && S.upgrades) || { land: 0, water: 0, auto: 0 };
    S = {
      game: id, running: false, over: false, countdown: 0, t: DUR,
      score: 0, coin: 0, items: [], plots: [], holes: [], popups: [],
      brush: '#FF7A60', brushSize: 7, strokes: [], drawing: false, lastPt: null,
      alive: false, aliveT: 0, aliveDir: 1, px: W * 0.4, py: H * 0.55,
      combo: 0, comboBest: 0, flash: 0, mx: W / 2, my: H / 2, basket: W / 2, basketTarget: W / 2,
      upgrades: keepUp, last: CC.now()
    };
    const root = root0;
    const $ = (s) => (root ? root.querySelector(s) : null);
    const byId = (id) => document.getElementById(id);
    const disp = (s, v) => { const el = byId(s); if (el) el.style.display = v; };
    const setT = (s, v) => { const el = byId(s); if (el) el.textContent = v; };

    disp('m-shop', id === 'rich' ? 'flex' : 'none');
    disp('m-hud3', id === 'rich' ? 'flex' : 'none');
    disp('m-hud2', id === 'draw' ? 'none' : 'flex');
    const bStart = $('m-start'), bStop = $('m-stop');
    if (bStart) { bStart.disabled = id === 'draw'; bStart.textContent = id === 'draw' ? '① 그려 보세요' : '▶ 게임 시작'; }
    if (bStop) bStop.disabled = id === 'draw' || id === 'rich';
    setT('m-score', '0'); setT('m-coin', '0'); setT('m-time', DUR); setT('m-best', CC.best[g.best] || 0);

    const hud1 = byId('m-hud1');
    if (hud1) {
      hud1.innerHTML = (id === 'star' ? '받은 별 ' : (id === 'draw' ? '그린 그림 ' : '점수 '))
        + '<b id="m-score">0</b>';
    }
    const hud2 = byId('m-hud2');
    if (hud2) hud2.innerHTML = '남은 시간 <b id="m-time">' + DUR + '</b>초';
    const hud3 = byId('m-hud3');
    if (hud3) hud3.innerHTML = '동전 <b id="m-coin">0</b>';

    /* 그리기 도구는 그리기 게임에서만 보인다 */
    const dbar = root0 && root0.querySelector('.draw-bar');
    if (dbar) dbar.style.display = id === 'draw' ? 'flex' : 'none';
    setTip(id);
    buildShop();
    if (id === 'rich') initRich();
    if (id === 'drag') initDrag();
    if (id === 'mole') initMole();
    if (id === 'star') initStar();
    if (id === 'draw') initDraw();
    paintHud();
    draw();
  }

  function setTip(id) {
    const el = root0 && root0.querySelector('#m-tip');
    if (!el) return;
    const tips = {
      rich: '화분을 클릭하면 새싹 → 꽃 → 열매 → 황금나무로 자라고 동전이 쌓여요. 동전으로 땅·물뿌리개·자동수확기를 사요!',
      drag: '아래 트레이의 과일을 같은 그림 칸으로 끌어다 놓으세요. 연속으로 넣으면 콤보 점수!',
      draw: '캔버스에 캐릭터를 그린 뒤 [살아 움직여!] 를 누르면 팔·다리가 생겨 걸어다니고 춤을 춰요.',
      mole: '구멍에서 나오는 두더지는 1점, 초록 버그는 2점! 연속으로 잡으면 콤보 보너스.',
      star: '마우스를 좌우로 움직여 바구니로 별(3점)·사과(1점)를 받고, 폭탄은 피하세요!'
    };
    el.textContent = tips[id] || '';
  }

  /* ══════════════════════════════════════════════════════════
     시작 · 끝
     ══════════════════════════════════════════════════════════ */
  function begin() {
    if (!S) return;
    if (S.game === 'draw') return;
    S.running = true; S.over = false;
    S.score = 0; S.coin = 0; S.combo = 0; S.comboBest = 0;
    S.t = DUR; S.countdown = 3.2; S.t0 = CC.now();
    S.popups = [];
    if (S.game === 'mole') initMole();
    if (S.game === 'drag') initDrag();
    if (S.game === 'star') initStar();
    if (S.game === 'rich') initRich();
    paintHud();
    CC.sfx.tick();
  }

  function end() {
    if (!S) return;
    S.over = true;
    if (S.timer) clearInterval(S.timer);
    const g = GAMES.find(x => x.id === S.game) || GAMES[0];
    const key = g.best;
    const sc = S.game === 'rich' ? Math.round(S.coin) : Math.round(S.score);
    const prev = CC.best[key] || 0;
    const best = Math.max(prev, sc);
    if (sc > prev) CC.saveBest({ [key]: sc });
    if (root0) {
      root0.querySelector('#m-best').textContent = best;
      const area = root0.querySelector('#m-area');
      const old = area.querySelector('.overlay-done');
      if (old) old.remove();
      const ov = document.createElement('div');
      ov.className = 'overlay-done';
      ov.innerHTML = `
        <div class="done-card">
          <h3>${sc > prev ? '🎉 신기록!' : '⏱️ 끝!'}</h3>
          <p>${g.name} · ${sc}${S.game === 'rich' ? ' 동전' : '점'}</p>
          <b>${sc}</b>
          <p style="margin-top:6px">최고 기록 ${best}${S.comboBest > 1 ? ' · 최대 콤보 ' + S.comboBest : ''}</p>
          <div style="margin-top:10px;display:flex;gap:7px;justify-content:center">
            <button class="btn btn-sm btn-yellow" id="m-again">다시 도전</button>
            <button class="btn btn-sm btn-gray" id="m-close">닫기</button>
          </div>
        </div>`;
      area.appendChild(ov);
      ov.querySelector('#m-again').onclick = () => { CC.sfx.click(); ov.remove(); begin(); };
      ov.querySelector('#m-close').onclick = () => { CC.sfx.click(); CC.ui.closeModal(); };
    }
    CC.sfx.cheer();
  }

  function paintHud() {
    if (!root0 || !S) return;
    const sc = root0.querySelector('#m-score');
    const ci = root0.querySelector('#m-coin');
    const tm = root0.querySelector('#m-time');
    const scv = String(Math.round(S.score));
    const civ = String(Math.round(S.coin));
    const tmv = String(Math.max(0, Math.ceil(S.t)));
    if (sc && sc.textContent !== scv) sc.textContent = scv;
    if (ci && ci.textContent !== civ) ci.textContent = civ;
    if (tm && S.game !== 'draw' && tm.textContent !== tmv) tm.textContent = tmv;
  }

  /* ══════════════════════════════════════════════════════════
     메인 루프
     ══════════════════════════════════════════════════════════ */
  function loop() {
    raf = requestAnimationFrame(loop);
    if (!S || !ctx) return;
    const now = CC.now();
    const dt = Math.min(0.05, (now - (S.last || now)) / 1000);
    S.last = now;
    if (S.game === 'draw') {
      if (S.alive) S.aliveT += dt;
    } else if (S.running) {
      if (S.countdown > 0) {
        S.countdown -= dt;
      } else {
        update(dt, now);
      }
    }
    paintHud();
    draw();
  }

  function update(dt, now) {
    /* 남은 시간 */
    S.t -= dt;
    if (S.t <= 0) { S.t = 0; S.running = false; end(); return; }

    if (S.game === 'rich') {
      /* 자동 수확기 */
      if (S.upgrades.auto) {
        S.autoT = (S.autoT || 0) + dt;
        if (S.autoT > 1.5) {
          S.autoT = 0;
          S.plots.forEach(p => { if (p.grow >= 2) harvest(p, true); });
        }
      }
    } else if (S.game === 'mole') {
      S.moleT = (S.moleT || 0) - dt;
      if (S.moleT <= 0) {
        const free = S.holes.filter(h => !h.up);
        if (free.length) {
          const h = CC.pick(free);
          h.up = true; h.bug = Math.random() < 0.3;
          h.life = CC.rand(0.8, 1.35);
          h.hit = false; h.rise = 0;
          S.moleT = CC.rand(0.42, 0.72);
        } else S.moleT = 0.2;
      }
      S.holes.forEach(h => {
        if (h.up) {
          h.rise = Math.min(1, (h.rise || 0) + dt * 7);
          if (!h.hit) { h.life -= dt; if (h.life <= 0) { h.up = false; S.combo = 0; } }
        } else if (h.hit) { h.rise = Math.max(0, (h.rise || 0) - dt * 6); if (h.rise <= 0) h.hit = false; }
      });
    } else if (S.game === 'star') {
      S.spawnT = (S.spawnT || 0) - dt;
      if (S.spawnT <= 0) {
        S.spawnT = CC.rand(0.34, 0.55);
        const r = Math.random();
        S.items.push({
          x: CC.rand(34, W - 34), y: -24, vy: CC.rand(105, 180),
          kind: r < 0.16 ? 'bomb' : (r < 0.52 ? 'star' : 'apple'),
          rot: CC.rand(-0.3, 0.3), spin: CC.rand(-2.6, 2.6), dead: false
        });
      }
      /* 바구니 부드럽게 */
      const target = CC.clamp(S.basketTarget == null ? S.basket : S.basketTarget, 50, W - 50);
      S.basket = CC.lerp(S.basket, target, Math.min(1, dt * 13));
      S.items.forEach(it => {
        it.y += it.vy * dt;
        it.rot += it.spin * dt;
        if (!it.dead && it.y > H - 74 && it.y < H - 26 && Math.abs(it.x - S.basket) < 48) {
          it.dead = true;
          if (it.kind === 'bomb') {
            S.score = Math.max(0, S.score - 2);
            S.combo = 0;
            CC.sfx.err();
            S.flash = 0.3;
            popup(it.x, it.y, '-2', '#EF6A4C');
          } else {
            const add = it.kind === 'star' ? 3 : 1;
            S.combo++;
            S.comboBest = Math.max(S.comboBest, S.combo);
            S.score += add + (S.combo > 2 ? 1 : 0);
            CC.sfx.pop();
            popup(it.x, it.y, '+' + add, '#2E9E78');
          }
        }
      });
      S.items = S.items.filter(it => it.y < H + 40 && !it.dead);
      if (S.flash) S.flash = Math.max(0, S.flash - dt);
    }

    S.popups = (S.popups || []).filter(p => now - p.t0 < 700);
  }

  function popup(x, y, txt, color) {
    if (!S) return;
    S.popups = S.popups || [];
    S.popups.push({ x, y, txt, color: color || '#EF6A4C', t0: CC.now() });
  }

  /* ══════════════════════════════════════════════════════════
     그리기
     ══════════════════════════════════════════════════════════ */
  function draw() {
    if (!ctx || !S) return;
    ctx.clearRect(0, 0, W, H);
    if (S.game === 'rich') drawRich();
    else if (S.game === 'drag') drawDrag();
    else if (S.game === 'draw') drawPad();
    else if (S.game === 'mole') drawMole();
    else if (S.game === 'star') drawStar();

    drawPopups();

    /* 시작 안내 / 카운트다운 */
    if (S.running && S.countdown > 0) {
      const n = Math.ceil(S.countdown - 0.2);
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.fillRect(0, 0, W, H);
      text(n > 0 ? String(n) : 'GO!', W / 2, H / 2, 96, '#FF7A60', 'center', 900);
      ctx.restore();
    } else if (!S.running && !S.over && !S.alive && S.game !== 'draw') {
      drawStartHint();
    }
  }

  function drawStartHint() {
    const g = GAMES.find(x => x.id === S.game);
    const bw = Math.min(420, W - 50), bh = 132;
    const bx = (W - bw) / 2, by = (H - bh) / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.72)';
    ctx.fillRect(0, 0, W, H);
    rr(bx, by, bw, bh, 24, '#FFFFFF', '#FFC85C', 4);
    text(g.ico + ' ' + g.name, W / 2, by + 34, 22, '#3A3350', 'center', 900);
    text('보드나 [게임 시작] 버튼을 누르면 시작해요', W / 2, by + 68, 13, '#8C82A6', 'center', 700);
    const pulse = 1 + Math.sin(CC.now() / 260) * 0.04;
    ctx.save();
    ctx.translate(W / 2, by + 102);
    ctx.scale(pulse, pulse);
    rr(-92, -19, 184, 38, 19, 'rgba(255,201,92,1)', '#C08A1E', 2.5);
    text('▶ 게임 시작!', 0, 1, 17, '#6B4A08', 'center', 900);
    ctx.restore();
    ctx.restore();
  }

  function drawPopups() {
    (S.popups || []).forEach(p => {
      const k = (CC.now() - p.t0) / 700;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - k);
      text(p.txt, p.x, p.y - k * 42, 20, p.color, 'center', 900);
      ctx.restore();
    });
  }

  /* ══════════════════════════════════════════════════════════
     ① 클릭 부자
     ══════════════════════════════════════════════════════════ */
  function plotCount() { return 6 + (S.upgrades ? S.upgrades.land * 2 : 0); }

  function layoutPlots() {
    if (!S) return;
    const n = plotCount();
    const cols = n <= 6 ? 3 : (n <= 12 ? 4 : 5);
    const rows = Math.ceil(n / cols);
    const top = 54, bottom = H - 18;
    const pw = Math.min(190, (W - 40) / cols);
    const ph = Math.min(150, (bottom - top) / rows);
    const old = S.plots || [];
    S.plots = [];
    for (let i = 0; i < n; i++) {
      const cx = i % cols, cy = Math.floor(i / cols);
      S.plots.push({
        x: W / 2 + (cx - (cols - 1) / 2) * pw,
        y: top + ph / 2 + cy * ph,
        w: pw * 0.88, h: ph * 0.84,
        grow: old[i] ? old[i].grow : 0,
        seed: Math.random() * 10, bump: 0
      });
    }
  }

  function initRich() {
    S.plots = [];
    S.coin = S.coin || 0;
    layoutPlots();
    S.upgrades = S.upgrades || { land: 0, water: 0, auto: 0 };
    buildShop();
  }

  function richClick(x, y) {
    for (const p of S.plots) {
      if (Math.abs(x - p.x) < p.w / 2 && Math.abs(y - p.y) < p.h / 2) {
        const step = 1 + (S.upgrades.water ? 1 : 0);
        p.grow = Math.min(4, p.grow + step);
        p.bump = CC.now();
        S.coin++;
        S.score = S.coin;
        CC.sfx.type();
        popup(p.x + CC.rand(-10, 10), p.y - p.h * 0.18, '+1 동전', '#D9A32C');
        if (p.grow >= 4) harvest(p, false);
        paintHud();
        buildShop();
        return;
      }
    }
  }

  function harvest(p, auto) {
    const gained = 10 + (S.upgrades.water ? 4 : 0);
    S.coin += gained;
    S.score = S.coin;
    p.grow = 0;
    p.bump = CC.now();
    popup(p.x, p.y - p.h * 0.3, '+' + gained, '#D9A32C');
    if (!auto) CC.sfx.pop();
    paintHud();
    buildShop();
  }

  function buildShop() {
    if (!root0 || !S) return;
    const shop = root0.querySelector('#m-shop');
    if (!shop) return;
    if (S.game !== 'rich') { shop.style.display = 'none'; return; }
    shop.style.display = 'flex';
    const u = S.upgrades;
    const items = [
      { k: 'land', label: '땅 넓히기 +2칸', cost: 50, max: 6 },
      { k: 'water', label: '물뿌리개 (성장 2배)', cost: 30, max: 1 },
      { k: 'auto', label: '자동 수확기', cost: 80, max: 1 }
    ];
    shop.innerHTML = items.map(it => {
      const owned = u[it.k] >= it.max;
      const afford = S.coin >= it.cost;
      return `<button class="shop-btn" data-u="${it.k}" ${owned ? 'disabled' : ''} style="${!owned && !afford ? 'opacity:.55' : ''}">
        ${owned ? '✓ ' : ''}${it.label} <b>${it.cost}</b>동전</button>`;
    }).join('') +
      `<span style="font-size:10.5px;color:#7C8A6A;align-self:center;font-weight:700">지금 동전 <b style="color:#D9A32C">${S.coin}</b></span>`;
    shop.querySelectorAll('[data-u]').forEach(btn => {
      btn.onclick = () => {
        if (!S) return;
        const it = items.find(x => x.k === btn.dataset.u);
        if (!it) return;
        if (u[it.k] >= it.max) { CC.sfx.err(); return; }
        if (S.coin < it.cost) { CC.sfx.err(); toastOnce('동전이 ' + (it.cost - S.coin) + '개 더 필요해요!'); return; }
        S.coin -= it.cost;
        S.score = S.coin;
        u[it.k]++;
        CC.sfx.pop();
        if (it.k === 'land') layoutPlots();
        paintHud();
        buildShop();
      };
    });
  }
  let toastT = 0;
  function toastOnce(msg) {
    if (CC.now() - toastT < 900) return;
    toastT = CC.now();
    CC.ui.toast(msg, 1600);
  }

  function drawRich() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#EAFBDA'); g.addColorStop(1, '#CDEBB8');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    /* 울타리 */
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.fillRect(0, 44, W, 3);
    text('🌱 화분을 클릭! 새싹 → 꽃 → 열매 → 황금나무', W / 2, 24, 13, '#5E7A4A', 'center', 800);

    (S.plots || []).forEach(p => {
      const grow = p.grow;
      const bump = p.bump ? Math.max(0, 1 - (CC.now() - p.bump) / 220) : 0;
      const pop = 1 + bump * 0.16;
      rr(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 16, '#F8E7C8', 'rgba(180,140,90,.4)', 2.5);
      /* 흙 */
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + p.h * 0.22, p.w * 0.32, p.h * 0.12, 0, 0, TAU);
      ctx.fillStyle = '#C9A173'; ctx.fill();

      ctx.save();
      ctx.translate(p.x, p.y + p.h * 0.16);
      ctx.scale(pop, pop);
      const s = Math.min(1.25, p.w / 120);
      if (grow === 0) {
        /* 씨앗 · 새싹 */
        ctx.beginPath();
        ctx.ellipse(0, -6 * s, 5 * s, 8 * s, 0, 0, TAU);
        ctx.fillStyle = '#7FC96B'; ctx.fill();
        ctx.fillStyle = '#4E9C46';
        ctx.beginPath(); ctx.ellipse(-6 * s, -10 * s, 7 * s, 4 * s, -0.5, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(6 * s, -12 * s, 7 * s, 4 * s, 0.5, 0, TAU); ctx.fill();
      } else if (grow === 1) {
        ctx.strokeStyle = '#4E9C46'; ctx.lineWidth = 5 * s; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26 * s); ctx.stroke();
        ctx.fillStyle = '#7FD07A';
        ctx.beginPath(); ctx.ellipse(-11 * s, -22 * s, 11 * s, 6 * s, -0.4, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(11 * s, -30 * s, 11 * s, 6 * s, 0.4, 0, TAU); ctx.fill();
      } else if (grow === 2) {
        ctx.strokeStyle = '#6E5230'; ctx.lineWidth = 6 * s;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -40 * s); ctx.stroke();
        ctx.fillStyle = '#7CC96B';
        ctx.beginPath(); ctx.arc(0, -48 * s, 20 * s, 0, TAU); ctx.fill();
        ['#FF7A60', '#FFCE4A', '#FF9CC0'].forEach((c, i) => {
          ctx.fillStyle = c;
          ctx.beginPath(); ctx.arc(-11 * s + i * 11 * s, -52 * s + (i % 2) * 9 * s, 5.4 * s, 0, TAU); ctx.fill();
        });
      } else if (grow === 3) {
        ctx.strokeStyle = '#6E5230'; ctx.lineWidth = 7 * s;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -46 * s); ctx.stroke();
        ctx.fillStyle = '#5FB44E';
        ctx.beginPath(); ctx.arc(0, -56 * s, 26 * s, 0, TAU); ctx.fill();
        ctx.fillStyle = '#FF6B5B';
        for (let i = 0; i < 5; i++) {
          const a = i / 5 * TAU;
          ctx.beginPath(); ctx.arc(Math.cos(a) * 16 * s, -56 * s + Math.sin(a) * 16 * s, 5 * s, 0, TAU); ctx.fill();
        }
      } else {
        /* 황금나무 */
        const glow = 0.65 + 0.35 * Math.abs(Math.sin(CC.now() / 240));
        ctx.fillStyle = 'rgba(255,206,74,' + glow + ')';
        ctx.beginPath(); ctx.arc(0, -58 * s, 34 * s, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#C09248'; ctx.lineWidth = 8 * s;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -50 * s); ctx.stroke();
        ctx.fillStyle = '#FFD75E';
        ctx.beginPath(); ctx.arc(0, -62 * s, 24 * s, 0, TAU); ctx.fill();
        emoji('🪙', 0, -62 * s, 22 * s * 1.4);
      }
      ctx.restore();

      /* 성장 단계 점 */
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const dx = p.x - 18 + i * 12, dy = p.y + p.h / 2 - 9;
        ctx.arc(dx, dy, 3.2, 0, TAU);
        ctx.fillStyle = i < grow ? '#FFC85C' : 'rgba(160,140,110,.28)';
        ctx.fill();
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     ② 드래그 짝맞추기
     ══════════════════════════════════════════════════════════ */
  const FRUITS = ['🍎', '🍇', '🍊', '🍌', '🍓', '🍑'];

  function layoutDrag() {
    if (!S) return;
    const slotY = 96;
    const slotR = Math.min(40, (W - 60) / 9);
    const gap = (W - 80) / 4;
    (S.slots || []).forEach((sl, i) => {
      sl.x = 40 + gap * (i + 0.5);
      sl.y = slotY;
      sl.r = slotR;
    });
    const cols = 4;
    (S.items || []).forEach((it, i) => {
      if (it.done) return;
      it.r = Math.min(30, (W - 80) / 10);
      it.hx = W / 2 + ((i % cols) - (cols - 1) / 2) * ((W - 80) / cols);
      it.hy = H - 92 + Math.floor(i / cols) * 62;
      if (!S.drag || S.drag !== it) { it.x = it.hx; it.y = it.hy; }
    });
  }

  function initDrag() {
    const kinds = CC.shuffle(FRUITS).slice(0, 4);
    const slotR = Math.min(40, (W - 60) / 9);
    const gap = (W - 80) / 4;
    S.slots = kinds.map((k, i) => ({
      kind: k, x: 40 + gap * (i + 0.5), y: 96, r: slotR, filled: false
    }));
    const items = [];
    kinds.forEach(k => { items.push(k); items.push(k); });
    S.items = CC.shuffle(items).map((k, i) => ({
      kind: k, x: 0, y: 0, hx: 0, hy: 0, r: 26, done: false, taken: false
    }));
    S.items.sort(() => Math.random() - 0.5);
    S.placed = 0;
    S.drag = null;
    S.combo = 0;
    layoutDrag();
  }

  function dragDown(x, y) {
    /* 집어 둔 조각이 있으면 이번 탭은 '놓기' */
    if (S.drag && S.tapMode) { dropDrag(x, y); return; }
    let best = null, bd = 1e9;
    S.items.forEach(it => {
      if (it.done || it.taken) return;
      const d = Math.hypot(x - it.x, y - it.y);
      if (d < it.r + 16 && d < bd) { bd = d; best = it; }
    });
    if (best) {
      S.drag = best;
      best.taken = true;
      best.x = x; best.y = y;
      S.downX = x; S.downY = y;
      S.tapMode = false;
      CC.sfx.type();
    }
  }

  function dropDrag(px, py) {
    const it = S.drag;
    S.drag = null;
    S.tapMode = false;
    if (!it) return;
    if (px != null) { it.x = px; it.y = py; }
    /* 가장 가까운 빈 칸 찾기 (관대한 판정) */
    let best = null, bd = 1e9;
    (S.slots || []).forEach(sl => {
      if (sl.filled) return;
      const d = Math.hypot(it.x - sl.x, it.y - sl.y);
      if (d < bd) { bd = d; best = sl; }
    });
    if (best && bd < best.r + 46) {
      if (best.kind === it.kind) {
        best.filled = true;
        it.done = true;
        it.taken = false;
        S.placed++;
        S.combo++;
        S.comboBest = Math.max(S.comboBest, S.combo);
        S.score += 5 + Math.min(10, S.combo * 2);
        CC.sfx.pop();
        popup(best.x, best.y - 46, '+' + (5 + Math.min(10, S.combo * 2)), '#2E9E78');
        if (S.placed >= S.slots.length) {
          S.score += 15;
          popup(W / 2, H / 2, '판 클리어 +15!', '#D9A32C');
          CC.sfx.cheer();
          setTimeout(() => { if (S && S.running && S.game === 'drag') initDrag(); }, 320);
        }
        paintHud();
        return;
      }
      S.score = Math.max(0, S.score - 1);
      S.combo = 0;
      CC.sfx.err();
    } else {
      S.combo = 0;
    }
    it.taken = false;
    it.x = it.hx;
    it.y = it.hy;
    paintHud();
  }

  function slotTopHintY() { return (S.slots && S.slots[0] ? S.slots[0].y + S.slots[0].r + 30 : 150); }

  function drawDrag() {
    ctx.fillStyle = '#F4FBEE';
    ctx.fillRect(0, 0, W, H);
    text('같은 그림 칸으로 끌어다 놓아요!', W / 2, 30, 14, '#6C7A5C', 'center', 800);

    (S.slots || []).forEach((sl, i) => {
      rr(sl.x - sl.r, sl.y - sl.r, sl.r * 2, sl.r * 2, 18,
        sl.filled ? '#E4FBEF' : '#FFFFFF',
        sl.filled ? '#57C79A' : 'rgba(170,160,195,.5)', sl.filled ? 3.5 : 2.5);
      if (sl.filled) emoji(sl.kind, sl.x, sl.y, sl.r * 1.15);
      else {
        ctx.save(); ctx.globalAlpha = 0.25;
        emoji(sl.kind, sl.x, sl.y, sl.r * 1.0);
        ctx.restore();
        text(String(i + 1), sl.x, sl.y + sl.r + 12, 11, '#B3A6C6');
      }
    });

    /* 트레이 */
    rr(24, H - 138, W - 48, 128, 20, 'rgba(255,255,255,.72)');
    (S.items || []).forEach(it => {
      if (it.done) return;
      const isDrag = S.drag === it;
      const x = isDrag ? it.x : it.hx;
      const y = isDrag ? it.y : it.hy;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, it.r + (isDrag ? 4 : 0), 0, TAU);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(120,100,80,.22)';
      ctx.shadowBlur = isDrag ? 16 : 7;
      ctx.shadowOffsetY = 3;
      ctx.fill();
      ctx.restore();
      emoji(it.kind, x, y, it.r * 1.25);
      if (isDrag && S.tapMode) {
        const t = (CC.now() % 1000) / 1000;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,120,90,' + (0.9 - 0.6 * t) + ')';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.arc(x, y, it.r + 10 + t * 8, 0, TAU); ctx.stroke();
        ctx.restore();
      }
    });
    if (S.drag && S.tapMode) text('이제 같은 그림 칸을 눌러요!', W / 2, slotTopHintY(), 12, '#E4762B', 'center', 800);
    if (S.combo > 1) text(S.combo + ' 콤보!', W - 70, 30, 15, '#EF6A4C', 'center', 900);
  }

  /* ══════════════════════════════════════════════════════════
     ③ 내가 그리는 AI
     ══════════════════════════════════════════════════════════ */
  const COLORS = ['#FF7A60', '#FFCE4A', '#7FE3C0', '#8FD3FF', '#BDA9FF', '#FF9CC0', '#5B5B72'];

  function initDraw() {
    S.drawing = false; S.lastPt = null; S.alive = false;
    if (!root0) return;
    const area = root0.querySelector('#m-area');
    let bar = area.querySelector('.draw-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'draw-bar';
      bar.innerHTML = COLORS.map(c => `<button data-c="${c}" style="background:${c}"></button>`).join('') +
        `<button data-c="erase" class="db-opt">지우개</button>
         <button data-c="clear" class="db-opt">다 지우기</button>
         <button data-c="alive" class="db-alive">살아 움직여!</button>`;
      area.appendChild(bar);
      bar.addEventListener('click', (e) => {
        const b = e.target.closest('[data-c]');
        if (!b || !S) return;
        const v = b.dataset.c;
        CC.sfx.click();
        if (v === 'erase') { S.brush = 'erase'; markBrush(bar, b); }
        else if (v === 'clear') { S.strokes = []; S.alive = false; S.drawing = false; }
        else if (v === 'alive') { makeAlive(); }
        else { S.brush = v; markBrush(bar, b); }
      });
    }
    bar.style.display = 'flex';
    S.strokes = S.strokes || [];
  }
  function markBrush(bar, btn) {
    bar.querySelectorAll('button').forEach(b => b.classList.remove('on'));
    if (btn) btn.classList.add('on');
  }

  function strokeStart(x, y) {
    if (!S) return;
    if (S.brush === 'erase') { eraseAt(x, y); S.lastPt = { x, y }; return; }
    S.strokes.push({ color: S.brush, size: S.brushSize, pts: [{ x, y }] });
    S.lastPt = { x, y };
    S.alive = false;
  }
  function strokeMove(x, y) {
    if (!S) return;
    if (S.brush === 'erase') { eraseAt(x, y); S.lastPt = { x, y }; return; }
    const cur = S.strokes[S.strokes.length - 1];
    if (!cur) { strokeStart(x, y); return; }
    const lp = S.lastPt || { x, y };
    if (Math.hypot(x - lp.x, y - lp.y) < 2.2) return;
    /* 중간점 보간으로 부드럽게 */
    cur.pts.push({ x: (lp.x + x) / 2, y: (lp.y + y) / 2 });
    cur.pts.push({ x, y });
    S.lastPt = { x, y };
  }
  function eraseAt(x, y) {
    S.strokes = S.strokes.filter(st => !st.pts.some(p => Math.hypot(p.x - x, p.y - y) < 24));
    S.alive = false;
  }

  function makeAlive() {
    if (!S || !S.strokes.length) { CC.sfx.err(); if (S) popup(W / 2, H / 2, '먼저 그림을 그려요!', '#EF6A4C'); return; }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    S.strokes.forEach(st => st.pts.forEach(p => {
      x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y);
      x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
    }));
    const w = Math.max(30, x1 - x0), h = Math.max(30, y1 - y0);
    S.bbox = { x0, y0, x1, y1, w, h };
    S.alive = true;
    S.aliveT = 0;
    S.aliveDir = 1;
    S.px = W * 0.28;
    S.py = H * 0.42;
    S.score++;
    S.happy = CC.now();
    paintHud();
    CC.sfx.cheer();
    popup(W / 2, H * 0.22, '내 그림이 살아났어요!', '#D9A32C');
  }

  function drawPad() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#FBF7FF');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    /* 모눈 */
    ctx.strokeStyle = '#F1EAF8'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 26) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 26) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    if (S.alive && S.bbox) { drawAlive(); return; }

    S.strokes.forEach(st => drawStroke(st));
    if (!S.strokes.length) {
      text('여기에 캐릭터를 그려 보세요', W / 2, H / 2, 19, '#C6BBD4', 'center', 800);
      text('다 그린 뒤 [살아 움직여!] 를 누르면 걸어다녀요', W / 2, H / 2 + 30, 13, '#D6CCE2', 'center', 700);
    }
  }

  function drawStroke(st, alpha) {
    ctx.save();
    if (alpha != null) ctx.globalAlpha = alpha;
    ctx.strokeStyle = st.color;
    ctx.lineWidth = st.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    st.pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    if (st.pts.length === 1) {
      ctx.arc(st.pts[0].x, st.pts[0].y, st.size / 2, 0, TAU);
      ctx.fillStyle = st.color; ctx.fill();
    } else ctx.stroke();
    ctx.restore();
  }

  function drawAlive() {
    const b = S.bbox;
    const t = S.aliveT;
    const scale = Math.min(2.2, Math.max(1.1, 120 / Math.max(b.w, b.h)));
    const walk = Math.sin(t * 2.4) * (W * 0.18);
    const cx = W / 2 + walk;
    const groundY = H - 70;
    const bob = Math.abs(Math.sin(t * 4.4)) * -14;
    const squash = 1 + Math.sin(t * 4.4) * 0.05;
    /* 무대 */
    const gy = ctx.createLinearGradient(0, H - 90, 0, H);
    gy.addColorStop(0, '#FFF6E8'); gy.addColorStop(1, '#FFE9C8');
    ctx.fillStyle = gy;
    ctx.fillRect(0, H - 90, W, 90);
    ctx.beginPath();
    ctx.ellipse(cx, groundY + 8, 74, 15, 0, 0, TAU);
    ctx.fillStyle = 'rgba(180,150,110,.18)'; ctx.fill();

    const bodyH = b.h * scale;
    const bodyW = b.w * scale;
    const cy = groundY - bodyH * 0.5 + bob;

    /* 팔 (춤) */
    ctx.strokeStyle = '#8C82A6';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    [-1, 1].forEach(s => {
      const sway = Math.sin(t * 6 + (s > 0 ? 0 : Math.PI)) * 14;
      ctx.beginPath();
      ctx.moveTo(cx + s * bodyW * 0.46, cy - bodyH * 0.18);
      ctx.quadraticCurveTo(
        cx + s * (bodyW * 0.72), cy - bodyH * 0.34 + sway,
        cx + s * (bodyW * 0.86), cy - bodyH * 0.52 + sway * 0.6
      );
      ctx.stroke();
    });
    /* 다리 */
    [-1, 1].forEach(s => {
      const step = Math.sin(t * 6 + (s > 0 ? 0 : Math.PI)) * 12;
      ctx.beginPath();
      ctx.moveTo(cx + s * bodyW * 0.20, cy + bodyH * 0.42);
      ctx.quadraticCurveTo(
        cx + s * bodyW * 0.28 + step * 0.4, cy + bodyH * 0.70,
        cx + s * bodyW * 0.30 + step, groundY + 2
      );
      ctx.stroke();
    });
    /* 신발 */
    [-1, 1].forEach(s => {
      const step = Math.sin(t * 6 + (s > 0 ? 0 : Math.PI)) * 12;
      ctx.beginPath();
      ctx.ellipse(cx + s * bodyW * 0.30 + step, groundY + 4, 12, 6, 0, 0, TAU);
      ctx.fillStyle = '#FF7A60'; ctx.fill();
    });
    /* 그린 그림 */
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale * squash);
    ctx.translate(-(b.x0 + b.x1) / 2, -(b.y0 + b.y1) / 2);
    S.strokes.forEach(st => drawStroke(st));
    ctx.restore();

    /* 반짝이 */
    for (let i = 0; i < 5; i++) {
      const a = t * 2 + i * 1.4;
      const sx = cx + Math.cos(a) * (bodyW * 0.8 + 12);
      const sy = cy + Math.sin(a * 1.3) * (bodyH * 0.5 + 8);
      ctx.fillStyle = 'rgba(255,206,74,.9)';
      ctx.fillRect(sx - 3, sy - 3, 6, 6);
    }
    text('내 그림이 걸어다녀요! 🎵', W / 2, 26, 15, '#8C82A6', 'center', 800);
    text('다시 그리려면 [다 지우기] 를 눌러요', W / 2, H - 14, 11, '#B3A6C6', 'center', 700);
  }

  /* ══════════════════════════════════════════════════════════
     ④ 두더지 & 버그 잡기
     ══════════════════════════════════════════════════════════ */
  function layoutHoles() {
    if (!S || !S.holes) return;
    const cols = 3, rows = 3;
    const cw = W / cols, chh = (H - 30) / rows;
    S.holes.forEach((h, i) => {
      h.x = cw * (i % cols + 0.5);
      h.y = 24 + chh * (Math.floor(i / cols) + 0.55);
    });
  }

  function initMole() {
    S.holes = [];
    for (let i = 0; i < 9; i++) {
      S.holes.push({ x: 0, y: 0, up: false, bug: false, life: 0, hit: false, rise: 0 });
    }
    S.moleT = 0.3;
    S.combo = 0;
    layoutHoles();
  }

  function moleClick(x, y) {
    let hitAny = false;
    S.holes.forEach(h => {
      if (!h.up || h.hit) return;
      if (Math.hypot(x - h.x, y - h.y) < 52) {
        h.hit = true;
        h.up = false;
        S.combo++;
        S.comboBest = Math.max(S.comboBest, S.combo);
        const base = h.bug ? 2 : 1;
        const bonus = S.combo >= 3 ? 1 : 0;
        S.score += base + bonus;
        CC.sfx.pop();
        popup(h.x, h.y - 30, '+' + (base + bonus), h.bug ? '#2E9E78' : '#EF6A4C');
        hitAny = true;
        paintHud();
      }
    });
    if (!hitAny) S.combo = 0;
    S.missT = hitAny ? 0 : 1;
  }

  function drawMole() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#EAF9E6'); g.addColorStop(1, '#CDEBBE');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    (S.holes || []).forEach(h => {
      ctx.beginPath();
      ctx.ellipse(h.x, h.y + 14, 48, 19, 0, 0, TAU);
      ctx.fillStyle = '#C9A173'; ctx.fill();
      ctx.beginPath();
      ctx.ellipse(h.x, h.y + 11, 35, 12, 0, 0, TAU);
      ctx.fillStyle = '#8A6A3A'; ctx.fill();
      if (h.up || (h.rise || 0) > 0) {
        const r = h.rise || 0;
        ctx.save();
        ctx.translate(h.x, h.y + 8 - r * 34);
        ctx.beginPath();
        ctx.ellipse(0, 0, 30, 28, 0, 0, TAU);
        ctx.fillStyle = h.bug ? '#8FD07A' : '#B98A5E';
        ctx.fill();
        ctx.strokeStyle = 'rgba(80,60,40,.35)'; ctx.lineWidth = 2; ctx.stroke();
        emoji(h.bug ? '🐛' : '🐹', 0, 1, 30);
        ctx.restore();
      }
    });
    text(S.running ? '두더지 🐹 1점 · 버그 🐛 2점 — 콤보 보너스!' : '보드를 누르면 두더지가 나와요!', W / 2, 18, 13, '#4E7C41', 'center', 800);
    if (S.combo > 1) text(S.combo + ' 콤보', W - 60, 26, 15, '#EF6A4C', 'center', 900);
    /* 망치 커서 */
    if (S.hover && S.running) {
      ctx.save();
      ctx.translate(S.mx, S.my);
      ctx.rotate(-0.4);
      ctx.fillStyle = '#C08A1E';
      ctx.fillRect(-3, 0, 6, 26);
      ctx.fillStyle = '#FFCE4A';
      ctx.fillRect(-14, -12, 28, 14);
      ctx.strokeStyle = '#8A5C10'; ctx.lineWidth = 2;
      ctx.strokeRect(-14, -12, 28, 14);
      ctx.restore();
    }
  }

  /* ══════════════════════════════════════════════════════════
     ⑤ 별 받기
     ══════════════════════════════════════════════════════════ */
  function initStar() {
    S.items = [];
    S.basket = W / 2;
    S.basketTarget = W / 2;
    S.spawnT = 0.15;
    S.flash = 0;
    S.combo = 0;
  }

  function drawStar() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#D9F1FF'); g.addColorStop(0.7, '#EAFBE8'); g.addColorStop(1, '#DDF6C8');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    /* 달 */
    ctx.beginPath(); ctx.arc(W - 60, 52, 26, 0, TAU);
    ctx.fillStyle = 'rgba(255,233,168,.9)'; ctx.fill();

    (S.items || []).forEach(it => {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);
      emoji(it.kind === 'star' ? '⭐' : (it.kind === 'apple' ? '🍎' : '💣'), 0, 0, it.kind === 'star' ? 30 : 28);
      ctx.restore();
    });

    const bx = S.basket == null ? W / 2 : S.basket;
    /* 바구니 */
    ctx.save();
    ctx.translate(bx, H - 52);
    ctx.beginPath();
    ctx.moveTo(-48, 0); ctx.lineTo(48, 0); ctx.lineTo(36, 36); ctx.lineTo(-36, 36);
    ctx.closePath();
    ctx.fillStyle = '#D9A05B'; ctx.fill();
    ctx.strokeStyle = '#A9773C'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, 48, 9, 0, 0, TAU);
    ctx.fillStyle = '#F0BE80'; ctx.fill();
    ctx.strokeStyle = '#A9773C'; ctx.lineWidth = 2.5; ctx.stroke();
    /* 손잡이 */
    ctx.beginPath();
    ctx.arc(0, -2, 30, Math.PI * 1.08, Math.PI * 1.92);
    ctx.strokeStyle = '#C08A3E'; ctx.lineWidth = 6; ctx.stroke();
    ctx.restore();

    /* 잔디 */
    ctx.fillStyle = '#B7E184';
    ctx.fillRect(0, H - 16, W, 16);
    text('마우스를 좌우로! 별 3점 · 사과 1점 · 폭탄은 피해요', W / 2, 20, 13, '#3E6E33', 'center', 800);
    if (S.combo > 2) text(S.combo + ' 콤보!', W / 2, 44, 14, '#E4762B', 'center', 900);
    if (S.flash) {
      ctx.fillStyle = 'rgba(255,120,96,' + Math.min(0.45, S.flash * 1.2) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  M._state = () => S;
})();
