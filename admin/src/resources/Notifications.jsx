import { useState } from "react";
import {
  List, Datagrid, TextField, BooleanField, DateField, EmailField,
} from "react-admin";
import axios from "axios";

export const NotificationList = () => (
  <List resource="admin/notifications" sort={{ field: "id", order: "DESC" }} perPage={50}>
    <Datagrid bulkActionButtons={false}>
      <TextField    source="id" />
      <EmailField   source="user_email" label="Student" />
      <TextField    source="title" />
      <TextField    source="message" />
      <TextField    source="type" />
      <BooleanField source="is_read" label="Read" />
      <DateField    source="created_at" label="Sent" showTime />
    </Datagrid>
  </List>
);

/* Stand-alone "Send Notification" panel — used as a CustomRoute */
export const SendNotificationPanel = () => {
  const [title, setTitle]       = useState("");
  const [message, setMessage]   = useState("");
  const [type, setType]         = useState("system");
  const [target, setTarget]     = useState("all");
  const [userIds, setUserIds]   = useState("");
  const [sending, setSending]   = useState(false);
  const [result, setResult]     = useState(null);

  const send = async () => {
    if (!title || !message) return;
    setSending(true);
    setResult(null);
    try {
      const payload = { title, message, type };
      if (target === "specific") {
        payload.user_ids = userIds.split(",").map(s => parseInt(s.trim())).filter(Boolean);
      }
      const r = await axios.post("/admin/notifications/send", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      setResult({ ok: true, sent: r.data.sent });
      setTitle(""); setMessage("");
    } catch (e) {
      setResult({ ok: false, error: e?.response?.data?.detail || "Failed" });
    } finally {
      setSending(false);
    }
  };

  const card = {
    background: "#fff", borderRadius: 12, padding: 24,
    boxShadow: "0 1px 4px rgba(0,0,0,.12)", maxWidth: 600,
  };
  const inp = {
    width: "100%", padding: "10px 12px", border: "1px solid #d1d5db",
    borderRadius: 8, fontSize: 14, marginBottom: 14, boxSizing: "border-box",
  };
  const btn = {
    background: sending ? "#a5b4fc" : "#4f46e5", color: "#fff",
    border: "none", borderRadius: 8, padding: "10px 24px",
    fontSize: 14, fontWeight: 600, cursor: sending ? "not-allowed" : "pointer",
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 20 }}>📣 Send Notification to Students</h2>
      <div style={card}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>TITLE</label>
        <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. New Scholarship Available" />

        <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>MESSAGE</label>
        <textarea style={{ ...inp, height: 90, resize: "vertical" }} value={message} onChange={e => setMessage(e.target.value)} placeholder="Notification body text…" />

        <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>TYPE</label>
        <select style={{ ...inp, marginBottom: 14 }} value={type} onChange={e => setType(e.target.value)}>
          <option value="system">System</option>
          <option value="scholarship_update">Scholarship Update</option>
          <option value="application_update">Application Update</option>
          <option value="support_reply">Support Reply</option>
        </select>

        <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>SEND TO</label>
        <select style={{ ...inp }} value={target} onChange={e => setTarget(e.target.value)}>
          <option value="all">All Students</option>
          <option value="specific">Specific User IDs</option>
        </select>

        {target === "specific" && (
          <>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>USER IDs (comma-separated)</label>
            <input style={inp} value={userIds} onChange={e => setUserIds(e.target.value)} placeholder="1, 4, 12" />
          </>
        )}

        <button style={btn} onClick={send} disabled={sending}>
          {sending ? "Sending…" : "📤 Send"}
        </button>

        {result && (
          <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: result.ok ? "#dcfce7" : "#fee2e2", color: result.ok ? "#166534" : "#991b1b", fontSize: 14 }}>
            {result.ok ? `✅ Sent to ${result.sent} student${result.sent !== 1 ? "s" : ""}` : `❌ ${result.error}`}
          </div>
        )}
      </div>
    </div>
  );
};
