import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import { Icon, ICONS } from "../components/Sidebar";

const bg   = "var(--bg)";
const card = "var(--surface-2)";
const dim  = "var(--ink-faint)";

/* ── Embassy data per nationality per destination ────────────────────────── */
const EMBASSIES = {
  germany: {
    default: { name: "German Embassy", city: "your capital city", note: null, url: "https://www.auswaertiges-amt.de/en/visa-service" },
    egyptian:  { name: "German Embassy in Cairo",        city: "Cairo, Egypt",        note: null, url: "https://kairo.diplo.de/eg-de/service/visa-einreise" },
    egyption:  { name: "German Embassy in Cairo",        city: "Cairo, Egypt",        note: null, url: "https://kairo.diplo.de/eg-de/service/visa-einreise" },
    saudi:     { name: "German Embassy in Riyadh",       city: "Riyadh, Saudi Arabia",note: null, url: "https://riad.diplo.de/sa-de/service/visa-einreise" },
    jordanian: { name: "German Embassy in Amman",        city: "Amman, Jordan",       note: null, url: "https://amman.diplo.de/jo-de/service/visa-einreise" },
    moroccan:  { name: "German Embassy in Rabat",        city: "Rabat, Morocco",      note: null, url: "https://rabat.diplo.de/ma-de/service/visa-einreise" },
    tunisian:  { name: "German Embassy in Tunis",        city: "Tunis, Tunisia",      note: null, url: "https://tunis.diplo.de/tn-de/service/visa-einreise" },
    algerian:  { name: "German Embassy in Algiers",      city: "Algiers, Algeria",    note: null, url: "https://algier.diplo.de/dz-de/service/visa-einreise" },
    libyan:    { name: "German Embassy in Tunis",        city: "Tunis, Tunisia",      note: "The German Embassy in Libya is currently closed. Libyan citizens apply at the German Embassy in Tunis, Tunisia.", url: "https://tunis.diplo.de/tn-de/service/visa-einreise" },
    syrian:    { name: "German Embassy in Beirut",       city: "Beirut, Lebanon",     note: "The German Embassy in Damascus is suspended. Syrian citizens apply at the German Embassy in Beirut, Lebanon.", url: "https://beirut.diplo.de/lb-de/service/visa-einreise" },
    iraqi:     { name: "German Embassy in Baghdad",      city: "Baghdad, Iraq",       note: null, url: "https://bagdad.diplo.de/iq-de/service/visa-einreise" },
    yemeni:    { name: "German Embassy in Amman",        city: "Amman, Jordan",       note: "The German Embassy in Sanaa is closed. Yemeni citizens are advised to apply at the German Embassy in Amman, Jordan.", url: "https://amman.diplo.de/jo-de/service/visa-einreise" },
    emirati:   { name: "German Embassy in Abu Dhabi",    city: "Abu Dhabi, UAE",      note: null, url: "https://abu-dhabi.diplo.de/ae-de/service/visa-einreise" },
    kuwaiti:   { name: "German Embassy in Kuwait City",  city: "Kuwait City, Kuwait", note: null, url: "https://kuwait-city.diplo.de/kw-de/service/visa-einreise" },
    qatari:    { name: "German Embassy in Doha",         city: "Doha, Qatar",         note: null, url: "https://doha.diplo.de/qa-de/service/visa-einreise" },
    bahraini:  { name: "German Embassy in Manama",       city: "Manama, Bahrain",     note: null, url: "https://manama.diplo.de/bh-de/service/visa-einreise" },
    omani:     { name: "German Embassy in Muscat",       city: "Muscat, Oman",        note: null, url: "https://maskat.diplo.de/om-de/service/visa-einreise" },
    lebanese:  { name: "German Embassy in Beirut",       city: "Beirut, Lebanon",     note: null, url: "https://beirut.diplo.de/lb-de/service/visa-einreise" },
    palestinian:{ name: "German Consulate General Jerusalem", city: "Jerusalem",      note: "Palestinian citizens apply at the German Consulate General in Jerusalem or the German Embassy in Amman.", url: "https://jerusalem.diplo.de/il-de/service/visa-einreise" },
    sudanese:  { name: "German Embassy in Khartoum",     city: "Khartoum, Sudan",     note: null, url: "https://khartum.diplo.de/sd-de/service/visa-einreise" },
  },
  poland: {
    default: { name: "Polish Embassy", city: "your capital city", note: null, url: "https://www.gov.pl/web/dyplomacja-en/consular-services" },
    egyptian:  { name: "Polish Embassy in Cairo",        city: "Cairo, Egypt",        note: null, url: "https://kair.msz.gov.pl/en/" },
    egyption:  { name: "Polish Embassy in Cairo",        city: "Cairo, Egypt",        note: null, url: "https://kair.msz.gov.pl/en/" },
    saudi:     { name: "Polish Embassy in Riyadh",       city: "Riyadh, Saudi Arabia",note: null, url: "https://rijad.msz.gov.pl/en/" },
    jordanian: { name: "Polish Embassy in Amman",        city: "Amman, Jordan",       note: null, url: "https://amman.msz.gov.pl/en/" },
    moroccan:  { name: "Polish Embassy in Rabat",        city: "Rabat, Morocco",      note: null, url: "https://rabat.msz.gov.pl/en/" },
    tunisian:  { name: "Polish Embassy in Tunis",        city: "Tunis, Tunisia",      note: null, url: "https://tunezja.msz.gov.pl/en/" },
    algerian:  { name: "Polish Embassy in Algiers",      city: "Algiers, Algeria",    note: null, url: "https://algier.msz.gov.pl/en/" },
    libyan:    { name: "Polish Embassy in Tunis",        city: "Tunis, Tunisia",      note: "Poland has no embassy in Libya. Libyan citizens apply at the Polish Embassy in Tunis, Tunisia.", url: "https://tunezja.msz.gov.pl/en/" },
    syrian:    { name: "Polish Embassy in Beirut",       city: "Beirut, Lebanon",     note: "The Polish Embassy in Damascus is closed. Syrian citizens apply at the Polish Embassy in Beirut, Lebanon.", url: "https://bejrut.msz.gov.pl/en/" },
    iraqi:     { name: "Polish Embassy in Baghdad",      city: "Baghdad, Iraq",       note: null, url: "https://bagdad.msz.gov.pl/en/" },
    yemeni:    { name: "Polish Embassy in Amman",        city: "Amman, Jordan",       note: "Poland has no embassy in Yemen. Yemeni citizens apply at the Polish Embassy in Amman, Jordan.", url: "https://amman.msz.gov.pl/en/" },
    emirati:   { name: "Polish Embassy in Abu Dhabi",    city: "Abu Dhabi, UAE",      note: null, url: "https://abudhabi.msz.gov.pl/en/" },
    kuwaiti:   { name: "Polish Embassy in Kuwait City",  city: "Kuwait City, Kuwait", note: null, url: "https://kuwejt.msz.gov.pl/en/" },
    qatari:    { name: "Polish Embassy in Doha",         city: "Doha, Qatar",         note: null, url: "https://doha.msz.gov.pl/en/" },
    bahraini:  { name: "Polish Embassy in Manama",       city: "Manama, Bahrain",     note: null, url: "https://manama.msz.gov.pl/en/" },
    omani:     { name: "Polish Embassy in Abu Dhabi",    city: "Abu Dhabi, UAE",      note: "Poland has no embassy in Oman. Omani citizens apply at the Polish Embassy in Abu Dhabi.", url: "https://abudhabi.msz.gov.pl/en/" },
    lebanese:  { name: "Polish Embassy in Beirut",       city: "Beirut, Lebanon",     note: null, url: "https://bejrut.msz.gov.pl/en/" },
    palestinian:{ name: "Polish Embassy in Tel Aviv",    city: "Tel Aviv, Israel",    note: "Palestinian citizens apply at the Polish Embassy in Tel Aviv or the Polish Embassy in Amman.", url: "https://telawiw.msz.gov.pl/en/" },
    sudanese:  { name: "Polish Embassy in Khartoum",     city: "Khartoum, Sudan",     note: null, url: "https://chartum.msz.gov.pl/en/" },
  },
  romania: {
    default:    { name: "Romanian Embassy", city: "your capital city", note: null, url: "https://www.mae.ro/en/node/2035" },
    egyptian:   { name: "Romanian Embassy in Cairo",       city: "Cairo, Egypt",        note: null, url: "https://cairo.mae.ro/en/node/871" },
    egyption:   { name: "Romanian Embassy in Cairo",       city: "Cairo, Egypt",        note: null, url: "https://cairo.mae.ro/en/node/871" },
    saudi:      { name: "Romanian Embassy in Riyadh",      city: "Riyadh, Saudi Arabia",note: null, url: "https://riyadh.mae.ro/en" },
    jordanian:  { name: "Romanian Embassy in Amman",       city: "Amman, Jordan",       note: null, url: "https://amman.mae.ro/en" },
    moroccan:   { name: "Romanian Embassy in Rabat",       city: "Rabat, Morocco",      note: null, url: "https://rabat.mae.ro/en" },
    tunisian:   { name: "Romanian Embassy in Tunis",       city: "Tunis, Tunisia",      note: null, url: "https://tunis.mae.ro/en" },
    algerian:   { name: "Romanian Embassy in Algiers",     city: "Algiers, Algeria",    note: null, url: "https://alger.mae.ro/en" },
    libyan:     { name: "Romanian Embassy in Tunis",       city: "Tunis, Tunisia",      note: "Romania has no embassy in Libya. Libyan citizens apply at the Romanian Embassy in Tunis, Tunisia.", url: "https://tunis.mae.ro/en" },
    syrian:     { name: "Romanian Embassy in Damascus",    city: "Damascus, Syria",     note: "Contact the embassy to confirm current consular services before applying — operations are limited.", url: "https://www.mae.ro/en/romanian-missions/3227" },
    iraqi:      { name: "Romanian Embassy in Baghdad",     city: "Baghdad, Iraq",       note: null, url: "https://bagdad.mae.ro/en" },
    yemeni:     { name: "Romanian Embassy in Riyadh",      city: "Riyadh, Saudi Arabia",note: "Romania has no embassy in Yemen. Yemeni citizens apply at the Romanian Embassy in Riyadh, Saudi Arabia.", url: "https://riyadh.mae.ro/en" },
    emirati:    { name: "Romanian Embassy in Abu Dhabi",   city: "Abu Dhabi, UAE",      note: null, url: "https://abudhabi.mae.ro/en" },
    kuwaiti:    { name: "Romanian Embassy in Kuwait City", city: "Kuwait City, Kuwait", note: null, url: "https://kuweit.mae.ro/en" },
    qatari:     { name: "Romanian Embassy in Doha",        city: "Doha, Qatar",         note: null, url: "https://doha.mae.ro/en" },
    bahraini:   { name: "Romanian Embassy in Abu Dhabi",   city: "Abu Dhabi, UAE",      note: "Romania has no embassy in Bahrain. Bahraini citizens apply at the Romanian Embassy in Abu Dhabi.", url: "https://abudhabi.mae.ro/en" },
    omani:      { name: "Romanian Embassy in Abu Dhabi",   city: "Abu Dhabi, UAE",      note: "Romania has no embassy in Oman. Omani citizens apply at the Romanian Embassy in Abu Dhabi.", url: "https://abudhabi.mae.ro/en" },
    lebanese:   { name: "Romanian Embassy in Beirut",      city: "Beirut, Lebanon",     note: null, url: "https://beirut.mae.ro/en" },
    palestinian:{ name: "Romanian Embassy in Tel Aviv",    city: "Tel Aviv, Israel",    note: "Palestinian citizens apply at the Romanian Embassy in Tel Aviv or the Romanian Embassy in Amman.", url: "https://telaviv.mae.ro/en" },
    sudanese:   { name: "Romanian Embassy in Cairo",       city: "Cairo, Egypt",        note: "Romania has no embassy in Sudan. Sudanese citizens apply at the Romanian Embassy in Cairo.", url: "https://cairo.mae.ro/en/node/871" },
  },
};

