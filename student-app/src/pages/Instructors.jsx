import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

const LANG_CONFIG = {
  english: {
    label: "English", flag: "🇬🇧", flagUrl: "https://flagcdn.com/w20/gb.png",
    grad: "from-rose-500 via-pink-500 to-fuchsia-600",
    light: "bg-pink-50", text: "text-pink-700", border: "border-pink-200", glow: "shadow-pink-100",
  },
  german: {
    label: "German", flag: "🇩🇪", flagUrl: "https://flagcdn.com/w20/de.png",
    grad: "from-amber-500 via-orange-500 to-red-500",
    light: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", glow: "shadow-orange-100",
  },
  polish: {
    label: "Polish", flag: "🇵🇱", flagUrl: "https://flagcdn.com/w20/pl.png",
    grad: "from-emerald-500 via-teal-500 to-cyan-600",
    light: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", glow: "shadow-teal-100",
  },
};
const DEFAULT_LANG = {
  label: "Instructor", flag: "👤", flagUrl: null,
  grad: "from-indigo-500 to-violet-600",
  light: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", glow: "shadow-indigo-100",
};


const Avatar = ({ name, photoUrl, size = "md", grad = "from-sky-500 to-indigo-600" }) => {
  const [err, setErr] = useState(false);
  const initials = name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const cls = size === "sm" ? "w-10 h-10 text-sm" : size === "lg" ? "w-20 h-20 text-2xl" : "w-16 h-16 text-xl";
  if (photoUrl && !err) {
    const src = photoUrl.startsWith("http") ? photoUrl : photoUrl;
    return <img src={src} alt={name} onError={() => setErr(true)} className={`${cls} rounded-2xl object-cover ring-2 ring-white`} />;
  }
  return (
    <div className={`${cls} rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold ring-2 ring-white`}>
      {initials}
    </div>
  );
};

