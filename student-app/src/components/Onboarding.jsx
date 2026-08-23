import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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

/* ── helpers — every visual reuses UniPath's real design tokens
   (var(--surface), var(--border), var(--accent), var(--ink)…) and the
   global .input / .btn / .card rules from index.css. Nothing here is a
   one-off color. ── */
const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-eyebrow">{label}</label>
    {children}
  </div>
);

const Input = ({ label, type = "text", value, onChange, placeholder, min, max, step }) => (
  <Field label={label}>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} min={min} max={max} step={step}
    />
  </Field>
);

const Select = ({ label, value, onChange, options }) => (
  <Field label={label}>
    <select value={value} onChange={e => onChange(e.target.value)}>
      <option value="">Select…</option>
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  </Field>
);

const CountryChip = ({ country, selected, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(country)}
    className="px-3.5 py-2 rounded-full text-sm font-semibold border transition-all"
    style={{
      background: selected ? "var(--accent)" : "var(--surface)",
      color: selected ? "var(--on-accent)" : "var(--ink-dim)",
      borderColor: selected ? "var(--accent)" : "var(--border)",
    }}
  >
    {country}
  </button>
);

/* ── shared dropdown chrome for the two searchable pickers below ── */
const DropdownTrigger = ({ open, setOpen, value, placeholder }) => (
  <button
    type="button"
    onClick={() => setOpen(o => !o)}
    className="w-full rounded-[var(--r-md)] px-4 py-3 text-sm font-medium text-left flex items-center justify-between transition"
    style={{
      background: "var(--surface)",
      border: `1px solid ${open ? "var(--accent)" : "var(--border)"}`,
      color: value ? "var(--ink)" : "var(--ink-ghost)",
      boxShadow: open ? "0 0 0 3.5px var(--accent-ring)" : "none",
    }}
  >
    <span className="truncate">{value || placeholder}</span>
    <svg className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
         style={{ color: "var(--ink-faint)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
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
      <label className="text-eyebrow mb-1.5 block">Your Nationality</label>
      <DropdownTrigger open={open} setOpen={setOpen} value={value} placeholder="e.g. Egyptian, Moroccan, Algerian…" />
      {open && (
        <div className="dropdown-panel absolute z-50 mt-1 w-full overflow-hidden">
          <ul className="max-h-52 overflow-y-auto py-1">
            <li className="sticky top-0 z-10 p-2" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
              <input
                autoFocus type="text" placeholder="Search nationality…"
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </li>
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-sm" style={{ color: "var(--ink-faint)" }}>No results</li>
            ) : filtered.map(n => (
              <li key={n}
                onClick={() => { onChange(n); setOpen(false); setSearch(""); }}
                className="px-4 py-2 text-sm cursor-pointer transition"
                style={{
                  color: value === n ? "var(--accent-active)" : "var(--ink-dim)",
                  background: value === n ? "var(--accent-subtle)" : "transparent",
                  fontWeight: value === n ? 600 : 400,
                }}
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
      <label className="text-eyebrow mb-1.5 block">Field of Study</label>
      <DropdownTrigger open={open} setOpen={setOpen} value={value} placeholder="Select your field of study" />
      {open && (
        <div className="dropdown-panel absolute z-50 mt-1 w-full overflow-hidden">
          <ul className="max-h-64 overflow-y-auto py-1">
            <li className="sticky top-0 z-10 p-2" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
              <input
                autoFocus type="text" placeholder="Search field…"
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </li>
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-sm" style={{ color: "var(--ink-faint)" }}>No results</li>
            ) : filtered.map(g => (
              <li key={g.category}>
                <div className="px-4 pt-2.5 pb-1 text-eyebrow" style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  {g.category}
                </div>
                {g.fields.map(f => (
                  <button
                    key={f} type="button"
                    onClick={() => { onChange(f); setOpen(false); setSearch(""); }}
                    className="w-full text-left px-5 py-2 text-sm transition"
                    style={{
                      color: value === f ? "var(--accent-active)" : "var(--ink-dim)",
                      background: value === f ? "var(--accent-subtle)" : "transparent",
                      fontWeight: value === f ? 600 : 400,
                    }}
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
  <div className="card flex items-start gap-3 p-4" style={{ borderColor: "var(--border)" }}>
    <div className="w-10 h-10 rounded-[var(--r-md)] flex items-center justify-center shrink-0"
         style={{ background: "var(--accent-subtle)", color: "var(--accent-active)" }}>
      <Icon d={ICONS.universities} size={18} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold truncate" style={{ color: "var(--ink)" }}>{uni.name}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--ink-faint)" }}>
        {uni.country} {uni.tuition_fee_eur != null ? `· €${uni.tuition_fee_eur?.toLocaleString()}/yr` : ""}
      </p>
      {uni.match_reason && (
        <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--accent-active)" }}>
          {uni.match_reason}
        </p>
      )}
    </div>
    <button
      type="button"
      onClick={() => onSave(uni)}
      className="shrink-0 w-8 h-8 rounded-[var(--r-md)] flex items-center justify-center transition-all"
      style={{
        background: saved ? "var(--accent)" : "var(--surface-2)",
        color: saved ? "var(--on-accent)" : "var(--ink-faint)",
      }}
      aria-label={saved ? "Saved to favourites" : "Save to favourites"}
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

  const [step, setStep] = useState(0); // 0=welcome, 1=about, 2=goals, 3=results
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

  /* ── step order is intentional: a pure "what can UniPath do for you"
     welcome step comes FIRST (no data asked yet), then the actual
     profile questions, so "what is this product" and "what do you need
     to know about me" never blur together. ── */
  const STEPS = ["Welcome", "About You", "Your Goals", "Your Matches"];

  /* ── feature groups — mirror the real sidebar IA (Discover / Prepare /
     Apply) so the tour doubles as a map of how the product is organized.
     One neutral accent throughout, no per-category neon colors. ── */
  const FEATURE_GROUPS = [
    { title: "Discover", items: [
      { icon: ICONS.universities, label: "Universities", desc: "167 real universities in Germany, Poland & Romania" },
      { icon: ICONS.graduationCap, label: "Scholarships", desc: "Find funding you actually qualify for" },
      { icon: ICONS.sparkle, label: "AI Matches", desc: "Ranked by your GPA, budget & goals" },
      { icon: ICONS.heart, label: "Favourites", desc: "Save universities to compare later" },
    ]},
    { title: "Prepare", items: [
      { icon: ICONS.book, label: "Learning Center", desc: "Placement tests & language courses" },
      { icon: ICONS.pencil, label: "Test Simulators", desc: "TOEFL, IELTS & Cambridge practice, AI-scored" },
      { icon: ICONS.instructors, label: "Instructors", desc: "Message real language instructors" },
      { icon: ICONS.compass, label: "Visa & Cost Guides", desc: "Visa process & real living costs" },
    ]},
    { title: "Apply", items: [
      { icon: ICONS.applications, label: "Apply Hub", desc: "Document checklists & deadlines" },
      { icon: ICONS.trendingUp, label: "Pipeline", desc: "Track every application to Accepted" },
      { icon: ICONS.mail, label: "AI Letter Feedback", desc: "Get your motivation letter scored instantly" },
    ]},
  ];

  // Rendered via a portal straight into <body>: this page shell wraps every
  // route in a `.page-enter` transition div. Its CSS animation leaves a
  // residual `transform` on the element after it finishes (fill-mode
  // "both"), which silently turns `position: fixed` on any normal
  // descendant into "fixed relative to that ancestor" instead of the
  // viewport — pushing the modal far down an already-scrollable page
  // (reproduced: ~1400px off-screen on the dashboard). A portal escapes
  // that containing block entirely, same pattern already used by the
  // Community and CostOfLiving modals.
  return createPortal(
    <div
      className="app-shell modal-overlay fixed inset-0 z-[9999] flex items-center justify-center px-4 py-8"
      dir={isRTL ? "rtl" : "ltr"}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-step-title"
    >
      <div className="modal-panel w-full max-w-lg flex flex-col overflow-hidden" style={{ maxHeight: "90vh" }}>

        {/* ── header ── */}
        <div className="px-7 pt-6 pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-eyebrow mb-1" style={{ color: "var(--accent-active)" }}>
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 id="onboarding-step-title" className="text-h2" style={{ color: "var(--ink)" }}>{STEPS[step]}</h2>
            </div>
            <button onClick={handleSkip} className="btn btn-ghost btn-sm">
              Skip
            </button>
          </div>

          {/* progress */}
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
            <div className="h-1 rounded-full transition-all duration-500"
                 style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: "var(--accent)" }} />
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <span key={i} className="text-[11px] font-semibold"
                    style={{ color: i <= step ? "var(--accent-active)" : "var(--ink-ghost)" }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* ── body ── */}
        <div className="px-7 py-6 overflow-y-auto flex-1">

          {/* ═══ STEP 0 — Welcome (pure product intro, no data collected) ═══ */}
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-h3 mb-1" style={{ color: "var(--ink)" }}>Welcome to UniPath</p>
                <p className="text-sm" style={{ color: "var(--ink-dim)" }}>
                  Your complete study-abroad companion — here's how the app is organized.
                </p>
              </div>
              {FEATURE_GROUPS.map(group => (
                <div key={group.title} className="flex flex-col gap-2">
                  <p className="text-eyebrow">{group.title}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map(item => (
                      <div key={item.label} className="card p-3 flex flex-col gap-1" style={{ borderColor: "var(--border)" }}>
                        <span style={{ color: "var(--accent-active)" }}><Icon d={item.icon} size={17} /></span>
                        <span className="text-xs font-bold" style={{ color: "var(--ink)" }}>{item.label}</span>
                        <span className="text-[11px] leading-snug" style={{ color: "var(--ink-faint)" }}>{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="rounded-[var(--r-lg)] p-3 flex items-center gap-3"
                   style={{ background: "var(--accent-subtle)", border: "1px solid var(--accent)", borderOpacity: 0.25 }}>
                <span style={{ color: "var(--accent-active)" }}><Icon d={ICONS.sparkle} size={18} /></span>
                <div>
                  <p className="text-xs font-bold" style={{ color: "var(--ink)" }}>Ask the AI Chat anything, anytime</p>
                  <p className="text-[11px]" style={{ color: "var(--ink-dim)" }}>It knows your profile, deadlines & applications — and can add things for you with one click.</p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 1 — About You ═══ */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm" style={{ color: "var(--ink-dim)" }}>
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
              <p className="text-sm" style={{ color: "var(--ink-dim)" }}>
                Where do you want to go?
              </p>

              <div className="flex flex-col gap-2">
                <label className="text-eyebrow">
                  Target Countries <span style={{ color: "var(--accent-active)", textTransform: "none", letterSpacing: "normal", fontWeight: 500 }}>(select all that apply)</span>
                </label>
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
                    <span style={{ color: "var(--accent-active)" }}><Icon d={ICONS.target} size={17} /></span>
                    <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>Your top {matches.length} university matches</p>
                  </div>
                  <p className="text-xs mb-2" style={{ color: "var(--ink-faint)" }}>
                    Based on your profile. Save the ones you like — they'll appear in your favourites.
                  </p>
                  {matches.map(uni => (
                    <UniCard key={uni.id} uni={uni} onSave={handleSave} saved={!!saved[uni.id]} />
                  ))}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-3" style={{ color: "var(--accent-active)" }}><Icon d={ICONS.graduationCap} size={36} /></div>
                  <p className="font-bold mb-1" style={{ color: "var(--ink)" }}>You're all set!</p>
                  <p className="text-sm" style={{ color: "var(--ink-dim)" }}>
                    Browse universities and get AI recommendations from your dashboard.
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs mt-3 text-center" style={{ color: "var(--danger)" }}>{error}</p>
          )}
        </div>

        {/* ── footer ── */}
        <div className="px-7 py-5" style={{ borderTop: "1px solid var(--border)" }}>
          {step === 0 && (
            <button onClick={() => setStep(1)} className="btn btn-primary btn-lg w-full">
              Get Started →
            </button>
          )}

          {step === 1 && (
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="btn btn-secondary btn-lg">
                ← Back
              </button>
              <button onClick={() => setStep(2)} disabled={!step1Valid} className="btn btn-primary btn-lg flex-1">
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn btn-secondary btn-lg">
                ← Back
              </button>
              <button onClick={handleSubmit} disabled={loading || !step2Valid} className="btn btn-primary btn-lg flex-1">
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
            <button onClick={handleFinish} className="btn btn-primary btn-lg w-full">
              Go to My Dashboard →
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Onboarding;
