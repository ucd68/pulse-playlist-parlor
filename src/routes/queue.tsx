import { createFileRoute, Link } from "@tanstack/react-router";
import { X } from "lucide-react";

import { Artwork } from "@/components/music/Artwork";
import { EqBars } from "@/components/music/EqBars";
import { LikeButton } from "@/components/music/LikeButton";
import { usePlayer } from "@/context/player";
import { formatTime } from "@/lib/types";

export const Route = createFileRoute("/queue")({
  head: () => ({
    meta: [
      { title: "Queue — Pulse" },
      { name: "description", content: "See what's playing now and what's coming up next on Pulse." },
      { property: "og:title", content: "Queue — Pulse" },
      { property: "og:description", content: "What's playing now and what's up next." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QueuePage,
});

function QueuePage() {
  const { current, queue, index, isPlaying, jumpTo, removeFromQueue, clearQueue, togglePlay } = usePlayer();
  const upNext = queue.slice(index + 1);

  return (
    <div className="min-h-full bg-gradient-hero px-4 pt-6 pb-12 md:px-6 md:pt-8">
      <h1 className="text-3xl font-extrabold md:text-4xl">Queue</h1>

      {!current ? (
        <div className="mt-10 rounded-xl bg-surface/60 px-6 py-14 text-center">
          <p className="text-lg font-bold">Your queue is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">Play something and it will show up here.</p>
          <Link to="/search" className="mt-5 inline-block rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background">
            Search songs
          </Link>
        </div>
      ) : (
        <>
          <h2 className="mt-8 mb-3 text-sm font-bold tracking-wide text-muted-foreground uppercase">Now playing</h2>
          <div
            role="button"
            tabIndex={0}
            onClick={togglePlay}
            onKeyDown={(e) => e.key === "Enter" && togglePlay()}
            className="flex cursor-pointer items-center gap-4 rounded-xl bg-surface p-3"
          >
            <Artwork track={current} className="h-16 w-16 shadow-elevated" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-primary">{current.title}</p>
              <p className="truncate text-sm text-muted-foreground">{current.artist}</p>
            </div>
            <EqBars paused={!isPlaying} />
            <LikeButton track={current} />
          </div>

          <div className="mt-8 mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
              Next up · {upNext.length}
            </h2>
            {upNext.length > 0 && (
              <button type="button" onClick={clearQueue} className="text-sm font-semibold text-muted-foreground hover:text-foreground">
                Clear queue
              </button>
            )}
          </div>
          {upNext.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing queued. Use “Add to queue” on any song.</p>
          ) : (
            <ul>
              {upNext.map((track, i) => {
                const qi = index + 1 + i;
                return (
                  <li
                    key={`${track.id}-${qi}`}
                    onClick={() => jumpTo(qi)}
                    className="group flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-hover"
                  >
                    <span className="w-6 text-center text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                    <Artwork track={track} className="h-11 w-11" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{track.title}</p>
                      <p className="truncate text-sm text-muted-foreground">{track.artist}</p>
                    </div>
                    <span className="hidden text-sm text-muted-foreground tabular-nums sm:block">
                      {formatTime(track.duration)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(qi);
                      }}
                      aria-label={`Remove ${track.title} from queue`}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
