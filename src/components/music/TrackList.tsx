import { Clock3, Play } from "lucide-react";

import { Artwork } from "@/components/music/Artwork";
import { EqBars } from "@/components/music/EqBars";
import { LikeButton } from "@/components/music/LikeButton";
import { TrackMenu } from "@/components/music/TrackMenu";
import { usePlayer } from "@/context/player";
import { formatTime, type Track } from "@/lib/types";
import { cn } from "@/lib/utils";

type TrackListProps = {
  tracks: Track[];
  /** Called instead of the default "play this list from here". */
  onPlay?: (index: number) => void;
  onRemove?: (track: Track, index: number) => void;
  removeLabel?: string;
  showHeader?: boolean;
};

export function TrackList({ tracks, onPlay, onRemove, removeLabel, showHeader = true }: TrackListProps) {
  const { current, isPlaying, playTracks, togglePlay } = usePlayer();

  return (
    <div role="list">
      {showHeader && (
        <div className="mb-2 hidden grid-cols-[2rem_minmax(0,1fr)_2rem_3.5rem_2rem] items-center gap-4 border-b border-border px-4 pb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase md:grid">
          <span className="text-center">#</span>
          <span>Title</span>
          <span />
          <Clock3 className="ml-auto h-4 w-4" />
          <span />
        </div>
      )}
      {tracks.map((track, i) => {
        const active = current?.id === track.id;
        const handlePlay = () => {
          if (active) togglePlay();
          else if (onPlay) onPlay(i);
          else playTracks(tracks, i);
        };
        return (
          <div
            role="listitem"
            key={`${track.id}-${i}`}
            onClick={handlePlay}
            className={cn(
              "group grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-hover md:grid-cols-[2rem_minmax(0,1fr)_2rem_3.5rem_2rem] md:gap-4 md:px-4",
              active && "bg-surface",
            )}
          >
            <div className="relative hidden h-8 items-center justify-center text-sm text-muted-foreground tabular-nums md:flex">
              {active && isPlaying ? (
                <EqBars className="group-hover:hidden" />
              ) : (
                <span className={cn("group-hover:hidden", active && "text-primary")}>{i + 1}</span>
              )}
              <Play className="hidden h-4 w-4 fill-current text-foreground group-hover:block" />
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <Artwork track={track} className="h-11 w-11" />
              <div className="min-w-0">
                <p className={cn("truncate font-medium", active ? "text-primary" : "text-foreground")}>
                  {track.title}
                </p>
                <p className="truncate text-sm text-muted-foreground">{track.artist}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 md:contents">
              <LikeButton
                track={track}
                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 [&[aria-pressed=true]]:opacity-100"
              />
              <span className="hidden text-right text-sm text-muted-foreground tabular-nums md:block">
                {track.duration ? formatTime(track.duration) : "LIVE"}
              </span>
              <TrackMenu
                track={track}
                onRemove={onRemove ? () => onRemove(track, i) : undefined}
                removeLabel={removeLabel}
                className="md:opacity-0 md:group-hover:opacity-100 md:data-[state=open]:opacity-100"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
