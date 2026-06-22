# Screen Voca → FlickPop 통합 가이드

Screen Voca를 FlickPop에 추가할 때 이 문서만 보면 됩니다.

---

## 1. 백엔드 파일 복사

```
Screen Voca/backend/parser.py        → FlickPop/agents/parsers/voca_parser.py
Screen Voca/backend/models.py        → FlickPop/agents/db/voca_models.py
Screen Voca/backend/routers/vocab.py   → FlickPop/agents/routers/voca_vocab.py
Screen Voca/backend/routers/sessions.py → FlickPop/agents/routers/voca_sessions.py
```

**models.py 수정 사항**: `from .database import Base` → `from agents.db.engine import Base`

**parser.py 수정 사항**: 없음 (독립 모듈)

---

## 2. FlickPop server.py에 라우터 등록

```python
# agents/server.py에 추가 (기존 라우터 import 아래)
from agents.routers import voca_vocab as voca_vocab_router
from agents.routers import voca_sessions as voca_sessions_router

app.include_router(voca_vocab_router.router)
app.include_router(voca_sessions_router.router)
```

라우터 prefix가 `/api/vocab`, `/api/sessions` 이므로 FlickPop의 기존 `/api/books`, `/api/questions` 등과 충돌하지 않습니다. 단, FlickPop에 이미 `/api/sessions` 경로가 있다면 prefix를 `/api/voca/sessions`으로 변경하세요.

---

## 3. DB 마이그레이션 (Alembic)

FlickPop은 Alembic을 사용하므로 마이그레이션 파일을 생성합니다:

```bash
cd FlickPop
alembic revision --autogenerate -m "add screen voca saved_sessions table"
alembic upgrade head
```

voca_models.py의 `SavedSession` 테이블이 자동 감지됩니다.

---

## 4. 프론트엔드 파일 복사

```
Screen Voca/frontend/src/pages/Home.tsx        → FlickPop/web/src/pages/ScreenVoca/Home.tsx
Screen Voca/frontend/src/pages/Setup.tsx       → FlickPop/web/src/pages/ScreenVoca/Setup.tsx
Screen Voca/frontend/src/pages/FlashCard.tsx   → FlickPop/web/src/pages/ScreenVoca/FlashCard.tsx
Screen Voca/frontend/src/components/PrintView.tsx → FlickPop/web/src/components/ScreenVoca/PrintView.tsx
Screen Voca/frontend/src/store/sessionStore.ts → FlickPop/web/src/store/vocaSessionStore.ts
Screen Voca/frontend/src/api/client.ts         → FlickPop/web/src/api/vocaClient.ts
Screen Voca/frontend/src/types/index.ts        → FlickPop/web/src/types/voca.ts
```

**import 경로 일괄 변경**: 각 파일 내 상대경로를 FlickPop 구조에 맞게 수정.

---

## 5. FlickPop 라우터에 Screen Voca 추가

```tsx
// FlickPop/web/src/App.tsx 또는 router 설정 파일
import ScreenVocaHome from './pages/ScreenVoca/Home'
import ScreenVocaSetup from './pages/ScreenVoca/Setup'
import ScreenVocaFlashCard from './pages/ScreenVoca/FlashCard'

// Routes에 추가:
<Route path="/screen-voca" element={<ScreenVocaHome />} />
<Route path="/screen-voca/setup" element={<ScreenVocaSetup />} />
<Route path="/screen-voca/flashcard" element={<ScreenVocaFlashCard />} />
```

FlickPop 사이드바/네비게이션에 "Screen Voca" 메뉴 항목 추가.

---

## 6. 의존성 추가 확인

FlickPop `requirements.txt`에 이미 있는 것들 (추가 불필요):
- `openpyxl` ✅
- `fastapi` ✅
- `sqlalchemy` ✅
- `pydantic` ✅

FlickPop `web/package.json`에 이미 있는 것들 (추가 불필요):
- `react-router-dom` ✅
- `zustand` ✅
- `@tanstack/react-query` ✅
- `axios` ✅
- `lucide-react` ✅
- `tailwindcss` ✅

**추가 필요한 의존성**: 없음.

---

## 7. 주요 아키텍처 차이점

| 항목 | Screen Voca (standalone) | FlickPop 통합 시 |
|------|--------------------------|-----------------|
| DB 위치 | `%APPDATA%/ScreenVoca/voca.db` | FlickPop 기존 DB (MySQL/SQLite) |
| 포트 | 8765 | FlickPop 기존 포트 |
| 인증 | 없음 | FlickPop JWT 인증 적용 필요 |
| 파일 업로드 | 인메모리 캐시 | FlickPop inbox 폴더 연동 가능 |

---

## 8. 테스트 후 발견된 이슈 기록 (빌드/테스트 시 업데이트)

| 날짜 | 이슈 | 해결 방법 | 상태 |
|------|------|-----------|------|
| - | - | - | - |
