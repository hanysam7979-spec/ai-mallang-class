/* ══════════════════════════════════════════════════════════════
   playground/scenes.js — 그림 도우미(PG.art)
   · 틀린 그림 찾기 3장면 · 숨은 그림 찾기 3장면 · 숨은 물건 아이콘
   · 모두 손으로 그린 SVG(선명·귀여운 납작 스타일, 교실 톤)
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const PG = (window.PG = window.PG || {});
  const INK = '#3A2C56';
  const A = PG.art = {};

  /* ── 기본 도형 ─────────────────────────────────────────── */
  function opt(o) { return o || {}; }
  A.sh = function (x, y, w, h, fill, o) {
    o = opt(o);
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r == null ? 4 : o.r}"
      fill="${fill}" stroke="${o.stroke || INK}" stroke-width="${o.sw == null ? 2 : o.sw}"
      ${o.op != null ? `opacity="${o.op}"` : ''} ${o.rot ? `transform="rotate(${o.rot} ${x + w / 2} ${y + h / 2})"` : ''}/>`;
  };
  A.ci = function (cx, cy, r, fill, o) {
    o = opt(o);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${o.stroke || INK}"
      stroke-width="${o.sw == null ? 2 : o.sw}" ${o.op != null ? `opacity="${o.op}"` : ''}/>`;
  };
  A.el = function (cx, cy, rx, ry, fill, o) {
    o = opt(o);
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${o.stroke || INK}"
      stroke-width="${o.sw == null ? 2 : o.sw}" ${o.op != null ? `opacity="${o.op}"` : ''}
      ${o.rot ? `transform="rotate(${o.rot} ${cx} ${cy})"` : ''}/>`;
  };
  A.pa = function (d, fill, o) {
    o = opt(o);
    return `<path d="${d}" fill="${fill}" stroke="${o.stroke || INK}" stroke-width="${o.sw == null ? 2 : o.sw}"
      stroke-linejoin="round" stroke-linecap="round" ${o.op != null ? `opacity="${o.op}"` : ''}/>`;
  };
  A.ln = function (x1, y1, x2, y2, stroke, sw, o) {
    o = opt(o);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke || INK}"
      stroke-width="${sw == null ? 2 : sw}" stroke-linecap="round" ${o.dash ? `stroke-dasharray="${o.dash}"` : ''}/>`;
  };
  A.tx = function (x, y, s, size, fill, o) {
    o = opt(o);
    return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill || INK}"
      font-family="${o.family || "'Galmuri11','Noto Sans KR',sans-serif"}" font-weight="${o.w || 700}"
      text-anchor="${o.anchor || 'middle'}" ${o.op != null ? `opacity="${o.op}"` : ''}>${s}</text>`;
  };
  function rnd(seed) {
    let s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  A.rnd = rnd;

  A.svg = function (w, h, body, defs) {
    return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img">
      ${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;
  };

  /* ── 공통 소품 ─────────────────────────────────────────── */
  A.star5 = function (cx, cy, r, fill, o) {
    o = opt(o);
    let pts = [];
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + i * Math.PI / 5;
      const rr = i % 2 ? r * 0.45 : r;
      pts.push((cx + Math.cos(ang) * rr).toFixed(1) + ',' + (cy + Math.sin(ang) * rr).toFixed(1));
    }
    return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${o.stroke || INK}"
      stroke-width="${o.sw == null ? 1.8 : o.sw}" stroke-linejoin="round"/>`;
  };
  A.heart = function (cx, cy, s, fill, o) {
    o = opt(o);
    return A.pa(`M${cx} ${cy + s * 0.75} C${cx - s * 1.5} ${cy - s * 0.35} ${cx - s * 0.6} ${cy - s * 1.3} ${cx} ${cy - s * 0.45}
      C${cx + s * 0.6} ${cy - s * 1.3} ${cx + s * 1.5} ${cy - s * 0.35} ${cx} ${cy + s * 0.75} Z`,
      fill, { stroke: o.stroke || '#C4405E', sw: o.sw == null ? 1.8 : o.sw });
  };
  A.flower = function (x, y, s, petal) {
    let out = '';
    for (let i = 0; i < 5; i++) {
      const ang = i * Math.PI * 2 / 5 - Math.PI / 2;
      out += A.ci((x + Math.cos(ang) * s).toFixed(1), (y + Math.sin(ang) * s).toFixed(1),
        (s * 0.62).toFixed(1), petal, { sw: 1.4 });
    }
    out += A.ci(x, y, (s * 0.5).toFixed(1), '#FFD166', { sw: 1.4 });
    return out;
  };
  A.cloud = function (x, y, s, fill) {
    const f = fill || '#FFFFFF';
    return A.pa(`M${x - s * 0.98} ${y + s * 0.44}
      Q${x - s * 1.2} ${y - s * 0.06} ${x - s * 0.56} ${y - s * 0.16}
      Q${x - s * 0.52} ${y - s * 0.88} ${x + s * 0.1} ${y - s * 0.68}
      Q${x + s * 0.62} ${y - s * 0.92} ${x + s * 0.82} ${y - s * 0.2}
      Q${x + s * 1.22} ${y - s * 0.02} ${x + s * 0.94} ${y + s * 0.44} Z`, f, { sw: 2 });
  };
  A.fish = function (x, y, s, body, dir) {
    const d = dir === -1 ? -1 : 1;
    return `<g transform="translate(${x} ${y}) scale(${d} 1)">
      ${A.el(0, 0, s, s * 0.66, body, { sw: 2 })}
      ${A.pa(`M${-s * 0.86} 0 L${-s * 1.5} ${-s * 0.5} L${-s * 1.5} ${s * 0.5} Z`, body, { sw: 2 })}
      ${A.ci(s * 0.42, -s * 0.14, s * 0.17, '#FFFFFF', { sw: 1.4 })}
      ${A.ci(s * 0.46, -s * 0.14, s * 0.08, INK, { stroke: 'none' })}
      ${A.pa(`M${s * 0.1} ${-s * 0.62} Q${s * 0.3} ${-s * 1.05} ${s * 0.5} ${-s * 0.5}`, 'none', { sw: 2 })}
    </g>`;
  };
  A.tree = function (x, y, s, leaf) {
    return `<g>
      ${A.sh(x - s * 0.16, y - s * 0.1, s * 0.32, s * 0.9, '#C98F5C', { r: 4 })}
      ${A.ci(x, y - s * 0.62, s * 0.72, leaf || '#8FD98A', { sw: 2.4 })}
      ${A.ci(x - s * 0.42, y - s * 0.36, s * 0.44, leaf || '#8FD98A', { sw: 2.2 })}
      ${A.ci(x + s * 0.44, y - s * 0.34, s * 0.42, leaf || '#8FD98A', { sw: 2.2 })}
    </g>`;
  };
  A.bubble = function (x, y, r) {
    return A.ci(x, y, r, '#FFFFFF', { op: 0.55, stroke: '#BEE8FA', sw: 2 });
  };

  /* ══════════════════════════════════════════════════════════
     틀린 그림 찾기 장면 3종 (460 × 340)
     ══════════════════════════════════════════════════════════ */
  A.spotScenes = [];

  /* ── 1. 교실 풍경 ──────────────────────────────────────── */
  (function () {
    let b = '';
    b += A.sh(0, 0, 460, 340, '#FFF1D6', { r: 0, stroke: 'none' });
    b += A.sh(0, 236, 460, 18, '#F5E1C0', { r: 0, stroke: 'none' });
    b += A.sh(0, 254, 460, 86, '#F6DDBB', { r: 0, stroke: 'none' });
    for (let i = 0; i < 4; i++) b += A.ln(0, 268 + i * 20, 460, 268 + i * 20, '#EACBA4', 2);

    /* 칠판 */
    b += A.sh(24, 26, 202, 122, '#C68044', { r: 8 });
    b += A.sh(31, 33, 188, 106, '#3F7A55', { r: 4 });
    b += A.sh(44, 56, 112, 6, '#DDF3E1', { r: 3, op: 0.8, stroke: 'none' });
    b += A.sh(44, 74, 84, 6, '#DDF3E1', { r: 3, op: 0.7, stroke: 'none' });
    b += A.sh(44, 92, 130, 6, '#DDF3E1', { r: 3, op: 0.55, stroke: 'none' });
    b += A.star5(196, 108, 9, '#FFE9A8', { sw: 1.4, stroke: '#B7D8C2' });
    b += A.sh(24, 148, 202, 9, '#B0713C', { r: 4 });

    /* 창문 */
    b += A.sh(294, 28, 136, 106, '#FFFFFF', { r: 10 });
    b += A.sh(300, 34, 124, 94, '#CBEFFF', { r: 6 });
    b += A.ln(362, 34, 362, 128, '#FFFFFF', 6);
    b += A.ln(300, 81, 424, 81, '#FFFFFF', 6);
    b += A.cloud(322, 108, 16, '#FFFFFF');

    /* 시계 */
    b += A.ci(258, 74, 18, '#FFFFFF', { sw: 2.4 });
    b += A.ci(258, 74, 3, '#8A7A93', { stroke: 'none' });
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      b += A.ln(258 + Math.cos(a) * 14, 74 + Math.sin(a) * 14,
        258 + Math.cos(a) * 16, 74 + Math.sin(a) * 16, '#C6BAD4', 2);
    }

    /* 게시판(포스터) */
    b += A.sh(238, 152, 48, 68, '#FFFFFF', { r: 7 });
    b += A.sh(243, 157, 38, 58, '#F4E9FF', { r: 5, sw: 1.6 });
    b += A.ln(252, 168, 272, 168, '#D8C8EE', 2.4);
    b += A.ln(252, 176, 266, 176, '#D8C8EE', 2.4);

    /* 글자 카드판 */
    b += A.sh(300, 150, 122, 68, '#FFFFFF', { r: 7 });
    const cards = ['#FFB3C7', '#FFD166', '#8FD3FF', '#9BDD8A', '#BDA9FF', '#FFB38A'];
    for (let r0 = 0; r0 < 3; r0++) for (let c0 = 0; c0 < 5; c0++) {
      b += A.sh(308 + c0 * 22, 158 + r0 * 19, 16, 13, cards[(r0 * 5 + c0) % 6], { r: 3, sw: 1.2 });
    }

    /* 책상 1 */
    b += A.sh(56, 262, 140, 16, '#F2B270', { r: 6 });
    b += A.sh(64, 278, 12, 28, '#DCA066', { r: 3 });
    b += A.sh(176, 278, 12, 28, '#DCA066', { r: 3 });
    /* 책상 2 */
    b += A.sh(224, 272, 126, 16, '#F2B270', { r: 6 });
    b += A.sh(232, 288, 12, 26, '#DCA066', { r: 3 });
    b += A.sh(330, 288, 12, 26, '#DCA066', { r: 3 });
    b += A.sh(244, 258, 52, 14, '#FFFFFF', { r: 4, sw: 1.8 });

    /* 의자 */
    b += A.sh(196, 272, 20, 26, '#9BDD8A', { r: 5, sw: 1.8 });
    b += A.sh(192, 292, 30, 7, '#8CCE7C', { r: 3, sw: 1.8 });
    b += A.sh(195, 299, 5, 12, '#6FBF5A', { r: 2, sw: 1.2 });
    b += A.sh(213, 299, 5, 12, '#6FBF5A', { r: 2, sw: 1.2 });
    /* 바닥 깔개 */
    b += A.el(300, 320, 58, 11, '#FBE7C6', { stroke: '#EACBA4', sw: 1.8 });

    /* 쓰레기통 */
    b += A.pa('M18 288 L50 288 L46 332 L22 332 Z', '#8FD3FF', { sw: 2.2 });
    b += A.ln(16, 288, 52, 288, INK, 3.4);
    b += A.ln(26, 300, 24, 320, '#BFE7FA', 2.4);
    b += A.ln(38, 300, 40, 320, '#BFE7FA', 2.4);

    /* 가방 */
    b += A.sh(344, 276, 48, 56, '#FFB3A7', { r: 12 });
    b += A.pa('M354 276 Q354 262 368 262 Q382 262 382 276', 'none', { sw: 3, stroke: '#C4736A' });
    b += A.sh(354, 296, 28, 20, '#FFD3C9', { r: 6, sw: 1.8 });

    /* 화분 */
    b += A.pa('M402 264 L448 264 L441 306 L409 306 Z', '#E8A87C', { sw: 2.2 });
    b += A.ln(400, 264, 450, 264, INK, 3.2);
    b += A.pa('M425 264 Q425 236 410 228', 'none', { sw: 3.4, stroke: '#4E9C46' });
    b += A.pa('M425 264 Q425 240 442 232', 'none', { sw: 3.4, stroke: '#4E9C46' });
    b += A.pa('M425 246 Q410 244 406 254 Q420 256 425 246 Z', '#8FD98A', { sw: 1.8 });
    b += A.pa('M425 240 Q441 238 445 248 Q431 250 425 240 Z', '#8FD98A', { sw: 2 });

    const base = b;

    /* 다른 곳 5개 */
    const diffs = [
      {
        id: 'clock', hot: { x: 258, y: 74, r: 23 },
        left: A.ln(258, 74, 258, 61, '#5B4D72', 3.2) + A.ln(258, 74, 269, 79, '#E4694A', 2.6),
        right: A.ln(258, 74, 247, 64, '#5B4D72', 3.2) + A.ln(258, 74, 268, 64, '#E4694A', 2.6)
      },
      {
        id: 'sun', hot: { x: 362, y: 62, r: 24 },
        left: A.ci(362, 62, 15, '#FFCE4A', { sw: 2 }) +
          [0, 1, 2, 3, 4, 5, 6, 7].map(i => {
            const a = i * Math.PI / 4;
            return A.ln(362 + Math.cos(a) * 18, 62 + Math.sin(a) * 18,
              362 + Math.cos(a) * 24, 62 + Math.sin(a) * 24, '#FFB13B', 2);
          }).join(''),
        right: A.ci(362, 62, 13, '#FFF3C4', { sw: 2 }) + A.ci(372, 56, 11, '#CBEFFF', { sw: 2 })
      },
      {
        id: 'poster', hot: { x: 262, y: 184, r: 22 },
        left: A.star5(262, 184, 12, '#FFD166', { sw: 1.8 }),
        right: A.heart(262, 182, 11, '#FF9EB5', { sw: 1.8 })
      },
      {
        id: 'plant', hot: { x: 424, y: 238, r: 26 },
        left: A.flower(412, 232, 7, '#FFB3C7') + A.flower(436, 226, 7, '#FFD166') + A.flower(424, 244, 6, '#BDA9FF'),
        right: A.flower(412, 232, 7, '#FFB3C7') + A.flower(436, 226, 7, '#FFD166')
      },
      {
        id: 'laptop', hot: { x: 129, y: 240, r: 28 },
        left: laptop('#8FD3FF'), right: laptop('#FFC2D2')
      }
    ];
    function laptop(screen) {
      return A.sh(96, 232, 66, 30, '#E4E9F2', { r: 5, sw: 2.2 })
        + A.sh(101, 236, 56, 20, screen, { r: 3, sw: 1.6 })
        + A.sh(92, 260, 74, 7, '#C6CCDC', { r: 3, sw: 2 });
    }
    A.spotScenes.push({ id: 'classroom', name: '교실 풍경', w: 460, h: 340, base, diffs });
  })();

  /* ── 2. 우주 탐험 ──────────────────────────────────────── */
  (function () {
    let b = '';
    b += A.sh(0, 0, 460, 340, '#241C46', { r: 0, stroke: 'none' });
    b += A.el(80, 52, 120, 62, '#3A2E6E', { stroke: 'none', op: 0.55 });
    b += A.el(372, 306, 130, 66, '#2E2A5E', { stroke: 'none', op: 0.6 });
    const r = rnd(77);
    for (let i = 0; i < 34; i++) {
      const x = (r() * 460).toFixed(1), y = (r() * 340).toFixed(1), rr = (0.7 + r() * 1.7).toFixed(1);
      b += A.ci(+x, +y, +rr, '#FFF8DC', { stroke: 'none', op: (0.45 + r() * 0.5).toFixed(2) });
    }
    b += A.star5(56, 210, 9, '#FFE9A8', { sw: 1.4 });
    b += A.star5(432, 168, 7, '#FFE9A8', { sw: 1.2 });
    b += A.star5(250, 40, 6, '#FFFFFF', { sw: 1.2 });

    /* 행성 */
    b += A.ci(84, 100, 52, '#B098FF', { sw: 2.4 });
    b += A.pa('M38 88 Q84 70 130 92', 'none', { stroke: '#D8C9FF', sw: 5, op: 0.85 });
    b += A.pa('M36 112 Q84 130 132 108', 'none', { stroke: '#8E74E8', sw: 5, op: 0.8 });
    b += A.ci(64, 86, 9, '#8E74E8', { stroke: '#8E74E8' });
    b += A.ci(102, 118, 7, '#8E74E8', { stroke: '#8E74E8' });

    /* 작은 별(달) */
    b += A.ci(392, 70, 26, '#E8E2FF', { sw: 2.2 });
    b += A.ci(383, 62, 6, '#CFC6F5', { stroke: '#CFC6F5' });
    b += A.ci(401, 80, 4.6, '#CFC6F5', { stroke: '#CFC6F5' });
    b += A.ci(398, 58, 3, '#CFC6F5', { stroke: '#CFC6F5' });

    /* 로켓 */
    b += A.pa('M186 196 L186 152 Q186 126 206 120 Q226 126 226 152 L226 196 Z', '#F2F3F8', { sw: 2.4 });
    b += A.pa('M186 168 L172 200 L186 194 Z', '#FF9C7A', { sw: 2.2 });
    b += A.pa('M226 168 L240 200 L226 194 Z', '#FF9C7A', { sw: 2.2 });
    b += A.pa('M198 200 L206 218 L214 200 Z', '#FFD166', { sw: 2 });

    /* 우주인 */
    b += A.sh(346, 210, 17, 36, '#7FA8F5', { r: 6, sw: 2 });
    b += A.el(334, 240, 21, 25, '#EEF3FF', { sw: 2.4 });
    b += A.ln(318, 232, 306, 250, '#EEF3FF', 9);
    b += A.ln(350, 232, 362, 250, '#EEF3FF', 9);
    b += A.ln(326, 262, 322, 282, '#EEF3FF', 9);
    b += A.ln(342, 262, 346, 282, '#EEF3FF', 9);
    b += A.ci(334, 206, 18, '#FFFFFF', { sw: 2.4 });
    b += A.star5(334, 246, 6, '#FFD166', { sw: 1.2 });

    /* UFO */
    b += A.pa('M112 272 Q112 252 112 252 Q136 244 112 236 Q88 244 112 252 Z', '#BFF3FF', { sw: 2 });
    b += A.el(112, 276, 46, 12, '#C9D2F0', { sw: 2.2 });

    /* 혜성 (꼬리는 '다른 곳'에서 그림) */
    b += A.ci(404, 296, 7, '#FFF3C4', { sw: 2 });

    const base = b;

    const diffs = [
      {
        id: 'ring', hot: { x: 84, y: 100, r: 54 },
        left: A.el(84, 104, 72, 20, 'none', { stroke: '#FFD166', sw: 5, rot: -14 }),
        right: `<g opacity="0"></g>`
      },
      {
        id: 'window', hot: { x: 206, y: 150, r: 20 },
        left: A.ci(206, 150, 11, '#8FD3FF', { sw: 2.2 }) + A.ci(202, 146, 3.4, '#FFFFFF', { stroke: 'none', op: 0.8 }),
        right: A.ci(206, 150, 11, '#FFB3C7', { sw: 2.2 }) + A.ci(202, 146, 3.4, '#FFFFFF', { stroke: 'none', op: 0.8 })
      },
      {
        id: 'visor', hot: { x: 334, y: 206, r: 19 },
        left: A.el(334, 206, 12, 10, '#3A5B8C', { sw: 1.8 }) + A.el(329, 202, 4, 3, '#FFFFFF', { stroke: 'none', op: 0.7 }),
        right: A.el(334, 206, 12, 10, '#FF9EC4', { sw: 1.8 }) + A.el(329, 202, 4, 3, '#FFFFFF', { stroke: 'none', op: 0.7 })
      },
      {
        id: 'lights', hot: { x: 112, y: 276, r: 40 },
        left: A.ci(88, 276, 4.6, '#FFD166', { sw: 1.6 }) + A.ci(112, 278, 4.6, '#FFD166', { sw: 1.6 }) + A.ci(136, 276, 4.6, '#FFD166', { sw: 1.6 }),
        right: A.ci(88, 276, 4.6, '#7FE3C0', { sw: 1.6 }) + A.ci(112, 278, 4.6, '#7FE3C0', { sw: 1.6 }) + A.ci(136, 276, 4.6, '#7FE3C0', { sw: 1.6 }) + A.ci(124, 280, 3, '#7FE3C0', { sw: 1.2 })
      },
      {
        id: 'comet', hot: { x: 428, y: 292, r: 26 },
        left: A.pa('M410 302 L440 288 L444 294 L414 308 Z', '#FFD166', { sw: 1.6, op: 0.9 }),
        right: A.pa('M410 302 L456 274 L460 282 L414 308 Z', '#FFB3C7', { sw: 1.6, op: 0.95 })
      }
    ];
    A.spotScenes.push({ id: 'space', name: '우주 탐험', w: 460, h: 340, base, diffs });
  })();

  /* ── 3. 바다 속 ────────────────────────────────────────── */
  (function () {
    let b = '';
    const defs = `<linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#9FE7FF"/><stop offset="55%" stop-color="#57B8E8"/><stop offset="100%" stop-color="#2C7FBC"/>
    </linearGradient>`;
    b += A.sh(0, 0, 460, 340, 'url(#seaGrad)', { r: 0, stroke: 'none' });
    b += A.pa('M0 0 L90 0 L190 340 L60 340 Z', '#FFFFFF', { stroke: 'none', op: 0.08 });
    b += A.pa('M180 0 L250 0 L340 340 L250 340 Z', '#FFFFFF', { stroke: 'none', op: 0.06 });

    /* 모래 · 바위 */
    b += A.pa('M0 296 Q60 282 120 292 Q190 304 250 292 Q320 280 380 294 Q420 302 460 292 L460 340 L0 340 Z',
      '#FBE2B0', { sw: 2.4 });
    b += A.el(60, 318, 26, 13, '#E4CFAE', { sw: 2 });
    b += A.el(410, 322, 20, 10, '#E4CFAE', { sw: 2 });


    /* 산호 */
    b += A.pa('M400 300 Q400 274 386 260 M400 300 Q402 270 418 256 M400 284 Q386 288 378 296',
      'none', { stroke: '#FF9EB5', sw: 8 });
    b += A.ci(386, 258, 5, '#FFC2D2', { sw: 1.6 });
    b += A.ci(419, 254, 5, '#FFC2D2', { sw: 1.6 });

    /* 물고기 (가운데 물고기는 '다른 곳'에서 그림) */
    b += A.fish(150, 140, 34, '#FFB38A');
    b += A.fish(368, 196, 28, '#BDA9FF', -1);

    /* 해파리 */
    b += A.pa('M40 118 Q40 92 68 92 Q96 92 96 118 Z', '#FFC2D2', { sw: 2.2 });
    b += A.pa('M48 120 Q46 140 54 152', 'none', { stroke: '#FF9EB5', sw: 3 });
    b += A.pa('M64 120 Q64 144 60 156', 'none', { stroke: '#FF9EB5', sw: 3 });
    b += A.pa('M80 120 Q84 140 76 152', 'none', { stroke: '#FF9EB5', sw: 3 });

    /* 보물 상자 (뚜껑은 '다른 곳'에서 그림) */
    b += A.sh(330, 278, 62, 34, '#C68044', { r: 5 });
    b += A.sh(352, 288, 14, 16, '#FFD166', { r: 3, sw: 1.8 });
    b += A.ci(359, 294, 2, '#8A5C10', { stroke: 'none' });
    b += A.ci(66, 306, 3, '#E4CFAE', { stroke: 'none' });

    const base = b;

    const diffs = [
      {
        id: 'fish', hot: { x: 300, y: 92, r: 26 },
        left: A.fish(300, 92, 24, '#FFD166'),
        right: A.fish(300, 92, 24, '#7FE3C0')
      },
      {
        id: 'bubble', hot: { x: 308, y: 258, r: 26 },
        left: A.bubble(312, 268, 7) + A.bubble(300, 252, 5),
        right: A.bubble(312, 268, 7) + A.bubble(300, 252, 5) + A.bubble(292, 268, 4) + A.bubble(320, 248, 4)
      },
      {
        id: 'star', hot: { x: 240, y: 316, r: 24 },
        left: A.star5(240, 316, 18, '#FF9C7A', { sw: 2 }),
        right: A.star5(240, 316, 11, '#FF9C7A', { sw: 2 })
      },
      {
        id: 'weed', hot: { x: 56, y: 226, r: 40 },
        left: A.pa('M46 296 Q30 260 46 226 Q60 194 44 166', 'none', { stroke: '#4E9C46', sw: 9 }) +
          A.pa('M64 298 Q78 264 62 236 Q52 212 66 190', 'none', { stroke: '#6FBF5A', sw: 7 }),
        right: A.pa('M46 296 Q30 260 46 226 Q60 194 44 166', 'none', { stroke: '#4E9C46', sw: 9 }) +
          A.pa('M64 298 Q78 264 62 236 Q52 212 66 190', 'none', { stroke: '#6FBF5A', sw: 7 }) +
          A.pa('M80 300 Q90 272 78 250', 'none', { stroke: '#6FBF5A', sw: 6 })
      },
      {
        id: 'chest', hot: { x: 361, y: 286, r: 26 },
        left: A.sh(330, 278, 62, 13, '#A9682F', { r: 5 }),
        right: A.sh(330, 278, 62, 13, '#FFB3C7', { r: 5 })
      }
    ];
    A.spotScenes.push({ id: 'ocean', name: '바다 속', w: 460, h: 340, base, diffs, defs });
  })();

  /* 숨은 그림 아이콘 (24×24) */
  const ICONS = {
    key: `<circle cx="8" cy="8" r="4.8" fill="#FFCE4A" stroke="#8A5C10" stroke-width="1.8"/>
      <circle cx="8" cy="8" r="1.7" fill="#FFF6E0" stroke="#8A5C10" stroke-width="1"/>
      <path d="M11.4 11.4 L19.6 19.6" stroke="#8A5C10" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M16.6 20.4 L19 18" stroke="#8A5C10" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M19 17.6 L21.4 15.2" stroke="#8A5C10" stroke-width="2.4" stroke-linecap="round"/>`,
    star: `<path d="M12 2.6 L14.9 9.1 L21.8 9.8 L16.6 14.4 L18.2 21.3 L12 17.7 L5.8 21.3 L7.4 14.4 L2.2 9.8 L9.1 9.1 Z"
      fill="#FFD166" stroke="#C79018" stroke-width="1.7" stroke-linejoin="round"/>`,
    apple: `<path d="M12 7.4 C9 4.8 4.3 6.2 4.3 11.3 C4.3 16.5 8.2 21.2 12 21.2 C15.8 21.2 19.7 16.5 19.7 11.3 C19.7 6.2 15 4.8 12 7.4 Z"
      fill="#FF8A7A" stroke="#C4402E" stroke-width="1.6"/>
      <path d="M12 7.2 C12 4.6 13.4 3 15.4 2.5" stroke="#7A5230" stroke-width="1.9" fill="none" stroke-linecap="round"/>
      <path d="M13.9 5.6 C15.9 3.6 18.5 3.8 19.5 4.8 C18.7 6.8 15.9 7.2 13.9 5.6 Z" fill="#7FE3A0" stroke="#3E8E5A" stroke-width="1.2"/>`,
    pencil: `<path d="M4 20 L5.6 15.6 L15.9 5.3 L19.1 8.5 L8.8 18.8 Z" fill="#FFD166" stroke="#8A5C10" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M15.9 5.3 L17.4 3.8 L20.6 7 L19.1 8.5 Z" fill="#FFB3C7" stroke="#8A5C10" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M4 20 L8.8 18.8 L5.6 15.6 Z" fill="#43385A" stroke="#43385A" stroke-width="1"/>`,
    usb: `<rect x="7.6" y="8" width="8.8" height="12.4" rx="2.4" fill="#C6CCDC" stroke="#5B5470" stroke-width="1.6"/>
      <rect x="9.4" y="3" width="5.2" height="5.4" rx="1" fill="#F0F3FA" stroke="#5B5470" stroke-width="1.5"/>
      <rect x="10.4" y="4.2" width="3.2" height="2.4" fill="#8A94AC"/>
      <rect x="9.6" y="11.6" width="4.8" height="5" rx="1" fill="#8FD3FF" stroke="#5B5470" stroke-width="1.2"/>`,
    glasses: `<circle cx="7" cy="13" r="4.4" fill="#EAF6FF" stroke="#43385A" stroke-width="1.9"/>
      <circle cx="17" cy="13" r="4.4" fill="#EAF6FF" stroke="#43385A" stroke-width="1.9"/>
      <path d="M11.2 12.4 Q12 10.8 12.8 12.4" fill="none" stroke="#43385A" stroke-width="1.9" stroke-linecap="round"/>
      <path d="M2.6 12 L2.4 9.4 M21.4 12 L21.6 9.4" stroke="#43385A" stroke-width="1.9" stroke-linecap="round"/>`,
    donut: `<circle cx="12" cy="12" r="9" fill="#F3B679" stroke="#A9702F" stroke-width="1.7"/>
      <path d="M12 3.2 C17.6 3.2 20.8 7.4 20.8 11.8 C20.8 13.4 16.4 12.6 13.4 12.6 C10.4 12.6 3.2 13.8 3.2 11.6 C3.2 7 6.6 3.2 12 3.2 Z"
        fill="#FF9EB5" stroke="#D8608A" stroke-width="1.4"/>
      <circle cx="12" cy="12" r="3.1" fill="#FFF6E8" stroke="#A9702F" stroke-width="1.4"/>
      <path d="M16.4 6.4 L18 7.2 M8 5.8 L9.2 6.8 M17.6 9.4 L18.8 9 M8.6 9.8 L9.6 9.2" stroke="#FFF6E8" stroke-width="1.6" stroke-linecap="round"/>`
  };
  A.icon = name => ICONS[name] || '';
  A.iconSvg = function (name, size) {
    return `<svg viewBox="0 0 24 24" width="${size || 24}" height="${size || 24}" xmlns="http://www.w3.org/2000/svg">${A.icon(name)}</svg>`;
  };
  A.placed = function (name, x, y, scale, rot) {
    return `<g transform="translate(${x} ${y}) rotate(${rot || 0}) translate(-12 -12) scale(${scale || 1})"
      opacity="0.97">${A.icon(name)}</g>`;
  };

  /* ══════════════════════════════════════════════════════════
     숨은 그림 찾기 장면 3종 (520 × 380)
     ══════════════════════════════════════════════════════════ */
  A.hiddenScenes = [];

  /* ── A. 우리 교실 ──────────────────────────────────────── */
  (function () {
    let b = '';
    b += A.sh(0, 0, 520, 380, '#FFF3DC', { r: 0, stroke: 'none' });
    b += A.sh(0, 282, 520, 16, '#F7E4C6', { r: 0, stroke: 'none' });
    b += A.sh(0, 298, 520, 82, '#F6DDBB', { r: 0, stroke: 'none' });
    for (let i = 0; i < 3; i++) b += A.ln(0, 316 + i * 22, 520, 316 + i * 22, '#EACBA4', 2);

    /* 칠판 */
    b += A.sh(18, 16, 180, 106, '#C68044', { r: 8 });
    b += A.sh(24, 22, 168, 94, '#3F7A55', { r: 4 });
    b += A.sh(34, 42, 96, 5, '#DDF3E1', { r: 2, op: 0.8, stroke: 'none' });
    b += A.sh(34, 56, 70, 5, '#DDF3E1', { r: 2, op: 0.65, stroke: 'none' });
    b += A.sh(34, 70, 110, 5, '#DDF3E1', { r: 2, op: 0.5, stroke: 'none' });
    b += A.star5(170, 100, 8, '#FFE9A8', { sw: 1.4, stroke: '#B7D8C2' });
    b += A.sh(18, 122, 180, 8, '#B0713C', { r: 3 });
    b += A.sh(140, 123, 22, 6, '#FFFFFF', { r: 3, sw: 1.2 });

    /* 시계 */
    b += A.ci(238, 44, 15, '#FFFFFF', { sw: 2.2 });
    b += A.ln(238, 44, 238, 34, '#5B4D72', 2.4);
    b += A.ln(238, 44, 246, 48, '#E4694A', 2);
    b += A.ci(238, 44, 2.4, '#8A7A93', { stroke: 'none' });

    /* 게시판 */
    b += A.sh(196, 76, 112, 66, '#FFFFFF', { r: 7 });
    b += A.sh(202, 82, 44, 26, '#FFE9A8', { r: 4, sw: 1.6 });
    b += A.sh(252, 82, 50, 26, '#D8F4EA', { r: 4, sw: 1.6 });
    b += A.sh(202, 114, 44, 22, '#FFD9E6', { r: 4, sw: 1.6 });
    b += A.sh(252, 114, 50, 22, '#E5DCFF', { r: 4, sw: 1.6 });
    b += A.ci(210, 80, 2.4, '#E4698C', { stroke: 'none' });
    b += A.ci(310, 80, 2.4, '#7FA8F5', { stroke: 'none' });

    /* 창문 */
    b += A.sh(330, 16, 140, 106, '#FFFFFF', { r: 9 });
    b += A.sh(336, 22, 128, 94, '#CBEFFF', { r: 5 });
    b += A.ln(400, 22, 400, 116, '#FFFFFF', 6);
    b += A.ln(336, 69, 464, 69, '#FFFFFF', 6);
    b += A.ci(448, 46, 11, '#FFCE4A', { sw: 2 });
    b += A.cloud(372, 96, 13, '#FFFFFF');

    /* 달력 */
    b += A.sh(482, 24, 26, 32, '#FFFFFF', { r: 4, sw: 1.6 });
    b += A.sh(482, 24, 26, 9, '#FFB3C7', { r: 4, sw: 1.6 });
    b += A.ln(488, 40, 502, 40, '#EADCEF', 2);
    b += A.ln(488, 46, 502, 46, '#EADCEF', 2);

    /* 책장 */
    b += A.sh(22, 148, 152, 150, '#C68044', { r: 6 });
    const shelfRow = (yTop, h, gapFrom, gapTo) => {
      const inner = A.sh(28, yTop, 140, h, '#FFF6E8', { r: 3, sw: 1.6 });
      let out = inner, x = 34;
      const colors = ['#FF9EB5', '#8FD3FF', '#9BDD8A', '#FFD166', '#BDA9FF', '#FFB38A', '#7FE3C0'];
      let i = 0;
      while (x < 160) {
        const w = 8 + (i * 5 + yTop) % 7;
        if (!(x + w > gapFrom && x < gapTo)) {
          out += A.sh(x, yTop + 3, w, h - 7, colors[i % 7], { r: 2, sw: 1.4 });
        }
        x += w + 2; i++;
      }
      return out;
    };
    b += shelfRow(154, 36, 46, 72);      /* 위칸 — 안경 자리 */
    b += shelfRow(194, 34, 110, 136);    /* 가운데칸 — 사과 자리 */
    b += shelfRow(232, 58, 0, 0);        /* 아래칸 */

    /* 책상 */
    b += A.sh(200, 246, 224, 14, '#F2B270', { r: 5 });
    b += A.sh(212, 260, 12, 34, '#DCA066', { r: 3 });
    b += A.sh(400, 260, 12, 34, '#DCA066', { r: 3 });

    /* 모니터 · 키보드 */
    b += A.sh(238, 168, 104, 70, '#C6CCDC', { r: 6 });
    b += A.sh(244, 174, 92, 54, '#8FD3FF', { r: 3, sw: 1.6 });
    b += A.pa('M250 210 Q262 190 274 210 Z', '#FFFFFF', { sw: 1.2, stroke: '#BEE8FA', op: 0.7 });
    b += A.sh(284, 238, 16, 8, '#969CB2', { r: 3, sw: 1.4 });
    b += A.sh(258, 244, 68, 7, '#C6CCDC', { r: 3, sw: 1.4 });
    b += A.sh(246, 230, 82, 14, '#E4E9F2', { r: 4, sw: 1.6 });

    /* 연필꽂이 */
    b += A.sh(352, 208, 24, 34, '#8FD3FF', { r: 5, sw: 1.8 });
    b += A.ln(358, 208, 356, 190, '#FFD166', 3.2);
    b += A.ln(368, 208, 372, 194, '#FF9EB5', 3.2);

    /* 벽 액자 */
    b += A.sh(424, 142, 50, 60, '#FFFFFF', { r: 6 });
    b += A.sh(429, 147, 40, 50, '#EAF9FF', { r: 4, sw: 1.4 });
    b += A.pa('M431 186 Q443 160 455 176 Q463 186 467 174', 'none', { stroke: '#9BDD8A', sw: 4 });
    b += A.ci(458, 158, 5, '#FFCE4A', { sw: 1.4 });

    /* 화분 */
    b += A.pa('M452 276 L492 276 L486 320 L458 320 Z', '#E8A87C', { sw: 2 });
    b += A.ln(450, 276, 494, 276, INK, 3);
    b += A.pa('M472 276 Q472 250 456 242', 'none', { stroke: '#4E9C46', sw: 3.2 });
    b += A.pa('M472 276 Q472 254 488 246', 'none', { stroke: '#4E9C46', sw: 3.2 });
    b += A.pa('M472 258 Q456 256 452 266 Q466 268 472 258 Z', '#8FD98A', { sw: 1.6 });
    b += A.pa('M472 252 Q488 250 492 260 Q478 262 472 252 Z', '#8FD98A', { sw: 1.8 });

    /* 바닥 물건 */
    b += A.sh(48, 300, 66, 46, '#FFB3A7', { r: 11 });
    b += A.pa('M64 300 Q64 288 81 288 Q98 288 98 300', 'none', { sw: 3, stroke: '#C4736A' });
    b += A.sh(60, 318, 42, 20, '#FFD3C9', { r: 6, sw: 1.6 });
    b += A.el(300, 336, 88, 22, '#FBE7C6', { stroke: '#EACBA4', sw: 2 });
    b += A.el(300, 336, 66, 14, 'none', { stroke: '#F0DAB2', sw: 1.8 });
    b += A.sh(392, 328, 26, 20, '#E5DCFF', { r: 4, sw: 1.6 });
    b += A.sh(148, 322, 34, 14, '#8FD3FF', { r: 3, sw: 1.6 });

    /* ── 숨은 물건 7개 ── */
    const items = [
      { id: 'key', name: '열쇠', x: 186, y: 184, s: 1.0, rot: 20 },
      { id: 'star', name: '별', x: 274, y: 96, s: 0.82, rot: -10 },
      { id: 'apple', name: '사과', x: 123, y: 208, s: 0.86, rot: 8 },
      { id: 'pencil', name: '연필', x: 360, y: 198, s: 0.9, rot: 16 },
      { id: 'usb', name: 'USB', x: 390, y: 236, s: 0.85, rot: 0 },
      { id: 'glasses', name: '안경', x: 58, y: 172, s: 0.9, rot: -8 },
      { id: 'donut', name: '도넛', x: 216, y: 236, s: 0.85, rot: 0 }
    ];
    /* 열쇠를 거는 못 */
    b += A.ln(186, 172, 186, 178, '#8A7A93', 2.4);
    b += A.ci(186, 171, 2.4, '#C6BAD4', { sw: 1.2 });
    items.forEach(it => { b += A.placed(it.id, it.x, it.y, it.s, it.rot); });

    A.hiddenScenes.push({ id: 'room', name: '우리 교실', w: 520, h: 380, base: b, items });
  })();

  /* ── B. 학교 공원 ──────────────────────────────────────── */
  (function () {
    let b = '';
    b += A.sh(0, 0, 520, 380, '#DFF3FF', { r: 0, stroke: 'none' });
    /* 먼 언덕 */
    b += A.pa('M0 214 Q90 190 190 208 Q300 228 400 204 Q470 190 520 206 L520 380 L0 380 Z',
      '#A8DF8E', { stroke: 'none' });
    b += A.sh(0, 214, 520, 166, '#A8DF8E', { r: 0, stroke: 'none' });
    b += A.el(120, 210, 90, 26, '#B9E8A2', { stroke: 'none' });
    b += A.el(420, 206, 80, 22, '#B9E8A2', { stroke: 'none' });

    /* 해 · 구름 */
    b += A.ci(56, 52, 21, '#FFE39A', { sw: 2.2 });
    b += A.cloud(150, 58, 20, '#FFFFFF');
    b += A.cloud(398, 44, 18, '#FFFFFF');

    /* 울타리 (나무 뒤) */
    for (let i = 0; i < 13; i++) b += A.sh(4 + i * 40, 192, 6, 26, '#FFF6E8', { r: 3, sw: 1.6 });
    b += A.ln(0, 202, 520, 202, '#FFF6E8', 4);
    b += A.ln(0, 212, 520, 212, '#FFF6E8', 4);

    /* 나무 */
    b += A.tree(64, 252, 50);
    b += A.tree(474, 240, 42, '#8FD98A');
    b += A.tree(330, 232, 28, '#A8E39A');

    /* 연못 */
    b += A.el(170, 332, 84, 28, '#7FD8FF', { sw: 2.4 });
    b += A.el(170, 332, 66, 19, 'none', { stroke: '#BEE8FA', sw: 2 });
    b += A.el(140, 328, 9, 4, '#FFFFFF', { stroke: 'none', op: 0.6 });
    /* 오리 */
    b += A.el(196, 326, 12, 8, '#FFFFFF', { sw: 1.8 });
    b += A.ci(207, 318, 5.4, '#FFFFFF', { sw: 1.8 });
    b += A.pa('M212 318 L217 320 L212 322 Z', '#FFB13B', { sw: 1.2 });
    b += A.ci(209, 316, 1.1, INK, { stroke: 'none' });

    /* 벤치 */
    b += A.sh(54, 244, 112, 9, '#C68044', { r: 3, sw: 1.8 });
    b += A.sh(54, 258, 116, 11, '#DCA066', { r: 3, sw: 1.8 });
    b += A.sh(62, 269, 7, 22, '#A9702F', { r: 2, sw: 1.4 });
    b += A.sh(155, 269, 7, 22, '#A9702F', { r: 2, sw: 1.4 });

    /* 미끄럼틀 */
    b += A.ln(228, 210, 228, 292, '#C68044', 5);
    b += A.ln(272, 210, 272, 292, '#C68044', 5);
    for (let i = 0; i < 4; i++) b += A.ln(228, 226 + i * 18, 272, 226 + i * 18, '#C68044', 3);
    b += A.sh(218, 200, 66, 10, '#FF9EB5', { r: 4, sw: 2 });
    b += A.pa('M216 200 L286 200 L274 178 L230 178 Z', '#FFC2D2', { sw: 2 });
    b += A.pa('M284 204 L306 204 Q316 204 320 218 L330 282 Q332 292 320 292 L296 292 Q288 292 286 284 L286 216 Z',
      '#FFC2D2', { sw: 2 });
    b += A.ln(298, 212, 316, 280, '#FF9EB5', 2.6);
    b += A.sh(292, 288, 42, 8, '#FF9EB5', { r: 4, sw: 1.6 });
    /* 새 */
    b += A.pa('M300 66 q7 -7 14 0 q7 -7 14 0', 'none', { stroke: '#8A7A93', sw: 2.4 });
    b += A.pa('M196 44 q5 -5 10 0 q5 -5 10 0', 'none', { stroke: '#8A7A93', sw: 2 });
    /* 덤불 */
    b += A.el(196, 224, 24, 12, '#8FD98A', { sw: 2 });
    b += A.el(478, 300, 22, 11, '#8FD98A', { sw: 2 });

    /* 돗자리 · 바구니 */
    b += A.el(408, 276, 70, 28, '#FFE9A8', { sw: 2 });
    b += A.ln(350, 266, 466, 286, '#F6D98C', 2);
    b += A.ln(354, 286, 462, 266, '#F6D98C', 2);
    b += A.sh(372, 238, 38, 24, '#C68044', { r: 5, sw: 1.8 });
    b += A.pa('M372 240 Q391 216 410 240', 'none', { sw: 3, stroke: '#A9702F' });

    /* 꽃 · 풀 */
    b += A.flower(310, 302, 5.4, '#FFB3C7');
    b += A.flower(325, 314, 5.4, '#FFD166');
    b += A.flower(90, 306, 5.4, '#BDA9FF');
    b += A.flower(452, 320, 5.4, '#FFB38A');
    b += A.pa('M296 318 q6 -12 12 0 M302 318 q6 -14 12 0', 'none', { stroke: '#6FBF5A', sw: 2.4 });

    /* ── 숨은 물건 7개 ── */
    const items = [
      { id: 'star', name: '별', x: 52, y: 226, s: 0.82, rot: 14 },
      { id: 'key', name: '열쇠', x: 150, y: 282, s: 0.92, rot: 26 },
      { id: 'apple', name: '사과', x: 386, y: 234, s: 0.82, rot: -6 },
      { id: 'pencil', name: '연필', x: 248, y: 262, s: 0.88, rot: 22 },
      { id: 'usb', name: 'USB', x: 384, y: 270, s: 0.82, rot: -28 },
      { id: 'glasses', name: '안경', x: 104, y: 264, s: 0.9, rot: -6 },
      { id: 'donut', name: '도넛', x: 432, y: 266, s: 0.82, rot: 0 }
    ];
    items.forEach(it => { b += A.placed(it.id, it.x, it.y, it.s, it.rot); });

    A.hiddenScenes.push({ id: 'park', name: '학교 공원', w: 520, h: 380, base: b, items });
  })();

  /* ── C. 내 방 ──────────────────────────────────────────── */
  (function () {
    let b = '';
    b += A.sh(0, 0, 520, 380, '#FFF0F6', { r: 0, stroke: 'none' });
    b += A.sh(0, 288, 520, 92, '#F7E3C9', { r: 0, stroke: 'none' });
    b += A.ln(0, 288, 520, 288, '#E8CBAA', 3);
    for (let i = 0; i < 3; i++) b += A.ln(0, 308 + i * 24, 520, 308 + i * 24, '#E8CBAA', 2);

    /* 창문 + 커튼 */
    b += A.sh(330, 20, 142, 108, '#FFFFFF', { r: 9 });
    b += A.sh(336, 26, 130, 96, '#CBEFFF', { r: 5 });
    b += A.ln(401, 26, 401, 122, '#FFFFFF', 6);
    b += A.ln(336, 74, 466, 74, '#FFFFFF', 6);
    b += A.ci(448, 48, 10, '#FFCE4A', { sw: 2 });
    b += A.cloud(372, 100, 12, '#FFFFFF');
    b += A.pa('M330 20 Q318 74 330 128 L346 128 Q338 74 346 20 Z', '#FFC2D2', { sw: 2 });
    b += A.pa('M470 20 Q482 74 470 128 L454 128 Q462 74 454 20 Z', '#FFC2D2', { sw: 2 });

    /* 벽시계 */
    b += A.ci(58, 64, 20, '#FFFFFF', { sw: 2.4 });
    b += A.ln(58, 64, 58, 51, '#5B4D72', 2.6);
    b += A.ln(58, 64, 68, 68, '#E4694A', 2.2);
    b += A.ci(58, 64, 2.6, '#8A7A93', { stroke: 'none' });

    /* 포스터 */
    b += A.sh(118, 34, 76, 90, '#FFFFFF', { r: 6 });
    b += A.sh(123, 39, 66, 80, '#E8F7FF', { r: 4, sw: 1.4 });
    b += A.heart(156, 74, 13, '#FF9EB5', { sw: 1.6 });
    b += A.ln(132, 104, 180, 104, '#D8EFFA', 2.4);

    /* 벽 선반 */
    b += A.sh(226, 24, 84, 10, '#C68044', { r: 3, sw: 1.8 });
    let sx = 232, cols = ['#FF9EB5', '#8FD3FF', '#FFD166', '#9BDD8A', '#BDA9FF'];
    cols.forEach((c, i) => {
      const hh = 20 + (i % 3) * 3;
      b += A.sh(sx, 24 - hh + 1, 11, hh, c, { r: 2, sw: 1.4 });
      sx += 13;
    });
    b += A.sh(226, 66, 84, 10, '#C68044', { r: 3, sw: 1.8 });
    b += A.sh(232, 46, 26, 20, '#E5DCFF', { r: 3, sw: 1.4 });
    b += A.ci(300, 56, 8, '#B6F2DB', { sw: 1.6 });
    b += A.pa('M296 50 q4 -6 8 0', 'none', { stroke: '#4E9C46', sw: 1.6 });

    /* 침대 */
    b += A.sh(24, 176, 20, 68, '#BDA9FF', { r: 6 });
    b += A.sh(34, 196, 162, 28, '#D8CBFF', { r: 6 });
    b += A.sh(34, 224, 162, 46, '#BDA9FF', { r: 6 });
    b += A.sh(34, 224, 162, 12, '#FFC2D2', { r: 4, sw: 1.6 });
    b += A.sh(46, 178, 58, 24, '#FFFFFF', { r: 9, sw: 2 });
    b += A.ln(40, 250, 190, 250, '#A993F0', 2);
    b += A.ln(74, 228, 74, 268, '#C9BAFA', 2);
    b += A.ln(112, 228, 112, 268, '#C9BAFA', 2);
    b += A.sh(34, 270, 10, 14, '#A9702F', { r: 2, sw: 1.4 });
    b += A.sh(186, 270, 10, 14, '#A9702F', { r: 2, sw: 1.4 });
    /* 침대 위 인형 */
    b += A.ci(168, 208, 11, '#FFE1B0', { sw: 1.8 });
    b += A.ci(164, 205, 1.6, INK, { stroke: 'none' });
    b += A.ci(172, 205, 1.6, INK, { stroke: 'none' });
    b += A.pa('M165 212 q3 3 6 0', 'none', { stroke: '#C4736A', sw: 1.4 });
    b += A.ci(158, 196, 4, '#FFE1B0', { sw: 1.6 });
    b += A.ci(178, 196, 4, '#FFE1B0', { sw: 1.6 });

    /* 책상 */
    b += A.sh(224, 236, 200, 14, '#F2B270', { r: 5 });
    b += A.sh(234, 250, 12, 38, '#DCA066', { r: 3 });
    b += A.sh(402, 250, 12, 38, '#DCA066', { r: 3 });
    b += A.sh(240, 222, 62, 16, '#FFE9A8', { r: 3, sw: 1.4 });

    /* 컴퓨터 */
    b += A.sh(250, 158, 104, 70, '#C6CCDC', { r: 6 });
    b += A.sh(256, 164, 92, 54, '#8FD3FF', { r: 3, sw: 1.6 });
    b += A.sh(292, 228, 18, 8, '#969CB2', { r: 3, sw: 1.4 });
    b += A.sh(266, 234, 62, 7, '#C6CCDC', { r: 3, sw: 1.4 });
    b += A.sh(260, 226, 76, 12, '#E4E9F2', { r: 4, sw: 1.6 });

    /* 연필꽂이 */
    b += A.sh(228, 204, 22, 32, '#FFB38A', { r: 5, sw: 1.8 });
    b += A.ln(234, 204, 232, 188, '#FF9EB5', 3);
    b += A.ln(244, 204, 248, 192, '#8FD3FF', 3);

    /* 과일 그릇 */
    b += A.el(384, 226, 18, 7, '#FFF6E8', { sw: 1.8 });
    b += A.pa('M368 224 Q384 244 400 224 Z', '#FFF6E8', { sw: 1.8 });

    /* 러그 */
    b += A.el(296, 318, 96, 28, '#FFE9A8', { sw: 2 });
    b += A.el(296, 318, 74, 18, 'none', { stroke: '#F3CF6E', sw: 2 });

    /* 고양이 */
    b += A.el(414, 314, 22, 14, '#FFCE9E', { sw: 2 });
    b += A.ci(436, 306, 10, '#FFCE9E', { sw: 2 });
    b += A.pa('M429 298 L427 288 L434 294 Z', '#FFCE9E', { sw: 1.4 });
    b += A.pa('M443 298 L445 288 L438 294 Z', '#FFCE9E', { sw: 1.4 });
    b += A.ci(440, 306, 1.3, INK, { stroke: 'none' });
    b += A.pa('M392 308 Q380 298 386 290', 'none', { stroke: '#FFCE9E', sw: 5 });
    b += A.pa('M432 310 q4 3 8 0', 'none', { stroke: '#C4736A', sw: 1.4 });

    /* 바닥 장난감 */
    b += A.sh(46, 300, 24, 24, '#FFD166', { r: 4, sw: 1.8 });
    b += A.sh(76, 308, 18, 18, '#8FD3FF', { r: 4, sw: 1.8 });

    /* ── 숨은 물건 7개 ── */
    const items = [
      { id: 'key', name: '열쇠', x: 186, y: 232, s: 0.95, rot: 24 },
      { id: 'star', name: '별', x: 146, y: 106, s: 0.8, rot: -12 },
      { id: 'apple', name: '사과', x: 384, y: 218, s: 0.8, rot: 6 },
      { id: 'pencil', name: '연필', x: 236, y: 196, s: 0.85, rot: 8 },
      { id: 'usb', name: 'USB', x: 348, y: 230, s: 0.82, rot: -90 },
      { id: 'glasses', name: '안경', x: 120, y: 214, s: 0.9, rot: -8 },
      { id: 'donut', name: '도넛', x: 288, y: 56, s: 0.8, rot: 0 }
    ];
    items.forEach(it => { b += A.placed(it.id, it.x, it.y, it.s, it.rot); });

    A.hiddenScenes.push({ id: 'bedroom', name: '내 방', w: 520, h: 380, base: b, items });
  })();
})();
