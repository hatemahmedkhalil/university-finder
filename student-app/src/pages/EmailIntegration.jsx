import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import toast from "react-hot-toast";

const FORWARDING_ADDRESS = "ab331c706c0188b0b969@cloudmailin.net";

const STATUS_STYLES = {
  accepted:     { bg: "bg-green-900/40",  border: "border-green-500/40",  text: "text-green-300",  icon: "🎉", label: "Accepted" },
  rejected:     { bg: "bg-red-900/40",    border: "border-red-500/40",    text: "text-red-300",    icon: "❌", label: "Rejected" },
  interview:    { bg: "bg-blue-900/40",   border: "border-blue-500/40",   text: "text-blue-300",   icon: "📅", label: "Interview" },
  missing_docs: { bg: "bg-yellow-900/40", border: "border-yellow-500/40", text: "text-yellow-300", icon: "📎", label: "Docs Needed" },
  info:         { bg: "bg-slate-800/40",  border: "border-slate-600/40",  text: "text-slate-300",  icon: "✉️", label: "Info" },
};

// ── Consent Screen ─────────────────────────────────────────────────────────────
function ConsentScreen({ onConsent }) {
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
      toast.error(err?.response?.data?.detail || "Failed to link email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">📬</div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Link Your Email</h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Connect your email so UniPath can automatically track university replies and update your pipeline status — no manual checking needed.
        </p>
      </div>

      {/* What we read / don't read */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-green-900/20 border border-green-700/30 rounded-2xl p-4">
          <p className="text-green-400 font-bold text-xs mb-2 uppercase tracking-wide">✅ We will read</p>
          <ul className="text-green-200/80 text-xs space-y-1.5">
            <li>• Emails from universities</li>
            <li>• Acceptance / rejection notices</li>
            <li>• Document requests</li>
            <li>• Interview invitations</li>
            <li>• Application deadlines</li>
          </ul>
        </div>
        <div className="bg-red-900/20 border border-red-700/30 rounded-2xl p-4">
          <p className="text-red-400 font-bold text-xs mb-2 uppercase tracking-wide">❌ We will NEVER read</p>
          <ul className="text-red-200/80 text-xs space-y-1.5">
            <li>• Personal emails</li>
            <li>• Social media emails</li>
            <li>• Banking / shopping</li>
            <li>• Any non-university email</li>
            <li>• Your contacts or drafts</li>
          </ul>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-5 mb-6">
        <p className="text-slate-300 font-semibold text-sm mb-3">🔧 How it works</p>
        <ol className="text-slate-400 text-xs space-y-2">
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">1.</span> You enter your email and agree below</li>
          <li className="flex gap-2"><span className="text-indigo-400 font-bold shrink-0">2.</span> <span>We give you a forwarding address (<span className="text-indigo-300 font-mono break-all">{FORWARDING_ADDRESS}</span>)</span></li>
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">3.</span> You set up Gmail/Outlook to forward emails to it (we guide you step by step)</li>
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">4.</span> UniPath auto-detects university replies and updates your pipeline</li>
        </ol>
      </div>

      {/* Legal note */}
      <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-2xl px-4 py-3 mb-6 text-xs text-indigo-300/80 leading-relaxed">
        🔒 Your consent is recorded with a timestamp and IP address. You can revoke access at any time and all data will be deleted immediately. This complies with GDPR Article 6(1)(a).
      </div>

      {/* Email input */}
      <div className="mb-4">
        <label className="block text-slate-300 text-sm font-semibold mb-1.5">Your email address</label>
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
        <span className="text-slate-400 text-xs leading-relaxed">
          I understand that UniPath will receive forwarded emails from my inbox. I give explicit consent to process emails from universities for the purpose of tracking my application status. I can revoke this at any time.
        </span>
      </label>

      <button
        onClick={submit}
        disabled={!email || !agreed || loading}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm shadow-lg hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Linking…" : "✅ I Agree — Link My Email"}
      </button>
    </div>
  );
}

// ── Setup Instructions ──────────────────────────────────────────────────────────
function SetupInstructions({ linkedEmail, onConfirm, onUnlink }) {
  const [confirming, setConfirming] = useState(false);
  const [tab, setTab] = useState("gmail");

  const confirm = async () => {
    setConfirming(true);
    try {
      await api.post("/email-integration/confirm-forwarding");
      onConfirm();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setConfirming(false);
    }
  };

  const gmailSteps = [
    { step: 1, title: "Open Gmail Settings", desc: 'Click the ⚙️ gear icon (top right) → "See all settings"' },
    { step: 2, title: 'Go to "Forwarding and POP/IMAP"', desc: "Click the tab named exactly that at the top of Settings" },
    { step: 3, title: "Add a forwarding address", desc: `Click "Add a forwarding address" → type: ${FORWARDING_ADDRESS} → click Next` },
    { step: 4, title: "Google sends a verification email", desc: "Check your inbox for a confirmation email from Google and click the verification link" },
    { step: 5, title: "Activate forwarding", desc: `Back in Settings → select "Forward a copy to ${FORWARDING_ADDRESS}" → Save Changes` },
    { step: 6, title: "Come back here and confirm", desc: 'Click "I\'ve Set It Up" below so we know you\'re ready' },
  ];

  const outlookSteps = [
    { step: 1, title: "Open Outlook Settings", desc: 'Click ⚙️ Settings → "View all Outlook settings"' },
    { step: 2, title: "Go to Mail → Forwarding", desc: 'Navigate to: Mail → Forwarding' },
    { step: 3, title: "Enable forwarding", desc: `Toggle "Enable forwarding" → enter: ${FORWARDING_ADDRESS}` },
    { step: 4, title: "Save and confirm here", desc: 'Click Save → then click "I\'ve Set It Up" below' },
  ];

  const steps = tab === "gmail" ? gmailSteps : outlookSteps;

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">⚙️</div>
        <h2 className="text-xl font-extrabold text-white mb-1">Set Up Email Forwarding</h2>
        <p className="text-slate-400 text-sm">
          Linked email: <span className="text-indigo-300 font-mono">{linkedEmail}</span>
        </p>
      </div>

      {/* Forwarding address box */}
      <div className="bg-indigo-900/30 border border-indigo-600/40 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-indigo-300 text-xs font-semibold mb-0.5">Forward your emails to this address:</p>
          <p className="text-white font-mono font-bold text-base">{FORWARDING_ADDRESS}</p>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(FORWARDING_ADDRESS); toast.success("Copied!"); }}
          className="text-xs bg-indigo-600/50 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg transition font-semibold shrink-0"
        >
          Copy
        </button>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 mb-5">
        {["gmail", "outlook"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === t ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
          >
            {t === "gmail" ? "📧 Gmail" : "📨 Outlook"}
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
        {confirming ? "Confirming…" : "✅ I've Set It Up — Activate"}
      </button>
      <button
        onClick={onUnlink}
        className="w-full py-2.5 rounded-2xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-sm font-medium transition"
      >
        Cancel &amp; Unlink
      </button>
    </div>
  );
}

