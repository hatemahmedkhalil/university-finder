import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

const Register = () => {
  const { register } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error(t("auth.register.passwordMismatch")); return; }
    setLoading(true);
    try {
      await register(form.email, form.password);
      toast.success(t("auth.register.success"));
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || t("auth.register.failedRegister"));
    } finally {
      setLoading(false);
    }
  };

  const PERKS = [
    { icon: "🎯", text: "AI-powered university matching" },
    { icon: "💰", text: "200+ scholarships database" },
    { icon: "📊", text: "Personalised fit scores" },
    { icon: "📚", text: "Language placement tests" },
    { icon: "📋", text: "Application tracker" },
    { icon: "👨‍🏫", text: "Expert instructors" },
  ];

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-800 via-purple-800 to-fuchsia-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full -translate-x-1/3 translate-y-1/3" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🎓</div>
            <span className="text-xl font-bold">UniPath</span>
          </div>
          <h2 className="text-4xl font-extrabold leading-tight mb-4">
            Start your study<br />
            <span className="text-fuchsia-300">abroad journey</span>
          </h2>
          <p className="text-violet-200 text-base mb-8">Everything you need to find, apply, and get funded — for free.</p>

          <div className="space-y-3">
            {PERKS.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-sm shrink-0">{icon}</div>
                <span className="text-violet-100 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-violet-300 text-xs">
          Join thousands of students who found their university with UniPath
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-lg">🎓</div>
            <span className="text-lg font-bold text-gray-800">UniPath</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">{t("auth.register.title")}</h1>
            <p className="text-gray-500 mt-2">{t("auth.register.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("auth.register.email")}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📧</span>
                <input type="email" required value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder={t("auth.register.emailPlaceholder")}
                  className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 bg-white transition" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("auth.register.password")}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                <input type={showPass ? "text" : "password"} required value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={t("auth.register.passwordPlaceholder")}
                  className="w-full pl-11 pr-12 py-3.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 bg-white transition" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold">
                  {showPass ? t("common.hide") : t("common.show")}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("auth.register.confirmPassword")}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">✅</span>
                <input type={showPass ? "text" : "password"} required value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 bg-white transition" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-violet-200 hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating account…</>
                : t("auth.register.submit")}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-50 px-4 text-xs text-gray-400 font-medium">{t("auth.register.hasAccount")}</span>
            </div>
          </div>

          <Link to="/login"
            className="block w-full text-center border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition">
            {t("auth.register.login")} →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
