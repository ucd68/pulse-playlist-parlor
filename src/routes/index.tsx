import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useHydrated, useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { ReactNode } from "react";

import { Artwork, PlaylistCover } from "@/components/music/Artwork";
import { CardSkeletons } from "@/components/music/CardSkeletons";
import { EqBars } from "@/components/music/EqBars";
import { Shelf } from "@/components/music/Shelf";
import { MediaCard, PlayFab, TrackCard } from "@/components/music/TrackCard";
import { useLibrary } from "@/context/library";
import { usePlayer } from "@/context/player";
import { GENRES, TRENDING_PLAYLIST_ID } from "@/lib/genres";
import { youtubePlaylistQuery } from "@/lib/queries";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulse — Your music, powered by YouTube" },
      { name: "description", content: "Jump back into recently played songs, trending hits and your playlists on Pulse." },
      { property: "og:title", content: "Pulse — Your music, powered by YouTube" },
      { property: "og:description", content: "Trending hits, your playlists and liked songs in one sleek player." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function greeting(hour: number) {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function HomePage() {
  const hydrated = useHydrated();
  const { liked, recent, playlists } = useLibrary();
  const { current, isPlaying, playTracks, togglePlay } = usePlayer();
  const navigate = useNavigate();
  const trending = useQuery(youtubePlaylistQuery(TRENDING_PLAYLIST_ID));
  const trendingTracks = trending.data?.tracks.slice(0, 24) ?? [];

  const playCollection = (tracks: Track[]) => {
    if (tracks.length === 0) return;
    if (current && tracks.some((t) => t.id === current.id)) togglePlay();
    else playTracks(tracks, 0);
  };
  const isCollectionPlaying = (tracks: Track[]) =>
    isPlaying && !!current && tracks.some((t) => t.id === current.id);

  const quickTiles: { key: string; label: string; art: ReactNode; tracks: Track[]; to?: () => void }[] = [
    {
      key: "liked",
      label: "Liked Songs",
      art: (
        <span className="grid h-full w-full place-items-center bg-gradient-liked">
          <Heart className="h-6 w-6 fill-current" />
        </span>
      ),
      tracks: liked,
      to: () => navigate({ to: "/liked" }),
    },
    ...playlists.slice(0, 3).map((pl) => ({
      key: pl.id,
      label: pl.name,
      art: <PlaylistCover tracks={pl.tracks} className="h-full w-full rounded-none" />,
      tracks: pl.tracks,
      to: () => navigate({ to: "/playlist/$id", params: { id: pl.id } }),
    })),
    ...recent.slice(0, 4).map((t) => ({
      key: `r-${t.id}`,
      label: t.title,
      art: <Artwork track={t} className="h-full w-full rounded-none" />,
      tracks: [t],
    })),
  ].slice(0, 8);

  return (
    <div className="min-h-full bg-gradient-hero px-4 pt-6 pb-12 md:px-6 md:pt-8">
      <h1 className="text-3xl font-extrabold md:text-4xl">
        {hydrated ? greeting(new Date().getHours()) : "Welcome back"}
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-4 md:gap-3">
        {quickTiles.map((tile) => {
          const active = isCollectionPlaying(tile.tracks);
          return (
            <div
              key={tile.key}
              role="button"
              tabIndex={0}
              onClick={() => (tile.to ? tile.to() : playCollection(tile.tracks))}
              onKeyDown={(e) => e.key === "Enter" && (tile.to ? tile.to() : playCollection(tile.tracks))}
              className="group flex h-14 cursor-pointer items-center gap-3 overflow-hidden rounded-md bg-foreground/[0.07] pr-2 transition-colors hover:bg-foreground/[0.14] md:h-16"
            >
              <div className="h-full aspect-square shrink-0 overflow-hidden shadow-elevated">{tile.art}</div>
              <span className="line-clamp-2 flex-1 text-sm font-semibold">{tile.label}</span>
              {active ? (
                <EqBars className="mr-2 md:group-hover:hidden" />
              ) : null}
              {tile.tracks.length > 0 && (
                <PlayFab
                  playing={active}
                  onClick={() => playCollection(tile.tracks)}
                  className={cn("hidden h-9 w-9 opacity-0 transition md:grid md:group-hover:opacity-100 [&>svg]:h-4 [&>svg]:w-4", active && "md:hidden md:group-hover:grid")}
                />
              )}
            </div>
          );
        })}
      </div>

      {recent.length > 0 && (
        <Shelf
          title="Recently played"
          action={
            <Link to="/library" search={{ tab: "recent" }} className="text-sm font-semibold text-muted-foreground hover:underline">
              Show all
            </Link>
          }
        >
          {recent.slice(0, 12).map((t, i) => (
            <TrackCard key={t.id} tracks={recent} index={i} />
          ))}
        </Shelf>
      )}

      <Shelf title="Trending worldwide">
        {trending.isPending ? (
          <CardSkeletons />
        ) : trending.isError ? (
          <p className="px-2.5 text-sm text-muted-foreground">
            Couldn't load the charts right now.{" "}
            <button type="button" onClick={() => trending.refetch()} className="font-semibold text-foreground underline">
              Try again
            </button>
          </p>
        ) : (
          trendingTracks.map((t, i) => <TrackCard key={t.id} tracks={trendingTracks} index={i} />)
        )}
      </Shelf>

      {playlists.length > 0 && (
        <Shelf title="Your playlists">
          {playlists.map((pl) => (
            <MediaCard
              key={pl.id}
              onClick={() => navigate({ to: "/playlist/$id", params: { id: pl.id } })}
              art={<PlaylistCover tracks={pl.tracks} className="w-full rounded-lg shadow-elevated" />}
              title={pl.name}
              subtitle={`${pl.tracks.length} songs`}
              active={isCollectionPlaying(pl.tracks)}
              fab={
                pl.tracks.length > 0 ? (
                  <PlayFab playing={isCollectionPlaying(pl.tracks)} onClick={() => playCollection(pl.tracks)} />
                ) : undefined
              }
            />
          ))}
        </Shelf>
      )}

      <section className="mt-8">
        <h2 className="mb-4 px-2.5 text-xl font-bold md:text-2xl">Moods & genres</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {GENRES.map((g) => (
            <Link
              key={g.label}
              to="/search"
              search={{ q: g.query }}
              className={cn(
                "relative h-24 overflow-hidden rounded-xl p-4 text-lg font-bold transition hover:scale-[1.02] md:h-28 md:text-xl",
                g.className,
              )}
            >
              {g.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
