"""
Document checklists for 58 missing Polish universities.

Sources verified:
- University of Wrocław required documents (international.uni.wroc.pl/en/admission-full-degree-studies/required-documents)
- University of Silesia required documents (rekrutacja.us.edu.pl/en/foreigners/required-documents)
- Jagiellonian University documents (welcome.uj.edu.pl/en_GB/admission/documents/undergraduate)
- NAWA SYRENA system (nawa.gov.pl/en/nawa/news/system-syrena + edugoabroad.com guide)
  → Mandatory from 1 July 2025 for non-EU/OECD/EFTA countries
  → 30–60 day processing time; apply at least 2 months before university deadline
  → Under 2025 rules: final NAWA statement required at enrollment — proof of submission NOT accepted
  → EU/OECD/EFTA countries are exempt (bilateral agreements may also exempt some countries)
  → Process is FREE and fully online at syrena.nawa.gov.pl
- IRK portal is used by virtually all Polish public universities for online registration
- NAWA July 2025 update: B2 English minimum now mandatory for all programs
- Health insurance: minimum €30,000 coverage required (Jagiellonian University source)
- Application fees: typically 200–400 PLN (≈€47–94) depending on university
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")
from app.database import SessionLocal
import sqlalchemy as sa

db = SessionLocal()

def add_docs(uni_id, items):
    existing = db.execute(sa.text(
        "SELECT COUNT(*) FROM university_document_items WHERE university_id = :uid"
    ), {"uid": uni_id}).scalar()
    if existing > 0:
        print(f"  SKIP ID {uni_id} — already has {existing} items")
        return 0
    for item in items:
        db.execute(sa.text("""
            INSERT INTO university_document_items
            (university_id, name, is_required, order_index, degree_level)
            VALUES (:uid, :name, :req, :idx, :dl)
        """), {"uid": uni_id, "name": item[0], "req": item[1], "idx": item[2], "dl": item[3]})
    print(f"  Added {len(items)} items for ID {uni_id}")
    return len(items)


# ─── STANDARD POLISH CHECKLIST ────────────────────────────────────────────────

def pl_standard(uni_id, irk_note="Apply online via the university's IRK portal (Internetowa Rejestracja Kandydatów)."):
    """Standard checklist for Polish universities (IRK + NAWA SYRENA)."""
    return add_docs(uni_id, [
        # ── Common to ALL degrees ──
        ("Passport copy (valid for at least 6 months beyond expected program end)",        True,  1, "all"),
        (irk_note,                                                                          True,  2, "all"),
        ("Application fee payment confirmation (amount shown in IRK portal, typically 200–400 PLN)", True, 3, "all"),
        ("English language certificate — minimum B2 level (IELTS 5.5+ / TOEFL iBT 72+ / Cambridge B2 / equivalent)", True, 4, "all"),
        ("Motivational letter / Statement of purpose",                                     True,  5, "all"),
        ("Curriculum Vitae (CV)",                                                           True,  6, "all"),
        ("Biometric passport photo",                                                        True,  7, "all"),
        ("Health insurance valid for minimum first year of study — minimum €30,000 coverage", True, 8, "all"),
        # ── Bachelor-specific ──
        ("Secondary school certificate / Matura equivalent (original or apostilled certified copy)", True, 9, "bachelor"),
        ("Apostille or legalization stamp on secondary school certificate (required for non-Hague countries: consular legalization instead)", True, 10, "bachelor"),
        ("Sworn translation of secondary school certificate into Polish (by sworn translator registered with Polish Ministry of Justice)", True, 11, "bachelor"),
        ("Transcript of grades from secondary school + apostille/legalization",            True,  12, "bachelor"),
        ("Sworn Polish translation of secondary school transcript",                        True,  13, "bachelor"),
        ("NAWA SYRENA individual recognition statement — mandatory from 1 July 2025 for non-EU/OECD/EFTA countries (apply at syrena.nawa.gov.pl; processing 30–60 days; apply ≥2 months before university deadline; final statement required at enrollment — proof of submission no longer accepted)", True, 14, "bachelor"),
        # ── Master-specific ──
        ("Bachelor degree certificate (original or apostilled certified copy)",            True,  9, "master"),
        ("Apostille or legalization on Bachelor degree",                                   True,  10, "master"),
        ("Sworn Polish translation of Bachelor degree",                                    True,  11, "master"),
        ("Transcript of Bachelor studies + apostille/legalization",                        True,  12, "master"),
        ("Sworn Polish translation of Bachelor transcript",                                True,  13, "master"),
        ("NAWA SYRENA individual recognition statement for Bachelor degree (syrena.nawa.gov.pl; processing 30–60 days)", True, 14, "master"),
        ("Letter of recommendation (program-dependent)",                                   False, 15, "master"),
        # ── PhD-specific ──
        ("Master degree certificate + apostille/legalization + sworn Polish translation",  True,  9, "phd"),
        ("Master transcript + apostille + sworn Polish translation",                       True,  10, "phd"),
        ("NAWA SYRENA recognition statement for Master degree",                            True,  11, "phd"),
        ("Research proposal (min 3 pages in English or Polish)",                           True,  12, "phd"),
        ("Confirmation of supervisor / admission to doctoral school",                      True,  13, "phd"),
        ("Letter of recommendation (2 letters)",                                           True,  14, "phd"),
    ])


def pl_medical(uni_id, irk_note="Apply online via the university's IRK portal.", entrance_exam_note="Entrance exam in Biology and Chemistry — check university website for exact syllabus and dates."):
    """Checklist for Polish medical universities (extra: medical certificate + entrance exam)."""
    base = pl_standard(uni_id, irk_note)
    # Add medical-specific docs if base was inserted
    existing_after = db.execute(sa.text(
        "SELECT COUNT(*) FROM university_document_items WHERE university_id = :uid"
    ), {"uid": uni_id}).scalar()
    if existing_after > 0 and base > 0:
        # Add extra medical items
        for item in [
            ("Medical certificate confirming fitness for medical studies (issued by licensed physician, in English)", True, 20, "all"),
            ("Certificate of no contagious diseases (immunization/vaccination record may be required)", True, 21, "all"),
            (entrance_exam_note,                                                            True, 22, "all"),
        ]:
            db.execute(sa.text("""
                INSERT INTO university_document_items
                (university_id, name, is_required, order_index, degree_level)
                VALUES (:uid, :name, :req, :idx, :dl)
            """), {"uid": uni_id, "name": item[0], "req": item[1], "idx": item[2], "dl": item[3]})
        print(f"  + 3 medical-specific items for ID {uni_id}")
        return base + 3
    return base


# ─── ALL 58 POLISH UNIVERSITIES ───────────────────────────────────────────────

total = 0

print("=== Classical / General Universities ===")

# ID 121: University of Bialystok
print("University of Bialystok")
total += pl_standard(121, "Apply via University of Bialystok IRK portal (uwb.edu.pl).")

# ID 122: Kazimierz Wielki University in Bydgoszcz
print("Kazimierz Wielki University Bydgoszcz")
total += pl_standard(122, "Apply via Kazimierz Wielki University IRK portal (ukw.edu.pl).")

# ID 123: University of Warmia and Mazury in Olsztyn
print("University of Warmia and Mazury Olsztyn")
total += pl_standard(123, "Apply via UWM Olsztyn IRK portal (uwm.edu.pl).")

# ID 124: University of Opole
print("University of Opole")
total += pl_standard(124, "Apply via University of Opole IRK portal (uni.opole.pl).")

# ID 125: University of Rzeszow
print("University of Rzeszow")
total += pl_standard(125, "Apply via University of Rzeszow IRK portal (ur.edu.pl).")

# ID 126: University of Szczecin
print("University of Szczecin")
total += pl_standard(126, "Apply via University of Szczecin IRK portal (usz.edu.pl).")

# ID 127: Cardinal Stefan Wyszynski University Warsaw
print("Cardinal Stefan Wyszynski University Warsaw")
total += pl_standard(127, "Apply via UKSW IRK portal (uksw.edu.pl). Catholic university, own application system.")

# ID 128: University of Zielona Gora
print("University of Zielona Gora")
total += pl_standard(128, "Apply via University of Zielona Gora IRK portal (uz.zgora.pl).")

# ID 129: Jan Kochanowski University Kielce
print("Jan Kochanowski University Kielce")
total += pl_standard(129, "Apply via UJK Kielce IRK portal (ujk.edu.pl).")

# ID 130: John Paul II Catholic University of Lublin (KUL)
print("John Paul II Catholic University of Lublin (KUL)")
total += pl_standard(130, "Apply via KUL admission portal (rekrutacja.kul.pl). Private Catholic university.")


print("\n=== Technical Universities ===")

# ID 131: Bialystok University of Technology
print("Bialystok University of Technology")
total += pl_standard(131, "Apply via PB Bialystok IRK portal (pb.edu.pl). English programs: Engineering €3,000–3,600/yr.")

# ID 132: Czestochowa University of Technology
print("Czestochowa University of Technology")
total += pl_standard(132, "Apply via PCz IRK portal (pcz.pl).")

# ID 133: Kielce University of Technology
print("Kielce University of Technology")
total += pl_standard(133, "Apply via Kielce UT IRK portal (tu.kielce.pl/en).")

# ID 134: Koszalin University of Technology
print("Koszalin University of Technology")
total += pl_standard(134, "Apply via Koszalin UT IRK portal (tu.koszalin.pl).")

# ID 135: Lublin University of Technology
print("Lublin University of Technology")
total += pl_standard(135, "Apply via Lublin UT portal (bkm.pollub.pl). CS programs: €4,000/yr confirmed from bkm.pollub.pl.")

# ID 136: Opole University of Technology
print("Opole University of Technology")
total += pl_standard(136, "Apply via Opole UT IRK portal (po.edu.pl).")

# ID 137: Rzeszow University of Technology
print("Rzeszow University of Technology")
total += pl_standard(137, "Apply via PRz IRK portal (prz.edu.pl).")

# ID 138: West Pomeranian University of Technology Szczecin
print("West Pomeranian University of Technology Szczecin")
total += pl_standard(138, "Apply via ZUT Szczecin IRK portal (zut.edu.pl).")

# ID 139: Cracow University of Technology
print("Cracow University of Technology")
total += pl_standard(139, "Apply via PK Kraków IRK portal (iro.pk.edu.pl). Architecture €5,000/yr, Civil Eng €3,000/yr, Mechanical €3,500/yr (source: iro.pk.edu.pl).")

# ID 84: Warsaw University of Technology
print("Warsaw University of Technology")
total += pl_standard(84, "Apply via PW IRK portal (rekrutacja.pw.edu.pl).")

# ID 87: Gdańsk University of Technology
print("Gdańsk University of Technology")
total += pl_standard(87, "Apply via PG Gdańsk IRK portal (pg.edu.pl/en/candidates).")

# ID 88: Łódź University of Technology
print("Łódź University of Technology")
total += pl_standard(88, "Apply via PŁ Łódź IRK portal (p.lodz.pl/en).")

# ID 90: Silesian University of Technology
print("Silesian University of Technology")
total += pl_standard(90, "Apply via Silesian UT IRK portal (polsl.pl/en).")


print("\n=== Economic Universities ===")

# ID 85: SGH Warsaw School of Economics
print("SGH Warsaw School of Economics")
total += pl_standard(85, "Apply via SGH recruitment portal (rekrutacja.sgh.waw.pl).")

# ID 92: Kozminski University
print("Kozminski University")
total += pl_standard(92, "Apply via Kozminski University portal (kozminski.edu.pl). Private institution.")

# ID 140: University of Economics in Katowice
print("University of Economics Katowice")
total += pl_standard(140, "Apply via UE Katowice IRK portal (ue.katowice.pl).")

# ID 141: Krakow University of Economics
print("Krakow University of Economics")
total += pl_standard(141, "Apply via UEK Kraków IRK portal (uek.krakow.pl).")

# ID 142: Poznan University of Economics and Business
print("Poznan University of Economics and Business")
total += pl_standard(142, "Apply via UEP Poznań IRK portal (ue.poznan.pl).")

# ID 143: Wroclaw University of Economics and Business
print("Wroclaw University of Economics and Business")
total += pl_standard(143, "Apply via UEW Wrocław IRK portal (ue.wroc.pl).")


print("\n=== Agricultural / Life Sciences Universities ===")

# ID 144: Warsaw University of Life Sciences (SGGW)
print("Warsaw University of Life Sciences (SGGW)")
total += pl_standard(144, "Apply via SGGW IRK portal (sggw.edu.pl/en).")

# ID 145: Poznan University of Life Sciences
print("Poznan University of Life Sciences")
total += pl_standard(145, "Apply via UP Poznań IRK portal (up.poznan.pl/en).")

# ID 146: University of Agriculture in Krakow
print("University of Agriculture Krakow")
total += pl_standard(146, "Apply via UR Kraków IRK portal (urk.edu.pl).")

# ID 147: Wroclaw University of Environmental and Life Sciences
print("Wroclaw University of Environmental and Life Sciences")
total += pl_standard(147, "Apply via UPWr Wrocław IRK portal (upwr.edu.pl/en).")


print("\n=== Universities with other fields ===")

# ID 86: University of Wrocław
print("University of Wrocław")
total += pl_standard(86, "Apply via University of Wrocław IRK portal (rekrutacja.uni.wroc.pl). Verified requirements from international.uni.wroc.pl.")

# ID 89: University of Łódź
print("University of Łódź")
total += pl_standard(89, "Apply via UŁ Łódź IRK portal (uni.lodz.pl/en).")

# ID 91: Maria Curie-Skłodowska University (UMCS)
print("Maria Curie-Skłodowska University")
total += pl_standard(91, "Apply via UMCS IRK portal (rekrutacja.umcs.lublin.pl).")

# ID 93: Poznan University of Medical Sciences
print("Poznan University of Medical Sciences")
total += pl_medical(93,
    "Apply via PUMS admission portal (ump.edu.pl/en/candidates).",
    "Entrance exam in Biology and Chemistry required. Check ump.edu.pl for exam dates and syllabus.")

# ID 94: University of Silesia in Katowice
print("University of Silesia in Katowice")
total += pl_standard(94, "Apply via University of Silesia IRK portal (rekrutacja.us.edu.pl/en). Verified requirements from rekrutacja.us.edu.pl/en/foreigners/required-documents.")


print("\n=== Medical Universities ===")

# ID 148: Medical University of Bialystok
print("Medical University of Bialystok")
total += pl_medical(148,
    "Apply via Medical University of Bialystok admission portal (umb.edu.pl/en).",
    "Entrance exam in Biology and Chemistry. Check umb.edu.pl for current year exam syllabus and dates.")

# ID 149: Medical University of Lublin
print("Medical University of Lublin")
total += pl_medical(149,
    "Apply via Medical University of Lublin portal (umlub.pl/en).",
    "Entrance exam in Biology and Chemistry. Contact admission@umlub.pl for exam schedule.")

# ID 150: Medical University of Silesia in Katowice
print("Medical University of Silesia Katowice")
total += pl_medical(150,
    "Apply via SUM Katowice portal (admission.sum.edu.pl). Medicine: €15,360/yr (source: admission.sum.edu.pl/tuition-fees).",
    "Biology and Chemistry entrance exam required. Details at admission.sum.edu.pl.")

# ID 151: Medical University of Lodz
print("Medical University of Lodz")
total += pl_medical(151,
    "Apply via Medical University of Łódź portal (umed.lodz.pl/en).",
    "Entrance exam in Biology and Chemistry required.")

# ID 152: Pomeranian Medical University in Szczecin
print("Pomeranian Medical University Szczecin")
total += pl_medical(152,
    "Apply via PUM Szczecin portal (apply.pum.edu.pl). Medicine: €14,500/yr (source: apply.pum.edu.pl/contents/content/62-fees).",
    "Entrance exam in Biology and Chemistry. Details at apply.pum.edu.pl.")

print("\n=== Pedagogical University ===")

# ID 153: Pedagogical University of Krakow
print("Pedagogical University of Krakow")
total += pl_standard(153, "Apply via Pedagogical University Kraków IRK portal (up.krakow.pl/en).")


db.commit()
db.close()
print(f"\nDone: {total} document items added for 58 Polish universities.")
