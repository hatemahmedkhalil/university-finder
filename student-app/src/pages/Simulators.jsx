import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import { Icon, ICONS } from "../components/Sidebar";

const EXAM_DISPLAY = {
  ielts: {
    name: "IELTS Academic",
    shortName: "IELTS",
    color: "#b3260e",
    gradient: "linear-gradient(135deg, #a80000, #880028)",
    badge: "Academic",
    sections: ["Listening", "Reading", "Writing", "Speaking"],
    time: "2h 45min",
    score: "Band 0–9",
    accepted: "10,000+ universities worldwide",
    icon: "graduationCap",
    path: "/simulators/ielts",  // existing IELTS simulator
  },
  toefl: {
    name: "TOEFL iBT",
    shortName: "TOEFL",
    color: "#0069bd",
    gradient: "linear-gradient(135deg, #0059b6, #00369f)",
    badge: "iBT",
    sections: ["Reading", "Listening", "Speaking", "Writing"],
    time: "~3h 30min",
    score: "0–120",
    accepted: "12,000+ universities worldwide",
    icon: "book",
    path: "/simulators/exam/toefl",
  },
  cambridge: {
    name: "Cambridge B2 First",
    shortName: "B2 First",
    color: "#007b01",
    gradient: "linear-gradient(135deg, #006e00, #005c28)",
    badge: "B2",
    sections: ["Reading & Use of English", "Writing", "Listening", "Speaking"],
    time: "~3h 30min",
    score: "100–190 (A/B/C)",
    accepted: "Recognised by thousands globally",
    icon: "building",
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
        <h1 className="text-3xl font-bold" style={{ color: "var(--ink)" }}>
          {t("simulators.title", "Test Simulators")}
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-faint)" }}>
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
              style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
            >
              {/* Gradient header */}
              <div className="h-2" style={{ background: exam.gradient }} />

              <div className="p-5 space-y-4">
                {/* Title row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: exam.color }}><Icon d={ICONS[exam.icon]} size={22} /></span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: exam.color + "30", color: exam.color }}
                      >
                        {exam.badge}
                      </span>
                    </div>
                    <h2 className="text-base font-bold" style={{ color: "var(--ink)" }}>
                      {exam.name}
                    </h2>
                  </div>
                  {best && (
                    <div className="text-right">
                      <div className="text-xs" style={{ color: "var(--ink-faint)" }}>Best</div>
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
                      style={{ background: "var(--surface-2)", color: "var(--ink-faint)" }}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: "var(--ink-faint)" }}>
                  <div>
                    <div className="font-medium" style={{ color: "var(--ink-dim)" }}>Duration</div>
                    <div>{exam.time}</div>
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: "var(--ink-dim)" }}>Score</div>
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
          <h2 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
            {t("simulators.history", "Recent Attempts")}
          </h2>
          {history.length > 0 && (
            <button
              onClick={() => navigate("/simulators/history")}
              className="text-xs font-medium transition-colors"
              style={{ color: "var(--accent)" }}
            >
              {t("common.viewAll", "View All")}
            </button>
          )}
        </div>

        {loadingHistory ? (
          <div className="text-center py-8 text-sm" style={{ color: "var(--ink-faint)" }}>
            {t("common.loading")}
          </div>
        ) : history.length === 0 ? (
          <div
            className="rounded-2xl border p-8 text-center"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
          >
            <div className="mb-3 flex justify-center"><Icon d={ICONS.applications} size={26} /></div>
            <p className="text-sm font-medium" style={{ color: "var(--ink-dim)" }}>
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
                    background: "var(--surface-2)",
                    borderColor: "var(--border)",
                    cursor: a.status === "completed" ? "pointer" : "default",
                  }}
                >
                  <div className="text-xl">{exam?.icon || "📝"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                      {exam?.name || a.exam_type.toUpperCase()}
                    </div>
                    <div className="text-xs" style={{ color: "var(--ink-faint)" }}>
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
                        <div className="text-xs" style={{ color: "var(--ink-faint)" }}>View report →</div>
                      </>
                    ) : (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "var(--warn-subtle)", color: "var(--warn)" }}
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
        style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
      >
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--ink)" }}>
          {t("simulators.aboutTitle", "About These Simulations")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs" style={{ color: "var(--ink-faint)" }}>
          <div className="flex gap-2">
            <Icon d={ICONS.check} size={16} />
            <span>{t("simulators.feature1", "Original questions created to match official exam formats and difficulty levels")}</span>
          </div>
          <div className="flex gap-2">
            <Icon d={ICONS.aichat} size={16} />
            <span>{t("simulators.feature2", "AI scoring for Writing and Speaking sections with personalised feedback")}</span>
          </div>
          <div className="flex gap-2">
            <Icon d={ICONS.trendingUp} size={16} />
            <span>{t("simulators.feature3", "Detailed score reports with strengths, weaknesses, and study recommendations")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
