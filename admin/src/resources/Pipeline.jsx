import { useState } from "react";
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  FunctionField,
  useRecordContext,
  useNotify,
  useRefresh,
  SearchInput,
  SelectInput,
} from "react-admin";
import {
  Button,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField as MuiTextField,
  Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ClearIcon from "@mui/icons-material/Clear";

const DECISION_STYLES = {
  accepted:   { label: "Accepted",   color: "success", icon: <CheckCircleIcon fontSize="small" /> },
  rejected:   { label: "Rejected",   color: "error",   icon: <CancelIcon fontSize="small" /> },
  waitlisted: { label: "Waitlisted", color: "warning", icon: <HourglassEmptyIcon fontSize="small" /> },
};

const STATUS_COLORS = {
  shortlisted: "default",
  preparing:   "warning",
  ready:       "info",
  submitted:   "secondary",
  decision:    "primary",
};

/* ── Decision Button Panel ── */
function DecisionPanel({ record }) {
  const notify = useNotify();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingDecision, setPendingDecision] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  if (!record?.id) return null;

  const callDecision = async (decision) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const resp = await fetch(`/pipeline/admin/${record.id}/decision`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ decision, admin_note: adminNote || null }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Failed");
      notify(decision ? `Marked as ${decision}` : "Decision cleared", { type: "success" });
      refresh();
      setOpen(false);
      setAdminNote("");
    } catch (err) {
      notify(`Error: ${err.message}`, { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (decision) => {
    setPendingDecision(decision);
    setAdminNote("");
    setOpen(true);
  };

  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          size="small"
          variant="contained"
          color="success"
          startIcon={<CheckCircleIcon />}
          onClick={() => openDialog("accepted")}
          disabled={record.decision === "accepted"}
        >
          Accept
        </Button>
        <Button
          size="small"
          variant="contained"
          color="warning"
          startIcon={<HourglassEmptyIcon />}
          onClick={() => openDialog("waitlisted")}
          disabled={record.decision === "waitlisted"}
        >
          Waitlist
        </Button>
        <Button
          size="small"
          variant="contained"
          color="error"
          startIcon={<CancelIcon />}
          onClick={() => openDialog("rejected")}
          disabled={record.decision === "rejected"}
        >
          Reject
        </Button>
        {record.decision && (
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<ClearIcon />}
            onClick={() => openDialog(null)}
          >
            Clear
          </Button>
        )}
      </Stack>

      <Dialog open={open} onClose={() => !loading && setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {pendingDecision ? `Mark as ${pendingDecision}` : "Clear decision"}
        </DialogTitle>
        <DialogContent>
          <MuiTextField
            label="Admin note (optional — added to student notes)"
            multiline
            rows={3}
            fullWidth
            value={adminNote}
            onChange={e => setAdminNote(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button
            onClick={() => callDecision(pendingDecision)}
            disabled={loading}
            variant="contained"
            color={pendingDecision === "accepted" ? "success" : pendingDecision === "rejected" ? "error" : "warning"}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {loading ? "Saving…" : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/* ── Expandable row with decision buttons ── */
const PipelineExpand = () => {
  const record = useRecordContext();
  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <div>
        <strong>University:</strong> {record?.university?.name} — {record?.university?.city}, {record?.university?.country}
      </div>
      {record?.fit_analysis && (
        <div>
          <strong>AI Analysis:</strong> {record.fit_analysis}
        </div>
      )}
      {record?.notes && (
        <div>
          <strong>Notes:</strong>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: "4px 0 0" }}>{record.notes}</pre>
        </div>
      )}
      <div>
        <strong>Set Decision:</strong>
        <div style={{ marginTop: 8 }}>
          <DecisionPanel record={record} />
        </div>
      </div>
    </Stack>
  );
};

const pipelineFilters = [
  <SearchInput source="search" alwaysOn placeholder="Search student or university" />,
  <SelectInput source="status" choices={[
    { id: "shortlisted", name: "Shortlisted" },
    { id: "preparing",   name: "Preparing" },
    { id: "ready",       name: "Ready to Submit" },
    { id: "submitted",   name: "Submitted" },
    { id: "decision",    name: "Decision" },
  ]} />,
  <SelectInput source="decision" choices={[
    { id: "accepted",   name: "Accepted" },
    { id: "rejected",   name: "Rejected" },
    { id: "waitlisted", name: "Waitlisted" },
  ]} />,
];

export const PipelineList = () => (
  <List
    resource="pipeline/admin/all"
    filters={pipelineFilters}
    perPage={25}
    sort={{ field: "created_at", order: "DESC" }}
    title="Student Applications Pipeline"
  >
    <Datagrid expand={<PipelineExpand />} bulkActionButtons={false} rowClick="expand">
      <TextField source="id" label="ID" />
      <FunctionField label="Student" render={r => r.user_id ? `User #${r.user_id}` : "—"} />
      <FunctionField label="University" render={r => r.university?.name || "—"} />
      <FunctionField label="Country" render={r => r.university?.country || "—"} />
      <FunctionField label="Status" render={r => (
        <Chip
          label={r.status?.replace("_", " ")}
          color={STATUS_COLORS[r.status] || "default"}
          size="small"
          sx={{ textTransform: "capitalize" }}
        />
      )} />
      <NumberField source="fit_score" label="Fit %" />
      <FunctionField label="Decision" render={r => {
        if (!r.decision) return <Chip label="Pending" size="small" variant="outlined" />;
        const s = DECISION_STYLES[r.decision];
        return <Chip label={s?.label} color={s?.color} size="small" icon={s?.icon} />;
      }} />
      <DateField source="created_at" label="Added" showTime />
      <FunctionField label="Actions" render={r => <DecisionPanel record={r} />} />
    </Datagrid>
  </List>
);
