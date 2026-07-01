"""
Seed script — run with:  python -m app.seed
Idempotent: skips insertion if data already exists.
"""

from app.core.security import hash_password
from app.database import SessionLocal
from app.models.scholarship import Scholarship, ScholarshipType
from app.models.student_profile import DegreeLevel, EnglishLevel, StudentProfile
from app.models.university import University
from app.models.user import User

UNIVERSITIES = [
    # Germany
    dict(name="Technical University of Munich", country="Germany", city="Munich",
         website="https://www.tum.de", ranking=50, tuition_fee_eur=0,
         is_public=True, english_programs_available=True,
         description="One of Germany's top technical universities, renowned for engineering, natural sciences, and technology.",
         programs="Computer Science, Mechanical Engineering, Electrical Engineering, Physics, Mathematics, Informatics, Aerospace Engineering, Biomedical Engineering",
         admission_requirements="Bachelor's degree (or equivalent), minimum GPA 3.0/4.0, motivation letter, two letters of recommendation, CV",
         required_documents="Certified degree transcripts, passport copy, language certificates, motivation letter, CV, letters of recommendation",
         application_deadline="January 15 (summer), June 15 (winter)",
         language_requirements="English: IELTS 6.5 or TOEFL 88; German programs require TestDaF or DSH",
         study_duration="Bachelor: 3 years, Master: 2 years, PhD: 3–4 years",
         accommodation_info="Student dormitories available via Studentenwerk München from €330/month. Private rentals in Munich average €900–1200/month.",
         application_fee_eur=0, living_cost_eur=1100, min_gpa=3.0,
         logo_url="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Logo_of_the_Technical_University_of_Munich.svg/200px-Logo_of_the_Technical_University_of_Munich.svg.png",
         contact_email="international@tum.de", contact_phone="+49 89 289 22245"),
    dict(name="Ludwig Maximilian University of Munich", country="Germany", city="Munich",
         website="https://www.lmu.de", ranking=63, tuition_fee_eur=0,
         is_public=True, english_programs_available=True,
         description="Broad research university in central Munich, one of Germany's most prestigious.",
         programs="Medicine, Law, Business Administration, Psychology, Philosophy, Computer Science, Biology, Chemistry, History",
         admission_requirements="Recognised bachelor's degree, GPA equivalent to German 2.5 or better, language proof",
         required_documents="Transcripts, degree certificate, passport, language certificates, motivation letter",
         application_deadline="May 31 (winter semester), November 30 (summer semester)",
         language_requirements="English: IELTS 6.5 or TOEFL 85 for English programs; German C1 for German programs",
         study_duration="Bachelor: 3–3.5 years, Master: 2 years",
         accommodation_info="Studentenwerk München manages 12 student halls, rooms from €320/month. Recommend applying early.",
         application_fee_eur=0, living_cost_eur=1050, min_gpa=3.0,
         logo_url="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/LMU_Muenchen_Logo.svg/200px-LMU_Muenchen_Logo.svg.png",
         contact_email="studienbuero@lmu.de", contact_phone="+49 89 2180 0"),
    dict(name="Heidelberg University", country="Germany", city="Heidelberg",
         website="https://www.uni-heidelberg.de", ranking=87, tuition_fee_eur=0,
         is_public=True, english_programs_available=True,
         description="Germany's oldest university (est. 1386), strong in sciences, humanities, and medicine.",
         programs="Medicine, Life Sciences, Physics, Chemistry, Computer Science, Mathematics, Law, Social Sciences",
         admission_requirements="Bachelor's degree, strong academic record, research proposal for PhD",
         required_documents="Transcripts, degree certificate, passport, IELTS/TOEFL, motivation letter, CV",
         application_deadline="January 15 (summer), July 15 (winter)",
         language_requirements="English: IELTS 6.0 or TOEFL 80 for English-taught programs",
         study_duration="Bachelor: 3 years, Master: 2 years, PhD: 3 years",
         accommodation_info="Student residential halls from €280/month. Heidelberg city is affordable compared to Munich.",
         application_fee_eur=0, living_cost_eur=850, min_gpa=3.0,
         logo_url="https://upload.wikimedia.org/wikipedia/de/thumb/8/80/Heidelberg_University_Logo.svg/200px-Heidelberg_University_Logo.svg.png",
         contact_email="international@uni-heidelberg.de", contact_phone="+49 6221 54 0"),
    dict(name="Humboldt University of Berlin", country="Germany", city="Berlin",
         website="https://www.hu-berlin.de", ranking=128, tuition_fee_eur=0,
         is_public=True, english_programs_available=True,
         description="Historic research university in Berlin, founded in 1810, known for humanities and sciences.",
         programs="Law, Economics, Natural Sciences, Medicine, Cultural Studies, Computer Science, Mathematics",
         admission_requirements="Recognised bachelor's degree, language proficiency, specific requirements per program",
         required_documents="Transcripts, degree certificate, passport, language certificates, motivation letter",
         application_deadline="June 1 (winter), December 1 (summer)",
         language_requirements="German C1 for most programs; IELTS 6.5 for English-taught programs",
         study_duration="Bachelor: 3 years, Master: 2 years",
         accommodation_info="Studierendenwerk Berlin dorms from €250/month. Berlin has affordable private rentals (€600–900/month).",
         application_fee_eur=0, living_cost_eur=900, min_gpa=2.8,
         contact_email="international@hu-berlin.de", contact_phone="+49 30 2093 0"),
    dict(name="RWTH Aachen University", country="Germany", city="Aachen",
         website="https://www.rwth-aachen.de", ranking=165, tuition_fee_eur=0,
         is_public=True, english_programs_available=True,
         description="Germany's leading engineering university with strong industry ties.",
         programs="Mechanical Engineering, Electrical Engineering, Computer Science, Civil Engineering, Business Engineering, Physics, Chemical Engineering",
         admission_requirements="Bachelor's degree in related field, GPA 3.0+, mathematics background required for engineering",
         required_documents="Transcripts, degree certificate, passport, IELTS/TOEFL, motivation letter, CV",
         application_deadline="March 1 (summer), September 1 (winter)",
         language_requirements="English: IELTS 6.0 or TOEFL 80; German B2 for German-taught programs",
         study_duration="Bachelor: 3 years, Master: 2 years",
         accommodation_info="Student housing from €250/month. Aachen is affordable with strong student community.",
         application_fee_eur=0, living_cost_eur=800, min_gpa=3.0,
         contact_email="international@rwth-aachen.de", contact_phone="+49 241 80 0"),
    dict(name="Frankfurt School of Finance & Management", country="Germany", city="Frankfurt",
         website="https://www.frankfurt-school.de", ranking=None, tuition_fee_eur=28000,
         is_public=False, english_programs_available=True,
         description="Elite private business school in Frankfurt's financial district, MBA and finance focus.",
         programs="MBA, MSc Finance, MSc Management, MSc Applied Data Science, Bachelor of Science in Business Administration",
         admission_requirements="Bachelor's degree, GMAT/GRE score (600+ recommended), 2+ years work experience for MBA, English proficiency",
         required_documents="Transcripts, GMAT/GRE scores, IELTS/TOEFL, CV, two references, personal essay",
         application_deadline="Rolling admissions, early application recommended (November–March)",
         language_requirements="IELTS 7.0 or TOEFL 100 for all programs",
         study_duration="MBA: 1 year (full-time), Master: 1.5 years",
         accommodation_info="No on-campus housing. Frankfurt private rentals from €1000/month. School provides housing support.",
         application_fee_eur=100, living_cost_eur=1400, min_gpa=3.2,
         contact_email="admissions@frankfurt-school.de", contact_phone="+49 69 154008 0"),
    # Poland
    dict(name="University of Warsaw", country="Poland", city="Warsaw",
         website="https://www.uw.edu.pl", ranking=308, tuition_fee_eur=2000,
         is_public=True, english_programs_available=True,
         description="Poland's largest and most prestigious university, founded in 1816.",
         programs="Law, Economics, Computer Science, Psychology, Political Science, Mathematics, Physics, Linguistics, History",
         admission_requirements="High school diploma (for Bachelor's) or bachelor's degree (for Master's), language proficiency",
         required_documents="Transcripts, diploma, passport, language certificate, application form",
         application_deadline="May 31 (for October start)",
         language_requirements="English: B2 certificate or IELTS 5.5 / TOEFL 72 for English programs",
         study_duration="Bachelor: 3 years, Master: 2 years",
         accommodation_info="University dormitories from €120/month. Warsaw private rooms from €400/month.",
         application_fee_eur=20, living_cost_eur=600, min_gpa=2.5,
         contact_email="bso@adm.uw.edu.pl", contact_phone="+48 22 552 0000"),
    dict(name="Jagiellonian University", country="Poland", city="Krakow",
         website="https://www.uj.edu.pl", ranking=321, tuition_fee_eur=2000,
         is_public=True, english_programs_available=True,
         description="Poland's oldest university, founded in 1364, located in beautiful Krakow.",
         programs="Medicine, Law, Philosophy, Computer Science, Chemistry, Physics, History, Biology, International Relations",
         admission_requirements="Relevant degree, language proof, some programs require entrance exam",
         required_documents="Transcripts, diploma, passport, IELTS/TOEFL certificate, motivation letter",
         application_deadline="May 16 (winter semester)",
         language_requirements="English: IELTS 6.0 or TOEFL 79 for English programs",
         study_duration="Bachelor: 3 years, Master: 2 years, Medical programs: 6 years",
         accommodation_info="University dorms from €100/month. Krakow is very affordable, private rooms from €250/month.",
         application_fee_eur=20, living_cost_eur=550, min_gpa=2.5,
         contact_email="international@uj.edu.pl", contact_phone="+48 12 663 1000"),
    dict(name="Warsaw University of Technology", country="Poland", city="Warsaw",
         website="https://www.pw.edu.pl", ranking=801, tuition_fee_eur=2500,
         is_public=True, english_programs_available=True,
         description="Poland's top technical university, strong in engineering and technology.",
         programs="Civil Engineering, Electrical Engineering, Mechanical Engineering, Computer Science, Architecture, Chemical Engineering, Physics",
         admission_requirements="High school diploma with strong math/science grades (Bachelor's) or bachelor's in related field (Master's)",
         required_documents="Transcripts, diploma, passport, language certificate, CV",
         application_deadline="July 31 (for October start)",
         language_requirements="English: B2 level certificate for English programs",
         study_duration="Bachelor: 3.5 years, Master: 1.5 years",
         accommodation_info="Student dormitories from €100/month. Warsaw is moderately priced for students.",
         application_fee_eur=20, living_cost_eur=620, min_gpa=2.5,
         contact_email="rekrutacja@pw.edu.pl", contact_phone="+48 22 234 7211"),
    dict(name="Poznań University of Medical Sciences", country="Poland", city="Poznan",
         website="https://www.pums.edu.pl", ranking=None, tuition_fee_eur=11000,
         is_public=True, english_programs_available=True,
         description="English-medium medicine and pharmacy programs popular with international students.",
         programs="Medicine (English), Pharmacy (English), Dentistry, Nursing",
         admission_requirements="High school diploma with biology and chemistry, entrance exam (biology/chemistry), IELTS/TOEFL",
         required_documents="High school transcripts, passport, IELTS/TOEFL, entrance exam results, medical certificate",
         application_deadline="June 30 (for October start)",
         language_requirements="English: IELTS 6.0 or TOEFL 80",
         study_duration="Medicine: 6 years, Pharmacy: 5 years, Dentistry: 5 years",
         accommodation_info="Student dormitories from €100/month. Poznan city is affordable for students.",
         application_fee_eur=200, living_cost_eur=580, min_gpa=3.0,
         contact_email="international@pums.edu.pl", contact_phone="+48 61 854 6000"),
    # Austria
    dict(name="University of Vienna", country="Austria", city="Vienna",
         website="https://www.univie.ac.at", ranking=150, tuition_fee_eur=1500,
         is_public=True, english_programs_available=True,
         description="Austria's largest and oldest university, founded in 1365, in the heart of Vienna.",
         programs="Law, Business, Computer Science, Psychology, Biology, Chemistry, Philosophy, History, Data Science",
         admission_requirements="Recognised bachelor's degree, language proficiency, some programs with limited spots require additional selection",
         required_documents="Transcripts, degree certificate, passport, language certificates, motivation letter",
         application_deadline="January 31 (summer), September 5 (winter)",
         language_requirements="German B2 for German programs; IELTS 6.5 or TOEFL 90 for English programs",
         study_duration="Bachelor: 3 years, Master: 2 years",
         accommodation_info="ÖH student housing from €250/month. Vienna living costs are moderate (€800–1200/month total).",
         application_fee_eur=0, living_cost_eur=1000, min_gpa=2.8,
         contact_email="international.office@univie.ac.at", contact_phone="+43 1 4277 0"),
    dict(name="Vienna University of Technology", country="Austria", city="Vienna",
         website="https://www.tuwien.at", ranking=251, tuition_fee_eur=1500,
         is_public=True, english_programs_available=True,
         description="Austria's leading technical university with strong research in engineering and natural sciences.",
         programs="Computer Science, Electrical Engineering, Mechanical Engineering, Civil Engineering, Architecture, Mathematics, Physics",
         admission_requirements="Bachelor's degree in relevant field, math/science background, language proof",
         required_documents="Transcripts, degree certificate, passport, IELTS/TOEFL, motivation letter, CV",
         application_deadline="January 31 (summer), September 1 (winter)",
         language_requirements="German B2 or IELTS 6.0 / TOEFL 80 for English-taught programs",
         study_duration="Bachelor: 3 years, Master: 2 years",
         accommodation_info="OeAD student housing from €270/month. Vienna has an excellent student lifestyle.",
         application_fee_eur=0, living_cost_eur=1000, min_gpa=2.8,
         contact_email="international@tuwien.ac.at", contact_phone="+43 1 58801 0"),
    # Netherlands
    dict(name="Delft University of Technology", country="Netherlands", city="Delft",
         website="https://www.tudelft.nl", ranking=57, tuition_fee_eur=18000,
         is_public=True, english_programs_available=True,
         description="World-class engineering and technology university, all Master's programs taught in English.",
         programs="Aerospace Engineering, Civil Engineering, Computer Science, Electrical Engineering, Industrial Design, Mechanical Engineering, Applied Mathematics",
         admission_requirements="Bachelor's in related engineering/science field, GPA 7.5/10 or 3.0/4.0, IELTS/TOEFL",
         required_documents="Transcripts, bachelor's diploma, passport, IELTS/TOEFL, CV, motivation letter",
         application_deadline="January 15 (most programs)",
         language_requirements="IELTS 6.5 overall (6.0 per component) or TOEFL 90",
         study_duration="Bachelor: 3 years, Master: 2 years",
         accommodation_info="Campus housing via DUWO from €400/month. Delft is a student city with affordable options.",
         application_fee_eur=100, living_cost_eur=1100, min_gpa=3.0,
         contact_email="study@tudelft.nl", contact_phone="+31 15 278 9111"),
    dict(name="University of Amsterdam", country="Netherlands", city="Amsterdam",
         website="https://www.uva.nl", ranking=81, tuition_fee_eur=15000,
         is_public=True, english_programs_available=True,
         description="One of Europe's leading research universities in Amsterdam's vibrant city center.",
         programs="Business Administration, Law, Psychology, Economics, Computer Science, Data Science, Communication, Political Science",
         admission_requirements="Relevant bachelor's degree (min. 3 years), strong academic record, program-specific requirements",
         required_documents="Transcripts, diploma, passport, IELTS/TOEFL, CV, motivation letter, references",
         application_deadline="April 1 (most programs), January 15 (early deadline)",
         language_requirements="IELTS 6.5 (6.0 per sub-score) or TOEFL 92",
         study_duration="Bachelor: 3 years, Master: 1–2 years",
         accommodation_info="Student housing via DUWO and SSH; apply early as Amsterdam housing is competitive. Budget €700–1000/month.",
         application_fee_eur=75, living_cost_eur=1200, min_gpa=3.0,
         contact_email="studyabroad@uva.nl", contact_phone="+31 20 525 9111"),
    dict(name="Eindhoven University of Technology", country="Netherlands", city="Eindhoven",
         website="https://www.tue.nl", ranking=176, tuition_fee_eur=16000,
         is_public=True, english_programs_available=True,
         description="High-tech engineering university partnered with Philips and ASML, strong industry connections.",
         programs="Computer Science, Electrical Engineering, Mechanical Engineering, Industrial Engineering, Data Science, Biomedical Engineering",
         admission_requirements="Bachelor's in relevant field, strong mathematics and science background, IELTS/TOEFL",
         required_documents="Transcripts, degree, passport, IELTS/TOEFL, motivation letter, CV",
         application_deadline="April 1 (EU), February 1 (non-EU)",
         language_requirements="IELTS 6.0 (5.5 per sub-score) or TOEFL 80",
         study_duration="Bachelor: 3 years, Master: 2 years",
         accommodation_info="Campus housing available from €400/month. Eindhoven is cheaper than Amsterdam.",
         application_fee_eur=75, living_cost_eur=1000, min_gpa=2.8,
         contact_email="studyadvisors@tue.nl", contact_phone="+31 40 247 9111"),
]

