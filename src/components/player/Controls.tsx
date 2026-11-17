import { Loader2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";

import { usePlayer } from "@/context/player";
import { cn } from "@/lib/utils";

const iconBtn =
  "relative grid place-items-center rounded-full text-muted-foreground transition hover:text-foreground active:scale-95 disabled:opacity-40 disabled:hover:text-muted-foreground";

function ActiveDot({ on }: { on: boolean }) {
  return on ? <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" /> : null;
}

export function Controls({ size = "md" }: { size?: "md" | "lg" }) {
  const { current, isPlaying, isBuffering, shuffle, repeat, togglePlay, next, previous, toggleShuffle, cycleRepeat } =
    usePlayer();
  const lg = size === "lg";
  const disabled = !current;
  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  return (
    <div className={cn("flex items-center", lg ? "w-full justify-between" : "gap-5")}>
      <button
        type="button"
        onClick={toggleShuffle}
        aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}
        aria-pressed={shuffle}
        className={cn(iconBtn, lg ? "h-10 w-10" : "h-8 w-8", shuffle && "text-primary hover:text-primary")}
      >
        <Shuffle className={lg ? "h-6 w-6" : "h-4 w-4"} />
        <ActiveDot on={shuffle} />
      </button>
      <button
        type="button"
        onClick={previous}
        disabled={disabled}
        aria-label="Previous"
        className={cn(iconBtn, lg ? "h-12 w-12" : "h-8 w-8")}
      >
        <SkipBack className={cn("fill-current", lg ? "h-8 w-8" : "h-5 w-5")} />
      </button>
      <button
        type="button"
        onClick={togglePlay}
        disabled={disabled}
        aria-label={isPlaying ? "Pause" : "Play"}
        className={cn(
          "grid place-items-center rounded-full bg-foreground text-background transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
          lg ? "h-16 w-16" : "h-9 w-9",
        )}
      >
        {isBuffering && isPlaying ? (
          <Loader2 className={cn("animate-spin", lg ? "h-7 w-7" : "h-4 w-4")} />
        ) : isPlaying ? (
          <Pause className={cn("fill-current", lg ? "h-7 w-7" : "h-4 w-4")} />
        ) : (
          <Play className={cn("translate-x-[1px] fill-current", lg ? "h-7 w-7" : "h-4 w-4")} />
        )}
      </button>
      <button
        type="button"
        onClick={next}
        disabled={disabled}
        aria-label="Next"
        className={cn(iconBtn, lg ? "h-12 w-12" : "h-8 w-8")}
      >
        <SkipForward className={cn("fill-current", lg ? "h-8 w-8" : "h-5 w-5")} />
      </button>
      <button
        type="button"
        onClick={cycleRepeat}
        aria-label={`Repeat: ${repeat}`}
        aria-pressed={repeat !== "off"}
        className={cn(iconBtn, lg ? "h-10 w-10" : "h-8 w-8", repeat !== "off" && "text-primary hover:text-primary")}
      >
        <RepeatIcon className={lg ? "h-6 w-6" : "h-4 w-4"} />
        <ActiveDot on={repeat !== "off"} />
      </button>
    </div>
  );
}
