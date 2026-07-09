import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import GettingStarted from "../components/GettingStarted";
import { COUNTRY_FLAG } from "../lib/countries";

/* ── tokens ── */
const BG      = "oklch(0.13 0.018 285)";
const SURFACE = "oklch(0.17 0.022 285)";
const CARD    = "oklch(0.20 0.024 285)";
const BORDER  = "oklch(1 0 0 / 0.07)";
const GRAD    = "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))";
const DIM     = "oklch(0.62 0.02 285)";
const FAINT   = "oklch(0.45 0.02 285)";


const UNI_PHOTOS = [
  "https://images.unsplash.com/photo-1562774053-701939374585?w=400&q=70",
  "https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=400&q=70",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=70",
];

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

/* ── progress ring ── */
const Ring = ({ pct }) => {
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = setTimeout(() => setShown(pct), 200); return () => clearTimeout(t); }, [pct]);
  return (
    <div className="relative w-24 h-24 rounded-full flex items-center justify-center shrink-0"
         style={{ background: `conic-gradient(oklch(0.62 0.24 296) 0% ${shown}%, oklch(1 0 0 / 0.08) ${shown}% 100%)` }}>
      <div className="w-[74px] h-[74px] rounded-full flex flex-col items-center justify-center"
           style={{ background: SURFACE }}>
        <span className="text-xl font-extrabold text-white">{shown}%</span>
        <span className="text-[9px] text-center leading-tight px-1" style={{ color: FAINT }}>%</span>
      </div>
    </div>
  );
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
         style={{ background: CARD, border: "1px solid oklch(0.75 0.18 55 / 0.2)" }}>
      <span className="text-xl shrink-0">✉️</span>
      <div className="flex-1 min-w-0">
        <span className="font-semibold" style={{ color: "oklch(0.78 0.18 55)" }}>{t("verification.title")} </span>
        <span style={{ color: DIM }}>{t("verification.sent")} </span>
        <span className="font-mono font-semibold" style={{ color: "oklch(0.82 0.18 55)" }}>{email}</span>
      </div>
      <button onClick={resend} disabled={busy}
        className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
        style={{ background: "oklch(0.75 0.18 55 / 0.12)", color: "oklch(0.78 0.18 55)" }}>
        {busy ? t("verification.sending") : t("verification.resend")}
      </button>
      <button onClick={() => { sessionStorage.setItem("vb","1"); setGone(true); }}
              className="text-lg leading-none shrink-0" style={{ color: "oklch(0.55 0.18 55)" }}>×</button>
    </div>
  );
};

