import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import api from "../api/axios";
import { Icon, ICONS } from "../components/Sidebar";

function validateEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

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

const Login = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const emailError = touched.email && form.email && !validateEmail(form.email)
    ? "Enter a valid email address"
    : null;
  const strength = passwordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const { userData, profileComplete } = await login(form.email, form.password);
      toast.success(t("auth.login.success"));

      try {
        const profRes = await api.get("/instructor-messages/profile");
        if (profRes.data?.id) { navigate("/instructor-panel"); return; }
      } catch {}

      if (!userData.has_completed_onboarding) {
        navigate("/dashboard");
      } else if (!profileComplete) {
        navigate("/profile");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail || "";

      if (status === 429) {
        setErrorMsg(detail || "Too many attempts. Account temporarily locked.");
      } else if (status === 403 && detail.includes("verify")) {
        setErrorMsg("Please verify your email before logging in. Check your inbox.");
        toast.error(t("auth.login.notVerified"), { duration: 6000, icon: "📧" });
      } else if (detail.includes("attempt")) {
        setErrorMsg(detail);
      } else {
        setErrorMsg(t("auth.login.error") || "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
           style={{ background: "linear-gradient(135deg, #0a1a2e, #060a14, #060a12)" }}>
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full -translate-x-1/2 -translate-y-1/2"
             style={{ background: "radial-gradient(circle, rgba(14,165,233,0.18), transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full translate-x-1/3 translate-y-1/3"
             style={{ background: "radial-gradient(circle, rgba(56,189,248,0.14), transparent 70%)" }} />

        <div className="absolute inset-0 overflow-hidden opacity-20">
          <img src="https://images.unsplash.com/photo-1577086664693-894d8405334a?w=800&q=80"
               alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #060a12, transparent 60%)" }} />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg"
                 style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)" }}>U</div>
            <span className="text-xl font-bold text-white">UniPath</span>
          </div>
          <h2 className="text-4xl font-extrabold leading-tight mb-4 text-white">
            Find your dream<br />
            <span style={{ background: "linear-gradient(135deg, #7dd3fc, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              university in Europe
            </span>
          </h2>
          <p className="text-[rgba(226,232,240,0.65)] text-lg leading-relaxed">
            AI-powered matching, scholarships, and language learning — all in one place.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4">
          {[
            { value: "+500", label: "Universities" },
            { value: "+200", label: "Scholarships" },
            { value: "+10K", label: "Students" },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-2xl p-4 text-center border"
                 style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)" }}>
              <p className="text-2xl font-extrabold text-white">{value}</p>
              <p className="text-[rgba(226,232,240,0.65)] text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[var(--bg)]">
        <div className="w-full max-w-md">

          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg"
                 style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)" }}>U</div>
            <span className="text-lg font-bold text-[var(--ink)]">UniPath</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-[var(--ink)]">{t("auth.login.title")}</h1>
            <p className="text-[var(--ink-faint)] mt-2">{t("auth.login.subtitle")}</p>
          </div>

          {/* Error banner */}
          {errorMsg && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3.5 rounded-xl border border-red-500/30 bg-red-500/10">
              <span className="text-red-400 mt-0.5 shrink-0"><Icon d={ICONS.alertTriangle} size={15} /></span>
              <p className="text-red-300 text-sm leading-snug">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-dim)] mb-1.5">
                {t("auth.login.email")}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]"><Icon d={ICONS.mail} size={15} /></span>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={form.email}
                  onChange={e => { setForm({ ...form, email: e.target.value }); setErrorMsg(""); }}
                  onBlur={() => setTouched(t => ({ ...t, email: true }))}
                  placeholder={t("auth.login.emailPlaceholder")}
                  className="input pl-11 pr-4 py-3.5 rounded-xl text-sm"
                  style={emailError ? { borderColor: "var(--danger)" } : undefined}
                />
              </div>
              {emailError && <p className="mt-1.5 text-xs text-red-400">{emailError}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-dim)] mb-1.5">
                {t("auth.login.password")}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]"><Icon d={ICONS.lock} size={15} /></span>
                <input
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setErrorMsg(""); }}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  placeholder="••••••••"
                  className="input pl-11 pr-14 py-3.5 rounded-xl text-sm"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] hover:text-[var(--ink)] text-xs font-semibold transition-colors">
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>

              {/* Password strength indicator */}
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[0, 1, 2].map(i => {
                      const levels = { weak: 1, medium: 2, strong: 3 };
                      const active = levels[strength] > i;
                      return (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${active ? STRENGTH_META[strength].color : "bg-white/10"}`} />
                      );
                    })}
                  </div>
                  <span className={`text-[11px] font-semibold ${STRENGTH_META[strength]?.text}`}>
                    {STRENGTH_META[strength]?.label}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-[var(--accent)] font-semibold hover:underline">
                {t("auth.login.forgotPassword")}
              </Link>
            </div>

            <button type="submit" disabled={loading || !!emailError}
              className="w-full text-[var(--on-accent)] py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-active))", boxShadow: "0 4px 20px rgba(14,165,233,0.30)" }}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in…</>
                : t("auth.login.submit")}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[var(--bg)] px-4 text-xs text-[var(--ink-faint)] font-medium">New to UniPath?</span>
            </div>
          </div>

          <Link to="/register"
            className="block w-full text-center py-3 rounded-xl font-semibold text-sm text-[var(--ink-dim)] hover:text-[var(--ink)] transition-all"
            style={{ border: "1.5px solid var(--border)", background: "var(--surface-2)" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(14,165,233,0.4)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
            {t("auth.login.register")} →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
