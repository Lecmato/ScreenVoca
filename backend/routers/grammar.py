import random
from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import GrammarCategory, GrammarQuestion, Teacher, GrammarClass, QuizHistory

router = APIRouter(prefix="/api/grammar", tags=["grammar"])

# ── MCQ distractor pool by category group ───────────────────────────────────

_BE_FORMS = ["am", "is", "are", "isn't", "aren't", "am not", "was", "were"]
_DO_FORMS = ["do", "does", "don't", "doesn't", "did", "didn't"]
_MODAL_FORMS = ["can", "can't", "will", "won't", "may", "must", "should", "could"]


def _generate_mcq(q: GrammarQuestion) -> list[str]:
    code = q.category_code
    correct = q.correct_word
    wrong = q.error_word

    if code in ("BE_AGREEMENT", "BE_NEGATIVE", "BE_QUESTION", "INT_WH_BE", "TENSE_GOING"):
        pool = _BE_FORMS
    elif code in ("GV_THIRD", "GV_NEGATIVE", "GV_QUESTION", "INT_WH_DO", "INT_WH_ADJ"):
        pool = _DO_FORMS
    elif code in ("MODAL_CAN", "MODAL_WILL", "MODAL_OTHER"):
        pool = _MODAL_FORMS
    else:
        pool = []

    distractors = [w for w in pool if w != correct and w != wrong]
    random.shuffle(distractors)
    options = [correct] + [wrong] + distractors[:2]
    random.shuffle(options)
    # ensure no duplicates
    seen = []
    for o in options:
        if o not in seen:
            seen.append(o)
    # pad if needed
    while len(seen) < 4:
        seen.append("—")
    return seen[:4]


# ── Schemas ──────────────────────────────────────────────────────────────────

class QuestionOut(BaseModel):
    id: int
    category_code: str
    error_sentence: str
    correct_sentence: str
    error_word: str
    correct_word: str
    explanation_ko: str
    mcq_options: Optional[list] = None
    difficulty: str
    is_custom: bool


class TeacherCreate(BaseModel):
    name: str


class ClassCreate(BaseModel):
    teacher_id: int
    name: str


class HistorySave(BaseModel):
    class_id: int
    quiz_date: str          # YYYY-MM-DD
    question_ids: List[int]
    category_codes: List[str]
    options_snapshot: Optional[dict] = None


class QuizGenerate(BaseModel):
    category_codes: List[str]
    count: int = 5
    class_id: Optional[int] = None   # if provided, excludes already-used questions
    mcq: bool = False


class QuestionCreate(BaseModel):
    category_code: str
    error_sentence: str
    correct_sentence: str
    error_word: str
    correct_word: str
    explanation_ko: str
    difficulty: str = "A1"


# ── Categories ───────────────────────────────────────────────────────────────

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(GrammarCategory).order_by(
        GrammarCategory.depth, GrammarCategory.sort_order
    ).all()
    return [
        {
            "id": c.id, "code": c.code, "name_ko": c.name_ko,
            "parent_id": c.parent_id, "depth": c.depth, "sort_order": c.sort_order,
        }
        for c in cats
    ]


# ── Quiz generation ──────────────────────────────────────────────────────────

@router.post("/generate")
def generate_quiz(body: QuizGenerate, db: Session = Depends(get_db)):
    used_ids: set[int] = set()
    if body.class_id:
        records = db.query(QuizHistory).filter(
            QuizHistory.class_id == body.class_id
        ).all()
        for r in records:
            used_ids.update(r.question_ids or [])

    qs = db.query(GrammarQuestion).filter(
        GrammarQuestion.category_code.in_(body.category_codes),
        ~GrammarQuestion.id.in_(used_ids) if used_ids else True,
    ).all()

    if len(qs) < body.count:
        # fallback: reset history pool and pick from all
        qs = db.query(GrammarQuestion).filter(
            GrammarQuestion.category_code.in_(body.category_codes)
        ).all()

    selected = random.sample(qs, min(body.count, len(qs)))

    result = []
    for q in selected:
        opts = _generate_mcq(q) if body.mcq else None
        result.append({
            "id": q.id,
            "category_code": q.category_code,
            "error_sentence": q.error_sentence,
            "correct_sentence": q.correct_sentence,
            "error_word": q.error_word,
            "correct_word": q.correct_word,
            "explanation_ko": q.explanation_ko,
            "mcq_options": opts,
            "difficulty": q.difficulty,
            "is_custom": q.is_custom,
        })
    return result