/* ── Chat Modal ─────────────────────────────────────────────────────────── */
const ChatModal = ({ inst, onClose }) => {
  const { t } = useTranslation();
  const langCfg = LANG_CONFIG[inst.language?.toLowerCase()] || DEFAULT_LANG;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const bottomRef = useRef(null);

  const fetchMessages = () => {
    setLoadingMsgs(true); setFetchError("");
    api.get(`/instructor-messages/instructors/${inst.id}`)
      .then(r => setMessages(r.data))
      .catch(() => setFetchError(t("instructors.failedLoad")))
      .finally(() => setLoadingMsgs(false));
  };

  useEffect(() => { fetchMessages(); }, [inst.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true); setSendError("");
    try {
      const res = await api.post(`/instructor-messages/instructors/${inst.id}`, { question: text.trim() });
      setMessages(prev => [...prev, res.data]);
      setText("");
    } catch (e) {
      setSendError(e?.response?.data?.detail || t("instructors.failedSend"));
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`bg-gradient-to-r ${langCfg.grad} px-5 py-4 flex items-center gap-3`}>
          <Avatar name={inst.name} photoUrl={inst.photo_url} size="sm" grad={langCfg.grad} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm truncate">{inst.title ? `${inst.title} ` : ""}{inst.name}</p>
            <p className="text-white/70 text-xs">{inst.organization ?? t("instructors.languageInstructor")}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-[200px] bg-gray-50">
          {loadingMsgs ? (
            <p className="text-center text-[oklch(0.45_0.02_285)] text-sm py-8">Loading messages…</p>
          ) : fetchError ? (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm">{fetchError}</p>
              <button onClick={fetchMessages} className="mt-2 text-sky-600 text-sm underline">{t("instructors.chat.retry")}</button>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-[oklch(0.55_0.02_285)] text-sm">{t("instructors.noMessagesYet")}</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="space-y-2">
                <div className="flex justify-end">
                  <div className={`bg-gradient-to-r ${langCfg.grad} text-white text-sm rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%] `}>
                    <p>{msg.question}</p>
                    <p className="text-[10px] text-white/60 mt-1 text-right">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {msg.reply ? (
                  <div className="flex justify-start gap-2">
                    <Avatar name={inst.name} photoUrl={inst.photo_url} size="sm" grad={langCfg.grad} />
                    <div className="bg-white text-white text-sm rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%]  border border-[oklch(1_0_0/0.07)]">
                      <p>{msg.reply}</p>
                      <p className="text-[10px] text-[oklch(0.45_0.02_285)] mt-1">{new Date(msg.replied_at).toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="pl-12"><span className="text-xs text-[oklch(0.45_0.02_285)] italic">{t("instructors.waitingReply")}</span></div>
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[oklch(1_0_0/0.07)] bg-white flex flex-col gap-1">
          {sendError && <p className="text-red-500 text-xs px-1">{sendError}</p>}
          <div className="flex gap-2">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder={t("instructors.questionPlaceholder")}
              className="flex-1 resize-none border border-[oklch(1_0_0/0.08)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              className={`bg-gradient-to-r ${langCfg.grad} text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 transition shrink-0  hover:opacity-90`}
            >
              {sending ? "…" : t("aichat.send")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Instructor Card (design-matched) ──────────────────────────────────── */
const InstructorCard = ({ inst, onChat }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const langCfg = LANG_CONFIG[inst.language?.toLowerCase()] || DEFAULT_LANG;

  const SURF   = "oklch(0.17 0.022 285)";
  const BORDER = "oklch(1 0 0 / 0.08)";
  const DIM    = "oklch(0.55 0.02 285)";

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col cursor-pointer transition hover:opacity-90"
         style={{ background: SURF, border: `1px solid ${BORDER}` }}
         onClick={() => navigate(`/instructors/${inst.id}`)}>

      {/* Card body */}
      <div className="p-6 flex flex-col items-center text-center gap-3 flex-1">

        {/* Circular avatar */}
        <div className="w-20 h-20 rounded-full overflow-hidden shrink-0"
             style={{ border: "3px solid oklch(1 0 0 / 0.1)" }}>
          <Avatar name={inst.name} photoUrl={inst.photo_url} size="lg" grad={langCfg.grad} />
        </div>

        {/* Name */}
        <h3 className="font-bold text-white text-base leading-tight">
          {inst.title ? `${inst.title} ` : ""}{inst.name}
        </h3>

        {/* Flag + language + rating */}
        <div className="flex items-center gap-2 text-sm flex-wrap justify-center">
          {langCfg.flagUrl && (
            <img src={langCfg.flagUrl} alt={langCfg.label} className="w-5 h-auto rounded-sm" />
          )}
          <span style={{ color: DIM }}>{langCfg.label}</span>
          {inst.rating && (
            <>
              <span style={{ color: "oklch(0.75 0.18 75)" }}>{"★".repeat(Math.round(inst.rating))}</span>
              <span className="font-bold text-white text-sm">{inst.rating}</span>
            </>
          )}
        </div>

        {/* Bio */}
        {inst.bio && (
          <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: DIM }}>{inst.bio}</p>
        )}
        {!inst.bio && inst.specialty && (
          <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: DIM }}>{inst.specialty}</p>
        )}
      </div>

      {/* Message button */}
      <div className="px-5 pb-5">
        <button
          onClick={e => { e.stopPropagation(); onChat(inst); }}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-80"
          style={{ background: "oklch(0.22 0.025 285)", border: `1px solid ${BORDER}` }}>
          Message
        </button>
      </div>
    </div>
  );
};

/* ── Skeleton Card ──────────────────────────────────────────────────────── */
const SkeletonInstructor = () => (
  <div className="bg-[oklch(0.17_0.02_285)] rounded-3xl border-2 border-[oklch(1_0_0/0.08)]  overflow-hidden animate-pulse">
    <div className="bg-gray-100 h-28" />
    <div className="p-5 space-y-3">
      <div className="flex gap-2">
        <div className="h-5 bg-[oklch(0.20_0.024_285)] rounded-lg w-16" />
        <div className="h-5 bg-[oklch(0.20_0.024_285)] rounded-lg w-20" />
      </div>
      <div className="h-3 bg-[oklch(0.20_0.024_285)] rounded w-full" />
      <div className="h-3 bg-[oklch(0.20_0.024_285)] rounded w-3/4" />
      <div className="h-10 bg-[oklch(0.20_0.024_285)] rounded-xl mt-4" />
    </div>
  </div>
);

/* ── Main Page ──────────────────────────────────────────────────────────── */
const Instructors = () => {
  const { t } = useTranslation();
  const LANG_FILTERS = [
    { value: "",        label: t("universities.filterLanguage"), icon: "🌍" },
    { value: "english", label: t("learning.english"),            icon: "🇬🇧" },
    { value: "german",  label: t("learning.german"),             icon: "🇩🇪" },
    { value: "polish",  label: t("learning.polish"),             icon: "🇵🇱" },
  ];
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [chatInst, setChatInst] = useState(null);

  useEffect(() => {
    const url = filter ? `/instructors?language=${filter}` : "/instructors";
    setLoading(true);
    api.get(url)
      .then(r => setInstructors(r.data))
      .catch(() => setInstructors([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const BG   = "oklch(0.13 0.018 285)";
  const GRAD = "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))";

  return (
    <div className="min-h-screen" style={{ background: BG, color: "#fff" }}>
      {chatInst && <ChatModal inst={chatInst} onClose={() => setChatInst(null)} />}

      {/* ── Hero: dark photo ── */}
      <div style={{ position: "relative", height: 240, overflow: "hidden" }}>
        <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&q=70"
             alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%", filter: "brightness(0.45)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, oklch(0.13 0.018 285 / 0.3), oklch(0.13 0.018 285) 95%)" }} />
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 48px" }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 8 }}>
            {t("instructors.heroTitle")}
          </h1>
          <p style={{ fontSize: 15, color: "oklch(0.72 0.02 285)", maxWidth: 480 }}>
            {t("instructors.heroSubtitle")}
          </p>
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div className="px-8 py-5" style={{ borderBottom: "1px solid oklch(1 0 0 / 0.07)" }}>
        <div className="flex flex-wrap gap-2">
          {LANG_FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition"
              style={{
                background: filter === f.value ? GRAD : "oklch(0.20 0.024 285)",
                color: filter === f.value ? "#fff" : "oklch(0.65 0.02 285)",
                border: `1px solid ${filter === f.value ? "transparent" : "oklch(1 0 0 / 0.08)"}`,
              }}>
              <span>{f.icon}</span> {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0,1,2,3,4,5].map(i => <SkeletonInstructor key={i} />)}
          </div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-24 rounded-2xl" style={{ background: "oklch(0.17 0.022 285)", border: "1px solid oklch(1 0 0 / 0.07)" }}>
            <div className="text-5xl mb-4">🎓</div>
            <p className="text-white font-bold text-xl mb-2">{t("instructors.noFound")}</p>
            <p className="text-sm" style={{ color: "oklch(0.45 0.02 285)" }}>{t("instructors.tryFilter")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {instructors.map(inst => (
              <InstructorCard key={inst.id} inst={inst} onChat={setChatInst} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Instructors;

