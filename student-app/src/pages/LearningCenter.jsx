import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  {
    lang:    "english",
    flag:    "🇬🇧",
    name:    "English",
    tagline: "The global language of academia",
    grad:    "from-rose-500 via-pink-500 to-fuchsia-600",
    glow:    "shadow-pink-200",
    light:   "bg-pink-50",
    text:    "text-pink-700",
    border:  "border-pink-100",
    ring:    "ring-pink-300",
    levels:  ["A1","A2","B1","B2","C1","C2"],
  },
  {
    lang:    "german",
    flag:    "🇩🇪",
    name:    "German",
    tagline: "Open doors to Germany & Austria",
    grad:    "from-amber-500 via-orange-500 to-red-500",
    glow:    "shadow-orange-200",
    light:   "bg-orange-50",
    text:    "text-orange-700",
    border:  "border-orange-100",
    ring:    "ring-orange-300",
    levels:  ["A1","A2","B1","B2","C1","C2"],
  },
  {
    lang:    "polish",
    flag:    "🇵🇱",
    name:    "Polish",
    tagline: "Unlock Poland's top universities",
    grad:    "from-emerald-500 via-teal-500 to-cyan-600",
    glow:    "shadow-teal-200",
    light:   "bg-teal-50",
    text:    "text-teal-700",
    border:  "border-teal-100",
    ring:    "ring-teal-300",
    levels:  ["A1","A2","B1","B2","C1","C2"],
  },
];

const COMING_SOON = [
  { icon: "🎬", label: "Video Lessons",      grad: "from-red-400 to-pink-500"    },
  { icon: "📄", label: "PDF Materials",       grad: "from-blue-400 to-indigo-500" },
  { icon: "🧠", label: "AI Quizzes",          grad: "from-violet-400 to-purple-500"},
  { icon: "🏆", label: "Certificates",        grad: "from-amber-400 to-orange-500"},
  { icon: "📊", label: "Progress Tracking",   grad: "from-emerald-400 to-teal-500"},
  { icon: "👨‍🏫", label: "Live Tutoring",      grad: "from-rose-400 to-fuchsia-500"},
];

