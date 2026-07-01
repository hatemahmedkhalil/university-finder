import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

/* ── SVG Icons ── */
const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  dashboard:       ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", "M9 22V12h6v10"],
  profile:         ["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", "M12 11a4 4 0 100-8 4 4 0 000 8z"],
  recommendations: ["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"],
  universities:    ["M22 10v6M2 10l10-5 10 5-10 5z", "M6 12v5c3 3 9 3 12 0v-5"],
  scholarships:    ["M12 15C8.7 15 6 12.3 6 9V4l6-2 6 2v5c0 3.3-2.7 6-6 6z", "M8.8 19.1L12 21l3.2-1.9M12 15v6"],
  learning:        ["M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z", "M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"],
  instructors:     ["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2", "M23 21v-2a4 4 0 00-3-3.87", "M9 11a4 4 0 100-8 4 4 0 000 8z", "M16 3.13a4 4 0 010 7.75"],
  applications:    ["M9 11l3 3L22 4", "M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"],
  favourites:      ["M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"],
  applyhub:        ["M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"],
  aichat:          ["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"],
  pricing:         ["M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z", "M12 6v6l4 2"],
  support:         ["M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3", "M12 17h.01"],
  settings:        ["M12 15a3 3 0 100-6 3 3 0 000 6z", "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"],
  logout:          ["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  chevronLeft:     "M15 18l-6-6 6-6",
  chevronRight:    "M9 18l6-6-6-6",
  menu:            ["M3 12h18", "M3 6h18", "M3 18h18"],
};

/* nav items for students */
const STUDENT_NAV = [
  { path: "/dashboard",         i18nKey: "nav.dashboard",         icon: "dashboard" },
  { path: "/email-integration", i18nKey: "nav.emailIntegration", icon: "notifications" },
  { path: "/calendar",          i18nKey: "nav.calendar",          icon: "favourites" },
  { path: "/profile",           i18nKey: "nav.myProfile",         icon: "profile" },
  { path: "/recommendations", i18nKey: "nav.recommendations", icon: "recommendations" },
  { path: "/universities",    i18nKey: "nav.universities",    icon: "universities" },
  { path: "/scholarships",    i18nKey: "nav.scholarships",    icon: "scholarships" },
  { path: "/pipeline",        i18nKey: "nav.pipeline",        icon: "applyhub", badge: "AI" },
  { path: "/apply-hub",       i18nKey: "nav.applyHub",        icon: "applications" },
  { path: "/favourites",      i18nKey: "nav.favourites",      icon: "favourites" },
  { path: "/learning",        i18nKey: "nav.learning",        icon: "learning" },
  { path: "/instructors",     i18nKey: "nav.instructors",     icon: "instructors" },
  { path: "/ai-chat",         i18nKey: "nav.aiChat",          icon: "aichat", badge: "AI" },
  { path: "/pricing",         i18nKey: "nav.pricing",         icon: "pricing" },
  { path: "/support",           i18nKey: "nav.support",          icon: "support" },
];

/* nav items for instructors — focused view */
const INSTRUCTOR_NAV = [
  { path: "/dashboard",            i18nKey: "nav.dashboard",           icon: "dashboard" },
  { path: "/instructor-panel",     i18nKey: "nav.instructorPanel",     icon: "instructors" },
  { path: "/my-courses",           i18nKey: "nav.myCourses",           icon: "learning" },
  { path: "/my-instructor-profile",i18nKey: "nav.myInstructorProfile", icon: "profile" },
  { path: "/support",              i18nKey: "nav.support",             icon: "support" },
];

