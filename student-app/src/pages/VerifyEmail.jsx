import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import { Icon, ICONS } from "../components/Sidebar";

const VerifyEmail = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("invalid"));
  }, [token]);

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="card rounded-3xl p-9 w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "var(--accent-subtle)" }}>
          <span className="w-6 h-6 rounded-full animate-spin" style={{ border: "3px solid var(--accent)", borderTopColor: "transparent" }} />
        </div>
        <p style={{ color: "var(--ink-faint)" }}>{t("auth.verifyEmail.verifying")}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="card rounded-3xl p-9 w-full max-w-md text-center">
        {status === "success" ? (
          <>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "var(--good-subtle)", color: "var(--good)" }}><Icon d={ICONS.check} size={26} /></div>
            <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--ink)" }}>{t("auth.verifyEmail.success")}</h2>
            <p className="mb-7 leading-relaxed" style={{ color: "var(--ink-faint)" }}>{t("auth.verifyEmail.successSub")}</p>
            <Link to="/login" className="btn btn-primary inline-flex px-6 py-3">
              {t("auth.verifyEmail.goToLogin")}
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "var(--danger-subtle)", color: "var(--danger)" }}><Icon d={ICONS.x} size={26} /></div>
            <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--ink)" }}>{t("auth.verifyEmail.error")}</h2>
            <p className="mb-7 leading-relaxed" style={{ color: "var(--ink-faint)" }}>{t("auth.verifyEmail.errorSub")}</p>
            <Link to="/" className="text-sm font-bold" style={{ color: "var(--accent)" }}>{t("auth.verifyEmail.goHome")}</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
