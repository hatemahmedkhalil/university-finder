import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const COUNTRY_FLAG = {
  Germany: "🇩🇪", Poland: "🇵🇱", Austria: "🇦🇹", Netherlands: "🇳🇱",
  France: "🇫🇷", Sweden: "🇸🇪", Italy: "🇮🇹", Spain: "🇪🇸",
};

/* Campus photos per country (Unsplash free) */
const CAMPUS_PHOTOS = {
  Germany:     "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&q=75",
  Poland:      "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600&q=75",
  Austria:     "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600&q=75",
  Netherlands: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&q=75",
  France:      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=75",
  Sweden:      "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=600&q=75",
  Italy:       "https://images.unsplash.com/photo-1533676802871-eca1ae998cd5?w=600&q=75",
  Spain:       "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=75",
};

/* ── design tokens ── */
const bg        = "bg-[oklch(0.13_0.018_285)]";
const card      = "bg-[oklch(0.17_0.02_285)]";
const cardHover = "hover:bg-[oklch(0.20_0.024_285)]";
const border    = "border-[oklch(1_0_0/0.07)]";
const borderMd  = "border-[oklch(1_0_0/0.12)]";
const textDim   = "text-[oklch(0.72_0.02_285)]";
const textFaint = "text-[oklch(0.52_0.02_285)]";
const grad      = "linear-gradient(135deg,oklch(0.62_0.24_296),oklch(0.64_0.21_264))";

