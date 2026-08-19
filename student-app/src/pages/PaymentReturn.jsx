import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import { Icon, ICONS } from "../components/Sidebar";

/* Paymob redirects here after checkout (redirection_url on the intention).
   We poll our own /payments/{id}/status instead of trusting Paymob's
   redirect query params, since the webhook — not the browser redirect —
   is the source of truth for whether the payment actually succeeded. */
const PaymentReturn = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get("payment_id");
  const [status, setStatus] = useState("checking"); // checking | paid | failed | pending | error
  const [planName, setPlanName] = useState("");
  const attempts = useRef(0);

  useEffect(() => {
    if (!paymentId) { setStatus("error"); return; }

    let timer;
    const poll = async () => {
      try {
        const r = await api.get(`/payments/${paymentId}/status`);
        setPlanName(r.data.plan_name);
        if (r.data.status === "paid" || r.data.status === "failed") {
          setStatus(r.data.status);
          return;
        }
        // Still pending — the webhook can lag a few seconds behind the
        // browser redirect. Keep polling for up to ~20s, then give up.
        attempts.current += 1;
        if (attempts.current >= 10) { setStatus("pending"); return; }
        timer = setTimeout(poll, 2000);
      } catch {
        setStatus("error");
      }
    };
    poll();
    return () => clearTimeout(timer);
  }, [paymentId]);

  const ICON_BY_STATUS = {
    checking: ICONS.clock,
    paid: ICONS.check,
    failed: ICONS.x,
    pending: ICONS.clock,
    error: ICONS.alertTriangle,
  };
  const COLOR_BY_STATUS = {
    checking: "var(--accent)",
    paid: "var(--good)",
    failed: "var(--danger)",
    pending: "var(--warn)",
    error: "var(--danger)",
  };
  const BG_BY_STATUS = {
    checking: "var(--accent-subtle)",
    paid: "var(--good-subtle)",
    failed: "var(--danger-subtle)",
    pending: "var(--warn-subtle)",
    error: "var(--danger-subtle)",
  };

  const TITLE = {
    checking: t("payments.return.checking", "Confirming your payment…"),
    paid: t("payments.return.paid", "Payment successful!"),
    failed: t("payments.return.failed", "Payment failed"),
    pending: t("payments.return.pending", "Still processing…"),
    error: t("payments.return.error", "Something went wrong"),
  };
  const SUBTITLE = {
    checking: t("payments.return.checkingSub", "This usually takes a few seconds."),
    paid: t("payments.return.paidSub", `You're now on the ${planName || "Pro"} plan.`),
    failed: t("payments.return.failedSub", "Your card was not charged. You can try again."),
    pending: t("payments.return.pendingSub", "We'll update your plan as soon as it clears — check back in a minute."),
    error: t("payments.return.errorSub", "We couldn't find that payment. If you were charged, contact support."),
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="card rounded-3xl p-9 w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
             style={{ background: BG_BY_STATUS[status], color: COLOR_BY_STATUS[status] }}>
          <Icon d={ICON_BY_STATUS[status]} size={26} className={status === "checking" ? "animate-pulse" : ""} />
        </div>
        <h1 className="text-xl font-extrabold mb-2" style={{ color: "var(--ink)" }}>{TITLE[status]}</h1>
        <p className="text-sm mb-7" style={{ color: "var(--ink-faint)" }}>{SUBTITLE[status]}</p>

        <div className="flex flex-col gap-2.5">
          {status === "paid" && (
            <Link to="/dashboard" className="btn btn-primary w-full">{t("common.goToDashboard", "Go to Dashboard")}</Link>
          )}
          {status === "failed" && (
            <Link to="/pricing" className="btn btn-primary w-full">{t("payments.return.tryAgain", "Try again")}</Link>
          )}
          {(status === "pending" || status === "error") && (
            <Link to="/dashboard" className="btn btn-secondary w-full">{t("common.goToDashboard", "Go to Dashboard")}</Link>
          )}
          {status !== "checking" && (
            <Link to="/support" className="text-xs font-semibold mt-1" style={{ color: "var(--accent)" }}>
              {t("payments.return.needHelp", "Need help? Contact support")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentReturn;
