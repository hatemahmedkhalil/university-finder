import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import PageHero from "../components/PageHero";
import { useTranslation } from "react-i18next";

// ─── Constants ───────────────────────────────────────────────────────────────

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

const CURRENCIES = [
  { code: "EUR", label: "€ EUR", symbol: "€" },
  { code: "USD", label: "$ USD", symbol: "$" },
  { code: "GBP", label: "£ GBP", symbol: "£" },
  { code: "EGP", label: "EGP", symbol: "EGP" },
  { code: "SAR", label: "SAR", symbol: "SAR" },
  { code: "AED", label: "AED", symbol: "AED" },
  { code: "TRY", label: "₺ TRY", symbol: "₺" },
  { code: "MAD", label: "MAD", symbol: "MAD" },
  { code: "DZD", label: "DZD", symbol: "DZD" },
  { code: "LYD", label: "LYD", symbol: "LYD" },
  { code: "SYP", label: "SYP", symbol: "SYP" },
  { code: "IQD", label: "IQD", symbol: "IQD" },
];

const LANGUAGES = [
  { value: "english", label: "English", flag: "🇬🇧" },
  { value: "german",  label: "German",  flag: "🇩🇪" },
  { value: "polish",  label: "Polish",  flag: "🇵🇱" },
];

const LEVELS = ["A1","A2","B1","B2","C1","C2"];

const FIELDS_OF_STUDY_GROUPED = [
  {
    category: "Computer Science",
    fields: [
      "Computer Science", "Software Engineering", "Information Technology",
      "Artificial Intelligence", "Cybersecurity", "Data Science",
      "Computer Engineering", "Information Systems",
    ],
  },
  {
    category: "Engineering",
    fields: [
      "Mechanical Engineering", "Electrical Engineering", "Civil Engineering",
      "Chemical Engineering", "Industrial Engineering", "Mechatronics",
      "Aerospace Engineering", "Environmental Engineering", "Biomedical Engineering",
    ],
  },
  {
    category: "Business",
    fields: [
      "Business Administration", "Economics", "Finance", "Accounting",
      "Marketing", "International Business", "Management",
    ],
  },
  {
    category: "Health",
    fields: ["Medicine", "Pharmacy", "Dentistry", "Nursing", "Public Health"],
  },
  {
    category: "Natural Sciences",
    fields: ["Mathematics", "Physics", "Chemistry", "Biology", "Biotechnology"],
  },
  {
    category: "Arts & Social Sciences",
    fields: [
      "Architecture", "Law", "Psychology", "Political Science",
      "International Relations", "Education", "Linguistics", "Media & Communication",
    ],
  },
  {
    category: "Other",
    fields: ["Other"],
  },
];

// flat list kept for any backward-compat references
const FIELDS_OF_STUDY = FIELDS_OF_STUDY_GROUPED.flatMap(g => g.fields);

const DEGREE_LEVELS = [
  { value: "bachelor", label: "Bachelor's" },
  { value: "master",   label: "Master's"  },
  { value: "phd",      label: "PhD"       },
];

// ─── Searchable Country Dropdown ─────────────────────────────────────────────

