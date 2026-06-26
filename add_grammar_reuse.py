"""
다중 오류 수정 시 버려진 패턴을 재활용한 신규 문제 7개를 DB에 추가합니다.
"""
import sqlite3
from pathlib import Path
import os

DB_PATH = Path(os.environ.get("APPDATA", Path.home())) / "ScreenVoca" / "voca.db"

NEW_QUESTIONS = [
    # (category_code, error_sentence, correct_sentence, error_word, correct_word, explanation_ko, difficulty)
    ("GV_NEGATIVE", "She doesn't speaks Chinese.", "She doesn't speak Chinese.",
     "speaks", "speak", "doesn't 뒤에는 동사원형을 씁니다. speaks가 아니라 speak입니다.", "A1"),
    ("GV_QUESTION", "Does he likes soccer?", "Does he like soccer?",
     "likes", "like", "Does 뒤에는 동사원형을 씁니다. likes가 아니라 like입니다.", "A1"),
    ("GV_QUESTION", "Does she speaks English well?", "Does she speak English well?",
     "speaks", "speak", "Does 뒤에는 동사원형을 씁니다. speaks가 아니라 speak입니다.", "A1"),
    ("GV_QUESTION", "Do they watches movies together?", "Do they watch movies together?",
     "watches", "watch", "Do 뒤에는 동사원형을 씁니다. watches가 아니라 watch입니다.", "A1"),
    ("AA_COMP", "She is kinder as her sister.", "She is kinder than her sister.",
     "as", "than", "비교급 문장에서는 as가 아니라 than을 씁니다.", "A1"),
    ("NA_UNCOUNT", "There are too much information.", "There is too much information.",
     "are", "is", "information은 셀 수 없는 명사로 단수 취급하므로 are가 아니라 is를 씁니다.", "A1"),
    ("NA_UNCOUNT", "He gave me much advices.", "He gave me much advice.",
     "advices", "advice", "advice는 셀 수 없는 명사이므로 복수형 advices로 쓸 수 없습니다.", "A1"),
]

def run():
    if not DB_PATH.exists():
        print(f"DB not found: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    added = 0

    for (code, err, cor, ew, cw, expl, diff) in NEW_QUESTIONS:
        cur.execute("SELECT id FROM grammar_questions WHERE error_sentence = ?", (err,))
        if cur.fetchone():
            print(f"SKIP (exists): {err[:55]}")
            continue
        cur.execute(
            """INSERT INTO grammar_questions
               (category_code, error_sentence, correct_sentence, error_word, correct_word,
                explanation_ko, mcq_options, difficulty, is_custom)
               VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 0)""",
            (code, err, cor, ew, cw, expl, diff),
        )
        print(f"ADD: {err[:55]}")
        added += 1

    conn.commit()
    conn.close()
    print(f"\nDone: {added} questions added (DB: {DB_PATH})")

if __name__ == "__main__":
    run()
