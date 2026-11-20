/* ══════════════════════════════════════════════════════════════
   config.js — v3 세계 좌표 · 좌석 배치(뒤집기) · 기본 명단 · 저장소
   · 화면(논리) 1400×1050 = AI 세미 픽셀 배경(bg_classroom.png)과 같은 비율
   · 좌석: 화면 맨 앞(아래)이 1~9번, 맨 안쪽(위)이 37~42번 6석 (모두 42석)
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});

  /* ── 세계 좌표 ─────────────────────────────────────────── */
  CC.W = 1400;
  CC.H = 1050;
  CC.WALL_BOTTOM = 545;   // 교실 벽이 끝나고 바닥이 시작되는 높이
  CC.FLOOR_TOP = 545;
  CC.BOARD = { x: 573, y: 249, w: 366, h: 200 };    // 배경 이미지의 초록 칠판 안쪽 영역
  CC.PODIUM = { x: 580, y: 462, w: 270, h: 90 };
  CC.DOOR = { x: 1000, y: 520 };
  CC.TEACHER = { x: 715, y: 578 };

  /* ── v3 픽셀 팔레트 ───────────────────────────────────── */
  CC.C = {
    ink: '#20162C',           /* 외곽선 진보라 */
    ink2: '#2A2140',
    navyBg: '#261E3E',        /* 화면 바탕 남보라 */
    navy: '#1B1533',
    navy2: '#332A52',
    cream: '#FAEAC6',
    paper: '#FFFAEC',
    gold: '#FFCE4A',
    goldD: '#CE8A18',
    brick: '#FCD296',
    wood: '#C68044',
    woodL: '#DCA066',
    desk: '#F2B270',
    green: '#6CC848',
    greenL: '#B0F27C',
    greenD: '#3A8A2A',
    case_: '#C6CCDC',
    caseD: '#969CB2',
    sky: '#2480CC',
    skyL: '#78CEFF',
    mint: '#6EE2B2',
    mintD: '#249478',
    coral: '#FF7A60',
    coralD: '#BE3C2E',
    lav: '#B098FF',
    lavD: '#6A50C8',
    skin: '#FFD2A6',
    skinD: '#DE9E70',
    gray: '#6B6280',
    dim: '#8A7D9E'
  };

  /* ── 좌석 (뒤에서부터 그리지만, 번호는 앞줄이 1~9) ─────────
     42석: 안쪽 6석 + 9석 × 4줄. 한 줄에 9개가 들어가도록 배율(s)과
     간격(gap)을 화면 폭 1400 안에 맞춰 두었습니다(좌우 잘림·책상 겹침 없음). */
  const ROW_DEF = [
    { from: 37, to: 42, y: 588, s: 0.78, gap: 145 },   // 맨 안쪽(교탁 앞) 6석
    { from: 28, to: 36, y: 696, s: 0.84, gap: 150 },
    { from: 19, to: 27, y: 804, s: 0.90, gap: 154 },
    { from: 10, to: 18, y: 912, s: 0.92, gap: 156 },
    { from: 1,  to: 9,  y: 1000, s: 0.93, gap: 156 }   // 맨 앞(화면 아래 · 우리 쪽)
  ];
  CC.ROW_DEF = ROW_DEF;
  CC.SEATS = [];
  ROW_DEF.forEach((r, ri) => {
    const n = r.to - r.from + 1;
    for (let i = 0; i < n; i++) {
      CC.SEATS.push({
        num: r.from + i, row: ri, col: i,
        x: Math.round(700 + (i - (n - 1) / 2) * r.gap),
        y: r.y, s: r.s
      });
    }
  });
  /* ★ 필수 — 번호로 바로 찾을 수 있게 정렬 */
  CC.SEATS.sort((a, b) => a.num - b.num);
  CC.seat = (num) => {
    for (let i = 0; i < CC.SEATS.length; i++) if (CC.SEATS[i].num === num) return CC.SEATS[i];
    return null;
  };
  CC.ROW_Y = ROW_DEF.map(r => r.y);
  CC.MAX_SEAT = 42;

  /* ── 기본 명단: 5개 반 × 42명 (모든 반 같은 데모 이름, 7번 = 박성희) ── */
  CC.CLASS_NAMES = ['꾸러기', '컴박사A', '컴박사B', '컴스타', '토요박사'];
  CC.DEMO_NAMES = [
    '김민준', '이서연', '박도윤', '최지우', '정하준', '강수아', '박성희', '임하은',
    '한예준', '오지호', '서지우', '신유준', '권민서', '황도현', '안서윤', '송지안',
    '전하린', '홍시우', '문하준', '조예린', '배서준', '백하윤', '남주원', '심서윤',
    '엄세준', '김소연', '노하연', '구본우', '진소민', '백서준', '정다은', '차지민',
    '고유찬', '김예은', '양도현', '홍지아',
    '윤가온', '장서우', '최하율', '류민재', '강다인', '윤시온'   /* 37~42번 */
  ];
  /* 데모에서 결석인 번호 (8명 → 출석 34명 / 전체 42명) */
  CC.DEMO_ABSENT = [4, 8, 13, 17, 22, 28, 32, 35];

  /* ── 예전 기본값 (자동 갱신 판별용) ────────────────────── */
  const LEGACY_TEACHER_NAME = '김하늘';
  const LEGACY_DEMO_NAMES = [
    '김민준', '이서연', '박도윤', '최지우', '정하준', '강수아', '박성희', '임하은',
    '한예준', '오지호', '서지우', '신유준', '권민서', '황도현', '안서윤', '송지안',
    '전하린', '홍시우', '문하준', '조예린', '배서준', '백하윤', '남주원', '심서윤',
    '엄세준', '김소연', '노하연', '구본우', '진소민', '백서준', '정다은', '차지민',
    '고유찬', '김예은', '양도현', '홍지아'
  ];
  CC.LEGACY_TEACHER_NAME = LEGACY_TEACHER_NAME;
  CC.LEGACY_DEMO_NAMES = LEGACY_DEMO_NAMES;

  /* 번호 1부터 이름이 그대로 이어지는 명단인지 */
  function sameList(students, names) {
    if (!Array.isArray(students) || students.length !== names.length) return false;
    return students.every((s, i) => s && s.num === i + 1 && s.name === names[i]);
  }

  CC.makeDefaultRoster = function () {
    const teacher = (CC.defaultSettings && CC.defaultSettings().teacherName) || '하니쌤';
    const classes = {};
    CC.CLASS_NAMES.forEach(name => {
      classes[name] = {
        teacher,
        students: CC.DEMO_NAMES.map((n, i) => ({ num: i + 1, name: n }))
      };
    });
    return { version: 3, activeClass: CC.CLASS_NAMES[0], classes };
  };

  /* 예전 기본값(‘파이썬1반’ 한 반만 들어 있는 데모 명단)인지 판별 */
  CC.isLegacyDefaultRoster = function (r) {
    if (!r || !r.classes) return false;
    const keys = Object.keys(r.classes);
    if (keys.length !== 1 || keys[0] !== '파이썬1반') return false;
    const cls = r.classes['파이썬1반'];
    if (!cls) return false;
    return sameList(cls.students, LEGACY_DEMO_NAMES) || sameList(cls.students, CC.DEMO_NAMES);
  };

  /* 예전 기본 명단(5개 반 × 36명 데모 이름, 선생님 ‘김하늘’)이 그대로 남아 있는지
     → 새 기본 명단(5개 반 × 42명, ‘하니쌤’)으로 자동 갱신하기 위한 판별.
     반 이름·이름·선생님 이름 중 하나라도 손댔으면 사용자 명단으로 보고 건드리지 않습니다. */
  CC.isLegacyDemoRoster = function (r) {
    if (!r || !r.classes) return false;
    const keys = Object.keys(r.classes);
    if (!keys.length) return false;
    return keys.every(id => {
      if (CC.CLASS_NAMES.indexOf(id) < 0) return false;   /* 사용자가 만든 반이 있으면 제외 */
      const cls = r.classes[id];
      if (!cls || !sameList(cls.students, LEGACY_DEMO_NAMES)) return false;
      if (cls.teacher && cls.teacher !== LEGACY_TEACHER_NAME) return false;
      return true;
    });
  };

  /* 데모 명단을 그대로 쓰는 반인지 (가상 결석생 연출 여부 판단) */
  CC.isDemoClass = function (classId) {
    const cls = CC.roster && CC.roster.classes && CC.roster.classes[classId];
    if (!cls) return false;
    return sameList(cls.students, CC.DEMO_NAMES);
  };

  /* ── 저장소 ────────────────────────────────────────────── */
  const K = {
    settings: 'cc.settings.v3',
    roster: 'cc.roster.v3',
    avatar: 'cc.avatar.v3',
    best: 'cc.best.v3',
    last: 'cc.last.v3',
    supabase: 'cc.supabase.v3'
  };
  CC.KEYS = K;

  CC.store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); return true; }
      catch (e) { return false; }
    },
    del(key) { try { localStorage.removeItem(key); } catch (e) {} }
  };

  /* ══════════════════════════════════════════════════════════
     ★ 기본 설정 — 여기만 고치면 전체 기본값이 바뀝니다.
       · teacherName / teacherPw : 선생님 이름 · 교사 입장 비밀번호
       · supabaseUrl / supabaseKey : Supabase 프로젝트 URL 과 anon public key
         (예: 'https://abcdefgh.supabase.co' / 'eyJhbGciOiJIUzI1NiIs...')
         비워 두면 '로컬 데모 모드'로 동작하고, 값을 채우면 자동으로
         Supabase Realtime 실시간 동기화 모드로 접속합니다.
         앱 안의 [교사 설정] 창에서 넣어도 되고(브라우저에 저장),
         주소 뒤에 ?sbUrl=...&sbKey=... 를 붙여 넘겨도 됩니다.
     ══════════════════════════════════════════════════════════ */
  CC.defaultSettings = function () {
    return {
      teacherName: '하니쌤',             /* ← 선생님 이름 기본값 */
      teacherPw: '1234',                 /* ← 교사 비밀번호 기본값 */
      supabaseUrl: 'https://sspmekdqtlzuezebnygc.supabase.co',  /* ← SUPABASE_URL */
      supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcG1la2RxdGx6dWV6ZWJueWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxMTYyMjcsImV4cCI6MjExMDY5MjIyN30.SQQbR3n7-W2GDAt11eW54SmYzbDVyEkHzWB24xerezg',  /* ← SUPABASE_ANON_KEY */
      sound: true,
      notice: ''
    };
  };
  /* 저장된 설정이 예전 기본값(‘김하늘’)을 그대로 물고 있으면 새 기본값(‘하니쌤’)으로
     옮깁니다. 사용자가 직접 다른 이름으로 바꿔 둔 설정은 그대로 둡니다. */
  (function migrateSettings() {
    const saved = CC.store.get(K.settings, null);
    if (!saved || typeof saved !== 'object') return;
    if (saved.teacherName === LEGACY_TEACHER_NAME) {
      saved.teacherName = CC.defaultSettings().teacherName;
      CC.store.set(K.settings, saved);
    }
  })();
  CC.settings = Object.assign(CC.defaultSettings(), CC.store.get(K.settings, {}));
  CC.saveSettings = function (patch) {
    Object.assign(CC.settings, patch || {});
    CC.store.set(K.settings, CC.settings);
  };
  /* ?sbUrl=...&sbKey=... 로 접속하면 그 값을 설정에 반영하고 주소창에서는 지웁니다.
     (한 번 반영되면 localStorage 에 남아 다음 접속부터도 그대로 쓰입니다) */
  (function applyQuerySupabase() {
    try {
      if (!window.location || !window.URLSearchParams) return;
      const qs = new URLSearchParams(window.location.search);
      const url = (qs.get('sbUrl') || qs.get('sburl') || '').trim();
      const key = (qs.get('sbKey') || qs.get('sbkey') || '').trim();
      if (!url && !key) return;
      const patch = {};
      if (url) patch.supabaseUrl = url;
      if (key) patch.supabaseKey = key;
      CC.saveSettings(patch);
      qs.delete('sbUrl'); qs.delete('sburl'); qs.delete('sbKey'); qs.delete('sbkey');
      const q = qs.toString();
      if (window.history && history.replaceState) {
        history.replaceState(null, '', window.location.pathname + (q ? '?' + q : '') + (window.location.hash || ''));
      }
    } catch (e) { /* 무시: 설정은 이미 저장된 값으로 동작 */ }
  })();

  CC.roster = CC.store.get(K.roster, null) || CC.makeDefaultRoster();
  if (!CC.roster || !CC.roster.classes || !Object.keys(CC.roster.classes).length) {
    CC.roster = CC.makeDefaultRoster();
    CC.store.set(K.roster, CC.roster);
  } else if (CC.isLegacyDefaultRoster(CC.roster) || CC.isLegacyDemoRoster(CC.roster)) {
    /* 예전 기본 명단(‘파이썬1반’ 한 반 / 5개 반 × 36명)이 저장돼 있으면
       새 기본 명단(5개 반 × 42명 · 하니쌤)으로 갱신. 보던 반은 그대로 이어 갑니다. */
    const watching = CC.roster.classes && CC.roster.activeClass;
    CC.roster = CC.makeDefaultRoster();
    if (watching && CC.roster.classes[watching]) CC.roster.activeClass = watching;
    CC.store.set(K.roster, CC.roster);
  }
  CC.saveRoster = function (r) {
    if (r) CC.roster = r;
    CC.store.set(K.roster, CC.roster);
  };

  /* 아바타 = 스프라이트 1~8번 (+ 이름표 색) */
  CC.myAvatar = CC.store.get(K.avatar, null) || { sp: 3 };
  CC.saveAvatar = function (v) {
    CC.myAvatar = Object.assign({}, v);
    CC.store.set(K.avatar, CC.myAvatar);
  };

  CC.best = Object.assign({
    cpm: 0, mole: 0, drag: 0, draw: 0, star: 0, rich: 0,
    race: 0, coding: 0, maze: 1, earth: 0
  }, CC.store.get(K.best, {}));
  CC.saveBest = function (patch) {
    Object.assign(CC.best, patch || {});
    CC.store.set(K.best, CC.best);
  };

  /* ── 도우미 ────────────────────────────────────────────── */
  CC.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  CC.lerp = (a, b, t) => a + (b - a) * t;
  CC.rand = (a, b) => a + Math.random() * (b - a);
  CC.randInt = (a, b) => Math.floor(CC.rand(a, b + 1));
  CC.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  CC.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  CC.uid = function () {
    return 'p_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  };
  CC.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  };
  CC.now = () => (window.performance && performance.now ? performance.now() : Date.now());
  CC.pad2 = (n) => String(n).padStart(2, '0');

  /* 이름 → 번호 */
  CC.findNum = function (classId, name) {
    const cls = CC.roster.classes[classId] || CC.roster.classes[CC.roster.activeClass];
    if (!cls || !Array.isArray(cls.students)) return 0;
    const target = String(name).replace(/\s+/g, '');
    const hit = cls.students.find(s => String(s.name).replace(/\s+/g, '') === target);
    return hit ? hit.num : 0;
  };
  CC.classStudent = function (classId, num) {
    const cls = CC.roster.classes[classId];
    if (!cls) return null;
    return cls.students.find(s => s.num === num) || null;
  };
  CC.className = function (num) {
    for (const cid in CC.roster.classes) {
      const hit = CC.roster.classes[cid].students.find(s => s.num === num);
      if (hit) return hit.name;
    }
    return '';
  };
  CC.classList = function (classId) {
    const cls = CC.roster.classes[classId];
    if (!cls || !Array.isArray(cls.students)) return [];
    return cls.students.slice().sort((a, b) => a.num - b.num);
  };
  /* 그 반의 실제 수강인원 (전광판의 전체 T) */
  CC.classTotal = function (classId) {
    const list = CC.classList(classId == null ? CC.roster.activeClass : classId);
    return list.length;
  };

  /* 화면 크기에 맞춘 변환 — 여백 없이 꽉 채우고(cover) 아래쪽 고정 */
  CC.fit = function (cw, ch) {
    const s = Math.max(cw / CC.W, ch / CC.H);
    const ox = cw / 2 - (CC.W / 2) * s;
    const oy = ch - CC.H * s;
    return { s, ox, oy };
  };
})();
