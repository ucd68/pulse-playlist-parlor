import { cn } from "@/lib/utils";

export function EqBars({ paused, className }: { paused?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex h-3.5 items-end gap-[2px]", className)} aria-label="Now playing">
      {[0, 0.25, 0.5].map((delay) => (
        <span
          key={delay}
          className="eq-bar h-full w-[3px] rounded-sm bg-primary"
          style={{ animationDelay: `${delay}s`, animationPlayState: paused ? "paused" : "running" }}
        />
      ))}
    </span>
  );
}
