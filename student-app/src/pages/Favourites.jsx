import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import PageHero from "../components/PageHero";
import { COUNTRY_FLAG } from "../lib/countries";

const COUNTRY_GRAD = {
  Germany:          "from-yellow-400 to-red-500",
  Poland:           "from-red-500 to-pink-600",
  Austria:          "from-red-500 to-gray-600",
  Netherlands:      "from-orange-500 to-blue-600",
  France:           "from-blue-600 to-red-500",
  Sweden:           "from-yellow-400 to-blue-600",
  Italy:            "from-green-500 to-red-500",
  Spain:            "from-red-600 to-yellow-400",
  Belgium:          "from-black to-yellow-400",
  Denmark:          "from-red-600 to-rose-400",
  Finland:          "from-blue-600 to-sky-400",
  Hungary:          "from-red-500 to-green-600",
  Norway:           "from-red-600 to-blue-600",
  Portugal:         "from-green-600 to-red-500",
  Romania:          "from-blue-600 to-yellow-400",
  Switzerland:      "from-red-600 to-rose-500",
  Ireland:          "from-green-600 to-orange-500",
  Greece:           "from-blue-600 to-sky-400",
  "Czech Republic": "from-blue-600 to-red-500",
  Slovakia:         "from-blue-600 to-red-500",
  Estonia:          "from-blue-600 to-slate-600",
  Latvia:           "from-red-700 to-rose-600",
  Lithuania:        "from-yellow-500 to-green-600",
  Luxembourg:       "from-red-500 to-sky-400",
};

const SORT_OPTIONS = [
  { value: "name",    label: "Name A–Z"      },
  { value: "ranking", label: "Best Ranking"  },
  { value: "fee_asc", label: "Lowest Fee"    },
  { value: "fee_desc",label: "Highest Fee"   },
];

