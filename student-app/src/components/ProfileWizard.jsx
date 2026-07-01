import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

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

const CountryDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = NATIONALITIES.filter((n) =>
    n.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${
          value ? "border-gray-200 bg-gray-50 text-gray-900" : "border-gray-200 bg-gray-50 text-gray-400"
        }`}
      >
        <span>{value || "e.g. Egyptian, Syrian, Iraqi…"}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              placeholder="Search nationality…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-sm text-gray-400">No results</li>
            ) : filtered.map((n) => (
              <li
                key={n}
                onClick={() => { onChange(n); setOpen(false); setSearch(""); }}
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 ${
                  value === n ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700"
                }`}
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

const EUROPEAN_COUNTRIES = [
  "Germany", "Poland", "France", "Netherlands", "Sweden", "Czech Republic",
  "Austria", "Belgium", "Denmark", "Finland", "Hungary", "Italy",
  "Norway", "Portugal", "Romania", "Spain", "Switzerland", "Ireland",
  "Greece", "Slovakia", "Estonia", "Latvia", "Lithuania", "Luxembourg",
];

const DEGREE_OPTIONS = [
  { value: "bachelor", label: "Bachelor's" },
  { value: "master",   label: "Master's"  },
  { value: "phd",      label: "PhD"       },
];

const ENGLISH_LEVELS = ["a1","a2","b1","b2","c1","c2","native"];

const LANGUAGE_OPTIONS = [
  { value: "english", label: "English", color: "from-rose-500 to-pink-500",   emoji: "🇬🇧" },
  { value: "german",  label: "German",  color: "from-amber-500 to-orange-500", emoji: "🇩🇪" },
  { value: "polish",  label: "Polish",  color: "from-emerald-500 to-teal-500", emoji: "🇵🇱" },
];

const STEPS = [
  { title: "Academic Background",  icon: "🎓", color: "from-blue-500 to-cyan-500"      },
  { title: "Budget & English",     icon: "💰", color: "from-cyan-500 to-teal-500"      },
  { title: "Language & Countries", icon: "🌍", color: "from-teal-500 to-emerald-500"   },
];

const initialForm = {
  nationality:        "",
  phone_number:       "",
  degree_level:       "",
  gpa:                "",
  field_of_study:     "",
  budget_eur:         "",
  english_level:      "",
  language:           "",
  preferred_countries: [],
};

