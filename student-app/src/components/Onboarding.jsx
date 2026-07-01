import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const STEP_KEYS = [
  { key: "welcome",         icon: "🎓", color: "from-indigo-500 to-blue-600" },
  { key: "profile",         icon: "👤", color: "from-blue-500 to-cyan-500" },
  { key: "dashboard",       icon: "🏠", color: "from-cyan-500 to-teal-500" },
  { key: "recommendations", icon: "🎯", color: "from-teal-500 to-green-500" },
  { key: "universities",    icon: "🏛️", color: "from-green-500 to-emerald-500" },
  { key: "scholarships",    icon: "💰", color: "from-emerald-500 to-yellow-500" },
  { key: "pipeline",        icon: "🚀", color: "from-emerald-400 to-cyan-500" },
  { key: "applyHub",        icon: "📂", color: "from-cyan-500 to-blue-500" },
  { key: "aiChat",          icon: "✨", color: "from-blue-500 to-violet-500" },
  { key: "learning",        icon: "📚", color: "from-violet-500 to-purple-500" },
  { key: "instructors",     icon: "👨‍🏫", color: "from-purple-500 to-rose-500" },
  { key: "favourites",      icon: "❤️", color: "from-rose-500 to-pink-500" },
  { key: "pricing",         icon: "💳", color: "from-pink-500 to-purple-500" },
  { key: "ready",           icon: "🎉", color: "from-purple-500 to-indigo-600", isFinal: true },
];

const Onboarding = () => {
  const { completeOnboarding, profileComplete } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep]       = useState(0);
  const [fading, setFading]   = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(timer);
  }, []);

  const goTo = (next) => {
    setFading(true);
    setTimeout(() => { setStep(next); setFading(false); }, 200);
  };

  const finish = () => {
    setVisible(false);
    setTimeout(() => {
      completeOnboarding();
      // If profile exists go to dashboard, otherwise go fill in the profile
      navigate(profileComplete ? "/dashboard" : "/profile");
    }, 300);
  };

  const current = STEP_KEYS[step];
  const isFirst = step === 0;
  const isLast  = step === STEP_KEYS.length - 1;
  const pct     = Math.round(((step + 1) / STEP_KEYS.length) * 100);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      <div
        className="relative w-full max-w-md"
        style={{
          opacity: fading ? 0 : 1,
          transform: fading ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className={`bg-gradient-to-br ${current.color} px-8 pt-10 pb-8 text-white text-center`}>
            <div className="text-6xl mb-4 drop-shadow">{current.icon}</div>
            <h2 className="text-2xl font-extrabold leading-tight">
              {t(`onboarding.steps.${current.key}.title`)}
            </h2>
          </div>

          <div className="px-8 py-7">
            <p className="text-gray-600 text-sm leading-relaxed text-center">
              {t(`onboarding.steps.${current.key}.desc`)}
            </p>

            {/* Progress bar */}
            <div className="mt-7">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                <span>{t("onboarding.step")} {step + 1} {t("onboarding.of")} {STEP_KEYS.length}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: "linear-gradient(to right, #6366f1, #3b82f6)" }}
                />
              </div>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 mt-4">
              {STEP_KEYS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="transition-all duration-200"
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === step ? "#6366f1" : i < step ? "#a5b4fc" : "#e5e7eb",
                  }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center gap-3">
              {!isLast && (
                <button onClick={finish} className="text-sm text-gray-400 hover:text-gray-600 transition font-medium">
                  {t("onboarding.skip")}
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                {!isFirst && (
                  <button
                    onClick={() => goTo(step - 1)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition"
                  >
                    {t("onboarding.previous")}
                  </button>
                )}
                {isLast ? (
                  <button
                    onClick={finish}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold shadow hover:shadow-md hover:opacity-90 transition"
                  >
                    {t("onboarding.startExploring")}
                  </button>
                ) : (
                  <button
                    onClick={() => goTo(step + 1)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold shadow hover:shadow-md hover:opacity-90 transition"
                  >
                    {t("onboarding.next")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
