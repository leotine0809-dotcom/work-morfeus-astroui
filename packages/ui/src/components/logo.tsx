// Logo — the astro-family brand mark (the "A" glyph). Inline SVG with
// fill="currentColor", so it's theme-aware for free: place it in a
// text-foreground context and it's the white mark in dark, the black mark in
// light — no two-asset swap. This is the shared fleet logo (astrobot/astrochat
// use the same mark); the app shows it ALONE in the rail header — no app-name
// text beside it.
// `viewBox` defaults to the tight crop the rail header uses. A caller that wants
// the mark with its original padding (astrochat sized it via className, not the
// `size` prop) passes viewBox="0 0 250 250" — same polygons, more breathing room.
export function Logo({ size = 22, viewBox = "41 21 168 208", className }: { size?: number; viewBox?: string; className?: string }) {
  return (
    <svg
      role="img"
      aria-label="astro"
      width={size}
      height={size}
      viewBox={viewBox}
      className={className}
      fill="currentColor"
    >
      <polygon points="125.1041,138.4606 141.7366,179.5504 125.1041,220.6402 108.4716,179.5504" />
      <polygon points="104.1497,29.3598 136.075,29.3598 81.1945,180.1429 49.2691,180.1429" />
      <polygon points="113.925,29.3598 145.8503,29.3598 200.7309,180.1429 168.8055,180.1429" />
    </svg>
  )
}
