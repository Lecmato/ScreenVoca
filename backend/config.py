import sys
import os
from pathlib import Path

if getattr(sys, "frozen", False):
    APP_DIR = Path(os.environ.get("APPDATA", Path.home())) / "ScreenVoca"
    APP_DIR.mkdir(parents=True, exist_ok=True)
    STATIC_DIR = Path(sys._MEIPASS) / "web"
else:
    APP_DIR = Path(__file__).parent.parent
    STATIC_DIR = Path(__file__).parent.parent / "frontend" / "dist"

DB_PATH = APP_DIR / "voca.db"
LOG_PATH = APP_DIR / "error.log"
PORT = 8765
