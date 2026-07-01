import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

/* ── Plan icons ── */
const PLAN_META = {
  Free:    { icon: "🚗", color: "blue",   gradient: "from-blue-500 to-indigo-600" },
  Premium: { icon: "✈️", color: "purple", gradient: "from-purple-500 to-pink-600" },
  Pro:     { icon: "🚀", color: "amber",  gradient: "from-amber-400 to-orange-500" },
};

const COLOR = {
  blue:   { ring: "ring-blue-500",   btn: "bg-blue-600 hover:bg-blue-700",   badge: "bg-blue-100 text-blue-700",   check: "text-blue-500",  bg: "bg-blue-50"   },
  purple: { ring: "ring-purple-500", btn: "bg-purple-600 hover:bg-purple-700", badge: "bg-purple-100 text-purple-700", check: "text-purple-500", bg: "bg-purple-50" },
  amber:  { ring: "ring-amber-500",  btn: "bg-amber-500 hover:bg-amber-600",  badge: "bg-amber-100 text-amber-700",  check: "text-amber-500", bg: "bg-amber-50"  },
};

const CheckIcon = ({ color }) => (
  <svg className={`w-4 h-4 shrink-0 mt-0.5 ${color}`} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = ({ color }) => (
  <svg className={`w-4 h-4 shrink-0 mt-0.5 ${color}`} viewBox="0 0 20 20" fill="currentColor">
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
const PlanCard = ({ plan, index }) => {
  const { t } = useTranslation();
  const meta   = PLAN_META[plan.name] ?? { icon: "📦", color: "blue", gradient: "from-blue-500 to-indigo-600" };
  const colors = COLOR[meta.color];
  const extras = PLAN_EXTRAS[plan.name] ?? { badge: null, cta: null, ctaLabel: "Get Started", ctaTo: "/register" };
  const isFree = plan.price === 0;
  const isComingSoon = plan.price === null;
  const featured = plan.is_featured;

  return (
    <div
      className={`
        relative flex flex-col bg-white rounded-3xl border-2 shadow-sm
        transition-all duration-300 hover:-translate-y-2 hover:shadow-xl
        ${featured ? `${colors.ring} ring-2 shadow-lg` : "border-gray-100"}
      `}
    >
      {/* Featured ribbon */}
      {featured && (
        <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${meta.gradient} shadow`}>
          ✦ {t("pricing.recommended")}
        </div>
      )}

      {/* Card header */}
      <div className={`px-8 pt-8 pb-6 rounded-t-3xl ${featured ? colors.bg : ""}`}>
        {/* Icon + name */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-2xl shadow-sm`}>
            {meta.icon}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">{plan.name}</h3>
            {extras.badge && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                {extras.badge}
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="mb-2">
          {isComingSoon ? (
            <div className="flex items-end gap-1">
              <span className="text-4xl font-extrabold text-gray-300">---</span>
              <span className="text-gray-400 text-sm mb-1.5 font-medium">USD {t("pricing.mo")}</span>
            </div>
          ) : (
            <div className="flex items-end gap-1">
              <span className="text-lg font-bold text-gray-500">$</span>
              <span className="text-5xl font-extrabold text-gray-900 leading-none">{plan.price}</span>
              <span className="text-gray-400 text-sm mb-1.5 font-medium">{t("pricing.mo")}</span>
            </div>
          )}
        </div>

        <p className={`text-sm ${isComingSoon ? "text-gray-400 italic" : "text-gray-500"}`}>
          {plan.description}
        </p>
      </div>

      {/* Divider */}
      <div className="mx-8 border-t border-gray-100" />

      {/* Features */}
      <div className="px-8 py-6 flex-1 flex flex-col gap-3">
        {isComingSoon ? (
          <div className="flex items-start gap-2.5 text-gray-400">
            <ClockIcon color={colors.check} />
            <span className="text-sm italic">{t("pricing.featuresComingSoon")}</span>
          </div>
        ) : (
          plan.features.map((feat, i) => {
            const isCrossed = feat.startsWith("No ");
            return (
              <div key={i} className="flex items-start gap-2.5">
                {isCrossed ? (
                  <svg className="w-4 h-4 shrink-0 mt-0.5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <CheckIcon color={colors.check} />
                )}
                <span className={`text-sm ${isCrossed ? "text-gray-400" : "text-gray-700"}`}>{feat}</span>
              </div>
            );
          })
        )}
      </div>

      {/* CTA */}
      <div className="px-8 pb-8">
        {extras.ctaTo ? (
          <Link
            to={extras.ctaTo}
            className={`block w-full text-center py-3 rounded-2xl font-bold text-white text-sm transition ${colors.btn} shadow-sm hover:shadow-md`}
          >
            {t("pricing.getStartedFree")}
          </Link>
        ) : (
          <button
            disabled
            className="block w-full text-center py-3 rounded-2xl font-bold text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
          >
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
        <div key={i} className="border-b border-gray-100 last:border-0">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full text-left flex items-center justify-between py-5 gap-4"
          >
            <span className="font-semibold text-gray-800 text-sm">{item.q}</span>
            <svg
              className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open === i && (
            <p className="pb-5 text-sm text-gray-500 leading-relaxed">{item.a}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-800 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-6 left-1/4 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-sm font-bold mb-6">
            💳 {t("pricing.badge")}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
            {t("pricing.title")}
          </h1>
          <p className="text-indigo-200 text-lg max-w-xl mx-auto">
            {t("pricing.subtitle")}
          </p>
        </div>
      </div>

      {/* ── Plans ── */}
      <div className="max-w-5xl mx-auto px-4 -mt-8 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl border-2 border-gray-100 h-96 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 stagger">
            {displayed.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} index={i} />
            ))}
          </div>
        )}

        {/* Note */}
        <p className="text-center text-xs text-gray-400 mt-6">{t("pricing.note")}</p>
      </div>

      {/* ── Feature comparison teaser ── */}
      <div className="bg-white border-y border-gray-100 py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">{t("pricing.comparison.title")}</h2>
          <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
            {t("pricing.comparison.subtitle")}
          </p>
          <div className="inline-flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-4 text-indigo-700 text-sm font-medium">
            <span className="text-2xl">🔔</span>
            <span>{t("pricing.comparison.notify")}</span>
          </div>
        </div>
      </div>

      {/* ── Why UniFind ── */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">{t("pricing.why.title")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: "🎯", title: t("pricing.why.matching.title"), desc: t("pricing.why.matching.desc") },
            { icon: "🌍", title: t("pricing.why.europe.title"),   desc: t("pricing.why.europe.desc")   },
            { icon: "💬", title: t("pricing.why.chat.title"),     desc: t("pricing.why.chat.desc")     },
            { icon: "📋", title: t("pricing.why.tracker.title"),  desc: t("pricing.why.tracker.desc")  },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center hover:shadow-md transition">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-bold text-gray-800 text-sm mb-1">{title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-8">{t("pricing.faq.title")}</h2>
          <FAQ />
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="bg-gradient-to-br from-indigo-700 to-blue-800 text-white py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold mb-3">{t("pricing.cta.title")}</h2>
          <p className="text-indigo-200 text-sm mb-8">{t("pricing.cta.subtitle")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="bg-white text-indigo-700 font-bold px-8 py-3 rounded-2xl hover:bg-indigo-50 transition shadow text-sm"
            >
              🚀 {t("pricing.cta.start")}
            </Link>
            <Link
              to="/universities"
              className="bg-white/15 border border-white/30 text-white font-semibold px-8 py-3 rounded-2xl hover:bg-white/25 transition text-sm"
            >
              {t("pricing.cta.browse")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
