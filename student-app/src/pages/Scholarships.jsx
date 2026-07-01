import { useState, useEffect } from "react";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

const TYPE_CONFIG = {
  government: { color: "from-blue-500 to-cyan-500",    bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-100",  icon: "🏛️" },
  university: { color: "from-violet-500 to-purple-600", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-100", icon: "🎓" },
  private:    { color: "from-orange-400 to-rose-500",   bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100", icon: "🏢" },
  erasmus:    { color: "from-emerald-500 to-teal-500",  bg: "bg-emerald-50",text: "text-emerald-700",border: "border-emerald-100",icon: "🇪🇺" },
};
const DEFAULT_TYPE = { color: "from-gray-400 to-gray-500", bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-100", icon: "💰" };

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
    <div className="h-1.5 bg-gradient-to-r from-indigo-300 to-purple-300" />
    <div className="p-5 space-y-3">
      <div className="flex justify-between gap-2">
        <div className="h-5 bg-gray-100 rounded-lg flex-1" />
        <div className="h-6 w-20 bg-gray-100 rounded-full" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-gray-100 rounded-full" />
        <div className="h-6 w-24 bg-gray-100 rounded-full" />
      </div>
      <div className="space-y-2 pt-1">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-4/5" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
  </div>
);

const Scholarships = () => {
  const { t } = useTranslation();

  const FILTER_ITEMS = [
    { value: "",           label: t("scholarships.types.all"),        icon: "✨" },
    { value: "government", label: t("scholarships.types.government"), icon: "🏛️" },
    { value: "university", label: t("scholarships.types.university"), icon: "🎓" },
    { value: "private",    label: t("scholarships.types.private"),    icon: "🏢" },
    { value: "erasmus",    label: t("scholarships.types.erasmus"),    icon: "🇪🇺" },
  ];
  const [scholarships, setScholarships] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 9;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ skip: (page - 1) * perPage, limit: perPage });
    if (type) params.set("scholarship_type", type);
    api.get(`/scholarships?${params}`)
      .then(res => { setScholarships(res.data.items); setTotal(res.data.total); })
      .finally(() => setLoading(false));
  }, [type, page]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-violet-700 via-purple-700 to-fuchsia-800 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <p className="text-violet-200 text-sm font-semibold uppercase tracking-widest mb-2">💰 Funding</p>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">{t("scholarships.title")}</h1>
          <p className="text-violet-200 text-lg">
            {loading ? t("common.loading") : t("scholarships.available", { count: total })}
          </p>

          {/* Filter pills inside hero */}
          <div className="flex flex-wrap gap-2 mt-8">
            {FILTER_ITEMS.map(({ value, label, icon }) => (
              <button key={value} onClick={() => { setType(value); setPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  type === value
                    ? "bg-white text-purple-700 shadow-lg scale-105"
                    : "bg-white/15 text-white border border-white/25 hover:bg-white/25 hover:scale-105"
                }`}>
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : scholarships.length === 0 ? (
          <div className="text-center py-32">
            <div className="text-7xl mb-4">💸</div>
            <p className="text-gray-700 font-bold text-xl mb-2">{t("scholarships.noFound")}</p>
            <p className="text-gray-400 text-sm mb-6">{t("scholarships.tryFilter")}</p>
            <button onClick={() => setType("")}
              className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-violet-700 transition">
              {t("scholarships.showAll")}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
              {scholarships.map(s => {
                const cfg = TYPE_CONFIG[s.scholarship_type] || DEFAULT_TYPE;
                const deadlineSoon = s.deadline && (new Date(s.deadline) - new Date()) < 30 * 86400000;
                return (
                  <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col card-lift">

                    {/* Colored top bar */}
                    <div className={`h-1.5 bg-gradient-to-r ${cfg.color}`} />

                    <div className="p-5 flex flex-col flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center text-lg shrink-0 shadow-sm`}>
                            {cfg.icon}
                          </div>
                          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{s.name}</h3>
                        </div>
                      </div>

                      {/* Type + country badges */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {s.scholarship_type && (
                          <span className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            {cfg.icon} {s.scholarship_type}
                          </span>
                        )}
                        {s.country && (
                          <span className="bg-gray-50 text-gray-600 text-[11px] px-2.5 py-1 rounded-full border border-gray-100 font-medium">
                            📍 {s.country}
                          </span>
                        )}
                      </div>

                      {/* Amount highlight */}
                      {s.amount_eur && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between">
                          <span className="text-xs text-emerald-600 font-semibold">{t("scholarships.awardAmount")}</span>
                          <span className="text-base font-extrabold text-emerald-700">€{s.amount_eur.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Deadline */}
                      {s.deadline && (
                        <div className={`rounded-xl px-4 py-2 mb-3 flex items-center justify-between ${
                          deadlineSoon ? "bg-red-50 border border-red-100" : "bg-gray-50 border border-gray-100"
                        }`}>
                          <span className={`text-xs font-semibold ${deadlineSoon ? "text-red-600" : "text-gray-500"}`}>
                            {deadlineSoon ? `⚠️ ${t("scholarships.deadlineSoon")}` : `📅 ${t("scholarships.deadline")}`}
                          </span>
                          <span className={`text-xs font-bold ${deadlineSoon ? "text-red-700" : "text-gray-700"}`}>
                            {new Date(s.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      )}

                      {s.description && (
                        <p className="text-gray-500 text-xs mb-4 flex-1 line-clamp-3 leading-relaxed">{s.description}</p>
                      )}

                      {s.link && (
                        <a href={s.link} target="_blank" rel="noreferrer"
                          className={`mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${cfg.color} hover:opacity-90 transition shadow-sm`}>
                          {t("scholarships.applyNow")} →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition ${
                      p === page
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                        : "bg-white border-2 border-gray-200 text-gray-600 hover:border-violet-400 hover:text-violet-600"
                    }`}>{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Scholarships;
