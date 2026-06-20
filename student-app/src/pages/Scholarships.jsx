import { useState, useEffect } from "react";
import api from "../api/axios";

const TYPE_COLORS = {
  government: "bg-blue-50 text-blue-700",
  university: "bg-purple-50 text-purple-700",
  private: "bg-orange-50 text-orange-700",
  erasmus: "bg-green-50 text-green-700",
};

const Scholarships = () => {
  const [scholarships, setScholarships] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 9;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ skip: (page - 1) * perPage, limit: perPage });
    if (type) params.set("scholarship_type", type);

    api.get(`/scholarships?${params}`)
      .then((res) => {
        setScholarships(res.data.items);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  }, [type, page]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Scholarships</h1>
      <p className="text-gray-500 mb-8">{total} scholarships available</p>

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-8">
        {["", "government", "university", "private", "erasmus"].map((t) => (
          <button
            key={t}
            onClick={() => { setType(t); setPage(1); }}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
              type === t
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
            }`}
          >
            {t === "" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20">Loading scholarships...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scholarships.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight pr-2">{s.name}</h3>
                  {s.scholarship_type && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${TYPE_COLORS[s.scholarship_type] || "bg-gray-50 text-gray-600"}`}>
                      {s.scholarship_type}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {s.country && (
                    <span className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-full">📍 {s.country}</span>
                  )}
                  {s.amount_eur && (
                    <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                      💰 €{s.amount_eur.toLocaleString()}
                    </span>
                  )}
                  {s.deadline && (
                    <span className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded-full">
                      📅 {new Date(s.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {s.description && (
                  <p className="text-gray-500 text-sm mb-4 flex-1 line-clamp-3">{s.description}</p>
                )}

                {s.link && (
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 text-sm font-medium hover:underline mt-auto"
                  >
                    Apply Now →
                  </a>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                    p === page ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-blue-400"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Scholarships;
