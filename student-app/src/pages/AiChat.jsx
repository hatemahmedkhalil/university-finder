import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const DAILY_LIMIT = 30;

const bg      = "oklch(0.13 0.018 285)";
const surface = "oklch(0.17 0.022 285)";
const border  = "oklch(1 0 0 / 0.07)";
const grad    = "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))";

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
            style={{ background: "oklch(0.60 0.02 285)", animationDelay: `${i * 0.15}s` }} />
    ))}
  </div>
);

/* ── Message bubble ── */
const Bubble = ({ msg }) => {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs shrink-0 mt-1"
             style={{ background: grad }}>
          ✨
        </div>
      )}
      <div className="max-w-[80%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed"
           style={{
             background: isUser ? grad : surface,
             border: isUser ? "none" : `1px solid ${border}`,
             color: "#fff",
             borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
           }}>
        <p className="whitespace-pre-wrap">{msg.content}</p>
        <p className="text-[10px] mt-1 opacity-50">
          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
};

/* ── Sidebar content ── */
const Sidebar = ({ messages, activeHistory, setActiveHistory, clearHistory, t, onClose }) => (
  <div className="flex flex-col h-full" style={{ background: "oklch(0.15 0.020 285)" }}>
    {/* Header with optional close button (mobile) */}
    <div className="p-4 flex items-center gap-2">
      <button onClick={clearHistory}
        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
        style={{ background: grad }}>
        + {t("aichat.newConversation", "New conversation")}
      </button>
      {onClose && (
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white transition"
          style={{ background: surface }}>
          ✕
        </button>
      )}
    </div>

    <div className="px-4 pb-4 flex-1 overflow-y-auto">
      <div className="text-[11px] font-bold uppercase tracking-widest mb-3"
           style={{ color: "oklch(0.45 0.02 285)" }}>
        {t("aichat.history", "History")}
      </div>
      <div className="flex flex-col gap-1">
        {messages.length > 0 ? (
          <>
            <button onClick={() => { setActiveHistory(0); onClose?.(); }}
              className="text-start px-3 py-2 rounded-lg text-sm truncate transition"
              style={{
                background: activeHistory === 0 ? "oklch(0.22 0.024 285)" : "transparent",
                color: activeHistory === 0 ? "#fff" : "oklch(0.55 0.02 285)",
                fontWeight: activeHistory === 0 ? 600 : 400,
              }}>
              {messages[0]?.content?.slice(0, 36) || "Current chat"}
            </button>
            {SAMPLE_HISTORY.slice(1).map((h, i) => (
              <button key={i} onClick={() => { setActiveHistory(i + 1); onClose?.(); }}
                className="text-start px-3 py-2 rounded-lg text-sm truncate transition"
                style={{
                  background: activeHistory === i + 1 ? "oklch(0.22 0.024 285)" : "transparent",
                  color: activeHistory === i + 1 ? "#fff" : "oklch(0.55 0.02 285)",
                  fontWeight: activeHistory === i + 1 ? 600 : 400,
                }}>
                {h}
              </button>
            ))}
          </>
        ) : (
          SAMPLE_HISTORY.map((h, i) => (
            <button key={i} onClick={() => { setActiveHistory(i); onClose?.(); }}
              className="text-start px-3 py-2 rounded-lg text-sm truncate transition"
              style={{
                background: activeHistory === i ? "oklch(0.22 0.024 285)" : "transparent",
                color: activeHistory === i ? "#fff" : "oklch(0.55 0.02 285)",
                fontWeight: activeHistory === i ? 600 : 400,
              }}>
              {h}
            </button>
          ))
        )}
      </div>
    </div>
  </div>
);

