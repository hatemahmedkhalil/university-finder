import { useState, useEffect } from "react";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

const TYPE_STYLE = {
  info:    { bg: "bg-blue-50",   border: "border-blue-200",   icon: "📢", text: "text-blue-800",   badge: "bg-blue-100 text-blue-700"   },
  success: { bg: "bg-green-50",  border: "border-green-200",  icon: "✅", text: "text-green-800",  badge: "bg-green-100 text-green-700"  },
  warning: { bg: "bg-yellow-50", border: "border-yellow-200", icon: "⚠️", text: "text-yellow-800", badge: "bg-yellow-100 text-yellow-700" },
};

const fmt = (iso) => new Date(iso).toLocaleDateString("en-GB", {
  day: "numeric", month: "long", year: "numeric",
});

const Announcements = () => {
  const { t } = useTranslation();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/announcements")
      .then(r => {
        setItems(r.data);
        // auto mark all as read when the page opens
        api.post("/announcements/read-all").catch(() => {});
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const markRead = (id) => {
    setItems(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
    api.post(`/announcements/${id}/read`).catch(() => {});
  };

  const unreadCount = items.filter(a => !a.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-700 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-6 left-1/4 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-violet-200 text-xs font-bold px-4 py-1.5 rounded-full mb-5">
            🔔 What's new
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-violet-200 to-fuchsia-200 bg-clip-text text-transparent">{t("announcements.title")}</span>
          </h1>
          <p className="text-indigo-200">{t("announcements.subtitle")}</p>
          {unreadCount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/15 border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              {unreadCount} unread
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-16 text-gray-400">{t("announcements.loading")}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-gray-500 font-semibold text-lg">{t("announcements.empty")}</p>
            <p className="text-gray-400 text-sm mt-1">{t("announcements.emptySub")}</p>
          </div>
        ) : (
          <div className="space-y-4 stagger">
            {items.map((ann) => {
              const s = TYPE_STYLE[ann.type] ?? TYPE_STYLE.info;
              return (
                <div
                  key={ann.id}
                  onClick={() => !ann.is_read && markRead(ann.id)}
                  className={`
                    relative rounded-2xl p-6 border transition cursor-pointer card-lift
                    ${ann.is_read
                      ? "bg-white border-gray-100 opacity-70"
                      : `${s.bg} ${s.border} shadow-sm hover:shadow-md`
                    }
                  `}
                >
                  {/* Unread dot */}
                  {!ann.is_read && (
                    <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 rounded-full" />
                  )}

                  <div className="flex items-start gap-4">
                    <div className="text-2xl mt-0.5 shrink-0">{s.icon}</div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className={`font-bold text-base ${ann.is_read ? "text-gray-600" : s.text}`}>
                          {ann.title}
                        </h3>
                        {!ann.is_read && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                            Unread
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${s.badge}`}>
                          {ann.type}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed ${ann.is_read ? "text-gray-400" : "text-gray-700"}`}>
                        {ann.body}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-gray-400 text-xs">📅 {fmt(ann.created_at)}</p>
                        {ann.is_read
                          ? <span className="text-xs text-gray-300 flex items-center gap-1">✓ {t("announcements.seen")}</span>
                          : <span className="text-xs text-indigo-500 font-medium">{t("announcements.markRead")}</span>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
