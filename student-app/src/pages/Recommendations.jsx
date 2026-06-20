import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const ScoreBar = ({ label, value, max = 30, color }) => (
  <div className="mb-2">
    <div className="flex justify-between text-xs text-gray-500 mb-1">
      <span>{label}</span>
      <span>{value}/{max}</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full">
      <div
        className={`h-2 rounded-full ${color}`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  </div>
);

const ScoreCircle = ({ score }) => {
  const color = score >= 75 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-500";
  return (
    <div className={`text-3xl font-bold ${color}`}>{score}</div>
  );
};

const Recommendations = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);

  useEffect(() => {
    api.post("/recommendations?top_n=15", {})
      .then((res) => setResults(res.data.results))
      .catch((err) => {
        if (err.response?.status === 404) setHasProfile(false);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      Finding best universities for you...
    </div>
  );

  if (!hasProfile) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">📋</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-3">Set Up Your Profile First</h2>
      <p className="text-gray-500 mb-6">We need your details to find the best universities for you.</p>
      <Link to="/profile" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
        Create My Profile
      </Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Recommendations</h1>
          <p className="text-gray-500 mt-1">{results.length} universities matched your profile</p>
        </div>
        <Link to="/profile" className="text-blue-600 hover:underline text-sm font-medium">
          Edit Profile →
        </Link>
      </div>

      <div className="space-y-4">
        {results.map((match, index) => {
          const uni = match.university;
          const bd = match.breakdown;
          return (
            <div key={uni.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-start gap-6">
                {/* Rank */}
                <div className="text-center min-w-12">
                  <div className="text-sm text-gray-400 font-medium">#{index + 1}</div>
                  <ScoreCircle score={match.score} />
                  <div className="text-xs text-gray-400 mt-1">score</div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{uni.name}</h3>
                      <p className="text-gray-500 text-sm mt-0.5">
                        📍 {uni.city}, {uni.country}
                        {uni.ranking && <span className="ml-3">🏆 Ranked #{uni.ranking}</span>}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {uni.tuition_fee_eur === 0 && (
                        <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Free Tuition</span>
                      )}
                      {uni.english_programs_available && (
                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">English Programs</span>
                      )}
                      {uni.is_public && (
                        <span className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">Public</span>
                      )}
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <div className="mt-4 grid grid-cols-2 gap-x-6">
                    <ScoreBar label="Country Match" value={bd.country_match} max={30} color="bg-blue-500" />
                    <ScoreBar label="Budget Fit" value={bd.budget_fit} max={30} color="bg-green-500" />
                    <ScoreBar label="English Fit" value={bd.english_fit} max={20} color="bg-purple-500" />
                    <ScoreBar label="GPA Fit" value={bd.gpa_fit} max={20} color="bg-orange-500" />
                  </div>

                  {/* Reasons */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {match.reasons.slice(0, 2).map((r, i) => (
                      <span key={i} className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                        {r}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      💰 Tuition: {uni.tuition_fee_eur === 0 ? "Free" : `€${uni.tuition_fee_eur?.toLocaleString()}/year`}
                    </span>
                    {uni.website && (
                      <a
                        href={uni.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline font-medium"
                      >
                        Visit Website →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Recommendations;
