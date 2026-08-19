import { useState, useEffect } from "react";
import api from "../api/axios";
import { useTranslation } from "react-i18next";
import PageHero from "../components/PageHero";
import { Icon, ICONS } from "../components/Sidebar";

/* ── design tokens ── */
const bg      = "bg-[var(--bg)]";
const card    = "bg-[var(--surface-2)]";
const border  = "border-[var(--border)]";
const textDim = "text-[var(--ink-dim)]";
const textFt  = "text-[var(--ink-faint)]";
const grad    = "linear-gradient(135deg,var(--accent),var(--accent))";
const gradGold = "linear-gradient(135deg,var(--warn),var(--warn))";

const TYPE_LABELS = {
  government: "Government",
  merit:      "Merit",
  need_based: "Need-Based",
  full:       "Full Funding",
  partial:    "Partial",
};

const SkeletonCard = () => (
  <div className={`${card} rounded-2xl border ${border} overflow-hidden animate-pulse`}>
    <div className="h-1.5 bg-[var(--surface-2)]" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-[var(--surface-2)] rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-[var(--surface-2)] rounded-full" />
        <div className="h-5 w-24 bg-[var(--surface-2)] rounded-full" />
      </div>
      <div className="h-10 bg-[var(--surface-2)] rounded-xl" />
    </div>
  </div>
);

