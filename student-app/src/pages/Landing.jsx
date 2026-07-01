import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Landing = () => {
  const { t } = useTranslation();

  const features = [
    { icon: "🎯", title: t("landing.features.matching.title"), desc: t("landing.features.matching.desc"),   grad: "from-indigo-500 to-violet-600" },
    { icon: "💰", title: t("landing.features.scholarships.title"), desc: t("landing.features.scholarships.desc"), grad: "from-emerald-500 to-teal-600" },
    { icon: "📊", title: t("landing.features.score.title"), desc: t("landing.features.score.desc"),         grad: "from-amber-500 to-orange-500" },
  ];

  const countries = [
    { flag: "🇩🇪", name: "Germany",     count: "5 Universities", color: "from-yellow-400 to-red-500" },
    { flag: "🇵🇱", name: "Poland",      count: "4 Universities", color: "from-red-500 to-pink-600"   },
    { flag: "🇦🇹", name: "Austria",     count: "2 Universities", color: "from-red-500 to-gray-600"   },
    { flag: "🇳🇱", name: "Netherlands", count: "3 Universities", color: "from-orange-500 to-blue-600" },
  ];

  const stats = [
    { value: "500+", label: t("landing.stats.universities") },
    { value: "200+", label: t("landing.stats.scholarships") },
    { value: "10K+", label: t("landing.stats.students") },
    { value: t("landing.stats.freeValue"), label: t("landing.stats.forever") },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-violet-900 to-purple-950 text-white">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-indigo-200 text-sm font-semibold px-5 py-2 rounded-full mb-8">
            🌍 {t("landing.hero.badge")}
          </div>

          <h1 className="text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            {t("landing.hero.title1")}<br />
            <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              {t("landing.hero.title2")}
            </span>
          </h1>

          <p className="text-xl text-indigo-200 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t("landing.hero.subtitle")}
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <Link to="/register"
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-10 py-4 rounded-2xl text-base font-bold shadow-2xl shadow-indigo-900/50 hover:from-indigo-400 hover:to-violet-500">
              {t("landing.hero.ctaStart")} →
            </Link>
            <Link to="/universities"
              className="bg-white/10 border border-white/25 text-white px-10 py-4 rounded-2xl text-base font-bold hover:bg-white/20 backdrop-blur">
              {t("landing.hero.ctaExplore")}
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {stats.map(({ value, label }) => (
              <div key={label} className="bg-white/8 border border-white/10 rounded-2xl py-4 px-3 backdrop-blur">
                <p className="text-3xl font-extrabold">{value}</p>
                <p className="text-indigo-300 text-xs mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <span className="text-indigo-600 text-sm font-bold uppercase tracking-widest">{t("landing.features.tag")}</span>
          <h2 className="text-4xl font-extrabold text-gray-900 mt-3">{t("landing.features.title")}</h2>
          <p className="text-gray-500 mt-4 text-lg max-w-xl mx-auto">{t("landing.features.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map(({ icon, title, desc, grad }) => (
            <div key={title} className="group bg-white rounded-3xl border border-gray-100 shadow-sm p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                {icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
              <p className="text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Countries ── */}
      <div className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-indigo-600 text-sm font-bold uppercase tracking-widest">{t("landing.countries.tag")}</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-3">{t("landing.countries.title")}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {countries.map(({ flag, name, count, color }) => (
              <Link key={name} to="/universities"
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden relative">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`} />
                <div className="text-5xl mb-3">{flag}</div>
                <p className="font-bold text-gray-900 text-lg">{name}</p>
                <p className="text-gray-400 text-sm mt-1">{count}</p>
                <span className="inline-block mt-4 text-xs text-indigo-600 font-semibold group-hover:underline">{t("landing.countries.explore")} →</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <span className="text-indigo-600 text-sm font-bold uppercase tracking-widest">{t("landing.steps.tag")}</span>
          <h2 className="text-4xl font-extrabold text-gray-900 mt-3">{t("landing.steps.title")}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {[
            { step: "01", icon: "👤", title: t("landing.steps.s1.title"), desc: t("landing.steps.s1.desc") },
            { step: "02", icon: "🤖", title: t("landing.steps.s2.title"), desc: t("landing.steps.s2.desc") },
            { step: "03", icon: "🎓", title: t("landing.steps.s3.title"), desc: t("landing.steps.s3.desc") },
          ].map(({ step, icon, title, desc }, i) => (
            <div key={step} className="relative text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-2xl mx-auto mb-5 shadow-lg shadow-indigo-200">
                {icon}
              </div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{step}</span>
              <h3 className="text-xl font-bold text-gray-900 mt-2 mb-3">{title}</h3>
              <p className="text-gray-500">{desc}</p>
              {i < 2 && (
                <div className="hidden md:block absolute top-8 left-[calc(100%-1rem)] text-gray-300 text-2xl">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA banner ── */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold mb-4">{t("landing.cta.title")}</h2>
          <p className="text-indigo-200 text-lg mb-10">{t("landing.cta.subtitle")}</p>
          <Link to="/register"
            className="inline-block bg-white text-indigo-700 px-12 py-4 rounded-2xl text-base font-extrabold shadow-2xl hover:bg-indigo-50 transition">
            {t("landing.cta.button")} →
          </Link>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <span className="text-white font-bold">UniFind</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/universities" className="hover:text-white transition">{t("nav.universities")}</Link>
            <Link to="/scholarships" className="hover:text-white transition">{t("nav.scholarships")}</Link>
            <Link to="/pricing"      className="hover:text-white transition">{t("nav.pricing")}</Link>
            <Link to="/login"        className="hover:text-white transition">{t("auth.login.title")}</Link>
          </div>
          <p className="text-xs">{t("landing.footer.copyright")}</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
