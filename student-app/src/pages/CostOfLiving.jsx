import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";
import { Icon, ICONS } from "../components/Sidebar";

/* ── design tokens ── */
const bg        = "bg-[var(--bg)]";
const card      = "bg-[var(--surface-2)]";
const border    = "border-[rgba(255,255,255,0.07)]";
const borderMd  = "border-[rgba(255,255,255,0.12)]";
const textDim   = "text-[var(--ink-dim)]";
const textFaint = "text-[var(--ink-faint)]";

const COUNTRIES = ["All", "Germany", "Poland", "Romania"];

const COUNTRY_FLAG = { Germany: "🇩🇪", Poland: "🇵🇱", Romania: "🇷🇴" };

const BAR_COLORS = {
  rent:      "bg-violet-500",
  food:      "bg-emerald-500",
  transport: "bg-amber-500",
  utilities: "bg-sky-500",
};

const formatEur = (n) => (n == null ? "—" : `€${n.toLocaleString()}`);

const CostBar = ({ label, icon, value, max, color }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={`${textDim} inline-flex items-center gap-1.5`}>{icon && <Icon d={icon} size={12} />}{label}</span>
        <span className="text-[var(--ink)] font-medium">{formatEur(value)}/mo</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className={`${card} rounded-2xl border ${border} p-5 animate-pulse space-y-3`}>
    <div className="h-4 bg-[var(--surface-2)] rounded w-2/3" />
    <div className="h-3 bg-[var(--surface-2)] rounded w-1/3" />
    <div className="h-2 bg-[var(--surface-2)] rounded w-full" />
    <div className="h-2 bg-[var(--surface-2)] rounded w-full" />
    <div className="h-2 bg-[var(--surface-2)] rounded w-3/4" />
  </div>
);

