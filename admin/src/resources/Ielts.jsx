import { useState } from "react";
import {
  List, Datagrid, TextField, BooleanField, NumberField, DateField,
  Edit, Create, SimpleForm, TextInput, BooleanInput, NumberInput,
  Show, SimpleShowLayout, required, useRecordContext, useNotify, useRefresh,
} from "react-admin";
import axios from "axios";

const ALLOWED_AUDIO = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/aac"];

/* ── Audio Upload Widget ── */
const AudioUploadField = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [uploading, setUploading] = useState(false);

  if (!record?.id) return null;

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_AUDIO.includes(file.type)) {
      notify("Only MP3, WAV, OGG, M4A, AAC files allowed", { type: "error" });
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(`/ielts/manage/sections/${record.id}/audio`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      notify("Audio uploaded successfully", { type: "success" });
      refresh();
    } catch (err) {
      notify(err?.response?.data?.detail || "Upload failed", { type: "error" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Remove this audio file?")) return;
    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(`/ielts/manage/sections/${record.id}/audio`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notify("Audio removed", { type: "success" });
      refresh();
    } catch {
      notify("Failed to remove audio", { type: "error" });
    }
  };

  return (
    <div style={{ marginTop: 16, padding: 16, border: "1px solid #e0e0e0", borderRadius: 8 }}>
      <p style={{ fontWeight: 600, marginBottom: 8 }}>🎧 Listening Audio</p>
      {record.audio_url ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <audio controls src={record.audio_url} style={{ flex: 1, minWidth: 200 }} />
          <button onClick={handleDelete}
            style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}>
            Remove
          </button>
        </div>
      ) : (
        <p style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>No audio uploaded yet</p>
      )}
      <label style={{ display: "inline-block", marginTop: 8, cursor: "pointer",
        background: "#6366f1", color: "#fff", borderRadius: 6, padding: "6px 16px", fontSize: 13 }}>
        {uploading ? "Uploading…" : record.audio_url ? "Replace Audio" : "Upload Audio"}
        <input type="file" accept="audio/*" onChange={handleUpload} style={{ display: "none" }} disabled={uploading} />
      </label>
      <p style={{ color: "#aaa", fontSize: 11, marginTop: 6 }}>MP3 / WAV / OGG / M4A · max 50 MB</p>
    </div>
  );
};

/* ── IELTS Tests ── */

export const IeltsTestList = () => (
  <List sort={{ field: "id", order: "DESC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField    source="id"               label="ID" />
      <TextField    source="title"            label="Title" />
      <NumberField  source="duration_minutes" label="Duration (min)" />
      <NumberField  source="section_count"    label="Sections" />
      <NumberField  source="total_questions"  label="Questions" />
      <BooleanField source="is_published"     label="Published" />
      <DateField    source="created_at"       label="Created" showTime />
    </Datagrid>
  </List>
);

export const IeltsTestCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput    source="title"            validate={required()} fullWidth />
      <TextInput    source="description"      multiline rows={3} fullWidth />
      <NumberInput  source="duration_minutes" label="Duration (minutes)" defaultValue={170} />
      <BooleanInput source="is_published"     label="Published (visible to students)" />
    </SimpleForm>
  </Create>
);

export const IeltsTestEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput    source="title"            validate={required()} fullWidth />
      <TextInput    source="description"      multiline rows={3} fullWidth />
      <NumberInput  source="duration_minutes" label="Duration (minutes)" />
      <BooleanInput source="is_published"     label="Published (visible to students)" />
    </SimpleForm>
  </Edit>
);

export const IeltsTestShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField    source="id" />
      <TextField    source="title" />
      <TextField    source="description" />
      <NumberField  source="duration_minutes" label="Duration (minutes)" />
      <NumberField  source="section_count"    label="Sections" />
      <NumberField  source="total_questions"  label="Total Questions" />
      <BooleanField source="is_published" />
      <DateField    source="created_at" showTime />
    </SimpleShowLayout>
  </Show>
);

/* ── IELTS Sections ── */

export const IeltsSectionList = () => (
  <List sort={{ field: "order_index", order: "ASC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField   source="id"             label="ID" />
      <NumberField source="test_id"        label="Test ID" />
      <TextField   source="name"           label="Section" />
      <NumberField source="order_index"    label="Order" />
      <NumberField source="question_count" label="Questions" />
      <TextField   source="audio_url"      label="Audio" />
    </Datagrid>
  </List>
);

export const IeltsSectionCreate = () => (
  <Create>
    <SimpleForm>
      <NumberInput source="test_id"      label="Test ID" validate={required()} />
      <TextInput   source="name"         label="Section Name (Listening / Reading / Writing / Speaking)" validate={required()} fullWidth />
      <TextInput   source="instructions" multiline rows={3} fullWidth />
      <NumberInput source="order_index"  defaultValue={0} />
    </SimpleForm>
  </Create>
);

export const IeltsSectionEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput   source="name"         validate={required()} fullWidth />
      <TextInput   source="instructions" multiline rows={3} fullWidth />
      <NumberInput source="order_index" />
      <AudioUploadField />
    </SimpleForm>
  </Edit>
);

export const IeltsSectionShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField   source="id" />
      <NumberField source="test_id"        label="Test ID" />
      <TextField   source="name" />
      <TextField   source="instructions" />
      <TextField   source="audio_url"      label="Audio File" />
      <NumberField source="order_index" />
      <NumberField source="question_count" />
    </SimpleShowLayout>
  </Show>
);

/* ── IELTS Questions ── */

export const IeltsQuestionList = () => (
  <List sort={{ field: "order_index", order: "ASC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField   source="id"            label="ID" />
      <NumberField source="section_id"    label="Section ID" />
      <TextField   source="question_type" label="Type" />
      <NumberField source="marks"         label="Marks" />
      <NumberField source="order_index"   label="Order" />
    </Datagrid>
  </List>
);

export const IeltsQuestionCreate = () => (
  <Create>
    <SimpleForm>
      <NumberInput source="section_id"     label="Section ID" validate={required()} />
      <TextInput   source="question_text"  label="Question" validate={required()} multiline rows={3} fullWidth />
      <TextInput   source="question_type"  label='Type: multiple_choice / true_false / short_answer / essay' fullWidth defaultValue="multiple_choice" />
      <TextInput   source="options_json"   label='Options JSON — e.g. ["A. Paris","B. London","C. Berlin","D. Rome"]' fullWidth />
      <TextInput   source="correct_answer" label="Correct Answer (exact match to one option)" fullWidth />
      <NumberInput source="marks"          defaultValue={1} />
      <NumberInput source="order_index"    defaultValue={0} />
    </SimpleForm>
  </Create>
);

export const IeltsQuestionEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput   source="question_text"  validate={required()} multiline rows={3} fullWidth />
      <TextInput   source="question_type"  fullWidth />
      <TextInput   source="options_json"   label='Options JSON — e.g. ["A. Paris","B. London","C. Berlin","D. Rome"]' fullWidth />
      <TextInput   source="correct_answer" label="Correct Answer" fullWidth />
      <NumberInput source="marks" />
      <NumberInput source="order_index" />
    </SimpleForm>
  </Edit>
);

export const IeltsQuestionShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField   source="id" />
      <NumberField source="section_id" />
      <TextField   source="question_text" />
      <TextField   source="question_type" />
      <TextField   source="options_json" />
      <TextField   source="correct_answer" />
      <NumberField source="marks" />
      <NumberField source="order_index" />
    </SimpleShowLayout>
  </Show>
);
