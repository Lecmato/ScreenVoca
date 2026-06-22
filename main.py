"""
Screen Voca — EXE entry point
FastAPI server + auto-open browser
"""
import sys
import os
import threading
import webbrowser
import time
import traceback
from pathlib import Path

# ── Path bootstrap (must happen before any relative imports) ──────────────────
if getattr(sys, "frozen", False):
    APP_DIR = Path(os.environ.get("APPDATA", Path.home())) / "ScreenVoca"
    APP_DIR.mkdir(parents=True, exist_ok=True)
    # Add the _MEIPASS bundle root to sys.path so `backend` package is importable
    sys.path.insert(0, str(Path(sys._MEIPASS)))
    LOG_FILE = APP_DIR / "error.log"
else:
    APP_DIR = Path(__file__).parent
    LOG_FILE = APP_DIR / "error.log"

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import STATIC_DIR, PORT
from backend.database import init_db
from backend.routers import vocab as vocab_router
from backend.routers import sessions as sessions_router

# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(title="Screen Voca", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vocab_router.router)
app.include_router(sessions_router.router)


@app.on_event("startup")
def startup():
    init_db()


# Serve React build — must be last so API routes take priority
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        index = STATIC_DIR / "index.html"
        return FileResponse(str(index))


# ── Launch ────────────────────────────────────────────────────────────────────

def _open_browser():
    time.sleep(1.8)
    webbrowser.open(f"http://localhost:{PORT}")


def main():
    # When frozen (--noconsole), stdout/stderr are None which breaks uvicorn's
    # default log formatter. Redirect to file and disable uvicorn log config.
    if getattr(sys, "frozen", False):
        sys.stdout = open(LOG_FILE, "w", encoding="utf-8", buffering=1)
        sys.stderr = sys.stdout

    try:
        if getattr(sys, "frozen", False):
            t = threading.Thread(target=_open_browser, daemon=True)
            t.start()
        uvicorn.run(app, host="127.0.0.1", port=PORT, log_config=None)
    except Exception:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            traceback.print_exc(file=f)
        raise


if __name__ == "__main__":
    main()