/* Normalize nationality string to a key */
function nationalityKey(nat) {
  if (!nat) return null;
  return nat.toLowerCase().replace(/[^a-z]/g, "");
}

function getEmbassy(destination, nationality) {
  const map = EMBASSIES[destination];
  if (!map) return null;
  const key = nationalityKey(nationality);
  return map[key] || map.default;
}

/* Sources: official diplo.de embassy pages per country */
function germanyNationalityNotes(natKey) {
  const notes = [];

  // ── Egypt (source: kairo.diplo.de official PDF Feb 2025) ──────────────────
  if (natKey === "egyptian" || natKey === "egyption") {
    notes.push({ type: "info", text: "🇪🇬 Apply via TLScontact — NOT at the German Embassy directly. Centers in: Cairo, Alexandria, El-Sheikh Zayed, Hurghada. Book at tlscontact.com." });
    notes.push({ type: "warn", text: "🇪🇬 All Egyptian documents (diploma, transcripts) must first be stamped by the Egyptian Ministry of Foreign Affairs, then legalized by the German Embassy. Allow 3–4 weeks minimum." });
    notes.push({ type: "info", text: "🇪🇬 Translations must be done by sworn translators officially recognized by the German Embassy in Cairo — check the embassy website for the approved list." });
    notes.push({ type: "info", text: "🇪🇬 Language requirement: B1 German (if program in German) OR English certificate (if program in English). Source: kairo.diplo.de." });
  }

  // ── Saudi Arabia (source: saudiarabien.diplo.de) ───────────────────────────
  else if (natKey === "saudi") {
    notes.push({ type: "info", text: "🇸🇦 Apply via VFS Global in Saudi Arabia. Submit: copy of passport (all pages, personally signed) + Saudi ID or Iqama." });
    notes.push({ type: "info", text: "🇸🇦 Photo requirement: 2 biometric photos, not older than 3 months." });
    notes.push({ type: "info", text: "🇸🇦 For blocked account option: also required — employer letter verified by local Chamber of Commerce + 6 months of personal bank statements." });
    notes.push({ type: "info", text: "🇸🇦 Additional required documents: personal motivation letter + detailed CV with educational and professional history. Source: saudiarabien.diplo.de." });
  }

  // ── Lebanon / Syria (source: beirut.diplo.de) ─────────────────────────────
  else if (natKey === "lebanese" || natKey === "syrian") {
    if (natKey === "syrian") notes.push({ type: "warn", text: "🇸🇾 The German Embassy in Damascus is suspended. Syrian students apply at the German Embassy in Beirut, Lebanon." });
    notes.push({ type: "info", text: "🇱🇧🇸🇾 Photo: 35×45mm, not older than 6 months. Digitally altered photos are rejected." });
    notes.push({ type: "info", text: "🇱🇧🇸🇾 Visa fee: €75 equivalent in USD cash, paid at the interview." });
    notes.push({ type: "info", text: "🇱🇧🇸🇾 Additional required documents: signed motivation letter + CV (German or English) + proof of accommodation (lease or dorm application)." });
    notes.push({ type: "info", text: "🇱🇧🇸🇾 Health insurance: travel insurance with minimum €30,000 coverage for first 90 days (until university enrollment). Source: beirut.diplo.de." });
    notes.push({ type: "info", text: "🇱🇧🇸🇾 Financial options: blocked account (€11,904) OR Verpflichtungserklärung (max 6 months old, original required) OR scholarship letter (min €992/month from German institution)." });
  }

  // ── Algeria (source: algier.diplo.de) ────────────────────────────────────
  else if (natKey === "algerian") {
    notes.push({ type: "info", text: "🇩🇿 Apply online via digital.diplo.de — book an appointment before submitting. Do NOT staple application materials." });
    notes.push({ type: "info", text: "🇩🇿 Language requirement: B2 level (higher than standard B1) in the language of instruction, unless university confirms otherwise. Source: algier.diplo.de." });
    notes.push({ type: "info", text: "🇩🇿 Motivation letter must be in German (unless enrolled in English-language program). CV with copy required." });
    notes.push({ type: "info", text: "🇩🇿 Non-Algerian nationals residing in Algeria must also submit valid residency permit + 2 copies." });
    notes.push({ type: "info", text: "🇩🇿 All non-German documents require certified German translation (Übersetzung) — except passport data pages." });
  }

  // ── Morocco (source: rabat.diplo.de) ─────────────────────────────────────
  else if (natKey === "moroccan") {
    notes.push({ type: "info", text: "🇲🇦 Bring originals + 2 photocopies of every document." });
    notes.push({ type: "info", text: "🇲🇦 Additional required documents: motivation letter (max 1 page, handwritten) + detailed CV. Language requirement: B1 minimum. Source: rabat.diplo.de." });
    notes.push({ type: "info", text: "🇲🇦 Processing time: approximately 6–8 weeks. Apply well in advance of semester start." });
  }

  // ── Jordan (source: amman.diplo.de Merkblatt Studium Dec 2024) ────────────
  else if (natKey === "jordanian") {
    notes.push({ type: "info", text: "🇯🇴 Apply via VFS Global in Jordan. Register in the online portal first, then attend in person to submit originals and provide biometric data." });
    notes.push({ type: "info", text: "🇯🇴 Birth certificate required (with legalization and translation). Marriage/divorce certificate if applicable." });
    notes.push({ type: "info", text: "🇯🇴 Jordanian institution documents must carry official stamp + Apostille certification. Source: amman.diplo.de (Dec 2024)." });
  }

  // ── Iraq (source: irak.diplo.de) ─────────────────────────────────────────
  else if (natKey === "iraqi") {
    notes.push({ type: "info", text: "🇮🇶 Baghdad residents apply at the German Embassy in Baghdad. Kurdistan-Iraq residents apply at the German Consulate General in Erbil." });
    notes.push({ type: "info", text: "🇮🇶 Interviews are conducted in German, English, or Arabic only." });
    notes.push({ type: "info", text: "🇮🇶 Use the Visa Navigator at visa.diplo.de for the exact checklist — the embassy does not publish a fixed PDF. Contact embassy directly for binding information. Source: irak.diplo.de." });
  }

  // ── Libya (source: embassy closed) ───────────────────────────────────────
  else if (natKey === "libyan") {
    notes.push({ type: "warn", text: "🇱🇾 The German Embassy in Tripoli is currently closed. Libyan students apply at the German Embassy in Tunis, Tunisia." });
  }

  // ── Yemen (source: maskat.diplo.de — Oman embassy covers Yemen) ──────────
  else if (natKey === "yemeni") {
    notes.push({ type: "warn", text: "🇾🇪 The German Embassy in Sanaa is closed. Yemeni students apply at the German Embassy in Muscat, Oman. Must have legal residency in Oman or Yemen for at least 6 months before applying." });
  }

  // ── Gulf states: Qatar, UAE, Kuwait, Bahrain, Oman ────────────────────────
  else if (["qatari","emirati","kuwaiti","bahraini","omani"].includes(natKey)) {
    notes.push({ type: "info", text: "🇬🇧 Gulf state students: standard German student visa requirements apply. Contact your local German embassy for the exact checklist as Gulf embassy pages do not publish full PDF checklists publicly." });
  }

  // ── Shared note for ALL ───────────────────────────────────────────────────
  notes.push({
    type: "warn",
    text: "⚠️ Blocked account (Sperrkonto) required: minimum €11,904/year (€992/month). All Arab nationalities must open one — no exemptions. Recommended: Fintiba or Coracle (online, 1–2 weeks).",
  });

  return notes;
}

