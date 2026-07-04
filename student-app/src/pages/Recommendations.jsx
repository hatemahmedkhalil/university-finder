import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

/* ── Shared helpers ── */
const ScoreBar = ({ label, value, max = 30, color }) => (
  <div className="mb-2">
    <div className="flex justify-between text-xs text-gray-500 mb-1">
      <span>{label}</span><span>{value}/{max}</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  </div>
);

const ScoreCircle = ({ score }) => {
  const color = score >= 75 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-500";
  return <div className={`text-3xl font-bold ${color}`}>{score}</div>;
};

const FitRing = ({ score }) => {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDisplayed(score), 80);
    return () => clearTimeout(t);
  }, [score]);
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const r = 22, circ = 2 * Math.PI * r;
  const dash = (displayed / 100) * circ;
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.22,1,0.36,1)" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>{score}%</div>
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
      <p className="text-sm font-semibold text-gray-700 mb-2">
        {LANG_FLAG[lang] || "🌍"} {t("recommendations.languageLevelTitle")} ({lang.charAt(0).toUpperCase() + lang.slice(1)})
      </p>
      <div className="flex gap-2 flex-wrap">
        {LEVELS.map(l => (
          <button key={l} onClick={() => onChange(l)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              value === l
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
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
      <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-800">{t("recommendations.languageLevelTitle")}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {t("recommendations.subtitle")}
            </p>
          </div>
          <button onClick={() => setShowPicker(v => !v)}
            className="text-xs text-indigo-600 font-semibold hover:underline">
            {showPicker ? `${t("common.hide")} ▲` : `${t("recommendations.languageLevelTitle")} ▼`}
          </button>
        </div>

        {!showPicker && level && (() => {
          const lang = profile?.language?.toLowerCase() || "english";
          return (
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm font-bold px-4 py-2 rounded-xl border border-indigo-100">
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
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-3 text-base shadow-lg btn-press">
          {loading
            ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t("recommendations.analyzing")}</>
            : <>✨ {t("recommendations.title")}</>}
        </button>
      )}

      {error && <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-sm">{error}</div>}

      {result && (
        <>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-2">✨ AI Overall Advice</p>
            <p className="text-gray-700 text-sm leading-relaxed">{result.summary}</p>
          </div>

          {result.language_advice && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">🗣️ Language Advice</p>
              <p className="text-gray-700 text-sm leading-relaxed">{result.language_advice}</p>
            </div>
          )}

          {/* Compare hint */}
          <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
            <span>⚖️</span>
            <span>Select 2–4 universities to compare them with AI · <strong>{compareIds.length}/4</strong> selected</span>
          </div>

          <div className="space-y-4 stagger">
            {result.recommendations.map((item, i) => {
              const isSelected = compareIds.includes(item.university_id);
              const disabled   = !isSelected && compareIds.length >= 4;
              return (
                <div key={item.university_id}
                  className={`bg-white rounded-2xl border shadow-sm p-5 transition ${
                    isSelected ? "border-indigo-400 ring-2 ring-indigo-100" : "border-gray-100"
                  }`}>
                  <div className="flex items-start gap-4">
                    <FitRing score={item.fit_score} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <span className="text-xs text-indigo-400 font-bold">#{i + 1} AI Pick</span>
                          <h3 className="font-bold text-gray-900 text-base leading-tight">{item.name}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">
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
                                  ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                  : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            }`}
                          >
                            {isSelected ? "✓ Added" : "⊕ Compare"}
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-100">
                        <p className="text-xs font-bold text-indigo-600 mb-1">{t("recommendations.whyMatchedYou")}</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{item.match_reason}</p>
                      </div>
                      <div className="mt-2 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
                        <p className="text-xs font-bold text-amber-600 mb-1">💡 Tips for you</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{item.tips}</p>
                      </div>
                      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                        <p className="text-sm text-gray-500">
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
                            className="text-xs text-indigo-600 font-semibold hover:underline">
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
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl shadow-xl transition flex items-center justify-center gap-3 text-base">
                {compareLoading
                  ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Comparing…</>
                  : <>⚖️ Compare {compareIds.length} AI-Recommended Universities</>}
              </button>
            </div>
          )}

          {compareIds.length === 1 && (
            <p className="text-center text-xs text-gray-400">Select at least one more university to compare</p>
          )}

          {compareError && <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-sm">{compareError}</div>}

          {/* Compare results */}
          {compareResult && (
            <div className="space-y-4 border-t-2 border-indigo-100 pt-6 mt-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚖️</span>
                <h3 className="font-extrabold text-gray-900 text-lg">AI Comparison Results</h3>
              </div>

              {/* Winner banner */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-5 shadow-lg">
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
                      className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-3 ${isWinner ? "border-green-300 ring-2 ring-green-200" : "border-gray-100"}`}>
                      {isWinner && (
                        <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full self-start">🏆 Best for you</span>
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{u.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">📍 {u.city ? `${u.city}, ` : ""}{u.country}{u.ranking ? ` · #${u.ranking}` : ""}</p>
                        <p className="text-xs text-gray-500 mt-1">💰 {u.tuition_fee_eur === 0 ? t("recommendations.freeTuition") : `€${u.tuition_fee_eur?.toLocaleString()}/yr`}</p>
                      </div>

                      <FitRing score={u.fit_score} />

                      <p className="text-xs text-gray-600 italic border-l-2 border-indigo-300 pl-3">{u.verdict}</p>

                      <div>
                        <p className="text-xs font-bold text-green-600 mb-1.5">✅ Pros for you</p>
                        <ul className="space-y-1">
                          {u.pros.map((p, i) => <li key={i} className="text-xs text-gray-700 flex gap-1.5"><span className="text-green-400 shrink-0">•</span>{p}</li>)}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-red-500 mb-1.5">⚠️ Cons for you</p>
                        <ul className="space-y-1">
                          {u.cons.map((c, i) => <li key={i} className="text-xs text-gray-700 flex gap-1.5"><span className="text-red-300 shrink-0">•</span>{c}</li>)}
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
                <p className="text-gray-700 text-sm leading-relaxed">{compareResult.overall_advice}</p>
              </div>

              <button onClick={() => { setCompareResult(null); setCompareIds([]); }}
                className="w-full border-2 border-indigo-200 text-indigo-600 font-semibold py-3 rounded-2xl hover:bg-indigo-50 transition text-sm">
                🔄 Clear comparison & reselect
              </button>
            </div>
          )}

          <button onClick={() => { setResult(null); setShowPicker(true); setCompareIds([]); setCompareResult(null); }}
            className="w-full border-2 border-indigo-200 text-indigo-600 font-semibold py-3 rounded-2xl hover:bg-indigo-50 transition text-sm">
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
      <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5">
        {(() => {
          const lang = profile?.language?.toLowerCase() || "english";
          return (
            <>
              <h3 className="font-bold text-gray-800 mb-3">{t("recommendations.languageLevelTitle")} ({lang.charAt(0).toUpperCase() + lang.slice(1)})</h3>
              <LevelSelector lang={lang} value={level} onChange={v => { setLevel(v); setResult(null); }} />
            </>
          );
        })()}
      </div>

      {/* University selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">{t("recommendations.compareTitle")}</h3>
          <span className="text-xs text-gray-400">{selected.length}/4 selected</span>
        </div>

        {loadingUnis ? (
          <div className="text-center py-8 text-gray-400 text-sm">{t("recommendations.loadingUni")}</div>
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
                        ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                        : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <p className="font-semibold truncate">{u.name}</p>
                  <p className={`text-xs mt-0.5 ${isSelected ? "text-indigo-200" : "text-gray-400"}`}>
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
          <p className="text-center text-xs text-gray-400 mt-3">{t("recommendations.compareMin")}</p>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-sm">{error}</div>}

      {result && (
        <>
          {/* Winner banner */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-5 shadow-lg">
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
                  className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-3 ${isWinner ? "border-green-300 ring-2 ring-green-200" : "border-gray-100"}`}>
                  {isWinner && (
                    <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full self-start">🏆 Best for you</span>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{u.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">📍 {u.city ? `${u.city}, ` : ""}{u.country}{u.ranking ? ` · #${u.ranking}` : ""}</p>
                    <p className="text-xs text-gray-500 mt-1">💰 {u.tuition_fee_eur === 0 ? t("recommendations.freeTuition") : `€${u.tuition_fee_eur?.toLocaleString()}/yr`}</p>
                  </div>

                  <FitRing score={u.fit_score} />

                  <p className="text-xs text-gray-600 italic border-l-2 border-indigo-300 pl-3">{u.verdict}</p>

                  <div>
                    <p className="text-xs font-bold text-green-600 mb-1.5">✅ Pros for you</p>
                    <ul className="space-y-1">
                      {u.pros.map((p, i) => <li key={i} className="text-xs text-gray-700 flex gap-1.5"><span className="text-green-400 shrink-0">•</span>{p}</li>)}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-red-500 mb-1.5">⚠️ Cons for you</p>
                    <ul className="space-y-1">
                      {u.cons.map((c, i) => <li key={i} className="text-xs text-gray-700 flex gap-1.5"><span className="text-red-300 shrink-0">•</span>{c}</li>)}
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
            <p className="text-gray-700 text-sm leading-relaxed">{result.overall_advice}</p>
          </div>

          <button onClick={() => { setResult(null); setSelected([]); }}
            className="w-full border-2 border-indigo-200 text-indigo-600 font-semibold py-3 rounded-2xl hover:bg-indigo-50 transition text-sm">
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
    <div className="mt-4 border border-indigo-100 rounded-2xl overflow-hidden">
      <div className="bg-indigo-50 px-4 py-2.5 border-b border-indigo-100">
        <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">{t("recommendations.scoreBreakdown")}</p>
      </div>
      <div className="px-4 py-3 space-y-3">
        {FACTORS.map(f => {
          const val = breakdown[f.key] ?? 0;
          const pct = Math.round((val / f.max) * 100);
          return (
            <div key={f.key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-gray-600 font-semibold">
                  <span>{f.icon}</span>{f.label}
                  <span className="text-gray-400 font-normal hidden sm:inline">— {f.tip}</span>
                </span>
                <span className="font-bold text-gray-700">{val.toFixed(1)}<span className="text-gray-400 font-normal">/{f.max}</span></span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-2 rounded-full ${f.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {reasons.length > 0 && (
        <div className="px-4 pb-4 pt-1 border-t border-indigo-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t("recommendations.whyMatchedYou")}</p>
          <ul className="space-y-1.5">
            {reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
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
    "bg-gray-100 text-gray-500";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden card-lift">
      <div className={`h-1.5 bg-gradient-to-r ${topBar}`} />
      <div className="p-6">
        <div className="flex items-start gap-5">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${rankBadge}`}>#{index + 1}</span>
            <FitRing score={match.score} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <Link to={`/university/${uni.id}`}
                  state={{ score: match.score, reasons: match.reasons, breakdown: match.breakdown }}
                  className="text-lg font-bold text-gray-900 hover:text-indigo-700 transition">
                  {uni.name}
                </Link>
                <p className="text-gray-500 text-sm mt-0.5">
                  📍 {uni.city}, {uni.country}
                  {uni.ranking && <span className="ml-3">🏆 #{uni.ranking}</span>}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {uni.tuition_fee_eur === 0 && <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] px-2.5 py-1 rounded-full font-semibold">✨ {t("recommendations.freeTuition")}</span>}
                {uni.english_programs_available && <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[11px] px-2.5 py-1 rounded-full font-semibold">🇬🇧 {t("recommendations.englishPrograms")}</span>}
                {uni.is_public && <span className="bg-gray-50 text-gray-600 border border-gray-100 text-[11px] px-2.5 py-1 rounded-full font-semibold">{t("recommendations.publicUni")}</span>}
              </div>
            </div>

            {match.reasons.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {match.reasons.slice(0, 2).map((r, i) => (
                  <span key={i} className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">{r}</span>
                ))}
                {match.reasons.length > 2 && !expanded && (
                  <span className="text-xs text-indigo-500 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                    +{match.reasons.length - 2} more
                  </span>
                )}
              </div>
            )}

            {expanded && <BreakdownPanel breakdown={bd} reasons={match.reasons} />}

            <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm text-gray-500">
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
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-lg transition"
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

  if (loading) return <div className="text-center py-16 text-gray-400">{t("recommendations.findingBest")}</div>;
  if (!hasProfile) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">📋</div>
      <h2 className="text-xl font-bold text-gray-800 mb-3">{t("recommendations.setupFirst")}</h2>
      <p className="text-gray-500 mb-6">{t("recommendations.setupFirstSub")}</p>
      <Link to="/profile" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">{t("recommendations.createProfile")}</Link>
    </div>
  );

  const visible = showAll ? results : results.slice(0, 5);

  return (
    <div className="space-y-4 stagger">
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3 text-sm text-indigo-700">
        {t("recommendations.howScores")}
      </div>
      {visible.map((match, index) => (
        <MatchCard key={match.university.id} match={match} index={index} />
      ))}
      {results.length > 5 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="w-full py-3 border-2 border-indigo-200 text-indigo-600 font-semibold rounded-2xl hover:bg-indigo-50 transition text-sm">
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
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-violet-900 to-purple-950 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-8 left-12 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-16 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-fuchsia-400/15 rounded-full blur-3xl -translate-x-1/2" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-violet-200 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
                🤖 AI-Powered Matching
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
                {t("recommendations.title")}
              </h1>
              <p className="text-indigo-200 text-base max-w-md">{t("recommendations.subtitle2")}</p>
            </div>
            <Link to="/profile"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
              ⚙️ {t("profile.title")}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Tabs */}
        <div className="flex gap-1.5 mb-6 bg-white border border-gray-100 shadow-sm p-1.5 rounded-2xl w-fit flex-wrap">
          {TABS.map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
                tab === tb.id
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}>
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
