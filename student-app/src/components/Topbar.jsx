import { useRef, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";
import api from "../api/axios";
import { Icon, ICONS } from "./Sidebar";

/* Design tokens */
const BG     = "bg-[oklch(0.15_0.02_285)]";
const BORDER = "border-[oklch(1_0_0/0.06)]";
const TEXT   = "text-[oklch(0.6_0.02_285)]";
const HOVER  = "hover:bg-[oklch(0.20_0.024_285)] hover:text-white";
const CARD   = "bg-[oklch(0.18_0.022_285)]";

/* ── Page title config: i18n key + icon + Unsplash photo ── */
const PAGE_META = {
  "/dashboard":         { key: "nav.dashboard",       icon: "🏠", photo: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=120&q=60" },
  "/profile":           { key: "nav.myProfile",        icon: "👤", photo: "https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?w=120&q=60" },
  "/recommendations":   { key: "nav.recommendations",  icon: "✨", photo: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=120&q=60" },
  "/universities":      { key: "nav.universities",     icon: "🏛️", photo: "https://images.unsplash.com/photo-1562774053-701939374585?w=120&q=60" },
  "/scholarships":      { key: "nav.scholarships",     icon: "🎓", photo: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=120&q=60" },
  "/learning":          { key: "nav.learning",         icon: "📚", photo: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=120&q=60" },
  "/instructors":       { key: "nav.instructors",      icon: "🧑‍🏫", photo: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=120&q=60" },
  "/apply-hub":         { key: "nav.applyHub",         icon: "📋", photo: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=120&q=60" },
  "/pipeline":          { key: "nav.pipeline",         icon: "📊", photo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=120&q=60" },
  "/favourites":        { key: "nav.favourites",       icon: "⭐", photo: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=120&q=60" },
  "/ai-chat":           { key: "nav.aiChat",           icon: "🤖", photo: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=120&q=60" },
  "/pricing":           { key: "nav.pricing",          icon: "💎", photo: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=120&q=60" },
  "/support":           { key: "nav.support",          icon: "🛟", photo: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=120&q=60" },
  "/notifications":     { key: "nav.notifications",   icon: "🔔", photo: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=120&q=60" },
  "/settings":          { key: "nav.settings",         icon: "⚙️", photo: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=120&q=60" },
  "/announcements":     { key: "nav.announcements",   icon: "📢", photo: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=120&q=60" },
  "/my-questions":      { key: "nav.myQuestions",     icon: "❓", photo: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=120&q=60" },
  "/instructor-panel":  { key: "nav.instructorPanel", icon: "🎙️", photo: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=120&q=60" },
  "/calendar":          { key: "nav.calendar",         icon: "📅", photo: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=120&q=60" },
  "/email-integration": { key: "nav.emailIntegration",icon: "📧", photo: "https://images.unsplash.com/photo-1526554850534-7c78330d5f90?w=120&q=60" },
  "/simulators":        { key: "nav.simulators",       icon: "📝", photo: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=120&q=60" },
};

const usePageMeta = (pathname) => {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  for (const [key, val] of Object.entries(PAGE_META)) {
    if (pathname.startsWith(key + "/")) return val;
  }
  return { key: "nav.brand", icon: "🌐", photo: null };
};

/* ── Notification Bell ── */
const NotificationBell = ({ isRTL, isDark }) => {
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

  const dropdownBg = isDark ? `${CARD} border ${BORDER}` : "bg-white border border-gray-100";
  const itemHover  = isDark ? "hover:bg-[oklch(0.22_0.024_285)]" : "hover:bg-gray-50";
  const titleColor = isDark ? "text-white" : "text-gray-800";
  const subColor   = isDark ? "text-[oklch(0.55_0.02_285)]" : "text-gray-400";
  const divider    = isDark ? `border-[oklch(1_0_0/0.06)]` : "border-gray-100";
  const unreadBg   = isDark ? "bg-violet-500/10" : "bg-blue-50/50";

  return (
    <div className="relative" ref={ref}>
      <button onClick={openDropdown}
        className={`relative w-9 h-9 flex items-center justify-center rounded-xl ${TEXT} ${HOVER} transition-colors`}>
        <Icon d={["M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"]} size={19} />
        {count > 0 && (
          <span className={`absolute -top-0.5 w-4 h-4 bg-violet-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ${isRTL ? "-left-0.5" : "-right-0.5"}`}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute ${isRTL ? "left-0" : "right-0"} top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm ${dropdownBg} rounded-2xl shadow-2xl z-50 overflow-hidden`}>
          <div className={`flex items-center justify-between px-4 py-3 border-b ${divider}`}>
            <span className={`font-bold text-sm ${titleColor}`}>{t("nav.notifications")}</span>
            {count > 0 && (
              <button onClick={markAll} className="text-xs text-violet-400 hover:underline">
                {t("notifications.markAllRead", "Mark all read")}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className={`text-center py-8 text-sm ${subColor}`}>{t("common.loading")}</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-1">🔔</div>
                <p className={`text-sm ${subColor}`}>{t("notifications.empty", "No notifications yet")}</p>
              </div>
            ) : items.map(n => (
              <button key={n.id} onClick={() => markRead(n)}
                className={`w-full text-start flex items-start gap-3 px-4 py-3 ${itemHover} transition border-b ${divider} last:border-0 ${!n.is_read ? unreadBg : ""}`}>
                <span className="text-lg shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.is_read ? `font-semibold ${titleColor}` : subColor}`}>{n.title}</p>
                  <p className={`text-xs mt-0.5 truncate ${subColor}`}>{n.message}</p>
                  <p className={`text-[10px] mt-1 ${subColor} opacity-60`}>{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1.5" />}
              </button>
            ))}
          </div>
          <div className={`border-t ${divider} px-4 py-2.5 text-center`}>
            <Link to="/notifications" onClick={() => setOpen(false)} className="text-xs text-violet-400 font-semibold hover:underline">
              {t("common.viewAll")} {isRTL ? "←" : "→"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Language switcher — pill style matching mockup ── */
const LangSwitcher = ({ isDark }) => {
  const { i18n } = useTranslation();
  const current = i18n.language;
  const isAr = current === "ar";

  const pillBg  = isDark ? "bg-[oklch(0.20_0.024_285)]" : "bg-gray-100";
  const active  = isDark ? "bg-[linear-gradient(135deg,oklch(0.55_0.22_296),oklch(0.50_0.20_264))] text-white shadow" : "bg-white text-indigo-600 shadow-sm";
  const inactive = isDark ? "text-[oklch(0.55_0.02_285)]" : "text-gray-500";

  return (
    <div className={`flex items-center ${pillBg} rounded-xl p-0.5 gap-0.5`}>
      <button
        onClick={() => changeLanguage("en")}
        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${!isAr ? active : `${inactive} hover:text-white`}`}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage("ar")}
        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${isAr ? active : `${inactive} hover:text-white`}`}
      >
        عربي
      </button>
    </div>
  );
};

/* ── User avatar dropdown ── */
const UserMenu = ({ isRTL, isDark }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (user) {
      api.get("/profiles/me").then(r => setProfile(r.data)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleLogout = () => { logout(); navigate("/"); };
  const initial   = user?.email?.[0]?.toUpperCase() || "U";
  const isPaid    = user?.plan === "premium" || user?.plan === "pro";
  const fullName  = profile?.full_name || user?.email?.split("@")[0] || "User";
  const photoUrl  = profile?.photo_url;

  const dropdownBg = isDark ? `${CARD} border ${BORDER} shadow-2xl` : "bg-white border border-gray-100 shadow-xl";
  const itemStyle  = isDark ? `text-[oklch(0.7_0.02_285)] hover:bg-[oklch(0.22_0.024_285)] hover:text-white` : "text-gray-700 hover:bg-gray-50";
  const divider    = isDark ? `border-[oklch(1_0_0/0.06)]` : "border-gray-100";
  const headText   = isDark ? "text-white" : "text-gray-800";

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2 py-1 rounded-xl hover:opacity-90 transition-opacity">
        {photoUrl ? (
          <img src={photoUrl} alt={fullName}
               className="w-8 h-8 rounded-full object-cover"
               style={{ border: "2px solid oklch(0.55 0.22 296 / 0.4)" }} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold"
               style={{ border: "2px solid oklch(0.55 0.22 296 / 0.4)" }}>
            {initial}
          </div>
        )}
        {isDark && (
          <span className="text-sm font-semibold text-white hidden sm:block">{fullName}</span>
        )}
      </button>

      {open && (
        <div className={`absolute ${isRTL ? "left-0" : "right-0"} top-full mt-2 w-56 ${dropdownBg} rounded-2xl z-50 overflow-hidden py-1`}>
          <div className={`px-4 py-3 border-b ${divider}`}>
            <p className={`text-xs font-semibold truncate ${headText}`}>{user?.email}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${isPaid ? "bg-amber-500/20 text-amber-400" : isDark ? "bg-[oklch(0.25_0.02_285)] text-[oklch(0.5_0.02_285)]" : "bg-gray-100 text-gray-500"}`}>
              {isPaid ? `👑 ${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}` : t("nav.freePlan", "Free Plan")}
            </span>
          </div>
          <Link to="/profile" onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${itemStyle} transition`}>
            <Icon d={ICONS.profile} size={16} /> {t("nav.myProfile")}
          </Link>
          <Link to="/settings" onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${itemStyle} transition`}>
            <Icon d={ICONS.settings} size={16} /> {t("nav.settings")}
          </Link>
          <Link to="/pricing" onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${itemStyle} transition`}>
            <Icon d={ICONS.pricing} size={16} /> {t("nav.pricing")}
          </Link>
          <div className={`border-t ${divider} mt-1 pt-1`}>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition">
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
  const pageMeta = usePageMeta(location.pathname);

  const isAuthPage = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email"].includes(location.pathname);
  const isDark = !isAuthPage && !!user;

  const headerStyle = user
    ? (isRTL ? { right: sidebarWidth, left: 0 } : { left: sidebarWidth, right: 0 })
    : { left: 0, right: 0 };

  const barBg     = isDark ? BG : "bg-white";
  const barBorder = isDark ? BORDER : "border-gray-100";
  const titleCol  = isDark ? "text-white" : "text-gray-800";

  return (
    <header
      className={`fixed top-0 h-[60px] ${barBg} border-b ${barBorder} z-20 flex items-center px-4 transition-all duration-300 ease-in-out`}
      style={headerStyle}
    >
      {user && (
        <button onClick={onMobileOpen}
          className={`lg:hidden w-9 h-9 flex items-center justify-center rounded-xl ${TEXT} ${HOVER} transition-colors me-2`}>
          <Icon d={ICONS.menu} size={20} />
        </button>
      )}

      <div className="flex-1 flex items-center justify-center gap-2.5">
        {isDark && pageMeta.photo && (
          <img
            src={pageMeta.photo}
            alt=""
            className="w-7 h-7 rounded-lg object-cover shrink-0"
            style={{ border: "1px solid oklch(1 0 0 / 0.1)" }}
          />
        )}
        <h1 className={`text-[15px] font-semibold tracking-tight ${titleCol}`}>{t(pageMeta.key)}</h1>
      </div>

      <div className="flex items-center gap-1.5">
        {user ? (
          <>
            <LangSwitcher isDark={isDark} />
            <NotificationBell isRTL={isRTL} isDark={isDark} />
            <UserMenu isRTL={isRTL} isDark={isDark} />
          </>
        ) : (
          <>
            <LangSwitcher isDark={false} />
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
