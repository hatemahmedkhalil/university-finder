import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";
import { Icon, ICONS } from "../components/Sidebar";

/* ── Shared helpers ── */
const ScoreBar = ({ label, value, max = 30, color }) => (
  <div className="mb-2">
    <div className="flex justify-between text-xs text-[var(--ink-faint)] mb-1">
      <span>{label}</span><span>{value}/{max}</span>
    </div>
    <div className="h-2 bg-[var(--surface-hover)] rounded-full">
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
  const color = score >= 80 ? "var(--good)" : score >= 60 ? "var(--warn)" : "var(--danger)";
  const r = 26, circ = 2 * Math.PI * r;
  const dash = (displayed / 100) * circ;
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--surface-hover)" strokeWidth="5" />
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
      <p className="text-sm font-semibold text-[var(--ink-dim)] mb-2">
        {LANG_FLAG[lang] || <Icon d={ICONS.globe} size={13} />} {t("recommendations.languageLevelTitle")} ({lang.charAt(0).toUpperCase() + lang.slice(1)})
      </p>
      <div className="flex gap-2 flex-wrap">
        {LEVELS.map(l => (
          <button key={l} onClick={() => onChange(l)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              value === l
                ? "bg-sky-600 text-[var(--ink)] border-sky-600"
                : "bg-[var(--surface-hover)] text-[var(--ink-faint)] border-[var(--border)] hover:border-[var(--accent)]/50"
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
      <div className="bg-[var(--surface-2)] rounded-2xl border border-[var(--accent)]/25  p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-[var(--ink)]">{t("recommendations.languageLevelTitle")}</h3>
            <p className="text-xs text-[var(--ink-dim)] mt-0.5">
              {t("recommendations.subtitle")}
            </p>
          </div>
          <button onClick={() => setShowPicker(v => !v)}
            className="text-xs text-[var(--accent)] font-semibold hover:underline">
            {showPicker ? `${t("common.hide")} ▲` : `${t("recommendations.languageLevelTitle")} ▼`}
          </button>
        </div>

        {!showPicker && level && (() => {
          const lang = profile?.language?.toLowerCase() || "english";
          return (
            <span className="inline-flex items-center gap-1.5 bg-[var(--accent-subtle)] text-[var(--accent-light)] text-sm font-bold px-4 py-2 rounded-xl border border-[var(--accent)]/25">
              {LANG_FLAG[lang]} {lang.charAt(0).toUpperCase() + lang.slice(1)}: {level} — {LEVEL_LABELS[level]}
            </span>
          );
        })()}

        {showPicker && (
          <div className="pt-2">
            <LevelSelector lang={profile?.language?.toLowerCase() || "english"} value={level} onChange={setLevel} />
            <Link to="/learning" className="inline-block mt-3 text-xs text-sky-500 hover:underline">
              {t("recommendations.howScores")}
            </Link>
          </div>
        )}
      </div>

      {/* Generate button */}
      {!result && (
        <button onClick={run} disabled={loading}
          className="w-full bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 disabled:opacity-50 text-[var(--ink)] font-bold py-4 rounded-2xl transition flex items-center justify-center gap-3 text-base btn-press">
          {loading
            ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t("recommendations.analyzing")}</>
            : <>{t("recommendations.title")}</>}
        </button>
      )}

      {error && <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-sm">{error}</div>}

      {result && (
        <>
          <div className="rounded-2xl p-5" style={{ background: "var(--accent-subtle)", border: "1px solid var(--accent)" }}>
            <p className="text-xs font-bold text-sky-500 uppercase tracking-wide mb-2">AI Overall Advice</p>
            <p className="text-[var(--ink-dim)] text-sm leading-relaxed">{result.summary}</p>
          </div>

          {result.language_advice && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">Language Advice</p>
              <p className="text-[var(--ink-dim)] text-sm leading-relaxed">{result.language_advice}</p>
            </div>
          )}

          {/* Compare hint */}
          <div className="flex items-center gap-2 text-xs text-[var(--ink-dim)] px-1">
            <Icon d={ICONS.scale} size={14} />
            <span>Select 2–4 universities to compare them with AI · <strong>{compareIds.length}/4</strong> selected</span>
          </div>

          <div className="space-y-4 stagger">
            {result.recommendations.map((item, i) => {
              const isSelected = compareIds.includes(item.university_id);
              const disabled   = !isSelected && compareIds.length >= 4;
              return (
                <div key={item.university_id}
                  className={`bg-[var(--surface-2)] rounded-2xl border  p-5 transition ${
                    isSelected ? "border-sky-400 ring-2 ring-sky-100" : "border-gray-100"
                  }`}>
                  <div className="flex items-start gap-4">
                    <FitRing score={item.fit_score} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <span className="text-xs text-sky-400 font-bold">#{i + 1} AI Pick</span>
                          <h3 className="font-bold text-[var(--ink)] text-base leading-tight">{item.name}</h3>
                          <p className="text-sm text-[var(--ink-faint)] mt-0.5">
                            <Icon d={ICONS.pin} size={11} className="inline -mt-0.5" /> {item.city ? `${item.city}, ` : ""}{item.country}
                            {item.ranking && <span className="ml-3 inline-flex items-center gap-1"><Icon d={ICONS.award} size={11} /> #{item.ranking}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.tuition_fee_eur === 0 && <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full font-medium">{t("recommendations.freeTuition")}</span>}
                          {item.english_programs_available && <span className="bg-sky-50 text-sky-700 text-xs px-2 py-1 rounded-full font-medium">{t("recommendations.englishPrograms")}</span>}
                          {/* Compare toggle */}
                          <button
                            onClick={() => !disabled && toggleCompare(item.university_id)}
                            disabled={disabled}
                            title={disabled ? "Max 4 universities" : isSelected ? "Remove from compare" : "Add to compare"}
                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                              isSelected
                                ? "bg-sky-600 text-[var(--ink)] border-sky-600"
                                : disabled
                                  ? "bg-[var(--surface-2)] text-[var(--border)] border-gray-100 cursor-not-allowed"
                                  : "bg-[var(--surface)] text-[var(--accent)] border-sky-200 hover:bg-[var(--accent-subtle)]"
                            }`}
                          >
                            {isSelected ? "✓ Added" : "⊕ Compare"}
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 bg-[var(--accent-subtle)] rounded-xl px-4 py-3 border border-[var(--accent)]/25">
                        <p className="text-xs font-bold text-[var(--accent)] mb-1">{t("recommendations.whyMatchedYou")}</p>
                        <p className="text-sm text-[var(--ink-dim)] leading-relaxed">{item.match_reason}</p>
                      </div>
                      <div className="mt-2 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
                        <p className="text-xs font-bold text-amber-600 mb-1">Tips for you</p>
                        <p className="text-sm text-[var(--ink-dim)] leading-relaxed">{item.tips}</p>
                      </div>
                      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                        <p className="text-sm text-[var(--ink-faint)]">
                          <Icon d={ICONS.wallet} size={11} className="inline -mt-0.5" /> {item.tuition_fee_eur === 0 ? t("recommendations.freeTuition") : `€${item.tuition_fee_eur?.toLocaleString()}/year`}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => addToPipeline(item.university_id)}
                            disabled={!!pipelineAdded[item.university_id]}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                              pipelineAdded[item.university_id] === "done"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-sky-600 text-[var(--ink)] border-sky-600 hover:bg-sky-700"
                            }`}>
                            {pipelineAdded[item.university_id] === "done" ? "✓ In Pipeline" : pipelineAdded[item.university_id] === "loading" ? "Adding…" : "Pipeline"}
                          </button>
                          <Link to={`/university/${item.university_id}`}
                            className="text-xs text-[var(--accent)] font-semibold hover:underline">
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
                className="w-full bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 disabled:opacity-60 text-[var(--ink)] font-bold py-4 rounded-2xl transition flex items-center justify-center gap-3 text-base">
                {compareLoading
                  ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Comparing…</>
                  : <>Compare {compareIds.length} AI-Recommended Universities</>}
              </button>
            </div>
          )}

          {compareIds.length === 1 && (
            <p className="text-center text-xs text-[var(--ink-dim)]">Select at least one more university to compare</p>
          )}

          {compareError && <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-sm">{compareError}</div>}

          {/* Compare results */}
          {compareResult && (
            <div className="space-y-4 border-t-2 border-[var(--accent)]/25 pt-6 mt-2">
              <div className="flex items-center gap-2 mb-1">
                <Icon d={ICONS.scale} size={18} />
                <h3 className="font-extrabold text-[var(--ink)] text-lg">AI Comparison Results</h3>
              </div>

              {/* Winner banner */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-[var(--ink)] rounded-2xl p-5">
                <p className="text-xs font-bold uppercase tracking-wide opacity-80 mb-1">Best Match For You</p>
                <p className="text-xl font-extrabold">{compareResult.winner}</p>
                <p className="text-sm mt-2 opacity-90 leading-relaxed">{compareResult.winner_reason}</p>
              </div>

              {/* Side-by-side cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {compareResult.universities.map(u => {
                  const isWinner = u.name === compareResult.winner;
                  return (
                    <div key={u.university_id}
                      className={`bg-[var(--surface-2)] rounded-2xl border  p-5 flex flex-col gap-3 ${isWinner ? "border-green-300 ring-2 ring-green-200" : "border-gray-100"}`}>
                      {isWinner && (
                        <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full self-start">Best for you</span>
                      )}
                      <div>
                        <h3 className="font-bold text-[var(--ink)] text-sm">{u.name}</h3>
                        <p className="text-xs text-[var(--ink-dim)] mt-0.5"><Icon d={ICONS.pin} size={11} className="inline -mt-0.5" /> {u.city ? `${u.city}, ` : ""}{u.country}{u.ranking ? ` · #${u.ranking}` : ""}</p>
                        <p className="text-xs text-[var(--ink-faint)] mt-1"><Icon d={ICONS.wallet} size={11} className="inline -mt-0.5" /> {u.tuition_fee_eur === 0 ? t("recommendations.freeTuition") : `€${u.tuition_fee_eur?.toLocaleString()}/yr`}</p>
                      </div>

                      <FitRing score={u.fit_score} />

                      <p className="text-xs text-[var(--ink-faint)] italic border-l-2 border-sky-300 pl-3">{u.verdict}</p>

                      <div>
                        <p className="text-xs font-bold text-green-600 mb-1.5">Pros for you</p>
                        <ul className="space-y-1">
                          {u.pros.map((p, i) => <li key={i} className="text-xs text-[var(--ink-dim)] flex gap-1.5"><span className="text-green-400 shrink-0">•</span>{p}</li>)}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-red-500 mb-1.5">Cons for you</p>
                        <ul className="space-y-1">
                          {u.cons.map((c, i) => <li key={i} className="text-xs text-[var(--ink-dim)] flex gap-1.5"><span className="text-red-300 shrink-0">•</span>{c}</li>)}
                        </ul>
                      </div>

                      {u.website && (
                        <a href={u.website} target="_blank" rel="noreferrer"
                          className="text-xs text-sky-600 hover:underline font-medium mt-auto">
                          {t("recommendations.visitLink")} →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Overall advice */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">Overall Advice</p>
                <p className="text-[var(--ink-dim)] text-sm leading-relaxed">{compareResult.overall_advice}</p>
              </div>

              <button onClick={() => { setCompareResult(null); setCompareIds([]); }}
                className="w-full border-2 border-sky-200 text-[var(--accent)] font-semibold py-3 rounded-2xl hover:bg-[var(--accent-subtle)] transition text-sm">
                Clear comparison & reselect
              </button>
            </div>
          )}

          <button onClick={() => { setResult(null); setShowPicker(true); setCompareIds([]); setCompareResult(null); }}
            className="w-full border-2 border-sky-200 text-[var(--accent)] font-semibold py-3 rounded-2xl hover:bg-[var(--accent-subtle)] transition text-sm">
            Change level & regenerate
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
      <div className="bg-[var(--surface-2)] rounded-2xl border border-[var(--accent)]/25  p-5">
        {(() => {
          const lang = profile?.language?.toLowerCase() || "english";
          return (
            <>
              <h3 className="font-bold text-[var(--ink)] mb-3">{t("recommendations.languageLevelTitle")} ({lang.charAt(0).toUpperCase() + lang.slice(1)})</h3>
              <LevelSelector lang={lang} value={level} onChange={v => { setLevel(v); setResult(null); }} />
            </>
          );
        })()}
      </div>

      {/* University selector */}
      <div className="bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[var(--ink)]">{t("recommendations.compareTitle")}</h3>
          <span className="text-xs text-[var(--ink-dim)]">{selected.length}/4 selected</span>
        </div>

        {loadingUnis ? (
          <div className="text-center py-8 text-[var(--ink-dim)] text-sm">{t("recommendations.loadingUni")}</div>
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
                      ? "bg-sky-600 text-[var(--ink)] border-sky-600"
                      : disabled
                        ? "bg-[var(--surface-2)] text-[var(--border)] border-gray-100 cursor-not-allowed"
                        : "bg-[var(--surface)] text-[var(--ink-dim)] border-[var(--border)] hover:border-sky-300 hover:bg-[var(--accent-subtle)]"
                  }`}
                >
                  <p className="font-semibold truncate">{u.name}</p>
                  <p className={`text-xs mt-0.5 ${isSelected ? "text-sky-200" : "text-[var(--ink-dim)]"}`}>
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
            className="mt-4 w-full bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 disabled:opacity-50 text-[var(--ink)] font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t("recommendations.comparing")}</>
              : <>Compare {selected.length} Universities</>}
          </button>
        )}
        {selected.length < 2 && (
          <p className="text-center text-xs text-[var(--ink-dim)] mt-3">{t("recommendations.compareMin")}</p>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-sm">{error}</div>}

      {result && (
        <>
          {/* Winner banner */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-[var(--ink)] rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-wide opacity-80 mb-1">Best Match For You</p>
            <p className="text-xl font-extrabold">{result.winner}</p>
            <p className="text-sm mt-2 opacity-90 leading-relaxed">{result.winner_reason}</p>
          </div>

          {/* Side-by-side cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.universities.map(u => {
              const isWinner = u.name === result.winner;
              return (
                <div key={u.university_id}
                  className={`bg-[var(--surface-2)] rounded-2xl border  p-5 flex flex-col gap-3 ${isWinner ? "border-green-300 ring-2 ring-green-200" : "border-gray-100"}`}>
                  {isWinner && (
                    <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full self-start">Best for you</span>
                  )}
                  <div>
                    <h3 className="font-bold text-[var(--ink)] text-sm">{u.name}</h3>
                    <p className="text-xs text-[var(--ink-dim)] mt-0.5"><Icon d={ICONS.pin} size={11} className="inline -mt-0.5" /> {u.city ? `${u.city}, ` : ""}{u.country}{u.ranking ? ` · #${u.ranking}` : ""}</p>
                    <p className="text-xs text-[var(--ink-faint)] mt-1"><Icon d={ICONS.wallet} size={11} className="inline -mt-0.5" /> {u.tuition_fee_eur === 0 ? t("recommendations.freeTuition") : `€${u.tuition_fee_eur?.toLocaleString()}/yr`}</p>
                  </div>

                  <FitRing score={u.fit_score} />

                  <p className="text-xs text-[var(--ink-faint)] italic border-l-2 border-sky-300 pl-3">{u.verdict}</p>

                  <div>
                    <p className="text-xs font-bold text-green-600 mb-1.5">Pros for you</p>
                    <ul className="space-y-1">
                      {u.pros.map((p, i) => <li key={i} className="text-xs text-[var(--ink-dim)] flex gap-1.5"><span className="text-green-400 shrink-0">•</span>{p}</li>)}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-red-500 mb-1.5">Cons for you</p>
                    <ul className="space-y-1">
                      {u.cons.map((c, i) => <li key={i} className="text-xs text-[var(--ink-dim)] flex gap-1.5"><span className="text-red-300 shrink-0">•</span>{c}</li>)}
                    </ul>
                  </div>

                  {u.website && (
                    <a href={u.website} target="_blank" rel="noreferrer"
                      className="text-xs text-sky-600 hover:underline font-medium mt-auto">
                      {t("recommendations.visitLink")} →
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overall advice */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">Overall Advice</p>
            <p className="text-[var(--ink-dim)] text-sm leading-relaxed">{result.overall_advice}</p>
          </div>

          <button onClick={() => { setResult(null); setSelected([]); }}
            className="w-full inline-flex items-center justify-center gap-1.5 border-2 text-[var(--accent)] font-semibold py-3 rounded-2xl hover:bg-[var(--accent-subtle)] transition text-sm"
            style={{ borderColor: "rgba(14,165,233,0.3)" }}>
            <Icon d={ICONS.refresh} size={14} /> Start a new comparison
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
  { key: "country_match", label: "Country Match", max: 30, color: "bg-sky-500",    icon: "globe", tip: "How well this country matches your preferred destinations" },
  { key: "budget_fit",    label: "Budget Fit",    max: 30, color: "bg-emerald-500", icon: "wallet", tip: "How well the estimated total annual cost (tuition + fees + living) fits your budget"    },
  { key: "english_fit",   label: "Language Fit",  max: 20, color: "bg-violet-500",  icon: "mic", tip: "Whether programs are taught in your target language at your level" },
  { key: "gpa_fit",       label: "GPA Fit",       max: 20, color: "bg-orange-500",  icon: "graduationCap", tip: "How your GPA compares to the estimated entry requirement"   },
];

/* ── "Why this university?" — premium checklist cards derived from the
   real per-factor breakdown score (>=60% of a factor's max = criterion met),
   plus the backend's free-text reasons for nuance. No new data invented. ── */
const WhyThisUni = ({ breakdown, reasons }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-4 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--accent)", borderOpacity: 0.25, borderColor: "rgba(14,165,233,0.25)" }}>
      <div className="px-4 py-2.5" style={{ background: "var(--accent-subtle)", borderBottom: "1px solid rgba(14,165,233,0.25)" }}>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--accent-active)" }}>
          {t("recommendations.whyMatchedYou", "Why this university?")}
        </p>
      </div>

      {/* Checklist grid — one card per factor, pass/fail visual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
        {FACTORS.map(f => {
          const val = breakdown[f.key] ?? 0;
          const pct = val / f.max;
          const met = pct >= 0.6;
          return (
            <div key={f.key} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: "var(--surface-hover)" }}>
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] shrink-0"
                style={met ? { background: "var(--good)", color: "var(--on-accent)" } : { background: "var(--surface-2)", color: "var(--ink-faint)", border: "1px solid var(--border)" }}
              >
                {met ? "✓" : "–"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate" style={{ color: met ? "var(--ink)" : "var(--ink-faint)" }}>
                  <Icon d={ICONS[f.icon]} size={11} className="inline me-1 -mt-0.5" />{f.label}
                </p>
              </div>
              <span className="text-[11px] font-bold shrink-0" style={{ color: met ? "var(--good)" : "var(--ink-faint)" }}>
                {Math.round(pct * 100)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Score bars — precise breakdown for students who want the detail */}
      <div className="px-4 pb-3 space-y-3">
        {FACTORS.map(f => {
          const val = breakdown[f.key] ?? 0;
          const pct = Math.round((val / f.max) * 100);
          return (
            <div key={f.key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 font-medium" style={{ color: "var(--ink-faint)" }}>
                  {f.label} <span className="hidden sm:inline" style={{ color: "var(--ink-dim)" }}>— {f.tip}</span>
                </span>
                <span className="font-bold" style={{ color: "var(--ink-dim)" }}>{val.toFixed(1)}/{f.max}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-hover)" }}>
                <div className={`h-2 rounded-full ${f.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {reasons.length > 0 && (
        <div className="px-4 pb-4 pt-1" style={{ borderTop: "1px solid rgba(14,165,233,0.25)" }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--ink-faint)" }}>{t("recommendations.inYourOwnData", "In detail")}</p>
          <ul className="space-y-1.5">
            {reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--ink-faint)" }}>
                <span className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }}>✓</span>{r}
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
    index === 0 ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-[var(--ink)]" :
    index === 1 ? "bg-gradient-to-r from-slate-300 to-slate-400 text-[var(--ink)]"  :
    index === 2 ? "bg-gradient-to-r from-orange-400 to-amber-600 text-[var(--ink)]" :
    "bg-[var(--surface-2)] text-[var(--ink-faint)]";

  return (
    <div className="bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] overflow-hidden card-lift">
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
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${rankBadge}`} style={index > 2 ? {} : { color: "#3b2a06" }}>#{index + 1}</span>
                </div>
                <Link to={`/university/${uni.id}`}
                  state={{ score: match.score, reasons: match.reasons, breakdown: match.breakdown }}
                  className="text-lg font-bold text-[var(--ink)] hover:text-[var(--accent-light)] transition">
                  {uni.name}
                </Link>
                <p className="text-[var(--ink-faint)] text-sm mt-0.5">
                  <Icon d={ICONS.pin} size={11} className="inline -mt-0.5" /> {uni.city}, {uni.country}
                  {uni.ranking && <span className="ml-3 inline-flex items-center gap-1"><Icon d={ICONS.award} size={11} /> #{uni.ranking}</span>}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {uni.tuition_fee_eur === 0 && <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold" style={{ background: "var(--good-subtle)", color: "var(--good)" }}>{t("recommendations.freeTuition")}</span>}
                {uni.english_programs_available && <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold" style={{ background: "var(--accent-subtle)", color: "var(--accent-active)" }}>🇬🇧 {t("recommendations.englishPrograms")}</span>}
                {uni.is_public && <span className="bg-[var(--surface-2)] text-[var(--ink-faint)] border border-[var(--border)] text-[11px] px-2.5 py-1 rounded-full font-semibold">{t("recommendations.publicUni")}</span>}
              </div>
            </div>

            {match.reasons.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {match.reasons.slice(0, 2).map((r, i) => (
                  <span key={i} className="text-xs text-[var(--ink-faint)] bg-[var(--surface-2)] border border-[var(--border)] px-3 py-1 rounded-full">{r}</span>
                ))}
                {match.reasons.length > 2 && !expanded && (
                  <span className="text-xs text-sky-500 bg-[var(--accent-subtle)] border border-[var(--accent)]/25 px-3 py-1 rounded-full">
                    +{match.reasons.length - 2} more
                  </span>
                )}
              </div>
            )}

            {expanded && <WhyThisUni breakdown={bd} reasons={match.reasons} />}

            <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm text-[var(--ink-faint)]">
                <Icon d={ICONS.wallet} size={11} className="inline -mt-0.5" /> {uni.tuition_fee_eur === 0 ? t("recommendations.freeTuition") : `€${uni.tuition_fee_eur?.toLocaleString()}/year`}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={addToPipeline}
                  disabled={adding || added}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border transition"
                  style={added
                    ? { background: "var(--good-subtle)", color: "var(--good)", borderColor: "var(--good)" }
                    : { background: "var(--accent)", color: "var(--on-accent)", borderColor: "var(--accent)" }}>
                  {added ? "✓ In Pipeline" : adding ? "Adding…" : "Add to Pipeline"}
                </button>
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="text-xs font-bold text-[var(--accent)] bg-[var(--accent-subtle)] hover:opacity-80 border px-3 py-1.5 rounded-lg transition" style={{ borderColor: "rgba(14,165,233,0.3)" }}
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
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    api.post("/recommendations?top_n=10", {})
      .then(res => setResults(res.data.results))
      .catch(err => {
        if (err.response?.status === 404) setHasProfile(false);
        else setError(err.response?.data?.detail || t("common.error"));
      })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  if (loading) return <div className="text-center py-16 text-[var(--ink-dim)]">{t("recommendations.findingBest")}</div>;
  if (!hasProfile) return (
    <div className="text-center py-20">
      <div className="mb-4 flex justify-center"><Icon d={ICONS.applications} size={40} /></div>
      <h2 className="text-xl font-bold text-[var(--ink)] mb-3">{t("recommendations.setupFirst")}</h2>
      <p className="text-[var(--ink-faint)] mb-6">{t("recommendations.setupFirstSub")}</p>
      <Link to="/profile" className="bg-sky-600 text-[var(--ink)] px-6 py-3 rounded-xl font-semibold hover:bg-sky-700 transition">{t("recommendations.createProfile")}</Link>
    </div>
  );
  if (error) return (
    <div className="text-center py-20">
      <div className="mb-4 flex justify-center"><Icon d={ICONS.applications} size={40} /></div>
      <h2 className="text-xl font-bold text-[var(--ink)] mb-3">{t("common.error")}</h2>
      <p className="text-[var(--ink-faint)] mb-6">{error}</p>
      <button onClick={load} className="bg-sky-600 text-[var(--ink)] px-6 py-3 rounded-xl font-semibold hover:bg-sky-700 transition">{t("common.retry", "Retry")}</button>
    </div>
  );

  const visible = showAll ? results : results.slice(0, 5);

  return (
    <div className="space-y-4 stagger">
      <div className="bg-[var(--accent-subtle)] border border-[var(--accent)]/25 rounded-2xl px-5 py-3 text-sm text-[var(--accent-light)]">
        {t("recommendations.howScores")}
      </div>
      {visible.map((match, index) => (
        <MatchCard key={match.university.id} match={match} index={index} />
      ))}
      {results.length > 5 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="w-full py-3 border-2 border-sky-200 text-[var(--accent)] font-semibold rounded-2xl hover:bg-[var(--accent-subtle)] transition text-sm">
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
    { id: "rule",    label: "Smart Match", icon: "grid" },
    { id: "ai",      label: "AI Picks",    icon: "sparkle" },
    { id: "compare", label: "AI Compare",  icon: "scale" },
  ];

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <div className="relative overflow-hidden text-[var(--ink)]" style={{ background: "var(--bg)" }}>
        <div className="absolute -top-24 -start-8 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
             style={{ background: "rgba(14,165,233,0.15)" }} />
        <div className="absolute -bottom-16 end-16 w-60 h-60 rounded-full blur-[80px] pointer-events-none"
             style={{ background: "rgba(56,189,248,0.12)" }} />
        <div className="relative max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full text-xs font-bold px-4 py-1.5 mb-4"
                   style={{ background: "var(--accent-subtle)", border: "1px solid var(--accent)", color: "var(--accent)" }}>
                AI-Powered Matching
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-[var(--ink)]">
                {t("recommendations.title")}
              </h1>
              <p className="text-base max-w-md" style={{ color: "var(--ink-faint)" }}>{t("recommendations.subtitle2")}</p>
            </div>
            <Link to="/profile"
              className="inline-flex items-center gap-2 text-[var(--ink)] text-sm font-bold px-5 py-2.5 rounded-xl transition"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--surface-2)"}>
              {t("profile.title")}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-7">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-2xl w-fit flex-wrap"
             style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          {TABS.map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition"
              style={{
                background: tab === tb.id ? "linear-gradient(135deg, var(--accent), var(--accent))" : "transparent",
                color: tab === tb.id ? "#fff" : "var(--ink-faint)",
              }}>
              <Icon d={ICONS[tb.icon]} size={14} /> {tb.label}
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

