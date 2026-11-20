/* ══════════════════════════════════════════════════════════════
   avatar.js — v3 아바타 = 세미 픽셀 스프라이트(stu01~08_front/back)
   · 서 있을 때: 앞모습 / 위로 걸어갈 때: 뒷모습
   · 박수 · 인사(손 흔들기) · 손들기 · 점프 모션을 스프라이트 + 효과로
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CC = window.CC;
  const AV = (CC.avatar = {});
  const TAU = Math.PI * 2;

  AV.CHAR_NAMES = ['하늘이', '별이', '솔이', '단비', '누리', '초록이', '보라', '하람'];
  AV.default = function () { return { sp: 3 }; };
  AV.norm = function (v) {
    if (!v) return AV.default();
    let sp = v.sp;
    if (sp == null) {
      /* 예전 값(얼굴·머리·옷·스타일)도 1~8 스프라이트로 옮겨 준다 */
      const h = (v.hair | 0) || 0;
      sp = h + 1;
    }
    sp = CC.clamp(Math.round(sp) || 1, 1, 8);
    return { sp };
  };

  /* ── 기본 크기: 발 기준 높이 150 (월드 px) ───────────────── */
  AV.H = 150;

  AV.draw = function (ctx, o) {
    const v = AV.norm(o.v);
    const pose = o.pose || 'stand';
    const back = o.dir === 'back';
    const h = o.h || AV.H;
    const b = o.bob || 0;

    ctx.save();
    if (o.alpha != null) ctx.globalAlpha = o.alpha;

    if (o.shadow !== false) {
      ART_shadow(ctx, o.x, o.y + 2, h * 0.30, h * 0.09);
    }

    ctx.save();
    ctx.translate(o.x, o.y + b);

    /* 통통 튀는 느낌 — 점프/박수는 살짝 늘리고 줄인다 */
    let sq = 1, rot = 0;
    if (o.tilt) rot = o.tilt;
    if (pose === 'clap') sq = 0.98 + Math.abs(Math.sin(CC.now() / 120)) * 0.04;
    if (pose === 'jump') sq = 1.02;
    ctx.rotate(rot);
    ctx.scale(o.flip ? -1 : 1, sq);

    const key = back ? CC.art.stuBack(v.sp) : CC.art.stuFront(v.sp);
    CC.art.draw(ctx, key, 0, 0, { h: h, anchor: 'bottom' });

    /* 손 들기 — 머리 옆에 손을 살짝 그려 준다 */
    if (pose === 'raise' || pose === 'wave') {
      const hx = h * 0.33, hy = -h * 0.72;
      ctx.beginPath();
      ctx.ellipse(hx, hy, h * 0.055, h * 0.065, -0.3, 0, TAU);
      ctx.fillStyle = CC.C.skin;
      ctx.fill();
      ctx.lineWidth = Math.max(1, h * 0.012);
      ctx.strokeStyle = CC.C.skinD;
      ctx.stroke();
      if (pose === 'wave') {
        const t = Math.sin(CC.now() / 110) * 0.5;
        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate(t);
        ctx.beginPath();
        ctx.ellipse(0, -h * 0.055, h * 0.032, h * 0.05, 0, 0, TAU);
        ctx.fillStyle = CC.C.skin;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
    /* 박수 — 양쪽에 손뼉 */
    if (pose === 'clap') {
      const t = Math.sin(CC.now() / 90);
      const d = h * (0.10 + Math.abs(t) * 0.03);
      [-1, 1].forEach(sgn => {
        ctx.beginPath();
        ctx.ellipse(sgn * (h * 0.20 + d * 0.2), -h * 0.46, h * 0.045, h * 0.055, 0, 0, TAU);
        ctx.fillStyle = CC.C.skin;
        ctx.fill();
        ctx.lineWidth = Math.max(1, h * 0.012);
        ctx.strokeStyle = CC.C.skinD;
        ctx.stroke();
      });
    }
    ctx.restore();
    ctx.restore();
  };

  function ART_shadow(ctx, x, y, rx, ry) {
    if (CC.art && CC.art.shadow) CC.art.shadow(ctx, x, y, rx, ry, 0.24);
  }

  /* ── 미리보기 ──────────────────────────────────────────── */
  AV.paintPreview = function (canvas, v, opts) {
    const o = opts || {};
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || canvas.width || 90;
    const hh = canvas.clientHeight || canvas.height || 110;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(hh * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, hh);
    const H = Math.min(hh * 0.94, w * 2.1);
    AV.draw(ctx, {
      x: w / 2, y: hh * 0.97, h: H, v,
      pose: o.pose || 'stand', dir: o.dir || 'front', shadow: !!o.shadow
    });
  };

  AV.iconCanvas = function (v, w, hh, dir) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = hh;
    cv.style.width = w + 'px';
    cv.style.height = hh + 'px';
    const ctx = cv.getContext('2d');
    const H = Math.min(hh * 0.98, w * 2.2);
    AV.draw(ctx, { x: w / 2, y: hh, h: H, v, dir: dir || 'front', shadow: false });
    return cv;
  };
})();
