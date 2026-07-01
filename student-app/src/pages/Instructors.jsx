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
    return <img src={src} alt={name} onError={() => setErr(true)} className={`${cls} rounded-2xl object-cover shadow-lg ring-2 ring-white`} />;
  }
  return (
    <div className={`${cls} rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white`}>
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
            <p className="text-white/70 text-xs">{inst.organization ?? "Language Instructor"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-[200px] bg-gray-50">
          {loadingMsgs ? (
            <p className="text-center text-gray-400 text-sm py-8">Loading messages…</p>
          ) : fetchError ? (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm">{fetchError}</p>
              <button onClick={fetchMessages} className="mt-2 text-sky-600 text-sm underline">{t("instructors.chat.retry")}</button>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-500 text-sm">{t("instructors.noMessagesYet")}</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="space-y-2">
                <div className="flex justify-end">
                  <div className={`bg-gradient-to-r ${langCfg.grad} text-white text-sm rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%] shadow-sm`}>
                    <p>{msg.question}</p>
                    <p className="text-[10px] text-white/60 mt-1 text-right">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {msg.reply ? (
                  <div className="flex justify-start gap-2">
                    <Avatar name={inst.name} photoUrl={inst.photo_url} size="sm" grad={langCfg.grad} />
                    <div className="bg-white text-gray-800 text-sm rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%] shadow-sm border border-gray-100">
                      <p>{msg.reply}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(msg.replied_at).toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="pl-12"><span className="text-xs text-gray-400 italic">{t("instructors.waitingReply")}</span></div>
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-100 bg-white flex flex-col gap-1">
          {sendError && <p className="text-red-500 text-xs px-1">{sendError}</p>}
          <div className="flex gap-2">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder={t("instructors.questionPlaceholder")}
              className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              className={`bg-gradient-to-r ${langCfg.grad} text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 transition shrink-0 shadow-sm hover:opacity-90`}
            >
              {sending ? "…" : t("aichat.send")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Instructor Card ────────────────────────────────────────────────────── */
const InstructorCard = ({ inst, onChat }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const langCfg = LANG_CONFIG[inst.language?.toLowerCase()] || DEFAULT_LANG;
  const [posts, setPosts] = useState([]);
  const [showPosts, setShowPosts] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const togglePosts = (e) => {
    e.stopPropagation();
    if (!showPosts && posts.length === 0) {
      setLoadingPosts(true);
      api.get(`/instructor-posts/instructor/${inst.id}`)
        .then(r => setPosts(r.data))
        .catch(() => setPosts([]))
        .finally(() => setLoadingPosts(false));
    }
    setShowPosts(v => !v);
  };

  return (
    <div
      className={`group bg-white rounded-3xl border-2 ${langCfg.border} shadow-lg ${langCfg.glow} overflow-hidden flex flex-col card-lift cursor-pointer`}
      onClick={() => navigate(`/instructors/${inst.id}`)}
    >
      {/* Gradient header with avatar */}
      <div className={`bg-gradient-to-br ${langCfg.grad} px-5 pt-5 pb-10 relative overflow-hidden`}>
        <div className="absolute -right-4 -top-4 text-8xl opacity-10 select-none">{langCfg.flag}</div>
        <div className="relative flex items-start gap-4">
          <Avatar name={inst.name} photoUrl={inst.photo_url} size="lg" grad={langCfg.grad} />
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="font-extrabold text-white text-lg leading-tight truncate">
              {inst.title ? `${inst.title} ` : ""}{inst.name}
            </h3>
            {inst.organization && (
              <p className="text-white/70 text-sm mt-0.5 truncate">🏛️ {inst.organization}</p>
            )}
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
              {langCfg.flagUrl && <img src={langCfg.flagUrl} alt={langCfg.label} className="w-4 h-auto rounded-sm" />}
              {langCfg.label} {t("instructors.instructor")}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-3 flex-1 -mt-4">

        {/* Specialty tags */}
        {inst.specialty && (
          <div className="flex flex-wrap gap-1.5">
            {inst.specialty.split(",").map(s => (
              <span key={s} className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${langCfg.light} ${langCfg.text} border ${langCfg.border}`}>
                {s.trim()}
              </span>
            ))}
          </div>
        )}

        {inst.bio && <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{inst.bio}</p>}

        {inst.years_experience && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${langCfg.grad} flex items-center justify-center text-white text-[10px] shadow-sm`}>⏱</div>
            <span>{inst.years_experience} {t("instructors.yearsExp")}</span>
          </div>
        )}

        <p className="text-xs text-gray-300 group-hover:text-gray-400 transition">
          {t("instructors.clickProfile")}
        </p>

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={e => { e.stopPropagation(); onChat(inst); }}
            className={`flex-1 bg-gradient-to-r ${langCfg.grad} text-white text-sm font-bold py-2.5 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 hover:opacity-90`}
          >
            💬 {t("instructors.askQuestionBtn")}
          </button>
          <button
            onClick={togglePosts}
            className={`px-3 py-2.5 rounded-xl border-2 ${langCfg.border} ${langCfg.light} ${langCfg.text} hover:opacity-80 transition text-sm font-bold`}
            title="View posts"
          >
            📢
          </button>
          {inst.email && (
            <a
              href={`mailto:${inst.email}`}
              onClick={e => e.stopPropagation()}
              className="px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-500 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50 transition text-sm"
              title="Email instructor"
            >
              ✉️
            </a>
          )}
        </div>
      </div>

      {/* Posts panel */}
      {showPosts && (
        <div className={`border-t-2 ${langCfg.border} px-5 py-4 ${langCfg.light}`}>
          <p className={`text-xs font-extrabold uppercase tracking-widest ${langCfg.text} mb-3`}>
            📢 {t("instructors.postsFrom", { name: inst.name.split(" ")[0] })}
          </p>
          {loadingPosts ? (
            <p className="text-xs text-gray-400 text-center py-3">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-3">{t("instructors.noPosts")}</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {posts.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                  <p className="text-sm text-gray-800 leading-relaxed">{p.content}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(p.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Skeleton Card ──────────────────────────────────────────────────────── */
const SkeletonInstructor = () => (
  <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm overflow-hidden animate-pulse">
    <div className="bg-gray-100 h-28" />
    <div className="p-5 space-y-3">
      <div className="flex gap-2">
        <div className="h-5 bg-gray-100 rounded-lg w-16" />
        <div className="h-5 bg-gray-100 rounded-lg w-20" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-3/4" />
      <div className="h-10 bg-gray-100 rounded-xl mt-4" />
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

  return (
    <div className="min-h-screen bg-gray-50">
      {chatInst && <ChatModal inst={chatInst} onClose={() => setChatInst(null)} />}

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-sky-700 via-cyan-700 to-teal-700 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-8 left-12 w-64 h-64 bg-sky-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-16 w-72 h-72 bg-teal-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-cyan-300/10 rounded-full blur-3xl -translate-x-1/2" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-cyan-200 text-sm font-bold px-5 py-2 rounded-full mb-6">
            👨‍🏫 Language Experts
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            {t("instructors.heroTitle")}
          </h1>
          <p className="text-sky-200 text-lg max-w-xl mx-auto mb-8">
            {t("instructors.heroSubtitle")}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { value: loading ? "…" : instructors.length, label: t("instructors.statInstructors"), icon: "👨‍🏫" },
              { value: "3", label: t("instructors.statLanguages"), icon: "🌍" },
              { value: "24/7", label: t("instructors.statAvailable"), icon: "⏱️" },
            ].map(({ value, label, icon }) => (
              <div key={label} className="bg-white/10 border border-white/20 rounded-2xl px-6 py-3 backdrop-blur text-center min-w-[110px]">
                <div className="text-xl mb-1">{icon}</div>
                <p className="text-2xl font-extrabold">{value}</p>
                <p className="text-cyan-300 text-xs font-medium">{label}</p>
              </div>
            ))}
          </div>
          <Link
            to="/my-questions"
            className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-sm font-bold px-6 py-3 rounded-2xl transition"
          >
            💬 {t("nav.myQuestions")}
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">{t("common.filter")}:</span>
          {LANG_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                filter === f.value
                  ? "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-200"
                  : "bg-white text-gray-500 border-gray-200 hover:border-sky-300 hover:text-sky-600"
              }`}
            >
              <span>{f.icon}</span> {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0,1,2,3,4,5].map(i => <SkeletonInstructor key={i} />)}
          </div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-gray-100">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center text-5xl mx-auto mb-6">👨‍🏫</div>
            <p className="text-gray-800 font-bold text-xl mb-2">{t("instructors.noFound")}</p>
            <p className="text-gray-400 text-sm">{t("instructors.tryFilter")}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-5 font-medium">
              {t("instructors.foundCount", { count: instructors.length })}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
              {instructors.map(inst => (
                <InstructorCard key={inst.id} inst={inst} onChat={setChatInst} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Instructors;
