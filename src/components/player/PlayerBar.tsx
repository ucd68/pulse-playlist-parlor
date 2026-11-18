import { Link } from "@tanstack/react-router";
import { ListMusic, MonitorPlay, Pause, Play } from "lucide-react";
import { useState } from "react";

import { Artwork } from "@/components/music/Artwork";
import { LikeButton } from "@/components/music/LikeButton";
import { DiscordButton } from "@/components/player/DiscordButton";
import { Controls } from "@/components/player/Controls";
import { NowPlayingMobile } from "@/components/player/NowPlayingMobile";
import { MiniProgress, ProgressBar } from "@/components/player/ProgressBar";
import { VolumeControl } from "@/components/player/VolumeControl";
import { usePlayer } from "@/context/player";
import { cn } from "@/lib/utils";

export function PlayerBar() {
  const { current, isPlaying, togglePlay, showVideo, setShowVideo } = usePlayer();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Desktop */}
      <div className="hidden h-[84px] grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)] items-center gap-4 px-3 md:grid">
        <div className="flex min-w-0 items-center gap-3">
          {current ? (
            <>
              <Artwork track={current} className="h-14 w-14 shadow-elevated" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{current.title}</p>
                <p className="truncate text-xs text-muted-foreground">{current.artist}</p>
              </div>
              <LikeButton track={current} className="shrink-0" />
            </>
          ) : (
            <p className="px-2 text-sm text-muted-foreground">Pick a song to start listening</p>
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <Controls />
          <ProgressBar className="max-w-[640px]" />
        </div>

        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setShowVideo(!showVideo)}
            disabled={!current}
            aria-label={showVideo ? "Hide video" : "Show video"}
            aria-pressed={showVideo}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:text-foreground disabled:opacity-40",
              showVideo && "text-primary hover:text-primary",
            )}
          >
            <MonitorPlay className="h-4 w-4" />
          </button>
          <Link
            to="/queue"
            aria-label="Queue"
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:text-foreground"
            activeProps={{ className: "text-primary hover:text-primary" }}
          >
            <ListMusic className="h-4 w-4" />
          </Link>
          <DiscordButton />
          <VolumeControl />
        </div>
      </div>

      {/* Mobile mini player */}
      {current && (
        <div className="px-2 pb-1 md:hidden">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setExpanded(true)}
            onKeyDown={(e) => e.key === "Enter" && setExpanded(true)}
            className="relative flex items-center gap-3 rounded-lg bg-surface p-2 pr-3 shadow-elevated"
          >
            <Artwork track={current} className="h-10 w-10" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{current.title}</p>
              <p className="truncate text-xs text-muted-foreground">{current.artist}</p>
            </div>
            <LikeButton track={current} />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="grid h-9 w-9 place-items-center text-foreground"
            >
              {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
            </button>
            <MiniProgress />
          </div>
        </div>
      )}
      <NowPlayingMobile open={expanded} onClose={() => setExpanded(false)} />
    </>
  );
}
