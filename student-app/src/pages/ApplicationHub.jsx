import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

/* ─── helpers ─── */
const fmt = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const DOC_TYPE_COLORS = {
  transcript: "bg-blue-500/20 text-blue-300",
  language_cert: "bg-purple-500/20 text-purple-300",
  passport: "bg-amber-500/20 text-amber-300",
  photo: "bg-pink-500/20 text-pink-300",
  cv: "bg-emerald-500/20 text-emerald-300",
  recommendation: "bg-cyan-500/20 text-cyan-300",
  other: "bg-slate-500/20 text-slate-300",
};

/* ─── Tab: Document Locker ─── */
function DocumentLocker() {
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
    } catch {
      toast.error(t("applyHub.locker.saveFailed"));
    }
  };

  const REQUIRED_DOCS = [
    { type: "passport",      icon: "🛂", label: "Passport / National ID",        desc: "Valid passport or national identity card (colour scan)" },
    { type: "transcript",    icon: "📄", label: "Academic Transcript",            desc: "Official university/school transcript with GPA" },
    { type: "language_cert", icon: "🌐", label: "Language Certificate",           desc: "IELTS, TOEFL, TestDaF, Goethe-Zertifikat, or equivalent" },
    { type: "cv",            icon: "📋", label: "CV / Résumé",                    desc: "Academic or professional CV (max 2 pages)" },
    { type: "recommendation",icon: "✉️", label: "Recommendation Letter",          desc: "At least one letter from a professor or employer" },
    { type: "photo",         icon: "🖼️", label: "Passport Photo",                 desc: "Recent passport-size photo (white background)" },
  ];

  const uploadedTypes = new Set(docs.map(d => d.doc_type));

  return (
    <div className="space-y-6">

      {/* Required documents checklist */}
      <div className="rounded-2xl p-5 space-y-3" style={{ background: "oklch(0.17 0.022 285)", border: "1px solid oklch(1 0 0 / 0.07)" }}>
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <span>📋</span> Documents You Need to Upload
        </h3>
        <p className="text-xs" style={{ color: "oklch(0.55 0.02 285)" }}>
          Most European universities require these documents. Upload them below.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          {REQUIRED_DOCS.map(({ type, icon, label, desc }) => {
            const done = uploadedTypes.has(type);
            return (
              <div key={type} className="flex items-start gap-3 rounded-xl px-3 py-2.5" style={{ background: done ? "oklch(0.25 0.06 160 / 0.25)" : "oklch(0.20 0.024 285)", border: `1px solid ${done ? "oklch(0.50 0.15 160 / 0.4)" : "oklch(1 0 0 / 0.06)"}` }}>
                <span className="text-lg mt-0.5">{done ? "✅" : icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: done ? "oklch(0.75 0.15 160)" : "#fff" }}>{label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.02 285)" }}>{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload card */}
      <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span>📤</span> {t("applyHub.locker.uploadTitle")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder={t("applyHub.locker.namePlaceholder")}
            value={docName}
            onChange={e => setDocName(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={docType}
            onChange={e => setDocType(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <label className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${uploading ? "bg-slate-700 text-slate-400" : "bg-indigo-600 hover:bg-indigo-500 text-white"}`}>
            {uploading ? t("applyHub.locker.uploading") : t("applyHub.locker.chooseFile")}
            <input ref={fileRef} type="file" className="hidden" onChange={upload} disabled={uploading}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" />
          </label>
        </div>
        <p className="text-xs text-slate-500 mt-2">{t("applyHub.locker.fileHint")}</p>
      </div>

      {/* Document list */}
      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading…</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🗂️</div>
          <p className="text-slate-400">{t("applyHub.locker.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              {editId === doc.id ? (
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <input
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                  />
                  <select
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={editType}
                    onChange={e => setEditType(e.target.value)}
                  >
                    {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(doc.id)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors">{t("applyHub.locker.save")}</button>
                    <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors">{t("applyHub.locker.cancel")}</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-medium truncate">{doc.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DOC_TYPE_COLORS[doc.doc_type] || DOC_TYPE_COLORS.other}`}>
                        {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{doc.original_name} · {fmt(doc.file_size)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => download(doc)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors">{t("applyHub.locker.download")}</button>
                    <button onClick={() => { setEditId(doc.id); setEditName(doc.name); setEditType(doc.doc_type); }} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors">{t("applyHub.locker.edit")}</button>
                    <button onClick={() => remove(doc.id)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors">🗑</button>
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

/* ─── Tab: Motivation Letter ─── */
function MotivationLetterWriter() {
  const { t } = useTranslation();
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unis, setUnis] = useState([]);
  const [selectedUniId, setSelectedUniId] = useState("");
  const [program, setProgram] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeLetterIdx, setActiveLetterIdx] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/motivation-letters"),
      api.get("/universities?limit=200"),
    ]).then(([lRes, uRes]) => {
      setLetters(Array.isArray(lRes.data) ? lRes.data : []);
      const uData = Array.isArray(uRes.data) ? uRes.data : (uRes.data?.items || []);
      setUnis(uData);
    }).catch(() => toast.error(t("applyHub.letter.loadFailed")))
      .finally(() => setLoading(false));
  }, []);

  const generate = async () => {
    setGenerating(true);
    setDraftContent("");
    try {
      const r = await api.post("/motivation-letters/generate", {
        university_id: selectedUniId ? parseInt(selectedUniId) : null,
        program: program || null,
        extra_notes: extraNotes || null,
      });
      setDraftContent(r.data.content);
    } catch (err) {
      toast.error(err?.response?.data?.detail || t("applyHub.letter.generationFailed"));
    } finally {
      setGenerating(false);
    }
  };

  const saveLetter = async () => {
    if (!draftContent.trim()) return;
    setSaving(true);
    const uni = unis.find(u => u.id === parseInt(selectedUniId));
    try {
      const r = await api.post("/motivation-letters", {
        university_id: selectedUniId ? parseInt(selectedUniId) : null,
        university_name: uni?.name || null,
        program: program || null,
        content: draftContent,
      });
      setLetters(prev => [r.data, ...prev]);
      setDraftContent("");
      setSelectedUniId("");
      setProgram("");
      setExtraNotes("");
      toast.success(t("applyHub.letter.letterSaved"));
    } catch {
      toast.error(t("applyHub.letter.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const deleteLetter = async (id) => {
    if (!confirm(t("applyHub.letter.deleteConfirm"))) return;
    try {
      await api.delete(`/motivation-letters/${id}`);
      setLetters(prev => prev.filter(l => l.id !== id));
      if (activeLetterIdx !== null && letters[activeLetterIdx]?.id === id) setActiveLetterIdx(null);
      toast.success(t("applyHub.letter.deleted"));
    } catch {
      toast.error(t("applyHub.letter.deleteFailed"));
    }
  };

  const updateLetter = async (id, content) => {
    try {
      const r = await api.patch(`/motivation-letters/${id}`, { content });
      setLetters(prev => prev.map(l => l.id === id ? r.data : l));
      toast.success(t("applyHub.letter.letterSaved"));
    } catch {
      toast.error(t("applyHub.letter.saveFailed"));
    }
  };

  if (loading) return <div className="text-center py-10 text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      {/* Generator */}
      <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2"><span>✨</span> {t("applyHub.letter.generatorTitle")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">{t("applyHub.letter.targetUni")}</label>
            <select
              value={selectedUniId}
              onChange={e => setSelectedUniId(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t("applyHub.letter.selectUni")}</option>
              {unis.map(u => <option key={u.id} value={u.id}>{u.name} — {u.country}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">{t("applyHub.letter.targetProgram")}</label>
            <input
              value={program}
              onChange={e => setProgram(e.target.value)}
              placeholder={t("applyHub.letter.programPlaceholder")}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">{t("applyHub.letter.extraContext")}</label>
          <textarea
            value={extraNotes}
            onChange={e => setExtraNotes(e.target.value)}
            placeholder={t("applyHub.letter.extraPlaceholder")}
            rows={2}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium rounded-xl text-sm transition-colors flex items-center gap-2"
        >
          {generating ? (
            <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" /></svg> {t("applyHub.letter.generating")}</>
          ) : t("applyHub.letter.generate")}
        </button>
      </div>

      {/* Draft editor */}
      {(draftContent || generating) && (
        <div className="bg-slate-800/50 rounded-2xl p-5 border border-indigo-500/30 space-y-3">
          <h3 className="text-white font-semibold flex items-center gap-2"><span>📝</span> {t("applyHub.letter.draftTitle")}</h3>
          <textarea
            value={draftContent}
            onChange={e => setDraftContent(e.target.value)}
            rows={16}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono leading-relaxed"
          />
          <div className="flex gap-3 flex-wrap">
            <button onClick={saveLetter} disabled={saving || !draftContent.trim()} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
              {saving ? t("applyHub.letter.saving") : t("applyHub.letter.saveLetter")}
            </button>
            <button onClick={generate} disabled={generating} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-xl transition-colors">
              {t("applyHub.letter.regenerate")}
            </button>
            <button onClick={() => { navigator.clipboard.writeText(draftContent); toast.success(t("applyHub.letter.copied")); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-xl transition-colors">
              {t("applyHub.letter.copy")}
            </button>
          </div>
        </div>
      )}

      {/* Saved letters */}
      {letters.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-white font-semibold">{t("applyHub.letter.savedLetters", { count: letters.length })}</h3>
          {letters.map((letter, idx) => (
            <div key={letter.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-700/30 transition-colors"
                onClick={() => setActiveLetterIdx(activeLetterIdx === idx ? null : idx)}
              >
                <div>
                  <p className="text-white text-sm font-medium">{letter.university_name || t("applyHub.letter.generalLetter")}</p>
                  <p className="text-xs text-slate-400">{letter.program || t("applyHub.letter.noProgram")} · {new Date(letter.updated_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={e => { e.stopPropagation(); deleteLetter(letter.id); }} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors">{t("applyHub.letter.delete")}</button>
                  <span className="text-slate-400 text-xs">{activeLetterIdx === idx ? "▲" : "▼"}</span>
                </div>
              </div>
              {activeLetterIdx === idx && (
                <div className="px-4 pb-4 border-t border-slate-700/50 pt-3 space-y-3">
                  <LetterEditor letter={letter} onSave={(content) => updateLetter(letter.id, content)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LetterEditor({ letter, onSave }) {
  const { t } = useTranslation();
  const [content, setContent] = useState(letter.content);
  const [dirty, setDirty] = useState(false);

  const handleChange = (v) => { setContent(v); setDirty(true); };
  const handleSave = () => { onSave(content); setDirty(false); };
  const handleCopy = () => { navigator.clipboard.writeText(content); toast.success(t("applyHub.letter.copied")); };

  return (
    <>
      <textarea
        value={content}
        onChange={e => handleChange(e.target.value)}
        rows={14}
        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono leading-relaxed"
      />
      <div className="flex gap-2 flex-wrap">
        <button onClick={handleSave} disabled={!dirty} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors">{t("applyHub.letter.saveChanges")}</button>
        <button onClick={handleCopy} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors">{t("applyHub.letter.copy")}</button>
      </div>
    </>
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
      className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-colors ${value ? "border-slate-600 hover:border-indigo-500 hover:bg-indigo-500/10 bg-slate-700/50" : "border-slate-700 bg-slate-800/30 opacity-50 cursor-not-allowed"}`}
    >
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-white">{value || "—"}</p>
      </div>
      <span className={`text-xs font-medium ml-2 shrink-0 ${copied ? "text-emerald-400" : "text-slate-400"}`}>
        {copied ? "✓" : "📋"}
      </span>
    </div>
  );
}

/* ─── Tab: Portal Guide ─── */
function PortalGuide({ universityId, onUniSelected, onGoToDocuments }) {
  const { t } = useTranslation();
  const [uni, setUni] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState({});
  const [unis, setUnis] = useState([]);
  const [selectedId, setSelectedId] = useState(universityId || "");

  const UNI_ASSIST_STEPS = [
    { title: t("applyHub.guide.uniAssist.s0title"), desc: t("applyHub.guide.uniAssist.s0desc"), link: "https://www.uni-assist.de", linkText: t("applyHub.guide.openUniAssist"), icon: "🔑" },
    { title: t("applyHub.guide.uniAssist.s1title"), desc: t("applyHub.guide.uniAssist.s1desc"), icon: "🔍" },
    { title: t("applyHub.guide.uniAssist.s2title"), desc: t("applyHub.guide.uniAssist.s2desc"), icon: "📋", hasCopyFields: true },
    { title: t("applyHub.guide.uniAssist.s3title"), desc: t("applyHub.guide.uniAssist.s3desc"), icon: "📁", hasDocLink: true },
    { title: t("applyHub.guide.uniAssist.s4title"), desc: t("applyHub.guide.uniAssist.s4desc"), icon: "💳" },
    { title: t("applyHub.guide.uniAssist.s5title"), desc: t("applyHub.guide.uniAssist.s5desc"), icon: "📤" },
  ];
  const getIrkSteps = (portal_url, uni_name) => [
    { title: t("applyHub.guide.irk.s0title"), desc: t("applyHub.guide.irk.s0desc", { uni: uni_name || "" }), link: portal_url || "#", linkText: t("applyHub.guide.openPortal"), icon: "🔑" },
    { title: t("applyHub.guide.irk.s1title"), desc: t("applyHub.guide.irk.s1desc"), icon: "🎓" },
    { title: t("applyHub.guide.irk.s2title"), desc: t("applyHub.guide.irk.s2desc"), icon: "📋", hasCopyFields: true },
    { title: t("applyHub.guide.irk.s3title"), desc: t("applyHub.guide.irk.s3desc"), icon: "📁", hasDocLink: true },
    { title: t("applyHub.guide.irk.s4title"), desc: t("applyHub.guide.irk.s4desc"), icon: "📤" },
  ];
  const getOwnPortalSteps = (portal_url, uni_name) => [
    { title: t("applyHub.guide.ownPortal.s0title"), desc: t("applyHub.guide.ownPortal.s0desc", { uni: uni_name || "" }), link: portal_url || "#", linkText: t("applyHub.guide.openPortal"), icon: "🔑" },
    { title: t("applyHub.guide.ownPortal.s1title"), desc: t("applyHub.guide.ownPortal.s1desc"), icon: "👤" },
    { title: t("applyHub.guide.ownPortal.s2title"), desc: t("applyHub.guide.ownPortal.s2desc"), icon: "📋", hasCopyFields: true },
    { title: t("applyHub.guide.ownPortal.s3title"), desc: t("applyHub.guide.ownPortal.s3desc"), icon: "📁", hasDocLink: true },
    { title: t("applyHub.guide.ownPortal.s4title"), desc: t("applyHub.guide.ownPortal.s4desc"), icon: "📤" },
  ];

  const METHOD_LABELS = {
    uni_assist: { label: t("applyHub.guide.methods.uni_assist"), color: "bg-blue-500/20 text-blue-300", icon: "🇩🇪" },
    irk:        { label: t("applyHub.guide.methods.irk"),        color: "bg-red-500/20 text-red-300",   icon: "🇵🇱" },
    own_portal: { label: t("applyHub.guide.methods.own_portal"), color: "bg-purple-500/20 text-purple-300", icon: "🎓" },
    email:      { label: t("applyHub.guide.methods.email"),      color: "bg-amber-500/20 text-amber-300",   icon: "📧" },
  };

  useEffect(() => {
    api.get("/universities?limit=200")
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : (r.data?.items || []);
        setUnis(data);
      }).catch(() => {});
    api.get("/profiles/me")
      .then(r => setProfile(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) { setUni(null); onUniSelected?.("", ""); return; }
    setLoading(true);
    api.get(`/universities/${selectedId}`)
      .then(r => { setUni(r.data); onUniSelected?.(r.data.name, r.data.programs?.[0] || ""); })
      .catch(() => toast.error(t("applyHub.guide.loadFailed")))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const getMethod = () => {
    if (!uni) return null;
    if (uni.application_method) return uni.application_method;
    if (uni.country === "Poland") return "irk";
    if (uni.country === "Germany" && !uni.is_public) return "own_portal";
    // TUM (id 2), KIT (id 4), TUHH (id 20) don't use uni-assist
    if (uni.country === "Germany" && [2, 4, 20].includes(uni.id)) return "own_portal";
    if (uni.country === "Germany") return "uni_assist";
    return "own_portal";
  };

  const method = getMethod();
  const portalUrl = uni?.application_portal_url || uni?.website;

  const steps = !uni ? [] :
    method === "uni_assist" ? UNI_ASSIST_STEPS :
    method === "irk" ? getIrkSteps(portalUrl, uni.name) :
    getOwnPortalSteps(portalUrl, uni.name);

  const toggleStep = (i) => setCompletedSteps(prev => ({ ...prev, [selectedId + "_" + i]: !prev[selectedId + "_" + i] }));
  const doneCount = steps.filter((_, i) => completedSteps[selectedId + "_" + i]).length;

  return (
    <div className="space-y-5">
      {/* University picker */}
      <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><span>🗺️</span> {t("applyHub.guide.selectTitle")}</h3>
        <select
          value={String(selectedId)}
          onChange={e => { setSelectedId(e.target.value); setCompletedSteps({}); }}
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">{t("applyHub.guide.selectPlaceholder")}</option>
          {/* Guarantee the pre-selected uni appears even before the full list loads */}
          {uni && !unis.find(u => String(u.id) === String(selectedId)) && (
            <option value={String(uni.id)}>{uni.name} — {uni.country}</option>
          )}
          {unis.map(u => <option key={u.id} value={String(u.id)}>{u.name} — {u.country}</option>)}
        </select>
      </div>

      {loading && <div className="text-center py-8 text-slate-400">Loading…</div>}

      {uni && !loading && (
        <>
          {/* University header */}
          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center gap-4">
            {uni.logo_url && (
              <img src={uni.logo_url} alt={uni.name} className="w-16 h-16 rounded-xl object-contain bg-white p-1 shrink-0" />
            )}
            <div className="flex-1">
              <h2 className="text-white font-bold text-lg">{uni.name}</h2>
              <p className="text-slate-400 text-sm">{uni.city}, {uni.country}</p>
              {method && (
                <span className={`inline-flex items-center gap-1.5 mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${METHOD_LABELS[method]?.color || "bg-slate-700 text-slate-300"}`}>
                  {METHOD_LABELS[method]?.icon} {t("applyHub.guide.applicationVia")} {METHOD_LABELS[method]?.label}
                </span>
              )}
            </div>
            <div className="shrink-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{doneCount}/{steps.length}</div>
                <div className="text-xs text-slate-400">{t("applyHub.guide.stepsDone")}</div>
              </div>
              <div className="w-20 h-1.5 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: steps.length ? `${(doneCount / steps.length) * 100}%` : "0%" }}
                />
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, i) => {
              const done = !!completedSteps[selectedId + "_" + i];
              return (
                <div key={i} className={`rounded-2xl border p-5 transition-all ${done ? "bg-emerald-500/5 border-emerald-500/30" : "bg-slate-800/50 border-slate-700/50"}`}>
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleStep(i)}
                      className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-600 hover:border-indigo-400"}`}
                    >
                      {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{step.icon}</span>
                        <h4 className={`font-semibold text-sm ${done ? "text-emerald-400 line-through" : "text-white"}`}>
                          {t("applyHub.guide.step")} {i + 1}: {step.title}
                        </h4>
                      </div>
                      <p className="text-slate-400 text-sm mt-1">{step.desc}</p>

                      {step.link && (
                        <a
                          href={step.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          {step.linkText}
                        </a>
                      )}

                      {step.hasCopyFields && profile && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <CopyField label={t("applyHub.guide.fields.fullName")} value={profile.full_name} />
                          <CopyField label={t("applyHub.guide.fields.nationality")} value={profile.nationality} />
                          <CopyField label={t("applyHub.guide.fields.dob")} value={profile.date_of_birth} />
                          <CopyField label={t("applyHub.guide.fields.phone")} value={profile.phone_number} />
                          <CopyField label={t("applyHub.guide.fields.address")} value={profile.address} />
                          <CopyField label={t("applyHub.guide.fields.fieldOfInterest")} value={profile.field_of_interest} />
                          <CopyField label={t("applyHub.guide.fields.englishLevel")} value={profile.english_level?.toUpperCase()} />
                          <CopyField label={t("applyHub.guide.fields.gpa")} value={profile.gpa ? String(profile.gpa) : null} />
                        </div>
                      )}

                      {step.hasDocLink && (
                        <button
                          className="inline-flex items-center gap-1.5 mt-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                          onClick={() => onGoToDocuments?.()}
                        >
                          {t("applyHub.guide.docLockerLink")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {doneCount === steps.length && steps.length > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-emerald-400 font-semibold">{t("applyHub.guide.allDoneTitle")}</p>
              <p className="text-slate-400 text-sm mt-1">{t("applyHub.guide.allDoneDesc", { uni: uni.name })}</p>
            </div>
          )}
        </>
      )}

      {!uni && !loading && (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🗺️</div>
          <p className="text-slate-400">{t("applyHub.guide.empty")}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Step 1: Personal Info (editable) ─── */
function PersonalInfoStep() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const SURF   = "oklch(0.17 0.022 285)";
  const CARD   = "oklch(0.20 0.024 285)";
  const BORDER = "oklch(1 0 0 / 0.07)";
  const DIM    = "oklch(0.55 0.02 285)";
  const GRAD   = "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))";

  const roStyle = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "10px 14px", color: "oklch(0.75 0.01 285)", width: "100%", fontSize: 14, opacity: 0.8 };
  const editStyle = { background: CARD, border: `1px solid oklch(0.62 0.24 296 / 0.4)`, borderRadius: 12, padding: "10px 14px", color: "#fff", width: "100%", fontSize: 14, outline: "none" };

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

  const Row = ({ label, value }) => (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: DIM }}>{label}</label>
      <div style={roStyle}>{value || <span style={{ opacity: 0.4 }}>—</span>}</div>
    </div>
  );

  return (
    <div className="rounded-2xl p-6 space-y-5" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
      <div>
        <h3 className="text-white font-bold text-base">Personal & academic info</h3>
        <p className="text-xs mt-1" style={{ color: DIM }}>
          Your info is pulled from your profile.{" "}
          <a href="/profile" className="underline" style={{ color: "oklch(0.72 0.18 296)" }}>Edit in My Profile →</a>
        </p>
      </div>

      {/* Email — editable */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: DIM }}>Email</label>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={editStyle}
            onFocus={e => { e.target.style.borderColor = "oklch(0.62 0.24 296 / 0.7)"; }}
            onBlur={e => { e.target.style.borderColor = "oklch(0.62 0.24 296 / 0.4)"; }}
          />
          <button
            onClick={saveEmail}
            disabled={savingEmail || email === user?.email}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40 whitespace-nowrap"
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

/* ─── Main page ─── */
export default function ApplicationHub() {
  const { t } = useTranslation();
  const { universityId } = useParams();
  const [step, setStep] = useState(universityId ? 4 : 1);
  const [selectedUniName, setSelectedUniName] = useState("");
  const [selectedUniProgram, setSelectedUniProgram] = useState("");

  const BG     = "oklch(0.13 0.018 285)";
  const SURF   = "oklch(0.17 0.022 285)";
  const CARD   = "oklch(0.20 0.024 285)";
  const BORDER = "oklch(1 0 0 / 0.07)";
  const GRAD   = "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))";
  const DIM    = "oklch(0.55 0.02 285)";

  const stepLabels = ["Personal Info", "Documents", "Motivation Letter", "Review"];

  return (
    <div className="min-h-screen" style={{ background: BG, color: "#fff" }}>
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{t("applyHub.title")}</h1>
          <p className="text-sm mt-1" style={{ color: DIM }}>{t("applyHub.subtitle")}</p>
        </div>

        {/* Step indicator */}
        <div className="mb-6 rounded-2xl overflow-hidden" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
          {/* progress bar */}
          <div className="h-1" style={{ background: "oklch(1 0 0 / 0.06)" }}>
            <div className="h-full transition-all duration-300" style={{ width: `${((step - 1) / (stepLabels.length - 1)) * 100}%`, background: GRAD }} />
          </div>
          <div className="flex px-6 py-4">
            {stepLabels.map((label, i) => {
              const n = i + 1;
              const active = n === step;
              const done   = n < step;
              return (
                <div key={n} className="flex items-center flex-1 min-w-0">
                  <button onClick={() => setStep(n)}
                    className="flex items-center gap-2 text-sm font-semibold transition min-w-0"
                    style={{ color: active ? "#fff" : done ? "oklch(0.72 0.18 296)" : DIM }}>
                    <span className="w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0"
                          style={{ background: active ? GRAD : done ? "oklch(0.55 0.22 296 / 0.3)" : "oklch(1 0 0 / 0.07)", color: active || done ? "#fff" : DIM }}>
                      {done ? "✓" : n}
                    </span>
                    <span className="hidden sm:inline truncate">{label}</span>
                  </button>
                  {i < stepLabels.length - 1 && (
                    <div className="flex-1 mx-3 h-px" style={{ background: BORDER }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main 2-column layout */}
        <div className="flex gap-6">

          {/* Left: content */}
          <div className="flex-1 min-w-0">
            {step === 1 && <PersonalInfoStep />}
            {step === 2 && <DocumentLocker />}
            {step === 3 && <MotivationLetterWriter />}
            {step === 4 && <PortalGuide universityId={universityId} onUniSelected={(name, program) => { setSelectedUniName(name); setSelectedUniProgram(program); }} onGoToDocuments={() => setStep(2)} />}

            {/* Back / Continue */}
            <div className="flex justify-between mt-6">
              {step > 1
                ? <button onClick={() => setStep(s => s - 1)}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-80"
                    style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                    ← Back
                  </button>
                : <div />
              }
              {step < 4 && (
                <button onClick={() => setStep(s => s + 1)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                  style={{ background: GRAD }}>
                  Continue →
                </button>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-72 shrink-0 hidden lg:flex flex-col gap-4">
            {/* Applying to card */}
            <div className="rounded-2xl p-5" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: DIM }}>Applying to</p>
              {selectedUniName ? (
                <>
                  <p className="font-bold text-white text-base">{selectedUniName}</p>
                  {selectedUniProgram && <p className="text-sm mt-0.5" style={{ color: DIM }}>{selectedUniProgram}</p>}
                </>
              ) : (
                <p className="text-sm" style={{ color: DIM }}>Select a university in the Application Guide tab</p>
              )}
            </div>

            {/* What universities look for */}
            <div className="rounded-2xl p-5" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2 mb-3">
                <span>💡</span>
                <p className="text-sm font-bold text-white">What universities look for</p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: DIM }}>
                Strong GPA, a clear motivation letter tailored to the program, and proof of language readiness matter more than perfect test scores.
              </p>
            </div>

            {/* Pipeline link */}
            <div className="rounded-2xl p-4" style={{ background: "oklch(0.55 0.22 296 / 0.08)", border: "1px solid oklch(0.55 0.22 296 / 0.2)" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "oklch(0.78 0.12 296)" }}>Track applications with status updates</p>
              <Link to="/pipeline"
                className="text-xs font-bold text-white px-3 py-1.5 rounded-lg inline-block transition hover:opacity-90"
                style={{ background: GRAD }}>
                {t("applyHub.myPipeline")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
