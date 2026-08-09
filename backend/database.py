from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import DB_PATH

DATABASE_URL = f"sqlite:///{DB_PATH}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    _migrate_saved_sessions()


def _migrate_saved_sessions():
    """Add columns introduced after the table already existed on users' machines."""
    with engine.connect() as conn:
        cols = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(saved_sessions)").fetchall()}
        if "period_base_offset_weeks" not in cols:
            conn.exec_driver_sql("ALTER TABLE saved_sessions ADD COLUMN period_base_offset_weeks INTEGER")
        conn.commit()
