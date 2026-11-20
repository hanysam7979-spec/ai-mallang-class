/* ══════════════════════════════════════════════════════════════
   scene.js — AI 말랑 컴퓨터 교실 v3 (세미 픽셀 교실)
   한 자리 뒤→앞 순서:
     ① 진한 초록 의자  ② 우리 쪽을 보는 학생 앞모습  ③ 책상 + 슬림 LED 모니터 뒷면
   좌석 번호는 화면 아래(앞)가 1~8번, 위(교탁 앞)가 33~36번.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CC = window.CC;
  const C = CC.C;
  const W = CC.W, H = CC.H;
  const S = (CC.scene = {});
  const TAU = Math.PI * 2;

  const F_PIX = '"Galmuri11","Galmuri9","DungGeunMo","Noto Sans KR",sans-serif';
  const F_TXT = '"Galmuri11","Noto Sans KR","Apple SD Gothic Neo",sans-serif';

  /* ── 그리기 도우미 ─────────────────────────────────────── */
  function box(ctx, x, y, w, h, fill, stroke, lw) {
    if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw || 2;
      ctx.strokeRect(x + (lw || 2) / 2, y + (lw || 2) / 2, w - (lw || 2), h - (lw || 2));
    }
  }
  function roundBox(ctx, x, y, w, h, r, fill, stroke, lw) {
    const rad = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, rad);
    else {
      ctx.moveTo(x + rad, y);
      ctx.arcTo(x + w, y, x + w, y + h, rad);
      ctx.arcTo(x + w, y + h, x, y + h, rad);
      ctx.arcTo(x, y + h, x, y, rad);
      ctx.arcTo(x, y, x + w, y, rad);
      ctx.closePath();
    }
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  }
  function txt(ctx, s, x, y, size, color, align, font) {
    ctx.font = `normal ${size}px ${font || F_PIX}`;
    ctx.fillStyle = color || C.ink;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  }
  function wrap(ctx, text, maxW) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let cur = '';
    words.forEach(w => {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = t;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  /* 3×5 도트 숫자 (번호표) */
  const DIGIT = {
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111']
  };
  function dotNum(ctx, str, x, y, px, color) {
    let cx = x;
    for (let i = 0; i < String(str).length; i++) {
      const g = DIGIT[String(str)[i]];
      if (!g) { cx += px * 4; continue; }
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 3; c++) {
          if (g[r][c] === '1') { ctx.fillStyle = color; ctx.fillRect(cx + c * px, y + r * px, px, px); }
        }
      }
      cx += px * 4;
    }
    return cx - x;
  }

  /* ══════════════════════════════════════════════════════════
     자리 구성 비율 (월드 px × 좌석 배율 s)
     ══════════════════════════════════════════════════════════ */
  const SEAT = {
    chairW: 104,        /* 의자 폭 → 높이 = 104×0.98 */
    chairBottom: 14,
    stuH: 140,
    stuBottom: 10,
    deskW: 156,         /* 책상+모니터 폭 → 높이 = 156 / 1.44 */
    deskBottom: 38,
    /* 번호표는 검정 LED 모니터 뒷면 한가운데에 스티커처럼 붙는다.
       모니터 중심 ≈ 책상 스프라이트 위 29% → y - 39×s */
    plateY: -52,
    plateW: 46,
    plateH: 26
  };
  S.SEAT = SEAT;

  S.layers = [];
  S.occupied = null;
  S.meNum = 0;

  function drawPlate(ctx, x, y, s, num, state) {
    const w = SEAT.plateW * s, h = SEAT.plateH * s;
    const rad = Math.min(5 * s, h / 2);
    const fill = state === 'mine' ? '#FF7A60' : (state === 'empty' ? '#D9D2C6' : '#FFFAEC');
    roundBox(ctx, x - w / 2, y - h / 2, w, h, rad, fill, C.ink, Math.max(1.5, 2 * s));
    roundBox(ctx, x - w / 2 + 3 * s, y - h / 2 + 3 * s, w - 6 * s, h - 6 * s, Math.max(1, rad - 2 * s), null,
      state === 'mine' ? '#FFD8CC' : '#FFCE4A', Math.max(1, 1.4 * s));
    const px = Math.max(2, Math.round(3 * s));
    const str = String(num);
    const tw = str.length * 4 * px - px;
    dotNum(ctx, str, x - tw / 2, y - 2.5 * px, px,
      state === 'empty' ? '#8D8478' : (state === 'mine' ? '#FFFFFF' : C.ink));
    if (state === 'mine') {
      const ay = y - h / 2 - 4 * s - Math.sin(CC.now() / 320) * 2 * s;
      ctx.beginPath();
      ctx.moveTo(x - 7 * s, ay);
      ctx.lineTo(x + 7 * s, ay);
      ctx.lineTo(x, ay + 9 * s);
      ctx.closePath();
      ctx.fillStyle = '#FFCE4A';
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = Math.max(1, 1.4 * s);
      ctx.stroke();
    }
  }

  /* 줄 하나를 두 장으로: ① 의자(뒤) ② 책상+번호표(앞) */
  function buildRowLayer(rowIdx) {
    const seats = CC.SEATS.filter(s => s.row === rowIdx);
    const top = Math.min(...seats.map(s => s.y)) - 170 * Math.max(...seats.map(s => s.s));
    const bottom = Math.max(...seats.map(s => s.y)) + 50;

    const mk = () => {
      const cv = document.createElement('canvas');
      cv.width = W;
      cv.height = Math.ceil(bottom - top);
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.translate(0, -top);
      return { canvas: cv, ctx: g };
    };
    const A = mk(), B = mk();

    seats.forEach(seat => {
      const s = seat.s, x = seat.x, y = seat.y;
      const occupied = !S.occupied || S.occupied.has(seat.num);
      const mine = S.meNum === seat.num;

      /* ① 의자 (맨 뒤) */
      CC.art.draw(A.ctx, 'chair', x, y + SEAT.chairBottom * s, {
        h: (SEAT.chairW * s) * (206 / 210)
      });

      /* ② 학생 앞모습 — 레이어에는 '빈자리'만 표시하고, 앉은 사람은 렌더 때 그린다 */
      if (occupied && !S.dynamic) {
        CC.art.draw(A.ctx, CC.art.stuFront(seat.num), x, y + SEAT.stuBottom * s, { h: SEAT.stuH * s });
      }

      /* ③ 책상 + 모니터 뒷면 (맨 앞) */
      CC.art.draw(B.ctx, 'desk', x, y + SEAT.deskBottom * s, {
        h: (SEAT.deskW * s) / 1.4422
      });
      drawPlate(B.ctx, x, y + SEAT.plateY * s, s, seat.num,
        mine ? 'mine' : (occupied ? 'on' : 'empty'));
    });

    return { chair: A, desk: B, top };
  }

  /* occupiedSet: 명단에 있는 번호 / meNum: 내 번호 */
  S.build = function (occupiedSet, meNum, dynamic) {
    if (occupiedSet !== undefined) S.occupied = occupiedSet;
    if (meNum !== undefined) S.meNum = meNum || 0;
    S.dynamic = dynamic !== false;    /* true면 앉은 학생은 실시간으로 그린다 */
    S.layers = [0, 1, 2, 3, 4].map(buildRowLayer);
  };
  S.invalidate = function () { S.layers = []; };

  /* ══════════════════════════════════════════════════════════
     대형 스크린
     ══════════════════════════════════════════════════════════ */
  function drawScreen(ctx, now, st) {
    const b = CC.BOARD || { x: 573, y: 249, w: 366, h: 200 };
    const scr = (st && st.screen) || { mode: 'welcome' };
    const CHALK = '#F2FFE6';
    const CHALK2 = '#FFE9A8';
    ctx.save();
    ctx.beginPath();
    ctx.rect(b.x, b.y, b.w, b.h);
    ctx.clip();

    /* 칠판 지우개 자국 (은은한 분필 얼룩) */
    ctx.globalAlpha = 0.05;
    [[0.25, 0.72, 0.34, 0.10], [0.7, 0.30, 0.24, 0.09], [0.5, 0.9, 0.4, 0.06]].forEach(([fx, fy, fw, fh]) => {
      ctx.beginPath();
      ctx.ellipse(b.x + b.w * fx, b.y + b.h * fy, b.w * fw, b.h * fh, -0.1, 0, TAU);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    /* 칠판 폭에 맞춰 글자 크기 자동 축소 */
    function fitSize(text, maxW, size, font) {
      let s2 = size;
      ctx.font = `normal ${s2}px ${font || F_TXT}`;
      while (s2 > 10 && ctx.measureText(text).width > maxW) {
        s2 -= 1;
        ctx.font = `normal ${s2}px ${font || F_TXT}`;
      }
      return s2;
    }

    function chalk(text, x, y, size, color, font) {
      ctx.font = `normal ${size}px ${font || F_TXT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = color;
      ctx.fillText(text, x + 1, y + 1);
      ctx.globalAlpha = 0.97;
      ctx.fillText(text, x, y);
      ctx.globalAlpha = 1;
    }

    if (scr.mode === 'race' || scr.mode === 'race-wait') {
      /* 분필로 쓴 대결판 */
      chalk('타자 대결', b.x + b.w / 2, b.y + 34, 30, CHALK2);
      box(ctx, b.x + 40, b.y + 52, b.w - 80, 2, 'rgba(255,255,255,.35)');
      if (scr.mode === 'race-wait') {
        ctx.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(now / 380));
        chalk('곧 시작!', b.x + b.w / 2, b.y + b.h / 2 + 6, 46, CHALK);
        ctx.globalAlpha = 1;
        chalk('모두 키보드에 손을 올려요', b.x + b.w / 2, b.y + b.h - 32, 16, CHALK);
      } else if (scr.winner) {
        chalk('1등  ' + scr.winner.name, b.x + b.w / 2, b.y + 96, 40, CHALK);
        chalk((scr.winner.ms / 1000).toFixed(2) + '초 · ' + (scr.winner.cpm || 0) + '타',
          b.x + b.w / 2, b.y + 142, 18, CHALK2);
        (scr.rank || []).slice(1, 3).forEach((r, i) => {
          chalk((i + 2) + '위 ' + r.name, b.x + b.w / 2 + (i ? 90 : -90), b.y + 176, 15, CHALK);
        });
      } else {
        chalk('대결 중...', b.x + b.w / 2, b.y + b.h / 2, 32, CHALK);
      }
    } else if (scr.mode === 'notice') {
      chalk('오늘의 공지', b.x + b.w / 2, b.y + 32, 24, CHALK2);
      box(ctx, b.x + 46, b.y + 48, b.w - 92, 2, 'rgba(255,255,255,.3)');
      ctx.font = `normal 20px ${F_TXT}`;
      const lines = wrap(ctx, scr.notice || '', b.w - 60).slice(0, 4);
      lines.forEach((ln, i) => chalk(ln, b.x + b.w / 2, b.y + 78 + i * 28, 20, CHALK));
    } else {
      /* 기본: 환영 인사 */
      const bob = Math.sin(now / 800) * 1.5;
      const s1 = fitSize('AI 말랑 컴퓨터 교실에', b.w - 40, 27);
      const s2b = fitSize('오신 것을 환영합니다!', b.w - 40, 27);
      chalk('AI 말랑 컴퓨터 교실에', b.x + b.w / 2, b.y + 66 + bob, s1, CHALK);
      chalk('오신 것을 환영합니다!', b.x + b.w / 2, b.y + 66 + s1 + 12 + bob, s2b, CHALK2);
      /* 분필 밑줄 */
      ctx.globalAlpha = 0.7;
      box(ctx, b.x + b.w * 0.22, b.y + 66 + s1 + 12 + s2b + 14 + bob, b.w * 0.56, 2, 'rgba(255,255,255,.42)');
      ctx.globalAlpha = 1;
      ctx.globalAlpha = 1;

      /* 분필 별 */
      [[b.x + 34, b.y + 34], [b.x + b.w - 38, b.y + 150], [b.x + 44, b.y + 152]].forEach(([sx, sy], i) => {
        ctx.globalAlpha = 0.35 + 0.45 * Math.abs(Math.sin(now / 720 + i * 1.3));
        star(ctx, sx, sy, 7, CHALK2);
        ctx.globalAlpha = 1;
      });
    }
    ctx.restore();
  }

  function star(ctx, cx, cy, r, color) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i - Math.PI / 2;
      const rr = i % 2 ? r * 0.42 : r;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  /* ══════════════════════════════════════════════════════════
     말풍선 · 이름표
     ══════════════════════════════════════════════════════════ */
  S.drawBubble = function (ctx, x, y, text, opts) {
    const o = opts || {};
    const size = o.size || 15;
    ctx.font = `normal ${size}px ${F_PIX}`;
    const tw = ctx.measureText(text).width;
    const padX = 10, padY = 7;
    const w = tw + padX * 2, h = size + padY * 2;
    const bx = Math.round(x - w / 2), by = Math.round(y - h);
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.beginPath();
    ctx.moveTo(x - 7, by + h - 2);
    ctx.lineTo(x + 7, by + h - 2);
    ctx.lineTo(x, by + h + 9);
    ctx.closePath();
    ctx.fillStyle = o.bg || '#FFFAEC';
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    box(ctx, bx, by, w, h, o.bg || '#FFFAEC', C.ink, 2);
    ctx.fillStyle = o.color || C.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, by + h / 2 + 1);
    ctx.restore();
  };

  S.drawName = function (ctx, x, y, name, opts) {
    const o = opts || {};
    const size = o.size || 13;
    ctx.font = `normal ${size}px ${F_PIX}`;
    const w = ctx.measureText(name).width + 16;
    const h = size + 10;
    box(ctx, x - w / 2, y - h / 2, w, h, o.bg || '#FFFAEC', C.ink, 2);
    ctx.fillStyle = o.color || C.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x, y + 1);
  };

  /* ══════════════════════════════════════════════════════════
     파티클 · 먼지
     ══════════════════════════════════════════════════════════ */
  S.particles = [];
  S.spawnSparkle = function (x, y, n, opts) {
    const o = opts || {};
    for (let i = 0; i < (n || 14); i++) {
      const a = CC.rand(0, TAU);
      const sp = CC.rand(20, 110);
      S.particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50,
        life: 0, max: CC.rand(0.55, 1.2), r: CC.rand(3, 5),
        color: o.color || CC.pick(['#FFCE4A', '#6EE2B2', '#78CEFF', '#FF9CC0', '#FFFFFF'])
      });
    }
  };
  S.updateParticles = function (dt) {
    for (let i = S.particles.length - 1; i >= 0; i--) {
      const p = S.particles[i];
      p.life += dt;
      if (p.life > p.max) { S.particles.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 150 * dt; p.vx *= 0.98;
    }
  };
  function drawParticles(ctx) {
    S.particles.forEach(p => {
      const t = p.life / p.max;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t * t);
      const r = Math.max(2, p.r * (1 - t * 0.5));
      box(ctx, p.x - r / 2, p.y - r / 2, r, r, p.color);
      ctx.restore();
    });
  }

  const MOTES = [];
  for (let i = 0; i < 24; i++) {
    MOTES.push({ x: CC.rand(880, 1360), y: CC.rand(140, 900), r: CC.rand(2, 4), ph: CC.rand(0, TAU), sp: CC.rand(4, 12) });
  }
  function drawMotes(ctx, now) {
    ctx.save();
    MOTES.forEach(m => {
      const y = m.y - ((now * 0.004 * m.sp) % 70);
      const x = m.x + Math.sin(now / 2400 + m.ph) * 10;
      ctx.globalAlpha = 0.18 + 0.30 * Math.abs(Math.sin(now / 1100 + m.ph));
      box(ctx, x, y, m.r, m.r, '#FFFFFF');
    });
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════
     앉은 학생 (앞모습 · 귀여운 얼굴)
     ══════════════════════════════════════════════════════════ */
  function drawSeated(ctx, p, now) {
    const seat = CC.seat(p.num);
    if (!seat) return;
    const s = seat.s;
    const v = CC.avatar.norm(p.v);
    let bob = Math.sin(now / 1100 + p.num) * 1.2 * s;
    let pose = 'stand';
    if (p.anim && p.anim.life < p.anim.dur) {
      const t = p.anim.life / p.anim.dur;
      if (p.anim.type === 'clap') { pose = 'clap'; bob -= Math.abs(Math.sin(p.anim.life * 14)) * 5 * s; }
      else if (p.anim.type === 'jump') { bob -= Math.sin(t * Math.PI) * 16 * s; }
      else if (p.anim.type === 'hand') { pose = 'raise'; bob -= Math.sin(Math.min(1, t * 5) * Math.PI / 2) * 4 * s; }
      else if (p.anim.type === 'hi') { pose = 'wave'; }
    }
    ctx.save();
    ctx.translate(p.x, p.y + SEAT.stuBottom * s + bob);
    const h = SEAT.stuH * s;
    /* 손 들기 — 머리 옆에 손 */
    if (pose === 'raise' || pose === 'wave') {
      const hx = h * 0.30, hy = -h * 0.60;
      ctx.beginPath();
      ctx.ellipse(hx, hy, h * 0.05, h * 0.058, -0.25, 0, TAU);
      ctx.fillStyle = C.skin;
      ctx.fill();
      ctx.lineWidth = Math.max(1, h * 0.012);
      ctx.strokeStyle = C.skinD;
      ctx.stroke();
    }
    /* 박수 — 책상 위로 두 손 */
    if (pose === 'clap') {
      const d = Math.abs(Math.sin(now / 110)) * h * 0.03;
      [-1, 1].forEach(sgn => {
        ctx.beginPath();
        ctx.ellipse(sgn * (h * 0.17 + d), -h * 0.30, h * 0.042, h * 0.05, 0, 0, TAU);
        ctx.fillStyle = C.skin;
        ctx.fill();
        ctx.strokeStyle = C.skinD;
        ctx.lineWidth = Math.max(1, h * 0.012);
        ctx.stroke();
      });
    }
    CC.art.draw(ctx, CC.art.stuFront(v.sp), 0, 0, { h, anchor: 'bottom' });
    ctx.restore();

    if (p.showName) S.drawName(ctx, p.x, p.y - 150 * s, p.name, { bg: p.isMe ? '#FFF0B8' : '#FFFAEC' });
  }

  /* ══════════════════════════════════════════════════════════
     걷는 사람 · 선생님
     ══════════════════════════════════════════════════════════ */
  function drawWalker(ctx, p, now) {
    const s = scaleAt(p.y);
    let bob = 0, tilt = 0, pose = 'stand', dir = p.dir || 'front';
    if (p.anim && p.anim.life < p.anim.dur) {
      const t = p.anim.life / p.anim.dur;
      if (p.anim.type === 'clap') { pose = 'clap'; bob = -Math.abs(Math.sin(p.anim.life * 16)) * 6 * s; }
      else if (p.anim.type === 'jump') { bob = -Math.sin(t * Math.PI) * 22 * s; }
      else if (p.anim.type === 'hand') { pose = 'raise'; bob = -Math.sin(Math.min(1, t * 5) * Math.PI / 2) * 4 * s; }
      else if (p.anim.type === 'hi') { pose = 'wave'; tilt = Math.sin(p.anim.life * 9) * 0.06; }
    }
    if (p.walk) bob += Math.abs(Math.sin(CC.now() / 110)) * -4 * s;
    CC.avatar.draw(ctx, {
      x: p.x, y: p.y, h: CC.avatar.H * s, v: p.v, pose,
      dir, bob, tilt, shadow: true
    });
    if (p.isMe) {
      const ay = p.y - 150 * s - Math.sin(now / 320) * 5;
      ctx.beginPath();
      ctx.moveTo(p.x - 9, ay);
      ctx.lineTo(p.x + 9, ay);
      ctx.lineTo(p.x, ay + 12);
      ctx.closePath();
      ctx.fillStyle = C.gold;
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (p.showName) S.drawName(ctx, p.x, p.y + 22, p.name, { bg: p.isMe ? '#FFF0B8' : '#FFFAEC' });
  }

  function drawTeacher(ctx, now, t) {
    const bob = Math.sin(now / 900) * 1.5;
    CC.art.shadow(ctx, t.x, t.y + 2, 54, 15, 0.24);
    CC.art.draw(ctx, 'teacher', t.x, t.y + bob, { h: t.h || 160 });
    S.drawName(ctx, t.x, t.y - (t.h || 160) - 13, t.name || '김하늘 선생님',
      { bg: '#FFF0B8', size: 14 });
  }

  function scaleAt(y) {
    return CC.clamp(0.66 + (y - 560) / (1050 - 560) * 0.36, 0.62, 1.1);
  }
  S.scaleAt = scaleAt;

  /* ══════════════════════════════════════════════════════════
     메인 렌더
     ══════════════════════════════════════════════════════════ */
  S.render = function (ctx, now, st) {
    const bg = CC.art.get('bg');
    if (bg) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(bg, 0, 0, W, H);
      ctx.imageSmoothingEnabled = false;
    } else {
      box(ctx, 0, 0, W, H, '#CDE96E');
      txt(ctx, '교실 그림을 불러오는 중…', W / 2, H / 2, 26, C.ink);
    }
    drawMotes(ctx, now);
    drawScreen(ctx, now, st);

    if (!S.layers.length) S.build();

    const players = st.players || [];
    const teacher = st.teacher;
    let tDepth = 0;
    if (teacher) {
      for (let i = 0; i < CC.ROW_Y.length; i++) if (CC.ROW_Y[i] < teacher.y) tDepth++;
    }
    if (teacher && tDepth === 0) drawTeacher(ctx, now, teacher);

    for (let r = 0; r < S.layers.length; r++) {
      const layer = S.layers[r];
      if (layer) ctx.drawImage(layer.chair.canvas, 0, layer.top);

      /* 이 줄에 앉은 사람 — 의자와 책상 사이 */
      players.forEach(p => {
        if (p.seatRow !== r || !p.seated) return;
        drawSeated(ctx, p, now);
      });

      if (layer) ctx.drawImage(layer.desk.canvas, 0, layer.top);

      /* 이 줄과 앞줄 사이를 걷는 사람 */
      players.forEach(p => {
        if (p.seated) return;
        if (p.depth !== r + 1) return;
        drawWalker(ctx, p, now);
      });
      if (teacher && tDepth === r + 1) drawTeacher(ctx, now, teacher);
    }

    players.forEach(p => {
      if (p.seated || p.depth !== 5) return;
      drawWalker(ctx, p, now);
    });

    /* 말풍선 */
    players.forEach(p => {
      if (!p.bubble || !p.bubble.text) return;
      const b = p.bubble;
      const alpha = CC.clamp(b.life / 0.18, 0, 1) * CC.clamp((b.ttl - b.life) / 0.3, 0, 1);
      if (alpha <= 0) return;
      const yy = p.y - (p.seated ? 168 : 150) + (b.life < 0.18 ? (0.18 - b.life) * 40 : 0);
      S.drawBubble(ctx, p.x, yy, b.text, { alpha, size: b.size || 15 });
    });

    drawParticles(ctx);

    const vg = ctx.createRadialGradient(700, 560, 380, 700, 560, 900);
    vg.addColorStop(0, 'rgba(40,20,60,0)');
    vg.addColorStop(1, 'rgba(30,14,50,.14)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  };

  S.hitPlayer = function (wx, wy, players) {
    let best = null, bestD = 1e9;
    players.forEach(p => {
      const s = p.seated ? 1 : scaleAt(p.y);
      const dx = Math.abs(wx - p.x), dy = wy - (p.y - 60 * s);
      if (dx < 34 * s && Math.abs(dy) < 64 * s) {
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = p; }
      }
    });
    return best;
  };
})();
