import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api/axios";

const EXAM_DISPLAY = {
  ielts: {
    name: "IELTS Academic",
    shortName: "IELTS",
    color: "oklch(0.50 0.18 32)",
    gradient: "linear-gradient(135deg, oklch(0.45 0.20 32), oklch(0.38 0.18 12))",
    badge: "Academic",
    sections: ["Listening", "Reading", "Writing", "Speaking"],
    time: "2h 45min",
    score: "Band 0–9",
    accepted: "10,000+ universities worldwide",
    icon: "🎓",
    path: "/simulators/ielts",  // existing IELTS simulator
  },
  toefl: {
    name: "TOEFL iBT",
    shortName: "TOEFL",
    color: "oklch(0.50 0.18 240)",
    gradient: "linear-gradient(135deg, oklch(0.45 0.20 240), oklch(0.38 0.18 260))",
    badge: "iBT",
    sections: ["Reading", "Listening", "Speaking", "Writing"],
    time: "~3h 30min",
    score: "0–120",
    accepted: "12,000+ universities worldwide",
    icon: "📘",
    path: "/simulators/exam/toefl",
  },
  cambridge: {
    name: "Cambridge B2 First",
    shortName: "B2 First",
    color: "oklch(0.50 0.18 145)",
    gradient: "linear-gradient(135deg, oklch(0.45 0.20 145), oklch(0.38 0.18 165))",
    badge: "B2",
    sections: ["Reading & Use of English", "Writing", "Listening", "Speaking"],
    time: "~3h 30min",
    score: "100–190 (A/B/C)",
    accepted: "Recognised by thousands globally",
    icon: "🏛️",
    path: "/simulators/exam/cambridge",
  },
};

export default function Simulators() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    api.get("/simulators/attempts")
      .then(r => setHistory(r.data.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  const completedByType = {};
  history.filter(a => a.status === "completed").forEach(a => {
    if (!completedByType[a.exam_type]) completedByType[a.exam_type] = [];
    completedByType[a.exam_type].push(a);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "oklch(0.92 0.01 285)" }}>
          {t("simulators.title", "Test Simulators")}
        </h1>
        <p className="mt-2 text-sm" style={{ color: "oklch(0.55 0.02 285)" }}>
          {t("simulators.subtitle", "Practice with full-length, timed simulations of real international English exams. Get AI-powered score reports.")}
        </p>
      </div>

      {/* Exam Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Object.entries(EXAM_DISPLAY).map(([type, exam]) => {
          const best = completedByType[type]?.[0];
          return (
            <div
              key={type}
              onClick={() => navigate(exam.path)}
              className="rounded-2xl border cursor-pointer group transition-all duration-200 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
              style={{ background: "oklch(0.17 0.022 285)", borderColor: "oklch(1 0 0 / 0.07)" }}
            >
              {/* Gradient header */}
              <div className="h-2" style={{ background: exam.gradient }} />

              <div className="p-5 space-y-4">
                {/* Title row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{exam.icon}</span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: exam.color + "30", color: exam.color }}
                      >
                        {exam.badge}
                      </span>
                    </div>
                    <h2 className="text-base font-bold" style={{ color: "oklch(0.92 0.01 285)" }}>
                      {exam.name}
                    </h2>
                  </div>
                  {best && (
                    <div className="text-right">
                      <div className="text-xs" style={{ color: "oklch(0.55 0.02 285)" }}>Best</div>
                      <div className="text-base font-bold" style={{ color: exam.color }}>
                        {type === "cambridge" ? `${best.overall_score} (${best.score_band})` : best.score_band || best.overall_score}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sections */}
                <div className="flex flex-wrap gap-1.5">
                  {exam.sections.map(s => (
                    <span
                      key={s}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: "oklch(0.22 0.025 285)", color: "oklch(0.65 0.02 285)" }}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: "oklch(0.55 0.02 285)" }}>
                  <div>
                    <div className="font-medium" style={{ color: "oklch(0.75 0.02 285)" }}>Duration</div>
                    <div>{exam.time}</div>
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: "oklch(0.75 0.02 285)" }}>Score</div>
                    <div>{exam.score}</div>
                  </div>
                </div>

                {/* CTA button */}
                <button
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                  style={{
                    background: exam.gradient,
                    color: "#fff",
                    boxShadow: `0 4px 16px ${exam.color}40`,
                  }}
                >
                  {best ? t("simulators.retake", "Retake Exam") : t("simulators.start", "Start Exam")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Attempts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: "oklch(0.92 0.01 285)" }}>
            {t("simulators.history", "Recent Attempts")}
          </h2>
          {history.length > 0 && (
            <button
              onClick={() => navigate("/simulators/history")}
              className="text-xs font-medium transition-colors"
              style={{ color: "oklch(0.65 0.18 296)" }}
            >
              {t("common.viewAll", "View All")}
            </button>
          )}
        </div>

        {loadingHistory ? (
          <div className="text-center py-8 text-sm" style={{ color: "oklch(0.55 0.02 285)" }}>
            {t("common.loading")}
          </div>
        ) : history.length === 0 ? (
          <div
            className="rounded-2xl border p-8 text-center"
            style={{ background: "oklch(0.17 0.022 285)", borderColor: "oklch(1 0 0 / 0.07)" }}
          >
            <div className="text-3xl mb-3">📝</div>
            <p className="text-sm font-medium" style={{ color: "oklch(0.75 0.02 285)" }}>
              {t("simulators.noHistory", "No attempts yet — start your first simulation above!")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(a => {
              const exam = EXAM_DISPLAY[a.exam_type];
              return (
                <div
                  key={a.id}
                  onClick={() => a.status === "completed" ? navigate(`/simulators/results/${a.id}`) : null}
                  className="flex items-center gap-4 px-5 py-3.5 rounded-xl border transition-colors"
                  style={{
                    background: "oklch(0.17 0.022 285)",
                    borderColor: "oklch(1 0 0 / 0.07)",
                    cursor: a.status === "completed" ? "pointer" : "default",
                  }}
                >
                  <div className="text-xl">{exam?.icon || "📝"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: "oklch(0.90 0.01 285)" }}>
                      {exam?.name || a.exam_type.toUpperCase()}
                    </div>
                    <div className="text-xs" style={{ color: "oklch(0.55 0.02 285)" }}>
                      {new Date(a.started_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    {a.status === "completed" ? (
                      <>
                        <div className="text-sm font-bold" style={{ color: exam?.color }}>
                          {a.exam_type === "cambridge"
                            ? `${a.overall_score} (${a.score_band})`
                            : a.score_band || a.overall_score || "—"}
                        </div>
                        <div className="text-xs" style={{ color: "oklch(0.55 0.02 285)" }}>View report →</div>
                      </>
                    ) : (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "oklch(0.25 0.04 50)", color: "oklch(0.75 0.15 50)" }}
                      >
                        {a.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info bar */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: "oklch(0.17 0.022 285)", borderColor: "oklch(1 0 0 / 0.07)" }}
      >
        <h3 className="text-sm font-bold mb-3" style={{ color: "oklch(0.90 0.01 285)" }}>
          {t("simulators.aboutTitle", "About These Simulations")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs" style={{ color: "oklch(0.60 0.02 285)" }}>
          <div className="flex gap-2">
            <span className="text-base">✅</span>
            <span>{t("simulators.feature1", "Original questions created to match official exam formats and difficulty levels")}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-base">🤖</span>
            <span>{t("simulators.feature2", "AI scoring for Writing and Speaking sections with personalised feedback")}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-base">📊</span>
            <span>{t("simulators.feature3", "Detailed score reports with strengths, weaknesses, and study recommendations")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
