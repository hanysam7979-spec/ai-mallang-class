/* ══════════════════════════════════════════════════════════════
   playground/main.js — 틈새 놀이터 시작점
   · 허브(놀이 5종 카드 + 랭킹) · 타이머 · 내 정보 · 첫 방문 안내
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const PG = window.PG;

  const DESC = {
    chosung: '초성만 보고 낱말 맞히기 · 57문제',
    typing: '떨어지는 낱말을 타자로 없애기',
    maze: '매번 새로 생기는 미로 탈출',
    spot: '두 그림의 다른 곳 5곳 찾기',
    hidden: '그림 속 숨은 물건 7개 찾기'
  };
  const COLOR = {
    chosung: 'gc-chosung', typing: 'gc-typing', maze: 'gc-maze',
    spot: 'gc-spot', hidden: 'gc-hidden'
  };

  PG.hubPaint = function () {
    const grid = document.getElementById('hub-grid');
    if (!grid) return;
    grid.innerHTML = Object.keys(PG.GAME_META).map(id => {
      const m = PG.GAME_META[id];
      const best = PG.rank.personalBest(id);
      return `<button class="gcard ${COLOR[id]}" data-game="${id}">
        <span class="gc-ico">${m.ico}</span>
        <span class="gc-t">${PG.esc(m.name)}</span>
        <span class="gc-d">${PG.esc(DESC[id] || '')}</span>
        <span class="gc-best" id="best-${id}">🏆 최고 ${best.toLocaleString()}점</span>
        <span class="gc-go">›</span>
      </button>`;
    }).join('');
    PG.$$('[data-game]', grid).forEach(b => b.addEventListener('click', () => {
      PG.sfx.click();
      PG.go(b.dataset.game);
    }));
    const hello = document.getElementById('hub-hello');
    if (hello) {
      hello.innerHTML = PG.who.isGuest
        ? '이름을 넣으면 <b>최고 기록</b>에 내 기록이 남아요. <span style="color:#C0B3CE">(오른쪽 위 내 정보)</span>'
        : `<b>${PG.esc(PG.who.cls)} · ${PG.esc(PG.who.name)}</b>, 오늘은 어떤 놀이를 해 볼까요?`;
    }
  };

  function init() {
    PG.who.init();
    PG.timer.init();
    PG.rank.render();
    PG.hubPaint();

    /* 내 정보 */
    PG.$$('#who-pill').forEach(b => b.addEventListener('click', () => { PG.sfx.click(); PG.openWho(); }));

    /* 허브 빠른 타이머 */
    const t5 = document.getElementById('hub-timer5');
    const t10 = document.getElementById('hub-timer10');
    if (t5) t5.addEventListener('click', () => { PG.timer.setMin(5); PG.timer.start(); PG.toast('5분 타이머를 시작했어요!'); });
    if (t10) t10.addEventListener('click', () => { PG.timer.setMin(10); PG.timer.start(); PG.toast('10분 타이머를 시작했어요!'); });

    /* 시간 종료 배너 */
    const close = document.getElementById('tu-close');
    if (close) close.addEventListener('click', () => { PG.sfx.click(); PG.timer.hideBanner(); });
    const more = document.getElementById('tu-more');
    if (more) more.addEventListener('click', () => {
      PG.sfx.click();
      PG.timer.setMin(5);
      PG.timer.start();
      PG.toast('5분 더! 이번엔 꼭 정리할 준비해요~');
    });

    /* 키보드: ESC → 놀이터로 */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const modals = document.getElementById('pg-modals');
        if (modals && !modals.hidden) { modals.hidden = true; modals.innerHTML = ''; return; }
        if (PG.current !== 'hub') PG.go('hub');
      }
    });

    /* 주소에 #게임이 있으면 바로 열기 (주소만 바뀌어도 따라가기) */
    const hash = (location.hash || '').replace('#', '');
    if (hash && PG.games[hash]) PG.go(hash);
    window.addEventListener('hashchange', () => {
      const h = (location.hash || '').replace('#', '');
      if (h && PG.games[h] && PG.current !== h) PG.go(h);
      else if (!h && PG.current !== 'hub') PG.go('hub');
    });

    /* 처음 온 학생에게 이름 묻기 (한 번만) */
    if (PG.who.isGuest && !PG.store.get('cc.playground.asked.v1', false)) {
      PG.store.set('cc.playground.asked.v1', true);
      setTimeout(() => PG.openWho(), 500);
    }

    PG.timer.setMin(5);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
