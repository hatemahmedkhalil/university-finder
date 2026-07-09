import { useState, useEffect } from "react";
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  BooleanField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  BooleanInput,
  Show,
  SimpleShowLayout,
  SearchInput,
  SelectInput,
  required,
  minValue,
  maxValue,
  useRecordContext,
  useNotify,
  useRefresh,
} from "react-admin";
import { Button, CircularProgress, Chip, Box, Typography, IconButton, TextField as MuiTextField, Switch, FormControlLabel } from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

const COUNTRY_CHOICES = [
  "Germany", "Poland",
  "Austria", "Belgium", "Czech Republic", "Denmark", "Estonia", "Finland",
  "France", "Greece", "Hungary", "Ireland", "Italy", "Latvia",
  "Lithuania", "Luxembourg", "Netherlands", "Norway", "Portugal",
  "Romania", "Slovakia", "Spain", "Sweden", "Switzerland",
].map(c => ({ id: c, name: c }));

const STUDY_LANGUAGE_CHOICES = [
  { id: "English", name: "English" },
  { id: "German", name: "German" },
  { id: "Polish", name: "Polish" },
  { id: "English and German", name: "English and German" },
  { id: "English and Polish", name: "English and Polish" },
  { id: "Multiple Languages", name: "Multiple Languages" },
];

const APPLICATION_METHOD_CHOICES = [
  { id: "uni_assist", name: "uni-assist (German public)" },
  { id: "irk", name: "IRK Portal (Polish)" },
  { id: "own_portal", name: "Own Portal" },
  { id: "email", name: "Email Application" },
];

const universityFilters = [
  <SearchInput source="search" alwaysOn placeholder="Search name or city" />,
  <SelectInput source="country" choices={COUNTRY_CHOICES} />,
  <SelectInput
    source="english_only"
    label="English Programs"
    choices={[
      { id: true, name: "Yes" },
      { id: false, name: "No" },
    ]}
  />,
];

