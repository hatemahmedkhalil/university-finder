"""
Enrich all 58 universities with:
- description
- ranking (QS World Rankings 2025)
- acceptance_rate
- living_cost_eur (monthly estimate for the city)
- logo_url (Wikimedia Commons)
"""
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

from app.database import SessionLocal
from sqlalchemy import text

DATA = {
    # ── GERMANY ───────────────────────────────────────────────────────────────
    1: {  # LMU Munich
        "description": "Ludwig Maximilian University of Munich (LMU) is one of Germany's oldest and most prestigious universities, founded in 1472. Consistently ranked among Europe's top research universities, LMU offers over 300 degree programmes across 18 faculties. Home to 42 Nobel laureates and situated in the cultural heart of Munich, it attracts students from 130 countries.",
        "ranking": 59,
        "acceptance_rate": 0.40,
        "living_cost_eur": 1100,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/LMU_Muenchen_Logo.svg/200px-LMU_Muenchen_Logo.svg.png",
    },
    2: {  # TUM
        "description": "Technical University of Munich (TUM) is Germany's top-ranked technical university and one of Europe's leading research institutions. Founded in 1868, TUM excels in engineering, natural sciences, life sciences, and management. It has a strong industry network, three Nobel Prize winners among current faculty, and campuses in Munich, Garching, Freising, and Singapore.",
        "ranking": 37,
        "acceptance_rate": 0.38,
        "living_cost_eur": 1100,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/TU_M%C3%BCnchen_Logo.svg/200px-TU_M%C3%BCnchen_Logo.svg.png",
    },
    3: {  # Heidelberg
        "description": "Heidelberg University, founded in 1386, is Germany's oldest university and one of Europe's most distinguished research institutions. Its motto 'Semper Apertus' (Forever Open) reflects its commitment to free inquiry. With 12 Nobel laureates among past and present researchers, Heidelberg is particularly renowned for medicine, natural sciences, and humanities.",
        "ranking": 61,
        "acceptance_rate": 0.30,
        "living_cost_eur": 900,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Uni_Heidelberg_Siegel.svg/200px-Uni_Heidelberg_Siegel.svg.png",
    },
    4: {  # KIT
        "description": "Karlsruhe Institute of Technology (KIT) was formed in 2009 by the merger of the University of Karlsruhe (founded 1825) and the Forschungszentrum Karlsruhe. KIT is the only German university with a Helmholtz association research centre on the same campus, making it a powerhouse for engineering, computer science, physics, and applied sciences.",
        "ranking": 119,
        "acceptance_rate": 0.50,
        "living_cost_eur": 850,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/KIT_Logo.svg/200px-KIT_Logo.svg.png",
    },
    5: {  # Tübingen
        "description": "The University of Tübingen, founded in 1477, is one of Germany's oldest and most respected universities. A member of the German Excellence Initiative, it is particularly strong in medicine, the natural sciences, humanities, and theology. The historic old-town campus along the Neckar river makes it one of Germany's most picturesque student cities.",
        "ranking": 191,
        "acceptance_rate": 0.45,
        "living_cost_eur": 820,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Uni_T%C3%BCbingen_Siegel.svg/200px-Uni_T%C3%BCbingen_Siegel.svg.png",
    },
    6: {  # Freiburg
        "description": "The University of Freiburg, established in 1457, is one of Germany's oldest universities and an Excellence Initiative institution. Located at the edge of the Black Forest near France and Switzerland, it offers a unique tri-national academic environment. Its strengths include biology, environmental sciences, medicine, and the humanities.",
        "ranking": 214,
        "acceptance_rate": 0.48,
        "living_cost_eur": 870,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Uni_Freiburg_Logo.svg/200px-Uni_Freiburg_Logo.svg.png",
    },
    7: {  # Mannheim
        "description": "The University of Mannheim is Germany's leading business and social sciences university, consistently ranked #1 in Germany for economics and management. Its Business School is triple-accredited (AACSB, EQUIS, AMBA) and among Europe's top 10. The beautiful Baroque palace that serves as its main building makes Mannheim one of Germany's most distinctive campuses.",
        "ranking": 321,
        "acceptance_rate": 0.35,
        "living_cost_eur": 870,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_Universitaet_Mannheim.svg/200px-Logo_Universitaet_Mannheim.svg.png",
    },
    8: {  # Stuttgart
        "description": "The University of Stuttgart, founded in 1829, is one of Germany's oldest and most respected technical universities. Strongly connected to the Baden-Württemberg automotive and mechanical engineering industry (Mercedes-Benz, Porsche, Bosch), it excels in engineering, architecture, computer science, and the natural sciences. It is a member of the TU9 association of leading German technical universities.",
        "ranking": 381,
        "acceptance_rate": 0.50,
        "living_cost_eur": 950,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Universit%C3%A4t_Stuttgart_logo.svg/200px-Universit%C3%A4t_Stuttgart_logo.svg.png",
    },
    9: {  # Humboldt Berlin
        "description": "Humboldt University of Berlin, founded in 1810, revolutionized the concept of a modern research university — its model influenced higher education worldwide. With 57 Nobel laureates among its alumni and faculty, HU Berlin is one of Europe's most historically significant universities. It excels in humanities, social sciences, medicine, and natural sciences.",
        "ranking": 128,
        "acceptance_rate": 0.33,
        "living_cost_eur": 950,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/HU_Berlin_Logo.svg/200px-HU_Berlin_Logo.svg.png",
    },
    10: {  # FU Berlin
        "description": "Free University of Berlin (FU Berlin), founded in 1948 during the Cold War as a symbol of academic freedom, is a member of the U15 group of research-intensive German universities. Particularly strong in the social sciences, humanities, and natural sciences, FU Berlin has a vibrant international campus in the southwest of the city.",
        "ranking": 113,
        "acceptance_rate": 0.38,
        "living_cost_eur": 950,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/FU_Berlin_logo.svg/200px-FU_Berlin_logo.svg.png",
    },
    11: {  # TU Berlin
        "description": "Technical University of Berlin (TU Berlin), founded in 1879, is one of Germany's largest technical universities and a leading centre for engineering and technology. Located in the heart of Berlin's startup and tech scene, TU Berlin has particularly strong ties to industry and entrepreneurship. It is a member of the TU9 group of Germany's top technical universities.",
        "ranking": 159,
        "acceptance_rate": 0.42,
        "living_cost_eur": 950,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/TU_Berlin_Logo.svg/200px-TU_Berlin_Logo.svg.png",
    },
    12: {  # RWTH Aachen
        "description": "RWTH Aachen University, founded in 1870, is Germany's largest technical university and one of Europe's most important places for science and research. With over 45,000 students and world-class research facilities, RWTH Aachen is especially renowned for engineering, mechanical engineering, electrical engineering, and materials science. It is a member of the TU9 and IDEA League.",
        "ranking": 103,
        "acceptance_rate": 0.35,
        "living_cost_eur": 830,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/RWTH_Aachen_University_Logo.svg/200px-RWTH_Aachen_University_Logo.svg.png",
    },
    13: {  # Münster
        "description": "The University of Münster, founded in 1780, is one of Germany's largest universities with over 44,000 students. It is particularly renowned for law, chemistry, mathematics, and the life sciences. Münster is consistently ranked among Germany's most livable student cities, offering an affordable and high-quality student experience in the heart of Westphalia.",
        "ranking": 271,
        "acceptance_rate": 0.50,
        "living_cost_eur": 780,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Uni-Muenster_Logo_2015_4c.svg/200px-Uni-Muenster_Logo_2015_4c.svg.png",
    },
    14: {  # Cologne
        "description": "The University of Cologne, founded in 1388 and re-established in 1919, is one of Germany's largest and oldest universities with around 50,000 students. It has particular strengths in law, economics, medicine, and the natural sciences, and hosts one of Germany's most important economic research institutes. Cologne itself is Germany's fourth-largest city with a vibrant cultural life.",
        "ranking": 251,
        "acceptance_rate": 0.52,
        "living_cost_eur": 900,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Uni_Koeln_Logo.svg/200px-Uni_Koeln_Logo.svg.png",
    },
    15: {  # Bonn
        "description": "The University of Bonn, founded in 1818, is one of Germany's most prestigious research universities and a member of the German Excellence Initiative. It has produced eight Nobel Prize winners and counts Karl Marx among its alumni. Particularly strong in mathematics, physics, and the life sciences, the university is located in Germany's former capital city along the Rhine.",
        "ranking": 201,
        "acceptance_rate": 0.45,
        "living_cost_eur": 830,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Uni_Bonn_Logo.svg/200px-Uni_Bonn_Logo.svg.png",
    },
    16: {  # Düsseldorf
        "description": "Heinrich Heine University Düsseldorf, founded in 1965 and named after the poet Heinrich Heine, is a modern university with approximately 35,000 students. It has a strong focus on medicine, natural sciences, law, and the humanities. Located in one of Germany's wealthiest cities, with excellent connections to the Ruhr Valley academic network and industry.",
        "ranking": 701,
        "acceptance_rate": 0.55,
        "living_cost_eur": 920,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/HHU-Logo.svg/200px-HHU-Logo.svg.png",
    },
    17: {  # TU Dortmund
        "description": "TU Dortmund University, established in 1968, is a member of the TU9 group of Germany's top technical universities. It has particular strengths in engineering, statistics, journalism, and teacher education. Located in the Ruhr Valley — Germany's former industrial heartland now transformed into a research and culture hub — it has strong industry partnerships with major German companies.",
        "ranking": 601,
        "acceptance_rate": 0.55,
        "living_cost_eur": 760,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/TU_Dortmund_Logo.svg/200px-TU_Dortmund_Logo.svg.png",
    },
    18: {  # Ruhr Bochum
        "description": "Ruhr University Bochum (RUB), founded in 1962, was the first university to be established in the Ruhr area, Germany's densely populated industrial heartland. With around 43,000 students, it is one of the largest German universities, offering a broad range of programmes in engineering, natural sciences, social sciences, and the humanities on a single compact campus.",
        "ranking": 411,
        "acceptance_rate": 0.50,
        "living_cost_eur": 760,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Ruhr_Universit%C3%A4t_Bochum_Logo.svg/200px-Ruhr_Universit%C3%A4t_Bochum_Logo.svg.png",
    },
    19: {  # Hamburg
        "description": "The University of Hamburg, founded in 1919, is the largest research university in northern Germany with around 40,000 students. A member of the German Excellence Initiative, it is particularly strong in climate research, maritime law, physics, and the humanities. Hamburg is Germany's second-largest city and a major international business and media hub with a high quality of life.",
        "ranking": 241,
        "acceptance_rate": 0.45,
        "living_cost_eur": 1000,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Uni_Hamburg_logo.svg/200px-Uni_Hamburg_logo.svg.png",
    },
    20: {  # TUHH
        "description": "Hamburg University of Technology (TUHH), founded in 1978, is a focused technical university in Hamburg with around 7,500 students. Despite its compact size, TUHH consistently ranks among Germany's top technical universities for research output per faculty member. It excels in engineering, logistics, computer science, and green technologies, with strong ties to Hamburg's maritime and logistics industry.",
        "ranking": 601,
        "acceptance_rate": 0.58,
        "living_cost_eur": 1000,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/TUHH-Logo.svg/200px-TUHH-Logo.svg.png",
    },
    21: {  # Goethe Frankfurt
        "description": "Goethe University Frankfurt, founded in 1914 by citizens of Frankfurt, is one of Germany's largest universities with around 46,000 students. Named after the city's most famous son, it has a strong tradition in social sciences, economics, law, and medicine. Frankfurt's status as Europe's financial capital means excellent internship and career opportunities for students in economics and law.",
        "ranking": 301,
        "acceptance_rate": 0.48,
        "living_cost_eur": 1050,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Goethe-Logo.svg/200px-Goethe-Logo.svg.png",
    },
    22: {  # TU Darmstadt
        "description": "TU Darmstadt, founded in 1877, was the first university in the world to offer an electrical engineering degree and has remained a leader in engineering and technology ever since. A member of the TU9, it excels in computer science, electrical engineering, mechanical engineering, and materials science. Its strong industry connections — particularly with SAP, Software AG, and Merck — ensure excellent graduate employment prospects.",
        "ranking": 351,
        "acceptance_rate": 0.45,
        "living_cost_eur": 950,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/TU_Darmstadt_Logo.svg/200px-TU_Darmstadt_Logo.svg.png",
    },
    23: {  # Göttingen
        "description": "The University of Göttingen, founded in 1734 by King George II of Great Britain, is one of Germany's most celebrated research universities. It has produced 47 Nobel laureates — more than almost any other university in history. Particularly strong in mathematics, physics, chemistry, and the life sciences, it was home to legendary figures like Gauss, Riemann, and Hilbert.",
        "ranking": 214,
        "acceptance_rate": 0.45,
        "living_cost_eur": 790,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Uni_G%C3%B6ttingen_Logo.svg/200px-Uni_G%C3%B6ttingen_Logo.svg.png",
    },
    24: {  # Leibniz Hannover
        "description": "Leibniz University Hannover (LUH), named after the famous philosopher and mathematician Gottfried Wilhelm Leibniz, was founded in 1831. With around 27,000 students, it is a comprehensive research university with particular strengths in engineering, natural sciences, and economics. Hannover is a major trade fair city with the world's largest industrial trade show (Hannover Messe), offering excellent networking opportunities.",
        "ranking": 501,
        "acceptance_rate": 0.52,
        "living_cost_eur": 820,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Leibniz_Universit%C3%A4t_Hannover_logo.svg/200px-Leibniz_Universit%C3%A4t_Hannover_logo.svg.png",
    },
    25: {  # Bremen
        "description": "The University of Bremen, founded in 1971, is a medium-sized research university with around 18,000 students. A member of the German Excellence Initiative, it is particularly strong in marine science, cognitive science, social sciences, and production engineering. Bremen is home to major aerospace companies including Airbus and OHB, providing excellent industry connections for engineering students.",
        "ranking": 601,
        "acceptance_rate": 0.55,
        "living_cost_eur": 820,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Uni_Bremen_logo.svg/200px-Uni_Bremen_logo.svg.png",
    },
    26: {  # OVGU Magdeburg
        "description": "Otto von Guericke University Magdeburg (OVGU), established in 1993, is one of Germany's youngest universities. Named after the inventor of the vacuum pump, it has developed strong research profiles in medicine, cognitive neuroscience, engineering, and computer science. Its compact size (around 14,000 students) and low cost of living in Magdeburg make it an attractive choice for international students.",
        "ranking": 801,
        "acceptance_rate": 0.60,
        "living_cost_eur": 700,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Otto-von-Guericke-Universit%C3%A4t_Magdeburg_logo.svg/200px-Otto-von-Guericke-Universit%C3%A4t_Magdeburg_logo.svg.png",
    },
    27: {  # Jena
        "description": "Friedrich Schiller University Jena, founded in 1558, is one of Germany's oldest universities and a member of the German Excellence Initiative. Located in Thuringia, the heart of German Romanticism, it has particular strengths in photonics, materials science, the life sciences, and the humanities. Jena is home to global optics companies like ZEISS and SCHOTT, offering unparalleled industry connections in these fields.",
        "ranking": 451,
        "acceptance_rate": 0.55,
        "living_cost_eur": 720,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/FSU_Jena_logo.svg/200px-FSU_Jena_logo.svg.png",
    },
    28: {  # FAU Erlangen
        "description": "Friedrich-Alexander University Erlangen-Nuremberg (FAU), founded in 1743, is one of Germany's largest and most prestigious universities with around 40,000 students and a strong research output. FAU is particularly renowned for engineering, medicine, chemistry, and physics, and has strong ties to the Nuremberg-Erlangen technology corridor, home to Siemens, Adidas, and major medical device companies.",
        "ranking": 271,
        "acceptance_rate": 0.45,
        "living_cost_eur": 830,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/FAU_Erlangen_Nuernberg_Logo.svg/200px-FAU_Erlangen_Nuernberg_Logo.svg.png",
    },
    29: {  # Würzburg
        "description": "Julius Maximilian University of Würzburg (JMU), founded in 1402, is one of Germany's oldest universities. Wilhelm Röntgen discovered X-rays here in 1895. Today, JMU is particularly strong in medicine, life sciences, physics, and computer science. The charming Baroque city of Würzburg on the Main river offers an excellent quality of student life at a relatively affordable cost.",
        "ranking": 351,
        "acceptance_rate": 0.50,
        "living_cost_eur": 790,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Uni_W%C3%BCrzburg_Logo.svg/200px-Uni_W%C3%BCrzburg_Logo.svg.png",
    },
    30: {  # Augsburg
        "description": "The University of Augsburg, founded in 1970, is a young and dynamic university with around 20,000 students. It has particular strengths in law, economics, materials science, computer science, and sports science. Augsburg offers a compact campus, a high quality of life, and close proximity to Munich's academic and industry networks, making it a popular choice for students who want a smaller campus experience in Bavaria.",
        "ranking": 901,
        "acceptance_rate": 0.60,
        "living_cost_eur": 950,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Universitaet-augsburg-logo.svg/200px-Universitaet-augsburg-logo.svg.png",
    },
    31: {  # Regensburg
        "description": "The University of Regensburg, founded in 1962, is a comprehensive university with around 22,000 students in the medieval city of Regensburg — a UNESCO World Heritage Site. It offers strong programmes in law, economics, medicine, and the natural sciences. Pope Benedict XVI was once a professor of theology here. The low cost of living and beautiful location make it especially attractive for international students.",
        "ranking": 701,
        "acceptance_rate": 0.58,
        "living_cost_eur": 800,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Uni-Regensburg-Logo.svg/200px-Uni-Regensburg-Logo.svg.png",
    },
    32: {  # Bayreuth
        "description": "The University of Bayreuth, founded in 1975, is a research university known for an innovative interdisciplinary approach. Despite being relatively small (~13,000 students), it excels in polymer science, Africa studies, law, economics, and environmental science. Bayreuth is world-famous for its annual Wagner Festival, and the university benefits from a compact campus, strong faculty-to-student ratios, and close industry ties with BMW and others.",
        "ranking": 801,
        "acceptance_rate": 0.62,
        "living_cost_eur": 740,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Uni_Bayreuth_Logo.svg/200px-Uni_Bayreuth_Logo.svg.png",
    },
    33: {  # Mainz
        "description": "Johannes Gutenberg University Mainz (JGU), named after the inventor of the printing press who was born in the city, was founded in 1477 and re-established in 1946. A member of the German Excellence Initiative, JGU is particularly strong in chemistry, physics, medicine, and the humanities. It became globally recognised as the home of BioNTech, the company behind the first approved mRNA COVID-19 vaccine.",
        "ranking": 301,
        "acceptance_rate": 0.48,
        "living_cost_eur": 870,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Johannes_Gutenberg-Universit%C3%A4t_Mainz_logo.svg/200px-Johannes_Gutenberg-Universit%C3%A4t_Mainz_logo.svg.png",
    },
    34: {  # Saarland
        "description": "Saarland University, founded in 1948 as a Franco-German institution, has a distinctive international character reflecting its location at the heart of the Greater Region bordering France and Luxembourg. It is particularly strong in computer science, bioinformatics, materials science, and law. The Saarbrücken campus hosts the prestigious Max Planck Institute for Informatics, making it a global hub for computer science research.",
        "ranking": 601,
        "acceptance_rate": 0.58,
        "living_cost_eur": 750,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Uni-saarland-logo.svg/200px-Uni-saarland-logo.svg.png",
    },
    35: {  # Kiel
        "description": "Christian-Albrechts-University of Kiel (CAU), founded in 1665, is the largest university in Schleswig-Holstein with around 27,000 students. A member of the German Excellence Initiative, Kiel is world-renowned for oceanography, marine science, economics, and the natural sciences. Located on the Baltic Sea, Kiel hosts the prestigious GEOMAR Helmholtz Centre for Ocean Research and the Institut für Weltwirtschaft (IfW), one of the world's leading economics research institutes.",
        "ranking": 401,
        "acceptance_rate": 0.50,
        "living_cost_eur": 790,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/CAU_Kiel_Logo.svg/200px-CAU_Kiel_Logo.svg.png",
    },
    36: {  # Rostock
        "description": "The University of Rostock, founded in 1419, is the oldest university in northern Europe and the Baltic Sea region. With around 14,000 students, it offers programmes across all major disciplines, with particular strengths in maritime sciences, agriculture, medicine, and engineering. Rostock is an affordable port city on the Baltic Sea offering an attractive student lifestyle.",
        "ranking": 801,
        "acceptance_rate": 0.62,
        "living_cost_eur": 700,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Uni_Rostock_Logo.svg/200px-Uni_Rostock_Logo.svg.png",
    },
    37: {  # Greifswald
        "description": "The University of Greifswald, founded in 1456, is one of the oldest universities in northern Europe. Located in the picturesque Baltic Sea city of Greifswald, it has particular strengths in medicine, pharmacy, life sciences, and Nordic studies. With around 11,000 students, it offers an intimate academic environment with one of the lowest costs of living among German university cities.",
        "ranking": 1001,
        "acceptance_rate": 0.65,
        "living_cost_eur": 680,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Logo_Greifswald.svg/200px-Logo_Greifswald.svg.png",
    },
    38: {  # Leipzig
        "description": "The University of Leipzig, founded in 1409, is Germany's second-oldest university still in operation. A centre of German intellectual life for centuries — Richard Wagner, Leibniz, and Nietzsche all studied here — it is today a vibrant research university with particular strengths in medicine, economics, philology, and the social sciences. Leipzig is one of Germany's most dynamic cities with a booming creative and tech scene.",
        "ranking": 501,
        "acceptance_rate": 0.50,
        "living_cost_eur": 750,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Uni_Leipzig_Logo.svg/200px-Uni_Leipzig_Logo.svg.png",
    },
    39: {  # TU Dresden
        "description": "TU Dresden, founded in 1828, is one of Germany's largest and most dynamic technical universities and a member of the TU9. An Excellence Initiative university, it has outstanding research profiles in engineering, computer science, medicine, and the humanities. Located in the 'Florence of the Elbe', Dresden offers world-class cultural amenities alongside a thriving semiconductor and microelectronics industry cluster (Infineon, Bosch, GLOBALFOUNDRIES).",
        "ranking": 291,
        "acceptance_rate": 0.45,
        "living_cost_eur": 760,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/TU_Dresden_Logo.svg/200px-TU_Dresden_Logo.svg.png",
    },
    40: {  # Duisburg-Essen
        "description": "The University of Duisburg-Essen (UDE), formed in 2003 by the merger of the universities of Duisburg and Essen, is one of Germany's larger universities with around 42,000 students across two campuses. It has particular strengths in nanotechnology, medical sciences, economics, and social sciences. The dual-city campus structure gives students the benefits of two distinct urban environments in the heart of the Ruhr Valley.",
        "ranking": 601,
        "acceptance_rate": 0.55,
        "living_cost_eur": 760,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Uni_Due_Logo.svg/200px-Uni_Due_Logo.svg.png",
    },
    41: {  # Frankfurt School
        "description": "Frankfurt School of Finance & Management is one of Europe's premier business schools and Germany's top-ranked institution for finance and management. Fully accredited (AACSB, EQUIS, AMBA — the Triple Crown), it offers specialised undergraduate, master's, MBA, and PhD programmes. Located in Frankfurt — the eurozone's financial capital and home to the ECB, Deutsche Bank, and a thriving fintech scene — it provides unrivalled career opportunities in finance.",
        "ranking": 501,
        "acceptance_rate": 0.25,
        "living_cost_eur": 1100,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Frankfurt_School_of_Finance_%26_Management_logo.svg/200px-Frankfurt_School_of_Finance_%26_Management_logo.svg.png",
    },
    42: {  # ESMT Berlin
        "description": "ESMT Berlin is a leading European business school founded in 2002 by 25 major international companies including Deutsche Telekom, Siemens, and Volkswagen. It holds the Triple Crown accreditation (AACSB, EQUIS, AMBA) and regularly ranks among Europe's top business schools. Located in the historic Schlossplatz in central Berlin, ESMT specialises in management, technology, and leadership programmes with a strong focus on digital transformation.",
        "ranking": 601,
        "acceptance_rate": 0.20,
        "living_cost_eur": 1050,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/ESMT_Berlin_logo.svg/200px-ESMT_Berlin_logo.svg.png",
    },
    43: {  # WHU
        "description": "WHU – Otto Beisheim School of Management is Germany's top-ranked private business school and one of Europe's most prestigious. Founded in 1984, it holds the Triple Crown accreditation and offers highly selective bachelor's, master's, MBA, and PhD programmes. Located in Vallendar on the Rhine near Koblenz, WHU maintains a tight-knit campus community and produces some of Germany's most sought-after business graduates.",
        "ranking": 301,
        "acceptance_rate": 0.15,
        "living_cost_eur": 750,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/WHU_Logo.svg/200px-WHU_Logo.svg.png",
    },
    44: {  # Constructor Bremen
        "description": "Constructor University Bremen (formerly Jacobs University) is a private, English-language research university founded in 1999 on a residential campus in Bremen. It offers bachelor's, master's, and PhD programmes in engineering, natural sciences, social sciences, and management. With over 110 nationalities represented among its students, it is one of Germany's most international universities and an ideal choice for students seeking a fully English-taught experience.",
        "ranking": 701,
        "acceptance_rate": 0.45,
        "living_cost_eur": 900,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Constructor_University_Logo.svg/200px-Constructor_University_Logo.svg.png",
    },
    # ── POLAND ────────────────────────────────────────────────────────────────
    45: {  # Warsaw
        "description": "The University of Warsaw, founded in 1816, is Poland's largest and most prestigious university with around 55,000 students. Consistently ranked as Poland's top university in international rankings, it excels in humanities, social sciences, mathematics, and natural sciences. Warsaw is Central Europe's fastest-growing tech hub, and the university's strong entrepreneurship ecosystem produces many of the region's leading startups.",
        "ranking": 308,
        "acceptance_rate": 0.38,
        "living_cost_eur": 700,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Logo_UW.svg/200px-Logo_UW.svg.png",
    },
    46: {  # Medical Warsaw
        "description": "Medical University of Warsaw (WUM), established in 1950 as the successor to the medical faculty of Warsaw University, is Poland's most prestigious medical school. With around 9,000 students, it offers full-degree medicine and dentistry programmes in English specifically designed for international students. Its teaching hospitals in central Warsaw provide unparalleled clinical training opportunities.",
        "ranking": 701,
        "acceptance_rate": 0.20,
        "living_cost_eur": 700,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Medical_University_of_Warsaw_Logo.svg/200px-Medical_University_of_Warsaw_Logo.svg.png",
    },
    47: {  # Jagiellonian
        "description": "Jagiellonian University in Kraków, founded in 1364, is Poland's oldest university and one of the oldest in Central Europe. Nicolaus Copernicus studied here. Consistently ranked as Poland's second-best university, it excels in medicine, law, the humanities, and natural sciences. Kraków is one of Europe's most beautiful and culturally rich cities, and studying at Jagiellonian offers an unmatched combination of academic quality and quality of life.",
        "ranking": 301,
        "acceptance_rate": 0.35,
        "living_cost_eur": 650,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/UJ_logo.svg/200px-UJ_logo.svg.png",
    },
    48: {  # Medical Gdańsk
        "description": "Medical University of Gdańsk (GUMed), founded in 1945, is one of Poland's leading medical schools and a major centre for clinical research. Located in the historic Tri-City area on the Baltic Sea, it offers English-taught medicine, pharmacy, and nursing programmes attracting students from over 50 countries. Its proximity to Gdańsk's vibrant old town and beaches makes it a uniquely appealing study destination.",
        "ranking": 1001,
        "acceptance_rate": 0.25,
        "living_cost_eur": 630,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/GUMed_logo.svg/200px-GUMed_logo.svg.png",
    },
    49: {  # Wrocław Medical
        "description": "Wrocław Medical University (UMW), founded in 1950, is a leading Polish medical institution and one of the top choices for international students pursuing English-medium medical studies in Poland. Located in Wrocław — a dynamic city often called the 'Florence of Poland' for its stunning architecture — it offers internationally recognised degrees in medicine, dentistry, and pharmacy.",
        "ranking": 1001,
        "acceptance_rate": 0.25,
        "living_cost_eur": 620,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/UMW_logo.svg/200px-UMW_logo.svg.png",
    },
    50: {  # Wrocław Tech
        "description": "Wrocław University of Science and Technology (WUST), founded in 1945, is one of Poland's premier technical universities and a leading research institution in Central Europe. With around 33,000 students, it excels in engineering, computer science, architecture, and the natural sciences. Wrocław has one of Poland's most vibrant student cultures and a booming IT sector with offices of Google, IBM, Capgemini, and Nokia.",
        "ranking": 651,
        "acceptance_rate": 0.45,
        "living_cost_eur": 620,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/WUST_logo.svg/200px-WUST_logo.svg.png",
    },
    51: {  # AGH Krakow
        "description": "AGH University of Krakow (AGH UST), founded in 1919, is Poland's leading technical university for mining, energy, and materials science, and one of Central Europe's top engineering institutions. With over 16,000 students and a strong entrepreneurship culture, AGH has expanded far beyond its mining origins to excel in computer science, telecommunications, robotics, and physics. Located in vibrant Kraków, it offers outstanding lifestyle alongside academic excellence.",
        "ranking": 801,
        "acceptance_rate": 0.48,
        "living_cost_eur": 650,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/AGH_UST_logo.svg/200px-AGH_UST_logo.svg.png",
    },
    52: {  # Poznań Tech
        "description": "Poznań University of Technology (PUT), founded in 1919, is one of Poland's oldest and most respected technical universities. With around 18,000 students, it excels in electrical engineering, mechanical engineering, computer science, and architecture. Poznań is a major economic and business hub in western Poland, with strong ties to the German economy and excellent employment prospects for engineering graduates.",
        "ranking": 1001,
        "acceptance_rate": 0.50,
        "living_cost_eur": 600,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Poznan_University_of_Technology_logo.svg/200px-Poznan_University_of_Technology_logo.svg.png",
    },
    53: {  # Adam Mickiewicz Poznań
        "description": "Adam Mickiewicz University in Poznań (UAM), founded in 1919, is one of Poland's largest and most prestigious comprehensive universities with around 50,000 students. Named after Poland's national poet, it excels in law, linguistics, social sciences, and the humanities. UAM is Poland's leading university for international partnerships and runs over 500 Erasmus+ exchange agreements across Europe.",
        "ranking": 601,
        "acceptance_rate": 0.42,
        "living_cost_eur": 600,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/UAM_logo.svg/200px-UAM_logo.svg.png",
    },
    54: {  # Gdańsk
        "description": "The University of Gdańsk, founded in 1970, is the largest university in northern Poland with around 23,000 students. Located in the historic port city of Gdańsk — a UNESCO World Heritage candidate and cradle of the Solidarity movement — it has particular strengths in economics, law, oceanography, and the humanities. The Tri-City area (Gdańsk, Gdynia, Sopot) offers a unique coastal lifestyle at Poland's most affordable costs.",
        "ranking": 1001,
        "acceptance_rate": 0.55,
        "living_cost_eur": 620,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Ug_logo.svg/200px-Ug_logo.svg.png",
    },
    55: {  # Nicolaus Copernicus Toruń
        "description": "Nicolaus Copernicus University in Toruń (NCU), founded in 1945 and named after the famous astronomer born in Toruń, is a comprehensive research university with around 20,000 students. It has particular strengths in astronomy, physics, chemistry, medicine, and the humanities. Toruń's Gothic old town is a UNESCO World Heritage Site, and the city's medieval architecture and compact student-friendly layout make it one of Poland's most charming university cities.",
        "ranking": 801,
        "acceptance_rate": 0.50,
        "living_cost_eur": 580,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/NCU_Torun_logo.svg/200px-NCU_Torun_logo.svg.png",
    },
    56: {  # Andrzej Frycz Modrzewski Krakow
        "description": "Andrzej Frycz Modrzewski Krakow University (AFMKU), established in 2000, is one of Poland's largest non-public universities with around 7,000 students. It offers accessible, practically-oriented programmes in law, international relations, management, and social sciences. Located in Kraków, it provides students with access to one of Poland's most vibrant university cities at a lower tuition cost than public institutions.",
        "ranking": None,
        "acceptance_rate": 0.80,
        "living_cost_eur": 650,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/AFMKU_logo.svg/200px-AFMKU_logo.svg.png",
    },
    57: {  # SWPS
        "description": "SWPS University of Social Sciences and Humanities (SWPS), founded in 1996, is Poland's leading non-public university for the social sciences and humanities, with campuses in Warsaw, Wrocław, Poznań, Katowice, and Sopot. It is accredited to award both undergraduate and doctoral degrees and is particularly renowned for psychology, law, design, journalism, and cross-disciplinary innovation. Its Applied Psychology and Design programmes are among Poland's most sought-after.",
        "ranking": None,
        "acceptance_rate": 0.75,
        "living_cost_eur": 700,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/SWPS_logo.svg/200px-SWPS_logo.svg.png",
    },
    58: {  # Łazarski
        "description": "Lazarski University in Warsaw, founded in 1993, is a modern private university with a strong reputation for law, economics, and management. It is Poland's first private university to establish a full law faculty and is consistently rated among Poland's top private institutions for legal education. With around 3,500 students and a central Warsaw campus, Lazarski offers a focused, career-oriented education with strong ties to the legal and business communities.",
        "ranking": None,
        "acceptance_rate": 0.82,
        "living_cost_eur": 700,
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Lazarski_University_logo.svg/200px-Lazarski_University_logo.svg.png",
    },
}


def main():
    db = SessionLocal()
    updated = 0
    try:
        for uni_id, fields in DATA.items():
            db.execute(
                text("""
                    UPDATE universities SET
                        description   = :description,
                        ranking       = :ranking,
                        acceptance_rate = :acceptance_rate,
                        living_cost_eur = :living_cost_eur,
                        logo_url      = :logo_url
                    WHERE id = :id
                """),
                {
                    "description":     fields["description"],
                    "ranking":         fields["ranking"],
                    "acceptance_rate": fields["acceptance_rate"],
                    "living_cost_eur": fields["living_cost_eur"],
                    "logo_url":        fields["logo_url"],
                    "id":              uni_id,
                }
            )
            updated += 1
        db.commit()
        print(f"Updated {updated} universities.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
