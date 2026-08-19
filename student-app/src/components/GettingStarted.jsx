import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Confetti from "./Confetti";
import { Icon, ICONS } from "./Sidebar";

const STEPS = [
  { key: "profile",   icon: "👤", to: "/profile",         check: ({ completion }) => completion >= 80 },
  { key: "recommend", icon: "🎯", to: "/recommendations", check: ({ hasMatches })  => hasMatches },
  { key: "favourite", icon: "❤️", to: "/universities",    check: ({ hasFav })      => hasFav },
  { key: "pipeline",  icon: "🚀", to: "/pipeline",         check: ({ hasPipeline }) => hasPipeline },
  { key: "language",  icon: "📚", to: "/learning",         check: ({ hasLang })     => hasLang },
];

const GettingStarted = ({ completion, hasMatches, hasFav, hasPipeline, hasLang }) => {
  const { t } = useTranslation();
  const ctx = { completion, hasMatches, hasFav, hasPipeline, hasLang };

  const done    = STEPS.filter(s => s.check(ctx)).length;
  const allDone = done === STEPS.length;

  const [celebrate, setCelebrate] = useState(false);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("gs_celebrated_seen") === "1");

  useEffect(() => {
    if (allDone && sessionStorage.getItem("gs_celebrated") !== "1") {
      sessionStorage.setItem("gs_celebrated", "1");
      setCelebrate(true);
      const timer = setTimeout(() => setCelebrate(false), 1400);
      return () => clearTimeout(timer);
    }
  }, [allDone]);

  if (allDone && dismissed) return null;

  if (allDone) {
    return (
      <div className="card rounded-3xl overflow-hidden relative pop-in" style={{ borderColor: "var(--good)" }}>
        {celebrate && <Confetti />}
        <div className="px-6 py-7 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "var(--good-subtle)", color: "var(--good)" }}>
            <Icon d={ICONS.check} size={28} />
          </div>
          <h2 className="font-extrabold text-base text-[var(--ink)] mb-1">{t("gettingStarted.allDoneTitle", "You're fully set up!")}</h2>
          <p className="text-sm mb-4" style={{ color: "var(--ink-faint)" }}>
            {t("gettingStarted.allDoneSub", "Profile, matches, favourites, pipeline, and language — all ready. Your journey to Europe is officially underway.")}
          </p>
          <button
            onClick={() => { sessionStorage.setItem("gs_celebrated_seen", "1"); setDismissed(true); }}
            className="text-xs font-bold px-4 py-2 rounded-xl transition hover:opacity-80"
            style={{ background: "var(--surface-2)", color: "var(--ink-dim)" }}
          >
            {t("common.dismiss", "Got it")}
          </button>
        </div>
      </div>
    );
  }

  const pct = Math.round((done / STEPS.length) * 100);

  return (
    <div className="card rounded-3xl overflow-hidden">
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="font-bold text-sm text-[var(--ink)]">{t("gettingStarted.title")}</h2>
          <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{done}/{STEPS.length} {t("gettingStarted.completed")}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-light))" }}
          />
        </div>
      </div>

      <div className="p-3 space-y-1">
        {STEPS.map((step) => {
          const isDone = step.check(ctx);
          return (
            <Link
              key={step.key}
              to={step.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
              style={isDone ? { opacity: 0.55, pointerEvents: "none" } : { background: "transparent" }}
              onMouseEnter={e => { if (!isDone) e.currentTarget.style.background = "var(--surface-hover)"; }}
              onMouseLeave={e => { if (!isDone) e.currentTarget.style.background = "transparent"; }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] transition-all duration-300"
                style={isDone
                  ? { background: "var(--good)", color: "var(--on-accent)" }
                  : { border: "2px solid var(--border)", color: "var(--ink-faint)" }}
              >
                {isDone ? "✓" : ""}
              </div>
              <p className="text-sm font-medium flex-1 min-w-0 truncate" style={{ color: isDone ? "var(--ink-faint)" : "var(--ink)", textDecoration: isDone ? "line-through" : "none" }}>
                {t(`gettingStarted.steps.${step.key}.title`)}
              </p>
              {!isDone && <span className="shrink-0 text-xs" style={{ color: "var(--accent)" }}>→</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default GettingStarted;
