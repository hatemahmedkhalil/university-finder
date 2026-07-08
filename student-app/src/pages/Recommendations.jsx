import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

/* ── Shared helpers ── */
const ScoreBar = ({ label, value, max = 30, color }) => (
  <div className="mb-2">
    <div className="flex justify-between text-xs text-[oklch(0.55_0.02_285)] mb-1">
      <span>{label}</span><span>{value}/{max}</span>
    </div>
    <div className="h-2 bg-[oklch(0.20_0.024_285)] rounded-full">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  </div>
);

const ScoreCircle = ({ score }) => {
  const color = score >= 75 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  return <div className={`text-3xl font-bold ${color}`}>{score}</div>;
};

const FitRing = ({ score }) => {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDisplayed(score), 80);
    return () => clearTimeout(t);
  }, [score]);
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const r = 26, circ = 2 * Math.PI * r;
  const dash = (displayed / 100) * circ;
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="oklch(0.25 0.02 285)" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.22,1,0.36,1)" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-bold leading-none" style={{ color, fontSize: "10px" }}>{score}%</div>
    </div>
  );
};

/* ── Language level selector ── */
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LANG_FLAG = { english: "🇬🇧", german: "🇩🇪", polish: "🇵🇱" };

const LevelSelector = ({ lang, value, onChange }) => {
  const { t } = useTranslation();
  const LEVEL_LABELS = {
    A1: t("recommendations.levels.A1"),
    A2: t("recommendations.levels.A2"),
    B1: t("recommendations.levels.B1"),
    B2: t("recommendations.levels.B2"),
    C1: t("recommendations.levels.C1"),
    C2: t("recommendations.levels.C2"),
  };
  return (
    <div>
      <p className="text-sm font-semibold text-[oklch(0.75_0.02_285)] mb-2">
        {LANG_FLAG[lang] || "🌍"} {t("recommendations.languageLevelTitle")} ({lang.charAt(0).toUpperCase() + lang.slice(1)})
      </p>
      <div className="flex gap-2 flex-wrap">
        {LEVELS.map(l => (
          <button key={l} onClick={() => onChange(l)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              value === l
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-[oklch(0.20_0.024_285)] text-[oklch(0.65_0.02_285)] border-[oklch(1_0_0/0.10)] hover:border-[oklch(0.55_0.22_296/0.50)]"
            }`}
          >
            {l} <span className="font-normal text-[10px]">· {LEVEL_LABELS[l]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   ✨ AI RECOMMENDATIONS TAB
══════════════════════════════════════════════════════ */
const AiTab = ({ profile }) => {
  const { t } = useTranslation();
  const LEVEL_LABELS = {
    A1: t("recommendations.levels.A1"),
    A2: t("recommendations.levels.A2"),
    B1: t("recommendations.levels.B1"),
    B2: t("recommendations.levels.B2"),
    C1: t("recommendations.levels.C1"),
    C2: t("recommendations.levels.C2"),
  };
  const [level, setLevel] = useState("B1");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(true);
  const [pipelineAdded, setPipelineAdded] = useState({});

  // compare state
  const [compareIds, setCompareIds]       = useState([]);
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError]   = useState("");

  const addToPipeline = async (uniId) => {
    setPipelineAdded(prev => ({ ...prev, [uniId]: "loading" }));
    try {
      await api.post("/pipeline", { university_id: uniId });
      setPipelineAdded(prev => ({ ...prev, [uniId]: "done" }));
    } catch (err) {
      const detail = err?.response?.data?.detail || "";
      if (detail.toLowerCase().includes("already")) setPipelineAdded(prev => ({ ...prev, [uniId]: "done" }));
      else setPipelineAdded(prev => ({ ...prev, [uniId]: null }));
    }
  };

  useEffect(() => {
    if (!profile) return;
    const lang = profile.language?.toLowerCase() || "english";
    const saved = profile.placement_results?.[lang]?.level || "";
    if (saved) { setLevel(saved); setShowPicker(false); }
    else setShowPicker(true);
  }, [profile]);

  const run = async () => {
    setLoading(true); setError(""); setResult(null);
    setCompareIds([]); setCompareResult(null);
    const lang = profile?.language?.toLowerCase() || "english";
    try {
      const payload = level ? { language: lang, level, score: 0, total: 0 } : null;
      const res = await api.post("/ai-recommendations", payload);
      setResult(res.data);
      setShowPicker(false);
    } catch (e) {
      setError(e?.response?.data?.detail || t("common.error"));
    }
    setLoading(false);
  };

  const toggleCompare = (id) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
    setCompareResult(null);
  };

  const runCompare = async () => {
    setCompareLoading(true); setCompareError(""); setCompareResult(null);
    try {
      const res = await api.post("/ai-recommendations/compare", {
        university_ids: compareIds,
        language_level: level,
      });
      setCompareResult(res.data);
    } catch (e) {
      setCompareError(e?.response?.data?.detail || t("common.error"));
    }
    setCompareLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Language level card */}
      <div className="bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(0.55_0.22_296/0.20)]  p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-white">{t("recommendations.languageLevelTitle")}</h3>
            <p className="text-xs text-[oklch(0.45_0.02_285)] mt-0.5">
              {t("recommendations.subtitle")}
            </p>
          </div>
          <button onClick={() => setShowPicker(v => !v)}
            className="text-xs text-[oklch(0.80_0.14_296)] font-semibold hover:underline">
            {showPicker ? `${t("common.hide")} ▲` : `${t("recommendations.languageLevelTitle")} ▼`}
          </button>
        </div>

        {!showPicker && level && (() => {
          const lang = profile?.language?.toLowerCase() || "english";
          return (
            <span className="inline-flex items-center gap-1.5 bg-[oklch(0.19_0.028_285)] text-[oklch(0.85_0.10_296)] text-sm font-bold px-4 py-2 rounded-xl border border-[oklch(0.55_0.22_296/0.20)]">
              {LANG_FLAG[lang]} {lang.charAt(0).toUpperCase() + lang.slice(1)}: {level} — {LEVEL_LABELS[level]}
            </span>
          );
        })()}

        {showPicker && (
          <div className="pt-2">
            <LevelSelector lang={profile?.language?.toLowerCase() || "english"} value={level} onChange={setLevel} />
            <Link to="/learning" className="inline-block mt-3 text-xs text-indigo-500 hover:underline">
              📝 {t("recommendations.howScores")}
            </Link>
          </div>
        )}
      </div>

      {/* Generate button */}
      {!result && (
        <button onClick={run} disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-3 text-base btn-press">
          {loading
            ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t("recommendations.analyzing")}</>
            : <>✨ {t("recommendations.title")}</>}
        </button>
      )}

      {error && <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-sm">{error}</div>}

      {result && (
        <>
          <div className="rounded-2xl p-5" style={{ background: "oklch(0.19 0.028 285)", border: "1px solid oklch(0.55 0.22 296 / 0.20)" }}>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-2">✨ AI Overall Advice</p>
            <p className="text-[oklch(0.75_0.02_285)] text-sm leading-relaxed">{result.summary}</p>
          </div>

          {result.language_advice && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">🗣️ Language Advice</p>
              <p className="text-[oklch(0.75_0.02_285)] text-sm leading-relaxed">{result.language_advice}</p>
            </div>
          )}

          {/* Compare hint */}
          <div className="flex items-center gap-2 text-xs text-[oklch(0.45_0.02_285)] px-1">
            <span>⚖️</span>
            <span>Select 2–4 universities to compare them with AI · <strong>{compareIds.length}/4</strong> selected</span>
          </div>

          <div className="space-y-4 stagger">
            {result.recommendations.map((item, i) => {
              const isSelected = compareIds.includes(item.university_id);
              const disabled   = !isSelected && compareIds.length >= 4;
              return (
                <div key={item.university_id}
                  className={`bg-[oklch(0.17_0.02_285)] rounded-2xl border  p-5 transition ${
                    isSelected ? "border-indigo-400 ring-2 ring-indigo-100" : "border-gray-100"
                  }`}>
                  <div className="flex items-start gap-4">
                    <FitRing score={item.fit_score} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <span className="text-xs text-indigo-400 font-bold">#{i + 1} AI Pick</span>
                          <h3 className="font-bold text-white text-base leading-tight">{item.name}</h3>
                          <p className="text-sm text-[oklch(0.55_0.02_285)] mt-0.5">
                            📍 {item.city ? `${item.city}, ` : ""}{item.country}
                            {item.ranking && <span className="ml-3">🏆 #{item.ranking}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.tuition_fee_eur === 0 && <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full font-medium">{t("recommendations.freeTuition")}</span>}
                          {item.english_programs_available && <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">{t("recommendations.englishPrograms")}</span>}
                          {/* Compare toggle */}
                          <button
                            onClick={() => !disabled && toggleCompare(item.university_id)}
                            disabled={disabled}
                            title={disabled ? "Max 4 universities" : isSelected ? "Remove from compare" : "Add to compare"}
                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : disabled
                                  ? "bg-gray-50 text-[oklch(0.35_0.02_285)] border-gray-100 cursor-not-allowed"
                                  : "bg-white text-[oklch(0.80_0.14_296)] border-indigo-200 hover:bg-[oklch(0.19_0.028_285)]"
                            }`}
                          >
                            {isSelected ? "✓ Added" : "⊕ Compare"}
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 bg-[oklch(0.19_0.028_285)] rounded-xl px-4 py-3 border border-[oklch(0.55_0.22_296/0.20)]">
                        <p className="text-xs font-bold text-[oklch(0.80_0.14_296)] mb-1">{t("recommendations.whyMatchedYou")}</p>
                        <p className="text-sm text-[oklch(0.75_0.02_285)] leading-relaxed">{item.match_reason}</p>
                      </div>
                      <div className="mt-2 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
                        <p className="text-xs font-bold text-amber-600 mb-1">💡 Tips for you</p>
                        <p className="text-sm text-[oklch(0.75_0.02_285)] leading-relaxed">{item.tips}</p>
                      </div>
                      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                        <p className="text-sm text-[oklch(0.55_0.02_285)]">
                          💰 {item.tuition_fee_eur === 0 ? t("recommendations.freeTuition") : `€${item.tuition_fee_eur?.toLocaleString()}/year`}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => addToPipeline(item.university_id)}
                            disabled={!!pipelineAdded[item.university_id]}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                              pipelineAdded[item.university_id] === "done"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                            }`}>
                            {pipelineAdded[item.university_id] === "done" ? "✓ In Pipeline" : pipelineAdded[item.university_id] === "loading" ? "Adding…" : "🚀 Pipeline"}
                          </button>
                          <Link to={`/university/${item.university_id}`}
                            className="text-xs text-[oklch(0.80_0.14_296)] font-semibold hover:underline">
                            View details →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compare action bar */}
          {compareIds.length >= 2 && !compareResult && (
            <div className="sticky bottom-4 z-10">
              <button onClick={runCompare} disabled={compareLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-3 text-base">
                {compareLoading
                  ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Comparing…</>
                  : <>⚖️ Compare {compareIds.length} AI-Recommended Universities</>}
              </button>
            </div>
          )}

          {compareIds.length === 1 && (
            <p className="text-center text-xs text-[oklch(0.45_0.02_285)]">Select at least one more university to compare</p>
          )}

          {compareError && <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-sm">{compareError}</div>}

          {/* Compare results */}
          {compareResult && (
            <div className="space-y-4 border-t-2 border-[oklch(0.55_0.22_296/0.20)] pt-6 mt-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚖️</span>
                <h3 className="font-extrabold text-white text-lg">AI Comparison Results</h3>
              </div>

              {/* Winner banner */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-5">
                <p className="text-xs font-bold uppercase tracking-wide opacity-80 mb-1">🏆 Best Match For You</p>
                <p className="text-xl font-extrabold">{compareResult.winner}</p>
                <p className="text-sm mt-2 opacity-90 leading-relaxed">{compareResult.winner_reason}</p>
              </div>

              {/* Side-by-side cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {compareResult.universities.map(u => {
                  const isWinner = u.name === compareResult.winner;
                  return (
                    <div key={u.university_id}
                      className={`bg-[oklch(0.17_0.02_285)] rounded-2xl border  p-5 flex flex-col gap-3 ${isWinner ? "border-green-300 ring-2 ring-green-200" : "border-gray-100"}`}>
                      {isWinner && (
                        <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full self-start">🏆 Best for you</span>
                      )}
                      <div>
                        <h3 className="font-bold text-white text-sm">{u.name}</h3>
                        <p className="text-xs text-[oklch(0.45_0.02_285)] mt-0.5">📍 {u.city ? `${u.city}, ` : ""}{u.country}{u.ranking ? ` · #${u.ranking}` : ""}</p>
                        <p className="text-xs text-[oklch(0.55_0.02_285)] mt-1">💰 {u.tuition_fee_eur === 0 ? t("recommendations.freeTuition") : `€${u.tuition_fee_eur?.toLocaleString()}/yr`}</p>
                      </div>

                      <FitRing score={u.fit_score} />

                      <p className="text-xs text-[oklch(0.65_0.02_285)] italic border-l-2 border-indigo-300 pl-3">{u.verdict}</p>

                      <div>
                        <p className="text-xs font-bold text-green-600 mb-1.5">✅ Pros for you</p>
                        <ul className="space-y-1">
                          {u.pros.map((p, i) => <li key={i} className="text-xs text-[oklch(0.75_0.02_285)] flex gap-1.5"><span className="text-green-400 shrink-0">•</span>{p}</li>)}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-red-500 mb-1.5">⚠️ Cons for you</p>
                        <ul className="space-y-1">
                          {u.cons.map((c, i) => <li key={i} className="text-xs text-[oklch(0.75_0.02_285)] flex gap-1.5"><span className="text-red-300 shrink-0">•</span>{c}</li>)}
                        </ul>
                      </div>

                      {u.website && (
                        <a href={u.website} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline font-medium mt-auto">
                          {t("recommendations.visitLink")} →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Overall advice */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">💡 Overall Advice</p>
                <p className="text-[oklch(0.75_0.02_285)] text-sm leading-relaxed">{compareResult.overall_advice}</p>
              </div>

              <button onClick={() => { setCompareResult(null); setCompareIds([]); }}
                className="w-full border-2 border-indigo-200 text-[oklch(0.80_0.14_296)] font-semibold py-3 rounded-2xl hover:bg-[oklch(0.19_0.028_285)] transition text-sm">
                🔄 Clear comparison & reselect
              </button>
            </div>
          )}

          <button onClick={() => { setResult(null); setShowPicker(true); setCompareIds([]); setCompareResult(null); }}
            className="w-full border-2 border-indigo-200 text-[oklch(0.80_0.14_296)] font-semibold py-3 rounded-2xl hover:bg-[oklch(0.19_0.028_285)] transition text-sm">
            🔄 Change level & regenerate
          </button>
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   ⚖️ AI COMPARE TAB
══════════════════════════════════════════════════════ */
const CompareTab = ({ profile }) => {
  const { t } = useTranslation();
  const [level, setLevel] = useState("B1");

  useEffect(() => {
    if (!profile) return;
    const lang = profile.language?.toLowerCase() || "english";
    const saved = profile.placement_results?.[lang]?.level
      || profile.english_level?.toUpperCase()
      || "B1";
    setLevel(saved);
  }, [profile]);
  const [universities, setUniversities] = useState([]);
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingUnis, setLoadingUnis] = useState(true);

  useEffect(() => {
    api.get("/universities")
      .then(r => setUniversities(Array.isArray(r.data?.items) ? r.data.items : Array.isArray(r.data) ? r.data : []))
      .catch(() => setUniversities([]))
      .finally(() => setLoadingUnis(false));
  }, []);

  const toggle = (id) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 4 ? [...prev, id] : prev
    );
    setResult(null);
  };

  const compare = async () => {
    if (selected.length < 2) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await api.post("/ai-recommendations/compare", {
        university_ids: selected,
        language_level: level,
      });
      setResult(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || t("common.error"));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Language level */}
      <div className="bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(0.55_0.22_296/0.20)]  p-5">
        {(() => {
          const lang = profile?.language?.toLowerCase() || "english";
          return (
            <>
              <h3 className="font-bold text-white mb-3">{t("recommendations.languageLevelTitle")} ({lang.charAt(0).toUpperCase() + lang.slice(1)})</h3>
              <LevelSelector lang={lang} value={level} onChange={v => { setLevel(v); setResult(null); }} />
            </>
          );
        })()}
      </div>

      {/* University selector */}
      <div className="bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white">{t("recommendations.compareTitle")}</h3>
          <span className="text-xs text-[oklch(0.45_0.02_285)]">{selected.length}/4 selected</span>
        </div>

        {loadingUnis ? (
          <div className="text-center py-8 text-[oklch(0.45_0.02_285)] text-sm">{t("recommendations.loadingUni")}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {universities.map(u => {
              const isSelected = selected.includes(u.id);
              const disabled = !isSelected && selected.length >= 4;
              return (
                <button key={u.id} onClick={() => !disabled && toggle(u.id)}
                  disabled={disabled}
                  className={`text-left px-4 py-3 rounded-xl border text-sm transition ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : disabled
                        ? "bg-gray-50 text-[oklch(0.35_0.02_285)] border-gray-100 cursor-not-allowed"
                        : "bg-white text-[oklch(0.75_0.02_285)] border-gray-200 hover:border-indigo-300 hover:bg-[oklch(0.19_0.028_285)]"
                  }`}
                >
                  <p className="font-semibold truncate">{u.name}</p>
                  <p className={`text-xs mt-0.5 ${isSelected ? "text-indigo-200" : "text-[oklch(0.45_0.02_285)]"}`}>
                    {u.country} · {u.tuition_fee_eur === 0 ? t("common.free") : `€${u.tuition_fee_eur?.toLocaleString()}/yr`}
                    {u.ranking ? ` · #${u.ranking}` : ""}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {selected.length >= 2 && (
          <button onClick={compare} disabled={loading}
            className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t("recommendations.comparing")}</>
              : <>⚖️ Compare {selected.length} Universities</>}
          </button>
        )}
        {selected.length < 2 && (
          <p className="text-center text-xs text-[oklch(0.45_0.02_285)] mt-3">{t("recommendations.compareMin")}</p>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-sm">{error}</div>}

      {result && (
        <>
          {/* Winner banner */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-wide opacity-80 mb-1">🏆 Best Match For You</p>
            <p className="text-xl font-extrabold">{result.winner}</p>
            <p className="text-sm mt-2 opacity-90 leading-relaxed">{result.winner_reason}</p>
          </div>

          {/* Side-by-side cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.universities.map(u => {
              const isWinner = u.name === result.winner;
              return (
                <div key={u.university_id}
                  className={`bg-[oklch(0.17_0.02_285)] rounded-2xl border  p-5 flex flex-col gap-3 ${isWinner ? "border-green-300 ring-2 ring-green-200" : "border-gray-100"}`}>
                  {isWinner && (
                    <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full self-start">🏆 Best for you</span>
                  )}
                  <div>
                    <h3 className="font-bold text-white text-sm">{u.name}</h3>
                    <p className="text-xs text-[oklch(0.45_0.02_285)] mt-0.5">📍 {u.city ? `${u.city}, ` : ""}{u.country}{u.ranking ? ` · #${u.ranking}` : ""}</p>
                    <p className="text-xs text-[oklch(0.55_0.02_285)] mt-1">💰 {u.tuition_fee_eur === 0 ? t("recommendations.freeTuition") : `€${u.tuition_fee_eur?.toLocaleString()}/yr`}</p>
                  </div>

                  <FitRing score={u.fit_score} />

                  <p className="text-xs text-[oklch(0.65_0.02_285)] italic border-l-2 border-indigo-300 pl-3">{u.verdict}</p>

                  <div>
                    <p className="text-xs font-bold text-green-600 mb-1.5">✅ Pros for you</p>
                    <ul className="space-y-1">
                      {u.pros.map((p, i) => <li key={i} className="text-xs text-[oklch(0.75_0.02_285)] flex gap-1.5"><span className="text-green-400 shrink-0">•</span>{p}</li>)}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-red-500 mb-1.5">⚠️ Cons for you</p>
                    <ul className="space-y-1">
                      {u.cons.map((c, i) => <li key={i} className="text-xs text-[oklch(0.75_0.02_285)] flex gap-1.5"><span className="text-red-300 shrink-0">•</span>{c}</li>)}
                    </ul>
                  </div>

                  {u.website && (
                    <a href={u.website} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline font-medium mt-auto">
                      {t("recommendations.visitLink")} →
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overall advice */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">💡 Overall Advice</p>
            <p className="text-[oklch(0.75_0.02_285)] text-sm leading-relaxed">{result.overall_advice}</p>
          </div>

          <button onClick={() => { setResult(null); setSelected([]); }}
            className="w-full border-2 border-indigo-200 text-[oklch(0.80_0.14_296)] font-semibold py-3 rounded-2xl hover:bg-[oklch(0.19_0.028_285)] transition text-sm">
            🔄 Start a new comparison
          </button>
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   🔢 RULE-BASED TAB
══════════════════════════════════════════════════════ */

const FACTORS = [
  { key: "country_match", label: "Country Match", max: 30, color: "bg-blue-500",    icon: "🌍", tip: "How well this country matches your preferred destinations" },
  { key: "budget_fit",    label: "Budget Fit",    max: 30, color: "bg-emerald-500", icon: "💰", tip: "How well the estimated total annual cost (tuition + fees + living) fits your budget"    },
  { key: "english_fit",   label: "Language Fit",  max: 20, color: "bg-violet-500",  icon: "🗣️", tip: "Whether programs are taught in your target language at your level" },
  { key: "gpa_fit",       label: "GPA Fit",       max: 20, color: "bg-orange-500",  icon: "🎓", tip: "How your GPA compares to the estimated entry requirement"   },
];

const BreakdownPanel = ({ breakdown, reasons }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-4 border border-[oklch(0.55_0.22_296/0.20)] rounded-2xl overflow-hidden">
      <div className="bg-[oklch(0.19_0.028_285)] px-4 py-2.5 border-b border-[oklch(0.55_0.22_296/0.20)]">
        <p className="text-xs font-bold text-[oklch(0.85_0.10_296)] uppercase tracking-wide">{t("recommendations.scoreBreakdown")}</p>
      </div>
      <div className="px-4 py-3 space-y-3">
        {FACTORS.map(f => {
          const val = breakdown[f.key] ?? 0;
          const pct = Math.round((val / f.max) * 100);
          return (
            <div key={f.key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-[oklch(0.65_0.02_285)] font-semibold">
                  <span>{f.icon}</span>{f.label}
                  <span className="text-[oklch(0.45_0.02_285)] font-normal hidden sm:inline">— {f.tip}</span>
                </span>
                <span className="font-bold text-[oklch(0.75_0.02_285)]">{val.toFixed(1)}<span className="text-[oklch(0.45_0.02_285)] font-normal">/{f.max}</span></span>
              </div>
              <div className="h-2 bg-[oklch(0.20_0.024_285)] rounded-full overflow-hidden">
                <div className={`h-2 rounded-full ${f.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {reasons.length > 0 && (
        <div className="px-4 pb-4 pt-1 border-t border-[oklch(0.55_0.22_296/0.20)]">
          <p className="text-xs font-bold text-[oklch(0.55_0.02_285)] uppercase tracking-wide mb-2">{t("recommendations.whyMatchedYou")}</p>
          <ul className="space-y-1.5">
            {reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[oklch(0.65_0.02_285)]">
                <span className="text-indigo-400 shrink-0 mt-0.5">✓</span>{r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const MatchCard = ({ match, index }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const uni = match.university;
  const bd  = match.breakdown;

  const addToPipeline = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post("/pipeline", { university_id: uni.id });
      setAdded(true);
    } catch (err) {
      const detail = err?.response?.data?.detail || "";
      if (detail.toLowerCase().includes("already")) setAdded(true);
    } finally {
      setAdding(false);
    }
  };

  const topBar = match.score >= 75 ? "from-emerald-400 to-teal-500"
    : match.score >= 50 ? "from-amber-400 to-orange-500"
    : "from-rose-400 to-red-500";

  const rankBadge =
    index === 0 ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-white" :
    index === 1 ? "bg-gradient-to-r from-slate-300 to-slate-400 text-white"  :
    index === 2 ? "bg-gradient-to-r from-orange-400 to-amber-600 text-white" :
    "bg-gray-100 text-[oklch(0.55_0.02_285)]";

  return (
    <div className="bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] overflow-hidden card-lift">
      <div className={`h-1.5 bg-gradient-to-r ${topBar}`} />
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
            <FitRing score={match.score} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${rankBadge}`}>#{index + 1}</span>
                </div>
                <Link to={`/university/${uni.id}`}
                  state={{ score: match.score, reasons: match.reasons, breakdown: match.breakdown }}
                  className="text-lg font-bold text-white hover:text-[oklch(0.85_0.10_296)] transition">
                  {uni.name}
                </Link>
                <p className="text-[oklch(0.55_0.02_285)] text-sm mt-0.5">
                  📍 {uni.city}, {uni.country}
                  {uni.ranking && <span className="ml-3">🏆 #{uni.ranking}</span>}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {uni.tuition_fee_eur === 0 && <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] px-2.5 py-1 rounded-full font-semibold">✨ {t("recommendations.freeTuition")}</span>}
                {uni.english_programs_available && <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[11px] px-2.5 py-1 rounded-full font-semibold">🇬🇧 {t("recommendations.englishPrograms")}</span>}
                {uni.is_public && <span className="bg-gray-50 text-[oklch(0.65_0.02_285)] border border-[oklch(1_0_0/0.07)] text-[11px] px-2.5 py-1 rounded-full font-semibold">{t("recommendations.publicUni")}</span>}
              </div>
            </div>

            {match.reasons.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {match.reasons.slice(0, 2).map((r, i) => (
                  <span key={i} className="text-xs text-[oklch(0.55_0.02_285)] bg-gray-50 border border-[oklch(1_0_0/0.07)] px-3 py-1 rounded-full">{r}</span>
                ))}
                {match.reasons.length > 2 && !expanded && (
                  <span className="text-xs text-indigo-500 bg-[oklch(0.19_0.028_285)] border border-[oklch(0.55_0.22_296/0.20)] px-3 py-1 rounded-full">
                    +{match.reasons.length - 2} more
                  </span>
                )}
              </div>
            )}

            {expanded && <BreakdownPanel breakdown={bd} reasons={match.reasons} />}

            <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm text-[oklch(0.55_0.02_285)]">
                💰 {uni.tuition_fee_eur === 0 ? t("recommendations.freeTuition") : `€${uni.tuition_fee_eur?.toLocaleString()}/year`}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={addToPipeline}
                  disabled={adding || added}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                    added
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                  }`}>
                  {added ? "✓ In Pipeline" : adding ? "Adding…" : "🚀 Add to Pipeline"}
                </button>
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="text-xs font-bold text-[oklch(0.80_0.14_296)] bg-[oklch(0.19_0.028_285)] hover:bg-indigo-100 border border-[oklch(0.55_0.22_296/0.20)] px-3 py-1.5 rounded-lg transition"
                >
                  {expanded ? `▲ ${t("common.hide")}` : `▼ ${t("recommendations.scoreBreakdown")}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RuleBasedTab = () => {
  const { t } = useTranslation();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    api.post("/recommendations?top_n=10", {})
      .then(res => setResults(res.data.results))
      .catch(err => { if (err.response?.status === 404) setHasProfile(false); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-16 text-[oklch(0.45_0.02_285)]">{t("recommendations.findingBest")}</div>;
  if (!hasProfile) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">📋</div>
      <h2 className="text-xl font-bold text-white mb-3">{t("recommendations.setupFirst")}</h2>
      <p className="text-[oklch(0.55_0.02_285)] mb-6">{t("recommendations.setupFirstSub")}</p>
      <Link to="/profile" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">{t("recommendations.createProfile")}</Link>
    </div>
  );

  const visible = showAll ? results : results.slice(0, 5);

  return (
    <div className="space-y-4 stagger">
      <div className="bg-[oklch(0.19_0.028_285)] border border-[oklch(0.55_0.22_296/0.20)] rounded-2xl px-5 py-3 text-sm text-[oklch(0.85_0.10_296)]">
        {t("recommendations.howScores")}
      </div>
      {visible.map((match, index) => (
        <MatchCard key={match.university.id} match={match} index={index} />
      ))}
      {results.length > 5 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="w-full py-3 border-2 border-indigo-200 text-[oklch(0.80_0.14_296)] font-semibold rounded-2xl hover:bg-[oklch(0.19_0.028_285)] transition text-sm">
          {showAll ? "▲ Show less" : `▼ Show ${results.length - 5} more universities`}
        </button>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
const Recommendations = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState("rule");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get("/profiles/me").catch(() => {}).then(r => { if (r?.data) setProfile(r.data); });
  }, []);

  const TABS = [
    { id: "rule",    label: "Smart Match", icon: "🔢" },
    { id: "ai",      label: "AI Picks",    icon: "✨" },
    { id: "compare", label: "AI Compare",  icon: "⚖️" },
  ];

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <div className="relative overflow-hidden text-white" style={{ background: "oklch(0.15 0.020 285)" }}>
        <div className="absolute -top-24 -start-8 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
             style={{ background: "oklch(0.55 0.22 296 / 0.15)" }} />
        <div className="absolute -bottom-16 end-16 w-60 h-60 rounded-full blur-[80px] pointer-events-none"
             style={{ background: "oklch(0.50 0.20 264 / 0.12)" }} />
        <div className="relative max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full text-xs font-bold px-4 py-1.5 mb-4"
                   style={{ background: "oklch(0.55 0.22 296 / 0.12)", border: "1px solid oklch(0.55 0.22 296 / 0.28)", color: "oklch(0.88 0.08 296)" }}>
                🤖 AI-Powered Matching
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-white">
                {t("recommendations.title")}
              </h1>
              <p className="text-base max-w-md" style={{ color: "oklch(0.65 0.04 296)" }}>{t("recommendations.subtitle2")}</p>
            </div>
            <Link to="/profile"
              className="inline-flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition"
              style={{ background: "oklch(1 0 0 / 0.08)", border: "1px solid oklch(1 0 0 / 0.15)" }}
              onMouseEnter={e => e.currentTarget.style.background = "oklch(1 0 0 / 0.13)"}
              onMouseLeave={e => e.currentTarget.style.background = "oklch(1 0 0 / 0.08)"}>
              ⚙️ {t("profile.title")}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-7">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-2xl w-fit flex-wrap"
             style={{ background: "oklch(0.17 0.02 285)", border: "1px solid oklch(1 0 0 / 0.07)" }}>
          {TABS.map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition"
              style={{
                background: tab === tb.id ? "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))" : "transparent",
                color: tab === tb.id ? "#fff" : "oklch(0.55 0.02 285)",
              }}>
              <span>{tb.icon}</span> {tb.label}
            </button>
          ))}
        </div>

        {tab === "ai"      && <AiTab      profile={profile} />}
        {tab === "compare" && <CompareTab profile={profile} />}
        {tab === "rule"    && <RuleBasedTab />}
      </div>
    </div>
  );
};

export default Recommendations;

