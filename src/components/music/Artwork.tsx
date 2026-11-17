import { Music2 } from "lucide-react";

import { thumbnailUrl, type Track } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Square album-art tile cropped from the YouTube thumbnail (hides its letterbox bars). */
export function Artwork({ track, className }: { track?: Track | null | undefined; className?: string | undefined }) {
  return (
    <div className={cn("relative aspect-square shrink-0 overflow-hidden rounded-md bg-muted", className)}>
      {track ? (
        <img
          src={thumbnailUrl(track.id)}
          alt=""
          loading="lazy"
          draggable={false}
          className="h-full w-full scale-[1.34] object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-muted-foreground">
          <Music2 className="h-1/3 w-1/3" />
        </div>
      )}
    </div>
  );
}

/** 2x2 mosaic of the first tracks, like Spotify playlist covers. */
export function PlaylistCover({ tracks, className }: { tracks: Track[]; className?: string | undefined }) {
  if (tracks.length < 4) return <Artwork track={tracks[0]} className={className} />;
  return (
    <div className={cn("grid aspect-square shrink-0 grid-cols-2 overflow-hidden rounded-md bg-muted", className)}>
      {tracks.slice(0, 4).map((t) => (
        <div key={t.id} className="overflow-hidden">
          <img src={thumbnailUrl(t.id)} alt="" loading="lazy" className="h-full w-full scale-[1.34] object-cover" />
        </div>
      ))}
    </div>
  );
}
