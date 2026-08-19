import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Box, Paper, Typography, TextField, Button, Chip, Stack, Avatar,
  Skeleton, Tabs, Tab,
} from "@mui/material";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import InboxIcon from "@mui/icons-material/Inbox";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });
const api      = (url, opts = {}) => axios.get(url, { headers: authHeaders(), ...opts });
const postApi  = (url, data)      => axios.post(url, data, { headers: authHeaders() });
const patchApi = (url, data)      => axios.patch(url, data, { headers: authHeaders() });
const deleteApi = (url)           => axios.delete(url, { headers: authHeaders() });

const VALID_STATUSES = ["waiting_admin", "waiting_student", "in_progress", "resolved", "closed"];

const STATUS_META = {
  open:            { color: "warning", label: "Open" },
  waiting_admin:   { color: "warning", label: "Waiting for Admin" },
  waiting_student: { color: "primary", label: "Support Replied" },
  in_progress:     { color: "secondary", label: "In Progress" },
  resolved:        { color: "success", label: "Resolved" },
  closed:          { color: "default", label: "Closed" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_META[status] ?? STATUS_META.open;
  return <Chip size="small" label={s.label} color={s.color === "default" ? "default" : s.color} variant="outlined" />;
};

/* ── chat bubble ── */
const Bubble = ({ msg }) => {
  const isAdmin = msg.sender_role === "admin";
  return (
    <Box sx={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start", mb: 1 }}>
      <Box sx={{
        maxWidth: "75%", px: 1.75, py: 1.25,
        borderRadius: isAdmin ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        bgcolor: isAdmin ? "primary.main" : "action.hover",
        color: isAdmin ? "primary.contrastText" : "text.primary",
        fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
      }}>
        <Typography variant="body2" sx={{ color: "inherit" }}>{msg.message}</Typography>
        <Typography variant="caption" sx={{ display: "block", opacity: 0.65, mt: 0.5, textAlign: isAdmin ? "right" : "left", color: "inherit" }}>
          {isAdmin ? "You (Admin)" : "Student"} · {new Date(msg.created_at).toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

/* ── ticket thread ── */
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
    } catch { /* noop */ }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this ticket?")) return;
    setDeleting(true);
    try { await deleteApi(`/support/${ticket.id}`); onDeleted(ticket.id); } catch { /* noop */ }
    setDeleting(false);
  };

  const isUrgent = ticket.status === "waiting_admin";

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3, mb: 1.5, overflow: "hidden",
        borderColor: isUrgent ? "warning.main" : "divider",
        boxShadow: isUrgent ? "0 0 0 2px var(--mui-palette-warning-light)" : "none",
      }}
    >
      <Box
        onClick={() => setExpanded(e => !e)}
        sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.25, py: 1.75, cursor: "pointer", bgcolor: expanded ? "action.hover" : "transparent" }}
      >
        <Avatar sx={{ bgcolor: "primary.light", color: "primary.contrastText", fontWeight: 700, width: 36, height: 36, fontSize: 14 }}>
          {ticket.user.email[0].toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" fontWeight={700}>{ticket.subject}</Typography>
            {isUrgent && <Chip size="small" label="Needs Reply" color="warning" />}
          </Box>
          <Typography variant="caption" color="text.disabled">
            {ticket.user.email} · #{ticket.id} · {(ticket.conversation ?? []).length} msg · {new Date(ticket.created_at).toLocaleDateString()}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={1.25} flexShrink={0}>
          <StatusBadge status={ticket.status} />
          {expanded ? <ExpandLessIcon fontSize="small" color="disabled" /> : <ExpandMoreIcon fontSize="small" color="disabled" />}
        </Stack>
      </Box>

      {expanded && (
        <Box sx={{ borderTop: 1, borderColor: "divider" }}>
          {/* Status switcher */}
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ px: 2.25, py: 1.25, bgcolor: "action.hover", borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="caption" color="text.disabled" sx={{ mr: 0.5 }}>Status:</Typography>
            {VALID_STATUSES.map(s => (
              <Chip
                key={s}
                size="small"
                label={STATUS_META[s]?.label ?? s}
                onClick={() => changeStatus(s)}
                color={ticket.status === s ? "primary" : "default"}
                variant={ticket.status === s ? "filled" : "outlined"}
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Stack>

          {/* Chat */}
          <Box sx={{ px: 2.25, py: 2, bgcolor: "background.default", maxHeight: 360, overflowY: "auto" }}>
            {(ticket.conversation ?? []).length === 0 ? (
              <Typography variant="body2" color="text.disabled" align="center">No messages yet.</Typography>
            ) : (
              (ticket.conversation ?? []).map(m => <Bubble key={m.id} msg={m} />)
            )}
            <div ref={bottomRef} />
          </Box>

          {/* Reply */}
          {!["resolved", "closed"].includes(ticket.status) && (
            <Box sx={{ px: 2.25, py: 1.5, borderTop: 1, borderColor: "divider" }}>
              <Stack direction="row" spacing={1.25} alignItems="flex-end">
                <TextField
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  multiline rows={2} fullWidth size="small"
                  placeholder="Type your reply…  (Enter to send, Shift+Enter for new line)"
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                />
                <Button variant="contained" onClick={sendReply} disabled={saving || !replyText.trim()} sx={{ flexShrink: 0 }}>
                  {saving ? "…" : "Reply"}
                </Button>
              </Stack>
              {error && <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>{error}</Typography>}
            </Box>
          )}

          {["resolved", "closed"].includes(ticket.status) && (
            <Box sx={{ px: 2.25, py: 1.25, bgcolor: "success.light", opacity: 0.85, borderTop: 1, borderColor: "divider" }}>
              <Typography variant="caption" align="center" sx={{ display: "block", color: "success.contrastText" }}>
                ✅ Ticket is {ticket.status}. Change status above to re-open.
              </Typography>
            </Box>
          )}

          <Box sx={{ px: 2.25, pb: 1.75, pt: 1, display: "flex", justifyContent: "flex-end" }}>
            <Button
              size="small" color="error" variant="outlined"
              startIcon={<DeleteOutlineIcon fontSize="small" />}
              onClick={handleDelete} disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete Ticket"}
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

/* ── main panel ── */
export default function SupportPanel() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats]     = useState(null);
  const [tab, setTab]         = useState("waiting_admin");

  const loadAll = () => {
    Promise.all([api("/support"), api("/support/stats")])
      .then(([tRes, sRes]) => { setTickets(tRes.data); setStats(sRes.data); })
      .catch(() => { /* noop */ })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const handleUpdated = (updated) => {
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    api("/support/stats").then(r => setStats(r.data)).catch(() => { /* noop */ });
  };
  const handleDeleted = (id) => {
    setTickets(prev => prev.filter(t => t.id !== id));
    api("/support/stats").then(r => setStats(r.data)).catch(() => { /* noop */ });
  };

  const statTiles = stats ? [
    { key: "total",           label: "Total",           value: stats.total,           color: "primary" },
    { key: "waiting_admin",   label: "Needs Reply",     value: stats.waiting_admin,   color: "warning" },
    { key: "waiting_student", label: "Support Replied", value: stats.waiting_student, color: "primary" },
    { key: "in_progress",     label: "In Progress",     value: stats.in_progress,     color: "secondary" },
    { key: "resolved",        label: "Resolved",        value: stats.resolved,        color: "success" },
    { key: "closed",          label: "Closed",          value: stats.closed,          color: "default" },
  ] : [];

  const TABS = [
    { key: "waiting_admin",   label: `Needs Reply (${tickets.filter(t => t.status === "waiting_admin").length})` },
    { key: "waiting_student", label: `Replied (${tickets.filter(t => t.status === "waiting_student").length})` },
    { key: "in_progress",     label: `In Progress (${tickets.filter(t => t.status === "in_progress").length})` },
    { key: "resolved",        label: `Resolved (${tickets.filter(t => t.status === "resolved").length})` },
    { key: "closed",          label: `Closed (${tickets.filter(t => t.status === "closed").length})` },
    { key: "all",             label: `All (${tickets.length})` },
  ];

  const shown = tab === "all" ? tickets : tickets.filter(t => t.status === tab);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 960, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SupportAgentIcon color="primary" /> Support Tickets
        </Typography>
        <Typography variant="body2" color="text.secondary">Manage and reply to student support messages.</Typography>
      </Box>

      {stats && (
        <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          {statTiles.map(s => (
            <Paper key={s.key} elevation={0} sx={{
              borderRadius: 3, px: 2, py: 1.25, textAlign: "center", minWidth: 88,
              bgcolor: s.color === "default" ? "action.hover" : `${s.color}.light`,
              opacity: s.color === "default" ? 1 : 0.9,
            }}>
              <Typography variant="h6" fontWeight={800} sx={{ color: s.color === "default" ? "text.primary" : `${s.color}.contrastText` }}>
                {s.value ?? 0}
              </Typography>
              <Typography variant="caption" sx={{ color: s.color === "default" ? "text.disabled" : `${s.color}.contrastText`, opacity: s.color === "default" ? 1 : 0.8 }}>
                {s.label}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2.5, minHeight: 40, "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 600 } }}
      >
        {TABS.map(t => <Tab key={t.key} value={t.key} label={t.label} />)}
      </Tabs>

      {loading ? (
        <Stack spacing={1.5}>{[0, 1, 2].map(i => <Skeleton key={i} variant="rounded" height={70} />)}</Stack>
      ) : shown.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, color: "text.disabled" }}>
          <InboxIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.5 }} />
          <Typography variant="body1" fontWeight={600}>No tickets here</Typography>
        </Box>
      ) : (
        shown.map(ticket => (
          <TicketCard key={ticket.id} ticket={ticket} onUpdated={handleUpdated} onDeleted={handleDeleted} />
        ))
      )}
    </Box>
  );
}
