import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Icon, ICONS } from "../components/Sidebar";

const DAILY_LIMIT = 30;

const bg      = "var(--bg)";
const surface = "var(--surface-2)";
const border  = "var(--border)";
const grad    = "linear-gradient(135deg, var(--accent), var(--accent))";

const SAMPLE_HISTORY = [
  "University matches for Germany",
  "DAAD scholarship questions",
  "Motivation letter draft",
];

const SAMPLE_PROMPTS = [
  "Compare TU Berlin vs RWTH Aachen",
  "What scholarships fit my budget?",
  "Help me write a motivation letter",
];

/* ── Typing indicator ── */
const TypingDots = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    {[0, 1, 2].map(i => (
      <span key={i} className="w-2 h-2 rounded-full animate-bounce"
            style={{ background: "var(--ink-faint)", animationDelay: `${i * 0.15}s` }} />
    ))}
  </div>
);

/* ── Message bubble ── */
const Bubble = ({ msg, onExecuteAction }) => {
  const isUser = msg.role === "user";
  const [actionDone, setActionDone] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = async () => {
    if (actionDone || actionLoading) return;
    setActionLoading(true);
    try {
      await onExecuteAction(msg.action);
      setActionDone(true);
    } catch { /* toast shown in parent */ }
    setActionLoading(false);
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-xl flex items-center justify-center text-[var(--ink)] shrink-0 mt-1"
             style={{ background: grad }}>
          <Icon d={ICONS.sparkle} size={14} />
        </div>
      )}
      <div className="max-w-[80%] flex flex-col gap-2">
        <div className="rounded-2xl px-3 py-2.5 text-sm leading-relaxed"
             style={{
               background: isUser ? grad : surface,
               border: isUser ? "none" : `1px solid ${border}`,
               color: isUser ? "#fff" : "var(--ink)",
               borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
             }}>
          <p className="whitespace-pre-wrap">{msg.content}</p>
          <p className="text-[10px] mt-1 opacity-50">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        {!isUser && msg.action && (
          <button
            onClick={handleAction}
            disabled={actionDone || actionLoading}
            className="self-start text-xs font-semibold px-4 py-2 rounded-xl transition hover:opacity-90 disabled:opacity-60"
            style={{ background: actionDone ? "var(--good)" : grad, color: "#fff", border: "none" }}>
            {actionLoading
              ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : actionDone ? "✓ Done!" : msg.action.label || "Do it"}
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Sidebar content ── */
const Sidebar = ({ sessions, sessionId, onSelectSession, onNewChat, t, onClose }) => (
  <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
    <div className="p-4 flex items-center gap-2">
      <button onClick={() => { onNewChat(); onClose?.(); }}
        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[var(--ink)] transition hover:opacity-90"
        style={{ background: grad }}>
        + {t("aichat.newConversation", "New conversation")}
      </button>
      {onClose && (
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--ink)]/60 hover:text-[var(--ink)] transition"
          style={{ background: surface }}>
          <Icon d={ICONS.x} size={16} />
        </button>
      )}
    </div>

    <div className="px-4 pb-4 flex-1 overflow-y-auto">
      {sessions.length > 0 && (
        <>
          <div className="text-[11px] font-bold uppercase tracking-widest mb-3"
               style={{ color: "var(--ink-faint)" }}>
            {t("aichat.history", "History")}
          </div>
          <div className="flex flex-col gap-1">
            {sessions.map(s => (
              <button key={s.session_id}
                onClick={() => { onSelectSession(s.session_id); onClose?.(); }}
                className="text-start px-3 py-2 rounded-lg text-sm truncate transition"
                style={{
                  background: sessionId === s.session_id ? "var(--surface-2)" : "transparent",
                  color: sessionId === s.session_id ? "var(--ink)" : "var(--ink-faint)",
                  fontWeight: sessionId === s.session_id ? 600 : 400,
                }}>
                {s.title || "Chat session"}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  </div>
);

/* ── Context badges: shows what AI knows about the student ── */
const ContextBadges = ({ ctx }) => {
  if (!ctx) return null;
  const badges = [];
  if (ctx.has_profile)            badges.push({ label: "Profile ✓",                color: "rgba(0,142,69,0.25)", border: "rgba(0,174,98,0.4)" });
  if (ctx.pipeline_count > 0)     badges.push({ label: `${ctx.pipeline_count} app${ctx.pipeline_count > 1 ? "s" : ""} ✓`, color: "rgba(111,67,187,0.25)", border: "rgba(154,114,238,0.4)" });
  if (ctx.favourites_count > 0)   badges.push({ label: `${ctx.favourites_count} saved unis ✓`, color: "rgba(43,89,199,0.25)", border: "rgba(85,136,251,0.4)" });
  if (ctx.test_scores_count > 0)  badges.push({ label: `${ctx.test_scores_count} test score${ctx.test_scores_count > 1 ? "s" : ""} ✓`, color: "rgba(0,117,168,0.25)", border: "rgba(0,164,217,0.4)" });
  if (ctx.letters_count > 0)      badges.push({ label: `${ctx.letters_count} letter${ctx.letters_count > 1 ? "s" : ""} ✓`, color: "rgba(164,64,0,0.25)", border: "rgba(214,111,3,0.4)" });
  if (ctx.upcoming_deadlines > 0) badges.push({ label: `${ctx.upcoming_deadlines} deadline${ctx.upcoming_deadlines > 1 ? "s" : ""} ⏰`, color: "rgba(179,34,40,0.25)", border: "rgba(232,88,84,0.4)" });
  if (badges.length === 0) return null;
  return (
    <div className="px-3 md:px-5 py-2 flex flex-wrap gap-1.5 items-center"
         style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
      <span className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--ink-faint)" }}>I know your</span>
      {badges.map((b, i) => (
        <span key={i} className="text-[11px] px-2.5 py-0.5 rounded-full font-medium text-[var(--ink)]"
              style={{ background: b.color, border: `1px solid ${b.border}` }}>
          {b.label}
        </span>
      ))}
    </div>
  );
};

/* ── Main page ── */
const newSessionId = () => crypto.randomUUID();

const AiChat = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState(location.state?.prefill || "");
  const [sending, setSending]             = useState(false);
  const [loading, setLoading]             = useState(true);
  const [todayCount, setTodayCount]       = useState(0);
  const [sessions, setSessions]           = useState([]);
  const [sessionId, setSessionId]         = useState(() => newSessionId());
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [ctx, setCtx]                     = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Load sessions list + context summary on mount
  useEffect(() => {
    Promise.allSettled([
      api.get("/ai-chat/sessions"),
      api.get("/ai-chat/context-summary"),
    ]).then(([sessRes, ctxRes]) => {
      if (sessRes.status === "fulfilled") setSessions(sessRes.value.data || []);
      if (ctxRes.status === "fulfilled") setCtx(ctxRes.value.data);
    }).finally(() => setLoading(false));
  }, []);

  // Load messages when sessionId changes (switching to a past session)
  const loadSession = async (sid) => {
    setMessages([]);
    setSessionId(sid);
    try {
      const res = await api.get(`/ai-chat/history?session_id=${sid}`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch { setMessages([]); }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(newSessionId());
    setInput("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (location.state?.prefill && !loading) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [loading, location.state?.prefill]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const optimistic = { id: Date.now(), role: "user", content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setInput("");
    setSending(true);
    setTodayCount(c => c + 1);
    try {
      const res = await api.post("/ai-chat/message", { message: text, session_id: sessionId });
      setMessages(prev => [...prev, res.data]);
      // Refresh sidebar sessions (new session appears after first message)
      api.get("/ai-chat/sessions").then(r => setSessions(r.data || [])).catch(() => {});
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setTodayCount(c => c - 1);
      toast.error(e?.response?.data?.detail || t("aichat.failedSend"));
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const executeAction = async (action) => {
    try {
      const res = await api.post("/ai-chat/execute-action", { type: action.type, data: action.data });
      toast.success(res.data.message || "Done!");
      // Refresh context badges after action
      api.get("/ai-chat/context-summary").then(r => setCtx(r.data)).catch(() => {});
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Action failed");
      throw e;
    }
  };

  const clearHistory = async () => {
    if (!window.confirm(t("aichat.clearConfirm"))) return;
    await api.delete("/ai-chat/history");
    setMessages([]);
    setTodayCount(0);
  };

  const remaining = DAILY_LIMIT - todayCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ background: bg }}>
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-68px)] relative overflow-hidden" style={{ background: bg, color: "var(--ink)" }}>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          {/* drawer */}
          <div className="relative z-50 w-72 h-full border-r" style={{ borderColor: border }}>
            <Sidebar
              sessions={sessions} sessionId={sessionId}
              onSelectSession={loadSession} onNewChat={startNewChat}
              t={t} onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex md:w-[260px] shrink-0 flex-col border-r" style={{ borderColor: border }}>
        <Sidebar
          sessions={sessions} sessionId={sessionId}
          onSelectSession={loadSession} onNewChat={startNewChat}
          t={t}
        />
      </div>

      {/* ── Chat panel ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <div className="flex md:hidden items-center gap-3 px-4 py-3 border-b" style={{ borderColor: border }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--ink)]/70 hover:text-[var(--ink)] transition"
            style={{ background: surface }}>
            <Icon d={ICONS.menu} size={16} />
          </button>
          <div className="flex items-center gap-2">
            <Icon d={ICONS.sparkle} size={16} />
            <span className="text-sm font-bold text-[var(--ink)]">{t("aichat.title", "AI Assistant")}</span>
          </div>
          <div className="ml-auto text-xs" style={{ color: "var(--ink-faint)" }}>
            {remaining}/{DAILY_LIMIT}
          </div>
        </div>

        {/* Context badges */}
        <ContextBadges ctx={ctx} />

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-6 space-y-4">
          {messages.length === 0 && !sending ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 pb-16 stagger">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "var(--accent)", opacity: 0.18 }} />
                <span className="absolute inset-0 rounded-full" style={{ background: grad, animation: "aiBreathe 3.5s ease-in-out infinite" }} />
                <span className="relative"><Icon d={ICONS.sparkle} size={24} /></span>
              </div>
              <div className="text-center px-4">
                <h3 className="text-lg font-bold text-[var(--ink)] mb-1">{t("aichat.askAnything", "Hey, I'm your study abroad advisor")}</h3>
                <p className="text-sm max-w-xs mx-auto leading-relaxed" style={{ color: "var(--ink-faint)" }}>
                  {t("aichat.helpText", "Ask me about universities, scholarships, visas, or your applications — I know your whole journey.")}
                </p>
              </div>
            </div>
          ) : (
            messages.map(msg => <Bubble key={msg.id} msg={msg} onExecuteAction={executeAction} />)
          )}
          {sending && (
            <div className="flex justify-start gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center text-[var(--ink)] text-xs shrink-0 mt-1"
                   style={{ background: grad }}><Icon d={ICONS.sparkle} size={14} /></div>
              <div className="rounded-2xl rounded-bl-sm" style={{ background: surface, border: `1px solid ${border}` }}>
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Sample prompt chips */}
        {messages.length === 0 && !sending && (
          <div className="px-3 md:px-6 pb-3 flex flex-wrap gap-2 justify-center">
            {SAMPLE_PROMPTS.map(q => (
              <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                className="text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full font-medium transition hover:opacity-90"
                style={{ background: surface, border: `1px solid ${border}`, color: "var(--ink-dim)" }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Limit warnings */}
        {remaining <= 5 && remaining > 0 && (
          <div className="px-4 py-2 text-center text-xs" style={{ color: "var(--warn)" }}>
            {t("aichat.remaining", { count: remaining })}
          </div>
        )}
        {remaining <= 0 && (
          <div className="px-4 py-2 text-center text-xs font-semibold" style={{ color: "var(--danger)" }}>
            {t("aichat.limitReached")}
          </div>
        )}

        {/* Input bar */}
        <div className="px-3 md:px-6 pb-3 md:pb-4 pt-2" style={{ borderTop: `1px solid ${border}` }}>
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              disabled={remaining <= 0}
              placeholder={remaining <= 0 ? t("aichat.limitPlaceholder") : t("aichat.askPlaceholder", "Ask about universities, scholarships, visas...")}
              className="flex-1 resize-none text-sm text-[var(--ink)] placeholder-opacity-50 focus:outline-none"
              style={{
                background: surface,
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: "10px 14px",
                minHeight: 44,
                maxHeight: 120,
                color: "var(--ink)",
              }}
              onFocus={e => { e.target.style.borderColor = "rgba(14,165,233,0.5)"; }}
              onBlur={e => { e.target.style.borderColor = border; }}
            />
            <button
              onClick={send}
              disabled={sending || !input.trim() || remaining <= 0}
              className="text-[var(--ink)] text-sm font-bold px-4 md:px-5 py-3 rounded-xl transition hover:opacity-90 disabled:opacity-40 shrink-0"
              style={{ background: grad, minWidth: 64 }}>
              {sending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              ) : t("aichat.send", "Send")}
            </button>
          </div>
          <p className="text-center text-[10px] mt-2" style={{ color: "var(--border-strong)" }}>
            {t("aichat.disclaimer", "AI responses are for guidance only. Always verify with the university directly.")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
