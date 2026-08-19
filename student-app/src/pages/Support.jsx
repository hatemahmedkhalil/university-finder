import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import PageHero from "../components/PageHero";
import { Icon, ICONS } from "../components/Sidebar";

const STATUS_STYLE = {
  open:            { style: { background: "var(--warn-subtle)",   color: "var(--warn)" },   dot: "var(--warn)",   label: "Open" },
  waiting_admin:   { style: { background: "var(--warn-subtle)",   color: "var(--warn)" },   dot: "var(--warn)",   label: "Waiting for Support" },
  waiting_student: { style: { background: "var(--accent-subtle)", color: "var(--accent)" }, dot: "var(--accent)", label: "Support Replied" },
  in_progress:     { style: { background: "var(--accent-subtle)", color: "var(--accent)" }, dot: "var(--accent)", label: "In Progress" },
  resolved:        { style: { background: "var(--good-subtle)",   color: "var(--good)" },   dot: "var(--good)",   label: "Resolved" },
  closed:          { style: { background: "var(--surface-2)",     color: "var(--ink-faint)" }, dot: "var(--ink-faint)", label: "Closed" },
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
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={s.style}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
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
    <form onSubmit={submit} className="rounded-2xl border p-6" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
      <h2 className="font-bold text-base mb-4 inline-flex items-center gap-2" style={{ color: "var(--ink)" }}><Icon d={ICONS.mail} size={16} /> {t("support.form.newTicket")}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--ink-faint)" }}>{t("support.form.subject")}</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder={t("support.form.subjectPlaceholder")}
            required
            className="input w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--ink-faint)" }}>{t("support.form.message")}</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            placeholder={t("support.form.messagePlaceholder")}
            required
            className="input w-full resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={sending || !subject.trim() || !message.trim()}
          className="btn btn-primary w-full py-2.5 disabled:opacity-40"
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
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isStudent ? "rounded-br-md" : "border rounded-bl-md"}`}
        style={isStudent
          ? { background: "var(--accent)", color: "var(--on-accent)" }
          : { background: "var(--surface)", borderColor: "var(--border)", color: "var(--ink)" }}
      >
        <p>{msg.message}</p>
        <p className="text-[10px] mt-1" style={isStudent ? { color: "rgba(255,255,255,0.7)", textAlign: "right" } : { color: "var(--ink-faint)" }}>
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
    <div
      className="rounded-2xl border overflow-hidden"
      style={hasNewReply
        ? { background: "var(--surface-2)", borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent-subtle)" }
        : { background: "var(--surface-2)", borderColor: "var(--border)" }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left flex items-start gap-4 p-5"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: hasNewReply ? "var(--accent-subtle)" : ticket.status === "resolved" ? "var(--good-subtle)" : "var(--surface)" }}
        >
          <Icon d={hasNewReply ? ICONS.questions : ticket.status === "resolved" ? ICONS.check : ICONS.mail} size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="font-bold text-sm truncate" style={{ color: "var(--ink)" }}>{ticket.subject}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {hasNewReply && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold animate-pulse"
                  style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
                >
                  {t("support.newReply")}
                </span>
              )}
              <StatusBadge status={ticket.status} />
            </div>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--ink-faint)" }}>
            #{ticket.id} · {ticket.conversation?.length ?? 0} message{ticket.conversation?.length !== 1 ? "s" : ""} · {new Date(ticket.created_at).toLocaleDateString()}
          </p>
        </div>
        <svg className={`w-4 h-4 shrink-0 transition-transform mt-1 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--ink-faint)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Conversation */}
      {open && (
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          {/* Chat area */}
          <div className="px-5 py-4 space-y-3 min-h-24 max-h-96 overflow-y-auto" style={{ background: "var(--bg-subtle)" }}>
            {(ticket.conversation ?? []).length === 0 ? (
              <div className="text-center text-sm py-6" style={{ color: "var(--ink-faint)" }}>{t("support.noMessages")}</div>
            ) : (
              (ticket.conversation ?? []).map(msg => <Bubble key={msg.id} msg={msg} />)
            )}
            <div ref={bottomRef} />
          </div>

          {/* Reply input (only if not closed/resolved) */}
          {!["resolved", "closed"].includes(ticket.status) && (
            <form onSubmit={sendFollowup} className="flex items-end gap-3 p-4 border-t" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={2}
                placeholder={t("support.followUpPlaceholder")}
                className="input flex-1 resize-none"
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendFollowup(e); }
                }}
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="btn btn-primary px-4 py-2.5 shrink-0 disabled:opacity-40"
              >
                {sending ? "…" : t("aichat.send")}
              </button>
            </form>
          )}

          {["resolved", "closed"].includes(ticket.status) && (
            <div
              className="px-5 py-3 border-t text-xs text-center font-medium"
              style={{ background: "var(--good-subtle)", borderColor: "var(--border)", color: "var(--good)" }}
            >
              {t("support.ticketClosed", { status: ticket.status })}
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
    <div className="min-h-screen">
      <PageHero
        photo="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1400&q=80"
        title={t("support.title")}
        subtitle={t("support.subtitle")}
      />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* New ticket form */}
        <NewTicketForm onCreated={handleCreated} />

        {/* My tickets */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold" style={{ color: "var(--ink)" }}>{t("support.myTickets")}</h2>
            <div className="flex items-center gap-3">
              {waiting > 0 && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold animate-pulse"
                  style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
                >
                  {t("support.newReplies", { count: waiting })}
                </span>
              )}
              <button
                onClick={() => fetchTickets(true)}
                disabled={refreshing}
                className="text-xs font-semibold disabled:opacity-50 flex items-center gap-1 transition-colors"
                style={{ color: "var(--accent)" }}
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
              { key: "replied",  label: `${t("support.tabs.replied")} (${waiting})` },
              { key: "resolved", label: `${t("support.tabs.resolved")} (${resolved_count})` },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold border transition"
                style={tab === t.key
                  ? { background: "var(--accent)", color: "var(--on-accent)", borderColor: "var(--accent)" }
                  : { background: "var(--surface)", color: "var(--ink-faint)", borderColor: "var(--border)" }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="rounded-2xl border h-20 animate-pulse" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }} />)}
            </div>
          ) : shown.length === 0 ? (
            <div className="text-center py-14 rounded-2xl border" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
              <div className="mb-3 flex justify-center"><Icon d={ICONS.mail} size={40} /></div>
              <p className="font-semibold" style={{ color: "var(--ink-faint)" }}>{t("support.noTickets")}</p>
              <p className="text-sm mt-1" style={{ color: "var(--ink-faint)" }}>{t("support.noTicketsSub")}</p>
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

