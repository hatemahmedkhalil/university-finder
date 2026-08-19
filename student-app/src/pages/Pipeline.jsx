import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { countryFlag } from "../lib/countries";
import Confetti from "../components/Confetti";
import { Icon, ICONS } from "../components/Sidebar";

/* ── Journey roadmap — an emotional storytelling strip mapped 1:1 onto the
   real pipeline stages/statuses. Purely additive: no status ids, values, or
   backend behaviour change — just a friendlier read of the same data. ── */
const JOURNEY_STEPS = [
  { statusId: "shortlisted", emoji: "target", label: "Dream" },
  { statusId: "preparing",   emoji: "applications", label: "Documents" },
  { statusId: "ready",       emoji: "check", label: "Ready" },
  { statusId: "submitted",   emoji: "send", label: "Submitted" },
  { statusId: "decision",    emoji: "graduationCap", label: "Decision" },
];

const JourneyRoadmap = ({ entries }) => {
  const countFor = (id) => entries.filter(e => e.status === id).length;
  const reachedIdx = JOURNEY_STEPS.reduce((max, s, i) => (countFor(s.statusId) > 0 || entries.some(e => JOURNEY_STEPS.findIndex(x => x.statusId === e.status) > i) ? i : max), -1);
  return (
    <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <p className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: "var(--ink-faint)" }}>Your journey to Europe</p>
      <div className="relative flex items-start justify-between">
        <div className="absolute top-4 start-4 end-4 h-0.5" style={{ background: "var(--border)" }} />
        <div
          className="absolute top-4 start-4 h-0.5 transition-all duration-700"
          style={{
            background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
            width: JOURNEY_STEPS.length > 1 ? `calc(${(Math.max(reachedIdx, 0) / (JOURNEY_STEPS.length - 1)) * 100}% - 8px)` : "0%",
          }}
        />
        {JOURNEY_STEPS.map((s, i) => {
          const count = countFor(s.statusId);
          const passed = i <= reachedIdx;
          return (
            <div key={s.statusId} className="relative flex flex-col items-center gap-1.5" style={{ flex: 1 }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-all duration-300"
                style={passed
                  ? { background: "var(--accent)", boxShadow: "0 0 0 4px var(--accent-subtle)" }
                  : { background: "var(--surface-2)", border: "2px solid var(--border)" }}
              >
                <Icon d={ICONS[s.emoji]} size={16} />
              </div>
              <p className="text-[11px] font-bold text-center" style={{ color: passed ? "var(--ink)" : "var(--ink-faint)" }}>{s.label}</p>
              {count > 0 && (
                <span className="text-[10px] font-bold px-1.5 rounded-full" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>{count}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── constants ─── */
const COLUMN_IDS = [
  { id: "shortlisted", labelKey: "shortlisted", icon: "applications", color: "indigo",  next: "preparing" },
  { id: "preparing",   labelKey: "preparing",   icon: "email", color: "amber",   next: "ready" },
  { id: "ready",       labelKey: "ready",       icon: "check", color: "sky",     next: "submitted" },
  { id: "submitted",   labelKey: "submitted",   icon: "send", color: "purple",  next: "decision" },
  { id: "decision",    labelKey: "decision",    icon: "target", color: "emerald", next: null },
];

const COL_STYLES = {
  indigo:  { header: "border-sky-500/40 bg-sky-500/10",  badge: "bg-sky-500 text-[var(--ink)]", dot: "bg-sky-400" },
  amber:   { header: "border-amber-500/40 bg-amber-500/10",    badge: "bg-amber-500 text-[var(--ink)]",   dot: "bg-amber-400" },
  sky:     { header: "border-sky-500/40 bg-sky-500/10",        badge: "bg-sky-500 text-[var(--ink)]",     dot: "bg-sky-400" },
  purple:  { header: "border-purple-500/40 bg-purple-500/10",  badge: "bg-purple-500 text-[var(--ink)]",  dot: "bg-purple-400" },
  emerald: { header: "border-emerald-500/40 bg-emerald-500/10",badge: "bg-emerald-500 text-[var(--ink)]", dot: "bg-emerald-400" },
};

const DECISION_STYLES = {
  accepted:   "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  rejected:   "bg-red-500/20 text-red-300 border-red-500/40",
  waitlisted: "bg-amber-500/20 text-amber-300 border-amber-500/40",
};

const scoreColor = (s) =>
  !s ? "text-[var(--ink-faint)]" :
  s >= 75 ? "text-emerald-400" :
  s >= 50 ? "text-amber-400" :
  "text-red-400";

const scoreBg = (s) =>
  !s ? "bg-[var(--border)]" :
  s >= 75 ? "bg-emerald-500/20 border-emerald-500/40" :
  s >= 50 ? "bg-amber-500/20 border-amber-500/40" :
  "bg-red-500/20 border-red-500/40";

/* ══════════════════════════════════════════════════════════════
   Phase 3 — Application Command Center building blocks.
   All of these read only real fields the Phase 2 backend already
   computes (entry.readiness, entry.requirements, entry.deadline,
   entry.deadline_risk, entry.next_action) — nothing here invents
   data or duplicates backend logic on the frontend.
══════════════════════════════════════════════════════════════ */

export const RISK_META = {
  high:     { color: "#f87171", bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.35)" },
  medium:   { color: "#fbbf24", bg: "rgba(251,191,36,0.15)",  border: "rgba(251,191,36,0.35)" },
  low:      { color: "var(--ink-faint)", bg: "var(--surface-2)", border: "var(--border)" },
  on_track: { color: "#34d399", bg: "rgba(52,211,153,0.15)",  border: "rgba(52,211,153,0.35)" },
  passed:   { color: "#f87171", bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.35)" },
  unknown:  { color: "var(--ink-faint)", bg: "var(--surface-2)", border: "var(--border)" },
};

/* Small readiness ring — same visual language as the existing fit-score
   ring in CardDetail, reused here for consistency, not a new pattern. */
export const ReadinessRing = ({ readiness, size = 40 }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (!readiness || readiness.score === null) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="relative flex items-center gap-1.5 text-left"
        title={readiness?.explanation}
      >
        <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: size, height: size, border: "2px dashed var(--border)" }}>
          <span className="text-[10px] font-bold" style={{ color: "var(--ink-faint)" }}>—</span>
        </div>
        {open && (
          <span className="absolute top-full left-0 mt-1 z-10 w-44 text-[11px] leading-snug rounded-lg p-2 shadow-lg"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink-dim)" }}>
            {readiness?.explanation || t("pipeline.readiness.noData", "Not enough data yet.")}
          </span>
        )}
      </button>
    );
  }
  const score = readiness.score;
  const stroke = score >= 75 ? "var(--good)" : score >= 50 ? "var(--warn)" : "var(--danger)";
  return (
    <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }} className="relative shrink-0">
      <svg viewBox="0 0 36 36" width={size} height={size} className="-rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--surface-2)" strokeWidth="3.5" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={stroke} strokeWidth="3.5"
          strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-extrabold" style={{ color: stroke }}>{score}%</span>
      </div>
      {open && (
        <span className="absolute top-full left-0 mt-1.5 z-10 w-48 text-[11px] leading-snug rounded-lg p-2.5 shadow-lg text-left"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink-dim)" }}>
          {readiness.explanation}
        </span>
      )}
    </button>
  );
};

