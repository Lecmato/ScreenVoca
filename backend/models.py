from sqlalchemy import Column, Integer, String, JSON, DateTime
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
    display_mode = Column(String, nullable=False)  # meaning | spelling | alternating
    font_settings = Column(JSON, nullable=False)   # {family, size, color}
    shuffle = Column(Integer, default=0)
    timer_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.now)
