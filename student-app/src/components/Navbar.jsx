import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";
import api from "../api/axios";

/* ── Notification Bell with dropdown ── */
const NotificationBell = () => {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchCount = () => {
    api.get("/notifications/unread-count")
      .then(r => setCount(r.data.count))
      .catch(() => {});
  };

  useEffect(() => { fetchCount(); }, [location.pathname]);

  // Poll every 30s
  useEffect(() => {
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openDropdown = async () => {
    setOpen(o => !o);
    if (!open) {
      setLoading(true);
      try {
        const r = await api.get("/notifications");
        setItems(Array.isArray(r.data) ? r.data.slice(0, 8) : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const markRead = async (notif) => {
    if (!notif.is_read) {
      await api.post(`/notifications/${notif.id}/read`).catch(() => {});
      setItems(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setCount(c => Math.max(0, c - 1));
    }
    setOpen(false);
    if (notif.reference_type === "ticket") {
      navigate(`/support?ticket=${notif.reference_id}`);
    } else {
      navigate("/notifications");
    }
  };

  const markAllRead = async () => {
    await api.post("/notifications/read-all").catch(() => {});
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    setCount(0);
  };

  const TYPE_ICON = { support_reply: "💬", application_update: "📋", scholarship_update: "🎓", system: "🔔" };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={openDropdown}
        className="relative p-1.5 text-gray-500 hover:text-blue-600 transition"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-bold text-gray-800 text-sm">Notifications</span>
            {count > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline font-medium">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-1">🔔</div>
                <p className="text-gray-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              items.map(n => (
                <button
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${!n.is_read ? "bg-blue-50/50" : ""}`}
                >
                  <span className="text-lg shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold text-gray-800" : "text-gray-600"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{n.message}</p>
                    <p className="text-[10px] text-gray-300 mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                </button>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 px-4 py-2.5 text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Language switcher ── */
const LangSwitcher = () => {
  const { i18n } = useTranslation();
  const current = i18n.language;
  const next = current === "ar" ? "en" : "ar";
  const label = current === "ar" ? "🇺🇸 EN" : "🇸🇦 AR";
  return (
    <button
      onClick={() => changeLanguage(next)}
      className="text-xs font-semibold text-gray-500 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-50 transition"
      title={`Switch to ${next === "ar" ? "Arabic" : "English"}`}
    >
      {label}
    </button>
  );
};

const LearningDropdown = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const active = location.pathname.startsWith("/learning");

  const LEARNING_ITEMS = [
    {
      group: `📝 ${t("nav.placementTests")}`,
      links: [
        { to: "/learning/placement/english", label: `🇬🇧 ${t("nav.englishTest")}` },
        { to: "/learning/placement/german",  label: `🇩🇪 ${t("nav.germanTest")}` },
        { to: "/learning/placement/polish",  label: `🇵🇱 ${t("nav.polishTest")}` },
      ],
    },
    {
      group: `🎓 ${t("courses.title")}`,
      links: [
        { to: "/learning/courses/english", label: `🇬🇧 ${t("nav.englishCourses")}` },
        { to: "/learning/courses/german",  label: `🇩🇪 ${t("nav.germanCourses")}` },
        { to: "/learning/courses/polish",  label: `🇵🇱 ${t("nav.polishCourses")}` },
      ],
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 text-sm transition ${active ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600"}`}
      >
        🏫 {t("nav.learning")}
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-2xl border border-gray-100 shadow-xl py-3 z-50">
          <Link
            to="/learning"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 mx-2 rounded-xl"
          >
            🏫 {t("nav.learningOverview")}
          </Link>
          <div className="border-t border-gray-100 my-2" />
          {LEARNING_ITEMS.map((section) => (
            <div key={section.group} className="mb-1">
              <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {section.group}
              </p>
              {section.links.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700 mx-2 rounded-xl transition"
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Mobile menu ── */
const MobileMenu = ({ open, onClose }) => {
  const { t } = useTranslation();
  const location = useLocation();
  useEffect(() => { onClose(); }, [location.pathname]);

  if (!open) return null;
  return (
    <div className="border-t border-gray-100 bg-white px-4 py-4 space-y-1 lg:hidden">
      <MobileLink to="/profile"          label={t("nav.myProfile")} />
      <MobileLink to="/dashboard"        label={`🏠 ${t("nav.dashboard")}`} />
      <MobileLink to="/recommendations"  label={t("nav.recommendations")} />
      <MobileLink to="/universities"     label={t("nav.universities")} />
      <MobileLink to="/scholarships"     label={t("nav.scholarships")} />
      <MobileLink to="/instructors"      label={`👨‍🏫 ${t("nav.instructors")}`} />
      <MobileLink to="/applications"     label={`📋 ${t("nav.applications")}`} />
      <MobileLink to="/favourites"       label={`❤️ ${t("nav.favourites")}`} />

      <div className="pt-2 pb-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">🏫 {t("nav.learning")}</p>
        <MobileLink to="/learning"                    label={t("nav.learningOverview")} indent />
        <p className="text-xs text-gray-400 px-4 py-1">{t("nav.placementTests")}</p>
        <MobileLink to="/learning/placement/english"  label={`🇬🇧 ${t("nav.englishTest")}`}  indent />
        <MobileLink to="/learning/placement/german"   label={`🇩🇪 ${t("nav.germanTest")}`}   indent />
        <MobileLink to="/learning/placement/polish"   label={`🇵🇱 ${t("nav.polishTest")}`}   indent />
        <p className="text-xs text-gray-400 px-4 py-1">{t("courses.title")}</p>
        <MobileLink to="/learning/courses/english"    label={`🇬🇧 ${t("nav.englishCourses")}`} indent />
        <MobileLink to="/learning/courses/german"     label={`🇩🇪 ${t("nav.germanCourses")}`}  indent />
        <MobileLink to="/learning/courses/polish"     label={`🇵🇱 ${t("nav.polishCourses")}`}  indent />
      </div>

      <MobileLink to="/ai-chat"           label={`✨ AI Chat`} />
      <MobileLink to="/notifications"     label={`🔔 Notifications`} />
      <MobileLink to="/announcements"    label={`📢 ${t("nav.announcements")}`} />
      <MobileLink to="/pricing"          label={`💳 ${t("nav.pricing")}`} />
      <MobileLink to="/settings"         label={`⚙️ ${t("nav.settings")}`} />
    </div>
  );
};

const MobileLink = ({ to, label, indent = false }) => (
  <Link to={to} className={`block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 ${indent ? "pl-6" : ""}`}>
    {label}
  </Link>
);

/* ── Main Navbar ── */
const Navbar = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/"); };
  const isActive = (path) => location.pathname === path ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center">
        <div className="flex items-center gap-3 shrink-0 mr-8">
          <Link to="/" className="text-xl font-bold text-blue-600">🎓 {t("nav.brand")}</Link>
          <span className="text-gray-200 select-none">|</span>
          <Link to="/support" className="text-sm text-gray-600 hover:text-blue-600 transition">
            🎧 {t("nav.support")}
          </Link>
          {user && (user.plan === "premium" || user.plan === "pro") && (
            <Link to="/pricing" className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm hover:from-amber-500 hover:to-yellow-600 transition shrink-0">
              <span>👑</span>
              <span className="max-w-[100px] truncate">{user.email.split("@")[0]}</span>
              <span className="opacity-80 capitalize">{user.plan}</span>
            </Link>
          )}
        </div>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-4 ml-auto">
          {user ? (
            <>
              <Link to="/profile"         className={`text-sm ${isActive("/profile")}`}>{t("nav.myProfile")}</Link>
              <Link to="/dashboard"       className={`text-sm ${isActive("/dashboard")}`}>🏠 {t("nav.dashboard")}</Link>
              <Link to="/recommendations" className={`text-sm ${isActive("/recommendations")}`}>{t("nav.recommendations")}</Link>
              <Link to="/universities"    className={`text-sm ${isActive("/universities")}`}>{t("nav.universities")}</Link>
              <Link to="/scholarships"    className={`text-sm ${isActive("/scholarships")}`}>{t("nav.scholarships")}</Link>
              <LearningDropdown />
              <Link to="/instructors"     className={`text-sm ${isActive("/instructors")}`}>👨‍🏫 {t("nav.instructors")}</Link>
              <Link to="/applications"    className={`text-sm ${isActive("/applications")}`}>📋 {t("nav.applications")}</Link>
              <Link to="/favourites"      className={`text-sm ${isActive("/favourites")}`}>❤️ {t("nav.favourites")}</Link>
              <Link to="/ai-chat"          className={`text-sm ${isActive("/ai-chat")}`}>✨ AI Chat</Link>
              <Link to="/pricing"         className={`text-sm ${isActive("/pricing")}`}>💳 {t("nav.pricing")}</Link>
              <LangSwitcher />
              <Link to="/settings"        className={`text-sm ${isActive("/settings")}`}>⚙️</Link>
              <NotificationBell />
              <button onClick={handleLogout} className="bg-red-50 text-red-600 px-4 py-1.5 rounded-lg hover:bg-red-100 transition text-sm font-medium">
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <Link to="/pricing"  className={`text-sm ${isActive("/pricing")}`}>💳 {t("nav.pricing")}</Link>
              <LangSwitcher />
              <Link to="/login"    className={`text-sm ${isActive("/login")}`}>{t("nav.login")}</Link>
              <Link to="/register" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                {t("nav.getStarted")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        {user && (
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 ml-auto"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        )}
        {!user && (
          <div className="lg:hidden flex gap-2 ml-auto">
            <LangSwitcher />
            <Link to="/pricing"  className="text-sm text-gray-600">{t("nav.pricing")}</Link>
            <Link to="/login"    className="text-sm text-gray-600">{t("nav.login")}</Link>
            <Link to="/register" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm">{t("nav.getStarted")}</Link>
          </div>
        )}
      </div>

      {user && <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />}
    </nav>
  );
};

export default Navbar;
