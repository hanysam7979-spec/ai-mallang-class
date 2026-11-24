/* ══════════════════════════════════════════════════════════════
   playground/game-chosung.js — 🔤 초성 퀴즈
   · 주제별(동물·음식·학교·컴퓨터) 57문제 · 힌트 2단계 · 콤보 점수
   · 한 판 = 10문제 / 90초
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const PG = window.PG;

  const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  function chosung(word) {
    return Array.from(word).map(ch => {
      const c = ch.charCodeAt(0);
      if (c >= 0xAC00 && c <= 0xD7A3) return CHO[Math.floor((c - 0xAC00) / 588)];
      return ch;
    }).join(' ');
  }

  const WORDS = {
    '동물': [
      ['사자', '동물의 왕, 멋진 갈기를 가졌어요'],
      ['코끼리', '코가 길고 귀가 아주 커요'],
      ['기린', '목이 아주 길어서 나뭇잎을 먹어요'],
      ['토끼', '깡충깡충 뛰고 당근을 좋아해요'],
      ['거북이', '느리지만 등딱지가 아주 단단해요'],
      ['펭귄', '남극에서 뒤뚱뒤뚱 걸어요'],
      ['다람쥐', '도토리를 모으는 작은 친구'],
      ['호랑이', '줄무늬가 있는 산속의 왕'],
      ['고양이', '야옹~ 쥐를 잡는 동물'],
      ['강아지', '멍멍! 꼬리를 흔들어요'],
      ['부엉이', '밤에 눈이 커지는 부리부리한 새'],
      ['악어', '강에 사는 이빨이 많은 동물'],
      ['물개', '물속을 헤엄치는 귀여운 친구'],
      ['캥거루', '배주머니에 아기를 넣고 다녀요'],
      ['두더지', '땅을 파고 사는 동물']
    ],
    '음식': [
      ['김치', '매콤새콤한 우리나라 반찬'],
      ['떡볶이', '빨간 양념에 쫄깃쫄깃한 간식'],
      ['비빔밥', '밥에 나물을 넣고 비벼 먹어요'],
      ['불고기', '달콤한 양념에 재운 고기'],
      ['라면', '후루룩~ 면발이 들어 있어요'],
      ['삼겹살', '고기를 불판에 구워 먹어요'],
      ['치킨', '바삭바삭한 닭튀김'],
      ['피자', '치즈가 쭉 늘어나는 음식'],
      ['아이스크림', '차갑고 달콤한 디저트'],
      ['수박', '여름에 먹는 크고 빨간 과일'],
      ['딸기', '빨갛고 달콤한 봄 과일'],
      ['바나나', '노란 껍질을 벗겨 먹어요'],
      ['팝콘', '영화관에서 먹는 톡톡 튀는 간식'],
      ['만두', '속을 채워 찌거나 구운 음식'],
      ['계란찜', '폭신폭신한 달걀 요리']
    ],
    '학교': [
      ['칠판', '분필로 글씨를 쓰는 판'],
      ['분필', '칠판에 쓰는 하얀 가루'],
      ['지우개', '틀린 글씨를 지워요'],
      ['가방', '책을 넣고 등에 메고 다녀요'],
      ['교과서', '수업 시간에 보는 책'],
      ['알림장', '오늘의 숙제를 적어요'],
      ['반장', '우리 반의 대표'],
      ['쉬는시간', '수업 사이에 쉬는 시간'],
      ['체육관', '실내에서 운동하는 곳'],
      ['사물함', '내 물건을 넣어 두는 곳'],
      ['도서관', '책을 빌려 읽는 곳'],
      ['운동회', '가을에 열리는 체육 행사'],
      ['급식실', '점심을 먹는 곳']
    ],
    '컴퓨터': [
      ['키보드', '글자를 입력하는 도구'],
      ['마우스', '딸깍 클릭하는 도구'],
      ['모니터', '화면이 보이는 장치'],
      ['프린터', '종이에 인쇄해 주는 기계'],
      ['프로그래밍', '컴퓨터에게 일을 시키는 것'],
      ['인공지능', '사람처럼 생각하는 똑똑한 컴퓨터'],
      ['인터넷', '전 세계가 연결된 그물망'],
      ['스마트폰', '손안의 작은 컴퓨터'],
      ['이어폰', '귀에 꽂고 소리를 들어요'],
      ['폴더', '파일을 모아 두는 곳'],
      ['저장하기', '파일을 그대로 남겨 두는 일'],
      ['검색', '원하는 정보를 찾는 일'],
      ['로봇', '스스로 움직이는 기계'],
      ['코딩', '명령을 차례차례 만드는 일']
    ]
  };
  const CATS = Object.keys(WORDS);

  const ROUND_Q = 10;
  const ROUND_SEC = 90;

  const G = PG.games.chosung = {
    id: 'chosung',
    st: null,
    iv: null,

    mount(root) {
      const self = this;
      const best = PG.rank.personalBest('chosung');
      this.st = {
        playing: false, cat: '전체', qs: [], idx: 0, score: 0, combo: 0, maxCombo: 0,
        correct: 0, results: [], hints: 0, endAt: 0, timeLeft: ROUND_SEC * 1000, locked: false
      };

      root.innerHTML = PG.gameHead('chosung', `
        <span class="chip">문제 <b id="cs-prog">0/10</b></span>
        <span class="chip is-sky">⏱ <b id="cs-time">01:30</b></span>
        <span class="chip is-hot">⭐ <b id="cs-score">0</b></span>
        <span class="chip is-mint">🔥 콤보 <b id="cs-combo">0</b></span>
      `) + `
      <div class="cs-wrap">
        <div class="cs-main panel-white" id="cs-main">
          <span class="cs-cat" id="cs-cat">전체</span>
          <div class="cs-initial" id="cs-initial">· · ·<span class="cs-q">문제를 준비하고 있어요</span></div>
          <div class="cs-hint is-empty" id="cs-hint">힌트가 필요하면 [힌트 보기]를 눌러요</div>
          <form class="cs-form" id="cs-form" autocomplete="off">
            <input class="cs-input" id="cs-input" type="text" maxlength="12" placeholder="정답을 입력하고 Enter!" autocomplete="off" spellcheck="false">
            <button class="cs-send" type="submit">확인</button>
          </form>
          <div class="cs-tools">
            <button id="cs-hint-btn" type="button">💡 힌트 보기</button>
            <button id="cs-skip" type="button">건너뛰기 →</button>
          </div>
          <div class="cs-progress" id="cs-progress"></div>
          <div class="cs-ring" id="cs-ring"></div>
          <div class="cs-feedback" id="cs-feedback"></div>
          <div class="ovl" id="cs-ovl"></div>
        </div>
        <div class="cs-side">
          <div class="cs-sidecard">
            <b>⭐ 지금 점수</b>
            <div class="big" id="cs-big-score">0</div>
            <p>맞힐수록 콤보 보너스가 붙어요</p>
          </div>
          <div class="cs-sidecard">
            <b>🏆 내 최고 기록</b>
            <div class="big" id="cs-best">${best.toLocaleString()}</div>
            <p id="cs-best-d">한 판 10문제 기준</p>
          </div>
          <div class="cs-sidecard">
            <b>주제 고르기</b>
            <div class="cs-cats" id="cs-cats"></div>
          </div>
        </div>
      </div>`;

      PG.bindBack(root);
      const cats = PG.$('#cs-cats', root);
      cats.innerHTML = ['전체'].concat(CATS).map(c =>
        `<button data-cat="${c}" class="${c === '전체' ? 'is-on' : ''}">${c}</button>`).join('');
      PG.$$('[data-cat]', cats).forEach(b => b.addEventListener('click', () => {
        if (self.st.playing) return;
        PG.$$('[data-cat]', cats).forEach(x => x.classList.toggle('is-on', x === b));
        self.st.cat = b.dataset.cat;
        PG.sfx.click();
      }));

      PG.$('#cs-form', root).addEventListener('submit', e => { e.preventDefault(); self.submit(); });
      const inp0 = PG.$('#cs-input', root);
      inp0.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); self.submit(); }
      });
      /* 한글 조합 중에도 마지막 글자가 완성되면 바로 정답 처리 */
      inp0.addEventListener('input', () => self.autoCheck());
      PG.$('#cs-hint-btn', root).addEventListener('click', () => self.hint());
      PG.$('#cs-skip', root).addEventListener('click', () => self.skip());

      this.showStart();
    },

    unmount() {
      clearInterval(this.iv);
      this.iv = null;
      if (this.st) this.st.playing = false;
    },

    /* ── 시작 화면 ── */
    showStart() {
      const st = this.st;
      const ovl = PG.$('#cs-ovl');
      ovl.hidden = false;
      ovl.innerHTML = `<div class="ovl-card">
        <span class="oc-emoji">🔤</span>
        <h3>초성 퀴즈</h3>
        <p>초성만 보고 낱말을 맞혀요. <b>10문제 · 90초</b> 동안 최대한 많이!</p>
        <div class="oc-keys">· 정답을 쓰고 <b>Enter</b><br>· 연속으로 맞히면 <b>콤보 보너스</b><br>· 힌트는 두 번까지 볼 수 있어요</div>
        <div class="ovl-actions"><button class="btn btn-primary" id="cs-start">시작하기 →</button></div>
      </div>`;
      PG.$('#cs-start', ovl).addEventListener('click', () => this.start());
      this.paintChips();
      PG.$('#cs-progress').innerHTML = '';
      PG.$('#cs-initial').innerHTML = '· · ·<span class="cs-q">시작하기를 눌러 주세요</span>';
      PG.$('#cs-input').disabled = true;
    },

    pool() {
      if (this.st.cat === '전체') {
        return PG.shuffle(CATS.reduce((a, c) => a.concat(WORDS[c].map(w => ({ w: w[0], h: w[1], c }))), []));
      }
      return PG.shuffle(WORDS[this.st.cat].map(w => ({ w: w[0], h: w[1], c: this.st.cat })));
    },

    start() {
      const st = this.st;
      clearInterval(this.iv);
      st.playing = true;
      st.qs = this.pool().slice(0, ROUND_Q);
      st.idx = 0; st.score = 0; st.combo = 0; st.maxCombo = 0; st.correct = 0;
      st.results = []; st.hints = 0; st.locked = false;
      st.timeLeft = ROUND_SEC * 1000;
      st.endAt = Date.now() + st.timeLeft;
      PG.$('#cs-ovl').hidden = true;
      PG.$('#cs-input').disabled = false;
      PG.$('#cs-progress').innerHTML = st.qs.map(() => '<span class="cs-dot"></span>').join('');
      this.paintChips();
      this.showQ();
      PG.$('#cs-input').focus();
      PG.sfx.pop();
      const self = this;
      this.iv = setInterval(() => {
        if (!st.playing) return;
        st.timeLeft = Math.max(0, st.endAt - Date.now());
        const t = PG.$('#cs-time');
        if (t) t.textContent = PG.fmtTime(st.timeLeft);
        if (st.timeLeft <= 0) self.finish();
      }, 200);
    },

    showQ() {
      const st = this.st;
      const q = st.qs[st.idx];
      if (!q) { this.finish(); return; }
      st.locked = false;
      st.hintLevel = 0;
      PG.$('#cs-cat').textContent = q.c;
      PG.$('#cs-initial').innerHTML = chosung(q.w) + `<span class="cs-q">${q.w.length}글자 낱말</span>`;
      const hint = PG.$('#cs-hint');
      hint.className = 'cs-hint is-empty';
      hint.textContent = '힌트가 필요하면 [힌트 보기]를 눌러요';
      const hb = PG.$('#cs-hint-btn');
      hb.disabled = false;
      hb.textContent = '💡 힌트 보기';
      const inp = PG.$('#cs-input');
      inp.value = '';
      inp.focus();
      PG.$('#cs-progress').children && Array.from(PG.$('#cs-progress').children).forEach((d, i) => {
        d.classList.toggle('now', i === st.idx);
        d.classList.remove('ok', 'no');
      });
      // 이미 지나간 문제 표시
      st.results.forEach((r, i) => {
        const d = PG.$('#cs-progress').children[i];
        if (d) d.classList.add(r.ok ? 'ok' : 'no');
      });
    },

    hint() {
      const st = this.st;
      if (!st.playing || st.locked) return;
      const q = st.qs[st.idx];
      const hint = PG.$('#cs-hint');
      const hb = PG.$('#cs-hint-btn');
      st.hintLevel = (st.hintLevel || 0) + 1;
      if (st.hintLevel === 1) {
        hint.className = 'cs-hint';
        hint.textContent = '💡 ' + q.h;
        hb.textContent = '💡 글자 힌트';
        st.hints++;
        PG.sfx.click();
      } else if (st.hintLevel === 2) {
        hint.textContent = '💡 ' + q.h + ' · 첫 글자는 「' + Array.from(q.w)[0] + '」';
        hb.textContent = '💡 힌트 다 씀';
        hb.disabled = true;
        st.hints++;
        PG.sfx.click();
      }
    },

    autoCheck() {
      const st = this.st;
      if (!st.playing || st.locked) return;
      const q = st.qs[st.idx];
      const inp = PG.$('#cs-input');
      if (!q || !inp) return;
      const v = (inp.value || '').replace(/\s+/g, '');
      if (v && v === q.w.replace(/\s+/g, '')) this.submit();
    },

    submit() {
      const st = this.st;
      if (!st.playing || st.locked) return;
      const input = PG.$('#cs-input');
      const raw = input.value;
      const val = raw.replace(/\s+/g, '');
      if (!val) return;
      const q = st.qs[st.idx];
      if (val === q.w.replace(/\s+/g, '')) {
        st.locked = true;
        st.combo += 1;
        st.maxCombo = Math.max(st.maxCombo, st.combo);
        st.correct += 1;
        const bonus = Math.min(st.combo * 20, 100);
        const hintPenalty = Math.min(st.hintLevel || 0, 2) * 30;
        const gain = Math.max(20, 100 + bonus - hintPenalty);
        st.score += gain;
        st.results[st.idx] = { ok: true };
        this.flash('good', '+' + gain + (bonus ? ' 🔥콤보!' : ''));
        PG.sfx.correct();
        this.paintChips();
        const self = this;
        setTimeout(() => {
          if (!st.playing) return;
          st.idx++;
          if (st.idx >= st.qs.length) self.finish(); else self.showQ();
        }, 680);
      } else {
        st.combo = 0;
        st.results[st.idx] = { ok: false };
        this.flash('bad', '아쉬워요! 다시');
        PG.sfx.wrong();
        input.select();
        this.paintChips();
      }
    },

    flash(kind, msg) {
      const fb = PG.$('#cs-feedback');
      const ring = PG.$('#cs-ring');
      if (fb) {
        fb.textContent = msg;
        fb.className = 'cs-feedback ' + (kind === 'good' ? 'show-good' : 'show-bad');
        clearTimeout(this._fbT);
        this._fbT = setTimeout(() => { fb.className = 'cs-feedback'; }, 620);
      }
      if (ring) {
        ring.className = 'cs-ring ' + kind;
        clearTimeout(this._ringT);
        this._ringT = setTimeout(() => { ring.className = 'cs-ring'; }, 420);
      }
    },

    skip() {
      const st = this.st;
      if (!st.playing || st.locked) return;
      st.combo = 0;
      st.results[st.idx] = { ok: false };
      PG.sfx.click();
      st.idx++;
      this.paintChips();
      if (st.idx >= st.qs.length) this.finish(); else this.showQ();
    },

    paintChips() {
      const st = this.st;
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set('cs-prog', Math.min(st.idx + (st.playing ? 1 : 0), st.qs.length || ROUND_Q) + '/' + (st.qs.length || ROUND_Q));
      set('cs-score', st.score.toLocaleString());
      set('cs-big-score', st.score.toLocaleString());
      set('cs-combo', st.combo);
      set('cs-time', PG.fmtTime(st.timeLeft));
    },

    finish() {
      const st = this.st;
      if (!st.playing) return;
      st.playing = false;
      clearInterval(this.iv);
      this.iv = null;
      const answered = Math.min(st.idx + 1, st.qs.length);
      const timeBonus = Math.floor(st.timeLeft / 1000) * 3;
      const total = st.score + (st.correct === st.qs.length ? 200 : 0) + timeBonus;
      const detail = st.correct + '문제 · 최고 콤보 ' + st.maxCombo;
      const prevBest = PG.rank.personalBest('chosung');
      PG.rank.add({ game: 'chosung', score: total, detail });
      const best = PG.rank.personalBest('chosung');
      const nb = PG.$('#cs-best'); if (nb) nb.textContent = best.toLocaleString();
      const nb2 = document.getElementById('cs-big-score'); if (nb2) nb2.textContent = total.toLocaleString();
      PG.sfx.win();
      const ovl = PG.$('#cs-ovl');
      ovl.hidden = false;
      ovl.innerHTML = `<div class="ovl-card">
        <span class="oc-emoji">${st.correct >= 8 ? '🏆' : st.correct >= 5 ? '🎉' : '💪'}</span>
        <h3>${st.correct}문제 맞혔어요!</h3>
        <p>${st.correct === st.qs.length ? '전부 맞혔어요. 정말 대단해요!' : '한 판 더 하면 더 잘할 수 있어요.'}</p>
        <div class="oc-score">
          <span class="ocs"><b>${total.toLocaleString()}</b><i>점수</i></span>
          <span class="ocs"><b>${st.maxCombo}</b><i>최고 콤보</i></span>
          <span class="ocs"><b>${st.correct}/${st.qs.length}</b><i>정답</i></span>
        </div>
        <div class="oc-best">🏆 내 최고 기록 ${best.toLocaleString()}점${total > prevBest ? ' · 신기록!' : ''}</div>
        <div class="ovl-actions">
          <button class="btn btn-primary" id="cs-again">한 판 더</button>
          <button class="btn" id="cs-home">놀이터로</button>
        </div>
      </div>`;
      PG.$('#cs-again', ovl).addEventListener('click', () => this.start());
      PG.$('#cs-home', ovl).addEventListener('click', () => PG.go('hub'));
      PG.$('#cs-input').disabled = true;
      this.paintChips();
    }
  };
})();
