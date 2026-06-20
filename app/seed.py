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
         description="One of Germany's top technical universities."),
    dict(name="Ludwig Maximilian University of Munich", country="Germany", city="Munich",
         website="https://www.lmu.de", ranking=63, tuition_fee_eur=0,
         is_public=True, english_programs_available=True,
         description="Broad research university in central Munich."),
    dict(name="Heidelberg University", country="Germany", city="Heidelberg",
         website="https://www.uni-heidelberg.de", ranking=87, tuition_fee_eur=0,
         is_public=True, english_programs_available=True,
         description="Germany's oldest university, strong in sciences."),
    dict(name="Humboldt University of Berlin", country="Germany", city="Berlin",
         website="https://www.hu-berlin.de", ranking=128, tuition_fee_eur=0,
         is_public=True, english_programs_available=True),
    dict(name="RWTH Aachen University", country="Germany", city="Aachen",
         website="https://www.rwth-aachen.de", ranking=165, tuition_fee_eur=0,
         is_public=True, english_programs_available=True,
         description="Leading engineering university."),
    dict(name="Frankfurt School of Finance & Management", country="Germany", city="Frankfurt",
         website="https://www.frankfurt-school.de", ranking=None, tuition_fee_eur=28000,
         is_public=False, english_programs_available=True,
         description="Private business school, MBA focus."),
    # Poland
    dict(name="University of Warsaw", country="Poland", city="Warsaw",
         website="https://www.uw.edu.pl", ranking=308, tuition_fee_eur=2000,
         is_public=True, english_programs_available=True,
         description="Poland's largest and most prestigious university."),
    dict(name="Jagiellonian University", country="Poland", city="Krakow",
         website="https://www.uj.edu.pl", ranking=321, tuition_fee_eur=2000,
         is_public=True, english_programs_available=True,
         description="Poland's oldest university, founded in 1364."),
    dict(name="Warsaw University of Technology", country="Poland", city="Warsaw",
         website="https://www.pw.edu.pl", ranking=801, tuition_fee_eur=2500,
         is_public=True, english_programs_available=True,
         description="Top Polish technical university."),
    dict(name="Poznań University of Medical Sciences", country="Poland", city="Poznan",
         website="https://www.pums.edu.pl", ranking=None, tuition_fee_eur=11000,
         is_public=True, english_programs_available=True,
         description="English-medium medicine program popular with international students."),
    # Austria
    dict(name="University of Vienna", country="Austria", city="Vienna",
         website="https://www.univie.ac.at", ranking=150, tuition_fee_eur=1500,
         is_public=True, english_programs_available=True,
         description="Austria's largest and oldest university."),
    dict(name="Vienna University of Technology", country="Austria", city="Vienna",
         website="https://www.tuwien.at", ranking=251, tuition_fee_eur=1500,
         is_public=True, english_programs_available=True),
    # Netherlands
    dict(name="Delft University of Technology", country="Netherlands", city="Delft",
         website="https://www.tudelft.nl", ranking=57, tuition_fee_eur=18000,
         is_public=True, english_programs_available=True,
         description="World-class engineering and technology university."),
    dict(name="University of Amsterdam", country="Netherlands", city="Amsterdam",
         website="https://www.uva.nl", ranking=81, tuition_fee_eur=15000,
         is_public=True, english_programs_available=True),
    dict(name="Eindhoven University of Technology", country="Netherlands", city="Eindhoven",
         website="https://www.tue.nl", ranking=176, tuition_fee_eur=16000,
         is_public=True, english_programs_available=True),
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

        # Universities
        existing_names = {u.name for u in db.query(University.name).all()}
        new_unis = []
        for u in UNIVERSITIES:
            if u["name"] not in existing_names:
                new_unis.append(University(**u))
        if new_unis:
            db.add_all(new_unis)
            db.commit()
            print(f"Inserted {len(new_unis)} universities.")
        else:
            print("Universities already seeded.")

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
