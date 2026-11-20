/* ══════════════════════════════════════════════════════════════
   player.js — 플레이어 모델 · 이동 · 충돌 · 착석 (v3 좌표)
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CC = window.CC;
  const P = (CC.player = {});

  const R_BODY = 16;
  const SPEED = 230;
  const BOUND = { x0: 46, x1: CC.W - 46, y0: 566, y1: CC.H - 14 };

  P.make = function (o) {
    const seat = o.num ? CC.seat(o.num) : null;
    return {
      id: o.id || CC.uid(),
      num: o.num || 0,
      name: o.name || '친구',
      teacher: !!o.teacher,
      v: CC.avatar.norm(o.v),
      x: o.x != null ? o.x : (seat ? seat.x : 700),
      y: o.y != null ? o.y : (seat ? seat.y : 700),
      seatRow: o.seated === false ? null : (seat && !o.teacher ? seat.row : null),
      seated: !!(seat && !o.teacher && o.seated !== false),
      pose: o.teacher ? 'stand' : (seat ? 'sit' : 'stand'),
      dir: 'front',
      walk: 0,
      speed: SPEED,
      target: null,
      onArrive: null,
      anim: null,
      bubble: null,
      showName: false,
      isMe: !!o.isMe
    };
  };

  P.sit = function (p, seat) {
    if (!seat) return;
    p.x = seat.x;
    p.y = seat.y;
    p.seatRow = seat.row;
    p.seated = true;
    p.pose = 'sit';
    p.target = null;
    p.onArrive = null;
    p.path = null;
  };

  P.stand = function (p) {
    if (!p.seated) return;
    p.seated = false;
    p.seatRow = null;
    p.pose = 'stand';
    p.x = CC.clamp(p.x, BOUND.x0, BOUND.x1);
    p.y = CC.clamp(p.y + 30, BOUND.y0, BOUND.y1);
  };

  P.walkTo = function (p, x, y, onArrive) {
    if (p.seated) P.stand(p);
    const tx = CC.clamp(x, BOUND.x0, BOUND.x1);
    const ty = CC.clamp(y, BOUND.y0, BOUND.y1);
    const path = findPath(p.x, p.y, tx, ty);
    p.path = path && path.length ? path : null;
    p.onArrive = onArrive || null;
    if (p.path) p.target = p.path.shift();
    else p.target = { x: tx, y: ty };
  };

  /* ══════════════════════════════════════════════════════════
     길찾기 — 24px 격자 A*
     ══════════════════════════════════════════════════════════ */
  const CELL = 24;
  const GW = Math.ceil(CC.W / CELL) + 2;
  const GH = Math.ceil(CC.H / CELL) + 2;
  let grid = null;

  function buildGrid() {
    grid = new Uint8Array(GW * GH).fill(1);
    deskBoxes().forEach(b => {
      const pad = R_BODY - 8;
      const x0 = Math.floor((b.x0 - pad) / CELL), x1 = Math.ceil((b.x1 + pad) / CELL);
      const y0 = Math.floor((b.y0 - pad) / CELL), y1 = Math.ceil((b.y1 + pad) / CELL);
      for (let gy = Math.max(0, y0); gy <= Math.min(GH - 1, y1); gy++) {
        for (let gx = Math.max(0, x0); gx <= Math.min(GW - 1, x1); gx++) grid[gy * GW + gx] = 0;
      }
    });
    for (let gy = 0; gy < GH; gy++) {
      const cy = gy * CELL + CELL / 2;
      for (let gx = 0; gx < GW; gx++) {
        const cx = gx * CELL + CELL / 2;
        if (cx < BOUND.x0 || cx > BOUND.x1 || cy < BOUND.y0 || cy > BOUND.y1) grid[gy * GW + gx] = 0;
      }
    }
  }
  function cellFree(gx, gy) {
    if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) return false;
    return grid[gy * GW + gx] === 1;
  }
  function nearestFree(gx, gy) {
    if (cellFree(gx, gy)) return { gx, gy };
    for (let r = 1; r < 14; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          if (cellFree(gx + dx, gy + dy)) return { gx: gx + dx, gy: gy + dy };
        }
      }
    }
    return null;
  }

  function findPath(sx, sy, tx, ty) {
    if (!grid) buildGrid();
    const a = nearestFree(Math.floor(sx / CELL), Math.floor(sy / CELL));
    const b = nearestFree(Math.floor(tx / CELL), Math.floor(ty / CELL));
    if (!a || !b) return null;
    if (a.gx === b.gx && a.gy === b.gy) return [];
    const N = GW * GH;
    const gScore = new Float32Array(N).fill(Infinity);
    const came = new Int32Array(N).fill(-1);
    const open = [];
    const key = (gx, gy) => gy * GW + gx;
    const h = (gx, gy) => Math.hypot(gx - b.gx, gy - b.gy);
    const start = key(a.gx, a.gy), goal = key(b.gx, b.gy);
    gScore[start] = 0;
    open.push({ k: start, f: h(a.gx, a.gy) });
    const closed = new Uint8Array(N);
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    let guard = 0;
    while (open.length && guard++ < 26000) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      const cur = open.splice(bi, 1)[0];
      if (cur.k === goal) break;
      if (closed[cur.k]) continue;
      closed[cur.k] = 1;
      const cx = cur.k % GW, cy = Math.floor(cur.k / GW);
      for (let d = 0; d < DIRS.length; d++) {
        const nx = cx + DIRS[d][0], ny = cy + DIRS[d][1];
        if (!cellFree(nx, ny)) continue;
        if (d >= 4 && (!cellFree(cx + DIRS[d][0], cy) || !cellFree(cx, cy + DIRS[d][1]))) continue;
        const nk = key(nx, ny);
        if (closed[nk]) continue;
        const step = d >= 4 ? 1.4142 : 1;
        const ng = gScore[cur.k] + step;
        if (ng < gScore[nk]) {
          gScore[nk] = ng;
          came[nk] = cur.k;
          open.push({ k: nk, f: ng + h(nx, ny) });
        }
      }
    }
    if (came[goal] < 0 && start !== goal) return null;
    const cells = [];
    let k = goal;
    while (k !== start && k >= 0) { cells.push(k); k = came[k]; }
    cells.reverse();
    const pts = cells.map(kk => ({
      x: (kk % GW) * CELL + CELL / 2,
      y: Math.floor(kk / GW) * CELL + CELL / 2
    }));
    pts.push({ x: tx, y: ty });
    pts.unshift({ x: sx, y: sy });
    const out = [];
    let cur = 0;
    while (cur < pts.length - 1) {
      let j = pts.length - 1;
      for (; j > cur + 1; j--) if (losClear(pts[cur].x, pts[cur].y, pts[j].x, pts[j].y)) break;
      out.push(pts[j]);
      cur = j;
    }
    if (!out.length) out.push(pts[pts.length - 1]);
    return out;
  }

  function losClear(x0, y0, x1, y1) {
    const d = Math.hypot(x1 - x0, y1 - y0);
    if (d < 1) return true;
    const steps = Math.ceil(d / 10);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (t * d < 34) continue;
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      if (!cellFree(Math.floor(x / CELL), Math.floor(y / CELL))) return false;
    }
    return true;
  }

  P.rebuildGrid = function () { grid = null; buildGrid(); };

  P.bubble = function (p, text, ttl, size) {
    p.bubble = { text, life: 0, ttl: ttl || 2.4, size: size || 15 };
  };

  P.animate = function (p, type, dur) {
    p.anim = { type, life: 0, dur: dur || 1.1 };
  };

  /* ── 충돌 박스 (책상) ──────────────────────────────────── */
  let boxes = null;
  function deskBoxes() {
    if (boxes) return boxes;
    boxes = CC.SEATS.map(s => {
      const w = 66 * s.s;
      const y1 = s.y - 22 * s.s;
      const y0 = y1 - 86 * s.s;
      return { x0: s.x - w, x1: s.x + w, y0, y1 };
    });
    return boxes;
  }
  P.refreshBoxes = function () { boxes = null; grid = null; };

  function resolveCircle(p) {
    const bx = deskBoxes();
    for (let i = 0; i < bx.length; i++) {
      const b = bx[i];
      if (p.x + R_BODY < b.x0 || p.x - R_BODY > b.x1 || p.y + R_BODY < b.y0 || p.y - R_BODY > b.y1) continue;
      const cx = CC.clamp(p.x, b.x0, b.x1);
      const cy = CC.clamp(p.y, b.y0, b.y1);
      const dx = p.x - cx, dy = p.y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 > R_BODY * R_BODY) continue;
      if (d2 > 0.001) {
        const d = Math.sqrt(d2);
        p.x = cx + (dx / d) * (R_BODY + 0.5);
        p.y = cy + (dy / d) * (R_BODY + 0.5);
      } else {
        const l = p.x - b.x0, r = b.x1 - p.x, t = p.y - b.y0, bo = b.y1 - p.y;
        const m = Math.min(l, r, t, bo);
        if (m === l) p.x = b.x0 - R_BODY - 0.5;
        else if (m === r) p.x = b.x1 + R_BODY + 0.5;
        else if (m === t) p.y = b.y0 - R_BODY - 0.5;
        else p.y = b.y1 + R_BODY + 0.5;
      }
    }
    p.x = CC.clamp(p.x, BOUND.x0, BOUND.x1);
    p.y = CC.clamp(p.y, BOUND.y0, BOUND.y1);
  }

  /* ── 업데이트 ─────────────────────────────────────────── */
  P.update = function (p, dt) {
    if (p.bubble) {
      p.bubble.life += dt;
      if (p.bubble.life > p.bubble.ttl) p.bubble = null;
    }
    if (p.anim) {
      p.anim.life += dt;
      if (p.anim.life >= p.anim.dur) p.anim = null;
    }

    if (p.target) {
      const dx = p.target.x - p.x, dy = p.target.y - p.y;
      const dist = Math.hypot(dx, dy);
      const step = p.speed * dt;
      if (dist <= step || dist < 3) {
        p.x = p.target.x; p.y = p.target.y;
        if (p.path && p.path.length) {
          p.target = p.path.shift();
        } else {
          const cb = p.onArrive;
          p.target = null; p.onArrive = null; p.path = null;
          if (cb) cb();
        }
      } else {
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;
        p.walk = Math.sin(CC.now() / 95) * 1;
        p.dir = dy < -6 ? 'back' : 'front';
      }
      if (!p.seated) resolveCircle(p);
    } else {
      p.walk = 0;
    }

    if (p.seatRow == null) {
      let d = 0;
      for (let i = 0; i < CC.ROW_Y.length; i++) if (CC.ROW_Y[i] < p.y - 8) d++;
      p.depth = d;
    } else {
      p.depth = p.seatRow;
    }
  };

  /* ── 그리기 순서(깊이) 계산 — 원격 친구에게도 써야 서 있는 모습이 그려집니다 ── */
  P.updateDepth = function (p) {
    if (p.seatRow == null) {
      let d = 0;
      for (let i = 0; i < CC.ROW_Y.length; i++) if (CC.ROW_Y[i] < p.y - 8) d++;
      p.depth = d;
    } else {
      p.depth = p.seatRow;
    }
  };

  /* ── WASD 이동 ─────────────────────────────────────────── */
  P.keyMove = function (p, keys, dt) {
    let dx = 0, dy = 0;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (!dx && !dy) return false;

    if (p.seated) P.stand(p);
    p.target = null; p.onArrive = null; p.path = null;
    const len = Math.hypot(dx, dy) || 1;
    const sp = p.speed * 0.85 * dt;
    p.x += (dx / len) * sp;
    p.y += (dy / len) * sp;
    p.dir = dy < 0 ? 'back' : 'front';
    p.walk = Math.sin(CC.now() / 90) * 1;
    resolveCircle(p);
    return true;
  };

  /* 클릭한 지점의 책상 찾기 (가까운 자리 하나) */
  P.deskAt = function (wx, wy) {
    let best = null, bestD = 1e9;
    for (let i = 0; i < CC.SEATS.length; i++) {
      const s = CC.SEATS[i];
      const w = 82 * s.s;
      if (wx > s.x - w && wx < s.x + w && wy > s.y - 190 * s.s && wy < s.y + 16) {
        const d = Math.hypot((wx - s.x) / 1.4, wy - (s.y - 70 * s.s));
        if (d < bestD) { bestD = d; best = s; }
      }
    }
    return best;
  };

  P.BOUND = BOUND;
})();