const CountryDropdown = ({ value, onChange }) => {
  const { t } = useTranslation();
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
        className={`w-full border rounded-lg px-4 py-2.5 text-left flex items-center justify-between transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          value ? "border-gray-200 text-white" : "border-gray-200 text-[oklch(0.45_0.02_285)]"
        }`}
      >
        <span>{value || t("profile.selectNationality")}</span>
        <svg className={`w-4 h-4 text-[oklch(0.45_0.02_285)] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[oklch(1_0_0/0.08)] rounded-xl overflow-hidden">
          <div className="p-2 border-b border-[oklch(1_0_0/0.07)]">
            <input
              autoFocus
              type="text"
              placeholder={t("profile.searchNationality")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[oklch(1_0_0/0.08)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-sm text-[oklch(0.45_0.02_285)]">{t("profile.noResults")}</li>
            ) : filtered.map((n) => (
              <li
                key={n}
                onClick={() => { onChange(n); setOpen(false); setSearch(""); }}
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 ${
                  value === n ? "bg-blue-50 text-blue-700 font-medium" : "text-[oklch(0.75_0.02_285)]"
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

// ─── Searchable Country-of-Study Dropdown ────────────────────────────────────

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahrain","Bangladesh","Belarus","Belgium","Bolivia","Bosnia","Brazil","Bulgaria","Cambodia",
  "Cameroon","Canada","Chile","China","Colombia","Croatia","Cuba","Czech Republic","Denmark",
  "Dominican Republic","Ecuador","Egypt","Estonia","Ethiopia","Finland","France","Georgia",
  "Germany","Ghana","Greece","Guatemala","Hungary","India","Indonesia","Iran","Iraq","Ireland",
  "Israel","Italy","Japan","Jordan","Kazakhstan","Kenya","Kuwait","Kyrgyzstan","Latvia","Lebanon",
  "Libya","Lithuania","Luxembourg","Malaysia","Malta","Mexico","Moldova","Mongolia","Morocco",
  "Netherlands","New Zealand","Nigeria","Norway","Oman","Pakistan","Palestine","Panama","Peru",
  "Philippines","Poland","Portugal","Qatar","Romania","Russia","Saudi Arabia","Senegal","Serbia",
  "Singapore","Slovakia","Slovenia","Somalia","South Africa","South Korea","Spain","Sri Lanka",
  "Sudan","Sweden","Switzerland","Syria","Taiwan","Tanzania","Thailand","Tunisia","Turkey",
  "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uzbekistan",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

const CountryOfStudyDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = COUNTRIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full border rounded-lg px-4 py-2.5 text-left flex items-center justify-between transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          value ? "border-gray-200 text-white" : "border-gray-200 text-[oklch(0.45_0.02_285)]"
        }`}
      >
        <span>{value || "Select country…"}</span>
        <svg className={`w-4 h-4 text-[oklch(0.45_0.02_285)] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[oklch(1_0_0/0.08)] rounded-xl overflow-hidden">
          <div className="p-2 border-b border-[oklch(1_0_0/0.07)]">
            <input
              autoFocus
              type="text"
              placeholder="Search country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[oklch(1_0_0/0.08)] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-sm text-[oklch(0.45_0.02_285)]">No results</li>
            ) : filtered.map((c) => (
              <li
                key={c}
                onClick={() => { onChange(c); setOpen(false); setSearch(""); }}
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 ${
                  value === c ? "bg-indigo-50 text-indigo-700 font-medium" : "text-[oklch(0.75_0.02_285)]"
                }`}
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── Searchable Field-of-Study Dropdown ──────────────────────────────────────

const FieldOfStudyDropdown = ({ value, onChange }) => {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const ref                 = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const query = search.toLowerCase();
  const filtered = FIELDS_OF_STUDY_GROUPED
    .map(g => ({ ...g, fields: g.fields.filter(f => f.toLowerCase().includes(query)) }))
    .filter(g => g.fields.length > 0);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full border rounded-lg px-4 py-2.5 text-left flex items-center justify-between transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          value ? "border-gray-200 text-white" : "border-gray-200 text-[oklch(0.45_0.02_285)]"
        }`}
      >
        <span>{value || "Select your field of study"}</span>
        <svg className={`w-4 h-4 text-[oklch(0.45_0.02_285)] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[oklch(1_0_0/0.08)] rounded-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-[oklch(1_0_0/0.07)]">
            <input
              autoFocus
              type="text"
              placeholder="Search field…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[oklch(1_0_0/0.08)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-sm text-[oklch(0.45_0.02_285)]">No results</li>
            ) : filtered.map(g => (
              <li key={g.category}>
                {/* Category header */}
                <div className="px-4 pt-2.5 pb-1 text-[10px] font-bold text-[oklch(0.45_0.02_285)] uppercase tracking-widest bg-gray-50 border-b border-[oklch(1_0_0/0.07)]">
                  {g.category}
                </div>
                {g.fields.map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => { onChange(f); setOpen(false); setSearch(""); }}
                    className={`w-full text-left px-5 py-2 text-sm transition hover:bg-blue-50 hover:text-blue-700 ${
                      value === f ? "bg-blue-50 text-blue-700 font-medium" : "text-[oklch(0.75_0.02_285)]"
                    }`}
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

// ─── Language Manager ────────────────────────────────────────────────────────

const LANG_OPTIONS = [
  { value: "english", label: "English",  flag: "🇬🇧" },
  { value: "german",  label: "German",   flag: "🇩🇪" },
  { value: "polish",  label: "Polish",   flag: "🇵🇱" },
  { value: "french",  label: "French",   flag: "🇫🇷" },
  { value: "spanish", label: "Spanish",  flag: "🇪🇸" },
  { value: "italian", label: "Italian",  flag: "🇮🇹" },
  { value: "arabic",  label: "Arabic",   flag: "🇸🇦" },
  { value: "other",   label: "Other",    flag: "🌍" },
];
const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2", "native"];
const CEFR_LABEL = { A1: "Beginner", A2: "Elementary", B1: "Intermediate", B2: "Upper-Int.", C1: "Advanced", C2: "Mastery", native: "Native" };
const CEFR_COLOR = { A1: "bg-red-100 text-red-700", A2: "bg-orange-100 text-orange-700", B1: "bg-yellow-100 text-yellow-700", B2: "bg-lime-100 text-lime-700", C1: "bg-green-100 text-green-700", C2: "bg-emerald-100 text-emerald-700", native: "bg-blue-100 text-blue-700" };

const getLangMeta = (lang) => LANG_OPTIONS.find(l => l.value === lang.toLowerCase()) || { flag: "🌍", label: lang };

const LanguageManager = () => {
  const { t } = useTranslation();
  const [langs, setLangs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [addForm, setAddForm] = useState({ language: "english", level: "B1" });
  const [editLevel, setEditLevel] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/user-languages")
      .then(r => setLangs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    setSaving(true);
    try {
      const res = await api.post("/user-languages", { language: addForm.language, level: addForm.level });
      setLangs(prev => [...prev, res.data]);
      setAdding(false);
      setAddForm({ language: "english", level: "B1" });
      toast.success(t("profile.languages.added"));
    } catch (e) {
      toast.error(e?.response?.data?.detail || t("profile.languages.addFailed"));
    }
    setSaving(false);
  };

  const handleEdit = async (id) => {
    setSaving(true);
    try {
      const res = await api.patch(`/user-languages/${id}`, { level: editLevel });
      setLangs(prev => prev.map(l => l.id === id ? res.data : l));
      setEditingId(null);
      toast.success(t("profile.languages.levelUpdated"));
    } catch (e) {
      toast.error(e?.response?.data?.detail || t("profile.languages.updateFailed"));
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/user-languages/${id}`);
      setLangs(prev => prev.filter(l => l.id !== id));
      toast.success(t("profile.languages.removed"));
    } catch {
      toast.error(t("profile.languages.removeFailed"));
    }
  };

  return (
    <div className="bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white flex items-center gap-2">🗣️ {t("profile.languages.title")}</h3>
          <p className="text-xs text-[oklch(0.45_0.02_285)] mt-0.5">{t("profile.languages.subtitle")}</p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-indigo-700 transition"
          >
            + {t("profile.languages.add")}
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">{t("profile.languages.addTitle")}</p>
          <div>
            <p className="text-xs text-[oklch(0.55_0.02_285)] mb-1.5 font-medium">{t("profile.languages.languageLabel")}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LANG_OPTIONS.map(({ value, label, flag }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAddForm(f => ({ ...f, language: value }))}
                  className={`py-2 rounded-xl border text-xs font-semibold transition flex flex-col items-center gap-0.5 ${
                    addForm.language === value
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-[oklch(0.65_0.02_285)] border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  <span className="text-base">{flag}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-[oklch(0.55_0.02_285)] mb-1.5 font-medium">{t("profile.languages.proficiency")}</p>
            <div className="flex gap-2 flex-wrap">
              {CEFR.map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setAddForm(f => ({ ...f, level: l }))}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                    addForm.level === l
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-[oklch(0.65_0.02_285)] border-gray-200 hover:border-indigo-400"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {saving ? t("profile.languages.adding") : t("profile.languages.add")}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-4 py-2.5 border border-[oklch(1_0_0/0.08)] rounded-xl text-sm text-[oklch(0.65_0.02_285)] hover:bg-[oklch(0.20_0.024_285)] transition"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Language cards */}
      {loading ? (
        <div className="text-center py-4 text-[oklch(0.45_0.02_285)] text-sm">{t("common.loading")}</div>
      ) : langs.length === 0 ? (
        <div className="text-center py-6 text-[oklch(0.45_0.02_285)]">
          <div className="text-3xl mb-2">🗣️</div>
          <p className="text-sm">{t("profile.languages.empty")}</p>
          <p className="text-xs mt-1">{t("profile.languages.emptySub")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {langs.map(l => {
            const meta = getLangMeta(l.language);
            const isEditing = editingId === l.id;
            return (
              <div key={l.id} className="flex items-start gap-3 bg-[oklch(0.17_0.02_285)] rounded-xl p-4 border border-[oklch(1_0_0/0.07)]">
                <div className="text-2xl shrink-0 mt-0.5">{meta.flag}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{meta.label}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CEFR_COLOR[l.level] || "bg-gray-100 text-[oklch(0.65_0.02_285)]"}`}>
                      {l.level} · {CEFR_LABEL[l.level] || l.level}
                    </span>
                  </div>

                  {isEditing && (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-1.5 flex-wrap">
                        {CEFR.map(lvl => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setEditLevel(lvl)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition ${
                              editLevel === lvl
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-[oklch(0.65_0.02_285)] border-gray-200 hover:border-indigo-400"
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(l.id)}
                          disabled={saving}
                          className="text-xs bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                        >
                          {t("common.save")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-xs text-[oklch(0.55_0.02_285)] border border-[oklch(1_0_0/0.08)] px-3 py-1.5 rounded-lg hover:bg-[oklch(0.20_0.024_285)] transition"
                        >
                          {t("common.cancel")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setEditingId(l.id); setEditLevel(l.level); }}
                      className="text-xs text-indigo-600 border border-indigo-200 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 font-semibold transition"
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(l.id)}
                      className="text-xs text-red-500 border border-red-100 px-2.5 py-1.5 rounded-lg hover:bg-red-50 font-semibold transition"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Main Profile Page ────────────────────────────────────────────────────────

const Profile = () => {
  const navigate = useNavigate();
  const { restartOnboarding, user, markProfileComplete } = useAuth();
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [rates, setRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(true);

  const [form, setForm] = useState({
    nationality: "",
    degree_level: "bachelor",
    phone_number: "",
    gpa: "",
    budget_currency: "EUR",
    budget_input: 5000,
    language: "english",
    language_level: "b2",
    field_of_study: "",
    preferred_country: "both",
    prev_university: "",
    prev_country: "",
    prev_major: "",
    graduation_year: "",
  });

  const barWidth = useMemo(() => {
    const hasPrev = form.degree_level === "master" || form.degree_level === "phd";
    const fieldOfStudyVal = hasPrev ? form.prev_major : form.field_of_study;
    const fields = [
      form.nationality, form.gpa, form.budget_input > 0 ? form.budget_input : null,
      form.language_level, fieldOfStudyVal, form.preferred_country,
      form.language, form.degree_level,
    ];
    return Math.round(fields.filter(f => f != null && f !== "" && f !== 0).length / fields.length * 100);
  }, [form]);

  const budgetEur = (() => {
    if (form.budget_currency === "EUR") return form.budget_input;
    const rate = rates[form.budget_currency];
    if (!rate) return null;
    return Math.round(form.budget_input / rate);
  })();

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/EUR")
      .then((r) => r.json())
      .then((d) => setRates(d.rates || {}))
      .catch(() => {})
      .finally(() => setRatesLoading(false));
  }, []);

  useEffect(() => {
    api.get("/profiles/me")
      .then((res) => {
        const p = res.data;
        setProfile(p);
        const countries = p.preferred_countries?.split(",").map((c) => c.trim()).filter(Boolean) || [];
        const preferredCountry = countries.length >= 2 ? "both"
          : countries[0]?.toLowerCase() === "germany" ? "germany"
          : countries[0]?.toLowerCase() === "poland"  ? "poland"
          : "both";

        setForm({
          nationality: p.nationality || "",
          degree_level: p.degree_level || "bachelor",
          phone_number: p.phone_number || "",
          gpa: p.gpa?.toString() || "",
          budget_currency: "EUR",
          budget_input: p.budget_eur || 5000,
          language: p.language || "english",
          language_level: p.english_level || "b2",
          field_of_study: p.field_of_study || "",
          preferred_country: preferredCountry,
          prev_university: p.prev_university || "",
          prev_country: p.prev_country || "",
          prev_major: p.prev_major || "",
          graduation_year: p.graduation_year?.toString() || "",
        });
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const adjustBudget = (delta) => {
    set("budget_input", Math.max(0, (form.budget_input || 0) + delta));
  };

  const validate = () => {
    const e = {};
    if (!form.nationality) e.nationality = t("profile.errors.nationality");
    if (!form.gpa) e.gpa = t("profile.errors.gpa");
    else {
      const v = parseFloat(form.gpa);
      if (v < 0 || v > 4) e.gpa = t("profile.errors.gpaRange");
    }
    if (!form.budget_input || form.budget_input <= 0) e.budget = t("profile.errors.budget");
    if (form.degree_level === "bachelor" && !form.field_of_study) e.field_of_study = t("common.required");

    if (form.degree_level === "master" || form.degree_level === "phd") {
      if (!form.prev_country) e.prev_country = t("common.required");
      if (!form.prev_major) e.prev_major = t("common.required");
      if (!form.graduation_year) e.graduation_year = t("common.required");
      else {
        const yr = parseInt(form.graduation_year);
        if (yr < 1950 || yr > new Date().getFullYear()) e.graduation_year = t("profile.errors.invalidYear");
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const budget_eur = budgetEur ?? form.budget_input;
    const preferred_countries =
      form.preferred_country === "both"    ? "Germany,Poland" :
      form.preferred_country === "germany" ? "Germany" : "Poland";

    const hasPrevDegree = form.degree_level === "master" || form.degree_level === "phd";

    const payload = {
      nationality: form.nationality,
      degree_level: form.degree_level,
      gpa: parseFloat(form.gpa),
      budget_eur,
      english_level: form.language_level,
      language: form.language,
      preferred_countries,
      field_of_study: hasPrevDegree ? form.prev_major.trim() || null : form.field_of_study,
      phone_number: form.phone_number.trim() || null,
      prev_university: hasPrevDegree ? form.prev_university.trim() || null : null,
      prev_country: hasPrevDegree ? form.prev_country.trim() || null : null,
      prev_major: hasPrevDegree ? form.prev_major.trim() || null : null,
      graduation_year: hasPrevDegree ? parseInt(form.graduation_year) || null : null,
    };

    setSaving(true);
    try {
      if (profile) {
        await api.patch("/profiles/me", payload);
      } else {
        await api.post("/profiles", payload);
      }
      markProfileComplete();
      toast.success(t("profile.success"));
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || t("profile.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      <PageHero
        photo="https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?w=1400&q=80"
        title={profile ? t("profile.title") : t("profile.titleNew")}
        subtitle={t("profile.tellUs")}
      />

      {/* ── Completeness bar ── */}
      {!loading && (
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-0">
          <div className="rounded-2xl px-5 py-4" style={{ background: "oklch(0.17 0.022 285)", border: "1px solid oklch(1 0 0 / 0.07)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">Profile completeness</span>
              <span className="text-sm font-bold" style={{ color: barWidth === 100 ? "oklch(0.65 0.18 158)" : "oklch(0.75 0.18 296)" }}>
                {barWidth}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(1 0 0 / 0.08)" }}>
              <div className="h-full rounded-full transition-all duration-700 ease-out"
                   style={{ width: `${barWidth}%`, background: barWidth === 100 ? "oklch(0.65 0.18 158)" : "linear-gradient(90deg, oklch(0.55 0.22 296), oklch(0.65 0.18 264))" }} />
            </div>
            {barWidth < 100 && (
              <p className="text-xs mt-2" style={{ color: "oklch(0.55 0.02 285)" }}>
                Fill all fields below to get better AI university matches
              </p>
            )}
            {barWidth === 100 && (
              <p className="text-xs mt-2" style={{ color: "oklch(0.65 0.18 158)" }}>
                ✓ Profile complete — your AI recommendations are fully optimized
              </p>
            )}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">

      {/* ── Account Section ── */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">🔐 {t("profile.accountSection")}</h3>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-[oklch(0.55_0.02_285)] mb-1">{t("profile.emailLabel")}</p>
            <p className="text-sm font-semibold text-white">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-[oklch(0.55_0.02_285)] mb-1">{t("profile.planLabel")}</p>
            {user?.plan === "premium" || user?.plan === "pro" ? (
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold px-3 py-1.5 rounded-full ">
                👑 {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-gray-100 text-[oklch(0.65_0.02_285)] text-xs font-bold px-3 py-1.5 rounded-full">
                {t("profile.freePlanBadge")}
              </span>
            )}
          </div>
          {(user?.plan === "free" || !user?.plan) && (
            <a href="/pricing" className="text-xs text-indigo-600 font-semibold hover:underline">
              {t("profile.upgradeLink")} →
            </a>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-7">

        {/* ── Contact info ── */}
        <div className="bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[oklch(0.75_0.02_285)] flex items-center gap-2">
            <span>👤</span> {t("profile.contactInfo")}
          </h3>

          <Field label={t("profile.emailLabel")}>
            <div className="relative">
              <input
                type="email"
                readOnly
                value={user?.email || ""}
                className="w-full border border-[oklch(1_0_0/0.08)] rounded-lg px-4 py-2.5 bg-gray-100 text-[oklch(0.55_0.02_285)] cursor-not-allowed pr-24"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                {t("profile.accountEmail")}
              </span>
            </div>
            <p className="mt-1 text-xs text-[oklch(0.45_0.02_285)]">{t("profile.emailReadonly")}</p>
          </Field>

          <Field label={t("profile.phoneLabel")}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.45_0.02_285)] text-sm select-none">📞</span>
              <input
                type="tel"
                value={form.phone_number}
                onChange={(e) => set("phone_number", e.target.value)}
                placeholder="+1 234 567 8900"
                className="w-full border border-[oklch(1_0_0/0.08)] rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="mt-1 text-xs text-[oklch(0.45_0.02_285)]">{t("profile.phoneOptional")}</p>
          </Field>
        </div>

        {/* ── Nationality ── */}
        <Field label={t("profile.nationality")} error={errors.nationality} required>
          <CountryDropdown
            value={form.nationality}
            onChange={(v) => set("nationality", v)}
          />
        </Field>

        {/* ── Degree Level ── */}
        <Field label={t("profile.degreeLevel")}>
          <div className="flex gap-3">
            {DEGREE_LEVELS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => set("degree_level", value)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${
                  form.degree_level === value
                    ? "bg-blue-600 text-white border-blue-600 "
                    : "bg-white text-[oklch(0.65_0.02_285)] border-gray-200 hover:border-blue-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        {/* ── Previous Degree Info (Master / PhD only) ── */}
        {(form.degree_level === "master" || form.degree_level === "phd") && (
          <div className="bg-[oklch(0.17_0.02_285)] rounded-2xl border border-indigo-500/20 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-indigo-400">🎓</span>
              <h3 className="text-sm font-semibold text-indigo-300">
                {form.degree_level === "master" ? t("profile.prevDegree.bachelorTitle") : t("profile.prevDegree.masterTitle")}
              </h3>
            </div>
            <p className="text-xs text-[oklch(0.45_0.02_285)] -mt-2">{t("profile.prevDegree.subtitle")}</p>

            <Field label={t("profile.prevDegree.university")} error={errors.prev_university}>
              <input
                type="text"
                value={form.prev_university}
                onChange={(e) => set("prev_university", e.target.value)}
                placeholder={t("profile.prevDegree.universityPlaceholder")}
                className="w-full border border-[oklch(1_0_0/0.08)] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </Field>

            <Field label={t("profile.prevDegree.country")} error={errors.prev_country} required>
              <CountryOfStudyDropdown
                value={form.prev_country}
                onChange={(v) => set("prev_country", v)}
              />
            </Field>

            <Field label={t("profile.prevDegree.major")} error={errors.prev_major} required>
              <FieldOfStudyDropdown
                value={form.prev_major}
                onChange={(v) => set("prev_major", v)}
              />
            </Field>

            <Field label={t("profile.prevDegree.graduationYear")} error={errors.graduation_year} required>
              <input
                type="number"
                min="1950"
                max={new Date().getFullYear()}
                value={form.graduation_year}
                onChange={(e) => set("graduation_year", e.target.value)}
                placeholder="e.g. 2022"
                className="w-full border border-[oklch(1_0_0/0.08)] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </Field>

          </div>
        )}

        {/* ── GPA ── */}
        <Field label={t("profile.academicScore")} error={errors.gpa} required>
          <div className="relative">
            <input
              type="number"
              required
              min="0"
              max="4"
              step="0.01"
              value={form.gpa}
              onChange={(e) => set("gpa", e.target.value)}
              placeholder="e.g. 3.5"
              className="w-full border border-[oklch(1_0_0/0.08)] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[oklch(0.45_0.02_285)] font-medium">/ 4.0</span>
          </div>
        </Field>

        {/* ── Budget ── */}
        <Field label={t("profile.annualBudget")} error={errors.budget} required>
          <div className="flex gap-2 items-center">
            <select
              value={form.budget_currency}
              onChange={(e) => set("budget_currency", e.target.value)}
              className="border border-[oklch(1_0_0/0.08)] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-white"
            >
              {CURRENCIES.map(({ code, label }) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => adjustBudget(-100)}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-[oklch(1_0_0/0.08)] text-[oklch(0.65_0.02_285)] hover:bg-[oklch(0.20_0.024_285)] text-xl font-bold flex-shrink-0"
            >
              −
            </button>

            <input
              type="number"
              min="0"
              step="100"
              value={form.budget_input}
              onChange={(e) => set("budget_input", parseInt(e.target.value) || 0)}
              className="flex-1 border border-[oklch(1_0_0/0.08)] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono text-base"
            />

            <button
              type="button"
              onClick={() => adjustBudget(100)}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-[oklch(1_0_0/0.08)] text-[oklch(0.65_0.02_285)] hover:bg-[oklch(0.20_0.024_285)] text-xl font-bold flex-shrink-0"
            >
              +
            </button>
          </div>

          {form.budget_currency !== "EUR" && (
            <div className="mt-2 flex items-center gap-2">
              {ratesLoading ? (
                <span className="text-xs text-[oklch(0.45_0.02_285)]">{t("profile.loadingRate")}</span>
              ) : budgetEur != null ? (
                <span className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                  ≈ <strong>€{budgetEur.toLocaleString()}</strong> EUR
                  <span className="text-[oklch(0.45_0.02_285)] ml-1 text-xs">({t("profile.usedForRec")})</span>
                </span>
              ) : (
                <span className="text-xs text-red-500">{t("profile.rateUnavailable")}</span>
              )}
            </div>
          )}
        </Field>

        {/* ── Languages ── */}
        <LanguageManager />

        {/* ── Field of Study (Bachelor only — Master/PhD use prev_major) ── */}
        {form.degree_level === "bachelor" && (
          <Field label={t("profile.fieldOfStudy")} error={errors.field_of_study} required>
            <FieldOfStudyDropdown
              value={form.field_of_study}
              onChange={(v) => set("field_of_study", v)}
            />
          </Field>
        )}

        {/* ── Preferred Countries ── */}
        <Field label={t("profile.preferredCountry")}>
          <div className="flex gap-3">
            {[
              { value: "germany", label: "🇩🇪 Germany" },
              { value: "poland",  label: "🇵🇱 Poland"  },
              { value: "both",    label: "🌍 Both"     },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => set("preferred_country", value)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${
                  form.preferred_country === value
                    ? "bg-blue-600 text-white border-blue-600 "
                    : "bg-white text-[oklch(0.65_0.02_285)] border-gray-200 hover:border-blue-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {form.preferred_country === "both" && (
            <p className="mt-1.5 text-xs text-[oklch(0.45_0.02_285)]">{t("profile.bothCountriesNote")}</p>
          )}
        </Field>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-50 text-base mt-2 shadow-indigo-200"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t("profile.saving")}
            </span>
          ) : t("profile.save")}
        </button>

        {/* Restart onboarding */}
        <div className="pt-4 border-t border-[oklch(1_0_0/0.07)] mt-4">
          <button
            type="button"
            onClick={restartOnboarding}
            className="w-full text-center text-xs text-[oklch(0.45_0.02_285)] hover:text-indigo-600 transition py-2"
          >
            🎓 {t("profile.restartTour")}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field = ({ label, error, required, children }) => (
  <div>
    <label className="block text-sm font-semibold text-[oklch(0.75_0.02_285)] mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

export default Profile;

