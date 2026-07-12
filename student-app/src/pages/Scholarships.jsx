import { useState, useEffect } from "react";
import api from "../api/axios";
import { useTranslation } from "react-i18next";
import PageHero from "../components/PageHero";

/* ── design tokens ── */
const bg      = "bg-[oklch(0.13_0.018_285)]";
const card    = "bg-[oklch(0.17_0.02_285)]";
const border  = "border-[oklch(1_0_0/0.07)]";
const textDim = "text-[oklch(0.72_0.02_285)]";
const textFt  = "text-[oklch(0.52_0.02_285)]";
const grad    = "linear-gradient(135deg,oklch(0.62_0.24_296),oklch(0.64_0.21_264))";

const TYPE_CFG = {
  government: { accent: "oklch(0.55 0.18 220)", icon: "🏛️" },
  university: { accent: "oklch(0.55 0.22 296)", icon: "🎓" },
  private:    { accent: "oklch(0.65 0.18 55)",  icon: "🏢" },
  erasmus:    { accent: "oklch(0.55 0.18 158)",  icon: "🇪🇺" },
};
const DEFAULT_CFG = { accent: "oklch(0.50 0.12 285)", icon: "💰" };

const SkeletonCard = () => (
  <div className={`${card} rounded-2xl border ${border} overflow-hidden animate-pulse`}>
    <div className="h-1.5 bg-[oklch(0.30_0.04_296)]" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-[oklch(0.22_0.02_285)] rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-[oklch(0.22_0.02_285)] rounded-full" />
        <div className="h-5 w-24 bg-[oklch(0.22_0.02_285)] rounded-full" />
      </div>
      <div className="h-10 bg-[oklch(0.22_0.02_285)] rounded-xl" />
      <div className="space-y-1.5">
        <div className="h-3 bg-[oklch(0.22_0.02_285)] rounded w-full" />
        <div className="h-3 bg-[oklch(0.22_0.02_285)] rounded w-4/5" />
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
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [type, setType]                 = useState("");
  const [page, setPage]                 = useState(1);
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
    <div className={`min-h-screen ${bg} text-[oklch(0.96_0.006_285)]`}>

      <PageHero
        photo="https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=1600&q=70"
        title={t("scholarships.title")}
        subtitle={loading ? t("common.loading") : t("scholarships.available", { count: total })}
      />

      {/* ── Type filter pills below hero ── */}
      <div className="px-8 py-4" style={{ borderBottom: "1px solid oklch(1 0 0 / 0.07)" }}>
        <div className="flex flex-wrap gap-2">
          {FILTER_ITEMS.map(({ value, label, icon }) => (
            <button key={value} onClick={() => { setType(value); setPage(1); }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                background: type === value ? grad : "oklch(0.20 0.024 285)",
                color: type === value ? "#fff" : "oklch(0.72 0.02 285)",
                border: `1px solid ${type === value ? "transparent" : "oklch(1 0 0 / 0.08)"}`,
              }}>
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-7">

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : scholarships.length === 0 ? (
          <div className="text-center py-32">
            <div className="text-7xl mb-4">💸</div>
            <p className="text-white font-bold text-xl mb-2">{t("scholarships.noFound")}</p>
            <p className={`${textFt} text-sm mb-6`}>{t("scholarships.tryFilter")}</p>
            <button onClick={() => setType("")}
              className="text-white text-sm font-bold px-6 py-2.5 rounded-xl transition hover:opacity-90"
              style={{ background: grad }}>
              {t("scholarships.showAll")}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {scholarships.map(s => {
                const cfg = TYPE_CFG[s.scholarship_type] || DEFAULT_CFG;
                const deadlineSoon = s.deadline && (new Date(s.deadline) - new Date()) < 30 * 86400000;
                return (
                  <div key={s.id} className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer"
                       style={{ background: "oklch(0.17 0.02 285)", border: "1px solid oklch(1 0 0 / 0.07)" }}
                       onMouseEnter={e => { e.currentTarget.style.borderColor = "oklch(0.62 0.24 296 / 0.35)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                       onMouseLeave={e => { e.currentTarget.style.borderColor = "oklch(1 0 0 / 0.07)"; e.currentTarget.style.transform = "none"; }}>

                    <div className="p-5 flex flex-col gap-3">
                      {/* Row 1: name + org + amount pill */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-bold text-white text-[15px] leading-snug">{s.name}</div>
                          {s.organization && <div className="text-xs mt-0.5" style={{ color: "oklch(0.60 0.02 285)" }}>{s.organization}</div>}
                        </div>
                        {s.amount_eur && (
                          <span className="shrink-0 text-sm font-extrabold px-3 py-1.5 rounded-xl text-white whitespace-nowrap"
                                style={{ background: grad }}>
                            €{s.amount_eur.toLocaleString()}{s.amount_eur >= 5000 ? " / yr" : " total"}
                          </span>
                        )}
                      </div>

                      {/* Row 2: coverage / description */}
                      {s.description && (
                        <p className="text-sm line-clamp-1" style={{ color: "oklch(0.75 0.02 285)" }}>{s.description}</p>
                      )}

                      {/* Row 3: country flag + deadline */}
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: "oklch(0.60 0.02 285)" }}>
                          {s.country ? `🌍 ${s.country}` : ""}
                        </span>
                        {s.deadline && (
                          <span className="font-semibold" style={{ color: deadlineSoon ? "oklch(0.75 0.18 25)" : "oklch(0.60 0.02 285)" }}>
                            {deadlineSoon ? "⚠️ " : ""}Deadline {new Date(s.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>

                      {/* Row 4: eligibility (scholarship_type as tag) */}
                      {s.scholarship_type && (
                        <div className="text-xs" style={{ color: "oklch(0.60 0.02 285)" }}>
                          Eligibility: {s.scholarship_type} scholarship
                          {s.gpa_requirement ? `, GPA ${s.gpa_requirement}+` : ""}
                        </div>
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
    </div>
  );
};

export default Scholarships;
