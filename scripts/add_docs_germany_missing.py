"""
Document checklists for 31 missing German universities.

Sources verified:
- uni-assist.de member list (which unis use uni-assist vs direct portal)
- University of Hohenheim confirmed dropped uni-assist since WS 2022/23 (uni-hohenheim.de)
- University of Trier confirmed does NOT use uni-assist (uni-trier.de)
- TU Braunschweig uses own portal with €75 assessment fee (tu-braunschweig.de)
- DAAD general Germany documents guide (daad.de)
- Blocked account requirement: €11,208/year = €934/month (as of 2024/25, DAAD confirmed)
- APS certificate NOT required for Arab/Egyptian students (only China, Vietnam, India, Mongolia)
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


# ─── STANDARD TEMPLATES ───────────────────────────────────────────────────────

def de_uni_assist(uni_id):
    """Standard checklist for German universities using uni-assist."""
    return add_docs(uni_id, [
        # name, is_required, order_index, degree_level
        ("Passport / National ID (copy, valid ≥ 6 months beyond study start)",            True,  1, "all"),
        ("Application via uni-assist portal (my.uni-assist.de) — VPD or program application", True, 2, "all"),
        ("uni-assist application fee (€75 first application; €30 each additional)",       True,  3, "all"),
        ("High school diploma / secondary school leaving certificate (apostilled copy)",   True,  4, "all"),
        ("Official translation of high school diploma into German or English",             True,  5, "all"),
        ("Academic transcripts — all years of schooling (apostilled copy)",                True,  6, "all"),
        ("Official translation of transcripts into German or English",                     True,  7, "all"),
        ("German language certificate: TestDaF ≥13 / DSH 2 / Goethe C1 (German programs)", True, 8, "all"),
        ("English language certificate: IELTS ≥6.0 / TOEFL iBT ≥80 / Cambridge B2 (English programs)", False, 9, "all"),
        ("Motivational letter / Statement of purpose",                                     True,  10, "all"),
        ("Curriculum Vitae (CV) in Europass format",                                       True,  11, "all"),
        ("Biometric passport photo",                                                        True,  12, "all"),
        ("Proof of financial means — blocked account (Sperrkonto) €11,208/year (€934/month)", True, 13, "all"),
        ("Health insurance confirmation (public or recognised private insurer)",           True,  14, "all"),
        ("APS certificate — ONLY if from China, Vietnam, India or Mongolia (not required for Arab countries)", False, 15, "all"),
        # Bachelor-specific
        ("University entrance qualification recognition — confirmation of access to higher education in home country", True, 16, "bachelor"),
        # Master-specific
        ("Bachelor degree certificate (apostilled copy)",                                  True,  16, "master"),
        ("Official translation of Bachelor degree",                                        True,  17, "master"),
        ("Bachelor degree transcript (apostilled copy)",                                   True,  18, "master"),
        ("Official translation of Bachelor transcript",                                    True,  19, "master"),
        ("Letter of recommendation (1–2 letters, program-dependent)",                     False, 20, "master"),
        # PhD
        ("Master degree certificate + translation (apostilled)",                           True,  16, "phd"),
        ("Master transcript + translation",                                                True,  17, "phd"),
        ("Research proposal / exposé (3–5 pages)",                                        True,  18, "phd"),
        ("Confirmation of supervisor / acceptance letter from professor",                  True,  19, "phd"),
    ])


def de_direct(uni_id, portal_note="Apply directly via the university's online application portal."):
    """Standard checklist for German universities using their own portal (no uni-assist)."""
    return add_docs(uni_id, [
        ("Passport / National ID (copy, valid ≥ 6 months beyond study start)",            True,  1, "all"),
        (portal_note,                                                                       True,  2, "all"),
        ("High school diploma / secondary school leaving certificate (apostilled copy)",   True,  3, "all"),
        ("Official translation of high school diploma into German or English",             True,  4, "all"),
        ("Academic transcripts — all years of schooling (apostilled copy)",                True,  5, "all"),
        ("Official translation of transcripts into German or English",                     True,  6, "all"),
        ("German language certificate: TestDaF ≥13 / DSH 2 / Goethe C1 (German programs)", True, 7, "all"),
        ("English language certificate: IELTS ≥6.0 / TOEFL iBT ≥80 / Cambridge B2 (English programs)", False, 8, "all"),
        ("Motivational letter / Statement of purpose",                                     True,  9, "all"),
        ("Curriculum Vitae (CV) in Europass format",                                       True,  10, "all"),
        ("Biometric passport photo",                                                        True,  11, "all"),
        ("Proof of financial means — blocked account (Sperrkonto) €11,208/year (€934/month)", True, 12, "all"),
        ("Health insurance confirmation (public or recognised private insurer)",           True,  13, "all"),
        ("APS certificate — ONLY if from China, Vietnam, India or Mongolia (not required for Arab countries)", False, 14, "all"),
        # Bachelor-specific
        ("University entrance qualification recognition — confirmation of access to higher education in home country", True, 15, "bachelor"),
        # Master-specific
        ("Bachelor degree certificate (apostilled copy)",                                  True,  15, "master"),
        ("Official translation of Bachelor degree",                                        True,  16, "master"),
        ("Bachelor degree transcript (apostilled copy)",                                   True,  17, "master"),
        ("Official translation of Bachelor transcript",                                    True,  18, "master"),
        ("Letter of recommendation (1–2 letters, program-dependent)",                     False, 19, "master"),
        # PhD
        ("Master degree certificate + translation (apostilled)",                           True,  15, "phd"),
        ("Master transcript + translation",                                                True,  16, "phd"),
        ("Research proposal / exposé (3–5 pages)",                                        True,  17, "phd"),
        ("Confirmation of supervisor / acceptance letter from professor",                  True,  18, "phd"),
    ])


# ─── UNIVERSITIES ─────────────────────────────────────────────────────────────

total = 0

print("=== GERMANY — uni-assist universities ===")

# ID 67: Bielefeld University — confirmed uni-assist (uni-assist.de/detail/116)
print("Bielefeld University")
total += de_uni_assist(67)

# ID 72: Carl von Ossietzky University of Oldenburg — confirmed uni-assist
print("Carl von Ossietzky University of Oldenburg")
total += de_uni_assist(72)

# ID 74: Chemnitz University of Technology — confirmed uni-assist (tu-chemnitz.de)
print("Chemnitz University of Technology")
total += de_uni_assist(74)

# ID 65: Justus Liebig University Giessen — confirmed uni-assist (uni-assist.de/detail/89)
print("Justus Liebig University Giessen")
total += de_uni_assist(65)

# ID 76: Martin Luther University Halle-Wittenberg — confirmed uni-assist
print("Martin Luther University Halle-Wittenberg")
total += de_uni_assist(76)

# ID 73: Leuphana University Lüneburg — confirmed uni-assist
print("Leuphana University Lüneburg")
total += de_uni_assist(73)

# ID 64: Philipps-Universität Marburg — confirmed uni-assist (uni-assist.de/detail/93)
print("Philipps-Universität Marburg")
total += de_uni_assist(64)

# ID 79: RPTU Kaiserslautern-Landau — uni-assist (successor of TU KL, confirmed member)
print("RPTU Kaiserslautern-Landau")
total += de_uni_assist(79)

# ID 59: Ulm University — confirmed uni-assist (Baden-Württemberg)
print("Ulm University")
total += de_uni_assist(59)

# ID 78: University of Bamberg — uni-assist (Bavaria, own FlexNow portal but VPD via uni-assist)
print("University of Bamberg")
total += de_uni_assist(78)

# ID 66: University of Kassel — confirmed uni-assist (uni-assist.de/detail/92)
print("University of Kassel")
total += de_uni_assist(66)

# ID 60: University of Konstanz — confirmed uni-assist (uni-assist.de/detail/8)
print("University of Konstanz")
total += de_uni_assist(60)

# ID 71: University of Osnabrück — confirmed uni-assist (uni-assist.de/detail/112)
print("Universität Osnabrück")
total += de_uni_assist(71)

# ID 68: University of Paderborn — confirmed uni-assist (search results)
print("University of Paderborn")
total += de_uni_assist(68)

# ID 77: University of Passau — confirmed uni-assist (uni-assist.de/detail/35)
print("University of Passau")
total += de_uni_assist(77)

# ID 63: University of Potsdam — confirmed uni-assist (uni-assist.de/detail/67)
print("University of Potsdam")
total += de_uni_assist(63)

# ID 69: University of Siegen — uni-assist (NRW, confirmed in general uni-assist database)
print("University of Siegen")
total += de_uni_assist(69)

# ID 70: Bergische Universität Wuppertal — confirmed uni-assist (FAQ states uni-assist required)
print("Bergische Universität Wuppertal")
total += de_uni_assist(70)


print()
print("=== GERMANY — direct application universities ===")

# ID 62: TU Braunschweig — own portal, €75 assessment fee (source: tu-braunschweig.de/en/international-students/application)
print("TU Braunschweig")
total += de_direct(62,
    "Apply directly via TU Braunschweig online portal (tu-braunschweig.de) — upload single PDF bundle. Assessment fee €75.")

# ID 75: TU Ilmenau — own portal (small TU in Thuringia, not a uni-assist member)
print("TU Ilmenau")
total += de_direct(75,
    "Apply directly via TU Ilmenau application portal (tu-ilmenau.de). No uni-assist.")

# ID 112: University of Erfurt — own portal (Thuringia, not uni-assist)
print("University of Erfurt")
total += de_direct(112,
    "Apply directly via University of Erfurt online portal (uni-erfurt.de/studium/bewerbung).")

# ID 119: Europa-Universität Flensburg — own portal (Schleswig-Holstein, not uni-assist)
print("Europa-Universität Flensburg")
total += de_direct(119,
    "Apply directly via Europa-Universität Flensburg portal (uni-flensburg.de/studium/bewerbung).")

# ID 114: Europa-Universität Viadrina Frankfurt (Oder) — own portal (Brandenburg border uni)
print("Europa-Universität Viadrina Frankfurt (Oder)")
total += de_direct(114,
    "Apply directly via Viadrina online portal (europa-uni.de). Strong Polish-German bilateral programmes.")

# ID 116: University of Hildesheim — own portal (Lower Saxony)
print("University of Hildesheim")
total += de_direct(116,
    "Apply directly via University of Hildesheim portal (uni-hildesheim.de/studium/bewerbung).")

# ID 61: University of Hohenheim — own portal (confirmed: dropped uni-assist since WS 2022/23; source: uni-hohenheim.de/en/apply-non-eu-citizens)
print("University of Hohenheim")
total += de_direct(61,
    "Apply directly via University of Hohenheim portal (uni-hohenheim.de). uni-assist no longer required since WS 2022/23.")

# ID 117: University of Koblenz — own portal (new independent university since 2023)
print("University of Koblenz")
total += de_direct(117,
    "Apply directly via University of Koblenz portal (uni-koblenz.de). Independent since 2023, own admission system.")

# ID 115: Clausthal University of Technology — own portal (Lower Saxony, small TU)
print("Clausthal University of Technology")
total += de_direct(115,
    "Apply directly via TU Clausthal portal (tu-clausthal.de/studium/bewerbung).")

# ID 113: University of Lübeck — own portal (Schleswig-Holstein)
print("University of Lübeck")
total += de_direct(113,
    "Apply directly via University of Lübeck portal (uni-luebeck.de/studium/bewerbung).")

# ID 80: University of Trier — confirmed direct (source: uni-trier.de states explicitly no uni-assist)
print("University of Trier")
total += de_direct(80,
    "Apply directly via University of Trier portal (uni-trier.de). Trier does NOT use uni-assist — direct application only.")

# ID 118: University of Vechta — own portal (Lower Saxony, very small)
print("University of Vechta")
total += de_direct(118,
    "Apply directly via University of Vechta portal (uni-vechta.de/studium/bewerbung).")

# ID 120: Catholic University of Eichstätt-Ingolstadt — private, own portal
print("Catholic University of Eichstätt-Ingolstadt")
total += add_docs(120, [
    ("Passport / National ID (copy)",                                                      True,  1, "all"),
    ("Apply via KU Eichstätt-Ingolstadt own portal (ku.de/studium/bewerbung) — private Catholic university", True, 2, "all"),
    ("High school diploma / secondary school leaving certificate (apostilled copy)",       True,  3, "all"),
    ("Official translation of diploma into German or English",                             True,  4, "all"),
    ("Academic transcripts (apostilled copy) + official translation",                      True,  5, "all"),
    ("German language certificate: TestDaF ≥13 / DSH 2 / Goethe C1 (German programs)",  True,  6, "all"),
    ("English language certificate: IELTS ≥6.0 / TOEFL iBT ≥80 (English programs)",    False, 7, "all"),
    ("Motivational letter",                                                                True,  8, "all"),
    ("Curriculum Vitae (CV)",                                                              True,  9, "all"),
    ("Biometric passport photo",                                                            True, 10, "all"),
    ("Proof of financial means — blocked account (Sperrkonto) €11,208/year",             True,  11, "all"),
    ("Health insurance confirmation",                                                       True, 12, "all"),
    ("Proof of payment of tuition fee (approx €1,500/semester for non-EU students)",     True,  13, "all"),
    ("Bachelor degree certificate + translation",                                          True,  14, "master"),
    ("Bachelor transcript + translation",                                                  True,  15, "master"),
    ("Letter of recommendation (1–2)",                                                    False, 16, "master"),
    ("Master degree + translation + research proposal (≥3 pages)",                        True,  14, "phd"),
    ("Supervisor confirmation letter from KU professor",                                   True,  15, "phd"),
])


db.commit()
db.close()
print(f"\nDone: {total} document items added for 31 German universities.")
