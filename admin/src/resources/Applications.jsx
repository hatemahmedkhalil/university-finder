import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  List, Datagrid, TextField, DateField, FunctionField,
  Create, Edit, SimpleForm, NumberInput, SelectInput, TextInput,
} from "react-admin";
import axios from "axios";

/* ── shared axios instance ── */
const api = axios.create({ baseURL: "" });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("access_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

/* ── status config ── */
const STATUS_CHOICES = [
  { id: "under_review",    name: "Under Review" },
  { id: "waiting_college", name: "Waiting College Answer" },
  { id: "accepted",        name: "Accepted" },
  { id: "rejected",        name: "Rejected" },
];

const STATUS_META = {
  under_review:    { color: "#f59e0b", bg: "#fffbeb", label: "Under Review" },
  waiting_college: { color: "#8b5cf6", bg: "#f5f3ff", label: "Waiting College Answer" },
  accepted:        { color: "#10b981", bg: "#ecfdf5", label: "Accepted" },
  rejected:        { color: "#ef4444", bg: "#fef2f2", label: "Rejected" },
};

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] ?? { color: "#6b7280", bg: "#f9fafb", label: status };
  return (
    <span style={{
      background: m.bg, color: m.color, border: `1px solid ${m.color}40`,
      padding: "3px 12px", borderRadius: 20, fontWeight: 700, fontSize: 12,
      display: "inline-block",
    }}>
      {m.label}
    </span>
  );
};

/* ────────────────────────────────────────────────────────
   LIST
──────────────────────────────────────────────────────── */
const ApplicationFilters = [
  <SelectInput key="status" source="status" choices={STATUS_CHOICES} alwaysOn />,
  <TextInput   key="q"      source="q" label="Search" alwaysOn />,
];

export const ApplicationList = () => (
  <List filters={ApplicationFilters} sort={{ field: "updated_at", order: "DESC" }}>
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <TextField   source="id" />
      <FunctionField label="Student"    render={r => r.user_id ?? "—"} />
      <FunctionField label="University" render={r => r.university?.name ?? "—"} />
      <FunctionField label="Country"    render={r => r.university?.country ?? "—"} />
      <FunctionField label="Status"     render={r => <StatusBadge status={r.status} />} />
      <DateField     source="created_at" label="Added"   showTime />
      <DateField     source="updated_at" label="Updated" showTime />
    </Datagrid>
  </List>
);

/* ────────────────────────────────────────────────────────
   CREATE / EDIT  (kept simple)
──────────────────────────────────────────────────────── */
export const ApplicationCreate = () => (
  <Create>
    <SimpleForm>
      <NumberInput source="user_id"       label="User ID"       required />
      <NumberInput source="university_id" label="University ID" required />
      <SelectInput source="status"        label="Status"        choices={STATUS_CHOICES} defaultValue="under_review" />
      <TextInput   source="notes"         label="Notes"         multiline rows={3} fullWidth />
    </SimpleForm>
  </Create>
);

export const ApplicationEdit = () => (
  <Edit>
    <SimpleForm>
      <SelectInput source="status" label="Status" choices={STATUS_CHOICES} />
      <TextInput   source="notes"  label="Notes"  multiline rows={3} fullWidth />
    </SimpleForm>
  </Edit>
);

