import { useState, useEffect, useCallback } from "react";
import axios from "axios";

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
  <span style={{
    background: answered ? "#dcfce7" : "#fef9c3",
    color: answered ? "#166534" : "#854d0e",
    border: `1px solid ${answered ? "#bbf7d0" : "#fde68a"}`,
    borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600,
  }}>
    {answered ? "✓ Answered" : "⏳ Pending"}
  </span>
);

const ReplyBox = ({ msg, profile, onUpdated }) => {
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
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 8, fontWeight: 600 }}>
        Your Reply {msg.reply && !editing && (
          <span style={{ fontSize: 11, color: "#aaa", marginLeft: 4 }}>
            · {new Date(msg.replied_at).toLocaleString()}
          </span>
        )}
      </div>

      {!editing && msg.reply ? (
        <div>
          <div style={{
            background: "#f0f4ff", borderRadius: 10, padding: "10px 14px",
            fontSize: 14, color: "#1e3a8a", lineHeight: 1.6,
          }}>
            {msg.reply}
          </div>
          <button
            onClick={() => setEditing(true)}
            style={{ marginTop: 6, fontSize: 12, color: "#6366f1", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Edit reply
          </button>
        </div>
      ) : (
        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            placeholder="Write your reply here…"
            style={{
              width: "100%", border: "1px solid #d1d5db", borderRadius: 8,
              padding: "10px 12px", fontSize: 14, resize: "vertical",
              fontFamily: "inherit", boxSizing: "border-box",
              outline: "none",
            }}
          />
          {error && <p style={{ color: "#ef4444", fontSize: 12, margin: "4px 0 0" }}>{error}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={send}
              disabled={saving || !text.trim()}
              style={{
                background: saving || !text.trim() ? "#a5b4fc" : "#4f46e5",
                color: "#fff", border: "none", borderRadius: 8,
                padding: "8px 18px", fontWeight: 600, fontSize: 13,
                cursor: saving || !text.trim() ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Sending…" : "Send Reply"}
            </button>
            {msg.reply && (
              <button
                onClick={() => { setText(msg.reply); setEditing(false); }}
                style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer", color: "#6b7280" }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MessageCard = ({ msg, profile, onUpdated }) => {
  const [expanded, setExpanded] = useState(!msg.reply);

  return (
    <div style={{
      background: "#fff", borderRadius: 12,
      border: `1px solid ${msg.reply ? "#e5e7eb" : "#fbbf24"}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      marginBottom: 12, overflow: "hidden",
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 18px", cursor: "pointer",
          background: expanded ? "#fafafa" : "#fff",
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "#e0e7ff", color: "#4f46e5",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 14, flexShrink: 0,
        }}>
          {msg.user.email[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{msg.user.email}</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {msg.question.slice(0, 80)}{msg.question.length > 80 ? "…" : ""}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <StatusBadge answered={!!msg.reply} />
          <span style={{ fontSize: 11, color: "#aaa" }}>{new Date(msg.created_at).toLocaleDateString()}</span>
          <span style={{ color: "#aaa", fontSize: 16 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ padding: "0 18px 18px" }}>
          {/* Student question bubble */}
          <div style={{
            background: "#f3f4f6", borderRadius: 10,
            padding: "12px 16px", fontSize: 14, color: "#1f2937", lineHeight: 1.7,
            marginBottom: 4,
          }}>
            {msg.question}
          </div>
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 8 }}>
            Asked on {new Date(msg.created_at).toLocaleString()}
          </div>
          <ReplyBox msg={msg} profile={profile} onUpdated={onUpdated} />
        </div>
      )}
    </div>
  );
};

/* ── Post composer ────────────────────────────────────────────────────────── */
const PostComposer = ({ profile, onPosted }) => {
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
      onPosted && onPosted(res.data);
    } catch {}
    setPosting(false);
  };

  const deletePost = async (id) => {
    try {
      await axios.delete(`/instructor-posts/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch {}
  };

  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 12 }}>
        📢 Post a Comment to Students
      </h2>

      {/* Composer box */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          placeholder="Share a tip, resource, announcement, or encouragement with your students…"
          style={{
            width: "100%", border: "1px solid #e5e7eb", borderRadius: 8,
            padding: "10px 12px", fontSize: 14, resize: "vertical",
            fontFamily: "inherit", boxSizing: "border-box", outline: "none",
            color: "#1f2937",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button
            onClick={submit}
            disabled={posting || !text.trim()}
            style={{
              background: posting || !text.trim() ? "#a5b4fc" : "#4f46e5",
              color: "#fff", border: "none", borderRadius: 8,
              padding: "9px 22px", fontWeight: 600, fontSize: 13,
              cursor: posting || !text.trim() ? "not-allowed" : "pointer",
            }}
          >
            {posting ? "Posting…" : "Post Comment"}
          </button>
        </div>
      </div>

      {/* Past posts */}
      {loadingPosts ? null : posts.length === 0 ? (
        <p style={{ color: "#aaa", fontSize: 13, textAlign: "center", padding: "16px 0" }}>
          No comments posted yet. Your first post will appear to students on the Instructors page.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {posts.map(p => (
            <div key={p.id} style={{
              background: "#f8faff", border: "1px solid #e0e7ff",
              borderRadius: 10, padding: "12px 16px",
              display: "flex", alignItems: "flex-start", gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, color: "#1e3a8a", lineHeight: 1.6 }}>{p.content}</p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#93c5fd" }}>
                  {new Date(p.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => deletePost(p.id)}
                title="Delete post"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#f87171", fontSize: 16, padding: "2px 6px", flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "28px 0 0" }} />
    </div>
  );
};

/* ── IELTS Management Panel (English instructors only) ───────────────────── */

const IeltsPanel = () => {
  const [tests, setTests]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);
  const [form, setForm]           = useState({ title: "", description: "", duration_minutes: 170, is_published: false });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const token = localStorage.getItem("access_token");
  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(() => {
    setLoading(true);
    axios.get("/ielts/manage/all", { headers })
      .then(r => setTests(r.data))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
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
    } catch {}
  };

  const deleteTest = async (id) => {
    if (!window.confirm("Delete this IELTS test and all its sections and questions?")) return;
    try { await axios.delete(`/ielts/manage/${id}`, { headers }); load(); } catch {}
  };

  const s = { card: { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:"18px 20px", marginBottom:10 } };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:"#111" }}>🎓 IELTS Simulator</h2>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#6b7280" }}>Manage practice tests, sections, and questions</p>
        </div>
        <button
          onClick={() => setCreating(c => !c)}
          style={{ background:"#4f46e5", color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", fontWeight:600, fontSize:13, cursor:"pointer" }}
        >
          {creating ? "✕ Cancel" : "+ New Test"}
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div style={{ ...s.card, border:"2px solid #6366f1", marginBottom:20 }}>
          <p style={{ fontWeight:700, color:"#4f46e5", marginBottom:12 }}>New IELTS Test</p>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Test title (e.g. IELTS Practice Test 1)"
            style={{ width:"100%", border:"1px solid #d1d5db", borderRadius:8, padding:"9px 12px", fontSize:14, marginBottom:10, boxSizing:"border-box" }}
          />
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)"
            rows={2}
            style={{ width:"100%", border:"1px solid #d1d5db", borderRadius:8, padding:"9px 12px", fontSize:14, resize:"vertical", marginBottom:10, boxSizing:"border-box", fontFamily:"inherit" }}
          />
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:12 }}>
            <label style={{ fontSize:13, color:"#374151" }}>
              Duration (min):&nbsp;
              <input
                type="number" min={1} value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                style={{ width:80, border:"1px solid #d1d5db", borderRadius:6, padding:"6px 8px", fontSize:13 }}
              />
            </label>
            <label style={{ fontSize:13, color:"#374151", display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}>
              <input type="checkbox" checked={form.is_published}
                onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
              Publish immediately
            </label>
          </div>
          {error && <p style={{ color:"#ef4444", fontSize:12, marginBottom:8 }}>{error}</p>}
          <button
            onClick={createTest} disabled={saving || !form.title.trim()}
            style={{ background: saving ? "#a5b4fc" : "#4f46e5", color:"#fff", border:"none", borderRadius:8, padding:"9px 20px", fontWeight:600, fontSize:13, cursor:"pointer" }}
          >
            {saving ? "Creating…" : "Create Test"}
          </button>
        </div>
      )}

      {/* Test list */}
      {loading ? (
        <p style={{ color:"#aaa", textAlign:"center", padding:40 }}>Loading…</p>
      ) : tests.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:"#aaa" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
          <p style={{ fontSize:15 }}>No IELTS tests yet. Create your first one above.</p>
        </div>
      ) : tests.map(test => (
        <div key={test.id} style={s.card}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
            <div style={{ flex:1 }}>
              <p style={{ margin:0, fontWeight:700, fontSize:15, color:"#111" }}>{test.title}</p>
              {test.description && <p style={{ margin:"4px 0 0", fontSize:13, color:"#6b7280" }}>{test.description}</p>}
              <div style={{ display:"flex", gap:10, marginTop:8 }}>
                <span style={{ fontSize:12, background:"#eff6ff", color:"#1d4ed8", borderRadius:6, padding:"3px 10px", fontWeight:600 }}>
                  ⏱ {test.duration_minutes} min
                </span>
                <span style={{ fontSize:12, background:"#f3f4f6", color:"#374151", borderRadius:6, padding:"3px 10px", fontWeight:600 }}>
                  {test.section_count} sections · {test.total_questions} questions
                </span>
                <span style={{
                  fontSize:12, borderRadius:6, padding:"3px 10px", fontWeight:600,
                  background: test.is_published ? "#dcfce7" : "#fef9c3",
                  color: test.is_published ? "#166534" : "#854d0e",
                }}>
                  {test.is_published ? "✓ Published" : "⏳ Draft"}
                </span>
              </div>
            </div>
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              <button
                onClick={() => togglePublish(test)}
                style={{ fontSize:12, border:"1px solid #d1d5db", borderRadius:7, padding:"6px 12px", cursor:"pointer", background:"#fff", color:"#374151", fontWeight:600 }}
              >
                {test.is_published ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => deleteTest(test.id)}
                style={{ fontSize:12, border:"1px solid #fca5a5", borderRadius:7, padding:"6px 12px", cursor:"pointer", background:"#fff", color:"#ef4444", fontWeight:600 }}
              >
                Delete
              </button>
            </div>
          </div>
          <p style={{ margin:"12px 0 0", fontSize:12, color:"#9ca3af" }}>
            To add sections and questions, use the Admin Panel → IELTS Sections / IELTS Questions
          </p>
        </div>
      ))}
    </div>
  );
};

/* ── Main Dashboard ──────────────────────────────────────────────────────────  */

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

  return (
    <div style={{ padding: "32px 32px 48px", maxWidth: 900, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 32 }}>
        {profile.photo_url ? (
          <img src={profile.photo_url} alt={profile.name} style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover" }} />
        ) : (
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 20,
          }}>
            {(profile.name || "I")[0].toUpperCase()}
          </div>
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111" }}>
            {profile.title ? `${profile.title} ` : ""}{profile.name}
          </h1>
          <p style={{ margin: "2px 0 0", color: "#6b7280", fontSize: 13 }}>
            {profile.language ? `${profile.language.charAt(0).toUpperCase() + profile.language.slice(1)} Instructor` : "Instructor"}
            {profile.organization ? ` · ${profile.organization}` : ""}
          </p>
        </div>

        {/* Stats */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          {[
            { label: "Total",    value: messages.length, color: "#6366f1" },
            { label: "Pending",  value: pending.length,  color: "#f59e0b" },
            { label: "Answered", value: answered.length, color: "#10b981" },
          ].map(s => (
            <div key={s.label} style={{
              background: s.color + "15", border: `1px solid ${s.color}30`,
              borderRadius: 12, padding: "10px 18px", textAlign: "center",
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Post composer */}
      <PostComposer profile={profile} />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "pending",  label: `⏳ Pending (${pending.length})`   },
          { key: "answered", label: `✓ Answered (${answered.length})`  },
          { key: "all",      label: `All (${messages.length})`         },
          ...(isEnglish ? [{ key: "ielts", label: "🎓 IELTS Simulator" }] : []),
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
              background: tab === t.key ? "#4f46e5" : "#fff",
              color: tab === t.key ? "#fff" : "#6b7280",
              border: tab === t.key ? "1px solid #4f46e5" : "1px solid #e5e7eb",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* IELTS Panel */}
      {tab === "ielts" && <IeltsPanel />}

      {/* Messages */}
      {tab !== "ielts" && (loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>Loading messages…</div>
      ) : shown.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p style={{ fontSize: 15, fontWeight: 500 }}>No messages here yet</p>
        </div>
      ) : (
        shown.map(msg => (
          <MessageCard key={msg.id} msg={msg} profile={profile} onUpdated={handleUpdated} />
        ))
      ))}
    </div>
  );
}
