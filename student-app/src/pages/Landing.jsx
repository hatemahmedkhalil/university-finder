import { useState } from "react";
import { Link } from "react-router-dom";

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG     = "bg-[oklch(0.13_0.018_285)]";
const BG_EL  = "bg-[oklch(0.17_0.02_285)]";
const CARD   = "bg-[oklch(0.20_0.024_285)]";
const BORDER = "border-[oklch(1_0_0/0.08)]";
const GRAD   = "bg-[linear-gradient(135deg,oklch(0.62_0.24_296),oklch(0.64_0.21_264))]";
const GRAD_TEXT = "text-[oklch(0.88_0.07_296)]";
const GLOW   = "shadow-[0_8px_32px_oklch(0.62_0.24_296/0.40)]";
const DIM    = "text-[oklch(0.65_0.02_285)]";

/* ── Navbar ─────────────────────────────────────────────────────────────────── */
const Navbar = () => {
  const [open, setOpen] = useState(false);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${BG_EL} border-b ${BORDER} backdrop-blur-xl`}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg ${GRAD} flex items-center justify-center text-white font-extrabold text-sm ${GLOW}`}>U</div>
          <span className="text-white font-extrabold text-lg tracking-tight">UniPath</span>
        </div>
        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-[oklch(0.6_0.02_285)]">
          <a href="#problem"  className="hover:text-white transition">The Problem</a>
          <a href="#solution" className="hover:text-white transition">How It Works</a>
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#faq"      className="hover:text-white transition">FAQ</a>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold text-[oklch(0.65_0.02_285)] hover:text-white transition px-4 py-2">Sign in</Link>
          <Link to="/register" className={`text-sm font-bold text-white px-5 py-2.5 rounded-xl ${GRAD} ${GLOW} hover:opacity-90 transition`}>Get Started Free</Link>
        </div>
        <div className="flex md:hidden items-center gap-2">
          <Link to="/login" className="text-sm font-semibold text-[oklch(0.65_0.02_285)] px-3 py-1.5">Sign in</Link>
          <button onClick={() => setOpen(o => !o)} className={`w-9 h-9 flex items-center justify-center rounded-lg ${CARD} border ${BORDER} text-white`}>
            {open
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>
      </div>
      {open && (
        <div className={`md:hidden ${BG_EL} border-t ${BORDER} px-5 py-4 flex flex-col gap-3`}>
          <a href="#problem"  onClick={() => setOpen(false)} className="text-sm font-medium text-[oklch(0.65_0.02_285)] py-2">The Problem</a>
          <a href="#solution" onClick={() => setOpen(false)} className="text-sm font-medium text-[oklch(0.65_0.02_285)] py-2">How It Works</a>
          <a href="#features" onClick={() => setOpen(false)} className="text-sm font-medium text-[oklch(0.65_0.02_285)] py-2">Features</a>
          <a href="#faq"      onClick={() => setOpen(false)} className="text-sm font-medium text-[oklch(0.65_0.02_285)] py-2">FAQ</a>
          <Link to="/register" className={`text-sm font-bold text-white px-5 py-3 rounded-xl text-center ${GRAD}`}>Get Started Free</Link>
        </div>
      )}
    </nav>
  );
};

