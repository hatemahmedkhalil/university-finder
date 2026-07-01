import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import toast from "react-hot-toast";

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md text-center">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("auth.forgotPassword.success")}</h2>
        <p className="text-gray-500 mb-6">{t("auth.forgotPassword.sentDetail")}</p>
        <Link to="/login" className="text-blue-600 font-medium hover:underline">{t("auth.forgotPassword.backToLogin")}</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900">{t("auth.forgotPassword.title")}</h1>
          <p className="text-gray-500 mt-1">{t("auth.forgotPassword.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("auth.forgotPassword.email")}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("auth.forgotPassword.emailPlaceholder")}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? t("auth.forgotPassword.loading") : t("auth.forgotPassword.submit")}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6 text-sm">
          <Link to="/login" className="text-blue-600 font-medium hover:underline">{t("auth.forgotPassword.backToLogin")}</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