# ── History ──────────────────────────────────────────────────────────────────

@router.post("/history")
def save_history(body: HistorySave, db: Session = Depends(get_db)):
    try:
        quiz_date = date.fromisoformat(body.quiz_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="날짜 형식이 잘못됐습니다 (YYYY-MM-DD)")

    record = QuizHistory(
        class_id=body.class_id,
        quiz_date=quiz_date,
        question_ids=body.question_ids,
        category_codes=body.category_codes,
        options_snapshot=body.options_snapshot,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"id": record.id}


@router.get("/history/{class_id}")
def get_history(class_id: int, db: Session = Depends(get_db)):
    records = db.query(QuizHistory).filter(
        QuizHistory.class_id == class_id
    ).order_by(QuizHistory.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "class_id": r.class_id,
            "quiz_date": r.quiz_date.isoformat(),
            "question_ids": r.question_ids,
            "category_codes": r.category_codes,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]


@router.delete("/history/{record_id}")
def delete_history(record_id: int, db: Session = Depends(get_db)):
    r = db.query(QuizHistory).filter(QuizHistory.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="이력을 찾을 수 없습니다")
    db.delete(r)
    db.commit()
    return {"ok": True}


# ── Teachers ─────────────────────────────────────────────────────────────────

@router.get("/teachers")
def list_teachers(db: Session = Depends(get_db)):
    return [{"id": t.id, "name": t.name} for t in db.query(Teacher).order_by(Teacher.name).all()]


@router.post("/teachers")
def create_teacher(body: TeacherCreate, db: Session = Depends(get_db)):
    existing = db.query(Teacher).filter(Teacher.name == body.name).first()
    if existing:
        return {"id": existing.id, "name": existing.name}
    t = Teacher(name=body.name)
    db.add(t)
    db.commit()
    db.refresh(t)
    return {"id": t.id, "name": t.name}


# ── Classes ──────────────────────────────────────────────────────────────────

@router.get("/classes")
def list_classes(teacher_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(GrammarClass)
    if teacher_id:
        q = q.filter(GrammarClass.teacher_id == teacher_id)
    return [{"id": c.id, "teacher_id": c.teacher_id, "name": c.name} for c in q.order_by(GrammarClass.name).all()]


@router.post("/classes")
def create_class(body: ClassCreate, db: Session = Depends(get_db)):
    existing = db.query(GrammarClass).filter(
        GrammarClass.teacher_id == body.teacher_id,
        GrammarClass.name == body.name,
    ).first()
    if existing:
        return {"id": existing.id, "teacher_id": existing.teacher_id, "name": existing.name}
    c = GrammarClass(teacher_id=body.teacher_id, name=body.name)
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"id": c.id, "teacher_id": c.teacher_id, "name": c.name}


# ── Custom questions ─────────────────────────────────────────────────────────

@router.get("/questions")
def list_questions(category_code: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(GrammarQuestion)
    if category_code:
        q = q.filter(GrammarQuestion.category_code == category_code)
    return [
        {
            "id": item.id, "category_code": item.category_code,
            "error_sentence": item.error_sentence, "correct_sentence": item.correct_sentence,
            "error_word": item.error_word, "correct_word": item.correct_word,
            "explanation_ko": item.explanation_ko, "difficulty": item.difficulty,
            "is_custom": item.is_custom,
        }
        for item in q.order_by(GrammarQuestion.id).all()
    ]


@router.post("/questions")
def create_question(body: QuestionCreate, db: Session = Depends(get_db)):
    q = GrammarQuestion(**body.model_dump(), mcq_options=None, is_custom=True)
    db.add(q)
    db.commit()
    db.refresh(q)
    return {"id": q.id}


@router.delete("/questions/{qid}")
def delete_question(qid: int, db: Session = Depends(get_db)):
    q = db.query(GrammarQuestion).filter(GrammarQuestion.id == qid).first()
    if not q:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다")
    if not q.is_custom:
        raise HTTPException(status_code=403, detail="내장 문제는 삭제할 수 없습니다")
    db.delete(q)
    db.commit()
    return {"ok": True}
