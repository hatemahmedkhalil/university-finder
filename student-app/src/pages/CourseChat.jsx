import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const LANG_GRAD = {
  english: "from-rose-500 via-pink-500 to-fuchsia-600",
  german:  "from-amber-500 via-orange-500 to-red-500",
  polish:  "from-emerald-500 via-teal-500 to-cyan-600",
};

const Avatar = ({ name, isInstructor, grad }) => {
  const initials = name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  return (
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0  ${
      isInstructor
        ? `bg-gradient-to-br ${grad}`
        : "bg-gradient-to-br from-slate-500 to-slate-700"
    }`}>
      {initials}
    </div>
  );
};

const Message = ({ msg, currentUserId, grad, onDelete }) => {
  const isMe = msg.user_id === currentUserId;
  const isInstructor = msg.author_role === "instructor";

  return (
    <div className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar name={msg.author_name} isInstructor={isInstructor} grad={grad} />
      <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
        <div className="flex items-center gap-2">
          {!isMe && (
            <span className={`text-xs font-bold ${isInstructor ? "text-indigo-600" : "text-[oklch(0.55_0.02_285)]"}`}>
              {msg.author_name}
              {isInstructor && (
                <span className="ms-1.5 text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-semibold">
                  Instructor
                </span>
              )}
            </span>
          )}
        </div>
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed  ${
          isMe
            ? `bg-gradient-to-br ${grad} text-white rounded-br-sm`
            : isInstructor
              ? "bg-indigo-50 border border-indigo-100 text-white rounded-bl-sm"
              : "bg-white border border-[oklch(1_0_0/0.07)] text-white rounded-bl-sm"
        }`}>
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-[oklch(0.45_0.02_285)]">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          {isMe && (
            <button onClick={() => onDelete(msg.id)} className="text-[10px] text-[oklch(0.35_0.02_285)] hover:text-red-400 transition">
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CourseChat = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [courseLanguage, setCourseLanguage] = useState("");
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const grad = LANG_GRAD[courseLanguage] || "from-indigo-500 to-violet-600";

  const fetchMessages = () => {
    api.get(`/course-chat/${id}`)
      .then(r => setMessages(r.data))
      .catch(() => toast.error("Failed to load chat"));
  };

  useEffect(() => {
    // fetch course info
    api.get(`/learning/courses/${id}`)
      .then(r => { setCourseName(r.data.title); setCourseLanguage(r.data.language); })
      .catch(() => {});

    fetchMessages();
    setLoading(false);

    // poll every 10s for new messages
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      const r = await api.post(`/course-chat/${id}`, { content: text });
      setMessages(prev => [...prev, r.data]);
    } catch {
      toast.error("Failed to send message");
      setInput(text);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const deleteMsg = async (msgId) => {
    try {
      await api.delete(`/course-chat/${msgId}/delete`);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] bg-gray-50">

      {/* Header */}
      <div className={`relative overflow-hidden bg-gradient-to-r ${grad} px-5 py-4 flex items-center gap-3`}>
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <Link to="/dashboard" className="relative text-white/70 hover:text-white transition text-xl shrink-0">←</Link>
        <div className="relative w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white text-lg backdrop-blur shrink-0">
          💬
        </div>
        <div className="relative flex-1 min-w-0">
          <h1 className="font-bold text-white text-base truncate">{courseName || "Course Chat"}</h1>
          <p className="text-xs text-white/70 capitalize">{courseLanguage} Community · {messages.length} messages</p>
        </div>
        <button
          onClick={fetchMessages}
          className="relative text-white/70 hover:text-white transition text-sm w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center"
          title="Refresh"
        >
          🔄
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin`}
              style={{ borderColor: "rgb(99,102,241)", borderTopColor: "transparent" }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-lg font-bold text-[oklch(0.75_0.02_285)] mb-2">No messages yet</h3>
            <p className="text-[oklch(0.45_0.02_285)] text-sm">Be the first to say something to the community!</p>
          </div>
        ) : (
          messages.map(msg => (
            <Message
              key={msg.id}
              msg={msg}
              currentUserId={user?.id}
              grad={grad}
              onDelete={deleteMsg}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-[oklch(1_0_0/0.07)] px-4 py-3">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            placeholder="Write a message to the community… (Enter to send)"
            className="flex-1 resize-none border border-[oklch(1_0_0/0.08)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            style={{ minHeight: "44px", maxHeight: "120px" }}
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className={`bg-gradient-to-r ${grad} hover:opacity-90 text-white px-5 rounded-xl text-sm font-bold disabled:opacity-40 transition shrink-0 flex items-center gap-1.5`}
          >
            {sending
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <>Send <span>↑</span></>
            }
          </button>
        </div>
        <p className="text-center text-[10px] text-[oklch(0.35_0.02_285)] mt-1.5">
          Be respectful · Messages are visible to all course members
        </p>
      </div>
    </div>
  );
};

export default CourseChat;
