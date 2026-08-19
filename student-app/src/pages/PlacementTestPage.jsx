import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";
import { Icon, ICONS } from "../components/Sidebar";

const LANG_META = {
  english: {
    flagSrc: "https://flagcdn.com/w80/gb.png",
    heroBg: "bg-[#00247D]",
    heroStripe: "bg-[#CF142B]",
    accent: "#CF142B",
    accentLight: "#fff0f0",
    accentBorder: "var(--danger)",
    accentText: "var(--danger)",
    badgeBg: "#1e3a8a",
    badgeText: "#fff",
    cardBorder: "#bfdbfe",
    cardAccent: "#1d4ed8",
    stepBg: "#eff6ff",
    tagBg: "#dbeafe",
    tagText: "#1e40af",
    stripeColors: ["#00247D", "#CF142B", "#FFFFFF"],
  },
  german: {
    flagSrc: "https://flagcdn.com/w80/de.png",
    heroBg: "bg-[var(--ink)]",
    heroStripe: "bg-[#DD0000]",
    accent: "#DD0000",
    accentLight: "#fff5f5",
    accentBorder: "var(--danger)",
    accentText: "var(--danger)",
    badgeBg: "var(--ink)",
    badgeText: "#FFCE00",
    cardBorder: "#fde68a",
    cardAccent: "#b45309",
    stepBg: "#fffbeb",
    tagBg: "#fef3c7",
    tagText: "#92400e",
    stripeColors: ["var(--ink)", "#DD0000", "#FFCE00"],
  },
  polish: {
    flagSrc: "https://flagcdn.com/w80/pl.png",
    heroBg: "bg-[#DC143C]",
    heroStripe: "bg-[var(--surface-2)]",
    accent: "#DC143C",
    accentLight: "#fff0f3",
    accentBorder: "var(--danger)",
    accentText: "var(--danger)",
    badgeBg: "#DC143C",
    badgeText: "#fff",
    cardBorder: "var(--danger)",
    cardAccent: "#be123c",
    stepBg: "#fff1f2",
    tagBg: "#ffe4e6",
    tagText: "var(--danger)",
    stripeColors: ["#FFFFFF", "#DC143C"],
  },
};

