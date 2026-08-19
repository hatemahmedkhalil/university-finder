import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon, ICONS } from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

/* ── colours (blue = the app's actual primary accent; the rest are
   deliberate per-plan/per-language decorative variety, same pattern as
   the Pipeline kanban badges and Simulators exam-type branding) ── */
const C = {
  blue:   "var(--accent)",
  gold:   "#f77f00",
  purple: "#8a50ea",
  green:  "#009639",
  red:    "#d73337",
  teal:   "#009597",
  bg:     "var(--bg)",
  card:   "var(--surface-2)",
  card2:  "var(--accent-subtle)",
  muted:  "var(--ink-dim)",
  dim:    "var(--border-strong)",
  border: "var(--border)",
};

const gradBlue = `linear-gradient(135deg, var(--accent), var(--accent-light))`;
const gradGold = `linear-gradient(135deg, #df6900, #de3b3d)`;

/* ── check / cross icons ── */
const Check = ({ color }) => (
  <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" style={{ color }}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);
const Cross = () => (
  <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" style={{ color: C.dim }}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

/* ── main plan card ── */
const PlanCard = ({ icon, name, price, subtitle, features, accent, grad, featured, ctaLabel, ctaTo, onCta, ctaLoading }) => (
  <div className="relative flex flex-col rounded-3xl transition-all duration-300 hover:-translate-y-2"
       style={{
         background: featured ? C.card2 : C.card,
         border: `2px solid ${featured ? accent + " / 0.45" : C.border}`,
         boxShadow: featured ? `0 0 48px ${accent} / 0.12` : "none",
         flex: 1,
       }}>
    {featured && (
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-[var(--ink)] whitespace-nowrap"
           style={{ background: grad }}>
        Most Popular
      </div>
    )}

    <div className="px-7 pt-8 pb-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: grad }}>
          <Icon d={icon} size={22} />
        </div>
        <h3 className="text-xl font-extrabold text-[var(--ink)]">{name}</h3>
      </div>

      <div className="flex items-end gap-1 mb-2">
        {price === 0 ? (
          <span className="text-5xl font-extrabold text-[var(--ink)] leading-none">Free</span>
        ) : (
          <>
            <span className="text-lg font-bold" style={{ color: C.muted }}>$</span>
            <span className="text-5xl font-extrabold text-[var(--ink)] leading-none">{price}</span>
            <span className="text-sm mb-1.5 font-medium" style={{ color: C.muted }}>/mo</span>
          </>
        )}
      </div>
      <p className="text-sm" style={{ color: "var(--ink-faint)" }}>{subtitle}</p>
    </div>

    <div className="mx-7" style={{ borderTop: `1px solid ${C.border}` }} />

    <div className="px-7 py-5 flex-1 flex flex-col gap-3">
      {features.map(({ label, included }, i) => (
        <div key={i} className="flex items-start gap-2.5">
          {included ? <Check color={accent} /> : <Cross />}
          <span className="text-sm" style={{ color: included ? "var(--ink-dim)" : C.dim }}>{label}</span>
        </div>
      ))}
    </div>

    <div className="px-7 pb-7">
      {onCta ? (
        <button onClick={onCta} disabled={ctaLoading}
          className="block w-full text-center py-3 rounded-2xl font-bold text-[var(--ink)] text-sm transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: grad }}>
          {ctaLoading ? "…" : ctaLabel}
        </button>
      ) : ctaTo ? (
        <Link to={ctaTo}
          className="block w-full text-center py-3 rounded-2xl font-bold text-[var(--ink)] text-sm transition hover:opacity-90"
          style={{ background: grad }}>
          {ctaLabel}
        </Link>
      ) : (
        <button disabled
          className="block w-full text-center py-3 rounded-2xl font-bold text-sm cursor-not-allowed"
          style={{ background: "var(--surface-2)", color: C.muted }}>
          {ctaLabel === "Coming Soon" ? <Icon d={ICONS.clock} size={12} className="inline -mt-0.5 me-1" /> : null}
          {ctaLabel || "Coming Soon"}
        </button>
      )}
    </div>
  </div>
);

/* ── course card (coming soon) ── */
const CourseCard = ({ flag, lang, levels, accent, grad }) => (
  <div className="flex flex-col rounded-3xl transition-all duration-300 hover:-translate-y-1"
       style={{ background: C.card, border: `2px solid ${C.border}` }}>
    <div className="px-6 pt-7 pb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: grad }}>
          {flag}
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-[var(--ink)]">{lang}</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `color-mix(in oklch, ${accent} 15%, transparent)`, color: accent }}>
            Language Course
          </span>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-4">
        {levels.map(l => (
          <span key={l} className="text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ background: "var(--surface-2)", color: C.muted }}>
            {l}
          </span>
        ))}
      </div>

      <p className="text-sm" style={{ color: C.muted }}>
        We take you from zero to university-ready. By the end you will meet the language requirements for college admission in Europe.
      </p>
    </div>

    <div className="mx-6" style={{ borderTop: `1px solid ${C.border}` }} />

    <div className="px-6 py-5 flex-1">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl font-extrabold text-[var(--ink)]">$500</span>
        <span className="text-sm" style={{ color: C.muted }}>full program</span>
      </div>
      <p className="text-xs" style={{ color: C.dim }}>Or start half — $250 beginner stage &nbsp;|&nbsp; $250 advanced stage</p>
    </div>

    <div className="px-6 pb-6">
      <button disabled
        className="block w-full text-center py-3 rounded-2xl font-bold text-sm cursor-not-allowed"
        style={{ background: "var(--surface-2)", color: C.muted }}>
        <Icon d={ICONS.clock} size={12} className="inline -mt-0.5 me-1" />Coming Soon
      </button>
    </div>
  </div>
);

/* ── placement test card ── */
const PlacementCard = () => (
  <div className="rounded-3xl p-7 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between"
       style={{ background: C.card, border: `2px solid ${C.border}` }}>
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0"
           style={{ background: `linear-gradient(135deg, #008c2f, #007c7f)` }}>
        <Icon d={ICONS.applications} size={24} />
      </div>
      <div>
        <h3 className="text-lg font-extrabold text-[var(--ink)] mb-0.5">Language Placement Test</h3>
        <p className="text-sm" style={{ color: C.muted }}>
          Find your exact language level before enrolling in any course. One-time test, instant result.
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {["German", "Polish", "English"].map(l => (
            <span key={l} className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                  style={{ background: "rgba(0,140,47,0.12)", color: C.green }}>
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>

    <div className="text-end shrink-0">
      <div className="flex items-end gap-1 justify-end mb-1">
        <span className="text-sm font-bold" style={{ color: C.muted }}>$</span>
        <span className="text-4xl font-extrabold text-[var(--ink)] leading-none">10</span>
        <span className="text-sm mb-1 font-medium" style={{ color: C.muted }}> one-time</span>
      </div>
      <p className="text-xs mb-3" style={{ color: C.dim }}>Free for Pro subscribers</p>
      <button disabled
        className="px-6 py-2.5 rounded-2xl font-bold text-sm cursor-not-allowed"
        style={{ background: "var(--surface-2)", color: C.muted }}>
        <Icon d={ICONS.clock} size={12} className="inline -mt-0.5 me-1" />Coming Soon
      </button>
    </div>
  </div>
);

/* ── FAQ ── */
const FAQS = [
  { q: "Can I upgrade from Free to Pro at any time?", a: "Yes, you can upgrade whenever you want. Your existing data and applications carry over automatically." },
  { q: "Is there a yearly plan?", a: "Yes — pay $150/year instead of $20/month and save 37%. Annual billing will be available at launch." },
  { q: "What happens when I hit the free limits?", a: "You'll be prompted to upgrade. Nothing is deleted — you just can't add more until you upgrade or wait for the monthly reset." },
  { q: "Do courses require a Pro subscription?", a: "No — courses are purchased separately with a one-time payment. Both Free and Pro users can buy them." },
];

const FAQ = () => {
  const [open, setOpen] = useState(null);
  return (
    <div className="max-w-2xl mx-auto">
      {FAQS.map((item, i) => (
        <div key={i} style={{ borderBottom: `1px solid ${C.border}` }} className="last:border-0">
          <button onClick={() => setOpen(open === i ? null : i)}
                  className="w-full text-left flex items-center justify-between py-5 gap-4">
            <span className="font-semibold text-[var(--ink)] text-sm">{item.q}</span>
            <svg className={`w-4 h-4 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}
                 style={{ color: C.muted }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open === i && <p className="pb-5 text-sm leading-relaxed" style={{ color: "var(--ink-faint)" }}>{item.a}</p>}
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════
   Main page
══════════════════════════════════════════ */
const Pricing = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [proPlan, setProPlan] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    api.get("/subscription-plans")
      .then(r => setProPlan(r.data.find(p => p.name === "Pro") || null))
      .catch(() => {});
  }, []);

  const handleUpgrade = async () => {
    if (!user) { navigate("/register"); return; }
    if (!proPlan) return;
    setCheckoutError("");
    setCheckingOut(true);
    try {
      const r = await api.post("/payments/checkout", { plan_id: proPlan.id });
      window.location.href = r.data.checkout_url;
    } catch (e) {
      setCheckoutError(e.response?.data?.detail || "Could not start checkout. Please try again.");
      setCheckingOut(false);
    }
  };

  const FREE_FEATURES = [
    { label: "Browse all universities & scholarships", included: true },
    { label: "AI recommendations — 3 total", included: true },
    { label: "Applications — 2 total", included: true },
    { label: "AI chat — 10 messages / day", included: true },
    { label: "Q&A with instructors", included: true },
    { label: "Announcements & notifications", included: true },
    { label: "Exam simulators (IELTS, TOEFL, Cambridge)", included: false },
    { label: "Language courses", included: false },
    { label: "Placement tests (available at $10)", included: false },
  ];

  const PRO_FEATURES = [
    { label: "Everything in Free — unlimited", included: true },
    { label: "Unlimited AI recommendations", included: true },
    { label: "Unlimited applications", included: true },
    { label: "Unlimited AI chat", included: true },
    { label: "All exam simulators (IELTS, TOEFL, Cambridge)", included: true },
    { label: "Placement tests — included free", included: true },
    { label: "Priority support", included: true },
    { label: "Language courses (purchased separately)", included: false },
  ];

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: "var(--ink)" }}>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: "var(--bg)" }}>
        <div className="absolute -top-32 -start-16 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
             style={{ background: "rgba(129,70,224,0.15)" }} />
        <div className="absolute -bottom-16 end-24 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
             style={{ background: "rgba(36,86,211,0.12)" }} />
        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold mb-6"
               style={{ background: "rgba(129,70,224,0.12)", border: "1px solid rgba(129,70,224,0.28)", color: "#dccdff" }}>
            Simple Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4 text-[var(--ink)]">
            One plan. Everything you need.
          </h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--ink-faint)" }}>
            Start free and upgrade when you're ready. No hidden fees, cancel anytime.
          </p>
        </div>
      </div>

      {/* ══ SECTION 1 — Subscription Plans ══ */}
      <div className="max-w-4xl mx-auto px-6 pt-14 pb-6">
        <h2 className="text-2xl font-extrabold text-[var(--ink)] mb-2">Subscription Plans</h2>
        <p className="text-sm mb-8" style={{ color: C.muted }}>Choose the plan that fits your journey.</p>

        <div className="flex flex-col sm:flex-row gap-6">
          <PlanCard
            icon={ICONS.graduationCap}
            name="Student"
            price={0}
            subtitle="Everything you need to discover universities and start your application journey."
            features={FREE_FEATURES}
            accent={C.blue}
            grad={gradBlue}
            featured={false}
            ctaLabel="Get Started Free"
            ctaTo="/register"
          />
          <PlanCard
            icon={ICONS.rocket}
            name="Pro"
            price={proPlan?.price ?? 20}
            subtitle="Unlimited access to all features. The complete toolkit for serious applicants."
            features={PRO_FEATURES}
            accent={C.gold}
            grad={gradGold}
            featured={true}
            ctaLabel={user?.plan === "pro" ? "Your Current Plan" : "Upgrade to Pro"}
            onCta={user && user.plan !== "pro" && proPlan ? handleUpgrade : undefined}
            ctaLoading={checkingOut}
            ctaTo={!user ? "/register" : null}
          />
        </div>

        {checkoutError && (
          <p className="text-center text-sm mt-4 font-semibold" style={{ color: "var(--danger)" }}>{checkoutError}</p>
        )}

        <p className="text-center text-xs mt-5" style={{ color: C.dim }}>
          Yearly plan available at $150/year — save 37% · Cancel anytime
        </p>
      </div>

      {/* ══ SECTION 2 — Placement Test ══ */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-extrabold text-[var(--ink)] mb-2">Placement Test</h2>
        <p className="text-sm mb-6" style={{ color: C.muted }}>
          Not sure about your current level? Take the test before choosing a course.
        </p>
        <PlacementCard />
      </div>

      {/* ══ SECTION 3 — Language Courses ══ */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-extrabold text-[var(--ink)] mb-2">Language Courses</h2>
        <p className="text-sm mb-6" style={{ color: C.muted }}>
          Structured language learning — available to all users, purchased separately.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <CourseCard
            flag="🇩🇪"
            lang="German"
            levels={["A1", "A2", "B1", "B2"]}
            accent={C.gold}
            grad={`linear-gradient(135deg, #df6900, #8a3819)`}
          />
          <CourseCard
            flag="🇵🇱"
            lang="Polish"
            levels={["A1", "A2", "B1", "B2"]}
            accent={C.red}
            grad={`linear-gradient(135deg, #d73337, #9c334b)`}
          />
          <CourseCard
            flag="🇬🇧"
            lang="English"
            levels={["A1", "A2", "B1", "B2"]}
            accent={C.blue}
            grad={gradBlue}
          />
        </div>
      </div>

      {/* ══ FAQ ══ */}
      <div className="py-16" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-[var(--ink)] text-center mb-8">Frequently Asked Questions</h2>
          <FAQ />
        </div>
      </div>

      {/* ── Bottom CTA (fixed dark gradient banner — deliberate, same pattern as
           the Universities.jsx hero photo: text/border stay constant since the
           background never adapts to theme) ── */}
      <div className="py-16" style={{ background: "linear-gradient(135deg, #2d1e4b, #1a3a6b)", color: "#fff" }}>
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-extrabold mb-3">Start your journey today</h2>
          <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.75)" }}>
            Free forever. Upgrade when you're ready. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register"
              className="font-bold px-8 py-3 rounded-2xl text-sm transition hover:opacity-90"
              style={{ background: gradGold, color: "#fff" }}>
              Get Started Free
            </Link>
            <Link to="/universities"
              className="font-semibold px-8 py-3 rounded-2xl text-sm transition"
              style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.20)", color: "#fff" }}>
              Browse Universities
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
