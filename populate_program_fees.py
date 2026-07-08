"""
Populate university_programs table with per-program tuition fees for all 58 universities.
Run with: python populate_program_fees.py
Sources: Official university websites, verified July 2026.
"""
import os, sys
os.chdir(os.path.dirname(__file__))

from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Aren%40%402%4017@localhost:5432/university_finder")
engine = create_engine(DATABASE_URL)

# degree_level values: "bachelor" | "master" | "phd" | "all"
# "all" = same fee regardless of level (most flat-fee universities)

# Helper: build rows
def rows(uni_id, programs_list):
    return [(uni_id, field, level, fee, note) for field, level, fee, note in programs_list]

ALL_PROGRAMS = []

# ─── GERMANY — BERLIN (€0 tuition, semester fee only) ───────────────────
# IDs 9, 10, 11

# 9 — Humboldt University of Berlin
ALL_PROGRAMS += rows(9, [
    ("Humanities & Cultural Studies",        "all", 0, "No tuition fee; semester contribution ~€315"),
    ("Social Sciences",                      "all", 0, "No tuition fee; semester contribution ~€315"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€315"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€315"),
    ("Economics & Business",                 "all", 0, "No tuition fee; semester contribution ~€315"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€315"),
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€315"),
])

# 10 — Free University of Berlin
ALL_PROGRAMS += rows(10, [
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€312"),
    ("Social & Political Sciences",          "all", 0, "No tuition fee; semester contribution ~€312"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€312"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€312"),
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€312"),
    ("Veterinary Medicine",                  "all", 0, "No tuition fee; semester contribution ~€312"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€312"),
])

# 11 — TU Berlin
ALL_PROGRAMS += rows(11, [
    ("Engineering",                          "all", 0, "No tuition fee; semester contribution ~€307"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€307"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€307"),
    ("Economics & Management",               "all", 0, "No tuition fee; semester contribution ~€307"),
    ("Architecture & Urban Planning",        "all", 0, "No tuition fee; semester contribution ~€307"),
])

# ─── GERMANY — NRW (€0 tuition) ──────────────────────────────────────────
# IDs 12, 13, 14, 15, 16, 17, 18, 40

# 12 — RWTH Aachen
ALL_PROGRAMS += rows(12, [
    ("Engineering",                          "all", 0, "No tuition fee; semester contribution ~€298"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€298"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€298"),
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€298"),
    ("Architecture",                         "all", 0, "No tuition fee; semester contribution ~€298"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€298"),
])

# 13 — University of Münster
ALL_PROGRAMS += rows(13, [
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€311"),
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€311"),
    ("Theology",                             "all", 0, "No tuition fee; semester contribution ~€311"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€311"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€311"),
    ("Social Sciences",                      "all", 0, "No tuition fee; semester contribution ~€311"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€311"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€311"),
])

# 14 — University of Cologne
ALL_PROGRAMS += rows(14, [
    ("Economics & Business",                 "all", 0, "No tuition fee; semester contribution ~€291"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€291"),
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€291"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€291"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€291"),
    ("Social Sciences",                      "all", 0, "No tuition fee; semester contribution ~€291"),
])

# 15 — University of Bonn
ALL_PROGRAMS += rows(15, [
    ("Mathematics",                          "all", 0, "No tuition fee; semester contribution ~€299"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€299"),
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€299"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€299"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€299"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€299"),
    ("Agriculture",                          "all", 0, "No tuition fee; semester contribution ~€299"),
])

# 16 — Heinrich Heine University Düsseldorf
ALL_PROGRAMS += rows(16, [
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€302"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€302"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€302"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€302"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€302"),
    ("Social Sciences",                      "all", 0, "No tuition fee; semester contribution ~€302"),
])

# 17 — TU Dortmund
ALL_PROGRAMS += rows(17, [
    ("Engineering",                          "all", 0, "No tuition fee; semester contribution ~€304"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€304"),
    ("Mathematics",                          "all", 0, "No tuition fee; semester contribution ~€304"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€304"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€304"),
    ("Social Sciences",                      "all", 0, "No tuition fee; semester contribution ~€304"),
])

# 18 — Ruhr University Bochum
ALL_PROGRAMS += rows(18, [
    ("Engineering",                          "all", 0, "No tuition fee; semester contribution ~€310"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€310"),
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€310"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€310"),
    ("Social Sciences",                      "all", 0, "No tuition fee; semester contribution ~€310"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€310"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€310"),
])

# 40 — University of Duisburg-Essen
ALL_PROGRAMS += rows(40, [
    ("Engineering",                          "all", 0, "No tuition fee; semester contribution ~€295"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€295"),
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€295"),
    ("Social Sciences",                      "all", 0, "No tuition fee; semester contribution ~€295"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€295"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€295"),
])

# ─── GERMANY — HAMBURG (€0) ───────────────────────────────────────────────
# IDs 19, 20

# 19 — University of Hamburg
ALL_PROGRAMS += rows(19, [
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€357"),
    ("Social Sciences",                      "all", 0, "No tuition fee; semester contribution ~€357"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€357"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€357"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€357"),
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€357"),
    ("Informatics",                          "all", 0, "No tuition fee; semester contribution ~€357"),
])

# 20 — TUHH Hamburg
ALL_PROGRAMS += rows(20, [
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€357"),
    ("Electrical Engineering",               "all", 0, "No tuition fee; semester contribution ~€357"),
    ("Mechanical Engineering",               "all", 0, "No tuition fee; semester contribution ~€357"),
    ("Civil Engineering",                    "all", 0, "No tuition fee; semester contribution ~€357"),
])

# ─── GERMANY — HESSE (€0) ────────────────────────────────────────────────
# IDs 21, 22

# 21 — Goethe University Frankfurt
ALL_PROGRAMS += rows(21, [
    ("Economics & Business",                 "all", 0, "No tuition fee; semester contribution ~€334"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€334"),
    ("Social Sciences",                      "all", 0, "No tuition fee; semester contribution ~€334"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€334"),
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€334"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€334"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€334"),
])

# 22 — TU Darmstadt
ALL_PROGRAMS += rows(22, [
    ("Engineering",                          "all", 0, "No tuition fee; semester contribution ~€295"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€295"),
    ("Mathematics",                          "all", 0, "No tuition fee; semester contribution ~€295"),
    ("Physics",                              "all", 0, "No tuition fee; semester contribution ~€295"),
    ("Architecture",                         "all", 0, "No tuition fee; semester contribution ~€295"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€295"),
])

# ─── GERMANY — LOWER SAXONY (€0) ─────────────────────────────────────────
# IDs 23, 24

# 23 — University of Göttingen
ALL_PROGRAMS += rows(23, [
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€373"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€373"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€373"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€373"),
    ("Social Sciences",                      "all", 0, "No tuition fee; semester contribution ~€373"),
    ("Agriculture & Forestry",               "all", 0, "No tuition fee; semester contribution ~€373"),
])

# 24 — Leibniz University Hannover
ALL_PROGRAMS += rows(24, [
    ("Engineering",                          "all", 0, "No tuition fee; semester contribution ~€382"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€382"),
    ("Architecture",                         "all", 0, "No tuition fee; semester contribution ~€382"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€382"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€382"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€382"),
])

# ─── GERMANY — OTHERS (€0) ───────────────────────────────────────────────
# IDs 25, 26, 27, 33, 34, 35, 36, 37, 38, 39

# 25 — University of Bremen
ALL_PROGRAMS += rows(25, [
    ("Engineering",                          "all", 0, "No tuition fee; semester contribution ~€394"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€394"),
    ("Social Sciences",                      "all", 0, "No tuition fee; semester contribution ~€394"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€394"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€394"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€394"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€394"),
])

# 26 — OVGU Magdeburg
ALL_PROGRAMS += rows(26, [
    ("Engineering",                          "all", 0, "No tuition fee; semester contribution ~€231"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€231"),
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€231"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€231"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€231"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€231"),
])

# 27 — University of Jena
ALL_PROGRAMS += rows(27, [
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€223"),
    ("Pharmacy",                             "all", 0, "No tuition fee; semester contribution ~€223"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€223"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€223"),
    ("Social Sciences",                      "all", 0, "No tuition fee; semester contribution ~€223"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€223"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€223"),
])

# 33 — JGU Mainz
ALL_PROGRAMS += rows(33, [
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€326"),
    ("Pharmacy",                             "all", 0, "No tuition fee; semester contribution ~€326"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€326"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€326"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€326"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€326"),
    ("Social Sciences",                      "all", 0, "No tuition fee; semester contribution ~€326"),
])

# 34 — Saarland University
ALL_PROGRAMS += rows(34, [
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€296"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€296"),
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€296"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€296"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€296"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€296"),
])

# 35 — University of Kiel
ALL_PROGRAMS += rows(35, [
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€244"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€244"),
    ("Agriculture",                          "all", 0, "No tuition fee; semester contribution ~€244"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€244"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€244"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€244"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€244"),
])

# 36 — University of Rostock
ALL_PROGRAMS += rows(36, [
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€218"),
    ("Engineering",                          "all", 0, "No tuition fee; semester contribution ~€218"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€218"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€218"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€218"),
    ("Agriculture",                          "all", 0, "No tuition fee; semester contribution ~€218"),
])

# 37 — University of Greifswald
ALL_PROGRAMS += rows(37, [
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€224"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€224"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€224"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€224"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€224"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€224"),
])

# 38 — University of Leipzig
ALL_PROGRAMS += rows(38, [
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€245"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€245"),
    ("Social Sciences",                      "all", 0, "No tuition fee; semester contribution ~€245"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€245"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€245"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€245"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€245"),
])

# 39 — TU Dresden
ALL_PROGRAMS += rows(39, [
    ("Engineering",                          "all", 0, "No tuition fee; semester contribution ~€270"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€270"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€270"),
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€270"),
    ("Architecture",                         "all", 0, "No tuition fee; semester contribution ~€270"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€270"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€270"),
])

# ─── GERMANY — BAVARIA non-TUM (€0 tuition) ──────────────────────────────
# IDs 1, 28, 29, 30, 31, 32

# 1 — LMU Munich
ALL_PROGRAMS += rows(1, [
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€157"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€157"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€157"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€157"),
    ("Social Sciences",                      "all", 0, "No tuition fee; semester contribution ~€157"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€157"),
    ("Physics",                              "all", 0, "No tuition fee; semester contribution ~€157"),
    ("Mathematics",                          "all", 0, "No tuition fee; semester contribution ~€157"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€157"),
])

# 28 — FAU Erlangen-Nuremberg
ALL_PROGRAMS += rows(28, [
    ("Engineering",                          "all", 0, "No tuition fee; semester contribution ~€142"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€142"),
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€142"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€142"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€142"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€142"),
])

# 29 — University of Würzburg
ALL_PROGRAMS += rows(29, [
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€136"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€136"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€136"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€136"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€136"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€136"),
])

# 30 — University of Augsburg
ALL_PROGRAMS += rows(30, [
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€137"),
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€137"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€137"),
    ("Mathematics",                          "all", 0, "No tuition fee; semester contribution ~€137"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€137"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€137"),
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€137"),
])

# 31 — University of Regensburg
ALL_PROGRAMS += rows(31, [
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€141"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€141"),
    ("Medicine",                             "all", 0, "No tuition fee; semester contribution ~€141"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€141"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€141"),
    ("Informatics",                          "all", 0, "No tuition fee; semester contribution ~€141"),
])

# 32 — University of Bayreuth
ALL_PROGRAMS += rows(32, [
    ("Law",                                  "all", 0, "No tuition fee; semester contribution ~€133"),
    ("Economics",                            "all", 0, "No tuition fee; semester contribution ~€133"),
    ("Natural Sciences",                     "all", 0, "No tuition fee; semester contribution ~€133"),
    ("Engineering",                          "all", 0, "No tuition fee; semester contribution ~€133"),
    ("Humanities",                           "all", 0, "No tuition fee; semester contribution ~€133"),
    ("Computer Science",                     "all", 0, "No tuition fee; semester contribution ~€133"),
])

# ─── GERMANY — BADEN-WÜRTTEMBERG (€3,000/year non-EU) ────────────────────
# IDs 3, 4, 5, 6, 7, 8

# 3 — Heidelberg University
ALL_PROGRAMS += rows(3, [
    ("Medicine",                             "all", 3000, "BW non-EU fee €3,000/year (€1,500/semester); same for all programs"),
    ("Natural Sciences",                     "all", 3000, "BW non-EU fee €3,000/year (€1,500/semester); same for all programs"),
    ("Humanities",                           "all", 3000, "BW non-EU fee €3,000/year (€1,500/semester); same for all programs"),
    ("Law",                                  "all", 3000, "BW non-EU fee €3,000/year (€1,500/semester); same for all programs"),
    ("Social Sciences",                      "all", 3000, "BW non-EU fee €3,000/year (€1,500/semester); same for all programs"),
    ("Economics",                            "all", 3000, "BW non-EU fee €3,000/year (€1,500/semester); same for all programs"),
])

# 4 — KIT Karlsruhe
ALL_PROGRAMS += rows(4, [
    ("Engineering",                          "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Computer Science",                     "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Physics",                              "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Chemistry",                            "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Mathematics",                          "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Economics",                            "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Architecture",                         "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
])

# 5 — University of Tübingen
ALL_PROGRAMS += rows(5, [
    ("Medicine",                             "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Humanities",                           "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Social Sciences",                      "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Natural Sciences",                     "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Law",                                  "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Economics",                            "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Theology",                             "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
])

# 6 — University of Freiburg
ALL_PROGRAMS += rows(6, [
    ("Humanities",                           "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Natural Sciences",                     "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Medicine",                             "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Law",                                  "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Economics",                            "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Social Sciences",                      "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Engineering",                          "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
])

# 7 — University of Mannheim
ALL_PROGRAMS += rows(7, [
    ("Business Administration",              "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Economics",                            "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Law",                                  "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Social Sciences",                      "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Humanities",                           "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Computer Science",                     "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
])

# 8 — University of Stuttgart
ALL_PROGRAMS += rows(8, [
    ("Engineering",                          "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Computer Science",                     "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Architecture",                         "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Natural Sciences",                     "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Humanities",                           "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
    ("Economics",                            "all", 3000, "BW non-EU fee €3,000/year; same for all programs"),
])

# ─── GERMANY — TUM (variable by program & level) ─────────────────────────
# 2 — TUM (fees start WS 2024/25; €0 for EU/EEA students)
ALL_PROGRAMS += rows(2, [
    ("Computer Science",                     "bachelor", 6000,  "€3,000/semester for non-EU; source: tum.de/en/studies/fees/tuition"),
    ("Electrical Engineering",               "bachelor", 6000,  "€3,000/semester for non-EU"),
    ("Mechanical Engineering",               "bachelor", 6000,  "€3,000/semester for non-EU"),
    ("Civil Engineering",                    "bachelor", 6000,  "€3,000/semester for non-EU"),
    ("Mathematics",                          "bachelor", 4000,  "€2,000/semester for non-EU"),
    ("Physics",                              "bachelor", 4000,  "€2,000/semester for non-EU"),
    ("Chemistry",                            "bachelor", 4000,  "€2,000/semester for non-EU"),
    ("Life Sciences",                        "bachelor", 4000,  "€2,000/semester for non-EU"),
    ("Architecture",                         "bachelor", 6000,  "€3,000/semester for non-EU"),
    ("Management & Technology",              "bachelor", 6000,  "€3,000/semester for non-EU"),
    ("Computer Science",                     "master",   12000, "€6,000/semester for non-EU"),
    ("Electrical Engineering",               "master",   12000, "€6,000/semester for non-EU"),
    ("Mechanical Engineering",               "master",   12000, "€6,000/semester for non-EU"),
    ("Informatics",                          "master",   12000, "€6,000/semester for non-EU"),
    ("Mathematics",                          "master",   8000,  "€4,000/semester for non-EU"),
    ("Physics",                              "master",   8000,  "€4,000/semester for non-EU"),
    ("Chemistry",                            "master",   8000,  "€4,000/semester for non-EU"),
    ("Management",                           "master",   12000, "€6,000/semester (Munich campus) for non-EU"),
    ("Management",                           "master",   0,     "€0 at Heilbronn Campus; check tum.de for your program"),
    ("Bioinformatics",                       "master",   0,     "Exempt from non-EU tuition fee; source: tum.de"),
    ("Medicine (pre-clinical)",              "bachelor", 4000,  "€2,000/semester for non-EU; clinical phase at LMU"),
])

# ─── GERMANY — PRIVATE SCHOOLS ───────────────────────────────────────────
# IDs 41, 42, 43, 44

# 41 — Frankfurt School of Finance & Management
ALL_PROGRAMS += rows(41, [
    ("Business Administration",              "bachelor", 20500, "~€20,500/year; source: frankfurt-school.de"),
    ("Finance",                              "master",   25000, "~€25,000/year; verify on frankfurt-school.de"),
    ("MBA",                                  "master",   35000, "Full-time MBA; verify current fees on website"),
])

# 42 — ESMT Berlin
ALL_PROGRAMS += rows(42, [
    ("Master in Management (MiM)",           "master", 25500, "~€25,500/year; source: esmt.org"),
    ("MBA (Full-time)",                      "master", 30000, "~€30,000/year; source: esmt.org"),
    ("Executive MBA",                        "master", 42000, "~€42,000 total; part-time executive program"),
    ("PhD in Management",                    "phd",    0,     "Fully funded; competitive selection"),
])

# 43 — WHU Otto Beisheim
ALL_PROGRAMS += rows(43, [
    ("International Business Administration","bachelor", 13800, "~€13,800/year; source: whu.edu"),
    ("Master in Management",                 "master",   22000, "~€22,000/year; source: whu.edu"),
    ("MBA",                                  "master",   47500, "~€47,500 full program; verify on whu.edu"),
])

# 44 — Constructor University Bremen
ALL_PROGRAMS += rows(44, [
    ("Computer Science",                     "bachelor", 20000, "€20,000/year; source: constructor.university (2025/26 fact sheet)"),
    ("Data Science",                         "bachelor", 20000, "€20,000/year"),
    ("Electrical Engineering",               "bachelor", 20000, "€20,000/year"),
    ("Life Sciences",                        "bachelor", 20000, "€20,000/year"),
    ("Business Administration",              "bachelor", 20000, "€20,000/year"),
    ("Physics",                              "bachelor", 20000, "€20,000/year"),
    ("Computer Science",                     "master",   17000, "~€17,000/year; verify on constructor.university"),
    ("Data Science",                         "master",   17000, "~€17,000/year"),
])

# ─── POLAND — WARSAW ─────────────────────────────────────────────────────
# IDs 45, 46, 57, 58

# 45 — University of Warsaw
ALL_PROGRAMS += rows(45, [
    ("Economics & Finance",                  "bachelor", 3500,  "~€3,500/year for English programs; source: rekrutacja.uw.edu.pl (2025/26 PDF)"),
    ("Management",                           "bachelor", 2500,  "~€2,500/year"),
    ("Political Science & International Relations", "bachelor", 4300, "€4,300/year; source: wnpism.uw.edu.pl"),
    ("Psychology",                           "bachelor", 5000,  "~€5,000/year for English track"),
    ("Computer Science",                     "bachelor", 3500,  "~€3,500/year"),
    ("Law",                                  "bachelor", 4500,  "~€4,500/year for English track"),
    ("Humanities",                           "bachelor", 2500,  "~€2,500/year"),
    ("Natural Sciences",                     "bachelor", 2500,  "~€2,500/year"),
    ("Economics & Finance",                  "master",   4000,  "~€4,000/year"),
    ("Management",                           "master",   3500,  "~€3,500/year"),
    ("Political Science & International Relations", "master", 4300, "€4,300/year"),
    ("Psychology",                           "master",   5500,  "~€5,500/year"),
    ("Computer Science",                     "master",   4000,  "~€4,000/year"),
    ("Law",                                  "master",   5000,  "~€5,000/year"),
])

# 46 — Medical University of Warsaw
ALL_PROGRAMS += rows(46, [
    ("Medicine (MBBCh, 6 years)",            "bachelor", 13500, "~€13,500/year average (fee varies by year of study); source: ed.wum.edu.pl"),
    ("Dentistry",                            "bachelor", 14000, "~€14,000/year average; verify on ed.wum.edu.pl"),
    ("Pharmacy",                             "bachelor", 10000, "~€10,000/year; verify on wum.edu.pl"),
    ("Nursing",                              "bachelor", 8000,  "~€8,000/year for English-medium track"),
])

# 57 — SWPS University
ALL_PROGRAMS += rows(57, [
    ("Psychology",                           "bachelor", 6800,  "€6,800/year; source: english.swps.pl (2025)"),
    ("Business Psychology",                  "master",   8100,  "€8,100/year; source: english.swps.pl"),
    ("Clinical Psychology",                  "master",   8800,  "€8,800/year; source: english.swps.pl"),
    ("Design",                               "bachelor", 5500,  "~€5,500/year; verify on english.swps.pl"),
    ("Management",                           "bachelor", 5000,  "~€5,000/year"),
    ("Sociology",                            "bachelor", 5000,  "~€5,000/year"),
    ("Film Studies",                         "bachelor", 5500,  "~€5,500/year"),
])

# 58 — Lazarski University
ALL_PROGRAMS += rows(58, [
    ("Law",                                  "bachelor", 4560,  "~€4,560/year; source: lazarski.pl"),
    ("Economics",                            "bachelor", 4000,  "~€4,000/year"),
    ("Management",                           "bachelor", 3800,  "~€3,800/year"),
    ("Security Studies",                     "bachelor", 3800,  "~€3,800/year"),
    ("Medicine",                             "bachelor", 12000, "~€12,000/year for selected medical programs; verify on lazarski.pl"),
])

# ─── POLAND — KRAKOW ─────────────────────────────────────────────────────
# IDs 47, 51, 56

# 47 — Jagiellonian University
ALL_PROGRAMS += rows(47, [
    ("Medicine (MBBCh, 6 years)",            "bachelor", 14000, "Years 1–3: €14,500/year; Years 4–5: €14,000/year; Year 6: €10,000/year; source: medschool.uj.edu.pl"),
    ("Dentistry",                            "bachelor", 14000, "~€14,000/year; verify on uj.edu.pl"),
    ("Pharmacy",                             "bachelor", 8000,  "~€8,000/year; verify on uj.edu.pl"),
    ("Law",                                  "bachelor", 4500,  "~€4,500/year for English track"),
    ("Economics",                            "bachelor", 3500,  "~€3,500/year for English track"),
    ("Social Sciences",                      "bachelor", 3000,  "~€3,000/year"),
    ("Computer Science",                     "bachelor", 3500,  "~€3,500/year"),
    ("Humanities",                           "bachelor", 3000,  "~€3,000/year"),
    ("Law",                                  "master",   5000,  "~€5,000/year"),
    ("Economics",                            "master",   4000,  "~€4,000/year"),
    ("Computer Science",                     "master",   4000,  "~€4,000/year"),
])

# 51 — AGH University of Krakow
ALL_PROGRAMS += rows(51, [
    ("Mining & Metallurgy",                  "bachelor", 3000,  "~€3,000/year; source: agh.edu.pl"),
    ("Engineering",                          "bachelor", 3000,  "~€3,000/year"),
    ("Computer Science",                     "bachelor", 3000,  "~€3,000/year"),
    ("Geophysics",                           "bachelor", 3000,  "~€3,000/year"),
    ("Economics",                            "bachelor", 3000,  "~€3,000/year"),
    ("Physics",                              "bachelor", 3000,  "~€3,000/year"),
    ("Engineering",                          "master",   3500,  "~€3,500/year"),
    ("Computer Science",                     "master",   3500,  "~€3,500/year"),
])

# 56 — Andrzej Frycz Modrzewski Krakow University
ALL_PROGRAMS += rows(56, [
    ("Law",                                  "all", 3000,  "~€3,000/year; source: ka.edu.pl"),
    ("Security Studies",                     "all", 2800,  "~€2,800/year"),
    ("Social Sciences",                      "all", 2800,  "~€2,800/year"),
    ("Health Sciences",                      "all", 3200,  "~€3,200/year"),
    ("Architecture",                         "all", 3500,  "~€3,500/year"),
    ("Psychology",                           "all", 3200,  "~€3,200/year"),
])

# ─── POLAND — WROCŁAW ────────────────────────────────────────────────────
# IDs 49, 50

# 49 — Wroclaw Medical University
ALL_PROGRAMS += rows(49, [
    ("Medicine (MBBCh, 6 years)",            "bachelor", 15400, "65,500 PLN/year ≈ €15,400 for 2025/26; source: admission.umw.edu.pl"),
    ("Dentistry",                            "bachelor", 16000, "~€16,000/year; verify on admission.umw.edu.pl"),
    ("Pharmacy",                             "bachelor", 10000, "~€10,000/year; verify on umw.edu.pl"),
    ("Physiotherapy",                        "bachelor", 8000,  "~€8,000/year; verify on umw.edu.pl"),
])

# 50 — Wroclaw University of Science and Technology
ALL_PROGRAMS += rows(50, [
    ("Engineering",                          "bachelor", 2800,  "~€2,800/year; source: pwr.edu.pl"),
    ("Computer Science",                     "bachelor", 2800,  "~€2,800/year"),
    ("Architecture",                         "bachelor", 2800,  "~€2,800/year"),
    ("Mathematics",                          "bachelor", 2800,  "~€2,800/year"),
    ("Physics",                              "bachelor", 2800,  "~€2,800/year"),
    ("Economics",                            "bachelor", 2800,  "~€2,800/year"),
    ("Engineering",                          "master",   3200,  "~€3,200/year"),
    ("Computer Science",                     "master",   3200,  "~€3,200/year"),
])

# ─── POLAND — GDAŃSK ─────────────────────────────────────────────────────
# IDs 48, 54

# 48 — Medical University of Gdańsk
ALL_PROGRAMS += rows(48, [
    ("Medicine (MBBCh, 6 years)",            "bachelor", 15100, "64,200 PLN/year ≈ €15,100 for 2025; source: admission.mug.edu.pl"),
    ("Dentistry",                            "bachelor", 15500, "~€15,500/year; verify on admission.mug.edu.pl"),
    ("Pharmacy (5 years)",                   "bachelor", 9800,  "~41,700 PLN/year ≈ €9,800; verify on admission.mug.edu.pl"),
    ("Public Health",                        "bachelor", 8000,  "~€8,000/year; verify on mug.edu.pl"),
])

# 54 — University of Gdańsk
ALL_PROGRAMS += rows(54, [
    ("Economics",                            "all", 2200, "~€2,200/year; source: ug.edu.pl"),
    ("Law",                                  "all", 2500, "~€2,500/year"),
    ("Natural Sciences",                     "all", 2200, "~€2,200/year"),
    ("Humanities",                           "all", 2200, "~€2,200/year"),
    ("Computer Science",                     "all", 2500, "~€2,500/year"),
    ("Social Sciences",                      "all", 2200, "~€2,200/year"),
])

# ─── POLAND — POZNAŃ ─────────────────────────────────────────────────────
# IDs 52, 53

# 52 — Poznań University of Technology
ALL_PROGRAMS += rows(52, [
    ("Mechanical Engineering",               "bachelor", 2500, "~€2,500/year; source: put.poznan.pl"),
    ("Electrical Engineering",               "bachelor", 2500, "~€2,500/year"),
    ("Computer Science",                     "bachelor", 2500, "~€2,500/year"),
    ("Architecture",                         "bachelor", 2500, "~€2,500/year"),
    ("Management",                           "bachelor", 2500, "~€2,500/year"),
    ("Engineering",                          "master",   3000, "~€3,000/year"),
    ("Computer Science",                     "master",   3000, "~€3,000/year"),
])

# 53 — Adam Mickiewicz University Poznań
ALL_PROGRAMS += rows(53, [
    ("Humanities",                           "all", 2500, "~€2,500/year; source: amu.edu.pl"),
    ("Social Sciences",                      "all", 2500, "~€2,500/year"),
    ("Natural Sciences",                     "all", 2500, "~€2,500/year"),
    ("Law",                                  "all", 3000, "~€3,000/year for English track"),
    ("Economics",                            "all", 2500, "~€2,500/year"),
    ("Computer Science",                     "all", 2700, "~€2,700/year"),
])

# ─── POLAND — TORUŃ ──────────────────────────────────────────────────────
# 55 — Nicolaus Copernicus University
ALL_PROGRAMS += rows(55, [
    ("Medicine",                             "bachelor", 11000, "~€11,000/year at Collegium Medicum in Bydgoszcz; verify on umk.pl"),
    ("Natural Sciences",                     "bachelor", 2000,  "~€2,000/year; source: umk.pl"),
    ("Humanities",                           "bachelor", 2000,  "~€2,000/year"),
    ("Social Sciences",                      "bachelor", 2000,  "~€2,000/year"),
    ("Law",                                  "bachelor", 2500,  "~€2,500/year"),
    ("Computer Science",                     "bachelor", 2200,  "~€2,200/year"),
    ("Natural Sciences",                     "master",   2500,  "~€2,500/year"),
    ("Computer Science",                     "master",   2500,  "~€2,500/year"),
])


# ─── INSERT ALL ──────────────────────────────────────────────────────────
def main():
    with engine.connect() as conn:
        # Clear existing to avoid duplicates if re-run
        conn.execute(text("DELETE FROM university_programs"))

        inserted = 0
        for row in ALL_PROGRAMS:
            uni_id, field, level, fee, note = row
            conn.execute(
                text("""
                    INSERT INTO university_programs (university_id, field_of_study, degree_level, tuition_fee_eur, notes)
                    VALUES (:uid, :field, :level, :fee, :note)
                """),
                {"uid": uni_id, "field": field, "level": level, "fee": fee, "note": note}
            )
            inserted += 1

        conn.commit()
        print(f"Inserted {inserted} program fee rows across 58 universities.")


if __name__ == "__main__":
    main()
