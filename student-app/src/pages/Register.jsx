import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

function passwordStrength(v) {
  if (!v) return null;
  if (v.length < 8) return "weak";
  const hasUpper = /[A-Z]/.test(v);
  const hasDigit = /[0-9]/.test(v);
  if (hasUpper && hasDigit && v.length >= 12) return "strong";
  if (hasUpper && hasDigit) return "medium";
  return "weak";
}

const STRENGTH_META = {
  weak:   { label: "Weak",   color: "bg-red-500",    text: "text-red-400"    },
  medium: { label: "Fair",   color: "bg-yellow-400", text: "text-yellow-400" },
  strong: { label: "Strong", color: "bg-green-500",  text: "text-green-400"  },
};

const Register = () => {
  const { register } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const strength = passwordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (form.password !== form.confirm) {
      setErrorMsg(t("auth.register.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password);
      toast.success(t("auth.register.success"));
      navigate("/dashboard");
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || t("auth.register.failedRegister"));
    } finally {
      setLoading(false);
    }
  };

  const PERKS = [
    { icon: "🎯", text: t("auth.register.perk1", "AI-powered university matching") },
    { icon: "💰", text: t("auth.register.perk2", "200+ scholarships database") },
    { icon: "📊", text: t("auth.register.perk3", "Personalised fit scores") },
    { icon: "📚", text: t("auth.register.perk4", "Language placement tests") },
    { icon: "📋", text: t("auth.register.perk5", "Application tracker") },
    { icon: "👨‍🏫", text: t("auth.register.perk6", "Expert instructors") },
  ];

  return (
    <div className="min-h-screen flex bg-[oklch(0.13_0.018_285)]">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
           style={{ background: "linear-gradient(135deg, oklch(0.18 0.06 296), oklch(0.15 0.04 280), oklch(0.13 0.018 285))" }}>
        {/* Glow blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full -translate-x-1/2 -translate-y-1/2"
             style={{ background: "radial-gradient(circle, oklch(0.55 0.22 296 / 0.15), transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full translate-x-1/3 translate-y-1/3"
             style={{ background: "radial-gradient(circle, oklch(0.62 0.20 264 / 0.12), transparent 70%)" }} />

        {/* Background image */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <img src="https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80"
               alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, oklch(0.13 0.018 285), transparent 60%)" }} />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg"
                 style={{ background: "linear-gradient(135deg, oklch(0.62 0.24 296), oklch(0.55 0.22 264))" }}>U</div>
            <span className="text-xl font-bold text-white">UniPath</span>
          </div>

          <h2 className="text-4xl font-extrabold leading-tight mb-4 text-white">
            {t("auth.register.heroTitle1", "Start your study")}<br />
            <span style={{ background: "linear-gradient(135deg, oklch(0.75 0.18 296), oklch(0.80 0.15 264))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t("auth.register.heroTitle2", "abroad journey")}
            </span>
          </h2>
          <p className="text-[oklch(0.6_0.04_285)] text-base mb-8">
            {t("auth.register.heroSubtitle", "Everything you need to find, apply, and get funded — for free.")}
          </p>

          <div className="space-y-3">
            {PERKS.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                     style={{ background: "oklch(1 0 0 / 0.08)" }}>{icon}</div>
                <span className="text-[oklch(0.75_0.02_285)] text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative grid grid-cols-3 gap-4">
          {[
            { value: "+500", label: t("auth.register.stat1", "Universities") },
            { value: "+200", label: t("auth.register.stat2", "Scholarships") },
            { value: "+10K", label: t("auth.register.stat3", "Students") },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-2xl p-4 text-center border"
                 style={{ background: "oklch(1 0 0 / 0.05)", borderColor: "oklch(1 0 0 / 0.08)" }}>
              <p className="text-2xl font-extrabold text-white">{value}</p>
              <p className="text-[oklch(0.6_0.04_285)] text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[oklch(0.13_0.018_285)]">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg"
                 style={{ background: "linear-gradient(135deg, oklch(0.62 0.24 296), oklch(0.55 0.22 264))" }}>U</div>
            <span className="text-lg font-bold text-white">UniPath</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white">{t("auth.register.title")}</h1>
            <p className="text-[oklch(0.55_0.02_285)] mt-2">{t("auth.register.subtitle")}</p>
          </div>

          {/* Error banner */}
          {errorMsg && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3.5 rounded-xl border border-red-500/30 bg-red-500/10">
              <span className="text-red-400 mt-0.5 shrink-0">⚠️</span>
              <p className="text-red-300 text-sm leading-snug">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[oklch(0.7_0.02_285)] mb-1.5">
                {t("auth.register.email")}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[oklch(0.45_0.02_285)]">📧</span>
                <input type="email" required value={form.email}
                  onChange={e => { setForm({ ...form, email: e.target.value }); setErrorMsg(""); }}
                  placeholder={t("auth.register.emailPlaceholder")}
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-[oklch(0.4_0.02_285)] focus:outline-none transition"
                  style={{ background: "oklch(0.18 0.022 285)", border: "1.5px solid oklch(1 0 0 / 0.08)" }}
                  onFocus={e => e.target.style.borderColor = "oklch(0.62 0.24 296 / 0.5)"}
                  onBlur={e => e.target.style.borderColor = "oklch(1 0 0 / 0.08)"}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-[oklch(0.7_0.02_285)] mb-1.5">
                {t("auth.register.password")}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[oklch(0.45_0.02_285)]">🔒</span>
                <input type={showPass ? "text" : "password"} required value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setErrorMsg(""); }}
                  placeholder={t("auth.register.passwordPlaceholder")}
                  autoComplete="new-password"
                  className="w-full pl-11 pr-14 py-3.5 rounded-xl text-sm text-white placeholder-[oklch(0.4_0.02_285)] focus:outline-none transition"
                  style={{ background: "oklch(0.18 0.022 285)", border: "1.5px solid oklch(1 0 0 / 0.08)" }}
                  onFocus={e => e.target.style.borderColor = "oklch(0.62 0.24 296 / 0.5)"}
                  onBlur={e => e.target.style.borderColor = "oklch(1 0 0 / 0.08)"}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[oklch(0.5_0.02_285)] hover:text-white text-xs font-semibold transition-colors">
                  {showPass ? t("common.hide") : t("common.show")}
                </button>
              </div>
              {/* Strength meter */}
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[0, 1, 2].map(i => {
                      const levels = { weak: 1, medium: 2, strong: 3 };
                      const active = levels[strength] > i;
                      return <div key={i} className={`h-1 flex-1 rounded-full transition-all ${active ? STRENGTH_META[strength].color : "bg-white/10"}`} />;
                    })}
                  </div>
                  <span className={`text-[11px] font-semibold ${STRENGTH_META[strength]?.text}`}>
                    {STRENGTH_META[strength]?.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-semibold text-[oklch(0.7_0.02_285)] mb-1.5">
                {t("auth.register.confirmPassword")}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[oklch(0.45_0.02_285)]">🔒</span>
                <input type={showPass ? "text" : "password"} required value={form.confirm}
                  onChange={e => { setForm({ ...form, confirm: e.target.value }); setErrorMsg(""); }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-[oklch(0.4_0.02_285)] focus:outline-none transition"
                  style={{ background: "oklch(0.18 0.022 285)", border: "1.5px solid oklch(1 0 0 / 0.08)" }}
                  onFocus={e => e.target.style.borderColor = "oklch(0.62 0.24 296 / 0.5)"}
                  onBlur={e => e.target.style.borderColor = "oklch(1 0 0 / 0.08)"}
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))", boxShadow: "0 4px 20px oklch(0.55 0.22 296 / 0.35)" }}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t("auth.register.creating", "Creating account…")}</>
                : t("auth.register.submit")}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[oklch(1_0_0/0.06)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[oklch(0.13_0.018_285)] px-4 text-xs text-[oklch(0.45_0.02_285)] font-medium">
                {t("auth.register.hasAccount")}
              </span>
            </div>
          </div>

          <Link to="/login"
            className="block w-full text-center py-3 rounded-xl font-semibold text-sm text-[oklch(0.7_0.02_285)] hover:text-white transition-all"
            style={{ border: "1.5px solid oklch(1 0 0 / 0.08)", background: "oklch(0.17 0.02 285)" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "oklch(0.62 0.24 296 / 0.4)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "oklch(1 0 0 / 0.08)"}>
            {t("auth.register.login")} →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
