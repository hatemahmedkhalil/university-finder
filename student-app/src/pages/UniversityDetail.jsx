import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

/* ── Country theme map (flag colors + real flag image) ── */
const COUNTRY_THEME = {
  Germany: {
    flagSrc: "https://flagcdn.com/w80/de.png",
    stripeColors: ["#1a1a1a", "#DD0000", "#FFCE00"],
    heroBg: "#1a1a1a",
    accent: "#DD0000",
    accentGold: "#FFCE00",
    badgeBg: "#1a1a1a",
    badgeText: "#FFCE00",
    cardBorder: "#fde68a",
    tagBg: "#fef3c7",
    tagText: "#92400e",
    btnPrimary: "bg-[#DD0000] hover:bg-[#bb0000] text-white",
    btnSave: "border-[#FFCE00] text-[#FFCE00] hover:bg-[#FFCE00]/10",
    sectionAccent: "#FFCE00",
  },
  Poland: {
    flagSrc: "https://flagcdn.com/w80/pl.png",
    stripeColors: ["#FFFFFF", "#DC143C"],
    heroBg: "#DC143C",
    accent: "#DC143C",
    accentGold: "#ffffff",
    badgeBg: "#DC143C",
    badgeText: "#ffffff",
    cardBorder: "#fda4af",
    tagBg: "#ffe4e6",
    tagText: "#9f1239",
    btnPrimary: "bg-white hover:bg-[oklch(0.22_0.026_285)] text-[#DC143C]",
    btnSave: "border-white text-white hover:bg-white/10",
    sectionAccent: "#ffffff",
  },
  Austria: {
    flagSrc: "https://flagcdn.com/w80/at.png",
    stripeColors: ["#ED2939", "#FFFFFF", "#ED2939"],
    heroBg: "#ED2939",
    accent: "#ED2939",
    accentGold: "#ffffff",
    badgeBg: "#ED2939",
    badgeText: "#ffffff",
    cardBorder: "#fca5a5",
    tagBg: "#fee2e2",
    tagText: "#991b1b",
    btnPrimary: "bg-white hover:bg-[oklch(0.22_0.026_285)] text-[#ED2939]",
    btnSave: "border-white text-white hover:bg-white/10",
    sectionAccent: "#ffffff",
  },
  Netherlands: {
    flagSrc: "https://flagcdn.com/w80/nl.png",
    stripeColors: ["#AE1C28", "#FFFFFF", "#21468B"],
    heroBg: "#21468B",
    accent: "#AE1C28",
    accentGold: "#ffffff",
    badgeBg: "#21468B",
    badgeText: "#ffffff",
    cardBorder: "#bfdbfe",
    tagBg: "#dbeafe",
    tagText: "#1e40af",
    btnPrimary: "bg-[#AE1C28] hover:bg-[#8b1520] text-white",
    btnSave: "border-white text-white hover:bg-white/10",
    sectionAccent: "#AE1C28",
  },
  France: {
    flagSrc: "https://flagcdn.com/w80/fr.png",
    stripeColors: ["#002395", "#FFFFFF", "#ED2939"],
    heroBg: "#002395",
    accent: "#ED2939",
    accentGold: "#ffffff",
    badgeBg: "#002395",
    badgeText: "#ffffff",
    cardBorder: "#bfdbfe",
    tagBg: "#eff6ff",
    tagText: "#1e40af",
    btnPrimary: "bg-[#ED2939] hover:bg-[#c21c2c] text-white",
    btnSave: "border-white text-white hover:bg-white/10",
    sectionAccent: "#ED2939",
  },
  Sweden: {
    flagSrc: "https://flagcdn.com/w80/se.png",
    stripeColors: ["#006AA7", "#FECC02"],
    heroBg: "#006AA7",
    accent: "#FECC02",
    accentGold: "#FECC02",
    badgeBg: "#006AA7",
    badgeText: "#FECC02",
    cardBorder: "#fde68a",
    tagBg: "#fef9c3",
    tagText: "#854d0e",
    btnPrimary: "bg-[#FECC02] hover:bg-[#e6b800] text-[#006AA7]",
    btnSave: "border-[#FECC02] text-[#FECC02] hover:bg-[#FECC02]/10",
    sectionAccent: "#FECC02",
  },
  Italy: {
    flagSrc: "https://flagcdn.com/w80/it.png",
    stripeColors: ["#009246", "#FFFFFF", "#CE2B37"],
    heroBg: "#009246",
    accent: "#CE2B37",
    accentGold: "#ffffff",
    badgeBg: "#009246",
    badgeText: "#ffffff",
    cardBorder: "#bbf7d0",
    tagBg: "#f0fdf4",
    tagText: "#166534",
    btnPrimary: "bg-[#CE2B37] hover:bg-[#a82230] text-white",
    btnSave: "border-white text-white hover:bg-white/10",
    sectionAccent: "#CE2B37",
  },
  Spain: {
    flagSrc: "https://flagcdn.com/w80/es.png",
    stripeColors: ["#AA151B", "#F1BF00", "#AA151B"],
    heroBg: "#AA151B",
    accent: "#F1BF00",
    accentGold: "#F1BF00",
    badgeBg: "#AA151B",
    badgeText: "#F1BF00",
    cardBorder: "#fde68a",
    tagBg: "#fef9c3",
    tagText: "#854d0e",
    btnPrimary: "bg-[#F1BF00] hover:bg-[#d4a800] text-[#AA151B]",
    btnSave: "border-[#F1BF00] text-[#F1BF00] hover:bg-[#F1BF00]/10",
    sectionAccent: "#F1BF00",
  },
};