const SkeletonCard = () => (
  <div className="bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] overflow-hidden animate-pulse">
    <div className="h-1.5 bg-gradient-to-r from-rose-200 to-pink-200" />
    <div className="p-5 flex gap-4 items-center">
      <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-[oklch(0.20_0.024_285)] rounded w-2/3" />
        <div className="h-3 bg-[oklch(0.20_0.024_285)] rounded w-1/3" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-14 bg-[oklch(0.20_0.024_285)] rounded-full" />
          <div className="h-5 w-18 bg-[oklch(0.20_0.024_285)] rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

const Favourites = () => {
  const { t } = useTranslation();
  const [universities, setUniversities] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [sort,         setSort]         = useState("name");
  const [pipelineAdded, setPipelineAdded] = useState({});

  useEffect(() => {
    api.get("/favourites")
      .then(res => setUniversities(res.data))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id) => {
    await api.delete(`/favourites/${id}`);
    setUniversities(prev => prev.filter(u => u.id !== id));
    toast.success(t("favourites.removed"));
  };

  const addToPipeline = async (uni) => {
    setPipelineAdded(prev => ({ ...prev, [uni.id]: "loading" }));
    try {
      await api.post("/pipeline", { university_id: uni.id });
      setPipelineAdded(prev => ({ ...prev, [uni.id]: "done" }));
      toast.success("Added to Pipeline — AI is analyzing your fit!");
    } catch (e) {
      const msg = e?.response?.data?.detail || "";
      if (msg.toLowerCase().includes("already")) {
        setPipelineAdded(prev => ({ ...prev, [uni.id]: "done" }));
        toast("Already in your pipeline", { icon: "ℹ️" });
      } else {
        setPipelineAdded(prev => ({ ...prev, [uni.id]: null }));
        toast.error("Failed to add — try again");
      }
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = universities.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.country.toLowerCase().includes(q) ||
      (u.city || "").toLowerCase().includes(q)
    );
    if (sort === "name")     list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "ranking")  list = [...list].sort((a, b) => (a.ranking ?? 9999) - (b.ranking ?? 9999));
    if (sort === "fee_asc")  list = [...list].sort((a, b) => a.tuition_fee_eur - b.tuition_fee_eur);
    if (sort === "fee_desc") list = [...list].sort((a, b) => b.tuition_fee_eur - a.tuition_fee_eur);
    return list;
  }, [universities, search, sort]);

  return (
    <div className="min-h-screen">

      <PageHero
        photo="https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=1400&q=80"
        title={t("favourites.title")}
        subtitle={loading ? t("common.loading") : `${universities.length} ${t("favourites.subtitle")}`}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Toolbar */}
        {!loading && universities.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[oklch(0.45_0.02_285)] text-sm">🔍</span>
              <input
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[oklch(1_0_0/0.08)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
                placeholder={t("favourites.searchPlaceholder")}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-[oklch(1_0_0/0.08)] bg-white text-sm font-medium text-[oklch(0.75_0.02_285)] focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>

        ) : universities.length === 0 ? (
          <div className="text-center py-32">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center text-5xl mx-auto mb-6 ">🤍</div>
            <h2 className="text-2xl font-bold text-white mb-2">{t("favourites.noFavourites")}</h2>
            <p className="text-[oklch(0.55_0.02_285)] mb-8">{t("favourites.browseSub")}</p>
            <Link to="/universities"
              className="inline-block bg-gradient-to-r from-rose-500 to-pink-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-rose-200 hover:from-rose-600 hover:to-pink-700 transition">
              {t("favourites.browse")} →
            </Link>
          </div>

        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-[oklch(0.75_0.02_285)] mb-2">No results for "{search}"</h3>
            <button onClick={() => setSearch("")} className="text-rose-500 font-semibold hover:underline text-sm">
              Clear search
            </button>
          </div>

        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
            {filtered.map(uni => {
              const grad = COUNTRY_GRAD[uni.country] || "from-indigo-500 to-violet-600";
              const flag = COUNTRY_FLAG[uni.country] || "🏛️";
              return (
                <div key={uni.id}
                  className="group bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] overflow-hidden flex flex-col card-lift">
                  <div className={`h-1.5 bg-gradient-to-r ${grad}`} />
                  <div className="p-5 flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-2xl shrink-0 `}>
                      {flag}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-base truncate group-hover:text-indigo-700 transition">
                        {uni.name}
                      </h3>
                      <p className="text-[oklch(0.45_0.02_285)] text-sm mt-0.5">📍 {uni.city}, {uni.country}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {uni.ranking && (
                          <span className="bg-amber-50 text-amber-700 text-[11px] px-2.5 py-1 rounded-full font-semibold border border-amber-100">
                            🏆 #{uni.ranking}
                          </span>
                        )}
                        {uni.english_programs_available && (
                          <span className="bg-emerald-50 text-emerald-700 text-[11px] px-2.5 py-1 rounded-full font-semibold border border-emerald-100">
                            🇬🇧 English
                          </span>
                        )}
                        {uni.is_public && (
                          <span className="bg-blue-50 text-blue-700 text-[11px] px-2.5 py-1 rounded-full font-semibold border border-blue-100">
                            🏛 Public
                          </span>
                        )}
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border ${
                          uni.tuition_fee_eur === 0
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-gray-50 text-[oklch(0.65_0.02_285)] border-gray-100"
                        }`}>
                          {uni.tuition_fee_eur === 0 ? "✨ Free" : `€${uni.tuition_fee_eur?.toLocaleString()}/yr`}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Link to={`/university/${uni.id}`}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition text-center">
                        View →
                      </Link>
                      {uni.website && (
                        <a href={uni.website} target="_blank" rel="noreferrer"
                          className="text-xs font-semibold text-[oklch(0.55_0.02_285)] hover:text-[oklch(0.75_0.02_285)] bg-gray-50 hover:bg-[oklch(0.22_0.026_285)] px-3 py-1.5 rounded-lg transition text-center">
                          Site
                        </a>
                      )}
                      <button
                        onClick={() => addToPipeline(uni)}
                        disabled={!!pipelineAdded[uni.id]}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-60 ${
                          pipelineAdded[uni.id] === "done"
                            ? "text-emerald-700 bg-emerald-50"
                            : "text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100"
                        }`}
                      >
                        {pipelineAdded[uni.id] === "done" ? "✓ Added" : pipelineAdded[uni.id] === "loading" ? "…" : "🚀 Pipeline"}
                      </button>
                      <button onClick={() => remove(uni.id)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favourites;