const PlacementTestPage = () => {
  const { t } = useTranslation();
  const { language } = useParams();
  const meta = LANG_META[language] ?? LANG_META.english;
  const langLabel = t(`learning.${language}`) || language;

  const LEVELS = [
    { code: "A1", label: t("placement.levels.A1") },
    { code: "A2", label: t("placement.levels.A2") },
    { code: "B1", label: t("placement.levels.B1") },
    { code: "B2", label: t("placement.levels.B2") },
    { code: "C1", label: t("placement.levels.C1") },
    { code: "C2", label: t("placement.levels.C2") },
  ];

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/learning/placement-tests?language=${language}`)
      .then((r) => setTests(r.data))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, [language]);

  return (
    <div className="min-h-screen">

      {/* ── Hero with flag-stripe design ── */}
      <div className={`${meta.heroBg} relative overflow-hidden`}>
        {/* Decorative flag stripes across the top */}
        <div className="absolute top-0 left-0 right-0 flex h-2">
          {meta.stripeColors.map((c, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>

        {/* Subtle diagonal stripe watermark */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 20px,
              ${meta.stripeColors[1] ?? "#fff"} 20px,
              ${meta.stripeColors[1] ?? "#fff"} 22px
            )`,
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 pt-10 pb-14">
          <Link to="/learning" className="inline-flex items-center gap-1 text-[var(--ink)]/60 hover:text-[var(--ink)] text-sm mb-8 transition">
            {t("courses.backToLearning")}
          </Link>

          <div className="flex items-center gap-6">
            {/* Flag */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
                <img src={meta.flagSrc} alt={langLabel} className="w-full h-full object-cover" />
              </div>
              {/* Glow ring */}
              <div
                className="absolute inset-0 rounded-2xl blur-lg opacity-40 -z-10"
                style={{ backgroundColor: meta.stripeColors[1] ?? "#fff" }}
              />
            </div>

            <div>
              <div
                className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider uppercase"
                style={{ backgroundColor: meta.stripeColors[1] ?? "#666", color: meta.stripeColors[2] ?? "#fff" }}
              >
                {t("placement.languageTestBadge")}
              </div>
              <h1 className="text-4xl font-extrabold text-[var(--ink)] leading-tight">
                {langLabel}
                <br />
                <span style={{ color: meta.stripeColors[meta.stripeColors.length - 1] }}>
                  {t("placement.title")}
                </span>
              </h1>
              <p className="text-[var(--ink)]/60 mt-2 text-sm">{t("placement.tagline")}</p>
            </div>
          </div>

          {/* Bottom flag stripe bar */}
          <div className="absolute bottom-0 left-0 right-0 flex h-3">
            {[...meta.stripeColors].reverse().map((c, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

        {/* Status banner */}
        <div
          className="rounded-2xl p-6 flex items-start gap-4 border"
          style={{ backgroundColor: meta.accentLight, borderColor: meta.accentBorder }}
        >
          <div className="mt-0.5"><Icon d={ICONS.applications} size={22} /></div>
          <div>
            <p className="font-bold text-lg" style={{ color: meta.accent }}>{langLabel} {t("placement.title")}</p>
            <p className="text-[var(--ink-faint)] mt-1">
              <span className="font-semibold">{t("courses.statusLabel")}</span> {t("placement.noContent")}
            </p>
            <p className="text-[var(--ink-faint)] text-sm mt-1">
              {t("placement.adminNote")}
            </p>
          </div>
        </div>

        {/* Level cards */}
        <div>
          <h2 className="text-lg font-bold text-[var(--ink)] mb-4">{t("placement.testLevels")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 stagger">
            {LEVELS.map((lvl) => (
              <div
                key={lvl.code}
                className="bg-[var(--surface-2)] rounded-2xl-sm p-5 flex flex-col items-center gap-2 border opacity-70 card-lift"
                style={{ borderColor: meta.cardBorder }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold shadow-inner"
                  style={{ backgroundColor: meta.badgeBg, color: meta.badgeText }}
                >
                  {lvl.code}
                </div>
                <p className="text-sm font-semibold text-[var(--ink-dim)]">{lvl.label}</p>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: meta.tagBg, color: meta.tagText }}
                >
                  {t("placement.noQuestionsYet")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* How it will work */}
        <div className="bg-[var(--surface-2)] rounded-2xl border border-[rgba(255,255,255,0.07)] p-7">
          <div className="flex items-center gap-3 mb-6">
            {/* Mini flag stripe accent */}
            <div className="flex flex-col gap-0.5">
              {meta.stripeColors.map((c, i) => (
                <div key={i} className="w-1 h-3 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <h2 className="text-base font-bold text-[var(--ink)]">{t("placement.howTitle")}</h2>
          </div>
          <ol className="space-y-4">
            {[
              [ICONS.rocket,     t("placement.features.start"),     t("placement.features.startDesc")],
              [ICONS.trendingUp, t("placement.features.adaptive"),  t("placement.features.adaptiveDesc")],
              [ICONS.target,     t("placement.features.level"),     t("placement.features.levelDesc")],
              [ICONS.book,       t("placement.features.recommend"), t("placement.features.recommendDesc")],
            ].map(([icon, title, desc]) => (
              <li key={title} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: meta.stepBg, color: meta.accent }}
                >
                  <Icon d={icon} size={16} />
                </div>
                <div>
                  <p className="font-semibold text-[var(--ink)] text-sm">{title}</p>
                  <p className="text-xs text-[var(--ink-faint)] mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="text-center py-4 text-[var(--ink-dim)] text-sm">
          {t("placement.comingSoonNote")}
        </div>
      </div>
    </div>
  );
};

export default PlacementTestPage;

