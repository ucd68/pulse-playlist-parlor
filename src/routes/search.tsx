import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search as SearchIcon, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Artwork } from "@/components/music/Artwork";
import { RowSkeletons } from "@/components/music/CardSkeletons";
import { PlayFab } from "@/components/music/TrackCard";
import { TrackList } from "@/components/music/TrackList";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayer } from "@/context/player";
import { GENRES } from "@/lib/genres";
import { searchQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string | undefined } => ({
    q: typeof search["q"] === "string" && search["q"].trim() ? search["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search — Pulse" },
      { name: "description", content: "Search millions of songs from YouTube and play them instantly on Pulse." },
      { property: "og:title", content: "Search — Pulse" },
      { property: "og:description", content: "Find any song on YouTube and play it instantly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [input, setInput] = useState(q);

  // Keep the box in sync when the URL changes (e.g. clicking a genre tile).
  useEffect(() => setInput(q), [q]);

  // Debounce typing into the URL so results are shareable and back/forward works.
  useEffect(() => {
    const value = input.trim();
    if (value === q) return;
    const id = window.setTimeout(
      () => navigate({ search: { q: value || undefined }, replace: true }),
      400,
    );
    return () => window.clearTimeout(id);
  }, [input, q, navigate]);

  return (
    <div className="min-h-full px-4 pt-4 pb-12 md:px-6 md:pt-6">
      <div className="sticky top-0 z-10 -mx-4 bg-card/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <label className="relative block max-w-xl">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate({ search: { q: input.trim() || undefined }, replace: true });
            }}
            placeholder="What do you want to listen to?"
            aria-label="Search songs"
            className="h-12 w-full rounded-full border border-transparent bg-surface pr-12 pl-12 text-base outline-none transition placeholder:text-muted-foreground hover:bg-surface-hover focus:border-foreground/40"
          />
          {input && (
            <button
              type="button"
              onClick={() => setInput("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-3 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </label>
      </div>

      {q ? <SearchResults query={q} /> : <BrowseAll />}
    </div>
  );
}

function SearchResults({ query }: { query: string }) {
  const results = useQuery(searchQuery(query));
  const { current, isPlaying, playTracks, togglePlay } = usePlayer();

  if (results.isPending) {
    return (
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Skeleton className="h-64 rounded-xl bg-surface" />
        <RowSkeletons count={4} />
      </div>
    );
  }

  if (results.isError) {
    return (
      <div className="mt-16 text-center">
        <p className="text-lg font-semibold">Search isn't responding</p>
        <p className="mt-1 text-sm text-muted-foreground">YouTube didn't answer this time.</p>
        <button
          type="button"
          onClick={() => results.refetch()}
          className="mt-5 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background"
        >
          Try again
        </button>
      </div>
    );
  }

  const tracks = results.data;
  if (tracks.length === 0) {
    return (
      <div className="mt-16 text-center">
        <p className="text-lg font-semibold">No results for “{query}”</p>
        <p className="mt-1 text-sm text-muted-foreground">Check the spelling or try different words.</p>
      </div>
    );
  }

  const top = tracks[0]!;
  const topActive = current?.id === top.id;

  return (
    <div className="mt-4">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section>
          <h2 className="mb-3 text-xl font-bold md:text-2xl">Top result</h2>
          <div
            role="button"
            tabIndex={0}
            onClick={() => (topActive ? togglePlay() : playTracks(tracks, 0))}
            onKeyDown={(e) => e.key === "Enter" && (topActive ? togglePlay() : playTracks(tracks, 0))}
            className="group relative cursor-pointer rounded-xl bg-surface p-5 transition-colors hover:bg-surface-hover"
          >
            <Artwork track={top} className="h-24 w-24 rounded-lg shadow-elevated" />
            <p className={cn("mt-5 line-clamp-2 text-2xl font-bold md:text-3xl", topActive && "text-primary")}>
              {top.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Song · <span className="text-foreground">{top.artist}</span>
            </p>
            <PlayFab
              playing={topActive && isPlaying}
              onClick={() => (topActive ? togglePlay() : playTracks(tracks, 0))}
              size="lg"
              className={cn(
                "absolute right-5 bottom-5 translate-y-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100",
                topActive && "translate-y-0 opacity-100",
              )}
            />
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-bold md:text-2xl">Songs</h2>
          <TrackList tracks={tracks.slice(1, 5)} onPlay={(i) => playTracks(tracks, i + 1)} showHeader={false} />
        </section>
      </div>

      {tracks.length > 5 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-bold md:text-2xl">More results</h2>
          <TrackList tracks={tracks.slice(5)} onPlay={(i) => playTracks(tracks, i + 5)} />
        </section>
      )}
    </div>
  );
}

function BrowseAll() {
  return (
    <section className="mt-4">
      <h2 className="mb-4 text-xl font-bold md:text-2xl">Browse all</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {GENRES.map((g) => (
          <Link
            key={g.label}
            to="/search"
            search={{ q: g.query }}
            className={cn(
              "relative aspect-[16/10] overflow-hidden rounded-xl p-4 text-lg font-bold transition hover:scale-[1.02] md:text-xl",
              g.className,
            )}
          >
            {g.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
