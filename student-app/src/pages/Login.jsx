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

      // Instructors go straight to their panel
      try {
        const profRes = await api.get("/instructor-messages/profile");
        if (profRes.data?.id) { navigate("/instructor-panel"); return; }
      } catch {}

      // Students: follow the correct flow
      if (!userData.has_completed_onboarding) {
        navigate("/dashboard"); // onboarding modal will show on top
      } else if (!profileComplete) {
        navigate("/profile");   // profile incomplete → fill it in
      } else {
        navigate("/dashboard"); // fully set up → go straight to dashboard
      }
    } catch {
      toast.error(t("auth.login.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-800 via-violet-800 to-purple-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Blobs */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🎓</div>
            <span className="text-xl font-bold">UniFind</span>
          </div>
          <h2 className="text-4xl font-extrabold leading-tight mb-4">
            Find your dream<br />
            <span className="text-violet-300">university in Europe</span>
          </h2>
          <p className="text-indigo-200 text-lg leading-relaxed">
            AI-powered matching, scholarships, and language learning — all in one place.
          </p>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-4">
          {[
            { value: "500+", label: "Universities" },
            { value: "200+", label: "Scholarships" },
            { value: "10K+", label: "Students" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white/10 rounded-2xl p-4 text-center border border-white/10">
              <p className="text-2xl font-extrabold">{value}</p>
              <p className="text-indigo-300 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-lg">🎓</div>
            <span className="text-lg font-bold text-gray-800">UniFind</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">{t("auth.login.title")}</h1>
            <p className="text-gray-500 mt-2">{t("auth.login.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("auth.login.email")}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📧</span>
                <input
                  type="email" required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder={t("auth.login.emailPlaceholder")}
                  className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("auth.login.password")}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                <input
                  type={showPass ? "text" : "password"} required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-white transition"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold">
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-indigo-600 font-semibold hover:underline">
                {t("auth.login.forgotPassword")}
              </Link>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in…</>
                : t("auth.login.submit")}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-50 px-4 text-xs text-gray-400 font-medium">New to UniFind?</span>
            </div>
          </div>

          <Link to="/register"
            className="block w-full text-center border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition">
            {t("auth.login.register")} →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