/* ── Document Checklist Manager (used inside Edit form) ── */
const DocumentChecklistField = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRequired, setNewRequired] = useState(true);
  const [adding, setAdding] = useState(false);

  const token = () => localStorage.getItem("auth_token");

  useEffect(() => {
    if (!record?.id) return;
    setLoading(true);
    fetch(`/universities/${record.id}/documents`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => notify("Failed to load documents", { type: "error" }))
      .finally(() => setLoading(false));
  }, [record?.id]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/universities/${record.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ name: newName.trim(), is_required: newRequired, order_index: items.length }),
      });
      if (!res.ok) throw new Error();
      const item = await res.json();
      setItems(prev => [...prev, item]);
      setNewName("");
      setNewRequired(true);
    } catch {
      notify("Failed to add document", { type: "error" });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this document?")) return;
    try {
      const res = await fetch(`/universities/${record.id}/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      notify("Failed to delete document", { type: "error" });
    }
  };

  const handleToggleRequired = async (item) => {
    try {
      const res = await fetch(`/universities/${record.id}/documents/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ is_required: !item.is_required }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    } catch {
      notify("Failed to update document", { type: "error" });
    }
  };

  if (!record?.id) return null;

  return (
    <Box sx={{ mt: 3, mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        📋 Document Checklist
      </Typography>

      {loading ? (
        <CircularProgress size={20} />
      ) : (
        <>
          {items.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No documents added yet.
            </Typography>
          )}
          {items.map((item, idx) => (
            <Box key={item.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, p: 1, bgcolor: "#f9f9f9", borderRadius: 1 }}>
              <Typography sx={{ flex: 1, fontSize: 14 }}>
                {idx + 1}. {item.name}
              </Typography>
              <Chip
                label={item.is_required ? "Required" : "Optional"}
                color={item.is_required ? "error" : "default"}
                size="small"
                onClick={() => handleToggleRequired(item)}
                sx={{ cursor: "pointer" }}
              />
              <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}

          {/* Add new document */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
            <MuiTextField
              size="small"
              placeholder="Document name (e.g. Passport copy)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              sx={{ flex: 1 }}
            />
            <FormControlLabel
              control={<Switch checked={newRequired} onChange={e => setNewRequired(e.target.checked)} size="small" color="error" />}
              label={<Typography variant="caption">{newRequired ? "Required" : "Optional"}</Typography>}
              sx={{ ml: 0 }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={adding ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
            >
              Add
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

/* ── Generate Guide Button (used inside Edit form) ── */
const GenerateGuideButton = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [loading, setLoading] = useState(false);

  if (!record?.id) return null;

  const handleGenerate = async () => {
    if (!window.confirm(`Generate application guide for "${record.name}"? This will fetch the university website and use AI to create a step-by-step guide.`)) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const resp = await fetch(`/application-guides/admin/${record.id}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Generation failed");
      notify(`Guide generated successfully — ${data.guide?.length || 0} steps`, { type: "success" });
      refresh();
    } catch (err) {
      notify(`Error: ${err.message}`, { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2, mb: 1, display: "flex", alignItems: "center", gap: 2 }}>
      <Button
        variant="contained"
        color="secondary"
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoFixHighIcon />}
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? "Generating Guide…" : "Generate Application Guide with AI"}
      </Button>
      {record.guide_generated_at && (
        <Chip
          icon={<CheckCircleIcon />}
          label={`Guide exists — last generated ${new Date(record.guide_generated_at).toLocaleDateString()}`}
          color="success"
          size="small"
          variant="outlined"
        />
      )}
    </Box>
  );
};

/* ── Guide Steps Preview ── */
const GuideStepsPreview = () => {
  const record = useRecordContext();
  if (!record?.application_guide) return null;

  let steps = [];
  try { steps = JSON.parse(record.application_guide); } catch { return null; }
  if (!steps.length) return null;

  const typeColors = {
    document: "#1976d2",
    account: "#7b1fa2",
    portal: "#0288d1",
    payment: "#d32f2f",
    email: "#388e3c",
    info: "#f57c00",
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Current Guide Preview ({steps.length} steps):
      </Typography>
      {steps.map((s) => (
        <Box key={s.step} sx={{ display: "flex", gap: 1.5, mb: 1, p: 1.5, border: "1px solid #e0e0e0", borderRadius: 1 }}>
          <Box sx={{
            minWidth: 28, height: 28, borderRadius: "50%",
            background: typeColors[s.action_type] || "#666",
            color: "#fff", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 13, fontWeight: 700
          }}>
            {s.step}
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.title}</Typography>
            <Typography variant="caption" color="text.secondary">{s.description}</Typography>
            {s.url && (
              <Typography variant="caption" sx={{ display: "block", color: "#1976d2" }}>
                → {s.url}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

/* ── Shared form fields used in both Edit and Create ── */
const UniversityFormFields = ({ isEdit = false }) => (
  <>
    {/* Core Identity */}
    <TextInput source="name" validate={required()} fullWidth label="University Name" />
    <SelectInput source="country" choices={COUNTRY_CHOICES} validate={required()} />
    <TextInput source="city" validate={required()} />
    <TextInput source="website" fullWidth label="Official Website URL" />
    <BooleanInput source="is_public" label="Public University (uncheck for Private)" defaultValue={true} />

    {/* Description & Notes */}
    <TextInput source="description" multiline rows={4} fullWidth label="University Description" />
    <TextInput source="notes" multiline rows={3} fullWidth label="Admin Notes / Verification Status" />

    {/* Programs */}
    <TextInput
      source="programs"
      multiline rows={4}
      fullWidth
      label="Available Programs (comma-separated)"
      helperText="List programs, especially English-taught ones"
    />
    <SelectInput source="study_language" choices={STUDY_LANGUAGE_CHOICES} label="Primary Study Language" />
    <BooleanInput source="english_programs_available" label="English Programs Available" />

    {/* Fees */}
    <NumberInput source="tuition_fee_eur" label="Tuition Fee per Year (€) — 0 for free" min={0} />
    <NumberInput source="semester_fee_eur" label="Semester Admin Fee (€) — German universities" min={0} helperText="E.g. 150–350 per semester for German public unis" />
    <NumberInput source="application_fee_eur" label="Application Fee (€)" min={0} />

    {/* Accommodation */}
    <TextInput
      source="accommodation_info"
      multiline rows={3}
      fullWidth
      label="Accommodation / Dormitory Details"
    />
    <NumberInput source="dormitory_cost_eur" label="Dormitory Cost per Month (€)" min={0} />
    <NumberInput source="living_cost_eur" label="Total Monthly Living Cost Estimate (€)" min={0} />

    {/* Admission */}
    <TextInput
      source="admission_requirements"
      multiline rows={4}
      fullWidth
      label="Admission Requirements"
    />
    <TextInput
      source="language_requirements"
      multiline rows={2}
      fullWidth
      label="Language Requirements (IELTS/TOEFL/TestDaF etc.)"
    />
    <TextInput
      source="required_documents"
      multiline rows={3}
      fullWidth
      label="Required Documents"
    />
    <TextInput source="application_deadline" fullWidth label="Application Deadline(s)" />
    <TextInput source="study_duration" label="Study Duration (e.g. Bachelor: 3 years, Master: 2 years)" fullWidth />
    <NumberInput
      source="min_gpa"
      label="Minimum GPA (0–4.0 scale)"
      validate={[minValue(0), maxValue(4)]}
      step={0.1}
    />

    {/* Ranking & Stats */}
    <NumberInput source="ranking" label="World Ranking (optional)" min={1} />
    <NumberInput
      source="acceptance_rate"
      label="Acceptance Rate (0.0 – 1.0)"
      validate={[minValue(0), maxValue(1)]}
      step={0.01}
    />

    {/* Contact & Media */}
    <TextInput source="logo_url" fullWidth label="Logo URL" />
    <TextInput source="contact_email" label="Contact Email" />
    <TextInput source="contact_phone" label="Contact Phone" />

    {/* Application Method */}
    <SelectInput
      source="application_method"
      choices={APPLICATION_METHOD_CHOICES}
      label="Application Method"
      helperText="How international students apply to this university"
    />
    <TextInput
      source="application_portal_url"
      fullWidth
      label="Application Portal URL"
      helperText="Direct link to the application portal (uni-assist, IRK, or own portal)"
    />

    {/* Document Checklist — only in Edit (needs existing record) */}
    {isEdit && (
      <>
        <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600, color: "#388e3c" }}>
          Document Checklist
        </Typography>
        <DocumentChecklistField />
      </>
    )}

    {/* Application Guide — only in Edit (needs existing record) */}
    {isEdit && (
      <>
        <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600, color: "#1976d2" }}>
          Application Guide
        </Typography>
        <GenerateGuideButton />
        <GuideStepsPreview />
        <TextInput
          source="application_guide"
          multiline
          rows={8}
          fullWidth
          label="Application Guide (JSON — auto-generated above, manual edit possible)"
          helperText='JSON array of steps. Each step: {"step":1,"title":"...","description":"...","action_type":"info|portal|document|payment|email|account","url":"..."}'
        />
      </>
    )}
  </>
);

export const UniversityList = () => (
  <List filters={universityFilters} perPage={25} sort={{ field: "name", order: "ASC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="country" />
      <TextField source="city" />
      <TextField source="study_language" label="Language" />
      <TextField source="application_method" label="App. Method" />
      <NumberField source="tuition_fee_eur" label="Tuition (€/yr)" />
      <NumberField source="semester_fee_eur" label="Sem. Fee (€)" />
      <NumberField source="dormitory_cost_eur" label="Dorm (€/mo)" />
      <BooleanField source="is_public" label="Public" />
      <BooleanField source="english_programs_available" label="English" />
      <TextField source="notes" label="Notes" />
    </Datagrid>
  </List>
);

export const UniversityEdit = () => (
  <Edit>
    <SimpleForm>
      <UniversityFormFields isEdit={true} />
    </SimpleForm>
  </Edit>
);

export const UniversityCreate = () => (
  <Create>
    <SimpleForm>
      <UniversityFormFields isEdit={false} />
    </SimpleForm>
  </Create>
);

export const UniversityShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" label="University Name" />
      <TextField source="country" />
      <TextField source="city" />
      <TextField source="website" label="Official Website" />
      <BooleanField source="is_public" label="Public University" />
      <TextField source="study_language" label="Study Language" />
      <BooleanField source="english_programs_available" label="English Programs Available" />
      <TextField source="description" />
      <TextField source="programs" label="Programs" />
      <NumberField source="tuition_fee_eur" label="Tuition Fee per Year (€)" />
      <NumberField source="semester_fee_eur" label="Semester Fee (€)" />
      <NumberField source="application_fee_eur" label="Application Fee (€)" />
      <NumberField source="dormitory_cost_eur" label="Dormitory Cost/Month (€)" />
      <NumberField source="living_cost_eur" label="Total Living Cost/Month (€)" />
      <TextField source="accommodation_info" label="Accommodation Details" />
      <TextField source="admission_requirements" label="Admission Requirements" />
      <TextField source="language_requirements" label="Language Requirements" />
      <TextField source="required_documents" label="Required Documents" />
      <TextField source="application_deadline" label="Application Deadline" />
      <TextField source="study_duration" label="Study Duration" />
      <NumberField source="min_gpa" label="Min GPA" />
      <NumberField source="ranking" label="World Ranking" />
      <NumberField source="acceptance_rate" label="Acceptance Rate" />
      <TextField source="logo_url" label="Logo URL" />
      <TextField source="contact_email" label="Contact Email" />
      <TextField source="contact_phone" label="Contact Phone" />
      <TextField source="notes" label="Admin Notes" />
      <TextField source="application_method" label="Application Method" />
      <TextField source="application_portal_url" label="Application Portal URL" />
    </SimpleShowLayout>
  </Show>
);
