"""
pattern_tag 도입 (2026-08-09):
- grammar_questions에 pattern_tag 컬럼 추가 (마이그레이션은 backend/database.py에서 처리됨)
- 이번 세션에서 새로 만지거나 추가한 16개 카테고리의 문제에 pattern_tag를 채워서
  퀴즈 생성 시 같은 오류 유형이 한 회차에 중복 출제되지 않도록 함
- AA_SUPER에 "최상급 앞 the 누락" 예문 3개 추가 (다른 유형이 늘어나며 희석된 비중 보강)

backend/grammar_seed.py의 QUESTIONS를 error_sentence 기준으로 실제 DB(%APPDATA%\\ScreenVoca\\voca.db)와
매칭해서, 이미 있는 행은 pattern_tag만 UPDATE하고 없는 행(새 the-누락 예문)은 INSERT한다.
"""
import sqlite3
import os
from pathlib import Path

from backend.grammar_seed import QUESTIONS

DB_PATH = Path(os.environ.get("APPDATA", Path.home())) / "ScreenVoca" / "voca.db"


def run():
    if not DB_PATH.exists():
        print(f"DB not found: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    updated = 0
    inserted = 0
    for q in QUESTIONS:
        if not q["pattern_tag"]:
            continue
        row = cur.execute(
            "SELECT id, pattern_tag FROM grammar_questions WHERE error_sentence = ?",
            (q["error_sentence"],),
        ).fetchone()
        if row:
            qid, existing_tag = row
            if existing_tag != q["pattern_tag"]:
                cur.execute(
                    "UPDATE grammar_questions SET pattern_tag = ? WHERE id = ?",
                    (q["pattern_tag"], qid),
                )
                updated += 1
        else:
            cur.execute(
                """INSERT INTO grammar_questions
                   (category_code, error_sentence, correct_sentence, error_word, correct_word,
                    explanation_ko, mcq_options, difficulty, pattern_tag, is_custom)
                   VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, 0)""",
                (q["category_code"], q["error_sentence"], q["correct_sentence"],
                 q["error_word"], q["correct_word"], q["explanation_ko"], q["difficulty"],
                 q["pattern_tag"]),
            )
            print(f"INSERT [{q['category_code']}]: {q['error_sentence'][:60]}")
            inserted += 1

    conn.commit()
    conn.close()
    print(f"\nDone: {updated} pattern_tag updated, {inserted} new questions inserted.")


if __name__ == "__main__":
    run()
