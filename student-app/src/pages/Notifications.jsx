import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

const TYPE_CONFIG = {
  support_reply:      { icon: "💬", grad: "from-blue-500 to-cyan-500",    bg: "bg-blue-50",   text: "text-blue-700",  label: "Support Reply" },
  application_update: { icon: "📋", grad: "from-violet-500 to-purple-600", bg: "bg-violet-50", text: "text-violet-700",label: "Application" },
  scholarship_update: { icon: "🎓", grad: "from-emerald-500 to-teal-500", bg: "bg-emerald-50",text: "text-emerald-700",label: "Scholarship" },
  system:             { icon: "🔔", grad: "from-gray-400 to-slate-500",    bg: "bg-gray-50",   text: "text-gray-600",  label: "System" },
};
const DEFAULT_CFG = { icon: "🔔", grad: "from-indigo-500 to-violet-600", bg: "bg-indigo-50", text: "text-indigo-700", label: "Notice" };

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
    { key: "support_reply",      label: "💬 Support",  count: null },
    { key: "application_update", label: "📋 Apps",     count: null },
    { key: "system",             label: "🔔 System",   count: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-700 text-white">
        <div className="max-w-3xl mx-auto px-6 py-12 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-2">🔔 Inbox</p>
            <h1 className="text-4xl font-extrabold tracking-tight mb-1">{t("nav.notifications")}</h1>
            <p className="text-blue-200">
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "You're all caught up ✅"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="bg-white/15 border border-white/25 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white/25 transition">
              ✓ {t("notifications.markAllRead")}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6">

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                filter === f.key
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                  : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}>
              {f.label}
              {f.count != null && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  filter === f.key ? "bg-white/25" : "bg-gray-100 text-gray-500"
                }`}>{f.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[0,1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <div className="text-6xl mb-4">🔔</div>
            <p className="text-gray-700 font-bold text-lg mb-1">{t("notifications.nothing")}</p>
            <p className="text-gray-400 text-sm">{t("notifications.empty")}</p>
          </div>
        ) : (
          <div className="space-y-2 stagger">
            {shown.map(n => {
              const cfg = TYPE_CONFIG[n.type] || DEFAULT_CFG;
              return (
                <button key={n.id} onClick={() => markRead(n)}
                  className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border-2 transition-all hover:shadow-md group ${
                    n.is_read
                      ? "bg-white border-gray-100 hover:border-indigo-100"
                      : "bg-indigo-50/60 border-indigo-100 hover:border-indigo-300"
                  }`}>

                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cfg.grad} flex items-center justify-center text-xl shrink-0 shadow-sm`}>
                    {cfg.icon}
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
                    <p className={`text-sm font-semibold leading-snug ${n.is_read ? "text-gray-700" : "text-gray-900"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{n.message}</p>
                    <p className="text-[10px] text-gray-300 mt-1">
                      {new Date(n.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  <span className="text-gray-300 group-hover:text-indigo-400 transition text-sm shrink-0 mt-1">→</span>
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