// ── Active State ────────────────────────────────────────────────────────────────
function ActiveView({ linked, emails, onUnlink, onRefresh }) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Status banner */}
      <div className="flex items-center gap-4 bg-green-900/20 border border-green-600/30 rounded-2xl px-5 py-4 mb-6">
        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse shrink-0" />
        <div className="flex-1">
          <p className="text-green-300 font-semibold text-sm">Email Integration Active</p>
          <p className="text-green-400/70 text-xs">Monitoring: <span className="font-mono">{linked.linked_email}</span></p>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs text-slate-400 hover:text-white transition px-3 py-1.5 bg-slate-800 rounded-lg"
        >
          🔄 Refresh
        </button>
      </div>

      {/* How it works reminder */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: "✉️", label: "Email arrives", desc: "University sends you an email" },
          { icon: "🔍", label: "We detect it", desc: "UniPath reads the forwarded copy" },
          { icon: "🔔", label: "You're notified", desc: "Pipeline updates automatically" },
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
        <h3 className="text-white font-bold text-base">University Emails Received</h3>
        <span className="text-slate-500 text-xs">{emails.length} email{emails.length !== 1 ? "s" : ""}</span>
      </div>

      {emails.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm">No university emails detected yet.</p>
          <p className="text-xs mt-1">Make sure you set up Gmail/Outlook forwarding correctly.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {emails.map(email => {
            const style = STATUS_STYLES[email.detected_status] || STATUS_STYLES.info;
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
                      {style.label}
                    </span>
                    {!email.is_read && (
                      <span className="text-xs bg-indigo-600/40 text-indigo-300 px-2 py-0.5 rounded-full font-semibold">New</span>
                    )}
                  </div>
                  <p className="text-slate-300 text-xs truncate">{email.subject}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    From: {email.from_address} · {new Date(email.received_at).toLocaleDateString()}
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
            <p className="text-white font-semibold text-sm">Remove Email Integration</p>
            <p className="text-slate-500 text-xs mt-0.5">All received email records will be deleted immediately.</p>
          </div>
          <button
            onClick={onUnlink}
            className="px-4 py-2 rounded-xl border border-red-700/50 text-red-400 hover:bg-red-900/20 text-sm font-semibold transition"
          >
            Unlink
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────────
export default function EmailIntegration() {
  const [linked, setLinked] = useState(null);   // null = loading, false = not linked
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
    if (!window.confirm("Remove email integration? All email records will be deleted.")) return;
    try {
      await api.delete("/email-integration/unlink");
      setLinked(false);
      setEmails([]);
      toast.success("Email unlinked and data deleted.");
    } catch {
      toast.error("Failed to unlink.");
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
          📬 Email Integration
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Email Tracking</h1>
        <p className="text-slate-400 text-sm">
          Automatically detect university replies and keep your pipeline up to date — without checking your inbox manually.
        </p>
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
