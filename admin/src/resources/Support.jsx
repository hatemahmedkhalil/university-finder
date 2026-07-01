import { useState, useEffect, useRef } from "react";
import axios from "axios";

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });
const api    = (url, opts = {}) => axios.get(url, { headers: authHeaders(), ...opts });
const postApi  = (url, data)    => axios.post(url, data, { headers: authHeaders() });
const patchApi = (url, data)    => axios.patch(url, data, { headers: authHeaders() });
const deleteApi = (url)         => axios.delete(url, { headers: authHeaders() });

const VALID_STATUSES = ["waiting_admin", "waiting_student", "in_progress", "resolved", "closed"];

const STATUS_META = {
  open:            { bg: "#fef9c3", color: "#854d0e", border: "#fde68a", label: "Open",              dot: "#f59e0b" },
  waiting_admin:   { bg: "#fff7ed", color: "#9a3412", border: "#fed7aa", label: "Waiting for Admin", dot: "#f97316" },
  waiting_student: { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe", label: "Support Replied",   dot: "#3b82f6" },
  in_progress:     { bg: "#f3e8ff", color: "#6b21a8", border: "#e9d5ff", label: "In Progress",       dot: "#a855f7" },
  resolved:        { bg: "#dcfce7", color: "#166534", border: "#bbf7d0", label: "Resolved",          dot: "#22c55e" },
  closed:          { bg: "#f3f4f6", color: "#4b5563", border: "#e5e7eb", label: "Closed",            dot: "#9ca3af" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_META[status] ?? STATUS_META.open;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {s.label}
    </span>
  );
};

/* ── Chat bubble ── */
const Bubble = ({ msg }) => {
  const isAdmin = msg.sender_role === "admin";
  return (
    <div style={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start", marginBottom: 8 }}>
      <div style={{
        maxWidth: "75%", padding: "10px 14px", borderRadius: isAdmin ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: isAdmin ? "#4f46e5" : "#f9fafb",
        color: isAdmin ? "#fff" : "#374151",
        border: isAdmin ? "none" : "1px solid #e5e7eb",
        fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
      }}>
        <p style={{ margin: 0 }}>{msg.message}</p>
        <p style={{ margin: "4px 0 0", fontSize: 10, opacity: 0.6, textAlign: isAdmin ? "right" : "left" }}>
          {isAdmin ? "You (Admin)" : "Student"} · {new Date(msg.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

/* ── Ticket thread ── */
const TicketCard = ({ ticket, onUpdated, onDeleted }) => {
  const [expanded, setExpanded] = useState(ticket.status === "waiting_admin");
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (expanded && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [expanded, ticket.conversation]);

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setSaving(true); setError("");
    try {
      const res = await postApi(`/support/${ticket.id}/reply`, { reply: replyText.trim(), status: "waiting_student" });
      onUpdated(res.data);
      setReplyText("");
    } catch { setError("Failed to send reply."); }
    setSaving(false);
  };

  const changeStatus = async (newStatus) => {
    try {
      const res = await patchApi(`/support/${ticket.id}/status`, { status: newStatus });
      onUpdated(res.data);
    } catch {}
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this ticket?")) return;
    setDeleting(true);
    try { await deleteApi(`/support/${ticket.id}`); onDeleted(ticket.id); } catch {}
    setDeleting(false);
  };

  const isUrgent = ticket.status === "waiting_admin";

  return (
    <div style={{
      background: "#fff", borderRadius: 12, marginBottom: 12, overflow: "hidden",
      border: `1px solid ${isUrgent ? "#fed7aa" : STATUS_META[ticket.status]?.border ?? "#e5e7eb"}`,
      boxShadow: isUrgent ? "0 0 0 2px #fed7aa" : "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer", background: expanded ? "#fafafa" : "#fff" }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: "50%", background: "#e0e7ff", color: "#4f46e5",
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0,
        }}>
          {ticket.user.email[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111", display: "flex", alignItems: "center", gap: 8 }}>
            {ticket.subject}
            {isUrgent && <span style={{ fontSize: 10, background: "#fed7aa", color: "#9a3412", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>Needs Reply</span>}
          </div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            {ticket.user.email} · #{ticket.id} · {(ticket.conversation ?? []).length} msg · {new Date(ticket.created_at).toLocaleDateString()}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <StatusBadge status={ticket.status} />
          <span style={{ color: "#aaa", fontSize: 16 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #f0f0f0" }}>
          {/* Status bar */}
          <div style={{ display: "flex", gap: 6, padding: "10px 18px", background: "#fafafa", borderBottom: "1px solid #f0f0f0", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#888", marginRight: 4 }}>Status:</span>
            {VALID_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                style={{
                  padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: ticket.status === s ? "#4f46e5" : "#f3f4f6",
                  color: ticket.status === s ? "#fff" : "#6b7280",
                  border: "none",
                }}
              >
                {STATUS_META[s]?.label ?? s}
              </button>
            ))}
          </div>

          {/* Chat area */}
          <div style={{ padding: "16px 18px", background: "#f9fafb", maxHeight: 360, overflowY: "auto" }}>
            {(ticket.conversation ?? []).length === 0 ? (
              <p style={{ textAlign: "center", color: "#aaa", fontSize: 13 }}>No messages yet.</p>
            ) : (
              (ticket.conversation ?? []).map(m => <Bubble key={m.id} msg={m} />)
            )}
            <div ref={bottomRef} />
          </div>

          {/* Reply input */}
          {!["resolved", "closed"].includes(ticket.status) && (
            <div style={{ padding: "12px 18px", background: "#fff", borderTop: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={2}
                  placeholder="Type your reply…  (Enter to send, Shift+Enter for new line)"
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  style={{
                    flex: 1, border: "1px solid #d1d5db", borderRadius: 10,
                    padding: "10px 12px", fontSize: 14, resize: "none",
                    fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={sendReply}
                  disabled={saving || !replyText.trim()}
                  style={{
                    background: saving || !replyText.trim() ? "#a5b4fc" : "#4f46e5",
                    color: "#fff", border: "none", borderRadius: 10,
                    padding: "10px 18px", fontWeight: 600, fontSize: 13,
                    cursor: saving || !replyText.trim() ? "not-allowed" : "pointer", flexShrink: 0,
                  }}
                >
                  {saving ? "…" : "Reply"}
                </button>
              </div>
              {error && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{error}</p>}
            </div>
          )}

          {["resolved", "closed"].includes(ticket.status) && (
            <div style={{ padding: "10px 18px", background: "#f0fdf4", borderTop: "1px solid #bbf7d0", fontSize: 12, color: "#15803d", textAlign: "center" }}>
              ✅ Ticket is {ticket.status}. Change status above to re-open.
            </div>
          )}

          {/* Delete */}
          <div style={{ padding: "8px 18px 14px", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ background: "none", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}
            >
              {deleting ? "Deleting…" : "🗑 Delete Ticket"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main Support Panel ── */
export default function SupportPanel() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats]     = useState(null);
  const [tab, setTab]         = useState("waiting_admin");

  const loadAll = () => {
    Promise.all([api("/support"), api("/support/stats")])
      .then(([tRes, sRes]) => { setTickets(tRes.data); setStats(sRes.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const handleUpdated = (updated) => {
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    api("/support/stats").then(r => setStats(r.data)).catch(() => {});
  };
  const handleDeleted = (id) => {
    setTickets(prev => prev.filter(t => t.id !== id));
    api("/support/stats").then(r => setStats(r.data)).catch(() => {});
  };

  const TABS = [
    { key: "waiting_admin",   label: `⏳ Needs Reply (${tickets.filter(t => t.status === "waiting_admin").length})` },
    { key: "waiting_student", label: `💬 Replied (${tickets.filter(t => t.status === "waiting_student").length})` },
    { key: "in_progress",     label: `🔄 In Progress (${tickets.filter(t => t.status === "in_progress").length})` },
    { key: "resolved",        label: `✅ Resolved (${tickets.filter(t => t.status === "resolved").length})` },
    { key: "closed",          label: `🔒 Closed (${tickets.filter(t => t.status === "closed").length})` },
    { key: "all",             label: `All (${tickets.length})` },
  ];

  const shown = tab === "all" ? tickets : tickets.filter(t => t.status === tab);

  return (
    <div style={{ padding: "32px 32px 48px", maxWidth: 920, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}>🎧 Support Tickets</h1>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Manage and reply to student support messages.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "Total",           value: stats.total,           color: "#6366f1" },
            { label: "Needs Reply",     value: stats.waiting_admin,   color: "#f97316" },
            { label: "Support Replied", value: stats.waiting_student, color: "#3b82f6" },
            { label: "In Progress",     value: stats.in_progress,     color: "#a855f7" },
            { label: "Resolved",        value: stats.resolved,        color: "#22c55e" },
            { label: "Closed",          value: stats.closed,          color: "#9ca3af" },
          ].map(s => (
            <div key={s.label} style={{
              background: s.color + "15", border: `1px solid ${s.color}30`,
              borderRadius: 12, padding: "10px 16px", textAlign: "center", minWidth: 80,
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value ?? 0}</div>
              <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: tab === t.key ? "#4f46e5" : "#fff",
              color: tab === t.key ? "#fff" : "#6b7280",
              border: tab === t.key ? "1px solid #4f46e5" : "1px solid #e5e7eb",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>Loading tickets…</div>
      ) : shown.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p style={{ fontSize: 15, fontWeight: 500 }}>No tickets here</p>
        </div>
      ) : (
        shown.map(ticket => (
          <TicketCard key={ticket.id} ticket={ticket} onUpdated={handleUpdated} onDeleted={handleDeleted} />
        ))
      )}
    </div>
  );
}
