import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "";

const StatCard = ({ title, value, color }) => (
  <div style={{
    background: color, borderRadius: 12, padding: "24px 32px",
    color: "#fff", minWidth: 160, flex: 1, boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
  }}>
    <div style={{ fontSize: 36, fontWeight: 700 }}>{value ?? "..."}</div>
    <div style={{ fontSize: 15, marginTop: 6, opacity: 0.9 }}>{title}</div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const headers = { Authorization: `Bearer ${token}` };
    axios.get(`${API_URL}/admin/stats`, { headers })
      .then((res) => setStats(res.data))
      .catch(() => setStats({}));
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ marginBottom: 8, fontSize: 28, fontWeight: 700 }}>
        University Finder — Admin Panel
      </h1>
      <p style={{ color: "#666", marginBottom: 32 }}>
        Manage universities, scholarships, and users from here.
      </p>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 40 }}>
        <StatCard title="Universities" value={stats?.total_universities} color="#1976d2" />
        <StatCard title="Scholarships" value={stats?.total_scholarships} color="#388e3c" />
        <StatCard title="Students" value={stats?.users_by_role?.student ?? 0} color="#7b1fa2" />
        <StatCard title="Favourites Saved" value={stats?.total_favourites} color="#f57c00" />
      </div>

      {stats?.top_favourited_universities?.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 24, maxWidth: 500, marginBottom: 32 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>🏆 Most Favourited Universities</h3>
          {stats.top_favourited_universities.map((u, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
              <span>#{i + 1} {u.name}</span>
              <span style={{ fontWeight: 600, color: "#1976d2" }}>❤️ {u.count}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: "#f5f5f5", borderRadius: 12, padding: 24, maxWidth: 500 }}>
        <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
        <ul style={{ lineHeight: 2.2, paddingLeft: 20 }}>
          <li>Go to <strong>Universities</strong> to add or edit universities</li>
          <li>Go to <strong>Scholarships</strong> to manage scholarships</li>
          <li>Go to <strong>Users</strong> to view registered students</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
