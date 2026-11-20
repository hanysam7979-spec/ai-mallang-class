/* ══════════════════════════════════════════════════════════════
   sprites.js — 세미 픽셀 PNG 에셋 로더 + 그리기 도우미
   · assets/ 의 실제 스프라이트를 Image 객체로 읽어 canvas에 그립니다.
   · 배포용 단일 파일 빌드에서는 window.__CC_ASSETS(data URI)를 먼저 씁니다.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CC = window.CC;
  const ART = (CC.art = {});

  const FILES = {
    bg: 'assets/bg_classroom.png',
    desk: 'assets/desk.png',
    chair: 'assets/chair.png',
    teacher: 'assets/teacher_front.png'
  };
  for (let i = 1; i <= 8; i++) {
    FILES['s' + i + 'f'] = 'assets/stu0' + i + '_front.png';
    FILES['s' + i + 'b'] = 'assets/stu0' + i + '_back.png';
  }
  ART.FILES = FILES;
  ART.img = {};
  ART.ready = false;
  const waiters = [];

  ART.onReady = function (fn) {
    if (ART.ready) { try { fn(); } catch (e) {} return; }
    waiters.push(fn);
  };

  ART.load = function () {
    const inline = window.__CC_ASSETS || null;
    const keys = Object.keys(FILES);
    let left = keys.length;
    const done = () => {
      left--;
      if (left > 0) return;
      ART.ready = true;
      waiters.splice(0).forEach(fn => { try { fn(); } catch (e) {} });
    };
    keys.forEach(k => {
      const im = new Image();
      im.onload = done;
      im.onerror = () => { console.warn('[art] missing', k, FILES[k]); done(); };
      im.src = (inline && inline[k]) || FILES[k];
      ART.img[k] = im;
    });
  };

  /* img 태그 등 DOM에서 쓸 수 있는 주소 (배포 빌드에서는 data URI) */
  ART.url = function (k) {
    const inline = window.__CC_ASSETS || null;
    return (inline && inline[k]) || FILES[k];
  };

  ART.get = function (k) {
    const im = ART.img[k];
    return im && im.complete && im.naturalWidth ? im : null;
  };
  /* 스프라이트 1장의 비율 (w/h) */
  ART.ratio = function (k) {
    const im = ART.get(k);
    if (!im) return 0.5;
    return im.naturalWidth / im.naturalHeight;
  };

  /* ── 그리기 ───────────────────────────────────────────────
     opts: { h } 높이 기준 (없으면 w), anchor: 'bottom'(기본)|'center'|'top',
           flip, alpha, crop:[sx,sy,sw,sh] (0~1 비율)               */
  ART.draw = function (ctx, key, x, y, o) {
    const im = ART.get(key);
    const opt = o || {};
    if (!im) return false;
    const iw = im.naturalWidth, ih = im.naturalHeight;
    let sx = 0, sy = 0, sw = iw, sh = ih;
    if (opt.crop) {
      sx = opt.crop[0] * iw; sy = opt.crop[1] * ih;
      sw = opt.crop[2] * iw; sh = opt.crop[3] * ih;
    }
    let h = opt.h, w = opt.w;
    if (!h && !w) h = sh;
    if (!h) h = w * sh / sw;
    if (!w) w = h * sw / sh;
    let dy = y;
    if (opt.anchor === 'center') dy = y - h / 2;
    else if (opt.anchor === 'top') dy = y;
    else dy = y - h;
    ctx.save();
    if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
    if (opt.flip) {
      ctx.translate(x, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(im, sx, sy, sw, sh, -w / 2, dy, w, h);
    } else {
      ctx.drawImage(im, sx, sy, sw, sh, x - w / 2, dy, w, h);
    }
    ctx.restore();
    return true;
  };

  /* 바닥 그림자 (부드러운 타원) */
  ART.shadow = function (ctx, x, y, rx, ry, a) {
    const g = ctx.createRadialGradient(x, y, 1, x, y, Math.max(rx, ry));
    g.addColorStop(0, 'rgba(56,40,20,' + (a == null ? 0.26 : a) + ')');
    g.addColorStop(1, 'rgba(56,40,20,0)');
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  };

  /* 학생 앞/뒷모습 키 */
  ART.stuFront = (i) => 's' + ((((i | 0) - 1) % 8) + 1) + 'f';
  ART.stuBack = (i) => 's' + ((((i | 0) - 1) % 8) + 1) + 'b';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ART.load());
  } else {
    ART.load();
  }
})();