/* Sources: official gov.pl embassy pages per country */
function polandNationalityNotes(natKey) {
  const notes = [];

  // ── Egypt (source: gov.pl/web/egypt/d-type-national-visa) ─────────────────
  if (natKey === "egyptian" || natKey === "egyption") {
    notes.push({ type: "warn", text: "🇪🇬 Bank statement from an Egyptian, Sudanese, or Eritrean bank CANNOT be used as financial proof. You must show funds in a Polish, Schengen, or international bank account. Source: gov.pl/web/egypt" });
    notes.push({ type: "info", text: "🇪🇬 Mogamma certificate required — must cover the last 7 years of civil records. Mandatory for first-time travellers or anyone who has lost a passport." });
    notes.push({ type: "info", text: "🇪🇬 University acceptance letter must be the ORIGINAL — copies/scans are explicitly rejected." });
    notes.push({ type: "info", text: "🇪🇬 Visa fee is paid in USD cash at the appointment." });
  }

  // ── Saudi Arabia (source: gov.pl/web/saudiarabia/d-type-national-visa) ────
  else if (natKey === "saudi") {
    notes.push({ type: "info", text: "🇸🇦 From July 1, 2025: B2 language certificate (in the language of instruction) is MANDATORY. Source: gov.pl/web/saudiarabia." });
    notes.push({ type: "info", text: "🇸🇦 NAWA qualification confirmation required since July 1, 2025 — apply at syrena.nawa.gov.pl before your visa appointment." });
    notes.push({ type: "info", text: "🇸🇦 Must be a resident of Saudi Arabia with a valid Iqama (valid for at least 3 months beyond your planned stay)." });
    notes.push({ type: "info", text: "🇸🇦 Bank statement must cover the last 6 months (not just 3 months standard). Saudi re-entry visa must be valid longer than the planned Schengen trip." });
  }

  // ── Jordan (source: gov.pl/web/jordan — effective August 1, 2024) ─────────
  else if (natKey === "jordanian") {
    notes.push({ type: "warn", text: "🇯🇴 From August 1, 2024: an administrative decision recognising your secondary education diploma from the Polish education superintendent is required — you must obtain this BEFORE submitting your visa application. Source: gov.pl/web/jordan." });
    notes.push({ type: "info", text: "🇯🇴 Contact the education superintendent for the region where your Polish university is located to start the recognition process." });
  }

  // ── Iraq (source: gov.pl/web/iraq/d-type-national-visa) ───────────────────
  else if (natKey === "iraqi") {
    notes.push({ type: "warn", text: "🇮🇶 Apply at the Consulate General in Erbil — appointments ONLY by email to erbil.consul@msz.gov.pl on Wednesdays after 2:00 PM." });
    notes.push({ type: "warn", text: "🇮🇶 Wait time for an appointment is at least 2–3 weeks (up to 1 month). Book early." });
    notes.push({ type: "info", text: "🇮🇶 Health insurance MUST be purchased from an insurance company operating in Poland under the Polish Insurance Chamber — foreign insurance is NOT accepted. Source: gov.pl/web/iraq." });
    notes.push({ type: "info", text: "🇮🇶 Visa fee: 240 USD, cash only." });
  }

  // ── UAE (source: gov.pl/web/uae/d-type-national-visa) ─────────────────────
  else if (natKey === "emirati") {
    notes.push({ type: "info", text: "🇦🇪 Must be a UAE resident with a valid Emirates ID (EID) to apply at the Embassy in Abu Dhabi." });
    notes.push({ type: "info", text: "🇦🇪 B2 language proficiency certificate in the language of studies is required. Source: gov.pl/web/uae." });
    notes.push({ type: "info", text: "🇦🇪 NAWA written confirmation required since July 1, 2025 — apply at syrena.nawa.gov.pl." });
  }

  // ── Kuwait (source: gov.pl/web/kuwait/d-type-national-visa) ───────────────
  else if (natKey === "kuwaiti") {
    notes.push({ type: "info", text: "🇰🇼 Kuwaiti citizens: either 3-month bank statement OR salary certificate is accepted. Non-Kuwaiti residents in Kuwait must submit BOTH documents." });
    notes.push({ type: "info", text: "🇰🇼 Visa fee: 72 Kuwaiti Dinars, cash only." });
  }

  // ── Libya (closed embassy) ─────────────────────────────────────────────────
  else if (natKey === "libyan") {
    notes.push({ type: "warn", text: "🇱🇾 Poland has no embassy in Libya. Libyan students must apply at the Polish Embassy in Tunis, Tunisia (tunezja.msz.gov.pl)." });
  }

  // ── Syria (closed embassy) ────────────────────────────────────────────────
  else if (natKey === "syrian") {
    notes.push({ type: "warn", text: "🇸🇾 The Polish Embassy in Damascus is closed. Syrian students apply at the Polish Embassy in Beirut, Lebanon (bejrut.msz.gov.pl)." });
  }

  // ── Yemen (no embassy) ────────────────────────────────────────────────────
  else if (natKey === "yemeni") {
    notes.push({ type: "warn", text: "🇾🇪 Poland has no embassy in Yemen. Yemeni students apply at the Polish Embassy in Amman, Jordan (amman.msz.gov.pl)." });
  }

  // ── Oman (no direct embassy) ──────────────────────────────────────────────
  else if (natKey === "omani") {
    notes.push({ type: "info", text: "🇴🇲 Poland has no embassy in Oman. Omani students apply at the Polish Embassy in Abu Dhabi, UAE (abudhabi.msz.gov.pl)." });
  }

  // ── Shared note for ALL ───────────────────────────────────────────────────
  notes.push({ type: "warn", text: "⚠️ NAWA SYRENA diploma recognition is mandatory since July 1, 2025 for all non-EU/non-OECD students applying for first-degree studies. Apply at syrena.nawa.gov.pl — takes 30–60 days. Do not wait." });

  return notes;
}

