import { useRef, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";
import api from "../api/axios";
import { Icon, ICONS } from "./Sidebar";

/* Design tokens */
const BG     = "bg-[var(--bg)]";
const BORDER = "border-[var(--border)]";
const TEXT   = "text-[var(--ink-faint)]";
const HOVER  = "hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]";
const CARD   = "bg-[var(--surface-2)]";

/* ── Page title config: i18n key + icon + Unsplash photo ── */
const PAGE_META = {
  "/dashboard":         { key: "nav.dashboard",       icon: "🏠", photo: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=120&q=60" },
  "/profile":           { key: "nav.myData",           icon: "👤", photo: "https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?w=120&q=60" },
  "/account":           { key: "nav.accountProfile",   icon: "👤", photo: "https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?w=120&q=60" },
  "/recommendations":   { key: "nav.recommendations",  icon: "✨", photo: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=120&q=60" },
  "/universities":      { key: "nav.universities",     icon: "🏛️", photo: "https://images.unsplash.com/photo-1562774053-701939374585?w=120&q=60" },
  "/scholarships":      { key: "nav.scholarships",     icon: "🎓", photo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=120&q=60" },
  "/visa-guide":        { key: "nav.visaGuide",        icon: "🛂", photo: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=120&q=60" },
  "/learning":          { key: "nav.learning",         icon: "📚", photo: "https://images.unsplash.com/photo-1565022536102-f7645c84354a?w=120&q=60" },
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

/* ── AI Chat quick-access button ── */
const AiChatButton = () => (
  <Link to="/ai-chat"
    className={`relative w-9 h-9 flex items-center justify-center rounded-xl ${TEXT} ${HOVER} transition-colors`}
    title="AI Chat">
    <Icon d={ICONS.sparkle} size={16} />
  </Link>
);

/* ── Global search — real autocomplete against /universities, ⌘K to focus ── */
const GlobalSearch = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [results, setResults] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef(null);
  const boxRef = useRef(null);
  const debounceRef = useRef(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced fetch — 300ms, cancels stale in-flight responses
  useEffect(() => {
    clearTimeout(debounceRef.current);
    const query = value.trim();
    if (!query) {
      setResults([]); setLoading(false); setError(false); setActiveIdx(-1);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const myReqId = ++reqIdRef.current;
      setLoading(true); setError(false);
      api.get("/universities", { params: { search: query, limit: 6 } })
        .then(res => {
          if (myReqId !== reqIdRef.current) return; // stale response, ignore
          setResults(Array.isArray(res.data?.items) ? res.data.items : []);
          setActiveIdx(-1);
        })
        .catch(() => { if (myReqId === reqIdRef.current) setError(true); })
        .finally(() => { if (myReqId === reqIdRef.current) setLoading(false); });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  const goToUniversity = (uni) => {
    navigate(`/university/${uni.id}`);
    setValue(""); setResults([]); setOpen(false);
    inputRef.current?.blur();
  };

  const submit = (e) => {
    e.preventDefault();
    if (activeIdx >= 0 && results[activeIdx]) {
      goToUniversity(results[activeIdx]);
    } else {
      navigate(value.trim() ? `/universities?search=${encodeURIComponent(value.trim())}` : "/universities");
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const onKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => (i + 1) % results.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => (i - 1 + results.length) % results.length); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  const showDropdown = open && value.trim().length > 0;

  return (
    <form onSubmit={submit} className="hidden md:flex flex-1 max-w-md mx-auto relative" ref={boxRef}>
      <div
        className="w-full flex items-center gap-2 h-9 px-3 rounded-full transition-colors"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: "var(--ink-faint)" }} className="shrink-0">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          value={value}
          onChange={e => { setValue(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t("nav.searchPlaceholder", "Search for universities, scholarships...")}
          className="flex-1 bg-transparent outline-none text-sm min-w-0"
          style={{ color: "var(--ink)" }}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="global-search-listbox"
          aria-autocomplete="list"
        />
        <kbd className="hidden lg:flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0"
          style={{ color: "var(--ink-faint)", background: "var(--surface)", border: "1px solid var(--border)" }}>
          ⌘K
        </kbd>
      </div>

      {showDropdown && (
        <div
          id="global-search-listbox"
          role="listbox"
          className="absolute top-11 left-0 right-0 rounded-2xl overflow-hidden z-50 max-h-80 overflow-y-auto"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 12px 32px rgba(0,0,0,0.16)" }}
        >
          {loading && (
            <div className="px-4 py-3 text-sm flex items-center gap-2" style={{ color: "var(--ink-faint)" }}>
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60" />
              {t("nav.searchLoading", "Searching…")}
            </div>
          )}
          {!loading && error && (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--danger)" }}>
              {t("nav.searchError", "Couldn't load results. Try again.")}
            </div>
          )}
          {!loading && !error && results.length === 0 && (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--ink-faint)" }}>
              {t("nav.searchNoResults", "No universities found.")}
            </div>
          )}
          {!loading && !error && results.map((uni, i) => (
            <button
              type="button"
              key={uni.id}
              role="option"
              aria-selected={i === activeIdx}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => goToUniversity(uni)}
              className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-3 transition-colors"
              style={{ background: i === activeIdx ? "var(--surface-hover)" : "transparent", color: "var(--ink)" }}
            >
              <span className="truncate font-medium">{uni.name}</span>
              <span className="text-xs shrink-0" style={{ color: "var(--ink-faint)" }}>
                {uni.city ? `${uni.city}, ` : ""}{uni.country}
              </span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
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

  const TYPE_ICON = { support_reply: ICONS.aichat, application_update: ICONS.applications, scholarship_update: ICONS.graduationCap, system: ICONS.notifications };

  const dropdownBg = `${CARD} border ${BORDER}`;
  const itemHover  = "hover:bg-[var(--surface-hover)]";
  const titleColor = "text-[var(--ink)]";
  const subColor   = "text-[var(--ink-faint)]";
  const divider    = "border-[var(--border)]";
  const unreadBg   = "bg-[var(--accent)]/10";

  return (
    <div className="relative" ref={ref}>
      <button onClick={openDropdown}
        className={`relative w-9 h-9 flex items-center justify-center rounded-xl ${TEXT} ${HOVER} transition-colors`}>
        <Icon d={["M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"]} size={19} />
        {count > 0 && (
          <span className={`absolute -top-0.5 w-4 h-4 bg-[var(--accent)] text-white text-[9px] font-bold rounded-full flex items-center justify-center ${isRTL ? "-left-0.5" : "-right-0.5"}`}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute ${isRTL ? "left-0" : "right-0"} top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm ${dropdownBg} rounded-2xl shadow-2xl z-50 overflow-hidden`}>
          <div className={`flex items-center justify-between px-4 py-3 border-b ${divider}`}>
            <span className={`font-bold text-sm ${titleColor}`}>{t("nav.notifications")}</span>
            {count > 0 && (
              <button onClick={markAll} className="text-xs text-[var(--accent-light)] hover:underline">
                {t("notifications.markAllRead", "Mark all read")}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className={`text-center py-8 text-sm ${subColor}`}>{t("common.loading")}</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-2 opacity-40"><Icon d={ICONS.notifications} size={28} /></div>
                <p className={`text-sm ${subColor}`}>{t("notifications.empty", "No notifications yet")}</p>
              </div>
            ) : items.map(n => (
              <button key={n.id} onClick={() => markRead(n)}
                className={`w-full text-start flex items-start gap-3 px-4 py-3 ${itemHover} transition border-b ${divider} last:border-0 ${!n.is_read ? unreadBg : ""}`}>
                <span className="shrink-0 mt-0.5" style={{ color: "var(--ink-faint)" }}><Icon d={TYPE_ICON[n.type] ?? ICONS.notifications} size={17} /></span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.is_read ? `font-semibold ${titleColor}` : subColor}`}>{n.title}</p>
                  <p className={`text-xs mt-0.5 truncate ${subColor}`}>{n.message}</p>
                  <p className={`text-[10px] mt-1 ${subColor} opacity-60`}>{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0 mt-1.5" />}
              </button>
            ))}
          </div>
          <div className={`border-t ${divider} px-4 py-2.5 text-center`}>
            <Link to="/notifications" onClick={() => setOpen(false)} className="text-xs text-[var(--accent-light)] font-semibold hover:underline">
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

  const pillBg  = "bg-[var(--surface-hover)]";
  const active  = "bg-[var(--accent)] text-[var(--on-accent)] shadow";
  const inactive = "text-[var(--ink-faint)]";

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

  const dropdownBg = `${CARD} border ${BORDER} shadow-2xl`;
  const itemStyle  = `text-[var(--ink-dim)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]`;
  const divider    = "border-[var(--border)]";
  const headText   = "text-[var(--ink)]";

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2 py-1 rounded-xl hover:opacity-90 transition-opacity">
        {photoUrl ? (
          <img src={photoUrl} alt={fullName}
               className="w-8 h-8 rounded-full object-cover"
               style={{ border: "2px solid var(--accent)" }} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-light)] to-[var(--accent)] flex items-center justify-center text-white text-sm font-bold"
               style={{ border: "2px solid var(--accent)" }}>
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
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${isPaid ? "bg-amber-500/20 text-amber-400" : "bg-[var(--border)] text-[var(--ink-faint)]"}`}>
              {isPaid ? <><Icon d={ICONS.award} size={10} className="inline -mt-0.5 me-0.5" />{user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}</> : t("nav.freePlan", "Free Plan")}
            </span>
          </div>
          <Link to="/account" onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${itemStyle} transition`}>
            <Icon d={ICONS.profile} size={16} /> {t("nav.accountProfile")}
          </Link>
          <Link to="/profile" onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${itemStyle} transition`}>
            <Icon d={ICONS.profile} size={16} /> {t("nav.myData")}
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

  const barBg     = BG;
  const barBorder = BORDER;
  const titleCol  = "text-[var(--ink)]";

  return (
    <header
      className="fixed top-0 h-[68px] z-20 flex items-center gap-3 px-4 lg:px-6 transition-all duration-300 ease-in-out backdrop-blur-xl"
      style={{
        ...headerStyle,
        background: "color-mix(in oklab, var(--bg) 82%, transparent)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {user && (
        <button onClick={onMobileOpen}
          className={`lg:hidden w-9 h-9 flex items-center justify-center rounded-xl shrink-0 ${TEXT} ${HOVER} transition-colors`}>
          <Icon d={ICONS.menu} size={20} />
        </button>
      )}

      {user ? (
        <>
          <h1 className={`md:hidden text-[15px] font-semibold tracking-tight truncate ${titleCol}`}>{t(pageMeta.key)}</h1>
          <GlobalSearch />
        </>
      ) : (
        <div className="flex-1 flex items-center gap-2.5">
          <h1 className={`text-[15px] font-semibold tracking-tight ${titleCol}`}>{t(pageMeta.key)}</h1>
        </div>
      )}

      <div className="flex items-center gap-1.5 shrink-0">
        {user ? (
          <>
            <LangSwitcher isDark={isDark} />
            <AiChatButton />
            <NotificationBell isRTL={isRTL} isDark={isDark} />
            <UserMenu isRTL={isRTL} isDark={isDark} />
          </>
        ) : (
          <>
            <LangSwitcher isDark={false} />
            <Link to="/login" className="text-sm text-gray-600 hover:text-sky-600 font-medium px-3 py-1.5 rounded-lg hover:bg-sky-50 transition">
              {t("auth.login.submit")}
            </Link>
            <Link to="/register" className="text-sm bg-sky-500 text-white font-semibold px-4 py-1.5 rounded-xl hover:bg-sky-600 transition">
              {t("nav.getStarted")}
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Topbar;
