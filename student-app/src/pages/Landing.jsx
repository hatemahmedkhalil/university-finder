import { useState } from "react";
import { Link } from "react-router-dom";

/* ── Navbar ── */
const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
    <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🎓</span>
        <span className="text-xl font-extrabold text-gray-900">UniFind</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
        <a href="#problem" className="hover:text-gray-900 transition">The Problem</a>
        <a href="#solution" className="hover:text-gray-900 transition">How It Works</a>
        <a href="#features" className="hover:text-gray-900 transition">Features</a>
        <a href="#faq" className="hover:text-gray-900 transition">FAQ</a>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition px-4 py-2">
          Sign in
        </Link>
        <Link to="/register" className="text-sm font-bold bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-sm">
          Get Started Free
        </Link>
      </div>
    </div>
  </nav>
);

/* ── Hero ── */
const Hero = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white min-h-screen flex items-center">
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
    </div>

    <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
      <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-indigo-300 text-sm font-semibold px-5 py-2 rounded-full mb-8">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        Now available — Free for students
      </div>

      <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6">
        Your dream university<br />
        <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          is closer than you think
        </span>
      </h1>

      <p className="text-xl md:text-2xl text-slate-300 mb-4 max-w-3xl mx-auto leading-relaxed">
        UniFind helps Arabic-speaking students discover, compare, and apply to European universities —
        with AI guidance every step of the way.
      </p>
      <p className="text-slate-400 text-base mb-12 max-w-xl mx-auto">
        No agents. No confusing websites. No wasted time.
      </p>

      <div className="flex flex-wrap gap-4 justify-center mb-20">
        <Link to="/register"
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-10 py-4 rounded-2xl text-base font-bold shadow-2xl shadow-indigo-900/60 hover:from-indigo-400 hover:to-violet-500 transition">
          Start for Free →
        </Link>
        <a href="#problem"
          className="flex items-center gap-2 bg-white/8 border border-white/15 text-white px-10 py-4 rounded-2xl text-base font-bold hover:bg-white/15 transition backdrop-blur">
          See how it works ↓
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
        {[
          { value: "58+", label: "Universities" },
          { value: "10+", label: "Scholarships" },
          { value: "3", label: "Languages taught" },
          { value: "100%", label: "Free to use" },
        ].map(({ value, label }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-2xl py-5 px-4 backdrop-blur">
            <p className="text-3xl font-extrabold text-white">{value}</p>
            <p className="text-indigo-300 text-sm mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ── Problem ── */
const Problem = () => (
  <section id="problem" className="bg-gray-950 text-white py-28">
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className="text-red-400 text-sm font-bold uppercase tracking-widest">The Problem</span>
        <h2 className="text-4xl md:text-5xl font-extrabold mt-3 max-w-3xl mx-auto leading-tight">
          Studying in Europe shouldn't feel impossible
        </h2>
        <p className="text-gray-400 text-lg mt-5 max-w-2xl mx-auto">
          Every year, thousands of Arabic-speaking students give up on their dream of studying in Europe — not because they're not qualified, but because the process is overwhelming.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: "😵",
            title: "Too many options, no guidance",
            desc: "Hundreds of universities across Germany, Poland, Austria, France… where do you even start? Most students spend months just researching.",
          },
          {
            icon: "💸",
            title: "Expensive agents & middlemen",
            desc: "Education agents charge thousands of dollars just to fill out forms that students could do themselves — if they only knew how.",
          },
          {
            icon: "📭",
            title: "Emails go unanswered",
            desc: "You apply, then wait. Days turn into weeks. You don't know if you were accepted, rejected, or if they need more documents.",
          },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <div className="text-4xl mb-5">{icon}</div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ── Solution ── */
const Solution = () => (
  <section id="solution" className="bg-white py-28">
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className="text-indigo-600 text-sm font-bold uppercase tracking-widest">The Solution</span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-3">
          UniFind does the hard work for you
        </h2>
        <p className="text-gray-500 text-lg mt-5 max-w-2xl mx-auto">
          From finding the right university to tracking your application status — all in one place, in Arabic and English.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {[
          { step: "01", icon: "👤", title: "Build your profile", desc: "Tell us your GPA, budget, field of study, and preferred countries. Takes 3 minutes." },
          { step: "02", icon: "🤖", title: "Get AI recommendations", desc: "Our AI analyzes 58+ universities and ranks the best matches for YOU with a compatibility score." },
          { step: "03", icon: "📋", title: "Track everything", desc: "Apply, track deadlines, get notified when universities reply — all from one dashboard." },
        ].map(({ step, icon, title, desc }, i) => (
          <div key={step} className="relative text-center group">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-3xl mx-auto mb-5 shadow-xl shadow-indigo-200 group-hover:scale-110 transition-transform">
              {icon}
            </div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{step}</span>
            <h3 className="text-xl font-bold text-gray-900 mt-2 mb-3">{title}</h3>
            <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">{desc}</p>
            {i < 2 && (
              <div className="hidden md:block absolute top-10 left-[calc(100%-1rem)] text-gray-200 text-3xl">→</div>
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ── Features ── */
const Features = () => (
  <section id="features" className="bg-gray-50 py-28">
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className="text-indigo-600 text-sm font-bold uppercase tracking-widest">Everything you need</span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-3">
          One platform. Full journey.
        </h2>
        <p className="text-gray-500 text-lg mt-5 max-w-2xl mx-auto">
          UniFind covers every step from discovery to enrollment — so you never have to leave to figure things out.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: "🎯", grad: "from-indigo-500 to-violet-600", title: "AI University Matching", desc: "Get a personalized compatibility score for every university based on your profile, GPA, budget, and language." },
          { icon: "💰", grad: "from-emerald-500 to-teal-600", title: "Scholarship Finder", desc: "Browse scholarships available to Arab students studying in Europe — filtered by country, amount, and eligibility." },
          { icon: "📊", grad: "from-amber-500 to-orange-500", title: "Application Pipeline", desc: "Track every application like a pro. Know exactly where you stand with each university at all times." },
          { icon: "📬", grad: "from-rose-500 to-pink-600", title: "Email Tracking", desc: "Connect your email and UniFind automatically detects university replies — no more checking your inbox every hour." },
          { icon: "📅", grad: "from-sky-500 to-cyan-600", title: "Smart Calendar", desc: "Deadlines, interviews, and acceptance dates automatically added to your calendar from university emails." },
          { icon: "👨‍🏫", grad: "from-violet-500 to-purple-600", title: "Language Instructors", desc: "Learn German, English, or Polish from expert instructors. Ask questions and get answers directly in the app." },
          { icon: "🤖", grad: "from-fuchsia-500 to-pink-600", title: "AI Chat Assistant", desc: "Ask anything about studying in Europe — visa, documents, deadlines, language requirements. Available 24/7." },
          { icon: "📚", grad: "from-lime-500 to-green-600", title: "IELTS Simulator", desc: "Practice for IELTS with full mock tests — reading, listening, writing, speaking — built right into the platform." },
          { icon: "🔔", grad: "from-orange-500 to-red-500", title: "Real-time Notifications", desc: "Get notified the moment something changes — a university replies, a deadline approaches, or a new scholarship opens." },
        ].map(({ icon, grad, title, desc }) => (
          <div key={title} className="group bg-white rounded-3xl border border-gray-100 shadow-sm p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-xl mb-5 shadow-md group-hover:scale-110 transition-transform`}>
              {icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ── Countries ── */
const Countries = () => (
  <section className="bg-white py-28">
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className="text-indigo-600 text-sm font-bold uppercase tracking-widest">Where you can study</span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-3">
          Top European destinations
        </h2>
        <p className="text-gray-500 text-lg mt-5 max-w-xl mx-auto">
          We cover universities across Europe — many with free or low-cost tuition.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { flag: "🇩🇪", name: "Germany", detail: "Free tuition at public universities", color: "from-yellow-400 to-red-500" },
          { flag: "🇵🇱", name: "Poland",  detail: "Affordable programs in English & Polish", color: "from-red-500 to-rose-600" },
        ].map(({ flag, name, detail, color }) => (
          <div key={name}
            className="group bg-gray-50 rounded-2xl border border-gray-100 p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden relative cursor-default">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`} />
            <div className="text-5xl mb-3">{flag}</div>
            <p className="font-bold text-gray-900 text-base">{name}</p>
            <p className="text-gray-400 text-xs mt-1 leading-snug">{detail}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ── Who is it for ── */
const WhoIsItFor = () => (
  <section className="bg-gradient-to-br from-indigo-900 via-violet-900 to-purple-950 text-white py-28">
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className="text-indigo-300 text-sm font-bold uppercase tracking-widest">Who is UniFind for?</span>
        <h2 className="text-4xl md:text-5xl font-extrabold mt-3">
          Built for students like you
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: "🎓", title: "Fresh graduates", desc: "Just finished your bachelor's and want to pursue a master's in Europe? We find you the best fit based on your GPA and field." },
          { icon: "💼", title: "Working professionals", desc: "Want to study while managing a budget? We filter by tuition cost, scholarships, and part-time study options." },
          { icon: "🌍", title: "Language learners", desc: "Not ready for English-only programs? Our instructors teach German and Polish so you can access free-tuition universities." },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-white/8 border border-white/15 rounded-3xl p-8 backdrop-blur">
            <div className="text-4xl mb-5">{icon}</div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-indigo-200 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ── FAQ ── */
const faqs = [
  { q: "Is UniFind really free?", a: "Yes. The core features — AI matching, university search, scholarship browser, and application tracking — are completely free. Premium plans add advanced features for students who want more." },
  { q: "Do I need to speak English to use UniFind?", a: "No. UniFind is fully available in Arabic. Our instructors also teach German and Polish so you can apply to free-tuition universities without needing English." },
  { q: "How does the AI matching work?", a: "You fill in your profile: GPA, budget, field of study, preferred countries, and language level. Our AI compares your profile against every university in our database and gives each one a compatibility score out of 100." },
  { q: "What countries do you cover?", a: "Currently Germany, Poland, Austria, Netherlands, France, Sweden, Italy, and Spain. We're adding more universities regularly." },
  { q: "How does email tracking work?", a: "You set up Gmail or Outlook to forward university emails to a special UniFind address. We automatically read the forwarded emails, detect if it's an acceptance, rejection, or interview invitation, and update your pipeline — without you doing anything." },
  { q: "Is my data safe?", a: "Yes. We only read forwarded emails — we never access your inbox. All consent is recorded and you can delete your data at any time. We comply with GDPR." },
];

const FAQ = () => {
  const [open, setOpen] = useState(null);
  return (
    <section id="faq" className="bg-gray-50 py-28">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-indigo-600 text-sm font-bold uppercase tracking-widest">FAQ</span>
          <h2 className="text-4xl font-extrabold text-gray-900 mt-3">Common questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
              >
                <span className="font-semibold text-gray-900 text-base">{q}</span>
                <span className={`text-indigo-500 text-xl shrink-0 transition-transform ${open === i ? "rotate-45" : ""}`}>+</span>
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-gray-500 leading-relaxed border-t border-gray-50 pt-4">
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ── CTA ── */
const CTA = () => (
  <section className="bg-white py-28">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-3xl px-8 py-16 shadow-2xl shadow-indigo-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Ready to find your university?
          </h2>
          <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto">
            Join students who stopped guessing and started applying with confidence. It's free to get started.
          </p>
          <Link to="/register"
            className="inline-block bg-white text-indigo-700 px-12 py-4 rounded-2xl text-base font-extrabold shadow-2xl hover:bg-indigo-50 transition">
            Create your free account →
          </Link>
          <p className="text-indigo-300/70 text-sm mt-5">No credit card required · Free forever on basic plan</p>
        </div>
      </div>
    </div>
  </section>
);

/* ── Footer ── */
const Footer = () => (
  <footer className="bg-gray-950 text-gray-500 py-14">
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🎓</span>
            <span className="text-white font-bold text-lg">UniFind</span>
          </div>
          <p className="text-sm leading-relaxed">
            Helping Arabic-speaking students find and apply to European universities — powered by AI.
          </p>
        </div>
        <div>
          <p className="text-white font-semibold text-sm mb-4">Explore</p>
          <div className="space-y-2 text-sm">
            <div><Link to="/universities" className="hover:text-white transition">Universities</Link></div>
            <div><Link to="/scholarships" className="hover:text-white transition">Scholarships</Link></div>
            <div><Link to="/instructors" className="hover:text-white transition">Instructors</Link></div>
            <div><Link to="/pricing" className="hover:text-white transition">Pricing</Link></div>
          </div>
        </div>
        <div>
          <p className="text-white font-semibold text-sm mb-4">Features</p>
          <div className="space-y-2 text-sm">
            <div><a href="#features" className="hover:text-white transition">AI Matching</a></div>
            <div><a href="#features" className="hover:text-white transition">Email Tracking</a></div>
            <div><a href="#features" className="hover:text-white transition">IELTS Simulator</a></div>
            <div><a href="#features" className="hover:text-white transition">AI Chat</a></div>
          </div>
        </div>
        <div>
          <p className="text-white font-semibold text-sm mb-4">Account</p>
          <div className="space-y-2 text-sm">
            <div><Link to="/register" className="hover:text-white transition">Sign up free</Link></div>
            <div><Link to="/login" className="hover:text-white transition">Sign in</Link></div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <p>© 2026 UniFind. All rights reserved.</p>
        <p>Made for Arabic-speaking students 🌍</p>
      </div>
    </div>
  </footer>
);

/* ── Main ── */
const Landing = () => (
  <div className="min-h-screen">
    <Navbar />
    <Hero />
    <Problem />
    <Solution />
    <Features />
    <Countries />
    <WhoIsItFor />
    <FAQ />
    <CTA />
    <Footer />
  </div>
);

export default Landing;