/* Sources: official mae.ro / igi.mai.gov.ro / eviza.mae.ro / bagdad.mae.ro */
function romaniaNationalityNotes(natKey) {
  const notes = [];

  // ── Egypt (source: cairo.mae.ro) ──────────────────────────────────────────
  if (natKey === "egyptian" || natKey === "egyption") {
    notes.push({ type: "info", text: "🇪🇬 Apply online via evisa.mae.ro, then attend in person at the Romanian Embassy in Cairo. Visa fee paid in USD cash at the appointment. Source: cairo.mae.ro." });
  }

  // ── Morocco (source: rabat.mae.ro confirmed on mae.ro) ────────────────────
  else if (natKey === "moroccan") {
    notes.push({ type: "info", text: "🇲🇦 Romanian Embassy in Rabat (rabat.mae.ro). Additional consulates available in Casablanca, Marrakech, and Tangier — you may apply at the one closest to you. Source: mae.ro." });
  }

  // ── Algeria (source: mae.ro) ──────────────────────────────────────────────
  else if (natKey === "algerian") {
    notes.push({ type: "info", text: "🇩🇿 Apply at the Romanian Embassy in Algiers (alger.mae.ro). Submit online via evisa.mae.ro first, then attend in person." });
  }

  // ── Tunisia ───────────────────────────────────────────────────────────────
  else if (natKey === "tunisian") {
    notes.push({ type: "info", text: "🇹🇳 Apply at the Romanian Embassy in Tunis. Submit online via evisa.mae.ro first, then attend in person." });
  }

  // ── Saudi Arabia (source: riyadh.mae.ro confirmed on mae.ro) ──────────────
  else if (natKey === "saudi") {
    notes.push({ type: "info", text: "🇸🇦 Apply at the Romanian Embassy in Riyadh (riyadh.mae.ro). There is also an Honorary Consulate in Jeddah. Submit online at evisa.mae.ro first. Source: mae.ro." });
  }

  // ── Jordan (source: amman.mae.ro confirmed on mae.ro) ─────────────────────
  else if (natKey === "jordanian") {
    notes.push({ type: "info", text: "🇯🇴 Apply at the Romanian Embassy in Amman (amman.mae.ro). Documents not in English or French must be accompanied by a certified translation. Source: amman.mae.ro." });
  }

  // ── Iraq (source: bagdad.mae.ro) ──────────────────────────────────────────
  else if (natKey === "iraqi") {
    notes.push({ type: "warn", text: "🇮🇶 Apply at the Romanian Embassy in Baghdad (bagdad.mae.ro). Submit your application at least 60 days before your planned departure — processing takes 15 days but can extend to 60 days in exceptional cases." });
    notes.push({ type: "info", text: "🇮🇶 Visa fee: 108 USD, cash only. Source: bagdad.mae.ro." });
  }

  // ── Lebanon (source: beirut.mae.ro confirmed on mae.ro) ───────────────────
  else if (natKey === "lebanese") {
    notes.push({ type: "info", text: "🇱🇧 Apply at the Romanian Embassy in Beirut (beirut.mae.ro). Submit online via evisa.mae.ro first." });
  }

  // ── Syria (source: mae.ro — Romania has embassy in Damascus with Chargé d'affaires) ──
  else if (natKey === "syrian") {
    notes.push({ type: "info", text: "🇸🇾 Romania maintains an embassy in Damascus. Contact the embassy directly to confirm current consular services before applying, as operations are limited. Source: mae.ro." });
  }

  // ── Libya (source: mae.ro — embassy relocated to Tunis) ───────────────────
  else if (natKey === "libyan") {
    notes.push({ type: "warn", text: "🇱🇾 The Romanian Embassy in Tripoli has been temporarily relocated to Tunis, Tunisia. Libyan students must apply at the Romanian Embassy in Tunis. Source: mae.ro." });
  }

  // ── Yemen (source: mae.ro — no Romanian embassy since 2003) ───────────────
  else if (natKey === "yemeni") {
    notes.push({ type: "warn", text: "🇾🇪 Romania closed its embassy in Yemen in 2003 and has no current diplomatic mission there. Contact the Romanian Embassy in Riyadh, Saudi Arabia (riyadh.mae.ro) or the nearest Romanian embassy to arrange your application. Source: mae.ro." });
  }

  // ── UAE (source: abudhabi.mae.ro confirmed on mae.ro) ─────────────────────
  else if (natKey === "emirati") {
    notes.push({ type: "info", text: "🇦🇪 Romania has an Embassy in Abu Dhabi (abudhabi.mae.ro) and a Consulate General in Dubai. You may apply at either. Source: mae.ro." });
  }

  // ── Kuwait (source: mae.ro) ────────────────────────────────────────────────
  else if (natKey === "kuwaiti") {
    notes.push({ type: "info", text: "🇰🇼 Romania has an Embassy in Kuwait City. Apply online at evisa.mae.ro first, then attend in person. Source: mae.ro." });
  }

  // ── Qatar (source: doha.mae.ro confirmed on mae.ro) ───────────────────────
  else if (natKey === "qatari") {
    notes.push({ type: "info", text: "🇶🇦 Apply at the Romanian Embassy in Doha (doha.mae.ro). Submit online via evisa.mae.ro first. Source: mae.ro." });
  }

  // ── Bahrain (source: mae.ro — no Romanian embassy in Bahrain) ─────────────
  else if (natKey === "bahraini") {
    notes.push({ type: "warn", text: "🇧🇭 Romania has no embassy in Bahrain. Apply at the Romanian Embassy in Abu Dhabi, UAE (abudhabi.mae.ro). Source: mae.ro." });
  }

  // ── Oman (source: mae.ro — no Romanian embassy in Oman) ───────────────────
  else if (natKey === "omani") {
    notes.push({ type: "warn", text: "🇴🇲 Romania has no embassy in Oman. Apply at the Romanian Embassy in Abu Dhabi, UAE (abudhabi.mae.ro). Source: mae.ro." });
  }

  // ── Shared notes for ALL ──────────────────────────────────────────────────
  notes.push({ type: "warn", text: "⚠️ Romania requires a Ministry of Education Letter of Acceptance — NOT just a university admission letter. The university must submit a request to the Romanian Ministry of Education first, which then issues the official letter. This adds 4–8 weeks — start early. Source: igi.mai.gov.ro / studyinromania.gov.ro." });
  notes.push({ type: "info", text: "ℹ️ After online submission at evisa.mae.ro, your application goes to the National Visa Center which gets a favorable opinion from IGI (General Inspectorate for Immigration) — this takes up to 30–45 days internally. The €120 visa fee is paid at the embassy. Source: igi.mai.gov.ro." });

  return notes;
}

