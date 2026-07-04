# University Application Integration Report
**UniFind Platform — Research Date: June 2026**

---

## Executive Summary

All 58 universities in the UniFind database were researched for official, documented,
public APIs that would allow a third-party platform to submit student applications
programmatically. **None of the 58 universities provide such an API.**

This is not a gap in our research — it is the current reality of European higher
education systems. Universities protect their application pipelines through closed
portals, and no German or Polish university has opened an integration endpoint to
external parties.

---

## University Breakdown by Country

| Country | Count |
|---------|-------|
| Germany | 44    |
| Poland  | 14    |
| **Total** | **58** |

---

## German Universities — Application System Analysis

### System Used: uni-assist + Individual Portals

Most German public universities channel **international student applications** (non-EU)
through **uni-assist.de** — a shared application-processing service used by 180+
German universities. EU students typically apply directly through each university's
own portal.

#### uni-assist member universities (international applicants use uni-assist.de):

| ID | University | Direct Portal |
|----|-----------|---------------|
| 1  | Ludwig Maximilian University of Munich (LMU) | https://www.lmu.de/en/study/application |
| 3  | Heidelberg University | https://www.uni-heidelberg.de/en/admission |
| 6  | University of Freiburg | https://www.uni-freiburg.de/en/studies/application |
| 7  | University of Mannheim | https://www.uni-mannheim.de/en/academics/applying |
| 9  | Humboldt University of Berlin | https://www.hu-berlin.de/en/studies/admission |
| 10 | Free University of Berlin (FU Berlin) | https://www.fu-berlin.de/en/studium/bewerbung |
| 11 | Technical University of Berlin (TU Berlin) | https://www.tu.berlin/en/studying/applying-and-enrolling |
| 12 | RWTH Aachen University | https://www.rwth-aachen.de/cms/root/studium/vor-dem-studium/bewerbung |
| 13 | University of Münster | https://www.uni-muenster.de/en/studying/apply |
| 14 | University of Cologne | https://www.uni-koeln.de/en/studying/applying |
| 15 | University of Bonn | https://www.uni-bonn.de/en/studying/application |
| 16 | Heinrich Heine University Düsseldorf | https://www.uni-duesseldorf.de/home/en/studying/applying.html |
| 17 | TU Dortmund University | https://www.tu-dortmund.de/en/studies/applying |
| 18 | Ruhr University Bochum | https://www.ruhr-uni-bochum.de/en/studying/applying |
| 19 | University of Hamburg | https://www.uni-hamburg.de/en/studium/bewerbung.html |
| 21 | Goethe University Frankfurt | https://www.goethe-university-frankfurt.de/en/for-students/applying |
| 22 | TU Darmstadt | https://www.tu-darmstadt.de/studieren/studierende_tu_darmstadt/bewerbung_zulassung_immatrikulation |
| 23 | University of Göttingen | https://www.uni-goettingen.de/en/apply/20573.html |
| 24 | Leibniz University Hannover | https://www.uni-hannover.de/en/studies/applying-for-studies |
| 25 | University of Bremen | https://www.uni-bremen.de/en/studies/applying |
| 26 | OVGU Magdeburg | https://www.ovgu.de/en/Study/Application.html |
| 27 | Friedrich Schiller University Jena | https://www.uni-jena.de/en/apply |
| 28 | University of Erlangen-Nuremberg (FAU) | https://www.fau.eu/education/application |
| 29 | University of Würzburg | https://www.uni-wuerzburg.de/en/studies/application |
| 30 | University of Augsburg | https://www.uni-augsburg.de/en/studium/bewerbung |
| 31 | University of Regensburg | https://www.uni-regensburg.de/en/studying/applying |
| 32 | University of Bayreuth | https://www.uni-bayreuth.de/en/university/applying |
| 33 | Johannes Gutenberg University Mainz | https://www.uni-mainz.de/eng/1064.php |
| 34 | Saarland University | https://www.uni-saarland.de/en/study/application.html |
| 35 | Christian-Albrechts-University of Kiel | https://www.uni-kiel.de/en/studying/applying |
| 36 | University of Rostock | https://www.uni-rostock.de/en/studies/applying |
| 37 | University of Greifswald | https://www.uni-greifswald.de/en/university/studying/applying |
| 38 | University of Leipzig | https://www.uni-leipzig.de/en/study/application |
| 39 | TU Dresden | https://tu-dresden.de/studium/vor-dem-studium/bewerbung |
| 40 | University of Duisburg-Essen | https://www.uni-due.de/en/study/apply.php |
| 8  | University of Stuttgart | https://www.uni-stuttgart.de/en/study/applying |
| 5  | University of Tübingen | https://uni-tuebingen.de/en/university/studying/applying |

#### Universities with their own dedicated application portal (do NOT use uni-assist):

| ID | University | Application System | Notes |
|----|-----------|-------------------|-------|
| 2  | Technical University of Munich (TUM) | TUMonline (CAMPUSonline-based) | Own system — https://www.tum.de/en/studies/application |
| 4  | KIT Karlsruhe | Own portal | https://www.kit.edu/english/study/applying.php |
| 20 | Hamburg University of Technology (TUHH) | Own portal | https://www.tuhh.de/tuhh/en/studies/application.html |
| 41 | Frankfurt School of Finance & Management | Own CRM portal | Private business school — https://www.frankfurt-school.de/en/home/programmes/apply |
| 42 | ESMT Berlin | Own portal | Private — https://esmt.org/mba/apply |
| 43 | WHU – Otto Beisheim School of Management | Own portal | Private — https://www.whu.edu/programs/apply |
| 44 | Constructor University Bremen | Own portal | Private — https://constructor.university/admission |

