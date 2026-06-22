import tempfile
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, Query

from ..parser import parse_excel

router = APIRouter(prefix="/api/vocab", tags=["vocab"])

# In-memory cache for the currently loaded file (single-user desktop app)
_cache: dict = {}


@router.post("/parse")
async def parse_file(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="xlsx 파일만 지원합니다")

    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        data = parse_excel(tmp_path, original_filename=file.filename)
        _cache.clear()
        _cache.update(data)
        return data
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"파일 파싱 실패: {e}")
    finally:
        tmp_path.unlink(missing_ok=True)


@router.get("/sections")
def get_sections():
    return _cache.get("sections", [])


@router.get("/words")
def get_words(sections: str = Query(default="")):
    words = _cache.get("words", [])
    if sections:
        selected = set(s.strip() for s in sections.split(",") if s.strip())
        words = [w for w in words if w["section"] in selected]
    return words
