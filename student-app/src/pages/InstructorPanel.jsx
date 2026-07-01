import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

const Avatar = ({ name, photoUrl }) => {
  const [err, setErr] = useState(false);
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  if (photoUrl && !err) {
    return <img src={photoUrl} alt={name} onError={() => setErr(true)} className="w-10 h-10 rounded-xl object-cover" />;
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
      {initials}
    </div>
  );
};

/* ── Thread view ─────────────────────────────────────────────────────────── */
const Thread = ({ msg, profile, onReply }) => {
  const { t } = useTranslation();
  const [reply, setReply] = useState(msg.reply ?? "");
  const [editing, setEditing] = useState(!msg.reply);
  const [saving, setSaving] = useState(false);

  const send = async () => {
    if (!reply.trim()) return;
    setSaving(true);
    try {
      const res = await api.post(`/instructor-messages/inbox/${msg.id}/reply`, { reply: reply.trim() });
      onReply(res.data);
      setEditing(false);
    } catch {}
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      {/* Student question */}
      <div className="flex gap-3 items-start">
        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
          {msg.user.email[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1">{msg.user.email} · {new Date(msg.created_at).toLocaleString()}</p>
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-800">{msg.question}</div>
        </div>
        {!msg.reply && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-semibold shrink-0">{t("instructors.panel.new")}</span>
        )}
      </div>

      {/* Reply area */}
      <div className="flex gap-3 items-start pl-12">
        <Avatar name={profile.name} photoUrl={profile.photo_url} />
        <div className="flex-1">
          {!editing && msg.reply ? (
            <div>
              <div className="bg-indigo-50 rounded-xl px-4 py-3 text-sm text-indigo-900">{msg.reply}</div>
              <p className="text-[10px] text-gray-400 mt-1">{new Date(msg.replied_at).toLocaleString()}</p>
              <button onClick={() => setEditing(true)} className="text-xs text-indigo-500 hover:text-indigo-700 mt-1">{t("instructors.panel.editReply")}</button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={3}
                placeholder={t("instructors.panel.replyPlaceholder")}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={send}
                  disabled={saving || !reply.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-40 transition"
                >
                  {saving ? "…" : t("instructors.panel.sendReply")}
                </button>
                {msg.reply && (
                  <button onClick={() => { setReply(msg.reply); setEditing(false); }} className="text-sm text-gray-400 hover:text-gray-600">
                    {t("common.cancel")}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function InstructorPanel() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    Promise.all([
      api.get("/instructor-messages/profile"),
      api.get("/instructor-messages/inbox"),
    ]).then(([profRes, msgRes]) => {
      if (!profRes.data?.id) {
        setError("Your account is not linked to an instructor profile. Ask an admin to link your account.");
      } else {
        setProfile(profRes.data);
        setMessages(msgRes.data);
      }
    }).catch(() => setError("Failed to load your instructor data."))
      .finally(() => setLoading(false));
  }, []);

  const handleReply = (updated) => {
    setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const filtered = messages.filter(m => {
    if (tab === "new")      return !m.reply;
    if (tab === "answered") return !!m.reply;
    return true;
  });

  const newCount = messages.filter(m => !m.reply).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-red-200 shadow p-8 max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="font-bold text-gray-800 mb-2">{t("instructors.panel.notInstructor")}</h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-800 to-blue-700 text-white py-10 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-5">
          <Avatar name={profile.name} photoUrl={profile.photo_url} />
          <div>
            <p className="text-indigo-300 text-sm font-medium uppercase tracking-wide">{t("instructors.panel.title")}</p>
            <h1 className="text-2xl font-bold">{profile.title ? `${profile.title} ` : ""}{profile.name}</h1>
            <p className="text-indigo-200 text-sm">{profile.organization ?? ""} · {profile.language} Instructor</p>
          </div>
          <div className="ml-auto flex gap-3 text-center">
            <div className="bg-white/10 rounded-xl px-4 py-2">
              <p className="text-2xl font-bold">{messages.length}</p>
              <p className="text-xs text-indigo-200">{t("instructors.panel.total")}</p>
            </div>
            <div className="bg-yellow-400/20 rounded-xl px-4 py-2">
              <p className="text-2xl font-bold text-yellow-200">{newCount}</p>
              <p className="text-xs text-yellow-200">{t("instructors.panel.new")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "all",      label: `All (${messages.length})`         },
            { key: "new",      label: `New (${newCount})`                },
            { key: "answered", label: `Answered (${messages.length - newCount})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                tab === t.key
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500 font-semibold">{t("instructors.panel.noMessages")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(msg => (
              <Thread key={msg.id} msg={msg} profile={profile} onReply={handleReply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
