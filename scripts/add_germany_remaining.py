import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

from app.database import SessionLocal
import sqlalchemy as sa

db = SessionLocal()


def get_existing_names():
    rows = db.execute(sa.text("SELECT name FROM universities")).fetchall()
    return {r[0] for r in rows}


def insert_university(data):
    result = db.execute(
        sa.text("""
            INSERT INTO universities
            (name, country, city, website, description, ranking, tuition_fee_eur,
             is_public, english_programs_available, programs, application_method,
             application_portal_url, semester_fee_eur, notes)
            VALUES
            (:name, :country, :city, :website, :description, :ranking, :tuition_fee_eur,
             :is_public, :english_programs_available, :programs, :application_method,
             :application_portal_url, :semester_fee_eur, :notes)
            RETURNING id
        """),
        data
    )
    return result.fetchone()[0]


def insert_programs(uni_id, programs):
    for p in programs:
        db.execute(
            sa.text("""
                INSERT INTO university_programs
                (university_id, field_of_study, degree_level, tuition_fee_eur, notes)
                VALUES (:university_id, :field_of_study, :degree_level, :tuition_fee_eur, :notes)
            """),
            {**p, "university_id": uni_id}
        )


existing = get_existing_names()

UNIVERSITIES = [
    # --- FREE PUBLIC UNIVERSITIES (non-BW states) ---
    {
        "name": "University of Erfurt",
        "country": "Germany",
        "city": "Erfurt",
        "website": "https://www.uni-erfurt.de/en",
        "description": "Public research university in Thuringia specialising in humanities, social sciences, religion, and education. Founded 1392, re-established 1994.",
        "ranking": 501,
        "tuition_fee_eur": 0,
        "is_public": True,
        "english_programs_available": True,
        "programs": "Humanities, Social Sciences, Education, Theology",
        "application_method": "own_portal",
        "application_portal_url": "https://www.uni-erfurt.de/studium/bewerbung",
        "semester_fee_eur": 250,
        "notes": "Public university in Thuringia — no tuition for non-EU students; ~€250/semester admin fee.",
        "programs_list": [
            {"field_of_study": "Humanities & Social Sciences", "degree_level": "bachelor", "tuition_fee_eur": 0, "notes": "Only semester fee ~€250"},
            {"field_of_study": "Humanities & Social Sciences", "degree_level": "master", "tuition_fee_eur": 0, "notes": "Only semester fee ~€250"},
            {"field_of_study": "Education", "degree_level": "master", "tuition_fee_eur": 0, "notes": "Only semester fee ~€250"},
            {"field_of_study": "All fields", "degree_level": "phd", "tuition_fee_eur": 0, "notes": "PhD free in Germany"},
        ],
    },
    {
        "name": "University of Lübeck",
        "country": "Germany",
        "city": "Lübeck",
        "website": "https://www.uni-luebeck.de/en",
        "description": "Public research university in Schleswig-Holstein focusing on life sciences, computer science, engineering, and medicine.",
        "ranking": 401,
        "tuition_fee_eur": 0,
        "is_public": True,
        "english_programs_available": True,
        "programs": "Medicine, Computer Science, Life Sciences, Engineering",
        "application_method": "own_portal",
        "application_portal_url": "https://www.uni-luebeck.de/studium/bewerbung",
        "semester_fee_eur": 310,
        "notes": "Public university in Schleswig-Holstein — no tuition for non-EU students; ~€310/semester fee.",
        "programs_list": [
            {"field_of_study": "Computer Science", "degree_level": "bachelor", "tuition_fee_eur": 0, "notes": "Only semester fee ~€310"},
            {"field_of_study": "Life Sciences & Medicine", "degree_level": "bachelor", "tuition_fee_eur": 0, "notes": "Only semester fee ~€310"},
            {"field_of_study": "Computer Science", "degree_level": "master", "tuition_fee_eur": 0, "notes": "Only semester fee ~€310"},
            {"field_of_study": "Life Sciences", "degree_level": "master", "tuition_fee_eur": 0, "notes": "Only semester fee ~€310"},
            {"field_of_study": "All fields", "degree_level": "phd", "tuition_fee_eur": 0, "notes": "PhD free in Germany"},
        ],
    },
    {
        "name": "Europa-Universität Viadrina Frankfurt (Oder)",
        "country": "Germany",
        "city": "Frankfurt (Oder)",
        "website": "https://www.europa-uni.de/en",
        "description": "Public university in Brandenburg on the German-Polish border. Specialises in European studies, law, cultural sciences, and business.",
        "ranking": 601,
        "tuition_fee_eur": 0,
        "is_public": True,
        "english_programs_available": True,
        "programs": "Law, Business, Cultural Sciences, European Studies",
        "application_method": "own_portal",
        "application_portal_url": "https://www.europa-uni.de/en/studium/bewerbung",
        "semester_fee_eur": 300,
        "notes": "Public university in Brandenburg — no tuition for non-EU students; ~€300/semester fee. Strong focus on Polish-German cooperation.",
        "programs_list": [
            {"field_of_study": "Law", "degree_level": "bachelor", "tuition_fee_eur": 0, "notes": "Only semester fee ~€300"},
            {"field_of_study": "Business Administration", "degree_level": "bachelor", "tuition_fee_eur": 0, "notes": "Only semester fee ~€300"},
            {"field_of_study": "Cultural Sciences", "degree_level": "bachelor", "tuition_fee_eur": 0, "notes": "Only semester fee ~€300"},
            {"field_of_study": "European Studies", "degree_level": "master", "tuition_fee_eur": 0, "notes": "Only semester fee ~€300"},
            {"field_of_study": "Law", "degree_level": "master", "tuition_fee_eur": 0, "notes": "Only semester fee ~€300"},
            {"field_of_study": "All fields", "degree_level": "phd", "tuition_fee_eur": 0, "notes": "PhD free in Germany"},
        ],
    },
    {
        "name": "Clausthal University of Technology",
        "country": "Germany",
        "city": "Clausthal-Zellerfeld",
        "website": "https://www.tu-clausthal.de/en",
        "description": "Public technical university in Lower Saxony specialising in engineering, natural sciences, materials science, and energy technology.",
        "ranking": 501,
        "tuition_fee_eur": 0,
        "is_public": True,
        "english_programs_available": True,
        "programs": "Engineering, Materials Science, Energy Technology, Mathematics",
        "application_method": "own_portal",
        "application_portal_url": "https://www.tu-clausthal.de/studium/bewerbung",
        "semester_fee_eur": 280,
        "notes": "Public university in Lower Saxony — no tuition for non-EU students; ~€280/semester fee. Mining and energy engineering heritage.",
        "programs_list": [
            {"field_of_study": "Engineering & Materials Science", "degree_level": "bachelor", "tuition_fee_eur": 0, "notes": "Only semester fee ~€280"},
            {"field_of_study": "Energy Technology", "degree_level": "bachelor", "tuition_fee_eur": 0, "notes": "Only semester fee ~€280"},
            {"field_of_study": "Engineering & Materials Science", "degree_level": "master", "tuition_fee_eur": 0, "notes": "Only semester fee ~€280"},
            {"field_of_study": "Environmental Technology", "degree_level": "master", "tuition_fee_eur": 0, "notes": "Only semester fee ~€280"},
            {"field_of_study": "All fields", "degree_level": "phd", "tuition_fee_eur": 0, "notes": "PhD free in Germany"},
        ],
    },
    {
        "name": "University of Hildesheim",
        "country": "Germany",
        "city": "Hildesheim",
        "website": "https://www.uni-hildesheim.de/en",
        "description": "Public university in Lower Saxony with strong focus on education, linguistics, information science, social work, and cultural studies.",
        "ranking": 601,
        "tuition_fee_eur": 0,
        "is_public": True,
        "english_programs_available": True,
        "programs": "Education, Linguistics, Information Science, Cultural Studies",
        "application_method": "own_portal",
        "application_portal_url": "https://www.uni-hildesheim.de/studium/bewerbung",
        "semester_fee_eur": 240,
        "notes": "Public university in Lower Saxony — no tuition for non-EU students; ~€240/semester fee.",
        "programs_list": [
            {"field_of_study": "Education & Social Work", "degree_level": "bachelor", "tuition_fee_eur": 0, "notes": "Only semester fee ~€240"},
            {"field_of_study": "Linguistics & Information Science", "degree_level": "bachelor", "tuition_fee_eur": 0, "notes": "Only semester fee ~€240"},
            {"field_of_study": "Education", "degree_level": "master", "tuition_fee_eur": 0, "notes": "Only semester fee ~€240"},
            {"field_of_study": "Linguistics", "degree_level": "master", "tuition_fee_eur": 0, "notes": "Only semester fee ~€240"},
            {"field_of_study": "All fields", "degree_level": "phd", "tuition_fee_eur": 0, "notes": "PhD free in Germany"},
        ],
    },
    {
        "name": "University of Koblenz",
        "country": "Germany",
        "city": "Koblenz",
        "website": "https://www.uni-koblenz.de/en",
        "description": "Public university in Rhineland-Palatinate offering computer science, artificial intelligence, natural sciences, education, and social sciences. Independent since 2023 (previously part of RPTU).",
        "ranking": 501,
        "tuition_fee_eur": 0,
        "is_public": True,
        "english_programs_available": True,
        "programs": "Computer Science, AI, Natural Sciences, Education, Social Sciences",
        "application_method": "own_portal",
        "application_portal_url": "https://www.uni-koblenz.de/studium/bewerbung",
        "semester_fee_eur": 290,
        "notes": "Public university in Rhineland-Palatinate — no tuition for non-EU students; ~€290/semester fee. Became independent in 2023.",
        "programs_list": [
            {"field_of_study": "Computer Science & AI", "degree_level": "bachelor", "tuition_fee_eur": 0, "notes": "Only semester fee ~€290"},
            {"field_of_study": "Natural Sciences", "degree_level": "bachelor", "tuition_fee_eur": 0, "notes": "Only semester fee ~€290"},
            {"field_of_study": "Computer Science", "degree_level": "master", "tuition_fee_eur": 0, "notes": "Only semester fee ~€290"},
            {"field_of_study": "AI & Data Science", "degree_level": "master", "tuition_fee_eur": 0, "notes": "Only semester fee ~€290"},
            {"field_of_study": "All fields", "degree_level": "phd", "tuition_fee_eur": 0, "notes": "PhD free in Germany"},
        ],
    },
    {
        "name": "University of Vechta",
        "country": "Germany",
        "city": "Vechta",
        "website": "https://www.uni-vechta.de/en",
        "description": "Public university in Lower Saxony with focus on education, social sciences, cultural studies, and health. Known for teacher training and sustainability studies.",
        "ranking": 601,
        "tuition_fee_eur": 0,
        "is_public": True,
        "english_programs_available": True,
        "programs": "Education, Social Sciences, Cultural Studies, Health",
        "application_method": "own_portal",
        "application_portal_url": "https://www.uni-vechta.de/studium/bewerbung",
        "semester_fee_eur": 240,
        "notes": "Public university in Lower Saxony — no tuition for non-EU students; ~€240/semester fee.",
        "programs_list": [
            {"field_of_study": "Education & Social Sciences", "degree_level": "bachelor", "tuition_fee_eur": 0, "notes": "Only semester fee ~€240"},
            {"field_of_study": "Cultural Studies", "degree_level": "bachelor", "tuition_fee_eur": 0, "notes": "Only semester fee ~€240"},
            {"field_of_study": "Education", "degree_level": "master", "tuition_fee_eur": 0, "notes": "Only semester fee ~€240"},
            {"field_of_study": "All fields", "degree_level": "phd", "tuition_fee_eur": 0, "notes": "PhD free in Germany"},
        ],
    },
    {
        "name": "Europa-Universität Flensburg",
        "country": "Germany",
        "city": "Flensburg",
        "website": "https://www.uni-flensburg.de/en",
        "description": "Public university in Schleswig-Holstein near the Danish border. Specialises in European studies, education, culture, health, and sustainability.",
        "ranking": 601,
        "tuition_fee_eur": 0,
        "is_public": True,
        "english_programs_available": True,
        "programs": "European Studies, Education, Sustainability, Culture",
        "application_method": "own_portal",
        "application_portal_url": "https://www.uni-flensburg.de/studium/bewerbung",
        "semester_fee_eur": 310,
        "notes": "Public university in Schleswig-Holstein — no tuition for non-EU students; ~€310/semester fee.",
        "programs_list": [
            {"field_of_study": "European Studies", "degree_level": "bachelor", "tuition_fee_eur": 0, "notes": "Only semester fee ~€310"},
            {"field_of_study": "Education", "degree_level": "bachelor", "tuition_fee_eur": 0, "notes": "Only semester fee ~€310"},
            {"field_of_study": "Sustainability", "degree_level": "master", "tuition_fee_eur": 0, "notes": "Only semester fee ~€310"},
            {"field_of_study": "All fields", "degree_level": "phd", "tuition_fee_eur": 0, "notes": "PhD free in Germany"},
        ],
    },
    # --- PRIVATE UNIVERSITY ---
    {
        "name": "Catholic University of Eichstätt-Ingolstadt",
        "country": "Germany",
        "city": "Eichstätt",
        "website": "https://www.ku.de/en",
        "description": "The only Catholic university in German-speaking countries. Offers business, law, social work, theology, philosophy, and humanities at campuses in Eichstätt and Ingolstadt.",
        "ranking": 401,
        "tuition_fee_eur": 3000,
        "is_public": False,
        "english_programs_available": True,
        "programs": "Business, Law, Theology, Philosophy, Social Work, Humanities",
        "application_method": "own_portal",
        "application_portal_url": "https://www.ku.de/studium/bewerbung",
        "semester_fee_eur": 0,
        "notes": "Private church-affiliated university. Tuition ~€1,500/semester (€3,000/yr) for international students. Source: ku.de",
        "programs_list": [
            {"field_of_study": "Business & Economics", "degree_level": "bachelor", "tuition_fee_eur": 3000, "notes": "~€1,500/semester"},
            {"field_of_study": "Law", "degree_level": "bachelor", "tuition_fee_eur": 3000, "notes": "~€1,500/semester"},
            {"field_of_study": "Theology & Philosophy", "degree_level": "bachelor", "tuition_fee_eur": 3000, "notes": "~€1,500/semester"},
            {"field_of_study": "Social Work", "degree_level": "bachelor", "tuition_fee_eur": 3000, "notes": "~€1,500/semester"},
            {"field_of_study": "Business & Economics", "degree_level": "master", "tuition_fee_eur": 3000, "notes": "~€1,500/semester"},
            {"field_of_study": "Humanities", "degree_level": "master", "tuition_fee_eur": 3000, "notes": "~€1,500/semester"},
            {"field_of_study": "All fields", "degree_level": "phd", "tuition_fee_eur": 0, "notes": "PhD doctoral studies free"},
        ],
    },
]

added = 0
skipped = 0
for uni in UNIVERSITIES:
    if uni["name"] in existing:
        print(f"Skipped (exists): {uni['name']}")
        skipped += 1
        continue
    programs_list = uni.pop("programs_list", [])
    uid = insert_university(uni)
    insert_programs(uid, programs_list)
    print(f"Added (ID {uid}): {uni['name']}")
    added += 1

db.commit()
db.close()
print(f"\nDone: {added} added, {skipped} skipped.")
