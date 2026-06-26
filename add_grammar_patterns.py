"""
단일 오류 미러링으로 만든 신규 문제 22개를 DB에 추가합니다.
"""
import sqlite3
from pathlib import Path
import os

DB_PATH = Path(os.environ.get("APPDATA", Path.home())) / "ScreenVoca" / "voca.db"

NEW_QUESTIONS = [
    # GV_NEGATIVE — doesn't/don't 뒤 동사원형 오류
    ("GV_NEGATIVE","He doesn't likes cold weather.","He doesn't like cold weather.",
     "likes","like","doesn't 뒤에는 동사원형을 씁니다. likes가 아니라 like입니다.","A1"),
    ("GV_NEGATIVE","My dog doesn't eats vegetables.","My dog doesn't eat vegetables.",
     "eats","eat","doesn't 뒤에는 동사원형을 씁니다. eats가 아니라 eat입니다.","A1"),
    ("GV_NEGATIVE","They don't eats vegetables.","They don't eat vegetables.",
     "eats","eat","don't 뒤에는 동사원형을 씁니다. eats가 아니라 eat입니다.","A1"),
    ("GV_NEGATIVE","We don't goes to school on Sunday.","We don't go to school on Sunday.",
     "goes","go","don't 뒤에는 동사원형을 씁니다. goes가 아니라 go입니다.","A1"),
    # GV_NEGATIVE — don't/doesn't 선택 오류
    ("GV_NEGATIVE","Tom don't go to bed early.","Tom doesn't go to bed early.",
     "don't","doesn't","주어 Tom은 3인칭 단수이므로 doesn't를 써야 합니다.","A1"),
    ("GV_NEGATIVE","My brother don't have a car.","My brother doesn't have a car.",
     "don't","doesn't","주어 My brother는 3인칭 단수이므로 doesn't를 써야 합니다.","A1"),
    # GV_QUESTION — Does/Do 뒤 동사원형 오류
    ("GV_QUESTION","Does your mom works on weekends?","Does your mom work on weekends?",
     "works","work","Does 뒤에는 동사원형을 씁니다. works가 아니라 work입니다.","A1"),
    ("GV_QUESTION","Does your sister studies Chinese?","Does your sister study Chinese?",
     "studies","study","Does 뒤에는 동사원형을 씁니다. studies가 아니라 study입니다.","A1"),
    ("GV_QUESTION","Do I needs an umbrella?","Do I need an umbrella?",
     "needs","need","Do 뒤에는 동사원형을 씁니다. needs가 아니라 need입니다.","A1"),
    ("GV_QUESTION","Do your friends lives nearby?","Do your friends live nearby?",
     "lives","live","Do 뒤에는 동사원형을 씁니다. lives가 아니라 live입니다.","A1"),
    ("GV_QUESTION","Does she eats pizza?","Does she eat pizza?",
     "eats","eat","Does 뒤에는 동사원형을 씁니다. eats가 아니라 eat입니다.","A1"),
    ("GV_QUESTION","Does he reads books?","Does he read books?",
     "reads","read","Does 뒤에는 동사원형을 씁니다. reads가 아니라 read입니다.","A1"),
    # MODAL_CAN — can 뒤 동사원형 오류
    ("MODAL_CAN","I can speaks two languages.","I can speak two languages.",
     "speaks","speak","조동사 can 뒤에는 동사원형을 씁니다. speaks가 아니라 speak입니다.","A1"),
    ("MODAL_CAN","Can they plays basketball?","Can they play basketball?",
     "plays","play","조동사 can 뒤에는 동사원형 play를 써야 합니다.","A1"),
    ("MODAL_CAN","Can she writes letters?","Can she write letters?",
     "writes","write","조동사 can 뒤에는 동사원형 write를 써야 합니다.","A1"),
    # MODAL_CAN — cans 오류
    ("MODAL_CAN","Cans she read English?","Can she read English?",
     "Cans","Can","조동사 can은 주어에 관계없이 항상 can으로 씁니다.","A1"),
    # MODAL_WILL — will 뒤 동사원형 오류
    ("MODAL_WILL","Will she watches movies tonight?","Will she watch movies tonight?",
     "watches","watch","조동사 will 뒤에는 동사원형 watch를 써야 합니다.","A1"),
    ("MODAL_WILL","She won't comes to school tomorrow.","She won't come to school tomorrow.",
     "comes","come","won't 뒤에도 동사원형 come을 써야 합니다.","A1"),
    # MODAL_WILL — wills 오류
    ("MODAL_WILL","Wills they visit us next week?","Will they visit us next week?",
     "Wills","Will","조동사 will은 주어에 관계없이 항상 will입니다.","A1"),
    # AA_COMP — 비교급 + as (→ than)
    ("AA_COMP","He is smarter as Tom.","He is smarter than Tom.",
     "as","than","비교급 문장에서는 as가 아니라 than을 씁니다.","A1"),
    ("AA_COMP","This book is cheaper as that one.","This book is cheaper than that one.",
     "as","than","비교급 문장에서는 as가 아니라 than을 씁니다.","A1"),
    ("AA_COMP","He is older as his father.","He is older than his father.",
     "as","than","비교급 문장에서는 as가 아니라 than을 씁니다.","A1"),
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
            print(f"SKIP (exists): {err[:60]}")
            continue
        cur.execute(
            """INSERT INTO grammar_questions
               (category_code, error_sentence, correct_sentence, error_word, correct_word,
                explanation_ko, mcq_options, difficulty, is_custom)
               VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 0)""",
            (code, err, cor, ew, cw, expl, diff),
        )
        print(f"ADD [{code}]: {err[:60]}")
        added += 1

    conn.commit()
    conn.close()
    print(f"\nDone: {added} questions added.")

if __name__ == "__main__":
    run()
