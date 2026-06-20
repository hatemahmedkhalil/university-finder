import { Link } from "react-router-dom";

const Landing = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    {/* Hero */}
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-16 text-center">
      <div className="inline-block bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
        🌍 Find Your University in Europe
      </div>
      <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
        Discover the Perfect University<br />
        <span className="text-blue-600">in Germany & Poland</span>
      </h1>
      <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
        Get personalized university recommendations based on your GPA, budget,
        degree level, and preferences. Find your best match in seconds.
      </p>
      <div className="flex gap-4 justify-center">
        <Link
          to="/register"
          className="bg-blue-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition shadow-lg"
        >
          Get Started — It's Free
        </Link>
        <Link
          to="/universities"
          className="bg-white text-blue-600 px-8 py-3 rounded-xl text-lg font-semibold hover:bg-blue-50 transition shadow border border-blue-200"
        >
          Browse Universities
        </Link>
      </div>
    </div>

    {/* Features */}
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: "🎯", title: "Smart Matching", desc: "Get universities matched to your GPA, budget, English level, and preferred countries." },
          { icon: "💰", title: "Find Scholarships", desc: "Discover scholarships from DAAD, Erasmus+, government grants, and universities." },
          { icon: "📊", title: "Compatibility Score", desc: "See a detailed score breakdown showing exactly why each university fits you." },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="text-4xl mb-4">{f.icon}</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{f.title}</h3>
            <p className="text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Countries */}
    <div className="max-w-6xl mx-auto px-4 py-12 text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-10">Countries We Cover</h2>
      <div className="flex flex-wrap justify-center gap-6">
        {[
          { flag: "🇩🇪", name: "Germany", unis: "5 Universities" },
          { flag: "🇵🇱", name: "Poland", unis: "4 Universities" },
          { flag: "🇦🇹", name: "Austria", unis: "2 Universities" },
          { flag: "🇳🇱", name: "Netherlands", unis: "3 Universities" },
        ].map((c) => (
          <div key={c.name} className="bg-white rounded-2xl px-8 py-6 shadow-sm border border-gray-100 text-center min-w-36">
            <div className="text-4xl mb-2">{c.flag}</div>
            <div className="font-bold text-gray-800">{c.name}</div>
            <div className="text-sm text-gray-400">{c.unis}</div>
          </div>
        ))}
      </div>
    </div>

    {/* CTA */}
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <div className="bg-blue-600 rounded-3xl p-12 text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to Find Your University?</h2>
        <p className="text-blue-100 mb-8 text-lg">Create your profile and get matched in less than 2 minutes.</p>
        <Link
          to="/register"
          className="bg-white text-blue-600 px-8 py-3 rounded-xl text-lg font-semibold hover:bg-blue-50 transition inline-block"
        >
          Create Free Account
        </Link>
      </div>
    </div>
  </div>
);

export default Landing;
