from sqlalchemy import Column, Integer, String, JSON, DateTime, Boolean, Date, ForeignKey, Text
from datetime import datetime
from .database import Base


class SavedSession(Base):
    __tablename__ = "saved_sessions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    book_name = Column(String, nullable=False)
    period_label = Column(String, nullable=False)
    sections = Column(JSON, nullable=False)
    words = Column(JSON, nullable=False)
    display_mode = Column(String, nullable=False)
    font_settings = Column(JSON, nullable=False)
    shuffle = Column(Integer, default=0)
    timer_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.now)


class GrammarCategory(Base):
    __tablename__ = "grammar_categories"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    name_ko = Column(String, nullable=False)
    parent_id = Column(Integer, ForeignKey("grammar_categories.id"), nullable=True)
    depth = Column(Integer, default=1)
    sort_order = Column(Integer, default=0)


class GrammarQuestion(Base):
    __tablename__ = "grammar_questions"

    id = Column(Integer, primary_key=True, index=True)
    category_code = Column(String, nullable=False, index=True)
    error_sentence = Column(Text, nullable=False)
    correct_sentence = Column(Text, nullable=False)
    error_word = Column(String, nullable=False)
    correct_word = Column(String, nullable=False)
    explanation_ko = Column(Text, nullable=False)
    mcq_options = Column(JSON, nullable=True)   # ["옵션A","옵션B","옵션C","옵션D"], correct_word is the answer
    difficulty = Column(String, default="A1")   # A1 / A2
    is_custom = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)


class Teacher(Base):
    __tablename__ = "grammar_teachers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.now)


class GrammarClass(Base):
    __tablename__ = "grammar_classes"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("grammar_teachers.id"), nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)


class QuizHistory(Base):
    __tablename__ = "grammar_quiz_history"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("grammar_classes.id"), nullable=False)
    quiz_date = Column(Date, nullable=False)
    question_ids = Column(JSON, nullable=False)   # list[int]
    category_codes = Column(JSON, nullable=False)  # list[str]
    options_snapshot = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
