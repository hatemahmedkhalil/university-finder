import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

const LANG_META = {
  english: { flagSrc: "https://flagcdn.com/w40/gb.png", color: "from-indigo-600 to-blue-700",  light: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700" },
  german:  { flagSrc: "https://flagcdn.com/w40/de.png", color: "from-amber-600 to-orange-700",  light: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700"  },
  polish:  { flagSrc: "https://flagcdn.com/w40/pl.png", color: "from-rose-600 to-pink-700",     light: "bg-rose-50",   border: "border-rose-200",   text: "text-rose-700"  },
};

const CoursePage = () => {
  const { t } = useTranslation();
  const { language } = useParams();
  const meta = LANG_META[language] ?? LANG_META.english;
  const langLabel = t(`learning.${language}`) || language;

  const LEVELS = [
    { code: "A1", label: t("course.levels.A1.label"), desc: t("course.levels.A1.desc") },
    { code: "A2", label: t("course.levels.A2.label"), desc: t("course.levels.A2.desc") },
    { code: "B1", label: t("course.levels.B1.label"), desc: t("course.levels.B1.desc") },
    { code: "B2", label: t("course.levels.B2.label"), desc: t("course.levels.B2.desc") },
    { code: "C1", label: t("course.levels.C1.label"), desc: t("course.levels.C1.desc") },
    { code: "C2", label: t("course.levels.C2.label"), desc: t("course.levels.C2.desc") },
  ];

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/learning/courses?language=${language}`)
      .then((r) => setCourses(r.data))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [language]);

  const coursesByLevel = LEVELS.reduce((acc, lvl) => {
    acc[lvl.code] = courses.filter((c) => c.level === lvl.code);
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${meta.color} text-white`}>
        <div className="absolute inset-0">
          <div className="absolute top-4 right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 left-1/4 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-12">
          <Link to="/learning" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-6 transition">
            {t("courses.backToLearning")}
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 border border-white/30 rounded-2xl flex items-center justify-center overflow-hidden backdrop-blur">
              <img src={meta.flagSrc} alt={langLabel} className="w-10 h-auto" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{langLabel} {t("learning.coursesSuffix")}</h1>
              <p className="text-white/80 mt-1">{t("courses.tagline")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* Status banner */}
        <div className={`${meta.light} ${meta.border} border rounded-2xl p-6 flex items-start gap-4`}>
          <div className="text-3xl mt-0.5">🎓</div>
          <div>
            <p className={`font-bold text-lg ${meta.text}`}>{langLabel} {t("learning.coursesSuffix")}</p>
            <p className="text-[oklch(0.65_0.02_285)] mt-1">
              <span className="font-semibold">{t("courses.statusLabel")}</span> {t("courses.noContent")}
            </p>
            <p className="text-[oklch(0.55_0.02_285)] text-sm mt-1">
              {t("courses.adminNote")}
            </p>
          </div>
        </div>

        {/* Level grid */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">{t("courses.levelsComing")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {LEVELS.map((lvl) => {
              const lvlCourses = coursesByLevel[lvl.code] || [];
              return (
                <div key={lvl.code} className="bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] p-5 flex flex-col gap-3 card-lift">
                  {/* Level badge */}
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 ${meta.light} rounded-xl flex items-center justify-center text-lg font-bold ${meta.text}`}>
                      {lvl.code}
                    </div>
                    <span className="text-xs bg-gray-100 text-[oklch(0.45_0.02_285)] px-2.5 py-1 rounded-full font-medium">
                      {lvlCourses.length === 0 ? t("course.noCourses") : t("course.courseCount", { count: lvlCourses.length })}
                    </span>
                  </div>

                  <div>
                    <p className="font-bold text-white">{lvl.code} — {lvl.label}</p>
                    <p className="text-xs text-[oklch(0.55_0.02_285)] mt-0.5 leading-relaxed">{lvl.desc}</p>
                  </div>

                  {lvlCourses.length === 0 ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-[oklch(0.45_0.02_285)] bg-[oklch(0.17_0.02_285)] rounded-xl px-3 py-2.5">
                      <span>📭</span> {t("courses.lessonsAppear")}
                    </div>
                  ) : (
                    <ul className="mt-1 space-y-1.5">
                      {lvlCourses.map((c) => (
                        <li key={c.id} className="text-sm text-[oklch(0.75_0.02_285)] flex items-center gap-2">
                          <span className="text-green-500">▶</span> {c.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* What courses will include */}
        <div className="bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] p-7">
          <h2 className="text-base font-bold text-white mb-5">{t("courses.includes")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              ["🎬", t("course.features.video"), t("course.features.videoDesc")],
              ["📄", t("course.features.pdf"),   t("course.features.pdfDesc")],
              ["🧠", t("course.features.quiz"),  t("course.features.quizDesc")],
              ["📊", t("course.features.progress"), t("course.features.progressDesc")],
              ["🏆", t("course.features.cert"),  t("course.features.certDesc")],
              ["💬", t("course.features.exercises"), t("course.features.exercisesDesc")],
            ].map(([icon, title, desc]) => (
              <div key={title} className="bg-[oklch(0.17_0.02_285)] rounded-xl p-4 flex flex-col gap-1">
                <span className="text-xl">{icon}</span>
                <p className="font-semibold text-sm text-white">{title}</p>
                <p className="text-xs text-[oklch(0.55_0.02_285)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center py-4 text-[oklch(0.45_0.02_285)] text-sm">
          {t("courses.comingSoonNote")}
        </div>
      </div>
    </div>
  );
};

export default CoursePage;