/* ── Country static data ──────────────────────────────────────────────────── */
const COUNTRIES = {
  germany: {
    name: "Germany",
    flag: "🇩🇪",
    code: "DE",
    accent: "#DD0000",
    visaName: "National Visa (Type D) — Student",
    intro: "Germany has one of the best higher education systems in the world, with most public universities offering free tuition. As a non-EU student you need a national visa before you can enter and study.",
    timeline: "8–12 weeks",
    cost: "€75",
    steps: [
      { number: "1", title: "Get Admission Letter", desc: "You must have an official admission letter (Zulassungsbescheid) from a German university before applying for the visa. Conditional admission is usually not accepted." },
      { number: "2", title: "Open a Blocked Account (Sperrkonto)", desc: "You must prove you can support yourself financially. Open a blocked account with at least €11,904 (€992/month × 12). Required for ALL non-EU students including Arab nationalities. Recommended providers: Fintiba or Coracle — fully online, takes 1–2 weeks." },
      { number: "3", title: "Get Health Insurance", desc: "You need valid health insurance for Germany. Student public insurance (gesetzliche Krankenversicherung) like TK or AOK is recommended and costs ~€110/month. Get a confirmation letter before your visa appointment." },
      { number: "4", title: "Book Embassy Appointment", desc: "Book a visa appointment at your country's German embassy/consulate (see Your Embassy section above). Wait times can be 4–8 weeks — book as early as possible." },
      { number: "5", title: "Prepare Documents", desc: "Gather all required documents (see checklist below). Get official translations into German or English from certified translators." },
      { number: "6", title: "Attend Appointment & Pay Fee", desc: "Attend your appointment, submit all documents, pay the €75 visa fee, and provide biometric data (fingerprints). Processing time is typically 4–8 weeks after submission." },
      { number: "7", title: "Arrive & Register (Anmeldung)", desc: "Within 14 days of arriving in Germany, register your address at the local citizens' office (Einwohnermeldeamt/Bürgeramt). You'll receive a registration certificate (Anmeldebestätigung) — keep it, you'll need it for everything." },
      { number: "8", title: "Get Residence Permit", desc: "Your visa allows you to enter. Within Germany, apply for a student residence permit (Aufenthaltserlaubnis) at the local Foreigners' Office (Ausländerbehörde). Bring your registration certificate, enrollment confirmation, and insurance." },
    ],
    documents: [
      { name: "Valid passport — not older than 10 years, valid 6+ months beyond stay, minimum 2 blank pages", required: true },
      { name: "National visa application form (VIDEX) — completed online at diplo.de, printed and signed", required: true },
      { name: "Biometric passport photos — recent, meeting German embassy photo specifications", required: true },
      { name: "University admission letter (Zulassungsbescheid) — must show the date lectures start", required: true },
      { name: "FINANCIAL PROOF — choose ONE of the 3 options below (source: German Embassy Cairo official PDF):", required: true },
      { name: "  Option 1: Blocked account (Sperrkonto) — minimum €11,904/year (€992/month). Providers: Fintiba, Coracle, Deutsche Bank.", required: true },
      { name: "  Option 2: Scholarship letter — from an official German institution or program (e.g. DAAD, Erasmus+).", required: true },
      { name: "  Option 3: Verpflichtungserklärung — formal written obligation by a person living in Germany to cover your costs for the full duration of studies.", required: true },
      { name: "Health insurance confirmation — valid for Germany, covering duration of stay", required: true },
      { name: "Last obtained high school or university degree — original + certified translation into German or English + legalization", required: true },
      { name: "Academic transcripts — original + certified translation + legalization", required: true },
      { name: "German language certificate — minimum B1 (Goethe, TestDaF, or DSH) if program taught in German", required: false },
      { name: "English language certificate (IELTS/TOEFL) — if program is taught in English (university written confirmation also accepted)", required: false },
      { name: "APS certificate — only if from China, Vietnam, India, or Mongolia", required: false },
    ],
    costs: [
      { item: "Visa fee (non-refundable, paid in local currency)", amount: "€75" },
      { item: "Blocked account (Sperrkonto) — released €992/month after arrival", amount: "€11,904" },
      { item: "Health insurance (e.g. TK, AOK — monthly after arrival)", amount: "~€110/month" },
      { item: "Document legalization + certified translation (per document)", amount: "varies" },
      { item: "Residence permit at Ausländerbehörde in Germany", amount: "~€100" },
    ],
    tips: [
      "Start the process at least 4–5 months before your intended start date.",
      "Fintiba and Coracle are the fastest blocked account providers — they're online and take 1–2 weeks.",
      "If your embassy is slow, book the appointment the moment you apply to a university, even before you get admitted.",
      "The Anmeldung (address registration) is the most important first step once you arrive — without it you can't open a bank account or get insurance.",
      "Learn basic German before you arrive — it helps enormously with bureaucracy.",
      "Join Facebook groups or WhatsApp groups of Arab students in your city — they share tips and help with translation.",
    ],
    afterArrival: [
      { title: "Register your address (Anmeldung)", desc: "Within 14 days at the Bürgeramt. Bring passport + rental contract.", urgent: true },
      { title: "Open a German bank account", desc: "DKB, N26, or Sparkasse. You need Anmeldebestätigung to open one.", urgent: true },
      { title: "Enroll at the university", desc: "Submit enrollment documents and pay the semester fee (€100–400).", urgent: true },
      { title: "Apply for residence permit", desc: "At the Ausländerbehörde — book the appointment early, wait times can be weeks.", urgent: true },
      { title: "Get a German SIM card", desc: "Aldi Talk, Congstar, or Lebara are affordable. ~€10/month.", urgent: false },
      { title: "Get a health insurance card", desc: "Your insurer (TK, AOK, Barmer) will mail you a card after enrollment.", urgent: false },
    ],
  },

  poland: {
    name: "Poland",
    flag: "🇵🇱",
    code: "PL",
    accent: "#DC143C",
    visaName: "National Visa (Type D) — Student",
    intro: "Poland is one of the most affordable study destinations in Europe with good quality universities. The visa process is simpler than Germany's, but has specific requirements including diploma recognition through NAWA SYRENA (mandatory since July 2025).",
    timeline: "4–8 weeks",
    cost: "varies by country",
    steps: [
      { number: "1", title: "Get Admission Letter", desc: "Apply to a Polish university and receive an official acceptance letter for full-time studies. Many Polish universities have English-taught programs and accept international students year-round." },
      { number: "2", title: "NAWA SYRENA — Diploma Recognition (MANDATORY)", desc: "Mandatory since July 1, 2025. You must get your high school diploma recognized through the NAWA SYRENA system before applying for the visa. Apply at syrena.nawa.gov.pl. Takes 30–60 days — start this immediately, do not wait." },
      { number: "3", title: "Pay First Year Tuition", desc: "Most Polish universities require proof of first-year tuition payment before issuing documents needed for the visa. Get a bank confirmation of the payment." },
      { number: "4", title: "Prepare Bank Statement", desc: "Show financial means of at least 776 PLN/month for the stay duration plus 2,500 PLN (~€600) for return travel. Recommended total: €3,500–4,000 in your account. Bank statement must be no older than 1 month and show 3 months of transaction history." },
      { number: "5", title: "Get Health Insurance", desc: "Travel/health insurance valid for Poland covering minimum €30,000 for medical emergencies, hospitalization, and repatriation. Must cover your entire stay or at least the first year." },
      { number: "6", title: "Book Embassy Appointment & Apply", desc: "Fill out the visa form via the e-konsulat system (ekonsulat.gov.pl), print and sign it. Book an appointment at your country's Polish embassy (see Your Embassy section above). Pay the visa fee (amount varies by country — check your local embassy website). Processing: 2–4 weeks." },
      { number: "7", title: "Arrive & Register", desc: "Within 30 days of arrival, register at the local voivodeship office (Urząd Wojewódzki) and apply for a temporary residence card (karta pobytu). Takes 1–3 months to receive." },
    ],
    documents: [
      { name: "Valid passport — valid 3+ months after planned departure, not older than 10 years, minimum 2 blank pages", required: true },
      { name: "Visa application form — completed via e-konsulat system, printed and signed", required: true },
      { name: "1 recent biometric photo — 3.5×4.5 cm, white background, face covering 70–80% of frame", required: true },
      { name: "University acceptance letter — original, confirming admission to full-time studies in Poland", required: true },
      { name: "NAWA written confirmation — that your high school diploma qualifies you to study in Poland (mandatory since July 1, 2025). Contact: dyplom@nawa.gov.pl", required: true },
      { name: "High school diploma (original + legalization/apostille) + sworn translation into Polish or English", required: true },
      { name: "Financial proof — bank statement showing sufficient funds to cover living costs (776 PLN/month) and return travel", required: true },
      { name: "Health/travel insurance — minimum €30,000 coverage, valid for Poland for entire stay duration", required: true },
      { name: "Proof of accommodation — dormitory confirmation or signed rental agreement", required: true },
      { name: "English language certificate — if studying in English", required: false },
      { name: "Polish language certificate — if studying in Polish", required: false },
    ],
    costs: [
      { item: "Visa fee (non-refundable — verify exact amount at your local Polish embassy)", amount: "varies by country" },
      { item: "NAWA diploma recognition", amount: "check nawa.gov.pl" },
      { item: "Sworn translation into Polish (per document)", amount: "varies" },
      { item: "Document legalization/apostille (per document)", amount: "varies" },
      { item: "Health/travel insurance (for visa period)", amount: "varies" },
      { item: "NFZ student health insurance (monthly, after enrollment)", amount: "~€30/month" },
      { item: "Temporary residence card (karta pobytu)", amount: "~€35" },
    ],
    tips: [
      "Start the NAWA SYRENA process immediately — it takes 30–60 days and is mandatory. Don't wait until you have your admission letter.",
      "Sworn translations (tłumaczenie przysięgłe) must be done by a certified Polish sworn translator — regular translators are not accepted.",
      "Polish universities are very international-friendly — many have offices for foreign students that help with paperwork.",
      "Warsaw and Krakow have the largest Arab student communities in Poland — good support networks.",
      "Cost of living is much lower than Western Europe: €400–600/month covers rent + food in most cities.",
      "The karta pobytu (residence card) allows you to travel within the Schengen Area — very useful.",
    ],
    afterArrival: [
      { title: "Register at voivodeship office", desc: "Apply for temporary residence card (karta pobytu) within 30 days. Takes 1–3 months to receive.", urgent: true },
      { title: "Enroll at the university", desc: "Complete enrollment, get student ID, and sign up for NFZ health insurance.", urgent: true },
      { title: "Open a Polish bank account", desc: "PKO BP or mBank are easy to open with student ID + passport.", urgent: false },
      { title: "Get a Polish SIM card", desc: "Play, Orange, or Plus — prepaid SIMs are cheap (~€5).", urgent: false },
      { title: "Apply for NFZ health insurance", desc: "Through your university — mandatory for full public healthcare coverage.", urgent: false },
    ],
  },

  romania: {
    name: "Romania",
    flag: "🇷🇴",
    code: "RO",
    accent: "#002B7F",
    visaName: "Long-Stay Visa (Type D/SD) — Student",
    intro: "Romania offers affordable, internationally recognized degrees — many programs are in English or French. It joined the Schengen Area in March 2024, making it even more attractive. The visa process requires a Ministry of Education acceptance letter (not just a university letter), so start early.",
    timeline: "6–10 weeks",
    cost: "€120",
    steps: [
      { number: "1", title: "Get University Admission Letter", desc: "Apply to a Romanian university and receive their acceptance. The university will then submit a request to the Romanian Ministry of Education on your behalf — this is mandatory." },
      { number: "2", title: "Get Ministry of Education Acceptance Letter", desc: "The Romanian Ministry of Education issues the official Letter of Acceptance for Studies (Scrisoare de Acceptare). This is different from the university letter and is REQUIRED for the visa. Allow 4–8 weeks for this step." },
      { number: "3", title: "Pay First Year Tuition", desc: "Most Romanian universities require proof of first-year tuition payment before issuing visa documents. Get a bank confirmation receipt." },
      { number: "4", title: "Obtain Criminal Record Certificate", desc: "Get a criminal record certificate (good conduct certificate) from your home country, apostilled and translated into Romanian or English. This is unique to Romanian visas." },
      { number: "5", title: "Prepare Financial Proof", desc: "Show bank statement with at least the Romanian minimum gross salary (~€650/month) for the full duration of your stay. For a 10-month academic year: ~€6,500 minimum. Statement must be recent (within 1 month)." },
      { number: "6", title: "Apply Online at evisa.mae.ro", desc: "Submit your visa application online at evisa.mae.ro. Apply at least 4 weeks before departure, but no more than 3 months before. After online submission, book an in-person appointment at your Romanian embassy." },
      { number: "7", title: "Attend Embassy Appointment", desc: "Bring all original documents to your Romanian embassy. Pay the €120 visa fee. The visa allows a 90-day entry; you'll convert it to a residence permit after arrival." },
      { number: "8", title: "Arrive & Apply for Residence Permit", desc: "Within 30 days of arrival, apply at the Romanian Immigration Inspectorate (IGI) for a temporary residence permit for studies. Bring your visa, acceptance letter, enrollment confirmation, and insurance." },
    ],
    documents: [
      { name: "Valid passport — issued within last 10 years, valid 3+ months beyond visa expiry, minimum 2 blank pages", required: true },
      { name: "Visa application form — submitted online at evisa.mae.ro, then printed and signed", required: true },
      { name: "2 recent passport photos — 3×4 cm, white background", required: true },
      { name: "Ministry of Education Letter of Acceptance — issued by Romanian MoE (NOT just the university admission letter)", required: true },
      { name: "Proof of tuition payment — bank receipt for first academic year", required: true },
      { name: "Criminal record certificate — from home country, apostilled + translated into Romanian or English", required: true },
      { name: "Financial proof — bank statement showing minimum ~€650/month (Romanian gross minimum salary) for full stay duration", required: true },
      { name: "Health/travel insurance — minimum €30,000 coverage, valid for Romania for entire stay duration", required: true },
      { name: "Proof of accommodation — university dormitory confirmation or signed rental agreement", required: true },
      { name: "Language certificate — IELTS/TOEFL/Cambridge if studying in English (not required for Romanian-language preparatory year)", required: false },
      { name: "Parental consent — notarized, if applicant is under 18", required: false },
    ],
    costs: [
      { item: "Visa fee (D/SD long-stay — waived for Romanian Government Scholarship holders)", amount: "€120" },
      { item: "Criminal record certificate apostille + translation", amount: "varies" },
      { item: "Health/travel insurance (for visa period)", amount: "varies" },
      { item: "Temporary residence permit at IGI (annual)", amount: "~€120" },
      { item: "Monthly living costs (rent + food + transport)", amount: "€400–600/month" },
    ],
    tips: [
      "Start the Ministry of Education acceptance letter process immediately after university admission — it adds 4–8 weeks that most students don't plan for.",
      "Romania joined Schengen in March 2024 — your Romanian residence permit now allows travel within Schengen, a major benefit.",
      "evisa.mae.ro is the mandatory online portal — apply there before visiting the embassy.",
      "Your visa is only valid for 90 days — you MUST apply for a residence permit at IGI within 30 days of arrival to stay legally.",
      "Iași, Cluj-Napoca, and Timișoara have large Arab student communities — great support networks.",
      "Romanian universities often have preparatory year programs in Romanian — useful if you want to study in Romanian and save on tuition.",
      "Get your criminal record certificate well in advance — apostille procedures in Arab countries can take 2–4 weeks.",
    ],
    afterArrival: [
      { title: "Apply for residence permit at IGI", desc: "Within 30 days of arrival. Bring visa, acceptance letter, insurance, enrollment confirmation.", urgent: true },
      { title: "Enroll at the university", desc: "Complete formal enrollment, pay any remaining fees, get student ID.", urgent: true },
      { title: "Open a Romanian bank account", desc: "BRD, BCR, or Revolut. You need student ID + passport. Required to receive scholarship payments.", urgent: false },
      { title: "Get Romanian SIM card", desc: "Orange, Vodafone, or Digi — affordable prepaid options (~€5).", urgent: false },
      { title: "Register with CNAS health insurance", desc: "Through your university — mandatory for access to public healthcare in Romania.", urgent: false },
    ],
  },
};

