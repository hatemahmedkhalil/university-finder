import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const COUNTRY_COLORS = {
  Germany:     "from-yellow-400 to-red-500",
  Poland:      "from-red-500 to-pink-600",
  Austria:     "from-red-500 to-gray-700",
  Netherlands: "from-orange-500 to-blue-600",
  France:      "from-blue-600 to-red-500",
  Sweden:      "from-yellow-400 to-blue-600",
  Italy:       "from-green-500 to-red-500",
  Spain:       "from-yellow-400 to-red-600",
};

const COUNTRY_FLAG = {
  Germany: "🇩🇪", Poland: "🇵🇱", Austria: "🇦🇹", Netherlands: "🇳🇱",
  France: "🇫🇷", Sweden: "🇸🇪", Italy: "🇮🇹", Spain: "🇪🇸",
};

/* Skeleton card */
const SkeletonUniCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
    <div className="h-2 bg-gradient-to-r from-indigo-300 to-purple-300" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-gray-100 rounded-lg w-3/4" />
      <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
      <div className="flex gap-2 pt-1">
        <div className="h-6 w-16 bg-gray-100 rounded-full" />
        <div className="h-6 w-20 bg-gray-100 rounded-full" />
        <div className="h-6 w-14 bg-gray-100 rounded-full" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-4/5" />
    </div>
  </div>
);

const scoreColor = (s) =>
  s >= 75 ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
  s >= 50 ? "text-amber-700 bg-amber-50 border-amber-200" :
  "text-red-700 bg-red-50 border-red-200";

