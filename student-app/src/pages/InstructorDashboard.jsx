import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const LANG_GRAD = {
  english: "from-rose-500 via-pink-500 to-fuchsia-600",
  german:  "from-amber-500 via-orange-500 to-red-500",
  polish:  "from-emerald-500 via-teal-500 to-cyan-600",
};
const LANG_LIGHT = {
  english: "bg-pink-50 text-pink-700 border-pink-200",
  german:  "bg-orange-50 text-orange-700 border-orange-200",
  polish:  "bg-teal-50 text-teal-700 border-teal-200",
};

const StatCard = ({ icon, label, value, sub, grad }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad} p-5 text-white`}>
    <div className="absolute -right-3 -top-3 text-7xl opacity-10 select-none">{icon}</div>
    <p className="text-4xl font-extrabold tracking-tight leading-none mb-1">{value}</p>
    <p className="text-white/80 text-sm font-semibold">{label}</p>
    {sub && <p className="text-white/60 text-xs mt-0.5">{sub}</p>}
  </div>
);

const InstructorDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/instructor-messages/stats")
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grad = LANG_GRAD[stats?.language] || "from-indigo-600 to-violet-600";
  const firstName = user?.email?.split("@")[0] ?? "Instructor";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${grad} text-white`}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-black/10 rounded-full translate-y-1/2" />
        <div className="relative max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/70 text-sm font-semibold mb-1">{greeting} 👋</p>
              <h1 className="text-4xl font-extrabold tracking-tight">
                {loading ? firstName : stats?.instructor_name || firstName}
              </h1>
              <p className="text-white/70 mt-1 text-sm capitalize">
                {t(`learning.${stats?.language}`) || stats?.language} {t("instructors.languageInstructor")}
              </p>
            </div>
            <Link
              to="/instructor-panel"
              className="flex items-center gap-3 bg-white/15 hover:bg-white/25 border border-white/30 rounded-2xl px-5 py-3 transition"
            >
              <span className="text-2xl">📬</span>
              <div>
                <p className="text-sm font-bold">
                  {loading ? "—" : stats?.pending_replies} pending
                </p>
                <p className="text-white/70 text-xs">student messages</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => (
              <div key={i} className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="🎓" label="Students Reached" value={stats?.total_students ?? 0}
              sub="asked you questions" grad="from-violet-600 to-indigo-600" />
            <StatCard icon="📬" label="Pending Replies"  value={stats?.pending_replies ?? 0}
              sub="waiting for answer" grad="from-rose-500 to-pink-600" />
            <StatCard icon="💬" label="Total Messages"   value={stats?.total_messages ?? 0}
              sub="all time"          grad="from-amber-500 to-orange-500" />
            <StatCard icon="📚" label="Your Courses"     value={stats?.courses_count ?? 0}
              sub={`${stats?.language} courses`} grad="from-emerald-500 to-teal-600" />
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/instructor-panel"
            className="flex items-center gap-4 bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] p-5 hover:shadow-md transition card-lift">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-2xl shadow`}>
              💬
            </div>
            <div>
              <p className="font-bold text-white">Student Messages</p>
              <p className="text-[oklch(0.45_0.02_285)] text-sm">Reply to questions</p>
            </div>
          </Link>
          <Link to="/learning"
            className="flex items-center gap-4 bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] p-5 hover:shadow-md transition card-lift">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-2xl shadow`}>
              📚
            </div>
            <div>
              <p className="font-bold text-white">Learning Center</p>
              <p className="text-[oklch(0.45_0.02_285)] text-sm">Browse your courses</p>
            </div>
          </Link>
          <Link to="/profile"
            className="flex items-center gap-4 bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] p-5 hover:shadow-md transition card-lift">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-2xl shadow`}>
              👤
            </div>
            <div>
              <p className="font-bold text-white">My Profile</p>
              <p className="text-[oklch(0.45_0.02_285)] text-sm">Update your info</p>
            </div>
          </Link>
        </div>

        {/* Courses with community chat links */}
        {!loading && stats?.courses?.length > 0 && (
          <div className="bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
              <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center text-white text-sm`}>📚</span>
              <h2 className="font-bold text-white">Your Courses</h2>
              <span className="ms-auto text-xs text-[oklch(0.45_0.02_285)]">{stats.courses.length} course{stats.courses.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {stats.courses.map(course => (
                <div key={course.id} className="flex items-center justify-between px-6 py-4 hover:bg-[oklch(0.20_0.024_285)] transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-sm font-bold `}>
                      {course.level || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{course.title}</p>
                      <p className="text-[oklch(0.45_0.02_285)] text-xs capitalize">{stats.language} · {course.level || "All levels"}</p>
                    </div>
                  </div>
                  <Link
                    to={`/course-chat/${course.id}`}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${LANG_LIGHT[stats.language] || "bg-indigo-50 text-indigo-700 border-indigo-200"} hover:opacity-80`}
                  >
                    💬 Community Chat
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && (!stats?.courses || stats.courses.length === 0) && (
          <div className="text-center py-12 bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)]">
            <div className="text-5xl mb-3">📚</div>
            <p className="text-[oklch(0.65_0.02_285)] font-semibold">No published courses yet</p>
            <p className="text-[oklch(0.45_0.02_285)] text-sm mt-1">Ask an admin to publish courses in your language</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;

