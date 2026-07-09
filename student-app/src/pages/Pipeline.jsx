import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { countryFlag } from "../lib/countries";

/* ─── constants ─── */
const COLUMN_IDS = [
  { id: "shortlisted", labelKey: "shortlisted", icon: "📋", color: "indigo",  next: "preparing" },
  { id: "preparing",   labelKey: "preparing",   icon: "📝", color: "amber",   next: "ready" },
  { id: "ready",       labelKey: "ready",       icon: "✅", color: "sky",     next: "submitted" },
  { id: "submitted",   labelKey: "submitted",   icon: "📤", color: "purple",  next: "decision" },
  { id: "decision",    labelKey: "decision",    icon: "🎯", color: "emerald", next: null },
];

const COL_STYLES = {
  indigo:  { header: "border-indigo-500/40 bg-indigo-500/10",  badge: "bg-indigo-500 text-white", dot: "bg-indigo-400" },
  amber:   { header: "border-amber-500/40 bg-amber-500/10",    badge: "bg-amber-500 text-white",   dot: "bg-amber-400" },
  sky:     { header: "border-sky-500/40 bg-sky-500/10",        badge: "bg-sky-500 text-white",     dot: "bg-sky-400" },
  purple:  { header: "border-purple-500/40 bg-purple-500/10",  badge: "bg-purple-500 text-white",  dot: "bg-purple-400" },
  emerald: { header: "border-emerald-500/40 bg-emerald-500/10",badge: "bg-emerald-500 text-white", dot: "bg-emerald-400" },
};

const DECISION_STYLES = {
  accepted:   "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  rejected:   "bg-red-500/20 text-red-300 border-red-500/40",
  waitlisted: "bg-amber-500/20 text-amber-300 border-amber-500/40",
};

const scoreColor = (s) =>
  !s ? "text-slate-400" :
  s >= 75 ? "text-emerald-400" :
  s >= 50 ? "text-amber-400" :
  "text-red-400";

const scoreBg = (s) =>
  !s ? "bg-slate-700" :
  s >= 75 ? "bg-emerald-500/20 border-emerald-500/40" :
  s >= 50 ? "bg-amber-500/20 border-amber-500/40" :
  "bg-red-500/20 border-red-500/40";


/* ─── Add University Modal ─── */
const useAnalyzingMsg = (active) => {
  const { t } = useTranslation();
  const msgs = [
    t("pipeline.analyzingStep1"),
    t("pipeline.analyzingStep2"),
    t("pipeline.analyzingStep3"),
    t("pipeline.analyzingStep4"),
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) { setIdx(0); return; }
    const id = setInterval(() => setIdx(i => (i + 1) % msgs.length), 1800);
    return () => clearInterval(id);
  }, [active]);
  return msgs[idx];
};

