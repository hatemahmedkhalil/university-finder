import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const STEPS = [
  { key: "profile",     icon: "👤", to: "/profile",         check: ({ completion }) => completion >= 80 },
  { key: "recommend",   icon: "🎯", to: "/recommendations",  check: ({ hasMatches }) => hasMatches },
  { key: "favourite",   icon: "❤️", to: "/universities",     check: ({ hasFav }) => hasFav },
  { key: "pipeline",    icon: "🚀", to: "/pipeline",          check: ({ hasPipeline }) => hasPipeline },
  { key: "language",    icon: "📚", to: "/learning",          check: ({ hasLang }) => hasLang },
];

const GettingStarted = ({ completion, hasMatches, hasFav, hasPipeline, hasLang }) => {
  const { t } = useTranslation();
  const ctx = { completion, hasMatches, hasFav, hasPipeline, hasLang };

  const done    = STEPS.filter(s => s.check(ctx)).length;
  const allDone = done === STEPS.length;

  if (allDone) return null;

  const pct = Math.round((done / STEPS.length) * 100);

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white flex items-center justify-between">
        <div>
          <h2 className="font-bold text-base">{t("gettingStarted.title")}</h2>
          <p className="text-indigo-200 text-xs mt-0.5">{t("gettingStarted.subtitle")}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-extrabold leading-none">{done}/{STEPS.length}</p>
          <p className="text-indigo-200 text-[11px] mt-0.5">{t("gettingStarted.completed")}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="p-4 space-y-2">
        {STEPS.map((step) => {
          const isDone = step.check(ctx);
          return (
            <Link
              key={step.key}
              to={step.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isDone
                  ? "bg-emerald-50 border border-emerald-100 opacity-60 pointer-events-none"
                  : "bg-gray-50 border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
            >
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-xs ${
                isDone
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-gray-300 text-gray-400"
              }`}>
                {isDone ? "✓" : step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isDone ? "text-emerald-700 line-through" : "text-gray-800"}`}>
                  {t(`gettingStarted.steps.${step.key}.title`)}
                </p>
                {!isDone && (
                  <p className="text-xs text-gray-400 mt-0.5">{t(`gettingStarted.steps.${step.key}.desc`)}</p>
                )}
              </div>
              {!isDone && (
                <span className="text-indigo-400 shrink-0 text-sm">→</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default GettingStarted;
