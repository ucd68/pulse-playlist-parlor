import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Shuffle } from "lucide-react";

import { CollectionHeader } from "@/components/music/CollectionHeader";
import { PlayFab } from "@/components/music/TrackCard";
import { TrackList } from "@/components/music/TrackList";
import { useLibrary } from "@/context/library";
import { usePlayer } from "@/context/player";
import { formatTotal } from "@/lib/types";

export const Route = createFileRoute("/liked")({
  head: () => ({
    meta: [
      { title: "Liked Songs — Pulse" },
      { name: "description", content: "Every song you've hearted on Pulse, ready to play." },
      { property: "og:title", content: "Liked Songs — Pulse" },
      { property: "og:description", content: "Every song you've hearted, ready to play." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LikedPage,
});

function LikedPage() {
  const { liked, toggleLike } = useLibrary();
  const { current, isPlaying, playTracks, togglePlay } = usePlayer();
  const playingHere = !!current && liked.some((t) => t.id === current.id);

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,color-mix(in_oklab,var(--tile-2)_55%,transparent),transparent_420px)] pb-12">
      <CollectionHeader
        kind="Playlist"
        title="Liked Songs"
        cover={
          <div className="grid aspect-square place-items-center rounded-lg bg-gradient-liked">
            <Heart className="h-20 w-20 fill-current" />
          </div>
        }
        meta={`${liked.length} ${liked.length === 1 ? "song" : "songs"}${liked.length ? ` · ${formatTotal(liked)}` : ""}`}
      />
      <div className="flex items-center gap-4 px-4 py-4 md:px-8">
        <PlayFab
          size="lg"
          playing={playingHere && isPlaying}
          onClick={() => (playingHere ? togglePlay() : playTracks(liked, 0, { shuffle: false }))}
          className={liked.length ? "" : "pointer-events-none opacity-50"}
        />
        <button
          type="button"
          disabled={!liked.length}
          onClick={() => playTracks(liked, Math.floor(Math.random() * liked.length), { shuffle: true })}
          aria-label="Shuffle play"
          className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition hover:text-foreground disabled:opacity-40"
        >
          <Shuffle className="h-6 w-6" />
        </button>
      </div>
      <div className="px-2 md:px-4">
        {liked.length ? (
          <TrackList tracks={liked} onRemove={(t) => toggleLike(t)} removeLabel="Remove from Liked Songs" />
        ) : (
          <div className="px-4 py-16 text-center">
            <p className="text-xl font-bold">Songs you like will appear here</p>
            <p className="mt-2 text-muted-foreground">Save songs by tapping the heart icon.</p>
            <Link
              to="/search"
              className="mt-6 inline-block rounded-full bg-foreground px-6 py-2.5 font-semibold text-background transition hover:scale-105"
            >
              Find songs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
