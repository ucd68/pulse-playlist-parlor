import { Link } from "@tanstack/react-router";
import { ChevronDown, ListMusic, MonitorPlay } from "lucide-react";
import { useEffect } from "react";

import { Artwork } from "@/components/music/Artwork";
import { LikeButton } from "@/components/music/LikeButton";
import { Controls } from "@/components/player/Controls";
import { ProgressBar } from "@/components/player/ProgressBar";
import { usePlayer } from "@/context/player";
import { thumbnailUrl } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NowPlayingMobile({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { current, queue, index, showVideo, setShowVideo } = usePlayer();
  const upNext = queue[index + 1];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-50 flex flex-col overflow-hidden bg-background transition-transform duration-300 ease-out md:hidden",
        open ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
    >
      {current && (
        <>
          <img
            src={thumbnailUrl(current.id)}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-3xl"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
          <div className="relative flex flex-1 flex-col px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
            <div className="flex items-center justify-between">
              <button type="button" onClick={onClose} aria-label="Close" className="grid h-10 w-10 place-items-center">
                <ChevronDown className="h-7 w-7" />
              </button>
              <p className="text-xs font-semibold tracking-widest text-foreground/80 uppercase">Now playing</p>
              <button
                type="button"
                onClick={() => setShowVideo(!showVideo)}
                aria-label={showVideo ? "Hide video" : "Show video"}
                className={cn("grid h-10 w-10 place-items-center", showVideo && "text-primary")}
              >
                <MonitorPlay className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 items-center justify-center py-6">
              <Artwork track={current} className="w-full max-w-sm rounded-xl shadow-elevated" />
            </div>

            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-2xl font-bold">{current.title}</h2>
                <p className="truncate text-muted-foreground">{current.artist}</p>
              </div>
              <LikeButton track={current} className="h-10 w-10 [&>svg]:h-6 [&>svg]:w-6" />
            </div>

            <ProgressBar className="mt-4 [&>span]:w-auto" />
            <div className="mt-3">
              <Controls size="lg" />
            </div>

            <Link
              to="/queue"
              onClick={onClose}
              className="mt-6 flex items-center gap-3 rounded-xl bg-surface/80 p-3 backdrop-blur"
            >
              <ListMusic className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm">
                {upNext ? (
                  <>
                    <span className="text-muted-foreground">Next: </span>
                    {upNext.title}
                  </>
                ) : (
                  "Open queue"
                )}
              </span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
