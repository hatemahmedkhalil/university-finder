/**
 * Full-screen exam taking UI for TOEFL iBT and Cambridge B2 First.
 * Renders a dedicated layout (no sidebar/topbar) with:
 *   - Reading: split-screen passage + questions
 *   - Listening: auto-read transcript (TTS) then questions
 *   - Speaking: task prompts with text response
 *   - Writing: essay editor with word count
 *   - Timer per section, auto-submit on expire
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmtTime = (secs) => {
  if (secs <= 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const wordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const Timer = ({ secondsLeft, totalSeconds }) => {
  const pct = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
  const color =
    pct > 0.4 ? "oklch(0.55 0.22 145)" : pct > 0.15 ? "oklch(0.70 0.20 50)" : "oklch(0.60 0.25 25)";
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="11" fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="2.5" />
        <circle
          cx="14" cy="14" r="11" fill="none"
          stroke={color} strokeWidth="2.5"
          strokeDasharray={69.1}
          strokeDashoffset={69.1 * (1 - pct)}
          strokeLinecap="round"
          transform="rotate(-90 14 14)"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
        />
      </svg>
      <span className="font-mono font-bold text-sm" style={{ color }}>
        {fmtTime(secondsLeft)}
      </span>
    </div>
  );
};

const ProgressDots = ({ sections, currentIndex, completedSections }) => (
  <div className="flex items-center gap-1.5">
    {sections.map((s, i) => {
      const done = completedSections.has(s.id);
      const active = i === currentIndex;
      return (
        <div
          key={s.id}
          title={s.label}
          className="rounded-full transition-all duration-300"
          style={{
            width: active ? 20 : 8,
            height: 8,
            background: done
              ? "oklch(0.55 0.22 145)"
              : active
              ? "oklch(0.65 0.20 296)"
              : "oklch(1 0 0 / 0.15)",
          }}
        />
      );
    })}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Reading section
// ─────────────────────────────────────────────────────────────────────────────

const ReadingSection = ({ sectionData, answers, onAnswer }) => {
  const [activePassage, setActivePassage] = useState(0);
  const [activeQ, setActiveQ] = useState(0);

  const passages = sectionData.passages || [];
  const standalone = sectionData.questions || [];

  const allPassageQuestions = passages.flatMap(p =>
    (p.questions || []).map(q => ({ ...q, passageContent: p.content, passageTitle: p.title }))
  );
  const allQuestions = [...allPassageQuestions, ...standalone];
  const total = allQuestions.length;
  const answered = allQuestions.filter(q => answers[q.id]).length;

  const currentQ = allQuestions[activeQ];
  const currentPassage = currentQ?.passageContent || null;

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* Passage panel */}
      {currentPassage && (
        <div
          className="w-1/2 overflow-y-auto p-6 border-r"
          style={{ borderColor: "oklch(1 0 0 / 0.08)" }}
        >
          {currentQ?.passageTitle && (
            <h2 className="text-base font-bold mb-4" style={{ color: "oklch(0.90 0.01 285)" }}>
              {currentQ.passageTitle}
            </h2>
          )}
          <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "oklch(0.78 0.015 285)" }}>
            {currentPassage}
          </div>
        </div>
      )}

      {/* Questions panel */}
      <div className={`${currentPassage ? "w-1/2" : "w-full"} overflow-y-auto p-6 flex flex-col gap-6`}>
        {/* Progress */}
        <div className="flex items-center justify-between text-xs" style={{ color: "oklch(0.55 0.02 285)" }}>
          <span>Question {activeQ + 1} of {total}</span>
          <span>{answered} answered</span>
        </div>

        {/* Question navigator */}
        <div className="flex flex-wrap gap-1.5">
          {allQuestions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setActiveQ(i)}
              className="w-7 h-7 rounded-lg text-xs font-medium transition-all"
              style={{
                background: i === activeQ
                  ? "oklch(0.55 0.22 296)"
                  : answers[q.id]
                  ? "oklch(0.35 0.12 145)"
                  : "oklch(0.22 0.025 285)",
                color: i === activeQ || answers[q.id] ? "#fff" : "oklch(0.60 0.02 285)",
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Current question */}
        {currentQ && (
          <div className="space-y-4">
            <p className="text-sm font-medium leading-relaxed" style={{ color: "oklch(0.90 0.01 285)" }}>
              {currentQ.question_text}
            </p>
            {currentQ.question_type === "mcq" && currentQ.options && (
              <div className="space-y-2">
                {currentQ.options.map((opt, oi) => {
                  const letter = String.fromCharCode(65 + oi);
                  const selected = answers[currentQ.id] === letter;
                  return (
                    <button
                      key={oi}
                      onClick={() => onAnswer(currentQ.id, letter)}
                      className="w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-150"
                      style={{
                        background: selected ? "oklch(0.30 0.12 296)" : "oklch(0.20 0.02 285)",
                        borderColor: selected ? "oklch(0.55 0.22 296)" : "oklch(1 0 0 / 0.10)",
                        color: selected ? "#fff" : "oklch(0.80 0.015 285)",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
            {/* Previous / Next */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setActiveQ(i => Math.max(0, i - 1))}
                disabled={activeQ === 0}
                className="flex-1 py-2 rounded-xl text-xs font-medium border transition-colors disabled:opacity-40"
                style={{ borderColor: "oklch(1 0 0 / 0.12)", color: "oklch(0.65 0.02 285)" }}
              >
                ← Previous
              </button>
              <button
                onClick={() => setActiveQ(i => Math.min(total - 1, i + 1))}
                disabled={activeQ === total - 1}
                className="flex-1 py-2 rounded-xl text-xs font-medium border transition-colors disabled:opacity-40"
                style={{ borderColor: "oklch(1 0 0 / 0.12)", color: "oklch(0.65 0.02 285)" }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Listening section (TTS + questions)
// ─────────────────────────────────────────────────────────────────────────────

const ListeningSection = ({ sectionData, answers, onAnswer }) => {
  const [phase, setPhase] = useState("intro"); // intro | playing | questions
  const [passageIndex, setPassageIndex] = useState(0);
  const [activeQ, setActiveQ] = useState(0);
  const [ttsActive, setTtsActive] = useState(false);

  const passages = sectionData.passages || [];
  const currentPassage = passages[passageIndex];
  const questions = currentPassage?.questions || [];
  const total = passages.flatMap(p => p.questions || []).length;
  const answered = Object.keys(answers).length;

  const speakPassage = useCallback(() => {
    if (!currentPassage?.content) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(currentPassage.content);
    utter.rate = 0.92;
    utter.pitch = 1.0;
    utter.lang = "en-US";
    setTtsActive(true);
    utter.onend = () => { setTtsActive(false); setPhase("questions"); };
    utter.onerror = () => { setTtsActive(false); setPhase("questions"); };
    window.speechSynthesis.speak(utter);
  }, [currentPassage]);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="text-5xl">🎧</div>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: "oklch(0.92 0.01 285)" }}>
            Listening Section
          </h2>
          <p className="text-sm max-w-md" style={{ color: "oklch(0.60 0.02 285)" }}>
            You will hear {passages.length} audio recording{passages.length > 1 ? "s" : ""}.
            The audio will be read aloud using your browser's text-to-speech.
            Make sure your volume is on. Listen carefully — you can only play each recording once.
          </p>
          <p className="text-xs mt-3" style={{ color: "oklch(0.50 0.02 285)" }}>
            Tip: Use headphones for the best experience.
          </p>
        </div>
        <button
          onClick={() => setPhase("playing")}
          className="px-8 py-3 rounded-xl font-semibold text-sm"
          style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))", color: "#fff" }}
        >
          Begin Listening
        </button>
      </div>
    );
  }

  if (phase === "playing") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="text-5xl">{ttsActive ? "🔊" : "🎙️"}</div>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: "oklch(0.92 0.01 285)" }}>
            {currentPassage?.title || `Recording ${passageIndex + 1} of ${passages.length}`}
          </h2>
          {ttsActive ? (
            <div className="flex items-center justify-center gap-2 mt-4">
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="w-1.5 rounded-full"
                  style={{
                    height: 16 + Math.random() * 20,
                    background: "oklch(0.65 0.20 296)",
                    animation: `pulse ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
                  }}
                />
              ))}
              <style>{`@keyframes pulse { from { transform: scaleY(0.5); } to { transform: scaleY(1.2); } }`}</style>
            </div>
          ) : (
            <p className="text-sm mt-2" style={{ color: "oklch(0.60 0.02 285)" }}>
              Press play to hear the recording.
            </p>
          )}
        </div>
        {!ttsActive && (
          <button
            onClick={speakPassage}
            className="px-8 py-3 rounded-xl font-semibold text-sm flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))", color: "#fff" }}
          >
            ▶ Play Recording
          </button>
        )}
        {ttsActive && (
          <button
            onClick={() => { window.speechSynthesis.cancel(); setTtsActive(false); setPhase("questions"); }}
            className="px-6 py-2 rounded-xl text-xs border"
            style={{ borderColor: "oklch(1 0 0 / 0.15)", color: "oklch(0.60 0.02 285)" }}
          >
            Skip to Questions
          </button>
        )}
      </div>
    );
  }

  // Questions phase
  const currentQ = questions[activeQ];
  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 gap-5">
      <div className="flex items-center justify-between text-xs" style={{ color: "oklch(0.55 0.02 285)" }}>
        <span>{currentPassage?.title}</span>
        <span>{Object.keys(answers).length}/{total} answered</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setActiveQ(i)}
            className="w-7 h-7 rounded-lg text-xs font-medium"
            style={{
              background: i === activeQ ? "oklch(0.55 0.22 296)" : answers[q.id] ? "oklch(0.35 0.12 145)" : "oklch(0.22 0.025 285)",
              color: i === activeQ || answers[q.id] ? "#fff" : "oklch(0.60 0.02 285)",
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {currentQ && (
        <div className="space-y-4">
          <p className="text-sm font-medium leading-relaxed" style={{ color: "oklch(0.90 0.01 285)" }}>
            {currentQ.question_text}
          </p>
          {currentQ.options && (
            <div className="space-y-2">
              {currentQ.options.map((opt, oi) => {
                const letter = String.fromCharCode(65 + oi);
                const selected = answers[currentQ.id] === letter;
                return (
                  <button
                    key={oi}
                    onClick={() => onAnswer(currentQ.id, letter)}
                    className="w-full text-left px-4 py-3 rounded-xl border text-sm transition-all"
                    style={{
                      background: selected ? "oklch(0.30 0.12 296)" : "oklch(0.20 0.02 285)",
                      borderColor: selected ? "oklch(0.55 0.22 296)" : "oklch(1 0 0 / 0.10)",
                      color: selected ? "#fff" : "oklch(0.80 0.015 285)",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setActiveQ(i => Math.max(0, i - 1))}
              disabled={activeQ === 0}
              className="flex-1 py-2 rounded-xl text-xs font-medium border disabled:opacity-40"
              style={{ borderColor: "oklch(1 0 0 / 0.12)", color: "oklch(0.65 0.02 285)" }}
            >← Prev</button>
            {activeQ < questions.length - 1 ? (
              <button
                onClick={() => setActiveQ(i => i + 1)}
                className="flex-1 py-2 rounded-xl text-xs font-medium border"
                style={{ borderColor: "oklch(1 0 0 / 0.12)", color: "oklch(0.65 0.02 285)" }}
              >Next →</button>
            ) : passageIndex < passages.length - 1 ? (
              <button
                onClick={() => { setPassageIndex(i => i + 1); setActiveQ(0); setPhase("playing"); }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold"
                style={{ background: "oklch(0.45 0.20 264)", color: "#fff" }}
              >Next Recording →</button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Writing section
// ─────────────────────────────────────────────────────────────────────────────

const WritingSection = ({ sectionData, answers, onAnswer }) => {
  const questions = [
    ...(sectionData.passages || []).flatMap(p => p.questions || []),
    ...(sectionData.questions || []),
  ];
  const [activeTask, setActiveTask] = useState(0);
  const currentQ = questions[activeTask];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Task tabs */}
      <div className="flex gap-2 px-6 pt-4 shrink-0">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setActiveTask(i)}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: i === activeTask ? "oklch(0.55 0.22 296)" : "oklch(0.22 0.025 285)",
              color: i === activeTask ? "#fff" : "oklch(0.65 0.02 285)",
            }}
          >
            Task {i + 1}
            {answers[q.id] && (
              <span className="ml-1.5 opacity-70">({wordCount(answers[q.id] || "")}w)</span>
            )}
          </button>
        ))}
      </div>

      {currentQ && (
        <div className="flex-1 flex flex-col gap-0 overflow-hidden px-6 py-4">
          <div className="flex gap-4 h-full">
            {/* Task prompt */}
            <div
              className="w-2/5 overflow-y-auto p-4 rounded-xl border text-xs leading-relaxed shrink-0"
              style={{
                background: "oklch(0.19 0.022 285)",
                borderColor: "oklch(1 0 0 / 0.08)",
                color: "oklch(0.75 0.015 285)",
                whiteSpace: "pre-line",
              }}
            >
              {currentQ.question_text}
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col">
              <textarea
                value={answers[currentQ.id] || ""}
                onChange={e => onAnswer(currentQ.id, e.target.value)}
                placeholder="Write your response here…"
                className="flex-1 resize-none rounded-xl border p-4 text-sm leading-relaxed outline-none transition-colors"
                style={{
                  background: "oklch(0.19 0.022 285)",
                  borderColor: "oklch(1 0 0 / 0.10)",
                  color: "oklch(0.88 0.01 285)",
                }}
                spellCheck
              />
              <div
                className="text-xs mt-2 text-right"
                style={{ color: wordCount(answers[currentQ.id] || "") < 100 ? "oklch(0.60 0.18 25)" : "oklch(0.55 0.02 285)" }}
              >
                {wordCount(answers[currentQ.id] || "")} words
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Speaking section
// ─────────────────────────────────────────────────────────────────────────────

const SpeakingSection = ({ sectionData, answers, onAnswer }) => {
  const questions = [
    ...(sectionData.passages || []).flatMap(p => p.questions || []),
    ...(sectionData.questions || []),
  ];
  const [activeTask, setActiveTask] = useState(0);
  const [prepPhase, setPrepPhase] = useState(true); // true=prep, false=responding
  const [prepTime, setPrepTime] = useState(30);
  const timerRef = useRef(null);

  const currentQ = questions[activeTask];

  const startResponse = useCallback(() => {
    clearInterval(timerRef.current);
    setPrepPhase(false);
  }, []);

  useEffect(() => {
    setPrepPhase(true);
    setPrepTime(activeTask === 0 ? 15 : 30);
    clearInterval(timerRef.current);
  }, [activeTask]);

  useEffect(() => {
    if (!prepPhase) return;
    timerRef.current = setInterval(() => {
      setPrepTime(t => {
        if (t <= 1) { clearInterval(timerRef.current); setPrepPhase(false); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [prepPhase, activeTask]);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 gap-5">
      {/* Task tabs */}
      <div className="flex gap-2 shrink-0">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setActiveTask(i)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: i === activeTask ? "oklch(0.55 0.22 296)" : "oklch(0.22 0.025 285)",
              color: i === activeTask ? "#fff" : "oklch(0.65 0.02 285)",
            }}
          >
            Task {i + 1}
          </button>
        ))}
      </div>

      {currentQ && (
        <div className="space-y-4">
          {/* Prompt */}
          <div
            className="p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-line"
            style={{ background: "oklch(0.19 0.022 285)", borderColor: "oklch(1 0 0 / 0.08)", color: "oklch(0.78 0.015 285)" }}
          >
            {currentQ.question_text}
          </div>

          {/* Prep / response state */}
          {prepPhase ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="text-4xl font-bold font-mono" style={{ color: "oklch(0.70 0.20 50)" }}>
                {prepTime}s
              </div>
              <div className="text-xs" style={{ color: "oklch(0.55 0.02 285)" }}>
                Preparation time — organise your ideas
              </div>
              <button
                onClick={startResponse}
                className="px-6 py-2 rounded-xl text-xs font-medium border"
                style={{ borderColor: "oklch(1 0 0 / 0.15)", color: "oklch(0.65 0.02 285)" }}
              >
                Skip prep — start responding
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-medium" style={{ color: "oklch(0.65 0.22 145)" }}>
                ✍️ Write your spoken response below (or speak your answer aloud while typing key points)
              </div>
              <textarea
                value={answers[currentQ.id] || ""}
                onChange={e => onAnswer(currentQ.id, e.target.value)}
                placeholder="Type your spoken response here. Include your main points, examples, and conclusion…"
                rows={6}
                className="w-full resize-none rounded-xl border p-4 text-sm leading-relaxed outline-none"
                style={{
                  background: "oklch(0.19 0.022 285)",
                  borderColor: "oklch(1 0 0 / 0.10)",
                  color: "oklch(0.88 0.01 285)",
                }}
              />
              <div className="flex justify-between text-xs" style={{ color: "oklch(0.55 0.02 285)" }}>
                <span>{wordCount(answers[currentQ.id] || "")} words</span>
                {activeTask < questions.length - 1 && (
                  <button
                    onClick={() => setActiveTask(i => i + 1)}
                    className="font-medium"
                    style={{ color: "oklch(0.65 0.20 296)" }}
                  >
                    Next task →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Intro screen
// ─────────────────────────────────────────────────────────────────────────────

const IntroScreen = ({ examMeta, onStart }) => (
  <div className="flex flex-col items-center justify-center h-full gap-8 p-8 max-w-2xl mx-auto text-center">
    <div>
      <div className="text-5xl mb-4">📝</div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: "oklch(0.92 0.01 285)" }}>
        {examMeta.name}
      </h1>
      <p className="text-sm" style={{ color: "oklch(0.60 0.02 285)" }}>
        {examMeta.description}
      </p>
    </div>
    <div className="grid grid-cols-2 gap-4 w-full text-sm">
      {(examMeta.sections || []).map(s => (
        <div
          key={s.id}
          className="p-4 rounded-xl border text-left"
          style={{ background: "oklch(0.19 0.022 285)", borderColor: "oklch(1 0 0 / 0.08)" }}
        >
          <div className="font-semibold mb-1" style={{ color: "oklch(0.88 0.01 285)" }}>{s.label}</div>
          <div className="text-xs" style={{ color: "oklch(0.55 0.02 285)" }}>{s.duration} minutes</div>
        </div>
      ))}
    </div>
    <div className="text-xs space-y-1.5 text-left w-full" style={{ color: "oklch(0.55 0.02 285)" }}>
      <div>⏱ Each section is independently timed — it will auto-submit when time expires.</div>
      <div>🔇 You cannot return to a previous section once submitted.</div>
      <div>📶 Ensure you have a stable internet connection before starting.</div>
    </div>
    <button
      onClick={onStart}
      className="px-10 py-3.5 rounded-xl font-bold text-base"
      style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))", color: "#fff" }}
    >
      Begin Exam →
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Between sections screen
// ─────────────────────────────────────────────────────────────────────────────

const BetweenSections = ({ nextSection, onContinue }) => (
  <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
    <div className="text-4xl">✅</div>
    <div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "oklch(0.92 0.01 285)" }}>
        Section Complete
      </h2>
      <p className="text-sm" style={{ color: "oklch(0.60 0.02 285)" }}>
        Take a short break if needed. When you're ready, proceed to the next section.
      </p>
      {nextSection && (
        <p className="text-sm mt-3 font-medium" style={{ color: "oklch(0.75 0.02 285)" }}>
          Next: {nextSection.label} ({nextSection.duration} min)
        </p>
      )}
    </div>
    <button
      onClick={onContinue}
      className="px-8 py-3 rounded-xl font-semibold text-sm"
      style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 296), oklch(0.50 0.20 264))", color: "#fff" }}
    >
      Continue →
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main ExamSession component
// ─────────────────────────────────────────────────────────────────────────────

export default function ExamSession() {
  const { examType } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState("loading"); // loading | intro | section | between | finishing | done
  const [examContent, setExamContent] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState({});     // per-section answers reset on section change
  const [allAnswers, setAllAnswers] = useState({}); // permanent store per section
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [completedSections, setCompletedSections] = useState(new Set());
  const [error, setError] = useState(null);
  const [submittingSection, setSubmittingSection] = useState(false);

  const timerRef = useRef(null);

  // Load exam content
  useEffect(() => {
    api.get(`/simulators/exams/${examType}/content`)
      .then(r => {
        setExamContent(r.data);
        setPhase("intro");
      })
      .catch(() => setError("Failed to load exam content. Please try again."));
  }, [examType]);

  const sections = examContent?.meta?.sections || [];
  const currentSection = sections[sectionIndex];

  // Start attempt when user clicks Begin
  const handleStart = async () => {
    try {
      const r = await api.post("/simulators/attempts", { exam_type: examType });
      setAttemptId(r.data.id);
      setPhase("section");
      startSectionTimer(sections[0]?.duration || 30);
    } catch {
      setError("Failed to start exam. Please try again.");
    }
  };

  const startSectionTimer = (durationMins) => {
    clearInterval(timerRef.current);
    const secs = durationMins * 60;
    setTimeLeft(secs);
    setTotalTime(secs);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmitSection(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleAnswer = useCallback((questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const handleSubmitSection = useCallback(async (autoSubmit = false) => {
    if (submittingSection) return;
    clearInterval(timerRef.current);
    setSubmittingSection(true);

    const sectionId = currentSection?.id;
    const currentAnswers = answers;
    setAllAnswers(prev => ({ ...prev, [sectionId]: currentAnswers }));

    try {
      await api.post(`/simulators/attempts/${attemptId}/sections/${sectionId}`, {
        answers: currentAnswers,
        time_spent: (totalTime - timeLeft),
      });
    } catch (e) {
      console.error("Section submit error:", e);
    }

    setCompletedSections(prev => new Set([...prev, sectionId]));
    setAnswers({});
    setSubmittingSection(false);

    if (sectionIndex < sections.length - 1) {
      setSectionIndex(i => i + 1);
      setPhase("between");
    } else {
      setPhase("finishing");
      try {
        await api.post(`/simulators/attempts/${attemptId}/complete`);
      } catch (e) {
        console.error("Complete error:", e);
      }
      navigate(`/simulators/results/${attemptId}`, { replace: true });
    }
  }, [submittingSection, currentSection, answers, allAnswers, attemptId, sectionIndex, sections, timeLeft, totalTime, navigate]);

  const handleContinue = () => {
    setPhase("section");
    startSectionTimer(sections[sectionIndex]?.duration || 30);
  };

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "oklch(0.13 0.018 285)" }}>
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 rounded-full mx-auto animate-spin" style={{ borderColor: "oklch(0.55 0.22 296)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "oklch(0.60 0.02 285)" }}>Loading exam…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "oklch(0.13 0.018 285)" }}>
        <div className="text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <p className="text-sm" style={{ color: "oklch(0.70 0.02 285)" }}>{error}</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 rounded-xl text-sm" style={{ background: "oklch(0.25 0.04 285)", color: "oklch(0.80 0.02 285)" }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (phase === "finishing") {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "oklch(0.13 0.018 285)" }}>
        <div className="text-center space-y-4">
          <div className="text-5xl">🎉</div>
          <h2 className="text-xl font-bold" style={{ color: "oklch(0.92 0.01 285)" }}>Exam Complete!</h2>
          <p className="text-sm" style={{ color: "oklch(0.60 0.02 285)" }}>Generating your score report…</p>
          <div className="w-8 h-8 border-2 rounded-full mx-auto animate-spin" style={{ borderColor: "oklch(0.55 0.22 296)", borderTopColor: "transparent" }} />
        </div>
      </div>
    );
  }

  const sectionData = examContent?.sections?.[currentSection?.id] || {};

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "oklch(0.13 0.018 285)" }}
    >
      {/* Top bar */}
      <div
        className="shrink-0 flex items-center justify-between px-6 h-14 border-b"
        style={{ background: "oklch(0.15 0.02 285)", borderColor: "oklch(1 0 0 / 0.08)" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/simulators")}
            className="text-xs px-3 py-1.5 rounded-lg border"
            style={{ borderColor: "oklch(1 0 0 / 0.12)", color: "oklch(0.60 0.02 285)" }}
          >
            ✕ Exit
          </button>
          <span className="text-sm font-bold" style={{ color: "oklch(0.90 0.01 285)" }}>
            {examContent?.meta?.name}
          </span>
        </div>

        {phase === "section" && (
          <div className="flex items-center gap-6">
            <ProgressDots sections={sections} currentIndex={sectionIndex} completedSections={completedSections} />
            <div className="text-xs" style={{ color: "oklch(0.55 0.02 285)" }}>
              {currentSection?.label}
            </div>
            <Timer secondsLeft={timeLeft} totalSeconds={totalTime} />
          </div>
        )}

        {phase === "section" && (
          <button
            onClick={() => handleSubmitSection(false)}
            disabled={submittingSection}
            className="text-xs px-4 py-1.5 rounded-lg font-medium disabled:opacity-50"
            style={{ background: "oklch(0.45 0.20 264)", color: "#fff" }}
          >
            {submittingSection ? "Saving…" : sectionIndex < sections.length - 1 ? "Submit & Next →" : "Submit & Finish"}
          </button>
        )}
      </div>

      {/* Section label strip */}
      {phase === "section" && (
        <div
          className="shrink-0 px-6 py-2 border-b text-xs font-medium"
          style={{ background: "oklch(0.16 0.02 285)", borderColor: "oklch(1 0 0 / 0.06)", color: "oklch(0.65 0.18 296)" }}
        >
          Section {sectionIndex + 1} of {sections.length}: {currentSection?.label}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {phase === "intro" && (
          <IntroScreen examMeta={examContent?.meta} onStart={handleStart} />
        )}
        {phase === "between" && (
          <BetweenSections
            nextSection={sections[sectionIndex]}
            onContinue={handleContinue}
          />
        )}
        {phase === "section" && currentSection && (
          <>
            {currentSection.type === "mcq_passage" && (
              <ReadingSection sectionData={sectionData} answers={answers} onAnswer={handleAnswer} />
            )}
            {currentSection.type === "listening_mcq" && (
              <ListeningSection sectionData={sectionData} answers={answers} onAnswer={handleAnswer} />
            )}
            {currentSection.type === "writing" && (
              <WritingSection sectionData={sectionData} answers={answers} onAnswer={handleAnswer} />
            )}
            {currentSection.type === "speaking" && (
              <SpeakingSection sectionData={sectionData} answers={answers} onAnswer={handleAnswer} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
