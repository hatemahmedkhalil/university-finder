import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api/axios";

const BG     = "oklch(0.13 0.018 285)";
const SURF   = "oklch(0.17 0.022 285)";
const CARD   = "oklch(0.20 0.024 285)";
const BORDER = "oklch(1 0 0 / 0.07)";
const DIM    = "oklch(0.55 0.02 285)";
const GRAD   = "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))";

const LEVEL_ORDER = ["A1","A2","B1","B2","C1","C2","native"];
const LEVEL_PCT   = { A1: 10, A2: 25, B1: 42, B2: 62, C1: 78, C2: 92, native: 100 };

const LANG_META = {
  english: { flag: "🇬🇧", code: "GB", color: "oklch(0.55 0.22 260)", next: { A1:"A2", A2:"B1", B1:"B2", B2:"C1", C1:"C2", C2:"C2", native:"native" } },
  german:  { flag: "🇩🇪", code: "DE", color: "oklch(0.58 0.20 35)",  next: { A1:"A2", A2:"B1", B1:"B2", B2:"C1", C1:"C2", C2:"C2", native:"native" } },
  polish:  { flag: "🇵🇱", code: "PL", color: "oklch(0.55 0.18 160)", next: { A1:"A2", A2:"B1", B1:"B2", B2:"C1", C1:"C2", C2:"C2", native:"native" } },
};

/* Circular progress SVG */
function ProgressRing({ pct, color, size = 80 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="oklch(1 0 0 / 0.07)" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.8s ease" }} />
    </svg>
  );
}

