import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-2 py-1" aria-label="Pulse home">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary shadow-glow">
        <span className="flex h-4 items-end gap-[3px]">
          {[0.55, 1, 0.75].map((h, i) => (
            <span key={i} className="w-[3px] rounded-full bg-primary-foreground" style={{ height: `${h * 100}%` }} />
          ))}
        </span>
      </span>
      <span className="font-display text-2xl font-extrabold tracking-tight">Pulse</span>
    </Link>
  );
}
