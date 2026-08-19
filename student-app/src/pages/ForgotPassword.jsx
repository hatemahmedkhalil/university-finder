import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Icon, ICONS } from "../components/Sidebar";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="card rounded-3xl p-9 w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}><Icon d={ICONS.mail} size={26} /></div>
        <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--ink)" }}>{t("auth.forgotPassword.success")}</h2>
        <p className="mb-7 leading-relaxed" style={{ color: "var(--ink-faint)" }}>{t("auth.forgotPassword.sentDetail")}</p>
        <Link to="/login" className="text-sm font-bold" style={{ color: "var(--accent)" }}>{t("auth.forgotPassword.backToLogin")}</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="card rounded-3xl p-9 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}><Icon d={ICONS.lock} size={26} /></div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>{t("auth.forgotPassword.title")}</h1>
          <p className="mt-1.5" style={{ color: "var(--ink-faint)" }}>{t("auth.forgotPassword.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--ink-dim)" }}>{t("auth.forgotPassword.email")}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
              placeholder={t("auth.forgotPassword.emailPlaceholder")}
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5 disabled:opacity-50">
            {loading ? t("auth.forgotPassword.loading") : t("auth.forgotPassword.submit")}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: "var(--ink-faint)" }}>
          <Link to="/login" className="font-bold" style={{ color: "var(--accent)" }}>{t("auth.forgotPassword.backToLogin")}</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
