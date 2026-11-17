import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MoreHorizontal, Pencil, Search, Shuffle, Trash2, Youtube } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PlaylistCover } from "@/components/music/Artwork";
import { RowSkeletons } from "@/components/music/CardSkeletons";
import { CollectionHeader } from "@/components/music/CollectionHeader";
import { PlayFab } from "@/components/music/TrackCard";
import { TrackList } from "@/components/music/TrackList";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useLibrary } from "@/context/library";
import { usePlayer } from "@/context/player";
import { formatTotal } from "@/lib/types";

export const Route = createFileRoute("/playlist/$id")({
  head: () => ({
    meta: [
      { title: "Playlist — Pulse" },
      { name: "description", content: "Listen to this playlist on Pulse." },
      { property: "og:title", content: "Playlist — Pulse" },
      { property: "og:description", content: "Listen to this playlist on Pulse." },
      { property: "og:type", content: "music.playlist" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlaylistPage,
});

function PlaylistPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { ready, playlists, deletePlaylist, renamePlaylist, removeFromPlaylist } = useLibrary();
  const { current, isPlaying, playTracks, togglePlay } = usePlayer();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState("");
  const playlist = playlists.find((p) => p.id === id);

  if (!ready) {
    return (
      <div className="px-4 pt-16 md:px-8">
        <RowSkeletons count={8} />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="px-6 py-24 text-center">
        <p className="text-2xl font-bold">Playlist not found</p>
        <p className="mt-2 text-muted-foreground">It may have been deleted.</p>
        <Link to="/playlists" className="mt-6 inline-block rounded-full bg-foreground px-6 py-2.5 font-semibold text-background">
          Back to playlists
        </Link>
      </div>
    );
  }

  const { tracks } = playlist;
  const playingHere = !!current && tracks.some((t) => t.id === current.id);

  return (
    <div className="min-h-full bg-gradient-hero pb-12">
      <CollectionHeader
        kind={playlist.sourceId ? "YouTube playlist" : "Playlist"}
        title={playlist.name}
        cover={<PlaylistCover tracks={tracks} className="w-full rounded-lg" />}
        meta={
          <>
            {tracks.length} {tracks.length === 1 ? "song" : "songs"}
            {tracks.length > 0 && <> · {formatTotal(tracks)}</>}
          </>
        }
      />

      <div className="flex items-center gap-4 px-4 py-4 md:px-8">
        <PlayFab
          size="lg"
          playing={playingHere && isPlaying}
          onClick={() => (playingHere ? togglePlay() : playTracks(tracks, 0, { shuffle: false }))}
          className={tracks.length ? "" : "pointer-events-none opacity-50"}
        />
        <button
          type="button"
          disabled={!tracks.length}
          onClick={() => playTracks(tracks, Math.floor(Math.random() * tracks.length), { shuffle: true })}
          aria-label="Shuffle play"
          className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition hover:text-foreground disabled:opacity-40"
        >
          <Shuffle className="h-6 w-6" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Playlist options"
              className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition hover:text-foreground"
            >
              <MoreHorizontal className="h-6 w-6" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem
              onSelect={() => {
                setName(playlist.name);
                setRenaming(true);
              }}
            >
              <Pencil /> Rename
            </DropdownMenuItem>
            {playlist.sourceId && (
              <DropdownMenuItem asChild>
                <a href={`https://www.youtube.com/playlist?list=${playlist.sourceId}`} target="_blank" rel="noreferrer">
                  <Youtube /> Open on YouTube
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => {
                deletePlaylist(playlist.id);
                toast.success(`Deleted “${playlist.name}”`);
                navigate({ to: "/playlists" });
              }}
            >
              <Trash2 /> Delete playlist
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="px-2 md:px-4">
        {tracks.length ? (
          <TrackList tracks={tracks} onRemove={(t) => removeFromPlaylist(playlist.id, t.id)} />
        ) : (
          <div className="mx-2 rounded-xl bg-surface/60 px-6 py-14 text-center">
            <p className="text-lg font-bold">This playlist is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the ••• menu on any song and choose “Add to playlist”.
            </p>
            <Link
              to="/search"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background"
            >
              <Search className="h-4 w-4" /> Find songs
            </Link>
          </div>
        )}
      </div>

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent className="border-border bg-popover sm:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) renamePlaylist(playlist.id, name.trim());
              setRenaming(false);
            }}
            className="space-y-5"
          >
            <DialogHeader>
              <DialogTitle>Rename playlist</DialogTitle>
            </DialogHeader>
            <Input autoFocus value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
            <DialogFooter>
              <Button type="submit" className="rounded-full px-6 font-semibold">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
