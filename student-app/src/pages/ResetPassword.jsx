import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Icon, ICONS } from "../components/Sidebar";

const ResetPassword = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error(t("auth.resetPassword.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password: form.password });
      toast.success(t("auth.resetPassword.success"));
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid or expired link");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="card rounded-3xl p-9 w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "var(--danger-subtle)", color: "var(--danger)" }}><Icon d={ICONS.x} size={26} /></div>
        <h2 className="text-xl font-extrabold mb-4" style={{ color: "var(--ink)" }}>{t("auth.resetPassword.invalidLink")}</h2>
        <Link to="/forgot-password" className="text-sm font-bold" style={{ color: "var(--accent)" }}>{t("auth.resetPassword.requestNew")}</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="card rounded-3xl p-9 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}><Icon d={ICONS.key} size={26} /></div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>{t("auth.resetPassword.title")}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--ink-dim)" }}>{t("auth.resetPassword.newPassword")}</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input w-full"
              placeholder={t("auth.resetPassword.placeholder")}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--ink-dim)" }}>{t("auth.resetPassword.confirmPassword")}</label>
            <input
              type="password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className="input w-full"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5 disabled:opacity-50">
            {loading ? t("auth.resetPassword.loading") : t("auth.resetPassword.submit")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
