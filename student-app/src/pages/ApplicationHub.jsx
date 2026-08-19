import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Icon, ICONS } from "../components/Sidebar";
import { ReadinessRing, DeadlineChip, MissingRequirements } from "./Pipeline";

/* ─── helpers ─── */
const fmt = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const DOC_TYPE_COLORS = {
  transcript: "bg-sky-500/20 text-sky-300",
  language_cert: "bg-purple-500/20 text-purple-300",
  passport: "bg-amber-500/20 text-amber-300",
  photo: "bg-pink-500/20 text-pink-300",
  cv: "bg-emerald-500/20 text-emerald-300",
  recommendation: "bg-cyan-500/20 text-cyan-300",
  other: "bg-slate-500/20 text-[var(--ink-dim)]",
};

/* ─── Tab: Application Overview (Phase 4) ───────────────────────────────────
   Everything here is read from the same live intelligence the Pipeline
   Command Center already computes (entry.readiness / .deadline / .deadline_risk
   / .requirements / .next_action) — no separate calculation, no fabricated
   numbers. This is the "where do I stand, what's next" first screen. ─── */
function ApplicationOverview({ entry, onJumpTab }) {
  const { t } = useTranslation();
  const uni = entry.university;
  const readiness = entry.readiness;
  const missing = (entry.requirements?.items || []).filter(i => i.required && !i.matched);
  const requiredTotal = readiness?.required_total ?? 0;
  const requiredDone = readiness?.required_done ?? 0;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-6" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <div className="flex items-start gap-4 flex-wrap">
          {uni.logo_url && <img src={uni.logo_url} alt={uni.name} className="w-14 h-14 rounded-xl bg-white object-contain p-1 shrink-0" />}
          <div className="flex-1 min-w-0">
            <h2 className="text-[var(--ink)] font-bold text-lg">{uni.name}</h2>
            <p className="text-sm" style={{ color: "var(--ink-faint)" }}>{uni.city}, {uni.country}</p>
            {entry.decision && (
              <span className="inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full border capitalize"
                    style={{ borderColor: "var(--border)" }}>{entry.decision}</span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <ReadinessRing readiness={readiness} size={56} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>
                {t("applyHub.overview.readiness", "Application readiness")}
              </p>
              <p className="text-sm" style={{ color: "var(--ink-dim)" }}>
                {requiredTotal > 0
                  ? t("applyHub.overview.itemsComplete", "{{done}} / {{total}} required items complete", { done: requiredDone, total: requiredTotal })
                  : t("applyHub.overview.noData", "Not enough verified requirement data yet")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--ink-faint)" }}>{t("applyHub.overview.deadline", "Deadline")}</p>
          <DeadlineChip deadline={entry.deadline} risk={entry.deadline_risk} />
          {entry.deadline_risk?.reason && (
            <p className="text-xs mt-2" style={{ color: "var(--ink-faint)" }}>{entry.deadline_risk.reason}</p>
          )}
        </div>

        <div className="rounded-2xl p-5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--ink-faint)" }}>{t("applyHub.overview.nextAction", "Next action")}</p>
          <p className="text-sm font-semibold" style={{ color: "var(--accent-light)" }}>{entry.next_action?.action}</p>
        </div>
      </div>

      {missing.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--warn)" }}>
            {t("applyHub.overview.missingTitle", "Missing required items")}
          </p>
          <MissingRequirements requirements={entry.requirements} />
          <button onClick={() => onJumpTab("documents")}
            className="mt-3 text-xs font-bold px-3 py-1.5 rounded-lg transition hover:opacity-90"
            style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
            {t("applyHub.overview.goToDocuments", "Continue Application →")}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Tab: Document Locker ───────────────────────────────────────────────── */
function DocumentLocker({ requirements, onDocsChanged }) {
  const { t } = useTranslation();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("other");
  const [docName, setDocName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("other");
  const fileRef = useRef();

  const DOC_TYPE_LABELS = {
    transcript: t("applyHub.locker.types.transcript"),
    language_cert: t("applyHub.locker.types.language_cert"),
    passport: t("applyHub.locker.types.passport"),
    photo: t("applyHub.locker.types.photo"),
    cv: t("applyHub.locker.types.cv"),
    recommendation: t("applyHub.locker.types.recommendation"),
    other: t("applyHub.locker.types.other"),
  };

  useEffect(() => {
    api.get("/student-documents")
      .then(r => setDocs(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error(t("applyHub.locker.loadFailed")))
      .finally(() => setLoading(false));
  }, []);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    form.append("name", docName || file.name);
    form.append("doc_type", docType);
    setUploading(true);
    try {
      const r = await api.post("/student-documents", form, { headers: { "Content-Type": "multipart/form-data" } });
      setDocs(prev => [r.data, ...prev]);
      setDocName("");
      toast.success(t("applyHub.locker.uploaded"));
      onDocsChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || t("applyHub.locker.uploadFailed"));
    } finally {
      setUploading(false);
      fileRef.current.value = "";
    }
  };

  const download = (doc) => {
    api.get(`/student-documents/${doc.id}/download`, { responseType: "blob" })
      .then(r => {
        const url = URL.createObjectURL(r.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.original_name;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => toast.error(t("applyHub.locker.downloadFailed")));
  };

  const remove = async (id) => {
    if (!confirm(t("applyHub.locker.deleteConfirm"))) return;
    try {
      await api.delete(`/student-documents/${id}`);
      setDocs(prev => prev.filter(d => d.id !== id));
      toast.success(t("applyHub.locker.deleted"));
      onDocsChanged?.();
    } catch {
      toast.error(t("applyHub.locker.deleteFailed"));
    }
  };

  const saveEdit = async (id) => {
    try {
      const r = await api.patch(`/student-documents/${id}`, { name: editName, doc_type: editType });
      setDocs(prev => prev.map(d => d.id === id ? r.data : d));
      setEditId(null);
      toast.success(t("applyHub.locker.saved"));
      onDocsChanged?.();
    } catch {
      toast.error(t("applyHub.locker.saveFailed"));
    }
  };

  const SOURCE_LABELS = {
    verified: { label: t("applyHub.locker.sourceVerified", "Verified requirements for this university"), color: "var(--good)" },
    freetext: { label: t("applyHub.locker.sourceFreetext", "From this university's listed requirements (unstructured)"), color: "var(--warn)" },
    generic:  { label: t("applyHub.locker.sourceGeneric", "General checklist — this university has no verified requirement data yet"), color: "var(--ink-faint)" },
  };

  return (
    <div className="space-y-6">

      {/* Required documents for THIS application — Phase 2's real requirements
          engine (UniversityDocumentItem / freetext / generic), never a
          hardcoded frontend list. */}
      {requirements && (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-[var(--ink)] font-bold text-sm flex items-center gap-2">
              <Icon d={ICONS.applications} size={16} /> {t("applyHub.locker.requiredTitle", "Required for this application")}
            </h3>
            {SOURCE_LABELS[requirements.source] && (
              <span className="text-[10px] font-semibold" style={{ color: SOURCE_LABELS[requirements.source].color }}>
                {SOURCE_LABELS[requirements.source].label}
              </span>
            )}
          </div>
          {requirements.degree_level_note && (
            <p className="text-[11px]" style={{ color: "var(--ink-faint)" }}>{requirements.degree_level_note}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {requirements.items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl px-3 py-2.5"
                   style={{ background: item.matched ? "var(--good-subtle)" : "var(--surface-2)", border: `1px solid ${item.matched ? "rgba(16,185,129,0.4)" : "var(--border)"}` }}>
                <span className="mt-0.5">
                  <Icon d={item.matched ? ICONS.check : ICONS.x} size={16} style={{ color: item.matched ? "var(--good)" : "var(--ink-faint)" }} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: item.matched ? "var(--good)" : "var(--ink)" }}>{item.name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-faint)" }}>
                    {!item.required
                      ? t("applyHub.locker.optional", "Optional")
                      : item.matched
                        ? t("applyHub.locker.matched", "Matched to your uploaded document")
                        : t("applyHub.locker.notUploaded", "Not uploaded yet")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload card — your reusable document library, shared across every application */}
      <div className="bg-[var(--surface-2)]/50 rounded-2xl p-5 border border-[var(--border)]/50">
        <h3 className="text-[var(--ink)] font-semibold mb-1 flex items-center gap-2">
          <Icon d={ICONS.send} size={16} /> {t("applyHub.locker.uploadTitle")}
        </h3>
        <p className="text-xs mb-4" style={{ color: "var(--ink-faint)" }}>
          {t("applyHub.locker.reuseHint", "Upload once — every application checks against the same document library.")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder={t("applyHub.locker.namePlaceholder")}
            value={docName}
            onChange={e => setDocName(e.target.value)}
            className="bg-[var(--border)] border border-[var(--border-strong)] rounded-xl px-3 py-2 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <select
            value={docType}
            onChange={e => setDocType(e.target.value)}
            className="bg-[var(--border)] border border-[var(--border-strong)] rounded-xl px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <label className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${uploading ? "bg-[var(--border)] text-[var(--ink-faint)]" : "bg-sky-600 hover:bg-sky-500 text-[var(--ink)]"}`}>
            {uploading ? t("applyHub.locker.uploading") : t("applyHub.locker.chooseFile")}
            <input ref={fileRef} type="file" className="hidden" onChange={upload} disabled={uploading}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" />
          </label>
        </div>
        <p className="text-xs text-[var(--ink-faint)] mt-2">{t("applyHub.locker.fileHint")}</p>
      </div>

      {/* Document list */}
      {loading ? (
        <div className="text-center py-10 text-[var(--ink-faint)]">Loading…</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16">
          <div className="mb-3 flex justify-center"><Icon d={ICONS.folder} size={40} /></div>
          <p className="text-[var(--ink-faint)]">{t("applyHub.locker.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.id} className="bg-[var(--surface-2)]/50 border border-[var(--border)]/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              {editId === doc.id ? (
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <input
                    className="flex-1 bg-[var(--border)] border border-[var(--border-strong)] rounded-lg px-3 py-1.5 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                  />
                  <select
                    className="bg-[var(--border)] border border-[var(--border-strong)] rounded-lg px-3 py-1.5 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={editType}
                    onChange={e => setEditType(e.target.value)}
                  >
                    {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(doc.id)} className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-[var(--ink)] text-xs rounded-lg transition-colors">{t("applyHub.locker.save")}</button>
                    <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-[var(--border)] hover:bg-[var(--border-strong)] text-[var(--ink-dim)] text-xs rounded-lg transition-colors">{t("applyHub.locker.cancel")}</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[var(--ink)] text-sm font-medium truncate">{doc.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DOC_TYPE_COLORS[doc.doc_type] || DOC_TYPE_COLORS.other}`}>
                        {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ink-faint)] mt-0.5">{doc.original_name} · {fmt(doc.file_size)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => download(doc)} className="px-3 py-1.5 bg-[var(--border)] hover:bg-[var(--border-strong)] text-[var(--ink-dim)] text-xs rounded-lg transition-colors">{t("applyHub.locker.download")}</button>
                    <button onClick={() => { setEditId(doc.id); setEditName(doc.name); setEditType(doc.doc_type); }} className="px-3 py-1.5 bg-[var(--border)] hover:bg-[var(--border-strong)] text-[var(--ink-dim)] text-xs rounded-lg transition-colors">{t("applyHub.locker.edit")}</button>
                    <button onClick={() => remove(doc.id)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors"><Icon d={ICONS.trash} size={14} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Tab: Motivation Letter — application-specific (Phase 4) ───────────────
   Operates on PipelineEntry.motivation_letter via the SAME field/endpoints
   Pipeline's CardDetail already uses (PATCH /pipeline/{id}, POST
   /pipeline/{id}/regenerate) — one letter per application, one source of
   truth. Replaces the old standalone multi-letter writer, which saved into
   a completely separate, disconnected MotivationLetter table. ─── */
function ApplicationMotivationLetter({ entry, onUpdate, onRegenerate }) {
  const { t } = useTranslation();
  const [letter, setLetter] = useState(entry.motivation_letter || "");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => { setLetter(entry.motivation_letter || ""); setDirty(false); }, [entry.id, entry.motivation_letter]);

  const save = async () => {
    setSaving(true);
    await onUpdate({ motivation_letter: letter });
    setDirty(false);
    setSaving(false);
    toast.success(t("pipeline.letterSaved"));
  };

  const regenerate = async () => {
    setRegenerating(true);
    const updated = await onRegenerate();
    if (updated) { setLetter(updated.motivation_letter || ""); setDirty(false); }
    setRegenerating(false);
  };

  const getFeedback = async () => {
    if (!letter || letter.trim().length < 50) { toast.error(t("applyHub.letter.tooShort", "Write at least 50 characters first.")); return; }
    setFeedbackLoading(true);
    try {
      const r = await api.post("/ai-chat/letter-feedback", {
        content: letter,
        university_name: entry.university?.name,
      });
      setFeedback(r.data);
    } catch { toast.error(t("applyHub.letter.feedbackFailed", "AI feedback unavailable. Try again.")); }
    finally { setFeedbackLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.25)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--accent-light)" }}>
          {t("applyHub.letter.specificTo", "This letter is specific to {{uni}}", { uni: entry.university?.name })}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--ink-faint)" }}>
          {t("applyHub.letter.specificToDesc", "Generated using your profile and this university's real program information — not a generic template.")}
        </p>
      </div>

      {!letter && !regenerating && (
        <p className="text-sm" style={{ color: "var(--ink-faint)" }}>{t("pipeline.noLetter")}</p>
      )}

      <textarea
        value={letter}
        onChange={e => { setLetter(e.target.value); setDirty(true); }}
        rows={16}
        placeholder={t("pipeline.letterPlaceholder")}
        className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-mono leading-relaxed"
      />

      <div className="flex gap-2 flex-wrap">
        <button onClick={save} disabled={!dirty || saving}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-[var(--ink)] text-sm rounded-xl transition-colors">
          {saving ? t("pipeline.saving") : t("pipeline.saveLetter")}
        </button>
        <button onClick={regenerate} disabled={regenerating}
          className="px-4 py-2 bg-[var(--border)] hover:bg-[var(--border-strong)] text-[var(--ink-dim)] text-sm rounded-xl transition-colors">
          {regenerating ? t("pipeline.regenerating") : t("pipeline.regenerateShort")}
        </button>
        <button onClick={() => { navigator.clipboard.writeText(letter); toast.success(t("pipeline.copied")); }}
          className="px-4 py-2 bg-[var(--border)] hover:bg-[var(--border-strong)] text-[var(--ink-dim)] text-sm rounded-xl transition-colors">
          {t("pipeline.copyLetter")}
        </button>
        <button onClick={getFeedback} disabled={feedbackLoading || !letter}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-[var(--ink)] text-sm rounded-xl transition-colors flex items-center gap-1.5">
          {feedbackLoading ? t("applyHub.letter.analyzing", "Analyzing…") : t("applyHub.letter.aiReview", "AI Review")}
        </button>
      </div>

      {feedback && (
        <div className="mt-4 rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-[var(--ink)] text-sm">{t("applyHub.letter.aiReview", "AI Review")}</h4>
            <button onClick={() => setFeedback(null)} className="text-[var(--ink-faint)] hover:text-[var(--ink)] text-lg leading-none">×</button>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-3xl font-extrabold ${feedback.score >= 7 ? "text-emerald-400" : feedback.score >= 5 ? "text-amber-400" : "text-red-400"}`}>
              {feedback.score}/10
            </div>
            <p className="text-[var(--ink-dim)] text-sm">{feedback.summary}</p>
          </div>
          {feedback.weaknesses?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1.5">{t("applyHub.letter.weaknesses", "Weaknesses")}</p>
              <ul className="space-y-1">
                {feedback.weaknesses.map((s, i) => <li key={i} className="text-sm text-[var(--ink-dim)] flex gap-2"><span className="text-red-400 shrink-0">✗</span>{s}</li>)}
              </ul>
            </div>
          )}
          {feedback.improvements?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">{t("applyHub.letter.improvements", "How to Improve")}</p>
              <ul className="space-y-1">
                {feedback.improvements.map((s, i) => <li key={i} className="text-sm text-[var(--ink-dim)] flex gap-2"><span className="text-amber-400 shrink-0">{i + 1}.</span>{s}</li>)}
              </ul>
            </div>
          )}
          {feedback.missing_elements?.filter(Boolean).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--ink-faint)] uppercase tracking-wider mb-1.5">{t("applyHub.letter.missing", "Missing Elements")}</p>
              <ul className="space-y-1">
                {feedback.missing_elements.filter(Boolean).map((s, i) => <li key={i} className="text-sm text-[var(--ink-faint)] flex gap-2"><span className="shrink-0">—</span>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── CopyField ─── */
function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div
      onClick={copy}
      className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-colors ${value ? "border-[var(--border-strong)] hover:border-sky-500 hover:bg-sky-500/10 bg-[var(--border)]/50" : "border-[var(--border)] bg-[var(--surface-2)]/30 opacity-50 cursor-not-allowed"}`}
    >
      <div>
        <p className="text-xs text-[var(--ink-faint)]">{label}</p>
        <p className="text-sm text-[var(--ink)]">{value || "—"}</p>
      </div>
      <span className={`text-xs font-medium ml-2 shrink-0 ${copied ? "text-emerald-400" : "text-[var(--ink-faint)]"}`}>
        {copied ? "✓" : ""}
      </span>
    </div>
  );
}

/* ─── Tab: Portal Guide — verified data only (Phase 4) ───────────────────────
   Reuses the SAME verified-guide endpoint Pipeline's CardDetail already
   calls (GET /application-guides/{university_id}), instead of the old
   hardcoded generic step templates that were shown regardless of whether
   real per-university data existed. Honest "unavailable" state when it
   doesn't — never fabricated steps. ─── */
function PortalGuide({ uni, profile, onGoToDocuments }) {
  const { t } = useTranslation();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState({});

  const ACTION_TYPE_STYLES = {
    document: { icon: "email", color: "bg-sky-500/20 border-sky-500/40 text-sky-300" },
    account:  { icon: "profile", color: "bg-purple-500/20 border-purple-500/40 text-purple-300" },
    portal:   { icon: "globe", color: "bg-sky-500/20 border-sky-500/40 text-sky-300" },
    payment:  { icon: "creditCard", color: "bg-red-500/20 border-red-500/40 text-red-300" },
    email:    { icon: "mail", color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" },
    info:     { icon: "info", color: "bg-amber-500/20 border-amber-500/40 text-amber-300" },
  };

  useEffect(() => {
    if (!uni?.id) { setLoading(false); return; }
    setLoading(true);
    api.get(`/application-guides/${uni.id}`)
      .then(r => setGuide(r.data?.guide || null))
      .catch(() => setGuide(null))
      .finally(() => setLoading(false));
  }, [uni?.id]);

  const portalUrl = uni?.application_portal_url || uni?.website;
  const toggleStep = (i) => setCompletedSteps(prev => ({ ...prev, [i]: !prev[i] }));
  const doneCount = guide ? guide.filter((_, i) => completedSteps[i]).length : 0;

  if (loading) return <div className="text-center py-10 text-[var(--ink-faint)]">Loading…</div>;

  if (!guide) {
    return (
      <div className="text-center py-16 space-y-2">
        <div className="flex justify-center"><Icon d={ICONS.applications} size={40} /></div>
        <p className="text-[var(--ink-faint)] text-sm font-semibold">{t("applyHub.guide.unavailableTitle", "Portal instructions unavailable")}</p>
        <p className="text-[var(--ink-faint)] text-xs max-w-sm mx-auto">
          {t("applyHub.guide.unavailableDesc", "We don't have verified step-by-step instructions for this university yet — please verify the current process on the official university portal.")}
        </p>
        {portalUrl && (
          <a href={portalUrl} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-1.5 mt-2 text-sm text-sky-400 hover:text-sky-300 font-medium">
            {t("pipeline.openPortal")} →
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-[var(--surface-2)]/50 rounded-2xl p-5 border border-[var(--border)]/50 flex items-center justify-between gap-4">
        <p className="text-sm" style={{ color: "var(--ink-faint)" }}>
          {t("pipeline.guideDesc", { name: uni.name })}
        </p>
        <div className="shrink-0 text-center">
          <div className="text-2xl font-bold text-[var(--ink)]">{doneCount}/{guide.length}</div>
          <div className="text-xs text-[var(--ink-faint)]">{t("applyHub.guide.stepsDone")}</div>
        </div>
      </div>

      <div className="space-y-3">
        {guide.map((step, i) => {
          const style = ACTION_TYPE_STYLES[step.action_type] || ACTION_TYPE_STYLES.info;
          const done = !!completedSteps[i];
          return (
            <div key={i} className={`rounded-2xl border p-5 transition-all ${done ? "bg-emerald-500/5 border-emerald-500/30" : "bg-[var(--surface-2)]/50 border-[var(--border)]/50"}`}>
              <div className="flex items-start gap-4">
                <button onClick={() => toggleStep(i)}
                  className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${done ? "border-emerald-500 bg-emerald-500 text-[var(--ink)]" : "border-[var(--border-strong)] hover:border-sky-400"}`}>
                  {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Icon d={ICONS[style.icon]} size={16} />
                    <h4 className={`font-semibold text-sm ${done ? "text-emerald-400 line-through" : "text-[var(--ink)]"}`}>{step.title}</h4>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border capitalize ${style.color}`}>{step.action_type}</span>
                  </div>
                  <p className="text-[var(--ink-dim)] text-sm mt-1 leading-relaxed">{step.description}</p>
                  {step.url && (
                    <a href={step.url} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1 mt-2 text-xs text-sky-400 hover:text-sky-300 underline underline-offset-2">
                      {t("pipeline.openLink")}
                    </a>
                  )}
                  {step.action_type === "document" && (
                    <button onClick={onGoToDocuments} className="inline-flex items-center gap-1.5 mt-2 text-xs text-sky-400 hover:text-sky-300 font-medium">
                      {t("applyHub.guide.docLockerLink")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {portalUrl && (
        <a href={portalUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between p-3 bg-sky-600/10 border border-sky-500/30 rounded-xl hover:bg-sky-600/20 transition-colors">
          <div>
            <p className="text-sky-300 text-sm font-semibold">{t("pipeline.openPortal")}</p>
            <p className="text-[var(--ink-faint)] text-xs truncate">{portalUrl}</p>
          </div>
          <span className="text-sky-400 text-lg shrink-0">→</span>
        </a>
      )}

      {doneCount === guide.length && guide.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center">
          <div className="mb-2 flex justify-center"><Icon d={ICONS.check} size={26} /></div>
          <p className="text-emerald-400 font-semibold">{t("applyHub.guide.allDoneTitle")}</p>
          <p className="text-[var(--ink-faint)] text-sm mt-1">{t("applyHub.guide.allDoneDesc", { uni: uni.name })}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Step: Personal Info (Phase 4 — completeness-aware) ─── */
function PersonalInfoStep() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const SURF   = "var(--surface-2)";
  const CARD   = "var(--surface-2)";
  const BORDER = "var(--border)";
  const DIM    = "var(--ink-faint)";
  const GRAD   = "linear-gradient(135deg, var(--accent), var(--accent))";

  const roStyle = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "10px 14px", color: "var(--ink-dim)", width: "100%", fontSize: 14, opacity: 0.8 };
  const editStyle = { background: CARD, border: `1px solid rgba(14,165,233,0.4)`, borderRadius: 12, padding: "10px 14px", color: "#fff", width: "100%", fontSize: 14, outline: "none" };

  useEffect(() => {
    api.get("/profiles/me")
      .then(r => { setProfile(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setEmail(user?.email || ""); }, [user]);

  const saveEmail = async () => {
    if (!email || email === user?.email) return;
    setSavingEmail(true);
    try {
      await api.patch("/auth/update-email", { email });
      toast.success("Email updated");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to update email");
    } finally {
      setSavingEmail(false);
    }
  };

  if (loading) return <div className="py-16 text-center" style={{ color: DIM }}>Loading…</div>;

  // Completeness is computed once, server-side, in application_readiness.py —
  // the same calculation Apply Hub's Final Submission Check and AI Chat use.
  // Never recomputed here.
  const completeness = profile?.completeness || { complete: false, filled_count: 0, total_count: 8 };
  const { complete, filled_count: filledCount, total_count: totalCount } = completeness;

  const Row = ({ label, value }) => (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: DIM }}>{label}</label>
      <div style={roStyle}>{value || <span style={{ opacity: 0.4 }}>—</span>}</div>
    </div>
  );

  return (
    <div className="rounded-2xl p-6 space-y-5" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-[var(--ink)] font-bold text-base">Personal & academic info</h3>
          <p className="text-xs mt-1" style={{ color: DIM }}>
            Your info is pulled from your profile.{" "}
            <a href="/profile" className="underline" style={{ color: "var(--accent-light)" }}>Edit in My Profile →</a>
          </p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
              style={{ background: complete ? "var(--good-subtle)" : "var(--warn-subtle)", color: complete ? "var(--good)" : "var(--warn)" }}>
          {complete ? "Complete" : `${filledCount}/${totalCount} complete`}
        </span>
      </div>

      {!complete && (
        <div className="rounded-xl p-3 flex items-center justify-between gap-3" style={{ background: "var(--warn-subtle)", border: "1px solid rgba(251,191,36,0.3)" }}>
          <p className="text-xs" style={{ color: "var(--warn)" }}>Some profile fields are missing — universities may need this information.</p>
          <a href="/profile" className="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition hover:opacity-90" style={{ background: "var(--warn)", color: "#1c1500" }}>Complete profile</a>
        </div>
      )}

      {/* Email — editable */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: DIM }}>Email</label>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={editStyle}
            onFocus={e => { e.target.style.borderColor = "rgba(14,165,233,0.7)"; }}
            onBlur={e => { e.target.style.borderColor = "rgba(14,165,233,0.4)"; }}
          />
          <button
            onClick={saveEmail}
            disabled={savingEmail || email === user?.email}
            className="px-4 py-2 rounded-xl text-sm font-bold text-[var(--ink)] transition hover:opacity-90 disabled:opacity-40 whitespace-nowrap"
            style={{ background: GRAD }}>
            {savingEmail ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Read-only profile fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Row label="Full Name"       value={profile?.full_name} />
        <Row label="GPA"             value={profile?.gpa} />
        <Row label="Degree Level"    value={profile?.degree_level} />
        <Row label="Field of Study"  value={profile?.field_of_study} />
        <Row label="Nationality"     value={profile?.nationality} />
        <Row label="English Level"   value={profile?.english_level?.toUpperCase()} />
        <Row label="Target Language" value={profile?.language} />
        <Row label="Budget (€/yr)"   value={profile?.budget_eur ? `€${profile.budget_eur.toLocaleString()}` : null} />
      </div>

      <Row label="Target Countries" value={profile?.preferred_countries} />
    </div>
  );
}

/* ─── Application picker — shown when Apply Hub is opened with no entryId ─── */
function ApplicationPicker() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/pipeline")
      .then(r => setEntries(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 text-center" style={{ color: "var(--ink-faint)" }}>Loading…</div>;

  if (entries.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="flex justify-center mb-3"><Icon d={ICONS.applications} size={40} /></div>
        <h2 className="text-[var(--ink)] font-bold text-lg mb-2">No applications yet</h2>
        <p className="text-sm mb-6" style={{ color: "var(--ink-faint)" }}>Add a university to your Pipeline first, then continue its application here.</p>
        <Link to="/pipeline" className="inline-block px-6 py-3 rounded-xl font-bold text-sm text-[var(--ink)] transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-light))" }}>
          Go to Pipeline
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <h2 className="text-[var(--ink)] font-bold text-lg mb-1">Select an application to work on</h2>
      <p className="text-sm mb-4" style={{ color: "var(--ink-faint)" }}>Choose from your Pipeline applications.</p>
      {entries.map(e => (
        <button key={e.id} onClick={() => navigate(`/apply-hub/${e.id}`)}
          className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl text-left transition hover:bg-[var(--surface-hover)]"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <div className="min-w-0">
            <p className="font-bold text-[var(--ink)] truncate">{e.university.name}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--ink-faint)" }}>{e.university.city}, {e.university.country}</p>
          </div>
          <ReadinessRing readiness={e.readiness} size={36} />
        </button>
      ))}
    </div>
  );
}

/* ─── Tab: Final Submission Check (Phase 5) ─────────────────────────────────
   Answers "is this application actually ready to submit?" — computed
   entirely server-side by /pipeline/{id}/submission-check (the same shared
   application_readiness service used by Pipeline and AI Chat). This never
   recomputes readiness itself and never claims the university will accept
   the application — only whether it appears ready to submit. ─── */
const STATE_META = {
  READY:            { label: "Ready to Submit",   color: "var(--good)",   bg: "var(--good-subtle)" },
  BLOCKED:          { label: "Not Ready Yet",      color: "var(--warn)",   bg: "var(--warn-subtle)" },
  DATA_INCOMPLETE:  { label: "Can't Confirm Yet",  color: "var(--ink-dim)", bg: "var(--surface-3, var(--surface-2))" },
  DEADLINE_PASSED:  { label: "Deadline Passed",    color: "var(--danger)", bg: "var(--danger-subtle)" },
};

function CheckRow({ ok, unknown, label, detail, onJump }) {
  const color = unknown ? "var(--ink-faint)" : ok ? "var(--good)" : "var(--warn)";
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              style={{ background: unknown ? "var(--surface-3, var(--surface-2))" : ok ? "var(--good-subtle)" : "var(--warn-subtle)", color }}>
          {unknown ? "?" : ok ? "✓" : "!"}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--ink)]">{label}</p>
          {detail && <p className="text-xs mt-0.5" style={{ color: "var(--ink-faint)" }}>{detail}</p>}
        </div>
      </div>
      {!ok && onJump && (
        <button onClick={onJump} className="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition hover:opacity-90"
                style={{ background: "var(--surface-3, var(--surface-2))", color: "var(--accent-light)", border: "1px solid var(--border)" }}>
          Fix →
        </button>
      )}
    </div>
  );
}

function FinalSubmissionCheck({ entry, onJumpTab }) {
  const [check, setCheck] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/pipeline/${entry.id}/submission-check`)
      .then(r => setCheck(r.data))
      .catch(() => setCheck(null))
      .finally(() => setLoading(false));
  }, [entry.id]);

  if (loading) return <div className="py-16 text-center" style={{ color: "var(--ink-faint)" }}>Checking your application…</div>;
  if (!check) return <div className="py-16 text-center" style={{ color: "var(--ink-faint)" }}>Couldn't load the submission check. Try again shortly.</div>;

  const meta = STATE_META[check.state] || STATE_META.DATA_INCOMPLETE;
  const isDataIncomplete = check.state === "DATA_INCOMPLETE";
  const requiredTotal = check.readiness?.required_total ?? 0;
  const requiredDone = check.readiness?.required_done ?? 0;

  return (
    <div className="space-y-5">
      {/* Overall result */}
      <div className="rounded-2xl p-6" style={{ background: meta.bg, border: `1px solid ${meta.color}33` }}>
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: meta.color }}>Final Submission Check</p>
            <h2 className="text-xl font-bold mt-1" style={{ color: meta.color }}>{meta.label}</h2>
          </div>
        </div>
        <p className="text-sm mt-3" style={{ color: "var(--ink-dim)" }}>{check.summary}</p>
        {check.confidence_note && (
          <p className="text-xs mt-2 font-medium" style={{ color: meta.color }}>⚠ {check.confidence_note}</p>
        )}
        {check.state === "READY" && (
          <button
            onClick={() => onJumpTab("portal")}
            className="mt-4 text-sm font-bold px-4 py-2.5 rounded-xl transition hover:opacity-90"
            style={{ background: "var(--good)", color: "#04210f" }}
          >
            Continue to Portal →
          </button>
        )}
      </div>

      {/* Checklist */}
      <div className="rounded-2xl p-6" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <h3 className="text-[var(--ink)] font-bold text-sm mb-1">Checklist</h3>
        <p className="text-xs mb-2" style={{ color: "var(--ink-faint)" }}>Exactly why this result is what it is.</p>

        <CheckRow
          ok={check.personal_info.complete}
          label="Personal Information"
          detail={`${check.personal_info.filled_count}/${check.personal_info.total_count} complete`}
          onJump={() => onJumpTab("personal")}
        />
        <CheckRow
          ok={isDataIncomplete ? false : requiredTotal > 0 && requiredDone === requiredTotal}
          unknown={requiredTotal === 0}
          label="Required Documents"
          detail={requiredTotal > 0 ? `${requiredDone}/${requiredTotal} complete` : "No verified requirement data"}
          onJump={() => onJumpTab("documents")}
        />
        <CheckRow
          ok={check.motivation_letter_complete}
          label="Motivation Letter"
          detail={check.motivation_letter_complete ? "Complete" : "Not written yet"}
          onJump={() => onJumpTab("letter")}
        />
        <CheckRow
          ok={check.requirements_source === "verified"}
          unknown={isDataIncomplete}
          label="Requirement Data Quality"
          detail={
            check.requirements_source === "verified" ? "University-specific requirements, verified" :
            check.requirements_source === "freetext" ? "From this university's own listing, not independently verified" :
            "No university-specific requirement data — checklist shown is generic"
          }
        />
        <CheckRow
          ok={check.deadline_risk?.level === "on_track" || check.deadline_risk?.level === "low"}
          unknown={check.deadline_risk?.level === "unknown"}
          label="Deadline"
          detail={
            check.deadline?.parseable
              ? `${check.deadline.days_remaining >= 0 ? `${check.deadline.days_remaining} day(s) remaining` : "Passed"}${check.deadline.multiple_dates ? " (multiple intake dates listed — verify which applies to you)" : ""}`
              : "Deadline information unavailable — verify the official university deadline"
          }
        />
      </div>

      {/* Missing items detail, when blocked */}
      {check.issues.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <h3 className="text-[var(--ink)] font-bold text-sm mb-3">What's missing</h3>
          <ul className="space-y-2">
            {check.issues.map((issue, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-sm">
                <span style={{ color: "var(--ink-dim)" }}>{issue.label}</span>
                <button onClick={() => onJumpTab(issue.jump_to)} className="text-xs font-bold shrink-0" style={{ color: "var(--accent-light)" }}>
                  Fix →
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Main page ─── */
export default function ApplicationHub() {
  const { t } = useTranslation();
  const { entryId } = useParams();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(!!entryId);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState("overview");

  const BG     = "var(--bg)";
  const SURF   = "var(--surface-2)";
  const CARD   = "var(--surface-2)";
  const BORDER = "var(--border)";
  const GRAD   = "linear-gradient(135deg, var(--accent), var(--accent))";
  const DIM    = "var(--ink-faint)";

  const loadEntry = () => {
    if (!entryId) return;
    setLoading(true);
    api.get(`/pipeline/${entryId}`)
      .then(r => { setEntry(r.data); setNotFound(false); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadEntry(); /* eslint-disable-next-line */ }, [entryId]);

  const updateEntry = async (patch) => {
    try {
      const r = await api.patch(`/pipeline/${entryId}`, patch);
      setEntry(r.data);
      return r.data;
    } catch {
      toast.error("Update failed");
      return null;
    }
  };

  const regenerateEntry = async () => {
    try {
      const r = await api.post(`/pipeline/${entryId}/regenerate`);
      setEntry(r.data);
      toast.success(t("pipeline.analysisRefreshed"));
      return r.data;
    } catch {
      toast.error(t("pipeline.regenFailed"));
      return null;
    }
  };

  // No entryId at all — let the student pick which application to work on.
  if (!entryId) {
    return (
      <div className="min-h-screen" style={{ background: BG, color: "var(--ink)" }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <ApplicationPicker />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !entry) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-3" style={{ background: BG }}>
        <p style={{ color: DIM }}>Application not found.</p>
        <Link to="/pipeline" className="text-sm font-bold" style={{ color: "var(--accent-light)" }}>← Back to Applications</Link>
      </div>
    );
  }

  const TABS = [
    { id: "overview", label: t("applyHub.tabs.overview", "Overview") },
    { id: "personal", label: "Personal Info" },
    { id: "documents", label: "Documents" },
    { id: "letter", label: "Motivation Letter" },
    { id: "portal", label: t("applyHub.tabs.portal", "Portal Guide") },
    { id: "check", label: "Final Check" },
  ];

  return (
    <div className="min-h-screen" style={{ background: BG, color: "var(--ink)" }}>
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* Page title + back link */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link to="/pipeline" className="text-xs font-semibold inline-flex items-center gap-1 mb-2 transition hover:opacity-80" style={{ color: "var(--accent-light)" }}>
              ← {t("applyHub.backToApplications", "Back to Applications")}
            </Link>
            <h1 className="text-2xl font-bold text-[var(--ink)]">{entry.university.name}</h1>
            <p className="text-sm mt-0.5" style={{ color: DIM }}>{t("applyHub.subtitle")}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 rounded-2xl overflow-hidden" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
          <div className="flex px-2 overflow-x-auto">
            {TABS.map(tb => (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                className="px-4 py-3.5 text-sm font-semibold transition-colors whitespace-nowrap border-b-2"
                style={{ color: tab === tb.id ? "var(--ink)" : DIM, borderColor: tab === tb.id ? "var(--accent)" : "transparent" }}>
                {tb.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          {tab === "overview" && <ApplicationOverview entry={entry} onJumpTab={setTab} />}
          {tab === "personal" && <PersonalInfoStep />}
          {tab === "documents" && <DocumentLocker requirements={entry.requirements} onDocsChanged={loadEntry} />}
          {tab === "letter" && <ApplicationMotivationLetter entry={entry} onUpdate={updateEntry} onRegenerate={regenerateEntry} />}
          {tab === "portal" && <PortalGuide uni={entry.university} onGoToDocuments={() => setTab("documents")} />}
          {tab === "check" && <FinalSubmissionCheck entry={entry} onJumpTab={setTab} />}
        </div>
      </div>
    </div>
  );
}
