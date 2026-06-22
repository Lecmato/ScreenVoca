from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SavedSession

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class FontSettings(BaseModel):
    family: str = "Arial"
    size: int = 120
    color: str = "#000000"


class Word(BaseModel):
    section: str
    seq: int
    english: str
    korean: str


class SessionCreate(BaseModel):
    book_name: str
    period_label: str
    sections: List[str]
    words: List[Word]
    display_mode: str  # meaning | spelling | alternating
    font_settings: FontSettings
    shuffle: bool = False
    timer_seconds: Optional[int] = None


def _session_to_dict(s: SavedSession) -> dict:
    return {
        "id": s.id,
        "name": s.name,
        "book_name": s.book_name,
        "period_label": s.period_label,
        "sections": s.sections,
        "words": s.words,
        "display_mode": s.display_mode,
        "font_settings": s.font_settings,
        "shuffle": bool(s.shuffle),
        "timer_seconds": s.timer_seconds,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


@router.get("/")
def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(SavedSession).order_by(SavedSession.created_at.desc()).all()
    return [_session_to_dict(s) for s in sessions]


@router.post("/")
def create_session(data: SessionCreate, db: Session = Depends(get_db)):
    if not data.sections:
        raise HTTPException(status_code=400, detail="단원이 선택되지 않았습니다")

    section_range = (
        data.sections[0]
        if len(data.sections) == 1
        else f"{data.sections[0]} ~ {data.sections[-1]}"
    )
    date_str = datetime.now().strftime("%Y년 %m월 %d일")
    name = f"{date_str} {data.book_name} [{section_range}]"

    session = SavedSession(
        name=name,
        book_name=data.book_name,
        period_label=data.period_label,
        sections=data.sections,
        words=[w.model_dump() for w in data.words],
        display_mode=data.display_mode,
        font_settings=data.font_settings.model_dump(),
        shuffle=int(data.shuffle),
        timer_seconds=data.timer_seconds,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _session_to_dict(session)


@router.get("/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(SavedSession).filter(SavedSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다")
    return _session_to_dict(session)


@router.delete("/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(SavedSession).filter(SavedSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다")
    db.delete(session)
    db.commit()
    return {"ok": True}