SCHOLARSHIPS = [
    dict(university_id=None, name="DAAD Scholarship", provider="German Academic Exchange Service",
         scholarship_type=ScholarshipType.government, amount_eur=934,
         description="Monthly stipend for international students in Germany.",
         eligibility="Bachelor's degree holders applying for Master's or PhD programs.",
         deadline="2024-11-15", link="https://www.daad.de/en/"),
    dict(university_id=None, name="Erasmus+ Study Grant", provider="European Commission",
         scholarship_type=ScholarshipType.government, amount_eur=800,
         description="Monthly grant for exchange studies within the EU.",
         eligibility="Enrolled in a participating European institution.",
         deadline="2025-03-01", link="https://erasmus-plus.ec.europa.eu/"),
    dict(university_id=None, name="Polish Government Scholarship", provider="Polish National Agency for Academic Exchange (NAWA)",
         scholarship_type=ScholarshipType.government, amount_eur=500,
         description="Monthly stipend for international students in Poland.",
         deadline="2024-12-01", link="https://nawa.gov.pl/en/"),
    dict(university_id=1, name="TUM Excellence Scholarship", provider="Technical University of Munich",
         scholarship_type=ScholarshipType.merit, amount_eur=1000,
         description="Merit-based monthly scholarship for outstanding international students.",
         eligibility="GPA equivalent to 3.7 or above.", deadline="2025-01-31",
         link="https://www.tum.de/en/studies/fees-and-financial-aid/scholarships/"),
    dict(university_id=3, name="Heidelberg Excellence Initiative Grant", provider="Heidelberg University",
         scholarship_type=ScholarshipType.merit, amount_eur=750,
         description="For high-achieving international graduate students.",
         eligibility="Minimum GPA 3.5, Master's or PhD applicants.", deadline="2025-02-28",
         link="https://www.uni-heidelberg.de/en/"),
    dict(university_id=7, name="University of Warsaw Rector's Scholarship", provider="University of Warsaw",
         scholarship_type=ScholarshipType.merit, amount_eur=300,
         description="Awarded to top-performing students after first semester.",
         link="https://www.uw.edu.pl/"),
    dict(university_id=None, name="Austria OeAD Scholarship", provider="OeAD – Austria's Agency for Education and Internationalisation",
         scholarship_type=ScholarshipType.government, amount_eur=1050,
         description="Research grants and study grants for international students in Austria.",
         deadline="2025-03-15", link="https://oead.at/en/"),
    dict(university_id=13, name="TU Delft Holland Scholarship", provider="Delft University of Technology",
         scholarship_type=ScholarshipType.partial, amount_eur=5000,
         description="One-time grant for non-EEA students enrolling at TU Delft.",
         eligibility="Non-EEA students, Bachelor's or Master's first year.", deadline="2025-02-01",
         link="https://www.tudelft.nl/en/education/practical-matters/scholarships/"),
    dict(university_id=14, name="UvA Amsterdam Merit Scholarship", provider="University of Amsterdam",
         scholarship_type=ScholarshipType.merit, amount_eur=15000,
         description="Full-tuition waiver for exceptional non-EEA students.",
         eligibility="Top 10% of applicant pool, non-EEA nationals.", deadline="2025-01-15",
         link="https://www.uva.nl/en/"),
    dict(university_id=None, name="NAWA Banach Scholarship", provider="Polish National Agency for Academic Exchange",
         scholarship_type=ScholarshipType.need_based, amount_eur=600,
         description="For students from selected countries pursuing studies in Poland.",
         deadline="2025-04-30", link="https://nawa.gov.pl/en/"),
]


