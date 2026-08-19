import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Box, Paper, Typography, TextField, Button, Chip, Stack, Avatar,
  IconButton, Skeleton, Switch, FormControlLabel, Tabs, Tab, Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CampaignIcon from "@mui/icons-material/Campaign";
import SchoolIcon from "@mui/icons-material/School";
import InboxIcon from "@mui/icons-material/Inbox";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

const api = (url, opts = {}) =>
  axios.get(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
    ...opts,
  });

const postApi = (url, data) =>
  axios.post(url, data, {
    headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
  });

const StatusBadge = ({ answered }) => (
  <Chip
    size="small"
    label={answered ? "Answered" : "Pending"}
    color={answered ? "success" : "warning"}
    variant="outlined"
  />
);

const ReplyBox = ({ msg, onUpdated }) => {
  const [text, setText] = useState(msg.reply ?? "");
  const [editing, setEditing] = useState(!msg.reply);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    if (!text.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await postApi(`/instructor-messages/inbox/${msg.id}/reply`, { reply: text.trim() });
      onUpdated(res.data);
      setEditing(false);
    } catch {
      setError("Failed to send reply. Try again.");
    }
    setSaving(false);
  };

  return (
    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: "divider" }}>
      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Your Reply {msg.reply && !editing && (
          <Box component="span" sx={{ color: "text.disabled", ml: 0.5 }}>
            · {new Date(msg.replied_at).toLocaleString()}
          </Box>
        )}
      </Typography>

      {!editing && msg.reply ? (
        <Box>
          <Box sx={{ bgcolor: "primary.light", opacity: 0.9, borderRadius: 2.5, px: 2, py: 1.25 }}>
            <Typography variant="body2" sx={{ color: "primary.contrastText", lineHeight: 1.6 }}>{msg.reply}</Typography>
          </Box>
          <Button size="small" onClick={() => setEditing(true)} sx={{ mt: 0.5, px: 0 }}>Edit reply</Button>
        </Box>
      ) : (
        <Box>
          <TextField
            value={text}
            onChange={e => setText(e.target.value)}
            multiline
            rows={3}
            fullWidth
            size="small"
            placeholder="Write your reply here…"
          />
          {error && <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>{error}</Typography>}
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button variant="contained" size="small" onClick={send} disabled={saving || !text.trim()}>
              {saving ? "Sending…" : "Send Reply"}
            </Button>
            {msg.reply && (
              <Button variant="outlined" size="small" color="secondary" onClick={() => { setText(msg.reply); setEditing(false); }}>
                Cancel
              </Button>
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

const MessageCard = ({ msg, onUpdated }) => {
  const [expanded, setExpanded] = useState(!msg.reply);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        borderColor: msg.reply ? "divider" : "warning.main",
        mb: 1.5, overflow: "hidden",
      }}
    >
      <Box
        onClick={() => setExpanded(e => !e)}
        sx={{
          display: "flex", alignItems: "center", gap: 1.5, px: 2.25, py: 1.75, cursor: "pointer",
          bgcolor: expanded ? "action.hover" : "transparent",
        }}
      >
        <Avatar sx={{ bgcolor: "primary.light", color: "primary.contrastText", fontWeight: 700, width: 36, height: 36, fontSize: 14 }}>
          {msg.user.email[0].toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700}>{msg.user.email}</Typography>
          <Typography variant="caption" color="text.disabled" noWrap sx={{ display: "block" }}>
            {msg.question.slice(0, 80)}{msg.question.length > 80 ? "…" : ""}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={1.25} flexShrink={0}>
          <StatusBadge answered={!!msg.reply} />
          <Typography variant="caption" color="text.disabled">{new Date(msg.created_at).toLocaleDateString()}</Typography>
          {expanded ? <ExpandLessIcon fontSize="small" color="disabled" /> : <ExpandMoreIcon fontSize="small" color="disabled" />}
        </Stack>
      </Box>

      {expanded && (
        <Box sx={{ px: 2.25, pb: 2.25 }}>
          <Box sx={{ bgcolor: "action.hover", borderRadius: 2.5, px: 2, py: 1.5, mb: 0.5 }}>
            <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{msg.question}</Typography>
          </Box>
          <Typography variant="caption" color="text.disabled" sx={{ display: "block", mb: 1 }}>
            Asked on {new Date(msg.created_at).toLocaleString()}
          </Typography>
          <ReplyBox msg={msg} onUpdated={onUpdated} />
        </Box>
      )}
    </Paper>
  );
};

/* ── Post composer ── */
const PostComposer = ({ profile }) => {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (!profile.id) return;
    api(`/instructor-posts/instructor/${profile.id}`)
      .then(r => setPosts(r.data))
      .catch(() => setPosts([]))
      .finally(() => setLoadingPosts(false));
  }, [profile.id]);

  const submit = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const res = await postApi("/instructor-posts", { content: text.trim() });
      setPosts(prev => [res.data, ...prev]);
      setText("");
    } catch { /* noop */ }
    setPosting(false);
  };

  const deletePost = async (id) => {
    try {
      await axios.delete(`/instructor-posts/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch { /* noop */ }
  };

  return (
    <Box sx={{ mb: 4.5 }}>
      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
        <CampaignIcon fontSize="small" color="primary" /> Post a Comment to Students
      </Typography>

      <Paper elevation={0} sx={{ borderRadius: 3, p: 2 }}>
        <TextField
          value={text}
          onChange={e => setText(e.target.value)}
          multiline
          rows={3}
          fullWidth
          size="small"
          placeholder="Share a tip, resource, announcement, or encouragement with your students…"
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.25 }}>
          <Button variant="contained" onClick={submit} disabled={posting || !text.trim()}>
            {posting ? "Posting…" : "Post Comment"}
          </Button>
        </Box>
      </Paper>

      {loadingPosts ? null : posts.length === 0 ? (
        <Typography variant="body2" color="text.disabled" align="center" sx={{ py: 2 }}>
          No comments posted yet. Your first post will appear to students on the Instructors page.
        </Typography>
      ) : (
        <Stack spacing={1.25} sx={{ mt: 2 }}>
          {posts.map(p => (
            <Paper
              key={p.id}
              elevation={0}
              sx={{ bgcolor: "primary.light", opacity: 0.92, borderRadius: 2.5, px: 2, py: 1.5, display: "flex", alignItems: "flex-start", gap: 1.5 }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: "primary.contrastText", lineHeight: 1.6 }}>{p.content}</Typography>
                <Typography variant="caption" sx={{ color: "primary.contrastText", opacity: 0.7 }}>
                  {new Date(p.created_at).toLocaleString()}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => deletePost(p.id)} title="Delete post" sx={{ color: "primary.contrastText" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Paper>
          ))}
        </Stack>
      )}

      <Divider sx={{ mt: 3.5 }} />
    </Box>
  );
};

/* ── IELTS management panel (English instructors only) ── */
const IeltsPanel = () => {
  const [tests, setTests]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm]         = useState({ title: "", description: "", duration_minutes: 170, is_published: false });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const token = localStorage.getItem("access_token");
  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(() => {
    setLoading(true);
    axios.get("/ielts/manage/all", { headers })
      .then(r => setTests(r.data))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const createTest = async () => {
    if (!form.title.trim()) return;
    setSaving(true); setError("");
    try {
      await axios.post("/ielts/manage", form, { headers });
      setForm({ title: "", description: "", duration_minutes: 170, is_published: false });
      setCreating(false);
      load();
    } catch { setError("Failed to create test. Try again."); }
    setSaving(false);
  };

  const togglePublish = async (test) => {
    try {
      await axios.patch(`/ielts/manage/${test.id}`, { ...test, is_published: !test.is_published }, { headers });
      load();
    } catch { /* noop */ }
  };

  const deleteTest = async (id) => {
    if (!window.confirm("Delete this IELTS test and all its sections and questions?")) return;
    try { await axios.delete(`/ielts/manage/${id}`, { headers }); load(); } catch { /* noop */ }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolIcon fontSize="small" color="primary" /> IELTS Simulator
          </Typography>
          <Typography variant="caption" color="text.secondary">Manage practice tests, sections, and questions</Typography>
        </Box>
        <Button variant="contained" onClick={() => setCreating(c => !c)}>
          {creating ? "Cancel" : "+ New Test"}
        </Button>
      </Box>

      {creating && (
        <Paper elevation={0} sx={{ borderRadius: 3, p: 2.5, mb: 2.5, borderColor: "primary.main", borderWidth: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1.5 }}>New IELTS Test</Typography>
          <TextField
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Test title (e.g. IELTS Practice Test 1)"
            fullWidth size="small" sx={{ mb: 1.5 }}
          />
          <TextField
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)"
            multiline rows={2} fullWidth size="small" sx={{ mb: 1.5 }}
          />
          <Stack direction="row" alignItems="center" spacing={2.5} sx={{ mb: 1.5 }}>
            <TextField
              label="Duration (min)" type="number" size="small"
              value={form.duration_minutes}
              onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
              sx={{ width: 140 }}
            />
            <FormControlLabel
              control={<Switch checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />}
              label="Publish immediately"
            />
          </Stack>
          {error && <Typography variant="caption" color="error" sx={{ display: "block", mb: 1 }}>{error}</Typography>}
          <Button variant="contained" onClick={createTest} disabled={saving || !form.title.trim()}>
            {saving ? "Creating…" : "Create Test"}
          </Button>
        </Paper>
      )}

      {loading ? (
        <Stack spacing={1.5}>{[0, 1, 2].map(i => <Skeleton key={i} variant="rounded" height={90} />)}</Stack>
      ) : tests.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 7, color: "text.disabled" }}>
          <InboxIcon sx={{ fontSize: 40, mb: 1.5, opacity: 0.5 }} />
          <Typography variant="body2">No IELTS tests yet. Create your first one above.</Typography>
        </Box>
      ) : tests.map(test => (
        <Paper key={test.id} elevation={0} sx={{ borderRadius: 3, p: 2.25, mb: 1.25 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight={700}>{test.title}</Typography>
              {test.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{test.description}</Typography>}
              <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={`⏱ ${test.duration_minutes} min`} color="primary" variant="outlined" />
                <Chip size="small" label={`${test.section_count} sections · ${test.total_questions} questions`} variant="outlined" />
                <Chip size="small" label={test.is_published ? "Published" : "Draft"} color={test.is_published ? "success" : "warning"} />
              </Stack>
            </Box>
            <Stack direction="row" spacing={1} flexShrink={0}>
              <Button size="small" variant="outlined" color="secondary" onClick={() => togglePublish(test)}>
                {test.is_published ? "Unpublish" : "Publish"}
              </Button>
              <Button size="small" variant="outlined" color="error" onClick={() => deleteTest(test.id)}>
                Delete
              </Button>
            </Stack>
          </Box>
          <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 1.5 }}>
            To add sections and questions, use the Admin Panel → IELTS Sections / IELTS Questions
          </Typography>
        </Paper>
      ))}
    </Box>
  );
};

/* ── Main dashboard ── */
export default function InstructorDashboard() {
  const profile = JSON.parse(localStorage.getItem("instructor_profile") || "{}");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const isEnglish = (profile.language || "").toLowerCase() === "english";

  useEffect(() => {
    api("/instructor-messages/inbox")
      .then(r => setMessages(r.data))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdated = (updated) => {
    setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const pending  = messages.filter(m => !m.reply);
  const answered = messages.filter(m => m.reply);
  const shown    = tab === "pending" ? pending : tab === "answered" ? answered : messages;

  const statTiles = [
    { label: "Total",    value: messages.length, color: "primary" },
    { label: "Pending",  value: pending.length,  color: "warning" },
    { label: "Answered", value: answered.length, color: "success" },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 960, mx: "auto" }}>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2.25, mb: 4, flexWrap: "wrap" }}>
        {profile.photo_url ? (
          <Avatar src={profile.photo_url} alt={profile.name} sx={{ width: 56, height: 56, borderRadius: 3 }} variant="rounded" />
        ) : (
          <Avatar
            variant="rounded"
            sx={{ width: 56, height: 56, borderRadius: 3, background: "linear-gradient(135deg, var(--mui-palette-primary-light), var(--mui-palette-primary-main))", fontWeight: 700, fontSize: 20 }}
          >
            {(profile.name || "I")[0].toUpperCase()}
          </Avatar>
        )}
        <Box>
          <Typography variant="h6" fontWeight={800}>
            {profile.title ? `${profile.title} ` : ""}{profile.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {profile.language ? `${profile.language.charAt(0).toUpperCase() + profile.language.slice(1)} Instructor` : "Instructor"}
            {profile.organization ? ` · ${profile.organization}` : ""}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ ml: "auto" }}>
          {statTiles.map(s => (
            <Paper key={s.label} elevation={0} sx={{ borderRadius: 3, px: 2.25, py: 1.25, textAlign: "center", bgcolor: `${s.color}.light`, opacity: 0.9 }}>
              <Typography variant="h6" fontWeight={800} sx={{ color: `${s.color}.contrastText` }}>{s.value}</Typography>
              <Typography variant="caption" sx={{ color: `${s.color}.contrastText`, opacity: 0.8 }}>{s.label}</Typography>
            </Paper>
          ))}
        </Stack>
      </Box>

      <PostComposer profile={profile} />

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2.5, minHeight: 40, "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 600 } }}
      >
        <Tab value="pending"  label={`Pending (${pending.length})`} />
        <Tab value="answered" label={`Answered (${answered.length})`} />
        <Tab value="all"      label={`All (${messages.length})`} />
        {isEnglish && <Tab value="ielts" label="IELTS Simulator" />}
      </Tabs>

      {tab === "ielts" && <IeltsPanel />}

      {tab !== "ielts" && (loading ? (
        <Stack spacing={1.5}>{[0, 1, 2].map(i => <Skeleton key={i} variant="rounded" height={70} />)}</Stack>
      ) : shown.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, color: "text.disabled" }}>
          <InboxIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.5 }} />
          <Typography variant="body1" fontWeight={600}>No messages here yet</Typography>
        </Box>
      ) : (
        shown.map(msg => (
          <MessageCard key={msg.id} msg={msg} onUpdated={handleUpdated} />
        ))
      ))}
    </Box>
  );
}
