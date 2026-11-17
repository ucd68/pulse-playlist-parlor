import { ExternalLink, Heart, ListEnd, ListPlus, ListStart, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLibrary } from "@/context/library";
import { usePlayer } from "@/context/player";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TrackMenu({
  track,
  onRemove,
  removeLabel = "Remove from this playlist",
  className,
}: {
  track: Track;
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
}) {
  const { addToQueue, playNext } = usePlayer();
  const { playlists, addToPlaylist, createPlaylist, isLiked, toggleLike } = useLibrary();
  const liked = isLiked(track.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label={`More options for ${track.title}`}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-surface-hover hover:text-foreground",
            className,
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={() => playNext(track)}>
          <ListStart /> Play next
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => addToQueue(track)}>
          <ListEnd /> Add to queue
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ListPlus className="mr-2 h-4 w-4" /> Add to playlist
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-72 w-52 overflow-y-auto">
            <DropdownMenuItem
              onSelect={() => {
                createPlaylist(`My Playlist #${playlists.length + 1}`, [track]);
                toast.success("Created a new playlist");
              }}
            >
              <Plus /> New playlist
            </DropdownMenuItem>
            {playlists.length > 0 && <DropdownMenuSeparator />}
            {playlists.map((pl) => (
              <DropdownMenuItem
                key={pl.id}
                onSelect={() =>
                  addToPlaylist(pl.id, track)
                    ? toast.success(`Added to ${pl.name}`)
                    : toast(`Already in ${pl.name}`)
                }
              >
                <span className="truncate">{pl.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onSelect={() => toggleLike(track)}>
          <Heart className={cn(liked && "fill-current text-primary")} />
          {liked ? "Remove from Liked Songs" : "Save to Liked Songs"}
        </DropdownMenuItem>
        {onRemove && (
          <DropdownMenuItem onSelect={onRemove}>
            <Trash2 /> {removeLabel}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={`https://www.youtube.com/watch?v=${track.id}`} target="_blank" rel="noreferrer">
            <ExternalLink /> Open on YouTube
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
