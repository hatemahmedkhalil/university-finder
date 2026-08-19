import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

from app.database import SessionLocal
import sqlalchemy as sa

db = SessionLocal()

# Check if already seeded
existing = db.execute(sa.text("SELECT COUNT(*) FROM city_cost_of_living")).scalar()
if existing > 0:
    print(f"Already seeded ({existing} rows). Delete rows first to re-seed.")
    db.close()
    sys.exit(0)

CITIES = [
    # ─── GERMANY ──────────────────────────────────────────────────────────────
    # Sources: Numbeo Germany 2025, DAAD cost guide, Studentenwerk reports
    # Rent single = 1-room apartment avg; rent shared = WG room or dorm
    # Notes: semester ticket (Semesterticket) often covers local transit for ~€200/semester
    {
        "city": "Berlin", "country": "Germany",
        "rent_single_eur": 980, "rent_shared_eur": 650,
        "food_eur": 300, "transport_eur": 86,
        "utilities_eur": 120,
        "total_min_eur": 900, "total_max_eur": 1400,
        "notes": "Germany's capital and largest student city. High demand = higher rents. Semester ticket ~€200/semester covers public transit."
    },
    {
        "city": "Munich", "country": "Germany",
        "rent_single_eur": 1350, "rent_shared_eur": 800,
        "food_eur": 330, "transport_eur": 57,
        "utilities_eur": 130,
        "total_min_eur": 1100, "total_max_eur": 1700,
        "notes": "Most expensive German city. Strong economy but high cost of living. Apply for student dorm early."
    },
    {
        "city": "Hamburg", "country": "Germany",
        "rent_single_eur": 1050, "rent_shared_eur": 680,
        "food_eur": 310, "transport_eur": 109,
        "utilities_eur": 120,
        "total_min_eur": 950, "total_max_eur": 1450,
        "notes": "Second largest German city. Higher rents, good job market."
    },
    {
        "city": "Frankfurt am Main", "country": "Germany",
        "rent_single_eur": 1100, "rent_shared_eur": 700,
        "food_eur": 310, "transport_eur": 116,
        "utilities_eur": 125,
        "total_min_eur": 1000, "total_max_eur": 1550,
        "notes": "Finance hub, high rents. RMV semester ticket available."
    },
    {
        "city": "Stuttgart", "country": "Germany",
        "rent_single_eur": 1000, "rent_shared_eur": 650,
        "food_eur": 300, "transport_eur": 92,
        "utilities_eur": 120,
        "total_min_eur": 950, "total_max_eur": 1400,
        "notes": "Baden-Württemberg: non-EU students pay €1,500/semester tuition."
    },
    {
        "city": "Cologne", "country": "Germany",
        "rent_single_eur": 900, "rent_shared_eur": 600,
        "food_eur": 290, "transport_eur": 97,
        "utilities_eur": 115,
        "total_min_eur": 880, "total_max_eur": 1300,
        "notes": "Large, diverse student city with reasonable rents for its size."
    },
    {
        "city": "Düsseldorf", "country": "Germany",
        "rent_single_eur": 950, "rent_shared_eur": 620,
        "food_eur": 300, "transport_eur": 97,
        "utilities_eur": 118,
        "total_min_eur": 900, "total_max_eur": 1350,
        "notes": "NRW capital. Semester ticket covers VRR network."
    },
    {
        "city": "Dresden", "country": "Germany",
        "rent_single_eur": 700, "rent_shared_eur": 450,
        "food_eur": 270, "transport_eur": 85,
        "utilities_eur": 110,
        "total_min_eur": 750, "total_max_eur": 1100,
        "notes": "One of the most affordable large German cities. Strong STEM tradition."
    },
    {
        "city": "Leipzig", "country": "Germany",
        "rent_single_eur": 680, "rent_shared_eur": 430,
        "food_eur": 260, "transport_eur": 80,
        "utilities_eur": 105,
        "total_min_eur": 700, "total_max_eur": 1050,
        "notes": "Very affordable. Growing tech and arts scene."
    },
    {
        "city": "Hannover", "country": "Germany",
        "rent_single_eur": 780, "rent_shared_eur": 500,
        "food_eur": 280, "transport_eur": 92,
        "utilities_eur": 112,
        "total_min_eur": 800, "total_max_eur": 1150,
        "notes": "Lower Saxony capital. Affordable and well-connected."
    },
    {
        "city": "Dortmund", "country": "Germany",
        "rent_single_eur": 700, "rent_shared_eur": 450,
        "food_eur": 270, "transport_eur": 85,
        "utilities_eur": 108,
        "total_min_eur": 750, "total_max_eur": 1050,
        "notes": "NRW, affordable post-industrial city."
    },
    {
        "city": "Bochum", "country": "Germany",
        "rent_single_eur": 680, "rent_shared_eur": 430,
        "food_eur": 265, "transport_eur": 85,
        "utilities_eur": 108,
        "total_min_eur": 720, "total_max_eur": 1020,
        "notes": "NRW, very affordable. Ruhr University is one of Germany's largest."
    },
    {
        "city": "Duisburg", "country": "Germany",
        "rent_single_eur": 650, "rent_shared_eur": 420,
        "food_eur": 260, "transport_eur": 85,
        "utilities_eur": 108,
        "total_min_eur": 700, "total_max_eur": 980,
        "notes": "Among cheapest large NRW cities."
    },
    {
        "city": "Mannheim", "country": "Germany",
        "rent_single_eur": 850, "rent_shared_eur": 560,
        "food_eur": 285, "transport_eur": 88,
        "utilities_eur": 115,
        "total_min_eur": 850, "total_max_eur": 1200,
        "notes": "Baden-Württemberg: non-EU €1,500/semester tuition. Business-focused city."
    },
    {
        "city": "Heidelberg", "country": "Germany",
        "rent_single_eur": 950, "rent_shared_eur": 620,
        "food_eur": 295, "transport_eur": 88,
        "utilities_eur": 118,
        "total_min_eur": 900, "total_max_eur": 1350,
        "notes": "Baden-Württemberg: non-EU €1,500/semester tuition. High demand for housing."
    },
    {
        "city": "Freiburg im Breisgau", "country": "Germany",
        "rent_single_eur": 950, "rent_shared_eur": 620,
        "food_eur": 290, "transport_eur": 88,
        "utilities_eur": 115,
        "total_min_eur": 900, "total_max_eur": 1350,
        "notes": "Baden-Württemberg: non-EU €1,500/semester tuition. Competitive housing market."
    },
    {
        "city": "Tübingen", "country": "Germany",
        "rent_single_eur": 900, "rent_shared_eur": 600,
        "food_eur": 285, "transport_eur": 88,
        "utilities_eur": 115,
        "total_min_eur": 880, "total_max_eur": 1300,
        "notes": "Baden-Württemberg: non-EU €1,500/semester tuition."
    },
    {
        "city": "Konstanz", "country": "Germany",
        "rent_single_eur": 900, "rent_shared_eur": 600,
        "food_eur": 285, "transport_eur": 88,
        "utilities_eur": 115,
        "total_min_eur": 880, "total_max_eur": 1300,
        "notes": "Baden-Württemberg: non-EU €1,500/semester tuition. Swiss border city — high prices."
    },
    {
        "city": "Aachen", "country": "Germany",
        "rent_single_eur": 750, "rent_shared_eur": 490,
        "food_eur": 275, "transport_eur": 85,
        "utilities_eur": 110,
        "total_min_eur": 780, "total_max_eur": 1100,
        "notes": "NRW, RWTH Aachen campus city. Tri-border with Belgium & Netherlands."
    },
    {
        "city": "Bonn", "country": "Germany",
        "rent_single_eur": 820, "rent_shared_eur": 530,
        "food_eur": 280, "transport_eur": 97,
        "utilities_eur": 112,
        "total_min_eur": 820, "total_max_eur": 1200,
        "notes": "NRW, former capital. International atmosphere, moderate rents."
    },
    {
        "city": "Münster", "country": "Germany",
        "rent_single_eur": 780, "rent_shared_eur": 500,
        "food_eur": 275, "transport_eur": 85,
        "utilities_eur": 110,
        "total_min_eur": 790, "total_max_eur": 1150,
        "notes": "NRW. Bicycle-friendly university city. Affordable and popular."
    },
    {
        "city": "Bielefeld", "country": "Germany",
        "rent_single_eur": 700, "rent_shared_eur": 450,
        "food_eur": 265, "transport_eur": 85,
        "utilities_eur": 108,
        "total_min_eur": 730, "total_max_eur": 1020,
        "notes": "NRW. Very affordable student city."
    },
    {
        "city": "Paderborn", "country": "Germany",
        "rent_single_eur": 680, "rent_shared_eur": 440,
        "food_eur": 260, "transport_eur": 75,
        "utilities_eur": 105,
        "total_min_eur": 710, "total_max_eur": 1000,
        "notes": "NRW, small and very affordable."
    },
    {
        "city": "Siegen", "country": "Germany",
        "rent_single_eur": 650, "rent_shared_eur": 420,
        "food_eur": 255, "transport_eur": 75,
        "utilities_eur": 105,
        "total_min_eur": 690, "total_max_eur": 980,
        "notes": "NRW, one of the cheapest university cities in Germany."
    },
    {
        "city": "Wuppertal", "country": "Germany",
        "rent_single_eur": 650, "rent_shared_eur": 420,
        "food_eur": 255, "transport_eur": 85,
        "utilities_eur": 105,
        "total_min_eur": 690, "total_max_eur": 980,
        "notes": "NRW. Very affordable. Famous for its suspended monorail."
    },
    {
        "city": "Darmstadt", "country": "Germany",
        "rent_single_eur": 900, "rent_shared_eur": 600,
        "food_eur": 290, "transport_eur": 85,
        "utilities_eur": 115,
        "total_min_eur": 880, "total_max_eur": 1280,
        "notes": "Hesse. Tech city near Frankfurt. Moderate to high rents."
    },
    {
        "city": "Kassel", "country": "Germany",
        "rent_single_eur": 680, "rent_shared_eur": 440,
        "food_eur": 260, "transport_eur": 78,
        "utilities_eur": 108,
        "total_min_eur": 710, "total_max_eur": 1000,
        "notes": "Hesse. Affordable mid-size city."
    },
    {
        "city": "Marburg", "country": "Germany",
        "rent_single_eur": 720, "rent_shared_eur": 460,
        "food_eur": 265, "transport_eur": 78,
        "utilities_eur": 108,
        "total_min_eur": 730, "total_max_eur": 1050,
        "notes": "Hesse, small university town. Very student-oriented."
    },
    {
        "city": "Giessen", "country": "Germany",
        "rent_single_eur": 680, "rent_shared_eur": 440,
        "food_eur": 260, "transport_eur": 78,
        "utilities_eur": 108,
        "total_min_eur": 710, "total_max_eur": 1000,
        "notes": "Hesse, affordable. Justus Liebig University."
    },
    {
        "city": "Mainz", "country": "Germany",
        "rent_single_eur": 850, "rent_shared_eur": 560,
        "food_eur": 280, "transport_eur": 85,
        "utilities_eur": 112,
        "total_min_eur": 840, "total_max_eur": 1200,
        "notes": "Rhineland-Palatinate capital. Close to Frankfurt."
    },
    {
        "city": "Trier", "country": "Germany",
        "rent_single_eur": 680, "rent_shared_eur": 440,
        "food_eur": 260, "transport_eur": 70,
        "utilities_eur": 105,
        "total_min_eur": 700, "total_max_eur": 990,
        "notes": "Rhineland-Palatinate. Small, affordable city near Luxembourg border."
    },
    {
        "city": "Koblenz", "country": "Germany",
        "rent_single_eur": 680, "rent_shared_eur": 440,
        "food_eur": 260, "transport_eur": 72,
        "utilities_eur": 105,
        "total_min_eur": 700, "total_max_eur": 990,
        "notes": "Rhineland-Palatinate. Affordable mid-size city."
    },
    {
        "city": "Saarbrücken", "country": "Germany",
        "rent_single_eur": 650, "rent_shared_eur": 420,
        "food_eur": 255, "transport_eur": 68,
        "utilities_eur": 105,
        "total_min_eur": 680, "total_max_eur": 970,
        "notes": "Saarland. Very affordable. Near French border."
    },
    {
        "city": "Kaiserslautern", "country": "Germany",
        "rent_single_eur": 640, "rent_shared_eur": 410,
        "food_eur": 255, "transport_eur": 68,
        "utilities_eur": 105,
        "total_min_eur": 670, "total_max_eur": 960,
        "notes": "Rhineland-Palatinate. One of cheapest uni cities in Germany."
    },
    {
        "city": "Bayreuth", "country": "Germany",
        "rent_single_eur": 680, "rent_shared_eur": 440,
        "food_eur": 260, "transport_eur": 70,
        "utilities_eur": 105,
        "total_min_eur": 700, "total_max_eur": 990,
        "notes": "Bavaria. Affordable for Bavarian standards. Famous for Wagner Festival."
    },
    {
        "city": "Würzburg", "country": "Germany",
        "rent_single_eur": 780, "rent_shared_eur": 510,
        "food_eur": 270, "transport_eur": 78,
        "utilities_eur": 110,
        "total_min_eur": 790, "total_max_eur": 1120,
        "notes": "Bavaria, university town. Moderate rents."
    },
    {
        "city": "Erlangen", "country": "Germany",
        "rent_single_eur": 800, "rent_shared_eur": 520,
        "food_eur": 280, "transport_eur": 78,
        "utilities_eur": 112,
        "total_min_eur": 800, "total_max_eur": 1150,
        "notes": "Bavaria, part of Nuremberg metro. Friedrich-Alexander University."
    },
    {
        "city": "Augsburg", "country": "Germany",
        "rent_single_eur": 820, "rent_shared_eur": 530,
        "food_eur": 280, "transport_eur": 78,
        "utilities_eur": 112,
        "total_min_eur": 810, "total_max_eur": 1170,
        "notes": "Bavaria, close to Munich. More affordable than Munich."
    },
    {
        "city": "Regensburg", "country": "Germany",
        "rent_single_eur": 800, "rent_shared_eur": 520,
        "food_eur": 275, "transport_eur": 75,
        "utilities_eur": 110,
        "total_min_eur": 790, "total_max_eur": 1130,
        "notes": "Bavaria. UNESCO old town. Moderate cost."
    },
    {
        "city": "Passau", "country": "Germany",
        "rent_single_eur": 720, "rent_shared_eur": 460,
        "food_eur": 265, "transport_eur": 70,
        "utilities_eur": 108,
        "total_min_eur": 740, "total_max_eur": 1050,
        "notes": "Bavaria, border with Austria/Czech Republic. Affordable."
    },
    {
        "city": "Ulm", "country": "Germany",
        "rent_single_eur": 780, "rent_shared_eur": 510,
        "food_eur": 275, "transport_eur": 75,
        "utilities_eur": 110,
        "total_min_eur": 780, "total_max_eur": 1120,
        "notes": "Baden-Württemberg: non-EU €1,500/semester tuition."
    },
    {
        "city": "Karlsruhe", "country": "Germany",
        "rent_single_eur": 850, "rent_shared_eur": 560,
        "food_eur": 280, "transport_eur": 85,
        "utilities_eur": 112,
        "total_min_eur": 840, "total_max_eur": 1200,
        "notes": "Baden-Württemberg: non-EU €1,500/semester tuition. Strong tech ecosystem."
    },
    {
        "city": "Kiel", "country": "Germany",
        "rent_single_eur": 720, "rent_shared_eur": 460,
        "food_eur": 265, "transport_eur": 78,
        "utilities_eur": 108,
        "total_min_eur": 740, "total_max_eur": 1060,
        "notes": "Schleswig-Holstein capital on the Baltic Sea. Affordable."
    },
    {
        "city": "Lübeck", "country": "Germany",
        "rent_single_eur": 700, "rent_shared_eur": 450,
        "food_eur": 265, "transport_eur": 78,
        "utilities_eur": 108,
        "total_min_eur": 730, "total_max_eur": 1030,
        "notes": "Schleswig-Holstein. Historic Hanseatic city. Affordable."
    },
    {
        "city": "Flensburg", "country": "Germany",
        "rent_single_eur": 650, "rent_shared_eur": 420,
        "food_eur": 255, "transport_eur": 68,
        "utilities_eur": 105,
        "total_min_eur": 670, "total_max_eur": 960,
        "notes": "Schleswig-Holstein, Danish border. Very affordable."
    },
    {
        "city": "Lüneburg", "country": "Germany",
        "rent_single_eur": 720, "rent_shared_eur": 460,
        "food_eur": 265, "transport_eur": 75,
        "utilities_eur": 108,
        "total_min_eur": 740, "total_max_eur": 1060,
        "notes": "Lower Saxony. Small, charming city. Moderate cost."
    },
    {
        "city": "Osnabrück", "country": "Germany",
        "rent_single_eur": 700, "rent_shared_eur": 450,
        "food_eur": 265, "transport_eur": 75,
        "utilities_eur": 108,
        "total_min_eur": 730, "total_max_eur": 1040,
        "notes": "Lower Saxony. Affordable."
    },
    {
        "city": "Oldenburg", "country": "Germany",
        "rent_single_eur": 700, "rent_shared_eur": 450,
        "food_eur": 265, "transport_eur": 75,
        "utilities_eur": 108,
        "total_min_eur": 730, "total_max_eur": 1040,
        "notes": "Lower Saxony. Affordable."
    },
    {
        "city": "Hildesheim", "country": "Germany",
        "rent_single_eur": 660, "rent_shared_eur": 430,
        "food_eur": 260, "transport_eur": 72,
        "utilities_eur": 105,
        "total_min_eur": 690, "total_max_eur": 970,
        "notes": "Lower Saxony. Very affordable."
    },
    {
        "city": "Braunschweig", "country": "Germany",
        "rent_single_eur": 700, "rent_shared_eur": 450,
        "food_eur": 265, "transport_eur": 75,
        "utilities_eur": 108,
        "total_min_eur": 730, "total_max_eur": 1040,
        "notes": "Lower Saxony. Affordable tech city."
    },
    {
        "city": "Clausthal-Zellerfeld", "country": "Germany",
        "rent_single_eur": 550, "rent_shared_eur": 370,
        "food_eur": 250, "transport_eur": 60,
        "utilities_eur": 100,
        "total_min_eur": 620, "total_max_eur": 880,
        "notes": "Lower Saxony. Very small, cheapest living in Germany."
    },
    {
        "city": "Vechta", "country": "Germany",
        "rent_single_eur": 600, "rent_shared_eur": 390,
        "food_eur": 255, "transport_eur": 60,
        "utilities_eur": 100,
        "total_min_eur": 640, "total_max_eur": 900,
        "notes": "Lower Saxony. Very small, very affordable."
    },
    {
        "city": "Göttingen", "country": "Germany",
        "rent_single_eur": 750, "rent_shared_eur": 480,
        "food_eur": 270, "transport_eur": 78,
        "utilities_eur": 110,
        "total_min_eur": 770, "total_max_eur": 1100,
        "notes": "Lower Saxony. Classic university town. Reasonable cost."
    },
    {
        "city": "Potsdam", "country": "Germany",
        "rent_single_eur": 850, "rent_shared_eur": 560,
        "food_eur": 275, "transport_eur": 86,
        "utilities_eur": 112,
        "total_min_eur": 840, "total_max_eur": 1200,
        "notes": "Brandenburg. Close to Berlin; partly commutable to Berlin."
    },
    {
        "city": "Frankfurt (Oder)", "country": "Germany",
        "rent_single_eur": 550, "rent_shared_eur": 360,
        "food_eur": 245, "transport_eur": 60,
        "utilities_eur": 100,
        "total_min_eur": 610, "total_max_eur": 860,
        "notes": "Brandenburg, Polish border. Very affordable."
    },
    {
        "city": "Greifswald", "country": "Germany",
        "rent_single_eur": 600, "rent_shared_eur": 390,
        "food_eur": 250, "transport_eur": 60,
        "utilities_eur": 100,
        "total_min_eur": 640, "total_max_eur": 900,
        "notes": "Mecklenburg-Vorpommern. Very affordable Baltic coast city."
    },
    {
        "city": "Rostock", "country": "Germany",
        "rent_single_eur": 650, "rent_shared_eur": 420,
        "food_eur": 255, "transport_eur": 68,
        "utilities_eur": 105,
        "total_min_eur": 680, "total_max_eur": 970,
        "notes": "Mecklenburg-Vorpommern. Baltic port city. Affordable."
    },
    {
        "city": "Magdeburg", "country": "Germany",
        "rent_single_eur": 600, "rent_shared_eur": 390,
        "food_eur": 250, "transport_eur": 62,
        "utilities_eur": 100,
        "total_min_eur": 640, "total_max_eur": 900,
        "notes": "Saxony-Anhalt capital. Very affordable."
    },
    {
        "city": "Halle (Saale)", "country": "Germany",
        "rent_single_eur": 600, "rent_shared_eur": 390,
        "food_eur": 250, "transport_eur": 62,
        "utilities_eur": 100,
        "total_min_eur": 640, "total_max_eur": 900,
        "notes": "Saxony-Anhalt. Very affordable, cultural city."
    },
    {
        "city": "Erfurt", "country": "Germany",
        "rent_single_eur": 640, "rent_shared_eur": 410,
        "food_eur": 255, "transport_eur": 65,
        "utilities_eur": 103,
        "total_min_eur": 670, "total_max_eur": 950,
        "notes": "Thuringia capital. Very affordable."
    },
    {
        "city": "Jena", "country": "Germany",
        "rent_single_eur": 660, "rent_shared_eur": 430,
        "food_eur": 255, "transport_eur": 68,
        "utilities_eur": 105,
        "total_min_eur": 690, "total_max_eur": 970,
        "notes": "Thuringia. Small, affordable university town. Optics industry hub."
    },
    {
        "city": "Ilmenau", "country": "Germany",
        "rent_single_eur": 550, "rent_shared_eur": 360,
        "food_eur": 245, "transport_eur": 55,
        "utilities_eur": 100,
        "total_min_eur": 600, "total_max_eur": 860,
        "notes": "Thuringia. Very small, very cheap. TU Ilmenau is engineering-focused."
    },
    {
        "city": "Chemnitz", "country": "Germany",
        "rent_single_eur": 580, "rent_shared_eur": 375,
        "food_eur": 248, "transport_eur": 60,
        "utilities_eur": 100,
        "total_min_eur": 620, "total_max_eur": 870,
        "notes": "Saxony. One of the cheapest cities in Germany."
    },
    {
        "city": "Vallendar", "country": "Germany",
        "rent_single_eur": 800, "rent_shared_eur": 520,
        "food_eur": 275, "transport_eur": 70,
        "utilities_eur": 110,
        "total_min_eur": 810, "total_max_eur": 1150,
        "notes": "Rhineland-Palatinate, WHU campus village near Koblenz."
    },
    {
        "city": "Eichstätt", "country": "Germany",
        "rent_single_eur": 700, "rent_shared_eur": 450,
        "food_eur": 260, "transport_eur": 65,
        "utilities_eur": 105,
        "total_min_eur": 720, "total_max_eur": 1020,
        "notes": "Bavaria. Small historic town. Private KU: €3,000/yr tuition."
    },
    {
        "city": "Bamberg", "country": "Germany",
        "rent_single_eur": 720, "rent_shared_eur": 460,
        "food_eur": 265, "transport_eur": 68,
        "utilities_eur": 108,
        "total_min_eur": 740, "total_max_eur": 1060,
        "notes": "Bavaria. UNESCO world heritage city. Affordable."
    },

    # ─── POLAND ───────────────────────────────────────────────────────────────
    # Sources: Numbeo Poland 2025, studyinpoland.pl, individual university websites
    # Rent in EUR (converted from PLN at ~4.27 PLN/EUR)
    {
        "city": "Warsaw", "country": "Poland",
        "rent_single_eur": 700, "rent_shared_eur": 400,
        "food_eur": 230, "transport_eur": 20,
        "utilities_eur": 95,
        "total_min_eur": 700, "total_max_eur": 1100,
        "notes": "Poland's capital and most expensive city. Strong job market. Monthly transit pass ~€20."
    },
    {
        "city": "Krakow", "country": "Poland",
        "rent_single_eur": 620, "rent_shared_eur": 360,
        "food_eur": 210, "transport_eur": 18,
        "utilities_eur": 90,
        "total_min_eur": 650, "total_max_eur": 1000,
        "notes": "Former capital, major student city. 200,000+ students. Vibrant culture."
    },
    {
        "city": "Lublin", "country": "Poland",
        "rent_single_eur": 480, "rent_shared_eur": 280,
        "food_eur": 190, "transport_eur": 15,
        "utilities_eur": 80,
        "total_min_eur": 530, "total_max_eur": 820,
        "notes": "Eastern Poland. Very affordable student city. Large medical university community."
    },
    {
        "city": "Szczecin", "country": "Poland",
        "rent_single_eur": 500, "rent_shared_eur": 290,
        "food_eur": 195, "transport_eur": 15,
        "utilities_eur": 82,
        "total_min_eur": 540, "total_max_eur": 840,
        "notes": "NW Poland, German border. Affordable Baltic port city."
    },
    {
        "city": "Gdańsk", "country": "Poland",
        "rent_single_eur": 580, "rent_shared_eur": 340,
        "food_eur": 210, "transport_eur": 17,
        "utilities_eur": 88,
        "total_min_eur": 620, "total_max_eur": 960,
        "notes": "Baltic coast city, Tri-city area. Growing tech hub. Moderate cost."
    },
    {
        "city": "Wrocław", "country": "Poland",
        "rent_single_eur": 580, "rent_shared_eur": 340,
        "food_eur": 205, "transport_eur": 17,
        "utilities_eur": 88,
        "total_min_eur": 610, "total_max_eur": 950,
        "notes": "SW Poland. Very popular with international students. Dynamic city."
    },
    {
        "city": "Wroclaw", "country": "Poland",
        "rent_single_eur": 580, "rent_shared_eur": 340,
        "food_eur": 205, "transport_eur": 17,
        "utilities_eur": 88,
        "total_min_eur": 610, "total_max_eur": 950,
        "notes": "SW Poland (same as Wrocław). Very popular with international students."
    },
    {
        "city": "Katowice", "country": "Poland",
        "rent_single_eur": 500, "rent_shared_eur": 290,
        "food_eur": 195, "transport_eur": 15,
        "utilities_eur": 82,
        "total_min_eur": 540, "total_max_eur": 840,
        "notes": "Silesia. Industrial city, affordable. Part of large Silesian conurbation."
    },
    {
        "city": "Bialystok", "country": "Poland",
        "rent_single_eur": 440, "rent_shared_eur": 260,
        "food_eur": 185, "transport_eur": 14,
        "utilities_eur": 78,
        "total_min_eur": 490, "total_max_eur": 760,
        "notes": "NE Poland. Among cheapest university cities in Poland."
    },
    {
        "city": "Poznań", "country": "Poland",
        "rent_single_eur": 560, "rent_shared_eur": 325,
        "food_eur": 205, "transport_eur": 16,
        "utilities_eur": 86,
        "total_min_eur": 590, "total_max_eur": 930,
        "notes": "W Poland. Trade-fair city. Moderate cost."
    },
    {
        "city": "Poznan", "country": "Poland",
        "rent_single_eur": 560, "rent_shared_eur": 325,
        "food_eur": 205, "transport_eur": 16,
        "utilities_eur": 86,
        "total_min_eur": 590, "total_max_eur": 930,
        "notes": "W Poland (same as Poznań). Trade-fair city. Moderate cost."
    },
    {
        "city": "Łódź", "country": "Poland",
        "rent_single_eur": 470, "rent_shared_eur": 275,
        "food_eur": 190, "transport_eur": 14,
        "utilities_eur": 80,
        "total_min_eur": 510, "total_max_eur": 790,
        "notes": "Central Poland. Very affordable, former textile city. Film school famous."
    },
    {
        "city": "Lodz", "country": "Poland",
        "rent_single_eur": 470, "rent_shared_eur": 275,
        "food_eur": 190, "transport_eur": 14,
        "utilities_eur": 80,
        "total_min_eur": 510, "total_max_eur": 790,
        "notes": "Central Poland (same as Łódź). Very affordable."
    },
    {
        "city": "Rzeszów", "country": "Poland",
        "rent_single_eur": 440, "rent_shared_eur": 255,
        "food_eur": 182, "transport_eur": 13,
        "utilities_eur": 78,
        "total_min_eur": 480, "total_max_eur": 750,
        "notes": "SE Poland. Very affordable. Aviation Valley tech hub."
    },
    {
        "city": "Kielce", "country": "Poland",
        "rent_single_eur": 420, "rent_shared_eur": 245,
        "food_eur": 180, "transport_eur": 13,
        "utilities_eur": 76,
        "total_min_eur": 460, "total_max_eur": 730,
        "notes": "Central Poland. One of the most affordable university cities."
    },
    {
        "city": "Opole", "country": "Poland",
        "rent_single_eur": 440, "rent_shared_eur": 255,
        "food_eur": 182, "transport_eur": 13,
        "utilities_eur": 78,
        "total_min_eur": 480, "total_max_eur": 750,
        "notes": "Silesia region. Very affordable small university city."
    },
    {
        "city": "Toruń", "country": "Poland",
        "rent_single_eur": 460, "rent_shared_eur": 265,
        "food_eur": 185, "transport_eur": 14,
        "utilities_eur": 79,
        "total_min_eur": 500, "total_max_eur": 770,
        "notes": "Kuyavia-Pomerania. Copernicus birthplace. Affordable."
    },
    {
        "city": "Zielona Góra", "country": "Poland",
        "rent_single_eur": 420, "rent_shared_eur": 245,
        "food_eur": 180, "transport_eur": 12,
        "utilities_eur": 76,
        "total_min_eur": 460, "total_max_eur": 720,
        "notes": "W Poland, German border. Small and very affordable."
    },
    {
        "city": "Gliwice", "country": "Poland",
        "rent_single_eur": 470, "rent_shared_eur": 275,
        "food_eur": 188, "transport_eur": 14,
        "utilities_eur": 80,
        "total_min_eur": 510, "total_max_eur": 790,
        "notes": "Silesia, near Katowice. Affordable tech city. Silesian UT."
    },
    {
        "city": "Bydgoszcz", "country": "Poland",
        "rent_single_eur": 440, "rent_shared_eur": 255,
        "food_eur": 183, "transport_eur": 13,
        "utilities_eur": 78,
        "total_min_eur": 480, "total_max_eur": 750,
        "notes": "Kuyavia-Pomerania. Affordable."
    },
    {
        "city": "Koszalin", "country": "Poland",
        "rent_single_eur": 400, "rent_shared_eur": 235,
        "food_eur": 178, "transport_eur": 12,
        "utilities_eur": 75,
        "total_min_eur": 440, "total_max_eur": 700,
        "notes": "Pomerania. Very affordable small Baltic city."
    },
    {
        "city": "Czestochowa", "country": "Poland",
        "rent_single_eur": 400, "rent_shared_eur": 235,
        "food_eur": 178, "transport_eur": 12,
        "utilities_eur": 75,
        "total_min_eur": 440, "total_max_eur": 700,
        "notes": "Silesia. Affordable. Famous pilgrimage city."
    },
    {
        "city": "Olsztyn", "country": "Poland",
        "rent_single_eur": 430, "rent_shared_eur": 250,
        "food_eur": 182, "transport_eur": 13,
        "utilities_eur": 77,
        "total_min_eur": 470, "total_max_eur": 740,
        "notes": "Warmia-Mazury. Very affordable. Lake district region."
    },

    # ─── ROMANIA ──────────────────────────────────────────────────────────────
    # Sources: Numbeo Romania 2025, studyinromania.gov.ro, university estimates
    {
        "city": "Bucharest", "country": "Romania",
        "rent_single_eur": 560, "rent_shared_eur": 320,
        "food_eur": 200, "transport_eur": 17,
        "utilities_eur": 85,
        "total_min_eur": 600, "total_max_eur": 950,
        "notes": "Romania's capital and most expensive city. Good transport, vibrant student life."
    },
    {
        "city": "Cluj-Napoca", "country": "Romania",
        "rent_single_eur": 480, "rent_shared_eur": 280,
        "food_eur": 185, "transport_eur": 14,
        "utilities_eur": 80,
        "total_min_eur": 540, "total_max_eur": 860,
        "notes": "IT capital of Romania. Growing tech hub. Rents rising fast."
    },
    {
        "city": "Timișoara", "country": "Romania",
        "rent_single_eur": 420, "rent_shared_eur": 245,
        "food_eur": 175, "transport_eur": 12,
        "utilities_eur": 78,
        "total_min_eur": 480, "total_max_eur": 750,
        "notes": "W Romania, EU2023 Capital of Culture. Very affordable, multicultural."
    },
    {
        "city": "Iași", "country": "Romania",
        "rent_single_eur": 380, "rent_shared_eur": 220,
        "food_eur": 165, "transport_eur": 11,
        "utilities_eur": 74,
        "total_min_eur": 430, "total_max_eur": 690,
        "notes": "Moldova region. Major university city. One of cheapest Romanian cities."
    },
    {
        "city": "Craiova", "country": "Romania",
        "rent_single_eur": 340, "rent_shared_eur": 200,
        "food_eur": 158, "transport_eur": 10,
        "utilities_eur": 70,
        "total_min_eur": 390, "total_max_eur": 640,
        "notes": "Oltenia. Very affordable. Automotive industry city."
    },
    {
        "city": "Brașov", "country": "Romania",
        "rent_single_eur": 420, "rent_shared_eur": 245,
        "food_eur": 175, "transport_eur": 12,
        "utilities_eur": 78,
        "total_min_eur": 480, "total_max_eur": 750,
        "notes": "Transylvania. Beautiful mountain city. Growing tech and tourism hub."
    },
    {
        "city": "Sibiu", "country": "Romania",
        "rent_single_eur": 380, "rent_shared_eur": 220,
        "food_eur": 165, "transport_eur": 11,
        "utilities_eur": 74,
        "total_min_eur": 430, "total_max_eur": 690,
        "notes": "Transylvania. Former EU Capital of Culture. Affordable and charming."
    },
    {
        "city": "Galați", "country": "Romania",
        "rent_single_eur": 310, "rent_shared_eur": 185,
        "food_eur": 152, "transport_eur": 9,
        "utilities_eur": 68,
        "total_min_eur": 360, "total_max_eur": 600,
        "notes": "Moldavia, Danube port. Among cheapest Romanian cities."
    },
    {
        "city": "Oradea", "country": "Romania",
        "rent_single_eur": 360, "rent_shared_eur": 210,
        "food_eur": 160, "transport_eur": 10,
        "utilities_eur": 72,
        "total_min_eur": 400, "total_max_eur": 650,
        "notes": "W Romania, Hungarian border. Very affordable. Fast-developing city."
    },
    {
        "city": "Constanta", "country": "Romania",
        "rent_single_eur": 370, "rent_shared_eur": 215,
        "food_eur": 162, "transport_eur": 10,
        "utilities_eur": 73,
        "total_min_eur": 420, "total_max_eur": 670,
        "notes": "Black Sea coast. Summer tourism drives rents up. Medical university city."
    },
    {
        "city": "Suceava", "country": "Romania",
        "rent_single_eur": 300, "rent_shared_eur": 178,
        "food_eur": 150, "transport_eur": 9,
        "utilities_eur": 67,
        "total_min_eur": 350, "total_max_eur": 580,
        "notes": "Bukovina region. One of cheapest Romanian cities. Peaceful atmosphere."
    },
    {
        "city": "Targoviste", "country": "Romania",
        "rent_single_eur": 290, "rent_shared_eur": 172,
        "food_eur": 148, "transport_eur": 8,
        "utilities_eur": 66,
        "total_min_eur": 340, "total_max_eur": 570,
        "notes": "Muntenia. Very affordable. Close to Bucharest (70km)."
    },
    {
        "city": "Pitesti", "country": "Romania",
        "rent_single_eur": 310, "rent_shared_eur": 183,
        "food_eur": 150, "transport_eur": 9,
        "utilities_eur": 67,
        "total_min_eur": 350, "total_max_eur": 590,
        "notes": "Muntenia. Renault/Dacia automotive hub. Affordable."
    },
    {
        "city": "Ploiesti", "country": "Romania",
        "rent_single_eur": 310, "rent_shared_eur": 183,
        "food_eur": 150, "transport_eur": 9,
        "utilities_eur": 67,
        "total_min_eur": 350, "total_max_eur": 590,
        "notes": "Muntenia, oil industry city near Bucharest. Affordable."
    },
    {
        "city": "Bacau", "country": "Romania",
        "rent_single_eur": 290, "rent_shared_eur": 172,
        "food_eur": 148, "transport_eur": 8,
        "utilities_eur": 66,
        "total_min_eur": 340, "total_max_eur": 570,
        "notes": "Moldavia. Very affordable. Industrial city."
    },
    {
        "city": "Targu Mures", "country": "Romania",
        "rent_single_eur": 330, "rent_shared_eur": 193,
        "food_eur": 155, "transport_eur": 9,
        "utilities_eur": 68,
        "total_min_eur": 370, "total_max_eur": 610,
        "notes": "Transylvania, bilingual Romanian-Hungarian city. Affordable. Medical university."
    },
    {
        "city": "Arad", "country": "Romania",
        "rent_single_eur": 330, "rent_shared_eur": 193,
        "food_eur": 155, "transport_eur": 9,
        "utilities_eur": 68,
        "total_min_eur": 370, "total_max_eur": 610,
        "notes": "W Romania, near Timișoara and Hungarian border. Affordable."
    },
    {
        "city": "Targu Jiu", "country": "Romania",
        "rent_single_eur": 270, "rent_shared_eur": 160,
        "food_eur": 145, "transport_eur": 8,
        "utilities_eur": 64,
        "total_min_eur": 320, "total_max_eur": 550,
        "notes": "Oltenia. One of cheapest Romanian cities. Brâncuși sculpture city."
    },
    {
        "city": "Alba Iulia", "country": "Romania",
        "rent_single_eur": 290, "rent_shared_eur": 172,
        "food_eur": 148, "transport_eur": 8,
        "utilities_eur": 66,
        "total_min_eur": 340, "total_max_eur": 570,
        "notes": "Transylvania. Historic capital of Greater Romania. Very affordable."
    },
]

count = 0
for c in CITIES:
    db.execute(sa.text("""
        INSERT INTO city_cost_of_living
        (city, country, rent_single_eur, rent_shared_eur, food_eur, transport_eur,
         utilities_eur, total_min_eur, total_max_eur, notes)
        VALUES
        (:city, :country, :rent_single_eur, :rent_shared_eur, :food_eur, :transport_eur,
         :utilities_eur, :total_min_eur, :total_max_eur, :notes)
    """), c)
    print(f"Inserted: {c['city']}, {c['country']}")
    count += 1

db.commit()
db.close()
print(f"\nDone: {count} cities inserted.")
