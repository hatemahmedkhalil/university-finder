import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const STATUS_STYLE = {
  open:            { bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-200", dot: "bg-yellow-400",  label: "Open" },
  waiting_admin:   { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200", dot: "bg-orange-400",  label: "Waiting for Support" },
  waiting_student: { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",   dot: "bg-blue-400",    label: "Support Replied" },
  in_progress:     { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200", dot: "bg-purple-400",  label: "In Progress" },
  resolved:        { bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200",  dot: "bg-green-500",   label: "Resolved" },
  closed:          { bg: "bg-gray-50",    text: "text-gray-600",    border: "border-gray-200",   dot: "bg-gray-400",    label: "Closed" },
};

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const STATUS_LABELS = {
    open: t("support.status.open"),
    waiting_admin: t("support.status.waitingAdmin"),
    waiting_student: t("support.status.waitingStudent"),
    in_progress: t("support.status.inProgress"),
    resolved: t("support.status.resolved"),
    closed: t("support.status.closed"),
  };
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.open;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {STATUS_LABELS[status] ?? s.label}
    </span>
  );
};

/* ── New ticket form ── */
const NewTicketForm = ({ onCreated }) => {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      const res = await api.post("/support", { subject: subject.trim(), message: message.trim() });
      onCreated(res.data);
      setSubject("");
      setMessage("");
      toast.success(t("support.form.success"));
    } catch {
      toast.error(t("support.form.error"));
    }
    setSending(false);
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-bold text-gray-800 text-base mb-4">✉️ {t("support.form.newTicket")}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("support.form.subject")}</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder={t("support.form.subjectPlaceholder")}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("support.form.message")}</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            placeholder={t("support.form.messagePlaceholder")}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          type="submit"
          disabled={sending || !subject.trim() || !message.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-40"
        >
          {sending ? "…" : t("support.form.submit")}
        </button>
      </div>
    </form>
  );
};

/* ── Chat bubble ── */
const Bubble = ({ msg }) => {
  const { t } = useTranslation();
  const isStudent = msg.sender_role === "student";
  return (
    <div className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
        isStudent
          ? "bg-blue-600 text-white rounded-br-md"
          : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
      }`}>
        <p>{msg.message}</p>
        <p className={`text-[10px] mt-1 ${isStudent ? "text-blue-200 text-right" : "text-gray-400"}`}>
          {isStudent ? t("support.you") : t("support.supportTeam")} · {new Date(msg.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

/* ── Single ticket thread ── */
const TicketThread = ({ ticket, onUpdated, autoOpen }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(autoOpen || ticket.status === "waiting_student");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, ticket.conversation]);

  const sendFollowup = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/support/${ticket.id}/message`, { message: reply.trim() });
      onUpdated(res.data);
      setReply("");
    } catch {
      toast.error(t("support.form.error"));
    }
    setSending(false);
  };

  const hasNewReply = ticket.status === "waiting_student";

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
      hasNewReply ? "border-blue-300 ring-1 ring-blue-200" : "border-gray-100"
    }`}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left flex items-start gap-4 p-5"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
          hasNewReply ? "bg-blue-50" : ticket.status === "resolved" ? "bg-green-50" : "bg-gray-50"
        }`}>
          {hasNewReply ? "💬" : ticket.status === "resolved" ? "✅" : "📩"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="font-bold text-gray-800 text-sm truncate">{ticket.subject}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {hasNewReply && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                  {t("support.newReply")}
                </span>
              )}
              <StatusBadge status={ticket.status} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            #{ticket.id} · {ticket.conversation?.length ?? 0} message{ticket.conversation?.length !== 1 ? "s" : ""} · {new Date(ticket.created_at).toLocaleDateString()}
          </p>
        </div>
        <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform mt-1 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Conversation */}
      {open && (
        <div className="border-t border-gray-100">
          {/* Chat area */}
          <div className="px-5 py-4 space-y-3 bg-gray-50 min-h-24 max-h-96 overflow-y-auto">
            {(ticket.conversation ?? []).length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-6">{t("support.noMessages")}</div>
            ) : (
              (ticket.conversation ?? []).map(msg => <Bubble key={msg.id} msg={msg} />)
            )}
            <div ref={bottomRef} />
          </div>

          {/* Reply input (only if not closed/resolved) */}
          {!["resolved", "closed"].includes(ticket.status) && (
            <form onSubmit={sendFollowup} className="flex items-end gap-3 p-4 border-t border-gray-100 bg-white">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={2}
                placeholder={t("support.followUpPlaceholder")}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendFollowup(e); }
                }}
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition shrink-0"
              >
                {sending ? "…" : t("aichat.send")}
              </button>
            </form>
          )}

          {["resolved", "closed"].includes(ticket.status) && (
            <div className="px-5 py-3 bg-green-50 border-t border-green-100 text-xs text-green-700 text-center font-medium">
              ✅ {t("support.ticketClosed", { status: ticket.status })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Main page ── */
const Support = () => {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [searchParams] = useSearchParams();
  const focusTicketId = searchParams.get("ticket");

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get("/support/my");
      setTickets(res.data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useEffect(() => {
    const id = setInterval(() => fetchTickets(true), 30000);
    return () => clearInterval(id);
  }, [fetchTickets]);

  const handleCreated = (ticket) => setTickets(prev => [ticket, ...prev]);
  const handleUpdated = (updated) => setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));

  const waiting = tickets.filter(t => t.status === "waiting_student").length;
  const open_count = tickets.filter(t => ["open", "waiting_admin"].includes(t.status)).length;
  const resolved_count = tickets.filter(t => ["resolved", "closed"].includes(t.status)).length;

  const shown =
    tab === "all"       ? tickets :
    tab === "open"      ? tickets.filter(t => ["open", "waiting_admin"].includes(t.status)) :
    tab === "replied"   ? tickets.filter(t => t.status === "waiting_student") :
    tab === "resolved"  ? tickets.filter(t => ["resolved", "closed"].includes(t.status)) :
                          tickets;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-800 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-6 left-1/4 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-blue-200 text-xs font-bold px-4 py-1.5 rounded-full mb-5">
            🎧 We're here to help
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            {t("support.title")}
          </h1>
          <p className="text-indigo-200 text-base max-w-md mx-auto">
            {t("support.subtitle")}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* New ticket form */}
        <NewTicketForm onCreated={handleCreated} />

        {/* My tickets */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">{t("support.myTickets")}</h2>
            <div className="flex items-center gap-3">
              {waiting > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold animate-pulse">
                  💬 {t("support.newReplies", { count: waiting })}
                </span>
              )}
              <button
                onClick={() => fetchTickets(true)}
                disabled={refreshing}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50 flex items-center gap-1"
              >
                <svg className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t("support.refresh")}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { key: "all",      label: `${t("support.tabs.all")} (${tickets.length})` },
              { key: "open",     label: `${t("support.tabs.open")} (${open_count})` },
              { key: "replied",  label: `💬 ${t("support.tabs.replied")} (${waiting})` },
              { key: "resolved", label: `✅ ${t("support.tabs.resolved")} (${resolved_count})` },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  tab === t.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}
            </div>
          ) : shown.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-3">📭</div>
              <p className="font-semibold text-gray-500">{t("support.noTickets")}</p>
              <p className="text-sm text-gray-400 mt-1">{t("support.noTicketsSub")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shown.map(t => (
                <TicketThread
                  key={t.id}
                  ticket={t}
                  onUpdated={handleUpdated}
                  autoOpen={focusTicketId && String(t.id) === focusTicketId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Support;