const ProfileWizard = () => {
  const { closeProfileWizard, user } = useAuth();
  const [step,    setStep]    = useState(0);
  const [form,    setForm]    = useState(initialForm);
  const [fading,  setFading]  = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const toggleCountry = (c) => {
    setForm(f => ({
      ...f,
      preferred_countries: f.preferred_countries.includes(c)
        ? f.preferred_countries.filter(x => x !== c)
        : [...f.preferred_countries, c],
    }));
  };

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.degree_level)                     e.degree_level = "Required";
      if (form.gpa === "" || isNaN(Number(form.gpa))) e.gpa = "Enter a number (0–4.0)";
      else if (Number(form.gpa) < 0 || Number(form.gpa) > 4) e.gpa = "Must be 0–4.0";
    }
    if (step === 1) {
      if (!form.budget_eur || isNaN(Number(form.budget_eur))) e.budget_eur = "Enter a number";
      if (!form.english_level)                    e.english_level = "Required";
    }
    if (step === 2) {
      if (!form.language) e.language = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goTo = (next) => {
    setFading(true);
    setTimeout(() => { setStep(next); setFading(false); }, 180);
  };

  const handleNext = () => {
    if (!validate()) return;
    if (step < STEPS.length - 1) { goTo(step + 1); return; }
    submit();
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        nationality:         form.nationality.trim(),
        degree_level:        form.degree_level,
        gpa:                 Number(form.gpa),
        budget_eur:          Number(form.budget_eur),
        english_level:       form.english_level,
        language:            form.language,
        preferred_countries: form.preferred_countries.join(","),
        field_of_study:      form.field_of_study.trim() || undefined,
        phone_number:        form.phone_number.trim()   || undefined,
      };
      await api.post("/profiles", payload);
      toast.success("Profile created! Welcome aboard 🎉");
      closeProfileWizard();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const pct   = Math.round(((step + 1) / STEPS.length) * 100);
  const cur   = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{
        background: "rgba(15,23,42,0.80)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        className="relative w-full max-w-lg"
        style={{
          opacity:    fading ? 0 : 1,
          transform:  fading ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.18s ease, transform 0.18s ease",
        }}
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-br ${cur.color} px-8 pt-8 pb-6 text-white`}>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-4xl">{cur.icon}</span>
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
                  Step {step + 1} of {STEPS.length}
                </p>
                <h2 className="text-xl font-extrabold">{cur.title}</h2>
              </div>
            </div>
            {/* Progress */}
            <div className="mt-4 h-1.5 bg-white/25 rounded-full overflow-hidden">
              <div
                className="h-1.5 bg-white rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-6 space-y-4">
            {step === 0 && <StepAcademic    form={form} set={set} errors={errors} />}
            {step === 1 && <StepBudget      form={form} set={set} errors={errors} />}
            {step === 2 && <StepLanguage    form={form} set={set} errors={errors} toggleCountry={toggleCountry} />}
          </div>

          {/* Footer */}
          <div className="px-8 pb-7 flex items-center justify-between gap-3">
            <button
              onClick={closeProfileWizard}
              className="text-sm text-gray-400 hover:text-gray-600 transition font-medium"
            >
              Skip for now
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={() => goTo(step - 1)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold shadow hover:shadow-md hover:opacity-90 transition disabled:opacity-60"
              >
                {saving ? "Saving…" : isLast ? "Finish Setup" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Step components ──────────────────────────────── */

const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const inputCls = (err) =>
  `w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${
    err ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50 focus:bg-white"
  }`;

const StepPersonal = ({ form, set, errors, user }) => (
  <>
    {/* Email (readonly) */}
    <Field label="Email">
      <div className="relative">
        <input
          type="email"
          readOnly
          value={user?.email || ""}
          className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-2.5 text-sm text-gray-500 cursor-not-allowed pr-24"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
          Account
        </span>
      </div>
      <p className="mt-1 text-xs text-gray-400">Your account email — cannot be changed here.</p>
    </Field>

    {/* Nationality */}
    <Field label="Nationality *" error={errors.nationality}>
      <CountryDropdown
        value={form.nationality}
        onChange={(v) => set("nationality", v)}
      />
    </Field>

    {/* Phone */}
    <Field label="Phone Number (optional)" error={errors.phone_number}>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">📞</span>
        <input
          className={`${inputCls(false)} pl-9`}
          type="tel"
          placeholder="+1 234 567 890"
          value={form.phone_number}
          onChange={e => set("phone_number", e.target.value)}
        />
      </div>
      <p className="mt-1 text-xs text-gray-400">Optional — used to help universities contact you.</p>
    </Field>
  </>
);

const StepAcademic = ({ form, set, errors }) => (
  <>
    <Field label="Degree Level *" error={errors.degree_level}>
      <div className="grid grid-cols-3 gap-2">
        {DEGREE_OPTIONS.map(d => (
          <button
            key={d.value}
            type="button"
            onClick={() => set("degree_level", d.value)}
            className={`py-2.5 rounded-xl text-sm font-semibold border transition ${
              form.degree_level === d.value
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
      {errors.degree_level && <p className="text-xs text-red-500 mt-1">{errors.degree_level}</p>}
    </Field>
    <Field label="GPA (0 – 4.0) *" error={errors.gpa}>
      <input
        className={inputCls(errors.gpa)}
        type="number"
        min="0" max="4" step="0.01"
        placeholder="e.g. 3.5"
        value={form.gpa}
        onChange={e => set("gpa", e.target.value)}
      />
    </Field>
    <Field label="Field of Study (optional)" error={errors.field_of_study}>
      <input
        className={inputCls(false)}
        placeholder="e.g. Computer Science, Medicine…"
        value={form.field_of_study}
        onChange={e => set("field_of_study", e.target.value)}
      />
    </Field>
  </>
);

const StepBudget = ({ form, set, errors }) => (
  <>
    <Field label="Annual Budget (€ / year) *" error={errors.budget_eur}>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">€</span>
        <input
          className={`${inputCls(errors.budget_eur)} pl-8`}
          type="number" min="0"
          placeholder="e.g. 8000"
          value={form.budget_eur}
          onChange={e => set("budget_eur", e.target.value)}
        />
      </div>
    </Field>
    <Field label="English Level *" error={errors.english_level}>
      <div className="grid grid-cols-4 gap-2">
        {ENGLISH_LEVELS.map(lvl => (
          <button
            key={lvl}
            type="button"
            onClick={() => set("english_level", lvl)}
            className={`py-2 rounded-xl text-sm font-semibold border uppercase transition ${
              form.english_level === lvl
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300"
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>
      {errors.english_level && <p className="text-xs text-red-500 mt-1">{errors.english_level}</p>}
    </Field>
  </>
);

const StepLanguage = ({ form, set, errors, toggleCountry }) => (
  <>
    <Field label="Target Study Language *" error={errors.language}>
      <div className="grid grid-cols-3 gap-2">
        {LANGUAGE_OPTIONS.map(l => (
          <button
            key={l.value}
            type="button"
            onClick={() => set("language", l.value)}
            className={`py-3 rounded-xl text-sm font-semibold border flex flex-col items-center gap-1 transition ${
              form.language === l.value
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300"
            }`}
          >
            <span className="text-lg">{l.emoji}</span>
            {l.label}
          </button>
        ))}
      </div>
    </Field>
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Preferred Countries <span className="text-gray-400 font-normal">(select any)</span>
      </label>
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
        {EUROPEAN_COUNTRIES.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => toggleCountry(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              form.preferred_countries.includes(c)
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  </>
);

export default ProfileWizard;