---

## Polish Universities — Application System Analysis

### System Used: IRK (Internetowa Rejestracja Kandydatów)

All 14 Polish universities use the **IRK** system — an open-source application
management platform. Each university runs its own IRK instance independently.
There is no centralized portal equivalent to Germany's uni-assist.

| ID | University | Application Portal |
|----|-----------|-------------------|
| 45 | University of Warsaw | https://irk.uw.edu.pl/en-gb/ |
| 46 | Medical University of Warsaw | https://rekrutacja.wum.edu.pl |
| 47 | Jagiellonian University | https://www.irk.uj.edu.pl/en-gb/ |
| 48 | Medical University of Gdańsk | https://rekrutacja.mug.edu.pl |
| 49 | Wrocław Medical University | https://rekrutacja.umw.edu.pl |
| 50 | Wrocław University of Science and Technology | https://rekrutacja.pwr.edu.pl/en/ |
| 51 | AGH University of Krakow | https://rekrutacja.agh.edu.pl |
| 52 | Poznań University of Technology | https://rekrutacja.put.poznan.pl |
| 53 | Adam Mickiewicz University Poznań | https://irk.amu.edu.pl/en-gb/ |
| 54 | University of Gdańsk | https://rekrutacja.ug.edu.pl |
| 55 | Nicolaus Copernicus University in Toruń | https://irk.umk.pl/en-gb/ |
| 56 | Andrzej Frycz Modrzewski Krakow University | https://www.ka.edu.pl/rekrutacja |
| 57 | SWPS University | https://rekrutacja.swps.pl |
| 58 | Lazarski University | https://aplikuj.lazarski.pl |

---

## API Research Findings

### Does uni-assist have a public API?
**No.** uni-assist operates a closed web portal for applicants and a separate
institutional portal for universities. No developer API, webhook, or documented
integration endpoint is publicly available. Any partnership requires a direct
institutional agreement with uni-assist e.V.

### Does IRK have a public API?
**No.** The IRK source code is open, but universities that deploy it do not expose
any public API endpoint. Each university's IRK instance is self-contained.

### Do any third-party aggregators (ApplyBoard, Studyportals, etc.) cover these universities?
- **ApplyBoard** — covers some institutions in Germany but requires a formal
  partnership agreement; no self-serve API available to third parties.
- **Common App** — US-focused; no European university coverage.
- **Studyportals** — listing aggregator only; no application submission.
- **Mastersportal / Bachelorsportal** — same, listing only.

---

## Recommendation: What UniFind Should Do Instead

Since no direct API integration is possible, the recommended approach is to
**guide students through the official process** rather than replacing it.
This is also the legally safest approach — we never submit data on a student's
behalf to a system we don't own.

### Tier 1 — Implement Now (Modular Admin-Controlled)

#### 1. Application Method field per University
Add a new field to each university record in the database:
- `application_method`: `"uni_assist"` | `"own_portal"` | `"irk"` | `"email"` | `"other"`
- `application_portal_url`: direct URL to the application page

This allows admins to set/update methods, and the student app shows the correct
guided flow per university.

#### 2. Guided Application Flow in UniFind
In `UniversityDetail.jsx`, replace the generic "Apply Now" button with a contextual
guided flow based on `application_method`:

| Method | What UniFind Shows |
|--------|-------------------|
| `uni_assist` | Step-by-step guide to uni-assist.de with checklist of required documents |
| `own_portal` | Direct link to the portal + document checklist from our DB |
| `irk` | Direct link to the university's IRK instance + help text |
| `email` | Pre-filled email template with the student's profile data |

#### 3. Application Checklist per University
Already recommended in the backlog. Each university record can store
`required_documents` (already exists as a field). The UI should show this
as a trackable checklist inside ApplicationTracker.

### Tier 2 — Future (Requires Formal Partnership)

| Partner | What It Unlocks |
|---------|----------------|
| **uni-assist institutional account** | Co-branded link with pre-filled applicant data |
| **ApplyBoard partnership** | Managed application pipeline for some German institutions |
| **Direct university MOU** | Some universities (e.g., TUM, KIT) have student recruitment agreements with platforms |

---

## Summary Table — All 58 Universities

| Country | Application Method | Universities |
|---------|--------------------|-------------|
| Germany | uni-assist (international) | 36 universities |
| Germany | Own portal (no uni-assist) | 8 universities (TUM, KIT, TUHH, ESMT, Frankfurt School, WHU, Constructor) |
| Poland  | IRK (each university) | 14 universities |

**Official API available:** 0 / 58  
**Recommended action:** Implement guided application flow with per-university method field.

---

## Files to Create/Modify for Implementation

1. **Migration** — add `application_method` and `application_portal_url` to `universities` table
2. **`app/models/university.py`** — add the two new columns
3. **`app/routers/universities.py`** — expose in read/update schemas
4. **`student-app/src/pages/UniversityDetail.jsx`** — replace "Apply Now" with guided flow component
5. **`admin/src/resources/Universities.jsx`** — add method selector and portal URL field

---

*Report generated by UniFind platform analysis — June 2026*
