import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Icon, ICONS } from "../components/Sidebar";

/* ── design tokens ── */
const bg       = "bg-[var(--bg)]";
const card     = "bg-[var(--surface-2)]";
const cardHov  = "hover:bg-[var(--bg)]";
const border   = "border-[rgba(255,255,255,0.07)]";
const borderMd = "border-[rgba(255,255,255,0.12)]";
const textDim  = "text-[var(--ink-dim)]";
const textFaint= "text-[var(--ink-faint)]";
const input    = `bg-[var(--surface-2)] border ${borderMd} rounded-xl px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-dim)] focus:outline-none focus:border-violet-500 w-full`;

const CATEGORIES = ["all","general","visa","housing","universities","language","career","tips"];
const COUNTRIES  = ["All","Germany","Poland","Romania"];
const CATEGORY_COLORS = {
  general: "bg-[var(--border)] text-[var(--ink-dim)]",
  visa: "bg-blue-900 text-blue-200",
  housing: "bg-amber-900 text-amber-200",
  universities: "bg-violet-900 text-violet-200",
  language: "bg-emerald-900 text-emerald-200",
  career: "bg-pink-900 text-pink-200",
  tips: "bg-orange-900 text-orange-200",
};
const COUNTRY_FLAG = { Germany: "🇩🇪", Poland: "🇵🇱", Romania: "🇷🇴" };

const timeAgo = (iso) => {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
};

