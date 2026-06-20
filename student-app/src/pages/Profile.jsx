import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const COUNTRIES = ["Germany", "Poland", "Austria", "Netherlands"];

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nationality: "",
    degree_level: "bachelor",
    gpa: "",
    budget_eur: "",
    english_level: "b2",
    preferred_countries: [],
    field_of_study: "",
  });

  useEffect(() => {
    api.get("/profiles/me")
      .then((res) => {
        const p = res.data;
        setProfile(p);
        setForm({
          ...p,
          preferred_countries: p.preferred_countries
            ? p.preferred_countries.split(",").map((c) => c.trim()).filter(Boolean)
            : [],
        });
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const toggleCountry = (country) => {
    setForm((prev) => ({
      ...prev,
      preferred_countries: prev.preferred_countries.includes(country)
        ? prev.preferred_countries.filter((c) => c !== country)
        : [...prev.preferred_countries, country],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      gpa: parseFloat(form.gpa),
      budget_eur: parseInt(form.budget_eur),
      preferred_countries: form.preferred_countries.join(","),
    };
    try {
      if (profile) {
        await api.patch("/profiles/me", payload);
      } else {
        await api.post("/profiles", payload);
      }
      toast.success("Profile saved!");
      navigate("/recommendations");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {profile ? "Edit Your Profile" : "Set Up Your Profile"}
      </h1>
      <p className="text-gray-500 mb-8">
        Fill in your details to get personalized university recommendations.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        {/* Nationality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
          <input
            type="text"
            required
            value={form.nationality}
            onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Egyptian"
          />
        </div>

        {/* Degree Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Degree Level</label>
          <select
            value={form.degree_level}
            onChange={(e) => setForm({ ...form, degree_level: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="bachelor">Bachelor</option>
            <option value="master">Master</option>
            <option value="phd">PhD</option>
          </select>
        </div>

        {/* GPA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GPA (0 – 4.0)</label>
          <input
            type="number"
            required
            min="0"
            max="4"
            step="0.1"
            value={form.gpa}
            onChange={(e) => setForm({ ...form, gpa: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 3.5"
          />
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Annual Budget (€)</label>
          <input
            type="number"
            required
            min="0"
            value={form.budget_eur}
            onChange={(e) => setForm({ ...form, budget_eur: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 5000"
          />
        </div>

        {/* English Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">English Level</label>
          <select
            value={form.english_level}
            onChange={(e) => setForm({ ...form, english_level: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {["a1","a2","b1","b2","c1","c2","native"].map((l) => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Field of Study */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
          <input
            type="text"
            value={form.field_of_study}
            onChange={(e) => setForm({ ...form, field_of_study: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Computer Science"
          />
        </div>

        {/* Preferred Countries */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Countries</label>
          <div className="flex flex-wrap gap-3">
            {COUNTRIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCountry(c)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                  form.preferred_countries.includes(c)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-lg"
        >
          {saving ? "Saving..." : "Save & Get Recommendations"}
        </button>
      </form>
    </div>
  );
};

export default Profile;
