import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import api from "../api/axios";

const Login = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      const detail = err?.response?.data?.detail || "";
      if (err?.response?.status === 403 && detail.includes("verify")) {
        toast.error(t("auth.login.notVerified"), { duration: 6000, icon: "📧" });
      } else {
        toast.error(t("auth.login.error"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[oklch(0.13_0.018_285)]">

      {/* ── Left panel — dark premium ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
           style={{ background: "linear-gradient(135deg, oklch(0.18 0.06 296), oklch(0.15 0.04 280), oklch(0.13 0.018 285))" }}>
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full -translate-x-1/2 -translate-y-1/2"
             style={{ background: "radial-gradient(circle, oklch(0.55 0.22 296 / 0.15), transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full translate-x-1/3 translate-y-1/3"
             style={{ background: "radial-gradient(circle, oklch(0.62 0.20 264 / 0.12), transparent 70%)" }} />

        {/* Graduation photo */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80"
               alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, oklch(0.13 0.018 285), transparent 60%)" }} />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg"
                 style={{ background: "linear-gradient(135deg, oklch(0.62 0.24 296), oklch(0.55 0.22 264))" }}>U</div>
            <span className="text-xl font-bold text-white">UniPath</span>
          </div>
          <h2 className="text-4xl font-extrabold leading-tight mb-4 text-white">
            Find your dream<br />
            <span style={{ background: "linear-gradient(135deg, oklch(0.75 0.18 296), oklch(0.80 0.15 264))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              university in Europe
            </span>
          </h2>
          <p className="text-[oklch(0.6_0.04_285)] text-lg leading-relaxed">
            AI-powered matching, scholarships, and language learning — all in one place.
          </p>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-4">
          {[
            { value: "+500", label: "Universities" },
            { value: "+200", label: "Scholarships" },
            { value: "+10K", label: "Students" },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-2xl p-4 text-center border"
                 style={{ background: "oklch(1 0 0 / 0.05)", borderColor: "oklch(1 0 0 / 0.08)" }}>
              <p className="text-2xl font-extrabold text-white">{value}</p>
              <p className="text-[oklch(0.6_0.04_285)] text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (form) — dark ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[oklch(0.13_0.018_285)]">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg"
                 style={{ background: "linear-gradient(135deg, oklch(0.62 0.24 296), oklch(0.55 0.22 264))" }}>U</div>
            <span className="text-lg font-bold text-white">UniPath</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white">{t("auth.login.title")}</h1>
            <p className="text-[oklch(0.55_0.02_285)] mt-2">{t("auth.login.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[oklch(0.7_0.02_285)] mb-1.5">{t("auth.login.email")}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[oklch(0.45_0.02_285)]">📧</span>
                <input
                  type="email" required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder={t("auth.login.emailPlaceholder")}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-[oklch(0.4_0.02_285)] focus:outline-none transition"
                  style={{ background: "oklch(0.18 0.022 285)", border: "1.5px solid oklch(1 0 0 / 0.08)" }}
                  onFocus={e => e.target.style.borderColor = "oklch(0.62 0.24 296 / 0.6)"}
                  onBlur={e => e.target.style.borderColor = "oklch(1 0 0 / 0.08)"}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[oklch(0.7_0.02_285)] mb-1.5">{t("auth.login.password")}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[oklch(0.45_0.02_285)]">🔒</span>
                <input
                  type={showPass ? "text" : "password"} required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-14 py-3.5 rounded-xl text-sm text-white placeholder-[oklch(0.4_0.02_285)] focus:outline-none transition"
                  style={{ background: "oklch(0.18 0.022 285)", border: "1.5px solid oklch(1 0 0 / 0.08)" }}
                  onFocus={e => e.target.style.borderColor = "oklch(0.62 0.24 296 / 0.6)"}
                  onBlur={e => e.target.style.borderColor = "oklch(1 0 0 / 0.08)"}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[oklch(0.5_0.02_285)] hover:text-white text-xs font-semibold transition-colors">
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-[oklch(0.65_0.18_296)] font-semibold hover:underline">
                {t("auth.login.forgotPassword")}
              </Link>
            </div>

            <button type="submit" disabled={loading}
              className="w-full text-white py-3.5 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))", boxShadow: "0 4px 20px oklch(0.55 0.22 296 / 0.35)" }}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in…</>
                : t("auth.login.submit")}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[oklch(1_0_0/0.06)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[oklch(0.13_0.018_285)] px-4 text-xs text-[oklch(0.45_0.02_285)] font-medium">New to UniPath?</span>
            </div>
          </div>

          <Link to="/register"
            className="block w-full text-center py-3 rounded-xl font-semibold text-sm text-[oklch(0.7_0.02_285)] hover:text-white transition-all"
            style={{ border: "1.5px solid oklch(1 0 0 / 0.08)", background: "oklch(0.17 0.02 285)" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "oklch(0.62 0.24 296 / 0.4)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "oklch(1 0 0 / 0.08)"}>
            {t("auth.login.register")} →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