function AddModal({ onAdd, onClose, adding }) {
  const { t } = useTranslation();
  const analyzingMsg = useAnalyzingMsg(adding);
  const [unis, setUnis] = useState([]);
  const [loadingUnis, setLoadingUnis] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const inputRef = useRef();

  useEffect(() => {
    // Max limit=100, fetch two pages to cover all 58+ universities
    Promise.all([
      api.get("/universities?limit=100&skip=0"),
      api.get("/universities?limit=100&skip=100"),
    ]).then(([r1, r2]) => {
      const page1 = r1.data?.items || [];
      const page2 = r2.data?.items || [];
      setUnis([...page1, ...page2]);
    }).catch(() => {})
      .finally(() => setLoadingUnis(false));
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const q = query.toLowerCase().trim();
  const filtered = q
    ? unis.filter(u => u.name.toLowerCase().includes(q) || u.city.toLowerCase().includes(q) || u.country.toLowerCase().includes(q))
    : unis;

  // Highlight matching text
  const highlight = (text) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      <>{text.slice(0, idx)}<mark className="bg-indigo-500/40 text-white rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}</>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-white font-bold text-lg">{t("pipeline.addTitle")}</h2>
          <p className="text-slate-400 text-sm mt-0.5">{t("pipeline.addSubtitle")}</p>
        </div>
        <div className="p-4 space-y-2">
          {/* Search input */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              ref={inputRef}
              type="text"
              placeholder={t("pipeline.searchPlaceholder")}
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null); }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
            />
            {query && (
              <button onClick={() => { setQuery(""); setSelected(null); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-slate-500">
              {loadingUnis ? t("common.loading") : q ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""}` : `${unis.length} universities`}
            </span>
            {selected && <span className="text-xs text-indigo-400 font-medium">✓ {selected.name}</span>}
          </div>

          {/* University list */}
          <div className="border border-slate-700/60 rounded-xl overflow-hidden">
            {loadingUnis ? (
              <div className="py-8 text-center text-slate-500 text-sm">{t("pipeline.loadingUnis")}</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">{t("pipeline.noMatch", { query })}</div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                {filtered.map(u => (
                  <button
                    key={u.id}
                    onClick={() => setSelected(selected?.id === u.id ? null : u)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-3 ${
                      selected?.id === u.id
                        ? "bg-indigo-600 text-white"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-xl shrink-0">{countryFlag(u.country)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{highlight(u.name)}</div>
                      <div className={`text-xs mt-0.5 ${selected?.id === u.id ? "text-indigo-200" : "text-slate-500"}`}>
                        {highlight(u.city)}, {highlight(u.country)}
                        {u.ranking && <span className="ml-2 opacity-70">#{u.ranking}</span>}
                      </div>
                    </div>
                    {selected?.id === u.id && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors">{t("common.cancel")}</button>
          <button
            onClick={() => selected && onAdd(selected.id)}
            disabled={!selected || adding}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {adding ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg> {analyzingMsg}</>
            ) : t("pipeline.addAnalyze")}
          </button>
        </div>
      </div>
    </div>
  );
}

const ACTION_TYPE_STYLES = {
  document: { icon: "📄", color: "bg-blue-500/20 border-blue-500/40 text-blue-300", dot: "bg-blue-400" },
  account:  { icon: "👤", color: "bg-purple-500/20 border-purple-500/40 text-purple-300", dot: "bg-purple-400" },
  portal:   { icon: "🌐", color: "bg-sky-500/20 border-sky-500/40 text-sky-300", dot: "bg-sky-400" },
  payment:  { icon: "💳", color: "bg-red-500/20 border-red-500/40 text-red-300", dot: "bg-red-400" },
  email:    { icon: "📧", color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300", dot: "bg-emerald-400" },
  info:     { icon: "ℹ️", color: "bg-amber-500/20 border-amber-500/40 text-amber-300", dot: "bg-amber-400" },
};

/* ─── Card Detail Modal ─── */
function CardDetail({ entry, onClose, onUpdate, onDelete, onRegenerate }) {
  const { t } = useTranslation();
  const [letter, setLetter] = useState(entry.motivation_letter || "");
  const [letterDirty, setLetterDirty] = useState(false);
  const [notes, setNotes] = useState(entry.notes || "");
  const [notesDirty, setNotesDirty] = useState(false);
  const [checklist, setChecklist] = useState(entry.checklist || []);
  const [moving, setMoving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("analysis");
  const [guide, setGuide] = useState(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideFetched, setGuideFetched] = useState(false);

  const uni = entry.university;
  const COLUMNS = COLUMN_IDS.map(c => ({ ...c, label: t(`pipeline.columns.${c.labelKey}`) }));
  const col = COLUMNS.find(c => c.id === entry.status);
  const gaps = Array.isArray(entry.fit_gaps) ? entry.fit_gaps : [];
  const strengths = gaps.filter(g => g.startsWith("Strengths:")).map(g => g.replace("Strengths: ", "").split(", ")).flat();
  const realGaps = gaps.filter(g => !g.startsWith("Strengths:"));

  const moveStatus = async (status) => {
    setMoving(true);
    try {
      const updated = await onUpdate(entry.id, { status });
      if (updated) onClose();
    } finally { setMoving(false); }
  };

  const saveLetter = async () => {
    setSaving(true);
    await onUpdate(entry.id, { motivation_letter: letter });
    setLetterDirty(false);
    setSaving(false);
    toast.success(t("pipeline.letterSaved"));
  };

  const saveNotes = async () => {
    await onUpdate(entry.id, { notes });
    setNotesDirty(false);
    toast.success(t("pipeline.notesSaved"));
  };

  const toggleCheck = async (idx) => {
    const updated = checklist.map((item, i) => i === idx ? { ...item, done: !item.done } : item);
    setChecklist(updated);
    await onUpdate(entry.id, { checklist: updated });
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    const updated = await onRegenerate(entry.id);
    if (updated) {
      setLetter(updated.motivation_letter || "");
      setLetterDirty(false);
    }
    setRegenerating(false);
  };

  // Load guide when that tab is first opened
  useEffect(() => {
    if (activeTab === "guide" && !guideFetched) {
      setGuideLoading(true);
      setGuideFetched(true);
      api.get(`/application-guides/${uni.id}`)
        .then(r => setGuide(r.data?.guide || null))
        .catch(() => setGuide(null))
        .finally(() => setGuideLoading(false));
    }
  }, [activeTab, guideFetched, uni.id]);

  const doneCount = checklist.filter(i => i.done).length;
  const portalUrl = uni.application_portal_url || uni.website;
  const method = uni.application_method || (uni.country === "Poland" ? "irk" : uni.is_public === false ? "own_portal" : "uni_assist");
  const METHOD_LABELS = {
    uni_assist: t("pipeline.method.uni_assist"),
    irk: t("pipeline.method.irk"),
    own_portal: t("pipeline.method.own_portal"),
    email: t("pipeline.method.email"),
  };

  const tabs = [
    { id: "analysis", label: t("pipeline.tabs.analysis") },
    { id: "letter",   label: t("pipeline.tabs.letter") },
    { id: "docs",     label: `${t("pipeline.tabs.docs")} ${doneCount}/${checklist.length}` },
    { id: "guide",    label: t("pipeline.tabs.guide") },
    { id: "notes",    label: t("pipeline.tabs.notes") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700/60 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start gap-4 p-5 border-b border-slate-800 shrink-0">
          {uni.logo_url && <img src={uni.logo_url} alt={uni.name} className="w-12 h-12 rounded-xl bg-white object-contain p-1 shrink-0" />}
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-base truncate">{countryFlag(uni.country)} {uni.name}</h2>
            <p className="text-slate-400 text-sm">{uni.city}, {uni.country}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {entry.fit_score && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${scoreBg(entry.fit_score)} ${scoreColor(entry.fit_score)}`}>
                  {t("pipeline.match", { score: entry.fit_score })}
                </span>
              )}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${COL_STYLES[col?.color || "indigo"].badge}`}>
                {col?.icon} {col?.label}
              </span>
              {entry.decision && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${DECISION_STYLES[entry.decision]}`}>
                  {entry.decision}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 shrink-0 border-b border-slate-800">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors ${activeTab === t.id ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {activeTab === "analysis" && (
            <div className="space-y-4">
              {!entry.fit_score && !entry.fit_analysis ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-3">{t("pipeline.noAnalysis")}</p>
                  <button onClick={handleRegenerate} disabled={regenerating} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
                    {regenerating ? t("pipeline.analyzing") : t("pipeline.runAnalysis")}
                  </button>
                </div>
              ) : (
                <>
                  {/* Score ring */}
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                    <div className="relative w-16 h-16 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3"/>
                        <circle cx="18" cy="18" r="15.9" fill="none"
                          stroke={entry.fit_score >= 75 ? "#10b981" : entry.fit_score >= 50 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="3"
                          strokeDasharray={`${entry.fit_score} ${100 - entry.fit_score}`}
                          strokeLinecap="round"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-sm font-bold ${scoreColor(entry.fit_score)}`}>{entry.fit_score}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{t("pipeline.fitScore")}</p>
                      <p className="text-slate-400 text-sm mt-0.5">{entry.fit_analysis}</p>
                    </div>
                  </div>

                  {strengths.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-emerald-400 text-xs font-bold uppercase tracking-wide">{t("pipeline.strengths")}</p>
                      {strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>{s}
                        </div>
                      ))}
                    </div>
                  )}

                  {realGaps.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-amber-400 text-xs font-bold uppercase tracking-wide">{t("pipeline.gaps")}</p>
                      {realGaps.map((g, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-amber-400 mt-0.5 shrink-0">!</span>{g}
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={handleRegenerate} disabled={regenerating}
                    className="text-xs text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1">
                    {regenerating ? t("pipeline.regenerating") : t("pipeline.regenerate")}
                  </button>
                </>
              )}

              {/* Application method */}
              {portalUrl && (
                <a href={portalUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-indigo-600/10 border border-indigo-500/30 rounded-xl hover:bg-indigo-600/20 transition-colors">
                  <div>
                    <p className="text-indigo-300 text-sm font-semibold">{METHOD_LABELS[method] || t("pipeline.method.default")}</p>
                    <p className="text-slate-500 text-xs">{portalUrl}</p>
                  </div>
                  <span className="text-indigo-400 text-lg">→</span>
                </a>
              )}
            </div>
          )}

          {activeTab === "letter" && (
            <div className="space-y-3">
              {!letter && (
                <p className="text-slate-400 text-sm">{t("pipeline.noLetter")}</p>
              )}
              <textarea
                value={letter}
                onChange={e => { setLetter(e.target.value); setLetterDirty(true); }}
                rows={16}
                placeholder={t("pipeline.letterPlaceholder")}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono leading-relaxed"
              />
              <div className="flex gap-2 flex-wrap">
                <button onClick={saveLetter} disabled={!letterDirty || saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm rounded-xl transition-colors">
                  {saving ? t("pipeline.saving") : t("pipeline.saveLetter")}
                </button>
                <button onClick={handleRegenerate} disabled={regenerating}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-xl transition-colors">
                  {regenerating ? t("pipeline.regenerating") : t("pipeline.regenerateShort")}
                </button>
                <button onClick={() => { navigator.clipboard.writeText(letter); toast.success(t("pipeline.copied")); }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-xl transition-colors">
                  {t("pipeline.copyLetter")}
                </button>
              </div>
            </div>
          )}

          {activeTab === "docs" && (
            <div className="space-y-2">
              <p className="text-slate-400 text-xs mb-3">{t("pipeline.checklistHint")}</p>
              {checklist.length === 0 && <p className="text-slate-500 text-sm">{t("pipeline.noChecklist")}</p>}
              {checklist.map((item, i) => (
                <button key={i} onClick={() => toggleCheck(i)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${item.done ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600"}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${item.done ? "bg-emerald-500 border-emerald-500" : "border-slate-500"}`}>
                    {item.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span className={`text-sm ${item.done ? "text-emerald-400 line-through" : "text-slate-300"}`}>{item.item}</span>
                </button>
              ))}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{t("pipeline.progress")}</span>
                  <span>{doneCount}/{checklist.length}</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: checklist.length ? `${(doneCount / checklist.length) * 100}%` : "0%" }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "guide" && (
            <div className="space-y-3">
              {guideLoading && (
                <div className="py-10 text-center text-slate-400 text-sm">{t("pipeline.loadingGuide")}</div>
              )}
              {!guideLoading && !guide && (
                <div className="py-10 text-center space-y-2">
                  <div className="text-4xl">📋</div>
                  <p className="text-slate-400 text-sm">{t("pipeline.noGuide")}</p>
                  <p className="text-slate-500 text-xs">{t("pipeline.noGuideAdmin")}</p>
                </div>
              )}
              {!guideLoading && guide && (
                <>
                  <p className="text-slate-400 text-xs mb-1">
                    {t("pipeline.guideDesc", { name: uni.name })}
                  </p>
                  <div className="space-y-3">
                    {guide.map((step, i) => {
                      const style = ACTION_TYPE_STYLES[step.action_type] || ACTION_TYPE_STYLES.info;
                      return (
                        <div key={i} className={`p-4 rounded-xl border ${style.color} flex gap-3`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white ${style.dot}`}>
                            {step.step}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-semibold text-white">{style.icon} {step.title}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border capitalize ${style.color}`}>
                                {step.action_type}
                              </span>
                            </div>
                            <p className="text-slate-300 text-xs leading-relaxed">{step.description}</p>
                            {step.url && (
                              <a
                                href={step.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                              >
                                {t("pipeline.openLink")}
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {portalUrl && (
                    <a
                      href={portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center justify-between p-3 bg-indigo-600/10 border border-indigo-500/30 rounded-xl hover:bg-indigo-600/20 transition-colors"
                    >
                      <div>
                        <p className="text-indigo-300 text-sm font-semibold">{t("pipeline.openPortal")}</p>
                        <p className="text-slate-500 text-xs truncate">{portalUrl}</p>
                      </div>
                      <span className="text-indigo-400 text-lg shrink-0">→</span>
                    </a>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-3">
              <textarea
                value={notes}
                onChange={e => { setNotes(e.target.value); setNotesDirty(true); }}
                rows={8}
                placeholder={t("pipeline.notesPlaceholder")}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <button onClick={saveNotes} disabled={!notesDirty}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm rounded-xl transition-colors">
                {t("pipeline.saveNotes")}
              </button>
              {entry.deadline_note && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-amber-300 text-xs font-semibold">{t("pipeline.deadlineLabel")}</p>
                  <p className="text-amber-200 text-sm mt-0.5">{entry.deadline_note}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: move + decision + delete */}
        <div className="p-4 border-t border-slate-800 shrink-0 space-y-3">
          {/* Progress buttons — only when not yet in final decision */}
          {entry.status !== "decision" && (
            <div className="flex gap-2 flex-wrap">
              {COLUMNS.filter(c => c.id !== entry.status && c.id !== "decision").map(c => (
                <button key={c.id} onClick={() => moveStatus(c.id)} disabled={moving}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${COL_STYLES[c.color].badge} opacity-70 hover:opacity-100`}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          )}
          {/* Decision display — read only, set by admin */}
          {entry.decision && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold ${DECISION_STYLES[entry.decision]}`}>
              <span>{entry.decision === "accepted" ? "🎉" : entry.decision === "rejected" ? "❌" : "⏳"}</span>
              <span className="capitalize">{entry.decision}</span>
              <span className="ml-auto text-xs opacity-60 font-normal">{t("pipeline.decisionByAdmin")}</span>
            </div>
          )}
          {entry.status === "decision" && !entry.decision && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm">
              {t("pipeline.waitingDecision")}
            </div>
          )}
          {/* Delete */}
          <button onClick={() => { onDelete(entry.id); onClose(); }}
            className="w-full py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors">
            {t("pipeline.removeFromPipeline")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── country → photo ─── */
const COUNTRY_PHOTOS = {
  Germany:     "https://images.unsplash.com/photo-1556660616-a3577e4f8fdf?w=400&q=60",
  Poland:      "https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=400&q=60",
  Austria:     "https://images.unsplash.com/photo-1516550893885-985c836c5eba?w=400&q=60",
  Netherlands: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&q=60",
  France:      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=60",
  Sweden:      "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=400&q=60",
};
const DEFAULT_PHOTO = "https://images.unsplash.com/photo-1562774053-701939374585?w=400&q=60";

/* ─── Pipeline Card (photo style) ─── */
function PipelineCard({ entry, onClick }) {
  const { t } = useTranslation();
  const uni = entry.university;
  const photo = COUNTRY_PHOTOS[uni.country] || DEFAULT_PHOTO;

  return (
    <div onClick={onClick}
      className="rounded-2xl overflow-hidden cursor-pointer transition-all group hover:opacity-90"
      style={{ border: "1px solid oklch(1 0 0 / 0.08)", background: "oklch(0.20 0.024 285)" }}>

      {/* Photo */}
      <div className="h-28 relative overflow-hidden">
        <img src={photo} alt="" className="w-full h-full object-cover"
             style={{ filter: "brightness(0.7)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, oklch(0.13 0.018 285 / 0.85), transparent 55%)" }} />
        {/* country flag top-left */}
        <span className="absolute top-2 start-2 text-lg">{countryFlag(uni.country)}</span>
        {/* score badge top-right */}
        {entry.fit_score && (
          <span className="absolute top-2 end-2 text-[11px] font-extrabold text-white px-2 py-0.5 rounded-lg"
                style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))" }}>
            {entry.fit_score}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-bold text-white text-sm leading-snug">{uni.name}</p>
        <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.02 285)" }}>{uni.city}</p>

        {/* deadline pill */}
        {entry.deadline_note && (
          <span className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: "oklch(0.55 0.22 296 / 0.18)", color: "oklch(0.78 0.12 296)" }}>
            {entry.deadline_note}
          </span>
        )}

        {/* decision badge */}
        {entry.decision && (
          <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${DECISION_STYLES[entry.decision]}`}>
            {entry.decision}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Pipeline() {
  const { t } = useTranslation();
  const COLUMNS = COLUMN_IDS.map(c => ({ ...c, label: t(`pipeline.columns.${c.labelKey}`) }));
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [activeEntry, setActiveEntry] = useState(null);

  useEffect(() => {
    api.get("/pipeline")
      .then(r => setEntries(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error(t("pipeline.loadError")))
      .finally(() => setLoading(false));
  }, []);

  const addToPipeline = async (universityId) => {
    setAdding(true);
    try {
      const r = await api.post("/pipeline", { university_id: universityId });
      setEntries(prev => [r.data, ...prev]);
      setShowAdd(false);
      toast.success(t("pipeline.addedToast", { score: r.data.fit_score ?? "—" }));
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message;
      if (msg === "Already in your pipeline") toast.error(t("pipeline.alreadyIn"));
      else toast.error(msg || t("pipeline.addFailed"));
    } finally {
      setAdding(false);
    }
  };

  const updateEntry = async (id, patch) => {
    try {
      const r = await api.patch(`/pipeline/${id}`, patch);
      setEntries(prev => prev.map(e => e.id === id ? r.data : e));
      if (activeEntry?.id === id) setActiveEntry(r.data);
      return r.data;
    } catch {
      toast.error("Update failed");
      return null;
    }
  };

  const regenerate = async (id) => {
    try {
      const r = await api.post(`/pipeline/${id}/regenerate`);
      setEntries(prev => prev.map(e => e.id === id ? r.data : e));
      if (activeEntry?.id === id) setActiveEntry(r.data);
      toast.success(t("pipeline.analysisRefreshed"));
      return r.data;
    } catch {
      toast.error(t("pipeline.regenFailed"));
      return null;
    }
  };

  const removeEntry = async (id) => {
    try {
      await api.delete(`/pipeline/${id}`);
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success(t("pipeline.removedToast"));
    } catch {
      toast.error(t("pipeline.deleteFailed"));
    }
  };

  const totalCount = entries.length;
  const avgScore = entries.filter(e => e.fit_score).length
    ? Math.round(entries.filter(e => e.fit_score).reduce((s, e) => s + e.fit_score, 0) / entries.filter(e => e.fit_score).length)
    : null;
  const acceptedCount = entries.filter(e => e.decision === "accepted").length;

  const BG     = "oklch(0.13 0.018 285)";
  const SURF   = "oklch(0.17 0.022 285)";
  const CARD   = "oklch(0.20 0.024 285)";
  const BORDER = "oklch(1 0 0 / 0.07)";
  const GRAD   = "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))";

  const decisionCount  = entries.filter(e => e.status === "decision").length;
  const deadlineCount  = entries.filter(e => e.deadline_note).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: BG, color: "#fff" }}>
      <div className="max-w-7xl mx-auto px-6 py-6">

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("pipeline.title")}</h1>
          <p className="text-sm mt-0.5" style={{ color: "oklch(0.55 0.02 285)" }}>{t("pipeline.subtitle")}</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl transition hover:opacity-90 shrink-0"
          style={{ background: GRAD, boxShadow: "0 4px 18px oklch(0.55 0.22 296 / 0.35)" }}>
          + {t("pipeline.addUniversity")}
        </button>
      </div>

      {/* Stats */}
      {totalCount > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: t("pipeline.stats.universities"), value: totalCount },
            { label: t("pipeline.stats.avgScore"),     value: decisionCount },
            { label: t("pipeline.stats.accepted"),     value: deadlineCount },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-5 text-center"
                 style={{ background: SURF, border: `1px solid ${BORDER}` }}>
              <div className="text-3xl font-extrabold text-white">{s.value}</div>
              <div className="text-xs mt-1" style={{ color: "oklch(0.55 0.02 285)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-white text-xl font-bold mb-2">{t("pipeline.emptyTitle")}</h2>
          <p className="text-sm mb-6" style={{ color: "oklch(0.55 0.02 285)" }}>{t("pipeline.emptyDesc")}</p>
          <button onClick={() => setShowAdd(true)}
            className="px-6 py-3 text-white font-bold rounded-xl transition hover:opacity-90"
            style={{ background: GRAD }}>
            {t("pipeline.addFirst")}
          </button>
        </div>
      )}

      {/* Kanban board */}
      {totalCount > 0 && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {COLUMNS.map(col => {
              const colEntries = entries.filter(e => e.status === col.id);
              return (
                <div key={col.id} className="w-56 shrink-0 flex flex-col gap-3">
                  {/* Column header */}
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                       style={{ background: SURF, border: `1px solid ${BORDER}` }}>
                    <span className="text-white text-sm font-bold">{col.label}</span>
                    <span className="text-[11px] font-bold text-white px-1.5 py-0.5 rounded-full"
                          style={{ background: GRAD }}>{colEntries.length}</span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3">
                    {colEntries.map(entry => (
                      <PipelineCard key={entry.id} entry={entry} onClick={() => setActiveEntry(entry)} />
                    ))}
                    {colEntries.length === 0 && (
                      <div className="rounded-2xl h-24 flex items-center justify-center"
                           style={{ border: `2px dashed ${BORDER}` }}>
                        <span className="text-xs" style={{ color: "oklch(0.35 0.02 285)" }}>{t("pipeline.empty")}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      </div>

      {/* Modals */}
      {showAdd && <AddModal onAdd={addToPipeline} onClose={() => !adding && setShowAdd(false)} adding={adding} />}
      {activeEntry && (
        <CardDetail
          entry={activeEntry}
          onClose={() => setActiveEntry(null)}
          onUpdate={updateEntry}
          onDelete={removeEntry}
          onRegenerate={regenerate}
        />
      )}
    </div>
  );
}
