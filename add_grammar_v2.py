"""
문법 다양성 개선 (2026-08-09):
- 기존 편중 카테고리 재조정: AA_SUPER/AA_COMP/NA_ARTICLE/MODAL_OTHER/TENSE_FUTURE (+32)
- 신규 카테고리 11개 추가: BE_THERE, NA_SOME_ANY, PRON_OBJ, PRON_POSS,
  PP_FORM, PP_ADV, IG_TO, IG_GERUND, PASS_FORM, PASS_BY, REL_CHOICE (+88)

backend/grammar_seed.py의 CATEGORIES/QUESTIONS에서 새로 추가된 항목만 뽑아
이미 시딩되어 있는 실제 DB(%APPDATA%\\ScreenVoca\\voca.db)에 반영한다.
"""
import sqlite3
import os
from pathlib import Path

from backend.grammar_seed import CATEGORIES, QUESTIONS

DB_PATH = Path(os.environ.get("APPDATA", Path.home())) / "ScreenVoca" / "voca.db"

NEW_CATEGORY_CODES = [
    "BE_THERE", "NA_SOME_ANY",
    "PRONOUN", "PRESENT_PERFECT", "INFINITIVE_GERUND", "PASSIVE", "RELATIVE",
    "PRON_OBJ", "PRON_POSS", "PP_FORM", "PP_ADV",
    "IG_TO", "IG_GERUND", "PASS_FORM", "PASS_BY", "REL_CHOICE",
]


def run():
    if not DB_PATH.exists():
        print(f"DB not found: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # ── 1. 카테고리 추가 (parent 먼저, child 나중) ──────────────────────────
    code_to_id: dict[str, int] = {}
    for code, cid in cur.execute("SELECT code, id FROM grammar_categories").fetchall():
        code_to_id[code] = cid

    new_cats = [c for c in CATEGORIES if c["code"] in NEW_CATEGORY_CODES]
    added_cats = 0
    for cat in sorted(new_cats, key=lambda c: c["depth"]):
        if cat["code"] in code_to_id:
            print(f"SKIP category (exists): {cat['code']}")
            continue
        parent_id = code_to_id.get(cat["parent"]) if cat["parent"] else None
        cur.execute(
            "INSERT INTO grammar_categories (code, name_ko, parent_id, depth, sort_order) VALUES (?, ?, ?, ?, ?)",
            (cat["code"], cat["name_ko"], parent_id, cat["depth"], cat["sort"]),
        )
        code_to_id[cat["code"]] = cur.lastrowid
        print(f"ADD category: {cat['code']} ({cat['name_ko']})")
        added_cats += 1

    # ── 2. 문제 추가 (error_sentence 중복이면 skip) ─────────────────────────
    added_q = 0
    for q in QUESTIONS:
        cur.execute("SELECT id FROM grammar_questions WHERE error_sentence = ?", (q["error_sentence"],))
        if cur.fetchone():
            continue
        cur.execute(
            """INSERT INTO grammar_questions
               (category_code, error_sentence, correct_sentence, error_word, correct_word,
                explanation_ko, mcq_options, difficulty, is_custom)
               VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 0)""",
            (q["category_code"], q["error_sentence"], q["correct_sentence"],
             q["error_word"], q["correct_word"], q["explanation_ko"], q["difficulty"]),
        )
        print(f"ADD question [{q['category_code']}]: {q['error_sentence'][:60]}")
        added_q += 1

    conn.commit()
    conn.close()
    print(f"\nDone: {added_cats} categories, {added_q} questions added.")


if __name__ == "__main__":
    run()
