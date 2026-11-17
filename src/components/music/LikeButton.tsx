import { Heart } from "lucide-react";

import { useLibrary } from "@/context/library";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LikeButton({ track, className }: { track: Track; className?: string }) {
  const { isLiked, toggleLike } = useLibrary();
  const liked = isLiked(track.id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleLike(track);
      }}
      aria-label={liked ? "Remove from Liked Songs" : "Save to Liked Songs"}
      aria-pressed={liked}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full transition hover:scale-110",
        liked ? "text-primary" : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-current")} />
    </button>
  );
}