const Universities = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [scoreMap, setScoreMap] = useState({});
  const [compareSet, setCompareSet] = useState(new Set());

  const LANG_FILTERS = [
    { value: "",        label: t("universities.filterLanguage"), flag: "🌍" },
    { value: "english", label: t("learning.english"),            flag: "🇬🇧" },
    { value: "german",  label: t("learning.german"),             flag: "🇩🇪" },
    { value: "polish",  label: t("learning.polish"),             flag: "🇵🇱" },
  ];
  const [universities, setUniversities] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [langFilter, setLangFilter] = useState("");
  const [userLangs, setUserLangs] = useState([]);
  const [page, setPage] = useState(1);
  const [favourites, setFavourites] = useState(new Set());
  const perPage = 9;

  useEffect(() => {
    if (user) {
      api.get("/user-languages").then(r => setUserLangs(r.data)).catch(() => {});
      api.get("/favourites").then(res => setFavourites(new Set(res.data.map(u => u.id))));
      // Load profile then run recommendations to build score map
      api.get("/profiles/me").then(p => {
        const profile = p.data;
        return api.post("/recommendations", {
          gpa: profile.gpa,
          budget_eur: profile.budget_eur,
          english_level: profile.english_level,
          language: profile.language,
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
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero header ── */}
      <div className="bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <p className="text-indigo-200 text-sm font-semibold uppercase tracking-widest mb-2">🏛️ Explore</p>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">{t("universities.title")}</h1>
          <p className="text-indigo-200 text-lg">
            {loading ? t("common.loading") : t("universities.totalFound", { count: total })}
          </p>

          {/* Search bar in hero */}
          <div className="mt-8 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300">🔍</span>
              <input
                type="text"
                placeholder={t("universities.searchPlaceholder2")}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-white/10 backdrop-blur border border-white/20 text-white placeholder-indigo-300 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:bg-white/20 focus:border-white/40 transition"
              />
            </div>
            <select
              value={country}
              onChange={e => { setCountry(e.target.value); setPage(1); }}
              className="bg-white/10 backdrop-blur border border-white/20 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:bg-white/20 transition appearance-none cursor-pointer"
            >
              <option value="" className="text-gray-800">🌍 {t("universities.filterCountry")}</option>
              <option value="Germany" className="text-gray-800">🇩🇪 {t("universities.germany")}</option>
              <option value="Poland" className="text-gray-800">🇵🇱 {t("universities.poland")}</option>
              <option value="Austria" className="text-gray-800">🇦🇹 {t("universities.austria")}</option>
              <option value="Netherlands" className="text-gray-800">🇳🇱 {t("universities.netherlands")}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Language filter pills */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {LANG_FILTERS.map(({ value, label, flag }) => (
              <button key={value} onClick={() => setLang(value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-200 ${
                  langFilter === value
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 scale-105"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:scale-105"
                }`}
              >
                <span className="text-base">{flag}</span> {label}
              </button>
            ))}

            {userLangs.length > 0 && langFilter === "" && (
              <div className="ml-2 flex items-center gap-2 border-l-2 border-gray-200 pl-4">
                <span className="text-xs text-gray-400 font-semibold">Your languages:</span>
                {userLangs.map(ul => {
                  const meta = LANG_FILTERS.find(lf => lf.value === ul.language);
                  if (!meta?.value) return null;
                  return (
                    <button key={ul.id} onClick={() => setLang(ul.language)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border-2 border-violet-200 hover:bg-violet-100 transition-all hover:scale-105">
                      {meta.flag} {meta.label}
                      <span className="ml-1 bg-violet-200 text-violet-800 px-1.5 py-0.5 rounded-full text-[10px]">{ul.level}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {langFilter && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-full font-medium">
                {langFilter === "english" && t("universities.hintEnglish")}
                {langFilter === "german"  && t("universities.hintGerman")}
                {langFilter === "polish"  && t("universities.hintPolish")}
              </span>
              <button onClick={() => setLang("")}
                className="text-xs text-gray-400 hover:text-gray-600 underline transition">
                {t("universities.clearFilter")} ✕
              </button>
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonUniCard key={i} />)}
          </div>
        ) : universities.length === 0 ? (
          <div className="text-center py-32">
            <div className="text-7xl mb-4">🏫</div>
            <p className="text-gray-700 font-bold text-xl mb-2">{t("universities.noFound")}</p>
            <p className="text-gray-400 text-sm mb-6">{t("universities.adjustFilters")}</p>
            <button onClick={() => { setLang(""); setCountry(""); setSearch(""); }}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition">
              {t("universities.clearFilters")}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
              {universities.map(uni => {
                const grad = COUNTRY_COLORS[uni.country] || "from-indigo-500 to-blue-600";
                const flag = COUNTRY_FLAG[uni.country] || "🏛️";
                const isFav = favourites.has(uni.id);
                return (
                  <Link key={uni.id} to={`/university/${uni.id}`}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col card-lift">

                    {/* Colored accent bar */}
                    <div className={`h-1.5 bg-gradient-to-r ${grad}`} />

                    <div className="p-5 flex flex-col flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-lg shrink-0 shadow-sm`}>
                            {flag}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-indigo-700 transition truncate">
                              {uni.name}
                            </h3>
                            <p className="text-gray-400 text-xs mt-0.5 truncate">📍 {uni.city}, {uni.country}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={e => { e.preventDefault(); toggleFavourite(uni.id); }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${
                              isFav ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-300 hover:text-red-400"
                            }`}>
                            {isFav ? "❤️" : "🤍"}
                          </button>
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
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-110 ${
                              compareSet.has(uni.id)
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                            }`}>
                            ⚖
                          </button>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {uni.ranking && (
                          <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-[11px] px-2.5 py-1 rounded-full font-semibold border border-amber-100">
                            🏆 #{uni.ranking}
                          </span>
                        )}
                        <span className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold border ${
                          uni.is_public
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : "bg-purple-50 text-purple-700 border-purple-100"
                        }`}>
                          {uni.is_public ? `🏛️ ${t("university.publicType")}` : `🔒 ${t("university.privateType")}`}
                        </span>
                        {uni.english_programs_available && (
                          <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] px-2.5 py-1 rounded-full font-semibold border border-emerald-100">
                            🇬🇧 {t("learning.english")}
                          </span>
                        )}
                        {scoreMap[uni.id] !== undefined && (
                          <span className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold border ${scoreColor(scoreMap[uni.id])}`}>
                            🎯 {scoreMap[uni.id]}%
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {uni.description && (
                        <p className="text-gray-500 text-xs mb-3 flex-1 line-clamp-2 leading-relaxed">{uni.description}</p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                        <span className={`text-sm font-bold ${uni.tuition_fee_eur === 0 ? "text-emerald-600" : "text-gray-700"}`}>
                          {uni.tuition_fee_eur === 0 ? `✨ ${t("dashboard.freeTuition")}` : `€${uni.tuition_fee_eur?.toLocaleString()}/yr`}
                        </span>
                        <span className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1 transition">
                          {t("recommendations.viewDetails")} <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
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
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition ${
                      p === page
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                        : "bg-white border-2 border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
                    }`}>{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Floating compare bar ── */}
      {compareSet.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4">
          <span className="text-sm font-semibold">
            ⚖ {t("universities.compareCount", { count: compareSet.size })}
          </span>
          <div className="flex gap-2">
            {universities.filter(u => compareSet.has(u.id)).map(u => (
              <span key={u.id} className="text-xs bg-white/10 px-2 py-1 rounded-lg truncate max-w-[120px]">{u.name}</span>
            ))}
          </div>
          <button
            onClick={() => {
              const ids = [...compareSet].join(",");
              navigate(`/recommendations?compare=${ids}`);
            }}
            className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition">
            {t("universities.compareGo")}
          </button>
          <button onClick={() => setCompareSet(new Set())}
            className="text-slate-400 hover:text-white transition text-sm">✕</button>
        </div>
      )}
    </div>
  );
};

export default Universities;
