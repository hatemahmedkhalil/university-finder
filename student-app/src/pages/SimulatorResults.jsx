import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api/axios";

const EXAM_META = {
  toefl: { name: "TOEFL iBT", maxScore: 120, color: "oklch(0.55 0.20 240)", icon: "📘" },
  cambridge: { name: "Cambridge B2 First", maxScore: 190, color: "oklch(0.55 0.20 145)", icon: "🏛️" },
  ielts: { name: "IELTS Academic", maxScore: 9, color: "oklch(0.55 0.20 32)", icon: "🎓" },
};

const SECTION_ICONS = {
  reading: "📖", listening: "🎧", speaking: "🎙️", writing: "✍️",
};

const ScoreRing = ({ score, maxScore, color, size = 80 }) => {
  const pct = maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
  const r = size / 2 - 7;
  const circumference = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="5" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - pct)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1s ease-out" }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size * 0.22} fontWeight="700">
        {score !== null && score !== undefined ? (typeof score === "number" && score % 1 !== 0 ? score.toFixed(1) : score) : "—"}
      </text>
    </svg>
  );
};

export default function SimulatorResults() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/simulators/attempts/${attemptId}`)
      .then(r => setAttempt(r.data))
      .catch(() => setError("Could not load results."))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 rounded-full mx-auto animate-spin" style={{ borderColor: "oklch(0.55 0.22 296)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "oklch(0.60 0.02 285)" }}>Loading results…</p>
        </div>
      </div>
    );
  }
  if (error || !attempt) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <p className="text-sm" style={{ color: "oklch(0.70 0.02 285)" }}>{error || "Results not found."}</p>
          <button onClick={() => navigate("/simulators")} className="px-6 py-2 rounded-xl text-sm" style={{ background: "oklch(0.25 0.04 285)", color: "oklch(0.80 0.02 285)" }}>
            Back to Simulators
          </button>
        </div>
      </div>
    );
  }

  const meta = EXAM_META[attempt.exam_type] || EXAM_META.toefl;
  const report = attempt.score_report;
  const breakdown = attempt.score_breakdown || {};

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{meta.icon}</span>
            <h1 className="text-2xl font-bold" style={{ color: "oklch(0.92 0.01 285)" }}>
              {t("simulators.results.title", "Score Report")}
            </h1>
          </div>
          <p className="text-sm" style={{ color: "oklch(0.55 0.02 285)" }}>
            {meta.name} — {new Date(attempt.started_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => navigate("/simulators")}
          className="text-xs px-4 py-2 rounded-lg border"
          style={{ borderColor: "oklch(1 0 0 / 0.12)", color: "oklch(0.60 0.02 285)" }}
        >
          ← All Simulators
        </button>
      </div>

      {/* Overall score card */}
      <div
        className="rounded-2xl border p-6 flex flex-col md:flex-row items-center gap-8"
        style={{ background: "oklch(0.17 0.022 285)", borderColor: "oklch(1 0 0 / 0.07)" }}
      >
        <div className="flex flex-col items-center gap-2">
          <ScoreRing score={attempt.overall_score} maxScore={meta.maxScore} color={meta.color} size={100} />
          <div className="text-xs" style={{ color: "oklch(0.55 0.02 285)" }}>
            out of {meta.maxScore}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <span
              className="text-2xl font-bold"
              style={{ color: meta.color }}
            >
              {attempt.exam_type === "cambridge"
                ? `Grade ${attempt.score_band || "—"}`
                : attempt.exam_type === "ielts"
                ? `Band ${attempt.score_band}`
                : `Score ${Math.round(attempt.overall_score ?? 0)}`}
            </span>
            {report?.cefr_level && (
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: meta.color + "25", color: meta.color }}
              >
                CEFR {report.cefr_level}
              </span>
            )}
          </div>
          {report?.summary && (
            <p className="text-sm leading-relaxed" style={{ color: "oklch(0.80 0.015 285)" }}>
              {report.summary}
            </p>
          )}
        </div>
      </div>

      {/* Section breakdown */}
      {Object.keys(breakdown).length > 0 && (
        <div>
          <h2 className="text-base font-bold mb-4" style={{ color: "oklch(0.92 0.01 285)" }}>
            {t("simulators.results.sections", "Section Scores")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(breakdown).map(([section, score]) => {
              const sectionResult = attempt.section_results?.find(sr => sr.section_name === section);
              return (
                <div
                  key={section}
                  className="rounded-xl border p-4 flex flex-col items-center gap-2"
                  style={{ background: "oklch(0.17 0.022 285)", borderColor: "oklch(1 0 0 / 0.07)" }}
                >
                  <span className="text-lg">{SECTION_ICONS[section] || "📋"}</span>
                  <div className="text-xs capitalize" style={{ color: "oklch(0.60 0.02 285)" }}>{section}</div>
                  <ScoreRing
                    score={score}
                    maxScore={attempt.exam_type === "toefl" ? 30 : attempt.exam_type === "cambridge" ? 190 : 9}
                    color={meta.color}
                    size={68}
                  />
                  {sectionResult?.band && (
                    <span className="text-xs font-medium" style={{ color: meta.color }}>
                      {sectionResult.band}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section feedback */}
      {attempt.section_results?.filter(sr => sr.feedback).map(sr => {
        let fb = sr.feedback;
        if (typeof fb !== "object") return null;
        // For writing/speaking, fb is {questionId: {score, feedback, ...}}
        const taskEntries = Object.values(fb);
        if (taskEntries.length === 0) return null;
        return (
          <div key={sr.id} className="space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "oklch(0.88 0.01 285)" }}>
              {SECTION_ICONS[sr.section_name]} {sr.section_name.charAt(0).toUpperCase() + sr.section_name.slice(1)} Feedback
            </h3>
            <div className="space-y-2">
              {taskEntries.map((task, i) => (
                <div
                  key={i}
                  className="rounded-xl border p-4 space-y-2"
                  style={{ background: "oklch(0.17 0.022 285)", borderColor: "oklch(1 0 0 / 0.07)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: "oklch(0.75 0.02 285)" }}>
                      Task {i + 1}
                    </span>
                    <span className="text-sm font-bold" style={{ color: meta.color }}>
                      Score: {task.score} / {sr.section_name === "speaking" && attempt.exam_type === "toefl" ? 4 : 5}
                    </span>
                  </div>
                  {task.feedback && (
                    <p className="text-xs leading-relaxed" style={{ color: "oklch(0.72 0.015 285)" }}>
                      {task.feedback}
                    </p>
                  )}
                  {task.word_count && (
                    <p className="text-xs" style={{ color: "oklch(0.55 0.02 285)" }}>
                      Word count: {task.word_count}
                    </p>
                  )}
                  {task.strengths?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-1" style={{ color: "oklch(0.65 0.18 145)" }}>Strengths:</div>
                      <ul className="space-y-0.5">
                        {task.strengths.map((s, si) => (
                          <li key={si} className="text-xs flex gap-1.5" style={{ color: "oklch(0.70 0.015 285)" }}>
                            <span style={{ color: "oklch(0.65 0.18 145)" }}>✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {task.improvements?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-1" style={{ color: "oklch(0.65 0.18 25)" }}>Areas to Improve:</div>
                      <ul className="space-y-0.5">
                        {task.improvements.map((s, si) => (
                          <li key={si} className="text-xs flex gap-1.5" style={{ color: "oklch(0.70 0.015 285)" }}>
                            <span style={{ color: "oklch(0.65 0.18 25)" }}>→</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Strengths & Weaknesses */}
      {report && (report.strengths?.length > 0 || report.weaknesses?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {report.strengths?.length > 0 && (
            <div
              className="rounded-xl border p-5"
              style={{ background: "oklch(0.17 0.022 285)", borderColor: "oklch(0.35 0.12 145 / 0.4)" }}
            >
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "oklch(0.75 0.18 145)" }}>
                ✅ Strengths
              </h3>
              <ul className="space-y-2">
                {report.strengths.map((s, i) => (
                  <li key={i} className="text-xs flex gap-2" style={{ color: "oklch(0.78 0.015 285)" }}>
                    <span style={{ color: "oklch(0.65 0.18 145)" }}>✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.weaknesses?.length > 0 && (
            <div
              className="rounded-xl border p-5"
              style={{ background: "oklch(0.17 0.022 285)", borderColor: "oklch(0.35 0.12 25 / 0.4)" }}
            >
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "oklch(0.70 0.18 25)" }}>
                🎯 Areas to Improve
              </h3>
              <ul className="space-y-2">
                {report.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs flex gap-2" style={{ color: "oklch(0.78 0.015 285)" }}>
                    <span style={{ color: "oklch(0.65 0.18 25)" }}>→</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Study Recommendations */}
      {report?.recommendations?.length > 0 && (
        <div
          className="rounded-xl border p-5"
          style={{ background: "oklch(0.17 0.022 285)", borderColor: "oklch(1 0 0 / 0.07)" }}
        >
          <h3 className="text-sm font-bold mb-3" style={{ color: "oklch(0.88 0.01 285)" }}>
            📚 Study Recommendations
          </h3>
          <ul className="space-y-2">
            {report.recommendations.map((r, i) => (
              <li key={i} className="text-xs flex gap-2" style={{ color: "oklch(0.78 0.015 285)" }}>
                <span className="font-bold" style={{ color: "oklch(0.65 0.20 296)" }}>{i + 1}.</span> {r}
              </li>
            ))}
          </ul>
          {report.next_steps && (
            <div
              className="mt-4 p-3 rounded-lg"
              style={{ background: "oklch(0.20 0.03 296 / 0.4)", color: "oklch(0.80 0.015 285)" }}
            >
              <span className="text-xs font-medium" style={{ color: "oklch(0.70 0.20 296)" }}>Next steps: </span>
              <span className="text-xs">{report.next_steps}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-center pt-2">
        <button
          onClick={() => navigate(attempt.exam_type === "ielts" ? "/simulators/ielts" : `/simulators/exam/${attempt.exam_type}`)}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))", color: "#fff" }}
        >
          Retake Exam
        </button>
        <button
          onClick={() => navigate("/simulators")}
          className="px-6 py-2.5 rounded-xl text-sm border"
          style={{ borderColor: "oklch(1 0 0 / 0.12)", color: "oklch(0.65 0.02 285)" }}
        >
          All Simulators
        </button>
      </div>
    </div>
  );
}
