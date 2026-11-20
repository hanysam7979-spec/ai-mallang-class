/* ══════════════════════════════════════════════════════════════
   games/earth.js — 🌍 지구 타이핑 v2
   · ① 지구 한 바퀴      : 나라 이름 성공 → 지구본이 부드럽게 돌며 다음 나라로
   · ② 나라 골라 도시 타자: 나라 지도 위 도시 핀 + 자동차/비행기가 경로를 따라 이동
   · 모든 나라에 국기 + 대표 랜드마크, 도시 5곳, 랜덤 출제, 큰 글씨(40px+)
   · 국경 데이터: Natural Earth 단순화 (js/geo.js)
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CC = window.CC;
  CC.games = CC.games || {};
  const E = (CC.games.earth = {});
  const TAU = Math.PI * 2;
  const RAD = Math.PI / 180;

  /* ══════════════════════════════════════════════════════════
     나라 24개국 · 도시 5곳씩 (위도·경도)
     ══════════════════════════════════════════════════════════ */
  const COUNTRIES = [
    { name: '대한민국', iso: 'KOR', continent: '아시아', lat: 36.4, lon: 127.8, flag: { t: 'kr' }, icon: 'namsan',
      cities: [['서울', 37.57, 126.98], ['부산', 35.18, 129.08], ['대구', 35.87, 128.60], ['인천', 37.46, 126.71], ['제주', 33.50, 126.53]] },
    { name: '일본', iso: 'JPN', continent: '아시아', lat: 36.2, lon: 138.0, flag: { t: 'jp' }, icon: 'fuji',
      cities: [['도쿄', 35.68, 139.69], ['오사카', 34.69, 135.50], ['교토', 35.01, 135.77], ['후쿠오카', 33.59, 130.40], ['삿포로', 43.06, 141.35]] },
    { name: '중국', iso: 'CHN', continent: '아시아', lat: 35.8, lon: 104.2, flag: { t: 'h', s: [['#DE2910', 1]], star: '#FFDE00' }, icon: 'gate',
      cities: [['베이징', 39.90, 116.41], ['상하이', 31.23, 121.47], ['시안', 34.34, 108.94], ['홍콩', 22.32, 114.17], ['광저우', 23.13, 113.26]] },
    { name: '인도', iso: 'IND', continent: '아시아', lat: 22.6, lon: 79.0, flag: { t: 'h', s: [['#FF9933', 1], ['#FFFFFF', 1], ['#138808', 1]], circle: '#3C4B96' }, icon: 'taj',
      cities: [['델리', 28.61, 77.21], ['뭄바이', 19.08, 72.88], ['콜카타', 22.57, 88.36], ['벵갈루루', 12.97, 77.59], ['첸나이', 13.08, 80.27]] },
    { name: '베트남', iso: 'VNM', continent: '아시아', lat: 14.0, lon: 108.2, flag: { t: 'h', s: [['#DA251D', 1]], star: '#FFFF00' }, icon: 'boat',
      cities: [['하노이', 21.03, 105.85], ['호찌민', 10.82, 106.63], ['다낭', 16.05, 108.22], ['후에', 16.46, 107.59], ['하이퐁', 20.86, 106.68]] },
    { name: '태국', iso: 'THA', continent: '아시아', lat: 15.9, lon: 101.0, flag: { t: 'h', s: [['#A51931', 1], ['#F4F5F8', 1], ['#2D2A4A', 2], ['#F4F5F8', 1], ['#A51931', 1]] }, icon: 'pagoda',
      cities: [['방콕', 13.76, 100.50], ['치앙마이', 18.79, 98.98], ['푸켓', 7.88, 98.39], ['아유타야', 14.35, 100.57], ['파타야', 12.93, 100.88]] },
    { name: '프랑스', iso: 'FRA', continent: '유럽', lat: 46.6, lon: 2.2, flag: { t: 'v', s: [['#0055A4', 1], ['#FFFFFF', 1], ['#EF4135', 1]] }, icon: 'eiffel',
      cities: [['파리', 48.86, 2.35], ['리옹', 45.76, 4.84], ['마르세유', 43.30, 5.37], ['니스', 43.71, 7.26], ['보르도', 44.84, -0.58]] },
    { name: '영국', iso: 'GBR', continent: '유럽', lat: 54.5, lon: -2.5, flag: { t: 'uk' }, icon: 'bigben',
      cities: [['런던', 51.51, -0.13], ['맨체스터', 53.48, -2.24], ['에든버러', 55.95, -3.19], ['옥스퍼드', 51.75, -1.26], ['리버풀', 53.41, -2.98]] },
    { name: '독일', iso: 'DEU', continent: '유럽', lat: 51.0, lon: 10.4, flag: { t: 'h', s: [['#000000', 1], ['#DD0000', 1], ['#FFCE00', 1]] }, icon: 'bgate',
      cities: [['베를린', 52.52, 13.40], ['뮌헨', 48.14, 11.58], ['함부르크', 53.55, 9.99], ['쾰른', 50.94, 6.96], ['프랑크푸르트', 50.11, 8.68]] },
    { name: '이탈리아', iso: 'ITA', continent: '유럽', lat: 42.6, lon: 12.6, flag: { t: 'v', s: [['#009246', 1], ['#FFFFFF', 1], ['#CE2B37', 1]] }, icon: 'arches',
      cities: [['로마', 41.90, 12.50], ['밀라노', 45.46, 9.19], ['베네치아', 45.44, 12.32], ['나폴리', 40.85, 14.27], ['피렌체', 43.77, 11.26]] },
    { name: '스페인', iso: 'ESP', continent: '유럽', lat: 40.3, lon: -3.7, flag: { t: 'h', s: [['#AA151B', 1], ['#F1BF00', 2], ['#AA151B', 1]] }, icon: 'arches',
      cities: [['마드리드', 40.42, -3.70], ['바르셀로나', 41.39, 2.17], ['세비야', 37.39, -5.98], ['그라나다', 37.18, -3.60], ['발렌시아', 39.47, -0.38]] },
    { name: '러시아', iso: 'RUS', continent: '유럽', lat: 56.0, lon: 60.0, flag: { t: 'h', s: [['#FFFFFF', 1], ['#0039A6', 1], ['#D52B1E', 1]] }, icon: 'onion',
      cities: [['모스크바', 55.76, 37.62], ['상트페테르부르크', 59.93, 30.34], ['노보시비르스크', 55.01, 82.93], ['이르쿠츠크', 52.29, 104.28], ['블라디보스토크', 43.12, 131.89]] },
    { name: '이집트', iso: 'EGY', continent: '아프리카', lat: 26.8, lon: 30.8, flag: { t: 'h', s: [['#CE1126', 1], ['#FFFFFF', 1], ['#000000', 1]], circle: '#C09300' }, icon: 'pyramid',
      cities: [['카이로', 30.04, 31.24], ['알렉산드리아', 31.20, 29.92], ['룩소르', 25.69, 32.64], ['아스완', 24.09, 32.90], ['후르가다', 27.26, 33.81]] },
    { name: '케냐', iso: 'KEN', continent: '아프리카', lat: -0.1, lon: 37.9, flag: { t: 'h', s: [['#000000', 1], ['#BB0000', 1], ['#006600', 1]] }, icon: 'savanna',
      cities: [['나이로비', -1.29, 36.82], ['몸바사', -4.04, 39.67], ['키수무', -0.09, 34.77], ['나쿠루', -0.30, 36.08], ['엘도레트', 0.05, 35.27]] },
    { name: '남아프리카공화국', iso: 'ZAF', continent: '아프리카', lat: -30.6, lon: 22.9, flag: { t: 'za' }, icon: 'table',
      cities: [['케이프타운', -33.92, 18.42], ['요하네스버그', -26.20, 28.05], ['더반', -29.86, 31.02], ['프리토리아', -25.75, 28.19], ['포트엘리자베스', -33.96, 25.60]] },
    { name: '모로코', iso: 'MAR', continent: '아프리카', lat: 31.8, lon: -6.5, flag: { t: 'h', s: [['#C1272D', 1]], star: '#006233' }, icon: 'gate',
      cities: [['카사블랑카', 33.57, -7.59], ['마라케시', 31.63, -8.01], ['페스', 34.03, -5.00], ['탕헤르', 35.76, -5.83], ['아가디르', 30.42, -9.60]] },
    { name: '나이지리아', iso: 'NGA', continent: '아프리카', lat: 9.1, lon: 8.7, flag: { t: 'v', s: [['#008751', 1], ['#FFFFFF', 1], ['#008751', 1]] }, icon: 'savanna',
      cities: [['라고스', 6.52, 3.38], ['아부자', 9.06, 7.49], ['카노', 12.00, 8.52], ['이바단', 7.38, 3.95], ['포트하커트', 4.82, 7.03]] },
    { name: '미국', iso: 'USA', continent: '아메리카', lat: 39.5, lon: -98.4, flag: { t: 'us' }, icon: 'liberty',
      cities: [['뉴욕', 40.71, -74.01], ['로스앤젤레스', 34.05, -118.24], ['시카고', 41.88, -87.63], ['샌프란시스코', 37.77, -122.42], ['워싱턴', 38.91, -77.04]] },
    { name: '브라질', iso: 'BRA', continent: '아메리카', lat: -12.0, lon: -50.0, flag: { t: 'br' }, icon: 'christ',
      cities: [['상파울루', -23.55, -46.63], ['리우데자네이루', -22.91, -43.17], ['브라질리아', -15.79, -47.88], ['마나우스', -3.12, -60.02], ['살바도르', -12.97, -38.50]] },
    { name: '캐나다', iso: 'CAN', continent: '아메리카', lat: 56.1, lon: -106.3, flag: { t: 'ca' }, icon: 'maple',
      cities: [['토론토', 43.65, -79.38], ['밴쿠버', 49.28, -123.12], ['몬트리올', 45.50, -73.57], ['오타와', 45.42, -75.70], ['캘거리', 51.05, -114.07]] },
    { name: '멕시코', iso: 'MEX', continent: '아메리카', lat: 23.6, lon: -102.6, flag: { t: 'v', s: [['#006847', 1], ['#FFFFFF', 1], ['#CE1126', 1]], circle: '#8C6B2F' }, icon: 'pyramid',
      cities: [['멕시코시티', 19.43, -99.13], ['과달라하라', 20.66, -103.35], ['칸쿤', 21.16, -86.85], ['오악사카', 17.07, -96.72], ['몬테레이', 25.69, -100.32]] },
    { name: '페루', iso: 'PER', continent: '아메리카', lat: -9.2, lon: -75.0, flag: { t: 'v', s: [['#D91023', 1], ['#FFFFFF', 1], ['#D91023', 1]] }, icon: 'machu',
      cities: [['리마', -12.05, -77.04], ['쿠스코', -13.53, -71.97], ['아레키파', -16.41, -71.54], ['이키토스', -3.75, -73.25], ['트루히요', -8.11, -79.03]] },
    { name: '호주', iso: 'AUS', continent: '오세아니아', lat: -25.3, lon: 133.8, flag: { t: 'au' }, icon: 'opera',
      cities: [['시드니', -33.87, 151.21], ['멜버른', -37.81, 144.96], ['브리즈번', -27.47, 153.03], ['퍼스', -31.95, 115.86], ['애들레이드', -34.93, 138.60]] },
    { name: '뉴질랜드', iso: 'NZL', continent: '오세아니아', lat: -41.0, lon: 174.0, flag: { t: 'nz' }, icon: 'kiwi',
      cities: [['오클랜드', -36.85, 174.76], ['웰링턴', -41.29, 174.78], ['크라이스트처치', -43.53, 172.64], ['퀸스타운', -45.03, 168.66], ['로토루아', -38.14, 176.25]] }
  ];
  E.COUNTRIES = COUNTRIES;
  const CONT = { '아시아': '#7FD08A', '유럽': '#8FD3FF', '아프리카': '#FFD166', '아메리카': '#FF9C7A', '오세아니아': '#BDA9FF' };

  const ringsOf = (c) => (CC.geo && CC.geo[c.iso]) || [];

  /* ══════════════════════════════════════════════════════════
     국기 · 랜드마크
     ══════════════════════════════════════════════════════════ */
  function drawFlag(ctx, x, y, w, h, spec) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const t = spec.t;
    if (t === 'h' || t === 'v') {
      const total = spec.s.reduce((a, c) => a + c[1], 0);
      let p = t === 'h' ? y : x;
      spec.s.forEach(([col, wt]) => {
        const len = (t === 'h' ? h : w) * (wt / total);
        ctx.fillStyle = col;
        if (t === 'h') ctx.fillRect(x, p, w, len + 1);
        else ctx.fillRect(p, y, len + 1, h);
        p += len;
      });
    } else if (t === 'jp') {
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#D0103A';
      ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * 0.30, 0, TAU); ctx.fill();
    } else if (t === 'kr') {
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#CD2E3A';
      ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * 0.26, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#0047A0';
      ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * 0.26, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 3, y + 3, w * 0.12, 2); ctx.fillRect(x + w - 3 - w * 0.12, y + h - 5, w * 0.12, 2);
    } else if (t === 'uk') {
      ctx.fillStyle = '#012169'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = h * 0.18;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.moveTo(x + w, y); ctx.lineTo(x, y + h); ctx.stroke();
      ctx.strokeStyle = '#C8102E'; ctx.lineWidth = h * 0.09;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.moveTo(x + w, y); ctx.lineTo(x, y + h); ctx.stroke();
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = h * 0.22;
      ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
      ctx.strokeStyle = '#C8102E'; ctx.lineWidth = h * 0.12;
      ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
    } else if (t === 'br') {
      ctx.fillStyle = '#009C3B'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#FFDF00';
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + h * 0.14); ctx.lineTo(x + w * 0.86, y + h / 2);
      ctx.lineTo(x + w / 2, y + h * 0.86); ctx.lineTo(x + w * 0.14, y + h / 2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#002776';
      ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * 0.19, 0, TAU); ctx.fill();
    } else if (t === 'ca') {
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#D80621';
      ctx.fillRect(x, y, w * 0.25, h); ctx.fillRect(x + w * 0.75, y, w * 0.25, h);
      ctx.beginPath();
      const cx = x + w / 2, cy = y + h / 2, r = h * 0.3;
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const rr = i % 2 ? r * 0.45 : r;
        const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    } else if (t === 'us') {
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = i % 2 ? '#FFFFFF' : '#B22234';
        ctx.fillRect(x, y + h * i / 7, w, h / 7 + 1);
      }
      ctx.fillStyle = '#3C3B6E';
      ctx.fillRect(x, y, w * 0.42, h * 0.55);
    } else if (t === 'za') {
      ctx.fillStyle = '#007A4D'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#FFB612';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * 0.42, y + h / 2); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#002395';
      ctx.beginPath(); ctx.moveTo(x, y + h * 0.2); ctx.lineTo(x + w * 0.3, y + h / 2); ctx.lineTo(x, y + h * 0.8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x, y + h * 0.42, w, h * 0.16);
    } else if (t === 'au' || t === 'nz') {
      ctx.fillStyle = '#00247D'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(x + w * 0.75, y + h * 0.36, h * 0.08, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(x + w * 0.74, y + h * 0.72, h * 0.06, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(x + w * 0.88, y + h * 0.58, h * 0.05, 0, TAU); ctx.fill();
    }
    if (spec.star) {
      ctx.fillStyle = spec.star;
      ctx.beginPath();
      const cx = x + w / 2, cy = y + h / 2, r = h * 0.24;
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const rr = i % 2 ? r * 0.45 : r;
        i ? ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
          : ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill();
    }
    if (spec.circle) {
      ctx.fillStyle = spec.circle;
      ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * 0.16, 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(32,22,44,.32)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
  }

  /* 랜드마크 (픽셀 느낌의 단순 도형) */
  function drawIcon(ctx, cx, cy, s, type) {
    const P = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(cx + x * s, cy + y * s, w * s, h * s); };
    const tri = (x, y, w, h, col) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(cx + x * s, cy + (y + h) * s);
      ctx.lineTo(cx + (x + w / 2) * s, cy + y * s);
      ctx.lineTo(cx + (x + w) * s, cy + (y + h) * s);
      ctx.closePath();
      ctx.fill();
    };
    const circ = (x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx + x * s, cy + y * s, r * s, 0, TAU); ctx.fill(); };
    switch (type) {
      case 'pyramid':
        tri(-22, -8, 44, 26, '#F2C878'); tri(-22, -8, 22, 26, '#E0AE5C');
        P(14, -14, 6, 6, '#FFE9A8');
        break;
      case 'eiffel':
        tri(-14, -26, 28, 34, '#9FA8C8');
        P(-10, -6, 20, 3, '#8C96B8'); P(-7, 2, 14, 3, '#8C96B8');
        P(-2, -26, 4, 8, '#C6CEE8');
        break;
      case 'bigben':
        P(-8, -26, 16, 30, '#E8DFC8'); P(-10, -30, 20, 6, '#C9BFA6');
        P(-4, -20, 8, 8, '#FFF6DC'); P(-1, -18, 2, 4, '#4A4152');
        break;
      case 'arches':
        P(-20, -10, 40, 20, '#F0D9B0');
        for (let i = 0; i < 3; i++) { ctx.fillStyle = '#C9A87E'; ctx.fillRect(cx + (-16 + i * 12) * s, cy + (-4) * s, 8 * s, 14 * s); }
        P(-22, -14, 44, 5, '#E4C79A');
        break;
      case 'pagoda':
        tri(-18, -6, 36, 8, '#D96B4A'); P(-12, 2, 24, 8, '#F0D9B0');
        tri(-14, -16, 28, 8, '#D96B4A'); P(-8, -8, 16, 6, '#F0D9B0');
        break;
      case 'gate':
        P(-18, -16, 6, 26, '#C05A3C'); P(12, -16, 6, 26, '#C05A3C');
        P(-22, -20, 44, 5, '#E0A24A'); P(-16, -6, 32, 4, '#E0A24A');
        break;
      case 'taj':
        P(-18, -8, 36, 18, '#F4EEE0');
        ctx.fillStyle = '#F4EEE0';
        ctx.beginPath(); ctx.arc(cx, cy - 8 * s, 12 * s, Math.PI, 0); ctx.fill();
        P(-2, -30, 4, 10, '#E4DCC8');
        P(-24, -14, 6, 4, '#E4DCC8'); P(18, -14, 6, 4, '#E4DCC8');
        break;
      case 'namsan':            /* 남산타워 */
        P(-3, -14, 6, 24, '#D8DCE8');
        P(-9, -2, 18, 4, '#B9C0D0');
        P(-6, 6, 12, 7, '#9BA3B8');
        circ(0, -20, 6, '#FF7A60'); circ(0, -20, 3, '#FFF3EC');
        P(-1, -32, 2, 9, '#C9CEDA');
        break;
      case 'fuji':              /* 후지산 */
        tri(-24, -4, 48, 24, '#8FB0D8');
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(cx - 7 * s, cy + 2 * s); ctx.lineTo(cx, cy - 12 * s); ctx.lineTo(cx + 7 * s, cy + 2 * s);
        ctx.lineTo(cx + 3 * s, cy + 1 * s); ctx.lineTo(cx, cy + 4 * s); ctx.lineTo(cx - 3 * s, cy + 1 * s);
        ctx.closePath(); ctx.fill();
        P(-26, 16, 52, 4, '#6FB85C');
        break;
      case 'liberty':           /* 자유의 여신상 */
        P(-4, -12, 8, 22, '#7FC8B8');
        P(-10, 10, 20, 5, '#C9BFA6');
        circ(0, -16, 4, '#8FD3C2');
        P(-1, -30, 3, 11, '#8FD3C2');
        circ(0, -31, 3, '#FFCE4A');
        break;
      case 'christ':            /* 구세주 그리스도상 */
        P(-1.6, -26, 3.2, 26, '#E8E4D8');
        P(-11, -18, 22, 3.4, '#E8E4D8');
        P(-8, 0, 16, 4, '#B0A99A');
        circ(0, -28, 3, '#FFF6DC');
        break;
      case 'machu':             /* 마추픽추 */
        tri(-24, -2, 48, 20, '#A8C08A'); tri(-14, -8, 28, 16, '#8FAE72');
        P(-18, 6, 6, 8, '#C9BFA6'); P(-4, 4, 6, 10, '#C9BFA6'); P(10, 6, 6, 8, '#C9BFA6');
        break;
      case 'table':             /* 테이블마운틴 */
        P(-24, -10, 48, 6, '#BFC8D8'); P(-20, -4, 40, 14, '#A6B0C2');
        P(-24, 10, 48, 4, '#6FB85C');
        break;
      case 'bgate':             /* 브란덴부르크 문 */
        P(-22, -18, 44, 5, '#E4C79A');
        for (let i = 0; i < 4; i++) P(-18 + i * 11, -13, 5, 22, '#F0D9B0');
        P(-24, 9, 48, 5, '#C9A87E');
        break;
      case 'tower':
        P(-12, -22, 24, 30, '#9FC6E8'); P(-8, -18, 6, 6, '#E8F6FF'); P(2, -18, 6, 6, '#E8F6FF');
        P(-12, -10, 24, 4, '#7FA8CC');
        break;
      case 'opera':
        ctx.fillStyle = '#F0F4FF';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.ellipse(cx + (-10 + i * 10) * s, cy + 6 * s, 12 * s, 16 * s, -0.5, Math.PI, TAU);
          ctx.fill();
        }
        P(-18, 6, 36, 4, '#8FD3FF');
        break;
      case 'savanna':
        P(-3, -10, 5, 22, '#8A6A3A');
        ctx.fillStyle = '#6FB85C';
        ctx.beginPath(); ctx.ellipse(cx, cy - 12 * s, 20 * s, 8 * s, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#8FD07A';
        ctx.beginPath(); ctx.ellipse(cx - 8 * s, cy - 15 * s, 10 * s, 5 * s, 0, 0, TAU); ctx.fill();
        P(14, -20, 6, 6, '#FFE9A8');
        break;
      case 'maple':
        P(-2, 0, 4, 12, '#8A6A3A');
        ctx.fillStyle = '#D80621';
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + i * Math.PI / 5;
          const rr = (i % 2 ? 8 : 18) * s;
          i ? ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
            : ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        }
        ctx.closePath(); ctx.fill();
        break;
      case 'sakura':
        P(-2, 2, 4, 12, '#8A6A3A');
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + i * TAU / 5;
          ctx.fillStyle = '#FFB7D5';
          ctx.beginPath();
          ctx.ellipse(cx + Math.cos(a) * 9 * s, cy - 6 * s + Math.sin(a) * 9 * s, 7 * s, 5 * s, a, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = '#FFE9A8';
        ctx.beginPath(); ctx.arc(cx, cy - 6 * s, 3 * s, 0, TAU); ctx.fill();
        break;
      case 'toucan':
        P(-14, -12, 20, 16, '#3A3A56');
        P(-2, -12, 14, 7, '#FFB84A');
        P(-4, -8, 10, 4, '#FF7A60');
        circ(-8, -8, 3, '#FFFFFF');
        break;
      case 'kiwi':
        P(-14, -12, 24, 20, '#8A6A3A');
        P(8, -14, 10, 5, '#C9A87E');
        P(-19, -9, 5, 12, '#6E5230');
        circ(-2, -8, 2.4, '#FFFFFF');
        break;
      case 'boat':
        P(-18, 4, 36, 5, '#C6834A');
        tri(-10, -16, 20, 20, '#E8B84A');
        P(-2, -22, 3, 6, '#C05A3C');
        break;
      case 'onion':
        ctx.fillStyle = '#C6D6F0';
        ctx.beginPath(); ctx.ellipse(cx, cy - 2 * s, 12 * s, 15 * s, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#E8F0FF';
        ctx.beginPath(); ctx.ellipse(cx - 3 * s, cy - 8 * s, 5 * s, 7 * s, 0, 0, TAU); ctx.fill();
        P(-2, -24, 4, 8, '#9FB4D8');
        break;
      default:
        circ(0, -6, 12, '#FFCE4A');
    }
  }

  /* ══════════════════════════════════════════════════════════
     지구본 (정거원판 투영 · 텍스처 샘플링)
     ══════════════════════════════════════════════════════════ */
  const TW = 720, TH = 360;
  let texData = null, texCanvas = null;

  function ringPath(ctx, ring, toXY, lonBase) {
    ctx.beginPath();
    let prev = null;
    for (let i = 0; i < ring.length; i++) {
      let lon = ring[i][0];
      if (lonBase != null) { while (lon - lonBase > 180) lon -= 360; while (lon - lonBase < -180) lon += 360; }
      else if (prev != null) { while (lon - prev > 180) lon -= 360; while (lon - prev < -180) lon += 360; }
      prev = lon;
      const p = toXY(lon, ring[i][1]);
      i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
    }
    ctx.closePath();
  }

  function buildTexture() {
    const cv = document.createElement('canvas');
    cv.width = TW; cv.height = TH;
    const g = cv.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, TH);
    grd.addColorStop(0, '#8FD3FF');
    grd.addColorStop(0.5, '#4E9FD8');
    grd.addColorStop(1, '#8FD3FF');
    g.fillStyle = grd;
    g.fillRect(0, 0, TW, TH);
    const toXY = (lon, lat) => ({ x: (lon + 180) / 360 * TW, y: (90 - lat) / 180 * TH });
    const land = (CC.land || []);
    const own = [];
    COUNTRIES.forEach(c => ringsOf(c).forEach(r => own.push(r)));
    /* 바다 살짝 물결 */
    g.globalAlpha = 0.13;
    for (let y = 0; y < TH; y += 26) {
      g.fillStyle = y % 52 ? '#BFE8FF' : '#2E82BC';
      g.fillRect(0, y, TW, 3);
    }
    g.globalAlpha = 1;
    /* 육지 */
    g.fillStyle = '#8ED08A';
    g.strokeStyle = '#5FAE6A';
    g.lineWidth = 1;
    land.forEach(ring => {
      [-TW, 0, TW].forEach(off => {
        ringPath(g, ring, (lon, lat) => { const p = toXY(lon, lat); return { x: p.x + off, y: p.y }; });
        g.fill();
      });
    });
    /* 나라 강조선은 그리지 않고, 바다/육지 경계만 */
    g.globalAlpha = 0.22;
    g.strokeStyle = '#FFFFFF';
    g.lineWidth = 1;
    for (let lat = -60; lat <= 60; lat += 30) {
      g.beginPath(); g.moveTo(0, toXY(0, lat).y); g.lineTo(TW, toXY(0, lat).y); g.stroke();
    }
    for (let lon = -180; lon <= 180; lon += 30) {
      g.beginPath(); g.moveTo(toXY(lon, 0).x, 0); g.lineTo(toXY(lon, 0).x, TH); g.stroke();
    }
    g.globalAlpha = 1;
    texCanvas = cv;
    texData = g.getImageData(0, 0, TW, TH).data;
  }

  /* 화면 좌표 ↔ (위도·경도) 분리형 정거원판 투영 */
  const GC = 176, GR = 148;              /* 지구본 중심 · 반지름(캔버스 좌표) */
  const sphere = { N: 300, colU: null, asinY: null };

  function sphereInit() {
    const N = sphere.N, R = N / 2 - 1;
    sphere.colU = new Float32Array(N);
    sphere.asinY = new Float32Array(N);
    for (let px = 0; px < N; px++) {
      const dx = (px + 0.5 - N / 2) / R;
      sphere.colU[px] = Math.abs(dx) <= 1 ? 0.5 + Math.asin(dx) / TAU : 0.5;
    }
    for (let py = 0; py < N; py++) {
      const dy = (N / 2 - py - 0.5) / R;
      sphere.asinY[py] = Math.abs(dy) <= 1 ? Math.asin(dy) : 0;
    }
  }

  const globeCache = new Map();
  function renderGlobe(lon0, tilt, hlIdx) {
    if (!texData) buildTexture();
    if (!sphere.colU) sphereInit();
    const N = sphere.N, R = N / 2 - 1;
    const key = lon0.toFixed(1) + '|' + tilt.toFixed(1) + '|' + hlIdx;
    if (globeCache.has(key)) return globeCache.get(key);

    const cv = document.createElement('canvas');
    cv.width = N; cv.height = N;
    const g = cv.getContext('2d');
    const img = g.createImageData(N, N);
    const d = img.data;
    const td = texData;
    const lonOff = lon0 / 360;
    const tiltV = tilt;
    const uCol = new Int32Array(N);
    for (let px = 0; px < N; px++) {
      let u = sphere.colU[px] + lonOff;
      u -= Math.floor(u);
      uCol[px] = (u * TW) | 0;
    }
    for (let py = 0; py < N; py++) {
      const lat = tiltV + sphere.asinY[py] / RAD;
      let v = (90 - lat) / 180 * TH;
      v = v < 0 ? 0 : (v >= TH ? TH - 1 : v);
      const row = (v | 0) * TW;
      const dy = (N / 2 - py - 0.5) / R;
      for (let px = 0; px < N; px++) {
        const dx = (px + 0.5 - N / 2) / R;
        const r2 = dx * dx + dy * dy;
        const o = (py * N + px) * 4;
        if (r2 > 1) { d[o + 3] = 0; continue; }
        const t = (row + uCol[px]) * 4;
        const sh = 0.70 + 0.34 * Math.sqrt(1 - r2);
        d[o] = td[t] * sh;
        d[o + 1] = td[t + 1] * sh;
        d[o + 2] = td[t + 2] * sh;
        d[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);

    /* 지금 나라 하이라이트 */
    const c = COUNTRIES[hlIdx];
    if (c) {
      const ringsArr = ringsOf(c);
      const dlon = ((c.lon - lon0 + 540) % 360) - 180;
      if (Math.abs(dlon) < 82 && Math.abs(c.lat - tilt) < 78) {
        g.save();
        g.beginPath(); g.arc(N / 2, N / 2, R, 0, TAU); g.clip();
        const toXY = (lon, lat) => ({
          x: N / 2 + R * Math.sin((lon - lon0) * RAD),
          y: N / 2 - R * Math.sin((lat - tilt) * RAD)
        });
        ringsArr.forEach(ring => {
          ringPath(g, ring, toXY, lon0);
          g.fillStyle = 'rgba(255,214,74,.78)';
          g.fill();
          g.strokeStyle = 'rgba(190,120,10,.9)';
          g.lineWidth = 1.6;
          g.stroke();
        });
        g.restore();
      }
    }

    /* 구 테두리 · 광택 */
    g.save();
    const gl = g.createRadialGradient(N * 0.34, N * 0.28, N * 0.05, N * 0.5, N * 0.5, N * 0.62);
    gl.addColorStop(0, 'rgba(255,255,255,.34)');
    gl.addColorStop(0.45, 'rgba(255,255,255,0)');
    gl.addColorStop(1, 'rgba(20,60,100,.22)');
    g.fillStyle = gl;
    g.beginPath(); g.arc(N / 2, N / 2, R, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.85)';
    g.lineWidth = 2.4;
    g.beginPath(); g.arc(N / 2, N / 2, R - 0.5, 0, TAU); g.stroke();
    g.restore();

    if (globeCache.size > 90) globeCache.clear();
    globeCache.set(key, cv);
    return cv;
  }

  function globePoint(lon, lat, lon0, tilt) {
    return {
      x: GC + GR * Math.sin((lon - lon0) * RAD),
      y: 168 - GR * Math.sin((lat - tilt) * RAD)
    };
  }

  /* ══════════════════════════════════════════════════════════
     나라 지도 (국경 폴리곤 + 도시 핀)
     ══════════════════════════════════════════════════════════ */
  function makeProj(rings, W, H, pad) {
    let x0 = 999, x1 = -999, y0 = 90, y1 = -90;
    rings.forEach(r => r.forEach(p => {
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]);
      y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
    }));
    if (x0 > x1) { x0 = -180; x1 = 180; y0 = -90; y1 = 90; }
    const midLat = (y0 + y1) / 2;
    const k = Math.max(0.15, Math.cos(midLat * RAD));
    const spanX = Math.max(0.6, (x1 - x0) * k), spanY = Math.max(0.6, y1 - y0);
    const s = Math.min((W - pad * 2) / spanX, (H - pad * 2) / spanY);
    const cxD = (x0 + x1) / 2, cyD = (y0 + y1) / 2;
    return {
      k, s,
      x: (lon) => W / 2 + (lon - cxD) * k * s,
      y: (lat) => H / 2 - (lat - cyD) * s
    };
  }

  function drawCityPin(g, x, y, label, state, idx, up) {
    g.save();
    if (state === 'target') {
      const t = (CC.now() % 1200) / 1200;
      g.strokeStyle = 'rgba(255,90,60,' + (0.85 - 0.65 * t) + ')';
      g.lineWidth = 3;
      g.beginPath(); g.arc(x, y, 11 + t * 15, 0, TAU); g.stroke();
    }
    g.beginPath();
    g.arc(x, y, 10, 0, TAU);
    g.fillStyle = state === 'done' ? '#57C79A' : (state === 'target' ? '#FF5B3C' : '#FFFFFF');
    g.fill();
    g.strokeStyle = state === 'target' ? '#B8321A' : '#4B4459';
    g.lineWidth = 2.4;
    g.stroke();
    g.fillStyle = state === 'target' ? '#FFFFFF' : '#4B4459';
    g.font = '900 11px "Noto Sans KR",sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(state === 'done' ? '✓' : String(idx + 1), x, y + 0.5);
    /* 이름표 */
    const text = label;
    g.font = '800 11px "Noto Sans KR",sans-serif';
    const w = g.measureText(text).width + 12;
    const ly = (up === false) ? y + 27 : y - 26;
    g.fillStyle = state === 'target' ? 'rgba(255,91,60,.95)' : 'rgba(255,255,255,.94)';
    g.beginPath();
    if (g.roundRect) g.roundRect(x - w / 2, ly - 9, w, 18, 9);
    else g.rect(x - w / 2, ly - 9, w, 18);
    g.fill();
    g.strokeStyle = state === 'target' ? '#B8321A' : 'rgba(120,110,140,.35)';
    g.lineWidth = 1.4;
    g.stroke();
    g.fillStyle = state === 'target' ? '#FFFFFF' : '#4B4459';
    g.fillText(text, x, ly + 0.5);
    g.restore();
  }

  function drawBadge(g, x, y, c) {
    /* 국기 + 랜드마크 흰 카드 */
    const w = 104, h = 54;
    g.save();
    g.shadowColor = 'rgba(60,50,80,.26)';
    g.shadowBlur = 10; g.shadowOffsetY = 3;
    g.fillStyle = '#FFFFFF';
    g.beginPath();
    if (g.roundRect) g.roundRect(x, y, w, h, 14);
    else g.rect(x, y, w, h);
    g.fill();
    g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(120,110,140,.28)';
    g.lineWidth = 1.6;
    g.stroke();
    drawFlag(g, x + 8, y + 8, 44, 29, c.flag);
    drawIcon(g, x + 78, y + 30, 0.62, c.icon);
    g.fillStyle = '#4B4459';
    g.font = '900 12px "Noto Sans KR",sans-serif';
    g.textAlign = 'left'; g.textBaseline = 'middle';
    const nm = c.name.length > 6 ? c.name.slice(0, 6) + '…' : c.name;
    g.fillText(nm, x + 8, y + 47);
    g.restore();
  }

  /* ══════════════════════════════════════════════════════════
     상태
     ══════════════════════════════════════════════════════════ */
  let S = null, raf = 0, root0 = null;
  const CW = 352, CH = 330;               /* 왼쪽 캔버스 (CSS px) */

  function freshState() {
    return {
      mode: 'world', cIdx: 0, sel: 0,
      deck: [], qi: 0, visited: new Set(), visitedCities: new Set(),
      keys: 0, err: 0, startedAt: 0, elapsed: 0, cpm: 0, acc: 100,
      done: false, phase: 'ready',
      lon0: COUNTRIES[0].lon, tilt: COUNTRIES[0].lat * 0.9,
      rot: null, travel: null, dirty: true,
      lastRot: 0
    };
  }

  function shuffleIdx(n) { return CC.shuffle(Array.from({ length: n }, (_, i) => i)); }

  function curCountry() {
    if (!S) return null;
    if (S.mode === 'city') return COUNTRIES[S.sel] || COUNTRIES[0];
    return COUNTRIES[S.deck[S.qi]] || COUNTRIES[0];
  }
  function curCity() {
    if (!S || S.mode !== 'city') return null;
    const c = curCountry();
    return c ? c.cities[S.deck[S.qi]] : null;
  }
  function curTarget() {
    if (!S) return '';
    if (S.mode === 'city') {
      const cy = curCity();
      return cy ? cy[0] : '';
    }
    const c = curCountry();
    return c ? c.name : '';
  }
  function targetLen() { return Array.from(curTarget()).length; }

  /* ══════════════════════════════════════════════════════════
     화면
     ══════════════════════════════════════════════════════════ */
  E.open = function () {
    const html = `
      <div class="earth-head">
        <div class="g-tabs" id="e-tabs" style="margin:0">
          <button class="g-tab is-on" data-m="world">① 지구 한 바퀴</button>
          <button class="g-tab" data-m="city">② 나라 골라 도시 타자</button>
        </div>
        <span style="flex:1"></span>
        <span class="badge badge-ok" id="e-left">완주 0나라</span>
        <span class="badge badge-warn" id="e-best">최고 —</span>
      </div>

      <div class="earth-body">
        <div class="earth-left">
          <div class="globe-panel">
            <canvas id="e-canvas" width="${CW}" height="${CH}"></canvas>
            <div class="globe-tag" id="e-gtag">지구</div>
          </div>
          <div class="earth-legend" id="e-legend"></div>
        </div>

        <div class="earth-side" id="e-side">
          <div class="earth-hud">
            <span class="eh">진행 <b id="e-prog">0 / 24</b></span>
            <span class="eh">타수 <b id="e-cpm">0</b></span>
            <span class="eh">정확도 <b id="e-acc">100%</b></span>
            <span class="eh">시간 <b id="e-time">0.0</b></span>
          </div>

          <div class="earth-card" id="e-card"></div>

          <div class="earth-input">
            <input id="e-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="이름을 입력하고 Enter">
            <button class="btn btn-sm btn-mint" id="e-skip">건너뛰기</button>
          </div>

          <div class="earth-pins" id="e-pins"></div>
          <div class="earth-tip" id="e-tip">지구본 위의 나라 이름을 보고 정확히 입력해 보세요.</div>
          <div id="e-result"></div>
        </div>
      </div>

      <div id="e-picker" style="display:none;margin-top:10px"></div>`;

    CC.ui.openModal({
      icon: '🌍', title: '지구 타이핑', sub: '세계 한 바퀴 — 나라 · 도시 이름을 타이핑!',
      size: 'lg', body: html,
      onMount(root) { wire(root); },
      onClose() { stop(); }
    });
  };

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (S && S.timer) clearInterval(S.timer);
    S = null; root0 = null;
  }

  function wire(root) {
    root0 = root;
    S = freshState();
    const $ = (id) => root.querySelector('#' + id);
    const cv = $('e-canvas');
    const g = cv.getContext('2d');
    const input = $('e-input');

    startWorld();
    paintAll();

    root.querySelector('#e-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-m]');
      if (!b) return;
      CC.sfx.click();
      root.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('is-on', x === b));
      if (b.dataset.m === 'city') {
        S.mode = 'city';
        S.phase = 'pick';
        S.done = true;
        $('e-picker').style.display = 'block';
        renderPicker();
        paintAll();
      } else {
        S.mode = 'world';
        $('e-picker').style.display = 'none';
        startWorld();
        paintAll();
      }
    });

    input.addEventListener('compositionstart', () => { S.composing = true; });
    input.addEventListener('compositionend', () => {
      S.composing = false;
      checkInput();
    });
    input.addEventListener('input', () => {
      if (!S || S.done) return;
      const v = input.value;
      const t = curTarget();
      if (!S.startedAt) { S.startedAt = CC.now(); S.timer = setInterval(tick, 100); }
      S.keys++;
      /* 조합 중(한글 IME)에는 판정하지 않는다 */
      if (S.composing || v.length < Array.from(t).length) {
        paintTarget();
        paintHud();
        return;
      }
      checkInput();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && S && !S.done) { e.preventDefault(); checkInput(true); }
    });
    function checkInput(force) {
      if (!S || S.done) return;
      const t = curTarget();
      let v = input.value;
      if (S.composing && !force) return;
      if (v === t) { accept(); return; }
      if (Array.from(v).length >= Array.from(t).length) {
        S.err++;
        CC.sfx.err();
        input.classList.add('bad');
        setTimeout(() => input.classList.remove('bad'), 220);
        if (force) { input.value = ''; paintTarget(); }
        paintHud();
      } else {
        paintTarget();
        paintHud();
      }
    }

    $('e-skip').onclick = () => {
      if (!S || S.done || S.phase !== 'ready') return;
      CC.sfx.click();
      input.value = '';
      nextProblem(false);
    };

    function tick() {
      if (!S || S.done) return;
      S.elapsed = (CC.now() - S.startedAt) / 1000;
      S.cpm = S.elapsed > 0.7 ? Math.round(S.keys / S.elapsed * 60) : 0;
      paintHud();
    }

    /* ── 정답 ── */
    function accept() {
      const c = curCountry();
      if (!c) return;
      CC.sfx.pop();
      input.value = '';
      input.classList.remove('bad');
      S.phase = 'travel';
      if (S.mode === 'world') {
        S.visited.add(c.name);
        $('e-tip').innerHTML = `<b>${c.name}</b> 완주! ${c.continent}으로 날아갑니다 ✈️`;
        startRotate();
      } else {
        const ci = S.deck[S.qi];
        S.visitedCities.add(c.name + ci);
        $('e-tip').innerHTML = `<b>${c.cities[ci][0]}</b> 도착! 다음 도시로 출발 🚗`;
        startCityTravel(ci);
      }
      paintHud();
      paintAll();
    }

    function nextProblem(increment) {
      if (S.qi + 1 >= S.deck.length) return finish();
      S.qi++;
      S.phase = 'ready';
      S.travel = null;
      S.rot = null;
      if (S.mode === 'world') {
        const c = curCountry();
        S.lon0 = c.lon;
        S.tilt = c.lat * 0.9;
      }
      $('e-tip').innerHTML = S.mode === 'world'
        ? '지구본의 나라 이름을 정확히 입력해 보세요.'
        : '지도에서 빨간 핀 도시 이름을 입력해 보세요.';
      paintAll();
      setTimeout(() => { if (S) input.focus(); }, 30);
    }

    /* ── 지구본 회전 애니메이션 ── */
    function startRotate() {
      const prev = curCountry();
      const nextIdx = S.deck[S.qi + 1];
      if (nextIdx == null) { S.travel = null; S.phase = 'ready'; finish(); return; }
      const next = COUNTRIES[nextIdx];
      const lonFrom = S.lon0;
      let d = ((next.lon - lonFrom + 540) % 360) - 180;
      const tiltFrom = S.tilt, tiltTo = next.lat * 0.9;
      const from = globePoint(prev.lon, prev.lat, S.lon0, S.tilt);
      const to = globePoint(next.lon, next.lat, lonFrom + d, tiltTo);
      S.rot = {
        t0: CC.now(), dur: 1150, lonFrom, dLon: d, tiltFrom, tiltTo,
        lonCur: lonFrom, tiltCur: tiltFrom
      };
      S.travel = { t0: CC.now(), dur: 1150, from, to, kind: 'plane', cityMode: false };
      loop();
    }

    /* ── 나라 지도 위 이동 애니메이션 ── */
    function startCityTravel(targetCi) {
      const c = curCountry();
      const proj = S.proj;
      if (!proj) return;
      const tc = c.cities[targetCi];
      const to = { x: proj.x(tc[2]), y: proj.y(tc[1]) };
      let from = { x: CW * 0.5, y: CH * 0.35 };
      /* 바로 앞 도시(방금 도착하기 전)에서 출발 */
      const prevIdx = S.prevCityIdx;
      if (prevIdx != null && prevIdx !== targetCi) {
        const pc = c.cities[prevIdx];
        from = { x: proj.x(pc[2]), y: proj.y(pc[1]) };
      } else {
        from = { x: CW * 0.28, y: CH * 0.30 };
      }
      const far = Math.hypot(to.x - from.x, to.y - from.y) > 180;
      S.travel = { t0: CC.now(), dur: 950, from, to, kind: far ? 'plane' : 'car', cityMode: true, targetCi };
      S.prevCityIdx = targetCi;
      loop();
    }

    function finish() {
      S.done = true;
      if (S.timer) clearInterval(S.timer);
      const acc = S.keys ? Math.round((S.keys - S.err) / S.keys * 100) : 100;
      const done = S.mode === 'world' ? S.visited.size : S.visitedCities.size;
      if (S.mode === 'world') {
        const prev = CC.best.earth || 0;
        if (done > prev) CC.saveBest({ earth: done });
      }
      CC.sfx.cheer();
      $('e-result').innerHTML = `
        <div class="result-card" style="margin-top:8px">
          <h3>🌍 ${S.mode === 'world' ? '지구 한 바퀴 완주!' : '도시 타자 완주!'}</h3>
          <p>${done}곳 완주 · ${S.elapsed.toFixed(1)}초 · 정확도 ${acc}%</p>
          <div class="result-stats">
            <div><span>완주</span><b>${done}</b></div>
            <div><span>타수</span><b>${S.cpm}</b></div>
            <div><span>정확도</span><b>${acc}%</b></div>
          </div>
          <div style="margin-top:10px;display:flex;gap:6px;justify-content:center">
            <button class="btn btn-sm btn-yellow" id="e-again">다시 도전</button>
            ${S.mode === 'city' ? '<button class="btn btn-sm btn-mint" id="e-other">다른 나라</button>' : ''}
            ${done >= 5 ? '<span class="badge badge-ok" style="align-self:center">🏆 5곳 트로피!</span>' : ''}
          </div>
        </div>`;
      const again = root.querySelector('#e-again');
      if (again) again.onclick = () => {
        CC.sfx.click();
        $('e-result').innerHTML = '';
        if (S.mode === 'world') { startWorld(); }
        else { S.visitedCities = new Set(); beginCity(S.sel); }
        paintAll();
      };
      const other = root.querySelector('#e-other');
      if (other) other.onclick = () => {
        CC.sfx.click();
        $('e-result').innerHTML = '';
        $('e-picker').style.display = 'block';
        S.phase = 'pick';
        S.done = true;
        renderPicker();
        paintAll();
      };
      paintAll();
    }

    function startWorld() {
      if (S.timer) clearInterval(S.timer);
      S.mode = 'world';
      S.deck = shuffleIdx(COUNTRIES.length);
      S.qi = 0;
      S.visited = new Set();
      S.keys = 0; S.err = 0; S.startedAt = 0; S.elapsed = 0; S.cpm = 0; S.acc = 100;
      S.done = false; S.phase = 'ready'; S.travel = null; S.rot = null;
      const c = curCountry();
      S.lon0 = c.lon; S.tilt = c.lat * 0.9;
      $('e-result').innerHTML = '';
      $('e-picker').style.display = 'none';
      $('e-tip').innerHTML = '지구본에 표시된 나라 이름을 정확히 입력해 보세요.';
    }

    function beginCity(idx, keepVisited) {
      if (S.timer) clearInterval(S.timer);
      S.mode = 'city';
      S.sel = idx;
      S.deck = shuffleIdx(COUNTRIES[idx].cities.length);
      S.qi = 0;
      if (!keepVisited) S.visitedCities = new Set();
      S.keys = 0; S.err = 0; S.startedAt = 0; S.elapsed = 0; S.cpm = 0; S.acc = 100;
      S.done = false; S.phase = 'ready'; S.travel = null; S.prevCityIdx = null;
      S.proj = null;
      $('e-result').innerHTML = '';
      $('e-picker').style.display = 'none';
      $('e-tip').innerHTML = '지도에서 빨간 핀 도시 이름을 입력해 보세요.';
    }

    /* ── HUD ── */
    function paintHud() {
      if (!S) return;
      const total = S.deck.length || 1;
      $('e-prog').textContent = S.qi + ' / ' + total;
      $('e-cpm').textContent = S.cpm;
      $('e-acc').textContent = (S.keys ? Math.round((S.keys - S.err) / S.keys * 100) : 100) + '%';
      $('e-time').textContent = S.elapsed.toFixed(1);
      $('e-left').textContent = '완주 ' + S.visited.size + '나라';
      $('e-best').textContent = '최고 ' + (CC.best.earth || 0) + '나라';
    }

    function paintTarget() {
      const el = root.querySelector('#e-target');
      if (!el) return;
      const t = Array.from(curTarget());
      const v = Array.from(input.value || '');
      let html = '';
      for (let i = 0; i < t.length; i++) {
        const cls = i < v.length ? (v[i] === t[i] ? 'ok' : 'bad') : (i === v.length ? 'cur' : 'todo');
        html += `<span class="${cls}">${CC.esc(t[i])}</span>`;
      }
      el.innerHTML = html;
    }

    function paintCard() {
      const c = curCountry();
      const card = $('e-card');
      if (!c) return;
      const city = curCity();
      card.innerHTML = `
        <span class="ec-badge">${CC.esc(c.continent)}</span>
        <div class="ec-top">
          <canvas class="ec-flag" width="56" height="37" id="e-flag"></canvas>
          <canvas width="62" height="46" id="e-icon" style="width:62px;height:46px"></canvas>
          <div class="ec-names">
            <b>${S.mode === 'city' ? CC.esc(c.name) + ' · 도시 이름' : '나라 이름'}</b>
            <span>${S.mode === 'city' ? CC.esc(city ? city[0] : '') : '이 나라를 찾아 타자!'}</span>
          </div>
        </div>
        <div class="ec-target" id="e-target"></div>
        <span class="ec-sub" id="e-sub"></span>`;
      drawFlag(card.querySelector('#e-flag').getContext('2d'), 0, 0, 56, 37, c.flag);
      drawIcon(card.querySelector('#e-icon').getContext('2d'), 31, 25, 0.92, c.icon);
      $('e-sub').textContent = S.mode === 'city'
        ? `${S.qi + 1} / ${c.cities.length} 번째 도시 · ${c.continent}`
        : `${S.qi + 1} / ${S.deck.length} 번째 나라 · ${c.continent}`;
      paintTarget();
    }

    function paintAll() {
      paintHud();
      const c = curCountry();
      if (!c) return;
      paintCard();
      paintPins(c);
      const gt = root.querySelector('#e-gtag');
      if (gt) gt.textContent = S.mode === 'city' ? c.name + ' 지도' : c.continent + ' · ' + c.name;
      renderScene();
      paintLegend(c);
    }

    function paintPins(c) {
      const pins = $('e-pins');
      if (!pins) return;
      pins.innerHTML = '';
      if (S.mode === 'world') {
        COUNTRIES.forEach((cc, i) => {
          const el = document.createElement('div');
          el.className = 'ep' + (S.visited.has(cc.name) ? ' on' : '');
          const c2 = document.createElement('canvas');
          c2.width = 40; c2.height = 26;
          drawFlag(c2.getContext('2d'), 0, 0, 40, 26, cc.flag);
          el.appendChild(c2);
          const nm = document.createElement('span');
          nm.textContent = cc.name.length > 5 ? cc.name.slice(0, 5) : cc.name;
          el.appendChild(nm);
          pins.appendChild(el);
        });
      } else {
        c.cities.forEach((cy, i) => {
          const done = S.visitedCities.has(c.name + i);
          const el = document.createElement('button');
          el.className = 'city-chip' + (done ? ' on' : '') + (S.deck[S.qi] === i && !S.done ? ' target' : '');
          el.textContent = (done ? '✓ ' : (i + 1) + '. ') + cy[0];
          el.onclick = () => {
            /* 이미 끝난 도시는 눌러도 이동만 (힌트) */
            CC.sfx.click();
          };
          pins.appendChild(el);
        });
      }
    }

    function paintLegend(c) {
      const box = $('e-legend');
      if (!box) return;
      box.innerHTML = `
        <div class="leg-item"><canvas id="e-leg-flag" width="40" height="26"></canvas><b>${CC.esc(c.name)}</b></div>
        <div class="leg-item"><canvas id="e-leg-icon" width="30" height="26"></canvas><span>${S.mode === 'city' ? '나라 지도 · 도시 ' + c.cities.length + '곳' : '지구본 · 랜드마크'}</span></div>`;
      drawFlag(box.querySelector('#e-leg-flag').getContext('2d'), 0, 0, 40, 26, c.flag);
      drawIcon(box.querySelector('#e-leg-icon').getContext('2d'), 15, 14, 0.5, c.icon);
    }

    /* ══════════════════════════════════════════════════════
       캔버스 그리기
       ══════════════════════════════════════════════════════ */
    function renderScene() {
      if (!S) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (cv.width !== Math.round(CW * dpr)) {
        cv.width = Math.round(CW * dpr);
        cv.height = Math.round(CH * dpr);
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, CW, CH);
      if (S.mode === 'city') drawMapScene();
      else drawGlobeScene();
    }

    function drawGlobeScene() {
      const c = curCountry();
      const idx = S.deck[S.qi];
      const lon0 = S.rot ? S.rot.lonCur : S.lon0;
      const tilt = S.rot ? S.rot.tiltCur : S.tilt;
      /* 배경 */
      const bg = g.createLinearGradient(0, 0, 0, CH);
      bg.addColorStop(0, '#EAF7FF');
      bg.addColorStop(1, '#D2ECFF');
      g.fillStyle = bg;
      g.fillRect(0, 0, CW, CH);
      /* 별 */
      g.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 26; i++) {
        const sx = (i * 97) % CW, sy = ((i * 53) % (CH - 40)) + 6;
        g.fillRect(sx, sy, 2, 2);
      }
      const globe = renderGlobe(lon0, tilt, idx);
      g.imageSmoothingEnabled = true;
      g.drawImage(globe, GC - sphere.N / 2, 168 - sphere.N / 2, sphere.N, sphere.N);

      /* 나라 핀 + 국기/랜드마크 카드 */
      if (c) {
        const p = globePoint(c.lon, c.lat, lon0, tilt);
        const inside = Math.abs(((c.lon - lon0 + 540) % 360) - 180) < 88 && Math.abs(c.lat - tilt) < 86;
        if (inside) {
          const t = (CC.now() % 1300) / 1300;
          g.save();
          g.strokeStyle = 'rgba(255,90,60,' + (0.9 - 0.65 * t) + ')';
          g.lineWidth = 3;
          g.beginPath(); g.arc(p.x, p.y, 6 + t * 16, 0, TAU); g.stroke();
          g.fillStyle = '#FF5B3C';
          g.strokeStyle = '#FFFFFF';
          g.lineWidth = 2.4;
          g.beginPath(); g.arc(p.x, p.y, 7, 0, TAU); g.fill(); g.stroke();
          g.restore();
          /* 카드 위치 */
          let bx = p.x + 26, by = p.y - 66;
          if (bx + 104 > CW - 8) bx = p.x - 130;
          if (by < 8) by = p.y + 18;
          if (by + 54 > CH - 8) by = CH - 62;
          g.save();
          g.strokeStyle = 'rgba(120,110,140,.55)';
          g.lineWidth = 1.6;
          g.setLineDash([4, 4]);
          g.beginPath();
          g.moveTo(p.x + (bx > p.x ? 8 : -8), p.y - 4);
          g.lineTo(bx + (bx > p.x ? 0 : 104), by + 46);
          g.stroke();
          g.restore();
          drawBadge(g, bx, by, c);
        }
      }
      /* 비행기 */
      if (S.travel) drawVehicle();
    }

    function drawMapScene() {
      const c = COUNTRIES[S.sel] || COUNTRIES[0];
      const rings = ringsOf(c);
      /* 배경 */
      const bg = g.createLinearGradient(0, 0, 0, CH);
      bg.addColorStop(0, '#DCEEFF');
      bg.addColorStop(1, '#C6E6FF');
      g.fillStyle = bg;
      g.fillRect(0, 0, CW, CH);

      if (!S.proj) S.proj = makeProj(rings, CW, CH, 46);
      const proj = S.proj;

      /* 이웃 땅 (옅게) */
      g.save();
      g.beginPath(); g.rect(6, 6, CW - 12, CH - 12); g.clip();
      g.fillStyle = '#E8F6DC';
      g.strokeStyle = 'rgba(140,175,130,.5)';
      g.lineWidth = 1;
      (CC.land || []).forEach(ring => {
        ringPath(g, ring, (lon, lat) => ({ x: proj.x(lon), y: proj.y(lat) }), c.lon);
        g.fill(); g.stroke();
      });
      /* 이 나라 */
      rings.forEach(ring => {
        ringPath(g, ring, (lon, lat) => ({ x: proj.x(lon), y: proj.y(lat) }), c.lon);
        g.fillStyle = '#A9E39B';
        g.fill();
        g.strokeStyle = '#3E9E62';
        g.lineWidth = 2.2;
        g.stroke();
      });
      g.restore();

      /* 도시 핀 (가까운 도시는 위아래로 살짝 밀어 겹치지 않게) */
      const targetCi = S.deck[S.qi];
      const pins = c.cities.map((cy, i) => ({
        x: proj.x(cy[2]), y0: proj.y(cy[1]), y: proj.y(cy[1]),
        name: cy[0], i, up: true
      }));
      const placed = [];
      pins.forEach(p => {
        let dy = 0, tries = 0;
        while (tries < 10 && placed.some(q => Math.hypot(q.x - p.x, q.y - (p.y0 + dy)) < 30)) {
          dy = dy === 0 ? -28 : (dy < 0 ? 28 : dy + 28);
          tries++;
        }
        p.y = CC.clamp(p.y0 + dy, 34, CH - 46);
        p.up = dy <= 0;
        placed.push(p);
      });
      pins.forEach(p => {
        const done = S.visitedCities.has(c.name + p.i);
        const isT = !S.done && p.i === targetCi;
        drawCityPin(g, p.x, p.y, p.name, done ? 'done' : (isT ? 'target' : 'idle'), p.i, p.up);
      });

      /* 국기 + 랜드마크 카드 */
      drawBadge(g, 10, CH - 66, c);

      /* 이동 자동차/비행기 */
      if (S.travel) drawVehicle();

      /* 제목 */
      g.save();
      g.fillStyle = 'rgba(255,255,255,.9)';
      g.beginPath();
      if (g.roundRect) g.roundRect(CW - 132, 10, 122, 30, 15); else g.rect(CW - 132, 10, 122, 30);
      g.fill();
      g.fillStyle = '#14547A';
      g.font = '900 14px "Noto Sans KR",sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(c.name + ' 지도', CW - 71, 26);
      g.restore();
    }

    function drawVehicle() {
      const tr = S.travel;
      const now = CC.now();
      let t = Math.min(1, (now - tr.t0) / tr.dur);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const x = tr.from.x + (tr.to.x - tr.from.x) * e;
      const y = tr.from.y + (tr.to.y - tr.from.y) * e - Math.sin(e * Math.PI) * 34;
      /* 경로 점선 */
      g.save();
      g.strokeStyle = 'rgba(255,120,90,.6)';
      g.lineWidth = 2.2;
      g.setLineDash([5, 6]);
      g.beginPath();
      for (let k = 0; k <= 20; k++) {
        const kk = k / 20 * e;
        const px = tr.from.x + (tr.to.x - tr.from.x) * kk;
        const py = tr.from.y + (tr.to.y - tr.from.y) * kk - Math.sin(kk * Math.PI) * 34;
        k ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.stroke();
      g.restore();
      /* 아이콘 */
      g.save();
      g.translate(x, y);
      g.scale(-1, 1);
      g.font = '26px serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(tr.kind === 'plane' ? '✈️' : '🚗', 0, 0);
      g.restore();
      if (t >= 1) {
        S.travel = null;
        if (S.rot) {
          S.lon0 = S.rot.lonFrom + S.rot.dLon;
          S.tilt = S.rot.tiltTo;
          S.rot = null;
        }
        S.phase = 'ready';
        nextProblem();
        S.dirty = true;
      }
    }

    /* ── 애니메이션 루프 ── */
    function loop() {
      if (!S || !root0) return;
      if (S.rot) {
        const r = S.rot;
        const t = Math.min(1, (CC.now() - r.t0) / r.dur);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        r.lonCur = r.lonFrom + r.dLon * e;
        r.tiltCur = r.tiltFrom + (r.tiltTo - r.tiltFrom) * e;
        if (t >= 1) { S.lon0 = r.lonFrom + r.dLon; S.tilt = r.tiltTo; }
      }
      renderScene();
      if ((S.rot && (CC.now() - S.rot.t0) < S.rot.dur) || S.travel) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
        if (S.rot) { S.lon0 = S.rot.lonFrom + S.rot.dLon; S.tilt = S.rot.tiltTo; S.rot = null; }
        renderScene();
      }
    }
    E._loop = loop;

    /* ── 나라 선택 (2단계) ── */
    function renderPicker() {
      const box = $('e-picker');
      box.innerHTML = `<div class="hint-box" style="margin-bottom:8px">가고 싶은 나라를 고르면 그 나라의 <b>주요 도시 5곳</b>을 랜덤 순서로 타이핑해요. 지도 위 핀을 보고 도시 이름을 쳐 보세요!</div>
        <div class="country-grid">${COUNTRIES.map((c, i) => `
          <button class="country-card" data-i="${i}">
            <canvas width="46" height="30" data-flag="${i}"></canvas>
            <b>${CC.esc(c.name)}</b><i>${CC.esc(c.continent)} · ${c.cities.length}도시</i>
          </button>`).join('')}</div>`;
      COUNTRIES.forEach((c, i) => {
        const cvs = box.querySelector(`[data-flag="${i}"]`);
        if (cvs) drawFlag(cvs.getContext('2d'), 0, 0, 46, 30, c.flag);
      });
      box.querySelectorAll('.country-card').forEach(btn => {
        btn.onclick = () => {
          CC.sfx.click();
          const i = parseInt(btn.dataset.i, 10);
          beginCity(i);
          paintAll();
        };
      });
    }
    E._renderPicker = renderPicker;
  }
})();
