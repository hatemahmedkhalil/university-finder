import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { changeLanguage } from "../i18n";
import toast from "react-hot-toast";
import PageHero from "../components/PageHero";

const Section = ({ icon, title, subtitle, children }) => (
  <div className="bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-[oklch(1_0_0/0.07)]">
      <div className="w-9 h-9 rounded-xl bg-[oklch(0.22_0.024_285)] flex items-center justify-center text-lg">{icon}</div>
      <div>
        <h2 className="font-bold text-white text-sm">{title}</h2>
        {subtitle && <p className="text-[oklch(0.45_0.02_285)] text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, restartOnboarding } = useAuth();
  const currentLang = i18n.language;

  const handleLangChange = (lang) => {
    changeLanguage(lang);
    toast.success(t("settings.language.changed"));
  };

  const isPaid = user?.plan === "premium" || user?.plan === "pro";

  return (
    <div className="min-h-screen">

      <PageHero
        photo="https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1400&q=80"
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
      />

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">

        {/* Account info */}
        {user && (
          <Section icon="👤" title={t("settings.account.title")} subtitle="Your account details">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{user.email}</p>
                  <p className="text-[oklch(0.45_0.02_285)] text-xs mt-0.5">{t("settings.account.email")}</p>
                </div>
              </div>
              <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1.5 flex-wrap">
                <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${
                  isPaid
                    ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                    : "bg-[oklch(0.22_0.02_285)] text-[oklch(0.70_0.02_285)] border border-[oklch(1_0_0/0.08)]"
                }`}>
                  {isPaid ? `👑 ${user.plan}` : "Free plan"}
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                  user.is_verified
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                }`}>
                  {user.is_verified ? "✅ Verified" : "⚠️ Not Verified"}
                </span>
              </div>
            </div>
          </Section>
        )}

        {/* Language */}
        <Section icon="🌍" title={t("settings.language.title")} subtitle={t("settings.language.subtitle")}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { code: "en", flag: "🇺🇸", name: t("settings.language.english"), sub: "English" },
              { code: "ar", flag: "🇸🇦", name: t("settings.language.arabic"),  sub: "Arabic" },
            ].map(({ code, flag, name, sub }) => (
              <button key={code} onClick={() => handleLangChange(code)}
                className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 text-left transition-all ${
                  currentLang === code
                    ? "border-indigo-500 bg-indigo-500/15"
                    : "border-[oklch(1_0_0/0.08)] hover:border-indigo-500/50 hover:bg-[oklch(0.20_0.024_285)]"
                }`}>
                <span className="text-2xl">{flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{name}</p>
                  <p className="text-[oklch(0.45_0.02_285)] text-xs">{sub}</p>
                </div>
                {currentLang === code && (
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </Section>

        {/* Welcome tour */}
        <Section icon="🎓" title={t("settings.onboarding.title")} subtitle={t("settings.onboarding.restartDesc")}>
          <button onClick={restartOnboarding}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition">
            🎓 {t("settings.onboarding.restart")}
          </button>
        </Section>

        {/* Danger zone */}
        <div className="bg-[oklch(0.17_0.02_285)] rounded-2xl border-2 border-red-500/30 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-red-500/20 bg-red-500/10">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-lg">⚠️</div>
            <div>
              <h2 className="font-bold text-red-400 text-sm">{t("settings.danger.title")}</h2>
              <p className="text-red-400/70 text-xs mt-0.5">{t("settings.danger.logoutDesc")}</p>
            </div>
          </div>
          <div className="p-6">
            <button onClick={logout}
              className="flex items-center gap-2 px-5 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition  shadow-red-200">
              🚪 {t("settings.danger.logout")}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;

