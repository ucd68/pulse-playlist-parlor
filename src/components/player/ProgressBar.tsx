import { useEffect, useRef, useState } from "react";

import { SeekSlider } from "@/components/player/SeekSlider";
import { usePlayer } from "@/context/player";
import { formatTime } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Polls the player for the current position so the rest of the UI doesn't re-render every tick. */
export function usePlaybackProgress() {
  const { current, isPlaying, getCurrentTime, getDuration } = usePlayer();
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setTime(0);
    setDuration(current?.duration ?? 0);
  }, [current?.id, current?.duration]);

  useEffect(() => {
    const tick = () => {
      setTime(getCurrentTime());
      const d = getDuration();
      if (d > 0) setDuration(d);
    };
    tick();
    if (!isPlaying) return;
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [isPlaying, getCurrentTime, getDuration, current?.id]);

  return { time, duration };
}

export function ProgressBar({ className }: { className?: string }) {
  const { seek, current } = usePlayer();
  const { time, duration } = usePlaybackProgress();
  const [dragValue, setDragValue] = useState<number | null>(null);
  const dragging = useRef(false);

  const shown = dragValue ?? time;

  return (
    <div className={cn("flex w-full items-center gap-2 text-[11px] text-muted-foreground tabular-nums", className)}>
      <span className="w-10 text-right">{formatTime(shown)}</span>
      <SeekSlider
        label="Seek"
        value={shown}
        max={duration}
        onChange={(v) => {
          if (!current) return;
          dragging.current = true;
          setDragValue(v);
        }}
        onCommit={(v) => {
          dragging.current = false;
          setDragValue(null);
          seek(v);
        }}
      />
      <span className="w-10">{formatTime(duration)}</span>
    </div>
  );
}

/** Hairline progress indicator for the mobile mini player. */
export function MiniProgress() {
  const { time, duration } = usePlaybackProgress();
  const pct = duration > 0 ? Math.min(100, (time / duration) * 100) : 0;
  return (
    <div className="absolute inset-x-2 bottom-0 h-[2px] overflow-hidden rounded-full bg-foreground/15">
      <div className="h-full bg-foreground transition-[width] duration-200" style={{ width: `${pct}%` }} />
    </div>
  );
}
