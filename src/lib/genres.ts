/** Mood / genre tiles; each runs a YouTube search. Class names are literal so Tailwind keeps them. */
export const GENRES = [
  { label: "Pop hits", query: "pop hits 2026 official audio", className: "bg-tile-1" },
  { label: "Hip-hop", query: "hip hop hits official audio", className: "bg-tile-2" },
  { label: "Chill lofi", query: "lofi chill beats", className: "bg-tile-3" },
  { label: "Workout", query: "workout gym music mix", className: "bg-tile-4" },
  { label: "Bollywood", query: "bollywood hits official audio", className: "bg-tile-5" },
  { label: "Indie", query: "indie rock essentials", className: "bg-tile-6" },
  { label: "K-pop", query: "kpop hits official mv", className: "bg-tile-7" },
  { label: "Acoustic", query: "acoustic covers relaxing", className: "bg-tile-8" },
] as const;

/** YouTube's public "Top 100 Songs Global" chart playlist. */
export const TRENDING_PLAYLIST_ID = "PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i";
