import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import GettingStarted from "../components/GettingStarted";
import { COUNTRY_FLAG } from "../lib/countries";
import { Icon, ICONS } from "../components/Sidebar";

/* ── design tokens (see index.css .app-shell) ── */
const CARD    = "var(--surface-2)";
const SURFACE = "var(--surface)";
const BORDER  = "var(--border)";
const GRAD    = "linear-gradient(120deg, var(--accent) 0%, var(--accent-light) 100%)";
const DIM     = "var(--ink-dim)";
const FAINT   = "var(--ink-faint)";

const UNI_PHOTOS = [
  "https://images.unsplash.com/photo-1562774053-701939374585?w=500&q=70",
  "https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=500&q=70",
  "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=500&q=70",
];

const COUNTRY_PHOTOS = {
  Germany:     "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=500&q=70",
  Poland:      "https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=500&q=70",
  Netherlands: "https://images.unsplash.com/photo-1557251407-6356f6384370?w=500&q=70",
  Romania:     "https://images.unsplash.com/photo-1651427327856-402d6d856667?w=500&q=70",
  Austria:     "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=500&q=70",
  France:      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&q=70",
  Sweden:      "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=500&q=70",
  Italy:       "https://images.unsplash.com/photo-1533676802871-eca1ae998cd5?w=500&q=70",
  Spain:       "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=500&q=70",
};
const POPULAR_COUNTRIES = ["Germany", "Poland", "Netherlands", "Romania", "Austria"];

/* ── profile completion ── */
const calcCompletion = p => {
  if (!p) return 0;
  const fields = [p.nationality, p.gpa, p.budget_eur, p.english_level, p.field_of_study, p.preferred_countries, p.language, p.degree_level];
  return Math.round(fields.filter(f => f != null && f !== "").length / fields.length * 100);
};

/* ── count-up hook ── */
const useCountUp = (target, dur = 700) => {
  const [v, setV] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (!target) { setV(0); return; }
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, dur]);
  return v;
};

/* ── email verification banner ── */
const VerifBanner = ({ email }) => {
  const { t } = useTranslation();
  const [gone, setGone] = useState(() => sessionStorage.getItem("vb") === "1");
  const [busy, setBusy] = useState(false);
  if (gone) return null;
  const resend = async () => {
    setBusy(true);
    try { await api.post("/auth/resend-verification"); toast.success(t("verification.success")); }
    catch (e) { toast.error(e?.response?.data?.detail || t("verification.failedSend")); }
    finally { setBusy(false); }
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm"
         style={{ background: CARD, border: "1px solid rgba(245,158,11,0.28)" }}>
      <Icon d={ICONS.mail} size={20} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-semibold" style={{ color: "var(--warn)" }}>{t("verification.title")} </span>
        <span style={{ color: DIM }}>{t("verification.sent")} </span>
        <span className="font-mono font-semibold" style={{ color: "var(--warn)" }}>{email}</span>
      </div>
      <button onClick={resend} disabled={busy}
        className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
        style={{ background: "var(--warn-subtle)", color: "var(--warn)" }}>
        {busy ? t("verification.sending") : t("verification.resend")}
      </button>
      <button onClick={() => { sessionStorage.setItem("vb", "1"); setGone(true); }}
              className="text-lg leading-none shrink-0" style={{ color: "var(--warn)" }}>×</button>
    </div>
  );
};

/* ── AI Advisor insight card ── */
const INSIGHT_STYLES = {
  warning:  { bg: "var(--danger-subtle)", border: "rgba(239,68,68,0.28)",  color: "var(--danger)", icon: "alertTriangle" },
  deadline: { bg: "var(--warn-subtle)",   border: "rgba(245,158,11,0.28)", color: "var(--warn)",   icon: "clock" },
  tip:      { bg: "var(--accent-subtle)", border: "rgba(14,165,233,0.28)", color: "var(--accent)", icon: "lightbulb" },
  success:  { bg: "var(--good-subtle)",   border: "rgba(16,185,129,0.28)", color: "var(--good)",   icon: "check" },
};

