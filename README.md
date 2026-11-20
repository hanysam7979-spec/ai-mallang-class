# AI 말랑 컴퓨터 교실 (MALLANG CLASS) v3 pixel

픽셀 감성의 교실형 웹앱입니다. 학생이 반과 이름을 입력하면 **번호 자리**로 안내되고, 교실에서 아바타로 이동하며 미니게임 5종을 즐길 수 있습니다. 서버 없이도 **로컬 데모 모드**로 완전히 동작하고, Supabase 키를 넣으면 **실시간 동기화 모드**로 바뀝니다.

## 폴더 구조

```
ai-mallang-class/
├── index.html            화면 골격 (헤더 · 교실 캔버스 · 사이드바 · 입장 화면)
├── css/style.css         픽셀 UI 스타일 전체
├── js/
│   ├── config.js         ★ 세계 좌표 · 좌석 배치 · 기본 명단 · 저장소 · 기본 설정
│   ├── sprites.js        assets/ PNG 로더 + 그리기 도우미
│   ├── sfx.js            효과음 (WebAudio 합성)
│   ├── avatar.js         아바타(8명 캐릭터) 미리보기/선택
│   ├── scene.js          교실 배경 · 칠판 · 책상/의자 렌더링
│   ├── player.js         내 캐릭터 이동 · 행동 · 좌석
│   ├── realtime.js       로컬 데모 / Supabase Presence·Broadcast 동기화
│   ├── geo.js            지구 타이핑용 세계 지도·나라·도시 데이터
│   ├── ui.js             모달(교사 설정·출석 명단·아바타·도움말) · 토스트
│   ├── app.js            앱 시작 · 입장 처리 · 화면 전환
│   └── games/
│       ├── typing.js     타자연습 1~8단계 (손가락 가이드)
│       ├── coding.js     블록 코딩 미로 탈출 (10 스테이지)
│       ├── earth.js      지구 타이핑 (세계 한 바퀴)
│       ├── mouse.js      마우스 게임 5종
│       └── race.js       실시간 타자 대결
└── assets/               bg_classroom.png · desk.png · chair.png · teacher_front.png
                          stu01~08_front.png · stu01~08_back.png
```

## 로컬에서 실행

```bash
cd ai-mallang-class
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

`index.html`을 파일로 바로 열면( file:// ) 브라우저 보안 정책 때문에 에셋 일부가 막힐 수 있으니, 위처럼 **로컬 서버**로 열어 주세요.

## 바꿔 넣는 곳 3가지

### 1) Supabase URL / Key — 실시간 접속

- **코드 기본값**: `js/config.js` 의 `CC.defaultSettings()` 안

  ```js
  supabaseUrl: '',   /* ← SUPABASE_URL  (예: https://xxxx.supabase.co) */
  supabaseKey: '',   /* ← SUPABASE_ANON_KEY */
  ```

- **앱 안에서**: 교사로 입장 → [교사 설정] → **실시간 연결** 탭 → `SUPABASE_URL`, `SUPABASE_ANON_KEY` 입력 → **연결하고 저장** (이 브라우저에 저장됨)
- **주소로 넘기기**: `http://내주소/?sbUrl=https://xxxx.supabase.co&sbKey=eyJhbGci...`
  → 값을 읽어 저장한 뒤 주소창에서는 자동으로 지웁니다.
- 비워 두면 **로컬 데모 모드**(가상 친구들과 동작)로 바로 시작합니다.

### 2) 선생님 이름 · 비밀번호

- `js/config.js` 의 `teacherName`(기본 `김하늘`), `teacherPw`(기본 `1234`)
- 앱 안에서 바꾸려면 [교사 설정] → **비밀번호** 탭

### 3) 학생 명단 (반 · 번호 · 이름)

- 기본 데모 명단: `js/config.js` 의 `CC.DEMO_NAMES`(36명) · `CC.makeDefaultRoster()`
- 실제 학급은 [교사 설정] → **명단(엑셀 업로드)** 에서 `.xlsx` / `.xls` / `.csv` 업로드
  (첫 줄: `반, 번호, 이름` — 모달의 **명단 양식 내려받기**로 서식 확인)
- 업로드한 명단·설정은 각 브라우저의 `localStorage`(`cc.roster.v3`, `cc.settings.v3`)에 저장됩니다.

## 배포

정적 파일만 있으므로 `ai-mallang-class/` 폴더를 그대로 올리면 됩니다 (Netlify / Vercel / GitHub Pages / 교내 웹서버).
외부 CDN 3개(Google Fonts, Galmuri 폰트, Supabase JS, SheetJS)를 쓰므로 인터넷이 되는 환경에서 사용하세요.

## 확인된 사항

- 로컬 서버 기준 HTML/CSS/JS 16개 + 이미지 20개, **총 36개 리소스 모두 200 응답** (404 없음)
- 전 JS 15개 파일 문법 검사 통과, 헤드리스 Chromium 실행 시 **콘솔 에러 0 · 실패 요청 0**
- 학생 입장 → 교실 → 미니게임 5종 → 교사 설정/출석 명단/아바타 모달, 모바일 화면(412×915)까지 동작 확인
