import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

const LANG_META = {
  english: {
    label: "English",
    flagSrc: "https://flagcdn.com/w80/gb.png",
    // Union Jack: navy, red, white
    heroBg: "bg-[#00247D]",
    heroStripe: "bg-[#CF142B]",
    accent: "#CF142B",
    accentLight: "#fff0f0",
    accentBorder: "#fca5a5",
    accentText: "#b91c1c",
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
    label: "German",
    flagSrc: "https://flagcdn.com/w80/de.png",
    // Germany: black, red, gold
    heroBg: "bg-[#1a1a1a]",
    heroStripe: "bg-[#DD0000]",
    accent: "#DD0000",
    accentLight: "#fff5f5",
    accentBorder: "#fca5a5",
    accentText: "#b91c1c",
    badgeBg: "#1a1a1a",
    badgeText: "#FFCE00",
    cardBorder: "#fde68a",
    cardAccent: "#b45309",
    stepBg: "#fffbeb",
    tagBg: "#fef3c7",
    tagText: "#92400e",
    stripeColors: ["#1a1a1a", "#DD0000", "#FFCE00"],
  },
  polish: {
    label: "Polish",
    flagSrc: "https://flagcdn.com/w80/pl.png",
    // Poland: white top, red bottom
    heroBg: "bg-[#DC143C]",
    heroStripe: "bg-white",
    accent: "#DC143C",
    accentLight: "#fff0f3",
    accentBorder: "#fda4af",
    accentText: "#9f1239",
    badgeBg: "#DC143C",
    badgeText: "#fff",
    cardBorder: "#fda4af",
    cardAccent: "#be123c",
    stepBg: "#fff1f2",
    tagBg: "#ffe4e6",
    tagText: "#9f1239",
    stripeColors: ["#FFFFFF", "#DC143C"],
  },
};

const PlacementTestPage = () => {
  const { t } = useTranslation();

  const LEVELS = [
    { code: "A1", label: t("placement.levels.A1") },
    { code: "A2", label: t("placement.levels.A2") },
    { code: "B1", label: t("placement.levels.B1") },
    { code: "B2", label: t("placement.levels.B2") },
    { code: "C1", label: t("placement.levels.C1") },
    { code: "C2", label: t("placement.levels.C2") },
  ];
  const { language } = useParams();
  const meta = LANG_META[language] ?? LANG_META.english;
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/learning/placement-tests?language=${language}`)
      .then((r) => setTests(r.data))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, [language]);

  return (
    <div className="min-h-screen bg-gray-50">

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
          <Link to="/learning" className="inline-flex items-center gap-1 text-white/60 hover:text-white text-sm mb-8 transition">
            ← Learning Center
          </Link>

          <div className="flex items-center gap-6">
            {/* Flag */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
                <img src={meta.flagSrc} alt={meta.label} className="w-full h-full object-cover" />
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
                Language Test
              </div>
              <h1 className="text-4xl font-extrabold text-white leading-tight">
                {meta.label}
                <br />
                <span style={{ color: meta.stripeColors[meta.stripeColors.length - 1] }}>
                  Placement Test
                </span>
              </h1>
              <p className="text-white/60 mt-2 text-sm">Discover your current language level · A1 → C2</p>
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
          <div className="text-3xl mt-0.5">📝</div>
          <div>
            <p className="font-bold text-lg" style={{ color: meta.accent }}>{meta.label} Placement Test</p>
            <p className="text-gray-600 mt-1">
              <span className="font-semibold">Status:</span> No content available yet.
            </p>
            <p className="text-gray-500 text-sm mt-1">
              This section is ready for future content. Questions will be added by an administrator.
            </p>
          </div>
        </div>

        {/* Level cards */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">{t("placement.testLevels")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 stagger">
            {LEVELS.map((lvl) => (
              <div
                key={lvl.code}
                className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center gap-2 border opacity-70 card-lift"
                style={{ borderColor: meta.cardBorder }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold shadow-inner"
                  style={{ backgroundColor: meta.badgeBg, color: meta.badgeText }}
                >
                  {lvl.code}
                </div>
                <p className="text-sm font-semibold text-gray-700">{lvl.label}</p>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: meta.tagBg, color: meta.tagText }}
                >
                  No questions yet
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* How it will work */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <div className="flex items-center gap-3 mb-6">
            {/* Mini flag stripe accent */}
            <div className="flex flex-col gap-0.5">
              {meta.stripeColors.map((c, i) => (
                <div key={i} className="w-1 h-3 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <h2 className="text-base font-bold text-gray-800">{t("placement.howTitle")}</h2>
          </div>
          <ol className="space-y-4">
            {[
              ["🚀", t("placement.features.start"),     t("placement.features.startDesc")],
              ["📊", t("placement.features.adaptive"),  t("placement.features.adaptiveDesc")],
              ["🎯", t("placement.features.level"),     t("placement.features.levelDesc")],
              ["📚", t("placement.features.recommend"), t("placement.features.recommendDesc")],
            ].map(([icon, title, desc], i) => (
              <li key={title} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ backgroundColor: meta.stepBg }}
                >
                  {icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="text-center py-4 text-gray-400 text-sm">
          🔒 Test content will appear here once added by an admin. Check back soon.
        </div>
      </div>
    </div>
  );
};

export default PlacementTestPage;
