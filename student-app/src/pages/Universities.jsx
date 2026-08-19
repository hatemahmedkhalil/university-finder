import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { COUNTRY_FLAG } from "../lib/countries";
import { Icon, ICONS } from "../components/Sidebar";

/* Campus photos per country (Unsplash free) */
const CAMPUS_PHOTOS = {
  Germany:     "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=900&q=75",
  Poland:      "https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=900&q=75",
  Austria:     "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=900&q=75",
  Netherlands: "https://images.unsplash.com/photo-1557251407-6356f6384370?w=900&q=75",
  France:      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=900&q=75",
  Sweden:      "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=900&q=75",
  Italy:       "https://images.unsplash.com/photo-1533676802871-eca1ae998cd5?w=900&q=75",
  Spain:       "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=900&q=75",
  Romania:     "https://images.unsplash.com/photo-1651427327856-402d6d856667?w=900&q=75",
};
const FALLBACK_PHOTO = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=900&q=75";

/* ── design tokens ── */
const bg        = "bg-[var(--bg)]";
const textFaint = "text-[var(--ink-faint)]";
const grad      = "linear-gradient(135deg,var(--accent),var(--accent-light))";

const SkeletonCard = () => (
  <div className="rounded-3xl border overflow-hidden" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
    <div className="h-52 skeleton-v2" />
    <div className="p-5 space-y-3">
      <div className="h-4 rounded skeleton-v2 w-3/4" />
      <div className="h-3 rounded skeleton-v2 w-1/2" />
      <div className="flex gap-2 pt-1">
        <div className="h-6 w-16 rounded-full skeleton-v2" />
        <div className="h-6 w-20 rounded-full skeleton-v2" />
      </div>
    </div>
  </div>
);

/* ── Match ring — small circular progress badge, more premium than a flat pill ── */
const MatchRing = ({ score }) => {
  const R = 17, C = 2 * Math.PI * R;
  const offset = C * (1 - score / 100);
  const color = score >= 85 ? "var(--good)" : score >= 65 ? "var(--accent)" : "var(--warn)";
  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
        <circle cx="22" cy="22" r={R} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3.5" />
        <circle cx="22" cy="22" r={R} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray={C.toFixed(1)} strokeDashoffset={offset.toFixed(1)}
                style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-white">
        {score}%
      </div>
    </div>
  );
};

