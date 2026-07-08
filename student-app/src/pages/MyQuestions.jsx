import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";
import PageHero from "../components/PageHero";

const Avatar = ({ name, photoUrl }) => {
  const [err, setErr] = useState(false);
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  if (photoUrl && !err) {
    return <img src={photoUrl} alt={name} onError={() => setErr(true)} className="w-9 h-9 rounded-xl object-cover" />;
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
      {initials}
    </div>
  );
};

const MessageCard = ({ msg }) => {
  const { t } = useTranslation();
  const inst = msg.instructor;
  return (
    <div className="bg-[oklch(0.17_0.02_285)] rounded-2xl border border-[oklch(1_0_0/0.07)] p-5 flex flex-col gap-4">
      {/* Instructor info */}
      <div className="flex items-center gap-3">
        <Avatar name={inst.name} photoUrl={inst.photo_url} />
        <div>
          <p className="font-semibold text-white text-sm">{inst.title ? `${inst.title} ` : ""}{inst.name}</p>
          <p className="text-xs text-[oklch(0.45_0.02_285)]">{inst.organization ?? "Instructor"} · {inst.language}</p>
        </div>
        {!msg.reply && (
          <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-semibold">
            Awaiting reply
          </span>
        )}
        {msg.reply && (
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
            Answered
          </span>
        )}
      </div>

      {/* Question bubble */}
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white text-sm rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%]">
          <p>{msg.question}</p>
          <p className="text-[10px] text-blue-200 mt-1 text-right">{new Date(msg.created_at).toLocaleString()}</p>
        </div>
      </div>

      {/* Reply bubble */}
      {msg.reply ? (
        <div className="flex gap-2">
          <Avatar name={inst.name} photoUrl={inst.photo_url} />
          <div className="bg-gray-100 text-white text-sm rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
            <p>{msg.reply}</p>
            <p className="text-[10px] text-[oklch(0.45_0.02_285)] mt-1">{new Date(msg.replied_at).toLocaleString()}</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[oklch(0.45_0.02_285)] italic pl-2">{t("myQuestions.noReply")}</p>
      )}
    </div>
  );
};

export default function MyQuestions() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // all | answered | pending

  useEffect(() => {
    api.get("/instructor-messages/my")
      .then(r => setMessages(r.data))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = messages.filter(m => {
    if (tab === "answered") return !!m.reply;
    if (tab === "pending")  return !m.reply;
    return true;
  });

  const answeredCount = messages.filter(m => m.reply).length;
  const pendingCount  = messages.filter(m => !m.reply).length;

  return (
    <div className="min-h-screen">
      <PageHero
        photo="https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=1400&q=80"
        title={t("myQuestions.title")}
        subtitle={t("myQuestions.allConversations")}
      >
        <div className="flex gap-3 flex-wrap mt-4">
          <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-medium text-white">
            Total <span className="font-bold ml-1">{messages.length}</span>
          </div>
          <div className="bg-green-500/20 rounded-xl px-4 py-2 text-sm font-medium text-green-200">
            Answered <span className="font-bold ml-1">{answeredCount}</span>
          </div>
          <div className="bg-yellow-500/20 rounded-xl px-4 py-2 text-sm font-medium text-yellow-200">
            Pending <span className="font-bold ml-1">{pendingCount}</span>
          </div>
        </div>
      </PageHero>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "all",      label: `All (${messages.length})`    },
            { key: "answered", label: `Answered (${answeredCount})`  },
            { key: "pending",  label: `Pending (${pendingCount})`    },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                tab === t.key
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-[oklch(0.65_0.02_285)] border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-[oklch(0.45_0.02_285)]">{t("common.loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-[oklch(0.55_0.02_285)] font-semibold text-lg">
              {messages.length === 0 ? t("myQuestions.noQuestions") : t("common.noResults")}
            </p>
            {messages.length === 0 && (
              <Link to="/instructors" className="mt-4 inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700">
                {t("nav.instructors")}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(msg => <MessageCard key={msg.id} msg={msg} />)}
          </div>
        )}
      </div>
    </div>
  );
}

