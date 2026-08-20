import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Icon, ICONS } from "../components/Sidebar";

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
    { icon: ICONS.target, text: t("auth.register.perk1", "AI-powered university matching") },
    { icon: ICONS.wallet, text: t("auth.register.perk2", "200+ scholarships database") },
    { icon: ICONS.trendingUp, text: t("auth.register.perk3", "Personalised fit scores") },
    { icon: ICONS.book, text: t("auth.register.perk4", "Language placement tests") },
    { icon: ICONS.applications, text: t("auth.register.perk5", "Application tracker") },
    { icon: ICONS.instructors, text: t("auth.register.perk6", "Expert instructors") },
  ];

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
           style={{ background: "linear-gradient(135deg, #0a1a2e, #060a14, #060a12)" }}>
        {/* Glow blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full -translate-x-1/2 -translate-y-1/2"
             style={{ background: "radial-gradient(circle, rgba(14,165,233,0.18), transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full translate-x-1/3 translate-y-1/3"
             style={{ background: "radial-gradient(circle, rgba(56,189,248,0.14), transparent 70%)" }} />

        {/* Background image */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <img src="https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80"
               alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #060a12, transparent 60%)" }} />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg"
                 style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)" }}>U</div>
            <span className="text-xl font-bold text-white">UniPath</span>
          </div>

          <h2 className="text-4xl font-extrabold leading-tight mb-4 text-white">
            {t("auth.register.heroTitle1", "Start your study")}<br />
            <span style={{ background: "linear-gradient(135deg, #7dd3fc, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t("auth.register.heroTitle2", "abroad journey")}
            </span>
          </h2>
          <p className="text-[rgba(226,232,240,0.65)] text-base mb-8">
            {t("auth.register.heroSubtitle", "Everything you need to find, apply, and get funded — for free.")}
          </p>

          <div className="space-y-3">
            {PERKS.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white"
                     style={{ background: "rgba(255,255,255,0.10)" }}><Icon d={icon} size={15} /></div>
                <span className="text-[rgba(226,232,240,0.75)] text-sm font-medium">{text}</span>
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
                 style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)" }}>
              <p className="text-2xl font-extrabold text-white">{value}</p>
              <p className="text-[rgba(226,232,240,0.65)] text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[var(--bg)]">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg"
                 style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)" }}>U</div>
            <span className="text-lg font-bold text-[var(--ink)]">UniPath</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-[var(--ink)]">{t("auth.register.title")}</h1>
            <p className="text-[var(--ink-faint)] mt-2">{t("auth.register.subtitle")}</p>
          </div>

          {/* Error banner */}
          {errorMsg && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3.5 rounded-xl border border-red-500/30 bg-red-500/10">
              <span className="text-red-400 mt-0.5 shrink-0"><Icon d={ICONS.alertTriangle} size={15} /></span>
              <p className="text-red-300 text-sm leading-snug">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-dim)] mb-1.5">
                {t("auth.register.email")}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]"><Icon d={ICONS.mail} size={15} /></span>
                <input type="email" required value={form.email}
                  onChange={e => { setForm({ ...form, email: e.target.value }); setErrorMsg(""); }}
                  placeholder={t("auth.register.emailPlaceholder")}
                  autoComplete="email"
                  className="input pl-11 pr-4 py-3.5 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-dim)] mb-1.5">
                {t("auth.register.password")}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]"><Icon d={ICONS.lock} size={15} /></span>
                <input type={showPass ? "text" : "password"} required value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setErrorMsg(""); }}
                  placeholder={t("auth.register.passwordPlaceholder")}
                  autoComplete="new-password"
                  className="input pl-11 pr-14 py-3.5 rounded-xl text-sm"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] hover:text-[var(--ink)] text-xs font-semibold transition-colors">
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
              <label className="block text-sm font-semibold text-[var(--ink-dim)] mb-1.5">
                {t("auth.register.confirmPassword")}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]"><Icon d={ICONS.lock} size={15} /></span>
                <input type={showPass ? "text" : "password"} required value={form.confirm}
                  onChange={e => { setForm({ ...form, confirm: e.target.value }); setErrorMsg(""); }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="input pl-11 pr-4 py-3.5 rounded-xl text-sm"
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full text-[var(--on-accent)] py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-active))", boxShadow: "0 4px 20px rgba(14,165,233,0.30)" }}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t("auth.register.creating", "Creating account…")}</>
                : t("auth.register.submit")}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[var(--bg)] px-4 text-xs text-[var(--ink-faint)] font-medium">
                {t("auth.register.hasAccount")}
              </span>
            </div>
          </div>

          <Link to="/login"
            className="block w-full text-center py-3 rounded-xl font-semibold text-sm text-[var(--ink-dim)] hover:text-[var(--ink)] transition-all"
            style={{ border: "1.5px solid var(--border)", background: "var(--surface-2)" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(14,165,233,0.4)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
            {t("auth.register.login")} →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