const SkeletonCard = () => (
  <div className={`${card} rounded-2xl border ${border} overflow-hidden animate-pulse`}>
    <div className="h-36 bg-[oklch(0.22_0.02_285)]" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-[oklch(0.22_0.02_285)] rounded w-3/4" />
      <div className="h-3 bg-[oklch(0.22_0.02_285)] rounded w-1/2" />
      <div className="flex gap-2">
        <div className="h-5 w-14 bg-[oklch(0.22_0.02_285)] rounded-full" />
        <div className="h-5 w-18 bg-[oklch(0.22_0.02_285)] rounded-full" />
      </div>
    </div>
  </div>
);

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

  return (
    <div className={`min-h-screen ${bg} text-[oklch(0.96_0.006_285)]`}>

      {/* ── Hero: 220px full-bleed photo matching design ── */}
      <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
        <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=70"
             alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, oklch(0.13 0.05 296 / 0.4), oklch(0.13 0.018 285) 95%)" }} />
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 32px" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{t("universities.title")}</div>
          <div style={{ fontSize: 14, color: "oklch(0.80 0.02 285)", marginTop: 6 }}>
            {loading ? t("common.loading") : t("universities.totalFound", { count: total })}
          </div>
        </div>
      </div>

      {/* ── Search + filters below hero ── */}
      <div className="px-8 py-5" style={{ borderBottom: "1px solid oklch(1 0 0 / 0.07)" }}>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <span className="absolute start-4 top-1/2 -translate-y-1/2" style={{ color: "oklch(0.55 0.15 296)" }}>🔍</span>
            <input
              type="text"
              placeholder={t("universities.searchPlaceholder2")}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-xl ps-10 pe-4 py-2.5 text-sm text-white transition focus:outline-none"
              style={{ background: "oklch(0.20 0.02 285)", border: "1px solid oklch(1 0 0 / 0.09)" }}
              onFocus={e => { e.target.style.borderColor = "oklch(0.62 0.24 296 / 0.5)"; }}
              onBlur={e => { e.target.style.borderColor = "oklch(1 0 0 / 0.09)"; }}
            />
          </div>
          <select
            value={country}
            onChange={e => { setCountry(e.target.value); setPage(1); }}
            className="rounded-xl px-4 py-2.5 text-sm text-white cursor-pointer focus:outline-none"
            style={{ background: "oklch(0.20 0.02 285)", border: "1px solid oklch(1 0 0 / 0.09)" }}
          >
            <option value="">🌍 {t("universities.filterCountry")}</option>
            <option value="Germany">🇩🇪 {t("universities.germany")}</option>
            <option value="Poland">🇵🇱 {t("universities.poland")}</option>
            <option value="Austria">🇦🇹 {t("universities.austria")}</option>
            <option value="Netherlands">🇳🇱 {t("universities.netherlands")}</option>
          </select>
        </div>

        {/* Language filter pills */}
        <div className="flex items-center gap-2 flex-wrap">

          {LANG_FILTERS.map(({ value, label, flag }) => (
            <button key={value} onClick={() => setLang(value)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                background: langFilter === value ? grad : "oklch(0.20 0.024 285)",
                color: langFilter === value ? "#fff" : "oklch(0.72 0.02 285)",
                border: `1px solid ${langFilter === value ? "transparent" : "oklch(1 0 0 / 0.08)"}`,
              }}>
              <span>{flag}</span> {label}
            </button>
          ))}

          {userLangs.length > 0 && langFilter === "" && (
            <div className="ms-2 flex items-center gap-2 ps-4" style={{ borderLeft: "1px solid oklch(1 0 0 / 0.10)" }}>
              <span className={`text-xs font-semibold ${textFaint}`}>Your languages:</span>
              {userLangs.map(ul => {
                const meta = LANG_FILTERS.find(lf => lf.value === ul.language);
                if (!meta?.value) return null;
                return (
                  <button key={ul.id} onClick={() => setLang(ul.language)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={{ background: "oklch(0.55 0.22 296 / 0.15)", color: "oklch(0.85 0.10 296)", border: "1px solid oklch(0.55 0.22 296 / 0.25)" }}>
                    {meta.flag} {meta.label}
                    <span className="ms-1 px-1.5 py-0.5 rounded-full text-[10px]"
                          style={{ background: "oklch(0.55 0.22 296 / 0.25)", color: "oklch(0.85 0.10 296)" }}>{ul.level}</span>
                  </button>
                );
              })}
            </div>
          )}

          {langFilter && (
            <button onClick={() => setLang("")}
              className={`text-xs ${textFaint} hover:text-white transition ms-2 underline`}>
              {t("universities.clearFilter")} ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : universities.length === 0 ? (
          <div className="text-center py-32">
            <div className="text-7xl mb-4">🏫</div>
            <p className="text-white font-bold text-xl mb-2">{t("universities.noFound")}</p>
            <p className={`${textFaint} text-sm mb-6`}>{t("universities.adjustFilters")}</p>
            <button onClick={() => { setLang(""); setCountry(""); setSearch(""); setPage(1); }}
              className="text-white text-sm font-bold px-6 py-2.5 rounded-xl transition"
              style={{ background: grad }}>
              {t("universities.clearFilters")}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {universities.map(uni => {
                const flag  = COUNTRY_FLAG[uni.country] || "🏛️";
                const photo = CAMPUS_PHOTOS[uni.country];
                const isFav = favourites.has(uni.id);
                const score = scoreMap[uni.id];

                return (
                  <Link key={uni.id} to={`/university/${uni.id}`}
                    className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-200"
                    style={{ background: "oklch(0.17 0.02 285)", border: "1px solid oklch(1 0 0 / 0.07)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "oklch(0.62 0.24 296 / 0.35)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "oklch(1 0 0 / 0.07)"; e.currentTarget.style.transform = "none"; }}>

                    {/* Campus photo */}
                    <div className="relative h-36 overflow-hidden">
                      {photo ? (
                        <img src={photo} alt={uni.country} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                             style={{ filter: "brightness(0.75) saturate(1.1)" }} />
                      ) : (
                        <div className="w-full h-full" style={{ background: "oklch(0.20 0.024 285)" }} />
                      )}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, oklch(0.17 0.02 285 / 0.85), transparent 60%)" }} />

                      {/* match badge top-left (frosted glass) */}
                      {score !== undefined && (
                        <div className="absolute top-3 start-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white"
                             style={{ background: "oklch(0.13 0.018 285 / 0.75)", backdropFilter: "blur(8px)", border: "1px solid oklch(1 0 0 / 0.15)" }}>
                          🎯 {score}%
                        </div>
                      )}
                      {/* save icon top-right (frosted glass) */}
                      <button onClick={e => { e.preventDefault(); toggleFavourite(uni.id); }}
                        className="absolute top-3 end-3 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: "oklch(0.13 0.018 285 / 0.75)", backdropFilter: "blur(8px)", border: "1px solid oklch(1 0 0 / 0.15)" }}>
                        <span style={{ filter: isFav ? "none" : "grayscale(1) opacity(0.6)" }}>{isFav ? "❤️" : "🤍"}</span>
                      </button>

                      {/* country flag */}
                      <div className="absolute bottom-3 start-4 flex items-center gap-2">
                        <span className="text-xl">{flag}</span>
                        <span className="text-white text-xs font-semibold opacity-80">{uni.country}</span>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-4 flex flex-col flex-1">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-white text-sm leading-tight truncate">{uni.name}</h3>
                          <p className={`text-xs mt-0.5 truncate ${textFaint}`}>📍 {uni.city}, {uni.country}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
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
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-110"
                            style={{
                              background: compareSet.has(uni.id) ? "oklch(0.55 0.22 296 / 0.3)" : "oklch(1 0 0 / 0.05)",
                              color: compareSet.has(uni.id) ? "oklch(0.85 0.10 296)" : "oklch(0.50 0.02 285)",
                            }}>
                            ⚖
                          </button>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {uni.ranking && (
                          <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                                style={{ background: "oklch(0.65 0.18 75 / 0.15)", color: "oklch(0.85 0.12 75)" }}>
                            🏆 #{uni.ranking}
                          </span>
                        )}
                        <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                              style={{ background: uni.is_public ? "oklch(0.55 0.15 220 / 0.15)" : "oklch(0.55 0.22 296 / 0.15)",
                                       color: uni.is_public ? "oklch(0.80 0.10 220)" : "oklch(0.85 0.10 296)" }}>
                          {uni.is_public ? `🏛️ ${t("university.publicType")}` : `🔒 ${t("university.privateType")}`}
                        </span>
                        {uni.english_programs_available && (
                          <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                                style={{ background: "oklch(0.55 0.18 158 / 0.15)", color: "oklch(0.80 0.12 158)" }}>
                            🇬🇧 EN
                          </span>
                        )}
                      </div>

                      {uni.description && (
                        <p className={`${textFaint} text-xs mb-3 flex-1 line-clamp-2 leading-relaxed`}>{uni.description}</p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-auto pt-3"
                           style={{ borderTop: "1px solid oklch(1 0 0 / 0.06)" }}>
                        <span className="text-sm font-bold"
                              style={{ color: uni.tuition_fee_eur === 0 ? "oklch(0.72 0.18 158)" : "oklch(0.82 0.01 285)" }}>
                          {uni.tuition_fee_eur === 0 ? `✨ ${t("dashboard.freeTuition")}` : `€${uni.tuition_fee_eur?.toLocaleString()}/yr`}
                        </span>
                        <span className="text-xs font-semibold flex items-center gap-1 transition-all group-hover:gap-2"
                              style={{ color: "oklch(0.80 0.10 296)" }}>
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
                      background: p === page ? grad : "oklch(0.20 0.024 285)",
                      color: p === page ? "#fff" : "oklch(0.72 0.02 285)",
                      border: `1px solid ${p === page ? "transparent" : "oklch(1 0 0 / 0.08)"}`,
                    }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating compare bar */}
      {compareSet.size > 0 && (
        <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-30 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4"
             style={{ background: "oklch(0.22 0.030 285)", border: "1px solid oklch(0.62 0.24 296 / 0.30)" }}>
          <span className="text-sm font-semibold">⚖ {t("universities.compareCount", { count: compareSet.size })}</span>
          <div className="flex gap-2">
            {universities.filter(u => compareSet.has(u.id)).map(u => (
              <span key={u.id} className="text-xs px-2 py-1 rounded-lg truncate max-w-[120px]"
                    style={{ background: "oklch(1 0 0 / 0.08)" }}>{u.name}</span>
            ))}
          </div>
          <button onClick={() => navigate(`/recommendations?compare=${[...compareSet].join(",")}`)}
            className="text-white text-xs font-bold px-3 py-1.5 rounded-xl transition hover:opacity-90"
            style={{ background: "oklch(0.55 0.22 296)" }}>
            {t("universities.compareGo")}
          </button>
          <button onClick={() => setCompareSet(new Set())} className="text-sm" style={{ color: "oklch(0.50 0.02 285)" }}>✕</button>
        </div>
      )}
    </div>
  );
};

export default Universities;
