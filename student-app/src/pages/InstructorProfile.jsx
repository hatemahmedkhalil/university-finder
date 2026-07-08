import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const LANG_CONFIG = {
  english: {
    label: "English", flag: "🇬🇧", flagUrl: "https://flagcdn.com/w20/gb.png",
    grad: "from-rose-500 via-pink-500 to-fuchsia-600",
    light: "bg-pink-50", text: "text-pink-700", border: "border-pink-200",
  },
  german: {
    label: "German", flag: "🇩🇪", flagUrl: "https://flagcdn.com/w20/de.png",
    grad: "from-amber-500 via-orange-500 to-red-500",
    light: "bg-orange-50", text: "text-orange-700", border: "border-orange-200",
  },
  polish: {
    label: "Polish", flag: "🇵🇱", flagUrl: "https://flagcdn.com/w20/pl.png",
    grad: "from-emerald-500 via-teal-500 to-cyan-600",
    light: "bg-teal-50", text: "text-teal-700", border: "border-teal-200",
  },
};
const DEFAULT_LANG = {
  label: "Instructor", flag: "👤", flagUrl: null,
  grad: "from-sky-600 to-indigo-600",
  light: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200",
};

/* ── Avatar ── */
const Avatar = ({ name, photoUrl, size = "lg", grad }) => {
  const [err, setErr] = useState(false);
  const initials = name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const cls = size === "lg" ? "w-28 h-28 text-4xl" : "w-10 h-10 text-sm";
  if (photoUrl && !err) {
    return (
      <img
        src={photoUrl.startsWith("http") ? photoUrl : photoUrl}
        alt={name}
        onError={() => setErr(true)}
        className={`${cls} rounded-3xl object-cover shadow-2xl ring-4 ring-white/40`}
      />
    );
  }
  return (
    <div className={`${cls} rounded-3xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold shadow-2xl ring-4 ring-white/40`}>
      {initials}
    </div>
  );
};

