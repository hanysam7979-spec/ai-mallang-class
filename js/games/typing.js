/* ══════════════════════════════════════════════════════════════
   games/typing.js — 타자연습 v4
   · 한컴 표준 두벌식 1~8단계 (자리 · 낱말 · 긴글 · 영문)
   · ★ 한 번에 딱 1문제만! 성공하면 같은 단계 안에서 랜덤으로 다음 문제
   · ★ 키보드·양손을 크게, 지금 누를 손가락 끝에 선명한 빨간 점 ●
   · 옆에서 내 아바타가 점프하며 응원
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CC = window.CC;
  CC.games = CC.games || {};
  const G = {};
  CC.games.typing = G;

  /* ══════════════════════════════════════════════════════════
     1~8단계 (한컴 두벌식 · ㅎ은 1단계)
     ══════════════════════════════════════════════════════════ */
  const STAGES = [
    {
      name: '기본자리',
      keys: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅓ', 'ㅏ', 'ㅣ'],
      finger: '양손 기본자리',
      words: ['나', '너', '이', '아', '어', '아이', '나라', '어머니', '하나', '할머니', '하마', '허리', '이마', '마리', '미나리', '어린이', '말', '알', '이미']
    },
    {
      name: '왼손 윗자리',
      keys: ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ'],
      finger: '왼손 윗줄',
      words: ['바다', '가방', '다리', '가지', '거미', '비단', '아기', '지갑', '바지', '기러기', '가마니', '나비', '다리미']
    },
    {
      name: '왼손 아랫자리',
      keys: ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ'],
      finger: '왼손 아랫줄',
      words: ['치마', '파리', '커피', '아침', '기차', '치킨', '파티', '타자']
    },
    {
      name: '가운데 자리',
      keys: ['ㅅ', 'ㅠ', 'ㅛ', 'ㅗ', 'ㅜ'],
      finger: '양손 검지 뻗기',
      words: ['수박', '고구마', '오이', '우유', '도토리', '소나무', '수요일', '토마토', '호수', '사자', '시소']
    },
    {
      name: '오른손 윗자리',
      keys: ['ㅕ', 'ㅑ', 'ㅐ', 'ㅔ', 'ㅒ', 'ㅖ'],
      finger: '오른손 윗줄 (+Shift)',
      words: ['시계', '개미', '애기', '세계', '야구', '여우', '이야기', '네', '새', '배', '예', '얘기', '미역', '시야']
    },
    {
      name: '오른손 아랫자리',
      keys: ['ㅡ', ',', '.', '/'],
      finger: '오른손 아랫줄',
      words: ['그림', '스마트폰', '크레파스', '은하수', '자전거', '유리', '드라마', '버스', '기름', '그림자', '축구']
    },
    {
      name: '전체 자리',
      keys: ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ'],
      finger: '양손 전체 (+Shift)',
      words: ['의자', '사과', '원숭이', '꽃', '빵', '딸기', '아빠', '씨앗', '회사', '왜', '위', '똑똑', '깨끗', '괜찮아']
    },
    {
      name: '숫자 자리',
      keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      finger: '윗줄 (숫자)',
      words: ['1', '7', '12', '36', '2026', '3월', '10:30', '010-1234-5678']
    }
  ];
  G.STAGES = STAGES;

  const LONG = [
    '컴퓨터 교실에 오신 것을 환영합니다.',
    '오늘은 키보드로 글자를 입력하는 연습을 해 봅시다.',
    '손가락을 기본 자리에 올리고 천천히 정확하게 쳐 보세요.',
    '블록을 차례대로 쌓으면 캐릭터가 미로를 걸어가요.',
    '앞으로 가기 블록을 세 번 놓고 오른쪽으로 돌면 별을 만날 수 있어요.',
    '거북이가 앞으로 걸어갑니다.',
    '오른쪽으로 돌고 다시 앞으로 갑니다.',
    '여러분도 코드로 그림을 그릴 수 있어요.',
    '오늘의 목표는 한 글자도 틀리지 않고 끝까지 입력하는 것입니다.',
    '빨리 치는 것보다 바르게 치는 것이 훨씬 중요합니다.'
  ];
  const EN = [
    'asdf jkl; asdf jkl;',
    'a sad lad ask a fall glass half',
    'school computer keyboard monitor',
    'friend teacher hello star music',
    'block turtle practice happy'
  ];
  const CHEERS = ['잘했어!', '좋아!', '정확해!', '굿굿!', '최고야!', '멋져!', '쏙쏙!'];

  /* 라운드당 문제 수 */
  const SESSION = { drill: 20, word: 12, long: 4, en: 5 };

  /* ══════════════════════════════════════════════════════════
     키보드 배열 (두벌식)
     ══════════════════════════════════════════════════════════ */
  const ROWS = [
    [
      { en: '`', ko: '' }, { en: '1', ko: '' }, { en: '2', ko: '' }, { en: '3', ko: '' },
      { en: '4', ko: '' }, { en: '5', ko: '' }, { en: '6', ko: '' }, { en: '7', ko: '' },
      { en: '8', ko: '' }, { en: '9', ko: '' }, { en: '0', ko: '' }, { en: '-', ko: '' },
      { en: '=', ko: '' }, { fn: '⌫', lb: 'Back', g: 2 }
    ],
    [
      { fn: 'Tab', lb: 'Tab', g: 1.5 },
      { en: 'q', ko: 'ㅂ', sh: 'ㅃ' }, { en: 'w', ko: 'ㅈ', sh: 'ㅉ' },
      { en: 'e', ko: 'ㄷ', sh: 'ㄸ' }, { en: 'r', ko: 'ㄱ', sh: 'ㄲ' },
      { en: 't', ko: 'ㅅ', sh: 'ㅆ' }, { en: 'y', ko: 'ㅛ' }, { en: 'u', ko: 'ㅕ' },
      { en: 'i', ko: 'ㅑ' }, { en: 'o', ko: 'ㅐ', sh: 'ㅒ' }, { en: 'p', ko: 'ㅔ', sh: 'ㅖ' },
      { en: '[', ko: '' }, { en: ']', ko: '' }, { en: '\\', ko: '', g: 1.3 }
    ],
    [
      { fn: 'Caps', lb: 'Caps', g: 1.7 },
      { en: 'a', ko: 'ㅁ', home: 1 }, { en: 's', ko: 'ㄴ', home: 1 }, { en: 'd', ko: 'ㅇ', home: 1 },
      { en: 'f', ko: 'ㄹ', home: 1 }, { en: 'g', ko: 'ㅎ' }, { en: 'h', ko: 'ㅗ' },
      { en: 'j', ko: 'ㅓ', home: 1 }, { en: 'k', ko: 'ㅏ', home: 1 }, { en: 'l', ko: 'ㅣ', home: 1 },
      { en: ';', ko: '', home: 1 }, { en: "'", ko: '' }, { fn: '⏎', lb: 'Enter', g: 2 }
    ],
    [
      { fn: '⇧', lb: 'Shift', g: 2.1 },
      { en: 'z', ko: 'ㅋ' }, { en: 'x', ko: 'ㅌ' }, { en: 'c', ko: 'ㅊ' },
      { en: 'v', ko: 'ㅍ' }, { en: 'b', ko: 'ㅠ' }, { en: 'n', ko: 'ㅜ' }, { en: 'm', ko: 'ㅡ' },
      { en: ',', ko: '' }, { en: '.', ko: '' }, { en: '/', ko: '' }, { fn: '⇧', lb: 'Shift', g: 2.1 }
    ],
    [
      { fn: 'Ctrl', lb: 'Ctrl', g: 1.3 }, { fn: 'Alt', lb: 'Alt', g: 1.1 },
      { fn: ' ', lb: 'Space', g: 6, space: 1 }, { fn: 'Alt', lb: 'Alt', g: 1.1 },
      { fn: 'Ctrl', lb: 'Ctrl', g: 1.3 }
    ]
  ];

  /* 키 → 자모 */
  const KEY2JAMO = {
    q: ['ㅂ', 'ㅃ'], w: ['ㅈ', 'ㅉ'], e: ['ㄷ', 'ㄸ'], r: ['ㄱ', 'ㄲ'], t: ['ㅅ', 'ㅆ'],
    y: ['ㅛ'], u: ['ㅕ'], i: ['ㅑ'], o: ['ㅐ', 'ㅒ'], p: ['ㅔ', 'ㅖ'],
    a: ['ㅁ'], s: ['ㄴ'], d: ['ㅇ'], f: ['ㄹ'], g: ['ㅎ'], h: ['ㅗ'],
    j: ['ㅓ'], k: ['ㅏ'], l: ['ㅣ'], z: ['ㅋ'], x: ['ㅌ'], c: ['ㅊ'],
    v: ['ㅍ'], b: ['ㅠ'], n: ['ㅜ'], m: ['ㅡ']
  };
  const JAMO2KEY = {};
  Object.keys(KEY2JAMO).forEach(k => {
    KEY2JAMO[k].forEach((j, i) => { JAMO2KEY[j] = { en: k, shift: i > 0 }; });
  });
  const SYM2KEY = {
    ',': { en: ',', shift: false }, '.': { en: '.', shift: false }, '/': { en: '/', shift: false },
    ' ': { en: ' ', shift: false },
    '1': { en: '1' }, '2': { en: '2' }, '3': { en: '3' }, '4': { en: '4' }, '5': { en: '5' },
    '6': { en: '6' }, '7': { en: '7' }, '8': { en: '8' }, '9': { en: '9' }, '0': { en: '0' },
    ':': { en: ';', shift: true }, ';': { en: ';', shift: false }, '-': { en: '-', shift: false },
    '<': { en: ',', shift: true }, '>': { en: '.', shift: true }, '?': { en: '/', shift: true }
  };

  /* 손가락 (왼 L / 오른 R, 0 = 바깥쪽 … 3 = 안쪽, 4 = 엄지) */
  const FINGER_OF = {
    q: ['L', 0], w: ['L', 1], e: ['L', 2], r: ['L', 3], t: ['L', 3],
    a: ['L', 0], s: ['L', 1], d: ['L', 2], f: ['L', 3], g: ['L', 3],
    z: ['L', 0], x: ['L', 1], c: ['L', 2], v: ['L', 3], b: ['L', 3],
    y: ['R', 3], u: ['R', 3], i: ['R', 2], o: ['R', 1], p: ['R', 0],
    h: ['R', 3], j: ['R', 3], k: ['R', 2], l: ['R', 1], ';': ['R', 0],
    n: ['R', 3], m: ['R', 3], ',': ['R', 2], '.': ['R', 3], '/': ['R', 0],
    '-': ['R', 0], '=': ['R', 0], '1': ['L', 0], '2': ['L', 1], '3': ['L', 2], '4': ['L', 3],
    '5': ['L', 3], '6': ['R', 3], '7': ['R', 3], '8': ['R', 2], '9': ['R', 1], '0': ['R', 0],
    ' ': ['L', 4]
  };

  /* ── 한글 분해 ─────────────────────────────────────────── */
  const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const COMPOUND = {
    'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'], 'ㄺ': ['ㄹ', 'ㄱ'],
    'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'], 'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'],
    'ㄿ': ['ㄹ', 'ㅍ'], 'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ'],
    'ㅘ': ['ㅗ', 'ㅏ'], 'ㅙ': ['ㅗ', 'ㅐ'], 'ㅚ': ['ㅗ', 'ㅣ'], 'ㅝ': ['ㅜ', 'ㅓ'],
    'ㅞ': ['ㅜ', 'ㅔ'], 'ㅟ': ['ㅜ', 'ㅣ'], 'ㅢ': ['ㅡ', 'ㅣ']
  };
  function unitsOfChar(ch) {
    const c = ch.charCodeAt(0);
    if (c < 0xAC00 || c > 0xD7A3) return [ch];
    const i = c - 0xAC00;
    const L = CHO[Math.floor(i / 588)];
    const V = JUNG[Math.floor((i % 588) / 28)];
    const T = JONG[i % 28];
    const out = [L];
    (COMPOUND[V] || [V]).forEach(x => out.push(x));
    if (T) (COMPOUND[T] || [T]).forEach(x => out.push(x));
    return out;
  }
  function analyze(text) {
    const units = [], counts = [], chars = [];
    for (const ch of String(text)) {
      const u = unitsOfChar(ch);
      chars.push(ch);
      counts.push(u.length);
      u.forEach(x => units.push(x));
    }
    return { units, counts, chars };
  }

  /* ══════════════════════════════════════════════════════════
     상태
     ══════════════════════════════════════════════════════════ */
  let st = null;
  let mascotRAF = 0;
  let keyHandler = null;
  let cleanupFn = null;

  function shuffle(arr) { return CC.shuffle(arr); }

  /* 한 단계의 출제 풀 → 라운드 덱 */
  function buildDeck(mode, stageIdx, lang) {
    const n = SESSION[lang === 'en' ? 'en' : mode];
    let pool = [];
    if (lang === 'en') pool = EN.slice();
    else if (mode === 'drill') pool = STAGES[stageIdx].keys.slice();
    else if (mode === 'word') pool = STAGES[stageIdx].words.slice();
    else pool = LONG.slice();
    /* 같은 문제가 연달아 나오지 않게 섞어서 뽑기 */
    const out = [];
    let bag = [];
    let last = null;
    while (out.length < n) {
      if (!bag.length) bag = shuffle(pool);
      let item = bag.shift();
      if (item === last && bag.length) { bag.push(item); item = bag.shift(); }
      out.push(item);
      last = item;
    }
    return out;
  }

  function reset(mode, stageIdx, lang) {
    const keepHands = st ? st.hands : true;
    const deck = buildDeck(mode, stageIdx, lang);
    st = {
      mode, stageIdx, lang,
      deck, qi: 0,
      problem: deck[0],
      units: [], chars: [], counts: [], idx: 0,
      attempts: 0, correct: 0, err: 0,
      solved: 0, total: deck.length,
      startedAt: 0, elapsed: 0, cpm: 0, acc: 100,
      done: false, hands: keepHands,
      jump: 0, bubble: '', bubbleT: 0, flash: 0, pop: 0
    };
    loadProblem();
    return st;
  }

  function loadProblem() {
    if (!st) return;
    const info = analyze(st.problem);
    st.units = info.units;
    st.chars = info.chars;
    st.counts = info.counts;
    st.idx = 0;
    st.pop = CC.now();
  }

  /* ══════════════════════════════════════════════════════════
     화면
     ══════════════════════════════════════════════════════════ */
  G.open = function () {
    const html = `
      <div class="type-head">
        <div class="g-tabs" id="t-tabs" style="margin:0">
          <button class="g-tab is-on" data-mode="drill">① 자리 연습</button>
          <button class="g-tab" data-mode="word">② 낱말 연습</button>
          <button class="g-tab" data-mode="long">③ 긴글 연습</button>
        </div>
        <button class="g-tab" id="t-lang">한글 두벌식</button>
        <button class="g-tab" id="t-next">다음 문제 ↻</button>
        <span style="flex:1"></span>
        <button class="hand-toggle is-on" id="t-handToggle">✋ 손 가이드 켜짐</button>
      </div>

      <div class="stage-row" id="t-stage-row"></div>

      <div class="type-stats">
        <div class="tstat t-prog"><span>문제</span><b id="t-progv">0 / 20</b><i class="tbar"><i id="t-prog"></i></i></div>
        <div class="tstat t-acc"><span>정확도</span><b id="t-acc">100%</b></div>
        <div class="tstat t-cpm"><span>타수(분당)</span><b id="t-cpm">0</b></div>
        <div class="tstat t-err"><span>오타</span><b id="t-err">0</b></div>
        <div class="tstat t-time"><span>시간</span><b id="t-time">0.0</b></div>
      </div>

      <div class="type-body">
        <div class="type-left">
          <div class="type-card tq-card">
            <div class="tc-head" id="t-target-head">지금 칠 것 — 딱 하나!</div>
            <div class="tq-wrap" id="t-big-wrap">
              <div class="tq-char" id="t-big">ㅁ</div>
            </div>
            <div class="jamo-box" id="t-jamos"></div>
            <div class="tq-meta" id="t-meta"></div>
          </div>

          <div class="keybanner" id="t-banner"></div>
          <div class="key-cue" id="t-cue"></div>

          <div class="type-mascot">
            <div class="mas-wrap"><canvas id="t-mascot"></canvas></div>
            <div class="mas-bubble" id="t-bubble">천천히, 정확하게! 내가 응원할게</div>
          </div>
          <div class="type-result" id="t-result"></div>
        </div>

        <div class="type-right">
          <div class="keyboard-wrap">
            <div class="keyboard" id="t-kbd"></div>
            <svg class="handlayer" id="t-handlayer" xmlns="http://www.w3.org/2000/svg"></svg>
          </div>
          <div class="kb-legend"><span class="dot-leg"></span> 빨간 점 = 지금 누를 손가락 끝</div>
        </div>
      </div>`;

    CC.ui.openModal({
      icon: '⌨', title: '타자연습', sub: '한 번에 한 문제씩 · 두벌식 1~8단계 · 손가락 가이드',
      size: 'lg', body: html,
      onMount(root, close) {
        const $ = (id) => root.querySelector('#' + id);
        let mode = 'drill', lang = 'ko', stageIdx = 0;

        buildKeyboard(root);
        buildStageRow(root);

        function buildStageRow(root) {
          const row = root.querySelector('#t-stage-row');
          row.innerHTML = `<span class="sl">단계</span>` +
            STAGES.map((s, i) => `<button class="stage-btn ${i === 0 ? 'is-on' : ''}" data-si="${i}">${i + 1}</button>`).join('') +
            `<span class="stage-name" id="t-stage-name">1단계 · ${STAGES[0].name}</span>`;
          row.querySelectorAll('.stage-btn').forEach(b => {
            b.onclick = () => {
              CC.sfx.click();
              stageIdx = parseInt(b.dataset.si, 10);
              row.querySelectorAll('.stage-btn').forEach(x => x.classList.toggle('is-on', x === b));
              root.querySelector('#t-stage-name').textContent = (stageIdx + 1) + '단계 · ' + STAGES[stageIdx].name + ' · ' + STAGES[stageIdx].finger;
              if (mode !== 'long') start();
            };
          });
        }

        function start() {
          reset(mode, stageIdx, lang);
          $('t-result').innerHTML = '';
          $('t-lang').textContent = lang === 'ko' ? '한글 두벌식' : '영문 QWERTY';
          $('t-target-head').textContent = mode === 'drill'
            ? '지금 칠 것 — 딱 하나!'
            : (mode === 'word' ? (stageIdx + 1) + '단계 낱말 — 하나씩!' : (lang === 'en' ? '영문 — 한 줄씩!' : '긴글 — 한 문장씩!'));
          renderAll();
        }

        /* ── 렌더 ── */
        function renderAll() {
          renderBig();
          renderJamo();
          renderStats();
          updateKeys();
          drawHands();
          updateCue();
        }

        function bigSize(text) {
          const n = Array.from(text).length;
          if (mode === 'drill' && lang === 'ko') return 112;
          if (lang === 'en') return n <= 10 ? 64 : (n <= 22 ? 44 : 32);
          if (mode === 'word') return n <= 2 ? 96 : (n <= 4 ? 76 : (n <= 6 ? 60 : 46));
          return n <= 12 ? 44 : (n <= 24 ? 36 : 30);
        }

        function renderBig() {
          const wrap = $('t-big-wrap');
          const meta = $('t-meta');
          if (!st) return;
          if (st.done) {
            wrap.innerHTML = '<div class="tq-char done">🎉</div>';
            meta.textContent = '라운드 완주!';
            return;
          }
          const size = bigSize(st.problem);
          const popCls = (CC.now() - (st.pop || 0)) < 260 ? ' pop' : '';
          if (mode === 'drill' || lang === 'en') {
            /* 한 글자(또는 한 줄)만 — 음절 단위 색칠 */
            let acc = 0, html = '';
            st.chars.forEach((ch, ci) => {
              const n = st.counts[ci];
              let cls = 'todo';
              if (st.idx >= acc + n) cls = 'ok';
              else if (st.idx >= acc && st.idx < acc + n) cls = 'cur';
              html += `<span class="${cls}">${CC.esc(ch === ' ' ? '␣' : ch)}</span>`;
              acc += n;
            });
            wrap.innerHTML = `<div class="tq-char${popCls}" style="font-size:${size}px">${html}</div>`;
          } else {
            let acc = 0, html = '';
            st.chars.forEach((ch, ci) => {
              const n = st.counts[ci];
              let cls = 'todo';
              if (st.idx >= acc + n) cls = 'ok';
              else if (st.idx >= acc && st.idx < acc + n) cls = 'cur';
              html += `<span class="${cls}">${CC.esc(ch === ' ' ? ' ' : ch)}</span>`;
              acc += n;
            });
            wrap.innerHTML = `<div class="tq-char tq-long${popCls}" style="font-size:${size}px">${html}</div>`;
          }
          meta.innerHTML = `<b>${st.qi + 1}</b> / ${st.total} 문제` +
            (mode === 'drill' ? ` · ${(stageIdx + 1)}단계 ${CC.esc(STAGES[stageIdx].name)}` : '');
        }

        function renderJamo() {
          const box = $('t-jamos');
          if (!st || st.done) { box.innerHTML = ''; return; }
          if (mode === 'drill' && lang === 'ko') { box.innerHTML = ''; return; }
          if (lang === 'en') { box.innerHTML = ''; return; }
          /* 지금 치는 음절의 자모 */
          let acc = 0, ci = -1;
          for (let i = 0; i < st.counts.length; i++) {
            if (st.idx < acc + st.counts[i]) { ci = i; break; }
            acc += st.counts[i];
          }
          if (ci < 0) { box.innerHTML = ''; return; }
          const list = unitsOfChar(st.chars[ci]);
          box.innerHTML = list.map((j, i) => {
            const done = st.idx > acc + i;
            const cur = st.idx === acc + i;
            return `<span class="jamo ${done ? 'ok' : (cur ? 'cur' : '')}">${CC.esc(j === ' ' ? '␣' : j)}</span>`;
          }).join('');
        }

        function renderStats() {
          if (!st) return;
          const pct = st.total ? st.solved / st.total * 100 : 0;
          $('t-prog').style.width = Math.min(100, pct) + '%';
          $('t-progv').textContent = st.solved + ' / ' + st.total;
          $('t-acc').textContent = st.acc + '%';
          $('t-cpm').textContent = st.cpm;
          $('t-err').textContent = st.err;
          $('t-time').textContent = st.elapsed.toFixed(1);
        }

        function updateCue() {
          const cueEl = $('t-cue');
          if (!st) return;
          if (st.done) { cueEl.innerHTML = '끝까지 입력했어요. 정말 잘했어요!'; return; }
          const u = st.units[st.idx];
          const label = u === ' ' ? '스페이스' : u;
          const k = keyOf(u);
          cueEl.innerHTML = `지금 칠 글쇠 <b>${CC.esc(label)}</b> — 키보드 위 <b>빨간 점</b>이 있는 손가락으로 눌러요`;
          if (!k) cueEl.innerHTML += ' (이 글자는 특수 키예요)';
        }

        function keyOf(u) {
          if (lang === 'ko' && JAMO2KEY[u]) return JAMO2KEY[u];
          if (SYM2KEY[u]) return SYM2KEY[u];
          if (/^[a-z]$/i.test(u)) return { en: u.toLowerCase(), shift: false };
          return null;
        }

        /* ── 키보드 강조 ── */
        function updateKeys() {
          const kb = $('t-kbd');
          kb.querySelectorAll('.key').forEach(el => el.classList.remove('is-active', 'is-shift'));
          if (!st || st.done) {
            $('t-banner').innerHTML = `<span class="kb-sub">고생했어요!</span>`;
            return;
          }
          const u = st.units[st.idx];
          const k = keyOf(u);
          if (!k) {
            $('t-banner').innerHTML = `<span class="kb-sub">이 글자는 특수 키</span>`;
            return;
          }
          const el = kb.querySelector(`.key[data-en="${cssEsc(k.en)}"]`);
          if (el) {
            el.classList.add('is-active');
            if (k.shift) el.classList.add('is-shift');
          }
          $('t-banner').innerHTML =
            `<span class="kb-sub">지금 누를 키</span>
             <span class="kb-cur">${CC.esc(u === ' ' ? '␣' : u)}</span>
             <span class="kb-sub">${CC.esc(k.en === ' ' ? 'Space' : k.en.toUpperCase())}${k.shift ? ' + Shift' : ''}</span>`;
        }

        /* ══════════════════════════════════════════════════
           손 가이드 (키보드 위 큰 파스텔 양손)
           ══════════════════════════════════════════════════ */
        function drawHands() {
          const layer = $('t-handlayer');
          if (!layer) return;
          if (!st || !st.hands) { layer.classList.add('hidden'); layer.innerHTML = ''; return; }
          layer.classList.remove('hidden');
          const box = layer.getBoundingClientRect();
          const w = Math.round(box.width), h = Math.round(box.height);
          if (w < 40 || h < 40) return;
          layer.setAttribute('viewBox', `0 0 ${w} ${h}`);
          layer.setAttribute('preserveAspectRatio', 'none');

          const kb = $('t-kbd');
          const kx0 = box.left, ky0 = box.top;
          const rectOf = (en) => {
            const el = kb.querySelector(`.key[data-en="${cssEsc(en)}"]`);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: r.left - kx0, y: r.top - ky0, w: r.width, h: r.height, cx: r.left - kx0 + r.width / 2, cy: r.top - ky0 + r.height / 2 };
          };

          let act = null;
          if (!st.done) {
            const k = keyOf(st.units[st.idx]);
            const f = k ? FINGER_OF[k.en] : null;
            const kr = k ? rectOf(k.en) : null;
            if (f && kr) act = { side: f[0], idx: f[1], key: kr, en: k.en };
          }

          const out = [];
          out.push(handPath('L', rectOf, act, w, h));
          out.push(handPath('R', rectOf, act, w, h));
          if (act) {
            /* 목표 키 둘레 큰 링 + 손가락 끝 점 */
            out.push(`<circle class="kbd-ring" cx="${act.key.cx}" cy="${act.key.cy}" r="${Math.max(act.key.w, act.key.h) * 0.66}" fill="none" stroke="#FF3B2F" stroke-width="3.4" stroke-dasharray="7 6"/>`);
          }
          layer.innerHTML = out.join('');
        }

        function handPath(side, rectOf, act, w, h) {
          const isL = side === 'L';
          const home = isL ? ['a', 's', 'd', 'f'] : ['j', 'k', 'l', ';'];
          const keys = home.map(rectOf).filter(Boolean);
          if (keys.length < 4) return '';
          const kH = keys[0].h;
          const tipY = keys[0].cy;
          const fw = Math.max(12, keys[0].w * 0.50);
          const baseY = h - 56;
          const xs = keys.map(k => k.cx);
          const spanL = Math.min(...xs) - fw * 0.55;
          const spanR = Math.max(...xs) + fw * 0.55;

          const SKIN = 'rgba(255,224,194,0.82)';
          const EDGE = 'rgba(196,140,98,0.9)';
          const GOLD = 'rgba(255,212,96,0.98)';
          const GOLD_E = 'rgba(186,116,12,0.95)';

          let s = `<g class="hand hand-${side}">`;
          /* 손바닥 — 키보드 아래쪽에 낮게 깔린다 */
          s += `<ellipse cx="${(spanL + spanR) / 2}" cy="${h - 34}" rx="${(spanR - spanL) / 2 + fw * 0.35}" ry="${Math.max(16, kH * 0.44)}"
                  fill="${SKIN}" stroke="${EDGE}" stroke-width="2"/>`;

          /* 네 손가락 — 아래에서 기본자리 키까지 길게 뻗는다 */
          keys.forEach((k, i) => {
            const isAct = act && act.side === side && act.idx === i;
            if (isAct) return;
            const fwid = fw * (i === 0 ? 0.86 : (i === 3 ? 0.92 : 1));
            const top = tipY - fwid * 0.42;
            s += `<rect x="${k.cx - fwid / 2}" y="${top}" width="${fwid}" height="${baseY - top + 6}"
                    rx="${fwid / 2}" fill="${SKIN}" stroke="${EDGE}" stroke-width="2"/>`;
            s += `<circle cx="${k.cx}" cy="${top + fwid * 0.5}" r="${fwid * 0.30}" fill="rgba(255,255,255,.55)"/>`;
          });

          /* 활성 손가락 — 손바닥에서 지금 누를 키까지 뻗어 닿는다 */
          if (act && act.side === side && act.idx !== 4) {
            const base = keys[Math.min(3, act.idx)];
            const bx = base.cx;
            const by = baseY - 2;
            const tx = act.key.cx, ty = act.key.cy;
            const midX = (bx + tx) / 2 + (act.idx === 0 ? -fw * 0.45 : (act.idx === 3 ? fw * 0.45 : 0));
            const midY = (by + ty) / 2;
            s += `<path d="M${bx} ${by} Q${midX} ${midY} ${tx} ${ty - fw * 0.10}" fill="none"
                    stroke="${GOLD_E}" stroke-width="${fw + 5}" stroke-linecap="round" opacity="0.95"/>`;
            s += `<path d="M${bx} ${by} Q${midX} ${midY} ${tx} ${ty - fw * 0.10}" fill="none"
                    stroke="${GOLD}" stroke-width="${fw}" stroke-linecap="round"/>`;
            s += `<circle class="tip-halo" cx="${tx}" cy="${ty}" r="${Math.max(13, fw * 0.95)}" fill="none" stroke="#FF3B2F" stroke-width="2.4" opacity="0.55"/>`;
            s += `<circle class="tip-dot" cx="${tx}" cy="${ty}" r="${Math.max(9, fw * 0.62)}" fill="#FF3B2F" stroke="#FFFFFF" stroke-width="3.2"/>`;
            s += `<circle cx="${tx - fw * 0.16}" cy="${ty - fw * 0.20}" r="${Math.max(2, fw * 0.15)}" fill="#FFF3EC" opacity="0.95"/>`;
          }

          /* 엄지 — 안쪽에서 스페이스 쪽으로 */
          const thumbAct = act && act.idx === 4;
          const tx0 = isL ? spanR - fw * 0.2 : spanL + fw * 0.2;
          const tx1 = isL ? spanR + fw * 0.95 : spanL - fw * 0.95;
          const ty0 = h - 58;
          s += `<rect x="${Math.min(tx0, tx1) - fw * 0.36}" y="${ty0}" width="${Math.abs(tx1 - tx0) + fw * 0.72}" height="${fw * 1.15}"
                  rx="${fw * 0.5}" transform="rotate(${isL ? 18 : -18} ${tx0} ${ty0})"
                  fill="${thumbAct ? GOLD : SKIN}" stroke="${thumbAct ? GOLD_E : EDGE}" stroke-width="2"/>`;
          if (thumbAct && act && act.key) {
            const k = act.key;
            s += `<circle class="tip-dot" cx="${k.cx}" cy="${k.cy}" r="${Math.max(9, fw * 0.62)}" fill="#FF3B2F" stroke="#FFFFFF" stroke-width="3.2"/>`;
            s += `<circle class="tip-halo" cx="${k.cx}" cy="${k.cy}" r="${Math.max(13, fw * 0.95)}" fill="none" stroke="#FF3B2F" stroke-width="2.4" opacity="0.55"/>`;
          }

          s += '</g>';
          return s;
        }

        /* ── 응원 아바타 ── */
        function mascotLoop(root) {
          const cv = root.querySelector('#t-mascot');
          if (!cv || !st) return;
          const ctx = cv.getContext('2d');
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const w = 76, h = 90;
          if (cv.width !== Math.round(w * dpr)) {
            cv.width = Math.round(w * dpr);
            cv.height = Math.round(h * dpr);
          }
          const now = CC.now();
          let bob = 0;
          if (st.jump > 0) {
            const t = (now - st.jump) / 420;
            if (t < 1) bob = -Math.sin(t * Math.PI) * 12;
            else st.jump = 0;
          }
          if (st.done) bob = -Math.abs(Math.sin(now / 260)) * 8;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, w, h);
          ctx.imageSmoothingEnabled = false;
          const v = CC.avatar.norm(CC.me ? CC.me.v : CC.myAvatar);
          CC.art.draw(ctx, CC.art.stuFront(v.sp), w / 2, h - 4 + bob, { h: 80 });
          const bub = root.querySelector('#t-bubble');
          if (bub) {
            if (st.bubble && now - st.bubbleT < 1500) bub.textContent = st.bubble;
            else if (st.done) bub.textContent = '완주했어! 정말 대단해';
            else bub.textContent = '한 문제씩! 천천히 정확하게';
          }
          mascotRAF = requestAnimationFrame(() => mascotLoop(root));
        }
        function cheer(text) {
          if (!st) return;
          st.jump = CC.now();
          st.bubble = text;
          st.bubbleT = CC.now();
          const b = root.querySelector('#t-bubble');
          if (b) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
        }

        /* ── 입력 ── */
        function handleKey(e) {
          if (!st || st.done) return;
          if (e.ctrlKey || e.metaKey || e.altKey) return;
          const u = st.units[st.idx];
          if (u == null) return;
          let typed = null;
          const code = e.code || '';
          let en = '';
          if (/^Key[A-Z]$/.test(code)) en = code.slice(3).toLowerCase();
          else if (code === 'Space') en = ' ';
          else if (/^Digit\d$/.test(code)) en = code.slice(5);
          else if (code === 'Minus') en = '-';
          else if (code === 'Equal') en = '=';
          else if (code === 'Comma') en = ',';
          else if (code === 'Period') en = '.';
          else if (code === 'Slash') en = '/';
          else if (code === 'Semicolon') en = ';';
          else if (code === 'Quote') en = "'";
          if (!en) return;
          e.preventDefault();

          if (lang === 'en') {
            typed = en === ' ' ? ' ' : en;
          } else if (KEY2JAMO[en]) {
            const pair = KEY2JAMO[en];
            typed = (e.shiftKey && pair[1]) ? pair[1] : pair[0];
          } else if (en === ' ') {
            typed = ' ';
          } else {
            if (en === ';' && e.shiftKey) typed = ':';
            else if (en === ',' && e.shiftKey) typed = '<';
            else if (en === '.' && e.shiftKey) typed = '>';
            else if (en === '/' && e.shiftKey) typed = '?';
            else typed = en;
          }

          if (!st.startedAt) {
            st.startedAt = CC.now();
            st.timer = setInterval(tick, 100);
          }
          st.attempts++;
          if (typed === u) {
            st.idx++;
            st.correct++;
            CC.sfx.type();
            if (st.correct % 4 === 0) cheer(CC.pick(CHEERS));
            if (st.idx >= st.units.length) return solvedProblem();
          } else {
            st.err++;
            CC.sfx.err();
            cheer('앗, 다시!');
          }
          st.acc = st.attempts ? Math.round(st.correct / st.attempts * 100) : 100;
          updateCpm();
          renderAll();
        }

        function solvedProblem() {
          st.solved++;
          st.qi++;
          st.acc = st.attempts ? Math.round(st.correct / st.attempts * 100) : 100;
          updateCpm();
          CC.sfx.pop();
          cheer(CC.pick(CHEERS));
          if (st.qi >= st.deck.length) return finish();
          st.problem = st.deck[st.qi];
          loadProblem();
          renderAll();
        }

        function tick() {
          if (!st || st.done) return;
          st.elapsed = (CC.now() - st.startedAt) / 1000;
          updateCpm();
          renderStats();
        }
        function updateCpm() {
          if (!st) return;
          st.cpm = st.elapsed > 0.7 ? Math.round(st.correct / st.elapsed * 60) : 0;
        }

        function finish() {
          st.done = true;
          if (st.timer) clearInterval(st.timer);
          st.elapsed = st.startedAt ? (CC.now() - st.startedAt) / 1000 : 0;
          updateCpm();
          st.acc = st.attempts ? Math.round(st.correct / st.attempts * 100) : 100;
          renderAll();
          const prev = CC.best.cpm || 0;
          const isBest = st.cpm > prev;
          if (isBest && st.cpm > 0) CC.saveBest({ cpm: st.cpm });
          CC.sfx.cheer();
          cheer('완주했어!');
          const msg = st.acc >= 98 && st.cpm >= 150 ? '정말 빠르고 정확해요!'
            : st.acc >= 95 ? '아주 좋아요! 조금만 더 빠르게!'
              : st.acc >= 90 ? '통과! 정확도를 조금 더 올려 봐요'
                : '정확도부터 올려 봐요. 천천히 해도 괜찮아요';
          $('t-result').innerHTML = `
            <div class="result-card">
              <h3>${isBest ? '최고 기록!' : '완주!'}</h3>
              <p>${msg}${st.acc >= 90 ? '' : ' (통과 기준 정확도 90%)'}</p>
              <div class="result-stats">
                <div><span>문제</span><b>${st.solved}</b></div>
                <div><span>타수</span><b>${st.cpm}</b></div>
                <div><span>정확도</span><b>${st.acc}%</b></div>
                <div><span>시간</span><b>${st.elapsed.toFixed(1)}초</b></div>
              </div>
              <div style="margin-top:10px;display:flex;gap:6px;justify-content:center">
                <button class="btn btn-sm btn-yellow" id="t-again">다시 하기</button>
                <button class="btn btn-sm btn-mint" id="t-new">다른 문제</button>
              </div>
            </div>`;
          const again = root.querySelector('#t-again');
          if (again) again.onclick = () => { CC.sfx.click(); start(); };
          const nw = root.querySelector('#t-new');
          if (nw) nw.onclick = () => { CC.sfx.click(); start(); };
        }

        /* ── 이벤트 ── */
        $('t-tabs').addEventListener('click', (e) => {
          const b = e.target.closest('[data-mode]');
          if (!b) return;
          CC.sfx.click();
          root.querySelectorAll('[data-mode]').forEach(x => x.classList.remove('is-on'));
          b.classList.add('is-on');
          mode = b.dataset.mode;
          if (mode === 'long') lang = 'ko';
          start();
        });
        $('t-lang').onclick = () => {
          CC.sfx.click();
          lang = lang === 'ko' ? 'en' : 'ko';
          if (lang === 'en') mode = 'word';
          start();
        };
        $('t-next').onclick = () => {
          CC.sfx.click();
          if (!st) return;
          if (st.qi + 1 >= st.deck.length) { st.solved++; finish(); return; }
          st.qi++;
          st.problem = st.deck[st.qi];
          loadProblem();
          renderAll();
        };
        $('t-handToggle').onclick = () => {
          if (!st) return;
          st.hands = !st.hands;
          CC.sfx.pop();
          const b = $('t-handToggle');
          b.classList.toggle('is-on', st.hands);
          b.textContent = st.hands ? '✋ 손 가이드 켜짐' : '✋ 손 가이드 꺼짐';
          drawHands();
        };
        window.addEventListener('resize', onResize);
        function onResize() { if (st) drawHands(); }

        keyHandler = (e) => {
          if (!CC.ui.modalOpen()) return;
          handleKey(e);
        };
        window.addEventListener('keydown', keyHandler);

        start();
        if (mascotRAF) cancelAnimationFrame(mascotRAF);
        mascotLoop(root);
        setTimeout(drawHands, 60);
        setTimeout(drawHands, 260);

        cleanupFn = () => {
          window.removeEventListener('resize', onResize);
          if (keyHandler) window.removeEventListener('keydown', keyHandler);
          keyHandler = null;
          if (mascotRAF) cancelAnimationFrame(mascotRAF);
          mascotRAF = 0;
          if (st && st.timer) clearInterval(st.timer);
        };
      },
      onClose() {
        if (cleanupFn) { try { cleanupFn(); } catch (e) { } cleanupFn = null; }
        if (mascotRAF) cancelAnimationFrame(mascotRAF);
        mascotRAF = 0;
        if (st && st.timer) clearInterval(st.timer);
        st = null;
      }
    });
  };

  /* ── 키보드 DOM ── */
  function keyHTML(k) {
    const cls = ['key'];
    if (k.fn) cls.push('k-fn');
    if (k.space) cls.push('k-space');
    if (k.home) cls.push('home');
    const g = k.g || 1;
    let inner = '';
    if (k.fn) inner = `<span class="k-lb">${k.lb || k.fn}</span>`;
    else {
      if (k.ko) inner += `<span class="k-ko">${k.ko}</span>`;
      inner += `<span class="k-en">${k.en}</span>`;
    }
    const attr = k.en != null ? ` data-en="${k.en}"` : '';
    return `<div class="${cls.join(' ')}" style="flex-grow:${g}"${attr}>${inner}</div>`;
  }
  function buildKeyboard(root) {
    const el = root.querySelector('#t-kbd');
    if (!el) return;
    el.innerHTML = ROWS.map(row => `<div class="kbrow">${row.map(keyHTML).join('')}</div>`).join('');
  }
  function cssEsc(s) {
    return String(s).replace(/["\\]/g, '\\$&');
  }
  G._debug = () => st;
})();
