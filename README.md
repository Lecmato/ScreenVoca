# Screen Voca

초등학교 교실 대형 화면용 영어 단어 플래시카드 프로그램.  
Excel 파일을 업로드하면 단어 시험 및 인쇄까지 지원하는 단일 EXE 실행 파일.

---

## 기능

- **단어 불러오기**: `.xlsx` 파일 파싱 (열 구성: `단원 | 번호 | 영어 | 한글`)
- **세션 설정**: 기간 라벨 선택 → 파일 업로드 → 단원 선택 → 단어 선택 → 표시 방식 + 폰트
- **플래시카드 표시**: 대형 단어 화면, Space/클릭으로 정답 공개, 이전/다음 버튼
  - **Meaning**: 영어 표시 → 한글 뜻 맞추기
  - **Spelling**: 한글 표시 → 영어 철자 쓰기
  - **Mixed**: 두 방식 혼합
- **글자 크기**: `<` `>` 버튼으로 즉시 조절, 마지막 크기 자동 저장 (localStorage)
- **TTS**: 웹 브라우저 내장 음성 합성 (Chrome/Edge)
- **셔플**: 무작위 순서 토글
- **타이머**: 3/5/7/10초 자동 넘김
- **시험지 인쇄**: Meaning / Spelling / Mixed 3가지 모드, 2단 레이아웃 A4

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | FastAPI + SQLite (SQLAlchemy) + openpyxl |
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| 상태관리 | Zustand + TanStack Query |
| EXE 빌드 | PyInstaller `--onefile --noconsole` |
| Python | 3.14 |

---

## 프로젝트 구조

```
Screen Voca/
├── main.py                    # 진입점 — FastAPI + 브라우저 자동 오픈
├── requirements.txt
├── build.ps1                  # EXE 빌드 스크립트 (Desktop에 출력)
├── make_icon.py               # 아이콘 생성 (Pillow)
├── icon.ico                   # 빌드에 사용되는 아이콘
├── FLICKPOP_INTEGRATION.md    # FlickPop 통합 가이드
├── backend/
│   ├── config.py              # APP_DIR, DB_PATH, STATIC_DIR, PORT
│   ├── database.py            # SQLAlchemy 엔진 / 세션
│   ├── models.py              # Session 모델
│   ├── parser.py              # Excel 파싱
│   └── routers/
│       ├── vocab.py           # /api/vocab — 파싱, 섹션, 단어
│       └── sessions.py        # /api/sessions — 저장, 목록, 삭제
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── types/index.ts
│       ├── api/client.ts
│       ├── store/sessionStore.ts
│       ├── pages/
│       │   ├── Home.tsx       # 저장된 세션 목록 + 새 세션 시작
│       │   ├── Setup.tsx      # 설정 마법사 (4단계)
│       │   └── FlashCard.tsx  # 플래시카드 + 컨트롤 바
│       └── components/
│           └── PrintView.tsx  # 시험지 미리보기 + 인쇄
└── order/                     # 임시 교환 폴더 (.gitignore)
```

---

## 빌드

### 요구사항

- Python 3.14
- Node.js 18+
- PowerShell 7+

### 의존성 설치

```powershell
pip install -r requirements.txt
cd frontend && npm install
```

### EXE 빌드 (바탕화면에 출력)

```powershell
.\build.ps1
```

빌드 완료 후 `%USERPROFILE%\Desktop\ScreenVoca.exe` 생성됨 (~42MB).

---

## 개발 서버 실행

```powershell
# 백엔드
python main.py

# 프론트엔드 (별도 터미널)
cd frontend && npm run dev
```

백엔드: `http://127.0.0.1:8765`  
프론트엔드 dev: `http://localhost:5173`

---

## 데이터 저장 위치

EXE 실행 시 각 컴퓨터별 독립 저장:

```
%APPDATA%\ScreenVoca\voca.db
```

---

## Excel 파일 형식

| A열 | B열 | C열 | D열 |
|-----|-----|-----|-----|
| 단원명 | 번호 | 영어 | 한글 |
| Unit 1 | 1 | apple | 사과 |

파일명에서 교재명 자동 추출 (예: `능률 영어 1.xlsx` → 교재명: `능률 영어 1`).

---

## FlickPop 통합

`FLICKPOP_INTEGRATION.md` 참조. 동일 FastAPI+React 스택이므로 라우터 복사 + DB 마이그레이션만 필요.
