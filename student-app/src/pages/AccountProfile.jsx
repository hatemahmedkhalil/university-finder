import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import toast from "react-hot-toast";
import PageHero from "../components/PageHero";
import { Icon, ICONS } from "../components/Sidebar";

const Section = ({ icon, title, subtitle, children }) => (
  <div className="bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)]">
      <div className="w-9 h-9 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-lg">{icon}</div>
      <div>
        <h2 className="font-bold text-[var(--ink)] text-sm">{title}</h2>
        {subtitle && <p className="text-[var(--ink-dim)] text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const AccountProfile = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);

  const [editingEmail, setEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    api.get("/profiles/me").then(r => setProfile(r.data)).catch(() => {});
  }, []);

  const isPaid = user?.plan === "premium" || user?.plan === "pro";
  const fullName = profile?.full_name || user?.email?.split("@")[0] || "Student";
  const initial = fullName[0]?.toUpperCase() || "U";

  const startEditEmail = () => { setEmailInput(user?.email || ""); setEditingEmail(true); };
  const saveEmail = async () => {
    const trimmed = emailInput.trim();
    if (!trimmed || trimmed === user?.email) { setEditingEmail(false); return; }
    setSavingEmail(true);
    try {
      const res = await api.patch("/auth/update-email", { email: trimmed });
      updateUser({ email: res.data.email, is_verified: res.data.is_verified });
      toast.success(t("account.emailChanged", "Email updated. Please check your inbox to verify it."));
      setEditingEmail(false);
    } catch (e) {
      toast.error(e?.response?.data?.detail || t("account.emailChangeFailed", "Could not update email."));
    }
    setSavingEmail(false);
  };

  const startEditPhone = () => { setPhoneInput(profile?.phone_number || ""); setEditingPhone(true); };
  const savePhone = async () => {
    setSavingPhone(true);
    try {
      const res = await api.patch("/profiles/me", { phone_number: phoneInput.trim() || null });
      setProfile(res.data);
      toast.success(t("account.phoneChanged", "Phone number updated."));
      setEditingPhone(false);
    } catch (e) {
      toast.error(e?.response?.data?.detail || t("account.phoneChangeFailed", "Could not update phone number."));
    }
    setSavingPhone(false);
  };

  return (
    <div className="min-h-screen">
      <PageHero
        photo="https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?w=1400&q=80"
        title={t("nav.accountProfile", "Profile")}
        subtitle={t("account.subtitle", "Your account details")}
      />

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">

        {/* Name + plan header card */}
        <div className="bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[var(--ink)] text-2xl font-bold shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[var(--ink)] text-lg truncate">{fullName}</p>
            <span className={`inline-block mt-1 text-xs px-3 py-1 rounded-full font-bold ${
              isPaid
                ? "bg-gradient-to-r from-amber-400 to-orange-400 text-[var(--ink)]"
                : "bg-[var(--surface-2)] text-[var(--ink-dim)] border border-[rgba(255,255,255,0.08)]"
            }`}>
              {isPaid ? `${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}` : t("nav.freePlan", "Free Plan")}
            </span>
          </div>
        </div>

        {/* Email */}
        <Section icon={<Icon d={ICONS.mail} size={17} />} title={t("account.email", "Email")} subtitle={t("account.emailSubtitle", "Used to sign in and receive updates")}>
          {editingEmail ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                className="flex-1 bg-[var(--surface-2)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-sm text-[var(--ink)] focus:outline-none focus:border-indigo-500"
                placeholder="you@example.com"
              />
              <div className="flex gap-2 shrink-0">
                <button onClick={saveEmail} disabled={savingEmail}
                  className="px-4 py-2.5 bg-indigo-600 text-[var(--ink)] rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50">
                  {savingEmail ? t("common.saving", "Saving…") : t("common.save", "Save")}
                </button>
                <button onClick={() => setEditingEmail(false)} disabled={savingEmail}
                  className="px-4 py-2.5 bg-[var(--surface-2)] text-[var(--ink-dim)] rounded-xl font-semibold text-sm hover:bg-[var(--surface-hover)] transition">
                  {t("common.cancel", "Cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-[var(--ink)] text-sm truncate">{user?.email}</p>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full mt-1 inline-block ${
                  user?.is_verified
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                }`}>
                  {user?.is_verified ? t("account.verified", "Verified") : t("account.notVerified", "Not Verified")}
                </span>
              </div>
              <button onClick={startEditEmail}
                className="shrink-0 px-4 py-2 bg-[var(--surface-2)] text-[var(--ink)] rounded-xl font-semibold text-sm hover:bg-[var(--surface-hover)] transition">
                {t("common.edit", "Edit")}
              </button>
            </div>
          )}
          {!editingEmail && !user?.is_verified && (
            <p className="text-[var(--ink-faint)] text-xs mt-3">
              {t("account.reverifyNote", "Changing your email will require re-verifying it.")}
            </p>
          )}
        </Section>

        {/* Phone */}
        <Section icon={<Icon d={ICONS.phone} size={17} />} title={t("account.phone", "Phone Number")} subtitle={t("account.phoneSubtitle", "Used for important account notifications")}>
          {editingPhone ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                className="flex-1 bg-[var(--surface-2)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-sm text-[var(--ink)] focus:outline-none focus:border-indigo-500"
                placeholder="+20 100 123 4567"
              />
              <div className="flex gap-2 shrink-0">
                <button onClick={savePhone} disabled={savingPhone}
                  className="px-4 py-2.5 bg-indigo-600 text-[var(--ink)] rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50">
                  {savingPhone ? t("common.saving", "Saving…") : t("common.save", "Save")}
                </button>
                <button onClick={() => setEditingPhone(false)} disabled={savingPhone}
                  className="px-4 py-2.5 bg-[var(--surface-2)] text-[var(--ink-dim)] rounded-xl font-semibold text-sm hover:bg-[var(--surface-hover)] transition">
                  {t("common.cancel", "Cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold text-[var(--ink)] text-sm">
                {profile?.phone_number || <span className="text-[var(--ink-dim)] font-normal">{t("account.noPhone", "No phone number added")}</span>}
              </p>
              <button onClick={startEditPhone}
                className="shrink-0 px-4 py-2 bg-[var(--surface-2)] text-[var(--ink)] rounded-xl font-semibold text-sm hover:bg-[var(--surface-hover)] transition">
                {t("common.edit", "Edit")}
              </button>
            </div>
          )}
        </Section>

      </div>
    </div>
  );
};

export default AccountProfile;
