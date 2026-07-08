"""
Re-populate university_programs on Railway DB using correct ID mapping.
Local IDs (from populate_program_fees.py) → Railway IDs.
"""
import os, sys
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Aren%40%402%4017@localhost:5432/university_finder")
engine = create_engine(DATABASE_URL)

# Map: local_id -> railway_id
ID_MAP = {
    1: 27,   # LMU Munich
    2: 43,   # TUM
    3: 44,   # Heidelberg
    4: 45,   # KIT
    5: 46,   # Tübingen
    6: 47,   # Freiburg
    7: 48,   # Mannheim
    8: 49,   # Stuttgart
    9: 50,   # Humboldt Berlin
    10: 51,  # FU Berlin
    11: 52,  # TU Berlin
    12: 53,  # RWTH Aachen
    13: 54,  # Münster
    14: 55,  # Cologne
    15: 56,  # Bonn
    16: 57,  # Heinrich Heine Düsseldorf
    17: 16,  # TU Dortmund
    18: 17,  # Ruhr Bochum
    19: 18,  # Hamburg
    20: 19,  # TUHH
    21: 20,  # Goethe Frankfurt
    22: 21,  # TU Darmstadt
    23: 22,  # Göttingen
    24: 23,  # Leibniz Hannover
    25: 24,  # Bremen
    26: 25,  # OVGU Magdeburg
    27: 26,  # Jena
    28: 28,  # FAU Erlangen-Nuremberg
    29: 29,  # Würzburg
    30: 30,  # Augsburg
    31: 31,  # Regensburg
    32: 32,  # Bayreuth
    33: 33,  # Mainz
    34: 34,  # Saarland
    35: 35,  # Kiel
    36: 36,  # Rostock
    37: 37,  # Greifswald
    38: 38,  # Leipzig
    39: 39,  # TU Dresden
    40: 40,  # Duisburg-Essen
    41: 41,  # Frankfurt School
    42: 42,  # ESMT Berlin
    43: 58,  # WHU
    44: 59,  # Constructor University Bremen
    45: 60,  # University of Warsaw
    46: 61,  # Medical University of Warsaw
    47: 62,  # Jagiellonian University
    48: 63,  # Medical University of Gdańsk
    49: 64,  # Wrocław Medical University
    50: 65,  # Wrocław University of Science and Technology
    51: 66,  # AGH Krakow
    52: 67,  # Poznań University of Technology
    53: 68,  # Adam Mickiewicz University Poznań
    54: 69,  # University of Gdańsk
    55: 70,  # Nicolaus Copernicus University Toruń
    56: 71,  # Andrzej Frycz Modrzewski Krakow
    57: 72,  # SWPS
    58: 73,  # Lazarski University
}

# Import ALL_PROGRAMS from populate script
sys.path.insert(0, os.path.dirname(__file__))
# We replicate the data here to avoid running the whole populate script
# Instead, import the rows list directly

# Read populate_program_fees and extract ALL_PROGRAMS
import importlib.util, types

# Execute populate script in a sandbox to get ALL_PROGRAMS
with open(os.path.join(os.path.dirname(__file__), "populate_program_fees.py"), encoding="utf-8") as f:
    src = f.read()

# Patch the engine creation so it doesn't connect during import
patched = src.replace(
    'engine = create_engine(DATABASE_URL)',
    'engine = None  # patched'
).replace(
    'with engine.connect() as conn:',
    'if False:'  # skip the insert block
)

# Find where ALL_PROGRAMS is built — we just need the list
# Run up to the insert block
insert_idx = patched.find('\nwith engine')
if insert_idx == -1:
    insert_idx = patched.find('\nif False:')
setup_code = patched[:insert_idx] if insert_idx > 0 else patched

ns = {"__file__": os.path.join(os.path.dirname(__file__), "populate_program_fees.py")}
exec(setup_code, ns)
ALL_PROGRAMS = ns.get('ALL_PROGRAMS', [])
print(f"Loaded {len(ALL_PROGRAMS)} program rows from populate script")

# Remap IDs
remapped = []
skipped = set()
for (local_uni_id, field, degree, fee, note) in ALL_PROGRAMS:
    railway_id = ID_MAP.get(local_uni_id)
    if railway_id is None:
        skipped.add(local_uni_id)
        continue
    remapped.append((railway_id, field, degree, fee, note))

if skipped:
    print(f"WARNING: No mapping for local IDs: {sorted(skipped)}")

print(f"Remapped {len(remapped)} rows")

with engine.connect() as conn:
    conn.execute(text("DELETE FROM university_programs"))
    conn.execute(
        text("INSERT INTO university_programs (university_id, field_of_study, degree_level, tuition_fee_eur, notes) VALUES (:uid, :fos, :dl, :fee, :notes)"),
        [{"uid": r[0], "fos": r[1], "dl": r[2], "fee": r[3], "notes": r[4]} for r in remapped]
    )
    conn.commit()

print(f"Done — inserted {len(remapped)} rows with correct Railway IDs.")
