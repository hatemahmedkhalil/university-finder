import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  List, Datagrid, TextField, DateField, FunctionField,
  Create, Edit, SimpleForm, NumberInput, SelectInput, TextInput,
} from "react-admin";
import axios from "axios";
import {
  Box, Paper, Typography, Button, Chip, Stack, Skeleton, IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import PlaceIcon from "@mui/icons-material/Place";

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
  under_review:    { color: "warning",   label: "Under Review" },
  waiting_college: { color: "secondary", label: "Waiting College Answer" },
  accepted:        { color: "success",   label: "Accepted" },
  rejected:        { color: "error",     label: "Rejected" },
};

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] ?? { color: "default", label: status };
  return <Chip size="small" label={m.label} color={m.color} variant="outlined" sx={{ fontWeight: 700 }} />;
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

  if (loading) return <Stack spacing={1}><Skeleton variant="rounded" height={52} /><Skeleton variant="rounded" height={52} /></Stack>;

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
        <FolderOpenIcon fontSize="small" color="primary" /> Uploaded Documents ({docs.length})
      </Typography>

      {docs.length === 0 ? (
        <Typography variant="body2" color="text.disabled">No documents uploaded yet.</Typography>
      ) : (
        <Stack spacing={1}>
          {docs.map(doc => (
            <Paper
              key={doc.id}
              elevation={0}
              sx={{
                display: "flex", alignItems: "center", gap: 1.5, px: 1.75, py: 1.25, borderRadius: 2.5,
                borderWidth: 2,
                borderColor: doc.is_approved ? "success.main" : "divider",
                bgcolor: doc.is_approved ? "success.light" : "background.paper",
                ...(doc.is_approved && { "& > *": { color: "success.contrastText" } }),
              }}
            >
              <Typography sx={{ fontSize: 20 }}>{fileIcon(doc.file_type)}</Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  component="a" href={doc.url} target="_blank" rel="noreferrer"
                  variant="body2" fontWeight={700}
                  sx={{ color: doc.is_approved ? "inherit" : "primary.main", textDecoration: "none" }}
                >
                  {doc.original_name}
                </Typography>
                <Typography variant="caption" sx={{ display: "block", opacity: doc.is_approved ? 0.75 : 1, color: doc.is_approved ? "inherit" : "text.disabled" }}>
                  {fmt(doc.file_size)} · {new Date(doc.uploaded_at).toLocaleString()}
                </Typography>
              </Box>
              <Chip
                size="small"
                disabled={busy[doc.id]}
                onClick={() => toggleApprove(doc)}
                label={busy[doc.id] ? "…" : doc.is_approved ? "Approved" : "Not Approved"}
                color={doc.is_approved ? "success" : "error"}
                variant={doc.is_approved ? "filled" : "outlined"}
                sx={{ cursor: "pointer", fontWeight: 700 }}
              />
            </Paper>
          ))}
        </Stack>
      )}

      {!alreadySubmitted && (
        <Stack direction="row" alignItems="center" spacing={1.75} flexWrap="wrap" useFlexGap sx={{ mt: 2.5 }}>
          <Button
            variant="contained"
            startIcon={<RocketLaunchIcon fontSize="small" />}
            onClick={submitToCollege}
            disabled={submitting || !allApproved || docs.length === 0}
          >
            {submitting ? "Submitting…" : "Submit Application to College"}
          </Button>
          {!allApproved && docs.length > 0 && (
            <Typography variant="caption" color="warning.main" fontWeight={700}>
              ⚠️ Approve all {docs.length} document{docs.length !== 1 ? "s" : ""} first
            </Typography>
          )}
          {allApproved && docs.length > 0 && !submitting && !msg && (
            <Typography variant="caption" color="success.main" fontWeight={700}>
              ✅ All documents approved — ready to submit
            </Typography>
          )}
        </Stack>
      )}

      {alreadySubmitted && (
        <Paper elevation={0} sx={{ mt: 2, px: 2, py: 1.25, bgcolor: "success.light", borderRadius: 2.5 }}>
          <Typography variant="body2" fontWeight={700} sx={{ color: "success.contrastText", display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            ✅ Application has been submitted to college — current status: <StatusBadge status={status} />
          </Typography>
        </Paper>
      )}

      {msg && (
        <Typography variant="body2" fontWeight={700} sx={{ mt: 1.5, color: msg.startsWith("✅") ? "success.main" : "error.main" }}>
          {msg}
        </Typography>
      )}
    </Box>
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

  if (loading) return <Box sx={{ p: 5 }}><Skeleton variant="rounded" height={200} /></Box>;
  if (error || !app) return <Box sx={{ p: 5 }}><Typography color="error">{error || "Not found"}</Typography></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 860, mx: "auto" }}>
      <IconButton onClick={() => navigate("/applications")} size="small" sx={{ mb: 3 }} title="Back to Applications">
        <ArrowBackIcon fontSize="small" />
      </IconButton>

      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="overline" color="text.disabled" fontWeight={700}>University</Typography>
          <Typography variant="h5" fontWeight={800}>{app.university?.name ?? "—"}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
            <PlaceIcon fontSize="inherit" /> {app.university?.city}, {app.university?.country}
          </Typography>
        </Box>
        <StatusBadge status={app.status} />
      </Box>

      <Paper elevation={0} sx={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
        gap: 2, bgcolor: "action.hover", borderRadius: 3, p: 2.5, mb: 3,
      }}>
        {[
          ["Application ID", `#${app.id}`],
          ["Student ID",     app.user_id],
          ["Notes",          app.notes || "—"],
          ["Added",          new Date(app.created_at).toLocaleDateString()],
          ["Last Updated",   new Date(app.updated_at).toLocaleDateString()],
        ].map(([k, v]) => (
          <Box key={k}>
            <Typography variant="overline" color="text.disabled" fontWeight={700} sx={{ lineHeight: 1.4 }}>{k}</Typography>
            <Typography variant="body2" sx={{ mt: 0.25 }}>{v}</Typography>
          </Box>
        ))}
      </Paper>

      <DocReviewPanel appId={app.id} currentStatus={app.status} />
    </Box>
  );
}

export const ApplicationShow = ApplicationShowPage;
