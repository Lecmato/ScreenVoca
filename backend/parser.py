import re
from pathlib import Path
import openpyxl


def parse_excel(file_path: Path, original_filename: str | None = None) -> dict:
    wb = openpyxl.load_workbook(file_path)
    ws = wb.active

    book_name = _extract_book_name(original_filename or file_path.name)
    words = []
    seen_sections = {}  # preserve insertion order

    for row in ws.iter_rows(values_only=True):
        if not row or not row[0] or not row[2]:
            continue
        section = str(row[0]).strip()
        seq = int(row[1]) if row[1] is not None else 0
        english = str(row[2]).strip()
        korean = str(row[3]).strip() if row[3] else ""

        words.append({
            "section": section,
            "seq": seq,
            "english": english,
            "korean": korean,
        })
        seen_sections[section] = True

    return {
        "book_name": book_name,
        "sections": list(seen_sections.keys()),
        "words": words,
    }


def _extract_book_name(filename: str) -> str:
    name = Path(filename).stem
    # Remove common Korean/English suffixes from source file names
    for suffix in ["소스파일", "단어소스", "단어", "source", "data", "words"]:
        name = re.sub(rf"\s*{suffix}\s*", "", name, flags=re.IGNORECASE)
    return name.strip(" _-")
