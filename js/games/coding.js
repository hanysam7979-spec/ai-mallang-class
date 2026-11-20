/* ══════════════════════════════════════════════════════════════
   games/coding.js — 초등용 블록 코딩 「미로 탈출」
   · 격자 미로 + 별/보석 + 깃발(목표)
   · 스크래치/엔트리풍 블록 팔레트 (앞으로 · 좌/우 회전 · 반복)
   · ▶ 실행하면 캐릭터가 한 칸씩 움직이며 미로를 탈출
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CC = window.CC;
  CC.games = CC.games || {};

  /*STAGES-BEGIN*/
  const STAGES = [
    { "name": "곧장 가기", "tip": "⬆️ 앞으로 가기 블록을 네 번 놓고 ▶ 실행!", "sol": "FFFF",
      "grid": ["#####", "#####", "S...G", "#####", "#####"] },
    { "name": "모퉁이 돌기", "tip": "길이 꺾이면 ↩️ 왼쪽 / ↪️ 오른쪽으로 돌아요.", "sol": "FFFLFRF",
      "grid": ["#####", "##..G", "S...#", "#####", "#####"] },
    { "name": "별을 먹으며", "tip": "별(⭐)을 지나가면 자동으로 주워요. 별을 모두 모아 보세요!", "sol": "FFLFRFF",
      "grid": ["#####", "##*.G", "S*..#", "#####", "#####"] },
    { "name": "반복 블록", "tip": "🔁 2번 반복 안에 ⬆️ 앞으로 를 넣으면 두 칸씩 움직여요.", "sol": "FFFFFF",
      "grid": ["#######", "#######", "S.....G", "#######", "#######"] },
    { "name": "지그재그", "tip": "별 두 개를 모으고 깃발까지! 길을 먼저 손으로 짚어 보세요.", "sol": "FFRFFLFFLFFRFLF",
      "grid": ["#######", "###..G#", "S*.#*.#", "##.#..#", "##....#", "#######", "#######"] },
    { "name": "긴 복도", "tip": "긴 길은 🔁 3번 반복 블록으로 짧게 만들어요.", "sol": "FFFFFRFFF",
      "grid": ["#######", "#######", "S.....#", "#####.#", "#####.#", "#####G#", "#######", "#######"] },
    { "name": "복도의 별", "tip": "돌고 또 돌아 별을 줍고 깃발로! 회전 방향을 잘 세어 보세요.", "sol": "FFFFRFFRFFFFLFFLFFFF",
      "grid": ["#######", "#S....#", "#####.#", "#*....#", "#.#####", "#....G#", "#######"] },
    { "name": "나선 미로", "tip": "바깥쪽을 한 바퀴 돌고 안쪽으로 들어가요. 반복 블록이 큰 힘이 돼요!", "sol": "FFFFRFFFFRRFFFFLFFFFLFFFFLFFLFF",
      "grid": ["#######", "#S....#", "#.###.#", "#.#G#.#", "#.#.#.#", "#...#*#", "#######"] },
    { "name": "보석 두 개", "tip": "보석(💎)은 별보다 반짝여요. 두 개를 모두 주우면 완벽!", "sol": "FFFFFRFFRFFFRRFFFRFF",
      "grid": ["########", "#S..o..#", "#.####.#", "#.#o...#", "#.#.##.#", "#....#G#", "########"] },
    { "name": "마지막 탈출", "tip": "지금까지 배운 블록을 모두 써 보세요. 마지막 미로예요!", "sol": "RFFFFFLFFLFFFRRFFFRFF",
      "grid": ["########", "#S.....#", "#.###..#", "#.#o#..#", "#.#.#..#", "#...##.#", "#G.....#", "########"] }
  ];
  /*STAGES-END*/

  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];   /* E S W N */
  const DIR_NAME = ['오른쪽', '아래', '왼쪽', '위'];
  const DIR_DEG = [0, 90, 180, 270];

  let view = null;   /* { root, stage, char, program, armed, running, timer, stars, totalStars } */

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* ══════════════════════════════════════════════════════════
     미로 그리기
     ══════════════════════════════════════════════════════════ */
  function parseStage(stage) {
    const grid = stage.grid.map(r => r.split(''));
    const n = grid.length, m = grid[0].length;
    let start = { x: 0, y: 0 }, goal = { x: 0, y: 0 };
    const stars = [];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < m; x++) {
        const c = grid[y][x];
        if (c === 'S') start = { x, y };
        else if (c === 'G') goal = { x, y };
        else if (c === '*' || c === 'o') stars.push(x + ',' + y);
      }
    }
    return {
      n, m, cells: grid, start, goal, stars,
      isWall(x, y) {
        if (y < 0 || y >= n || x < 0 || x >= m) return true;
        return this.cells[y][x] === '#';
      }
    };
  }

  /* 내 세미 픽셀 아바타 스프라이트 (앞모습) + 방향 표시 */
  function charHTML(dir) {
    const v = CC.avatar.norm(CC.me ? CC.me.v : CC.myAvatar);
    const url = CC.art.url(CC.art.stuFront(v.sp));
    const flip = (dir || 0) === 2 ? 'transform:scaleX(-1);' : '';
    const arrow = ['→', '↓', '←', '↑'][dir || 0];
    return `<img src="${url}" alt="내 캐릭터" style="${flip}"><span class="mz-dir">${arrow}</span>`;
  }

  function renderMaze(root) {
    const v = view;
    const st = v.stageData;
    const gridEl = root.querySelector('#mz-grid');
    gridEl.style.gridTemplateColumns = `repeat(${st.m}, 1fr)`;
    let html = '';
    for (let y = 0; y < st.n; y++) {
      for (let x = 0; x < st.m; x++) {
        const c = st.cells[y][x];
        const cls = ['cell'];
        if (c === '#') cls.push('wall');
        else {
          if (x === st.goal.x && y === st.goal.y) cls.push('goal');
          if (!v.collected.has(x + ',' + y)) {
            if (c === 'o') cls.push('gem');
            else if (c === '*') cls.push('star');
          }
          if (x === st.start.x && y === st.start.y) cls.push('start');
        }
        html += `<div class="${cls.filter(Boolean).join(' ')}" data-x="${x}" data-y="${y}"></div>`;
      }
    }
    gridEl.innerHTML = html;

    /* 캐릭터 */
    let ch = root.querySelector('#mz-char');
    if (!ch) {
      ch = document.createElement('div');
      ch.id = 'mz-char';
      ch.className = 'mz-char';
      gridEl.appendChild(ch);
    }
    ch.innerHTML = `<div class="body">${charHTML(v.char.d)}</div>`;
    moveChar(root);
  }

  function moveChar(root) {
    const v = view, st = v.stageData;
    const ch = root.querySelector('#mz-char');
    if (!ch) return;
    ch.style.width = (100 / st.m) + '%';
    ch.style.height = (100 / st.n) + '%';
    ch.style.left = ((v.char.x + 0.5) * 100 / st.m) + '%';
    ch.style.top = ((v.char.y + 0.5) * 100 / st.n) + '%';
    ch.style.transform = 'translate(-50%,-50%)';
    const body = ch.querySelector('.body');
    if (body) body.innerHTML = charHTML(v.char.d);
  }

  /* ══════════════════════════════════════════════════════════
     프로그램(블록 목록)
     ══════════════════════════════════════════════════════════ */
  const BLOCKS = {
    f: { ico: '⬆️', label: '앞으로 가기' },
    l: { ico: '↩️', label: '왼쪽으로 돌기' },
    r: { ico: '↪️', label: '오른쪽으로 돌기' },
    rep2: { ico: '🔁', label: '2번 반복', n: 2 },
    rep3: { ico: '🔁', label: '3번 반복', n: 3 },
    rep4: { ico: '🔁', label: '4번 반복', n: 4 }
  };

  function nodeAt(list, path) {
    let node = null, arr = list;
    for (let i = 0; i < path.length; i++) {
      node = arr[path[i]];
      if (!node) return null;
      arr = node.kids || [];
    }
    return node;
  }

  function addBlock(type, root) {
    if (!view || view.running) return;
    if (type.startsWith('rep')) {
      const node = { t: 'rep', n: BLOCKS[type].n, kids: [] };
      view.program.push(node);
      view.armed = null;
      CC.sfx.click();
      renderProgram(root);
      return;
    }
    const node = { t: type };
    if (view.armed) {
      const target = nodeAt(view.program, view.armed);
      if (target && target.kids) target.kids.push(node);
    } else {
      view.program.push(node);
    }
    CC.sfx.pop();
    renderProgram(root);
  }

  function cmdHTML(node, path) {
    const key = path.join('.');
    const arrowBtns = `
      <button class="cbtn" data-act="up" data-p="${key}" title="위로">▲</button>
      <button class="cbtn" data-act="down" data-p="${key}" title="아래로">▼</button>
      <button class="cbtn del" data-act="del" data-p="${key}" title="지우기">✕</button>`;
    if (node.t === 'rep') {
      const kids = node.kids.length
        ? node.kids.map((k, i) => cmdHTML(k, path.concat(i))).join('')
        : `<div class="mz-empty" style="padding:8px">여기에 넣을 블록을 누르세요</div>`;
      return `<div class="cmd rep ${view.armed && view.armed.join('.') === key ? 'armed' : ''}" data-rep="${key}">
        <div class="rep-head">
          <span class="cb-ico">🔁</span>
          <span class="cb-t">${node.n}번 반복</span>
          <button class="cbtn" data-act="up" data-p="${key}">▲</button>
          <button class="cbtn" data-act="down" data-p="${key}">▼</button>
          <button class="cbtn del" data-act="del" data-p="${key}">✕</button>
        </div>
        <div class="kids">${kids}</div>
      </div>`;
    }
    const b = BLOCKS[node.t];
    return `<div class="cmd">
      <span class="cb-ico">${b.ico}</span>
      <span class="cb-t">${b.label}</span>
      ${arrowBtns}
    </div>`;
  }

  function renderProgram(root) {
    const list = root.querySelector('#mz-code');
    if (!list || !view) return;
    if (!view.program.length) {
      list.innerHTML = `<div class="mz-empty">왼쪽 블록을 눌러 코드를 만들어 보세요!<br>반복 블록을 누른 뒤 다른 블록을 누르면 그 안에 담겨요.</div>`;
      return;
    }
    list.innerHTML = view.program.map((n, i) => cmdHTML(n, [i])).join('');
  }

  function countBlocks(list) {
    let n = 0;
    list.forEach(x => { n++; if (x.kids) n += countBlocks(x.kids); });
    return n;
  }

  function flatten(list, out, depth) {
    if (depth > 4) return out;
    list.forEach(n => {
      if (n.t === 'rep') {
        for (let i = 0; i < n.n && out.length < 240; i++) flatten(n.kids, out, depth + 1);
      } else if (out.length < 240) out.push(n);
    });
    return out;
  }

  /* ══════════════════════════════════════════════════════════
     실행
     ══════════════════════════════════════════════════════════ */
  async function run(root) {
    if (!view || view.running) return;
    const v = view, st = v.stageData;
    const cmds = flatten(v.program, [], 0);
    if (!cmds.length) { tip(root, '먼저 블록을 놓아 주세요! 어디로 갈지 정해야 해요 🙂'); CC.sfx.err(); return; }

    v.running = true;
    setRunningUI(root, true);
    v.char = { x: st.start.x, y: st.start.y, d: 0 };
    moveChar(root);
    await sleep(260);

    let ok = true, crashed = false;
    for (let i = 0; i < cmds.length; i++) {
      if (!v.running) { ok = false; break; }
      const c = cmds[i];
      if (c.t === 'f') {
        const [dx, dy] = DIRS[v.char.d];
        const nx = v.char.x + dx, ny = v.char.y + dy;
        if (st.isWall(nx, ny)) {
          CC.sfx.err();
          const ch = root.querySelector('#mz-char');
          if (ch) { ch.classList.add('bump'); setTimeout(() => ch.classList.remove('bump'), 320); }
          tip(root, '쿵! 벽이에요. 블록 순서를 다시 생각해 보세요 🧱');
          crashed = true;
          await sleep(520);
          break;
        }
        v.char.x = nx; v.char.y = ny;
        moveChar(root);
        CC.sfx.type();
        const key = nx + ',' + ny;
        if (st.stars.includes(key) && !v.collected.has(key)) {
          v.collected.add(key);
          CC.sfx.pop();
          const cell = root.querySelector(`.cell[data-x="${nx}"][data-y="${ny}"]`);
          if (cell) cell.classList.remove('star', 'gem');
          tip(root, `⭐ 별을 주웠어요! (${v.collected.size}/${st.stars.length})`);
          updateHud(root);
        }
        await sleep(210);
        if (nx === st.goal.x && ny === st.goal.y) break;
      } else {
        v.char.d = c.t === 'l' ? (v.char.d + 3) % 4 : (v.char.d + 1) % 4;
        moveChar(root);
        CC.sfx.tick();
        await sleep(190);
      }
      v.current = i;
      highlight(root, i);
    }

    v.running = false;
    setRunningUI(root, false);
    highlight(root, -1);

    const atGoal = v.char.x === st.goal.x && v.char.y === st.goal.y;
    if (atGoal) {
      const gotAll = st.stars.length > 0 && v.collected.size === st.stars.length;
      CC.sfx.cheer();
      const ch = root.querySelector('#mz-char');
      if (ch) { ch.classList.add('cheer'); setTimeout(() => ch.classList.remove('cheer'), 2600); }
      burst(root);
      const stageNo = v.stage + 1;
      if (stageNo > (CC.best.maze || 1)) CC.saveBest({ maze: stageNo });
      win(root, gotAll, stageNo);
    } else if (!crashed) {
      tip(root, ok ? '아직 깃발에 닿지 않았어요. 블록을 더 붙여 볼까요? 🚩' : '멈췄어요.');
    }
  }

  function highlight(root, idx) {
    const rows = root.querySelectorAll('#mz-code .cmd');
    rows.forEach(r => r.classList.remove('running'));
  }

  function burst(root) {
    const frame = root.querySelector('.maze-frame');
    if (!frame) return;
    for (let i = 0; i < 16; i++) {
      const s = document.createElement('div');
      s.textContent = CC.pick(['⭐', '✨', '🎉', '💫']);
      s.style.cssText = `position:absolute;left:${CC.rand(6, 94)}%;top:${CC.rand(10, 80)}%;font-size:${CC.rand(14, 26)}px;pointer-events:none;z-index:6;transition:transform 1s ease-out, opacity 1s;`;
      frame.appendChild(s);
      requestAnimationFrame(() => {
        s.style.transform = `translate(${CC.rand(-40, 40)}px, ${CC.rand(-60, -10)}px) rotate(${CC.rand(-60, 60)}deg)`;
        s.style.opacity = '0';
      });
      setTimeout(() => s.remove(), 1200);
    }
  }

  function setRunningUI(root, on) {
    const run = root.querySelector('#mz-run');
    const stop = root.querySelector('#mz-stop');
    if (run) { run.disabled = on; run.textContent = on ? '⏳ 실행 중…' : '▶ 실행하기'; }
    if (stop) stop.disabled = !on;
    root.querySelectorAll('.blk').forEach(b => { b.disabled = on; });
  }

  function tip(root, msg) {
    const el = root.querySelector('#mz-tip');
    if (el) el.innerHTML = msg;
  }

  function updateHud(root) {
    const el = root.querySelector('#mz-hud');
    if (!el || !view) return;
    el.textContent = `스테이지 ${view.stage + 1} / ${STAGES.length} · ⭐ ${view.collected.size} / ${view.stageData.stars.length}`;
  }

  function win(root, perfect, stageNo) {
    const v = view;
    const noStars = !(v.stageData.stars.length);
    tip(root, perfect
      ? '<b>완벽해요!</b> 별까지 모두 모았어요 🏆'
      : (noStars ? '<b>탈출 성공!</b> 깃발에 도착했어요 🚩' : '<b>탈출 성공!</b> 별을 다 모으면 더 좋아요 ⭐'));
    const box = root.querySelector('#mz-code');
    const isLast = stageNo >= STAGES.length;
    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.marginTop = '10px';
    card.innerHTML = `
      <h3>${perfect ? '🏆 완벽 클리어!' : '🎉 클리어!'}</h3>
      <p>${stageNo} / ${STAGES.length} 스테이지 · 사용한 블록 ${countBlocks(v.program)}개</p>
      <div style="margin-top:11px;display:flex;gap:7px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-sm btn-yellow" id="mz-again">다시 하기</button>
        ${isLast ? '' : `<button class="btn btn-sm btn-mint" id="mz-next">다음 스테이지 →</button>`}
      </div>
      ${isLast ? '<p style="margin-top:8px">10개 스테이지를 모두 끝냈어요! 정말 대단해요 🌟</p>' : ''}`;
    const old = box.querySelector('.result-card');
    if (old) old.remove();
    box.appendChild(card);
    box.scrollTop = box.scrollHeight;
    const again = card.querySelector('#mz-again');
    if (again) again.onclick = () => { CC.sfx.click(); startStage(root, stageNo - 1); };
    const next = card.querySelector('#mz-next');
    if (next) next.onclick = () => { CC.sfx.click(); startStage(root, stageNo); };
  }

  /* ══════════════════════════════════════════════════════════
     스테이지 시작
     ══════════════════════════════════════════════════════════ */
  function startStage(root, idx) {
    if (!view) return;
    idx = CC.clamp(idx, 0, STAGES.length - 1);
    view.stage = idx;
    view.stageData = parseStage(STAGES[idx]);
    view.char = { x: view.stageData.start.x, y: view.stageData.start.y, d: 0 };
    view.program = [];
    view.armed = null;
    view.collected = new Set();
    view.running = false;
    renderMaze(root);
    renderProgram(root);
    updateHud(root);
    tip(root, `<b>${STAGES[idx].name}</b> — ${STAGES[idx].tip}`);
    root.querySelectorAll('.mz-stage').forEach((b, i) => {
      b.classList.toggle('is-on', i === idx);
      b.classList.toggle('done', i < (((CC.best.maze || 1) - 1)));
    });
    const run = root.querySelector('#mz-run');
    if (run) { run.disabled = false; run.textContent = '▶ 실행하기'; }
    const stop = root.querySelector('#mz-stop');
    if (stop) stop.disabled = true;
    root.querySelectorAll('.blk').forEach(b => { b.disabled = false; });
  }

  /* ══════════════════════════════════════════════════════════
     모달
     ══════════════════════════════════════════════════════════ */
  CC.games.coding = {
    open() {
      const html = `
        <div class="mz-head">
          <span class="badge badge-ok" id="mz-hud">스테이지 1 / 10</span>
          <span style="flex:1"></span>
          <span class="badge badge-warn">최고 <b>${(CC.best.maze || 1)}</b> 스테이지</span>
        </div>
        <div class="mz-head">
          <span style="font-size:11px;font-weight:900;color:#8A9A78">단계 설정</span>
          <div class="mz-stages" id="mz-stages">
            ${STAGES.map((s, i) => `<button class="mz-stage" data-i="${i}">${i + 1}</button>`).join('')}
          </div>
        </div>

        <div class="mz-body">
          <div class="mz-left">
            <div class="maze-frame">
              <div class="maze" id="mz-grid"></div>
            </div>
            <div class="mz-controls">
              <button class="btn btn-sm btn-coral" id="mz-run">▶ 실행하기</button>
              <button class="btn btn-sm btn-gray" id="mz-stop" disabled>⏹ 멈추기</button>
              <button class="btn btn-sm btn-sky" id="mz-clear">↺ 코드 지우기</button>
              <button class="btn btn-sm btn-yellow" id="mz-reset">🧹 처음부터</button>
            </div>
            <div class="mz-tip" id="mz-tip"></div>
          </div>

          <div class="mz-right">
            <div class="mz-palette" id="mz-pal">
              <button class="blk blk-f" data-b="f"><span class="b-ico">⬆️</span>앞으로 가기</button>
              <button class="blk blk-l" data-b="l"><span class="b-ico">↩️</span>왼쪽으로 돌기</button>
              <button class="blk blk-r" data-b="r"><span class="b-ico">↪️</span>오른쪽으로 돌기</button>
              <button class="blk blk-rep" data-b="rep2"><span class="b-ico">🔁</span>2번 반복</button>
              <button class="blk blk-rep" data-b="rep3"><span class="b-ico">🔁</span>3번 반복</button>
              <button class="blk blk-rep" data-b="rep4"><span class="b-ico">🔁</span>4번 반복</button>
            </div>
            <div class="mz-code" id="mz-code"></div>
            <div class="mz-tip" style="font-size:10.5px">
              🔁 반복 블록을 누르면 <b>주황 테두리</b>가 켜져요. 그다음 블록을 누르면 반복 안에 담겨요!
            </div>
          </div>
        </div>`;

      CC.ui.openModal({
        icon: '▤', title: '블록 코딩 미로 탈출', sub: '블록을 쌓아 내 캐릭터를 깃발까지! (10 스테이지)',
        size: 'lg', body: html,
        onMount(root) {
          view = {
            root, stage: 0, stageData: null, char: { x: 0, y: 0, d: 0 },
            program: [], armed: null, running: false, collected: new Set()
          };

          root.querySelector('#mz-pal').addEventListener('click', (e) => {
            const b = e.target.closest('[data-b]');
            if (!b || !view) return;
            addBlock(b.dataset.b, root);
          });

          root.querySelector('#mz-code').addEventListener('click', (e) => {
            if (!view || view.running) return;
            const rep = e.target.closest('[data-rep]');
            const btn = e.target.closest('[data-act]');
            if (btn) {
              const path = btn.dataset.p.split('.').map(Number);
              const act = btn.dataset.act;
              const parentPath = path.slice(0, -1);
              const siblings = parentPath.length ? (nodeAt(view.program, parentPath) || {}).kids : view.program;
              if (!siblings) return;
              const i = path[path.length - 1];
              if (act === 'del') { siblings.splice(i, 1); CC.sfx.click(); }
              else if (act === 'up' && i > 0) { const t = siblings[i - 1]; siblings[i - 1] = siblings[i]; siblings[i] = t; CC.sfx.tick(); }
              else if (act === 'down' && i < siblings.length - 1) { const t = siblings[i + 1]; siblings[i + 1] = siblings[i]; siblings[i] = t; CC.sfx.tick(); }
              view.armed = null;
              renderProgram(root);
              return;
            }
            if (rep) {
              const key = rep.dataset.rep;
              if (view.armed && view.armed.join('.') === key) view.armed = null;
              else view.armed = key.split('.').map(Number);
              CC.sfx.pop();
              renderProgram(root);
            }
          });

          root.querySelector('#mz-stages').addEventListener('click', (e) => {
            const b = e.target.closest('.mz-stage');
            if (!b || !view) return;
            CC.sfx.click();
            startStage(root, parseInt(b.dataset.i, 10));
          });

          root.querySelector('#mz-run').onclick = () => run(root);
          root.querySelector('#mz-stop').onclick = () => {
            if (view) view.running = false;
            tip(root, '실행을 멈췄어요. 블록을 고쳐서 다시 실행해 보세요.');
          };
          root.querySelector('#mz-clear').onclick = () => {
            if (!view) return;
            CC.sfx.click();
            view.program = []; view.armed = null;
            renderProgram(root);
          };
          root.querySelector('#mz-reset').onclick = () => {
            if (!view) return;
            CC.sfx.click();
            startStage(root, view.stage);
          };

          startStage(root, Math.max(0, Math.min((CC.best.maze || 1) - 1, STAGES.length - 1)));

        },
        onClose() { view = null; }
      });
    }
  };

  /* 테스트/검증용 내보내기 */
  CC.games.coding.__stages = STAGES;
})();
