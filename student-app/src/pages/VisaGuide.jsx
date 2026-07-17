import { useParams, Link } from "react-router-dom";

const bg    = "oklch(0.13 0.018 285)";
const card  = "oklch(0.17 0.02 285)";
const dim   = "oklch(0.60 0.02 285)";
const grad  = "linear-gradient(135deg,oklch(0.62 0.24 296),oklch(0.64 0.21 264))";

/* ── Country data ─────────────────────────────────────────────────────────── */
const COUNTRIES = {
  germany: {
    name: "Germany",
    flag: "🇩🇪",
    flagSrc: "https://flagcdn.com/w80/de.png",
    accent: "#DD0000",
    visaName: "National Visa (Type D) — Student",
    intro: "Germany has one of the best higher education systems in the world, with most public universities offering free tuition. As a non-EU student you need a national visa before you can enter and study.",
    timeline: "8–12 weeks",
    cost: "€75",
    embassy: "German Embassy or Consulate in your home country",
    steps: [
      {
        number: "1",
        title: "Get Admission Letter",
        desc: "You must have an official admission letter (Zulassungsbescheid) from a German university before applying for the visa. Conditional admission is usually not accepted.",
      },
      {
        number: "2",
        title: "Open a Blocked Account (Sperrkonto)",
        desc: "You must prove you can support yourself financially. Open a blocked account with at least €11,208 (€934/month × 12). Recommended providers: Fintiba, Coracle, or Deutsche Bank. Takes 1–2 weeks.",
      },
      {
        number: "3",
        title: "Get Health Insurance",
        desc: "You need valid health insurance for Germany. Student public insurance (gesetzliche Krankenversicherung) like TK or AOK is recommended and costs ~€110/month. Get a confirmation letter before your visa appointment.",
      },
      {
        number: "4",
        title: "Book Embassy Appointment",
        desc: "Book a visa appointment at the German embassy/consulate in your country. Wait times can be 4–8 weeks — book as early as possible. Check the embassy website for the online booking system.",
      },
      {
        number: "5",
        title: "Prepare Documents",
        desc: "Gather all required documents (see checklist below). Get official translations into German or English from certified translators.",
      },
      {
        number: "6",
        title: "Attend Appointment & Pay Fee",
        desc: "Attend your appointment, submit all documents, pay the €75 visa fee, and provide biometric data (fingerprints). The processing time is typically 4–8 weeks after submission.",
      },
      {
        number: "7",
        title: "Arrive & Register (Anmeldung)",
        desc: "Within 14 days of arriving in Germany, register your address at the local citizens' office (Einwohnermeldeamt/Bürgeramt). You'll receive a registration certificate (Anmeldebestätigung) — keep it, you'll need it for everything.",
      },
      {
        number: "8",
        title: "Get Residence Permit",
        desc: "Your visa allows you to enter. Within Germany, apply for a student residence permit (Aufenthaltserlaubnis) at the local Foreigners' Office (Ausländerbehörde). Bring your registration certificate, enrollment confirmation, and insurance.",
      },
    ],
    documents: [
      { name: "Valid passport (valid for at least 6 months beyond intended stay)", required: true },
      { name: "Completed visa application form (2 copies)", required: true },
      { name: "2 biometric passport photos (35×45mm, white background)", required: true },
      { name: "University admission letter (Zulassungsbescheid)", required: true },
      { name: "Blocked account proof (Sperrkonto) — minimum €11,208", required: true },
      { name: "Health insurance confirmation for Germany", required: true },
      { name: "High school diploma + certified German/English translation", required: true },
      { name: "University degree transcripts + translation", required: true },
      { name: "German language certificate (if studying in German: TestDaF/DSH)", required: false },
      { name: "English language certificate (IELTS/TOEFL — if studying in English)", required: false },
      { name: "APS certificate (mandatory if from China, Vietnam, India, Mongolia)", required: false },
      { name: "Motivational letter (optional but recommended)", required: false },
      { name: "CV / Resume", required: false },
    ],
    costs: [
      { item: "Visa fee", amount: "€75" },
      { item: "Blocked account (Sperrkonto)", amount: "€11,208 (held, returned to you)" },
      { item: "Health insurance (monthly)", amount: "~€110/month" },
      { item: "Document translation", amount: "€30–100 per document" },
      { item: "APS certificate (if applicable)", amount: "€200" },
      { item: "Residence permit (in Germany)", amount: "€100" },
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
    flagSrc: "https://flagcdn.com/w80/pl.png",
    accent: "#DC143C",
    visaName: "National Visa (Type D) — Student",
    intro: "Poland is one of the most affordable study destinations in Europe with good quality universities. The visa process is simpler than Germany's, but has specific requirements for Arabic-speaking students including diploma recognition through NAWA SYRENA.",
    timeline: "4–8 weeks",
    cost: "€80",
    embassy: "Polish Embassy or Consulate in your home country",
    steps: [
      {
        number: "1",
        title: "Get Admission Letter",
        desc: "Apply to a Polish university and receive an official acceptance letter. Many Polish universities have English-taught programs and accept international students year-round.",
      },
      {
        number: "2",
        title: "NAWA SYRENA — Diploma Recognition",
        desc: "MANDATORY since July 1, 2025. You must get your secondary education (high school) diploma recognized through the NAWA SYRENA system. This takes 30–60 days — start immediately. Apply at syrena.nawa.gov.pl. Fee: ~€50.",
      },
      {
        number: "3",
        title: "Prove Financial Means",
        desc: "You must show you have enough money to support yourself. Required: at least 776 PLN/month (~€180) or equivalent. A bank statement showing sufficient funds is usually acceptable.",
      },
      {
        number: "4",
        title: "Get Health Insurance",
        desc: "You need health insurance valid in Poland. The National Health Fund (NFZ) offers student insurance for ~€30/month once you're enrolled. For the visa, travel insurance (€0.3/day minimum coverage €30,000) is sufficient.",
      },
      {
        number: "5",
        title: "Book Embassy Appointment & Apply",
        desc: "Book an appointment at the Polish embassy/consulate. Submit all documents and pay the €80 fee. Processing takes 2–4 weeks.",
      },
      {
        number: "6",
        title: "Arrive & Register",
        desc: "Register your stay at the local voivodeship office (Urząd Wojewódzki) within 30 days of arrival. Apply for a temporary residence card (karta pobytu) for the duration of your studies.",
      },
    ],
    documents: [
      { name: "Valid passport (valid 3+ months beyond visa end date)", required: true },
      { name: "Completed visa application form", required: true },
      { name: "2 passport photos (35×45mm)", required: true },
      { name: "University acceptance letter", required: true },
      { name: "NAWA SYRENA diploma recognition certificate", required: true },
      { name: "High school diploma + sworn Polish/English translation", required: true },
      { name: "Bank statement showing financial means (min. 776 PLN/month)", required: true },
      { name: "Health/travel insurance (min. €30,000 coverage)", required: true },
      { name: "Proof of accommodation in Poland (rental contract or university dorm confirmation)", required: true },
      { name: "English language certificate (if studying in English)", required: false },
      { name: "Polish language certificate (if studying in Polish)", required: false },
      { name: "CV and motivational letter", required: false },
    ],
    costs: [
      { item: "Visa fee", amount: "€80" },
      { item: "NAWA SYRENA diploma recognition", amount: "~€50" },
      { item: "Sworn document translation (per document)", amount: "€30–80" },
      { item: "Health insurance (travel, for visa)", amount: "~€30–50" },
      { item: "Student NFZ insurance (monthly, after enrollment)", amount: "~€30/month" },
      { item: "Temporary residence card (karta pobytu)", amount: "~€35" },
    ],
    tips: [
      "Start the NAWA SYRENA process immediately — it takes 30–60 days and is mandatory. Don't wait until you have your admission letter.",
      "Sworn translations (tłumaczenie przysięgłe) must be done by a certified Polish sworn translator — regular translators are not accepted.",
      "Polish universities are very international-friendly. Many have dedicated offices for foreign students that can help with paperwork.",
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

};

/* ── Hub page ─────────────────────────────────────────────────────────────── */
const VisaGuideHub = () => (
  <div className="min-h-screen" style={{ background: bg, color: "oklch(0.96 0.006 285)" }}>
    <div className="relative overflow-hidden text-white py-16 px-8 text-center"
         style={{ background: "linear-gradient(135deg, oklch(0.14 0.04 285), oklch(0.18 0.06 250))" }}>
      <div className="text-6xl mb-4">🛂</div>
      <h1 className="text-4xl font-bold mb-3">Student Visa Guide</h1>
      <p className="text-lg max-w-xl mx-auto" style={{ color: "oklch(0.75 0.04 285)" }}>
        Step-by-step visa guides for Arab students studying in Europe. Written in plain language — no confusing bureaucratic terms.
      </p>
    </div>

    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {Object.entries(COUNTRIES).map(([key, c]) => (
          <Link key={key} to={`/visa-guide/${key}`}
            className="group rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
            style={{ background: card, border: "1px solid oklch(1 0 0 / 0.08)" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${c.accent}55`}
            onMouseLeave={e => e.currentTarget.style.borderColor = "oklch(1 0 0 / 0.08)"}>
            <div className="h-2" style={{ background: c.accent }} />
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{c.flag}</span>
                <div>
                  <h2 className="text-xl font-bold text-white">{c.name}</h2>
                  <p className="text-xs mt-0.5" style={{ color: dim }}>{c.visaName}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "oklch(0.65 0.02 285)" }}>
                {c.intro.slice(0, 120)}...
              </p>
              <div className="flex items-center gap-4 text-xs">
                <span className="px-2.5 py-1 rounded-full font-medium" style={{ background: `${c.accent}20`, color: c.accent }}>
                  ⏱ {c.timeline}
                </span>
                <span className="px-2.5 py-1 rounded-full font-medium" style={{ background: "oklch(0.55 0.22 296 / 0.15)", color: "oklch(0.80 0.14 296)" }}>
                  Fee: {c.cost}
                </span>
              </div>
              <div className="mt-4 text-sm font-semibold group-hover:underline" style={{ color: c.accent }}>
                Read full guide →
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* General tips */}
      <div className="mt-12 rounded-2xl p-6" style={{ background: "oklch(0.17 0.02 285)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
        <h3 className="text-lg font-bold text-white mb-4">💡 General Tips for All Arab Students</h3>
        <ul className="space-y-3">
          {[
            "Start your visa application at least 4–5 months before your intended start date — embassy appointments fill up fast.",
            "Get all documents officially translated by a certified/sworn translator — not just any translation service.",
            "Join Facebook groups and WhatsApp groups of Arab students in your target city before you arrive — they are your best resource.",
            "Keep digital copies of ALL documents in Google Drive or iCloud. You will need them repeatedly.",
            "Your passport must be valid for at least 6 months beyond your intended stay. Renew it early if needed.",
            "Never overstay your visa. If you need an extension, apply at least 3 months before it expires.",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-3 text-sm" style={{ color: "oklch(0.72 0.02 285)" }}>
              <span className="text-green-400 shrink-0 mt-0.5">✓</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

/* ── Detail page ──────────────────────────────────────────────────────────── */
const VisaGuideDetail = ({ countryKey }) => {
  const c = COUNTRIES[countryKey];
  if (!c) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="text-center">
        <p className="text-white text-xl mb-4">Country not found</p>
        <Link to="/visa-guide" className="text-sm" style={{ color: "oklch(0.75 0.14 296)" }}>← Back to Visa Guide</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: bg, color: "oklch(0.96 0.006 285)" }}>
      {/* Hero */}
      <div className="relative overflow-hidden text-white py-14 px-8"
           style={{ background: `linear-gradient(135deg, ${c.accent}cc, ${c.accent}66)` }}>
        <Link to="/visa-guide" className="inline-flex items-center gap-2 text-sm mb-6 opacity-80 hover:opacity-100">
          ← All Countries
        </Link>
        <div className="flex items-center gap-5">
          <span className="text-6xl">{c.flag}</span>
          <div>
            <h1 className="text-4xl font-bold">{c.name} Student Visa</h1>
            <p className="text-lg mt-1 opacity-80">{c.visaName}</p>
          </div>
        </div>
        <div className="flex gap-4 mt-6 flex-wrap">
          <div className="px-4 py-2 rounded-xl text-sm font-medium bg-white/15">⏱ Processing: {c.timeline}</div>
          <div className="px-4 py-2 rounded-xl text-sm font-medium bg-white/15">💶 Fee: {c.cost}</div>
          <div className="px-4 py-2 rounded-xl text-sm font-medium bg-white/15">🏛️ {c.embassy}</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Intro */}
        <div className="rounded-2xl p-6" style={{ background: "oklch(0.17 0.02 285)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
          <p className="text-sm leading-relaxed" style={{ color: "oklch(0.75 0.02 285)" }}>{c.intro}</p>
        </div>

        {/* Steps */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">📋 Step-by-Step Process</h2>
          <div className="space-y-4">
            {c.steps.map((step) => (
              <div key={step.number} className="flex gap-4 rounded-2xl p-5" style={{ background: "oklch(0.17 0.02 285)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
                <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-white font-bold text-sm"
                     style={{ background: c.accent }}>{step.number}</div>
                <div>
                  <h3 className="font-bold text-white mb-1">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "oklch(0.68 0.02 285)" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document checklist */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">📄 Document Checklist</h2>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(1 0 0 / 0.08)" }}>
            {c.documents.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 text-sm"
                   style={{ background: i % 2 === 0 ? "oklch(0.17 0.02 285)" : "oklch(0.155 0.018 285)", borderBottom: i < c.documents.length - 1 ? "1px solid oklch(1 0 0 / 0.06)" : "none" }}>
                <span style={{ color: doc.required ? "#ef4444" : "oklch(0.55 0.18 158)" }}>
                  {doc.required ? "🔴" : "🟢"}
                </span>
                <span style={{ color: "oklch(0.75 0.02 285)" }}>{doc.name}</span>
                <span className="ms-auto text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: doc.required ? "oklch(0.55 0.18 25 / 0.15)" : "oklch(0.55 0.18 158 / 0.12)", color: doc.required ? "oklch(0.75 0.18 25)" : "oklch(0.65 0.18 158)" }}>
                  {doc.required ? "Required" : "Optional"}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: dim }}>🔴 Required &nbsp;|&nbsp; 🟢 Optional but recommended</p>
        </div>

        {/* Costs */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">💶 Cost Breakdown</h2>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(1 0 0 / 0.08)" }}>
            {c.costs.map((cost, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 text-sm"
                   style={{ background: i % 2 === 0 ? "oklch(0.17 0.02 285)" : "oklch(0.155 0.018 285)", borderBottom: i < c.costs.length - 1 ? "1px solid oklch(1 0 0 / 0.06)" : "none" }}>
                <span style={{ color: "oklch(0.75 0.02 285)" }}>{cost.item}</span>
                <span className="font-bold" style={{ color: "oklch(0.80 0.14 296)" }}>{cost.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">💡 Tips for Arab Students</h2>
          <div className="space-y-3">
            {c.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl p-4 text-sm"
                   style={{ background: "oklch(0.17 0.02 285)", border: "1px solid oklch(1 0 0 / 0.07)" }}>
                <span className="text-yellow-400 shrink-0">💡</span>
                <span style={{ color: "oklch(0.72 0.02 285)" }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* After arrival */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">✈️ First Week After Arrival</h2>
          <div className="space-y-3">
            {c.afterArrival.map((item, i) => (
              <div key={i} className="flex items-start gap-4 rounded-xl p-4"
                   style={{ background: item.urgent ? `${c.accent}12` : "oklch(0.17 0.02 285)", border: `1px solid ${item.urgent ? `${c.accent}30` : "oklch(1 0 0 / 0.07)"}` }}>
                <span className="text-lg shrink-0">{item.urgent ? "🚨" : "📌"}</span>
                <div>
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "oklch(0.60 0.02 285)" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back link */}
        <div className="pt-4 border-t" style={{ borderColor: "oklch(1 0 0 / 0.08)" }}>
          <Link to="/visa-guide" className="text-sm font-medium hover:underline" style={{ color: "oklch(0.75 0.14 296)" }}>
            ← View all country guides
          </Link>
        </div>
      </div>
    </div>
  );
};

/* ── Router wrapper ───────────────────────────────────────────────────────── */
const VisaGuide = () => {
  const { country } = useParams();
  if (country) return <VisaGuideDetail countryKey={country} />;
  return <VisaGuideHub />;
};

export default VisaGuide;