const Avatar = ({ name, size = 8 }) => {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
  const hue = [...(name||"")].reduce((a,c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0`}
      style={{ background: `oklch(0.35 0.12 ${hue})`, color: `oklch(0.9 0.05 ${hue})` }}>
      {initials}
    </div>
  );
};

const CategoryBadge = ({ cat }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${CATEGORY_COLORS[cat] || CATEGORY_COLORS.general}`}>
    {cat}
  </span>
);

/* ── New Post Modal ── */
const NewPostModal = ({ onClose, onCreated }) => {
  const [title,   setTitle]   = useState("");
  const [body,    setBody]    = useState("");
  const [cat,     setCat]     = useState("general");
  const [country, setCountry] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const submit = async () => {
    if (!title.trim() || !body.trim()) { setError("Title and body are required."); return; }
    setSaving(true); setError("");
    try {
      const { data } = await api.post("/api/community/posts", {
        title: title.trim(), body: body.trim(),
        category: cat, country_tag: country || null,
      });
      onCreated(data.id);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to post.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className={`${card} rounded-2xl border ${borderMd} w-full max-w-lg p-6 space-y-4`}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--ink)]">New Post</h2>
          <button onClick={onClose} className={`${textFaint} hover:text-[var(--ink)] text-xl leading-none`}><Icon d={ICONS.x} size={16} /></button>
        </div>

        <input className={input} placeholder="Title (required)" value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />

        <textarea className={`${input} resize-none h-32`} placeholder="Share your question, experience, or tip…"
          value={body} onChange={e => setBody(e.target.value)} maxLength={5000} />

        <div className="flex gap-3 flex-wrap">
          <select className={`${input} flex-1 min-w-[140px]`} value={cat} onChange={e => setCat(e.target.value)}>
            {CATEGORIES.filter(c => c !== "all").map(c => (
              <option key={c} value={c} className="bg-[var(--surface-2)]">{c.charAt(0).toUpperCase()+c.slice(1)}</option>
            ))}
          </select>
          <select className={`${input} flex-1 min-w-[120px]`} value={country} onChange={e => setCountry(e.target.value)}>
            <option value="" className="bg-[var(--surface-2)]">All countries</option>
            {COUNTRIES.filter(c => c !== "All").map(c => (
              <option key={c} value={c} className="bg-[var(--surface-2)]">{COUNTRY_FLAG[c]} {c}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className={`px-4 py-2 rounded-xl text-sm ${textDim} ${card} border ${border} hover:border-violet-500 transition-colors`}>
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-sm font-medium text-[var(--ink)] transition-colors disabled:opacity-50">
            {saving ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ── Post Detail Modal ── */
const PostDetailModal = ({ postId, currentUserId, onClose, onDeleted }) => {
  const [post,        setPost]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [commentBody, setCommentBody] = useState("");
  const [sending,     setSending]     = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/community/posts/${postId}`);
      setPost(data);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const toggleLike = async () => {
    const { data } = await api.post(`/api/community/posts/${postId}/like`);
    setPost(p => ({ ...p, likes: data.likes, liked_by_me: data.liked }));
  };

  const submitComment = async () => {
    if (!commentBody.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/api/community/posts/${postId}/comments`, { body: commentBody.trim() });
      setPost(p => ({ ...p, comments: [...(p.comments||[]), data], comment_count: (p.comment_count||0)+1 }));
      setCommentBody("");
    } finally {
      setSending(false);
    }
  };

  const deleteComment = async (cid) => {
    await api.delete(`/api/community/comments/${cid}`);
    setPost(p => ({ ...p, comments: p.comments.filter(c => c.id !== cid), comment_count: (p.comment_count||0)-1 }));
  };

  const deletePost = async () => {
    if (!window.confirm("Delete this post?")) return;
    await api.delete(`/api/community/posts/${postId}`);
    onDeleted(postId);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className={`${card} rounded-2xl border ${borderMd} w-full max-w-2xl max-h-[85vh] flex flex-col`}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${border}`}>
          <h2 className="text-base font-semibold text-[var(--ink)] truncate">Post</h2>
          <button onClick={onClose} className={`${textFaint} hover:text-[var(--ink)] text-xl leading-none ml-4`}><Icon d={ICONS.x} size={16} /></button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-5 bg-[var(--surface-2)] rounded w-3/4" />
              <div className="h-3 bg-[var(--surface-2)] rounded w-full" />
              <div className="h-3 bg-[var(--surface-2)] rounded w-5/6" />
            </div>
          ) : post && (
            <>
              {/* Post body */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={post.author_name} size={9} />
                    <div>
                      <p className="text-sm font-medium text-[var(--ink)]">{post.author_name}</p>
                      <p className={`text-xs ${textFaint}`}>{timeAgo(post.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <CategoryBadge cat={post.category} />
                    {post.country_tag && (
                      <span className={`text-xs ${textFaint}`}>{COUNTRY_FLAG[post.country_tag]} {post.country_tag}</span>
                    )}
                    {post.user_id === currentUserId && (
                      <button onClick={deletePost} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded-lg border border-red-800 hover:border-red-500 transition-colors">
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-[var(--ink)]">{post.title}</h3>
                <p className={`text-sm ${textDim} leading-relaxed whitespace-pre-wrap`}>{post.body}</p>

                {/* Like button */}
                <div className="flex items-center gap-4 pt-1">
                  <button onClick={toggleLike}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${post.liked_by_me ? "text-violet-400" : textFaint + " hover:text-violet-400"}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={post.liked_by_me ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                    {post.likes} likes
                  </button>
                  <span className={`text-sm ${textFaint}`}>{post.comment_count} comments</span>
                </div>
              </div>

              {/* Comments */}
              <div className={`border-t ${border} pt-4 space-y-3`}>
                <p className={`text-xs font-medium ${textFaint} uppercase tracking-wider`}>Comments</p>
                {(post.comments || []).length === 0 && (
                  <p className={`text-sm ${textFaint}`}>No comments yet — be the first!</p>
                )}
                {(post.comments || []).map(c => (
                  <div key={c.id} className="flex gap-2.5">
                    <Avatar name={c.author_name} size={7} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-[var(--ink)]">{c.author_name}</span>
                        <span className={`text-xs ${textFaint}`}>{timeAgo(c.created_at)}</span>
                        {c.user_id === currentUserId && (
                          <button onClick={() => deleteComment(c.id)} className={`text-xs ${textFaint} hover:text-red-400 ml-auto`}><Icon d={ICONS.x} size={14} /></button>
                        )}
                      </div>
                      <p className={`text-sm ${textDim} mt-0.5 whitespace-pre-wrap`}>{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Comment input */}
        <div className={`px-6 py-4 border-t ${border}`}>
          <div className="flex gap-2">
            <input
              className={`${input} flex-1`}
              placeholder="Write a comment…"
              value={commentBody}
              onChange={e => setCommentBody(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
              maxLength={2000}
            />
            <button onClick={submitComment} disabled={sending || !commentBody.trim()}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-sm font-medium text-[var(--ink)] transition-colors disabled:opacity-40 flex-shrink-0">
              {sending ? "…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ── Post Card ── */
const PostCard = ({ post, onOpen, onLike }) => (
  <button
    onClick={() => onOpen(post.id)}
    className={`${card} ${cardHov} rounded-2xl border ${border} hover:border-violet-500/50 p-5 text-left transition-all w-full group`}
  >
    <div className="flex items-start justify-between gap-2 mb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar name={post.author_name} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--ink)] truncate">{post.author_name}</p>
          <p className={`text-xs ${textFaint}`}>{timeAgo(post.created_at)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <CategoryBadge cat={post.category} />
        {post.country_tag && (
          <span className="text-base">{COUNTRY_FLAG[post.country_tag]}</span>
        )}
      </div>
    </div>

    <h3 className="font-semibold text-[var(--ink)] text-sm leading-snug mb-2 line-clamp-2">{post.title}</h3>
    <p className={`text-sm ${textDim} leading-relaxed line-clamp-3 mb-3`}>{post.body}</p>

    <div className={`flex items-center gap-4 text-xs ${textFaint}`}>
      <button
        onClick={e => { e.stopPropagation(); onLike(post.id); }}
        className={`flex items-center gap-1 transition-colors ${post.liked_by_me ? "text-violet-400" : "hover:text-violet-400"}`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill={post.liked_by_me ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
        {post.likes}
      </button>
      <span className="flex items-center gap-1">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        {post.comment_count}
      </span>
    </div>
  </button>
);

/* ── Main Page ── */
const Community = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === "ar";

  const [posts,      setPosts]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [category,   setCategory]   = useState("all");
  const [country,    setCountry]    = useState("All");
  const [sort,       setSort]       = useState("newest");
  const [search,     setSearch]     = useState("");
  const [showNew,    setShowNew]    = useState(false);
  const [openPost,   setOpenPost]   = useState(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, limit: 50 });
      if (category !== "all") params.set("category", category);
      if (country !== "All") params.set("country", country);
      if (search.trim()) params.set("search", search.trim());

      const { data } = await api.get(`/api/community/posts?${params}`);
      setPosts(data.posts);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [category, country, sort, search]);

  useEffect(() => {
    const t = setTimeout(loadPosts, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadPosts, search]);

  const handleLike = async (postId) => {
    const { data } = await api.post(`/api/community/posts/${postId}/like`);
    setPosts(ps => ps.map(p => p.id === postId
      ? { ...p, likes: data.likes, liked_by_me: data.liked }
      : p
    ));
  };

  const handleCreated = (newId) => {
    setShowNew(false);
    loadPosts().then(() => setOpenPost(newId));
  };

  const handleDeleted = (id) => {
    setPosts(ps => ps.filter(p => p.id !== id));
    setTotal(t => t - 1);
  };

  return (
    <div className={`min-h-screen ${bg} text-[var(--ink)]`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="px-4 pt-8 pb-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {t("community.title", "Student Community")}
            </h1>
            <p className={`text-sm ${textDim}`}>
              {t("community.subtitle", "Questions, tips & experiences from students in Germany, Poland & Romania")}
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-sm font-medium text-[var(--ink)] transition-colors flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {t("community.newPost", "New Post")}
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <svg className={`absolute top-2.5 ${isRTL ? "right-3" : "left-3"} w-4 h-4 ${textFaint}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("community.search", "Search posts…")}
              className={`${card} border ${borderMd} rounded-xl py-2 ${isRTL ? "pr-9 pl-4" : "pl-9 pr-4"} text-sm text-[var(--ink)] placeholder:${textFaint} focus:outline-none focus:border-violet-500 w-full`}
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Category pills */}
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors capitalize ${
                    category === c ? "bg-violet-600 text-[var(--ink)]" : `${card} border ${border} ${textDim} hover:border-violet-500`
                  }`}>
                  {c === "all" ? <span className="inline-flex items-center gap-1"><Icon d={ICONS.globe} size={12} /> All</span> : c === "__skip__" ? "" : c}
                </button>
              ))}
            </div>

            {/* Country + Sort */}
            <div className="flex gap-2 ml-auto">
              <select value={country} onChange={e => setCountry(e.target.value)}
                className={`${card} border ${borderMd} rounded-xl py-1.5 px-3 text-xs text-[var(--ink)] focus:outline-none focus:border-violet-500`}>
                {COUNTRIES.map(c => (
                  <option key={c} value={c} className="bg-[var(--surface-2)]">
                    {c === "All" ? <span className="inline-flex items-center gap-1"><Icon d={ICONS.globe} size={12} /> All</span> : c === "__skip__" ? "" : `${COUNTRY_FLAG[c]} ${c}`}
                  </option>
                ))}
              </select>
              <select value={sort} onChange={e => setSort(e.target.value)}
                className={`${card} border ${borderMd} rounded-xl py-1.5 px-3 text-xs text-[var(--ink)] focus:outline-none focus:border-violet-500`}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="popular">Popular</option>
              </select>
            </div>
          </div>
        </div>

        <p className={`mt-2 text-xs ${textFaint}`}>{total} {t("community.posts", "posts")}</p>
      </div>

      {/* Posts grid */}
      <div className="px-4 pb-16 max-w-5xl mx-auto">
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`${card} rounded-2xl border ${border} p-5 animate-pulse space-y-3`}>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-2)]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-[var(--surface-2)] rounded w-1/3" />
                    <div className="h-2 bg-[var(--surface-2)] rounded w-1/4" />
                  </div>
                </div>
                <div className="h-4 bg-[var(--surface-2)] rounded w-2/3" />
                <div className="h-3 bg-[var(--surface-2)] rounded w-full" />
                <div className="h-3 bg-[var(--surface-2)] rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-3 flex justify-center"><Icon d={ICONS.community} size={30} /></div>
            <p className="text-[var(--ink)] font-medium mb-1">{t("community.empty", "No posts yet")}</p>
            <p className={`text-sm ${textDim} mb-6`}>{t("community.emptyHint", "Be the first to share your experience!")}</p>
            <button onClick={() => setShowNew(true)}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-sm font-medium text-[var(--ink)] transition-colors">
              {t("community.newPost", "New Post")}
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {posts.map(p => (
              <PostCard key={p.id} post={p} onOpen={setOpenPost} onLike={handleLike} />
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <NewPostModal onClose={() => setShowNew(false)} onCreated={handleCreated} />
      )}
      {openPost && (
        <PostDetailModal
          postId={openPost}
          currentUserId={user?.id}
          onClose={() => setOpenPost(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
};

export default Community;
