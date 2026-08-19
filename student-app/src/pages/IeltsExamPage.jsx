import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { Icon, ICONS } from "../components/Sidebar";

const SECTION_ICONS = { Listening: ICONS.headphones, Reading: ICONS.book, Writing: ICONS.pencil, Speaking: ICONS.mic };
const BG      = "var(--bg)";
const SURFACE = "var(--surface-2)";
const CARD    = "var(--surface-hover)";
const BORDER  = "rgba(255,255,255,0.07)";
const GRAD    = "linear-gradient(135deg, var(--accent), var(--accent))";
const DIM     = "var(--ink-faint)";

/* ── Timer ── */
const useTimer = (totalSeconds, onExpire) => {
  const [left, setLeft] = useState(totalSeconds);
  const ref = useRef(null);
  useEffect(() => {
    ref.current = setInterval(() => {
      setLeft(s => {
        if (s <= 1) { clearInterval(ref.current); onExpire?.(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, []);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return { display: `${mm}:${ss}`, left, isLow: left < 300 };
};

/* ── Audio Player ── */
const AudioPlayer = ({ url }) => {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  if (!url) return null;

  const toggle = () => {
    if (playing) { ref.current.pause(); setPlaying(false); }
    else { ref.current.play(); setPlaying(true); }
  };

  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="rounded-2xl p-4 mb-6 flex items-center gap-4"
         style={{ background: "rgba(29,19,51,0.15)", border: "1px solid rgba(129,70,224,0.3)" }}>
      <audio ref={ref} src={url}
        onTimeUpdate={() => setProgress(ref.current.currentTime)}
        onLoadedMetadata={() => setDuration(ref.current.duration)}
        onEnded={() => setPlaying(false)} />
      <button onClick={toggle}
        className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--ink)] shrink-0 transition hover:opacity-80"
        style={{ background: GRAD }}>
        {playing ? "⏸" : "▶"}
      </button>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1" style={{ color: DIM }}>
          <span>Listening audio</span>
          <span>{fmt(progress)} / {fmt(duration)}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden cursor-pointer" style={{ background: "rgba(255,255,255,0.1)" }}
             onClick={e => {
               const rect = e.currentTarget.getBoundingClientRect();
               const pct = (e.clientX - rect.left) / rect.width;
               ref.current.currentTime = pct * duration;
             }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${duration ? (progress / duration) * 100 : 0}%`, background: GRAD }} />
        </div>
      </div>
    </div>
  );
};

/* ── Question renderer ── */
const Question = ({ q, idx, answer, setAnswer }) => {
  let options = [];
  try { options = JSON.parse(q.options_json || "[]"); } catch {}

  return (
    <div className="mb-8">
      <p className="text-sm font-semibold mb-3" style={{ color: DIM }}>Question {idx + 1} · {q.marks} mark{q.marks !== 1 ? "s" : ""}</p>
      <p className="text-[var(--ink)] font-medium mb-4 leading-relaxed">{q.question_text}</p>

      {q.question_type === "multiple_choice" && options.length > 0 && (
        <div className="space-y-2">
          {options.map((opt, i) => (
            <button key={i} onClick={() => setAnswer(opt)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition border"
              style={{
                background: answer === opt ? "rgba(129,70,224,0.15)" : SURFACE,
                borderColor: answer === opt ? "rgba(129,70,224,0.6)" : BORDER,
                color: answer === opt ? "#fff" : DIM,
              }}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {q.question_type === "true_false" && (
        <div className="flex gap-3">
          {["True", "False", "Not Given"].map(opt => (
            <button key={opt} onClick={() => setAnswer(opt)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border transition"
              style={{
                background: answer === opt ? "rgba(129,70,224,0.15)" : SURFACE,
                borderColor: answer === opt ? "rgba(129,70,224,0.6)" : BORDER,
                color: answer === opt ? "#fff" : DIM,
              }}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {(q.question_type === "short_answer" || q.question_type === "matching") && (
        <input type="text" value={answer || ""} onChange={e => setAnswer(e.target.value)}
          placeholder="Type your answer…"
          className="w-full px-4 py-3 rounded-xl text-sm text-[var(--ink)] focus:outline-none"
          style={{ background: SURFACE, border: `1.5px solid ${answer ? "rgba(129,70,224,0.5)" : BORDER}` }} />
      )}

      {q.question_type === "essay" && (
        <textarea rows={6} value={answer || ""} onChange={e => setAnswer(e.target.value)}
          placeholder="Write your response here…"
          className="w-full px-4 py-3 rounded-xl text-sm text-[var(--ink)] focus:outline-none resize-none"
          style={{ background: SURFACE, border: `1.5px solid ${answer ? "rgba(129,70,224,0.5)" : BORDER}` }} />
      )}
    </div>
  );
};

/* ── Results screen ── */
const Results = ({ test, answers, onRetry }) => {
  let totalMarks = 0, earned = 0, correct = 0, total = 0;
  const breakdown = test.sections.map(sec => {
    const qs = sec.questions || [];
    let secEarned = 0, secTotal = 0;
    qs.forEach(q => {
      const isAuto = ["multiple_choice", "true_false", "short_answer", "matching"].includes(q.question_type);
      if (isAuto && q.correct_answer) {
        totalMarks += q.marks;
        secTotal += q.marks;
        total++;
        const userAns = (answers[q.id] || "").trim().toLowerCase();
        const correctAns = q.correct_answer.trim().toLowerCase();
        if (userAns === correctAns) { earned += q.marks; secEarned += q.marks; correct++; }
      }
    });
    return { name: sec.name, secEarned, secTotal, questions: qs };
  });

  const pct = totalMarks > 0 ? Math.round((earned / totalMarks) * 100) : null;
  const band = pct === null ? "N/A" : pct >= 90 ? "8.5–9.0" : pct >= 75 ? "7.0–8.0" : pct >= 60 ? "5.5–6.5" : pct >= 40 ? "4.0–5.0" : "< 4.0";

  return (
    <div className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      {/* Score card */}
      <div className="rounded-3xl p-8 text-center mb-8" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        <div className="mb-3 flex justify-center"><Icon d={ICONS.graduationCap} size={48} /></div>
        <h1 className="text-3xl font-extrabold text-[var(--ink)] mb-1">{test.title}</h1>
        <p className="text-sm mb-6" style={{ color: DIM }}>Exam complete</p>
        {pct !== null ? (
          <>
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full mb-4"
                 style={{ background: `conic-gradient(var(--accent) 0% ${pct}%, rgba(255,255,255,0.08) ${pct}% 100%)` }}>
              <div className="w-24 h-24 rounded-full flex flex-col items-center justify-center" style={{ background: BG }}>
                <span className="text-2xl font-extrabold text-[var(--ink)]">{pct}%</span>
                <span className="text-[10px]" style={{ color: DIM }}>score</span>
              </div>
            </div>
            <p className="text-[var(--ink)] font-semibold">{correct} / {total} correct answers</p>
            <p className="text-sm mt-1" style={{ color: DIM }}>Estimated band: <strong className="text-[var(--ink)]">{band}</strong></p>
          </>
        ) : (
          <p style={{ color: DIM }}>Essay answers submitted for manual review.</p>
        )}
      </div>

      {/* Section breakdown */}
      <div className="space-y-4 mb-8">
        {breakdown.map(sec => (
          <div key={sec.name} className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[var(--ink)] inline-flex items-center gap-1.5"><Icon d={SECTION_ICONS[sec.name] ?? ICONS.applications} size={15} /> {sec.name}</h3>
              {sec.secTotal > 0 && (
                <span className="text-sm font-semibold" style={{ color: "var(--accent-light)" }}>
                  {sec.secEarned} / {sec.secTotal} marks
                </span>
              )}
            </div>
            <div className="space-y-3">
              {sec.questions.map((q, i) => {
                const isAuto = ["multiple_choice", "true_false", "short_answer", "matching"].includes(q.question_type);
                const userAns = answers[q.id];
                const isCorrect = isAuto && q.correct_answer &&
                  (userAns || "").trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                return (
                  <div key={q.id} className="rounded-xl px-4 py-3 text-sm"
                       style={{ background: CARD, border: `1px solid ${isAuto && q.correct_answer ? (isCorrect ? "rgba(0,174,98,0.4)" : "rgba(212,9,36,0.4)") : BORDER}` }}>
                    <p style={{ color: DIM }}>Q{i + 1}: {q.question_text.slice(0, 80)}{q.question_text.length > 80 ? "…" : ""}</p>
                    {userAns && <p className="mt-1 text-[var(--ink)]">Your answer: <strong>{userAns}</strong></p>}
                    {isAuto && q.correct_answer && !isCorrect && (
                      <p className="mt-0.5" style={{ color: "var(--good)" }}>Correct: <strong>{q.correct_answer}</strong></p>
                    )}
                    {!isAuto && <p className="mt-1" style={{ color: DIM }}>Essay — manual review</p>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={onRetry}
          className="flex-1 py-3 rounded-xl font-bold text-[var(--ink)] transition hover:opacity-80"
          style={{ background: GRAD }}>
          Try Again
        </button>
        <Link to="/learning" className="flex-1 py-3 rounded-xl font-bold text-center transition border"
              style={{ borderColor: BORDER, color: DIM }}>
          Back to Learning
        </Link>
      </div>
    </div>
  );
};

/* ── Main exam page ── */
export default function IeltsExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("intro"); // intro | exam | results
  const [sectionIdx, setSectionIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    api.get(`/ielts/${id}`)
      .then(r => setTest(r.data))
      .catch(() => navigate("/learning"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleExpire = () => setPhase("results");

  const { display: timerDisplay, isLow } = useTimer(
    phase === "exam" && test ? test.duration_minutes * 60 : 999999,
    handleExpire
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (!test) return null;

  const sections = test.sections || [];
  const allQuestions = sections.flatMap(s => (s.questions || []).map(q => ({ ...q, sectionName: s.name, sectionAudio: s.audio_url })));
  const currentSection = sections[sectionIdx];
  const currentQuestions = currentSection?.questions || [];

  /* ── INTRO ── */
  if (phase === "intro") return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
      <div className="max-w-xl w-full rounded-3xl p-8" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        <div className="text-center mb-6">
          <div className="mb-3 flex justify-center"><Icon d={ICONS.applications} size={40} /></div>
          <h1 className="text-2xl font-extrabold text-[var(--ink)]">{test.title}</h1>
          {test.description && <p className="text-sm mt-2" style={{ color: DIM }}>{test.description}</p>}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl p-3 text-center" style={{ background: CARD }}>
            <p className="text-xl font-bold text-[var(--ink)]">{test.duration_minutes}</p>
            <p className="text-xs" style={{ color: DIM }}>minutes</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: CARD }}>
            <p className="text-xl font-bold text-[var(--ink)]">{test.section_count}</p>
            <p className="text-xs" style={{ color: DIM }}>sections</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: CARD }}>
            <p className="text-xl font-bold text-[var(--ink)]">{test.total_questions}</p>
            <p className="text-xs" style={{ color: DIM }}>questions</p>
          </div>
        </div>
        <div className="space-y-2 mb-6">
          {sections.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD }}>
              <Icon d={SECTION_ICONS[s.name] ?? ICONS.applications} size={18} />
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">{s.name}</p>
                <p className="text-xs" style={{ color: DIM }}>{s.questions?.length ?? 0} questions{s.audio_url ? " · includes audio" : ""}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl px-4 py-3 mb-6 text-sm" style={{ background: "var(--warn-subtle)", border: "1px solid rgba(245,158,11,0.3)", color: "var(--warn)" }}>
          Once started, the timer cannot be paused. Make sure you're ready.
        </div>
        <button onClick={() => setPhase("exam")}
          className="w-full py-3.5 rounded-xl font-bold text-[var(--ink)] text-base transition hover:opacity-90"
          style={{ background: GRAD, boxShadow: "0 4px 20px rgba(129,70,224,0.35)" }}>
          Start Exam →
        </button>
        <Link to="/learning" className="block text-center mt-3 text-sm font-semibold hover:underline" style={{ color: DIM }}>
          ← Back
        </Link>
      </div>
    </div>
  );

  /* ── RESULTS ── */
  if (phase === "results") return (
    <Results test={test} answers={answers} onRetry={() => { setAnswers({}); setSectionIdx(0); setQIdx(0); setPhase("intro"); }} />
  );

  /* ── EXAM ── */
  const q = currentQuestions[qIdx];
  const isLastQ = qIdx === currentQuestions.length - 1;
  const isLastS = sectionIdx === sections.length - 1;
  const answeredInSection = currentQuestions.filter(q => answers[q.id] !== undefined).length;

  const goNext = () => {
    if (!isLastQ) { setQIdx(i => i + 1); return; }
    if (!isLastS) { setSectionIdx(i => i + 1); setQIdx(0); return; }
    setPhase("results");
  };

  const goPrev = () => {
    if (qIdx > 0) { setQIdx(i => i - 1); return; }
    if (sectionIdx > 0) {
      const prevSec = sections[sectionIdx - 1];
      setSectionIdx(i => i - 1);
      setQIdx((prevSec.questions?.length ?? 1) - 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>

      {/* ── Topbar ── */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b"
           style={{ background: SURFACE, borderColor: BORDER }}>
        <div className="flex items-center gap-3">
          <Icon d={SECTION_ICONS[currentSection?.name] ?? ICONS.applications} size={16} />
          <div>
            <p className="text-xs font-semibold text-[var(--ink)]">{currentSection?.name}</p>
            <p className="text-[10px]" style={{ color: DIM }}>Q{qIdx + 1} of {currentQuestions.length}</p>
          </div>
        </div>
        <div className={`font-mono font-bold text-lg px-3 py-1 rounded-xl ${isLow ? "bg-red-500/20 text-red-400" : "text-[var(--ink)]"}`}
             style={isLow ? {} : { background: CARD }}>
          ⏱ {timerDisplay}
        </div>
        <button onClick={() => { if (window.confirm("Submit and see results?")) setPhase("results"); }}
          className="text-xs font-bold px-3 py-1.5 rounded-xl text-[var(--ink)] transition hover:opacity-80"
          style={{ background: GRAD }}>
          Submit
        </button>
      </div>

      {/* ── Section tabs ── */}
      <div className="flex gap-1 px-4 py-2 overflow-x-auto border-b" style={{ borderColor: BORDER, background: SURFACE }}>
        {sections.map((s, i) => {
          const done = (s.questions || []).filter(q => answers[q.id] !== undefined).length;
          const total = s.questions?.length ?? 0;
          return (
            <button key={s.id} onClick={() => { setSectionIdx(i); setQIdx(0); }}
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              style={{
                background: i === sectionIdx ? "rgba(129,70,224,0.2)" : "transparent",
                color: i === sectionIdx ? "#fff" : DIM,
                border: `1px solid ${i === sectionIdx ? "rgba(129,70,224,0.5)" : "transparent"}`,
              }}>
              <Icon d={SECTION_ICONS[s.name] ?? ICONS.applications} size={13} className="inline -mt-0.5 me-1" />{s.name} {done}/{total}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">

        {/* Audio player for Listening sections */}
        {currentSection?.audio_url && <AudioPlayer url={currentSection.audio_url} />}

        {/* Section instructions */}
        {currentSection?.instructions && qIdx === 0 && (
          <div className="rounded-xl px-4 py-3 mb-6 text-sm" style={{ background: CARD, border: `1px solid ${BORDER}`, color: DIM }}>
            📋 {currentSection.instructions}
          </div>
        )}

        {/* Question */}
        {q ? (
          <Question
            q={q}
            idx={qIdx}
            answer={answers[q.id]}
            setAnswer={val => setAnswers(prev => ({ ...prev, [q.id]: val }))}
          />
        ) : (
          <p style={{ color: DIM }}>No questions in this section.</p>
        )}

        {/* Progress dots */}
        <div className="flex gap-1.5 flex-wrap mb-6">
          {currentQuestions.map((cq, i) => (
            <button key={cq.id} onClick={() => setQIdx(i)}
              className="w-7 h-7 rounded-lg text-xs font-bold transition"
              style={{
                background: i === qIdx ? "var(--accent)" : answers[cq.id] !== undefined ? "rgba(0,174,98,0.3)" : CARD,
                color: i === qIdx ? "#fff" : answers[cq.id] !== undefined ? "var(--good)" : DIM,
                border: `1px solid ${i === qIdx ? "var(--accent)" : BORDER}`,
              }}>
              {i + 1}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button onClick={goPrev} disabled={sectionIdx === 0 && qIdx === 0}
            className="flex-1 py-3 rounded-xl font-semibold text-sm border transition disabled:opacity-30"
            style={{ borderColor: BORDER, color: DIM }}>
            ← Previous
          </button>
          <button onClick={goNext}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-[var(--ink)] transition hover:opacity-90"
            style={{ background: isLastQ && isLastS ? "var(--good)" : GRAD }}>
            {isLastQ && isLastS ? "Finish & Submit ✓" : isLastQ ? "Next Section →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
