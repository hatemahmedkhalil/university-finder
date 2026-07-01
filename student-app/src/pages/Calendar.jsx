import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const TYPE_STYLES = {
  accepted:  { bg: "bg-green-900/40",  border: "border-green-500/40",  text: "text-green-300",  dot: "bg-green-400",  icon: "🎉" },
  rejected:  { bg: "bg-red-900/40",    border: "border-red-500/40",    text: "text-red-300",    dot: "bg-red-400",    icon: "❌" },
  interview: { bg: "bg-blue-900/40",   border: "border-blue-500/40",   text: "text-blue-300",   dot: "bg-blue-400",   icon: "📅" },
  deadline:  { bg: "bg-yellow-900/40", border: "border-yellow-500/40", text: "text-yellow-300", dot: "bg-yellow-400", icon: "📎" },
  info:      { bg: "bg-slate-800/40",  border: "border-slate-600/40",  text: "text-slate-300",  dot: "bg-slate-400",  icon: "✉️" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function styleFor(type) {
  return TYPE_STYLES[type] || TYPE_STYLES.info;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

// ── Add Event Modal ─────────────────────────────────────────────────────────────
function AddEventModal({ defaultDate, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: defaultDate ? defaultDate.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    event_type: "info",
    university_name: "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title || !form.event_date) return;
    setSaving(true);
    try {
      await api.post("/calendar", {
        ...form,
        event_date: new Date(form.event_date).toISOString(),
        university_name: form.university_name || null,
        description: form.description || null,
      });
      toast.success("Event added!");
      onSaved();
    } catch {
      toast.error("Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-bold text-lg mb-5">Add Event</h3>

        <div className="space-y-3">
          <div>
            <label className="text-slate-400 text-xs font-semibold block mb-1">Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="e.g. Submit documents to TU Munich" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-semibold block mb-1">Date & Time *</label>
            <input type="datetime-local" value={form.event_date} onChange={e => setForm(f => ({...f, event_date: e.target.value}))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-semibold block mb-1">Type</label>
            <select value={form.event_type} onChange={e => setForm(f => ({...f, event_type: e.target.value}))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
              <option value="info">📧 General / Info</option>
              <option value="interview">📅 Interview</option>
              <option value="deadline">📎 Deadline</option>
              <option value="accepted">🎉 Acceptance</option>
              <option value="rejected">❌ Rejection</option>
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-semibold block mb-1">University (optional)</label>
            <input value={form.university_name} onChange={e => setForm(f => ({...f, university_name: e.target.value}))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="e.g. TU Munich" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-semibold block mb-1">Notes (optional)</label>
            <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
              rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-semibold transition">Cancel</button>
          <button onClick={save} disabled={saving || !form.title}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition disabled:opacity-40">
            {saving ? "Saving…" : "Save Event"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Event Card ──────────────────────────────────────────────────────────────────
function EventCard({ event, onToggleDone, onDelete }) {
  const s = styleFor(event.event_type);
  const date = new Date(event.event_date);

  return (
    <div className={`${s.bg} border ${s.border} rounded-2xl px-4 py-3 flex items-start gap-3 ${event.is_done ? "opacity-50" : ""}`}>
      <span className="text-xl shrink-0 mt-0.5">{s.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${event.is_done ? "line-through text-slate-500" : "text-white"}`}>{event.title}</p>
        {event.university_name && (
          <p className="text-slate-400 text-xs mt-0.5">{event.university_name}</p>
        )}
        <p className="text-slate-500 text-xs mt-0.5">
          {date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          {" · "}
          {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </p>
        {event.description && (
          <p className="text-slate-500 text-xs mt-1 line-clamp-2">{event.description}</p>
        )}
        {event.source === "email" && (
          <span className="inline-block mt-1.5 text-xs bg-indigo-900/50 text-indigo-300 border border-indigo-700/40 px-2 py-0.5 rounded-full">📬 Auto from email</span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        <button onClick={() => onToggleDone(event)} title={event.is_done ? "Mark pending" : "Mark done"}
          className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs transition ${event.is_done ? "border-green-600 bg-green-900/30 text-green-400" : "border-slate-600 hover:border-green-500 text-slate-500 hover:text-green-400"}`}>
          ✓
        </button>
        <button onClick={() => onDelete(event)} title="Delete"
          className="w-7 h-7 rounded-full border border-slate-700 flex items-center justify-center text-xs text-slate-600 hover:text-red-400 hover:border-red-700 transition">
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Main Calendar Page ──────────────────────────────────────────────────────────
export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addDefaultDate, setAddDefaultDate] = useState(null);

  const fetchEvents = async () => {
    try {
      const r = await api.get("/calendar");
      setEvents(r.data || []);
    } catch {
      toast.error("Could not load calendar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const toggleDone = async (event) => {
    try {
      await api.patch(`/calendar/${event.id}`, { is_done: !event.is_done });
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, is_done: !e.is_done } : e));
    } catch {
      toast.error("Failed to update.");
    }
  };

  const deleteEvent = async (event) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await api.delete(`/calendar/${event.id}`);
      setEvents(prev => prev.filter(e => e.id !== event.id));
      toast.success("Deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  // ── Build month grid ──────────────────────────────────────────────────────────
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const today = new Date();

  const eventsOnDay = (day) => {
    if (!day) return [];
    return events.filter(e => sameDay(new Date(e.event_date), day));
  };

  const selectedDayEvents = selectedDay ? eventsOnDay(selectedDay) : [];

  // Upcoming events (next 30 days, not done)
  const soon = new Date(); soon.setDate(soon.getDate() + 30);
  const upcoming = events
    .filter(e => !e.is_done && new Date(e.event_date) >= today && new Date(e.event_date) <= soon)
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 5);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const openAddForDay = (day) => {
    setAddDefaultDate(day);
    setShowAdd(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      {showAdd && (
        <AddEventModal
          defaultDate={addDefaultDate}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); fetchEvents(); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-900/30 border border-indigo-700/30 rounded-full px-4 py-1.5 text-indigo-300 text-xs font-semibold mb-2">
            📅 Calendar
          </div>
          <h1 className="text-3xl font-extrabold text-white">My Calendar</h1>
          <p className="text-slate-400 text-sm mt-1">University updates are added automatically when emails arrive.</p>
        </div>
        <button onClick={() => { setAddDefaultDate(new Date()); setShowAdd(true); }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition flex items-center gap-2">
          <span>+</span> Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Month grid ── */}
        <div className="lg:col-span-2">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition">‹</button>
            <h2 className="text-white font-bold text-lg">{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition">›</button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-slate-500 text-xs font-semibold py-1">{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const dayEvents = eventsOnDay(day);
              const isToday = sameDay(day, today);
              const isSelected = selectedDay && sameDay(day, selectedDay);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`relative rounded-xl p-1.5 min-h-[52px] flex flex-col items-center transition group
                    ${isSelected ? "bg-indigo-600/30 border border-indigo-500/60" : "hover:bg-slate-800/60 border border-transparent"}
                    ${isToday ? "ring-1 ring-indigo-400" : ""}
                  `}
                >
                  <span className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? "bg-indigo-600 text-white" : "text-slate-400 group-hover:text-white"}`}>
                    {day.getDate()}
                  </span>
                  {/* Event dots */}
                  <div className="flex flex-wrap justify-center gap-0.5">
                    {dayEvents.slice(0, 3).map(e => (
                      <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${styleFor(e.event_type).dot} ${e.is_done ? "opacity-30" : ""}`} />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-slate-500 text-[9px]">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected day events */}
          {selectedDay && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-sm">
                  {selectedDay.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                </h3>
                <button onClick={() => openAddForDay(selectedDay)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition font-semibold">+ Add</button>
              </div>
              {selectedDayEvents.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No events — <button onClick={() => openAddForDay(selectedDay)} className="text-indigo-400 hover:underline">add one</button></p>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map(e => (
                    <EventCard key={e.id} event={e} onToggleDone={toggleDone} onDelete={deleteEvent} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Upcoming + Legend ── */}
        <div className="space-y-5">
          {/* Upcoming */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4">
            <h3 className="text-white font-bold text-sm mb-3">📌 Coming up (30 days)</h3>
            {upcoming.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(e => {
                  const s = styleFor(e.event_type);
                  const d = new Date(e.event_date);
                  const diffDays = Math.round((d - today) / 86400000);
                  return (
                    <div key={e.id} className={`${s.bg} border ${s.border} rounded-xl px-3 py-2.5 flex items-start gap-2.5`}>
                      <span className="text-base shrink-0">{s.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{e.title}</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {diffDays === 0 ? "Today" : diffDays === 1 ? "Tomorrow" : `In ${diffDays} days`}
                          {" · "}{d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4">
            <h3 className="text-white font-bold text-sm mb-3">Legend</h3>
            <div className="space-y-2">
              {Object.entries(TYPE_STYLES).map(([type, s]) => (
                <div key={type} className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />
                  <span className="text-slate-400 text-xs capitalize">{s.icon} {type === "info" ? "General email" : type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4">
            <h3 className="text-white font-bold text-sm mb-3">Overview</h3>
            <div className="space-y-2">
              {[
                { label: "Total events", value: events.length },
                { label: "From emails", value: events.filter(e => e.source === "email").length },
                { label: "Completed", value: events.filter(e => e.is_done).length },
                { label: "Upcoming", value: upcoming.length },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">{row.label}</span>
                  <span className="text-white text-xs font-bold">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