/* ── Main page ── */
const AiChat = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState(location.state?.prefill || "");
  const [sending, setSending]           = useState(false);
  const [loading, setLoading]           = useState(true);
  const [todayCount, setTodayCount]     = useState(0);
  const [activeHistory, setActiveHistory] = useState(0);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    api.get("/ai-chat/history").catch(() => ({ data: [] })).then(histRes => {
      const msgs = Array.isArray(histRes.data) ? histRes.data : [];
      setMessages(msgs);
      const today = new Date().toDateString();
      const count = msgs.filter(m => m.role === "user" && new Date(m.created_at).toDateString() === today).length;
      setTodayCount(count);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

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
      const res = await api.post("/ai-chat/message", { message: text });
      setMessages(prev => [...prev, res.data]);
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setTodayCount(c => c - 1);
      toast.error(e?.response?.data?.detail || t("aichat.failedSend"));
    }
    setSending(false);
    inputRef.current?.focus();
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
    <div className="flex h-[calc(100vh-60px)] relative overflow-hidden" style={{ background: bg, color: "#fff" }}>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          {/* drawer */}
          <div className="relative z-50 w-72 h-full border-r" style={{ borderColor: border }}>
            <Sidebar
              messages={messages} activeHistory={activeHistory}
              setActiveHistory={setActiveHistory} clearHistory={clearHistory}
              t={t} onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex md:w-[260px] shrink-0 flex-col border-r" style={{ borderColor: border }}>
        <Sidebar
          messages={messages} activeHistory={activeHistory}
          setActiveHistory={setActiveHistory} clearHistory={clearHistory}
          t={t}
        />
      </div>

      {/* ── Chat panel ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <div className="flex md:hidden items-center gap-3 px-4 py-3 border-b" style={{ borderColor: border }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white transition"
            style={{ background: surface }}>
            ☰
          </button>
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <span className="text-sm font-bold text-white">{t("aichat.title", "AI Assistant")}</span>
          </div>
          <div className="ml-auto text-xs" style={{ color: "oklch(0.55 0.02 285)" }}>
            {remaining}/{DAILY_LIMIT}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-6 space-y-4">
          {messages.length === 0 && !sending ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 pb-16">
              <div className="text-5xl">✨</div>
              <div className="text-center px-4">
                <h3 className="text-lg font-bold text-white mb-1">{t("aichat.askAnything", "Ask me anything")}</h3>
                <p className="text-sm" style={{ color: "oklch(0.55 0.02 285)" }}>
                  {t("aichat.helpText", "I can help with universities, scholarships, and applications")}
                </p>
              </div>
            </div>
          ) : (
            messages.map(msg => <Bubble key={msg.id} msg={msg} />)
          )}
          {sending && (
            <div className="flex justify-start gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs shrink-0 mt-1"
                   style={{ background: grad }}>✨</div>
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
                style={{ background: surface, border: `1px solid ${border}`, color: "oklch(0.75 0.02 285)" }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Limit warnings */}
        {remaining <= 5 && remaining > 0 && (
          <div className="px-4 py-2 text-center text-xs" style={{ color: "oklch(0.75 0.18 55)" }}>
            ⚠️ {t("aichat.remaining", { count: remaining })}
          </div>
        )}
        {remaining <= 0 && (
          <div className="px-4 py-2 text-center text-xs font-semibold" style={{ color: "oklch(0.75 0.18 25)" }}>
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
              className="flex-1 resize-none text-sm text-white placeholder-opacity-50 focus:outline-none"
              style={{
                background: surface,
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: "10px 14px",
                minHeight: 44,
                maxHeight: 120,
                color: "#fff",
              }}
              onFocus={e => { e.target.style.borderColor = "oklch(0.62 0.24 296 / 0.5)"; }}
              onBlur={e => { e.target.style.borderColor = border; }}
            />
            <button
              onClick={send}
              disabled={sending || !input.trim() || remaining <= 0}
              className="text-white text-sm font-bold px-4 md:px-5 py-3 rounded-xl transition hover:opacity-90 disabled:opacity-40 shrink-0"
              style={{ background: grad, minWidth: 64 }}>
              {sending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              ) : t("aichat.send", "Send")}
            </button>
          </div>
          <p className="text-center text-[10px] mt-2" style={{ color: "oklch(0.40 0.02 285)" }}>
            {t("aichat.disclaimer", "AI responses are for guidance only. Always verify with the university directly.")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
