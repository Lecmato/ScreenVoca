"""
다중 수정을 요구하는 문법 문제를 단일 오류 문제로 교체하는 마이그레이션.
기존 DB의 grammar_questions 테이블을 직접 수정합니다.
"""
import sqlite3
from pathlib import Path
import os

DB_PATH = Path(os.environ.get("APPDATA", Path.home())) / "ScreenVoca" / "voca.db"

FIXES = [
    # (old_error_sentence, new_error_sentence, new_correct_sentence, new_error_word, new_correct_word, new_explanation)
    (
        "She don't speaks Chinese.",
        "She don't speak Chinese.",
        "She doesn't speak Chinese.",
        "don't", "doesn't",
        "주어 She는 3인칭 단수이므로 doesn't를 써야 합니다.",
    ),
    (
        "Do he likes soccer?",
        "Do he like soccer?",
        "Does he like soccer?",
        "Do", "Does",
        "주어 he는 3인칭 단수이므로 의문문에서 Does를 써야 합니다.",
    ),
    (
        "Do she speaks English well?",
        "Do she speak English well?",
        "Does she speak English well?",
        "Do", "Does",
        "주어 she는 3인칭 단수이므로 의문문에서 Does를 써야 합니다.",
    ),
    (
        "Does they watches movies together?",
        "Does they watch movies together?",
        "Do they watch movies together?",
        "Does", "Do",
        "주어 they는 복수이므로 Do를 써야 합니다.",
    ),
    (
        "She is more kind as her sister.",
        "She is more kind than her sister.",
        "She is kinder than her sister.",
        "more kind", "kinder",
        "1음절 형용사 kind의 비교급은 kinder입니다. more를 쓰지 않습니다.",
    ),
    (
        "There are too many informations.",
        "There is too many information.",
        "There is too much information.",
        "many", "much",
        "information은 셀 수 없는 명사이므로 many 대신 much를 써야 합니다.",
    ),
    (
        "He gave me many advices.",
        "He gave me many advice.",
        "He gave me much advice.",
        "many", "much",
        "advice는 셀 수 없는 명사이므로 many 대신 much를 써야 합니다.",
    ),
]

def run():
    if not DB_PATH.exists():
        print(f"DB 없음: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    updated = 0

    for (old_err_sent, new_err_sent, new_cor_sent, new_ew, new_cw, new_expl) in FIXES:
        cur.execute(
            """UPDATE grammar_questions
               SET error_sentence = ?,
                   correct_sentence = ?,
                   error_word = ?,
                   correct_word = ?,
                   explanation_ko = ?
               WHERE error_sentence = ?""",
            (new_err_sent, new_cor_sent, new_ew, new_cw, new_expl, old_err_sent),
        )
        rows = cur.rowcount
        status = "OK" if rows else "NOT FOUND"
        print(f"{status}  [{rows}] {old_err_sent[:50]}")
        updated += rows

    conn.commit()
    conn.close()
    print(f"\n완료: 총 {updated}개 문제 수정됨 (DB: {DB_PATH})")

if __name__ == "__main__":
    run()