export default function LearningCenter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userLangs, setUserLangs] = useState([]);
  const [courses, setCourses]     = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/user-languages"),
      api.get("/learning/courses"),
    ]).then(([ul, cr]) => {
      setUserLangs(Array.isArray(ul.data) ? ul.data : []);
      setCourses(Array.isArray(cr.data) ? cr.data : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const langMap = {};
  userLangs.forEach(ul => { langMap[ul.language] = ul.level; });

  const trackedLangs = Object.entries(LANG_META).map(([lang, meta]) => ({
    lang, ...meta,
    level: langMap[lang] || null,
    pct: langMap[lang] ? (LEVEL_PCT[langMap[lang]] || 0) : 0,
  }));

  const hasAnyLang = trackedLangs.some(l => l.level);

  return (
    <div className="min-h-screen" style={{ background: BG }}>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ height: 240 }}>
        <img
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1400&q=80"
          alt="Learning Center"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.35)" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, oklch(0.10 0.02 285 / 0.85), transparent)" }} />
        <div className="absolute inset-0 flex flex-col justify-end px-8 pb-8">
          <h1 className="text-3xl font-extrabold text-white">Learning Center</h1>
          <p className="mt-1 text-sm" style={{ color: "oklch(0.75 0.01 285)" }}>
            Build the language skills your target university expects
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* ── Your Languages ── */}
        {hasAnyLang && (
          <section>
            <h2 className="text-white font-bold text-lg mb-4">Your languages</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {trackedLangs.filter(l => l.level).map(({ lang, flag, code, color, level, pct }) => {
                const nextLevel = LANG_META[lang].next[level] !== level ? LANG_META[lang].next[level] : null;
                return (
                  <div key={lang} className="rounded-2xl p-5 flex items-center gap-4"
                    style={{ background: SURF, border: `1px solid ${BORDER}` }}>
                    <div className="relative shrink-0">
                      <ProgressRing pct={pct} color={color} size={76} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{pct}%</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: color, color: "#fff", opacity: 0.9 }}>{code}</span>
                        <span className="text-white font-bold capitalize">{lang}</span>
                      </div>
                      <p className="text-xs" style={{ color: DIM }}>
                        {level}{nextLevel && nextLevel !== level ? ` → targeting ${nextLevel}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Placement Test Banner ── */}
        <div className="rounded-2xl px-6 py-5 flex items-center justify-between gap-4"
          style={{ background: "oklch(0.22 0.04 285)", border: `1px solid ${BORDER}` }}>
          <div>
            <p className="text-white font-bold">Not sure where to start?</p>
            <p className="text-sm mt-0.5" style={{ color: DIM }}>Take our 10-minute placement test to find your level.</p>
          </div>
          <Link to="/learning/placement/english"
            className="shrink-0 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition hover:opacity-90 whitespace-nowrap"
            style={{ background: "oklch(0.25 0.04 285)", border: `1px solid oklch(1 0 0 / 0.15)` }}>
            Take placement test
          </Link>
        </div>

        {/* ── Courses ── */}
        <section>
          <h2 className="text-white font-bold text-lg mb-4">Courses</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-2xl h-52 animate-pulse" style={{ background: SURF }} />
              ))}
            </div>
          ) : courses.length === 0 ? (
            /* No courses yet — show language entry cards */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(LANG_META).map(([lang, { flag, code, color }]) => (
                <Link key={lang} to={`/learning/courses/${lang}`}
                  className="rounded-2xl p-0 overflow-hidden transition hover:opacity-90"
                  style={{ background: SURF, border: `1px solid ${BORDER}` }}>
                  <div className="h-28 flex items-center justify-center text-3xl font-black text-white"
                    style={{ background: color, opacity: 0.85 }}>
                    {code}
                  </div>
                  <div className="p-4">
                    <p className="text-white font-bold capitalize">{lang === "english" ? "English" : lang === "german" ? "German" : "Polish"} Courses</p>
                    <p className="text-xs mt-1" style={{ color: DIM }}>Full curriculum from beginner to mastery</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {["A1","A2","B1","B2","C1","C2"].map(l => (
                        <span key={l} className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: CARD, color: DIM }}>{l}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {courses.filter(c => c.is_published).slice(0, 6).map(course => {
                const meta = LANG_META[course.language] || LANG_META.english;
                return (
                  <Link key={course.id} to={`/learning/courses/${course.language}/${course.id}`}
                    className="rounded-2xl overflow-hidden transition hover:opacity-90"
                    style={{ background: SURF, border: `1px solid ${BORDER}` }}>
                    {/* Colour header */}
                    <div className="h-28 flex items-center justify-center text-3xl font-black text-white"
                      style={{ background: meta.color, opacity: 0.85 }}>
                      {meta.code}
                    </div>
                    <div className="p-4">
                      <p className="text-white font-bold text-sm leading-snug">{course.title}</p>
                      <p className="text-xs mt-1" style={{ color: DIM }}>
                        {course.lesson_count ?? 0} lessons · {course.level || "All levels"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Placement Tests ── */}
        <section>
          <h2 className="text-white font-bold text-lg mb-4">Placement Tests</h2>
          <p className="text-sm mb-4" style={{ color: DIM }}>Find your exact CEFR level in minutes</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(LANG_META).map(([lang, { flag, code, color }]) => (
              <Link key={lang} to={`/learning/placement/${lang}`}
                className="flex items-center gap-4 rounded-2xl p-4 transition hover:opacity-90"
                style={{ background: SURF, border: `1px solid ${BORDER}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white shrink-0"
                  style={{ background: color }}>
                  {code}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm capitalize">
                    {lang === "english" ? "English" : lang === "german" ? "German" : "Polish"} Test
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: DIM }}>Assess your level A1 → C2</p>
                  <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: color, color: "#fff", opacity: 0.85 }}>
                    ~10 minutes
                  </span>
                </div>
                <span style={{ color: DIM }}>→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── IELTS Simulator ── */}
        <section>
          <h2 className="text-white font-bold text-lg mb-4">IELTS Simulator</h2>
          <p className="text-sm mb-4" style={{ color: DIM }}>Practice all four sections in a real exam environment</p>
          <Link to="/learning/ielts"
            className="flex items-center gap-5 rounded-2xl p-5 transition hover:opacity-90"
            style={{ background: SURF, border: `1px solid ${BORDER}` }}>
            <div className="flex gap-2 shrink-0">
              {["🎧","📖","✍️","🎤"].map((icon, i) => (
                <div key={i} className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: GRAD }}>
                  {icon}
                </div>
              ))}
            </div>
            <div className="flex-1">
              <p className="text-white font-bold">IELTS Full Practice Test</p>
              <p className="text-xs mt-0.5" style={{ color: DIM }}>Listening · Reading · Writing · Speaking</p>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: CARD, color: DIM }}>~2h 50min</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: CARD, color: DIM }}>Band 0–9</span>
              </div>
            </div>
            <span style={{ color: DIM }}>→</span>
          </Link>
        </section>

      </div>
    </div>
  );
}
