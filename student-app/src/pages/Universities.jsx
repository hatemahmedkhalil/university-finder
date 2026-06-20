import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Universities = () => {
  const { user } = useAuth();
  const [universities, setUniversities] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [englishOnly, setEnglishOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [favourites, setFavourites] = useState(new Set());
  const perPage = 9;

  useEffect(() => {
    if (user) {
      api.get("/favourites").then((res) => setFavourites(new Set(res.data.map((u) => u.id))));
    }
  }, [user]);

  const toggleFavourite = async (id) => {
    if (!user) { toast.error("Please login to save favourites"); return; }
    if (favourites.has(id)) {
      await api.delete(`/favourites/${id}`);
      setFavourites((prev) => { const s = new Set(prev); s.delete(id); return s; });
      toast.success("Removed from favourites");
    } else {
      await api.post(`/favourites/${id}`);
      setFavourites((prev) => new Set([...prev, id]));
      toast.success("Added to favourites");
    }
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      skip: (page - 1) * perPage,
      limit: perPage,
    });
    if (search) params.set("search", search);
    if (country) params.set("country", country);
    if (englishOnly) params.set("english_only", true);

    api.get(`/universities?${params}`)
      .then((res) => {
        setUniversities(res.data.items);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  }, [search, country, englishOnly, page]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Universities</h1>
      <p className="text-gray-500 mb-8">{total} universities across Europe</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <input
          type="text"
          placeholder="Search by name or city..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <select
          value={country}
          onChange={(e) => { setCountry(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Countries</option>
          <option value="Germany">Germany</option>
          <option value="Poland">Poland</option>
          <option value="Austria">Austria</option>
          <option value="Netherlands">Netherlands</option>
        </select>
        <label className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 cursor-pointer hover:border-blue-400">
          <input
            type="checkbox"
            checked={englishOnly}
            onChange={(e) => { setEnglishOnly(e.target.checked); setPage(1); }}
          />
          <span className="text-sm text-gray-600">English Programs Only</span>
        </label>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20">Loading universities...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {universities.map((uni) => (
              <div key={uni.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{uni.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">📍 {uni.city}, {uni.country}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleFavourite(uni.id)} className="text-xl hover:scale-110 transition-transform" title={favourites.has(uni.id) ? "Remove from favourites" : "Add to favourites"}>
                      {favourites.has(uni.id) ? "❤️" : "🤍"}
                    </button>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${uni.is_public ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                      {uni.is_public ? "Public" : "Private"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {uni.ranking && (
                    <span className="bg-yellow-50 text-yellow-700 text-xs px-2 py-1 rounded-full">🏆 #{uni.ranking}</span>
                  )}
                  {uni.english_programs_available && (
                    <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">🇬🇧 English</span>
                  )}
                  <span className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-full">
                    💰 {uni.tuition_fee_eur === 0 ? "Free" : `€${uni.tuition_fee_eur?.toLocaleString()}`}
                  </span>
                </div>

                {uni.description && (
                  <p className="text-gray-500 text-sm mb-4 flex-1 line-clamp-2">{uni.description}</p>
                )}

                {uni.website && (
                  <a
                    href={uni.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 text-sm font-medium hover:underline mt-auto"
                  >
                    Visit Website →
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
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

export default Universities;