const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const NAV = user?.role === "instructor" ? INSTRUCTOR_NAV : STUDENT_NAV;

  const handleLogout = () => { logout(); navigate("/"); onMobileClose?.(); };

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  /* tooltip side: opposite of sidebar edge */
  const tooltipPos = isRTL ? "right-full mr-3" : "left-full ml-3";

  /* ── Shared nav list ── */
  const NavList = () => (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5 px-2">
      {NAV.map(({ path, i18nKey, icon, badge }) => {
        const active = isActive(path);
        const label  = t(i18nKey);
        return (
          <Link
            key={path}
            to={path}
            onClick={onMobileClose}
            title={collapsed ? label : undefined}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-150 relative group
              ${active
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }
            `}
          >
            <span className={`shrink-0 transition-colors ${active ? "text-white" : "text-slate-500 group-hover:text-slate-200"}`}>
              <Icon d={ICONS[icon]} size={18} />
            </span>

            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
              {label}
            </span>

            {badge && !collapsed && (
              <span className="ms-auto text-[10px] font-bold bg-indigo-400/20 text-indigo-300 px-1.5 py-0.5 rounded-md shrink-0">
                {badge}
              </span>
            )}

            {collapsed && (
              <div className={`absolute ${tooltipPos} px-2.5 py-1.5 bg-slate-700 text-white text-xs rounded-lg
                              opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150
                              whitespace-nowrap z-50 shadow-lg`}>
                {label}
                {badge && <span className="ms-1.5 text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded">{badge}</span>}
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );

  /* ── User footer ── */
  const UserFooter = () => {
    const initial  = user?.email?.[0]?.toUpperCase() || "U";
    const planLabel = user?.plan === "premium" ? "Premium" : user?.plan === "pro" ? "Pro" : t("nav.free", "Free");
    const isPaid   = user?.plan === "premium" || user?.plan === "pro";

    return (
      <div className="border-t border-slate-800 pt-3 pb-3 px-2 space-y-1">
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initial}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.email?.split("@")[0]}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isPaid ? "bg-amber-500/20 text-amber-300" : "bg-slate-700 text-slate-400"}`}>
                {isPaid ? "👑 " : ""}{planLabel}
              </span>
            </div>
          )}
        </div>

        <Link
          to="/settings"
          onClick={onMobileClose}
          title={collapsed ? t("nav.settings") : undefined}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white text-sm transition-all duration-150 group relative"
        >
          <span className="shrink-0"><Icon d={ICONS.settings} size={17} /></span>
          <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
            {t("nav.settings")}
          </span>
          {collapsed && (
            <div className={`absolute ${tooltipPos} px-2.5 py-1.5 bg-slate-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg`}>
              {t("nav.settings")}
            </div>
          )}
        </Link>

        <button
          onClick={handleLogout}
          title={collapsed ? t("nav.logout") : undefined}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 text-sm transition-all duration-150 group relative"
        >
          <span className="shrink-0"><Icon d={ICONS.logout} size={17} /></span>
          <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap text-start ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
            {t("nav.logout")}
          </span>
          {collapsed && (
            <div className={`absolute ${tooltipPos} px-2.5 py-1.5 bg-slate-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg`}>
              {t("nav.logout")}
            </div>
          )}
        </button>
      </div>
    );
  };

  /* collapse/expand icon — flipped in RTL */
  const collapseIcon = isRTL
    ? (collapsed ? ICONS.chevronLeft  : ICONS.chevronRight)
    : (collapsed ? ICONS.chevronRight : ICONS.chevronLeft);

  /* ── Desktop sidebar ── */
  const desktopSidebar = (
    <aside
      className={`
        hidden lg:flex flex-col fixed top-0 h-screen z-30
        bg-slate-950 border-slate-800
        transition-all duration-300 ease-in-out
        ${isRTL ? "right-0 border-l" : "left-0 border-r"}
        ${collapsed ? "w-[68px]" : "w-[240px]"}
      `}
    >
      <div className={`flex items-center h-[60px] shrink-0 px-3 border-b border-slate-800 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <Link to="/" className={`flex items-center gap-2 ${isRTL ? "me-1" : "ms-1"}`}>
            <span className="text-xl">🎓</span>
            <span className="text-white font-bold text-[15px] tracking-tight">UniFind</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Icon d={collapseIcon} size={16} />
        </button>
      </div>

      <NavList />
      <UserFooter />
    </aside>
  );

  /* ── Mobile sidebar (overlay) ── */
  const mobileSidebar = (
    <>
      <div
        className={`lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onMobileClose}
      />
      <aside
        className={`
          lg:hidden fixed top-0 h-screen z-50 w-[240px]
          bg-slate-950 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isRTL
            ? `right-0 border-l border-slate-800 ${mobileOpen ? "translate-x-0" : "translate-x-full"}`
            : `left-0 border-r border-slate-800 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`
          }
        `}
      >
        <div className="flex items-center justify-between h-[60px] shrink-0 px-4 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2" onClick={onMobileClose}>
            <span className="text-xl">🎓</span>
            <span className="text-white font-bold text-[15px] tracking-tight">UniFind</span>
          </Link>
          <button onClick={onMobileClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <NavList />
        <UserFooter />
      </aside>
    </>
  );

  return <>{desktopSidebar}{mobileSidebar}</>;
};

export default Sidebar;
export { ICONS, Icon };
