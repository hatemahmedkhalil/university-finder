import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api/axios";
import { useEffect, useState } from "react";

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
  calendar:        ["M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"],
  email:           ["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z", "M22 6l-10 7L2 6"],
  notifications:   ["M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"],
  questions:       ["M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"],
  pipeline:        ["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"],
};

/* ── Grouped nav sections matching design handoff ── */
const STUDENT_NAV_SECTIONS = [
  {
    label: "Main",
    i18nKey: "nav.sectionMain",
    items: [
      { path: "/dashboard",       i18nKey: "nav.dashboard",       iconKey: "dashboard" },
      { path: "/universities",    i18nKey: "nav.universities",    iconKey: "universities" },
      { path: "/scholarships",    i18nKey: "nav.scholarships",    iconKey: "scholarships" },
      { path: "/recommendations", i18nKey: "nav.recommendations", iconKey: "recommendations", badge: "AI" },
      { path: "/ai-chat",         i18nKey: "nav.aiChat",          iconKey: "aichat", badge: "AI" },
      { path: "/pipeline",        i18nKey: "nav.pipeline",        iconKey: "pipeline" },
      { path: "/apply-hub",       i18nKey: "nav.applyHub",        iconKey: "applyhub" },
      { path: "/learning",        i18nKey: "nav.learning",        iconKey: "learning" },
    ],
  },
  {
    label: "Community",
    i18nKey: "nav.sectionCommunity",
    items: [
      { path: "/instructors",       i18nKey: "nav.instructors",     iconKey: "instructors" },
      { path: "/calendar",          i18nKey: "nav.calendar",        iconKey: "calendar" },
      { path: "/email-integration", i18nKey: "nav.emailIntegration",iconKey: "email" },
      { path: "/favourites",        i18nKey: "nav.favourites",      iconKey: "favourites" },
      { path: "/my-questions",      i18nKey: "nav.myQuestions",     iconKey: "questions" },
      { path: "/notifications",     i18nKey: "nav.notifications",   iconKey: "notifications" },
    ],
  },
  {
    label: "Account",
    i18nKey: "nav.sectionAccount",
    items: [
      { path: "/profile",  i18nKey: "nav.myProfile", iconKey: "profile" },
      { path: "/pricing",  i18nKey: "nav.pricing",   iconKey: "pricing" },
      { path: "/support",  i18nKey: "nav.support",   iconKey: "support" },
      { path: "/settings", i18nKey: "nav.settings",  iconKey: "settings" },
    ],
  },
];

const INSTRUCTOR_NAV_SECTIONS = [
  {
    label: "Main",
    i18nKey: "nav.sectionMain",
    items: [
      { path: "/dashboard",             i18nKey: "nav.dashboard",           iconKey: "dashboard" },
      { path: "/instructor-panel",      i18nKey: "nav.instructorPanel",     iconKey: "instructors" },
      { path: "/my-courses",            i18nKey: "nav.myCourses",           iconKey: "learning" },
      { path: "/my-instructor-profile", i18nKey: "nav.myInstructorProfile", iconKey: "profile" },
    ],
  },
  {
    label: "Account",
    i18nKey: "nav.sectionAccount",
    items: [
      { path: "/support",  i18nKey: "nav.support",  iconKey: "support" },
      { path: "/settings", i18nKey: "nav.settings", iconKey: "settings" },
    ],
  },
];