/* ── Hero ────────────────────────────────────────────────────────────────────── */
const Hero = () => (
  <section className={`relative overflow-hidden ${BG} min-h-screen flex items-center pt-16`}>
    {/* glow blobs */}
    <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.12] blur-[120px] top-0 -start-32 pointer-events-none"
         style={{ background: "oklch(0.62 0.24 296)" }} />
    <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.10] blur-[100px] bottom-0 end-0 pointer-events-none"
         style={{ background: "oklch(0.64 0.21 264)" }} />
    {/* grid */}
    <div className="absolute inset-0 bg-[linear-gradient(oklch(1_0_0/0.025)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0/0.025)_1px,transparent_1px)] bg-[size:56px_56px]" />

    <div className="relative max-w-6xl mx-auto px-6 py-16 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* LEFT: copy */}
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-[12.5px] font-semibold border"
               style={{ background: "oklch(0.62 0.24 296 / 0.10)", borderColor: "oklch(0.62 0.24 296 / 0.25)", color: "oklch(0.88 0.08 296)" }}>
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Now free for students · 500+ Universities
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-[58px] font-extrabold leading-[1.08] tracking-tight text-white mb-6">
            Your dream university<br />
            <span style={{ background: "linear-gradient(90deg, oklch(0.78 0.12 296), oklch(0.82 0.10 264))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              is closer than you think
            </span>
          </h1>

          <p className={`text-lg ${DIM} mb-3 max-w-lg leading-relaxed`}>
            UniPath helps Arabic-speaking students discover, compare, and apply to European universities — with AI guidance every step of the way.
          </p>
          <p className="text-[oklch(0.48_0.02_285)] text-base mb-10">No agents. No confusing websites. No wasted time.</p>

          <div className="flex flex-wrap gap-4 mb-12">
            <Link to="/register"
              className={`flex items-center gap-2 text-white px-8 py-4 rounded-2xl text-base font-bold ${GRAD} ${GLOW} hover:opacity-90 transition`}>
              Start for Free →
            </Link>
            <a href="#problem"
              className={`flex items-center gap-2 ${CARD} border ${BORDER} text-white px-8 py-4 rounded-2xl text-base font-bold hover:bg-[oklch(0.23_0.026_285)] transition`}>
              See how it works ↓
            </a>
          </div>

          {/* stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { value: "500+", label: "Universities" },
              { value: "200+", label: "Scholarships" },
              { value: "3",    label: "Languages" },
              { value: "Free", label: "Forever" },
            ].map(({ value, label }) => (
              <div key={label} className={`${CARD} border ${BORDER} rounded-2xl py-4 px-3 text-center`}>
                <p className="text-xl font-extrabold text-white">{value}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.55 0.02 285)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: photo collage */}
        <div className="relative hidden lg:block h-[480px]">
          {/* main large photo */}
          <div className="absolute top-0 start-8 w-[280px] h-[340px] rounded-3xl overflow-hidden border border-[oklch(1_0_0/0.10)]"
               style={{ boxShadow: "0 24px 60px oklch(0 0 0 / 0.6)" }}>
            <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80"
                 alt="graduates" className="w-full h-full object-cover"
                 style={{ filter: "brightness(0.80) saturate(1.1)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, oklch(0.13 0.018 285 / 0.7) 0%, transparent 50%)" }} />
          </div>

          {/* second photo */}
          <div className="absolute top-12 end-0 w-[200px] h-[220px] rounded-2xl overflow-hidden border border-[oklch(1_0_0/0.10)]"
               style={{ boxShadow: "0 16px 40px oklch(0 0 0 / 0.5)" }}>
            <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&q=80"
                 alt="students" className="w-full h-full object-cover"
                 style={{ filter: "brightness(0.80) saturate(1.1)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, oklch(0.13 0.018 285 / 0.5) 0%, transparent 60%)" }} />
          </div>

          {/* third photo bottom */}
          <div className="absolute bottom-0 end-8 w-[220px] h-[180px] rounded-2xl overflow-hidden border border-[oklch(1_0_0/0.10)]"
               style={{ boxShadow: "0 16px 40px oklch(0 0 0 / 0.5)" }}>
            <img src="https://images.unsplash.com/photo-1627556704302-624286467c65?w=300&q=80"
                 alt="graduation" className="w-full h-full object-cover"
                 style={{ filter: "brightness(0.80) saturate(1.1)" }} />
          </div>

          {/* floating match card */}
          <div className={`absolute bottom-24 start-0 ${CARD} border ${BORDER} rounded-2xl px-4 py-3 flex items-center gap-3`}
               style={{ boxShadow: "0 8px 32px oklch(0 0 0 / 0.5)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                 style={{ background: "linear-gradient(135deg, oklch(0.62 0.24 296), oklch(0.64 0.21 264))" }}>🎯</div>
            <div>
              <p className="text-white text-xs font-bold">AI Match Found</p>
              <p style={{ color: "oklch(0.55 0.02 285)", fontSize: "11px" }}>TU Munich · 94% match</p>
            </div>
          </div>

          {/* floating badge */}
          <div className="absolute top-6 start-0 px-3 py-1.5 rounded-full text-[11px] font-bold text-white"
               style={{ background: "linear-gradient(135deg, oklch(0.62 0.24 296), oklch(0.64 0.21 264))", boxShadow: "0 4px 16px oklch(0.62 0.24 296 / 0.4)" }}>
            🎓 500+ Universities
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ── Problem ─────────────────────────────────────────────────────────────────── */
const Problem = () => (
  <section id="problem" className={`${BG_EL} border-t ${BORDER} py-28`}>
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className="text-red-400 text-sm font-bold uppercase tracking-widest">The Problem</span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-3 max-w-3xl mx-auto leading-tight">
          Studying in Europe shouldn't feel impossible
        </h2>
        <p className={`${DIM} text-lg mt-5 max-w-2xl mx-auto`}>
          Every year, thousands of Arabic-speaking students give up on their dream — not because they're unqualified, but because the process is overwhelming.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { icon: "😵", title: "Too many options, no guidance", desc: "Hundreds of universities across Germany, Poland, Austria, France… where do you even start? Most students spend months just researching.", color: "oklch(0.65 0.22 25)" },
          { icon: "💸", title: "Expensive agents & middlemen", desc: "Education agents charge thousands of dollars just to fill out forms students could do themselves — if they only knew how.", color: "oklch(0.75 0.18 75)" },
          { icon: "📭", title: "Emails go unanswered", desc: "You apply, then wait. Days turn into weeks. You don't know if you were accepted, rejected, or if they need more documents.", color: "oklch(0.65 0.18 220)" },
        ].map(({ icon, title, desc, color }) => (
          <div key={title} className={`${CARD} border ${BORDER} rounded-3xl p-8 relative overflow-hidden`}>
            <div className="absolute -top-6 -end-6 w-24 h-24 rounded-full opacity-10" style={{ background: color }} />
            <div className="text-4xl mb-5">{icon}</div>
            <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
            <p className={`${DIM} leading-relaxed text-sm`}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ── Solution ────────────────────────────────────────────────────────────────── */
const Solution = () => (
  <section id="solution" className={`${BG} border-t ${BORDER} py-28`}>
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className={`${GRAD_TEXT} text-sm font-bold uppercase tracking-widest`}>The Solution</span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-3">
          UniPath does the hard work for you
        </h2>
        <p className={`${DIM} text-lg mt-5 max-w-2xl mx-auto`}>
          From finding the right university to tracking your application — all in one place, in Arabic and English.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
        {[
          { step: "01", icon: "👤", title: "Build your profile", desc: "Tell us your GPA, budget, field of study, and preferred countries. Takes 3 minutes." },
          { step: "02", icon: "🤖", title: "Get AI recommendations", desc: "Our AI analyzes 500+ universities and ranks the best matches for YOU with a compatibility score." },
          { step: "03", icon: "📋", title: "Track everything", desc: "Apply, track deadlines, get notified when universities reply — all from one dashboard." },
        ].map(({ step, icon, title, desc }, i) => (
          <div key={step} className={`relative text-center ${CARD} border ${BORDER} rounded-3xl p-8 group`}>
            <div className={`w-16 h-16 rounded-2xl ${GRAD} flex items-center justify-center text-2xl mx-auto mb-5 ${GLOW} group-hover:scale-110 transition-transform`}>
              {icon}
            </div>
            <span className={`text-xs font-bold uppercase tracking-widest ${GRAD_TEXT}`}>{step}</span>
            <h3 className="text-lg font-bold text-white mt-2 mb-3">{title}</h3>
            <p className={`${DIM} text-sm leading-relaxed`}>{desc}</p>
            {i < 2 && (
              <div className="hidden md:block absolute top-12 -end-4 text-[oklch(0.35_0.02_285)] text-2xl z-10">→</div>
            )}
          </div>
        ))}
      </div>

      {/* photo + quote section */}
      <div className={`${BG_EL} border ${BORDER} rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2`}>
        <div className="relative h-72 md:h-auto">
          <img src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&q=80"
               alt="graduation ceremony" className="w-full h-full object-cover"
               style={{ filter: "brightness(0.7) saturate(1.1)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 60%, oklch(0.17 0.02 285))" }} />
        </div>
        <div className="p-10 flex flex-col justify-center">
          <div className="text-5xl mb-6" style={{ color: "oklch(0.62 0.24 296)" }}>"</div>
          <p className="text-white text-lg font-medium leading-relaxed mb-6">
            I spent 6 months trying to find the right university in Germany. UniPath did it in 3 minutes and gave me a score for every option.
          </p>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${GRAD} flex items-center justify-center text-white font-bold text-sm`}>A</div>
            <div>
              <p className="text-white text-sm font-bold">Ahmed K.</p>
              <p className={`${DIM} text-xs`}>Now studying MSc at TU Berlin 🇩🇪</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ── Features ────────────────────────────────────────────────────────────────── */
const Features = () => (
  <section id="features" className={`${BG_EL} border-t ${BORDER} py-28`}>
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className={`${GRAD_TEXT} text-sm font-bold uppercase tracking-widest`}>Everything you need</span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-3">One platform. Full journey.</h2>
        <p className={`${DIM} text-lg mt-5 max-w-2xl mx-auto`}>
          UniPath covers every step from discovery to enrollment — so you never have to leave to figure things out.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          { icon: "🎯", title: "AI University Matching", desc: "Get a personalized compatibility score for every university based on your profile, GPA, budget, and language.", accent: "oklch(0.62 0.24 296)" },
          { icon: "💰", title: "Scholarship Finder", desc: "Browse scholarships available to Arab students studying in Europe — filtered by country, amount, and eligibility.", accent: "oklch(0.72 0.18 158)" },
          { icon: "📊", title: "Application Pipeline", desc: "Track every application like a pro. Know exactly where you stand with each university at all times.", accent: "oklch(0.75 0.18 75)" },
          { icon: "📬", title: "Email Tracking", desc: "Connect your email and UniPath automatically detects university replies — no more checking your inbox every hour.", accent: "oklch(0.65 0.22 25)" },
          { icon: "📅", title: "Smart Calendar", desc: "Deadlines, interviews, and acceptance dates automatically added to your calendar from university emails.", accent: "oklch(0.65 0.18 220)" },
          { icon: "👨‍🏫", title: "Language Instructors", desc: "Learn German, English, or Polish from expert instructors. Ask questions and get answers directly in the app.", accent: "oklch(0.65 0.20 330)" },
          { icon: "🤖", title: "AI Chat Assistant", desc: "Ask anything about studying in Europe — visa, documents, deadlines, language requirements. Available 24/7.", accent: "oklch(0.62 0.24 296)" },
          { icon: "📚", title: "IELTS Simulator", desc: "Practice for IELTS with full mock tests — reading, listening, writing, speaking — built right into the platform.", accent: "oklch(0.72 0.18 158)" },
          { icon: "🔔", title: "Real-time Notifications", desc: "Get notified the moment something changes — a university replies, a deadline approaches, or a new scholarship opens.", accent: "oklch(0.75 0.18 75)" },
        ].map(({ icon, title, desc, accent }) => (
          <div key={title} className={`group ${CARD} border ${BORDER} rounded-2xl p-7 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}>
            <div className="absolute -top-6 -end-6 w-20 h-20 rounded-full opacity-10 transition-opacity group-hover:opacity-20"
                 style={{ background: accent }} />
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-5"
                 style={{ background: `${accent}22`, border: `1px solid ${accent}33` }}>
              {icon}
            </div>
            <h3 className="text-base font-bold text-white mb-2">{title}</h3>
            <p className={`${DIM} text-sm leading-relaxed`}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ── Who is it for ───────────────────────────────────────────────────────────── */
const WhoIsItFor = () => (
  <section className={`${BG} border-t ${BORDER} py-28`}>
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className={`${GRAD_TEXT} text-sm font-bold uppercase tracking-widest`}>Who is UniPath for?</span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-3">Built for students like you</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            photo: "https://images.unsplash.com/photo-1627556704302-624286467c65?w=400&q=80",
            title: "Fresh graduates",
            desc: "Just finished your bachelor's and want to pursue a master's in Europe? We find you the best fit based on your GPA and field.",
          },
          {
            photo: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&q=80",
            title: "Working professionals",
            desc: "Want to study while managing a budget? We filter by tuition cost, scholarships, and part-time study options.",
          },
          {
            photo: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&q=80",
            title: "Language learners",
            desc: "Not ready for English-only programs? Our instructors teach German and Polish so you can access free-tuition universities.",
          },
        ].map(({ photo, title, desc }) => (
          <div key={title} className={`${CARD} border ${BORDER} rounded-3xl overflow-hidden group`}>
            <div className="h-52 overflow-hidden relative">
              <img src={photo} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                   style={{ filter: "brightness(0.75) saturate(1.1)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, oklch(0.20 0.024 285) 0%, transparent 60%)" }} />
            </div>
            <div className="p-7">
              <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
              <p className={`${DIM} text-sm leading-relaxed`}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ── FAQ ─────────────────────────────────────────────────────────────────────── */
const faqs = [
  { q: "Is UniPath really free?",               a: "Yes. The core features — AI matching, university search, scholarship browser, and application tracking — are completely free. Premium plans add advanced features for students who want more." },
  { q: "Do I need to speak English to use it?", a: "No. UniPath is fully available in Arabic. Our instructors also teach German and Polish so you can apply to free-tuition universities without needing English." },
  { q: "How does AI matching work?",            a: "You fill in your profile: GPA, budget, field of study, preferred countries, and language level. Our AI compares your profile against every university in our database and gives each one a compatibility score out of 100." },
  { q: "What countries do you cover?",          a: "Currently Germany, Poland, Austria, Netherlands, France, Sweden, Italy, and Spain. We're adding more universities regularly." },
  { q: "How does email tracking work?",         a: "You set up Gmail or Outlook to forward university emails to a special UniPath address. We automatically detect acceptances, rejections, and interview invitations — and update your pipeline." },
  { q: "Is my data safe?",                      a: "Yes. We only read forwarded emails — we never access your inbox directly. All consent is recorded and you can delete your data at any time. We comply with GDPR." },
];

const FAQ = () => {
  const [open, setOpen] = useState(null);
  return (
    <section id="faq" className={`${BG_EL} border-t ${BORDER} py-28`}>
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className={`${GRAD_TEXT} text-sm font-bold uppercase tracking-widest`}>FAQ</span>
          <h2 className="text-4xl font-extrabold text-white mt-3">Common questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => (
            <div key={i} className={`${CARD} border ${BORDER} rounded-2xl overflow-hidden`}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4">
                <span className="font-semibold text-white text-sm">{q}</span>
                <span className={`text-xl shrink-0 transition-transform ${open === i ? "rotate-45" : ""}`}
                      style={{ color: "oklch(0.62 0.24 296)" }}>+</span>
              </button>
              {open === i && (
                <div className={`px-6 pb-5 ${DIM} text-sm leading-relaxed border-t ${BORDER} pt-4`}>{a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ── CTA ─────────────────────────────────────────────────────────────────────── */
const CTA = () => (
  <section className={`${BG} border-t ${BORDER} py-28`}>
    <div className="max-w-5xl mx-auto px-6">
      <div className={`relative overflow-hidden rounded-3xl`}
           style={{ background: "linear-gradient(135deg, oklch(0.62 0.24 296), oklch(0.55 0.20 264))", boxShadow: "0 24px 60px oklch(0.62 0.24 296 / 0.35)" }}>

        {/* background photo */}
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=60"
               alt="graduates" className="w-full h-full object-cover mix-blend-overlay opacity-20" />
        </div>

        <div className="absolute w-[300px] h-[300px] rounded-full opacity-20 blur-[80px] -top-20 -start-20 pointer-events-none"
             style={{ background: "white" }} />
        <div className="absolute w-[200px] h-[200px] rounded-full opacity-15 blur-[60px] -bottom-10 end-10 pointer-events-none"
             style={{ background: "white" }} />

        <div className="relative px-8 py-20 text-center">
          <div className="text-5xl mb-5">🎓</div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Ready to find your university?
          </h2>
          <p className="text-white/75 text-lg mb-10 max-w-xl mx-auto">
            Join students who stopped guessing and started applying with confidence. It's free to get started.
          </p>
          <Link to="/register"
            className="inline-block bg-white font-extrabold px-12 py-4 rounded-2xl text-base shadow-2xl hover:bg-white/90 transition"
            style={{ color: "oklch(0.40 0.15 296)" }}>
            Create your free account →
          </Link>
          <p className="text-white/50 text-sm mt-5">No credit card required · Free forever on basic plan</p>
        </div>
      </div>
    </div>
  </section>
);

/* ── Footer ──────────────────────────────────────────────────────────────────── */
const Footer = () => (
  <footer className={`${BG_EL} border-t ${BORDER} py-14`}>
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <div className={`w-8 h-8 rounded-lg ${GRAD} flex items-center justify-center text-white font-extrabold text-sm`}>U</div>
            <span className="text-white font-extrabold text-lg">UniPath</span>
          </div>
          <p className={`${DIM} text-sm leading-relaxed`}>Helping Arabic-speaking students find and apply to European universities — powered by AI.</p>
        </div>
        <div>
          <p className="text-white font-semibold text-sm mb-4">Explore</p>
          <div className={`space-y-2 text-sm ${DIM}`}>
            <div><Link to="/universities" className="hover:text-white transition">Universities</Link></div>
            <div><Link to="/scholarships" className="hover:text-white transition">Scholarships</Link></div>
            <div><Link to="/instructors"  className="hover:text-white transition">Instructors</Link></div>
            <div><Link to="/pricing"      className="hover:text-white transition">Pricing</Link></div>
          </div>
        </div>
        <div>
          <p className="text-white font-semibold text-sm mb-4">Features</p>
          <div className={`space-y-2 text-sm ${DIM}`}>
            <div><a href="#features" className="hover:text-white transition">AI Matching</a></div>
            <div><a href="#features" className="hover:text-white transition">Email Tracking</a></div>
            <div><a href="#features" className="hover:text-white transition">IELTS Simulator</a></div>
            <div><a href="#features" className="hover:text-white transition">AI Chat</a></div>
          </div>
        </div>
        <div>
          <p className="text-white font-semibold text-sm mb-4">Account</p>
          <div className={`space-y-2 text-sm ${DIM}`}>
            <div><Link to="/register" className="hover:text-white transition">Sign up free</Link></div>
            <div><Link to="/login"    className="hover:text-white transition">Sign in</Link></div>
          </div>
        </div>
      </div>
      <div className={`border-t ${BORDER} pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${DIM}`}>
        <p>© 2026 UniPath. All rights reserved.</p>
        <p>Made for Arabic-speaking students 🌍</p>
      </div>
    </div>
  </footer>
);

/* ── Main ────────────────────────────────────────────────────────────────────── */
export default function Landing() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "Helvetica, Arial, 'IBM Plex Sans Arabic', sans-serif" }}>
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <Features />
      <WhoIsItFor />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
