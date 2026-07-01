import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

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
const LEVEL_COLOR = {
  A1: "bg-green-100 text-green-700", A2: "bg-emerald-100 text-emerald-700",
  B1: "bg-blue-100 text-blue-700",   B2: "bg-indigo-100 text-indigo-700",
  C1: "bg-purple-100 text-purple-700", C2: "bg-rose-100 text-rose-700",
};

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
    <div className="h-2 bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
      <div className="h-10 bg-gray-100 rounded-xl" />
    </div>
  </div>
);

const MyCourses = () => {
  const [courses, setCourses]   = useState([]);
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get("/instructor-messages/stats")
      .then(r => {
        setProfile(r.data);
        setCourses(r.data.courses || []);
      })
      .catch(() => toast.error("Could not load courses"))
      .finally(() => setLoading(false));
  }, []);

  const grad  = LANG_GRAD[profile?.language]  || "from-indigo-500 to-violet-600";
  const light = LANG_LIGHT[profile?.language] || "bg-indigo-50 text-indigo-700 border-indigo-200";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${grad} text-white`}>
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-6 py-10">
          <span className="inline-block bg-white/15 text-white/90 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 capitalize">
            📚 {profile?.language} Courses
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight mb-1">My Courses</h1>
          <p className="text-white/70 text-lg">
            {loading ? "…" : `${courses.length} course${courses.length !== 1 ? "s" : ""} you teach`}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-gray-100 shadow-sm">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No courses yet</h2>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Ask an admin to publish courses in your language so they appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map(course => (
              <div key={course.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition card-lift">

                {/* Color bar */}
                <div className={`h-2 bg-gradient-to-r ${grad}`} />

                <div className="p-5 flex flex-col flex-1 gap-4">
                  {/* Title + level */}
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xl shadow-sm shrink-0`}>
                      📖
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 text-base leading-tight">{course.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${light}`}>
                          {profile?.language}
                        </span>
                        {course.level && (
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${LEVEL_COLOR[course.level] || "bg-gray-100 text-gray-600"}`}>
                            {course.level}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex gap-2">
                    <Link
                      to={`/course-chat/${course.id}`}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r ${grad} text-white shadow-sm hover:opacity-90 transition`}
                    >
                      💬 Community Chat
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;