const ScholarshipCard = ({ s, matchScore, matchReason, eligibilityMet }) => {
  const deadlineSoon = s.deadline && (new Date(s.deadline) - new Date()) < 30 * 86400000;
  const isMatch = matchScore !== undefined;

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200"
         style={{ background: "var(--surface-2)", border: `1px solid ${isMatch && eligibilityMet ? "rgba(14,165,233,0.35)" : "var(--border)"}` }}
         onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "rgba(152,87,255,0.35)"; }}
         onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = isMatch && eligibilityMet ? "rgba(14,165,233,0.35)" : "var(--border)"; }}>

      {/* top accent bar — gold if matched, purple otherwise */}
      <div className="h-1" style={{ background: isMatch && eligibilityMet ? gradGold : grad }} />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Name + amount */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-bold text-[var(--ink)] text-[15px] leading-snug">{s.name}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--ink-faint)" }}>{s.provider}</div>
          </div>
          {s.amount_eur && (
            <span className="shrink-0 text-sm font-extrabold px-3 py-1.5 rounded-xl text-[var(--ink)] whitespace-nowrap"
                  style={{ background: grad }}>
              €{s.amount_eur.toLocaleString()}{s.amount_eur >= 5000 ? " / yr" : " /mo"}
            </span>
          )}
        </div>

        {/* Match score bar (only in AI tab) */}
        {isMatch && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold" style={{ color: eligibilityMet ? "var(--good)" : "var(--warn)" }}>
                {eligibilityMet ? "You qualify" : "Partial match"}
              </span>
              <span className="text-[11px] font-bold" style={{ color: "var(--accent-light)" }}>{matchScore}% match</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                   style={{ width: `${matchScore}%`, background: eligibilityMet ? "var(--good)" : gradGold }} />
            </div>
            {matchReason && (
              <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--ink-faint)" }}>{matchReason}</p>
            )}
          </div>
        )}

        {/* Description */}
        {s.description && !isMatch && (
          <p className="text-sm line-clamp-2" style={{ color: "var(--ink-faint)" }}>{s.description}</p>
        )}

        {/* Footer: type + deadline + link */}
        <div className="mt-auto flex items-center justify-between gap-2 flex-wrap pt-1">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(129,70,224,0.12)", color: "var(--accent-light)" }}>
            {TYPE_LABELS[s.scholarship_type] || s.scholarship_type}
          </span>
          <div className="flex items-center gap-3">
            {s.deadline && (
              <span className="text-xs font-medium" style={{ color: deadlineSoon ? "var(--danger)" : "var(--ink-faint)" }}>
                {deadlineSoon ? "" : ""}
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
  { value: "",           label: "All",        icon: null },
  { value: "government", label: "Government", icon: null },
  { value: "merit",      label: "Merit",      icon: null },
  { value: "need_based", label: "Need-Based", icon: null },
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
    <div className={`min-h-screen ${bg} text-[var(--ink)]`}>

      <PageHero
        photo="https://images.unsplash.com/photo-1562774053-701939374585?w=1600&q=70"
        title="Funding your future starts here"
        subtitle={loading ? "Loading..." : `${total} scholarships waiting to be discovered`}
      />

      {/* ── Tabs ── */}
      <div className="px-8 py-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex gap-1 pt-3">
          {[
            { key: "browse", label: "Browse All" },
            { key: "match",  label: "AI Match for Me", highlight: true },
          ].map(({ key, label, highlight }) => (
            <button key={key} onClick={() => setTab(key)}
              className="px-5 py-2.5 text-sm font-semibold rounded-t-xl transition-all"
              style={{
                background: tab === key ? (highlight ? gradGold : grad) : "transparent",
                color: tab === key ? "#fff" : highlight ? "var(--warn)" : "var(--ink-faint)",
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
                    background: type === value ? grad : "var(--surface-hover)",
                    color: type === value ? "#fff" : "var(--ink-dim)",
                    border: `1px solid ${type === value ? "transparent" : "var(--border)"}`,
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
                <div className="mb-4 flex justify-center"><Icon d={ICONS.scholarships} size={56} /></div>
                <p className="text-[var(--ink)] font-bold text-xl mb-2">No scholarships found</p>
                <button onClick={() => setType("")}
                  className="text-[var(--ink)] text-sm font-bold px-6 py-2.5 rounded-xl mt-4"
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
          </>
        )}

        {/* ── AI Match tab ── */}
        {tab === "match" && (
          <div>
            {!matches && !matching && (
              <div className="text-center py-20">
                <div className="mb-6 flex justify-center"><Icon d={ICONS.target} size={56} /></div>
                <h2 className="text-2xl font-bold text-[var(--ink)] mb-3">Find Scholarships You Qualify For</h2>
                <p className={`${textDim} text-sm mb-8 max-w-md mx-auto`}>
                  Our AI analyzes your profile — nationality, GPA, degree level, target countries — and matches you with scholarships you're most likely to get.
                </p>
                <button onClick={runMatch}
                  className="px-8 py-3.5 rounded-xl text-[var(--ink)] font-bold text-base transition-opacity hover:opacity-90"
                  style={{ background: gradGold }}>
                  Match Me with Scholarships
                </button>
                {matchError && (
                  <p className="mt-4 text-sm" style={{ color: "var(--danger)" }}>{matchError}</p>
                )}
              </div>
            )}

            {matching && (
              <div className="text-center py-20">
                <div className="mb-6 flex justify-center"><Icon d={ICONS.search} size={40} /></div>
                <p className="text-[var(--ink)] font-bold text-lg mb-2">Analyzing your profile...</p>
                <p className={`${textFt} text-sm`}>Matching you against {total} scholarships</p>
              </div>
            )}

            {matches && (
              <div>
                {/* Summary */}
                {matchSummary && (
                  <div className="rounded-2xl p-5 mb-8" style={{ background: "var(--surface-2)", border: "1px solid rgba(129,70,224,0.20)" }}>
                    <p className="text-sm font-bold text-[var(--ink)] mb-1">Scholarship Advisor</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>{matchSummary}</p>
                  </div>
                )}

                {/* Qualified */}
                {qualifiedMatches.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
                      You Qualify <span className="text-sm font-normal" style={{ color: "var(--ink-faint)" }}>({qualifiedMatches.length} scholarships)</span>
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
                    <h3 className="text-lg font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
                      Worth Exploring <span className="text-sm font-normal" style={{ color: "var(--ink-faint)" }}>({otherMatches.length} scholarships)</span>
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
                    style={{ background: "var(--surface-hover)", color: "var(--ink-faint)" }}>
                    Re-run match
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
