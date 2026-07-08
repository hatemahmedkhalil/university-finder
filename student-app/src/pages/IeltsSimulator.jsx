import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const SECTION_ICONS = {
  Listening: "🎧",
  Reading:   "📖",
  Writing:   "✍️",
  Speaking:  "🎤",
};

const IeltsSimulator = () => {
  const [tests, setTests]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/ielts")
      .then(r => setTests(Array.isArray(r.data) ? r.data : []))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-violet-900 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-20 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-blue-200 text-sm font-semibold px-5 py-2 rounded-full mb-6">
            🎓 IELTS Simulator
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            IELTS Practice Simulator
          </h1>
          <p className="text-indigo-200 text-lg max-w-xl mx-auto">
            Practice all four IELTS sections — Listening, Reading, Writing, and Speaking —
            in a real exam environment.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* ── What is IELTS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {[
            { icon: "🎧", name: "Listening",  time: "30 min",  desc: "4 recordings, 40 questions" },
            { icon: "📖", name: "Reading",    time: "60 min",  desc: "3 passages, 40 questions"   },
            { icon: "✍️", name: "Writing",    time: "60 min",  desc: "2 tasks, academic writing"  },
            { icon: "🎤", name: "Speaking",   time: "11-14 min", desc: "3 parts, face-to-face"   },
          ].map(s => (
            <div key={s.name} className="bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] p-5 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <p className="font-bold text-white text-sm">{s.name}</p>
              <p className="text-indigo-600 text-xs font-semibold mt-0.5">{s.time}</p>
              <p className="text-[oklch(0.45_0.02_285)] text-xs mt-1">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Available Tests ── */}
        <div className="mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl ">📝</div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">Available Practice Tests</h2>
            <p className="text-[oklch(0.55_0.02_285)] text-sm">Full-length simulated IELTS exams</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-[oklch(0.20_0.024_285)] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-[oklch(0.17_0.02_285)] rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
            <div className="text-5xl mb-4">🚧</div>
            <h3 className="text-xl font-bold text-white mb-2">Tests Coming Soon</h3>
            <p className="text-[oklch(0.45_0.02_285)] text-sm max-w-sm mx-auto">
              Our English instructors are preparing full IELTS practice tests.
              Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map(test => (
              <Link
                key={test.id}
                to={`/learning/ielts/${test.id}`}
                className="group block bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] hover:shadow-md hover:border-indigo-200 transition p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-lg group-hover:text-indigo-700 transition">
                      {test.title}
                    </h3>
                    {test.description && (
                      <p className="text-[oklch(0.55_0.02_285)] text-sm mt-1">{test.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        ⏱ {test.duration_minutes} min
                      </span>
                      <span className="text-xs font-semibold text-[oklch(0.55_0.02_285)]">
                        {test.section_count} sections · {test.total_questions} questions
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 ml-6">
                    {["🎧", "📖", "✍️", "🎤"].map((icon, i) => (
                      <div key={i} className="w-9 h-9 rounded-xl bg-gray-50 border border-[oklch(1_0_0/0.07)] flex items-center justify-center text-lg">
                        {icon}
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── Tips ── */}
        <div className="mt-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl border border-indigo-100 p-8">
          <h3 className="text-lg font-bold text-white mb-4">💡 IELTS Tips</h3>
          <ul className="space-y-2 text-sm text-[oklch(0.65_0.02_285)]">
            <li className="flex gap-2"><span className="text-indigo-500 font-bold">→</span> Read all instructions carefully before starting each section</li>
            <li className="flex gap-2"><span className="text-indigo-500 font-bold">→</span> Manage your time — don't spend too long on one question</li>
            <li className="flex gap-2"><span className="text-indigo-500 font-bold">→</span> For Writing Task 1, aim for at least 150 words; Task 2 at least 250</li>
            <li className="flex gap-2"><span className="text-indigo-500 font-bold">→</span> Practice Speaking out loud — fluency and pronunciation both matter</li>
            <li className="flex gap-2"><span className="text-indigo-500 font-bold">→</span> Have questions? Message one of our English instructors directly</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default IeltsSimulator;