/* Deadline chip — honest about ambiguity/unknown, never invents a date. */
export const DeadlineChip = ({ deadline, risk }) => {
  const { t } = useTranslation();
  const meta = RISK_META[risk?.level] || RISK_META.unknown;

  if (!deadline?.parseable) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
        <Icon d={ICONS.clock} size={11} />{t("pipeline.deadlineUnavailable", "Deadline unavailable")}
      </span>
    );
  }
  const days = deadline.days_remaining;
  const label = days < 0
    ? t("pipeline.deadlinePassed", "Deadline passed")
    : days === 0
      ? t("pipeline.deadlineToday", "Deadline today")
      : t("pipeline.deadlineDays", "{{count}} days left", { count: days });
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
          title={deadline.multiple_dates ? t("pipeline.multipleIntakes", "Multiple intake dates listed — verify which applies to you") : undefined}>
      <Icon d={ICONS.clock} size={11} />{label}{deadline.multiple_dates ? " *" : ""}
    </span>
  );
};

/* Compact + expandable missing-requirements summary. */
export const MissingRequirements = ({ requirements }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const missing = (requirements?.items || []).filter(i => i.required && !i.matched);
  if (missing.length === 0) return null;
  return (
    <div className="mt-2">
      <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "var(--warn)" }}>
        <Icon d={ICONS.alertTriangle} size={12} />
        {t("pipeline.missingCount", "{{count}} required item(s) missing", { count: missing.length })}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
             className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul className="mt-1.5 space-y-1 ps-1">
          {missing.map((item, i) => (
            <li key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: "var(--ink-faint)" }}>
              <span className="mt-0.5">•</span>{item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ── Today's Priorities — derived entirely from real entries, no hardcoding.
   Urgency ranking: high-risk deadlines first, then medium, then anything
   with missing required items, only for entries a student can still act on. ── */
const priorityRank = (entry) => {
  if (entry.status === "decision") return -1;         // already resolved, never a priority
  const level = entry.deadline_risk?.level;
  const missing = (entry.requirements?.items || []).filter(i => i.required && !i.matched).length;
  if (level === "passed") return 100;
  if (level === "high") return 90 + missing;
  if (level === "medium") return 50 + missing;
  if (missing > 0) return 20 + missing;
  return -1;                                            // nothing actionable right now
};

const TodaysPriorities = ({ entries, onOpen }) => {
  const { t } = useTranslation();
  const ranked = entries
    .map(e => ({ e, rank: priorityRank(e) }))
    .filter(x => x.rank > 0)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 5);

  if (ranked.length === 0) return null;

  return (
    <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--ink-faint)" }}>
        {t("pipeline.todaysPriorities", "Today's Priorities")}
      </p>
      <div className="space-y-2">
        {ranked.map(({ e }) => {
          const meta = RISK_META[e.deadline_risk?.level] || RISK_META.unknown;
          return (
            <button key={e.id} onClick={() => onOpen(e)}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-[var(--surface-hover)]"
              style={{ border: `1px solid ${meta.border}`, background: meta.bg }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
              <span className="shrink-0">{countryFlag(e.university.country)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>{e.university.name}</p>
                <p className="text-xs truncate" style={{ color: "var(--ink-faint)" }}>{e.next_action?.action}</p>
              </div>
              <DeadlineChip deadline={e.deadline} risk={e.deadline_risk} />
            </button>
          );
        })}
      </div>
    </div>
  );
};


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
      <>{text.slice(0, idx)}<mark className="bg-sky-500/40 text-[var(--ink)] rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}</>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-[var(--border)]">
          <h2 className="text-[var(--ink)] font-bold text-lg">{t("pipeline.addTitle")}</h2>
          <p className="text-[var(--ink-faint)] text-sm mt-0.5">{t("pipeline.addSubtitle")}</p>
        </div>
        <div className="p-4 space-y-2">
          {/* Search input */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              ref={inputRef}
              type="text"
              placeholder={t("pipeline.searchPlaceholder")}
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null); }}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-[var(--ink)] text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-[var(--ink-faint)]"
            />
            {query && (
              <button onClick={() => { setQuery(""); setSelected(null); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] hover:text-[var(--ink)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-[var(--ink-faint)]">
              {loadingUnis ? t("common.loading") : q ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""}` : `${unis.length} universities`}
            </span>
            {selected && <span className="text-xs text-sky-400 font-medium">{selected.name}</span>}
          </div>

          {/* University list */}
          <div className="border border-[var(--border)]/60 rounded-xl overflow-hidden">
            {loadingUnis ? (
              <div className="py-8 text-center text-[var(--ink-faint)] text-sm">{t("pipeline.loadingUnis")}</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-[var(--ink-faint)] text-sm">{t("pipeline.noMatch", { query })}</div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border)]">
                {filtered.map(u => (
                  <button
                    key={u.id}
                    onClick={() => setSelected(selected?.id === u.id ? null : u)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-3 ${
                      selected?.id === u.id
                        ? "bg-sky-600 text-[var(--ink)]"
                        : "text-[var(--ink-dim)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    <span className="text-xl shrink-0">{countryFlag(u.country)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{highlight(u.name)}</div>
                      <div className={`text-xs mt-0.5 ${selected?.id === u.id ? "text-sky-200" : "text-[var(--ink-faint)]"}`}>
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
        <div className="p-4 border-t border-[var(--border)] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--ink-dim)] rounded-xl text-sm font-medium transition-colors">{t("common.cancel")}</button>
          <button
            onClick={() => selected && onAdd(selected.id)}
            disabled={!selected || adding}
            className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-[var(--ink)] rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
  document: { icon: "email", color: "bg-sky-500/20 border-sky-500/40 text-sky-300", dot: "bg-sky-400" },
  account:  { icon: "profile", color: "bg-purple-500/20 border-purple-500/40 text-purple-300", dot: "bg-purple-400" },
  portal:   { icon: "globe", color: "bg-sky-500/20 border-sky-500/40 text-sky-300", dot: "bg-sky-400" },
  payment:  { icon: "creditCard", color: "bg-red-500/20 border-red-500/40 text-red-300", dot: "bg-red-400" },
  email:    { icon: "mail", color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300", dot: "bg-emerald-400" },
  info:     { icon: "info", color: "bg-amber-500/20 border-amber-500/40 text-amber-300", dot: "bg-amber-400" },
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
  const [feedback, setFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

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
      <div className="bg-[var(--surface)] border border-[var(--border)]/60 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start gap-4 p-5 border-b border-[var(--border)] shrink-0">
          {uni.logo_url && <img src={uni.logo_url} alt={uni.name} className="w-12 h-12 rounded-xl bg-white object-contain p-1 shrink-0" />}
          <div className="flex-1 min-w-0">
            <h2 className="text-[var(--ink)] font-bold text-base truncate">{countryFlag(uni.country)} {uni.name}</h2>
            <p className="text-[var(--ink-faint)] text-sm">{uni.city}, {uni.country}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {entry.fit_score && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${scoreBg(entry.fit_score)} ${scoreColor(entry.fit_score)}`}>
                  {t("pipeline.match", { score: entry.fit_score })}
                </span>
              )}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${COL_STYLES[col?.color || "indigo"].badge}`}>
                <Icon d={ICONS[col?.icon]} size={14} className="inline -mt-0.5 me-1" />{col?.label}
              </span>
              {entry.decision && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${DECISION_STYLES[entry.decision]}`}>
                  {entry.decision}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {entry.status !== "submitted" && entry.status !== "decision" && (
              <Link to={`/apply-hub/${entry.id}`}
                className="hidden sm:inline-block text-xs font-bold px-3 py-1.5 rounded-lg transition hover:opacity-90"
                style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
                {t("pipeline.continueApplication", "Continue Application")}
              </Link>
            )}
            <button onClick={onClose} className="text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 shrink-0 border-b border-[var(--border)]">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors ${activeTab === t.id ? "bg-[var(--surface-2)] text-[var(--ink)]" : "text-[var(--ink-faint)] hover:text-[var(--ink)]"}`}>
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
                  <p className="text-[var(--ink-faint)] mb-3">{t("pipeline.noAnalysis")}</p>
                  <button onClick={handleRegenerate} disabled={regenerating} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-[var(--ink)] rounded-xl text-sm font-medium transition-colors">
                    {regenerating ? t("pipeline.analyzing") : t("pipeline.runAnalysis")}
                  </button>
                </div>
              ) : (
                <>
                  {/* Score ring */}
                  <div className="flex items-center gap-4 p-4 bg-[var(--surface-2)]/50 rounded-2xl border border-[var(--border)]/50">
                    <div className="relative w-16 h-16 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--surface-2)" strokeWidth="3"/>
                        <circle cx="18" cy="18" r="15.9" fill="none"
                          stroke={entry.fit_score >= 75 ? "var(--good)" : entry.fit_score >= 50 ? "var(--warn)" : "var(--danger)"}
                          strokeWidth="3"
                          strokeDasharray={`${entry.fit_score} ${100 - entry.fit_score}`}
                          strokeLinecap="round"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-sm font-bold ${scoreColor(entry.fit_score)}`}>{entry.fit_score}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[var(--ink)] font-semibold">{t("pipeline.fitScore")}</p>
                      <p className="text-[var(--ink-faint)] text-sm mt-0.5">{entry.fit_analysis}</p>
                    </div>
                  </div>

                  {strengths.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-emerald-400 text-xs font-bold uppercase tracking-wide">{t("pipeline.strengths")}</p>
                      {strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-[var(--ink-dim)]">
                          <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>{s}
                        </div>
                      ))}
                    </div>
                  )}

                  {realGaps.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-amber-400 text-xs font-bold uppercase tracking-wide">{t("pipeline.gaps")}</p>
                      {realGaps.map((g, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-[var(--ink-dim)]">
                          <span className="text-amber-400 mt-0.5 shrink-0">!</span>{g}
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={handleRegenerate} disabled={regenerating}
                    className="text-xs text-[var(--ink-faint)] hover:text-sky-400 transition-colors flex items-center gap-1">
                    {regenerating ? t("pipeline.regenerating") : t("pipeline.regenerate")}
                  </button>
                </>
              )}

              {/* Application method */}
              {portalUrl && (
                <a href={portalUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-sky-600/10 border border-sky-500/30 rounded-xl hover:bg-sky-600/20 transition-colors">
                  <div>
                    <p className="text-sky-300 text-sm font-semibold">{METHOD_LABELS[method] || t("pipeline.method.default")}</p>
                    <p className="text-[var(--ink-faint)] text-xs">{portalUrl}</p>
                  </div>
                  <span className="text-sky-400 text-lg">→</span>
                </a>
              )}
            </div>
          )}

          {activeTab === "letter" && (
            <div className="space-y-3">
              {!letter && (
                <p className="text-[var(--ink-faint)] text-sm">{t("pipeline.noLetter")}</p>
              )}
              <textarea
                value={letter}
                onChange={e => { setLetter(e.target.value); setLetterDirty(true); }}
                rows={16}
                placeholder={t("pipeline.letterPlaceholder")}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-mono leading-relaxed"
              />
              <div className="flex gap-2 flex-wrap">
                <button onClick={saveLetter} disabled={!letterDirty || saving}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-[var(--ink)] text-sm rounded-xl transition-colors">
                  {saving ? t("pipeline.saving") : t("pipeline.saveLetter")}
                </button>
                <button onClick={handleRegenerate} disabled={regenerating}
                  className="px-4 py-2 bg-[var(--border)] hover:bg-[var(--border-strong)] text-[var(--ink-dim)] text-sm rounded-xl transition-colors">
                  {regenerating ? t("pipeline.regenerating") : t("pipeline.regenerateShort")}
                </button>
                <button onClick={() => { navigator.clipboard.writeText(letter); toast.success(t("pipeline.copied")); }}
                  className="px-4 py-2 bg-[var(--border)] hover:bg-[var(--border-strong)] text-[var(--ink-dim)] text-sm rounded-xl transition-colors">
                  {t("pipeline.copyLetter")}
                </button>
                <button
                  onClick={async () => {
                    if (!letter || letter.trim().length < 50) { toast.error("Write at least 50 characters first."); return; }
                    setFeedbackLoading(true);
                    try {
                      const r = await api.post("/ai-chat/letter-feedback", {
                        content: letter,
                        university_name: uni?.name,
                        program: entry.program,
                      });
                      setFeedback(r.data);
                    } catch { toast.error("AI feedback unavailable. Try again."); }
                    finally { setFeedbackLoading(false); }
                  }}
                  disabled={feedbackLoading || !letter}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-[var(--ink)] text-sm rounded-xl transition-colors flex items-center gap-1.5">
                  {feedbackLoading ? "Analyzing…" : "AI Feedback"}
                </button>
              </div>

              {/* ── AI Feedback Panel ── */}
              {feedback && (
                <div className="mt-4 rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[var(--ink)] text-sm">AI Letter Feedback</h4>
                    <button onClick={() => setFeedback(null)} className="text-[var(--ink-faint)] hover:text-[var(--ink)] text-lg leading-none">×</button>
                  </div>
                  {/* Score */}
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl font-extrabold ${feedback.score >= 7 ? "text-emerald-400" : feedback.score >= 5 ? "text-amber-400" : "text-red-400"}`}>
                      {feedback.score}/10
                    </div>
                    <p className="text-[var(--ink-dim)] text-sm">{feedback.summary}</p>
                  </div>
                  {/* Strengths */}
                  {feedback.strengths?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">Strengths</p>
                      <ul className="space-y-1">
                        {feedback.strengths.map((s, i) => <li key={i} className="text-sm text-[var(--ink-dim)] flex gap-2"><span className="text-emerald-400 shrink-0">✓</span>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {/* Weaknesses */}
                  {feedback.weaknesses?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1.5">Weaknesses</p>
                      <ul className="space-y-1">
                        {feedback.weaknesses.map((s, i) => <li key={i} className="text-sm text-[var(--ink-dim)] flex gap-2"><span className="text-red-400 shrink-0">✗</span>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {/* Improvements */}
                  {feedback.improvements?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">How to Improve</p>
                      <ul className="space-y-1">
                        {feedback.improvements.map((s, i) => <li key={i} className="text-sm text-[var(--ink-dim)] flex gap-2"><span className="text-amber-400 shrink-0">{i + 1}.</span>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {/* Missing elements */}
                  {feedback.missing_elements?.filter(Boolean).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--ink-faint)] uppercase tracking-wider mb-1.5">Missing Elements</p>
                      <ul className="space-y-1">
                        {feedback.missing_elements.filter(Boolean).map((s, i) => <li key={i} className="text-sm text-[var(--ink-faint)] flex gap-2"><span className="shrink-0">—</span>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "docs" && (
            <div className="space-y-2">
              <p className="text-[var(--ink-faint)] text-xs mb-3">{t("pipeline.checklistHint")}</p>
              {checklist.length === 0 && <p className="text-[var(--ink-faint)] text-sm">{t("pipeline.noChecklist")}</p>}
              {checklist.map((item, i) => (
                <button key={i} onClick={() => toggleCheck(i)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${item.done ? "bg-emerald-500/10 border-emerald-500/30" : "bg-[var(--surface-2)]/50 border-[var(--border)]/50 hover:border-[var(--border-strong)]"}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${item.done ? "bg-emerald-500 border-emerald-500" : "border-slate-500"}`}>
                    {item.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span className={`text-sm ${item.done ? "text-emerald-400 line-through" : "text-[var(--ink-dim)]"}`}>{item.item}</span>
                </button>
              ))}
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <div className="flex justify-between text-xs text-[var(--ink-faint)] mb-1">
                  <span>{t("pipeline.progress")}</span>
                  <span>{doneCount}/{checklist.length}</span>
                </div>
                <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full transition-all duration-300"
                    style={{ width: checklist.length ? `${(doneCount / checklist.length) * 100}%` : "0%" }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "guide" && (
            <div className="space-y-3">
              {guideLoading && (
                <div className="py-10 text-center text-[var(--ink-faint)] text-sm">{t("pipeline.loadingGuide")}</div>
              )}
              {!guideLoading && !guide && (
                <div className="py-10 text-center space-y-2">
                  <div className="flex justify-center"><Icon d={ICONS.applications} size={32} /></div>
                  <p className="text-[var(--ink-faint)] text-sm">{t("pipeline.noGuide")}</p>
                  <p className="text-[var(--ink-faint)] text-xs">{t("pipeline.noGuideAdmin")}</p>
                </div>
              )}
              {!guideLoading && guide && (
                <>
                  <p className="text-[var(--ink-faint)] text-xs mb-1">
                    {t("pipeline.guideDesc", { name: uni.name })}
                  </p>
                  <div className="space-y-3">
                    {guide.map((step, i) => {
                      const style = ACTION_TYPE_STYLES[step.action_type] || ACTION_TYPE_STYLES.info;
                      return (
                        <div key={i} className={`p-4 rounded-xl border ${style.color} flex gap-3`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-[var(--ink)] ${style.dot}`}>
                            {step.step}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-semibold text-[var(--ink)]"><Icon d={ICONS[style.icon]} size={14} className="inline -mt-0.5 me-1" />{step.title}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border capitalize ${style.color}`}>
                                {step.action_type}
                              </span>
                            </div>
                            <p className="text-[var(--ink-dim)] text-xs leading-relaxed">{step.description}</p>
                            {step.url && (
                              <a
                                href={step.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-2 text-xs text-sky-400 hover:text-sky-300 underline underline-offset-2"
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
                      className="mt-2 flex items-center justify-between p-3 bg-sky-600/10 border border-sky-500/30 rounded-xl hover:bg-sky-600/20 transition-colors"
                    >
                      <div>
                        <p className="text-sky-300 text-sm font-semibold">{t("pipeline.openPortal")}</p>
                        <p className="text-[var(--ink-faint)] text-xs truncate">{portalUrl}</p>
                      </div>
                      <span className="text-sky-400 text-lg shrink-0">→</span>
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
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
              <button onClick={saveNotes} disabled={!notesDirty}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-[var(--ink)] text-sm rounded-xl transition-colors">
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
        <div className="p-4 border-t border-[var(--border)] shrink-0 space-y-3">
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
              <Icon d={entry.decision === "accepted" ? ICONS.check : entry.decision === "rejected" ? ICONS.x : ICONS.clock} size={16} />
              <span className="capitalize">{entry.decision}</span>
              <span className="ml-auto text-xs opacity-60 font-normal">{t("pipeline.decisionByAdmin")}</span>
            </div>
          )}
          {entry.status === "decision" && !entry.decision && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--ink-faint)] text-sm">
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
  Germany:     "https://images.unsplash.com/photo-1560930950-5cc20e80e392?w=400&q=60",
  Poland:      "https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=400&q=60",
  Austria:     "https://images.unsplash.com/photo-1573599852326-2d4da0bbe613?w=400&q=60",
  Netherlands: "https://images.unsplash.com/photo-1557251407-6356f6384370?w=400&q=60",
  France:      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=60",
  Sweden:      "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=400&q=60",
};
const DEFAULT_PHOTO = "https://images.unsplash.com/photo-1562774053-701939374585?w=400&q=60";

/* ─── Pipeline Card (photo style) ─── */
function PipelineCard({ entry, onClick }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const uni = entry.university;
  const photo = COUNTRY_PHOTOS[uni.country] || DEFAULT_PHOTO;
  const hasIntel = !!(entry.readiness || entry.deadline_risk || entry.next_action);

  return (
    <div onClick={onClick}
      className="rounded-2xl overflow-hidden cursor-pointer transition-all group hover:opacity-90"
      style={{ border: "1px solid var(--border)", background: "var(--surface-2)" }}>

      {/* Photo */}
      <div className="h-28 relative overflow-hidden">
        <img src={photo} alt="" className="w-full h-full object-cover"
             style={{ filter: "brightness(0.7)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(18,20,31,0.85), transparent 55%)" }} />
        {/* country flag top-left */}
        <span className="absolute top-2 start-2 text-lg">{countryFlag(uni.country)}</span>
        {/* score badge top-right */}
        {entry.fit_score && (
          <span className="absolute top-2 end-2 text-[11px] font-extrabold text-[var(--ink)] px-2 py-0.5 rounded-lg"
                style={{ background: "linear-gradient(120deg, var(--accent) 0%, var(--accent-light) 45%, var(--accent-active) 100%)" }}>
            {entry.fit_score}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-bold text-[var(--ink)] text-sm leading-snug">{uni.name}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--ink-faint)" }}>{uni.city}</p>

        {/* decision badge */}
        {entry.decision && (
          <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${DECISION_STYLES[entry.decision]}`}>
            {entry.decision}
          </span>
        )}

        {/* Phase 3 — application intelligence */}
        {hasIntel && (
          <>
            <div className="flex items-center gap-2 mt-2.5">
              <ReadinessRing readiness={entry.readiness} size={30} />
              <DeadlineChip deadline={entry.deadline} risk={entry.deadline_risk} />
            </div>

            {entry.next_action?.action && (
              <p className="mt-2 text-[11px] leading-snug" style={{ color: "var(--ink-dim)" }}>
                <span className="font-semibold" style={{ color: "var(--accent-light)" }}>{t("pipeline.next", "Next")}: </span>
                {entry.next_action.action}
              </p>
            )}

            <MissingRequirements requirements={entry.requirements} />

            {entry.status !== "submitted" && entry.status !== "decision" && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/apply-hub/${entry.id}`); }}
                className="mt-3 w-full text-center py-1.5 rounded-lg text-[11px] font-bold transition-colors"
                style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
              >
                {t("pipeline.continueApplication", "Continue Application")}
              </button>
            )}
          </>
        )}

        {/* Fallback for the rare case intelligence fields aren't present */}
        {!hasIntel && entry.deadline_note && (
          <span className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: "rgba(68,80,214,0.18)", color: "var(--accent-light)" }}>
            {entry.deadline_note}
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
  const [celebrate, setCelebrate] = useState(false);

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
      const prevEntry = entries.find(e => e.id === id);
      const r = await api.patch(`/pipeline/${id}`, patch);
      setEntries(prev => prev.map(e => e.id === id ? r.data : e));
      if (activeEntry?.id === id) setActiveEntry(r.data);
      // Milestone moment: celebrate the first time an application reaches "submitted" —
      // purely a client-side visual reaction to a real status change, no new data.
      if (patch.status === "submitted" && prevEntry?.status !== "submitted") {
        setCelebrate(true);
        toast.success("Application submitted — one step closer to Europe!", { duration: 4000 });
        setTimeout(() => setCelebrate(false), 1400);
      }
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

  // Phase 3 — real, backend-derived overview stats (no decorative/invented numbers).
  const needAttentionCount = entries.filter(e => priorityRank(e) > 0).length;
  const atRiskCount = entries.filter(e => ["high", "medium", "passed"].includes(e.deadline_risk?.level)).length;
  const readyCount = entries.filter(e =>
    e.status !== "submitted" && e.status !== "decision" &&
    e.readiness?.score !== null && e.readiness?.score !== undefined &&
    e.readiness.required_total > 0 && e.readiness.required_done === e.readiness.required_total
  ).length;

  const BG     = "var(--bg)";
  const SURF   = "var(--surface)";
  const CARD   = "var(--surface-2)";
  const BORDER = "var(--border)";
  const GRAD   = "linear-gradient(120deg, var(--accent) 0%, var(--accent-light) 45%, var(--accent-active) 100%)";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: BG, color: "var(--ink)" }}>
      {celebrate && <Confetti count={32} />}
      <div className="max-w-7xl mx-auto px-6 py-6">

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)]">{t("pipeline.title")}</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--ink-faint)" }}>{t("pipeline.subtitle")}</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-[var(--ink)] font-bold rounded-xl transition hover:opacity-90 shrink-0"
          style={{ background: GRAD, boxShadow: "0 4px 18px rgba(68,80,214,0.35)" }}>
          + {t("pipeline.addUniversity")}
        </button>
      </div>

      {/* Today's Priorities — derived from real readiness/deadline data */}
      {totalCount > 0 && <TodaysPriorities entries={entries} onOpen={setActiveEntry} />}

      {/* Journey roadmap — emotional storytelling layer over the real stages */}
      {totalCount > 0 && <JourneyRoadmap entries={entries} />}

      {/* Stats */}
      {totalCount > 0 && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: t("pipeline.stats.universities"), value: totalCount },
            { label: t("pipeline.stats.needAttention", "Need attention"), value: needAttentionCount },
            { label: t("pipeline.stats.atRisk", "At risk"), value: atRiskCount },
            { label: t("pipeline.stats.readyToSubmit", "Ready to submit"), value: readyCount },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-5 text-center"
                 style={{ background: SURF, border: `1px solid ${BORDER}` }}>
              <div className="text-3xl font-extrabold text-[var(--ink)]">{s.value}</div>
              <div className="text-xs mt-1" style={{ color: "var(--ink-faint)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="max-w-lg mx-auto text-center pop-in">
          <div className="relative rounded-3xl overflow-hidden mb-6" style={{ border: "1px solid var(--border)" }}>
            <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=70" alt=""
                 className="w-full h-44 object-cover" style={{ filter: "brightness(0.55)" }} />
            <div className="absolute inset-0 flex items-center justify-center"><Icon d={ICONS.rocket} size={40} /></div>
          </div>
          <h2 className="text-[var(--ink)] text-xl font-bold mb-2">{t("pipeline.emptyTitle")}</h2>
          <p className="text-sm mb-6" style={{ color: "var(--ink-faint)" }}>{t("pipeline.emptyDesc")}</p>
          <button onClick={() => setShowAdd(true)}
            className="px-6 py-3 text-[var(--ink)] font-bold rounded-xl transition hover:opacity-90 hover:-translate-y-0.5 duration-200"
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
                    <span className="text-[var(--ink)] text-sm font-bold">{col.label}</span>
                    <span className="text-[11px] font-bold text-[var(--ink)] px-1.5 py-0.5 rounded-full"
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
                        <span className="text-xs" style={{ color: "var(--ink-faint)" }}>{t("pipeline.empty")}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Defensive fallback — an application must NEVER silently disappear.
                Any entry whose status doesn't match one of the 5 known columns
                (e.g. future bug, manual data edit) lands here instead of vanishing. */}
            {(() => {
              const knownIds = new Set(COLUMNS.map(c => c.id));
              const orphaned = entries.filter(e => !knownIds.has(e.status));
              if (orphaned.length === 0) return null;
              return (
                <div className="w-56 shrink-0 flex flex-col gap-3">
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                       style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.4)" }}>
                    <span className="text-sm font-bold" style={{ color: "var(--warn)" }}>{t("pipeline.needsReview", "Needs Review")}</span>
                    <span className="text-[11px] font-bold text-[var(--ink)] px-1.5 py-0.5 rounded-full" style={{ background: "var(--warn)" }}>{orphaned.length}</span>
                  </div>
                  <div className="space-y-3">
                    {orphaned.map(entry => (
                      <PipelineCard key={entry.id} entry={entry} onClick={() => setActiveEntry(entry)} />
                    ))}
                  </div>
                </div>
              );
            })()}
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
