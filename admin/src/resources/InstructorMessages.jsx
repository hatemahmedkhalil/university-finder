import { useState } from "react";
import {
  List, Datagrid, TextField, DateField, FunctionField,
  Show, SimpleShowLayout, useRecordContext, useRefresh, useNotify,
} from "react-admin";
import axios from "axios";

const getToken = () => localStorage.getItem("access_token");

const STATUS_CHIP = ({ record }) => {
  const r = record ?? useRecordContext();
  if (!r) return null;
  const answered = !!r.reply;
  return (
    <span style={{
      background: answered ? "#dcfce7" : "#fef9c3",
      color: answered ? "#166534" : "#854d0e",
      padding: "2px 10px", borderRadius: 12, fontWeight: 600, fontSize: 12,
    }}>
      {answered ? "Answered" : "Pending"}
    </span>
  );
};

/* ── Inline reply form shown inside the Show view ── */
const ReplyForm = () => {
  const record = useRecordContext();
  const refresh = useRefresh();
  const notify = useNotify();
  const [text, setText] = useState(record?.reply ?? "");
  const [saving, setSaving] = useState(false);

  if (!record) return null;

  const submit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await axios.post(
        `/instructor-messages/${record.id}/reply`,
        { reply: text.trim() },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      notify("Reply sent!", { type: "success" });
      refresh();
    } catch {
      notify("Failed to send reply", { type: "error" });
    }
    setSaving(false);
  };

  return (
    <div style={{ padding: "16px 0" }}>
      <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
        {record.reply ? "Edit Reply" : "Write a Reply"}
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={4}
        style={{
          width: "100%", border: "1px solid #e5e7eb", borderRadius: 8,
          padding: "10px 12px", fontSize: 14, resize: "vertical",
          fontFamily: "inherit",
        }}
        placeholder="Type your reply here…"
      />
      <button
        onClick={submit}
        disabled={saving || !text.trim()}
        style={{
          marginTop: 8, background: "#2563eb", color: "#fff",
          border: "none", borderRadius: 8, padding: "8px 20px",
          fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? "Sending…" : "Send Reply"}
      </button>
    </div>
  );
};

/* ── List ── */
export const InstructorMessageList = () => (
  <List sort={{ field: "created_at", order: "DESC" }}>
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <TextField source="id" />
      <FunctionField label="Instructor" render={r => r.instructor?.name ?? "—"} />
      <FunctionField label="Student"    render={r => r.user?.email ?? "—"} />
      <FunctionField label="Question"   render={r => r.question?.slice(0, 60) + (r.question?.length > 60 ? "…" : "")} />
      <FunctionField label="Status"     render={r => <STATUS_CHIP record={r} />} />
      <DateField source="created_at" label="Asked" showTime />
    </Datagrid>
  </List>
);

/* ── Show (with inline reply form) ── */
export const InstructorMessageShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <FunctionField label="Instructor"   render={r => `${r.instructor?.title ? r.instructor.title + " " : ""}${r.instructor?.name ?? "—"}`} />
      <FunctionField label="Organization" render={r => r.instructor?.organization ?? "—"} />
      <FunctionField label="Student"      render={r => r.user?.email ?? "—"} />
      <TextField source="question" label="Question" />
      <FunctionField label="Status" render={r => <STATUS_CHIP record={r} />} />
      <TextField source="reply" label="Reply" />
      <DateField source="replied_at" label="Replied At" showTime />
      <DateField source="created_at" label="Asked At"   showTime />
      <ReplyForm />
    </SimpleShowLayout>
  </Show>
);
