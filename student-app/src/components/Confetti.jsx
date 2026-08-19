const CONFETTI_COLORS = ["var(--accent)", "var(--accent-light)", "var(--good)", "var(--warn)", "#ec4899"];

/* Lightweight confetti burst — no external assets/libraries. Drop inside any
   relatively-positioned container to celebrate a milestone. */
const Confetti = ({ count = 24 }) => (
  <div className="absolute inset-x-0 top-0 h-0 overflow-visible pointer-events-none" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <span
        key={i}
        className="confetti-piece"
        style={{
          left: `${4 + (i * 4) % 96}%`,
          width: 6, height: 6,
          borderRadius: i % 3 === 0 ? "50%" : 2,
          background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          animationDelay: `${(i % 6) * 60}ms`,
        }}
      />
    ))}
  </div>
);

export default Confetti;
