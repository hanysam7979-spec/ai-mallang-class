/* ══════════════════════════════════════════════════════════════
   app.js — 입장 · 교실 루프 · 입력 · 실시간 동기화 (v3)
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CC = window.CC;
  const APP = (CC.app = {});
  const state = APP.state = {
    started: false,
    loginMode: 'student',
    mePlayer: null,
    players: new Map(),
    screen: { mode: 'welcome' },
    teacher: null,
    lastT: 0,
    keys: {},
    hintTimer: null
  };

  let canvas, ctx, stage, view = { w: 1200, h: 900, dpr: 1, s: 1, ox: 0, oy: 0 };

  /* ══════════════════════════════════════════════════════════
     초기화
     ══════════════════════════════════════════════════════════ */
  APP.init = function () {
    canvas = document.getElementById('scene');
    stage = document.getElementById('stage');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    CC.scene.build(occupiedSet(), 0);

    resize();
    window.addEventListener('resize', () => { resize(); });

    fillClassSelect();
    wireLogin();
    wireUI();
    wireCanvas();
    wireKeys();

    CC.sfx.enabled(CC.settings.sound !== false);
    updateSoundBtn();
    CC.ui.updateConn();
    CC.ui.updateCounts(0, CC.classTotal());

    const last = CC.store.get(CC.KEYS.last, null);
    if (last) {
      const nameIn = document.getElementById('in-name');
      if (nameIn && last.name) nameIn.value = last.name;
      const clsSel = document.getElementById('in-class');
      if (clsSel && last.classId && CC.roster.classes[last.classId]) clsSel.value = last.classId;
    }

    /* 폰트가 준비되면 한 번 더 그린다 (갈무리 픽셀 폰트) */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => CC.scene.invalidate());
    }
    CC.art.onReady(() => CC.scene.build());

    state.lastT = CC.now();
    requestAnimationFrame(loop);
  };

  function resize() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = stage.getBoundingClientRect();
    view.w = Math.max(320, r.width);
    view.h = Math.max(220, r.height);
    view.dpr = dpr;
    canvas.width = Math.round(view.w * dpr);
    canvas.height = Math.round(view.h * dpr);
    canvas.style.width = view.w + 'px';
    canvas.style.height = view.h + 'px';
    const fit = CC.fit(view.w, view.h);
    view.s = fit.s; view.ox = fit.ox; view.oy = fit.oy;
  }

  /* 명단에 있는 번호 집합 */
  function occupiedSet(classId) {
    const set = new Set();
    CC.classList(classId || CC.roster.activeClass).forEach(s => {
      if (s.num >= 1 && s.num <= CC.MAX_SEAT) set.add(s.num);
    });
    return set;
  }

  APP.onRosterChange = function () {
    const set = occupiedSet();
    CC.player.refreshBoxes();
    CC.scene.build(set, CC.me ? CC.me.num : 0);
    CC.ui.updateCounts(APP.presentSet().size, CC.classTotal());
    if (CC.me) buildDemoPeers();
  };

  /* ══════════════════════════════════════════════════════════
     로그인
     ══════════════════════════════════════════════════════════ */
  function fillClassSelect() {
    const sel = document.getElementById('in-class');
    if (!sel) return;
    const names = Object.keys(CC.roster.classes);
    sel.innerHTML = names.map(n =>
      `<option value="${CC.esc(n)}" ${n === CC.roster.activeClass ? 'selected' : ''}>${CC.esc(n)}</option>`
    ).join('');
  }
  APP.refreshLoginSelect = fillClassSelect;

  function wireLogin() {
    const tabS = document.getElementById('tab-student');
    const tabT = document.getElementById('tab-teacher');
    const formS = document.getElementById('form-student');
    const formT = document.getElementById('form-teacher');

    function mode(m) {
      state.loginMode = m;
      const isS = m === 'student';
      CC.sfx.click();
      tabS.classList.toggle('is-on', isS);
      tabT.classList.toggle('is-on', !isS);
      tabS.setAttribute('aria-selected', isS);
      tabT.setAttribute('aria-selected', !isS);
      formS.hidden = !isS;
      formT.hidden = isS;
      setTimeout(() => {
        const f = isS ? document.getElementById('in-name') : document.getElementById('in-tname');
        if (f) f.focus();
      }, 40);
    }
    tabS.onclick = () => mode('student');
    tabT.onclick = () => mode('teacher');

    formS.addEventListener('submit', (e) => {
      e.preventDefault();
      const clsSel = document.getElementById('in-class');
      const nameIn = document.getElementById('in-name');
      const err = document.getElementById('login-err');
      const name = (nameIn.value || '').trim();
      const classId = clsSel.value;
      if (!name) {
        err.hidden = false;
        err.innerHTML = '이름을 입력해 주세요.';
        CC.sfx.err();
        nameIn.focus();
        return;
      }
      CC.roster.activeClass = classId;
      CC.saveRoster();
      CC.player.refreshBoxes();
      CC.scene.build(occupiedSet(), 0);
      const num = CC.findNum(classId, name);

      if (!num) {
        err.hidden = false;
        err.innerHTML = `명단에 <b>${CC.esc(name)}</b> 이(가) 없어요.<br>
          이름을 다시 확인하거나, 선생님께 명단 등록을 부탁해 주세요.<br>
          <button class="btn btn-sm btn-yellow" id="guest-btn" style="margin-top:6px">체험으로 입장하기</button>`;
        CC.sfx.err();
        const gb = document.getElementById('guest-btn');
        if (gb) gb.onclick = () => enterAsGuest(name, classId);
        return;
      }
      err.hidden = true;
      enterStudent(classId, num, name);
    });

    formT.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (document.getElementById('in-tname').value || '').trim() || CC.settings.teacherName;
      const pw = document.getElementById('in-pw').value;
      const err = document.getElementById('login-err2');
      if (pw !== CC.settings.teacherPw) {
        err.hidden = false;
        err.textContent = '비밀번호가 달라요. 기본 비밀번호는 1234 입니다.';
        CC.sfx.err();
        return;
      }
      err.hidden = true;
      enterTeacher(document.getElementById('in-class').value, name);
    });
  }

  function freeNum(classId) {
    const list = CC.classList(classId);
    const used = new Set(list.map(s => s.num));
    for (let i = 1; i <= 36; i++) if (!used.has(i)) return i;
    return CC.randInt(1, 36);
  }

  function enterAsGuest(name, classId) {
    const num = freeNum(classId);
    CC.sfx.pop();
    CC.ui.toast('체험 모드로 입장했어요 · ' + num + '번 자리');
    enterStudent(classId, num, name, true);
  }

  function enterStudent(classId, num, name, guest) {
    CC.store.set(CC.KEYS.last, { name, classId });
    const seat = CC.seat(num);
    const me = CC.player.make({
      id: CC.uid(), num, name, v: CC.myAvatar,
      x: CC.DOOR.x, y: CC.DOOR.y + 60, seated: false
    });
    me.isMe = true;
    me.guest = !!guest;
    state.mePlayer = me;
    state.players.set(me.id, me);
    CC.me = {
      id: me.id, num, name, teacher: false, v: me.v,
      x: me.x, y: me.y, seatRow: null, seated: false, pose: 'stand', dir: 'front'
    };

    startClass();
    CC.sfx.join();
    CC.ui.toast(`${name}님, ${num}번 자리로 안내할게요!`);
    CC.scene.spawnSparkle(me.x, me.y - 60, 18);

    /* 문에서 내 자리로 걸어가기 */
    if (seat) {
      CC.player.walkTo(me, seat.x, seat.y + 46, () => {
        CC.player.sit(me, seat);
        CC.player.bubble(me, '자리 도착!', 2.2);
        CC.scene.spawnSparkle(seat.x, seat.y - 90, 12);
        CC.ui.renderMe();
        syncMe();
      });
    } else {
      /* 36명 초과 — 통로에 서 있기 */
      CC.player.walkTo(me, 700, 1050 - 20, () => {
        CC.player.bubble(me, '자리가 없어 통로에 섰어요', 3);
      });
    }
  }

  function enterTeacher(classId, name) {
    CC.roster.activeClass = classId;
    CC.store.set(CC.KEYS.last, { name, classId });
    const me = CC.player.make({
      id: CC.uid(), num: 0, name, teacher: true,
      x: CC.DOOR.x, y: CC.DOOR.y + 60, seated: false
    });
    me.isMe = true;
    state.mePlayer = me;
    state.players.set(me.id, me);
    CC.me = {
      id: me.id, num: 0, name, teacher: true, v: me.v,
      x: me.x, y: me.y, seatRow: null, seated: false, pose: 'stand', dir: 'front'
    };

    startClass();
    CC.sfx.join();
    CC.ui.toast(`${name} 선생님, 환영합니다!`);
    CC.scene.spawnSparkle(me.x, me.y - 60, 18);
    CC.player.walkTo(me, CC.TEACHER.x + 60, CC.TEACHER.y + 10, () => {
      CC.player.bubble(me, '안녕하세요!', 2.6);
      CC.player.animate(me, 'hi', 1.4);
      syncMe();
    });
    CC.ui.renderMe();
  }

  function startClass() {
    const login = document.getElementById('login');
    if (login) login.classList.add('hide');
    state.started = true;
    CC.ui.renderMe();
    CC.ui.updateCounts(APP.presentSet().size, CC.classTotal());
    CC.scene.build(occupiedSet(), CC.me ? CC.me.num : 0);

    const list = CC.classList(CC.roster.activeClass);
    const absent = (CC.isDemoClass(CC.roster.activeClass) && list.length >= 36) ? CC.DEMO_ABSENT : [];
    CC.rt.stop();
    CC.rt.init({
      classId: CC.roster.activeClass,
      me: CC.me,
      roster: list,
      absent: absent,
      demo: true
    });
    wireRealtime();
    CC.ui.updateConn();
    updateActionStates();
    buildDemoPeers();

    if (state.hintTimer) clearTimeout(state.hintTimer);
    state.hintTimer = setTimeout(() => {
      const h = document.getElementById('hint');
      if (h) h.classList.add('fade');
    }, 9000);
  }

  APP.refreshMe = function () { buildDemoPeers(); };

  /* 데모 가상 친구들의 스프라이트를 명단 순서대로 다시 배정 */
  function buildDemoPeers() {
    const list = CC.classList(CC.roster.activeClass);
    const peers = CC.rt.peersList();
    peers.forEach(p => {
      if (!p.demo) return;
      const idx = list.findIndex(s => s.num === p.num);
      p.v = { sp: ((idx < 0 ? p.num : idx) % 8) + 1 };
    });
  }

  function wireRealtime() {
    CC.rt.on('status', () => CC.ui.updateConn());
    CC.rt.on('peers', () => CC.ui.updateCounts(APP.presentSet().size, CC.classTotal()));
    CC.rt.on('race', (p) => CC.games.race.handle(p));
    CC.rt.on('notice', (p) => { if (p) APP.setScreen({ mode: 'notice', notice: p.notice }); });
    CC.rt.on('screen', (p) => { if (p) APP.setScreen(p); });
    CC.rt.on('roster', (p) => {
      if (!p || !p.classes) return;
      Object.assign(CC.roster.classes, p.classes);
      if (p.activeClass) CC.roster.activeClass = p.activeClass;
      CC.saveRoster();
      fillClassSelect();
      APP.onRosterChange();
      CC.ui.toast('선생님이 새 명단을 올렸어요');
    });
  }

  APP.reconnect = function () {
    if (!CC.me) return;
    const me = state.mePlayer;
    CC.rt.stop();
    CC.rt.init({
      classId: CC.roster.activeClass, me: CC.me,
      roster: CC.classList(CC.roster.activeClass), absent: CC.DEMO_ABSENT, demo: true
    });
    wireRealtime();
    CC.ui.updateConn();
    buildDemoPeers();
    if (me) { me.x = CC.me.x; me.y = CC.me.y; }
  };

  /* ══════════════════════════════════════════════════════════
     동기화
     ══════════════════════════════════════════════════════════ */
  function syncMe() {
    if (!CC.me || !state.mePlayer) return;
    const p = state.mePlayer;
    CC.me.x = p.x; CC.me.y = p.y;
    CC.me.seated = !!p.seated;
    CC.me.seatRow = p.seatRow;
    CC.me.pose = p.pose;
    CC.me.dir = p.dir;
    CC.me.v = p.v;
    CC.rt.setMe(CC.me);
  }

  APP.presentSet = function () {
    const s = new Set();
    if (CC.me && !CC.me.teacher && CC.me.num) s.add(CC.me.num);
    CC.rt.peersList().forEach(p => { if (p.num) s.add(p.num); });
    return s;
  };

  function syncPeers(dt) {
    const list = CC.rt.peersList();
    const seen = new Set();

    list.forEach(p => {
      if (!p.num && !p.teacher) return;
      if (p.id === (CC.me && CC.me.id)) return;
      seen.add(p.id);
      let pl = state.players.get(p.id);
      if (!pl) {
        const seat = p.num ? CC.seat(p.num) : null;
        pl = CC.player.make({
          id: p.id, num: p.num, name: p.name, v: p.v, teacher: !!p.teacher,
          x: p.x != null ? p.x : (seat ? seat.x : 700),
          y: p.y != null ? p.y : (seat ? seat.y : 700),
          seated: p.seated !== false
        });
        state.players.set(p.id, pl);
      }
      if (p.name) pl.name = p.name;
      if (p.v) pl.v = CC.avatar.norm(p.v);

      if (p.teacher) {
        pl.x = CC.TEACHER.x; pl.y = CC.TEACHER.y; pl.pose = 'stand'; pl.seatRow = null; pl.seated = false;
      } else if (p.seated) {
        const seat = CC.seat(p.num);
        if (seat) {
          pl.seated = true; pl.seatRow = seat.row; pl.pose = 'sit';
          pl.x = seat.x; pl.y = seat.y; pl.nx = null; pl.ny = null;
        } else {
          pl.seated = false; pl.seatRow = null;
        }
      } else {
        pl.seated = false; pl.seatRow = null; pl.pose = 'stand';
        if (p.x != null) { pl.nx = p.x; pl.ny = p.y; }
      }

      if (p.bubble) { CC.player.bubble(pl, p.bubble, 2.6); p.bubble = null; }
      if (p.anim) { CC.player.animate(pl, p.anim, 1.2); p.anim = null; }
    });

    Array.from(state.players.keys()).forEach(id => {
      if (id === (CC.me && CC.me.id)) return;
      if (!seen.has(id)) state.players.delete(id);
    });

    state.players.forEach(pl => {
      if (pl.nx == null) return;
      const k = Math.min(1, dt * 9);
      const dx = pl.nx - pl.x, dy = pl.ny - pl.y;
      pl.x += dx * k; pl.y += dy * k;
      pl.walk = Math.hypot(dx, dy) > 1.2 ? Math.sin(CC.now() / 90) : 0;
      if (Math.abs(dy) > 1) pl.dir = dy < 0 ? 'back' : 'front';
    });

    CC.ui.updateCounts(APP.presentSet().size, CC.classTotal());
  }

  /* ══════════════════════════════════════════════════════════
     화면 상태
     ══════════════════════════════════════════════════════════ */
  APP.setScreen = function (s) {
    state.screen = Object.assign({ mode: 'welcome' }, s || {});
  };
  APP.syncScreen = function () {};

  function currentScreen() {
    const r = CC.race;
    if (r && (r.mode === 'running' || r.mode === 'done')) {
      return { mode: r.winner ? 'race' : 'race-wait', text: r.text, winner: r.winner, rank: r.ranks };
    }
    if (state.screen.mode === 'notice' && state.screen.notice) {
      return { mode: 'notice', notice: state.screen.notice };
    }
    return { mode: 'welcome', sub: state.screen.sub };
  }

  /* ══════════════════════════════════════════════════════════
     루프
     ══════════════════════════════════════════════════════════ */
  function loop(t) {
    const now = CC.now();
    let dt = (now - state.lastT) / 1000;
    state.lastT = now;
    if (!isFinite(dt) || dt < 0) dt = 0.016;
    dt = Math.min(dt, 0.06);

    const me = state.mePlayer;
    if (state.started && me) {
      if (hasMoveKey()) CC.player.keyMove(me, state.keys, dt);
      CC.player.update(me, dt);
      syncMe();
      CC.rt.pushPos();
    } else if (me) {
      CC.player.update(me, dt);
    }

    CC.rt.tickDemo(dt);
    if (state.started) syncPeers(dt);
    CC.scene.updateParticles(dt);

    draw(now);
    requestAnimationFrame(loop);
  }

  function hasMoveKey() {
    const k = state.keys;
    return !!(k['w'] || k['a'] || k['s'] || k['d'] ||
      k['arrowup'] || k['arrowdown'] || k['arrowleft'] || k['arrowright']);
  }

  function draw(now) {
    if (!ctx) return;
    const dpr = view.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#141024';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const s = view.s * dpr;
    ctx.setTransform(s, 0, 0, s, view.ox * dpr, view.oy * dpr);
    ctx.imageSmoothingEnabled = false;

    const players = [];
    state.players.forEach(p => {
      if (p.teacher) return;
      players.push(p);
    });

    let teacher = null;
    if (state.started) {
      let tp = null;
      state.players.forEach(p => { if (p.teacher) tp = p; });
      if (tp) {
        teacher = { x: CC.TEACHER.x, y: CC.TEACHER.y, h: 160, v: tp.v, name: (tp.name || '김하늘') + ' 선생님' };
      } else if (CC.me && CC.me.teacher) {
        teacher = { x: CC.TEACHER.x, y: CC.TEACHER.y, h: 160, v: CC.me.v, name: CC.me.name + ' 선생님' };
      } else {
        teacher = {
          x: CC.TEACHER.x, y: CC.TEACHER.y, h: 160,
          v: { sp: 1 }, name: (CC.settings.teacherName || '김하늘') + ' 선생님'
        };
      }
    }

    CC.scene.render(ctx, now, {
      players, teacher,
      screen: state.started ? currentScreen() : { mode: 'welcome', sub: '반과 번호를 확인해 주세요' }
    });

    if (state.started && state.mePlayer && !state.mePlayer.teacher) {
      const p = state.mePlayer;
      if (!p.seated) CC.scene.drawName(ctx, p.x, p.y + 22, p.name + ' (나)', { bg: '#FFF0B8' });
    }
  }

  /* ══════════════════════════════════════════════════════════
     입력
     ══════════════════════════════════════════════════════════ */
  function toWorld(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left - view.ox) / view.s,
      y: (clientY - r.top - view.oy) / view.s
    };
  }

  function wireCanvas() {
    canvas.addEventListener('pointerdown', (e) => {
      if (!state.started || !state.mePlayer) return;
      const w = toWorld(e.clientX, e.clientY);
      const me = state.mePlayer;

      const hit = CC.scene.hitPlayer(w.x, w.y, Array.from(state.players.values()).filter(p => p !== me && !p.teacher));
      if (hit) {
        hit.showName = true;
        setTimeout(() => { hit.showName = false; }, 2600);
        CC.ui.toast(`${hit.name} · ${hit.num ? hit.num + '번' : ''}`);
        return;
      }

      const desk = CC.player.deskAt(w.x, w.y);
      if (desk) {
        if (me.teacher) { CC.ui.toast(`${desk.num}번 자리`); return; }
        if (desk.num === me.num) {
          CC.player.walkTo(me, desk.x, desk.y + 46, () => {
            CC.player.sit(me, desk);
            CC.player.bubble(me, '내 자리!', 1.8);
            updateActionStates();
            syncMe();
          });
          CC.ui.toast('내 자리로 돌아갈게요');
        } else {
          const nm = CC.className(desk.num) || (desk.num + '번');
          CC.ui.toast(`${nm} 자리예요 (${desk.num}번)`);
          CC.player.walkTo(me, desk.x, desk.y + 50, null);
        }
        return;
      }

      CC.player.walkTo(me, w.x, w.y, null);
      updateActionStates();
    });
  }

  function wireKeys() {
    window.addEventListener('keydown', (e) => {
      const tag = (e.target && e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (CC.ui.modalOpen()) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) >= 0) {
        e.preventDefault();
        state.keys[k] = true;
      }
      if (state.started && state.mePlayer && !state.mePlayer.teacher) {
        if (k === ' ') { e.preventDefault(); act('hand'); }
        else if (k === 'e') act('sit');
      }
    });
    window.addEventListener('keyup', (e) => {
      state.keys[e.key.toLowerCase()] = false;
    });
    window.addEventListener('blur', () => { state.keys = {}; });
  }

  /* ══════════════════════════════════════════════════════════
     행동
     ══════════════════════════════════════════════════════════ */
  function updateActionStates() {
    const me = state.mePlayer;
    const sit = document.querySelector('.act-sit');
    if (sit && me) sit.classList.toggle('is-on', !!me.seated);
  }

  const ACTIONS = {
    clap: { text: '짝짝짝!', anim: 'clap', dur: 1.3 },
    hi: { text: '안녕하세요!', anim: 'hi', dur: 1.4 },
    hand: { text: '질문 있어요!', anim: 'hand', dur: 2.2 },
    stand: { text: '일어났어요!', anim: 'jump', dur: 0.7 }
  };

  function act(name) {
    const me = state.mePlayer;
    if (!me || !state.started) return;
    if (name === 'sit') {
      const seat = CC.seat(me.num);
      if (!seat) { CC.ui.toast('앉을 자리가 없어요'); return; }
      CC.player.walkTo(me, seat.x, seat.y + 46, () => {
        CC.player.sit(me, seat);
        CC.player.bubble(me, '자리에 앉았어요', 1.8);
        CC.sfx.pop();
        updateActionStates();
        syncMe();
        CC.rt.sendAct('자리에 앉았어요', null);
      });
      return;
    }
    if (name === 'stand') {
      CC.player.stand(me);
      updateActionStates();
    }
    const a = ACTIONS[name];
    if (!a) return;
    CC.player.bubble(me, a.text, 2.2);
    CC.player.animate(me, a.anim, a.dur);
    if (name === 'clap' || name === 'hi') CC.sfx.pop();
    if (name === 'hand') CC.sfx.tick();
    CC.rt.sendAct(a.text, a.anim);
    syncMe();
  }
  APP.act = act;

  /* ══════════════════════════════════════════════════════════
     UI 연결
     ══════════════════════════════════════════════════════════ */
  function updateSoundBtn() {
    const b = document.getElementById('btn-sound');
    if (b) {
      b.textContent = CC.sfx.isOn() ? '♪' : '✕';
      b.title = CC.sfx.isOn() ? '소리 끄기' : '소리 켜기';
    }
  }

  function wireUI() {
    const $ = (id) => document.getElementById(id);

    $('scoreboard').onclick = () => { CC.sfx.click(); CC.ui.rosterModal(); };
    $('btn-class').onclick = () => { CC.sfx.click(); CC.ui.rosterModal(); };
    $('btn-me').onclick = () => { CC.sfx.click(); CC.ui.avatarModal(); };
    $('btn-avatar').onclick = () => { CC.sfx.click(); CC.ui.avatarModal(); };
    $('btn-roster').onclick = () => { CC.sfx.click(); CC.ui.rosterModal(); };
    $('btn-teacher').onclick = () => { CC.sfx.click(); CC.ui.teacherModal(); };
    $('btn-supabase').onclick = () => { CC.sfx.click(); CC.ui.teacherModal(); };

    $('btn-sound').onclick = () => {
      const on = !CC.sfx.isOn();
      CC.sfx.enabled(on);
      CC.saveSettings({ sound: on });
      updateSoundBtn();
      if (on) CC.sfx.pop();
    };

    $('btn-exit').onclick = () => {
      if (!state.started) return;
      CC.sfx.click();
      CC.rt.stop();
      state.started = false;
      state.players.clear();
      state.mePlayer = null;
      CC.me = null;
      CC.race.mode = 'idle'; CC.race.winner = null; CC.race.ranks = [];
      const login = document.getElementById('login');
      if (login) login.classList.remove('hide');
      CC.ui.updateCounts(0, CC.classTotal());
      CC.ui.toast('교실에서 나왔어요');
    };

    $('btn-demo').onclick = () => {
      CC.sfx.click();
      const url = location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          () => CC.ui.toast('초대 링크를 복사했어요!'),
          () => CC.ui.toast('주소: ' + url)
        );
      } else CC.ui.toast('주소: ' + url);
    };

    document.querySelectorAll('.game-card').forEach(card => {
      card.onclick = () => {
        CC.sfx.click();
        const g = card.dataset.game;
        if (g === 'typing') CC.games.typing.open();
        else if (g === 'coding') CC.games.coding.open();
        else if (g === 'mouse') CC.games.mouse.open();
        else if (g === 'race') CC.games.race.open();
        else if (g === 'earth') CC.games.earth.open();
      };
    });

    document.querySelectorAll('.act').forEach(btn => {
      btn.onclick = () => {
        CC.sfx.click();
        act(btn.dataset.act);
      };
    });
  }

  /* ── 전역 오류 표시 ───────────────────────────────────── */
  window.addEventListener('error', (e) => {
    const bar = document.getElementById('errbar');
    if (!bar) return;
    bar.hidden = false;
    bar.textContent = '⚠ ' + (e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + (e.lineno || 0);
    (window.__ccErrors = window.__ccErrors || []).push(String(e.message));
  });
  window.addEventListener('unhandledrejection', (e) => {
    const bar = document.getElementById('errbar');
    if (!bar) return;
    bar.hidden = false;
    bar.textContent = '⚠ ' + (e.reason && e.reason.message ? e.reason.message : e.reason);
    (window.__ccErrors = window.__ccErrors || []).push(String(e.reason));
  });

  /* ══════════════════════════════════════════════════════════
     시작
     ══════════════════════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => APP.init());
  } else {
    APP.init();
  }
})();