const LearningCenter = () => {
  const { t } = useTranslation();
  return (
  <div className="min-h-screen bg-gray-50">

    {/* ── Hero ── */}
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-violet-900 to-fuchsia-900 text-white">
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-20 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-fuchsia-400/15 rounded-full blur-3xl -translate-x-1/2" />
      </div>
      <div className="relative max-w-5xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-fuchsia-200 text-sm font-semibold px-5 py-2 rounded-full mb-6">
          📚 Language Learning
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight mb-4">
          {t("learning.title")}
        </h1>
        <p className="text-indigo-200 text-lg max-w-xl mx-auto mb-8">
          {t("learning.heroSubtitle")}
        </p>
        <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-5 py-2.5 rounded-full text-sm font-semibold">
          🚧 {t("learning.comingSoonBadge")}
        </div>
      </div>
    </div>

    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">

      {/* ── Language Cards ── */}
      <div>
        <div className="text-center mb-10">
          <span className="text-indigo-500 text-sm font-bold uppercase tracking-widest">{t("learning.chooseLanguage")}</span>
          <h2 className="text-3xl font-extrabold text-gray-900 mt-2">{t("learning.whatLearn")}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
          {LANGUAGES.map(({ lang, flag, name, tagline, grad, glow, light, text, border, ring, levels }) => (
            <div key={lang} className={`group bg-white rounded-3xl border-2 ${border} shadow-lg ${glow} overflow-hidden card-lift`}>

              {/* Gradient header */}
              <div className={`bg-gradient-to-br ${grad} p-6 text-white relative overflow-hidden`}>
                <div className="absolute -right-4 -top-4 text-8xl opacity-20 select-none">{flag}</div>
                <div className="relative">
                  <div className="text-5xl mb-3">{flag}</div>
                  <h3 className="text-2xl font-extrabold">{name}</h3>
                  <p className="text-white/75 text-sm mt-1">{tagline}</p>
                </div>
              </div>

              {/* Level pills */}
              <div className="px-5 py-4">
                <p className={`text-xs font-bold uppercase tracking-widest ${text} mb-3`}>{t("learning.cefrLevels")}</p>
                <div className="flex gap-1.5 flex-wrap mb-5">
                  {levels.map(lvl => (
                    <span key={lvl} className={`text-xs font-bold px-2.5 py-1 rounded-lg ${light} ${text} border ${border}`}>
                      {lvl}
                    </span>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                  <Link to={`/learning/placement/${lang}`}
                    className={`flex items-center justify-between w-full bg-gradient-to-r ${grad} text-white px-4 py-3 rounded-xl font-bold text-sm shadow-sm hover:opacity-90 transition`}>
                    <span>📝 {t("learning.takePlacement")}</span>
                    <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                  </Link>
                  <Link to={`/learning/courses/${lang}`}
                    className={`flex items-center justify-between w-full ${light} ${text} border ${border} px-4 py-3 rounded-xl font-bold text-sm hover:opacity-80 transition`}>
                    <span>🎓 {t("learning.browseCourses")}</span>
                    <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Placement Tests ── */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xl shadow-sm">📝</div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">{t("learning.placementTests")}</h2>
            <p className="text-gray-500 text-sm">{t("learning.placementSub")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
          {LANGUAGES.map(({ lang, flag, name, grad, glow, light, text, border }) => (
            <Link key={lang} to={`/learning/placement/${lang}`}
              className={`group bg-white rounded-2xl border-2 ${border} shadow-md ${glow} p-5 flex items-center gap-4 card-lift`}>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-3xl shadow-sm shrink-0`}>
                {flag}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 group-hover:text-indigo-700 transition">{name} Test</p>
                <p className="text-xs text-gray-400 mt-0.5">{t("learning.assessLevel")}</p>
                <span className={`inline-block mt-2 text-[11px] font-bold px-2.5 py-1 rounded-full ${light} ${text}`}>
                  {t("learning.tenMinutes")}
                </span>
              </div>
              <span className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all">→</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Courses ── */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-sm">🎓</div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">{t("learning.languageCourses")}</h2>
            <p className="text-gray-500 text-sm">{t("learning.coursesSub")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
          {LANGUAGES.map(({ lang, flag, name, grad, glow, light, text, border, levels }) => (
            <Link key={lang} to={`/learning/courses/${lang}`}
              className={`group bg-white rounded-2xl border-2 ${border} shadow-md ${glow} p-5 card-lift overflow-hidden relative`}>
              <div className="absolute -right-3 -bottom-3 text-7xl opacity-8 select-none">{flag}</div>
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-2xl shadow-sm mb-3`}>
                  {flag}
                </div>
                <p className="font-bold text-gray-900 group-hover:text-indigo-700 transition">{name} Courses</p>
                <p className="text-xs text-gray-400 mt-1 mb-3">{t("learning.fullCurriculum")}</p>
                <div className="flex gap-1 flex-wrap">
                  {levels.map(l => (
                    <span key={l} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${light} ${text}`}>{l}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── IELTS Simulator ── */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-sm">🎓</div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">IELTS Simulator</h2>
            <p className="text-gray-500 text-sm">Practice all four sections in a real exam environment</p>
          </div>
        </div>
        <Link to="/learning/ielts"
          className="group flex items-center gap-6 bg-white rounded-2xl border-2 border-blue-100 shadow-md hover:shadow-lg hover:border-indigo-300 transition p-6 card-lift">
          <div className="flex gap-2 shrink-0">
            {["🎧","📖","✍️","🎤"].map((icon, i) => (
              <div key={i} className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-sm">
                {icon}
              </div>
            ))}
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 group-hover:text-indigo-700 transition text-lg">IELTS Full Practice Test</p>
            <p className="text-gray-400 text-sm mt-1">Listening · Reading · Writing · Speaking</p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">~2h 50min</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">Band 0–9</span>
            </div>
          </div>
          <span className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all text-xl">→</span>
        </Link>
      </div>

      {/* ── Coming soon ── */}
      <div className="bg-gradient-to-br from-indigo-50 via-violet-50 to-fuchsia-50 rounded-3xl border-2 border-indigo-100 p-10 text-center">
        <div className="text-5xl mb-4">🔮</div>
        <h3 className="text-2xl font-extrabold text-gray-900 mb-2">{t("learning.comingSoonTitle")}</h3>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">{t("learning.comingSoonDesc")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
          {COMING_SOON.map(({ icon, label, grad }) => (
            <div key={label}
              className="flex items-center gap-2.5 bg-white rounded-2xl px-4 py-3 shadow-sm border border-white/80">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-base shadow-sm shrink-0`}>
                {icon}
              </div>
              <span className="text-sm font-semibold text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  </div>
  );
};

export default LearningCenter;
