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
const gradGold = "linear-gradient(135deg,oklch(0.75_0.18_55),oklch(0.65_0.20_40))";

const TYPE_LABELS = {
  government: "🏛️ Government",
  merit:      "🌟 Merit",
  need_based: "🤝 Need-Based",
  full:       "🎯 Full Funding",
  partial:    "📊 Partial",
};

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
    </div>
  </div>
);

const ScholarshipCard = ({ s, matchScore, matchReason, eligibilityMet }) => {
  const deadlineSoon = s.deadline && (new Date(s.deadline) - new Date()) < 30 * 86400000;
  const isMatch = matchScore !== undefined;

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200"
         style={{ background: "oklch(0.17 0.02 285)", border: `1px solid ${isMatch && eligibilityMet ? "oklch(0.55 0.22 296 / 0.35)" : "oklch(1 0 0 / 0.07)"}` }}
         onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "oklch(0.62 0.24 296 / 0.35)"; }}
         onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = isMatch && eligibilityMet ? "oklch(0.55 0.22 296 / 0.35)" : "oklch(1 0 0 / 0.07)"; }}>

      {/* top accent bar — gold if matched, purple otherwise */}
      <div className="h-1" style={{ background: isMatch && eligibilityMet ? gradGold : grad }} />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Name + amount */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-bold text-white text-[15px] leading-snug">{s.name}</div>
            <div className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.02 285)" }}>{s.provider}</div>
          </div>
          {s.amount_eur && (
            <span className="shrink-0 text-sm font-extrabold px-3 py-1.5 rounded-xl text-white whitespace-nowrap"
                  style={{ background: grad }}>
              €{s.amount_eur.toLocaleString()}{s.amount_eur >= 5000 ? " / yr" : " /mo"}
            </span>
          )}
        </div>

        {/* Match score bar (only in AI tab) */}
        {isMatch && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold" style={{ color: eligibilityMet ? "oklch(0.75 0.18 158)" : "oklch(0.65 0.10 55)" }}>
                {eligibilityMet ? "✅ You qualify" : "⚠️ Partial match"}
              </span>
              <span className="text-[11px] font-bold" style={{ color: "oklch(0.65 0.14 296)" }}>{matchScore}% match</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.02 285)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                   style={{ width: `${matchScore}%`, background: eligibilityMet ? "oklch(0.65 0.18 158)" : gradGold }} />
            </div>
            {matchReason && (
              <p className="text-xs mt-2 leading-relaxed" style={{ color: "oklch(0.60 0.02 285)" }}>{matchReason}</p>
            )}
          </div>
        )}

        {/* Description */}
        {s.description && !isMatch && (
          <p className="text-sm line-clamp-2" style={{ color: "oklch(0.65 0.02 285)" }}>{s.description}</p>
        )}

        {/* Footer: type + deadline + link */}
        <div className="mt-auto flex items-center justify-between gap-2 flex-wrap pt-1">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "oklch(0.55 0.22 296 / 0.12)", color: "oklch(0.75 0.14 296)" }}>
            {TYPE_LABELS[s.scholarship_type] || s.scholarship_type}
          </span>
          <div className="flex items-center gap-3">
            {s.deadline && (
              <span className="text-xs font-medium" style={{ color: deadlineSoon ? "oklch(0.75 0.18 25)" : "oklch(0.50 0.02 285)" }}>
                {deadlineSoon ? "⚠️ " : ""}
                {new Date(s.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
            {s.link && (
              <a href={s.link} target="_blank" rel="noopener noreferrer"
                 className="text-xs font-bold px-3 py-1 rounded-lg transition-opacity hover:opacity-80"
                 style={{ background: grad, color: "white" }}
                 onClick={e => e.stopPropagation()}>
                Apply →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FILTER_ITEMS = [
  { value: "",           label: "All",        icon: "✨" },
  { value: "government", label: "Government", icon: "🏛️" },
  { value: "merit",      label: "Merit",      icon: "🌟" },
  { value: "need_based", label: "Need-Based", icon: "🤝" },
];

const Scholarships = () => {
  const { t } = useTranslation();

  /* ── Browse tab state ── */
  const [scholarships, setScholarships] = useState([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [type, setType]                 = useState("");
  const [page, setPage]                 = useState(1);
  const perPage = 12;

  /* ── AI Match tab state ── */
  const [tab, setTab]               = useState("browse"); // "browse" | "match"
  const [matching, setMatching]     = useState(false);
  const [matches, setMatches]       = useState(null);
  const [matchSummary, setMatchSummary] = useState("");
  const [matchError, setMatchError] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ skip: (page - 1) * perPage, limit: perPage });
    if (type) params.set("scholarship_type", type);
    api.get(`/scholarships?${params}`)
      .then(res => { setScholarships(res.data.items); setTotal(res.data.total); })
      .finally(() => setLoading(false));
  }, [type, page]);

  const runMatch = async () => {
    setMatching(true);
    setMatchError("");
    setMatches(null);
    try {
      const res = await api.post("/scholarships/match");
      setMatches(res.data.matches);
      setMatchSummary(res.data.summary);
    } catch (err) {
      if (err?.response?.status === 404) {
        setMatchError("Please complete your profile first so we can match you with the right scholarships.");
      } else {
        setMatchError("Could not load matches. Please try again.");
      }
    } finally {
      setMatching(false);
    }
  };

  const totalPages = Math.ceil(total / perPage);
  const qualifiedMatches = matches ? matches.filter(m => m.eligibility_met) : [];
  const otherMatches = matches ? matches.filter(m => !m.eligibility_met && m.match_score >= 40) : [];

  return (
    <div className={`min-h-screen ${bg} text-[oklch(0.96_0.006_285)]`}>

      <PageHero
        photo="https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=1600&q=70"
        title="Scholarships"
        subtitle={loading ? "Loading..." : `${total} scholarships available`}
      />

      {/* ── Tabs ── */}
      <div className="px-8 py-0" style={{ borderBottom: "1px solid oklch(1 0 0 / 0.07)" }}>
        <div className="flex gap-1 pt-3">
          {[
            { key: "browse", label: "Browse All" },
            { key: "match",  label: "✨ AI Match for Me", highlight: true },
          ].map(({ key, label, highlight }) => (
            <button key={key} onClick={() => setTab(key)}
              className="px-5 py-2.5 text-sm font-semibold rounded-t-xl transition-all"
              style={{
                background: tab === key ? (highlight ? gradGold : grad) : "transparent",
                color: tab === key ? "#fff" : highlight ? "oklch(0.75 0.18 55)" : "oklch(0.60 0.02 285)",
                borderBottom: tab === key ? "2px solid transparent" : "2px solid transparent",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-7">

        {/* ── Browse tab ── */}
        {tab === "browse" && (
          <>
            {/* Type filter pills */}
            <div className="flex flex-wrap gap-2 mb-6">
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

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : scholarships.length === 0 ? (
              <div className="text-center py-32">
                <div className="text-7xl mb-4">💸</div>
                <p className="text-white font-bold text-xl mb-2">No scholarships found</p>
                <button onClick={() => setType("")}
                  className="text-white text-sm font-bold px-6 py-2.5 rounded-xl mt-4"
                  style={{ background: grad }}>
                  Show All
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {scholarships.map(s => <ScholarshipCard key={s.id} s={s} />)}
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
          </>
        )}

        {/* ── AI Match tab ── */}
        {tab === "match" && (
          <div>
            {!matches && !matching && (
              <div className="text-center py-20">
                <div className="text-7xl mb-6">🎯</div>
                <h2 className="text-2xl font-bold text-white mb-3">Find Scholarships You Qualify For</h2>
                <p className={`${textDim} text-sm mb-8 max-w-md mx-auto`}>
                  Our AI analyzes your profile — nationality, GPA, degree level, target countries — and matches you with scholarships you're most likely to get.
                </p>
                <button onClick={runMatch}
                  className="px-8 py-3.5 rounded-xl text-white font-bold text-base transition-opacity hover:opacity-90"
                  style={{ background: gradGold }}>
                  ✨ Match Me with Scholarships
                </button>
                {matchError && (
                  <p className="mt-4 text-sm" style={{ color: "oklch(0.70 0.18 25)" }}>{matchError}</p>
                )}
              </div>
            )}

            {matching && (
              <div className="text-center py-20">
                <div className="text-5xl mb-6 animate-bounce">🔍</div>
                <p className="text-white font-bold text-lg mb-2">Analyzing your profile...</p>
                <p className={`${textFt} text-sm`}>Matching you against {total} scholarships</p>
              </div>
            )}

            {matches && (
              <div>
                {/* Summary */}
                {matchSummary && (
                  <div className="rounded-2xl p-5 mb-8" style={{ background: "oklch(0.17 0.02 285)", border: "1px solid oklch(0.55 0.22 296 / 0.20)" }}>
                    <p className="text-sm font-bold text-white mb-1">💡 Scholarship Advisor</p>
                    <p className="text-sm leading-relaxed" style={{ color: "oklch(0.72 0.02 285)" }}>{matchSummary}</p>
                  </div>
                )}

                {/* Qualified */}
                {qualifiedMatches.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      ✅ You Qualify <span className="text-sm font-normal" style={{ color: "oklch(0.55 0.02 285)" }}>({qualifiedMatches.length} scholarships)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {qualifiedMatches.map(m => (
                        <ScholarshipCard key={m.scholarship_id}
                          s={{ id: m.scholarship_id, name: m.name, provider: m.provider, amount_eur: m.amount_eur, scholarship_type: m.scholarship_type, deadline: m.deadline, link: m.link }}
                          matchScore={m.match_score}
                          matchReason={m.match_reason}
                          eligibilityMet={m.eligibility_met}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Partial matches */}
                {otherMatches.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      ⚠️ Worth Exploring <span className="text-sm font-normal" style={{ color: "oklch(0.55 0.02 285)" }}>({otherMatches.length} scholarships)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {otherMatches.map(m => (
                        <ScholarshipCard key={m.scholarship_id}
                          s={{ id: m.scholarship_id, name: m.name, provider: m.provider, amount_eur: m.amount_eur, scholarship_type: m.scholarship_type, deadline: m.deadline, link: m.link }}
                          matchScore={m.match_score}
                          matchReason={m.match_reason}
                          eligibilityMet={m.eligibility_met}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center mt-6">
                  <button onClick={() => { setMatches(null); runMatch(); }}
                    className="text-sm px-5 py-2 rounded-xl font-medium transition-opacity hover:opacity-80"
                    style={{ background: "oklch(0.20 0.024 285)", color: "oklch(0.65 0.02 285)" }}>
                    🔄 Re-run match
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scholarships;