const AiAdvisorCard = () => {
  const [insights, setInsights] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);

  useEffect(() => {
    api.get("/ai-chat/advisor-insights")
      .then(r => setInsights(r.data?.insights || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card rounded-3xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <h2 className="font-bold text-sm text-[var(--ink)]">AI Advisor</h2>
          <p className="text-[11px]" style={{ color: FAINT }}>Personalized tips for you</p>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: GRAD }}><Icon d={ICONS.aichat} size={17} /></div>
      </div>
      <div className="p-4 space-y-2.5">
        {loading ? (
          [0, 1].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: SURFACE }} />)
        ) : error || insights.length === 0 ? (
          <div className="rounded-2xl px-4 py-3.5" style={{ background: "var(--accent-subtle)" }}>
            <p className="text-xs leading-relaxed mb-2.5" style={{ color: "var(--ink)" }}>
              Complete your profile to get personalized tips tailored to your goals.
            </p>
            <Link to="/profile" className="text-xs font-bold inline-flex items-center gap-1" style={{ color: "var(--accent)" }}>
              Complete profile →
            </Link>
          </div>
        ) : (
          insights.slice(0, 3).map((ins, i) => {
            const s = INSIGHT_STYLES[ins.type] || INSIGHT_STYLES.tip;
            return (
              <div key={i} className="rounded-2xl px-4 py-3.5" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <p className="text-xs leading-relaxed" style={{ color: "var(--ink)" }}>
                  <Icon d={ICONS[s.icon]} size={12} className="inline me-1 -mt-0.5" />{ins.message}
                </p>
                {ins.link && (
                  <Link to={ins.link} className="mt-2 inline-flex text-[11px] font-bold" style={{ color: s.color }}>
                    Take action →
                  </Link>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ── Journey roadmap — horizontal stepper ── */
const Journey = ({ steps, arrow }) => (
  <div className="card rounded-3xl px-6 py-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="font-bold text-[15px] text-[var(--ink)]">Your Journey</h2>
      <Link to="/pipeline" className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
        View Journey {arrow}
      </Link>
    </div>
    <div className="relative flex items-start justify-between">
      <div className="absolute top-5 start-5 end-5 h-0.5" style={{ background: "var(--border)" }} />
      <div
        className="absolute top-5 start-5 h-0.5 transition-all duration-700 ease-out"
        style={{
          background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
          width: `${(steps.filter(s => s.status === "done").length / (steps.length - 1)) * 100}%`,
          maxWidth: "calc(100% - 40px)",
        }}
      />
      {steps.map((s, i) => (
        <div key={s.label} className="relative flex flex-col items-center gap-2" style={{ flex: i === 0 || i === steps.length - 1 ? "0 0 auto" : 1 }}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300"
            style={
              s.status === "done"
                ? { background: "var(--accent)", color: "var(--on-accent)", boxShadow: "0 0 0 4px var(--accent-subtle)" }
                : s.status === "current"
                ? { background: SURFACE, color: "var(--accent)", border: "2px solid var(--accent)" }
                : { background: SURFACE, color: FAINT, border: "2px solid var(--border)" }
            }
          >
            {s.status === "done" ? "✓" : i + 1}
          </div>
          <div className="text-center">
            <p className="text-[11.5px] font-bold whitespace-nowrap" style={{ color: s.status === "upcoming" ? FAINT : "var(--ink)" }}>{s.label}</p>
            <p className="text-[10px] font-medium" style={{ color: s.status === "done" ? "var(--good)" : s.status === "current" ? "var(--accent)" : FAINT }}>
              {s.status === "done" ? "Completed" : s.status === "current" ? "In Progress" : "Upcoming"}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── Upcoming Deadlines — vertical timeline ── */
const DeadlinesTimeline = ({ deadlines, loading }) => {
  const urgColor = d => d === null ? "var(--warn)" : d <= 7 ? "var(--danger)" : d <= 30 ? "var(--warn)" : "var(--good)";
  return (
    <div className="card rounded-3xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <h2 className="font-bold text-sm text-[var(--ink)]">Upcoming Deadlines</h2>
        <Link to="/calendar" className="text-xs font-semibold" style={{ color: "var(--accent)" }}>View calendar →</Link>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: SURFACE }} />)}</div>
        ) : deadlines.length === 0 ? (
          <div className="text-center py-8">
            <div className="mb-2 flex justify-center"><Icon d={ICONS.calendar} size={30} /></div>
            <p className="text-sm font-semibold text-[var(--ink)]">No deadlines yet</p>
            <p className="text-xs mt-0.5" style={{ color: FAINT }}>Add universities to your pipeline to track them here.</p>
          </div>
        ) : (
          <div className="relative ps-4">
            <div className="absolute top-1 bottom-1 start-[3px] w-px" style={{ background: "var(--border)" }} />
            <div className="space-y-4">
              {deadlines.map(e => {
                const d = e.days;
                const month = e.deadline_note ? new Date(e.deadline_note).toLocaleDateString(undefined, { month: "short" }).toUpperCase() : "";
                const day   = e.deadline_note ? new Date(e.deadline_note).getDate() : "";
                return (
                  <Link key={e.id} to="/pipeline" className="flex items-start gap-3 group">
                    <span className="relative shrink-0 w-2 h-2 rounded-full mt-1.5 -ms-[calc(1rem+1px)]" style={{ background: urgColor(d) }} />
                    <div className="rounded-xl px-2 py-1 text-center shrink-0 w-11" style={{ background: "var(--danger-subtle)", color: "var(--danger)" }}>
                      <div className="text-[9px] font-bold leading-none">{month}</div>
                      <div className="text-sm font-extrabold leading-tight">{day}</div>
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm font-semibold text-[var(--ink)] truncate group-hover:opacity-80 transition">{e.university?.name}</p>
                      <p className="text-xs" style={{ color: FAINT }}>{e.pipeline_label || "Application"}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════ DASHBOARD ═══════════════════ */
const Dashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [profile,      setProfile]      = useState(null);
  const [favourites,   setFavourites]   = useState([]);
  const [topMatches,   setTopMatches]   = useState([]);
  const [applications, setApplications] = useState([]);
  const [langCount,    setLangCount]    = useState(0);
  const [countryCounts, setCountryCounts] = useState({});
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get("/profiles/me"),
      api.get("/favourites"),
      api.get("/pipeline"),
      api.get("/user-languages"),
      api.get("/universities?limit=300"),
    ]).then(([profR, favR, pipeR, langR, uniR]) => {
      if (profR.status === "fulfilled") setProfile(profR.value.data);
      if (favR.status  === "fulfilled") setFavourites(favR.value.data);
      if (pipeR.status === "fulfilled") setApplications(Array.isArray(pipeR.value.data) ? pipeR.value.data : []);
      if (langR.status === "fulfilled") setLangCount(Array.isArray(langR.value.data) ? langR.value.data.length : 0);
      if (uniR.status  === "fulfilled") {
        const items = uniR.value.data?.items || uniR.value.data || [];
        const counts = {};
        items.forEach(u => { if (u.country) counts[u.country] = (counts[u.country] || 0) + 1; });
        setCountryCounts(counts);
      }
    }).finally(() => setLoading(false));
  }, []);

  /* proactive deadline toasts — once per session */
  useEffect(() => {
    if (!applications.length) return;
    const key = "deadline_toasts_shown";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    const today = new Date();
    const urgent = applications
      .filter(e => e.deadline_note && e.status !== "decision")
      .map(e => ({ name: e.university?.name || "University", days: Math.ceil((new Date(e.deadline_note) - today) / 86400000) }))
      .filter(e => !isNaN(e.days) && e.days >= 0 && e.days <= 30)
      .sort((a, b) => a.days - b.days);
    urgent.forEach((e, i) => {
      setTimeout(() => {
        const msg = e.days === 0
          ? `⏰ ${e.name} deadline is TODAY!`
          : e.days <= 7
          ? `⚠️ ${e.name} closes in ${e.days} day${e.days > 1 ? "s" : ""}!`
          : `📅 ${e.name} deadline in ${e.days} days`;
        toast(msg, {
          duration: 6000,
          style: { background: e.days <= 7 ? "var(--danger)" : "var(--warn)", color: "#fff", fontSize: "13px", borderRadius: "12px" },
        });
      }, i * 800);
    });
  }, [applications]);

  useEffect(() => {
    if (!profile) return;
    api.post("/recommendations", {
      gpa: profile.gpa, budget_eur: profile.budget_eur,
      english_level: profile.english_level, language: profile.language,
      preferred_countries: profile.preferred_countries || "",
    }).then(r => setTopMatches((r.data?.results || []).slice(0, 3))).catch(() => {});
  }, [profile]);

  const completion  = calcCompletion(profile);
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Student";
  const arrow = isRTL ? "←" : "→";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const animPct = useCountUp(loading ? 0 : completion);

  /* upcoming deadlines from pipeline */
  const deadlines = applications
    .filter(e => e.deadline_note && e.status !== "decision")
    .map(e => {
      const d = new Date(e.deadline_note);
      const days = isNaN(d) ? null : Math.ceil((d - new Date()) / 86400000);
      return { ...e, days };
    })
    .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999))
    .slice(0, 4);

  /* journey roadmap steps derived from real signals */
  const journeySteps = [
    { label: "Profile",     status: completion >= 80 ? "done" : completion > 0 ? "current" : "upcoming" },
    { label: "Language",    status: langCount > 0 ? "done" : completion >= 80 ? "current" : "upcoming" },
    { label: "Universities", status: (favourites.length > 0 || topMatches.length > 0) ? "done" : langCount > 0 ? "current" : "upcoming" },
    { label: "Documents",   status: applications.length > 0 ? "current" : "upcoming" },
    { label: "Applications", status: applications.some(a => a.status === "submitted" || a.status === "decision") ? "current" : "upcoming" },
    { label: "Visa & Travel", status: applications.some(a => a.status === "decision") ? "current" : "upcoming" },
  ];
  // promote the last "current" that follows only "done" steps as the sole active step
  let seenCurrent = false;
  journeySteps.forEach(s => {
    if (s.status === "current") { if (seenCurrent) s.status = "upcoming"; else seenCurrent = true; }
  });

  const countryList = POPULAR_COUNTRIES.map(c => ({ name: c, count: countryCounts[c] ?? 0, photo: COUNTRY_PHOTOS[c] }));

  return (
    <div className="min-h-screen pb-10" style={{ background: "var(--bg)" }}>
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-6 space-y-6">

        {/* ── email verification ── */}
        {user && !user.is_verified && <VerifBanner email={user.email} />}

        {/* ══════════ HERO ══════════ */}
        <div className="relative rounded-[28px] overflow-hidden" style={{ background: "linear-gradient(135deg, var(--accent-subtle), var(--bg-subtle))", border: `1px solid ${BORDER}` }}>
          <div className="grid lg:grid-cols-[1fr_420px]">
            {/* left: greeting + stats */}
            <div className="relative px-7 sm:px-10 py-9 sm:py-11">
              <h1 className="text-[32px] sm:text-[38px] font-extrabold leading-tight mb-2 text-[var(--ink)]">
                {greeting}, {displayName} 👋
              </h1>
              <p className="text-[15px] mb-8" style={{ color: DIM }}>
                {profile?.field_of_study && profile?.preferred_countries
                  ? <>{t("dashboard.targeting", "Targeting")} <strong className="text-[var(--ink)]">{profile.field_of_study}</strong> {t("dashboard.in", "in")} <strong className="text-[var(--ink)]">{profile.preferred_countries.split(",")[0].trim()}</strong> — your study abroad journey is progressing beautifully.</>
                  : "Your study abroad journey is progressing beautifully."}
              </p>

              {/* stat pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl">
                <div className="rounded-2xl px-4 py-4" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xl font-extrabold text-[var(--ink)]">{animPct}%</span>
                    <span className="text-xs" style={{ color: "var(--good)" }}>↗</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden mb-1.5" style={{ background: "var(--border)" }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${animPct}%`, background: GRAD }} />
                  </div>
                  <p className="text-[10.5px] font-medium" style={{ color: FAINT }}>Overall Progress</p>
                </div>
                <div className="rounded-2xl px-4 py-4 flex flex-col justify-between" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}><Icon d={ICONS.graduationCap} size={16} /></div>
                  <div className="text-xl font-extrabold text-[var(--ink)] leading-none mb-1">{Object.values(countryCounts).reduce((a, b) => a + b, 0) || "—"}</div>
                  <p className="text-[10.5px] font-medium" style={{ color: FAINT }}>Universities In Pipeline</p>
                </div>
                <div className="rounded-2xl px-4 py-4 flex flex-col justify-between" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}><Icon d={ICONS.favourites} size={16} /></div>
                  <div className="text-xl font-extrabold text-[var(--ink)] leading-none mb-1">{favourites.length}</div>
                  <p className="text-[10.5px] font-medium" style={{ color: FAINT }}>Scholarships Available</p>
                </div>
                <div className="rounded-2xl px-4 py-4 flex flex-col justify-between" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}><Icon d={ICONS.applications} size={16} /></div>
                  <div className="text-xl font-extrabold text-[var(--ink)] leading-none mb-1">{applications.length}</div>
                  <p className="text-[10.5px] font-medium" style={{ color: FAINT }}>Applications In Progress</p>
                </div>
              </div>
            </div>

            {/* right: hero photo */}
            <div className="relative hidden lg:block min-h-[280px]">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&q=75"
                alt="Student looking at a European university"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, var(--accent-subtle) 0%, transparent 35%)" }} />
            </div>
          </div>
        </div>

        {/* ══════════ MAIN GRID ══════════ */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">

          {/* ── left column ── */}
          <div className="space-y-6 min-w-0">

            {/* Journey */}
            <Journey steps={journeySteps} arrow={arrow} />

            {/* Top AI Recommendations */}
            <div className="card rounded-3xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <h2 className="font-bold text-[15px] text-[var(--ink)]">Top AI Recommendations</h2>
                <div className="flex items-center gap-3">
                  <Link to="/recommendations" className="text-xs font-semibold" style={{ color: "var(--accent)" }}>View all →</Link>
                </div>
              </div>
              <div className="p-5">
                {loading ? (
                  <div className="grid sm:grid-cols-3 gap-4">{[0, 1, 2].map(i => <div key={i} className="rounded-2xl h-64 animate-pulse" style={{ background: SURFACE }} />)}</div>
                ) : topMatches.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="mb-3 flex justify-center"><Icon d={ICONS.target} size={40} /></div>
                    <p className="text-[var(--ink)] font-bold mb-1">{profile ? "No matches yet" : "Set up your profile"}</p>
                    <p className="text-sm mb-5" style={{ color: FAINT }}>{profile ? "Run AI recommendations to see your best-fit universities." : "We need a few details to find your best-fit universities."}</p>
                    <Link to={profile ? "/recommendations" : "/profile"}
                      className="btn btn-primary text-sm px-5 py-2.5">
                      {profile ? "Run Recommendations" : "Set Up Profile"}
                    </Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-3 gap-4">
                    {topMatches.map((m, i) => (
                      <Link key={m.university.id}
                        to={`/university/${m.university.id}`}
                        state={{ score: m.score, reasons: m.reasons, breakdown: m.breakdown }}
                        className="group rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                        style={{ border: `1px solid ${BORDER}` }}>
                        <div className="h-32 relative overflow-hidden">
                          <img src={UNI_PHOTOS[i % UNI_PHOTOS.length]} alt=""
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute top-2.5 start-2.5 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm"
                               style={{ background: "rgba(255,255,255,0.9)" }}>
                            <Icon d={ICONS.heart} size={12} />
                          </div>
                          <div className="absolute top-2.5 end-2.5 flex items-center justify-center w-10 h-10 rounded-full text-[12px] font-extrabold"
                               style={{ background: "rgba(255,255,255,0.95)", color: "var(--accent-active)", position: "absolute" }}>
                            {i === 0 && (
                              <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "var(--accent)", opacity: 0.35 }} />
                            )}
                            <span className="relative">{m.score}%</span>
                          </div>
                          {i === 0 && (
                            <div className="absolute bottom-2 start-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex items-center gap-1"
                                 style={{ background: "rgba(6,9,15,0.55)", backdropFilter: "blur(4px)" }}>
                              Best match
                            </div>
                          )}
                        </div>
                        <div className="p-3.5 flex-1" style={{ background: SURFACE }}>
                          <p className="font-bold text-[var(--ink)] text-[13px] leading-snug mb-0.5">{m.university.name}</p>
                          <p className="text-[11px] mb-2.5" style={{ color: DIM }}>
                            {COUNTRY_FLAG[m.university.country] || "🏛️"} {m.university.country} • {m.university.city}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {m.university.field_of_study && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
                                {m.university.field_of_study}
                              </span>
                            )}
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--good-subtle)", color: "var(--good)" }}>
                              Public University
                            </span>
                          </div>
                          <span className="text-[11px] font-bold" style={{ color: "var(--accent)" }}>View Details →</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Explore by Country */}
            <div className="card rounded-3xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <h2 className="font-bold text-[15px] text-[var(--ink)]">Explore by Country</h2>
                <Link to="/universities" className="text-xs font-semibold" style={{ color: "var(--accent)" }}>View all countries →</Link>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
                {countryList.map(c => (
                  <Link key={c.name} to="/universities" className="group relative rounded-2xl overflow-hidden h-32 block">
                    <img src={c.photo} alt={c.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(6,9,15,0.05), rgba(6,9,15,0.75) 100%)" }} />
                    <span className="absolute top-2.5 end-2.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px]" style={{ background: "rgba(255,255,255,0.85)" }}><Icon d={ICONS.heart} size={11} /></span>
                    <div className="absolute bottom-2.5 start-3 text-white">
                      <p className="text-[12.5px] font-bold leading-tight">{c.name}</p>
                      <p className="text-[10.5px] opacity-85">{c.count ? `${c.count} Universities` : "Explore"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── right column ── */}
          <div className="space-y-6 min-w-0">
            <DeadlinesTimeline deadlines={deadlines} loading={loading} />
            <AiAdvisorCard />
            {!loading && (
              <GettingStarted
                completion={completion}
                hasMatches={topMatches.length > 0}
                hasFav={favourites.length > 0}
                hasPipeline={applications.length > 0}
                hasLang={langCount > 0}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
