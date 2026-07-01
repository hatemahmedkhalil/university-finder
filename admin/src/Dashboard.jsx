import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = "";

const token = () => localStorage.getItem("access_token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const StatCard = ({ title, value, color, icon }) => (
  <div style={{
    background: color, borderRadius: 14, padding: "22px 28px",
    color: "#fff", minWidth: 150, flex: 1, boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
  }}>
    <div style={{ fontSize: 32, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: 34, fontWeight: 700 }}>{value ?? "…"}</div>
    <div style={{ fontSize: 14, marginTop: 4, opacity: 0.9 }}>{title}</div>
  </div>
);

const Badge = ({ children, color }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}44`,
    borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600,
  }}>{children}</span>
);

const levelColor = (level) => ({
  a1: "#9e9e9e", a2: "#9e9e9e", b1: "#ff9800", b2: "#ff9800",
  c1: "#4caf50", c2: "#4caf50", native: "#2196f3",
}[level] ?? "#9e9e9e");

const degreeColor = { bachelor: "#7b1fa2", master: "#1976d2", phd: "#c62828" };

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [studentsLoading, setStudentsLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/admin/stats`, { headers: headers() })
      .then(r => setStats(r.data)).catch(() => setStats({}));

    axios.get(`${API_URL}/admin/students`, { headers: headers() })
      .then(r => setStudents(r.data))
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false));
  }, []);

  const filtered = students.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.nationality || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.field_of_study || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.preferred_countries || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 4, fontSize: 26, fontWeight: 700 }}>
        University Finder — Admin Panel
      </h1>
      <p style={{ color: "#888", marginBottom: 32, fontSize: 14 }}>
        Manage universities, scholarships, and view student data.
      </p>

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 40 }}>
        <StatCard icon="🎓" title="Universities"    value={stats?.total_universities}          color="#1976d2" />
        <StatCard icon="💰" title="Scholarships"    value={stats?.total_scholarships}          color="#388e3c" />
        <StatCard icon="👨‍🎓" title="Students"       value={stats?.users_by_role?.student ?? 0} color="#7b1fa2" />
        <StatCard icon="❤️"  title="Favourites"     value={stats?.total_favourites}            color="#f57c00" />
        <StatCard icon="📋" title="Applications"    value={stats?.total_applications}          color="#0288d1" />
        <StatCard icon="📚" title="Courses"         value={stats?.total_courses}               color="#00796b" />
        <StatCard icon="📢" title="Announcements"   value={stats?.total_announcements}         color="#c62828" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

        {/* Students Table */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #eee", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>👨‍🎓 Registered Students & Profiles</h2>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by email, nationality, field…"
              style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: "7px 14px", fontSize: 13, width: 260, outline: "none" }}
            />
          </div>

          {studentsLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>Loading students…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>No students found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9f9f9" }}>
                    {["#", "Email", "Nationality", "Degree", "GPA", "Budget/yr", "English", "Countries", "Field", "Status"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f5f5f5", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "10px 14px", color: "#aaa", fontWeight: 500 }}>{s.id}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 500, color: "#222" }}>{s.email}</td>
                      <td style={{ padding: "10px 14px", color: "#555" }}>{s.nationality ?? <span style={{ color: "#ccc" }}>—</span>}</td>
                      <td style={{ padding: "10px 14px" }}>
                        {s.degree_level
                          ? <Badge color={degreeColor[s.degree_level] ?? "#555"}>{s.degree_level}</Badge>
                          : <span style={{ color: "#ccc" }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: s.gpa >= 3.5 ? "#388e3c" : s.gpa >= 2.5 ? "#f57c00" : "#c62828" }}>
                        {s.gpa != null ? s.gpa.toFixed(2) : <span style={{ color: "#ccc" }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#555" }}>
                        {s.budget_eur != null ? `€${s.budget_eur.toLocaleString()}` : <span style={{ color: "#ccc" }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {s.english_level
                          ? <Badge color={levelColor(s.english_level)}>{s.english_level.toUpperCase()}</Badge>
                          : <span style={{ color: "#ccc" }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#555", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.preferred_countries || <span style={{ color: "#ccc" }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#555" }}>
                        {s.field_of_study || <span style={{ color: "#ccc" }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {s.has_profile
                          ? <Badge color="#388e3c">✓ Profile</Badge>
                          : <Badge color="#9e9e9e">No Profile</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ padding: "12px 24px", background: "#f9f9f9", borderTop: "1px solid #f0f0f0", fontSize: 12, color: "#aaa" }}>
            {filtered.length} student{filtered.length !== 1 ? "s" : ""} {search ? "found" : "total"}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Top favourited */}
          {stats?.top_favourited_universities?.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>🏆 Most Favourited Universities</h3>
              {stats.top_favourited_universities.map((u, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <span style={{ fontSize: 13, color: "#444" }}>#{i + 1} {u.name}</span>
                  <span style={{ fontWeight: 700, color: "#f57c00", fontSize: 13 }}>❤️ {u.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div style={{ background: "#f5f7ff", borderRadius: 14, padding: 20, border: "1px solid #e8ecff" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>⚡ Quick Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { to: "/universities/create",    icon: "🏛️", label: "Add University"      },
                { to: "/scholarships/create",    icon: "💰", label: "Add Scholarship"     },
                { to: "/announcements/create",   icon: "📢", label: "Post Announcement"   },
                { to: "/learning/courses/create",icon: "📚", label: "Add Course"          },
                { to: "/users",                  icon: "👥", label: "View All Users"      },
                { to: "/support-tickets",        icon: "🎧", label: "Support Tickets"     },
              ].map(({ to, icon, label }) => (
                <Link key={to} to={to} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  borderRadius: 8, background: "#fff", border: "1px solid #e8ecff",
                  color: "#3949ab", fontWeight: 600, fontSize: 13,
                  textDecoration: "none", transition: "background 0.15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#e8ecff"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                >
                  <span>{icon}</span>{label}
                </Link>
              ))}
            </div>
          </div>

          {/* Profile completion */}
          {students.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: 20 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>📊 Profile Completion</h3>
              {(() => {
                const withProfile = students.filter(s => s.has_profile).length;
                const pct = Math.round((withProfile / students.length) * 100);
                return (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                      <span style={{ color: "#555" }}>{withProfile} / {students.length} students</span>
                      <span style={{ fontWeight: 700, color: "#388e3c" }}>{pct}%</span>
                    </div>
                    <div style={{ background: "#eee", borderRadius: 8, height: 8 }}>
                      <div style={{ background: "#388e3c", width: `${pct}%`, height: 8, borderRadius: 8, transition: "width 0.5s" }} />
                    </div>
                    <p style={{ fontSize: 12, color: "#aaa", marginTop: 8, marginBottom: 0 }}>
                      have completed their profile
                    </p>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
