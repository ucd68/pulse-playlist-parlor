import { Pause, Play } from "lucide-react";
import type { ReactNode } from "react";

import { Artwork } from "@/components/music/Artwork";
import { usePlayer } from "@/context/player";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PlayFab({
  playing,
  onClick,
  className,
  size = "md",
  label,
}: {
  playing: boolean;
  onClick: () => void;
  className?: string;
  size?: "md" | "lg";
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label ?? (playing ? "Pause" : "Play")}
      className={cn(
        "grid place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95",
        size === "lg" ? "h-14 w-14" : "h-11 w-11",
        className,
      )}
    >
      {playing ? (
        <Pause className={cn("fill-current", size === "lg" ? "h-6 w-6" : "h-5 w-5")} />
      ) : (
        <Play className={cn("translate-x-[1px] fill-current", size === "lg" ? "h-6 w-6" : "h-5 w-5")} />
      )}
    </button>
  );
}

/** Spotify-style square card. `tracks` + `index` define what plays when clicked. */
export function TrackCard({ tracks, index }: { tracks: Track[]; index: number }) {
  const { current, isPlaying, playTracks, togglePlay } = usePlayer();
  const track = tracks[index];
  const active = current?.id === track.id;
  const play = () => (active ? togglePlay() : playTracks(tracks, index));

  return (
    <MediaCard
      onClick={play}
      art={<Artwork track={track} className="w-full rounded-lg shadow-elevated" />}
      title={track.title}
      subtitle={track.artist}
      active={active}
      fab={<PlayFab playing={active && isPlaying} onClick={play} />}
    />
  );
}

export function MediaCard({
  art,
  title,
  subtitle,
  onClick,
  fab,
  active,
}: {
  art: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  fab?: ReactNode;
  active?: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="group w-36 shrink-0 cursor-pointer rounded-xl p-2.5 transition-colors hover:bg-surface-hover sm:w-44 md:w-auto"
    >
      <div className="relative">
        {art}
        {fab && (
          <div
            className={cn(
              "absolute right-2 bottom-2 translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100",
              active && "translate-y-0 opacity-100",
            )}
          >
            {fab}
          </div>
        )}
      </div>
      <p className={cn("mt-3 line-clamp-1 font-semibold", active && "text-primary")}>{title}</p>
      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