/* ────────────────────────────────────────────────────────
   SHOW  — fully standalone, no react-admin data hooks
──────────────────────────────────────────────────────── */
function DocReviewPanel({ appId, currentStatus }) {
  const [docs,       setDocs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [busy,       setBusy]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status,     setStatus]     = useState(currentStatus);
  const [msg,        setMsg]        = useState("");

  useEffect(() => {
    api.get(`/applications/admin/${appId}/documents`)
      .then(r => setDocs(r.data))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [appId]);

  const toggleApprove = async (doc) => {
    setBusy(b => ({ ...b, [doc.id]: true }));
    try {
      const res = await api.patch(
        `/applications/admin/${appId}/documents/${doc.id}`,
        { is_approved: !doc.is_approved }
      );
      setDocs(prev => prev.map(d => d.id === doc.id ? res.data : d));
    } catch {
      setMsg("❌ Failed to update document.");
    } finally {
      setBusy(b => ({ ...b, [doc.id]: false }));
    }
  };

  const submitToCollege = async () => {
    setSubmitting(true);
    setMsg("");
    try {
      await api.patch(`/applications/admin/${appId}`, { status: "waiting_college" });
      setStatus("waiting_college");
      setMsg("✅ Application submitted to college successfully!");
    } catch {
      setMsg("❌ Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  const allApproved = docs.length > 0 && docs.every(d => d.is_approved);
  const alreadySubmitted = status === "waiting_college" || status === "accepted" || status === "rejected";

  const fmt = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
  const fileIcon = (t) => {
    if (t.startsWith("image/")) return "🖼️";
    if (t === "application/pdf") return "📄";
    if (t.includes("word")) return "📝";
    if (t.includes("sheet") || t.includes("excel")) return "📊";
    return "📎";
  };

  if (loading) return <p style={{ color: "#888" }}>Loading documents…</p>;

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
        📁 Uploaded Documents ({docs.length})
      </h3>

      {docs.length === 0 ? (
        <p style={{ color: "#94a3b8", fontSize: 13 }}>No documents uploaded yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {docs.map(doc => (
            <div key={doc.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 14px", borderRadius: 10,
              border: `2px solid ${doc.is_approved ? "#bbf7d0" : "#e2e8f0"}`,
              background: doc.is_approved ? "#f0fdf4" : "#f8fafc",
            }}>
              <span style={{ fontSize: 20 }}>{fileIcon(doc.file_type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={doc.url} target="_blank" rel="noreferrer"
                  style={{ fontWeight: 600, fontSize: 13, color: "#3b82f6", textDecoration: "none" }}>
                  {doc.original_name}
                </a>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                  {fmt(doc.file_size)} · {new Date(doc.uploaded_at).toLocaleString()}
                </p>
              </div>
              <button
                disabled={busy[doc.id]}
                onClick={() => toggleApprove(doc)}
                style={{
                  padding: "5px 14px", borderRadius: 20, border: "none",
                  cursor: busy[doc.id] ? "not-allowed" : "pointer",
                  fontWeight: 700, fontSize: 12,
                  background: doc.is_approved ? "#dcfce7" : "#fee2e2",
                  color:      doc.is_approved ? "#16a34a" : "#dc2626",
                  opacity: busy[doc.id] ? 0.5 : 1,
                }}
              >
                {busy[doc.id] ? "…" : doc.is_approved ? "✅ Approved" : "❌ Not Approved"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Submit button */}
      {!alreadySubmitted && (
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button
            onClick={submitToCollege}
            disabled={submitting || !allApproved || docs.length === 0}
            style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              cursor: (allApproved && !submitting && docs.length > 0) ? "pointer" : "not-allowed",
              fontWeight: 700, fontSize: 13,
              background: (allApproved && docs.length > 0) ? "#2563eb" : "#e2e8f0",
              color:      (allApproved && docs.length > 0) ? "#fff"    : "#94a3b8",
            }}
          >
            {submitting ? "Submitting…" : "🚀 Submit Application to College"}
          </button>
          {!allApproved && docs.length > 0 && (
            <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>
              ⚠️ Approve all {docs.length} document{docs.length !== 1 ? "s" : ""} first
            </span>
          )}
          {allApproved && docs.length > 0 && !submitting && !msg && (
            <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
              ✅ All documents approved — ready to submit
            </span>
          )}
        </div>
      )}

      {alreadySubmitted && (
        <div style={{ marginTop: 16, padding: "10px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>
          <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>
            ✅ Application has been submitted to college — current status: <StatusBadge status={status} />
          </span>
        </div>
      )}

      {msg && (
        <p style={{ marginTop: 12, fontSize: 13, fontWeight: 600,
          color: msg.startsWith("✅") ? "#16a34a" : "#dc2626" }}>
          {msg}
        </p>
      )}
    </div>
  );
}

/* Standalone show page — no react-admin Show/useRecordContext */
function ApplicationShowPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app,     setApp]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    api.get(`/applications/admin/${id}`)
      .then(r => setApp(r.data))
      .catch(() => setError("Could not load application."))
      .finally(() => setLoading(false));
  }, [id]);

  const label = { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" };
  const value = { fontSize: 14, color: "#1e293b", marginTop: 2, marginBottom: 0 };

  if (loading) return <div style={{ padding: 40, color: "#888" }}>Loading…</div>;
  if (error || !app) return <div style={{ padding: 40, color: "#ef4444" }}>{error || "Not found"}</div>;

  return (
    <div style={{ padding: 32, maxWidth: 860, margin: "0 auto" }}>
      {/* Back button */}
      <button onClick={() => navigate("/applications")}
        style={{ marginBottom: 24, background: "none", border: "1px solid #e2e8f0",
          borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontSize: 13, color: "#64748b" }}>
        ← Back to Applications
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <p style={label}>University</p>
          <h2 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
            {app.university?.name ?? "—"}
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
            📍 {app.university?.city}, {app.university?.country}
          </p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {/* Info grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
        gap: "12px 24px", background: "#f8fafc", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
        {[
          ["Application ID", `#${app.id}`],
          ["Student ID",     app.user_id],
          ["Notes",          app.notes || "—"],
          ["Added",          new Date(app.created_at).toLocaleDateString()],
          ["Last Updated",   new Date(app.updated_at).toLocaleDateString()],
        ].map(([k, v]) => (
          <div key={k}>
            <p style={label}>{k}</p>
            <p style={value}>{v}</p>
          </div>
        ))}
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "0 0 8px" }} />

      {/* Document review */}
      <DocReviewPanel appId={app.id} currentStatus={app.status} />
    </div>
  );
}

export const ApplicationShow = ApplicationShowPage;
