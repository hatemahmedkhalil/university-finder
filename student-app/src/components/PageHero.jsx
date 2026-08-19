/**
 * Premium photo hero banner — consistent across all pages.
 * The photo is always darkened enough that white text stays legible in both
 * themes, and the bottom fade always resolves to the current page background
 * (var(--bg)) so there's no seam between the banner and the page below.
 * Usage: <PageHero photo={URL} title="..." subtitle="..." />
 */
export default function PageHero({ photo, title, subtitle, height = 240, children }) {
  return (
    <div className="relative shrink-0 overflow-hidden" style={{ height }}>
      <img
        src={photo}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: "center 30%", filter: "brightness(0.42) saturate(1.05)" }}
        loading="lazy"
      />
      {/* gradient fade to the current page background, in either theme */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(6,9,15,0.15) 0%, var(--bg) 96%)" }}
      />
      {/* subtle top scrim so the topbar/back controls stay legible */}
      <div
        className="absolute inset-x-0 top-0 h-16 pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(6,9,15,0.35), transparent)" }}
      />
      <div className="relative h-full flex flex-col justify-end px-6 sm:px-8 pb-7">
        {title && (
          <h1 className="text-[26px] sm:text-[30px] font-extrabold leading-tight" style={{ color: "#fff" }}>
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-sm mt-1.5 max-w-xl" style={{ color: "rgba(255,255,255,0.78)" }}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
