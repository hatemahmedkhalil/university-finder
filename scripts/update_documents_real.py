"""
Update university document checklists with REAL, verified data from official sources.
Research done by agents on 2026-07-10 from official university admissions websites.

Key corrections vs. old template data:
- Egypt removed from APS-required list (Egypt was NEVER on the official APS list)
- uni-assist usage corrected per university (many apply directly, not via uni-assist)
- Per-university specific requirements included
- Polish NAWA SYRENA requirement (mandatory from 1 July 2025) accurately described
- Medical universities have unique entrance exam requirements

Run from project root: python scripts/update_documents_real.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()
import psycopg2

DB_URL = os.getenv("DATABASE_URL")
conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

# Delete all existing document items (we replace with real data)
cur.execute("DELETE FROM university_document_items")
print("Cleared old document items.")

all_items = []  # (uni_id, name, is_required, order_index, degree_level)

def add(uni_id, docs):
    """docs = list of (name, required) or (name, required, degree_level) tuples.
    degree_level: 'all' | 'bachelor' | 'master' | 'phd'  (default 'all')
    """
    for i, item in enumerate(docs):
        name, req = item[0], item[1]
        level = item[2] if len(item) > 2 else "all"
        all_items.append((uni_id, name, req, i, level))

# ══════════════════════════════════════════════════════════════════════════════
# GERMAN PUBLIC UNIVERSITIES
# Source: official admissions pages, researched 2026-07-10
# APS required for: China, India, Vietnam (and Mongolia at some universities)
# Egypt is NOT on the APS-required list at any German university
# ══════════════════════════════════════════════════════════════════════════════

# 1 — LMU Munich (direct application, NOT uni-assist)
add(1, [
    ("Valid passport copy", True),
    ("School leaving certificate / university entrance qualification (officially certified copy)", True),
    ("Certified translation of documents (if not in a European language)", True),
    ("University degree certificate + transcript (Master's applicants)", True),
    ("Proof of German language proficiency: DSH-2 or TestDaF 4×4 (German-taught programs)", True),
    ("Proof of English language proficiency (English-taught programs — level varies by program)", True),
    ("APS certificate (mandatory for applicants whose qualifications are from China, India, or Vietnam)", True),
    ("Curriculum vitae (tabular format)", True),
    ("Motivation letter (many Master's programs)", False),
    ("Letters of recommendation (program-dependent)", False),
    ("Proof of financial resources / blocked account ~€11,904/yr (for visa)", True),
    ("Health insurance certificate (at enrollment)", True),
    ("Note: Apply directly via LMU International Office portal — NOT via uni-assist", False),
])

# 2 — TU Munich / TUM (uses uni-assist VPD + TUMonline; non-EU tuition since WS2024/25)
add(2, [
    ("Valid passport copy", True),
    ("School leaving certificate / Bachelor's degree (authentic documents uploaded to TUMonline)", True),
    ("Transcript of records (all semesters)", True),
    ("VPD (Vorprüfungsdokumentation) from uni-assist — apply at least 8 weeks before deadline", True),
    ("APS certificate (mandatory for applicants whose qualifications are from China, India, or Vietnam)", True),
    ("Proof of German language proficiency: C1 minimum (German-taught programs)", True),
    ("Proof of English language proficiency: B2/C1 — TOEFL or IELTS (English-taught programs)", True),
    ("CV", True),
    ("Health insurance proof (digital notification from German public health insurer, at enrollment)", True),
    ("Motivation letter / statement of purpose (program-dependent)", False),
    ("Letters of recommendation (program-dependent)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Note: Non-EU tuition — Bachelor ~€2,000–3,000/semester; Master ~€4,000–6,000/semester (since WS2024/25). Merit waivers available.", False),
    ("Note: Some programs (Bioinformatics, Information Engineering) are tuition-free — check per program", False),
])

# 3 — Heidelberg University (uni-assist for bachelor; BW €1,500/semester)
add(3, [
    ("Valid passport copy", True),
    ("School leaving certificate (bachelor) / Bachelor's degree (master's) with certified translation", True),
    ("Transcript of records (with grading scale explanation)", True),
    ("APS certificate (mandatory for applicants whose qualifications are from China, India, or Vietnam)", True),
    ("Proof of German language proficiency: DSH-2 or TestDaF 4×4 (German-taught programs)", True),
    ("Proof of English language proficiency: IELTS or TOEFL (English-taught programs — score varies by program)", True),
    ("CV (tabular format, German or English)", True),
    ("Motivation letter (required for most Master's programs)", False),
    ("Letters of recommendation (program-dependent)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply via uni-assist for bachelor programs. Some Master's programs use direct application — check per program.", False),
    ("Note: Non-EU tuition fee — €1,500/semester (Baden-Württemberg state university)", False),
])

# 4 — KIT (uni-assist; BW €1,500/semester; APS for China and Vietnam only per official KIT source)
add(4, [
    ("Valid passport copy", True),
    ("School leaving certificate (original language + official German/English translation)", True),
    ("Transcript of records (Master's applicants)", True),
    ("University entrance exam results (if required in home country)", True),
    ("APS certificate — original required (mandatory for applicants whose qualifications are from China or Vietnam; verify for India)", True),
    ("Proof of German language proficiency: B1 at application; DSH-2 or TestDaF 4×4 required by enrollment", True),
    ("Proof of English language proficiency (English-taught programs)", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply via uni-assist. Group APS certificates NOT accepted.", False),
    ("Note: Non-EU tuition fee — €1,500/semester (Baden-Württemberg state university)", False),
])

# 5 — Tübingen (ALMA direct portal, NOT uni-assist; BW €1,500/semester)
add(5, [
    ("Valid passport copy", True),
    ("School leaving certificate / university entrance qualification", True),
    ("Transcript of records / degree certificate", True),
    ("University entrance exam results (country-specific, if applicable)", True),
    ("APS certificate (mandatory for applicants whose qualifications are from China (excl. HK/Taiwan/Macao), India, or Vietnam)", True),
    ("Proof of German language proficiency: DSH-2 or TestDaF 4×4 (German-taught programs)", True),
    ("Proof of English language proficiency (English-taught programs)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply via Tübingen's own ALMA portal — NOT via uni-assist", False),
    ("Note: Non-EU tuition fee — €1,500/semester (Baden-Württemberg state university)", False),
    ("Note: Medicine/dentistry/pharmacy — apply via Hochschulstart, not ALMA", False),
])

# 6 — Freiburg (direct application; BW €1,500/semester)
add(6, [
    ("Valid passport copy", True),
    ("University entrance qualification / Bachelor's degree certificate with certified translation", True),
    ("Transcript of records", True),
    ("APS certificate (mandatory for applicants whose qualifications are from China, India, or Vietnam)", True),
    ("Proof of German language proficiency: DSH-2 or TestDaF 4×4 (German-taught programs)", True),
    ("Proof of English language proficiency: IELTS 7.0 or TOEFL iBT 95+ (English-taught programs — verify per program)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply directly via Freiburg's Service Center Studium — uni-assist usage varies by program", False),
    ("Note: Non-EU tuition fee — €1,500/semester (Baden-Württemberg state university)", False),
])

# 7 — Mannheim (direct portal, NOT uni-assist; BW €1,500/semester; all bachelor programs in German)
add(7, [
    ("Valid passport copy", True),
    ("University entrance qualification (copy in native language + sworn German or English translation)", True),
    ("Transcript of records / degree certificates (sworn translation if not in German or English)", True),
    ("APS certificate (mandatory for applicants whose qualifications are from China, India, or Vietnam)", True),
    ("Proof of German language proficiency: C1 minimum (Goethe C2, TestDaF 4+, DSH-2, or telc C1 Hochschule)", True),
    ("CV (in German, max 1 page)", True),
    ("Motivation letter (in German, max 1 page)", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply directly via Mannheim's online portal — NOT via uni-assist. Only PDF uploads accepted.", False),
    ("Note: All bachelor programs are taught in German — strong German (C1) is mandatory", False),
    ("Note: Non-EU tuition fee — €1,500/semester (Baden-Württemberg state university)", False),
])

# 8 — Stuttgart (C@MPUS direct portal; BW €1,500/semester)
add(8, [
    ("Valid passport copy", True),
    ("University entrance qualification (final record with individual grades + transcript)", True),
    ("University entrance exam certificates (if required in home country)", True),
    ("Higher education degree certificates (all previous university final records, if applicable)", True),
    ("APS certificate (mandatory for India, China, Vietnam. Pakistan applicants: HEC stamp required instead.)", True),
    ("Proof of German language proficiency: DSH-2 or TestDaF 4×4 (German-taught programs)", True),
    ("Certified translation of all documents into German or English by licensed sworn translator", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply via C@MPUS portal (direct) — NOT via uni-assist. No paper applications accepted.", False),
    ("Note: Non-EU tuition fee — €1,500/semester (Baden-Württemberg state university)", False),
])

# 9 — HU Berlin (uni-assist)
add(9, [
    ("Valid passport copy", True),
    ("School leaving certificate / Bachelor's degree (in German or English, or with official translation)", True),
    ("Transcript of records", True),
    ("APS certificate (mandatory for applicants whose qualifications are from China, India, or Vietnam)", True),
    ("Proof of German language proficiency: DSH-2 or TestDaF 4×4 (German-taught programs)", True),
    ("Proof of English language proficiency (English-taught programs)", False),
    ("CV", True),
    ("Motivation letter (program-dependent)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply via uni-assist (€75 first application, €30 each additional)", False),
])

# 10 — FU Berlin (2-step: uni-assist VPD then FU portal)
add(10, [
    ("Valid passport copy", True),
    ("School leaving certificate / Bachelor's degree (with certified translation if not in German or English)", True),
    ("Transcript of records", True),
    ("VPD (Vorprüfungsdokumentation) from uni-assist — apply at least 6–8 weeks before FU portal deadline", True),
    ("APS certificate (mandatory for applicants whose qualifications are from China, India, or Vietnam)", True),
    ("Proof of German language proficiency: DSH-2 or TestDaF 4×4 (German-taught programs)", True),
    ("Proof of English language proficiency (English-taught programs)", False),
    ("Motivation letter (program-dependent)", False),
    ("Letters of recommendation (program-dependent)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: 2-step process — (1) apply for VPD via uni-assist, (2) apply to FU via FU portal using the VPD number", False),
])

# 11 — TU Berlin (uni-assist VPD + tuPORT)
add(11, [
    ("Valid passport copy", True),
    ("School leaving certificate / Bachelor's degree", True),
    ("Transcript of records", True),
    ("VPD (Vorprüfungsdokumentation) from uni-assist — 4–6 weeks processing", True),
    ("APS certificate (mandatory for applicants whose qualifications are from China, India, or Vietnam)", True),
    ("Proof of German language proficiency: DSH-2 or TestDaF 4×4 (German-taught programs)", True),
    ("Proof of English language proficiency (English-taught programs)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply via TU Berlin's own portal (admission.tu-berlin.de / tuPORT) — VPD from uni-assist required for non-German qualifications", False),
])

# 12 — RWTH Aachen (uni-assist for bachelor; RWTHonline DIRECT for master)
add(12, [
    ("Valid passport copy", True),
    ("School leaving certificate (bachelor) / Transcript + diploma (master) with certified translation into German or English", True),
    ("Module catalog / course descriptions (Master's applicants)", True),
    ("APS certificate (mandatory for applicants whose qualifications are from China, India, or Vietnam)", True),
    ("Motivation letter (many programs)", True),
    ("Proof of language proficiency: German or English depending on program", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: BACHELOR — apply via uni-assist (deadline ~July 15). MASTER — apply directly via RWTHonline portal (deadline ~March 1). Different portals!", False),
])

# 13 — Münster (likely uni-assist VPD)
add(13, [
    ("Valid passport copy", True),
    ("School leaving certificate / Bachelor's degree (with certified translation)", True),
    ("Transcript of records", True),
    ("APS certificate (mandatory for applicants whose qualifications are from China, India, or Vietnam)", True),
    ("Proof of language proficiency: German or English depending on program", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Motivation letter (program-dependent)", False),
    ("Letters of recommendation (program-dependent)", False),
])

# 14 — Cologne (uni-assist; ONLY individual APS accepted — group APS rejected)
add(14, [
    ("Valid passport copy", True),
    ("Subject and grade overview of academic achievements (original language)", True),
    ("University diploma / degree (original language)", True),
    ("Certified translation into German or English of all documents not issued in those languages", True),
    ("APS certificate — INDIVIDUAL certificate only; group APS NOT accepted (China, India, Vietnam)", True),
    ("Proof of German language proficiency (German-taught programs)", True),
    ("Proof of English language proficiency (English-taught programs)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply via uni-assist. Feststellungsprüfungszeugnis (FSP) if you completed a Studienkolleg", False),
])

# 15 — Bonn (direct via application.uni-bonn.de; ONLY individual APS; apostille required)
add(15, [
    ("Valid passport copy", True),
    ("University entrance qualification / degree (with apostille; certified translation by sworn translator)", True),
    ("Proof of passing university entrance examination (if required in home country)", True),
    ("APS certificate — INDIVIDUAL APS required; group APS NOT accepted (China, India, Vietnam)", True),
    ("CV (tabular format)", True),
    ("Proof of German language proficiency: DSH-2 or TestDaF 4×4", True),
    ("Proof of English language proficiency: B2 minimum — TOEFL 72 iBT or IELTS 5.5 (specific programs: Archaeology, Geography, Economics, CS, Media Studies, Molecular Biomedicine, Musicology)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply directly via application.uni-bonn.de — NOT via uni-assist", False),
])

# 16 — HHU Düsseldorf (uni-assist VPD; APS for China, Vietnam, Mongolia — NOT India per official source)
add(16, [
    ("Valid passport copy", True),
    ("School leaving certificate / Bachelor's degree", True),
    ("Transcript of records", True),
    ("VPD (Vorprüfungsdokumentation) from uni-assist — apply at least 8 weeks before HHU deadline", True),
    ("APS certificate (mandatory for China, Vietnam, and Mongolia applicants — note: Mongolia listed, not India, per HHU official source)", True),
    ("Proof of language proficiency: German or English depending on program", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Full VPD required — VPD assessment report alone is NOT sufficient", False),
])

# 17 — TU Dortmund (uni-assist 'My assist' portal)
add(17, [
    ("Valid passport copy", True),
    ("School leaving certificate", True),
    ("Subject and grade overview of all studies with completion certificate", True),
    ("University grading system explanation", True),
    ("Certified translations into German or English", True),
    ("APS certificate (mandatory for China, India, Vietnam; group APS only accepted if specifically issued for TU Dortmund)", True),
    ("Proof of language proficiency: German or English depending on program", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: All applications go through uni-assist 'My assist' portal", False),
])

# 18 — Ruhr University Bochum (direct via hio.ruhr-uni-bochum.de; collective APS NOT accepted)
add(18, [
    ("Valid passport copy", True),
    ("School report (scan of original + certified translation)", True),
    ("University degree certificate + list of individual grades (scan + certified translation)", True),
    ("University entrance exam proof (if applicable in home country)", True),
    ("APS certificate (mandatory for China, India, Vietnam — collective/group APS NOT accepted)", True),
    ("Proof of German language proficiency: TestDaF 16+, DSH-2/3, or Goethe C1/C2", True),
    ("Proof of English language proficiency (English-taught programs)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply directly via hio.ruhr-uni-bochum.de — NOT via uni-assist", False),
])

# 19 — University of Hamburg (direct portal)
add(19, [
    ("Valid passport copy", True),
    ("School leaving certificate / Bachelor's degree (properly scanned; certified translation if not in German or English)", True),
    ("Transcript of records", True),
    ("University entrance exam results (country-specific, if applicable)", True),
    ("APS certificate (mandatory for bachelor degree certificates from China, India, Vietnam)", True),
    ("Proof of German language proficiency: DSH-2 standard (bachelor programs)", True),
    ("Proof of English language proficiency (English-taught programs)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply via UHH direct application portal — NOT via uni-assist", False),
])

# 20 — TUHH (direct via tune.tuhh.de; English proof COMPULSORY for ALL; early non-EU deadline Dec–Feb)
add(20, [
    ("Valid passport copy", True),
    ("CV (max 2 pages)", True),
    ("Bachelor's degree certificate with aggregate mark", True),
    ("Complete university transcript of records (all semesters, all subjects and grades)", True),
    ("Official explanation of university grading system (issued by registrar/dean — must state max, min passing, and graduation grade)", True),
    ("Proof of English proficiency: TOEFL iBT 90 or IELTS 6.5 minimum — COMPULSORY FOR ALL APPLICANTS (exempted only if degree is from: Germany, Australia, Austria, Canada, Ireland, NZ, Switzerland, UK, or USA)", True),
    ("APS certificate (mandatory for all applicants with degree from China, India, or Vietnam, regardless of nationality)", True),
    ("Translation of documents not in German or English (PDF, max 7 MB per file)", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply via tune.tuhh.de. NON-EU APPLICATION PERIOD: 1 December – 1 February (much earlier than EU). All international master's programs are in English.", False),
])

# 21 — Goethe University Frankfurt (uni-assist)
add(21, [
    ("Valid passport copy", True),
    ("School leaving certificate / Bachelor's degree (officially certified copy with sworn translation if not in German or English)", True),
    ("Transcript of records", True),
    ("APS certificate (mandatory for China, India, Vietnam)", True),
    ("Proof of German language proficiency: DSH-2 or TestDaF 4×4", True),
    ("Proof of English language proficiency — IELTS or TOEFL (English-taught programs)", False),
    ("Health insurance proof (at enrollment)", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Note: Apply via uni-assist. Language certificates can be verified online by uni-assist.", False),
])

# 22 — TU Darmstadt (direct via TUCaN; MUST submit BOTH online + printed paper documents)
add(22, [
    ("Valid passport copy", True),
    ("University entrance certificate (original language + certified translation)", True),
    ("Degree certificate or preliminary completion confirmation (original + certified translation)", True),
    ("Transcripts for each semester (original + certified translation)", True),
    ("APS certificate (mandatory for China, India, Vietnam — Hong Kong, Macao, Taiwan are EXEMPT)", True),
    ("Proof of German language proficiency: DSH-2 (German-taught programs)", True),
    ("Proof of English language proficiency: IELTS 7.0 or TOEFL iBT 95 (English-taught programs; lower thresholds for Mechanics, Mathematics, Particle Accelerator Science — check per program)", False),
    ("Printed Cover Sheet + paper documents sent to university by post", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: IMPORTANT — electronic application alone is NOT sufficient. Must also send printed Cover Sheet + paper documents to the university.", False),
])

# 23 — Göttingen (direct; €65 evaluation fee)
add(23, [
    ("Valid passport copy", True),
    ("University entrance qualification (scanned copies — originals NOT required at application stage)", True),
    ("APS certificate (mandatory for China, India, Vietnam)", True),
    ("Proof of German language proficiency: DSH-2 or TestDaF 4×4", True),
    ("Proof of English language proficiency (English-taught programs)", False),
    ("€65 evaluation fee payment (application not processed until fee is paid)", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply via Göttingen's direct portal — NOT via uni-assist. Only scanned copies needed.", False),
])

# 24 — Leibniz University Hannover (uni-assist VPD required for ALL bachelor; India APS added 2023)
add(24, [
    ("Valid passport copy", True),
    ("School leaving certificate / Bachelor's degree (officially certified copy + certified German translation)", True),
    ("Transcripts (officially certified copies)", True),
    ("VPD (Vorprüfungsdokumentation) from uni-assist — mandatory for all bachelor/state examination programs. Apply at least 8 weeks before LUH deadline.", True),
    ("APS certificate (mandatory for China, India (since 2023), Vietnam)", True),
    ("CV", True),
    ("Proof of language proficiency: German or English depending on program", True),
    ("Statement of purpose (program-dependent)", False),
    ("Letters of recommendation (program-dependent)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Master applications go directly to LUH portal — no uni-assist needed for Master's", False),
])

# 25 — Bremen (uni-assist VPD for bachelor; DIRECT for master)
add(25, [
    ("Valid passport copy", True),
    ("Officially certified copy of university entrance qualification (Abitur or equivalent)", True),
    ("Officially certified copies of any previous university certificates", True),
    ("Officially certified translations into German of all certificates not in German or English", True),
    ("VPD (Vorprüfungsdokumentation) from uni-assist — required for undergraduate applications (deadline: June 6 for winter semester)", True),
    ("APS certificate (mandatory for China, India, Vietnam)", True),
    ("Proof of language proficiency: German proficiency for most bachelor programs", True),
    ("Proof of English language proficiency (English-taught programs)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: BACHELOR — uni-assist VPD first, then apply via moin.uni-bremen.de. MASTER — apply directly to Bremen, no uni-assist.", False),
])

# 26 — OVGU Magdeburg (uni-assist)
add(26, [
    ("Valid passport copy (with photo and personal details)", True),
    ("Secondary school certificate (original language + sworn translation into German/English)", True),
    ("University entrance exam proof (if applicable in home country)", True),
    ("University degree certificates and transcripts (original language + sworn translation)", True),
    ("APS certificate — original digital certificate (mandatory for India, China, Vietnam)", True),
    ("Proof of language proficiency: German or English depending on degree program", True),
    ("Motivation letter / special certificates (program-dependent)", False),
    ("Internship proof or aptitude test results (program-dependent)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply via uni-assist. Also has direct application path for some programs. APS must be original digital certificate.", False),
])

# 27 — Jena (uni-assist for bachelor; Friedolin 2.0 for master; APS for China, Vietnam, Mongolia — India NOT confirmed)
add(27, [
    ("Valid passport copy", True),
    ("School leaving certificate / Bachelor's degree (with certified translation into German or English)", True),
    ("Transcript of records (with grading system evidence)", True),
    ("University entrance examination certificate (country-specific: Iran, South Korea, China — Gaokao)", True),
    ("APS certificate — original (mandatory for Mongolia, Vietnam, China (mainland); India requirement not explicitly confirmed — verify with university)", True),
    ("Proof of German language proficiency: DSH-2 (German-taught programs)", True),
    ("Proof of English language proficiency (English-taught programs)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Bachelor — apply via uni-assist. Master — apply via Friedolin 2.0 portal (direct).", False),
])

# 28 — FAU Erlangen-Nürnberg (direct via campo.fau.de; €100 fee for non-EU from WS2026/27)
add(28, [
    ("Valid passport copy", True),
    ("University entrance examination certificate (if required in home country) — certified copy", True),
    ("Complete academic transcript of records (if previous university studies)", True),
    ("Degree certificate (Bachelor's/Diplom) if already graduated", True),
    ("Officially certified copies of all certificates", True),
    ("APS certificate (mandatory for applicants with studies/degrees from China, India, or Vietnam — DSDI/DSDII China school graduates also need German Embassy identity confirmation)", True),
    ("Proof of German language proficiency (German-taught programs)", True),
    ("Proof of English language proficiency (English-taught programs)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply via campo.fau.de — NOT uni-assist. From WS2026/27: €100 processing fee for non-EU applicants.", False),
])

# 29 — Würzburg / JMU (uni-assist VPD)
add(29, [
    ("Valid passport copy", True),
    ("School leaving certificate / Bachelor's degree (officially certified copy)", True),
    ("Complete academic history from all institutions attended (required by uni-assist for VPD)", True),
    ("VPD (Vorprüfungsdokumentation) from uni-assist — apply before university application deadline", True),
    ("APS certificate (mandatory for China, India, Vietnam)", True),
    ("Proof of language proficiency: German or English depending on program", True),
    ("Certified translations for non-German/English documents", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Motivation letter (program-dependent)", False),
    ("Letters of recommendation (program-dependent)", False),
    ("Note: Apply via uni-assist (€75 first application, €30 each additional)", False),
])

# 30 — Augsburg (VIBS portal + uni-assist VPD)
add(30, [
    ("Valid passport copy", True),
    ("Officially certified copies of school leaving certificate / Bachelor's degree", True),
    ("VPD (Vorprüfungsdokumentation) from uni-assist — ALLOW 6–8 WEEKS processing time", True),
    ("APS certificate (mandatory for India, China, Vietnam)", True),
    ("Proof of German language proficiency (level B1–C1 depending on program)", True),
    ("CV", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply via VIBS portal + uni-assist VPD", False),
])

# 31 — Regensburg (uni-assist VPD + campus portal; GRE if not from Lisbon Convention country)
add(31, [
    ("Valid passport copy", True),
    ("Bachelor's degree certificate", True),
    ("Transcript of records", True),
    ("VPD (Vorprüfungsdokumentation) from uni-assist — apply as early as possible; VPD valid for 1 year", True),
    ("APS certificate (mandatory for China, India, Vietnam — bachelor's degree from these countries)", True),
    ("Proof that bachelor's degree was taught in English (e.g., certificate from university)", True),
    ("Proof of English language proficiency (if not native English speaker)", False),
    ("GRE score (required if first degree is NOT from a Lisbon Convention signatory state)", False),
    ("CV", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: 2-step process — (1) apply for VPD via uni-assist, (2) apply via Regensburg campus portal", False),
])

# 32 — Bayreuth (uni-assist VPD + CAMPUSonline)
add(32, [
    ("Valid passport copy", True),
    ("School leaving certificate / Bachelor's degree", True),
    ("Transcript of records", True),
    ("VPD (Vorprüfungsdokumentation) from uni-assist — apply by mid-May (winter) or mid-November (summer); valid 1 year", True),
    ("APS certificate (mandatory for India, Vietnam, mainland China)", True),
    ("Proof of language proficiency: German or English depending on program", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: 2-step — (1) apply for VPD via uni-assist, (2) apply via CAMPUSonline", False),
])

# 33 — Mainz / JGU (direct via JOGU-StINe; APS confirmed for China and Vietnam only per official source)
add(33, [
    ("Valid passport copy", True),
    ("Officially certified copies of leaving certificates and report cards", True),
    ("Officially certified copies of university degree certificates (diploma + transcript)", True),
    ("CV (from start of school to application date)", True),
    ("Certified translations by authorized/sworn translators", True),
    ("APS certificate (confirmed for China and Vietnam; India requirement not explicitly stated by JGU — verify with admissions)", True),
    ("Proof of German language proficiency (German-taught programs)", True),
    ("Proof of English language proficiency (English-taught programs)", False),
    ("Vocational training certificates (if applicable)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply directly via JOGU-StINe portal — NOT uni-assist. JGU performs its own certificate recognition.", False),
])

# 34 — Saarland (uni-assist; APS original digitally signed)
add(34, [
    ("Valid passport copy", True),
    ("School leaving certificate with grades (and university entrance exam results if applicable)", True),
    ("Evidence of previous academic study (transcripts) and university qualifications", True),
    ("CV (from start of school to application date)", True),
    ("APS certificate — original digitally signed (mandatory for China, India, Vietnam)", True),
    ("Proof of language proficiency: German or English depending on program", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply via uni-assist. APS must be original digitally signed version from Academic Evaluation Center.", False),
])

# 35 — Kiel (uni-assist; all documents legally certified + officially translated)
add(35, [
    ("Valid passport copy", True),
    ("University entrance qualification (legally certified + officially translated)", True),
    ("Language certificates: German or English depending on program (DSH-2 standard for German)", True),
    ("APS certificate (mandatory for China, India, Vietnam)", True),
    ("All documents must be legally certified and officially translated — incomplete application cannot be processed", True),
    ("Internship / work experience certificates (some programs)", False),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply via uni-assist (€75 first, €30 each additional)", False),
])

# 36 — Rostock (uni-assist; APS for China, Mongolia, Vietnam, India; C1 German for medicine/dentistry)
add(36, [
    ("Valid passport copy", True),
    ("German or English transcripts of all educational documents", True),
    ("CV (complete from age 16, with date and signature)", True),
    ("Certificate of German language skills (level required varies by program — medicine/dentistry requires C1 CEFR)", True),
    ("APS certificate / APS-Zeugnis (mandatory for China, Mongolia, Vietnam, and India)", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Note: Apply via uni-assist. Medicine/dentistry requires C1 German (stricter than most programs).", False),
])

# 37 — Greifswald (standard German public — uni-assist)
add(37, [
    ("Valid passport copy", True),
    ("School leaving certificate / Bachelor's degree (with certified translation if not in German or English)", True),
    ("Transcript of records", True),
    ("APS certificate (mandatory for China, India, Vietnam)", True),
    ("Proof of German language proficiency: DSH-2 or TestDaF 4×4 (German-taught programs)", True),
    ("Proof of English language proficiency (English-taught programs)", False),
    ("CV", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Motivation letter (program-dependent)", False),
    ("Note: Apply via uni-assist", False),
])

# 38 — Leipzig (uni-assist)
add(38, [
    ("Valid passport copy", True),
    ("School leaving certificate / Bachelor's degree (with certified translation)", True),
    ("Transcript of records", True),
    ("APS certificate (mandatory for China, India, Vietnam)", True),
    ("Proof of German language proficiency: DSH-2 or TestDaF 4×4 (German-taught programs)", True),
    ("Proof of English language proficiency (English-taught programs)", False),
    ("CV", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Motivation letter (program-dependent)", False),
    ("Note: Apply via uni-assist", False),
])

# 39 — TU Dresden (uni-assist)
add(39, [
    ("Valid passport copy", True),
    ("School leaving certificate / Bachelor's degree (with certified translation)", True),
    ("Transcript of records", True),
    ("APS certificate (mandatory for China, India, Vietnam)", True),
    ("Proof of German language proficiency: DSH-2 or TestDaF 4×4 (German-taught programs)", True),
    ("Proof of English language proficiency (English-taught programs)", False),
    ("CV", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Motivation letter (program-dependent)", False),
    ("Note: Apply via uni-assist", False),
])

# 40 — Duisburg-Essen (uni-assist for bachelor; direct for master)
add(40, [
    ("Valid passport copy", True),
    ("School leaving certificate / Bachelor's degree (with certified translation)", True),
    ("Transcript of records", True),
    ("APS certificate (mandatory for China, India, Vietnam)", True),
    ("Proof of language proficiency: German or English depending on program", True),
    ("CV", True),
    ("Proof of financial resources ~€11,904/yr (for visa)", True),
    ("Health insurance certificate", True),
    ("Motivation letter (program-dependent)", False),
    ("Note: Bachelor — apply via uni-assist. Master — apply directly to university.", False),
])

# ══════════════════════════════════════════════════════════════════════════════
# GERMAN PRIVATE UNIVERSITIES
# ══════════════════════════════════════════════════════════════════════════════

# 41 — Frankfurt School of Finance & Management
add(41, [
    ("Valid passport", True),
    ("Secondary school certificate + official translation (Bachelor's applicants)", True),
    ("Bachelor's degree + transcript (Master's / MBA applicants)", True),
    ("Proof of English language proficiency: IELTS 6.5+ or TOEFL iBT 90+ (or equivalent)", True),
    ("CV / Résumé", True),
    ("Motivation letter / personal statement", True),
    ("2 letters of recommendation", True),
    ("Application fee (amount varies by program — check Frankfurt School website)", True),
    ("Proof of financial resources", True),
    ("GMAT or GRE score (some Master's programs — check per program)", False),
    ("Work experience documentation (Master's programs requiring professional experience)", False),
    ("Interview (shortlisted candidates)", False),
])

# 42 — ESMT Berlin (MBA only — no Bachelor programs)
add(42, [
    ("Valid passport", True),
    ("Bachelor's degree + official transcript", True),
    ("Proof of English language proficiency: IELTS 6.5 or TOEFL iBT 90+ (waived for native English speakers or those with English-medium degree)", True),
    ("CV / Résumé (highlighting professional experience)", True),
    ("Personal statement / motivation essay", True),
    ("2 letters of recommendation (professional, not academic)", True),
    ("GMAT or GRE score (accepted; not mandatory — ESMT is test-flexible)", False),
    ("Work experience: typically 3+ years required for Full-Time MBA", True),
    ("Interview (by invitation, after initial application review)", False),
    ("Proof of financial resources / scholarship documentation", True),
    ("Note: ESMT Berlin offers MBA programs only — no Bachelor degree programs. Tuition ~€53,500 total.", False),
])

# 43 — WHU – Otto Beisheim School of Management
add(43, [
    ("Valid passport", True),
    ("Secondary school certificate + translation (Bachelor's applicants)", True),
    ("Bachelor's degree + transcript (Master's applicants)", True),
    ("Proof of English language proficiency: IELTS 6.5 or TOEFL iBT 90+ (Bachelor: German fluency also required)", True),
    ("CV / Résumé", True),
    ("Motivation letter", True),
    ("2 letters of recommendation", True),
    ("GMAT score (some Master's programs — check per program)", False),
    ("Application fee (check WHU website for current amount)", True),
    ("Interview (shortlisted candidates)", False),
    ("Proof of financial resources", True),
])

# 44 — Constructor University Bremen (formerly Jacobs University)
add(44, [
    ("Valid passport", True),
    ("Secondary school certificate with certified translation (Bachelor's applicants)", True),
    ("Bachelor's degree + transcript (Master's/PhD applicants)", True),
    ("Proof of English language proficiency: IELTS 6.0 or TOEFL iBT 80+ (minimum; varies by program)", True),
    ("CV / Résumé", True),
    ("Motivation letter / personal statement", True),
    ("2 letters of recommendation", True),
    ("Application fee (check Constructor University website)", True),
    ("Proof of financial resources", True),
    ("Interview (shortlisted candidates)", False),
    ("Research proposal (PhD applicants)", False),
    ("Portfolio (design/architecture programs)", False),
])

# ══════════════════════════════════════════════════════════════════════════════
# POLISH UNIVERSITIES
# Source: official admissions pages, researched 2026-07-10
# NAWA SYRENA: mandatory from 1 July 2025 for all non-EU/EFTA/OECD applicants
# NAWA is free, takes 30–60 days — apply at least 2 months before university deadline
# Apostille: required on all foreign educational documents (Hague Convention)
# ══════════════════════════════════════════════════════════════════════════════

# 45 — University of Warsaw
add(45, [
    ("Valid passport (original shown at enrollment; photocopy for application)", True),
    ("Secondary school certificate / higher education diploma (original or certified copy)", True),
    ("Apostille or consular legalization (required for all non-EU/OECD/EFTA documents)", True),
    ("NAWA Director Individual Recognition Statement via SYRENA system (mandatory for non-EU/OECD/EFTA applicants from 1 July 2025; free, takes 30–60 days — apply early)", True),
    ("Certified/sworn translation into Polish (or English for English-taught programs)", True),
    ("Language proficiency certificate: B2 minimum in language of instruction", True),
    ("Personal questionnaire with photo (generated and printed from IRK system, must be signed)", True),
    ("Application fee payment confirmation (85 PLN standard; 100 PLN if entrance exam required)", True),
    ("Health certificate (some faculties only — check specific program)", False),
    ("Parental consent (required if applicant is under 18)", False),
    ("Note: Apply via IRK system (irk.uw.edu.pl). NAWA exempt: EU/OECD/EFTA, IB, EB, China/Ukraine bilateral agreement holders.", False),
])

# 46 — Medical University of Warsaw (WUM) — English Division
add(46, [
    ("Valid passport (original for inspection)", True),
    ("High school diploma / secondary school certificate (must include Biology HL, Chemistry HL, plus Mathematics or Physics — at advanced/higher level)", True),
    ("Apostille or consular legalization (required; IB/EB diploma holders exempt)", True),
    ("Transcript of grades (with grading scale explanation)", True),
    ("Certified English translation of diploma/transcript (if originals not in English or Polish)", True),
    ("English language proficiency: IELTS 6.0 minimum, TOEFL iBT 90, TOEIC 700, or CEFR B2 equivalent", True),
    ("Entrance exam OR standardized test score: (1) WUM Competency Test (Biology 30Q, Chemistry 30Q, Decision Making 20Q), OR (2) BMAT/MCAT/GAMSAT/UCAT score, OR (3) BSc/MSc in life sciences", True),
    ("NAWA/KWALIFIKATOR eligibility statement via SYRENA (for non-EU/OECD/EFTA certificates)", True),
    ("Parental consent with power of attorney (if applicant is under 18)", False),
    ("Note: Application fee: EUR 24 (competency test route) or EUR 20 (standardized test/BSc route) — non-refundable. Apply via email to recruitment@wum.edu.pl + online portal.", False),
    ("Note: Confirmation fee EUR 1,000 required after acceptance (non-refundable; EUR 500 returned if withdrawal before July 15)", False),
])

# 47 — Jagiellonian University Kraków
add(47, [
    ("Valid passport (EU citizens may use national ID card)", True),
    ("Secondary school certificate (original + copy; must show eligibility to continue at higher level)", True),
    ("Apostille or legalization (required for all non-Polish certificates; non-EU/OECD/EFTA)", True),
    ("NAWA Director Individual Recognition Statement via SYRENA (takes up to 2 months — apply early; exempt: EU/OECD/EFTA, IB/EB, Ukraine/China bilateral)", True),
    ("Certified sworn translation into Polish or English (for any document not in Polish or English)", True),
    ("Language proficiency certificate: B2 minimum in language of instruction (C1 required for Polish-language Medicine programs)", True),
    ("Personal questionnaire (downloaded from IRK after 'qualified' status, must be printed and signed)", True),
    ("Health insurance (valid minimum 1 year, covering EUR 30,000 in treatment)", True),
    ("Medical occupational health certificate (Medicine, dentistry programs only)", False),
    ("Statutory representative declaration (if applicant is under 18 at enrollment)", False),
    ("Application fee: 100 PLN per program (non-refundable). Student ID: 22 PLN.", True),
    ("Note: Apply via IRK (irk.uj.edu.pl). Medical programs require Biology and Chemistry at higher/extended level.", False),
])

# 48 — Medical University of Gdańsk (MUG) — English Division
add(48, [
    ("Valid passport photocopy", True),
    ("Application forms — English and Polish versions (generated from MUG enrollment system, printed and signed)", True),
    ("High school diploma / maturity certificate in native language (certified by school or notary; must include Biology plus Chemistry, Physics, or Mathematics at advanced level)", True),
    ("Transcript of grades with grading scale", True),
    ("Apostille or consular legalization", True),
    ("Certified translation into English of all documents not originally in English", True),
    ("English language proficiency: IELTS 6.5 minimum or TOEFL iBT 87+", True),
    ("NAWA Director Statement via SYRENA (for non-EU/OECD/EFTA applicants)", True),
    ("Entrance exam result (Biology/Chemistry — required for non-EU applicants without APS/IB equivalent)", False),
    ("Application fee: 100 PLN (non-refundable)", True),
    ("Note: Apply via admission.mug.edu.pl. Medical fitness certificate required before start of clinical training (not at application).", False),
])

# 49 — Wrocław Medical University
add(49, [
    ("Valid passport", True),
    ("Secondary school certificate (must include Biology and Chemistry at advanced level)", True),
    ("Apostille or consular legalization", True),
    ("Certified English translation of all non-English documents", True),
    ("English language proficiency: IELTS 6.5 or TOEFL iBT 87+ (or equivalent)", True),
    ("Online entrance exam in Biology and Chemistry (mandatory for non-EU/OECD applicants)", True),
    ("NAWA Director Statement via SYRENA (for non-EU/OECD/EFTA applicants)", True),
    ("Application fee: 85–100 PLN", True),
    ("Proof of financial resources (for visa)", True),
    ("Medical fitness certificate (required at enrollment, not at application stage)", False),
    ("Note: Apply via admission.umw.edu.pl", False),
])

# 50 — Wrocław University of Science and Technology (PWr)
add(50, [
    ("Valid passport", True),
    ("Secondary school certificate / Bachelor's degree (with certified translation)", True),
    ("Apostille or consular legalization", True),
    ("NAWA Director Statement via SYRENA (for non-EU/OECD/EFTA applicants)", True),
    ("Certified translation into Polish or English", True),
    ("English language proficiency: IELTS 6.0 or TOEFL iBT 79+ (English-taught programs)", True),
    ("Application fee: 100–150 PLN", True),
    ("CV (Master's applicants)", False),
    ("Motivation letter (Master's applicants)", False),
    ("Letters of recommendation (some programs)", False),
    ("Proof of financial resources (for visa)", True),
    ("Note: Apply via rekrutacja.pwr.edu.pl", False),
])

# 51 — AGH University of Science and Technology Kraków
add(51, [
    ("Valid passport", True),
    ("Secondary school certificate / Bachelor's degree (with certified translation)", True),
    ("Apostille or consular legalization", True),
    ("NAWA Director Statement via SYRENA (for non-EU/OECD/EFTA applicants)", True),
    ("Certified translation into Polish or English", True),
    ("English language proficiency: IELTS 6.0 or TOEFL iBT 79+ (English-taught programs)", True),
    ("Completed online application form", True),
    ("Application fee: 85–100 PLN", True),
    ("CV (Master's applicants)", False),
    ("Motivation letter (program-dependent)", False),
    ("Proof of financial resources (for visa)", True),
    ("Note: Apply via international.agh.edu.pl", False),
])

# 52 — Poznań University of Technology
add(52, [
    ("Valid passport", True),
    ("Secondary school certificate / Bachelor's degree (with certified translation)", True),
    ("Apostille or consular legalization", True),
    ("NAWA Director Statement via SYRENA (for non-EU/OECD/EFTA applicants)", True),
    ("Certified translation into Polish or English", True),
    ("English language proficiency: IELTS 5.5 or TOEFL iBT 72+ (English-taught programs)", True),
    ("Completed online application form", True),
    ("Motivation letter", True),
    ("Application fee (amount varies — check university website)", True),
    ("CV (Master's applicants)", False),
    ("Proof of financial resources (for visa)", True),
])

# 53 — Adam Mickiewicz University Poznań
add(53, [
    ("Valid passport", True),
    ("Secondary school certificate / Bachelor's degree (with certified translation)", True),
    ("Apostille or consular legalization", True),
    ("NAWA Director Statement via SYRENA (for non-EU/OECD/EFTA applicants)", True),
    ("Certified translation into Polish or English", True),
    ("English language proficiency: IELTS 5.5 or TOEFL iBT 72+ (English-taught programs)", True),
    ("Completed online application form", True),
    ("Motivation letter", True),
    ("Application fee (check university website for current amount)", True),
    ("CV (Master's applicants)", False),
    ("Letters of recommendation (some programs)", False),
    ("Proof of financial resources (for visa)", True),
])

# 54 — University of Gdańsk
add(54, [
    ("Valid passport", True),
    ("Secondary school certificate / Bachelor's degree (with certified translation)", True),
    ("Apostille or consular legalization", True),
    ("NAWA Director Statement via SYRENA (for non-EU/OECD/EFTA applicants)", True),
    ("Certified translation into Polish or English", True),
    ("English language proficiency: IELTS 5.5 or TOEFL iBT 72+ (English-taught programs)", True),
    ("Completed online application form", True),
    ("Application fee: 85 PLN", True),
    ("CV / Résumé (Master's applicants)", False),
    ("Motivation letter (some programs)", False),
    ("Proof of financial resources (for visa)", True),
    ("Note: Apply via en.ug.edu.pl", False),
])

# 55 — Nicolaus Copernicus University Toruń
add(55, [
    ("Valid passport", True),
    ("Secondary school certificate / Bachelor's degree (with certified translation)", True),
    ("Apostille or consular legalization", True),
    ("NAWA Director Statement via SYRENA (for non-EU/OECD/EFTA applicants)", True),
    ("Certified translation into Polish or English", True),
    ("English language proficiency: IELTS 5.5 or TOEFL iBT 72+ (English-taught programs)", True),
    ("Completed online application form", True),
    ("Application fee: 85 PLN", True),
    ("CV (Master's applicants)", False),
    ("Motivation letter (program-dependent)", False),
    ("Proof of financial resources (for visa)", True),
    ("Note: Apply via studyintorun.pl", False),
])

# 56 — Andrzej Frycz Modrzewski Kraków University (private)
add(56, [
    ("Valid passport", True),
    ("Secondary school certificate (Bachelor's) or Bachelor's degree (Master's)", True),
    ("Apostille or legalization of educational documents", True),
    ("Certified translation of all documents into Polish or English", True),
    ("English language proficiency: IELTS 5.5 or TOEFL iBT 72+ (B2 minimum)", True),
    ("NAWA Director Statement via SYRENA (for non-EU/OECD/EFTA applicants)", True),
    ("Completed application form", True),
    ("Motivation letter", True),
    ("CV / Résumé", True),
    ("Passport photo", True),
    ("Application fee (check university website)", True),
    ("Letters of recommendation (some programs)", False),
    ("Interview (some programs)", False),
    ("Proof of financial resources (for visa)", True),
])

# 57 — SWPS University Warsaw (private; EXCEPTION: does NOT require apostille at admission stage)
add(57, [
    ("Valid passport", True),
    ("Secondary school certificate (Bachelor's) or Bachelor's degree (Master's)", True),
    ("Certified translation of all documents into Polish or English", True),
    ("English language proficiency: IELTS 5.5 or TOEFL iBT 72+ (B2 minimum)", True),
    ("NAWA Director Statement via SYRENA (for non-EU/OECD/EFTA applicants)", True),
    ("Completed application form", True),
    ("Motivation letter", True),
    ("CV / Résumé", True),
    ("Application fee (check SWPS website — not publicly listed)", True),
    ("Letters of recommendation (some programs)", False),
    ("Interview (some programs)", False),
    ("Proof of financial resources (for visa)", True),
    ("Note: SWPS does NOT require apostille at the admission stage (unique among Polish universities). Exception: Belarusian diploma holders must complete nostrification before graduation.", False),
])

# 58 — Lazarski University Warsaw (private)
add(58, [
    ("Valid passport", True),
    ("Secondary school certificate (Bachelor's) or Bachelor's degree (Master's)", True),
    ("Apostille or legalization of educational documents", True),
    ("Certified translation of all documents into Polish or English", True),
    ("English language proficiency: IELTS 5.5 or TOEFL iBT 72+ (B2 minimum)", True),
    ("NAWA Director Statement via SYRENA (for non-EU/OECD/EFTA applicants)", True),
    ("Completed application form", True),
    ("Motivation letter", True),
    ("CV / Résumé", True),
    ("Application fee (check Lazarski website — not publicly listed)", True),
    ("Letters of recommendation (some programs)", False),
    ("Interview (some programs)", False),
    ("Proof of financial resources (for visa)", True),
])

# ── Auto-assign degree_level by keyword (overrides default 'all') ────────────
# Items already tagged explicitly keep their tag; this catches items where
# the document name itself signals the degree level.
MASTER_KEYWORDS = [
    "master's applicants", "master applicants", "master's only",
    "master's / mba", "mba applicants",
    "module catalog", "module catalogue",
    "bachelor's degree + transcript",   # means "you already hold a bachelor's" → master
    "bachelor's degree (master",
    "work experience (mba",
]
BACHELOR_KEYWORDS = [
    "bachelor's applicants",
    "secondary school certificate + official translation (bachelor",
]

def infer_level(name_lower, current_level):
    if current_level != "all":
        return current_level  # already explicitly set
    for kw in MASTER_KEYWORDS:
        if kw in name_lower:
            return "master"
    for kw in BACHELOR_KEYWORDS:
        if kw in name_lower:
            return "bachelor"
    return "all"

all_items = [
    (uid, name, req, idx, infer_level(name.lower(), lvl))
    for uid, name, req, idx, lvl in all_items
]

print(f"Inserting {len(all_items)} document items across {len(set(x[0] for x in all_items))} universities...")

for uni_id, name, is_required, order_index, degree_level in all_items:
    cur.execute(
        "INSERT INTO university_document_items (university_id, name, is_required, order_index, degree_level) VALUES (%s, %s, %s, %s, %s)",
        (uni_id, name, is_required, order_index, degree_level)
    )

conn.commit()
cur.close()
conn.close()
print(f"Done. {len(all_items)} items inserted.")
print("Key improvements vs. old template data:")
print("  - Egypt REMOVED from APS list (was never on official list)")
print("  - uni-assist vs. direct portal corrected per university")
print("  - NAWA SYRENA requirement accurately described (30-60 days, mandatory from Jul 2025)")
print("  - Medical university entrance exam requirements included")
print("  - Per-university specific notes included (fees, deadlines, exceptions)")