/* ── Embassy card component ───────────────────────────────────────────────── */
const EmbassyCard = ({ embassy, accent, nationality }) => (
  <div className="rounded-2xl p-5" style={{ background: `${accent}15`, border: `1px solid ${accent}40` }}>
    <div className="flex items-start gap-3">
      <span className="shrink-0"><Icon d={ICONS.building} size={20} /></span>
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: accent }}>
          Your Embassy {nationality ? `(${nationality})` : ""}
        </p>
        <p className="font-bold text-[var(--ink)] text-base">{embassy.name}</p>
        <p className="text-sm mt-0.5" style={{ color: dim }}>{embassy.city}</p>
        {embassy.note && (
          <p className="text-xs mt-2 rounded-lg px-3 py-2 flex items-start gap-1.5" style={{ background: "var(--warn-subtle)", color: "var(--warn)" }}>
            <Icon d={ICONS.alertTriangle} size={13} className="shrink-0 mt-0.5" />
            <span>{embassy.note}</span>
          </p>
        )}
        <a href={embassy.url} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1 mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
           style={{ background: `${accent}25`, color: accent }}>
          Book Appointment / Official Website →
        </a>
      </div>
    </div>
  </div>
);

/* ── Country flag badge (avoids broken emoji on Windows) ─────────────────── */
const CountryBadge = ({ code, accent }) => (
  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-bold text-lg tracking-wide"
       style={{ background: `${accent}22`, border: `2px solid ${accent}55`, color: accent }}>
    {code}
  </div>
);