/* ── Chat section ── */
const ChatSection = ({ inst, langCfg }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/instructor-messages/instructors/${inst.id}`)
      .then(r => setMessages(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [inst.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/instructor-messages/instructors/${inst.id}`, { question: text.trim() });
      setMessages(prev => [...prev, res.data]);
      setText("");
    } catch (e) {
      toast.error(e?.response?.data?.detail || t("instructors.failedSend"));
    }
    setSending(false);
  };

  return (
    <div className="bg-[oklch(0.17_0.02_285)] rounded-3xl border-2 border-[oklch(1_0_0/0.08)]  overflow-hidden">
      <div className={`bg-gradient-to-r ${langCfg.grad} px-5 py-4 flex items-center gap-3`}>
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl">💬</div>
        <h3 className="font-bold text-white">{t("instructors.askQuestion", { name: inst.name.split(" ")[0] })}</h3>
      </div>

      {/* Messages */}
      <div className="px-5 py-4 space-y-4 min-h-[160px] max-h-80 overflow-y-auto bg-gray-50">
        {loading ? (
          <p className="text-center text-[oklch(0.45_0.02_285)] text-sm py-6">Loading…</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-[oklch(0.45_0.02_285)] text-sm">{t("instructors.noMessagesYet")}</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="space-y-2">
              <div className="flex justify-end">
                <div className={`bg-gradient-to-r ${langCfg.grad} text-white text-sm rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] `}>
                  <p>{msg.question}</p>
                  <p className="text-[10px] text-white/60 mt-1 text-right">{new Date(msg.created_at).toLocaleString()}</p>
                </div>
              </div>
              {msg.reply ? (
                <div className="flex justify-start gap-2">
                  <Avatar name={inst.name} photoUrl={inst.photo_url} size="sm" grad={langCfg.grad} />
                  <div className="bg-white border border-[oklch(1_0_0/0.08)] text-white text-sm rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[80%] ">
                    <p>{msg.reply}</p>
                    <p className="text-[10px] text-[oklch(0.45_0.02_285)] mt-1">{new Date(msg.replied_at).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[oklch(0.45_0.02_285)] italic pl-12">{t("instructors.waitingReply")}</p>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[oklch(1_0_0/0.07)] flex gap-2 bg-white">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={2}
          placeholder={t("instructors.questionPlaceholder")}
          className="flex-1 resize-none border border-[oklch(1_0_0/0.08)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className={`bg-gradient-to-r ${langCfg.grad} text-white px-4 rounded-xl text-sm font-bold disabled:opacity-40 transition shrink-0 hover:opacity-90`}
        >
          {sending ? "…" : t("aichat.send")}
        </button>
      </div>
    </div>
  );
};

/* ── Main Page ── */
const InstructorProfile = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [inst, setInst] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/instructors/${id}`),
      api.get(`/instructor-posts/instructor/${id}`),
    ])
      .then(([iRes, pRes]) => { setInst(iRes.data); setPosts(pRes.data); })
      .catch(() => navigate("/instructors"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[oklch(0.45_0.02_285)] text-sm">{t("instructors.loadingProfile")}</p>
        </div>
      </div>
    );
  }

  if (!inst) return null;

  const langCfg = LANG_CONFIG[inst.language?.toLowerCase()] || DEFAULT_LANG;
  const specialties = inst.specialty ? inst.specialty.split(",").map(s => s.trim()) : [];

  return (
    <div className="min-h-screen">

      {/* Hero banner */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${langCfg.grad} text-white`}>
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl" />
        <div className="absolute -right-8 -top-8 text-[200px] opacity-5 select-none">{langCfg.flag}</div>

        <div className="relative max-w-4xl mx-auto px-6 py-10">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-8 transition font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("instructors.backToInstructors")}
          </button>

          <div className="flex items-end gap-6 flex-wrap">
            <Avatar name={inst.name} photoUrl={inst.photo_url} size="lg" grad={langCfg.grad} />
            <div className="flex-1 min-w-0 pb-2">
              <p className="text-white/60 text-sm font-semibold mb-1">{inst.organization ?? t("instructors.languageInstructor")}</p>
              <h1 className="text-3xl font-extrabold leading-tight">
                {inst.title ? `${inst.title} ` : ""}{inst.name}
              </h1>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                  {langCfg.flagUrl && <img src={langCfg.flagUrl} alt={langCfg.label} className="w-4 h-auto rounded-sm" />}
                  {langCfg.label} {t("instructors.instructor")}
                </span>
                {inst.years_experience && (
                  <span className="text-white/70 text-sm">⏱️ {inst.years_experience} {t("instructors.yearsExp")}</span>
                )}
                {inst.email && (
                  <a href={`mailto:${inst.email}`} className="text-white/70 hover:text-white text-sm transition">
                    ✉️ {inst.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column */}
        <div className="lg:col-span-1 space-y-5">

          {/* Quick info card */}
          <div className="bg-[oklch(0.17_0.02_285)] rounded-3xl border-2 border-[oklch(1_0_0/0.08)]  overflow-hidden">
            <div className={`bg-gradient-to-r ${langCfg.grad} px-5 py-3 flex items-center gap-2`}>
              <span className="text-white font-bold text-sm">ℹ️ {t("instructors.quickInfo")}</span>
            </div>
            <div className="p-5 space-y-3">
              {inst.language && (
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${langCfg.grad} flex items-center justify-center text-sm `}>🌍</div>
                  <div>
                    <p className="text-xs text-[oklch(0.45_0.02_285)]">{t("instructors.teaches")}</p>
                    <p className="text-sm font-semibold text-white">{langCfg.label}</p>
                  </div>
                </div>
              )}
              {inst.years_experience && (
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${langCfg.grad} flex items-center justify-center text-sm `}>⏱️</div>
                  <div>
                    <p className="text-xs text-[oklch(0.45_0.02_285)]">{t("instructors.experience")}</p>
                    <p className="text-sm font-semibold text-white">{inst.years_experience} {t("instructors.years")}</p>
                  </div>
                </div>
              )}
              {inst.organization && (
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${langCfg.grad} flex items-center justify-center text-sm `}>🏛️</div>
                  <div>
                    <p className="text-xs text-[oklch(0.45_0.02_285)]">{t("instructors.organization")}</p>
                    <p className="text-sm font-semibold text-white">{inst.organization}</p>
                  </div>
                </div>
              )}
              {inst.email && (
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${langCfg.grad} flex items-center justify-center text-sm `}>✉️</div>
                  <div>
                    <p className="text-xs text-[oklch(0.45_0.02_285)]">{t("profile.emailLabel")}</p>
                    <a href={`mailto:${inst.email}`} className="text-sm font-semibold text-sky-600 hover:underline truncate block max-w-[160px]">{inst.email}</a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Specialties */}
          {specialties.length > 0 && (
            <div className="bg-[oklch(0.17_0.02_285)] rounded-3xl border-2 border-[oklch(1_0_0/0.08)]  p-5">
              <h3 className="font-bold text-[oklch(0.75_0.02_285)] text-sm mb-3 flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${langCfg.grad} flex items-center justify-center text-xs `}>🎯</div>
                {t("instructors.specialties")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {specialties.map(s => (
                  <span key={s} className={`text-xs font-bold px-3 py-1.5 rounded-xl ${langCfg.light} ${langCfg.text} border ${langCfg.border}`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {posts.length > 0 && (
            <div className="bg-[oklch(0.17_0.02_285)] rounded-3xl border-2 border-[oklch(1_0_0/0.08)]  overflow-hidden">
              <div className={`bg-gradient-to-r ${langCfg.grad} px-5 py-3`}>
                <span className="text-white font-bold text-sm">📢 Posts ({posts.length})</span>
              </div>
              <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                {posts.map(p => (
                  <div key={p.id} className={`${langCfg.light} rounded-2xl px-4 py-3 border ${langCfg.border}`}>
                    <p className="text-sm text-white leading-relaxed">{p.content}</p>
                    <p className="text-[10px] text-[oklch(0.45_0.02_285)] mt-1.5">{new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Bio */}
          {inst.bio && (
            <div className="bg-[oklch(0.17_0.02_285)] rounded-3xl border-2 border-[oklch(1_0_0/0.08)]  overflow-hidden">
              <div className={`bg-gradient-to-r ${langCfg.grad} px-5 py-3 flex items-center gap-2`}>
                <span className="text-white font-bold text-sm">👤 {t("instructors.about", { name: inst.name.split(" ")[0] })}</span>
              </div>
              <div className="p-6">
                <p className="text-[oklch(0.65_0.02_285)] leading-relaxed whitespace-pre-wrap">{inst.bio}</p>
              </div>
            </div>
          )}

          {/* Chat */}
          <ChatSection inst={inst} langCfg={langCfg} />

          <p className="text-center text-xs text-[oklch(0.45_0.02_285)]">
            <Link to="/my-questions" className={`${langCfg.text} hover:underline font-semibold`}>
              {t("instructors.viewAllQuestions")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstructorProfile;

