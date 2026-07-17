"""
Seed scholarships with real data.
Run: python scripts/seed_scholarships.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import psycopg2
from app.config import settings

SCHOLARSHIPS = [
    # ── Germany ──────────────────────────────────────────────────────────────
    ("DAAD Scholarship", "DAAD (German Academic Exchange Service)", "government", 934,
     "Full funding for Master's and PhD students from developing countries. Monthly stipend + travel allowance.",
     "Bachelor's degree holders applying for Master's or PhD programs. Open to students from developing countries.", "2026-11-15",
     "https://www.daad.de/en/study-and-research-in-germany/scholarships/"),

    ("Deutschland Stipendium", "Federal Government of Germany", "merit", 300,
     "€300/month merit scholarship for high-achieving students at German universities.",
     "Enrolled students at a German university with excellent academic performance.", "2026-10-31",
     "https://www.deutschlandstipendium.de/en"),

    ("Konrad Adenauer Foundation Scholarship", "Konrad Adenauer Foundation", "government", 850,
     "Monthly stipend + study allowance + language courses for international students in Germany.",
     "Excellent academic record, social and political engagement, enrolled or applying to German university.", "2027-01-15",
     "https://www.kas.de/en/web/begabtenfoerderung-und-kultur/scholarships"),

    ("Heinrich Böll Foundation Scholarship", "Heinrich Böll Foundation", "government", 850,
     "For students committed to ecology, democracy, and human rights. Monthly stipend for study in Germany.",
     "Strong academic record, social/political engagement, enrolled in German university.", "2026-12-01",
     "https://www.boell.de/en/scholarships"),

    ("Friedrich Ebert Foundation Scholarship", "Friedrich Ebert Foundation", "government", 850,
     "Monthly stipend for students with demonstrated social commitment studying in Germany.",
     "Enrolled in German university, social commitment, academic excellence.", "2027-02-01",
     "https://www.fes.de/en/scholarships"),

    ("TUM Excellence Scholarship", "Technical University of Munich", "merit", 1000,
     "For outstanding Master's applicants at TUM. One-time award plus monthly supplement.",
     "GPA equivalent to 3.7 or above, applying to a TUM Master's program.", "2027-01-31",
     "https://www.tum.de/en/studies/fees-and-funding/scholarships"),

    ("Heidelberg Excellence Initiative Grant", "Heidelberg University", "merit", 750,
     "Merit-based grant for exceptional international Master's and PhD students at Heidelberg.",
     "Minimum GPA 3.5, Master's or PhD applicants.", "2027-02-28",
     "https://www.uni-heidelberg.de/en/education/financial-support"),

    # ── Poland ────────────────────────────────────────────────────────────────
    ("Polish Government Scholarship", "Polish National Agency for Academic Exchange (NAWA)", "government", 500,
     "Monthly stipend for international students studying in Poland at bachelor, master, or PhD level.",
     "Non-Polish citizen applying to or enrolled in a Polish university.", "2026-12-01",
     "https://nawa.gov.pl/en/students/scholarships-for-foreigners"),

    ("NAWA Banach Scholarship", "Polish National Agency for Academic Exchange (NAWA)", "government", 600,
     "For students from Eastern Partnership and Central Asian countries. Full funding for Master's in Poland.",
     "Citizens of: Ukraine, Belarus, Georgia, Armenia, Azerbaijan, Moldova, Kazakhstan, Uzbekistan, Tajikistan, Turkmenistan, Kyrgyzstan.",
     "2027-04-30", "https://nawa.gov.pl/en/students/banach-programme"),

    ("University of Warsaw Rector's Scholarship", "University of Warsaw", "merit", 300,
     "Awarded to the top-performing students enrolled at University of Warsaw.",
     "Enrolled at University of Warsaw with top academic results.", None,
     "https://en.uw.edu.pl/admissions/scholarships/"),

    ("Erasmus+ Study Grant", "European Commission", "government", 800,
     "Monthly mobility grant for study exchange within Europe. Covers living costs during exchange semester.",
     "Enrolled in a participating European institution. Available for Bachelor's and Master's students.", "2027-03-01",
     "https://erasmus-plus.ec.europa.eu/"),

    ("Jagiellonian University Excellence Scholarship", "Jagiellonian University", "merit", 400,
     "For outstanding international students enrolled in English-taught programs at Jagiellonian University.",
     "Enrolled in English-taught program at Jagiellonian University, GPA 3.5+.", None,
     "https://en.uj.edu.pl/en_GB/students/scholarships"),

    ("NAWA Ignacy Łukasiewicz Scholarship", "Polish National Agency for Academic Exchange (NAWA)", "government", 600,
     "For students from developing countries to pursue Master's or PhD studies in Poland.",
     "Citizens of developing countries, applying to Master's or PhD programs at Polish universities.", "2027-02-28",
     "https://nawa.gov.pl/en/students/lukasiewicz-programme"),

    # ── Austria ───────────────────────────────────────────────────────────────
    ("Austria OeAD Scholarship", "OeAD (Austrian Agency for Education and Internationalisation)", "government", 1050,
     "Government scholarship for international students to study in Austria at Master's or PhD level.",
     "Non-Austrian citizens applying to Master's or PhD programs at Austrian universities.", "2027-03-15",
     "https://oead.at/en/to-austria/grants-scholarships/"),

    ("University of Vienna Performance Scholarship", "University of Vienna", "merit", 600,
     "For outstanding students who demonstrate exceptional academic achievement at the University of Vienna.",
     "Enrolled at University of Vienna, top academic performance (top 10%).", None,
     "https://international.univie.ac.at/scholarships/"),

    # ── Netherlands ───────────────────────────────────────────────────────────
    ("TU Delft Holland Scholarship", "TU Delft / Dutch Ministry of Education", "government", 5000,
     "€5,000 one-time scholarship for non-EEA students starting Bachelor's or Master's at TU Delft.",
     "Non-EEA students, Bachelor's or Master's first year, not previously studied in the Netherlands.", "2027-02-01",
     "https://www.tudelft.nl/en/education/practical-matters/scholarships"),

    ("UvA Amsterdam Merit Scholarship", "University of Amsterdam", "merit", 15000,
     "Prestigious full-tuition scholarship for the most talented non-EEA applicants at UvA.",
     "Top 10% of applicant pool, non-EEA nationals, applying to a Master's program at UvA.", "2027-01-15",
     "https://www.uva.nl/en/education/master-s/scholarships-and-grants"),

    ("Orange Tulip Scholarship Netherlands", "Nuffic / Dutch universities", "government", 5000,
     "Scholarship for students from selected countries to study in the Netherlands.",
     "Students from India, Mexico, Indonesia, Brazil, China, South Korea, or Russia applying to Dutch universities.", "2026-12-15",
     "https://www.studyinholland.nl/scholarships/highlighted-scholarships/orange-tulip-scholarship"),

    ("Eindhoven Excellence Scholarship", "Eindhoven University of Technology", "merit", 8000,
     "Partial scholarship for the most talented international Master's students at TU/e.",
     "Non-EEA students applying to Master's programs at TU/e, top academic record.", "2027-02-01",
     "https://www.tue.nl/en/education/graduate-school/masters-programs/scholarships"),

    # ── International / Multi-country ─────────────────────────────────────────
    ("Open Society Foundations Scholarship", "Open Society Foundations", "government", 10000,
     "For students from post-communist countries and the Global South to study at leading European universities.",
     "Students from post-communist and developing countries with strong academic record and social commitment.", "2026-12-15",
     "https://www.opensocietyfoundations.org/grants/scholarship-programs"),

    ("Chevening Scholarship (UK)", "UK Government", "government", 20000,
     "Full funding for Master's study in the UK: tuition, living allowance, flights, visa.",
     "Citizens of eligible countries with 2+ years work experience, applying to UK Master's programs.", "2026-11-01",
     "https://www.chevening.org/scholarships/"),

    ("MEXT Japanese Government Scholarship", "Japanese Ministry of Education", "government", 1700,
     "Full funding for study in Japan including tuition, monthly stipend, and travel expenses.",
     "Applicants under 35 years old from eligible countries, strong academic record.", "2026-06-01",
     "https://www.studyinjapan.go.jp/en/smap-stopj-applications-research.html"),

    ("Fulbright Foreign Student Program", "US Department of State", "government", 25000,
     "Full grant for graduate study or research in the United States.",
     "Citizens of eligible countries, outstanding academic achievement, leadership potential.", "2026-10-01",
     "https://foreign.fulbrightonline.org/"),

    ("Aga Khan Foundation Scholarship", "Aga Khan Foundation", "need_based", 12000,
     "For high-achieving students from developing countries who lack financial means to pursue higher education.",
     "Students from developing countries with excellent academic record and financial need, Master's level.", "2026-12-01",
     "https://www.akdn.org/our-agencies/aga-khan-foundation/international-scholarship-programme"),

    ("Islamic Development Bank Scholarship", "Islamic Development Bank (IsDB)", "need_based", 8000,
     "For students from IsDB member countries to pursue higher education abroad in STEM or development fields.",
     "Citizens of IsDB member countries (including Arab countries), undergraduate or Master's, STEM focus.", "2026-09-30",
     "https://www.isdb.org/scholarship-programs"),

    ("Arab Fund Scholarship", "Arab Fund for Economic and Social Development", "government", 5000,
     "For Arab citizens to pursue postgraduate studies in economics, finance, or development.",
     "Arab citizens, graduate level, studying economics, finance, business, or social development.", "2026-10-31",
     "https://www.arabfund.org/"),

    ("OPEC Fund Scholarship", "OPEC Fund for International Development", "need_based", 3000,
     "For students from OPEC Fund member countries to pursue higher education.",
     "Citizens of OPEC Fund member countries (including Arab states, Nigeria, Indonesia), financial need.", "2026-11-30",
     "https://opecfund.org/"),
]

def main():
    conn = psycopg2.connect(settings.DATABASE_URL)
    cur = conn.cursor()

    cur.execute("DELETE FROM scholarships WHERE university_id IS NULL")
    print("Cleared generic scholarships (keeping university-linked ones).")

    for name, provider, stype, amount, desc, elig, deadline, link in SCHOLARSHIPS:
        cur.execute("""
            INSERT INTO scholarships (name, provider, scholarship_type, amount_eur, description, eligibility, deadline, link)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (name, provider, stype, amount, desc, elig, deadline, link))

    conn.commit()
    cur.execute("SELECT COUNT(*) FROM scholarships")
    print(f"Total scholarships: {cur.fetchone()[0]}")
    conn.close()

if __name__ == "__main__":
    main()