const CostOfLiving = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [cities, setCities]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [country, setCountry]     = useState("All");
  const [sort, setSort]           = useState("city_asc");
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    api.get("/api/cost-of-living")
      .then((r) => setCities(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = cities;
    if (country !== "All") list = list.filter((c) => c.country === country);
    if (search.trim())     list = list.filter((c) =>
      c.city.toLowerCase().includes(search.toLowerCase())
    );
    list = [...list];
    if (sort === "city_asc")    list.sort((a, b) => a.city.localeCompare(b.city));
    if (sort === "city_desc")   list.sort((a, b) => b.city.localeCompare(a.city));
    if (sort === "cost_asc")    list.sort((a, b) => (a.total_min_eur ?? 0) - (b.total_min_eur ?? 0));
    if (sort === "cost_desc")   list.sort((a, b) => (b.total_min_eur ?? 0) - (a.total_min_eur ?? 0));
    return list;
  }, [cities, country, search, sort]);

  // max values for bar scaling
  const maxValues = useMemo(() => ({
    rent: Math.max(...cities.map((c) => c.rent_shared_eur ?? 0)),
    food: Math.max(...cities.map((c) => c.food_eur ?? 0)),
    transport: Math.max(...cities.map((c) => c.transport_eur ?? 0)),
    utilities: Math.max(...cities.map((c) => c.utilities_eur ?? 0)),
  }), [cities]);

  const budgetColor = (min) => {
    if (min <= 600)  return "text-emerald-400";
    if (min <= 900)  return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className={`min-h-screen ${bg} text-[var(--ink)]`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="px-4 pt-8 pb-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">
          {t("costOfLiving.title", "Cost of Living Calculator")}
        </h1>
        <p className={`text-sm ${textDim}`}>
          {t("costOfLiving.subtitle", "Monthly expenses per city — Germany, Poland & Romania")}
        </p>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg className={`absolute top-2.5 ${isRTL ? "right-3" : "left-3"} w-4 h-4 ${textFaint}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("costOfLiving.searchCity", "Search city…")}
              className={`w-full ${card} border ${borderMd} rounded-xl py-2 ${isRTL ? "pr-9 pl-4" : "pl-9 pr-4"} text-sm text-[var(--ink)] placeholder:${textFaint} focus:outline-none focus:border-violet-500`}
            />
          </div>

          {/* Country filter */}
          <div className="flex gap-1 flex-wrap">
            {COUNTRIES.map((c) => (
              <button
                key={c}
                onClick={() => setCountry(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  country === c
                    ? "bg-violet-600 text-[var(--ink)]"
                    : `${card} border ${border} ${textDim} hover:border-violet-500`
                }`}
              >
                {c === "All" ? <span className="inline-flex items-center gap-1"><Icon d={ICONS.globe} size={12} /> All</span> : `${COUNTRY_FLAG[c]} ${c}`}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={`${card} border ${borderMd} rounded-xl py-2 px-3 text-sm text-[var(--ink)] focus:outline-none focus:border-violet-500`}
          >
            <option value="city_asc">City A→Z</option>
            <option value="city_desc">City Z→A</option>
            <option value="cost_asc">Cheapest first</option>
            <option value="cost_desc">Most expensive first</option>
          </select>
        </div>

        <p className={`mt-3 text-xs ${textFaint}`}>
          {filtered.length} {t("costOfLiving.citiesFound", "cities")}
        </p>
      </div>

      {/* Grid */}
      <div className="px-4 pb-16 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered.map((c) => (
            <button
              key={`${c.city}-${c.country}`}
              onClick={() => setSelected(c)}
              className={`${card} rounded-2xl border ${border} p-5 text-left hover:border-violet-500 transition-colors group`}
            >
              {/* City header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="font-semibold text-sm leading-tight">{c.city}</div>
                  <div className={`text-xs ${textFaint} mt-0.5`}>
                    {COUNTRY_FLAG[c.country]} {c.country}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-base font-bold ${budgetColor(c.total_min_eur)}`}>
                    {formatEur(c.total_min_eur)}
                  </div>
                  <div className={`text-xs ${textFaint}`}>– {formatEur(c.total_max_eur)}/mo</div>
                </div>
              </div>

              {/* Mini bars */}
              <div className="space-y-1.5">
                <CostBar icon={ICONS.home} label="Rent (shared)" value={c.rent_shared_eur} max={maxValues.rent} color={BAR_COLORS.rent} />
                <CostBar icon={ICONS.utensils} label="Food" value={c.food_eur} max={maxValues.food} color={BAR_COLORS.food} />
                <CostBar icon={ICONS.bus} label="Transport" value={c.transport_eur} max={maxValues.transport} color={BAR_COLORS.transport} />
                <CostBar icon={ICONS.bolt} label="Utilities" value={c.utilities_eur} max={maxValues.utilities} color={BAR_COLORS.utilities} />
              </div>

              <div className={`mt-3 text-xs ${textFaint} group-hover:text-violet-400 transition-colors`}>
                {t("costOfLiving.details", "View details →")}
              </div>
            </button>
          ))
        }
      </div>

      {/* Detail modal — portal escapes the page-enter transform stacking context */}
      {selected && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className={`${card} rounded-2xl border ${borderMd} w-full max-w-md p-6 space-y-5 text-[var(--ink)]`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{selected.city}</h2>
                <p className={`text-sm ${textFaint}`}>{COUNTRY_FLAG[selected.country]} {selected.country}</p>
              </div>
              <button onClick={() => setSelected(null)} className={`${textFaint} hover:text-[var(--ink)] text-xl leading-none`}><Icon d={ICONS.x} size={16} /></button>
            </div>

            {/* Budget range */}
            <div className="rounded-xl bg-[var(--bg)] p-4 text-center">
              <p className={`text-xs ${textFaint} mb-1`}>{t("costOfLiving.estimatedBudget", "Estimated monthly budget")}</p>
              <p className={`text-3xl font-bold ${budgetColor(selected.total_min_eur)}`}>
                {formatEur(selected.total_min_eur)} – {formatEur(selected.total_max_eur)}
              </p>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              {[
                { label: "Rent — single room",  icon: ICONS.home,     value: selected.rent_single_eur, color: BAR_COLORS.rent },
                { label: "Rent — shared / dorm", icon: ICONS.home,     value: selected.rent_shared_eur, color: BAR_COLORS.rent },
                { label: "Food & groceries",      icon: ICONS.utensils, value: selected.food_eur,        color: BAR_COLORS.food },
                { label: "Public transport",      icon: ICONS.bus,      value: selected.transport_eur,   color: BAR_COLORS.transport },
                { label: "Utilities & internet",  icon: ICONS.bolt,     value: selected.utilities_eur,   color: BAR_COLORS.utilities },
              ].map(({ label, icon, value, color }) => (
                <CostBar
                  key={label}
                  label={label}
                  icon={icon}
                  value={value}
                  max={Math.max(selected.rent_single_eur, 1200)}
                  color={color}
                />
              ))}
            </div>

            {/* Notes */}
            {selected.notes && (
              <div className={`rounded-xl bg-[var(--bg)] p-3 text-xs ${textDim} leading-relaxed`}>
                {selected.notes}
              </div>
            )}

            <button
              onClick={() => setSelected(null)}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-sm font-medium transition-colors"
            >
              {t("common.close", "Close")}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CostOfLiving;
