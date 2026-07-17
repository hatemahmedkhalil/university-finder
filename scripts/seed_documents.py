"""
Seed university_document_items with real per-country requirements.
Run: python scripts/seed_documents.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import psycopg2
from app.config import settings

# ── Document templates per country ─────────────────────────────────────────────

GERMANY_DOCS = [
    # all degrees
    ("Passport / National ID (copy)", True, 1, "all"),
    ("High school diploma (Abitur or equivalent)", True, 2, "all"),
    ("Official translation of diploma into German or English", True, 3, "all"),
    ("Academic transcripts (all years)", True, 4, "all"),
    ("Official translation of transcripts", True, 5, "all"),
    ("Curriculum Vitae (CV)", True, 6, "all"),
    ("Motivational letter / Statement of purpose", True, 7, "all"),
    ("German language certificate (TestDaF / DSH / Goethe C1) — if program is in German", True, 8, "all"),
    ("English language certificate (IELTS / TOEFL / Cambridge) — if program is in English", False, 9, "all"),
    ("APS certificate (if from China, Vietnam, India, or Mongolia)", False, 10, "all"),
    # bachelor only
    ("University entrance qualification recognition document (if outside EU)", True, 11, "bachelor"),
    # master only
    ("Bachelor degree certificate", True, 11, "master"),
    ("Bachelor degree transcript", True, 12, "master"),
    ("Letter of recommendation (1–2 letters)", False, 13, "master"),
]

GERMANY_UNI_ASSIST_EXTRA = [
    ("uni-assist online application form (MyAssist)", True, 20, "all"),
    ("uni-assist processing fee receipt (€75 first application, €30 each additional)", True, 21, "all"),
]

POLAND_DOCS = [
    ("Passport (valid)", True, 1, "all"),
    ("High school diploma", True, 2, "bachelor"),
    ("Official translation of diploma into Polish or English (sworn translator)", True, 3, "bachelor"),
    ("Academic transcripts", True, 4, "all"),
    ("Official translation of transcripts (sworn translator)", True, 5, "all"),
    ("NAWA SYRENA recognition of secondary education (mandatory from 1 July 2025, takes 30–60 days)", True, 6, "bachelor"),
    ("English language certificate (IELTS / TOEFL / Cambridge B2+) — for English-taught programs", True, 7, "all"),
    ("Polish language certificate (if program is in Polish)", False, 8, "all"),
    ("Curriculum Vitae (CV)", True, 9, "all"),
    ("Motivational letter", True, 10, "all"),
    ("Passport-size photo (biometric)", True, 11, "all"),
    # master
    ("Bachelor degree diploma", True, 2, "master"),
    ("NAWA or university recognition of bachelor degree (for foreign diplomas)", True, 12, "master"),
    ("Letter of recommendation (1–2 letters)", False, 13, "master"),
]

NETHERLANDS_DOCS = [
    ("Passport (valid)", True, 1, "all"),
    ("High school diploma", True, 2, "bachelor"),
    ("Academic transcripts (with grades)", True, 3, "all"),
    ("English language certificate (IELTS 6.5+ / TOEFL iBT 90+)", True, 4, "all"),
    ("Curriculum Vitae (CV)", True, 5, "all"),
    ("Motivational letter", True, 6, "all"),
    ("Bachelor degree diploma", True, 2, "master"),
    ("Letter of recommendation (2 letters)", False, 7, "master"),
    ("Research proposal (for research master programs)", False, 8, "master"),
]

AUSTRIA_DOCS = [
    ("Passport / National ID (copy)", True, 1, "all"),
    ("High school diploma (with grades)", True, 2, "all"),
    ("Official translation of diploma (certified)", True, 3, "all"),
    ("Academic transcripts", True, 4, "all"),
    ("Official translation of transcripts", True, 5, "all"),
    ("German language certificate (B2 minimum for German programs)", True, 6, "all"),
    ("English language certificate (if program in English)", False, 7, "all"),
    ("Curriculum Vitae (CV)", True, 8, "all"),
    ("Motivational letter", True, 9, "all"),
    ("Bachelor degree diploma", True, 2, "master"),
    ("APS certificate (if from China, Vietnam, or India)", False, 10, "all"),
]

COUNTRY_MAP = {
    "Germany": (GERMANY_DOCS, True),     # (docs, uses_uni_assist commonly)
    "Poland": (POLAND_DOCS, False),
    "Netherlands": (NETHERLANDS_DOCS, False),
    "Austria": (AUSTRIA_DOCS, False),
}

# Universities that use uni-assist (German unis that don't have own portal)
UNI_ASSIST_UNIS = {
    "Heidelberg University", "University of Hamburg", "Ruhr University Bochum",
    "TU Dresden", "University of Leipzig", "Free University of Berlin (FU Berlin)",
    "Humboldt University of Berlin", "Technical University of Berlin (TU Berlin)",
    "University of Cologne", "University of Bonn", "University of Freiburg",
    "University of Tubingen", "University of Munster", "University of Gottingen",
    "University of Wurzburg", "University of Regensburg", "University of Augsburg",
    "University of Bayreuth", "University of Rostock", "University of Greifswald",
    "University of Duisburg-Essen", "University of Bremen", "Saarland University",
    "Otto von Guericke University Magdeburg (OVGU)", "Johannes Gutenberg University Mainz",
    "Friedrich Schiller University Jena", "Leibniz University Hannover",
    "TU Dortmund University", "University of Erlangen-Nuremberg (FAU)",
    "Christian-Albrechts-University of Kiel", "Heinrich Heine University Dusseldorf",
}

# Medical universities in Poland that have entrance exams
POLISH_MEDICAL = {
    "Medical University of Warsaw", "Medical University of Gdansk",
    "Wroclaw Medical University", "Poznan University of Medical Sciences",
}

POLISH_MEDICAL_EXTRA = [
    ("Entrance exam result (biology + chemistry competency test)", True, 50, "bachelor"),
]

def main():
    conn = psycopg2.connect(settings.DATABASE_URL)
    cur = conn.cursor()

    # Clear existing
    cur.execute("DELETE FROM university_document_items")

    # Fetch all universities
    cur.execute("SELECT id, name, country FROM universities ORDER BY id")
    universities = cur.fetchall()

    rows = []
    for uni_id, uni_name, country in universities:
        docs_info = COUNTRY_MAP.get(country)
        if not docs_info:
            # Generic fallback for any other country
            docs = [
                ("Passport (valid)", True, 1, "all"),
                ("Academic transcripts", True, 2, "all"),
                ("High school or bachelor diploma", True, 3, "all"),
                ("English language certificate", True, 4, "all"),
                ("Curriculum Vitae (CV)", True, 5, "all"),
                ("Motivational letter", True, 6, "all"),
            ]
            uses_uni_assist = False
        else:
            docs, uses_uni_assist = docs_info

        for name, is_required, order_index, degree_level in docs:
            rows.append((uni_id, name, is_required, order_index, degree_level))

        # uni-assist extra docs for eligible German unis
        if country == "Germany" and uses_uni_assist and uni_name in UNI_ASSIST_UNIS:
            for name, is_required, order_index, degree_level in GERMANY_UNI_ASSIST_EXTRA:
                rows.append((uni_id, name, is_required, order_index, degree_level))

        # Polish medical entrance exam
        if uni_name in POLISH_MEDICAL:
            for name, is_required, order_index, degree_level in POLISH_MEDICAL_EXTRA:
                rows.append((uni_id, name, is_required, order_index, degree_level))

    cur.executemany(
        "INSERT INTO university_document_items (university_id, name, is_required, order_index, degree_level) VALUES (%s, %s, %s, %s, %s)",
        rows
    )
    conn.commit()
    print(f"Inserted {len(rows)} document items for {len(universities)} universities.")
    conn.close()

if __name__ == "__main__":
    main()
