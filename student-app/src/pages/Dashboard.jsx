import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import GettingStarted from "../components/GettingStarted";

const COUNTRY_FLAG = {
  Germany: "🇩🇪", Poland: "🇵🇱", Austria: "🇦🇹", Netherlands: "🇳🇱",
  France: "🇫🇷", Sweden: "🇸🇪", Italy: "🇮🇹", Spain: "🇪🇸",
};

/* ── Animated count-up ── */
const useCountUp = (target, duration = 700) => {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
};

/* ── Profile completion ── */
const calcCompletion = p => {
  if (!p) return 0;
  const fields = [p.nationality, p.gpa, p.budget_eur, p.english_level, p.field_of_study, p.preferred_countries, p.language, p.degree_level];
  return Math.round(fields.filter(f => f != null && f !== "").length / fields.length * 100);
};

/* ── Animated score ring ── */
const ScoreRing = ({ score }) => {
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = setTimeout(() => setShown(score), 100); return () => clearTimeout(t); }, [score]);
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${shown} 100`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.22,1,0.36,1)" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-extrabold" style={{ color }}>{score}</span>
      </div>
    </div>
  );
};

/* ── Stat card ── */
const STAT_STYLES = [
  { grad: "from-violet-600 to-indigo-600", shadow: "shadow-violet-200", glow: "🎯" },
  { grad: "from-rose-500 to-pink-600",     shadow: "shadow-rose-200",   glow: "❤️" },
  { grad: "from-emerald-500 to-teal-600",  shadow: "shadow-emerald-200",glow: "📋" },
  { grad: "from-amber-500 to-orange-500",  shadow: "shadow-amber-200",  glow: "🎓" },
];

const StatCard = ({ icon, label, value, to, styleIdx = 0 }) => {
  const s = STAT_STYLES[styleIdx];
  const card = (
    <div className={`relative overflow-hidden bg-gradient-to-br ${s.grad} rounded-2xl p-5 text-white shadow-lg ${s.shadow} card-lift`}>
      <div className="absolute -right-4 -top-4 text-7xl opacity-10 select-none">{icon}</div>
      <div className="relative">
        <p className="text-4xl font-extrabold tracking-tight leading-none mb-1">{value}</p>
        <p className="text-white/75 text-sm font-medium">{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
};

/* ── Skeleton ── */
const SkeletonStat = () => (
  <div className="rounded-2xl h-28 animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
);
const SkeletonMatch = () => (
  <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 animate-pulse">
    <div className="w-8 h-8 rounded-xl bg-gray-100" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-100 rounded w-1/2" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
    <div className="w-12 h-12 rounded-full bg-gray-100" />
  </div>
);

/* ── Email verification banner ── */
const VerificationBanner = ({ email }) => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem("verif_banner_dismissed") === "1"
  );
  const [sending, setSending] = useState(false);

  if (dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem("verif_banner_dismissed", "1");
    setDismissed(true);
  };

  const resend = async () => {
    setSending(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success(t("verification.success"));
    } catch (e) {
      toast.error(e?.response?.data?.detail || t("verification.failedSend"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 text-sm">
      <span className="text-xl shrink-0">✉️</span>
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-amber-800">{t("verification.title")}</span>
        <span className="text-amber-700"> {t("verification.sent")} </span>
        <span className="font-mono text-amber-900 font-semibold">{email}</span>
      </div>
      <button
        onClick={resend}
        disabled={sending}
        className="shrink-0 text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
      >
        {sending ? t("verification.sending") : t("verification.resend")}
      </button>
      <button
        onClick={dismiss}
        className="shrink-0 text-amber-400 hover:text-amber-700 transition text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
};

const ANN_STYLE = {
  info:    { grad: "from-blue-500 to-cyan-500",     bg: "bg-blue-50",    text: "text-blue-800",    icon: "📢" },
  success: { grad: "from-emerald-500 to-green-500", bg: "bg-emerald-50", text: "text-emerald-800", icon: "✅" },
  warning: { grad: "from-amber-400 to-orange-500",  bg: "bg-amber-50",   text: "text-amber-800",   icon: "⚠️" },
};

const Dashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [profile, setProfile]           = useState(null);
  const [favourites, setFavourites]     = useState([]);
  const [topMatches, setTopMatches]     = useState([]);
  const [latestAnn, setLatestAnn]       = useState(null);
  const [applications, setApplications] = useState([]);
  const [langCount, setLangCount]       = useState(0);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get("/profiles/me"),
      api.get("/favourites"),
      api.get("/announcements"),
      api.get("/pipeline"),
      api.get("/user-languages"),
    ]).then(([profRes, favRes, annRes, pipeRes, langRes]) => {
      if (profRes.status === "fulfilled") setProfile(profRes.value.data);
      if (favRes.status  === "fulfilled") setFavourites(favRes.value.data);
      if (annRes.status  === "fulfilled") {
        const unread = annRes.value.data.find(a => !a.is_read);
        if (unread) setLatestAnn(unread);
      }
      if (pipeRes.status === "fulfilled") setApplications(Array.isArray(pipeRes.value.data) ? pipeRes.value.data : []);
      if (langRes.status === "fulfilled") setLangCount(Array.isArray(langRes.value.data) ? langRes.value.data.length : 0);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!profile) return;
    api.post("/recommendations", {
      gpa: profile.gpa,
      budget_eur: profile.budget_eur,
      english_level: profile.english_level,
      language: profile.language,
      preferred_countries: profile.preferred_countries || "",
    }).then(r => setTopMatches((r.data?.results || []).slice(0, 3))).catch(() => {});
  }, [profile]);

  const completion = calcCompletion(profile);
  const firstName  = user?.email?.split("@")[0] ?? "Student";
  const hour       = new Date().getHours();
  const greeting   = hour < 12 ? t("dashboard.greetingMorning") : hour < 18 ? t("dashboard.greetingAfternoon") : t("dashboard.greetingEvening");

  const animFavs = useCountUp(loading ? 0 : favourites.length);
  const animApps = useCountUp(loading ? 0 : applications.length);
  const animPct  = useCountUp(loading ? 0 : completion);

  const QUICK_LINKS = [
    { to: "/recommendations", icon: "🎯", label: t("nav.recommendations"), color: "bg-violet-50 text-violet-700 hover:bg-violet-100" },
    { to: "/universities",    icon: "🏛️", label: t("nav.universities"),    color: "bg-blue-50 text-blue-700 hover:bg-blue-100"       },
    { to: "/scholarships",    icon: "💰", label: t("nav.scholarships"),     color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
    { to: "/pipeline",        icon: "🚀", label: t("nav.pipeline"),         color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
    { to: "/learning",        icon: "📚", label: t("nav.learning"),         color: "bg-pink-50 text-pink-700 hover:bg-pink-100"       },
    { to: "/favourites",      icon: "❤️", label: t("nav.favourites"),       color: "bg-rose-50 text-rose-700 hover:bg-rose-100"       },
    { to: "/instructors",     icon: "👨‍🏫", label: t("nav.instructors"),   color: "bg-orange-50 text-orange-700 hover:bg-orange-100"  },
  ];

  const profileFields = [
    profile?.field_of_study && { label: t("dashboard.fields.field"),     value: profile.field_of_study },
    profile?.gpa             && { label: t("dashboard.fields.gpa"),       value: `${profile.gpa} / 4.0` },
    profile?.budget_eur      && { label: t("dashboard.fields.budget"),    value: `€${profile.budget_eur.toLocaleString()}/yr` },
    profile?.language        && { label: t("dashboard.fields.language"),  value: `${profile.language} · ${profile.english_level}` },
    profile?.preferred_countries && { label: t("dashboard.fields.countries"), value: profile.preferred_countries },
  ].filter(Boolean);

  const seeAllArrow = isRTL ? "←" : "→";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-800 via-violet-800 to-purple-900 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-white/5 rounded-full translate-y-1/2" />

        <div className="relative max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-indigo-300 text-sm font-semibold mb-1">{greeting} 👋</p>
              <h1 className="text-4xl font-extrabold tracking-tight">{firstName}</h1>
              <p className="text-indigo-300 mt-1 text-sm">{t("dashboard.subtitle")}</p>
            </div>
            <Link to="/profile"
              className="flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl px-5 py-3 transition">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-sm font-bold shadow">
                {firstName[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold">{animPct}% {t("dashboard.completeLabel")}</p>
                <p className="text-indigo-300 text-xs">{t("dashboard.viewProfile")}</p>
              </div>
            </Link>
          </div>

          <div className="mt-6 max-w-sm">
            <div className="flex justify-between text-xs text-indigo-300 mb-1.5">
              <span>{t("dashboard.profileCompletion")}</span>
              <span className="font-bold text-white">{animPct}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-indigo-300 to-violet-300 rounded-full transition-all duration-700"
                style={{ width: `${animPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── Email verification banner ── */}
        {user && !user.is_verified && <VerificationBanner email={user.email} />}

        {/* ── Getting Started checklist ── */}
        {!loading && (
          <GettingStarted
            completion={completion}
            hasMatches={topMatches.length > 0}
            hasFav={favourites.length > 0}
            hasPipeline={applications.length > 0}
            hasLang={langCount > 0}
          />
        )}

        {/* ── Announcement ── */}
        {latestAnn && (() => {
          const s = ANN_STYLE[latestAnn.type] ?? ANN_STYLE.info;
          return (
            <Link to="/announcements"
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition card-lift overflow-hidden relative">
              <div className={`absolute ${isRTL ? "right-0" : "left-0"} top-0 bottom-0 w-1 bg-gradient-to-b ${s.grad}`} />
              <span className={`text-2xl ${isRTL ? "pr-2" : "pl-2"}`}>{s.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm ${s.text}`}>{latestAnn.title}</span>
                  <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">{t("dashboard.latestAnn")}</span>
                </div>
                <p className="text-gray-400 text-xs mt-0.5 truncate">{latestAnn.body}</p>
              </div>
              <span className="text-gray-300 shrink-0">{seeAllArrow}</span>
            </Link>
          );
        })()}

        {/* ── Profile incomplete nudge (above stats so it's the first thing seen) ── */}
        {!loading && profile && completion < 100 && completion > 0 && (() => {
          const missing = [
            !profile.nationality         && t("dashboard.incomplete.fields.nationality"),
            !profile.gpa                 && t("dashboard.incomplete.fields.gpa"),
            !profile.budget_eur          && t("dashboard.incomplete.fields.budget"),
            !profile.english_level       && t("dashboard.incomplete.fields.englishLevel"),
            !profile.field_of_study      && t("dashboard.incomplete.fields.fieldOfStudy"),
            !profile.preferred_countries && t("dashboard.incomplete.fields.preferredCountries"),
            !profile.language            && t("dashboard.incomplete.fields.language"),
            !profile.degree_level        && t("dashboard.incomplete.fields.degreeLevel"),
          ].filter(Boolean);
          return (
            <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
              <span className="text-2xl shrink-0">💡</span>
              <div className="flex-1">
                <p className="font-semibold text-amber-800 text-sm">{t("dashboard.incomplete.title")}</p>
                <p className="text-amber-600 text-xs mt-1">{t("dashboard.incomplete.missing")} <span className="font-semibold">{missing.slice(0, 3).join(", ")}{missing.length > 3 ? ` +${missing.length - 3} more` : ""}</span></p>
              </div>
              <Link to="/profile" className="shrink-0 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition">
                {t("common.next")} →
              </Link>
            </div>
          );
        })()}

        {/* ── Stat cards ── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => <SkeletonStat key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
            <StatCard icon="🎯" label={t("dashboard.stats.complete")}     value={`${animPct}%`}  to="/profile"      styleIdx={0} />
            <StatCard icon="❤️" label={t("dashboard.stats.saved")}        value={animFavs}       to="/favourites"   styleIdx={1} />
            <StatCard icon="🚀" label={t("dashboard.stats.pipeline")}      value={animApps}       to="/pipeline"     styleIdx={2} />
            <StatCard icon="🎓" label={t("dashboard.stats.learning")}     value={langCount > 0 ? langCount : t("dashboard.startLearning")} to="/learning" styleIdx={3} />
          </div>
        )}

        {/* ── Profile complete CTA ── */}
        {!loading && completion === 100 && (
          <div className="flex items-center gap-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl px-6 py-4 shadow-lg shadow-emerald-200">
            <span className="text-3xl shrink-0">🎉</span>
            <div className="flex-1">
              <p className="font-bold text-base">{t("dashboard.profileComplete.title")}</p>
              <p className="text-emerald-100 text-sm mt-0.5">{t("dashboard.profileComplete.subtitle")}</p>
            </div>
            <Link to="/recommendations"
              className="shrink-0 bg-white text-emerald-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-emerald-50 transition">
              {t("dashboard.profileComplete.cta")}
            </Link>
          </div>
        )}

        {/* ── Deadline overview ── */}
        {!loading && applications.length > 0 && (() => {
          const today = new Date();
          const withDeadline = applications
            .filter(e => e.deadline_note && e.status !== "decision")
            .map(e => {
              const parsed = new Date(e.deadline_note);
              const daysLeft = isNaN(parsed) ? null : Math.ceil((parsed - today) / 86400000);
              return { ...e, daysLeft };
            })
            .sort((a, b) => {
              if (a.daysLeft !== null && b.daysLeft !== null) return a.daysLeft - b.daysLeft;
              return a.deadline_note.localeCompare(b.deadline_note);
            })
            .slice(0, 4);
          if (!withDeadline.length) return null;

          const urgencyStyle = (daysLeft) => {
            if (daysLeft === null) return { dot: "bg-amber-400", badge: "text-amber-700 bg-amber-50 border-amber-100" };
            if (daysLeft <= 7)  return { dot: "bg-red-500",   badge: "text-red-700 bg-red-50 border-red-200" };
            if (daysLeft <= 30) return { dot: "bg-amber-500", badge: "text-amber-700 bg-amber-50 border-amber-100" };
            return { dot: "bg-emerald-400", badge: "text-emerald-700 bg-emerald-50 border-emerald-100" };
          };

          return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-sm">📅</span>
                  {t("dashboard.deadlines.title")}
                </h2>
                <Link to="/pipeline" className="text-xs text-indigo-600 font-semibold hover:underline">{t("dashboard.deadlines.viewAll")}</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {withDeadline.map(e => {
                  const s = urgencyStyle(e.daysLeft);
                  return (
                    <div key={e.id} className="flex items-center gap-4 px-6 py-3">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{e.university?.name}</p>
                        <p className="text-xs text-gray-400">{e.university?.city}, {e.university?.country}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`text-xs font-bold border px-2.5 py-1 rounded-lg block ${s.badge}`}>
                          {e.deadline_note}
                        </span>
                        {e.daysLeft !== null && e.daysLeft <= 30 && (
                          <span className={`text-[10px] font-semibold mt-0.5 block ${e.daysLeft <= 7 ? "text-red-500" : "text-amber-500"}`}>
                            {e.daysLeft <= 0 ? t("dashboard.deadlines.overdue") : t("dashboard.deadlines.daysLeft", { count: e.daysLeft })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Top matches */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 text-sm">🎯</span>
                {t("dashboard.topMatches")}
              </h2>
              <Link to="/recommendations" className="text-xs text-indigo-600 font-semibold hover:underline">
                {t("dashboard.seeAll")} {seeAllArrow}
              </Link>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="space-y-3">
                  {[0,1,2].map(i => <SkeletonMatch key={i} />)}
                </div>
              ) : !profile ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-3xl mx-auto mb-4">📋</div>
                  <p className="text-gray-700 font-bold mb-1">{t("dashboard.noProfile")}</p>
                  <p className="text-gray-400 text-sm mb-5">{t("dashboard.noProfileSub")}</p>
                  <Link to="/profile"
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-lg shadow-indigo-200">
                    {t("dashboard.setupProfile")}
                  </Link>
                </div>
              ) : topMatches.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  {t("dashboard.noMatchesSub")} — <Link to="/recommendations" className="text-indigo-600 hover:underline font-medium">{t("dashboard.runRecommendations")}</Link>
                </div>
              ) : (
                <div className="space-y-2 stagger">
                  {topMatches.map((m, i) => (
                    <Link key={m.university.id}
                      to={`/university/${m.university.id}`}
                      state={{ score: m.score, reasons: m.reasons, breakdown: m.breakdown }}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/40 transition group card-lift">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 ${
                        i === 0 ? "bg-amber-400 text-white shadow-sm" :
                        i === 1 ? "bg-gray-300 text-gray-700" :
                                  "bg-orange-300 text-white"
                      }`}>#{i+1}</div>
                      <div className="text-lg shrink-0">{COUNTRY_FLAG[m.university.country] || "🏛️"}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate group-hover:text-indigo-700 transition">{m.university.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{m.university.city}, {m.university.country}
                          {m.university.tuition_fee_eur === 0 && <span className="ms-2 text-emerald-600 font-semibold">{t("dashboard.freeTuition")}</span>}
                        </p>
                      </div>
                      <ScoreRing score={m.score} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">

            {/* Profile snapshot */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm">👤</span>
                <h2 className="font-bold text-gray-800">{t("dashboard.yourProfile")}</h2>
              </div>
              <div className="p-5">
                {!profile ? (
                  <div className="text-center py-3">
                    <p className="text-gray-400 text-sm mb-3">{t("dashboard.noProfileData")}</p>
                    <Link to="/profile"
                      className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition">
                      {t("dashboard.createProfile")}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    {profileFields.map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-gray-400 uppercase tracking-wide font-semibold">{label}</span>
                        <span className="text-gray-700 font-semibold text-end max-w-[55%] truncate">{value}</span>
                      </div>
                    ))}
                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
                        <span>{t("dashboard.completion")}</span>
                        <span className="font-bold text-indigo-600">{completion}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                          style={{ width: `${completion}%` }} />
                      </div>
                    </div>
                    <Link to="/profile"
                      className="block w-full text-center bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 border border-gray-100 py-2 rounded-xl text-xs font-semibold transition mt-2">
                      {t("dashboard.editProfileLink")} {seeAllArrow}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-sm">⚡</span>
                <h2 className="font-bold text-gray-800">{t("dashboard.quickLinks")}</h2>
              </div>
              <div className="p-3 grid grid-cols-1 gap-1 stagger">
                {QUICK_LINKS.map(({ to, icon, label, color }) => (
                  <Link key={to} to={to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${color}`}>
                    <span className="text-base">{icon}</span> {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Saved universities ── */}
        {!loading && favourites.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500 text-sm">❤️</span>
                {t("dashboard.savedUniversities")}
              </h2>
              <Link to="/favourites" className="text-xs text-indigo-600 font-semibold hover:underline">
                {t("dashboard.seeAll")} {seeAllArrow}
              </Link>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
              {favourites.slice(0, 3).map(fav => {
                const uni = fav.university ?? fav;
                return (
                  <Link key={fav.id} to={`/university/${uni.id ?? fav.university_id}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition card-lift">
                    <span className="text-2xl">{COUNTRY_FLAG[uni.country] || "🏛️"}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{uni.name}</p>
                      <p className="text-xs text-gray-400">{uni.city}, {uni.country}</p>
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

export default Dashboard;