/* ── Hub page ─────────────────────────────────────────────────────────────── */
const VisaGuideHub = ({ nationality }) => (
  <div className="min-h-screen" style={{ background: bg, color: "var(--ink)" }}>
    {/* Hero — matches app header style */}
    <div className="px-6 pt-10 pb-8 max-w-5xl mx-auto">
      <div className="rounded-2xl overflow-hidden relative"
           style={{ background: "linear-gradient(135deg, var(--bg), var(--bg))", border: "1px solid rgba(255,255,255,0.08)" }}>
        {/* decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
             style={{ background: "radial-gradient(circle, var(--accent-light), transparent)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
             style={{ background: "radial-gradient(circle, var(--accent-light), transparent)", transform: "translate(-30%, 30%)" }} />
        <div className="relative px-8 py-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                 style={{ background: "rgba(129,70,224,0.2)", border: "1px solid rgba(129,70,224,0.3)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--ink)]">Student Visa Guide</h1>
              <p className="text-sm" style={{ color: "var(--ink-faint)" }}>Step-by-step guides from official government sources</p>
            </div>
          </div>
          {nationality ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                 style={{ background: "rgba(129,70,224,0.15)", color: "var(--accent-light)", border: "1px solid rgba(129,70,224,0.25)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              Personalized for {nationality} students
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                 style={{ background: "rgba(185,77,0,0.15)", color: "#ffa44e", border: "1px solid rgba(185,77,0,0.25)" }}>
              Complete your profile to personalize this guide
            </div>
          )}
        </div>
      </div>
    </div>

    <div className="max-w-5xl mx-auto px-6 pb-12 space-y-8">
      {/* Country cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(COUNTRIES).map(([key, c]) => {
          const embassy = getEmbassy(key, nationality);
          return (
            <Link key={key} to={`/visa-guide/${key}`}
              className="group rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: card, border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${c.accent}50`}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}>
              {/* top accent bar */}
              <div className="h-1" style={{ background: c.accent }} />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <CountryBadge code={c.code} accent={c.accent} />
                  <div className="min-w-0">
                    <h2 className="font-bold text-[var(--ink)] text-base leading-tight">{c.name}</h2>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: dim }}>{c.visaName}</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--ink-faint)" }}>
                  {c.intro.slice(0, 100)}…
                </p>
                {embassy && nationality && (
                  <div className="text-[11px] mb-3 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
                       style={{ background: `${c.accent}12`, color: c.accent }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    {embassy.name}
                  </div>
                )}
                <div className="flex items-center gap-2 text-[11px] flex-wrap">
                  <span className="px-2 py-0.5 rounded-full font-medium" style={{ background: `${c.accent}18`, color: c.accent }}>
                    {c.timeline}
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(129,70,224,0.12)", color: "var(--accent-light)" }}>
                    Fee: {c.cost}
                  </span>
                </div>
                <div className="mt-3 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: c.accent }}>
                  Full guide <span>→</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Tips */}
      <div className="rounded-2xl p-6" style={{ background: card, border: "1px solid rgba(255,255,255,0.08)" }}>
        <h3 className="text-base font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ background: "var(--accent-subtle)" }}><Icon d={ICONS.lightbulb} size={16} /></span>
          General Tips for All Arab Students
        </h3>
        <ul className="space-y-2.5">
          {[
            "Start your visa application at least 4–5 months before your intended start date — embassy appointments fill up fast.",
            "Get all documents officially translated by a certified/sworn translator — not just any translation service.",
            "Join Facebook groups and WhatsApp groups of Arab students in your target city before you arrive — they are your best resource.",
            "Keep digital copies of ALL documents in Google Drive or iCloud. You will need them repeatedly.",
            "Your passport must be valid for at least 6 months beyond your intended stay. Renew it early if needed.",
            "Never overstay your visa. If you need an extension, apply at least 3 months before it expires.",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--ink-faint)" }}>
              <span className="shrink-0 mt-0.5 text-green-400 text-xs">✓</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

/* ── Detail page ──────────────────────────────────────────────────────────── */
const VisaGuideDetail = ({ countryKey, nationality }) => {
  const c = COUNTRIES[countryKey];
  if (!c) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="text-center">
        <p className="text-[var(--ink)] text-xl mb-4">Country not found</p>
        <Link to="/visa-guide" className="text-sm" style={{ color: "var(--accent-light)" }}>← Back to Visa Guide</Link>
      </div>
    </div>
  );

  const embassy = getEmbassy(countryKey, nationality);

  return (
    <div className="min-h-screen" style={{ background: bg, color: "var(--ink)" }}>
      {/* Hero */}
      <div className="relative overflow-hidden text-[var(--ink)] py-14 px-8"
           style={{ background: `linear-gradient(135deg, ${c.accent}cc, ${c.accent}66)` }}>
        <Link to="/visa-guide" className="inline-flex items-center gap-2 text-sm mb-6 opacity-80 hover:opacity-100">
          ← All Countries
        </Link>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 font-bold text-2xl tracking-wide"
               style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", color: "#fff" }}>
            {c.code}
          </div>
          <div>
            <h1 className="text-4xl font-bold">{c.name} Student Visa</h1>
            <p className="text-lg mt-1 opacity-80">{c.visaName}</p>
          </div>
        </div>
        <div className="flex gap-4 mt-6 flex-wrap">
          <div className="px-4 py-2 rounded-xl text-sm font-medium bg-white/15">⏱ Processing: {c.timeline}</div>
          <div className="px-4 py-2 rounded-xl text-sm font-medium bg-white/15 inline-flex items-center gap-1.5"><Icon d={ICONS.wallet} size={13} /> Fee: {c.cost}</div>
          {nationality && (
            <div className="px-4 py-2 rounded-xl text-sm font-medium bg-white/15 inline-flex items-center gap-1.5"><Icon d={ICONS.globe} size={13} /> Guide for {nationality} students</div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Intro */}
        <div className="rounded-2xl p-6" style={{ background: card, border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>{c.intro}</p>
        </div>

        {/* Embassy card — personalized */}
        {embassy && (
          <div>
            <h2 className="text-2xl font-bold text-[var(--ink)] mb-4 inline-flex items-center gap-2"><Icon d={ICONS.building} size={17} /> Your Embassy</h2>
            <EmbassyCard embassy={embassy} accent={c.accent} nationality={nationality} />
            {!nationality && (
              <p className="text-xs mt-2" style={{ color: dim }}>
                Complete your <Link to="/profile" className="underline" style={{ color: "var(--accent-light)" }}>profile</Link> with your nationality to see the exact embassy for your country.
              </p>
            )}
          </div>
        )}

        {/* Nationality-specific requirements */}
        {nationality && (() => {
          const natKey = nationalityKey(nationality);
          const notes = countryKey === "germany"
            ? germanyNationalityNotes(natKey)
            : countryKey === "poland"
            ? polandNationalityNotes(natKey)
            : countryKey === "romania"
            ? romaniaNationalityNotes(natKey)
            : [];
          return notes.length > 0 ? (
            <div>
              <h2 className="text-2xl font-bold text-[var(--ink)] mb-4 inline-flex items-center gap-2"><Icon d={ICONS.pin} size={17} /> Requirements for {nationality} Students</h2>
              <div className="space-y-3">
                {notes.map((n, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
                       style={{
                         background: n.type === "good" ? "rgba(0,142,69,0.1)" : "rgba(185,77,0,0.1)",
                         border: `1px solid ${n.type === "good" ? "rgba(0,142,69,0.3)" : "rgba(185,77,0,0.3)"}`,
                         color: n.type === "good" ? "var(--good)" : "#ffa44e",
                       }}>
                    {n.text}
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {/* Steps */}
        <div>
          <h2 className="text-2xl font-bold text-[var(--ink)] mb-6 inline-flex items-center gap-2"><Icon d={ICONS.applications} size={17} /> Step-by-Step Process</h2>
          <div className="space-y-4">
            {c.steps.map((step) => (
              <div key={step.number} className="flex gap-4 rounded-2xl p-5" style={{ background: card, border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-[var(--ink)] font-bold text-sm"
                     style={{ background: c.accent }}>{step.number}</div>
                <div>
                  <h3 className="font-bold text-[var(--ink)] mb-1">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--ink-faint)" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document checklist */}
        <div>
          <h2 className="text-2xl font-bold text-[var(--ink)] mb-6 inline-flex items-center gap-2"><Icon d={ICONS.email} size={17} /> Document Checklist</h2>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            {c.documents.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 text-sm"
                   style={{ background: i % 2 === 0 ? card : "var(--bg)", borderBottom: i < c.documents.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: doc.required ? "var(--danger)" : "var(--good)" }} />
                <span style={{ color: "var(--ink-dim)" }}>{doc.name}</span>
                <span className="ms-auto text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: doc.required ? "rgba(197,54,55,0.15)" : "rgba(0,142,69,0.12)", color: doc.required ? "#ff7972" : "var(--good)" }}>
                  {doc.required ? "Required" : "Optional"}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: dim }}>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--danger)" }} /> Required</span>
            &nbsp;|&nbsp;
            <span className="inline-flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--good)" }} /> Optional but recommended</span>
          </p>
        </div>

        {/* Costs */}
        <div>
          <h2 className="text-2xl font-bold text-[var(--ink)] mb-6 inline-flex items-center gap-2"><Icon d={ICONS.wallet} size={17} /> Cost Breakdown</h2>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            {c.costs.map((cost, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 text-sm"
                   style={{ background: i % 2 === 0 ? card : "var(--bg)", borderBottom: i < c.costs.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <span style={{ color: "var(--ink-dim)" }}>{cost.item}</span>
                <span className="font-bold" style={{ color: "var(--accent-light)" }}>{cost.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div>
          <h2 className="text-2xl font-bold text-[var(--ink)] mb-6 inline-flex items-center gap-2"><Icon d={ICONS.lightbulb} size={17} /> Tips for Arab Students</h2>
          <div className="space-y-3">
            {c.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl p-4 text-sm"
                   style={{ background: card, border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="shrink-0" style={{ color: "var(--warn)" }}><Icon d={ICONS.lightbulb} size={15} /></span>
                <span style={{ color: "var(--ink-dim)" }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* After arrival */}
        <div>
          <h2 className="text-2xl font-bold text-[var(--ink)] mb-6 inline-flex items-center gap-2"><Icon d={ICONS.compass} size={17} /> First Week After Arrival</h2>
          <div className="space-y-3">
            {c.afterArrival.map((item, i) => (
              <div key={i} className="flex items-start gap-4 rounded-xl p-4"
                   style={{ background: item.urgent ? `${c.accent}12` : card, border: `1px solid ${item.urgent ? `${c.accent}30` : "rgba(255,255,255,0.07)"}` }}>
                <span className="text-lg shrink-0"><Icon d={item.urgent ? ICONS.alertTriangle : ICONS.pin} size={15} /></span>
                <div>
                  <p className="font-semibold text-[var(--ink)] text-sm">{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--ink-faint)" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <Link to="/visa-guide" className="text-sm font-medium hover:underline" style={{ color: "var(--accent-light)" }}>
            ← View all country guides
          </Link>
        </div>
      </div>
    </div>
  );
};

/* ── Root component — fetches profile then renders ────────────────────────── */
const VisaGuide = () => {
  const { country } = useParams();
  const [nationality, setNationality] = useState(null);

  useEffect(() => {
    api.get("/profiles/me").then(r => {
      setNationality(r.data?.nationality || null);
    }).catch(() => {});
  }, []);

  if (country) return <VisaGuideDetail countryKey={country} nationality={nationality} />;
  return <VisaGuideHub nationality={nationality} />;
};

export default VisaGuide;