const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [profilePct, setProfilePct] = useState(0);

  const SECTIONS = user?.role === "instructor" ? INSTRUCTOR_NAV_SECTIONS : STUDENT_NAV_SECTIONS;

  useEffect(() => {
    if (user) {
      api.get("/profiles/me").then(r => {
        const p = r.data;
        const fields = [p?.gpa, p?.budget_eur, p?.field_of_study, p?.preferred_countries?.length, p?.degree_level];
        const filled = fields.filter(Boolean).length;
        setProfilePct(Math.round((filled / fields.length) * 100));
      }).catch(() => {});
    }
  }, [user]);

  const handleLogout = () => { logout(); navigate("/"); onMobileClose?.(); };

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const tooltipPos = isRTL ? "right-full mr-3" : "left-full ml-3";

  /* ── Nav sections ── */
  const NavSections = () => (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2">
      {SECTIONS.map((section) => (
        <div key={section.label} className="mb-1">
          {!collapsed && (
            <div className="px-3 pt-4 pb-1.5 text-[10.5px] font-bold uppercase tracking-widest"
                 style={{ color: "oklch(0.45 0.02 285)" }}>
              {t(section.i18nKey, section.label)}
            </div>
          )}
          {collapsed && <div className="my-2 mx-2 h-px" style={{ background: "oklch(1 0 0 / 0.06)" }} />}
          {section.items.map(({ path, i18nKey, iconKey, badge }) => {
            const active = isActive(path);
            const label  = t(i18nKey);
            return (
              <Link
                key={path}
                to={path}
                onClick={onMobileClose}
                title={collapsed ? label : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-sm font-medium transition-all duration-150 relative group mb-0.5"
                style={{
                  background: active ? "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))" : "transparent",
                  color: active ? "#fff" : "oklch(0.60 0.02 285)",
                  fontWeight: active ? 600 : 500,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "oklch(0.20 0.024 285)"; if (!active) e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; if (!active) e.currentTarget.style.color = "oklch(0.60 0.02 285)"; }}
              >
                <span className="shrink-0" style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon d={ICONS[iconKey]} size={18} />
                </span>

                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
                  {label}
                </span>

                {badge && !collapsed && (
                  <span className="ms-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                        style={{ background: active ? "oklch(1 0 0 / 0.20)" : "oklch(0.55 0.22 296 / 0.2)", color: active ? "white" : "oklch(0.80 0.14 296)" }}>
                    {badge}
                  </span>
                )}

                {collapsed && (
                  <div className={`absolute ${tooltipPos} px-2.5 py-1.5 text-white text-xs rounded-lg
                                  opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150
                                  whitespace-nowrap z-50 shadow-lg`}
                       style={{ background: "oklch(0.22 0.024 285)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
                    {label}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  /* ── Logout button ── */
  const LogoutBtn = () => (
    <button
      onClick={handleLogout}
      title={collapsed ? t("nav.logout") : undefined}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-[9px] text-sm transition-all duration-150 relative group"
      style={{ color: "oklch(0.60 0.02 285)" }}
      onMouseEnter={e => { e.currentTarget.style.background = "oklch(0.55 0.19 25 / 0.12)"; e.currentTarget.style.color = "oklch(0.70 0.18 25)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "oklch(0.60 0.02 285)"; }}
    >
      <span className="shrink-0 text-base leading-none" style={{ width: 20, textAlign: "center" }}>🚪</span>
      <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap text-start ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
        {t("nav.logout")}
      </span>
      {collapsed && (
        <div className={`absolute ${tooltipPos} px-2.5 py-1.5 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg`}
             style={{ background: "oklch(0.22 0.024 285)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
          {t("nav.logout")}
        </div>
      )}
    </button>
  );

  /* ── Profile completion card (bottom pinned) ── */
  const ProfileCard = () => {
    if (collapsed) return <LogoutBtn />;
    return (
      <div className="px-2 pb-3">
        <div className="rounded-xl p-3 mb-1" style={{ background: "oklch(0.17 0.022 285)", border: "1px solid oklch(1 0 0 / 0.07)" }}>
          <div className="text-xs mb-2" style={{ color: "oklch(0.60 0.02 285)" }}>Profile completion</div>
          <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "oklch(0.25 0.02 285)" }}>
            <div className="h-full rounded-full transition-all duration-500"
                 style={{ width: `${profilePct || 72}%`, background: "linear-gradient(90deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))" }} />
          </div>
          <Link to="/profile" onClick={onMobileClose}
                className="text-xs font-semibold transition-colors"
                style={{ color: "oklch(0.80 0.10 296)" }}>
            Complete profile →
          </Link>
        </div>
        <LogoutBtn />
      </div>
    );
  };

  const collapseIcon = isRTL
    ? (collapsed ? ICONS.chevronLeft  : ICONS.chevronRight)
    : (collapsed ? ICONS.chevronRight : ICONS.chevronLeft);

  const SidebarInner = ({ onClose }) => (
    <>
      {/* Logo header */}
      <div className="flex items-center h-[60px] shrink-0 px-3"
           style={{ borderBottom: "1px solid oklch(1 0 0 / 0.07)", justifyContent: collapsed ? "center" : "space-between" }}>
        {!collapsed && (
          <Link to="/" className={`flex items-center gap-2.5 ${isRTL ? "me-1" : "ms-1"}`} onClick={onClose}>
            <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-white font-bold text-sm shadow-lg"
                 style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))" }}>U</div>
            <span className="text-white font-bold text-[15px] tracking-tight">UniPath</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/" onClick={onClose}
                className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-white font-bold text-sm shadow-lg"
                style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))" }}>U</Link>
        )}
        {!collapsed && (
          <button onClick={onToggle}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: "oklch(0.55 0.02 285)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "oklch(0.20 0.024 285)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "oklch(0.55 0.02 285)"; }}>
            <Icon d={collapseIcon} size={16} />
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={onToggle}
                className="mx-auto mt-2 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: "oklch(0.55 0.02 285)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "oklch(0.20 0.024 285)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "oklch(0.55 0.02 285)"; }}>
          <Icon d={collapseIcon} size={16} />
        </button>
      )}

      <NavSections />
      <ProfileCard />
    </>
  );

  /* Desktop sidebar */
  const desktopSidebar = (
    <aside
      className={`hidden lg:flex flex-col fixed top-0 h-screen z-30 transition-all duration-300 ease-in-out
        ${isRTL ? "right-0 border-l" : "left-0 border-r"}
        ${collapsed ? "w-[68px]" : "w-[240px]"}`}
      style={{ background: "oklch(0.11 0.016 285)", borderColor: "oklch(1 0 0 / 0.07)" }}
    >
      <SidebarInner onClose={undefined} />
    </aside>
  );

  /* Mobile sidebar */
  const mobileSidebar = (
    <>
      <div
        className={`lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onMobileClose}
      />
      <aside
        className={`lg:hidden fixed top-0 h-screen z-50 w-[240px] flex flex-col transition-transform duration-300 ease-in-out
          ${isRTL
            ? `right-0 border-l ${mobileOpen ? "translate-x-0" : "translate-x-full"}`
            : `left-0 border-r ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`
          }`}
        style={{ background: "oklch(0.11 0.016 285)", borderColor: "oklch(1 0 0 / 0.07)" }}
      >
        <div className="flex items-center justify-between h-[60px] shrink-0 px-4"
             style={{ borderBottom: "1px solid oklch(1 0 0 / 0.07)" }}>
          <Link to="/" className="flex items-center gap-2.5" onClick={onMobileClose}>
            <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-white font-bold text-sm shadow-lg"
                 style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))" }}>U</div>
            <span className="text-white font-bold text-[15px] tracking-tight">UniPath</span>
          </Link>
          <button onClick={onMobileClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: "oklch(0.55 0.02 285)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {SECTIONS.map((section) => (
            <div key={section.label} className="mb-1">
              <div className="px-3 pt-4 pb-1.5 text-[10.5px] font-bold uppercase tracking-widest"
                   style={{ color: "oklch(0.45 0.02 285)" }}>
                {t(section.i18nKey, section.label)}
              </div>
              {section.items.map(({ path, i18nKey, iconKey, badge }) => {
                const active = isActive(path);
                const label  = t(i18nKey);
                return (
                  <Link key={path} to={path} onClick={onMobileClose}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-sm font-medium mb-0.5 transition-all duration-150"
                        style={{
                          background: active ? "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))" : "transparent",
                          color: active ? "#fff" : "oklch(0.60 0.02 285)",
                          fontWeight: active ? 600 : 500,
                        }}>
                    <span className="shrink-0" style={{ width: 18 }}><Icon d={ICONS[iconKey] ?? ICONS.dashboard} size={16} /></span>
                    <span>{label}</span>
                    {badge && <span className="ms-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                    style={{ background: "oklch(0.55 0.22 296 / 0.2)", color: "oklch(0.80 0.14 296)" }}>{badge}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="px-2 pb-3">
          <div className="rounded-xl p-3 mb-1" style={{ background: "oklch(0.17 0.022 285)", border: "1px solid oklch(1 0 0 / 0.07)" }}>
            <div className="text-xs mb-2" style={{ color: "oklch(0.60 0.02 285)" }}>Profile completion</div>
            <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "oklch(0.25 0.02 285)" }}>
              <div className="h-full rounded-full" style={{ width: `${profilePct || 72}%`, background: "linear-gradient(90deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))" }} />
            </div>
            <Link to="/profile" onClick={onMobileClose} className="text-xs font-semibold" style={{ color: "oklch(0.80 0.10 296)" }}>
              Complete profile →
            </Link>
          </div>
          <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-[9px] text-sm transition-all"
                  style={{ color: "oklch(0.60 0.02 285)" }}>
            <Icon d={ICONS.logout} size={16} />
            <span>{t("nav.logout")}</span>
          </button>
        </div>
      </aside>
    </>
  );

  return <>{desktopSidebar}{mobileSidebar}</>;
};

export default Sidebar;
export { ICONS, Icon };
