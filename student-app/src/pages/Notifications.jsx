import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";
import PageHero from "../components/PageHero";
import { Icon, ICONS } from "../components/Sidebar";

const TYPE_CONFIG = {
  support_reply:      { icon: "questions", grad: "from-blue-500 to-cyan-500",    bg: "bg-blue-50",   text: "text-blue-700",  label: "Support Reply" },
  application_update: { icon: "applications", grad: "from-violet-500 to-purple-600", bg: "bg-violet-50", text: "text-violet-700",label: "Application" },
  scholarship_update: { icon: "graduationCap", grad: "from-emerald-500 to-teal-500", bg: "bg-emerald-50",text: "text-emerald-700",label: "Scholarship" },
  ai_insight:         { icon: "sparkle", grad: "from-fuchsia-500 to-purple-600", bg: "bg-fuchsia-50", text: "text-fuchsia-700", label: "UniAdvisor" },
  system:             { icon: "notifications", grad: "from-gray-400 to-slate-500",    bg: "bg-[var(--surface-2)]",   text: "text-[var(--ink-faint)]",  label: "System" },
};
const DEFAULT_CFG = { icon: "notifications", grad: "from-indigo-500 to-violet-600", bg: "bg-indigo-50", text: "text-indigo-700", label: "Notice" };

const Notifications = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const r = await api.get("/notifications");
      setNotifications(Array.isArray(r.data) ? r.data : []);
    } catch { setNotifications([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (notif) => {
    if (!notif.is_read) {
      await api.post(`/notifications/${notif.id}/read`).catch(() => {});
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    if (notif.reference_type === "ticket") navigate(`/support?ticket=${notif.reference_id}`);
  };

  const markAllRead = async () => {
    await api.post("/notifications/read-all").catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const shown = filter === "all" ? notifications
    : filter === "unread" ? notifications.filter(n => !n.is_read)
    : notifications.filter(n => n.type === filter);

  const FILTERS = [
    { key: "all",                label: "All",         count: notifications.length },
    { key: "unread",             label: "Unread",      count: unreadCount },
    { key: "ai_insight",         label: "UniAdvisor", count: null },
    { key: "support_reply",      label: "Support",  count: null },
    { key: "application_update", label: "Apps",     count: null },
    { key: "system",             label: "System",   count: null },
  ];

  return (
    <div className="min-h-screen">

      <PageHero
        photo="https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=1400&q=80"
        title={t("nav.notifications")}
        subtitle={unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "You're all caught up"}
      >
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="mt-4 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-[var(--ink)] text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.15)] transition">
            {t("notifications.markAllRead")}
          </button>
        )}
      </PageHero>

      <div className="max-w-3xl mx-auto px-6 py-6">

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border-2 transition-all"
              style={filter === f.key
                ? { background: "var(--accent)", color: "var(--on-accent)", borderColor: "var(--accent)" }
                : { background: "var(--surface)", color: "var(--ink-faint)", borderColor: "var(--border)" }}>
              {f.label}
              {f.count != null && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold"
                  style={filter === f.key ? { background: "rgba(255,255,255,0.25)", color: "var(--on-accent)" } : { background: "var(--surface-2)", color: "var(--ink-faint)" }}>{f.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[0,1,2,3].map(i => (
              <div key={i} className="bg-[var(--surface-2)] rounded-2xl border border-[rgba(255,255,255,0.07)] h-20 animate-pulse" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-24 bg-[var(--surface-2)] rounded-2xl border border-[rgba(255,255,255,0.07)]">
            <div className="mb-4 flex justify-center"><Icon d={ICONS.notifications} size={48} /></div>
            <p className="text-[var(--ink-dim)] font-bold text-lg mb-1">{t("notifications.nothing")}</p>
            <p className="text-[var(--ink-dim)] text-sm">{t("notifications.empty")}</p>
          </div>
        ) : (
          <div className="space-y-2 stagger">
            {shown.map(n => {
              const cfg = TYPE_CONFIG[n.type] || DEFAULT_CFG;
              return (
                <button key={n.id} onClick={() => markRead(n)}
                  className="w-full text-left flex items-start gap-4 p-4 rounded-2xl border-2 transition-all hover:shadow-md group"
                  style={n.is_read
                    ? { background: "var(--surface)", borderColor: "var(--border)" }
                    : { background: "var(--accent-subtle)", borderColor: "var(--accent)" }}>

                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cfg.grad} flex items-center justify-center text-white shrink-0 `}>
                    <Icon d={ICONS[cfg.icon]} size={19} />
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      )}
                    </div>
                    <p className={`text-sm font-semibold leading-snug ${n.is_read ? "text-[var(--ink-dim)]" : "text-[var(--ink)]"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-[var(--ink-dim)] mt-0.5 truncate">{n.message}</p>
                    <p className="text-[10px] text-[var(--border-strong)] mt-1">
                      {new Date(n.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  <span className="text-[var(--border-strong)] group-hover:text-indigo-400 transition text-sm shrink-0 mt-1">→</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

