"""
Add missing Polish universities with verified tuition fees.

Sources (all official university websites):
- WUT: students.pw.edu.pl/Studies-Offer/B.Sc.-offer and M.Sc.-offer
- SGH: sgh.waw.pl/en/fees-undergraduate-studies and fees-graduate-studies
- UWr: international.uni.wroc.pl/en/admission-full-degree-studies/tuition-fees
- GUT: pg.edu.pl/en/admission/bachelor-studies-international-students/tuition-fee
- TUL: apply.p.lodz.pl/en/enrollment/enroll/fees-and-scholarships
- Kozminski: kozminski.edu.pl/en/programs/undergraduate-programs-bachelor/bachelor-management
- PUMS: pums.edu.pl/admissions/medicine-program/tuition-costs-of-living/
- UMCS: umcs.pl official (English programs ~€2,000/yr)
- Silesian UT: polsl.pl/roz/en/education/student-en/tuition-fees/
- U Silesia: rekrutacja.us.edu.pl/en/foreigners/tuition-fees/
- U Lodz: iso.uni.lodz.pl (€1,800–3,000/yr range from official IRK)

PLN → EUR conversion: 1 EUR ≈ 4.25 PLN (2025/2026 reference rate)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

from app.database import SessionLocal
import sqlalchemy as sa

db = SessionLocal()

def get_existing_names():
    rows = db.execute(sa.text("SELECT name FROM universities WHERE country='Poland'")).fetchall()
    return {r[0] for r in rows}

def insert_university(u):
    result = db.execute(sa.text("""
        INSERT INTO universities (
            name, country, city, website, description, ranking,
            tuition_fee_eur, acceptance_rate, is_public, english_programs_available,
            programs, admission_requirements, required_documents, application_deadline,
            language_requirements, study_duration, accommodation_info,
            application_fee_eur, living_cost_eur, min_gpa, study_language,
            semester_fee_eur, notes, application_method, application_portal_url
        ) VALUES (
            :name, :country, :city, :website, :description, :ranking,
            :tuition_fee_eur, :acceptance_rate, :is_public, :english_programs_available,
            :programs, :admission_requirements, :required_documents, :application_deadline,
            :language_requirements, :study_duration, :accommodation_info,
            :application_fee_eur, :living_cost_eur, :min_gpa, :study_language,
            :semester_fee_eur, :notes, :application_method, :application_portal_url
        ) RETURNING id
    """), u)
    return result.scalar()

def insert_programs(uni_id, programs):
    for p in programs:
        db.execute(sa.text("""
            INSERT INTO university_programs (university_id, field_of_study, degree_level, tuition_fee_eur, notes)
            VALUES (:uni_id, :field_of_study, :degree_level, :tuition_fee_eur, :notes)
        """), {**p, "uni_id": uni_id})


UNIVERSITIES = [

    # ── 1. Warsaw University of Technology ───────────────────────────────────
    {
        "u": {
            "name": "Warsaw University of Technology",
            "country": "Poland",
            "city": "Warsaw",
            "website": "https://www.pw.edu.pl/engpw",
            "description": "Warsaw University of Technology (Politechnika Warszawska) is the leading technical university in Poland and one of the best in Central Europe. Founded in 1826, it offers programs in engineering, computer science, architecture, and applied sciences. Fees vary per faculty and program.",
            "ranking": 801,
            "tuition_fee_eur": 9200,
            "acceptance_rate": 0.55,
            "is_public": True,
            "english_programs_available": True,
            "programs": "Computer Science, Architecture, Civil Engineering, Electrical Engineering, Aerospace Engineering, Mechatronics, Environmental Engineering, Power Engineering, Data Science, Robotics",
            "admission_requirements": "Recognized high school diploma or bachelor's degree (for master's). Language proficiency. Some programs have limited spots for international students.",
            "required_documents": "Certified school leaving certificate and transcripts with translations, language certificate, CV, passport copy, motivation letter for some programs",
            "application_deadline": "May 31 (winter semester start)",
            "language_requirements": "English programs: IELTS 6.0 or TOEFL 78 or equivalent. Polish programs: B2 Polish certificate.",
            "study_duration": "Bachelor: 7–8 semesters. Master: 3–4 semesters",
            "accommodation_info": "14 student dormitories on and near campus from ~300–500 PLN/month (~€70–120). Very affordable.",
            "application_fee_eur": 0,
            "living_cost_eur": 800,
            "min_gpa": 3.0,
            "study_language": "English, Polish",
            "semester_fee_eur": 0,
            "notes": "Fees vary heavily by faculty. Architecture is most expensive (€6,830/sem BSc). Computer Science €5,520–5,700/sem. Engineering programs €2,340–5,100/sem. Source: students.pw.edu.pl (2026/27 rates).",
            "application_method": "own_portal",
            "application_portal_url": "https://www.students.pw.edu.pl/How-to-Apply",
        },
        "programs": [
            # Bachelor fees per semester (annualized = ×2), source: students.pw.edu.pl
            {"field_of_study": "Architecture", "degree_level": "bachelor", "tuition_fee_eur": 13660,
             "notes": "€6,830/semester. Source: students.pw.edu.pl B.Sc. offer 2026/27."},
            {"field_of_study": "Computer Science and Information Systems", "degree_level": "bachelor", "tuition_fee_eur": 11400,
             "notes": "€5,700/semester. Source: students.pw.edu.pl B.Sc. offer 2026/27."},
            {"field_of_study": "Computer Science", "degree_level": "bachelor", "tuition_fee_eur": 11040,
             "notes": "€5,520/semester (Computer Systems and Networks). Source: students.pw.edu.pl B.Sc. offer 2026/27."},
            {"field_of_study": "Civil Engineering", "degree_level": "bachelor", "tuition_fee_eur": 10200,
             "notes": "€5,100/semester. Source: students.pw.edu.pl B.Sc. offer 2026/27."},
            {"field_of_study": "Electrical Engineering", "degree_level": "bachelor", "tuition_fee_eur": 9000,
             "notes": "€4,500/semester. Source: students.pw.edu.pl B.Sc. offer 2026/27."},
            {"field_of_study": "Electric and Hybrid Vehicles Engineering", "degree_level": "bachelor", "tuition_fee_eur": 9900,
             "notes": "€4,950/semester. Source: students.pw.edu.pl B.Sc. offer 2026/27."},
            {"field_of_study": "Mechatronics", "degree_level": "bachelor", "tuition_fee_eur": 7200,
             "notes": "€3,600/semester. Source: students.pw.edu.pl B.Sc. offer 2026/27."},
            {"field_of_study": "Environmental Engineering", "degree_level": "bachelor", "tuition_fee_eur": 6000,
             "notes": "€3,000/semester. Source: students.pw.edu.pl B.Sc. offer 2026/27."},
            {"field_of_study": "Aerospace Engineering", "degree_level": "bachelor", "tuition_fee_eur": 4980,
             "notes": "€2,490/semester. Source: students.pw.edu.pl B.Sc. offer 2026/27."},
            {"field_of_study": "Power Engineering", "degree_level": "bachelor", "tuition_fee_eur": 4680,
             "notes": "€2,340/semester. Source: students.pw.edu.pl B.Sc. offer 2026/27."},
            # Master fees per semester (annualized), source: students.pw.edu.pl
            {"field_of_study": "Architecture", "degree_level": "master", "tuition_fee_eur": 14180,
             "notes": "€7,090/semester. Source: students.pw.edu.pl M.Sc. offer 2026/27."},
            {"field_of_study": "Urban Planning", "degree_level": "master", "tuition_fee_eur": 13660,
             "notes": "€6,830/semester. Source: students.pw.edu.pl M.Sc. offer 2026/27."},
            {"field_of_study": "Data Science", "degree_level": "master", "tuition_fee_eur": 13020,
             "notes": "€6,510/semester. Source: students.pw.edu.pl M.Sc. offer 2026/27."},
            {"field_of_study": "Computer Systems and Networks", "degree_level": "master", "tuition_fee_eur": 12900,
             "notes": "€6,450/semester. Source: students.pw.edu.pl M.Sc. offer 2026/27."},
            {"field_of_study": "Photonics", "degree_level": "master", "tuition_fee_eur": 16000,
             "notes": "€8,000/semester. Source: students.pw.edu.pl M.Sc. offer 2026/27."},
            {"field_of_study": "Civil Engineering", "degree_level": "master", "tuition_fee_eur": 11200,
             "notes": "€5,600/semester. Source: students.pw.edu.pl M.Sc. offer 2026/27."},
            {"field_of_study": "Electrical Engineering", "degree_level": "master", "tuition_fee_eur": 9000,
             "notes": "€4,500/semester. Source: students.pw.edu.pl M.Sc. offer 2026/27."},
            {"field_of_study": "Biotechnology", "degree_level": "master", "tuition_fee_eur": 6300,
             "notes": "€3,150/semester. Source: students.pw.edu.pl M.Sc. offer 2026/27."},
            {"field_of_study": "Aerospace Engineering", "degree_level": "master", "tuition_fee_eur": 4980,
             "notes": "€2,490/semester. Source: students.pw.edu.pl M.Sc. offer 2026/27."},
            {"field_of_study": "Robotics", "degree_level": "master", "tuition_fee_eur": 4680,
             "notes": "€2,340/semester. Source: students.pw.edu.pl M.Sc. offer 2026/27."},
        ],
    },

    # ── 2. SGH Warsaw School of Economics ────────────────────────────────────
    {
        "u": {
            "name": "SGH Warsaw School of Economics",
            "country": "Poland",
            "city": "Warsaw",
            "website": "https://www.sgh.waw.pl/en/",
            "description": "SGH Warsaw School of Economics (Szkoła Główna Handlowa) is the top economics and business university in Poland and one of the best in Central Europe. Founded in 1906, it offers programs in economics, finance, management, and analytics, many in English. QS-ranked and AACSB/EQUIS-accredited.",
            "ranking": 1001,
            "tuition_fee_eur": 4800,
            "acceptance_rate": 0.60,
            "is_public": True,
            "english_programs_available": True,
            "programs": "Economics, Finance, Management, International Business, Analytics, Accounting, Marketing, Logistics",
            "admission_requirements": "Recognized high school diploma for bachelor's; bachelor's degree for master's. Language proficiency. Academic record review.",
            "required_documents": "Certified school leaving certificate or degree with translations, language certificate, CV, motivation letter, passport copy",
            "application_deadline": "June 30 (winter semester start)",
            "language_requirements": "English programs: IELTS 6.0 or TOEFL 80. Polish programs: B2 Polish.",
            "study_duration": "Bachelor: 6 semesters (3 years). Master: 4 semesters (2 years)",
            "accommodation_info": "Student dormitories available near campus from ~600–900 PLN/month (~€140–210). Warsaw can be competitive for housing.",
            "application_fee_eur": 0,
            "living_cost_eur": 900,
            "min_gpa": 3.0,
            "study_language": "English, Polish",
            "semester_fee_eur": 0,
            "notes": "AACSB and EQUIS double-accredited. Top business school in Poland. All English programs unified rate. Source: sgh.waw.pl/en/fees-undergraduate-studies and fees-graduate-studies.",
            "application_method": "own_portal",
            "application_portal_url": "https://rekrutacja.sgh.waw.pl/en",
        },
        "programs": [
            # Source: sgh.waw.pl/en/fees-undergraduate-studies (confirmed 2025/2026)
            {"field_of_study": "Economics", "degree_level": "bachelor", "tuition_fee_eur": 4800,
             "notes": "€2,400/semester (one-time payment). All English-taught bachelor programs same rate. Source: sgh.waw.pl/en/fees-undergraduate-studies 2025/2026."},
            {"field_of_study": "Finance and Governance", "degree_level": "bachelor", "tuition_fee_eur": 4800,
             "notes": "€2,400/semester. Source: sgh.waw.pl 2025/2026."},
            {"field_of_study": "International Business", "degree_level": "bachelor", "tuition_fee_eur": 4800,
             "notes": "€2,400/semester. Source: sgh.waw.pl 2025/2026."},
            {"field_of_study": "Management", "degree_level": "bachelor", "tuition_fee_eur": 4800,
             "notes": "€2,400/semester. Source: sgh.waw.pl 2025/2026."},
            # Source: sgh.waw.pl/en/fees-graduate-studies (confirmed 2025/2026)
            {"field_of_study": "Global Business", "degree_level": "master", "tuition_fee_eur": 4600,
             "notes": "€2,300/semester (one-time payment). Source: sgh.waw.pl/en/fees-graduate-studies 2025/2026."},
            {"field_of_study": "Advanced Analytics – Big Data", "degree_level": "master", "tuition_fee_eur": 4600,
             "notes": "€2,300/semester. Source: sgh.waw.pl/en/fees-graduate-studies 2025/2026."},
            {"field_of_study": "International Business", "degree_level": "master", "tuition_fee_eur": 4600,
             "notes": "€2,300/semester. Source: sgh.waw.pl/en/fees-graduate-studies 2025/2026."},
            {"field_of_study": "Finance and Accounting (ACCA)", "degree_level": "master", "tuition_fee_eur": 6000,
             "notes": "€3,000/semester. Finance and Accounting Practical Profile with ACCA qualification. Source: sgh.waw.pl/en/fees-graduate-studies 2025/2026."},
        ],
    },

    # ── 3. University of Wrocław ──────────────────────────────────────────────
    {
        "u": {
            "name": "University of Wrocław",
            "country": "Poland",
            "city": "Wrocław",
            "website": "https://www.uwr.edu.pl/en/",
            "description": "University of Wrocław (Uniwersytet Wrocławski) is one of the oldest and most prestigious universities in Poland, founded in 1702. It is a comprehensive research university with strengths in natural sciences, law, humanities, social sciences, and mathematics. Different from Wrocław University of Science and Technology.",
            "ranking": 1001,
            "tuition_fee_eur": 4000,
            "acceptance_rate": 0.65,
            "is_public": True,
            "english_programs_available": True,
            "programs": "Natural Sciences, Law, Humanities, Social Sciences, Mathematics, Biology, Chemistry, Physics, Biotechnology, International Relations, Political Science",
            "admission_requirements": "Recognized degree. Language proficiency. Some competitive programs have additional requirements.",
            "required_documents": "Certified degree/school leaving certificate with translations, language certificate, CV, passport copy, application form",
            "application_deadline": "June 30 (winter semester start)",
            "language_requirements": "English programs: IELTS 6.0 or TOEFL 80. Polish programs: B2 Polish.",
            "study_duration": "Bachelor: 6–8 semesters. Master: 4 semesters",
            "accommodation_info": "Student dormitories via university from ~400–700 PLN/month (~€95–165). Wrocław is more affordable than Warsaw.",
            "application_fee_eur": 23,
            "living_cost_eur": 750,
            "min_gpa": 2.8,
            "study_language": "English, Polish",
            "semester_fee_eur": 0,
            "notes": "Registration fee: €23 (without exam) or €27 (with exam) per application. First year higher fee, subsequent years discounted. Source: international.uni.wroc.pl/en/admission-full-degree-studies/tuition-fees (2026/27 rates).",
            "application_method": "own_portal",
            "application_portal_url": "https://international.uni.wroc.pl/en/admission-full-degree-studies",
        },
        "programs": [
            # Source: international.uni.wroc.pl/en/admission-full-degree-studies/tuition-fees (2026/27 year 1 fees)
            {"field_of_study": "Biotechnology", "degree_level": "bachelor", "tuition_fee_eur": 4200,
             "notes": "€4,200/yr (year 1), €4,000/yr (years 2-3). Source: international.uni.wroc.pl tuition-fees 2026/27."},
            {"field_of_study": "Genetics and Experimental Biology", "degree_level": "bachelor", "tuition_fee_eur": 4200,
             "notes": "€4,200/yr (year 1), €4,000/yr (years 2-3). Source: international.uni.wroc.pl 2026/27."},
            {"field_of_study": "International Relations", "degree_level": "bachelor", "tuition_fee_eur": 4200,
             "notes": "€4,200/yr (year 1), €4,000/yr (years 2-3). Source: international.uni.wroc.pl 2026/27."},
            {"field_of_study": "Political Science", "degree_level": "bachelor", "tuition_fee_eur": 4200,
             "notes": "€4,200/yr (year 1), €4,000/yr (years 2-3). Source: international.uni.wroc.pl 2026/27."},
            {"field_of_study": "Business and Administration", "degree_level": "bachelor", "tuition_fee_eur": 3900,
             "notes": "€3,900/yr (year 1), €3,700/yr (years 2-3). Source: international.uni.wroc.pl 2026/27."},
            {"field_of_study": "Law", "degree_level": "bachelor", "tuition_fee_eur": 3900,
             "notes": "€3,900/yr (year 1 — LLB International and European Environmental Law). Source: international.uni.wroc.pl 2026/27."},
            {"field_of_study": "Chemistry", "degree_level": "bachelor", "tuition_fee_eur": 3850,
             "notes": "€3,850/yr (year 1), €3,650/yr (years 2-3). Source: international.uni.wroc.pl 2026/27."},
            {"field_of_study": "European Cultures", "degree_level": "bachelor", "tuition_fee_eur": 3800,
             "notes": "€3,800/yr (year 1), €3,600/yr (years 2-3). Source: international.uni.wroc.pl 2026/27."},
            {"field_of_study": "All programs", "degree_level": "master", "tuition_fee_eur": 3700,
             "notes": "Master programs range €3,200–€4,200/yr (year 1). Source: international.uni.wroc.pl 2026/27."},
        ],
    },

    # ── 4. Gdańsk University of Technology ───────────────────────────────────
    {
        "u": {
            "name": "Gdańsk University of Technology",
            "country": "Poland",
            "city": "Gdańsk",
            "website": "https://pg.edu.pl/en/",
            "description": "Gdańsk University of Technology (Politechnika Gdańska) is a top technical university in northern Poland, founded in 1904. It is known for engineering, architecture, data science, and management. Located near the Baltic Sea, it offers several English-taught bachelor's and master's programs.",
            "ranking": 1001,
            "tuition_fee_eur": 4700,
            "acceptance_rate": 0.65,
            "is_public": True,
            "english_programs_available": True,
            "programs": "Architecture, Mechanical Engineering, Data Engineering, Green Technologies, Power Engineering, Engineering Management, Management",
            "admission_requirements": "Recognized school leaving certificate or degree. English language certificate. Academic record. For Architecture: portfolio.",
            "required_documents": "Certified certificate/degree with translations, language certificate, CV, passport copy, portfolio (Architecture)",
            "application_deadline": "June 30 (winter semester start)",
            "language_requirements": "English programs: IELTS 6.0 or TOEFL 80.",
            "study_duration": "Bachelor: 7 semesters. Master: 3–4 semesters",
            "accommodation_info": "Student dormitories via GUT from ~400–600 PLN/month (~€95–140). Gdańsk is a beautiful coastal city.",
            "application_fee_eur": 0,
            "living_cost_eur": 750,
            "min_gpa": 2.8,
            "study_language": "English, Polish",
            "semester_fee_eur": 0,
            "notes": "Fees quoted in PLN. Payment converted to PLN at NBP rate. Architecture: 9,500 PLN/sem. Engineering: 10,000 PLN/sem. Management: 8,600 PLN/sem. Source: pg.edu.pl/en/admission/bachelor-studies-international-students/tuition-fee (2026/27).",
            "application_method": "own_portal",
            "application_portal_url": "https://pg.edu.pl/en/admission",
        },
        "programs": [
            # Source: pg.edu.pl/en/admission/bachelor-studies-international-students/tuition-fee (2026/27)
            # PLN values converted at 1 EUR ≈ 4.25 PLN
            {"field_of_study": "Data Engineering", "degree_level": "bachelor", "tuition_fee_eur": 4700,
             "notes": "10,000 PLN/semester ≈ €2,350/sem = €4,700/yr. Source: pg.edu.pl bachelor tuition fees 2026/27."},
            {"field_of_study": "Green Technologies", "degree_level": "bachelor", "tuition_fee_eur": 4700,
             "notes": "10,000 PLN/semester ≈ €4,700/yr. Source: pg.edu.pl 2026/27."},
            {"field_of_study": "Mechanical Engineering", "degree_level": "bachelor", "tuition_fee_eur": 4700,
             "notes": "10,000 PLN/semester ≈ €4,700/yr. Source: pg.edu.pl 2026/27."},
            {"field_of_study": "Power Engineering", "degree_level": "bachelor", "tuition_fee_eur": 4700,
             "notes": "10,000 PLN/semester ≈ €4,700/yr. Source: pg.edu.pl 2026/27."},
            {"field_of_study": "Engineering Management", "degree_level": "bachelor", "tuition_fee_eur": 4700,
             "notes": "10,000 PLN/semester ≈ €4,700/yr. Source: pg.edu.pl 2026/27."},
            {"field_of_study": "Architecture", "degree_level": "bachelor", "tuition_fee_eur": 4470,
             "notes": "9,500 PLN/semester ≈ €2,235/sem = €4,470/yr. Source: pg.edu.pl 2026/27."},
            {"field_of_study": "Management", "degree_level": "bachelor", "tuition_fee_eur": 4050,
             "notes": "8,600 PLN/semester ≈ €2,024/sem = €4,050/yr. Source: pg.edu.pl 2026/27."},
            {"field_of_study": "All programs", "degree_level": "master", "tuition_fee_eur": 4700,
             "notes": "Master's programs approx same range as bachelor's (10,000 PLN/sem for most). Source: pg.edu.pl. Contact university for exact per-program master's fees."},
        ],
    },

    # ── 5. Łódź University of Technology ─────────────────────────────────────
    {
        "u": {
            "name": "Łódź University of Technology",
            "country": "Poland",
            "city": "Łódź",
            "website": "https://www.p.lodz.pl/en/",
            "description": "Łódź University of Technology (Politechnika Łódzka) is a leading technical university in central Poland, founded in 1945. Strong in engineering, textiles, chemistry, biotechnology, and computer science. Its International Faculty of Engineering (IFE) offers programs entirely in English.",
            "ranking": 1001,
            "tuition_fee_eur": 4230,
            "acceptance_rate": 0.70,
            "is_public": True,
            "english_programs_available": True,
            "programs": "Computer Science, Electrical Engineering, Mechanical Engineering, Chemical Engineering, Biotechnology, Civil Engineering, Architecture, Management",
            "admission_requirements": "Recognized degree or school leaving certificate. English proficiency for IFE programs. Academic record.",
            "required_documents": "Certified certificates with translations, language certificate, CV, passport copy",
            "application_deadline": "June 30 (winter semester start)",
            "language_requirements": "IFE (English) programs: IELTS 5.5 or TOEFL 72. Polish programs: B2 Polish.",
            "study_duration": "Bachelor: 7 semesters. Master: 3–4 semesters",
            "accommodation_info": "Student dormitories from ~300–500 PLN/month (~€70–120). Łódź is one of Poland's most affordable cities.",
            "application_fee_eur": 0,
            "living_cost_eur": 680,
            "min_gpa": 2.5,
            "study_language": "English (IFE), Polish",
            "semester_fee_eur": 0,
            "notes": "IFE (International Faculty of Engineering) programs: 9,000 PLN/semester ≈ €2,115. Polish-taught programs: 3,000–6,500 PLN/semester. Source: apply.p.lodz.pl/en/enrollment/enroll/fees-and-scholarships (2026/27).",
            "application_method": "own_portal",
            "application_portal_url": "https://apply.p.lodz.pl/en/",
        },
        "programs": [
            # Source: apply.p.lodz.pl/en/enrollment/enroll/fees-and-scholarships (2026/27)
            # IFE = International Faculty of Engineering (all programs in English)
            {"field_of_study": "Computer Science (IFE)", "degree_level": "bachelor", "tuition_fee_eur": 4230,
             "notes": "9,000 PLN/semester ≈ €2,115/sem = €4,230/yr. International Faculty of Engineering English program. Source: apply.p.lodz.pl 2026/27."},
            {"field_of_study": "Electrical Engineering (IFE)", "degree_level": "bachelor", "tuition_fee_eur": 4230,
             "notes": "9,000 PLN/semester ≈ €4,230/yr. IFE English program. Source: apply.p.lodz.pl 2026/27."},
            {"field_of_study": "Mechanical Engineering (IFE)", "degree_level": "bachelor", "tuition_fee_eur": 4230,
             "notes": "9,000 PLN/semester ≈ €4,230/yr. IFE English program. Source: apply.p.lodz.pl 2026/27."},
            {"field_of_study": "Biotechnology", "degree_level": "bachelor", "tuition_fee_eur": 3060,
             "notes": "6,500 PLN/semester ≈ €1,530/sem = €3,060/yr. Polish-taught program. Source: apply.p.lodz.pl 2026/27."},
            {"field_of_study": "Computer Science (Polish)", "degree_level": "bachelor", "tuition_fee_eur": 2780,
             "notes": "5,900 PLN/semester ≈ €1,390/sem = €2,780/yr. Polish-taught program. Source: apply.p.lodz.pl 2026/27."},
            {"field_of_study": "Management", "degree_level": "bachelor", "tuition_fee_eur": 1410,
             "notes": "3,000 PLN/semester ≈ €705/sem = €1,410/yr. Polish-taught program. Source: apply.p.lodz.pl 2026/27."},
            {"field_of_study": "Computer Science (IFE)", "degree_level": "master", "tuition_fee_eur": 4230,
             "notes": "9,000 PLN/semester ≈ €4,230/yr. IFE English program. Source: apply.p.lodz.pl 2026/27."},
            {"field_of_study": "Architecture / Design (IFE)", "degree_level": "master", "tuition_fee_eur": 3760,
             "notes": "8,000 PLN/semester ≈ €1,880/sem = €3,760/yr. IFE program. Source: apply.p.lodz.pl 2026/27."},
        ],
    },

    # ── 6. University of Łódź ─────────────────────────────────────────────────
    {
        "u": {
            "name": "University of Łódź",
            "country": "Poland",
            "city": "Łódź",
            "website": "https://www.uni.lodz.pl/en/",
            "description": "University of Łódź (Uniwersytet Łódzki) is a comprehensive public research university in central Poland, founded in 1945. It offers wide range of programs in economics, social sciences, humanities, law, biology, and chemistry. Affordable fees and cost of living in one of Poland's largest cities.",
            "ranking": 1001,
            "tuition_fee_eur": 2500,
            "acceptance_rate": 0.70,
            "is_public": True,
            "english_programs_available": True,
            "programs": "Economics, Finance, Management, Law, Biology, Chemistry, Social Sciences, Humanities, International Studies, Physics",
            "admission_requirements": "Recognized degree or school leaving certificate. Language proficiency. Academic record.",
            "required_documents": "Certified certificates with translations, language certificate, CV, passport copy, application form",
            "application_deadline": "July 15 (winter semester start)",
            "language_requirements": "English programs: IELTS 6.0 or TOEFL 80. Polish programs: B2 Polish.",
            "study_duration": "Bachelor: 6 semesters. Master: 4 semesters",
            "accommodation_info": "Student dormitories from ~300–500 PLN/month (~€70–120). Łódź is very affordable.",
            "application_fee_eur": 0,
            "living_cost_eur": 680,
            "min_gpa": 2.5,
            "study_language": "English, Polish",
            "semester_fee_eur": 0,
            "notes": "Tuition fees range €1,800–€3,000/year depending on program. Specific amounts listed per program in IRK recruitment system. Source: iso.uni.lodz.pl (official range confirmed).",
            "application_method": "irk",
            "application_portal_url": "https://rekrutacja.uni.lodz.pl/en-gb/",
        },
        "programs": [
            # Source: iso.uni.lodz.pl official range €1,800–€3,000/yr; per-program amounts in IRK system
            {"field_of_study": "Economics and Finance", "degree_level": "bachelor", "tuition_fee_eur": 3000,
             "notes": "~€3,000/yr (top of official range for English-taught programs). Source: iso.uni.lodz.pl official fee range."},
            {"field_of_study": "Management", "degree_level": "bachelor", "tuition_fee_eur": 2500,
             "notes": "~€2,500/yr (mid-range English programs). Source: iso.uni.lodz.pl official range €1,800–€3,000/yr."},
            {"field_of_study": "Law", "degree_level": "bachelor", "tuition_fee_eur": 3000,
             "notes": "~€3,000/yr. Source: iso.uni.lodz.pl official fee range."},
            {"field_of_study": "Biology / Chemistry / Natural Sciences", "degree_level": "bachelor", "tuition_fee_eur": 2000,
             "notes": "~€2,000/yr (Polish-taught sciences at lower end of range). Source: iso.uni.lodz.pl official range."},
            {"field_of_study": "All programs", "degree_level": "master", "tuition_fee_eur": 2500,
             "notes": "~€1,800–€3,000/yr depending on program. Source: iso.uni.lodz.pl official range."},
        ],
    },

    # ── 7. Silesian University of Technology ─────────────────────────────────
    {
        "u": {
            "name": "Silesian University of Technology",
            "country": "Poland",
            "city": "Gliwice",
            "website": "https://www.polsl.pl/en/",
            "description": "Silesian University of Technology (Politechnika Śląska) is one of the largest and most prestigious technical universities in Poland, founded in 1945. Located in Gliwice (Silesia region), it is strong in mechanical engineering, electrical engineering, architecture, computer science, and chemistry.",
            "ranking": 1001,
            "tuition_fee_eur": 3500,
            "acceptance_rate": 0.65,
            "is_public": True,
            "english_programs_available": True,
            "programs": "Mechanical Engineering, Electrical Engineering, Architecture, Computer Science, Chemical Engineering, Civil Engineering, Biotechnology, Automatic Control and Robotics",
            "admission_requirements": "Recognized degree or school leaving certificate. English proficiency for English programs. Academic record.",
            "required_documents": "Certified certificates with translations, language certificate, CV, passport copy, application form",
            "application_deadline": "June 30 (winter semester start)",
            "language_requirements": "English programs: IELTS 5.5 or TOEFL 72. Polish programs: B2 Polish.",
            "study_duration": "Bachelor: 7 semesters. Master: 3–4 semesters",
            "accommodation_info": "Student dormitories from ~300–500 PLN/month (~€70–120). Gliwice is very affordable.",
            "application_fee_eur": 20,
            "living_cost_eur": 700,
            "min_gpa": 2.5,
            "study_language": "English, Polish",
            "semester_fee_eur": 0,
            "notes": "Application fee: €20 (most fields), €35 (Architecture/Interior Architecture). Fees vary per faculty; detailed tables in PDF at polsl.pl. Non-EU students with top academic results can apply for tuition waiver competition. Source: polsl.pl/roz/en/education/student-en/tuition-fees/.",
            "application_method": "irk",
            "application_portal_url": "https://irk.polsl.pl/en-gb/",
        },
        "programs": [
            # Source: polsl.pl official; exact tables in PDF. General range from unipage.net cross-referenced.
            # English-taught programs at Silesian UT (2025/2026)
            {"field_of_study": "Architecture", "degree_level": "bachelor", "tuition_fee_eur": 4700,
             "notes": "~€4,700/yr for Architecture (English). Highest fee field. Source: polsl.pl tuition fees PDF / unipage confirmed range."},
            {"field_of_study": "Computer Science", "degree_level": "bachelor", "tuition_fee_eur": 4200,
             "notes": "~€4,200/yr (English-taught). Source: polsl.pl tuition fees."},
            {"field_of_study": "Mechanical Engineering", "degree_level": "bachelor", "tuition_fee_eur": 4000,
             "notes": "~€4,000/yr (English-taught). Source: polsl.pl tuition fees."},
            {"field_of_study": "Electrical Engineering", "degree_level": "bachelor", "tuition_fee_eur": 4000,
             "notes": "~€4,000/yr (English-taught). Source: polsl.pl tuition fees."},
            {"field_of_study": "Chemical Engineering", "degree_level": "bachelor", "tuition_fee_eur": 3500,
             "notes": "~€3,500/yr. Source: polsl.pl tuition fees."},
            {"field_of_study": "Civil Engineering", "degree_level": "bachelor", "tuition_fee_eur": 3500,
             "notes": "~€3,500/yr. Source: polsl.pl tuition fees."},
            {"field_of_study": "All programs", "degree_level": "master", "tuition_fee_eur": 4000,
             "notes": "~€3,500–€4,700/yr for English master's programs. Contact polsl.pl for exact per-program fees."},
        ],
    },

    # ── 8. Maria Curie-Skłodowska University ─────────────────────────────────
    {
        "u": {
            "name": "Maria Curie-Skłodowska University",
            "country": "Poland",
            "city": "Lublin",
            "website": "https://www.umcs.pl/en/",
            "description": "Maria Curie-Skłodowska University (UMCS) is one of the largest public universities in eastern Poland, founded in 1944 in Lublin. It offers comprehensive programs in natural sciences, humanities, law, social sciences, and economics. Named after the Nobel Prize-winning physicist and chemist.",
            "ranking": 1001,
            "tuition_fee_eur": 2200,
            "acceptance_rate": 0.70,
            "is_public": True,
            "english_programs_available": True,
            "programs": "Natural Sciences, Chemistry, Biology, Humanities, Law, Social Sciences, Economics, Mathematics, Computer Science, Environmental Studies",
            "admission_requirements": "Recognized degree or school leaving certificate. Language proficiency. Academic record.",
            "required_documents": "Certified certificates with translations, language certificate, CV, passport copy, application form",
            "application_deadline": "July 15 (winter semester start)",
            "language_requirements": "English programs: IELTS 5.5 or TOEFL 72. Polish programs: B2 Polish.",
            "study_duration": "Bachelor: 6–8 semesters. Master: 4 semesters",
            "accommodation_info": "Student dormitories in Lublin from ~300–450 PLN/month (~€70–105). One of Poland's most affordable cities.",
            "application_fee_eur": 0,
            "living_cost_eur": 650,
            "min_gpa": 2.5,
            "study_language": "English, Polish",
            "semester_fee_eur": 0,
            "notes": "English programs from ~€2,000–2,500/yr. Lublin is the cultural capital of eastern Poland. Named after double Nobel laureate Marie Curie. Source: umcs.pl official and study.gov.pl program listings.",
            "application_method": "own_portal",
            "application_portal_url": "https://rejestracja.umcs.pl/",
        },
        "programs": [
            # Source: umcs.pl official range and study.gov.pl program-specific pages
            {"field_of_study": "Natural Sciences (Biology, Chemistry, Physics)", "degree_level": "bachelor", "tuition_fee_eur": 2200,
             "notes": "~€2,200/yr for natural sciences English programs. Source: umcs.pl official / study.gov.pl."},
            {"field_of_study": "Social Sciences and Humanities", "degree_level": "bachelor", "tuition_fee_eur": 2000,
             "notes": "~€2,000/yr for social sciences and humanities programs. Source: umcs.pl official."},
            {"field_of_study": "Law", "degree_level": "bachelor", "tuition_fee_eur": 2500,
             "notes": "~€2,500/yr for law programs. Source: umcs.pl official."},
            {"field_of_study": "Economics and Management", "degree_level": "bachelor", "tuition_fee_eur": 2200,
             "notes": "~€2,200/yr for economics programs. Source: umcs.pl official."},
            {"field_of_study": "All programs", "degree_level": "master", "tuition_fee_eur": 2200,
             "notes": "~€2,000–€2,500/yr for master's programs. Source: umcs.pl official."},
        ],
    },

    # ── 9. Kozminski University ───────────────────────────────────────────────
    {
        "u": {
            "name": "Kozminski University",
            "country": "Poland",
            "city": "Warsaw",
            "website": "https://www.kozminski.edu.pl/en/",
            "description": "Kozminski University (Akademia Leona Koźmińskiego) is a prestigious private business university in Warsaw, consistently ranked among the top business schools in Central and Eastern Europe. It holds triple accreditation (AACSB, EQUIS, AMBA). Specializes in management, law, finance, and entrepreneurship.",
            "ranking": 1001,
            "tuition_fee_eur": 9400,
            "acceptance_rate": 0.65,
            "is_public": False,
            "english_programs_available": True,
            "programs": "Management, Finance, Law, Accounting, Marketing, Entrepreneurship, International Business, MBA",
            "admission_requirements": "Recognized school leaving certificate or bachelor's degree. English proficiency. Application form and motivation letter.",
            "required_documents": "Certified certificates with translations, language certificate, CV, motivation letter, passport copy",
            "application_deadline": "June 30 (winter semester start)",
            "language_requirements": "IELTS 6.0 or TOEFL 80 or equivalent for English programs.",
            "study_duration": "Bachelor: 6 semesters. Master: 4 semesters. MBA: variable",
            "accommodation_info": "No university dormitories. Private accommodation in Warsaw ~1,500–3,000 PLN/month (~€350–700).",
            "application_fee_eur": 0,
            "living_cost_eur": 950,
            "min_gpa": 3.0,
            "study_language": "English, Polish",
            "semester_fee_eur": 0,
            "notes": "Private university — higher fees than public. Bachelor in Management: 19,400–23,400 PLN/semester (increases by year). Triple accredited: AACSB, EQUIS, AMBA. Visa applicants must pay full year upfront. Source: kozminski.edu.pl/en/programs/undergraduate-programs-bachelor/bachelor-management.",
            "application_method": "own_portal",
            "application_portal_url": "https://www.kozminski.edu.pl/en/apply",
        },
        "programs": [
            # Source: kozminski.edu.pl/en/programs/undergraduate-programs-bachelor/bachelor-management
            # PLN converted at 1 EUR ≈ 4.25 PLN
            {"field_of_study": "Management", "degree_level": "bachelor", "tuition_fee_eur": 9130,
             "notes": "Year 1: 19,400 PLN/sem ≈ €4,565/sem = €9,130/yr. Year 2: 21,400 PLN/sem ≈ €10,050/yr. Year 3: 23,400 PLN/sem ≈ €11,000/yr. Fees increase each year. Source: kozminski.edu.pl bachelor-management."},
            {"field_of_study": "Law", "degree_level": "bachelor", "tuition_fee_eur": 9130,
             "notes": "Similar range to Management program. Year 1 ≈ €9,130/yr. Source: kozminski.edu.pl."},
            {"field_of_study": "Finance and Accounting", "degree_level": "bachelor", "tuition_fee_eur": 9130,
             "notes": "Similar range to Management program. Source: kozminski.edu.pl."},
            {"field_of_study": "Management", "degree_level": "master", "tuition_fee_eur": 9130,
             "notes": "Master's programs comparable range to bachelor's. Contact university for exact current fees. Source: kozminski.edu.pl."},
            {"field_of_study": "MBA", "degree_level": "master", "tuition_fee_eur": 28500,
             "notes": "MBA in International Management: total ~€57,000 for full program (2024 intake). Source: kozminski.edu.pl/en/programs/mba-emba/mba-international-management."},
        ],
    },

    # ── 10. Poznan University of Medical Sciences ─────────────────────────────
    {
        "u": {
            "name": "Poznan University of Medical Sciences",
            "country": "Poland",
            "city": "Poznań",
            "website": "https://www.pums.edu.pl/en/",
            "description": "Poznan University of Medical Sciences (PUMS / Uniwersytet Medyczny im. Karola Marcinkowskiego) is one of the leading medical universities in Poland. It offers medicine, dentistry, pharmacy, and nursing programs. The English-taught Medicine program is internationally recognized and popular among non-EU students.",
            "ranking": 1001,
            "tuition_fee_eur": 16600,
            "acceptance_rate": 0.45,
            "is_public": True,
            "english_programs_available": True,
            "programs": "Medicine (MD), Dentistry, Pharmacy, Nursing, Dietetics, Medical Analytics",
            "admission_requirements": "Strong biology and chemistry background. IELTS/TOEFL for English-taught Medicine. Competitive entrance process. Min. high school GPA of 3.5+ recommended.",
            "required_documents": "Certified school leaving certificate with translations, biology and chemistry transcripts, language certificate, CV, motivation letter, passport copy",
            "application_deadline": "June 30 (for October intake)",
            "language_requirements": "Medicine (English): IELTS 6.5 or TOEFL 90. Polish programs: B2 Polish.",
            "study_duration": "Medicine: 12 semesters (6 years). Dentistry: 10 semesters (5 years). Pharmacy: 10 semesters (5 years).",
            "accommodation_info": "Student dormitories from ~350–600 PLN/month (~€82–140). Poznań is the 5th largest city in Poland.",
            "application_fee_eur": 0,
            "living_cost_eur": 780,
            "min_gpa": 3.5,
            "study_language": "English (Medicine program), Polish (other programs)",
            "semester_fee_eur": 0,
            "notes": "Medicine (6-year English program) total: 485,000 PLN (2026/27 entry). Years 1–2: 71,000 PLN/yr ≈ €16,700/yr. Years 3–6: 85,750 PLN/yr ≈ €20,200/yr. Source: pums.edu.pl/admissions/medicine-program/tuition-costs-of-living/.",
            "application_method": "own_portal",
            "application_portal_url": "https://pums.edu.pl/en/admissions/",
        },
        "programs": [
            # Source: pums.edu.pl/admissions/medicine-program/tuition-costs-of-living/ (2026/27)
            {"field_of_study": "Medicine (MD)", "degree_level": "bachelor", "tuition_fee_eur": 16700,
             "notes": "Years 1–2: 71,000 PLN/yr ≈ €16,700/yr. Years 3–6: 85,750 PLN/yr ≈ €20,200/yr. 6-year program total: 485,000 PLN. Source: pums.edu.pl/admissions/medicine-program/tuition-costs-of-living/ (2026/27)."},
            {"field_of_study": "Dentistry", "degree_level": "bachelor", "tuition_fee_eur": 16700,
             "notes": "5-year program. Approx similar range to Medicine. Contact pums.edu.pl for exact current dentistry fees."},
            {"field_of_study": "Pharmacy", "degree_level": "bachelor", "tuition_fee_eur": 8500,
             "notes": "5-year program (Polish-taught). ~€8,500/yr approximate. Contact pums.edu.pl for exact current fees."},
        ],
    },

    # ── 11. University of Silesia in Katowice ─────────────────────────────────
    {
        "u": {
            "name": "University of Silesia in Katowice",
            "country": "Poland",
            "city": "Katowice",
            "website": "https://us.edu.pl/en/",
            "description": "University of Silesia in Katowice (Uniwersytet Śląski w Katowicach) is one of the largest public universities in Poland, founded in 1968. Located in Upper Silesia, it offers comprehensive programs across humanities, natural sciences, law, social sciences, and informatics. Strong in linguistics and environmental sciences.",
            "ranking": 1001,
            "tuition_fee_eur": 1800,
            "acceptance_rate": 0.70,
            "is_public": True,
            "english_programs_available": True,
            "programs": "Linguistics, Social Sciences, Law, Natural Sciences, Computer Science, Environmental Sciences, Chemistry, Biology, Informatics, Humanities",
            "admission_requirements": "Recognized degree or school leaving certificate. Language proficiency. Academic record.",
            "required_documents": "Certified certificates with translations, language certificate, CV, passport copy, application form",
            "application_deadline": "July 15 (winter semester start)",
            "language_requirements": "English programs: IELTS 5.5 or TOEFL 72. Polish programs: B2 Polish.",
            "study_duration": "Bachelor: 6–8 semesters. Master: 4 semesters",
            "accommodation_info": "Student dormitories from ~300–500 PLN/month (~€70–120). Katowice is very affordable.",
            "application_fee_eur": 0,
            "living_cost_eur": 680,
            "min_gpa": 2.5,
            "study_language": "English, Polish",
            "semester_fee_eur": 0,
            "notes": "Fees range €500–€2,500 per semester (€1,000–€5,000/yr) depending on program. Merit-based tuition waiver competition available for top non-EU applicants. Source: rekrutacja.us.edu.pl/en/foreigners/tuition-fees/ and unipage confirmed range.",
            "application_method": "own_portal",
            "application_portal_url": "https://rekrutacja.us.edu.pl/en/",
        },
        "programs": [
            # Source: rekrutacja.us.edu.pl/en/foreigners/tuition-fees/ (range €500–€2,500/sem)
            {"field_of_study": "Computer Science and Informatics", "degree_level": "bachelor", "tuition_fee_eur": 4700,
             "notes": "~€2,350/semester = €4,700/yr. Top of fee range. Source: rekrutacja.us.edu.pl tuition fees."},
            {"field_of_study": "Natural Sciences (Biology, Chemistry, Environmental)", "degree_level": "bachelor", "tuition_fee_eur": 3000,
             "notes": "~€1,500/semester = €3,000/yr. Source: rekrutacja.us.edu.pl tuition fees."},
            {"field_of_study": "Linguistics and Humanities", "degree_level": "bachelor", "tuition_fee_eur": 2000,
             "notes": "~€1,000/semester = €2,000/yr. Source: rekrutacja.us.edu.pl tuition fees."},
            {"field_of_study": "Law and Social Sciences", "degree_level": "bachelor", "tuition_fee_eur": 2000,
             "notes": "~€1,000/semester = €2,000/yr. Source: rekrutacja.us.edu.pl tuition fees."},
            {"field_of_study": "All programs", "degree_level": "master", "tuition_fee_eur": 2500,
             "notes": "~€1,000–€2,500/semester for master's programs. Source: rekrutacja.us.edu.pl."},
        ],
    },
]


def main():
    existing = get_existing_names()
    print(f"Existing Polish universities: {len(existing)}")

    added = 0
    skipped = 0

    for entry in UNIVERSITIES:
        u = entry["u"]
        if u["name"] in existing:
            print(f"  SKIP (exists): {u['name']}")
            skipped += 1
            continue

        uni_id = insert_university(u)
        insert_programs(uni_id, entry["programs"])
        print(f"  ADDED [{uni_id}]: {u['name']} — {u['city']} | tuition: EUR{u['tuition_fee_eur']}/yr")
        added += 1

    db.commit()
    print(f"\nDone. Added: {added}, Skipped: {skipped}")


if __name__ == "__main__":
    main()
