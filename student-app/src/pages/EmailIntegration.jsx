import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import toast from "react-hot-toast";

const FORWARDING_ADDRESS = "ab331c706c0188b0b969@cloudmailin.net";

const STATUS_STYLES = {
  accepted:     { bg: "bg-green-900/40",  border: "border-green-500/40",  text: "text-green-300",  icon: "🎉" },
  rejected:     { bg: "bg-red-900/40",    border: "border-red-500/40",    text: "text-red-300",    icon: "❌" },
  interview:    { bg: "bg-blue-900/40",   border: "border-blue-500/40",   text: "text-blue-300",   icon: "📅" },
  missing_docs: { bg: "bg-yellow-900/40", border: "border-yellow-500/40", text: "text-yellow-300", icon: "📎" },
  info:         { bg: "bg-slate-800/40",  border: "border-slate-600/40",  text: "text-slate-300",  icon: "✉️" },
};

// ── Consent Screen ─────────────────────────────────────────────────────────────
function ConsentScreen({ onConsent }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !agreed) return;
    setLoading(true);
    try {
      await api.post("/email-integration/link", { linked_email: email, consent_given: true });
      onConsent();
    } catch (err) {
      toast.error(err?.response?.data?.detail || t("email.failedLink"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">📬</div>
        <h1 className="text-2xl font-extrabold text-white mb-2">{t("email.linkTitle")}</h1>
        <p className="text-slate-400 text-sm leading-relaxed">{t("email.linkDesc")}</p>
      </div>

      {/* What we read / don't read */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-green-900/20 border border-green-700/30 rounded-2xl p-4">
          <p className="text-green-400 font-bold text-xs mb-2 uppercase tracking-wide">{t("email.willRead")}</p>
          <ul className="text-green-200/80 text-xs space-y-1.5">
            <li>• {t("email.read1")}</li>
            <li>• {t("email.read2")}</li>
            <li>• {t("email.read3")}</li>
            <li>• {t("email.read4")}</li>
            <li>• {t("email.read5")}</li>
          </ul>
        </div>
        <div className="bg-red-900/20 border border-red-700/30 rounded-2xl p-4">
          <p className="text-red-400 font-bold text-xs mb-2 uppercase tracking-wide">{t("email.willNeverRead")}</p>
          <ul className="text-red-200/80 text-xs space-y-1.5">
            <li>• {t("email.noRead1")}</li>
            <li>• {t("email.noRead2")}</li>
            <li>• {t("email.noRead3")}</li>
            <li>• {t("email.noRead4")}</li>
            <li>• {t("email.noRead5")}</li>
          </ul>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-5 mb-6">
        <p className="text-slate-300 font-semibold text-sm mb-3">{t("email.howItWorks")}</p>
        <ol className="text-slate-400 text-xs space-y-2">
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">1.</span> {t("email.step1")}</li>
          <li className="flex gap-2"><span className="text-indigo-400 font-bold shrink-0">2.</span> <span>{t("email.step2")} (<span className="text-indigo-300 font-mono break-all">{FORWARDING_ADDRESS}</span>)</span></li>
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">3.</span> {t("email.step3")}</li>
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">4.</span> {t("email.step4")}</li>
        </ol>
      </div>

      {/* Legal note */}
      <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-2xl px-4 py-3 mb-6 text-xs text-indigo-300/80 leading-relaxed">
        {t("email.gdpr")}
      </div>

      {/* Email input */}
      <div className="mb-4">
        <label className="block text-slate-300 text-sm font-semibold mb-1.5">{t("email.yourEmail")}</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@gmail.com"
          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Consent checkbox */}
      <label className="flex items-start gap-3 cursor-pointer mb-6">
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-indigo-500 shrink-0"
        />
        <span className="text-slate-400 text-xs leading-relaxed">{t("email.consentText")}</span>
      </label>

      <button
        onClick={submit}
        disabled={!email || !agreed || loading}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm shadow-lg hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? t("email.linking") : t("email.agreeBtn")}
      </button>
    </div>
  );
}

