import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Box, Paper, Typography, TextField, Table, TableHead, TableBody, TableRow,
  TableCell, Chip, Stack, Skeleton, LinearProgress, InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SchoolIcon from "@mui/icons-material/School";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CampaignIcon from "@mui/icons-material/Campaign";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BoltIcon from "@mui/icons-material/Bolt";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import AddIcon from "@mui/icons-material/Add";
import GroupIcon from "@mui/icons-material/Group";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

const API_URL = "";
const token = () => localStorage.getItem("access_token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

/* ── stat card ── */
const StatCard = ({ title, value, icon, color }) => (
  <Paper
    elevation={0}
    sx={{
      flex: "1 1 150px",
      minWidth: 150,
      p: 2.5,
      borderRadius: 3.5,
      display: "flex",
      flexDirection: "column",
      gap: 0.5,
      transition: "transform 150ms ease, box-shadow 150ms ease",
      "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
    }}
  >
    <Box
      sx={{
        width: 38, height: 38, borderRadius: 2.5, display: "flex", alignItems: "center",
        justifyContent: "center", bgcolor: `${color}.main`, color: "#fff", mb: 0.5,
        opacity: 0.92,
      }}
    >
      {icon}
    </Box>
    <Typography variant="h4" fontWeight={800} lineHeight={1.1}>
      {value ?? <Skeleton width={40} />}
    </Typography>
    <Typography variant="body2" color="text.secondary" fontWeight={600}>
      {title}
    </Typography>
  </Paper>
);

const degreeColor = { bachelor: "secondary", master: "primary", phd: "error" };
const levelColor = (level) =>
  ({ a1: "default", a2: "default", b1: "warning", b2: "warning", c1: "success", c2: "success", native: "primary" }[level] ?? "default");

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [studentsLoading, setStudentsLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/admin/stats`, { headers: headers() })
      .then(r => setStats(r.data)).catch(() => setStats({}));

    axios.get(`${API_URL}/admin/students`, { headers: headers() })
      .then(r => setStudents(r.data.items ?? r.data))
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false));
  }, []);

  const filtered = useMemo(() => students.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.nationality || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.field_of_study || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.preferred_countries || "").toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  const quickActions = [
    { to: "/universities/create",     icon: <SchoolIcon fontSize="small" />,       label: "Add University" },
    { to: "/scholarships/create",     icon: <CardGiftcardIcon fontSize="small" />, label: "Add Scholarship" },
    { to: "/announcements/create",    icon: <CampaignIcon fontSize="small" />,     label: "Post Announcement" },
    { to: "/learning/courses/create", icon: <MenuBookIcon fontSize="small" />,     label: "Add Course" },
    { to: "/admin/users",             icon: <GroupIcon fontSize="small" />,        label: "View All Users" },
    { to: "/support-tickets",         icon: <SupportAgentIcon fontSize="small" />, label: "Support Tickets" },
  ];

  const withProfile = students.filter(s => s.has_profile).length;
  const pct = students.length ? Math.round((withProfile / students.length) * 100) : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, mx: "auto" }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
        UniPath — Admin Panel
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Manage universities, scholarships, and view student data.
      </Typography>

      {/* Stat cards */}
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 4 }}>
        <StatCard icon={<SchoolIcon />}        title="Universities"  value={stats?.total_universities}          color="primary" />
        <StatCard icon={<CardGiftcardIcon />}  title="Scholarships"  value={stats?.total_scholarships}          color="success" />
        <StatCard icon={<PeopleAltIcon />}     title="Students"      value={stats?.users_by_role?.student ?? 0} color="secondary" />
        <StatCard icon={<FavoriteIcon />}      title="Favourites"    value={stats?.total_favourites}            color="warning" />
        <StatCard icon={<AssignmentIcon />}    title="Applications"  value={stats?.total_applications}          color="info" />
        <StatCard icon={<MenuBookIcon />}      title="Courses"       value={stats?.total_courses}               color="success" />
        <StatCard icon={<CampaignIcon />}      title="Announcements" value={stats?.total_announcements}         color="error" />
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 320px" }, gap: 3, alignItems: "start" }}>

        {/* Students table */}
        <Paper elevation={0} sx={{ borderRadius: 3.5, overflow: "hidden" }}>
          <Box sx={{
            px: 3, py: 2.25, borderBottom: 1, borderColor: "divider",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap",
          }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PeopleAltIcon fontSize="small" color="primary" /> Registered Students &amp; Profiles
            </Typography>
            <TextField
              size="small"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by email, nationality, field…"
              sx={{ width: 260 }}
              slotProps={{ input: { startAdornment: (
                <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              ) } }}
            />
          </Box>

          {studentsLoading ? (
            <Box sx={{ p: 5 }}>
              <Stack spacing={1.5}>
                {[0, 1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={36} />)}
              </Stack>
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center", color: "text.disabled" }}>
              <Typography variant="body2">No students found.</Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["#", "Email", "Nationality", "Degree", "GPA", "Budget/yr", "English", "Countries", "Field", "Status"].map(h => (
                      <TableCell key={h} sx={{ whiteSpace: "nowrap" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ color: "text.disabled", fontWeight: 500 }}>{s.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{s.email}</TableCell>
                      <TableCell>{s.nationality ?? "—"}</TableCell>
                      <TableCell>
                        {s.degree_level
                          ? <Chip size="small" label={s.degree_level} color={degreeColor[s.degree_level] ?? "default"} variant="outlined" />
                          : "—"}
                      </TableCell>
                      <TableCell sx={{
                        fontWeight: 700,
                        color: s.gpa == null ? "text.disabled" : s.gpa >= 3.5 ? "success.main" : s.gpa >= 2.5 ? "warning.main" : "error.main",
                      }}>
                        {s.gpa != null ? s.gpa.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell>{s.budget_eur != null ? `€${s.budget_eur.toLocaleString()}` : "—"}</TableCell>
                      <TableCell>
                        {s.english_level
                          ? <Chip size="small" label={s.english_level.toUpperCase()} color={levelColor(s.english_level)} variant="outlined" />
                          : "—"}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.preferred_countries || "—"}
                      </TableCell>
                      <TableCell>{s.field_of_study || "—"}</TableCell>
                      <TableCell>
                        {s.has_profile
                          ? <Chip size="small" label="Profile" color="success" />
                          : <Chip size="small" label="No Profile" variant="outlined" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          <Box sx={{ px: 3, py: 1.5, bgcolor: "action.hover", borderTop: 1, borderColor: "divider" }}>
            <Typography variant="caption" color="text.disabled">
              {filtered.length} student{filtered.length !== 1 ? "s" : ""} {search ? "found" : "total"}
            </Typography>
          </Box>
        </Paper>

        {/* Right column */}
        <Stack spacing={2.5}>

          {stats?.top_favourited_universities?.length > 0 && (
            <Paper elevation={0} sx={{ borderRadius: 3.5, p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                <EmojiEventsIcon fontSize="small" color="warning" /> Most Favourited Universities
              </Typography>
              <Stack divider={<Box sx={{ borderBottom: 1, borderColor: "divider" }} />}>
                {stats.top_favourited_universities.map((u, i) => (
                  <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1 }}>
                    <Typography variant="body2">#{i + 1} {u.name}</Typography>
                    <Typography variant="body2" fontWeight={700} color="warning.main">❤️ {u.count}</Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}

          <Paper elevation={0} sx={{ borderRadius: 3.5, p: 2.5, bgcolor: "primary.main", backgroundImage: "none", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1, color: "primary.contrastText" }}>
                <BoltIcon fontSize="small" /> Quick Actions
              </Typography>
              <Stack spacing={1}>
                {quickActions.map(({ to, icon, label }) => (
                  <Box
                    key={to}
                    component={Link}
                    to={to}
                    sx={{
                      display: "flex", alignItems: "center", gap: 1.25, px: 1.5, py: 1,
                      borderRadius: 2, bgcolor: "rgba(255,255,255,0.14)", color: "primary.contrastText",
                      fontWeight: 600, fontSize: 13, textDecoration: "none",
                      transition: "background 150ms ease",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.24)" },
                    }}
                  >
                    {icon}{label}
                  </Box>
                ))}
              </Stack>
            </Box>
          </Paper>

          {students.length > 0 && (
            <Paper elevation={0} sx={{ borderRadius: 3.5, p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                <DonutLargeIcon fontSize="small" color="success" /> Profile Completion
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="text.secondary">{withProfile} / {students.length} students</Typography>
                <Typography variant="body2" fontWeight={700} color="success.main">{pct}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={pct} color="success" sx={{ height: 8, borderRadius: 4 }} />
              <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 1 }}>
                have completed their profile
              </Typography>
            </Paper>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default Dashboard;
