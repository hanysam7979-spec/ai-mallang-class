/* ══════════════════════════════════════════════════════════════
   realtime.js — 37명 동시 접속 레이어
   · Supabase Realtime(Presence + Broadcast) 로 실제 동기화
   · 설정 전(또는 실패 시) 로컬 데모 모드: 가상 친구 28명 + 같은 브라우저 다른 탭
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CC = window.CC;
  const RT = (CC.rt = {});

  const st = {
    mode: 'local',
    connected: false,
    selfId: CC.uid(),
    me: null,
    peers: new Map(),
    handlers: {},
    client: null,
    channel: null,
    bc: null,
    room: 'classroom',
    demo: true,
    classId: '',
    lastErr: '',
    hbTimer: null,
    retryTimer: null,
    retryCount: 0
  };

  RT.id = () => st.selfId;
  RT.mode = () => st.mode;
  RT.connected = () => st.connected;
  RT.lastError = () => st.lastErr;
  RT.peerCount = () => {
    let n = 0;
    st.peers.forEach(p => { if (p.present !== false) n++; });
    return n;
  };

  function on(type, fn) {
    (st.handlers[type] = st.handlers[type] || []).push(fn);
    return () => {
      const a = st.handlers[type];
      const i = a.indexOf(fn);
      if (i >= 0) a.splice(i, 1);
    };
  }
  RT.on = on;
  function emit(type, payload) {
    (st.handlers[type] || []).slice().forEach(fn => {
      try { fn(payload); } catch (e) { console.warn('[rt] handler', type, e); }
    });
  }

  /* ══════════════════════════════════════════════════════════
     초기화
     ══════════════════════════════════════════════════════════ */
  RT.init = function (opts) {
    const o = opts || {};
    st.classId = o.classId || '';
    st.room = 'cc_' + (o.classId || 'class');
    st.me = o.me || null;
    st.selfId = (o.me && o.me.id) || st.selfId;

    const S = CC.settings;
    const canSupabase = !!(S.supabaseUrl && S.supabaseKey && window.supabase &&
      /^https?:\/\//.test(S.supabaseUrl));

    if (canSupabase) {
      const ok = connectSupabase(S.supabaseUrl, S.supabaseKey, o.me);
      if (ok) { st.mode = 'supabase'; return; }
    }
    startLocal(o);
  };

  RT.stop = function () {
    const ch = st.channel;
    st.channel = null;                       /* 이전 채널 콜백이 상태를 덮어쓰지 않도록 먼저 비웁니다 */
    try { if (ch && st.client) st.client.removeChannel(ch); } catch (e) {}
    try { if (st.client && st.client.realtime) st.client.realtime.disconnect(); } catch (e) {}
    st.client = null;
    try { if (st.bc) st.bc.close(); } catch (e) {}
    if (st.hbTimer) { clearInterval(st.hbTimer); st.hbTimer = null; }
    if (st.retryTimer) { clearTimeout(st.retryTimer); st.retryTimer = null; }
    st.retryCount = 0;
    st.bc = null; st.peers.clear();
    st.connected = false; st.mode = 'local'; st.lastErr = '';
  };

  /* ══════════════════════════════════════════════════════════
     Supabase
     ══════════════════════════════════════════════════════════ */
  function connectSupabase(url, key, me) {
    try {
      st.client = window.supabase.createClient(url, key, {
        realtime: { params: { eventsPerSecond: 20 } }
      });
      const ch = st.client.channel(st.room, {
        config: {
          broadcast: { self: false, ack: false },
          presence: { key: st.selfId }
        }
      });
      st.channel = ch;

      ch.on('presence', { event: 'sync' }, () => {
        if (st.channel !== ch) return;
        const map = ch.presenceState();
        const seen = new Set();
        Object.keys(map).forEach(keyKey => {
          (map[keyKey] || []).forEach(meta => {
            const id = meta.id || keyKey;
            if (id === st.selfId) return;
            const prev = st.peers.get(id) || {};
            st.peers.set(id, Object.assign({}, prev, {
              id,
              num: meta.num || 0,
              name: meta.name || '친구',
              v: meta.v || CC.avatar.default(),
              teacher: !!meta.teacher,
              present: true,
              x: meta.x != null ? meta.x : prev.x,
              y: meta.y != null ? meta.y : prev.y,
              seatRow: meta.seatRow != null ? meta.seatRow : prev.seatRow,
              pose: meta.pose || prev.pose || 'stand',
              dir: meta.dir || 'front',
              remote: true
            }));
            seen.add(id);
          });
        });
        Array.from(st.peers.keys()).forEach(id => {
          if (!seen.has(id) && st.peers.get(id).remote) st.peers.delete(id);
        });
        st.connected = true;
        emit('peers', RT.peersList());
      });

      ch.on('broadcast', { event: 'pos' }, ({ payload }) => {
        if (!payload || payload.id === st.selfId) return;
        const prev = st.peers.get(payload.id) || { id: payload.id, present: true };
        const merged = Object.assign(prev, payload, { remote: true, at: Date.now() });
        merged.seatRow = payload.seated ? payload.seatRow : null;
        st.peers.set(payload.id, merged);
        emit('pos', merged);
      });

      ch.on('broadcast', { event: 'act' }, ({ payload }) => {
        if (!payload || payload.id === st.selfId) return;
        const p = st.peers.get(payload.id);
        if (p) { p.bubble = payload.bubble; p.anim = payload.anim; }
        emit('act', payload);
      });

      ch.on('broadcast', { event: 'race' }, ({ payload }) => emit('race', payload));
      ch.on('broadcast', { event: 'notice' }, ({ payload }) => emit('notice', payload));
      ch.on('broadcast', { event: 'roster' }, ({ payload }) => emit('roster', payload));
      ch.on('broadcast', { event: 'screen' }, ({ payload }) => emit('screen', payload));

      /* 서버가 보내는 system 오류(예: presence 속도 제한)를 기록만 합니다 */
      ch.on('system', (msg) => {
        if (st.channel !== ch) return;
        if (msg && msg.status === 'error') st.lastErr = String(msg.message || 'system');
      });

      ch.subscribe(async (status) => {
        if (st.channel !== ch) return;          /* 이미 교체된 옛 채널의 콜백은 무시 */
        if (status === 'SUBSCRIBED') {
          st.connected = true;
          st.retryCount = 0;
          st.lastErr = '';
          await trackSelf();
          if (st.hbTimer) clearInterval(st.hbTimer);
          /* 접속만 하고 가만히 있어도 8초마다 위치 정보를 새로 알려 줍니다 */
          st.hbTimer = setInterval(() => {
            if (st.connected && st.channel === ch) trackSelf();
          }, 8000);
          emit('status', { mode: 'supabase', connected: true });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          st.connected = false;
          st.lastErr = status;
          if (st.hbTimer) { clearInterval(st.hbTimer); st.hbTimer = null; }
          emit('status', { mode: 'supabase', connected: false, error: status });
          scheduleReconnect();
        }
      });
      return true;
    } catch (e) {
      st.lastErr = String(e && e.message || e);
      st.client = null; st.channel = null;
      return false;
    }
  }

  /* 연결이 끊기면 조용히 다시 붙습니다 (최대 5회, 점점 간격을 늘림) */
  function scheduleReconnect() {
    if (st.retryTimer || st.retryCount >= 5) return;
    st.retryTimer = setTimeout(() => {
      st.retryTimer = null;
      st.retryCount++;
      const S = CC.settings;
      if (!S.supabaseUrl || !S.supabaseKey || !st.me) return;
      const old = st.channel;
      st.channel = null;
      try { if (old && st.client) st.client.removeChannel(old); } catch (e) {}
      try { if (st.client && st.client.realtime) st.client.realtime.disconnect(); } catch (e) {}
      let ok = false;
      try { ok = connectSupabase(S.supabaseUrl, S.supabaseKey, st.me); } catch (e) { ok = false; }
      if (!ok) scheduleReconnect();
    }, 3000 * Math.min(4, st.retryCount + 1));
  }

  /* presence 전송은 1.2초에 한 번까지만 (Supabase presence 속도 제한 회피) */
  let trackAt = 0, trackTimer = null;
  function trackSelfSoon() {
    const wait = 1200 - (CC.now() - trackAt);
    if (wait <= 0) { trackAt = CC.now(); trackSelf(); return; }
    if (trackTimer) return;
    trackTimer = setTimeout(() => {
      trackTimer = null;
      trackAt = CC.now();
      trackSelf();
    }, wait);
  }

  async function trackSelf() {
    if (!st.channel || !st.me) return;
    trackAt = CC.now();
    const m = st.me;
    try {
      await st.channel.track({
        id: st.selfId, num: m.num, name: m.name, v: m.v,
        teacher: !!m.teacher, x: Math.round(m.x), y: Math.round(m.y),
        seated: !!m.seated, seatRow: m.seatRow, pose: m.pose, dir: m.dir
      });
    } catch (e) { /* 무시 */ }
  }

  /* ══════════════════════════════════════════════════════════
     로컬 데모
     ══════════════════════════════════════════════════════════ */
  const BUBBLE_POOL = [
    '안녕하세요!', '오늘 코딩 재밌다 ✨', '타자 연습 중 ⌨️', '선생님! 질문 있어요 🙋',
    '이거 맞았나?', '다 했어요!', '같이 게임하자 🎮', '와 진짜 빠르다 ⚡',
    '뭐 만들어?', '숙제 다 했어 😆', '줄 좀 서 봐', 'ㅋㅋㅋㅋ', '집중집중 🧐'
  ];

  function startLocal(o) {
    st.mode = 'local';
    st.connected = true;
    st.demo = o.demo !== false;

    /* 가상 친구들 */
    if (st.demo) {
      const absent = o.absent || [];
      const list = o.roster || [];
      list.forEach((stu, i) => {
        if (stu.num === (o.me && o.me.num)) return;
        if (absent.indexOf(stu.num) >= 0) return;
        const seat = CC.seat(stu.num);
        if (!seat) return;
        const id = 'demo_' + stu.num;
        st.peers.set(id, {
          id, num: stu.num, name: stu.name,
          v: { face: i % 6, hair: (i * 2 + 1) % 6, shirt: i % 8, style: (i + 1) % 4 },
          x: seat.x, y: seat.y, seatRow: seat.row, seated: true,
          pose: 'sit', dir: 'front', present: true, demo: true,
          wander: { t: CC.rand(6, 26), go: false }
        });
      });
    }

    /* 같은 브라우저의 다른 탭 */
    try {
      if ('BroadcastChannel' in window) {
        st.bc = new BroadcastChannel('cc_' + (o.classId || 'class'));
        st.bc.onmessage = (ev) => onBus(ev.data);
        post({ type: 'hello', from: st.selfId });
      }
    } catch (e) { st.bc = null; }

    emit('status', { mode: 'local', connected: true });
    emit('peers', RT.peersList());
  }

  function post(msg) {
    if (st.bc) { try { st.bc.postMessage(Object.assign({ from: st.selfId, at: Date.now() }, msg)); } catch (e) {} }
  }

  function onBus(msg) {
    if (!msg || msg.from === st.selfId) return;
    const id = msg.from;
    if (msg.type === 'hello') {
      if (st.me) post({ type: 'here', me: RT.snapshotMe() });
      return;
    }
    if (msg.type === 'here') {
      if (msg.me) upsertTabPeer(id, msg.me);
      return;
    }
    if (msg.type === 'bye') { st.peers.delete(id); emit('peers', RT.peersList()); return; }
    if (msg.type === 'pos') { upsertTabPeer(id, msg.me); return; }
    if (msg.type === 'act') {
      const p = st.peers.get(id);
      if (p) { p.bubble = msg.bubble; p.anim = msg.anim; }
      emit('act', Object.assign({ id }, msg));
      return;
    }
    if (msg.type === 'race') { emit('race', msg.payload); return; }
    if (msg.type === 'notice') { emit('notice', msg.payload); return; }
    if (msg.type === 'roster') { emit('roster', msg.payload); return; }
    if (msg.type === 'screen') { emit('screen', msg.payload); return; }
  }

  function upsertTabPeer(id, me) {
    if (!me) return;
    const prev = st.peers.get(id) || {};
    st.peers.set(id, Object.assign(prev, {
      id, num: me.num, name: me.name, v: me.v, teacher: !!me.teacher,
      x: me.x, y: me.y, seatRow: me.seatRow, seated: !!me.seated,
      pose: me.pose || 'sit', dir: me.dir || 'front', present: true,
      tab: true, at: Date.now()
    }));
    emit('pos', st.peers.get(id));
  }

  RT.snapshotMe = function () {
    const m = st.me;
    if (!m) return null;
    return {
      id: st.selfId, num: m.num, name: m.name, v: m.v, teacher: !!m.teacher,
      x: Math.round(m.x), y: Math.round(m.y), seated: !!m.seated,
      seatRow: m.seatRow, pose: m.pose, dir: m.dir
    };
  };

  /* ── 데모 친구들 움직임 ───────────────────────────────── */
  function isFree(x, y) {
    const b = CC.player.deskAt(x, y);
    return !b;
  }

  RT.tickDemo = function (dt) {
    if (st.mode !== 'local' || !st.demo) return;
    st.peers.forEach(p => {
      if (!p.demo) return;
      if (!p.wander) p.wander = { t: CC.rand(8, 30), go: false };
      p.wander.t -= dt;
      if (p.wander.t <= 0) {
        if (p.seated) {
          /* 가끔 일어나서 통로로 */
          if (Math.random() < 0.5) {
            const y = Math.random() < 0.5 ? CC.rand(410, 444) : CC.rand(872, 930);
            const x = CC.rand(140, 1260);
            if (isFree(x, y)) {
              p.seated = false; p.seatRow = null; p.pose = 'stand';
              p.x = p.x; p.y = p.y;
              p.tx = x; p.ty = y;
            }
          }
        } else {
          const seat = CC.seat(p.num);
          if (seat) { p.tx = seat.x; p.ty = seat.y; p.goingBack = true; }
        }
        p.wander.t = CC.rand(7, 22);
      }
      /* 이동 */
      if (p.tx != null) {
        const dx = p.tx - p.x, dy = p.ty - p.y;
        const d = Math.hypot(dx, dy);
        if (d < 4) {
          if (p.goingBack) {
            const seat = CC.seat(p.num);
            if (seat) { p.x = seat.x; p.y = seat.y; p.seated = true; p.seatRow = seat.row; p.pose = 'sit'; }
            p.goingBack = false;
          }
          p.tx = null; p.ty = null;
        } else {
          const sp = 78 * dt;
          p.x += dx / d * sp; p.y += dy / d * sp;
          p.dir = dy < -4 ? 'back' : 'front';
          p.pose = 'stand';
        }
      }
    });

    /* 가끔 말풍선 */
    st.chatter = (st.chatter || 0) - dt;
    if (st.chatter <= 0) {
      st.chatter = CC.rand(3.5, 8);
      const arr = Array.from(st.peers.values()).filter(p => p.demo);
      if (arr.length) {
        const p = CC.pick(arr);
        const b = CC.pick(BUBBLE_POOL);
        p.bubble = b;
        p.bubbleT = 2.6;
        emit('act', { id: p.id, bubble: b, anim: b.indexOf('🙋') >= 0 ? 'hand' : null });
      }
    }
    /* 말풍선 수명 */
    st.peers.forEach(p => {
      if (p.bubbleT != null) {
        p.bubbleT -= dt;
        if (p.bubbleT <= 0) { p.bubble = null; p.bubbleT = null; }
      }
    });
  };

  /* ══════════════════════════════════════════════════════════
     상태 전송
     ══════════════════════════════════════════════════════════ */
  let lastSend = 0, lastSig = '', lastPos = { x: 0, y: 0 };
  RT.setMe = function (me, force) {
    st.me = me;
    const idSig = [me.num, me.name, me.teacher, me.seated, me.seatRow, me.pose, me.dir,
      me.v.sp, me.v.face, me.v.hair, me.v.shirt, me.v.style].join('|');
    const moved = Math.abs(me.x - lastPos.x) + Math.abs(me.y - lastPos.y) > 1.5;
    const now = CC.now();
    if (!force && idSig === lastSig && !(moved && now - lastSend > 150)) return;
    const sigChanged = idSig !== lastSig;
    lastSig = idSig;
    lastPos = { x: me.x, y: me.y };
    lastSend = now;
    /* 자리·포즈·아바타 같은 "상태"가 바뀔 때만 presence 를 보내고,
       움직임은 pushPos() 의 broadcast 로 전달합니다(속도 제한 회피) */
    if (st.mode === 'supabase') { if (sigChanged || force) trackSelfSoon(); }
    else if (st.bc) post({ type: 'pos', me: RT.snapshotMe() });
  };

  RT.pushPos = function () {
    const now = CC.now();
    if (now - lastSend < 160) return;
    lastSend = now;
    const snap = RT.snapshotMe();
    if (!snap) return;
    if (st.mode === 'supabase') {
      if (st.channel) { try { st.channel.send({ type: 'broadcast', event: 'pos', payload: snap }); } catch (e) {} }
    } else if (st.bc) {
      post({ type: 'pos', me: snap });
    }
  };

  RT.send = function (type, payload, extra) {
    if (st.mode === 'supabase') {
      if (st.channel) {
        try {
          if (type === 'action') st.channel.send({ type: 'broadcast', event: 'act', payload });
          else st.channel.send({ type: 'broadcast', event: type, payload });
        } catch (e) {}
      }
    } else if (st.bc) {
      if (type === 'action') post({ type: 'act', bubble: payload.bubble, anim: payload.anim });
      else post({ type, payload });
    }
    if (extra && extra.local) emit(type === 'action' ? 'act' : type, payload);
  };

  RT.sendAct = function (bubble, anim) {
    RT.send('action', { id: st.selfId, bubble, anim });
  };

  RT.peersList = function () {
    const out = [];
    st.peers.forEach(p => out.push(p));
    return out;
  };

  RT.setDemo = function (onOff) { st.demo = !!onOff; };
  RT.isDemo = () => st.mode === 'local' && st.demo;

  /* 탭이 닫힐 때 */
  window.addEventListener('pagehide', () => { post({ type: 'bye' }); });
})();
