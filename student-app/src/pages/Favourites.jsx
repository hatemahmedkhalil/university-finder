import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const Favourites = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/favourites")
      .then((res) => setUniversities(res.data))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id) => {
    await api.delete(`/favourites/${id}`);
    setUniversities((prev) => prev.filter((u) => u.id !== id));
    toast.success("Removed from favourites");
  };

  if (loading) return <div className="text-center text-gray-400 py-20">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favourites</h1>
      <p className="text-gray-500 mb-8">{universities.length} saved universities</p>

      {universities.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🤍</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No favourites yet</h2>
          <p className="text-gray-500 mb-6">Browse universities and heart the ones you like.</p>
          <Link to="/universities" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
            Browse Universities
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {universities.map((uni) => (
            <div key={uni.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between gap-4 hover:shadow-md transition">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">{uni.name}</h3>
                <p className="text-gray-500 text-sm mt-1">📍 {uni.city}, {uni.country}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {uni.ranking && <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">🏆 #{uni.ranking}</span>}
                  {uni.english_programs_available && <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">🇬🇧 English</span>}
                  <span className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-full">
                    💰 {uni.tuition_fee_eur === 0 ? "Free" : `€${uni.tuition_fee_eur?.toLocaleString()}`}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                {uni.website && (
                  <a href={uni.website} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline">Visit →</a>
                )}
                <button
                  onClick={() => remove(uni.id)}
                  className="text-red-400 hover:text-red-600 transition text-xl"
                  title="Remove from favourites"
                >
                  ❤️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favourites;