/* ── stat card ── */
const Stat = ({ label, value, to, accent = "oklch(0.62 0.24 296)" }) => {
  const inner = (
    <div className="rounded-2xl px-5 py-5 relative overflow-hidden transition hover:opacity-90"
         style={{ background: CARD, border: `1px solid ${BORDER}` }}>
      <div className="absolute -top-4 -end-4 w-16 h-16 rounded-full opacity-[0.12]"
           style={{ background: accent }} />
      <div className="text-xs font-medium mb-3 uppercase tracking-wide" style={{ color: FAINT }}>{label}</div>
      <div className="text-[32px] font-extrabold text-white leading-none">{value}</div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
};

/* ── announcement style ── */
const ANN = { info: { color: "oklch(0.65 0.18 220)", icon: "📢" }, success: { color: "oklch(0.72 0.18 158)", icon: "✅" }, warning: { color: "oklch(0.75 0.18 75)", icon: "⚠️" } };

/* ═══════════════════ DASHBOARD ═══════════════════ */
const Dashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [profile,      setProfile]      = useState(null);
  const [favourites,   setFavourites]   = useState([]);
  const [topMatches,   setTopMatches]   = useState([]);
  const [latestAnn,    setLatestAnn]    = useState(null);
  const [applications, setApplications] = useState([]);
  const [langCount,    setLangCount]    = useState(0);
  const [scholarships, setScholarships] = useState(0);
  const [openTickets,  setOpenTickets]  = useState(0);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get("/profiles/me"),
      api.get("/favourites"),
      api.get("/announcements"),
      api.get("/pipeline"),
      api.get("/user-languages"),
      api.get("/scholarships?limit=1"),
      api.get("/support/my"),
    ]).then(([profR, favR, annR, pipeR, langR, schR, tickR]) => {
      if (profR.status === "fulfilled") setProfile(profR.value.data);
      if (favR.status  === "fulfilled") setFavourites(favR.value.data);
      if (annR.status  === "fulfilled") { const u = annR.value.data.find(a => !a.is_read); if (u) setLatestAnn(u); }
      if (pipeR.status === "fulfilled") setApplications(Array.isArray(pipeR.value.data) ? pipeR.value.data : []);
      if (langR.status === "fulfilled") setLangCount(Array.isArray(langR.value.data) ? langR.value.data.length : 0);
      if (schR.status  === "fulfilled") setScholarships(schR.value.data?.total ?? 0);
      if (tickR.status === "fulfilled") {
        const open = (tickR.value.data || []).filter(tk => tk.status !== "closed").length;
        setOpenTickets(open);
      }
    }).finally(() => setLoading(false));
  }, []);

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

  const animApps    = useCountUp(loading ? 0 : applications.length);
  const animMatches = useCountUp(loading ? 0 : topMatches.length || favourites.length);
  const animPct     = useCountUp(loading ? 0 : completion);
  const animTickets = useCountUp(loading ? 0 : openTickets);

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

  const urgColor = d => d === null ? "oklch(0.75 0.18 75)" : d <= 7 ? "oklch(0.65 0.22 25)" : d <= 30 ? "oklch(0.75 0.18 75)" : "oklch(0.72 0.18 158)";

  return (
    <div className="min-h-screen" style={{ background: BG, color: "#fff", fontFamily: "Helvetica, Arial, 'IBM Plex Sans Arabic', sans-serif" }}>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── email verification ── */}
        {user && !user.is_verified && <VerifBanner email={user.email} />}

        {/* ══ HERO CARD ══ */}
        <div className="rounded-2xl overflow-hidden relative"
             style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>

          {/* glow blobs */}
          <div className="absolute w-72 h-72 rounded-full opacity-[0.14] blur-[90px] -top-20 -start-10 pointer-events-none"
               style={{ background: "oklch(0.62 0.24 296)" }} />
          <div className="absolute w-48 h-48 rounded-full opacity-[0.10] blur-[70px] bottom-0 end-20 pointer-events-none"
               style={{ background: "oklch(0.50 0.20 264)" }} />

          <div className="relative px-8 py-8 flex items-center justify-between gap-6 flex-wrap">
            {/* left: text + buttons */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-2" style={{ color: "oklch(0.72 0.18 296)" }}>
                {t("dashboard.welcomeBack")}
              </p>
              <h1 className="text-[36px] font-extrabold leading-tight mb-2 text-white">
                {displayName} 👋
              </h1>
              <p className="text-[14px] mb-6 leading-relaxed" style={{ color: DIM }}>
                {profile?.field_of_study && profile?.preferred_countries
                  ? <>{t("dashboard.targeting")} <strong className="text-white">{profile.field_of_study}</strong> {t("dashboard.in")} <strong className="text-white">{profile.preferred_countries.split(",")[0].trim()}</strong> — {completion}% {t("dashboard.readyToApply")}.</>
                  : t("dashboard.subtitle")}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/profile"
                  className="text-white text-sm font-bold px-6 py-2.5 rounded-xl transition hover:opacity-90"
                  style={{ background: GRAD, boxShadow: "0 4px 18px oklch(0.55 0.22 296 / 0.38)" }}>
                  {t("dashboard.continueProfile")}
                </Link>
                <Link to="/universities"
                  className="text-white text-sm font-bold px-6 py-2.5 rounded-xl transition hover:opacity-90"
                  style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  {t("dashboard.browseUniversities")}
                </Link>
                <Link to="/pipeline"
                  className="text-white text-sm font-bold px-6 py-2.5 rounded-xl transition hover:opacity-90"
                  style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  {t("dashboard.checkPipeline")}
                </Link>
              </div>
            </div>

            {/* right: photos collage + ring */}
            <div className="hidden sm:flex items-center gap-5 shrink-0">
              {/* photo collage */}
              <div className="relative w-[200px] h-[160px]">
                <div className="absolute top-0 start-0 w-[120px] h-[120px] rounded-2xl overflow-hidden"
                     style={{ border: "2px solid oklch(1 0 0 / 0.1)", boxShadow: "0 8px 24px oklch(0 0 0 / 0.4)" }}>
                  <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&q=70"
                       alt="" className="w-full h-full object-cover"
                       style={{ filter: "brightness(0.85)" }} />
                </div>
                <div className="absolute top-1 end-0 w-[72px] h-[72px] rounded-xl overflow-hidden"
                     style={{ border: "2px solid oklch(1 0 0 / 0.1)", boxShadow: "0 4px 12px oklch(0 0 0 / 0.3)" }}>
                  <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&q=70"
                       alt="" className="w-full h-full object-cover"
                       style={{ filter: "brightness(0.8)" }} />
                </div>
                <div className="absolute bottom-0 end-2 w-[84px] h-[60px] rounded-xl overflow-hidden"
                     style={{ border: "2px solid oklch(1 0 0 / 0.1)", boxShadow: "0 4px 12px oklch(0 0 0 / 0.3)" }}>
                  <img src="https://images.unsplash.com/photo-1627556704302-624286467c65?w=200&q=70"
                       alt="" className="w-full h-full object-cover"
                       style={{ filter: "brightness(0.8)" }} />
                </div>
                {/* badge */}
                <div className="absolute -bottom-2 start-2 text-[10px] font-bold text-white px-2.5 py-1 rounded-full"
                     style={{ background: GRAD, boxShadow: "0 3px 12px oklch(0.55 0.22 296 / 0.4)" }}>
                  🎓 {t("dashboard.universitiesCount")}
                </div>
              </div>

              {/* ring */}
              <div className="flex flex-col items-center gap-2">
                <Ring pct={animPct} />
                <Link to="/profile" className="text-xs font-semibold hover:opacity-80 transition"
                      style={{ color: "oklch(0.78 0.10 296)" }}>
                  {t("dashboard.viewProfile")} {arrow}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ══ STATS ══ */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {loading
            ? [0,1,2,3,4].map(i => <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ background: CARD }} />)
            : <>
                <Stat label={t("dashboard.stats2.applications")} value={animApps}         to="/pipeline"        accent="oklch(0.62 0.24 296)" />
                <Stat label={t("dashboard.stats2.matched")}      value={animMatches}       to="/recommendations" accent="oklch(0.65 0.18 220)" />
                <Stat label={t("dashboard.stats2.languageReady")} value={`${animPct}%`}   to="/learning"        accent="oklch(0.55 0.18 158)" />
                <Stat label={t("dashboard.stats2.scholarships")} value={scholarships || "—"} to="/scholarships" accent="oklch(0.65 0.18 55)" />
                <Stat label={t("dashboard.stats2.openTickets")}  value={animTickets}       to="/support"         accent="oklch(0.65 0.18 10)" />
              </>
          }
        </div>

        {/* ══ announcement ══ */}
        {latestAnn && (() => {
          const s = ANN[latestAnn.type] ?? ANN.info;
          return (
            <Link to="/announcements"
              className="flex items-center gap-4 rounded-2xl px-5 py-4 transition hover:opacity-90 overflow-hidden relative"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="absolute start-0 top-0 bottom-0 w-1 rounded-s-2xl" style={{ background: s.color }} />
              <span className="text-2xl ps-2">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-sm text-white">{latestAnn.title} </span>
                <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">{t("dashboard.latestAnn")}</span>
                <p className="text-xs mt-0.5 truncate" style={{ color: FAINT }}>{latestAnn.body}</p>
              </div>
              <span style={{ color: FAINT }}>{arrow}</span>
            </Link>
          );
        })()}

        {/* ══ RECOMMENDATIONS + DEADLINES ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* top AI recommendations — 2/3 width */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h2 className="font-bold text-white flex items-center gap-2">
                <span>✨</span> {t("dashboard.topRecommendations")}
              </h2>
              <Link to="/recommendations" className="text-xs font-semibold hover:opacity-80"
                    style={{ color: "oklch(0.78 0.10 296)" }}>
                {t("dashboard.seeAll")} {arrow}
              </Link>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="grid grid-cols-3 gap-3">
                  {[0,1,2].map(i => <div key={i} className="rounded-xl h-40 animate-pulse" style={{ background: SURFACE }} />)}
                </div>
              ) : topMatches.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-3">🎯</div>
                  <p className="text-white font-bold mb-1">{profile ? t("dashboard.noMatchesSub") : t("dashboard.noProfile")}</p>
                  <p className="text-sm mb-5" style={{ color: FAINT }}>
                    {profile ? "" : t("dashboard.noProfileSub")}
                  </p>
                  <Link to={profile ? "/recommendations" : "/profile"}
                    className="text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition"
                    style={{ background: GRAD }}>
                    {profile ? t("dashboard.runRecommendations") : t("dashboard.setupProfile")}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {topMatches.map((m, i) => (
                    <Link key={m.university.id}
                      to={`/university/${m.university.id}`}
                      state={{ score: m.score, reasons: m.reasons, breakdown: m.breakdown }}
                      className="rounded-xl overflow-hidden flex flex-col transition hover:opacity-90"
                      style={{ border: `1px solid ${BORDER}` }}>
                      {/* photo */}
                      <div className="h-24 relative overflow-hidden">
                        <img src={UNI_PHOTOS[i % UNI_PHOTOS.length]} alt=""
                             className="w-full h-full object-cover"
                             style={{ filter: "brightness(0.75)" }} />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, oklch(0.13 0.018 285 / 0.8), transparent 60%)" }} />
                        {/* match badge */}
                        <div className="absolute top-2 end-2 text-[11px] font-extrabold text-white px-2 py-0.5 rounded-lg"
                             style={{ background: GRAD }}>
                          {m.score}%
                        </div>
                      </div>
                      {/* info */}
                      <div className="p-3 flex-1" style={{ background: SURFACE }}>
                        <p className="font-bold text-white text-xs truncate">{m.university.name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: DIM }}>
                          {COUNTRY_FLAG[m.university.country] || "🏛️"} {m.university.city}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* upcoming deadlines — 1/3 width */}
          <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h2 className="font-bold text-white">{t("dashboard.deadlines.title")}</h2>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="space-y-3">
                  {[0,1,2].map(i => <div key={i} className="rounded-lg h-12 animate-pulse" style={{ background: SURFACE }} />)}
                </div>
              ) : deadlines.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-sm font-semibold text-white mb-1">{t("dashboard.deadlines.none")}</p>
                  <p className="text-xs" style={{ color: FAINT }}>{t("dashboard.deadlines.noneSub")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deadlines.map(e => (
                    <Link key={e.id} to="/pipeline"
                      className="flex items-start gap-3 transition hover:opacity-80">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: urgColor(e.days) }} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{e.university?.name}</p>
                        <p className="text-xs" style={{ color: DIM }}>{e.deadline_note}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ GETTING STARTED ══ */}
        {!loading && (
          <GettingStarted
            completion={completion}
            hasMatches={topMatches.length > 0}
            hasFav={favourites.length > 0}
            hasPipeline={applications.length > 0}
            hasLang={langCount > 0}
          />
        )}

        {/* profile incomplete nudge */}
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
            <div className="flex items-start gap-4 rounded-2xl px-5 py-4"
                 style={{ background: CARD, border: "1px solid oklch(0.75 0.18 55 / 0.2)" }}>
              <span className="text-2xl shrink-0">💡</span>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: "oklch(0.78 0.18 55)" }}>
                  {t("dashboard.incomplete.title")}
                </p>
                <p className="text-xs mt-1" style={{ color: DIM }}>
                  {t("dashboard.incomplete.missing")} <strong className="text-white">{missing.slice(0, 3).join(", ")}{missing.length > 3 ? ` +${missing.length - 3}` : ""}</strong>
                </p>
              </div>
              <Link to="/profile"
                className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                style={{ background: "oklch(0.75 0.18 55 / 0.12)", color: "oklch(0.78 0.18 55)" }}>
                {t("dashboard.continueProfile")} {arrow}
              </Link>
            </div>
          );
        })()}

      </div>
    </div>
  );
};

export default Dashboard;
