/**
 * Dark photo hero banner — consistent across all pages.
 * Usage: <PageHero photo={URL} title="..." subtitle="..." />
 */
export default function PageHero({ photo, title, subtitle, height = 220, children }) {
  return (
    <div style={{ position: "relative", height, overflow: "hidden", flexShrink: 0 }}>
      <img
        src={photo}
        alt=""
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center 30%",
          filter: "brightness(0.38)",
        }}
      />
      {/* gradient fade to page bg */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, oklch(0.13 0.018 285 / 0.2) 0%, oklch(0.13 0.018 285) 100%)",
      }} />
      {/* left-side content */}
      <div style={{
        position: "relative", height: "100%",
        display: "flex", flexDirection: "column",
        justifyContent: "flex-end", padding: "0 32px 28px",
      }}>
        {title && <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0 }}>{title}</h1>}
        {subtitle && <p style={{ fontSize: 14, color: "oklch(0.78 0.01 285)", marginTop: 6, marginBottom: 0 }}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
