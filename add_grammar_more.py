"""
MODAL_OTHER 미러링 + CONJ_COORD/SUB 보강 + PREP_PLACE/TIME 보강 (27개)
"""
import sqlite3
from pathlib import Path
import os

DB_PATH = Path(os.environ.get("APPDATA", Path.home())) / "ScreenVoca" / "voca.db"

NEW_QUESTIONS = [
    # ── MODAL_OTHER — 조동사 뒤 동사원형 오류 (미러링) ───────────────────────
    ("MODAL_OTHER","She must goes home now.","She must go home now.",
     "goes","go","조동사 must 뒤에는 동사원형 go를 써야 합니다.","A1"),
    ("MODAL_OTHER","He may plays outside after school.","He may play outside after school.",
     "plays","play","조동사 may 뒤에는 동사원형 play를 써야 합니다.","A1"),
    ("MODAL_OTHER","He should goes to bed early.","He should go to bed early.",
     "goes","go","조동사 should 뒤에는 동사원형 go를 써야 합니다.","A1"),
    ("MODAL_OTHER","You must cleans your room every day.","You must clean your room every day.",
     "cleans","clean","조동사 must 뒤에는 동사원형 clean을 써야 합니다.","A1"),
    ("MODAL_OTHER","They should studies harder for the test.","They should study harder for the test.",
     "studies","study","조동사 should 뒤에는 동사원형 study를 써야 합니다.","A1"),
    ("MODAL_OTHER","She may eats lunch soon.","She may eat lunch soon.",
     "eats","eat","조동사 may 뒤에는 동사원형 eat을 써야 합니다.","A1"),
    # ── CONJ_COORD — 등위접속사 ──────────────────────────────────────────────
    ("CONJ_COORD","She ran fast, but she won the race.","She ran fast, so she won the race.",
     "but","so","빠르게 달려서 경주에서 이긴 것은 원인-결과이므로 so를 씁니다.","A1"),
    ("CONJ_COORD","He practiced every day, so he gave up.","He practiced every day, but he gave up.",
     "so","but","매일 연습했지만 포기했다는 것은 대조이므로 but을 씁니다.","A1"),
    ("CONJ_COORD","She didn't study, so she passed the exam.","She didn't study, but she passed the exam.",
     "so","but","공부하지 않았는데도 시험에 합격한 것은 대조이므로 but을 씁니다.","A1"),
    ("CONJ_COORD","The food was very spicy, and I ate it all.","The food was very spicy, but I ate it all.",
     "and","but","음식이 매운데도 다 먹었다는 것은 대조이므로 but을 씁니다.","A1"),
    ("CONJ_COORD","He is very poor, and he is always happy.","He is very poor, but he is always happy.",
     "and","but","가난하지만 행복하다는 것은 대조이므로 but을 씁니다.","A1"),
    ("CONJ_COORD","She was sick, but she had to rest.","She was sick, so she had to rest.",
     "but","so","아파서 쉬어야 했다는 것은 원인-결과이므로 so를 씁니다.","A1"),
    # ── CONJ_SUB — 종속접속사 ───────────────────────────────────────────────
    ("CONJ_SUB","She passed the test although she studied hard.","She passed the test because she studied hard.",
     "although","because","열심히 공부했기 때문에 시험에 합격한 것이므로 because를 씁니다.","A1"),
    ("CONJ_SUB","He was late because he woke up early.","He was late although he woke up early.",
     "because","although","일찍 일어났는데도 늦은 것은 대조이므로 although를 씁니다.","A1"),
    ("CONJ_SUB","I brought an umbrella because it was sunny.","I brought an umbrella although it was sunny.",
     "because","although","맑은 날씨인데도 우산을 가져간 것은 대조이므로 although를 씁니다.","A1"),
    ("CONJ_SUB","She went to the park because it was raining.","She went to the park although it was raining.",
     "because","although","비가 오는데도 공원에 간 것은 대조이므로 although를 씁니다.","A1"),
    ("CONJ_SUB","I will buy the shoes when I save enough money.","I will buy the shoes if I save enough money.",
     "when","if","돈을 모으는 것이 불확실한 조건이므로 when 대신 if를 씁니다.","A2"),
    ("CONJ_SUB","She always calls me if she gets home.","She always calls me when she gets home.",
     "if","when","집에 도착하면 항상 전화한다는 습관적 사실이므로 when을 씁니다.","A2"),
    # ── PREP_PLACE — 장소 전치사 ────────────────────────────────────────────
    ("PREP_PLACE","The picture is at the wall.","The picture is on the wall.",
     "at","on","벽에 걸려 있는 것은 on the wall입니다.","A1"),
    ("PREP_PLACE","She sat at the floor.","She sat on the floor.",
     "at","on","바닥에 앉다는 표현은 on the floor입니다.","A1"),
    ("PREP_PLACE","The dog is sleeping at the sofa.","The dog is sleeping on the sofa.",
     "at","on","소파 위에 있다는 것은 on the sofa입니다.","A1"),
    ("PREP_PLACE","She arrived in the airport.","She arrived at the airport.",
     "in","at","공항, 역 등 특정 장소에 도착할 때는 at을 씁니다.","A1"),
    ("PREP_PLACE","He hid in the table.","He hid under the table.",
     "in","under","테이블 밑에 숨는 것은 under the table입니다.","A1"),
    # ── PREP_TIME — 시간 전치사 ─────────────────────────────────────────────
    ("PREP_TIME","She was born at 2001.","She was born in 2001.",
     "at","in","연도 앞에는 in을 씁니다.","A1"),
    ("PREP_TIME","He comes home at evening.","He comes home in the evening.",
     "at evening","in the evening","저녁에는 in the evening을 씁니다.","A1"),
    ("PREP_TIME","I have piano lessons at Tuesday.","I have piano lessons on Tuesday.",
     "at","on","요일 앞에는 on을 씁니다.","A1"),
    ("PREP_TIME","She goes to bed on night.","She goes to bed at night.",
     "on","at","밤에는 at night을 씁니다.","A1"),
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
