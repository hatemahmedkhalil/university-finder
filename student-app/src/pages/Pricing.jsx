import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

/* ── Plan icons ── */
const PLAN_META = {
  Free:    { icon: "🚗", accent: "oklch(0.55 0.18 220)", gradStyle: "linear-gradient(135deg, oklch(0.50 0.18 220), oklch(0.55 0.22 264))" },
  Premium: { icon: "✈️", accent: "oklch(0.55 0.22 296)", gradStyle: "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))" },
  Pro:     { icon: "🚀", accent: "oklch(0.65 0.18 55)",  gradStyle: "linear-gradient(135deg, oklch(0.65 0.18 55),  oklch(0.60 0.20 25))" },
};

const ClockIcon = () => (
  <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" style={{ color: "oklch(0.45 0.02 285)" }}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

/* ── Hardcoded plan badges / CTA since DB is placeholder ── */
const PLAN_EXTRAS = {
  Free:    { badge: "Most Popular for Beginners", cta: null,          ctaLabel: "Get Started Free", ctaTo: "/register" },
  Premium: { badge: null,                         cta: "coming-soon", ctaLabel: "Coming Soon",      ctaTo: null },
  Pro:     { badge: null,                         cta: "coming-soon", ctaLabel: "Coming Soon",      ctaTo: null },
};

/* ── Single plan card ── */
const PlanCard = ({ plan }) => {
  const { t } = useTranslation();
  const meta   = PLAN_META[plan.name] ?? { icon: "📦", accent: "oklch(0.55 0.18 220)", gradStyle: "linear-gradient(135deg,oklch(0.50 0.18 220),oklch(0.55 0.22 264))" };
  const extras = PLAN_EXTRAS[plan.name] ?? { badge: null, cta: null, ctaLabel: "Get Started", ctaTo: "/register" };
  const isComingSoon = plan.price === null;
  const featured = plan.is_featured;

  return (
    <div className="relative flex flex-col rounded-3xl transition-all duration-300 hover:-translate-y-2"
         style={{
           background: featured ? "oklch(0.19 0.028 285)" : "oklch(0.17 0.02 285)",
           border: `2px solid ${featured ? meta.accent + " / 0.50" : "oklch(1 0 0 / 0.08)"}`,
           boxShadow: featured ? `0 0 40px ${meta.accent} / 0.15` : "none",
         }}>

      {featured && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
             style={{ background: meta.gradStyle }}>
          ✦ {t("pricing.recommended")}
        </div>
      )}

      <div className="px-7 pt-8 pb-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
               style={{ background: meta.gradStyle }}>
            {meta.icon}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
            {extras.badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 block"
                    style={{ background: `color-mix(in oklch, ${meta.accent} 15%, transparent)`, color: meta.accent }}>
                {extras.badge}
              </span>
            )}
          </div>
        </div>

        <div className="mb-3">
          {isComingSoon ? (
            <div className="flex items-end gap-1">
              <span className="text-4xl font-extrabold" style={{ color: "oklch(0.35 0.02 285)" }}>---</span>
              <span className="text-sm mb-1.5 font-medium" style={{ color: "oklch(0.45 0.02 285)" }}>USD {t("pricing.mo")}</span>
            </div>
          ) : (
            <div className="flex items-end gap-1">
              <span className="text-lg font-bold" style={{ color: "oklch(0.55 0.02 285)" }}>$</span>
              <span className="text-5xl font-extrabold text-white leading-none">{plan.price}</span>
              <span className="text-sm mb-1.5 font-medium" style={{ color: "oklch(0.45 0.02 285)" }}>{t("pricing.mo")}</span>
            </div>
          )}
        </div>

        <p className="text-sm" style={{ color: isComingSoon ? "oklch(0.45 0.02 285)" : "oklch(0.60 0.02 285)" }}>
          {plan.description}
        </p>
      </div>

      <div className="mx-7" style={{ borderTop: "1px solid oklch(1 0 0 / 0.07)" }} />

      <div className="px-7 py-5 flex-1 flex flex-col gap-3">
        {isComingSoon ? (
          <div className="flex items-start gap-2.5" style={{ color: "oklch(0.45 0.02 285)" }}>
            <ClockIcon color="oklch(0.45 0.02 285)" />
            <span className="text-sm italic">{t("pricing.featuresComingSoon")}</span>
          </div>
        ) : (
          plan.features.map((feat, i) => {
            const isCrossed = feat.startsWith("No ");
            return (
              <div key={i} className="flex items-start gap-2.5">
                {isCrossed ? (
                  <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor"
                       style={{ color: "oklch(0.35 0.02 285)" }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor"
                       style={{ color: meta.accent }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-sm" style={{ color: isCrossed ? "oklch(0.40 0.02 285)" : "oklch(0.80 0.01 285)" }}>{feat}</span>
              </div>
            );
          })
        )}
      </div>

      <div className="px-7 pb-7">
        {extras.ctaTo ? (
          <Link to={extras.ctaTo}
            className="block w-full text-center py-3 rounded-2xl font-bold text-white text-sm transition hover:opacity-90"
            style={{ background: meta.gradStyle }}>
            {t("pricing.getStartedFree")}
          </Link>
        ) : (
          <button disabled
            className="block w-full text-center py-3 rounded-2xl font-bold text-sm cursor-not-allowed"
            style={{ background: "oklch(0.22 0.024 285)", color: "oklch(0.45 0.02 285)" }}>
            🕐 {t("pricing.comingSoon")}
          </button>
        )}
      </div>
    </div>
  );
};

const FAQ = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  const faqs = [
    { q: t("pricing.faq.q1"), a: t("pricing.faq.a1") },
    { q: t("pricing.faq.q2"), a: t("pricing.faq.a2") },
    { q: t("pricing.faq.q3"), a: t("pricing.faq.a3") },
    { q: t("pricing.faq.q4"), a: t("pricing.faq.a4") },
  ];
  return (
    <div className="max-w-2xl mx-auto">
      {faqs.map((item, i) => (
        <div key={i} className="border-b border-[oklch(1_0_0/0.07)] last:border-0">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full text-left flex items-center justify-between py-5 gap-4"
          >
            <span className="font-semibold text-white text-sm">{item.q}</span>
            <svg
              className={`w-4 h-4 text-[oklch(0.45_0.02_285)] shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open === i && (
            <p className="pb-5 text-sm text-[oklch(0.55_0.02_285)] leading-relaxed">{item.a}</p>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Main page ── */
const Pricing = () => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/subscription-plans")
      .then(r => setPlans(r.data))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  /* Fallback static plans if API fails or is empty */
  const displayed = plans.length > 0 ? plans : [
    { id: 1, name: "Free",    price: 0,    description: "Get started with basic university recommendations.", features: ["Up to 3 university recommendations","Basic matching system","No detailed university information","No premium support"], is_active: true, is_featured: true  },
    { id: 2, name: "Premium", price: null, description: "Coming Soon", features: [], is_active: true, is_featured: false },
    { id: 3, name: "Pro",     price: null, description: "Coming Soon", features: [], is_active: true, is_featured: false },
  ];

  const mainGrad = "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))";

  return (
    <div className="min-h-screen bg-[oklch(0.13_0.018_285)] text-[oklch(0.96_0.006_285)]">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: "oklch(0.15 0.020 285)" }}>
        <div className="absolute -top-32 -start-16 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
             style={{ background: "oklch(0.55 0.22 296 / 0.15)" }} />
        <div className="absolute -bottom-16 end-24 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
             style={{ background: "oklch(0.50 0.20 264 / 0.12)" }} />
        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold mb-6"
               style={{ background: "oklch(0.55 0.22 296 / 0.12)", border: "1px solid oklch(0.55 0.22 296 / 0.28)", color: "oklch(0.88 0.08 296)" }}>
            💳 {t("pricing.badge")}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4 text-white">
            {t("pricing.title")}
          </h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "oklch(0.65 0.04 296)" }}>
            {t("pricing.subtitle")}
          </p>
        </div>
      </div>

      {/* ── Plans ── */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-3xl h-96 animate-pulse"
                   style={{ background: "oklch(0.17 0.02 285)", border: "2px solid oklch(1 0 0 / 0.08)" }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {displayed.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
        <p className="text-center text-xs mt-6" style={{ color: "oklch(0.45 0.02 285)" }}>{t("pricing.note")}</p>
      </div>

      {/* ── Feature comparison teaser ── */}
      <div className="py-14" style={{ background: "oklch(0.15 0.020 285)", borderTop: "1px solid oklch(1 0 0 / 0.07)", borderBottom: "1px solid oklch(1 0 0 / 0.07)" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-3">{t("pricing.comparison.title")}</h2>
          <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: "oklch(0.55 0.02 285)" }}>
            {t("pricing.comparison.subtitle")}
          </p>
          <div className="inline-flex items-center gap-3 rounded-2xl px-6 py-4 text-sm font-medium"
               style={{ background: "oklch(0.55 0.22 296 / 0.10)", border: "1px solid oklch(0.55 0.22 296 / 0.25)", color: "oklch(0.85 0.10 296)" }}>
            <span className="text-2xl">🔔</span>
            <span>{t("pricing.comparison.notify")}</span>
          </div>
        </div>
      </div>

      {/* ── Why UniPath ── */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-extrabold text-white text-center mb-10">{t("pricing.why.title")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: "🎯", title: t("pricing.why.matching.title"), desc: t("pricing.why.matching.desc") },
            { icon: "🌍", title: t("pricing.why.europe.title"),   desc: t("pricing.why.europe.desc")   },
            { icon: "💬", title: t("pricing.why.chat.title"),     desc: t("pricing.why.chat.desc")     },
            { icon: "📋", title: t("pricing.why.tracker.title"),  desc: t("pricing.why.tracker.desc")  },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="rounded-2xl p-6 text-center transition-all duration-200 hover:-translate-y-1"
                 style={{ background: "oklch(0.17 0.02 285)", border: "1px solid oklch(1 0 0 / 0.07)" }}>
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "oklch(0.55 0.02 285)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="py-16" style={{ borderTop: "1px solid oklch(1 0 0 / 0.07)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-white text-center mb-8">{t("pricing.faq.title")}</h2>
          <FAQ />
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="py-16 text-white" style={{ background: "linear-gradient(135deg, oklch(0.28 0.08 296), oklch(0.22 0.06 264))" }}>
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-extrabold mb-3">{t("pricing.cta.title")}</h2>
          <p className="text-sm mb-8" style={{ color: "oklch(0.75 0.06 296)" }}>{t("pricing.cta.subtitle")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register"
              className="font-bold px-8 py-3 rounded-2xl text-sm transition hover:opacity-90 text-white"
              style={{ background: mainGrad }}>
              🚀 {t("pricing.cta.start")}
            </Link>
            <Link to="/universities"
              className="font-semibold px-8 py-3 rounded-2xl text-sm transition text-white"
              style={{ background: "oklch(1 0 0 / 0.08)", border: "1px solid oklch(1 0 0 / 0.20)" }}>
              {t("pricing.cta.browse")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;