const DEFAULT_THEME = {
  flagSrc: null,
  stripeColors: ["#1d4ed8", "#3b82f6", "#93c5fd"],
  heroBg: "#1d4ed8",
  accent: "#3b82f6",
  accentGold: "#ffffff",
  badgeBg: "#1d4ed8",
  badgeText: "#ffffff",
  cardBorder: "#bfdbfe",
  tagBg: "#eff6ff",
  tagText: "#1e40af",
  btnPrimary: "bg-white hover:bg-blue-50 text-blue-700",
  btnSave: "border-white text-white hover:bg-white/10",
  sectionAccent: "#93c5fd",
};

/* ── small reusable pieces ── */
const Badge = ({ children, color = "gray" }) => {
  const colors = {
    gray:   "bg-gray-100 text-[oklch(0.65_0.02_285)]",
    blue:   "bg-blue-50 text-blue-700",
    green:  "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    purple: "bg-purple-50 text-purple-700",
    red:    "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-700",
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
};

const Section = ({ icon, title, children, className = "", accentColor, id }) => (
  <div id={id} className={`bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] p-6 ${className}`}>
    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
      <span
        className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
        style={{ backgroundColor: accentColor ? accentColor + "22" : "#f3f4f6" }}
      >
        {icon}
      </span>
      {title}
    </h2>
    {children}
  </div>
);

const InfoRow = ({ label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-[oklch(0.45_0.02_285)] uppercase tracking-wide sm:w-44 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-white leading-relaxed">{value}</span>
    </div>
  );
};

const ScoreArc = ({ score, t }) => {
  const color = score >= 75 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";
  const label = score >= 75 ? t("university.matchExcellent") : score >= 50 ? t("university.matchGood") : t("university.matchPartial");
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${score} 100`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs font-semibold mt-1" style={{ color }}>{label}</span>
    </div>
  );
};

const ScoreBar = ({ label, value, max, color }) => (
  <div>
    <div className="flex justify-between text-xs text-[oklch(0.55_0.02_285)] mb-1">
      <span>{label}</span><span className="font-medium">{value}/{max}</span>
    </div>
    <div className="h-1.5 bg-[oklch(0.20_0.024_285)] rounded-full">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  </div>
);

const ScholarshipCard = ({ s }) => {
  const { t } = useTranslation();
  return (
    <div className="border border-[oklch(1_0_0/0.07)] rounded-xl p-4 hover:border-green-200 hover:bg-green-50/30 transition">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="font-semibold text-white text-sm">{s.name}</p>
          <p className="text-xs text-[oklch(0.55_0.02_285)]">{s.provider}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {s.amount_eur && <Badge color="green">€{s.amount_eur.toLocaleString()}/yr</Badge>}
          <Badge color={s.scholarship_type === "full" ? "purple" : s.scholarship_type === "government" ? "blue" : "gray"}>
            {s.scholarship_type.replace("_", " ")}
          </Badge>
        </div>
      </div>
      {s.description && <p className="text-xs text-[oklch(0.65_0.02_285)] mt-2 leading-relaxed">{s.description}</p>}
      {s.eligibility && <p className="text-xs text-[oklch(0.45_0.02_285)] mt-1 italic">{t("university.eligibilityLabel")} {s.eligibility}</p>}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {s.deadline && <span className="text-xs text-[oklch(0.55_0.02_285)]">📅 {s.deadline}</span>}
        {s.link && (
          <a href={s.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
            className="text-xs text-blue-600 hover:underline font-semibold">{t("university.applyLink")} →</a>
        )}
      </div>
    </div>
  );
};

/* ── Track Application Modal ── */
function TrackModal({ uni, onClose, onConfirm }) {
  const { t } = useTranslation();
  const fileRef = useRef();
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const requiredDocs = uni.required_documents
    ? uni.required_documents.split(",").map(d => d.trim()).filter(Boolean)
    : [];

  const addFiles = (incoming) => {
    const arr = Array.from(incoming);
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...arr.filter(f => !names.has(f.name))];
    });
  };

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name));

  const fmt = (bytes) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const handleDrop = (e) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const appRes = await api.post("/applications", { university_id: uni.id, status: "under_review" });
      const appId = appRes.data.id;
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        await api.post(`/applications/${appId}/documents`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onConfirm(appRes.data);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[oklch(0.17_0.02_285)] rounded-2xl-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[oklch(1_0_0/0.07)]">
          <div>
            <h2 className="text-lg font-extrabold text-white">📋 {t("university.apply")}</h2>
            <p className="text-sm text-[oklch(0.55_0.02_285)] mt-0.5">{uni.name}</p>
          </div>
          <button onClick={onClose} className="text-[oklch(0.45_0.02_285)] hover:text-[oklch(0.75_0.02_285)] text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-5">

          {/* Required docs checklist */}
          {requiredDocs.length > 0 && (
            <div>
              <p className="text-sm font-bold text-[oklch(0.75_0.02_285)] mb-2">📄 {t("university.requiredDocuments")}</p>
              <ul className="space-y-1.5">
                {requiredDocs.map((doc, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[oklch(0.65_0.02_285)] bg-[oklch(0.17_0.02_285)] rounded-lg px-3 py-2">
                    <span className="text-amber-500">⚠️</span>
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upload area */}
          <div>
            <p className="text-sm font-bold text-[oklch(0.75_0.02_285)] mb-2">⬆️ {t("applications.uploadFile")}</p>
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition group"
            >
              <div className="text-3xl mb-2">📁</div>
              <p className="text-sm text-[oklch(0.55_0.02_285)] group-hover:text-blue-600 transition">
                {t("university.dropFiles")}
              </p>
              <p className="text-xs text-[oklch(0.45_0.02_285)] mt-1">{t("university.maxFileSize")}</p>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
            </div>

            {files.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {files.map(f => (
                  <li key={f.name} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 text-xs">
                    <span>📎</span>
                    <span className="flex-1 truncate text-blue-800 font-medium">{f.name}</span>
                    <span className="text-[oklch(0.45_0.02_285)] shrink-0">{fmt(f.size)}</span>
                    <button onClick={() => removeFile(f.name)} className="text-[oklch(0.35_0.02_285)] hover:text-red-500 transition">✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold border border-[oklch(1_0_0/0.08)] text-[oklch(0.65_0.02_285)] hover:bg-[oklch(0.20_0.024_285)] transition">
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
          >
            {submitting ? "⏳ " + t("common.loading") : `✅ ${t("university.confirmTrack")}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── main component ── */
const UniversityDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const matchData = location.state || {};

  const [uni, setUni] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [inPipeline, setInPipeline] = useState(false);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  useEffect(() => {
    Promise.all([
      api.get(`/universities/${id}`),
      api.get("/favourites"),
      api.get("/pipeline").catch(() => ({ data: [] })),
    ]).then(([uRes, fRes, pRes]) => {
      setUni(uRes.data);
      const ids = fRes.data.map(f => f.university_id ?? f.id);
      setSaved(ids.includes(parseInt(id)));
      const pipelineIds = (Array.isArray(pRes.data) ? pRes.data : []).map(e => e.university_id);
      setInPipeline(pipelineIds.includes(parseInt(id)));
    }).catch(() => {
      api.get(`/universities/${id}`)
        .then(r => setUni(r.data))
        .catch(() => navigate("/recommendations"));
    }).finally(() => setLoading(false));
  }, [id]);

  const addToPipeline = async () => {
    if (inPipeline) { navigate("/pipeline"); return; }
    setPipelineLoading(true);
    try {
      await api.post("/pipeline", { university_id: parseInt(id) });
      setInPipeline(true);
      toast.success(t("pipeline.addedToast", { score: "…" }));
    } catch (err) {
      if (err?.response?.status === 409) { setInPipeline(true); navigate("/pipeline"); }
      else toast.error(t("pipeline.addFailed"));
    } finally {
      setPipelineLoading(false);
    }
  };

  const toggleSave = async () => {
    setSavingLoading(true);
    try {
      if (saved) { await api.delete(`/favourites/${id}`); setSaved(false); }
      else        { await api.post(`/favourites/${id}`);  setSaved(true);  }
    } catch {}
    setSavingLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-[oklch(0.45_0.02_285)] text-sm">
      {t("university.loading")}
    </div>
  );
  if (!uni) return null;

  const theme = COUNTRY_THEME[uni.country] ?? DEFAULT_THEME;
  const programs = uni.programs ? uni.programs.split(",").map(p => p.trim()) : [];
  const docs = uni.required_documents ? uni.required_documents.split(",").map(d => d.trim()) : [];
  const score = matchData.score ?? null;
  const reasons = matchData.reasons ?? [];
  const bd = matchData.breakdown ?? null;

  return (
    <>
    <div className="min-h-screen">

      {/* ── Hero with flag-stripe design ── */}
      <div className="relative overflow-hidden text-white" style={{ backgroundColor: theme.heroBg }}>

        {/* Top flag stripes */}
        <div className="absolute top-0 left-0 right-0 flex h-2">
          {theme.stripeColors.map((c, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>

        {/* Diagonal watermark pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg, transparent, transparent 24px,
              ${theme.stripeColors[1] ?? "#fff"} 24px,
              ${theme.stripeColors[1] ?? "#fff"} 26px
            )`,
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-14">
          <Link to="/recommendations" className="inline-flex items-center gap-1 text-white/60 hover:text-white text-sm mb-8 transition">
            {t("university.back")}
          </Link>

          <div className="flex flex-col md:flex-row items-start gap-6">

            {/* Logo + country flag stacked */}
            <div className="shrink-0 flex flex-col items-center gap-3">
              {/* University logo */}
              {uni.logo_url && !imgError ? (
                <div className="w-20 h-20 bg-[oklch(0.17_0.02_285)] rounded-2xl flex items-center justify-center p-2">
                  <img src={uni.logo_url} alt={uni.name} className="w-full h-full object-contain"
                    onError={() => setImgError(true)} />
                </div>
              ) : (
                <div className="w-20 h-20 bg-white/15 rounded-2xl flex items-center justify-center text-4xl backdrop-blur-sm">
                  🎓
                </div>
              )}

              {/* Country flag */}
              {theme.flagSrc && (
                <div className="relative">
                  <div className="w-14 h-10 rounded-lg overflow-hidden border-2 border-white/20">
                    <img src={theme.flagSrc} alt={uni.country} className="w-full h-full object-cover" />
                  </div>
                  <div
                    className="absolute inset-0 rounded-lg blur-md opacity-30 -z-10"
                    style={{ backgroundColor: theme.stripeColors[1] ?? "#fff" }}
                  />
                </div>
              )}
            </div>

            {/* Title block */}
            <div className="flex-1 min-w-0">
              {/* Country label pill */}
              <div
                className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 tracking-wider uppercase"
                style={{ backgroundColor: theme.stripeColors[1] ?? "#666", color: theme.stripeColors[2] ?? "#fff" }}
              >
                {uni.city}, {uni.country}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight text-white">{uni.name}</h1>

              {uni.ranking && (
                <p className="mt-1 text-sm font-semibold" style={{ color: theme.accentGold }}>
                  🏆 {t("university.worldRank")} #{uni.ranking}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {uni.is_public ? <Badge color="blue">{t("university.publicUniversity")}</Badge> : <Badge color="orange">{t("university.privateUniversity")}</Badge>}
                {uni.english_programs_available && <Badge color="green">🌐 {t("university.englishPrograms")}</Badge>}
                {uni.tuition_fee_eur === 0 && <Badge color="green">{t("university.freeTuition")}</Badge>}
                {uni.acceptance_rate && (
                  <Badge color="purple">{t("university.acceptance")} {(uni.acceptance_rate * 100).toFixed(0)}%</Badge>
                )}
              </div>

              {uni.description && (
                <p className="text-white/70 text-sm mt-3 leading-relaxed max-w-2xl">{uni.description}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
              <button onClick={toggleSave} disabled={savingLoading}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition border ${
                  saved
                    ? "bg-white text-red-600 border-white hover:bg-red-50"
                    : `bg-transparent ${theme.btnSave}`
                }`}>
                {saved ? `❤️ ${t("university.unsave")}` : `🤍 ${t("university.save")}`}
              </button>
              <button
                onClick={() => navigate(`/apply-hub/${uni.id}`)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition text-center  bg-emerald-500 hover:bg-emerald-400 text-white">
                📋 {t("university.startApplying")}
              </button>
              <button
                onClick={() => navigate("/ai-chat", { state: { prefill: `Tell me about ${uni.name} in ${uni.city}, ${uni.country}. What are my chances of getting admitted, what programs do they offer, and what should I prepare?` } })}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition text-center  bg-violet-600 hover:bg-violet-500 text-white">
                🤖 {t("university.askAI")}
              </button>
              <button
                onClick={addToPipeline}
                disabled={pipelineLoading}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition text-center  ${inPipeline ? "bg-indigo-500 text-white hover:bg-indigo-400" : "bg-white text-indigo-700 hover:bg-indigo-50"}`}>
                {pipelineLoading ? t("common.adding") : inPipeline ? t("university.inPipelineBtn") : `🚀 ${t("university.addPipeline")}`}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom flag stripes (reversed) */}
        <div className="absolute bottom-0 left-0 right-0 flex h-3">
          {[...theme.stripeColors].reverse().map((c, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      {/* ── Sticky section nav ── */}
      <div className="sticky top-[60px] z-10 bg-white border-b border-[oklch(1_0_0/0.07)] ">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto scrollbar-hide py-1">
          {[
            { id: "overview",      label: t("university.matchScoreSection") },
            { id: "programs",      label: t("university.programs") },
            { id: "admission",     label: t("university.admissionReqSection") },
            { id: "costs",         label: t("university.costBreakdown") },
            { id: "accommodation", label: t("university.accommodationTitle") },
            { id: "location",      label: t("university.locationContact") },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="shrink-0 px-2.5 py-1.5 text-[11px] font-semibold text-[oklch(0.55_0.02_285)] hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition whitespace-nowrap"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Grid ── */}
      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {score !== null && (
            <Section icon="🎯" title={t("university.matchScoreSection")} accentColor={theme.accent}>
              <div className="flex items-center gap-6 flex-wrap">
                <ScoreArc score={score} t={t} />
                <div className="flex-1 space-y-3">
                  {bd && (
                    <>
                      <ScoreBar label={t("university.scoreCountryMatch")} value={bd.country_match} max={30} color="bg-blue-500" />
                      <ScoreBar label={t("university.scoreBudgetFit")}    value={bd.budget_fit}    max={30} color="bg-green-500" />
                      <ScoreBar label={t("university.scoreEnglishFit")}   value={bd.english_fit}   max={20} color="bg-purple-500" />
                      <ScoreBar label={t("university.scoreGpaFit")}       value={bd.gpa_fit}       max={20} color="bg-orange-500" />
                    </>
                  )}
                </div>
              </div>
              {reasons.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {reasons.map((r, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: theme.tagBg, color: theme.tagText }}>
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </Section>
          )}

          {programs.length > 0 && (
            <Section icon="🎓" title={t("university.programs")} accentColor={theme.accent} id="section-programs">
              <div className="flex flex-wrap gap-2">
                {programs.map((p, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium"
                    style={{ backgroundColor: theme.tagBg, color: theme.tagText }}>
                    {p}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* ── Program-specific tuition fees ── */}
          {uni.program_fees?.length > 0 && (
            <Section icon="💰" title={t("university.programFeesTitle")} accentColor={theme.accent} id="section-program-fees">
              <p className="text-xs text-[oklch(0.45_0.02_285)] mb-4">
                {t("university.programFeesNote")}
              </p>

              {/* Group by degree level */}
              {(() => {
                const groups = {};
                for (const pf of uni.program_fees) {
                  const key = pf.degree_level === "all" ? t("university.degreeLevelAll") :
                              pf.degree_level === "bachelor" ? t("university.degreeLevelBachelor") :
                              pf.degree_level === "master" ? t("university.degreeLevelMaster") :
                              pf.degree_level === "phd" ? t("university.degreeLevelPhd") : pf.degree_level;
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(pf);
                }
                const order = [t("university.degreeLevelAll"), t("university.degreeLevelBachelor"), t("university.degreeLevelMaster"), t("university.degreeLevelPhd")];
                return order.filter(k => groups[k]).map(level => (
                  <div key={level} className="mb-5 last:mb-0">
                    {Object.keys(groups).length > 1 && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: theme.accent }}>{level}</span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>
                    )}
                    <div className="overflow-hidden rounded-xl border border-[oklch(1_0_0/0.07)]">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[oklch(0.17_0.02_285)]">
                            <th className="text-left py-2 px-3 text-xs font-semibold text-[oklch(0.55_0.02_285)] uppercase tracking-wide">{t("university.fieldOfStudyHeader")}</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-[oklch(0.55_0.02_285)] uppercase tracking-wide">{t("university.annualFeeHeader")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groups[level].map((pf, i) => (
                            <tr key={pf.id}
                              className={`border-t border-gray-50 ${i % 2 === 0 ? "bg-[oklch(0.17_0.02_285)]" : "bg-gray-50/40"} hover:bg-indigo-50/30 transition`}
                              title={pf.notes || ""}>
                              <td className="py-2.5 px-3 font-medium text-white">{pf.field_of_study}</td>
                              <td className="py-2.5 px-3 text-right">
                                {pf.tuition_fee_eur === 0 ? (
                                  <span className="text-green-600 font-bold">{t("university.freeTuitionShort")}</span>
                                ) : (
                                  <span className="font-bold" style={{ color: theme.accent }}>
                                    €{pf.tuition_fee_eur.toLocaleString()}/yr
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ));
              })()}

              <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <span className="text-amber-500 mt-0.5 shrink-0">⚠️</span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {t("university.programFeesDisclaimer")}{" "}
                  {uni.website ? (
                    <a href={uni.website} target="_blank" rel="noreferrer"
                      className="font-semibold underline" style={{ color: theme.accent }}>
                      {t("university.officialWebsiteLink")}
                    </a>
                  ) : t("university.officialWebsiteLink")} {t("university.programFeesDisclaimerEnd")}
                </p>
              </div>
            </Section>
          )}

          <Section icon="✅" title={t("university.admissionReqSection")} accentColor={theme.accent} id="section-admission">
            <InfoRow label={t("university.minGpaLabel")}    value={uni.min_gpa ? `${uni.min_gpa} / 4.0` : null} />
            <InfoRow label={t("university.admissionReqRow")} value={uni.admission_requirements} />
            <InfoRow label={t("university.languageReq")}    value={uni.language_requirements} />
          </Section>

          {docs.length > 0 && (
            <Section icon="📄" title={t("university.requiredDocumentsSection")} accentColor={theme.accent}>
              <ul className="space-y-2">
                {docs.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[oklch(0.75_0.02_285)]">
                    <span className="font-bold mt-0.5" style={{ color: theme.accent }}>✓</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {uni.scholarships?.length > 0 && (
            <Section icon="💰" title={t("university.scholarshipsTitle")} accentColor={theme.accent}>
              <div className="grid sm:grid-cols-2 gap-4">
                {uni.scholarships.map(s => <ScholarshipCard key={s.id} s={s} />)}
              </div>
            </Section>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">

          <Section icon="📋" title={t("university.keyFacts")} accentColor={theme.accent} id="section-overview">
            <InfoRow label={t("university.annualTuition")}
              value={uni.tuition_fee_eur === 0 ? t("university.tuitionFreeLabel") : uni.tuition_fee_eur ? `€${uni.tuition_fee_eur.toLocaleString()}/year` : null} />
            <InfoRow label={t("university.semesterFee")}
              value={uni.semester_fee_eur ? `€${uni.semester_fee_eur}/semester` : null} />
            <InfoRow label={t("university.applicationFee")}
              value={uni.application_fee_eur === 0 ? t("common.free") : uni.application_fee_eur ? `€${uni.application_fee_eur}` : null} />
            <InfoRow label={t("university.studyLanguage")}   value={uni.study_language} />
            <InfoRow label={t("university.livingCostPerMo")} value={uni.living_cost_eur ? `~€${uni.living_cost_eur.toLocaleString()}` : null} />
            <InfoRow label={t("university.studyDuration")}   value={uni.study_duration} />
            <InfoRow label={t("university.deadlineLabel")}   value={uni.application_deadline} />
            <InfoRow label={t("university.worldRanking")}    value={uni.ranking ? `#${uni.ranking}` : null} />
            <InfoRow label={t("university.typeLabel")}       value={uni.is_public ? t("university.publicType") : t("university.privateType")} />
          </Section>

          {/* German free-tuition explainer */}
          {uni.country === "Germany" && uni.tuition_fee_eur === 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-bold mb-1">{t("university.germanTuitionTitle")}</p>
              <p className="leading-relaxed text-amber-800">
                {t("university.germanTuitionDesc")}
                {uni.semester_fee_eur ? ` of €${uni.semester_fee_eur}` : ""}.
              </p>
              {uni.semester_fee_eur && (
                <p className="mt-2 text-amber-700 font-medium">
                  {t("university.germanTuitionAnnual")} €{(uni.semester_fee_eur * 2).toLocaleString()}/{t("common.year")}
                </p>
              )}
            </div>
          )}

          {/* Cost breakdown */}
          {(uni.tuition_fee_eur !== null || uni.semester_fee_eur || uni.dormitory_cost_eur) && (
            <Section icon="💶" title={t("university.costBreakdown")} accentColor={theme.accent} id="section-costs">
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-[oklch(0.65_0.02_285)]">{t("university.tuitionRowLabel")}</span>
                  <span className={`text-sm font-bold ${uni.tuition_fee_eur === 0 ? "text-green-600" : "text-white"}`}>
                    {uni.tuition_fee_eur === 0 ? t("university.tuitionFreeLabel") : uni.tuition_fee_eur ? `€${uni.tuition_fee_eur.toLocaleString()}` : "—"}
                  </span>
                </div>
                {uni.semester_fee_eur && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <div>
                      <span className="text-sm text-[oklch(0.65_0.02_285)]">{t("university.semesterContrib")}</span>
                      <p className="text-xs text-[oklch(0.45_0.02_285)]">{t("university.semesterContribDesc")}</p>
                    </div>
                    <span className="text-sm font-bold text-white">
                      €{(uni.semester_fee_eur * 2).toLocaleString()}/yr
                    </span>
                  </div>
                )}
                {uni.dormitory_cost_eur && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-[oklch(0.65_0.02_285)]">{t("university.dormitory12")}</span>
                    <span className="text-sm font-bold text-white">
                      ~€{(uni.dormitory_cost_eur * 12).toLocaleString()}/yr
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <div>
                    <span className="text-sm text-[oklch(0.65_0.02_285)]">{t("university.foodGroceries")}</span>
                    <p className="text-xs text-[oklch(0.45_0.02_285)]">{t("university.foodEstimate")}</p>
                  </div>
                  <span className="text-sm font-bold text-[oklch(0.45_0.02_285)]">~€2,400/yr</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <div>
                    <span className="text-sm text-[oklch(0.65_0.02_285)]">{t("university.healthInsurance")}</span>
                    <p className="text-xs text-[oklch(0.45_0.02_285)]">{t("university.healthInsuranceDesc")}</p>
                  </div>
                  <span className="text-sm font-bold text-[oklch(0.45_0.02_285)]">~€1,200/yr</span>
                </div>
                {(() => {
                  const tuition = uni.tuition_fee_eur ?? 0;
                  const semFee  = uni.semester_fee_eur ? uni.semester_fee_eur * 2 : 0;
                  const dorm    = uni.dormitory_cost_eur ? uni.dormitory_cost_eur * 12 : 0;
                  const fixed   = 2400 + 1200;
                  const total   = tuition + semFee + dorm + fixed;
                  return (
                    <div className="flex justify-between items-center pt-3 mt-1">
                      <span className="text-sm font-extrabold text-white">{t("university.estimatedTotal")}</span>
                      <span className="text-base font-extrabold" style={{ color: theme.accent }}>
                        ~€{total.toLocaleString()}
                      </span>
                    </div>
                  );
                })()}
                <p className="text-xs text-[oklch(0.45_0.02_285)] mt-1 leading-relaxed">{t("university.costDisclaimer")}</p>
              </div>
            </Section>
          )}

          <Section icon="🏠" title={t("university.accommodationTitle")} accentColor={theme.accent} id="section-accommodation">
            <InfoRow label={t("university.dormitoryCostLabel")} value={uni.dormitory_cost_eur ? `~€${uni.dormitory_cost_eur}/month` : null} />
            {uni.accommodation_info
              ? <p className="text-sm text-[oklch(0.75_0.02_285)] leading-relaxed mt-2">{uni.accommodation_info}</p>
              : <p className="text-sm text-[oklch(0.45_0.02_285)]">{t("university.accommodation")}</p>}
          </Section>

          <Section icon="🗺️" title={t("university.locationContact")} accentColor={theme.accent} id="section-location">
            <InfoRow label={t("university.cityLabel")}    value={uni.city} />
            <InfoRow label={t("university.countryLabel")} value={uni.country} />
            <InfoRow label={t("university.emailLabel")}   value={uni.contact_email} />
            <InfoRow label={t("university.phoneLabel")}   value={uni.contact_phone} />
            {uni.website && (
              <div className="mt-3">
                <a href={uni.website} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  style={{ color: theme.accent }}>
                  {t("university.officialWebsite")}
                </a>
              </div>
            )}
          </Section>

          <button
            onClick={addToPipeline}
            disabled={pipelineLoading}
            className={`block w-full text-center font-bold py-3 rounded-2xl transition  ${inPipeline ? "bg-emerald-600 hover:bg-emerald-500" : "bg-indigo-600 hover:bg-indigo-500"} text-white`}>
            {pipelineLoading ? t("university.analyzingFit") : inPipeline ? t("university.viewInPipeline") : t("university.addPipelineBottom")}
          </button>
        </div>
      </div>

    </div>

    {/* ── Floating ask-instructor button ── */}
    <div className="fixed bottom-6 right-6 z-30">
      <button
        onClick={() => navigate("/instructors")}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-4 py-3 rounded-2xl shadow-violet-900/30 transition-all hover:scale-105 active:scale-95"
      >
        <span className="text-base">👨‍🏫</span>
        {t("university.askInstructor")}
      </button>
    </div>
    </>
  );
};

export default UniversityDetail;

