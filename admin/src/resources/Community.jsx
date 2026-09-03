import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Box, Paper, Typography, Chip, Stack, IconButton, Skeleton,
  TextField, MenuItem, Tooltip,
} from "@mui/material";
import ForumIcon from "@mui/icons-material/Forum";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

const CATEGORY_COLOR = {
  general: "default", visa: "warning", housing: "info",
  universities: "primary", language: "secondary", career: "success", tips: "default",
};

/* ── Admin moderation view for the student Community forum.
   The backend (/api/community/posts) returns a custom {posts,total}
   envelope rather than the {items,total} shape the shared dataProvider
   expects, so — same reasoning as the existing Support panel — this is
   a standalone panel talking to the API directly instead of forcing it
   through the react-admin Resource machinery. ── */
const CommunityPanel = () => {
  const [posts, setPosts] = useState(null);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setPosts(null);
    setError("");
    axios.get("/api/community/posts", {
      headers: authHeaders(),
      params: { limit: 50, category: category === "all" ? undefined : category },
    })
      .then(r => { setPosts(r.data.posts ?? []); setTotal(r.data.total ?? 0); })
      .catch(() => setError("Failed to load community posts."));
  }, [category]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, [load]);

  const remove = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This also removes its comments and likes.`)) return;
    setDeletingId(post.id);
    try {
      await axios.delete(`/api/community/posts/${post.id}`, { headers: authHeaders() });
      setPosts(prev => prev.filter(p => p.id !== post.id));
      setTotal(t => t - 1);
    } catch {
      setError("Failed to delete post.");
    }
    setDeletingId(null);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
        <ForumIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Community</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Moderate student forum posts — {total} total{category !== "all" ? ` in "${category}"` : ""}.
      </Typography>

      <TextField
        select size="small" label="Category" value={category}
        onChange={e => setCategory(e.target.value)}
        sx={{ width: 220, mb: 2.5 }}
      >
        <MenuItem value="all">All categories</MenuItem>
        {Object.keys(CATEGORY_COLOR).map(c => (
          <MenuItem key={c} value={c}>{c}</MenuItem>
        ))}
      </TextField>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      {posts === null ? (
        <Stack spacing={1.5}>
          {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={90} />)}
        </Stack>
      ) : posts.length === 0 ? (
        <Typography color="text.secondary">No posts found.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {posts.map(post => (
            <Paper key={post.id} variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
                    <Typography fontWeight={700}>{post.title}</Typography>
                    <Chip size="small" label={post.category} color={CATEGORY_COLOR[post.category] ?? "default"} />
                    {post.country_tag && <Chip size="small" variant="outlined" label={post.country_tag} />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {post.body.length > 200 ? post.body.slice(0, 200) + "…" : post.body}
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {post.author_name} · {new Date(post.created_at).toLocaleString()}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <FavoriteIcon sx={{ fontSize: 14 }} color="disabled" />
                      <Typography variant="caption">{post.likes}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <ChatBubbleOutlineIcon sx={{ fontSize: 14 }} color="disabled" />
                      <Typography variant="caption">{post.comment_count}</Typography>
                    </Stack>
                  </Stack>
                </Box>
                <Tooltip title="Delete post">
                  <span>
                    <IconButton size="small" color="error" disabled={deletingId === post.id} onClick={() => remove(post)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default CommunityPanel;
