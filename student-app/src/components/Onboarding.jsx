import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import { Icon, ICONS } from "./Sidebar";

/* ── constants ── */
const COUNTRIES = ["Germany", "Poland", "Romania"];

const NATIONALITIES = [
  "Afghan","Albanian","Algerian","American","Andorran","Angolan","Argentine",
  "Armenian","Australian","Austrian","Azerbaijani","Bahraini","Bangladeshi",
  "Belarusian","Belgian","Bolivian","Bosnian","Brazilian","British","Bulgarian",
  "Cambodian","Cameroonian","Canadian","Chilean","Chinese","Colombian","Congolese",
  "Croatian","Cuban","Czech","Danish","Dominican","Dutch","Ecuadorian","Egyptian",
  "Emirati","Estonian","Ethiopian","Filipino","Finnish","French","Georgian",
  "German","Ghanaian","Greek","Guatemalan","Haitian","Honduran","Hungarian",
  "Indian","Indonesian","Iranian","Iraqi","Irish","Israeli","Italian","Ivorian",
  "Jamaican","Japanese","Jordanian","Kazakhstani","Kenyan","Korean","Kuwaiti",
  "Kyrgyz","Laotian","Latvian","Lebanese","Libyan","Lithuanian","Luxembourgish",
  "Macedonian","Malaysian","Malian","Maltese","Mauritanian","Mexican","Moldovan",
  "Mongolian","Moroccan","Mozambican","Namibian","Nepalese","New Zealander",
  "Nicaraguan","Nigerian","Norwegian","Omani","Pakistani","Palestinian","Panamanian",
  "Paraguayan","Peruvian","Polish","Portuguese","Qatari","Romanian","Russian",
  "Rwandan","Saudi","Senegalese","Serbian","Singaporean","Slovak","Slovenian",
  "Somali","South African","Spanish","Sri Lankan","Sudanese","Swedish","Swiss",
  "Syrian","Taiwanese","Tajik","Tanzanian","Thai","Tunisian","Turkish","Ugandan",
  "Ukrainian","Uruguayan","Uzbek","Venezuelan","Vietnamese","Yemeni","Zambian","Zimbabwean",
];

const FIELDS_OF_STUDY_GROUPED = [
  { category: "Computer Science", fields: [
    "Computer Science", "Software Engineering", "Information Technology",
    "Artificial Intelligence", "Cybersecurity", "Data Science",
    "Computer Engineering", "Information Systems",
  ]},
  { category: "Engineering", fields: [
    "Mechanical Engineering", "Electrical Engineering", "Civil Engineering",
    "Chemical Engineering", "Industrial Engineering", "Mechatronics",
    "Aerospace Engineering", "Environmental Engineering", "Biomedical Engineering",
  ]},
  { category: "Business", fields: [
    "Business Administration", "Economics", "Finance", "Accounting",
    "Marketing", "International Business", "Management",
  ]},
  { category: "Health", fields: ["Medicine", "Pharmacy", "Dentistry", "Nursing", "Public Health"] },
  { category: "Natural Sciences", fields: ["Mathematics", "Physics", "Chemistry", "Biology", "Biotechnology"] },
  { category: "Arts & Social Sciences", fields: [
    "Architecture", "Law", "Psychology", "Political Science",
    "International Relations", "Education", "Linguistics", "Media & Communication",
  ]},
  { category: "Other", fields: ["Other"] },
];

const DEGREE_LEVELS = [
  { value: "bachelor", label: "Bachelor's" },
  { value: "master",   label: "Master's"   },
  { value: "phd",      label: "PhD"        },
];
const ENGLISH_LEVELS = [
  { value: "a1", label: "A1 — Beginner"        },
  { value: "a2", label: "A2 — Elementary"       },
  { value: "b1", label: "B1 — Intermediate"     },
  { value: "b2", label: "B2 — Upper Intermediate" },
  { value: "c1", label: "C1 — Advanced"         },
  { value: "c2", label: "C2 — Proficient"       },
  { value: "native", label: "Native speaker"   },
];

