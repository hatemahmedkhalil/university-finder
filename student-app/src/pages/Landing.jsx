import { useState, useEffect, useRef } from "react";
import { Icon, ICONS } from "../components/Sidebar";
import { Link } from "react-router-dom";

/* ── Scroll-reveal: fades + slides a section up once it enters the viewport ── */
const Reveal = ({ children, className = "" }) => {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {children}
    </div>
  );
};

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG     = "bg-[var(--bg)]";
const BG_EL  = "bg-[var(--bg-subtle)]";
const CARD   = "bg-[var(--surface-2)]";
const BORDER = "border-[var(--border)]";
const GRAD   = "bg-[linear-gradient(135deg,var(--accent),var(--accent-light))]";
const GRAD_TEXT = "text-[var(--accent)]";
const GLOW   = "shadow-[0_8px_32px_rgba(14,165,233,0.35)]";
const DIM    = "text-[var(--ink-faint)]";

/* ── Navbar ─────────────────────────────────────────────────────────────────── */
const Navbar = () => {
  const [open, setOpen] = useState(false);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${BG_EL} border-b ${BORDER} backdrop-blur-xl`}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg ${GRAD} flex items-center justify-center text-[var(--ink)] font-extrabold text-sm ${GLOW}`}>U</div>
          <span className="text-[var(--ink)] font-extrabold text-lg tracking-tight">UniPath</span>
        </div>
        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-[var(--ink-faint)]">
          <a href="#problem"  className="hover:text-[var(--ink)] transition">The Problem</a>
          <a href="#solution" className="hover:text-[var(--ink)] transition">How It Works</a>
          <a href="#features" className="hover:text-[var(--ink)] transition">Features</a>
          <a href="#faq"      className="hover:text-[var(--ink)] transition">FAQ</a>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold text-[var(--ink-faint)] hover:text-[var(--ink)] transition px-4 py-2">Sign in</Link>
          <Link to="/register" className={`text-sm font-bold text-[var(--ink)] px-5 py-2.5 rounded-xl ${GRAD} ${GLOW} hover:opacity-90 transition`}>Get Started Free</Link>
        </div>
        <div className="flex md:hidden items-center gap-2">
          <Link to="/login" className="text-sm font-semibold text-[var(--ink-faint)] px-3 py-1.5">Sign in</Link>
          <button onClick={() => setOpen(o => !o)} className={`w-9 h-9 flex items-center justify-center rounded-lg ${CARD} border ${BORDER} text-[var(--ink)]`}>
            {open
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>
      </div>
      {open && (
        <div className={`md:hidden ${BG_EL} border-t ${BORDER} px-5 py-4 flex flex-col gap-3`}>
          <a href="#problem"  onClick={() => setOpen(false)} className="text-sm font-medium text-[var(--ink-faint)] py-2">The Problem</a>
          <a href="#solution" onClick={() => setOpen(false)} className="text-sm font-medium text-[var(--ink-faint)] py-2">How It Works</a>
          <a href="#features" onClick={() => setOpen(false)} className="text-sm font-medium text-[var(--ink-faint)] py-2">Features</a>
          <a href="#faq"      onClick={() => setOpen(false)} className="text-sm font-medium text-[var(--ink-faint)] py-2">FAQ</a>
          <Link to="/register" className={`text-sm font-bold text-[var(--ink)] px-5 py-3 rounded-xl text-center ${GRAD}`}>Get Started Free</Link>
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
         style={{ background: "var(--accent)" }} />
    <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.10] blur-[100px] bottom-0 end-0 pointer-events-none"
         style={{ background: "var(--accent-light)" }} />
    {/* grid */}
    <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "56px 56px", maskImage: "linear-gradient(180deg, black, transparent 70%)" }} />

    <div className="relative max-w-6xl mx-auto px-6 py-16 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* LEFT: copy */}
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-[12.5px] font-semibold border"
               style={{ background: "var(--accent-subtle)", borderColor: "rgba(14,165,233,0.30)", color: "var(--accent)" }}>
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Now free for students · 167+ Universities
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-[58px] font-extrabold leading-[1.08] tracking-tight text-[var(--ink)] mb-6">
            Your dream university<br />
            <span style={{ background: "linear-gradient(90deg, var(--accent-light), var(--accent-light))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              is closer than you think
            </span>
          </h1>

          <p className={`text-lg ${DIM} mb-3 max-w-lg leading-relaxed`}>
            UniPath helps Arabic-speaking students discover, compare, and apply to European universities — with AI guidance every step of the way.
          </p>
          <p className="text-[var(--ink-faint)] text-base mb-10">No agents. No confusing websites. No wasted time.</p>

          <div className="flex flex-wrap gap-4 mb-12">
            <Link to="/register"
              className={`flex items-center gap-2 text-[var(--ink)] px-8 py-4 rounded-2xl text-base font-bold ${GRAD} ${GLOW} hover:opacity-90 transition`}>
              Start for Free →
            </Link>
            <a href="#problem"
              className={`flex items-center gap-2 ${CARD} border ${BORDER} text-[var(--ink)] px-8 py-4 rounded-2xl text-base font-bold hover:bg-[var(--surface-hover)] transition`}>
              See how it works ↓
            </a>
          </div>

          {/* stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { value: "167+", label: "Universities" },
              { value: "27+",  label: "Scholarships" },
              { value: "3",    label: "Languages" },
              { value: "Free", label: "Forever" },
            ].map(({ value, label }) => (
              <div key={label} className={`${CARD} border ${BORDER} rounded-2xl py-4 px-3 text-center`}>
                <p className="text-xl font-extrabold text-[var(--ink)]">{value}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-faint)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: single premium photo — a real European campus moment, not a
            collage of stock cutouts. It sits behind the composition (rounded,
            soft shadow, edge fades into the page background via var(--bg) so
            it self-adapts between light and dark) rather than announcing
            itself as a giant banner. */}
        <div className="relative hidden lg:block h-[480px]">
          <div className="absolute inset-0 rounded-[32px] overflow-hidden" style={{ boxShadow: "var(--shadow-lg)" }}>
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&q=75"
              alt="Student walking through a European university campus"
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 30%", filter: "brightness(0.88) saturate(1.05)" }}
              loading="eager"
            />
            {/* fades the photo's inner edge into the page bg so it reads as
                "behind" the composition rather than a pasted-on banner */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(100deg, var(--bg) -5%, transparent 32%)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(6,9,15,0.45) 0%, transparent 45%)" }} />
          </div>

          {/* single, useful floating callout — kept deliberately minimal */}
          <div className={`absolute bottom-6 start-6 ${CARD} border ${BORDER} rounded-2xl px-4 py-3 flex items-center gap-3 backdrop-blur-sm`}
               style={{ boxShadow: "var(--shadow-md)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0"
                 style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-light))" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
            </div>
            <div>
              <p className="text-[var(--ink)] text-xs font-bold">AI Match Found</p>
              <p style={{ color: "var(--ink-faint)", fontSize: "11px" }}>TU Munich · 94% match</p>
            </div>
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
        <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] mt-3 max-w-3xl mx-auto leading-tight">
          Studying in Europe shouldn't feel impossible
        </h2>
        <p className={`${DIM} text-lg mt-5 max-w-2xl mx-auto`}>
          Every year, thousands of Arabic-speaking students give up on their dream — not because they're unqualified, but because the process is overwhelming.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { icon: "alertTriangle", title: "Too many options, no guidance", desc: "Dozens of universities across Germany, Poland, and Romania… where do you even start? Most students spend months just researching.", color: "#f94144" },
          { icon: "wallet", title: "Expensive agents & middlemen", desc: "Education agents charge thousands of dollars just to fill out forms students could do themselves — if they only knew how.", color: "#ef9900" },
          { icon: "mail", title: "Emails go unanswered", desc: "You apply, then wait. Days turn into weeks. You don't know if you were accepted, rejected, or if they need more documents.", color: "#00a5da" },
        ].map(({ icon, title, desc, color }) => (
          <div key={title} className={`${CARD} border ${BORDER} rounded-3xl p-8 relative overflow-hidden`}>
            <div className="absolute -top-6 -end-6 w-24 h-24 rounded-full opacity-10" style={{ background: color }} />
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}><Icon d={ICONS[icon]} size={26} /></div>
            <h3 className="text-lg font-bold text-[var(--ink)] mb-3">{title}</h3>
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
        <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] mt-3">
          UniPath does the hard work for you
        </h2>
        <p className={`${DIM} text-lg mt-5 max-w-2xl mx-auto`}>
          From finding the right university to tracking your application — all in one place, in Arabic and English.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
        {[
          { step: "01", icon: "profile", title: "Build your profile", desc: "Tell us your GPA, budget, field of study, and preferred countries. Takes 3 minutes." },
          { step: "02", icon: "aichat", title: "Get AI recommendations", desc: "Our AI analyzes 167+ universities and ranks the best matches for YOU with a compatibility score." },
          { step: "03", icon: "applications", title: "Track everything", desc: "Apply, track deadlines, get notified when universities reply — all from one dashboard." },
        ].map(({ step, icon, title, desc }, i) => (
          <div key={step} className={`relative text-center ${CARD} border ${BORDER} rounded-3xl p-8 group`}>
            <div className={`w-16 h-16 rounded-2xl ${GRAD} flex items-center justify-center text-white mx-auto mb-5 ${GLOW} group-hover:scale-110 transition-transform`}>
              <Icon d={ICONS[icon]} size={26} />
            </div>
            <span className={`text-xs font-bold uppercase tracking-widest ${GRAD_TEXT}`}>{step}</span>
            <h3 className="text-lg font-bold text-[var(--ink)] mt-2 mb-3">{title}</h3>
            <p className={`${DIM} text-sm leading-relaxed`}>{desc}</p>
            {i < 2 && (
              <div className="hidden md:block absolute top-12 -end-4 text-[var(--border-strong)] text-2xl z-10">→</div>
            )}
          </div>
        ))}
      </div>

      {/* photo + "student stories coming soon" placeholder — no invented testimonial */}
      <div className={`${BG_EL} border ${BORDER} rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2`}>
        <div className="relative h-72 md:h-auto">
          <img src="https://images.unsplash.com/photo-1525921429624-479b6a26d84d?w=600&q=80"
               alt="Graduation ceremony" className="w-full h-full object-cover" loading="lazy"
               style={{ filter: "brightness(0.7) saturate(1.1)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 60%, var(--bg-subtle))" }} />
        </div>
        <div className="p-10 flex flex-col justify-center">
          <span className="inline-flex items-center gap-1.5 self-start text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
                style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
            Coming soon
          </span>
          <div className="text-5xl mb-4" style={{ color: "var(--accent)" }}>"</div>
          <p className="text-[var(--ink)] text-lg font-medium leading-relaxed mb-3">
            Student stories will appear here as early users complete their journey to Europe.
          </p>
          <p className={`${DIM} text-sm leading-relaxed`}>
            We'd rather wait for real experiences than make one up — check back soon.
          </p>
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
        <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] mt-3">One platform. Full journey.</h2>
        <p className={`${DIM} text-lg mt-5 max-w-2xl mx-auto`}>
          UniPath covers every step from discovery to enrollment — so you never have to leave to figure things out.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          { icon: "target", title: "AI University Matching", desc: "Get a personalized compatibility score for every university based on your profile, GPA, budget, and language.", accent: "var(--accent)" },
          { icon: "wallet", title: "Scholarship Finder", desc: "Browse scholarships available to Arab students studying in Europe — filtered by country, amount, and eligibility.", accent: "#00c577" },
          { icon: "trendingUp", title: "Application Pipeline", desc: "Track every application like a pro. Know exactly where you stand with each university at all times.", accent: "#ef9900" },
          { icon: "mail", title: "Email Tracking", desc: "Connect your email and UniPath automatically detects university replies — no more checking your inbox every hour.", accent: "#f94144" },
          { icon: "calendar", title: "Smart Calendar", desc: "Deadlines, interviews, and acceptance dates automatically added to your calendar from university emails.", accent: "#00a5da" },
          { icon: "instructors", title: "Language Instructors", desc: "Learn German, English, or Polish from expert instructors. Ask questions and get answers directly in the app.", accent: "#cf57c8" },
          { icon: "aichat", title: "AI Chat Assistant", desc: "Ask anything about studying in Europe — visa, documents, deadlines, language requirements. Available 24/7.", accent: "var(--accent)" },
          { icon: "book", title: "IELTS Simulator", desc: "Practice for IELTS with full mock tests — reading, listening, writing, speaking — built right into the platform.", accent: "#00c577" },
          { icon: "notifications", title: "Real-time Notifications", desc: "Get notified the moment something changes — a university replies, a deadline approaches, or a new scholarship opens.", accent: "#ef9900" },
        ].map(({ icon, title, desc, accent }) => (
          <div key={title} className={`group ${CARD} border ${BORDER} rounded-2xl p-7 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}>
            <div className="absolute -top-6 -end-6 w-20 h-20 rounded-full opacity-10 transition-opacity group-hover:opacity-20"
                 style={{ background: accent }} />
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                 style={{ background: `${accent}22`, border: `1px solid ${accent}33`, color: accent }}>
              <Icon d={ICONS[icon]} size={20} />
            </div>
            <h3 className="text-base font-bold text-[var(--ink)] mb-2">{title}</h3>
            <p className={`${DIM} text-sm leading-relaxed`}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ── Countries showcase ──────────────────────────────────────────────────────── */
const COUNTRIES = [
  { name: "Germany", flag: "🇩🇪", photo: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&q=75", note: "Tuition-free public universities" },
  { name: "Poland",  flag: "🇵🇱", photo: "https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=600&q=75", note: "Affordable, English-taught programs" },
  { name: "Romania", flag: "🇷🇴", photo: "https://images.unsplash.com/photo-1651427327856-402d6d856667?w=600&q=75", note: "Low cost of living, EU degree" },
];

const Countries = () => (
  <section className={`${BG_EL} border-t ${BORDER} py-28`}>
    <Reveal className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className={`${GRAD_TEXT} text-sm font-bold uppercase tracking-widest`}>Where you can study</span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] mt-3">167+ universities across Europe</h2>
        <p className={`${DIM} text-lg mt-5 max-w-2xl mx-auto`}>
          We're starting with three countries offering the best value for Arabic-speaking students — with more being added regularly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COUNTRIES.map(({ name, flag, photo, note }) => (
          <Link key={name} to="/universities" className={`group relative rounded-3xl overflow-hidden h-64 block border ${BORDER}`}>
            <img src={photo} alt={`${name} university city`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy"
                 style={{ filter: "brightness(0.7) saturate(1.1)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(6,9,15,0.1), rgba(6,9,15,0.85) 90%)" }} />
            <div className="absolute bottom-0 start-0 end-0 p-6">
              <span className="text-3xl">{flag}</span>
              <h3 className="text-xl font-extrabold text-white mt-1.5">{name}</h3>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>{note}</p>
            </div>
          </Link>
        ))}
      </div>
    </Reveal>
  </section>
);

/* ── Student Journey timeline ─────────────────────────────────────────────────── */
const JOURNEY = [
  { icon: "target", title: "Dream",     desc: "You decide studying in Europe is possible for you." },
  { icon: "profile", title: "Profile",   desc: "Tell us your GPA, budget, and goals — takes 3 minutes." },
  { icon: "target", title: "Match",     desc: "AI ranks every university by real compatibility, not guesswork." },
  { icon: "📋", title: "Apply",     desc: "Track documents and deadlines from one dashboard." },
  { icon: "graduationCap", title: "Admission", desc: "Get accepted — and know exactly what's next." },
  { icon: "compass", title: "Europe",    desc: "Pack your bags. Your new chapter starts here." },
];

const JourneyTimeline = () => (
  <section className={`${BG} border-t ${BORDER} py-28`}>
    <Reveal className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className={`${GRAD_TEXT} text-sm font-bold uppercase tracking-widest`}>Your journey</span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] mt-3">From dream to Europe</h2>
        <p className={`${DIM} text-lg mt-5 max-w-2xl mx-auto`}>Every student's path looks the same — we just make each step easier.</p>
      </div>

      <div className="relative">
        <div className="hidden md:block absolute top-8 start-0 end-0 h-0.5" style={{ background: "var(--border)" }} />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
          {JOURNEY.map(({ icon, title, desc }, i) => (
            <div key={title} className="relative flex flex-col items-center text-center">
              <div className={`relative w-16 h-16 rounded-2xl ${GRAD} flex items-center justify-center text-white mb-4 ${GLOW}`}>
                <Icon d={ICONS[icon]} size={24} />
              </div>
              <h3 className="text-sm font-bold text-[var(--ink)] mb-1">{title}</h3>
              <p className={`${DIM} text-xs leading-relaxed`}>{desc}</p>
              {i < JOURNEY.length - 1 && (
                <div className="hidden md:block absolute top-8 start-full w-6 text-center" style={{ color: "var(--border-strong)" }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  </section>
);

/* ── Who is it for ───────────────────────────────────────────────────────────── */
const WhoIsItFor = () => (
  <section className={`${BG} border-t ${BORDER} py-28`}>
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <span className={`${GRAD_TEXT} text-sm font-bold uppercase tracking-widest`}>Who is UniPath for?</span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] mt-3">Built for students like you</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            photo: "https://images.unsplash.com/photo-1627556704302-624286467c65?w=400&q=80",
            title: "Fresh graduates",
            desc: "Just finished your bachelor's and want to pursue a master's in Europe? We find you the best fit based on your GPA and field.",
          },
          {
            photo: "https://images.unsplash.com/photo-1503945438517-f65904a52ce6?w=400&q=80",
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
              <img src={photo} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"
                   style={{ filter: "brightness(0.75) saturate(1.1)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--surface-2) 0%, transparent 60%)" }} />
            </div>
            <div className="p-7">
              <h3 className="text-lg font-bold text-[var(--ink)] mb-3">{title}</h3>
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
  { q: "What countries do you cover?",          a: "Currently Germany, Poland, and Romania, with 167+ universities in our database. We're adding more countries and universities regularly." },
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
          <h2 className="text-4xl font-extrabold text-[var(--ink)] mt-3">Common questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => (
            <div key={i} className={`${CARD} border ${BORDER} rounded-2xl overflow-hidden`}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4">
                <span className="font-semibold text-[var(--ink)] text-sm">{q}</span>
                <span className={`text-xl shrink-0 transition-transform ${open === i ? "rotate-45" : ""}`}
                      style={{ color: "var(--accent)" }}>+</span>
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
           style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-active))", boxShadow: "0 24px 60px rgba(14,165,233,0.30)" }}>

        {/* background photo */}
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1639503667014-6533f3f34831?w=1200&q=60"
               alt="Graduation ceremony" className="w-full h-full object-cover mix-blend-overlay opacity-20" loading="lazy" />
        </div>

        <div className="absolute w-[300px] h-[300px] rounded-full opacity-20 blur-[80px] -top-20 -start-20 pointer-events-none"
             style={{ background: "white" }} />
        <div className="absolute w-[200px] h-[200px] rounded-full opacity-15 blur-[60px] -bottom-10 end-10 pointer-events-none"
             style={{ background: "white" }} />

        <div className="relative px-8 py-20 text-center">
          <div className="mb-5 flex justify-center"><Icon d={ICONS.graduationCap} size={40} /></div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] mb-4">
            Ready to find your university?
          </h2>
          <p className="text-[var(--ink)]/75 text-lg mb-10 max-w-xl mx-auto">
            Join students who stopped guessing and started applying with confidence. It's free to get started.
          </p>
          <Link to="/register"
            className="inline-block bg-white font-extrabold px-12 py-4 rounded-2xl text-base shadow-2xl hover:bg-white/90 transition"
            style={{ color: "var(--accent-active)" }}>
            Create your free account →
          </Link>
          <p className="text-[var(--ink)]/50 text-sm mt-5">No credit card required · Free forever on basic plan</p>
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
            <div className={`w-8 h-8 rounded-lg ${GRAD} flex items-center justify-center text-[var(--ink)] font-extrabold text-sm`}>U</div>
            <span className="text-[var(--ink)] font-extrabold text-lg">UniPath</span>
          </div>
          <p className={`${DIM} text-sm leading-relaxed`}>Helping Arabic-speaking students find and apply to European universities — powered by AI.</p>
        </div>
        <div>
          <p className="text-[var(--ink)] font-semibold text-sm mb-4">Explore</p>
          <div className={`space-y-2 text-sm ${DIM}`}>
            <div><Link to="/universities" className="hover:text-[var(--ink)] transition">Universities</Link></div>
            <div><Link to="/scholarships" className="hover:text-[var(--ink)] transition">Scholarships</Link></div>
            <div><Link to="/instructors"  className="hover:text-[var(--ink)] transition">Instructors</Link></div>
            <div><Link to="/pricing"      className="hover:text-[var(--ink)] transition">Pricing</Link></div>
          </div>
        </div>
        <div>
          <p className="text-[var(--ink)] font-semibold text-sm mb-4">Features</p>
          <div className={`space-y-2 text-sm ${DIM}`}>
            <div><a href="#features" className="hover:text-[var(--ink)] transition">AI Matching</a></div>
            <div><a href="#features" className="hover:text-[var(--ink)] transition">Email Tracking</a></div>
            <div><a href="#features" className="hover:text-[var(--ink)] transition">IELTS Simulator</a></div>
            <div><a href="#features" className="hover:text-[var(--ink)] transition">AI Chat</a></div>
          </div>
        </div>
        <div>
          <p className="text-[var(--ink)] font-semibold text-sm mb-4">Account</p>
          <div className={`space-y-2 text-sm ${DIM}`}>
            <div><Link to="/register" className="hover:text-[var(--ink)] transition">Sign up free</Link></div>
            <div><Link to="/login"    className="hover:text-[var(--ink)] transition">Sign in</Link></div>
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
      <Countries />
      <JourneyTimeline />
      <Features />
      <WhoIsItFor />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
