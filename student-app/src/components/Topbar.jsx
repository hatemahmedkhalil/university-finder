import { useRef, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";
import api from "../api/axios";
import { Icon, ICONS } from "./Sidebar";

/* ── Page title i18n keys ── */
const PAGE_TITLE_KEYS = {
  "/dashboard":        "nav.dashboard",
  "/profile":          "nav.myProfile",
  "/recommendations":  "nav.recommendations",
  "/universities":     "nav.universities",
  "/scholarships":     "nav.scholarships",
  "/learning":         "nav.learning",
  "/instructors":      "nav.instructors",
  "/applications":     "nav.applications",
  "/favourites":       "nav.favourites",
  "/ai-chat":          "nav.aiChat",
  "/pricing":          "nav.pricing",
  "/support":          "nav.support",
  "/notifications":    "nav.notifications",
  "/settings":         "nav.settings",
  "/announcements":    "nav.announcements",
  "/my-questions":     "nav.myQuestions",
  "/instructor-panel": "nav.instructorPanel",
};

const usePageTitleKey = (pathname) => {
  if (PAGE_TITLE_KEYS[pathname]) return PAGE_TITLE_KEYS[pathname];
  for (const [key, val] of Object.entries(PAGE_TITLE_KEYS)) {
    if (pathname.startsWith(key + "/")) return val;
  }
  return "nav.brand";
};

/* ── Notification Bell ── */
const NotificationBell = ({ isRTL }) => {
  const { t } = useTranslation();
  const [count, setCount]   = useState(0);
  const [items, setItems]   = useState([]);
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);
  const ref      = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchCount = () => api.get("/notifications/unread-count").then(r => setCount(r.data.count)).catch(() => {});
  useEffect(() => { fetchCount(); }, [location.pathname]);
  useEffect(() => { const id = setInterval(fetchCount, 30000); return () => clearInterval(id); }, []);
  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const openDropdown = async () => {
    setOpen(o => !o);
    if (!open) {
      setLoading(true);
      try { const r = await api.get("/notifications"); setItems(Array.isArray(r.data) ? r.data.slice(0, 8) : []); }
      catch { setItems([]); }
      finally { setLoading(false); }
    }
  };

  const markRead = async (n) => {
    if (!n.is_read) {
      await api.post(`/notifications/${n.id}/read`).catch(() => {});
      setItems(p => p.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      setCount(c => Math.max(0, c - 1));
    }
    setOpen(false);
    navigate(n.reference_type === "ticket" ? `/support?ticket=${n.reference_id}` : "/notifications");
  };

  const markAll = async () => {
    await api.post("/notifications/read-all").catch(() => {});
    setItems(p => p.map(n => ({ ...n, is_read: true })));
    setCount(0);
  };

  const TYPE_ICON = { support_reply: "💬", application_update: "📋", scholarship_update: "🎓", system: "🔔" };

  return (
    <div className="relative" ref={ref}>
      <button onClick={openDropdown}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
        <Icon d={["M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"]} size={19} />
        {count > 0 && (
          <span className={`absolute -top-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ${isRTL ? "-left-0.5" : "-right-0.5"}`}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute ${isRTL ? "left-0" : "right-0"} top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-bold text-gray-800 text-sm">{t("nav.notifications")}</span>
            {count > 0 && (
              <button onClick={markAll} className="text-xs text-blue-600 hover:underline">
                {t("notifications.markAllRead", "Mark all read")}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">{t("common.loading")}</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-1">🔔</div>
                <p className="text-gray-400 text-sm">{t("notifications.empty", "No notifications yet")}</p>
              </div>
            ) : items.map(n => (
              <button key={n.id} onClick={() => markRead(n)}
                className={`w-full text-start flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${!n.is_read ? "bg-blue-50/50" : ""}`}>
                <span className="text-lg shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold text-gray-800" : "text-gray-600"}`}>{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{n.message}</p>
                  <p className="text-[10px] text-gray-300 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 px-4 py-2.5 text-center">
            <Link to="/notifications" onClick={() => setOpen(false)} className="text-xs text-blue-600 font-semibold hover:underline">
              {t("common.viewAll")} {isRTL ? "←" : "→"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Dark mode toggle ── */
const DarkToggle = () => {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
    >
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
      )}
    </button>
  );
};

/* ── Language switcher ── */
const LangSwitcher = () => {
  const { i18n } = useTranslation();
  const current = i18n.language;
  const next = current === "ar" ? "en" : "ar";
  return (
    <button
      onClick={() => changeLanguage(next)}
      title={current === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      className="h-9 px-2.5 flex items-center gap-1 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors border border-slate-200"
    >
      <span className="text-base leading-none">{current === "ar" ? "🇬🇧" : "🇸🇦"}</span>
      <span>{current === "ar" ? "EN" : "AR"}</span>
    </button>
  );
};

/* ── User avatar dropdown ── */
const UserMenu = ({ isRTL }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleLogout = () => { logout(); navigate("/"); };
  const initial = user?.email?.[0]?.toUpperCase() || "U";
  const isPaid  = user?.plan === "premium" || user?.plan === "pro";

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-sm">
        {initial}
      </button>

      {open && (
        <div className={`absolute ${isRTL ? "left-0" : "right-0"} top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1`}>
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-800 truncate">{user?.email}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${isPaid ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
              {isPaid ? `👑 ${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}` : t("nav.freePlan", "Free Plan")}
            </span>
          </div>
          <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
            <Icon d={ICONS.profile} size={16} /> {t("nav.myProfile")}
          </Link>
          <Link to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
            <Icon d={ICONS.settings} size={16} /> {t("nav.settings")}
          </Link>
          <Link to="/pricing" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
            <Icon d={ICONS.pricing} size={16} /> {t("nav.pricing")}
          </Link>
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
              <Icon d={ICONS.logout} size={16} /> {t("nav.logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main Topbar ── */
const Topbar = ({ sidebarWidth = 0, onMobileOpen }) => {
  const location = useLocation();
  const { user }  = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const titleKey = usePageTitleKey(location.pathname);

  /* In LTR: header pushed right by sidebar (left = sidebarWidth).
     In RTL: header pushed left by sidebar (right = sidebarWidth). */
  const headerStyle = user
    ? (isRTL ? { right: sidebarWidth, left: 0 } : { left: sidebarWidth, right: 0 })
    : { left: 0, right: 0 };

  return (
    <header
      className="fixed top-0 h-[60px] bg-white border-b border-gray-100 z-20 flex items-center px-4 transition-all duration-300 ease-in-out"
      style={headerStyle}
    >
      {user && (
        <button onClick={onMobileOpen}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors me-2">
          <Icon d={ICONS.menu} size={20} />
        </button>
      )}

      <div className="flex-1 flex items-center justify-center">
        <h1 className="text-[15px] font-semibold text-gray-800 tracking-tight">{t(titleKey)}</h1>
      </div>

      <div className="flex items-center gap-1">
        {user ? (
          <>
            <DarkToggle />
            <LangSwitcher />
            <NotificationBell isRTL={isRTL} />
            <UserMenu isRTL={isRTL} />
          </>
        ) : (
          <>
            <DarkToggle />
            <LangSwitcher />
            <Link to="/login" className="text-sm text-gray-600 hover:text-indigo-600 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
              {t("auth.login.submit")}
            </Link>
            <Link to="/register" className="text-sm bg-indigo-600 text-white font-semibold px-4 py-1.5 rounded-xl hover:bg-indigo-700 transition">
              {t("nav.getStarted")}
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Topbar;