// ── Setup Instructions ──────────────────────────────────────────────────────────
function SetupInstructions({ linkedEmail, onConfirm, onUnlink }) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [tab, setTab] = useState("gmail");

  const confirm = async () => {
    setConfirming(true);
    try {
      await api.post("/email-integration/confirm-forwarding");
      onConfirm();
    } catch {
      toast.error(t("email.somethingWrong"));
    } finally {
      setConfirming(false);
    }
  };

  const gmailSteps = [
    { step: 1, title: t("email.gmailStep1Title"), desc: t("email.gmailStep1Desc") },
    { step: 2, title: t("email.gmailStep2Title"), desc: t("email.gmailStep2Desc") },
    { step: 3, title: t("email.gmailStep3Title"), desc: t("email.gmailStep3Desc", { address: FORWARDING_ADDRESS }) },
    { step: 4, title: t("email.gmailStep4Title"), desc: t("email.gmailStep4Desc") },
    { step: 5, title: t("email.gmailStep5Title"), desc: t("email.gmailStep5Desc", { address: FORWARDING_ADDRESS }) },
    { step: 6, title: t("email.gmailStep6Title"), desc: t("email.gmailStep6Desc") },
  ];

  const outlookSteps = [
    { step: 1, title: t("email.outlookStep1Title"), desc: t("email.outlookStep1Desc") },
    { step: 2, title: t("email.outlookStep2Title"), desc: t("email.outlookStep2Desc") },
    { step: 3, title: t("email.outlookStep3Title"), desc: t("email.outlookStep3Desc", { address: FORWARDING_ADDRESS }) },
    { step: 4, title: t("email.outlookStep4Title"), desc: t("email.outlookStep4Desc") },
  ];

  const steps = tab === "gmail" ? gmailSteps : outlookSteps;

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">⚙️</div>
        <h2 className="text-xl font-extrabold text-white mb-1">{t("email.setupTitle")}</h2>
        <p className="text-slate-400 text-sm">
          {t("email.linkedEmail")} <span className="text-indigo-300 font-mono">{linkedEmail}</span>
        </p>
      </div>

      {/* Forwarding address box */}
      <div className="bg-indigo-900/30 border border-indigo-600/40 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-indigo-300 text-xs font-semibold mb-0.5">{t("email.forwardTo")}</p>
          <p className="text-white font-mono font-bold text-base">{FORWARDING_ADDRESS}</p>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(FORWARDING_ADDRESS); toast.success(t("email.copied")); }}
          className="text-xs bg-indigo-600/50 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg transition font-semibold shrink-0"
        >
          {t("email.copy")}
        </button>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 mb-5">
        {["gmail", "outlook"].map(provider => (
          <button
            key={provider}
            onClick={() => setTab(provider)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === provider ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
          >
            {provider === "gmail" ? "📧 Gmail" : "📨 Outlook"}
          </button>
        ))}
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-6">
        {steps.map(s => (
          <div key={s.step} className="flex gap-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl px-4 py-3">
            <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
              {s.step}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{s.title}</p>
              <p className="text-slate-400 text-xs mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={confirm}
        disabled={confirming}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm shadow-lg hover:opacity-90 transition mb-3"
      >
        {confirming ? t("email.confirming") : t("email.activateBtn")}
      </button>
      <button
        onClick={onUnlink}
        className="w-full py-2.5 rounded-2xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-sm font-medium transition"
      >
        {t("email.cancelUnlink")}
      </button>
    </div>
  );
}

// ── Active State ────────────────────────────────────────────────────────────────
function ActiveView({ linked, emails, onUnlink, onRefresh }) {
  const { t } = useTranslation();

  const statusLabels = {
    accepted:     t("email.statusAccepted"),
    rejected:     t("email.statusRejected"),
    interview:    t("email.statusInterview"),
    missing_docs: t("email.statusDocsNeeded"),
    info:         t("email.statusInfo"),
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Status banner */}
      <div className="flex items-center gap-4 bg-green-900/20 border border-green-600/30 rounded-2xl px-5 py-4 mb-6">
        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse shrink-0" />
        <div className="flex-1">
          <p className="text-green-300 font-semibold text-sm">{t("email.active")}</p>
          <p className="text-green-400/70 text-xs">{t("email.monitoring")} <span className="font-mono">{linked.linked_email}</span></p>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs text-slate-400 hover:text-white transition px-3 py-1.5 bg-slate-800 rounded-lg"
        >
          {t("email.refresh")}
        </button>
      </div>

      {/* How it works reminder */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: "✉️", label: t("email.emailArrives"),   desc: t("email.emailArrivesDesc") },
          { icon: "🔍", label: t("email.weDetectIt"),     desc: t("email.weDetectItDesc") },
          { icon: "🔔", label: t("email.youreNotified"),  desc: t("email.youreNotifiedDesc") },
        ].map(item => (
          <div key={item.label} className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-3 text-center">
            <div className="text-2xl mb-1">{item.icon}</div>
            <p className="text-white text-xs font-semibold">{item.label}</p>
            <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Email list */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-white font-bold text-base">{t("email.universityEmails")}</h3>
        <span className="text-slate-500 text-xs">{emails.length} {emails.length !== 1 ? t("email.emailCount_other", { count: emails.length }) : t("email.emailCount_one", { count: emails.length })}</span>
      </div>

      {emails.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm">{t("email.noEmails")}</p>
          <p className="text-xs mt-1">{t("email.noEmailsHint")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {emails.map(email => {
            const style = STATUS_STYLES[email.detected_status] || STATUS_STYLES.info;
            const label = statusLabels[email.detected_status] || statusLabels.info;
            return (
              <div
                key={email.id}
                className={`${style.bg} border ${style.border} rounded-2xl px-4 py-3 flex items-start gap-3 ${!email.is_read ? "ring-1 ring-indigo-500/30" : ""}`}
              >
                <span className="text-xl shrink-0 mt-0.5">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    {email.detected_university && (
                      <span className="text-white font-semibold text-sm">{email.detected_university}</span>
                    )}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                      {label}
                    </span>
                    {!email.is_read && (
                      <span className="text-xs bg-indigo-600/40 text-indigo-300 px-2 py-0.5 rounded-full font-semibold">{t("email.new")}</span>
                    )}
                  </div>
                  <p className="text-slate-300 text-xs truncate">{email.subject}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {t("email.from")} {email.from_address} · {new Date(email.received_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unlink */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm">{t("email.removeTitle")}</p>
            <p className="text-slate-500 text-xs mt-0.5">{t("email.removeDesc")}</p>
          </div>
          <button
            onClick={onUnlink}
            className="px-4 py-2 rounded-xl border border-red-700/50 text-red-400 hover:bg-red-900/20 text-sm font-semibold transition"
          >
            {t("email.unlink")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────────
export default function EmailIntegration() {
  const { t } = useTranslation();
  const [linked, setLinked] = useState(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const r = await api.get("/email-integration/status");
      setLinked(r.data || false);
      if (r.data?.is_active && r.data?.forwarding_confirmed) {
        const er = await api.get("/email-integration/emails");
        setEmails(er.data || []);
      }
    } catch {
      setLinked(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleUnlink = async () => {
    if (!window.confirm(t("email.unlinkConfirm"))) return;
    try {
      await api.delete("/email-integration/unlink");
      setLinked(false);
      setEmails([]);
      toast.success(t("email.unlinkSuccess"));
    } catch {
      toast.error(t("email.unlinkFailed"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      {/* Page header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 bg-indigo-900/30 border border-indigo-700/30 rounded-full px-4 py-1.5 text-indigo-300 text-xs font-semibold mb-4">
          📬 {t("email.badge")}
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">{t("email.title")}</h1>
        <p className="text-slate-400 text-sm">{t("email.subtitle")}</p>
      </div>

      {/* Main content based on state */}
      {!linked && (
        <ConsentScreen onConsent={fetchStatus} />
      )}
      {linked && !linked.forwarding_confirmed && (
        <SetupInstructions
          linkedEmail={linked.linked_email}
          onConfirm={fetchStatus}
          onUnlink={handleUnlink}
        />
      )}
      {linked && linked.forwarding_confirmed && (
        <ActiveView
          linked={linked}
          emails={emails}
          onUnlink={handleUnlink}
          onRefresh={fetchStatus}
        />
      )}
    </div>
  );
}
