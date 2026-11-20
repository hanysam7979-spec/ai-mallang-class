/* ══════════════════════════════════════════════════════════════
   ui.js — v3 모달 · 출석 명단 · 아바타(스프라이트) · 교사 설정 · 토스트
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CC = window.CC;
  const UI = (CC.ui = {});

  /* ── 토스트 ───────────────────────────────────────────── */
  let toastTimer = null;
  UI.toast = function (msg, ms) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, ms || 2200);
  };

  /* ── 모달 ─────────────────────────────────────────────── */
  let cur = null;
  UI.modalOpen = () => !!cur;

  UI.openModal = function (opts) {
    const o = opts || {};
    const root = document.getElementById('modal-root');
    UI.closeModal(true);
    root.classList.add('open');
    root.innerHTML = `
      <div class="backdrop">
        <div class="modal modal--${o.size || 'md'}" role="dialog" aria-label="${CC.esc(o.title || '')}">
          <div class="modal-head">
            <div class="m-ico">${o.icon || '★'}</div>
            <div><h2>${CC.esc(o.title || '')}</h2>${o.sub ? `<p>${CC.esc(o.sub)}</p>` : ''}</div>
            <div class="spacer"></div>
            <button class="modal-close" aria-label="닫기">✕</button>
          </div>
          <div class="modal-body">${o.body || ''}</div>
          ${o.foot ? `<div class="modal-foot">${o.foot}</div>` : ''}
        </div>
      </div>`;
    cur = o;
    const backdrop = root.querySelector('.backdrop');
    const closeBtn = root.querySelector('.modal-close');
    closeBtn.onclick = () => { CC.sfx.click(); UI.closeModal(); };
    backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) UI.closeModal(); });
    document.addEventListener('keydown', onKey);
    if (o.onMount) {
      try { o.onMount(root.querySelector('.modal'), () => UI.closeModal()); }
      catch (e) {
        console.warn('modal mount', e);
        (window.__ccErrors = window.__ccErrors || []).push('mount: ' + (e && e.message ? e.message : e) + ' | ' + String(e && e.stack || '').split('\n').slice(0,3).join(' >> '));
        const bar = document.getElementById('errbar');
        if (bar) { bar.hidden = false; bar.textContent = '⚠ mount: ' + (e && e.message ? e.message : e); }
      }
    }
    return root;
  };

  function onKey(e) { if (e.key === 'Escape') UI.closeModal(); }

  UI.closeModal = function (silent) {
    const root = document.getElementById('modal-root');
    if (!root) return;
    const prev = cur;
    cur = null;
    document.removeEventListener('keydown', onKey);
    if (prev && prev.onClose) { try { prev.onClose(); } catch (e) {} }
    root.classList.remove('open');
    root.innerHTML = '';
  };

  /* ── 헤더 / 사이드바 갱신 ─────────────────────────────── */
  UI.renderMe = function () {
    const me = CC.me;
    if (!me) return;
    const nameEl = document.getElementById('me-name');
    const seatEl = document.getElementById('me-seat');
    const meta = document.getElementById('me-meta');
    if (nameEl) nameEl.textContent = me.name;
    const cls = CC.roster.activeClass || '';
    if (seatEl) seatEl.textContent = me.teacher ? '선생님' : (me.num ? me.num + '번' : '체험');
    if (meta) meta.textContent = `${cls} · ${me.teacher ? '선생님' : (me.num ? me.num + '번' : '체험')} · ${me.name}`;
    const cn = document.getElementById('class-name');
    if (cn) cn.textContent = cls;

    const c1 = document.getElementById('mini-avatar');
    if (c1) CC.avatar.paintPreview(c1, me.v, {});
    const actSit = document.querySelector('.act-sit');
    if (actSit) actSit.classList.toggle('is-on', !!me.seated);
  };

  /* 출석 전광판: 출석 N명 / 전체 T명 · 결석 M명 */
  UI.updateCounts = function (present, total) {
    const t = Math.max(0, total | 0);
    const p = CC.clamp(present | 0, 0, t);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('sb-present', p);
    set('sb-total', t);
    set('sb-absent', Math.max(0, t - p));
    const rc = document.getElementById('roster-count');
    if (rc) rc.textContent = p + ' / ' + t;
  };

  UI.updateConn = function () {
    const dot = document.getElementById('conn-dot');
    const mode = document.getElementById('conn-mode');
    const desc = document.getElementById('conn-desc');
    const loginDot = document.getElementById('login-dot');
    const loginStatus = document.getElementById('login-status');
    const live = CC.rt.mode() === 'supabase' && CC.rt.connected();
    const local = CC.rt.mode() === 'local';
    if (dot) dot.className = 'dot ' + (live ? 'live' : (local ? 'on' : ''));
    if (loginDot) loginDot.className = 'dot ' + (live ? 'live' : 'on');
    if (mode) mode.textContent = live ? '실시간 연결' : (local ? '로컬 데모' : '연결 대기');
    const peers = CC.rt.peerCount();
    if (desc) desc.textContent = live
      ? `친구 ${peers}명 접속 · 실시간`
      : `친구 ${peers}명 접속 · 내 자리 ${CC.me && CC.me.num ? CC.me.num + '번' : '-'}`;
    if (loginStatus) loginStatus.textContent = live
      ? '실시간으로 연결되어 있어요'
      : '로컬 데모 모드로 바로 시작할 수 있어요';
  };

  /* ══════════════════════════════════════════════════════════
     출석 명단
     ══════════════════════════════════════════════════════════ */
  UI.rosterModal = function () {
    const list = CC.classList(CC.roster.activeClass);
    const present = CC.app.presentSet();
    const meNum = CC.me ? CC.me.num : 0;
    const on = list.filter(s => present.has(s.num)).length;

    const grid = list.map(s => {
      const isOn = present.has(s.num);
      return `<div class="stu ${isOn ? 'on' : 'off'} ${s.num === meNum ? 'me' : ''}">
        <span class="n">${s.num}</span>
        <span class="nm">${CC.esc(s.name)}</span>
        <span class="st"></span>
      </div>`;
    }).join('');

    const html = `
      <div class="roster-bar">
        <span>출석 <b>${on}명</b></span>
        <span class="rb-absent">결석 <b>${list.length - on}명</b></span>
        <span class="rb-total">전체 <b>${list.length}명</b></span>
        <span class="spacer"></span>
        <span class="rb-class">${CC.esc(CC.roster.activeClass)}</span>
      </div>
      <div class="roster-grid">${grid}</div>
      <div class="legend">
        <span><i class="l-on"></i>출석 (접속 중)</span>
        <span><i class="l-off"></i>결석</span>
        <span><i class="l-me"></i>내 자리</span>
      </div>`;

    UI.openModal({
      icon: '▦', title: '출석 명단', sub: `${CC.roster.activeClass} · ${list.length}명`,
      size: 'md', body: html,
      foot: `<span class="grow" style="font-size:10px;color:#6B5C88">친구가 접속하면 자동으로 출석으로 바뀝니다</span>
             <button class="btn btn-sm btn-gray" onclick="CC.ui.closeModal()">닫기</button>`
    });
  };

  /* ══════════════════════════════════════════════════════════
     아바타 꾸미기 (스프라이트 8종)
     ══════════════════════════════════════════════════════════ */
  UI.avatarModal = function () {
    const draft = CC.avatar.norm(CC.me ? CC.me.v : CC.myAvatar);
    const opts = [1, 2, 3, 4, 5, 6, 7, 8].map(i => `
      <button class="opt ${draft.sp === i ? 'is-on' : ''}" data-v="${i}">
        <img src="${CC.art.url('s' + i + 'f')}" alt="${CC.avatar.CHAR_NAMES[i - 1]}">
        <span>${CC.avatar.CHAR_NAMES[i - 1]}</span>
      </button>`).join('');

    const html = `
      <div class="avatar-wrap">
        <div class="avatar-prev">
          <canvas id="av-canvas"></canvas>
          <span id="av-label">미리보기</span>
        </div>
        <div class="avatar-opts">
          <div class="opt-group"><b>내 캐릭터를 골라요 (8명)</b><div class="opt-row">${opts}</div></div>
          <div class="hint-box">교실에서는 <b>앞모습</b>이 보이고, 걸어 다닐 때도 앞모습이에요.<br>마음에 들면 <b>저장</b>을 눌러요. 친구들에게도 바로 보여요!</div>
        </div>
      </div>`;

    UI.openModal({
      icon: '★', title: '아바타 꾸미기', sub: 'AI 세미 픽셀 캐릭터 8종',
      size: 'md', body: html,
      foot: `<span class="grow"></span>
             <button class="btn btn-sm btn-sky" id="av-random">랜덤</button>
             <button class="btn btn-sm btn-gray" id="av-cancel">취소</button>
             <button class="btn btn-sm btn-coral" id="av-save">저장</button>`,
      onMount(root) {
        const cv = root.querySelector('#av-canvas');
        const draw = () => {
          CC.avatar.paintPreview(cv, draft, { shadow: true });
          root.querySelector('#av-label').textContent = CC.avatar.CHAR_NAMES[draft.sp - 1] + ' (' + draft.sp + '번)';
        };
        root.querySelectorAll('.opt[data-v]').forEach(btn => {
          btn.onclick = () => {
            draft.sp = parseInt(btn.dataset.v, 10);
            CC.sfx.click();
            root.querySelectorAll('.opt[data-v]').forEach(x => x.classList.toggle('is-on', x === btn));
            draw();
          };
        });
        root.querySelector('#av-random').onclick = () => {
          draft.sp = CC.randInt(1, 8);
          CC.sfx.pop();
          root.querySelectorAll('.opt[data-v]').forEach(x => {
            x.classList.toggle('is-on', parseInt(x.dataset.v, 10) === draft.sp);
          });
          draw();
        };
        root.querySelector('#av-cancel').onclick = () => { CC.sfx.click(); UI.closeModal(); };
        root.querySelector('#av-save').onclick = () => {
          CC.sfx.pop();
          CC.saveAvatar(draft);
          if (CC.me) { CC.me.v = Object.assign({}, draft); CC.rt.setMe(CC.me, true); }
          if (CC.app && CC.app.refreshMe) CC.app.refreshMe();
          UI.renderMe();
          UI.closeModal();
          UI.toast('아바타를 저장했어요!');
        };
        setTimeout(draw, 20);
      }
    });
  };

  /* ══════════════════════════════════════════════════════════
     교사 설정
     ══════════════════════════════════════════════════════════ */
  UI.teacherModal = function () {
    if (CC.me && CC.me.teacher) return openTeacher();
    const html = `
      <div class="hint-box" style="margin-bottom:9px">교사 설정은 <b>선생님만</b> 사용할 수 있어요. 비밀번호를 입력해 주세요.</div>
      <label class="field"><span>교사 비밀번호</span>
        <input id="tp-pw" type="password" placeholder="기본 비밀번호 1234" maxlength="20">
      </label>
      <p class="login-err" id="tp-err" hidden>비밀번호가 달라요. 다시 확인해 주세요.</p>`;
    UI.openModal({
      icon: '▤', title: '교사 설정', sub: '선생님 확인이 필요해요', size: 'sm', body: html,
      foot: `<span class="grow"></span><button class="btn btn-sm btn-gray" id="tp-cancel">취소</button><button class="btn btn-sm btn-lav" id="tp-go">확인</button>`,
      onMount(root) {
        const go = () => {
          const v = root.querySelector('#tp-pw').value;
          if (v === CC.settings.teacherPw) {
            CC.sfx.pop();
            UI.closeModal();
            setTimeout(openTeacher, 60);
          } else {
            CC.sfx.err();
            root.querySelector('#tp-err').hidden = false;
          }
        };
        root.querySelector('#tp-go').onclick = go;
        root.querySelector('#tp-pw').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
        root.querySelector('#tp-cancel').onclick = () => UI.closeModal();
        setTimeout(() => root.querySelector('#tp-pw').focus(), 60);
      }
    });
  };

  function openTeacher() {
    const S = CC.settings;
    const list = CC.classList(CC.roster.activeClass);
    const html = `
      <div class="tset-tabs">
        <button class="tset-tab is-on" data-p="roster">▦ 명단 (엑셀 업로드)</button>
        <button class="tset-tab" data-p="pw">▤ 비밀번호</button>
        <button class="tset-tab" data-p="net">◈ 실시간 연결</button>
        <button class="tset-tab" data-p="etc">⚙ 기타</button>
      </div>

      <div class="tset-pane is-on" data-pane="roster">
        <div class="upload-zone" id="up-zone">
          <span class="uz-ico">▦</span>
          <b>엑셀 파일을 끌어다 놓거나 클릭하세요</b>
          <i>.xlsx · .xls · .csv — 첫 줄에 <code>반</code>, <code>번호</code>, <code>이름</code></i>
          <input type="file" id="up-file" accept=".xlsx,.xls,.csv" hidden>
        </div>
        <div class="row-inline" style="margin-top:8px">
          <button class="btn btn-sm btn-sky" id="up-template">명단 양식 내려받기</button>
          <span style="flex:1"></span>
          <span class="badge badge-off" id="up-state">업로드 전</span>
        </div>
        <div id="up-preview" style="margin-top:9px"></div>
        <div class="hint-box" style="margin-top:9px">
          현재 <b>${CC.esc(CC.roster.activeClass)}</b> · <b>${list.length}명</b> 등록됨 — 번호가 곧 <b>지정석</b>이에요.
          명단에 없는 번호는 빈자리로 표시됩니다.
        </div>
      </div>

      <div class="tset-pane" data-pane="pw">
        <div class="form-grid">
          <label class="field full"><span>현재 비밀번호</span><input id="pw-cur" type="password" placeholder="현재 비밀번호"></label>
          <label class="field full"><span>새 비밀번호</span><input id="pw-new" type="password" placeholder="새 비밀번호 (4자 이상)"></label>
        </div>
        <div class="row-inline" style="margin-top:9px">
          <button class="btn btn-sm btn-lav" id="pw-save">비밀번호 바꾸기</button>
          <span style="font-size:10px;color:#6B5C88">기본 비밀번호는 <b>1234</b> 예요.</span>
        </div>
      </div>

      <div class="tset-pane" data-pane="net">
        <div class="form-grid">
          <label class="field full"><span>SUPABASE_URL</span><input id="sb-url" placeholder="https://xxxx.supabase.co" value="${CC.esc(S.supabaseUrl)}"></label>
          <label class="field full"><span>SUPABASE_ANON_KEY</span><input id="sb-key" placeholder="eyJhbGciOi..." value="${CC.esc(S.supabaseKey)}"></label>
        </div>
        <div class="row-inline" style="margin-top:8px">
          <button class="btn btn-sm btn-mint" id="sb-connect">연결하고 저장</button>
          <button class="btn btn-sm btn-gray" id="sb-off">해제 (로컬 데모)</button>
          <span style="flex:1"></span>
          <span class="badge ${CC.rt.mode() === 'supabase' && CC.rt.connected() ? 'badge-ok' : 'badge-off'}" id="sb-state">
            ${CC.rt.mode() === 'supabase' ? (CC.rt.connected() ? '연결됨' : '연결 중/오류') : '로컬 모드'}
          </span>
        </div>
        <div class="hint-box" style="margin-top:9px">
          키를 넣으면 <b>Supabase Realtime</b>으로 위치·행동·출석·타자 대결이 실시간 동기화돼요.<br>
          키가 없어도 <b>로컬 데모 모드</b>로 가상 친구들과 완벽하게 동작해요.
        </div>
      </div>

      <div class="tset-pane" data-pane="etc">
        <div class="form-grid">
          <label class="field full"><span>교실 대형 스크린 공지</span>
            <input id="etc-notice" placeholder="예) 3교시 타자 대결!" value="${CC.esc(S.notice || '')}"></label>
        </div>
        <div class="row-inline" style="margin-top:9px">
          <button class="btn btn-sm btn-mint" id="etc-save">저장</button>
          <button class="btn btn-sm btn-yellow" id="etc-screen">스크린에 공지</button>
          <button class="btn btn-sm btn-sky" id="etc-screen-off">스크린 초기화</button>
          <span style="flex:1"></span>
          <button class="btn btn-sm btn-gray" id="etc-reset">명단 기본값</button>
        </div>
        <div class="hint-box" style="margin-top:9px">
          <b>36석 + 선생님 1명.</b> 명단을 올리면 번호(1~36) 자리에 자동으로 앉아요.
          36명을 넘는 학생은 통로에 서서 입장해요.
        </div>
      </div>`;

    UI.openModal({
      icon: '▤', title: '교사 설정', sub: '명단 업로드 · 비밀번호 · 실시간 연결',
      size: 'md', body: html,
      foot: `<span class="grow" style="font-size:10px;color:#6B5C88">설정은 이 브라우저에 저장됩니다</span>
             <button class="btn btn-sm btn-gray" onclick="CC.ui.closeModal()">닫기</button>`,
      onMount(root) {
        const $ = (s) => root.querySelector(s);

        root.querySelectorAll('.tset-tab').forEach(t => {
          t.onclick = () => {
            CC.sfx.click();
            root.querySelectorAll('.tset-tab').forEach(x => x.classList.toggle('is-on', x === t));
            root.querySelectorAll('.tset-pane').forEach(x => x.classList.toggle('is-on', x.dataset.pane === t.dataset.p));
          };
        });

        /* ── 엑셀 업로드 ── */
        const zone = $('#up-zone'), file = $('#up-file');
        zone.onclick = () => file.click();
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.background = '#FFF6DC'; });
        zone.addEventListener('dragleave', () => { zone.style.background = ''; });
        zone.addEventListener('drop', e => {
          e.preventDefault(); zone.style.background = '';
          if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        });
        file.onchange = () => { if (file.files[0]) handleFile(file.files[0]); };
        $('#up-template').onclick = () => downloadTemplate();

        function handleFile(f) {
          const state = $('#up-state'), prev = $('#up-preview');
          state.textContent = '읽는 중…';
          state.className = 'badge badge-warn';
          const isCsv = /\.csv$/i.test(f.name);
          const reader = new FileReader();
          reader.onload = () => {
            try {
              let rows;
              if (!isCsv && window.XLSX) {
                const wb = XLSX.read(reader.result, { type: 'array' });
                const sh = wb.Sheets[wb.SheetNames[0]];
                rows = XLSX.utils.sheet_to_json(sh, { header: 1, raw: false, defval: '' });
              } else {
                rows = parseCSV(typeof reader.result === 'string' ? reader.result : new TextDecoder('utf-8').decode(reader.result));
              }
              const parsed = buildRoster(rows);
              showPreview(parsed);
              state.textContent = '읽기 완료';
              state.className = 'badge badge-ok';
            } catch (err) {
              console.warn(err);
              state.textContent = '읽기 실패';
              state.className = 'badge badge-warn';
              prev.innerHTML = `<div class="hint-box">파일을 읽지 못했어요. <b>반 / 번호 / 이름</b> 열이 있는지 확인해 주세요. (${CC.esc(String(err.message || err))})</div>`;
            }
          };
          if (isCsv) reader.readAsText(f, 'utf-8');
          else reader.readAsArrayBuffer(f);
        }

        function showPreview(data) {
          const prev = $('#up-preview');
          if (!data.classes || !Object.keys(data.classes).length) {
            prev.innerHTML = `<div class="hint-box">학생 정보를 찾지 못했어요. 첫 줄에 <code>반</code>, <code>번호</code>, <code>이름</code> 을 넣어 주세요.</div>`;
            return;
          }
          const names = Object.keys(data.classes);
          const total = names.reduce((a, c) => a + (data.classes[c].students || []).length, 0);
          prev.innerHTML = `
            <div class="hint-box" style="background:#E6FFEF">
              <b>${names.length}개 반</b> · 총 <b>${total}명</b>을 찾았어요.
            </div>
            ${names.map(cn => `
              <div class="kv"><span>${CC.esc(cn)}</span><b>${(data.classes[cn].students || []).length}명</b></div>
            `).join('')}
            <div class="row-inline" style="margin-top:8px">
              <button class="btn btn-sm btn-mint" id="up-apply">이 명단으로 등록하기</button>
            </div>`;
          prev.querySelector('#up-apply').onclick = () => {
            Object.assign(CC.roster.classes, data.classes);
            const first = Object.keys(data.classes)[0];
            CC.roster.activeClass = first;
            CC.saveRoster();
            CC.rt.send('roster', { classes: data.classes, activeClass: first });
            CC.sfx.cheer();
            UI.toast('명단을 등록했어요! 이제 이름으로 입장할 수 있어요');
            $('#up-state').textContent = '등록 완료';
            $('#up-state').className = 'badge badge-ok';
            if (CC.app.refreshLoginSelect) CC.app.refreshLoginSelect();
            if (CC.app.onRosterChange) CC.app.onRosterChange();
          };
        }

        /* ── 비밀번호 ── */
        $('#pw-save').onclick = () => {
          const c = $('#pw-cur').value, n = $('#pw-new').value;
          if (c !== CC.settings.teacherPw) { CC.sfx.err(); UI.toast('현재 비밀번호가 달라요'); return; }
          if (!n || n.length < 4) { CC.sfx.err(); UI.toast('새 비밀번호는 4자 이상으로 해 주세요'); return; }
          CC.saveSettings({ teacherPw: n });
          CC.sfx.pop();
          UI.toast('비밀번호를 바꿨어요');
          $('#pw-cur').value = ''; $('#pw-new').value = '';
        };

        /* ── Supabase ── */
        $('#sb-connect').onclick = () => {
          const url = $('#sb-url').value.trim(), key = $('#sb-key').value.trim();
          if (!url || !key) { CC.sfx.err(); UI.toast('URL 과 ANON KEY 를 모두 넣어 주세요'); return; }
          CC.saveSettings({ supabaseUrl: url, supabaseKey: key });
          $('#sb-state').textContent = '연결 중…';
          $('#sb-state').className = 'badge badge-warn';
          CC.sfx.click();
          CC.app.reconnect();
          setTimeout(() => UI.updateConn(), 1200);
          UI.toast('실시간으로 다시 연결하고 있어요…');
        };
        $('#sb-off').onclick = () => {
          CC.saveSettings({ supabaseUrl: '', supabaseKey: '' });
          CC.app.reconnect();
          $('#sb-state').textContent = '로컬 모드';
          $('#sb-state').className = 'badge badge-off';
          UI.toast('로컬 데모 모드로 돌아왔어요');
        };

        /* ── 기타 ── */
        $('#etc-save').onclick = () => {
          CC.saveSettings({ notice: $('#etc-notice').value.trim() });
          CC.sfx.pop();
          UI.toast('저장했어요');
        };
        $('#etc-screen').onclick = () => {
          const n = $('#etc-notice').value.trim();
          if (!n) { CC.sfx.err(); UI.toast('공지 내용을 입력해 주세요'); return; }
          CC.saveSettings({ notice: n });
          CC.app.setScreen({ mode: 'notice', notice: n });
          CC.rt.send('screen', { mode: 'notice', notice: n });
          CC.sfx.pop();
          UI.toast('스크린에 공지를 띄웠어요');
        };
        $('#etc-screen-off').onclick = () => {
          CC.app.setScreen({ mode: 'welcome' });
          CC.rt.send('screen', { mode: 'welcome' });
          UI.toast('스크린을 초기화했어요');
        };
        $('#etc-reset').onclick = () => {
          CC.roster = CC.makeDefaultRoster();
          CC.saveRoster();
          if (CC.app.refreshLoginSelect) CC.app.refreshLoginSelect();
          if (CC.app.onRosterChange) CC.app.onRosterChange();
          CC.sfx.pop();
          UI.toast('기본 명단(5개 반 · 각 36명)으로 되돌렸어요');
        };
      }
    });
  }

  /* ── CSV / 엑셀 파싱 ─────────────────────────────────── */
  function parseCSV(text) {
    const rows = [];
    let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') q = false;
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (c === '\r') { /* skip */ }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  function buildRoster(rows) {
    if (!rows || !rows.length) return { classes: {} };
    const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, '').toLowerCase();
    let hIdx = -1, ci = { cls: -1, num: -1, name: -1 };
    for (let i = 0; i < Math.min(rows.length, 6); i++) {
      const r = rows[i].map(norm);
      const nameI = r.findIndex(c => c === '이름' || c === '학생이름' || c === 'name' || c === '학생');
      const numI = r.findIndex(c => c === '번호' || c === '번' || c === 'number' || c === 'no');
      const clsI = r.findIndex(c => c === '반' || c === '반명' || c === '학급' || c === 'class');
      if (nameI >= 0) { hIdx = i; ci = { cls: clsI, num: numI, name: nameI }; break; }
    }
    const classes = {};
    if (hIdx < 0) {
      const cn = CC.roster.activeClass || '우리반';
      classes[cn] = [];
      rows.forEach(r => {
        if (!r || r.length < 2) return;
        const num = parseInt(String(r[0]).replace(/[^\d]/g, ''), 10);
        const name = String(r[1] || '').trim();
        if (num && name) classes[cn].push({ num, name });
      });
      Object.keys(classes).forEach(k => classes[k].sort((a, b) => a.num - b.num));
      return { classes: wrapClasses(classes) };
    }
    const defCls = CC.roster.activeClass || '우리반';
    for (let i = hIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      const name = String(r[ci.name] == null ? '' : r[ci.name]).trim();
      if (!name) continue;
      const numRaw = ci.num >= 0 ? String(r[ci.num] == null ? '' : r[ci.num]) : '';
      let num = parseInt(numRaw.replace(/[^\d]/g, ''), 10);
      const cls = (ci.cls >= 0 && String(r[ci.cls] || '').trim()) || defCls;
      if (!classes[cls]) classes[cls] = [];
      if (!num) num = classes[cls].length + 1;
      if (classes[cls].some(s => s.num === num)) {
        num = classes[cls].reduce((m, s) => Math.max(m, s.num), 0) + 1;
      }
      classes[cls].push({ num, name: name.slice(0, 12) });
    }
    Object.keys(classes).forEach(k => classes[k].sort((a, b) => a.num - b.num));
    return { classes: wrapClasses(classes) };
  }

  function wrapClasses(raw) {
    const out = {};
    Object.keys(raw).forEach(k => {
      if (!raw[k] || !raw[k].length) return;
      out[k] = { teacher: CC.settings.teacherName || '선생님', students: raw[k] };
    });
    return out;
  }

  function downloadTemplate() {
    const lines = ['반,번호,이름'];
    CC.classList(CC.roster.activeClass).forEach(s => {
      lines.push(`${CC.roster.activeClass},${s.num},${s.name}`);
    });
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = '컴퓨터교실_명단양식.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
    CC.sfx.click();
  }

  /* ══════════════════════════════════════════════════════════
     도움말
     ══════════════════════════════════════════════════════════ */
  UI.helpModal = function () {
    const html = `
      <div class="hint-box" style="margin-bottom:8px"><b>이동</b> 마우스로 바닥 클릭 · <code>WASD</code>/방향키 · 내 책상을 클릭하면 앉아요.</div>
      <div class="hint-box" style="margin-bottom:8px"><b>입장</b> 반을 고르고 이름을 입력하면 명단의 <b>번호 자리</b>로 안내해요. 명단에 없으면 체험으로 입장할 수 있어요.</div>
      <div class="hint-box" style="margin-bottom:8px"><b>출석 전광판</b> 그 반의 실제 수강인원 기준 <b>출석 N명 / 전체 T명 · 결석 M명</b>으로 표시돼요.</div>
      <div class="hint-box"><b>미니게임</b> ⌨ 타자연습(1~8단계) · ▤ 블록 코딩 미로 · 🌍 지구 타이핑 · 🖱️ 마우스 게임 5종 · ⚡ 타자 대결</div>`;
    UI.openModal({
      icon: '?', title: '도움말', sub: 'AI 말랑 컴퓨터 교실 v3', size: 'sm', body: html,
      foot: `<span class="grow"></span><button class="btn btn-sm btn-gray" onclick="CC.ui.closeModal()">닫기</button>`
    });
  };
})();
