import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const DAILY_LIMIT = 30;

/* ── Typing indicator ── */
const TypingDots = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    {[0, 1, 2].map(i => (
      <span
        key={i}
        className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

/* ── Message bubble ── */
const Bubble = ({ msg }) => {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm shrink-0 mt-1">
          ✨
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
        }`}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
        <p className={`text-[10px] mt-1.5 ${isUser ? "text-indigo-200 text-right" : "text-gray-400"}`}>
          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
};

/* ── Paywall ── */
const Paywall = () => {
  const { t } = useTranslation();
  const features = ["f1", "f2", "f3", "f4", "f5"].map(k => t(`aichat.${k}`));
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-3xl p-10 max-w-md shadow-sm">
        <div className="text-6xl mb-4">✨</div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{t("aichat.title")}</h2>
        <p className="text-gray-500 mb-6 leading-relaxed">{t("aichat.paywallDesc")}</p>
        <div className="text-left space-y-3 mb-8">
          {features.map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-indigo-500 font-bold">✓</span> {f}
            </div>
          ))}
        </div>
        <Link
          to="/pricing"
          className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition text-center"
        >
          {t("aichat.upgradeBtn")}
        </Link>
        <p className="text-xs text-gray-400 mt-3">{t("aichat.upgradeHint")}</p>
      </div>
    </div>
  );
};

/* ── Main page ── */
const AiChat = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [plan, setPlan] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(location.state?.prefill || "");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get("/ai-chat/me"),
      api.get("/ai-chat/history").catch(() => ({ data: [] })),
    ]).then(([planRes, histRes]) => {
      setPlan("premium");
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

  // Focus input when arriving with a prefilled question from another page
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const remaining = DAILY_LIMIT - todayCount;

  const sampleQuestions = ["q1", "q2", "q3", "q4"].map(k => t(`aichat.${k}`));

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-5 py-4 flex items-center gap-3 shadow-md">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="relative w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white text-lg backdrop-blur">
          ✨
        </div>
        <div className="relative flex-1">
          <h1 className="font-bold text-white text-base">{t("aichat.title")}</h1>
          <p className="text-xs text-indigo-100">{t("aichat.subtitle")}</p>
        </div>
        <div className="relative flex items-center gap-3">
          <span className="text-xs text-indigo-100 hidden sm:inline">{remaining}/{DAILY_LIMIT} {t("aichat.leftToday")}</span>
          <button
            onClick={clearHistory}
            className="text-sm text-white/70 hover:text-white transition w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center"
            title={t("aichat.clearTitle")}
          >
            🗑️
          </button>
        </div>
      </div>

      {plan !== "premium" ? (
        <Paywall />
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {messages.length === 0 && !sending && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🎓</div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">{t("aichat.askAnything")}</h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">{t("aichat.helpText")}</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                  {sampleQuestions.map(q => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-xs bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 px-3 py-2 rounded-xl transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}
            {sending && (
              <div className="flex justify-start gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm shrink-0 mt-1">✨</div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Daily limit warning */}
          {remaining <= 5 && remaining > 0 && (
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-center text-xs text-amber-700">
              ⚠️ {t("aichat.remaining", { count: remaining })}
            </div>
          )}
          {remaining <= 0 && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-center text-xs text-red-600 font-semibold">
              {t("aichat.limitReached")}
            </div>
          )}

          {/* Input */}
          <div className="bg-white border-t border-gray-100 px-4 py-3">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                disabled={remaining <= 0}
                placeholder={remaining <= 0 ? t("aichat.limitPlaceholder") : t("aichat.askPlaceholder")}
                className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 disabled:text-gray-400"
                style={{ minHeight: "44px", maxHeight: "120px" }}
              />
              <button
                onClick={send}
                disabled={sending || !input.trim() || remaining <= 0}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 rounded-xl text-sm font-bold disabled:opacity-40 transition shrink-0 flex items-center gap-1.5"
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>{t("aichat.send")} <span>↑</span></>
                )}
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-300 mt-1.5">
              {t("aichat.disclaimer")}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AiChat;