def seed():
    db = SessionLocal()
    try:
        # Users
        if not db.query(User).filter(User.email == "admin@universityfinder.com").first():
            admin = User(
                email="admin@universityfinder.com",
                hashed_password=hash_password("Admin1234!"),
                role="admin",
            )
            db.add(admin)
            print("Created admin user: admin@universityfinder.com / Admin1234!")

        if not db.query(User).filter(User.email == "student@example.com").first():
            student = User(
                email="student@example.com",
                hashed_password=hash_password("Student1234!"),
                role="student",
            )
            db.add(student)
            db.flush()
            profile = StudentProfile(
                user_id=student.id,
                nationality="Egyptian",
                degree_level=DegreeLevel.master,
                gpa=3.6,
                budget_eur=5000,
                english_level=EnglishLevel.c1,
                preferred_countries="Germany,Poland",
                field_of_study="Computer Science",
            )
            db.add(profile)
            print("Created student user: student@example.com / Student1234!")

        db.commit()

        # Universities — insert new ones, update all detail fields on existing
        existing = {u.name: u for u in db.query(University).all()}
        new_unis = []
        update_fields = (
            "programs", "admission_requirements", "required_documents",
            "application_deadline", "language_requirements", "study_duration",
            "accommodation_info", "description", "application_fee_eur",
            "living_cost_eur", "min_gpa", "logo_url", "contact_email", "contact_phone",
        )
        for u_data in UNIVERSITIES:
            if u_data["name"] not in existing:
                new_unis.append(University(**u_data))
            else:
                uni = existing[u_data["name"]]
                for field in update_fields:
                    if u_data.get(field) is not None:
                        setattr(uni, field, u_data[field])
        if new_unis:
            db.add_all(new_unis)
        db.commit()
        print(f"Inserted {len(new_unis)} new universities, updated details on {len(existing)} existing.")

        # Scholarships — resolve university_id by position (1-based index in UNIVERSITIES list)
        if db.query(Scholarship).count() == 0:
            all_unis = db.query(University).order_by(University.id).all()
            uni_by_position = {i + 1: u.id for i, u in enumerate(all_unis)}

            new_scholarships = []
            for s in SCHOLARSHIPS:
                s_data = s.copy()
                pos = s_data.pop("university_id")
                s_data["university_id"] = uni_by_position.get(pos) if pos else None
                new_scholarships.append(Scholarship(**s_data))
            db.add_all(new_scholarships)
            db.commit()
            print(f"Inserted {len(new_scholarships)} scholarships.")
        else:
            print("Scholarships already seeded.")

        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