/* ── Quick Preview modal — built entirely from data already on the card, no new endpoints ── */
const QuickPreview = ({ uni, score, isFav, onToggleFav, onClose }) => {
  const { t } = useTranslation();
  const photo = CAMPUS_PHOTOS[uni.country] || FALLBACK_PHOTO;
  const flag = COUNTRY_FLAG[uni.country] || "🏛️";

  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(6,9,15,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden pop-in"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative h-48">
          <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "brightness(0.7) saturate(1.05)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(6,9,15,0.1), rgba(6,9,15,0.75) 100%)" }} />
          <button onClick={onClose} className="absolute top-3 end-3 w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ background: "rgba(6,9,15,0.5)", backdropFilter: "blur(6px)" }}><Icon d={ICONS.x} size={14} /></button>
          {score !== undefined && (
            <div className="absolute top-3 start-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold text-white"
                 style={{ background: "rgba(6,9,15,0.55)", backdropFilter: "blur(6px)" }}>
              <Icon d={ICONS.target} size={12} /> {score}% match
            </div>
          )}
          <div className="absolute bottom-4 start-5 end-5">
            <h2 className="text-xl font-extrabold text-white leading-tight">{uni.name}</h2>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>{flag} {uni.city}, {uni.country}</p>
          </div>
        </div>

        <div className="p-5">
          {uni.description && (
            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--ink-dim)" }}>{uni.description}</p>
          )}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            <div className="rounded-xl px-3 py-2.5 text-center" style={{ background: "var(--surface-2)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Tuition</p>
              <p className="text-sm font-extrabold mt-0.5" style={{ color: uni.tuition_fee_eur === 0 ? "var(--good)" : "var(--ink)" }}>
                {uni.tuition_fee_eur === 0 ? "Free" : uni.tuition_fee_eur ? `€${uni.tuition_fee_eur.toLocaleString()}` : "—"}
              </p>
            </div>
            <div className="rounded-xl px-3 py-2.5 text-center" style={{ background: "var(--surface-2)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Ranking</p>
              <p className="text-sm font-extrabold mt-0.5" style={{ color: "var(--ink)" }}>{uni.ranking ? `#${uni.ranking}` : "—"}</p>
            </div>
            <div className="rounded-xl px-3 py-2.5 text-center" style={{ background: "var(--surface-2)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Acceptance</p>
              <p className="text-sm font-extrabold mt-0.5" style={{ color: "var(--ink)" }}>{uni.acceptance_rate ? `${uni.acceptance_rate}%` : "—"}</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => onToggleFav(uni.id)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition"
              style={{ background: "var(--surface-2)", color: "var(--ink)", border: "1px solid var(--border)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={isFav ? "#f43f5e" : "none"}><path d={ICONS.heart[0]} /></svg>
              {isFav ? "Saved" : "Save"}
            </button>
            <Link to={`/university/${uni.id}`}
              className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: grad }}>
              {t("recommendations.viewDetails")} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const Universities = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const LANG_FILTERS = [
    { value: "",        label: t("universities.filterLanguage"), flag: "🌍" },
    { value: "english", label: t("learning.english"),            flag: "🇬🇧" },
    { value: "german",  label: t("learning.german"),             flag: "🇩🇪" },
    { value: "polish",  label: t("learning.polish"),             flag: "🇵🇱" },
  ];

  const [universities, setUniversities] = useState([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [country, setCountry]           = useState("");
  const [langFilter, setLangFilter]     = useState("");
  const [userLangs, setUserLangs]       = useState([]);
  const [page, setPage]                 = useState(1);
  const [favourites, setFavourites]     = useState(new Set());
  const [scoreMap, setScoreMap]         = useState({});
  const [compareSet, setCompareSet]     = useState(new Set());
  const [scholarshipUnis, setScholarshipUnis] = useState(new Set());
  const [previewUni, setPreviewUni]     = useState(null);
  const [poppedFav, setPoppedFav]       = useState(null);
  const perPage = 9;

  useEffect(() => {
    if (user) {
      api.get("/user-languages").then(r => setUserLangs(r.data)).catch(() => {});
      api.get("/favourites").then(res => setFavourites(new Set(res.data.map(u => u.id))));
      api.get("/profiles/me").then(p => {
        const profile = p.data;
        return api.post("/recommendations", {
          gpa: profile.gpa, budget_eur: profile.budget_eur,
          english_level: profile.english_level, language: profile.language,
          preferred_countries: profile.preferred_countries || "",
        });
      }).then(r => {
        const map = {};
        (r.data?.results || []).forEach(item => { map[item.university.id] = item.score; });
        setScoreMap(map);
      }).catch(() => {});
    }
    // Existing /scholarships list already carries university_id — reuse it client-side
    // to flag "scholarships available" per card without any new backend endpoint.
    api.get("/scholarships?limit=300").then(r => {
      const items = r.data?.items || r.data || [];
      const ids = new Set(items.filter(s => s.university_id != null).map(s => s.university_id));
      setScholarshipUnis(ids);
    }).catch(() => {});
  }, [user]);

  const toggleFavourite = async (id) => {
    if (!user) { toast.error(t("universities.loginToSave")); return; }
    if (favourites.has(id)) {
      await api.delete(`/favourites/${id}`);
      setFavourites(prev => { const s = new Set(prev); s.delete(id); return s; });
      toast.success(t("universities.removed"));
    } else {
      await api.post(`/favourites/${id}`);
      setFavourites(prev => new Set([...prev, id]));
      toast.success(t("universities.added"));
      setPoppedFav(id);
      setTimeout(() => setPoppedFav(cur => (cur === id ? null : cur)), 500);
    }
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ skip: (page - 1) * perPage, limit: perPage });
    if (search)     params.set("search", search);
    if (country)    params.set("country", country);
    if (langFilter) params.set("language", langFilter);
    api.get(`/universities?${params}`)
      .then(res => { setUniversities(res.data.items); setTotal(res.data.total); })
      .finally(() => setLoading(false));
  }, [search, country, langFilter, page]);

  const totalPages = Math.ceil(total / perPage);
  const setLang = v => { setLangFilter(v); setPage(1); };

  const previewData = useMemo(() => {
    if (!previewUni) return null;
    return universities.find(u => u.id === previewUni) || null;
  }, [previewUni, universities]);

  return (
    <div className={`min-h-screen ${bg} text-[var(--ink)]`}>

      {/* ── Hero: full-bleed photo, premium storytelling copy ── */}
      <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
        <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1800&q=75"
             alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        {/* Photo hero always keeps a dark overlay + white text regardless of theme —
            fading into the live page bg would break in light mode (dark photo -> white cliff). */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,9,15,0.25), rgba(6,9,15,0.92) 96%)" }} />
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 32px" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Explore Europe's best universities</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginTop: 8, maxWidth: 460 }}>
            {loading ? t("common.loading") : t("universities.totalFound", { count: total })} — find the campus that becomes your next home.
          </div>
        </div>
      </div>

      {/* ── Search + filters below hero ── */}
      <div className="px-6 sm:px-8 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <span className="absolute start-4 top-1/2 -translate-y-1/2" style={{ color: "var(--accent-active)" }}><Icon d={ICONS.search} size={15} /></span>
            <input
              type="text"
              placeholder={t("universities.searchPlaceholder2")}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-xl ps-10 pe-4 py-2.5 text-sm text-[var(--ink)] transition focus:outline-none"
              style={{ background: "var(--surface-hover)", border: "1px solid var(--border)" }}
              onFocus={e => { e.target.style.borderColor = "var(--accent)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
            />
          </div>
          <select
            value={country}
            onChange={e => { setCountry(e.target.value); setPage(1); }}
            className="rounded-xl px-4 py-2.5 text-sm text-[var(--ink)] cursor-pointer focus:outline-none"
            style={{ background: "var(--surface-hover)", border: "1px solid var(--border)" }}
          >
            <option value="">{t("universities.filterCountry")}</option>
            <option value="Germany">🇩🇪 {t("universities.germany")}</option>
            <option value="Poland">🇵🇱 {t("universities.poland")}</option>
            <option value="Romania">🇷🇴 {t("universities.romania")}</option>
          </select>
        </div>

        {/* Language filter pills */}
        <div className="flex items-center gap-2 flex-wrap">

          {LANG_FILTERS.map(({ value, label, flag }) => (
            <button key={value} onClick={() => setLang(value)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                background: langFilter === value ? grad : "var(--surface-hover)",
                color: langFilter === value ? "#fff" : "var(--ink-dim)",
                border: `1px solid ${langFilter === value ? "transparent" : "var(--border)"}`,
              }}>
              <span>{flag}</span> {label}
            </button>
          ))}

          {userLangs.length > 0 && langFilter === "" && (
            <div className="ms-2 flex items-center gap-2 ps-4" style={{ borderLeft: "1px solid var(--border)" }}>
              <span className={`text-xs font-semibold ${textFaint}`}>Your languages:</span>
              {userLangs.map(ul => {
                const meta = LANG_FILTERS.find(lf => lf.value === ul.language);
                if (!meta?.value) return null;
                return (
                  <button key={ul.id} onClick={() => setLang(ul.language)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={{ background: "var(--accent-subtle)", color: "var(--accent-active)", border: "1px solid var(--accent)" }}>
                    {meta.flag} {meta.label}
                    <span className="ms-1 px-1.5 py-0.5 rounded-full text-[10px]"
                          style={{ background: "var(--accent)", color: "var(--on-accent)" }}>{ul.level}</span>
                  </button>
                );
              })}
            </div>
          )}

          {langFilter && (
            <button onClick={() => setLang("")}
              className={`text-xs ${textFaint} hover:text-[var(--ink)] transition ms-2 underline`}>
              {t("universities.clearFilter")}
            </button>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="px-6 sm:px-8 py-7">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : universities.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-10">
            <div className="relative rounded-3xl overflow-hidden mb-6" style={{ border: "1px solid var(--border)" }}>
              <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=700&q=70" alt=""
                   className="w-full h-40 object-cover" style={{ filter: "brightness(0.6)" }} />
              <div className="absolute inset-0 flex items-center justify-center"><div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)" }}><Icon d={ICONS.search} size={24} /></div></div>
            </div>
            <p className="text-[var(--ink)] font-bold text-xl mb-2">{t("universities.noFound")}</p>
            <p className={`${textFaint} text-sm mb-6`}>{t("universities.adjustFilters")}</p>
            <button onClick={() => { setLang(""); setCountry(""); setSearch(""); setPage(1); }}
              className="text-white text-sm font-bold px-6 py-2.5 rounded-xl transition hover:opacity-90"
              style={{ background: grad }}>
              {t("universities.clearFilters")}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
              {universities.map(uni => {
                const flag  = COUNTRY_FLAG[uni.country] || "🏛️";
                const photo = CAMPUS_PHOTOS[uni.country] || FALLBACK_PHOTO;
                const isFav = favourites.has(uni.id);
                const score = scoreMap[uni.id];
                const hasScholarships = scholarshipUnis.has(uni.id);

                return (
                  <Link key={uni.id} to={`/university/${uni.id}`}
                    className="group flex flex-col rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", boxShadow: "var(--shadow-xs)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "var(--shadow-xs)"; }}>

                    {/* Campus photo — bigger, more premium */}
                    <div className="relative h-52 overflow-hidden">
                      <img src={photo} alt={uni.country} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                           style={{ filter: "brightness(0.8) saturate(1.1)" }} />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(6,9,15,0.9), rgba(6,9,15,0.05) 55%)" }} />

                      {/* match ring top-left */}
                      {score !== undefined && (
                        <div className="absolute top-3.5 start-3.5">
                          <MatchRing score={score} />
                        </div>
                      )}

                      {/* quick preview + save, top-right */}
                      <div className="absolute top-3.5 end-3.5 flex gap-2">
                        <button
                          onClick={e => { e.preventDefault(); setPreviewUni(uni.id); }}
                          title="Quick preview"
                          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                          style={{ background: "rgba(6,9,15,0.55)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                          <Icon d={ICONS.eye} size={16} />
                        </button>
                        <button onClick={e => { e.preventDefault(); toggleFavourite(uni.id); }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 ${poppedFav === uni.id ? "pop-in" : ""}`}
                          style={{ background: "rgba(6,9,15,0.55)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                               fill={isFav ? "#f43f5e" : "none"}>
                            <path d={ICONS.heart[0]} />
                          </svg>
                        </button>
                      </div>

                      {/* name + location overlaid on photo — premium hierarchy */}
                      <div className="absolute bottom-0 start-0 end-0 p-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">{flag}</span>
                          <span className="text-[11px] font-semibold text-white/75">{uni.city}, {uni.country}</span>
                        </div>
                        <h3 className="font-extrabold text-white text-[15px] leading-tight" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>
                          {uni.name}
                        </h3>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-4 flex flex-col flex-1">
                      {/* Quick highlights row */}
                      <div className="flex flex-wrap gap-1.5 mb-3.5">
                        {uni.ranking && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold"
                                style={{ background: "var(--warn-subtle)", color: "var(--warn)" }}>
                            <Icon d={ICONS.award} size={11} /> #{uni.ranking}
                          </span>
                        )}
                        <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                              style={{ background: uni.is_public ? "var(--good-subtle)" : "var(--accent-subtle)",
                                       color: uni.is_public ? "var(--good)" : "var(--accent-active)" }}>
                          {uni.is_public ? t("university.publicType") : t("university.privateType")}
                        </span>
                        {uni.english_programs_available && (
                          <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                                style={{ background: "var(--good-subtle)", color: "var(--good)" }}>
                            🇬🇧 EN
                          </span>
                        )}
                        {hasScholarships && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold"
                                style={{ background: "var(--accent-subtle)", color: "var(--accent-active)" }}>
                            <Icon d={ICONS.scholarships} size={11} /> Scholarships
                          </span>
                        )}
                        <button
                          onClick={e => {
                            e.preventDefault();
                            setCompareSet(prev => {
                              const next = new Set(prev);
                              if (next.has(uni.id)) { next.delete(uni.id); }
                              else if (next.size < 3) { next.add(uni.id); }
                              else { toast.error(t("universities.compareMax")); }
                              return next;
                            });
                          }}
                          title={t("universities.compare")}
                          className="ms-auto inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all"
                          style={{
                            background: compareSet.has(uni.id) ? "var(--accent)" : "var(--surface-hover)",
                            color: compareSet.has(uni.id) ? "var(--on-accent)" : "var(--ink-faint)",
                            border: `1px solid ${compareSet.has(uni.id) ? "var(--accent)" : "var(--border)"}`,
                          }}>
                          <Icon d={ICONS.scale} size={11} /> {t("universities.compare")}
                        </button>
                      </div>

                      {uni.description && (
                        <p className={`${textFaint} text-xs mb-3.5 flex-1 line-clamp-2 leading-relaxed`}>{uni.description}</p>
                      )}

                      {/* Quick facts strip */}
                      <div className="grid grid-cols-3 gap-2 mb-3.5">
                        <div className="rounded-lg py-1.5 text-center" style={{ background: "var(--surface-hover)" }}>
                          <p className="text-[9px] font-semibold uppercase" style={{ color: "var(--ink-faint)" }}>Ranking</p>
                          <p className="text-xs font-bold" style={{ color: "var(--ink)" }}>{uni.ranking ? `#${uni.ranking}` : "—"}</p>
                        </div>
                        <div className="rounded-lg py-1.5 text-center" style={{ background: "var(--surface-hover)" }}>
                          <p className="text-[9px] font-semibold uppercase" style={{ color: "var(--ink-faint)" }}>Accept.</p>
                          <p className="text-xs font-bold" style={{ color: "var(--ink)" }}>{uni.acceptance_rate ? `${uni.acceptance_rate}%` : "—"}</p>
                        </div>
                        <div className="rounded-lg py-1.5 text-center" style={{ background: "var(--surface-hover)" }}>
                          <p className="text-[9px] font-semibold uppercase" style={{ color: "var(--ink-faint)" }}>Min GPA</p>
                          <p className="text-xs font-bold" style={{ color: "var(--ink)" }}>{uni.min_gpa ?? "—"}</p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-auto pt-3.5"
                           style={{ borderTop: "1px solid var(--border)" }}>
                        <span className="text-sm font-extrabold"
                              style={{ color: uni.tuition_fee_eur === 0 ? "var(--good)" : "var(--ink)" }}>
                          {uni.tuition_fee_eur === 0 ? t("dashboard.freeTuition") : `€${uni.tuition_fee_eur?.toLocaleString()}/yr`}
                        </span>
                        <span className="text-xs font-bold flex items-center gap-1 transition-all group-hover:gap-2"
                              style={{ color: "var(--accent)" }}>
                          {t("recommendations.viewDetails")} →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-10 h-10 rounded-xl text-sm font-bold transition"
                    style={{
                      background: p === page ? grad : "var(--surface-hover)",
                      color: p === page ? "#fff" : "var(--ink-dim)",
                      border: `1px solid ${p === page ? "transparent" : "var(--border)"}`,
                    }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick preview modal */}
      {previewData && (
        <QuickPreview
          uni={previewData}
          score={scoreMap[previewData.id]}
          isFav={favourites.has(previewData.id)}
          onToggleFav={toggleFavourite}
          onClose={() => setPreviewUni(null)}
        />
      )}

      {/* Floating compare bar */}
      {compareSet.size > 0 && (
        <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-30 text-[var(--ink)] rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 pop-in"
             style={{ background: "var(--surface-2)", border: "1px solid var(--accent)" }}>
          <span className="text-sm font-semibold inline-flex items-center gap-1.5"><Icon d={ICONS.scale} size={14} /> {t("universities.compareCount", { count: compareSet.size })}</span>
          <div className="flex gap-2">
            {universities.filter(u => compareSet.has(u.id)).map(u => (
              <span key={u.id} className="text-xs px-2 py-1 rounded-lg truncate max-w-[120px]"
                    style={{ background: "var(--border)" }}>{u.name}</span>
            ))}
          </div>
          <button onClick={() => navigate(`/recommendations?compare=${[...compareSet].join(",")}`)}
            className="text-[var(--ink)] text-xs font-bold px-3 py-1.5 rounded-xl transition hover:opacity-90"
            style={{ background: "var(--accent)" }}>
            {t("universities.compareGo")}
          </button>
          <button onClick={() => setCompareSet(new Set())} style={{ color: "var(--ink-faint)" }}><Icon d={ICONS.x} size={14} /></button>
        </div>
      )}
    </div>
  );
};

export default Universities;
