"""
Insert tuition fee updates and document checklists for all universities.
Run from project root: python scripts/insert_university_data.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()
import psycopg2

DB_URL = os.getenv("DATABASE_URL")
conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

# ── 1. TUITION FEE UPDATES ────────────────────────────────────────────────────
# Values are annual EUR for non-EU students (public) or general (private).
# Baden-Württemberg public: €1,500/sem × 2 = €3,000/yr (already set for IDs 3,4,5,6,7,8)
# TUM: Bachelor ~€5,000/yr (avg), Master ~€9,000/yr → use 5000 (conservative bachelor avg)
# Polish private: keep existing values which are realistic

fee_updates = [
    # id, annual_eur, note
    (1,  0,     "LMU Munich - free for non-EU"),
    (2,  5000,  "TUM - non-EU ~€2,000-3,000/sem Bachelor"),
    (3,  3000,  "Heidelberg - BW €1,500/sem non-EU"),
    (4,  3000,  "KIT - BW €1,500/sem non-EU"),
    (5,  3000,  "Tübingen - BW €1,500/sem non-EU"),
    (6,  3000,  "Freiburg - BW €1,500/sem non-EU"),
    (7,  3000,  "Mannheim - BW €1,500/sem non-EU"),
    (8,  3000,  "Stuttgart - BW €1,500/sem non-EU"),
    (9,  0,     "HU Berlin - free"),
    (10, 0,     "FU Berlin - free"),
    (11, 0,     "TU Berlin - free"),
    (12, 0,     "RWTH Aachen - free"),
    (13, 0,     "Münster - free"),
    (14, 0,     "Cologne - free"),
    (15, 0,     "Bonn - free"),
    (16, 0,     "Düsseldorf - free"),
    (17, 0,     "TU Dortmund - free"),
    (18, 0,     "Ruhr Bochum - free"),
    (19, 0,     "Hamburg - free"),
    (20, 0,     "TUHH - free"),
    (21, 0,     "Goethe Frankfurt - free"),
    (22, 0,     "TU Darmstadt - free"),
    (23, 0,     "Göttingen - free"),
    (24, 0,     "Leibniz Hannover - free"),
    (25, 0,     "Bremen - free"),
    (26, 0,     "OVGU Magdeburg - free"),
    (27, 0,     "Jena - free"),
    (28, 0,     "FAU Erlangen - free"),
    (29, 0,     "Würzburg - free"),
    (30, 0,     "Augsburg - free"),
    (31, 0,     "Regensburg - free"),
    (32, 0,     "Bayreuth - free"),
    (33, 0,     "Mainz - free"),
    (34, 0,     "Saarland - free"),
    (35, 0,     "Kiel - free"),
    (36, 0,     "Rostock - free"),
    (37, 0,     "Greifswald - free"),
    (38, 0,     "Leipzig - free"),
    (39, 0,     "TU Dresden - free"),
    (40, 0,     "Duisburg-Essen - free"),
    (41, 19500, "Frankfurt School - Master ~€17,750-21,000/yr"),
    (42, 53500, "ESMT - MBA €53,500 total (MBA only, no bachelor)"),
    (43, 13800, "WHU - Bachelor ~€13,800/yr"),
    (44, 20000, "Constructor Bremen - Bachelor ~€20,000/yr"),
    # Polish fees already reflect realistic values - minor adjustments
    (45, 3000,  "University of Warsaw ~€2,000-4,300/yr by program"),
    (46, 13500, "Medical University Warsaw ~€11,500-15,000/yr"),
    (47, 4500,  "Jagiellonian ~€4,500/yr English programs"),
    (48, 14000, "Medical Gdańsk ~€13,000-15,000/yr"),
    (49, 15400, "Wrocław Medical ~€14,000-16,000/yr"),
    (50, 2800,  "Wrocław UST ~2,800 EUR/yr avg"),
    (51, 3000,  "AGH Krakow ~€1,250-3,500/sem by field"),
    (52, 2500,  "Poznań UT ~€2,000-3,000/yr"),
    (53, 2500,  "Adam Mickiewicz ~€2,000-3,000/yr"),
    (54, 2200,  "University of Gdańsk ~€2,000-2,500/yr"),
    (55, 2000,  "Nicolaus Copernicus ~€1,800-2,500/yr"),
    (56, 3000,  "Andrzej Frycz Modrzewski ~€3,000/yr"),
    (57, 5900,  "SWPS ~€5,500-6,500/yr"),
    (58, 4560,  "Lazarski ~€4,560/yr"),
]

for uid, fee, note in fee_updates:
    cur.execute("UPDATE universities SET tuition_fee_eur=%s WHERE id=%s", (fee, uid))

# ── 2. DOCUMENT ITEMS ─────────────────────────────────────────────────────────
# Delete existing items before inserting fresh data
cur.execute("DELETE FROM university_document_items")

# Templates
def german_public_docs(uni_id, bw_tuition=False, tum=False):
    docs = [
        ("Valid passport or national ID", True, 0),
        ("Secondary school leaving certificate (Abitur equivalent)", True, 1),
        ("Certified German translation of school certificate", True, 2),
        ("APS certificate (mandatory for Egypt, Syria, China, India, Vietnam)", True, 3),
        ("German language certificate: DSH level 2 or TestDaF 4×4 (German-taught programs)", True, 4),
        ("English proficiency: IELTS 6.5+ or TOEFL iBT 90+ (English-taught programs)", True, 5),
        ("Bachelor's degree + transcript (Master's applicants only)", True, 6),
        ("CV / Résumé (Master's applicants)", True, 7),
        ("Motivation letter (Master's applicants)", True, 8),
        ("uni-assist application (€75 first choice, €30 each additional)", True, 9),
        ("Proof of financial resources (blocked account ~€11,904/yr)", True, 10),
        ("Health insurance certificate", True, 11),
        ("Biometric passport photos", False, 12),
        ("Letters of recommendation (some Master's programs)", False, 13),
    ]
    if bw_tuition:
        docs.append(("Note: Non-EU students pay €1,500/semester tuition fee (Baden-Württemberg)", False, 14))
    if tum:
        docs.append(("Note: Non-EU students pay €2,000-3,000/semester (Bachelor) or €4,000-6,000/semester (Master)", False, 14))
    return [(uni_id, name, req, idx) for name, req, idx in docs]

def german_private_docs(uni_id, english_only=True):
    docs = [
        ("Valid passport", True, 0),
        ("Secondary school certificate + official translation", True, 1),
        ("English proficiency: IELTS 6.5+ or TOEFL iBT 90+", True, 2),
        ("Bachelor's degree + transcript (Master's/MBA)", True, 3),
        ("CV / Résumé", True, 4),
        ("Motivation letter / personal statement", True, 5),
        ("2 letters of recommendation", True, 6),
        ("Application fee (varies by program)", True, 7),
        ("Proof of financial resources", True, 8),
        ("Interview (shortlisted candidates)", False, 9),
        ("Work experience (MBA programs — typically 3+ years required)", False, 10),
        ("GMAT/GRE score (some MBA programs)", False, 11),
    ]
    return [(uni_id, name, req, idx) for name, req, idx in docs]

def polish_public_docs(uni_id):
    docs = [
        ("Valid passport", True, 0),
        ("Secondary school leaving certificate", True, 1),
        ("Apostille stamp on school certificate (non-EU documents)", True, 2),
        ("Certified Polish or English translation of all documents", True, 3),
        ("English proficiency: IELTS 6.0+ or TOEFL iBT 79+ (English programs)", True, 4),
        ("Bachelor's degree + transcript (Master's applicants)", True, 5),
        ("Completed online application form", True, 6),
        ("Motivation letter", True, 7),
        ("Passport photo", True, 8),
        ("Application fee (varies: ~100-200 PLN)", True, 9),
        ("NAWA statement for non-EU/OECD degree recognition (from 1 July 2025)", True, 10),
        ("Proof of financial resources / scholarship letter", True, 11),
        ("CV / Résumé (Master's applicants)", False, 12),
        ("Letters of recommendation (some programs)", False, 13),
    ]
    return [(uni_id, name, req, idx) for name, req, idx in docs]

def polish_medical_docs(uni_id):
    docs = [
        ("Valid passport", True, 0),
        ("Secondary school leaving certificate with grades in Biology, Chemistry, Physics", True, 1),
        ("Apostille stamp on school certificate", True, 2),
        ("Certified English translation of all documents", True, 3),
        ("English proficiency: IELTS 6.5+ or TOEFL iBT 90+ (or equivalent)", True, 4),
        ("Completed online application form", True, 5),
        ("Motivation letter", True, 6),
        ("Passport photo", True, 7),
        ("Application fee (~200 EUR)", True, 8),
        ("Proof of financial resources", True, 9),
        ("Medical fitness certificate", True, 10),
        ("NAWA statement for non-EU/OECD degree recognition (from July 2025)", True, 11),
        ("Entrance exam / interview (if required by program)", False, 12),
        ("Letters of recommendation", False, 13),
    ]
    return [(uni_id, name, req, idx) for name, req, idx in docs]

def polish_private_docs(uni_id):
    docs = [
        ("Valid passport", True, 0),
        ("Secondary school certificate (Bachelor's) or Bachelor's degree (Master's)", True, 1),
        ("Apostille or legalization of educational documents", True, 2),
        ("Certified translation of all documents", True, 3),
        ("English proficiency: IELTS 6.0+ or TOEFL iBT 72+", True, 4),
        ("Completed application form", True, 5),
        ("Motivation letter", True, 6),
        ("CV / Résumé", True, 7),
        ("Passport photo", True, 8),
        ("Application fee", True, 9),
        ("NAWA statement for non-EU/OECD degree recognition (from July 2025)", True, 10),
        ("Letters of recommendation", False, 11),
        ("Interview (some programs)", False, 12),
    ]
    return [(uni_id, name, req, idx) for name, req, idx in docs]

# ── German public ──
bw_ids = {3, 4, 5, 6, 7, 8}  # Baden-Württemberg
tum_id = 2
german_public_ids = set(range(1, 41)) - {41, 42, 43, 44} | {43}  # exclude private

all_items = []

# LMU (1) - free
all_items += german_public_docs(1)
# TUM (2) - non-EU fees
all_items += german_public_docs(2, tum=True)
# BW universities (3,4,5,6,7,8)
for uid in [3, 4, 5, 6, 7, 8]:
    all_items += german_public_docs(uid, bw_tuition=True)
# Other German public
for uid in [9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40]:
    all_items += german_public_docs(uid)

# German private
# Frankfurt School (41)
all_items += german_private_docs(41)
# ESMT (42)
all_items += german_private_docs(42)
# WHU (43)
all_items += german_private_docs(43)
# Constructor Bremen (44)
all_items += german_private_docs(44)

# Polish public universities
polish_public_ids = [45, 47, 50, 51, 52, 53, 54, 55]
for uid in polish_public_ids:
    all_items += polish_public_docs(uid)

# Polish medical universities
for uid in [46, 48, 49]:
    all_items += polish_medical_docs(uid)

# Polish private universities
for uid in [56, 57, 58]:
    all_items += polish_private_docs(uid)

# Insert all document items
for uni_id, name, is_required, order_index in all_items:
    cur.execute(
        "INSERT INTO university_document_items (university_id, name, is_required, order_index) VALUES (%s, %s, %s, %s)",
        (uni_id, name, is_required, order_index)
    )

conn.commit()
cur.close()
conn.close()

print(f"Done. Inserted {len(all_items)} document items across {len(set(x[0] for x in all_items))} universities.")
print("Tuition fees updated for all 58 universities.")