/* ── helpers ── */
const Input = ({ label, type = "text", value, onChange, placeholder, min, max, step }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} min={min} max={max} step={step}
      className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white outline-none transition"
      style={{ background: "#1c1f2e", border: "1.5px solid #262a3d" }}
      onFocus={e => e.target.style.borderColor = "#4450d6"}
      onBlur={e => e.target.style.borderColor = "#262a3d"}
    />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">{label}</label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white outline-none transition appearance-none"
      style={{ background: "#1c1f2e", border: "1.5px solid #262a3d" }}
      onFocus={e => e.target.style.borderColor = "#4450d6"}
      onBlur={e => e.target.style.borderColor = "#262a3d"}
    >
      <option value="">Select…</option>
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  </div>
);

const CountryChip = ({ country, selected, onClick }) => (
  <button
    onClick={() => onClick(country)}
    className="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
    style={{
      background: selected ? "#4450d6" : "#1c1f2e",
      color: selected ? "#fff" : "#c3c7db",
      border: `1.5px solid ${selected ? "#4450d6" : "#262a3d"}`,
    }}
  >
    {country}
  </button>
);

/* ── searchable nationality dropdown ── */
const NationalityDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = NATIONALITIES.filter(n => n.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <label className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-1.5 block">Your Nationality</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full rounded-xl px-4 py-3 text-sm font-medium text-left flex items-center justify-between outline-none transition"
        style={{ background: "#1c1f2e", border: `1.5px solid ${open ? "#4450d6" : "#262a3d"}`, color: value ? "#fff" : "#6b7089" }}
      >
        <span>{value || "e.g. Egyptian, Moroccan, Algerian…"}</span>
        <svg className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "#6b7089" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl overflow-hidden shadow-2xl" style={{ background: "#1c1f2e", border: "1px solid #262a3d" }}>
          <ul className="max-h-52 overflow-y-auto py-1">
            <li className="sticky top-0 z-10 p-2" style={{ background: "#1c1f2e", borderBottom: "1px solid #262a3d" }}>
              <input
                autoFocus type="text" placeholder="Search nationality…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none text-white"
                style={{ background: "#20233a", border: "1px solid #262a3d" }}
              />
            </li>
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-sm" style={{ color: "#6b7089" }}>No results</li>
            ) : filtered.map(n => (
              <li key={n}
                onClick={() => { onChange(n); setOpen(false); setSearch(""); }}
                className="px-4 py-2 text-sm cursor-pointer transition"
                style={{ color: value === n ? "#7d8bff" : "#c3c7db", background: value === n ? "#20233a" : "transparent", fontWeight: value === n ? 600 : 400 }}
              >
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ── searchable grouped field-of-study dropdown ── */
const FieldOfStudyDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const query = search.toLowerCase();
  const filtered = FIELDS_OF_STUDY_GROUPED
    .map(g => ({ ...g, fields: g.fields.filter(f => f.toLowerCase().includes(query)) }))
    .filter(g => g.fields.length > 0);

  return (
    <div className="relative" ref={ref}>
      <label className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-1.5 block">Field of Study</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full rounded-xl px-4 py-3 text-sm font-medium text-left flex items-center justify-between outline-none transition"
        style={{ background: "#1c1f2e", border: `1.5px solid ${open ? "#4450d6" : "#262a3d"}`, color: value ? "#fff" : "#6b7089" }}
      >
        <span>{value || "Select your field of study"}</span>
        <svg className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "#6b7089" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl overflow-hidden shadow-2xl" style={{ background: "#1c1f2e", border: "1px solid #262a3d" }}>
          <ul className="max-h-64 overflow-y-auto py-1">
            <li className="sticky top-0 z-10 p-2" style={{ background: "#1c1f2e", borderBottom: "1px solid #262a3d" }}>
              <input
                autoFocus type="text" placeholder="Search field…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none text-white"
                style={{ background: "#20233a", border: "1px solid #262a3d" }}
              />
            </li>
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-sm" style={{ color: "#6b7089" }}>No results</li>
            ) : filtered.map(g => (
              <li key={g.category}>
                <div className="px-4 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest"
                     style={{ color: "#6b7089", background: "#171a28", borderBottom: "1px solid #262a3d" }}>
                  {g.category}
                </div>
                {g.fields.map(f => (
                  <button
                    key={f} type="button"
                    onClick={() => { onChange(f); setOpen(false); setSearch(""); }}
                    className="w-full text-left px-5 py-2 text-sm transition"
                    style={{ color: value === f ? "#7d8bff" : "#c3c7db", background: value === f ? "#20233a" : "transparent", fontWeight: value === f ? 600 : 400 }}
                  >
                    {f}
                  </button>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ── university result card ── */
const UniCard = ({ uni, onSave, saved }) => (
  <div className="flex items-start gap-3 rounded-2xl p-4 transition-all"
       style={{ background: "#1c1f2e", border: "1.5px solid #262a3d" }}>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
         style={{ background: "rgba(68,80,214,0.15)", color: "#7d8bff" }}>
      <Icon d={ICONS.universities} size={18} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-white truncate">{uni.name}</p>
      <p className="text-xs mt-0.5" style={{ color: "#9a9fb5" }}>
        {uni.country} {uni.tuition_fee_eur != null ? `· €${uni.tuition_fee_eur?.toLocaleString()}/yr` : ""}
      </p>
      {uni.match_reason && (
        <p className="text-xs mt-1 leading-relaxed" style={{ color: "#4450d6" }}>
          {uni.match_reason}
        </p>
      )}
    </div>
    <button
      onClick={() => onSave(uni)}
      className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all text-base"
      style={{
        background: saved ? "#4450d6" : "#20233a",
        color: saved ? "#000" : "#9a9fb5",
      }}
    >
      <Icon d={saved ? ICONS.check : ICONS.heart} size={15} />
    </button>
  </div>
);

/* ═══════════════════════════════════════
   Main wizard
═══════════════════════════════════════ */
const Onboarding = () => {
  const { completeOnboarding } = useAuth();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";

  const [step, setStep] = useState(0); // 0=about, 1=goals, 2=results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matches, setMatches] = useState([]);
  const [saved, setSaved] = useState({});

  /* form state */
  const [form, setForm] = useState({
    nationality: "",
    degree_level: "",
    gpa: "",
    budget_eur: "",
    field_of_study: "",
    english_level: "",
    preferred_countries: [],
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleCountry = (c) => {
    setForm(f => ({
      ...f,
      preferred_countries: f.preferred_countries.includes(c)
        ? f.preferred_countries.filter(x => x !== c)
        : [...f.preferred_countries, c],
    }));
  };

  /* step 1 validation */
  const step1Valid = form.nationality && form.degree_level && form.gpa && form.budget_eur && form.field_of_study;
  /* step 2 validation */
  const step2Valid = form.english_level && form.preferred_countries.length > 0;

  /* submit: create profile then get AI recs */
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post("/profiles", {
        nationality: form.nationality,
        degree_level: form.degree_level,
        gpa: parseFloat(form.gpa),
        budget_eur: parseInt(form.budget_eur),
        field_of_study: form.field_of_study,
        english_level: form.english_level,
        preferred_countries: form.preferred_countries.join(", "),
      });

      const rec = await api.post("/ai-recommendations");
      setMatches(rec.data.recommendations?.slice(0, 5) ?? []);
      setStep(3);
    } catch (e) {
      const msg = e.response?.data?.detail;
      if (msg?.includes("already exists") || msg?.includes("limit")) {
        setStep(3);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (uni) => {
    try {
      await api.post("/favourites", { university_id: uni.id });
      setSaved(s => ({ ...s, [uni.id]: true }));
    } catch {}
  };

  const handleFinish = () => {
    completeOnboarding();
    navigate("/dashboard");
  };

  const handleSkip = () => {
    completeOnboarding();
    navigate("/dashboard");
  };

  /* ── progress bar ──
     Order is intentional: a pure "what can UniPath do for you" welcome
     step comes FIRST (no data asked yet), then the actual profile
     questions, so the two purposes ("what is this product" vs. "what do
     you need to know about me") don't get blurred together. */
  const STEPS = ["Welcome", "About You", "Your Goals", "Your Matches"];
  const pct = ((step + 1) / 4) * 100;

  /* ── feature showcase groups (mirrors the real sidebar IA) ── */
  const FEATURE_GROUPS = [
    { title: "Discover", color: "#4450d6", items: [
      { icon: ICONS.universities, label: "Universities", desc: "Browse 167 real universities in Germany, Poland & Romania" },
      { icon: ICONS.graduationCap, label: "Scholarships", desc: "Find funding you actually qualify for" },
      { icon: ICONS.sparkle, label: "AI Matches", desc: "Personalized ranking based on your GPA, budget & goals" },
      { icon: ICONS.heart, label: "Favourites", desc: "Save universities to compare later" },
    ]},
    { title: "Prepare", color: "#2dd4bf", items: [
      { icon: ICONS.book, label: "Learning Center", desc: "Placement tests & language courses" },
      { icon: ICONS.pencil, label: "Test Simulators", desc: "Full TOEFL, IELTS & Cambridge practice exams, AI-scored" },
      { icon: ICONS.instructors, label: "Instructors", desc: "Message real language instructors" },
      { icon: ICONS.compass, label: "Visa & Cost Guides", desc: "Step-by-step visa process, real living costs" },
    ]},
    { title: "Apply", color: "#f5a623", items: [
      { icon: ICONS.applications, label: "Apply Hub", desc: "Document checklists & deadlines per university" },
      { icon: ICONS.trendingUp, label: "Pipeline", desc: "Track every application from Pending to Accepted" },
      { icon: ICONS.mail, label: "AI Letter Feedback", desc: "Get your motivation letter scored instantly" },
    ]},
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-8"
      style={{ background: "rgba(10,13,24,0.92)", backdropFilter: "blur(12px)", fontFamily: "'Manrope', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-lg flex flex-col gap-0 rounded-3xl overflow-hidden shadow-2xl"
           style={{ background: "#171a28", border: "1.5px solid #262a3d", maxHeight: "90vh" }}>

        {/* ── header ── */}
        <div className="px-8 pt-7 pb-5" style={{ borderBottom: "1px solid #262a3d" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1"
                 style={{ color: "#4450d6" }}>
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="text-xl font-extrabold text-white">{STEPS[step]}</h2>
            </div>
            <button onClick={handleSkip}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    style={{ color: "#6b7089", background: "#1c1f2e" }}>
              Skip
            </button>
          </div>

          {/* progress */}
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1c1f2e" }}>
            <div className="h-1.5 rounded-full transition-all duration-500"
                 style={{ width: `${pct}%`, background: "linear-gradient(to right, #4450d6, #7d8bff)" }} />
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <span key={i} className="text-[10px] font-semibold"
                    style={{ color: i <= step ? "#4450d6" : "#3a3e56" }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* ── body ── */}
        <div className="px-8 py-6 overflow-y-auto flex-1">

          {/* ═══ STEP 0 — Welcome (pure product intro, no data collected) ═══ */}
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <p className="text-sm" style={{ color: "#9a9fb5" }}>
                UniPath is your study-abroad companion, end to end — here's what you can do.
              </p>
              {FEATURE_GROUPS.map(group => (
                <div key={group.title} className="flex flex-col gap-2">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: group.color }}>{group.title}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map(item => (
                      <div key={item.label} className="rounded-xl p-3 flex flex-col gap-1"
                           style={{ background: "#1c1f2e", border: "1px solid #262a3d" }}>
                        <span style={{ color: group.color }}><Icon d={item.icon} size={19} /></span>
                        <span className="text-xs font-bold text-white">{item.label}</span>
                        <span className="text-[11px] leading-snug" style={{ color: "#6b7089" }}>{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "rgba(68,80,214,0.12)", border: "1px solid rgba(68,80,214,0.3)" }}>
                <span style={{ color: "#7d8bff" }}><Icon d={ICONS.sparkle} size={20} /></span>
                <div>
                  <p className="text-xs font-bold text-white">Ask the AI Chat anything, anytime</p>
                  <p className="text-[11px]" style={{ color: "#9a9fb5" }}>It knows your profile, deadlines & applications — and can add things for you with one click.</p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 1 — About You ═══ */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm" style={{ color: "#9a9fb5" }}>
                Now, tell us about yourself so we can find the best universities for you.
              </p>
              <NationalityDropdown value={form.nationality} onChange={v => set("nationality", v)} />
              <Select label="Degree You're Applying For" value={form.degree_level} onChange={v => set("degree_level", v)} options={DEGREE_LEVELS} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Your GPA (out of 4.0)" type="number" value={form.gpa} onChange={v => set("gpa", v)} placeholder="e.g. 3.2" min="0" max="4" step="0.1" />
                <Input label="Your Budget (€)" type="number" value={form.budget_eur} onChange={v => set("budget_eur", v)} placeholder="e.g. 800" min="0" />
              </div>
              <FieldOfStudyDropdown value={form.field_of_study} onChange={v => set("field_of_study", v)} />
            </div>
          )}

          {/* ═══ STEP 2 — Your Goals ═══ */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <p className="text-sm" style={{ color: "#9a9fb5" }}>
                Where do you want to go?
              </p>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Target Countries <span style={{ color: "#4450d6" }}>(select all that apply)</span></label>
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map(c => (
                    <CountryChip key={c} country={c}
                      selected={form.preferred_countries.includes(c)}
                      onClick={toggleCountry} />
                  ))}
                </div>
              </div>

              <Select label="Your English Level" value={form.english_level} onChange={v => set("english_level", v)} options={ENGLISH_LEVELS} />
            </div>
          )}

          {/* ═══ STEP 3 — Results ═══ */}
          {step === 3 && (
            <div className="flex flex-col gap-3">
              {matches.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: "#7d8bff" }}><Icon d={ICONS.target} size={19} /></span>
                    <p className="text-sm font-bold text-white">Your top {matches.length} university matches</p>
                  </div>
                  <p className="text-xs mb-2" style={{ color: "#9a9fb5" }}>
                    Based on your profile. Save the ones you like — they'll appear in your favourites.
                  </p>
                  {matches.map(uni => (
                    <UniCard key={uni.id} uni={uni} onSave={handleSave} saved={!!saved[uni.id]} />
                  ))}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-3" style={{ color: "#7d8bff" }}><Icon d={ICONS.graduationCap} size={40} /></div>
                  <p className="text-white font-bold mb-1">You're all set!</p>
                  <p className="text-sm" style={{ color: "#9a9fb5" }}>
                    Browse universities and get AI recommendations from your dashboard.
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs mt-3 text-center" style={{ color: "#ef5b5b" }}>{error}</p>
          )}
        </div>

        {/* ── footer ── */}
        <div className="px-8 py-5" style={{ borderTop: "1px solid #262a3d" }}>
          {step === 0 && (
            <button
              onClick={() => setStep(1)}
              className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all"
              style={{ background: "linear-gradient(135deg, #4450d6, #7d8bff)", color: "#fff", cursor: "pointer" }}
            >
              Get Started →
            </button>
          )}

          {step === 1 && (
            <div className="flex gap-3">
              <button onClick={() => setStep(0)}
                      className="px-5 py-3.5 rounded-2xl font-bold text-sm transition"
                      style={{ background: "#1c1f2e", color: "#c3c7db" }}>
                ← Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all"
                style={{
                  background: step1Valid ? "linear-gradient(135deg, #4450d6, #7d8bff)" : "#1c1f2e",
                  color: step1Valid ? "#fff" : "#6b7089",
                  cursor: step1Valid ? "pointer" : "not-allowed",
                }}
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                      className="px-5 py-3.5 rounded-2xl font-bold text-sm transition"
                      style={{ background: "#1c1f2e", color: "#c3c7db" }}>
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !step2Valid}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                style={{
                  background: (!loading && step2Valid) ? "linear-gradient(135deg, #4450d6, #7d8bff)" : "#1c1f2e",
                  color: (!loading && step2Valid) ? "#fff" : "#6b7089",
                  cursor: (!loading && step2Valid) ? "pointer" : "not-allowed",
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Finding your matches…
                  </>
                ) : "Find My Universities →"}
              </button>
            </div>
          )}

          {step === 3 && (
            <button
              onClick={handleFinish}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #4450d6, #7d8bff)" }}
            >
              Go to My Dashboard 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
