import { Link } from "@tanstack/react-router";
import { Heart, Plus, Youtube } from "lucide-react";

import { NAV_ITEMS } from "@/components/layout/nav";
import { Logo } from "@/components/layout/Logo";
import { PlaylistCover } from "@/components/music/Artwork";
import { CreatePlaylistDialog, ImportPlaylistDialog } from "@/components/music/PlaylistDialogs";
import { EqBars } from "@/components/music/EqBars";
import { useLibrary } from "@/context/library";
import { usePlayer } from "@/context/player";

const navLink =
  "flex items-center gap-4 rounded-lg px-3 py-2.5 font-semibold text-muted-foreground transition-colors hover:text-foreground";

export function Sidebar() {
  const { playlists, liked } = useLibrary();
  const { current, isPlaying } = usePlayer();

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col gap-2 md:flex lg:w-[300px]">
      <nav className="rounded-xl bg-card p-3">
        <div className="mb-3">
          <Logo />
        </div>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact: to === "/" }}
                className={navLink}
                activeProps={{ className: "text-foreground bg-surface" }}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className="flex min-h-0 flex-1 flex-col rounded-xl bg-card">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">Your playlists</h2>
          <div className="flex gap-1">
            <ImportPlaylistDialog>
              <button
                type="button"
                aria-label="Import YouTube playlist"
                title="Import YouTube playlist"
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-surface-hover hover:text-foreground"
              >
                <Youtube className="h-4 w-4" />
              </button>
            </ImportPlaylistDialog>
            <CreatePlaylistDialog>
              <button
                type="button"
                aria-label="Create playlist"
                title="Create playlist"
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-surface-hover hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </button>
            </CreatePlaylistDialog>
          </div>
        </div>

        <ul className="scrollbar-thin min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          <li>
            <Link
              to="/liked"
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-hover"
              activeProps={{ className: "bg-surface" }}
            >
              <span className="grid h-12 w-12 place-items-center rounded-md bg-gradient-liked">
                <Heart className="h-5 w-5 fill-current text-foreground" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">Liked Songs</span>
                <span className="block text-sm text-muted-foreground">
                  Playlist · {liked.length} {liked.length === 1 ? "song" : "songs"}
                </span>
              </span>
            </Link>
          </li>
          {playlists.map((pl) => {
            const playingHere = isPlaying && !!current && pl.tracks.some((t) => t.id === current.id);
            return (
              <li key={pl.id}>
                <Link
                  to="/playlist/$id"
                  params={{ id: pl.id }}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-hover"
                  activeProps={{ className: "bg-surface" }}
                >
                  <PlaylistCover tracks={pl.tracks} className="h-12 w-12" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{pl.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {pl.sourceId ? "YouTube" : "Playlist"} · {pl.tracks.length} songs
                    </span>
                  </span>
                  {playingHere && <EqBars className="mr-2" />}
                </Link>
              </li>
            );
          })}
          {playlists.length === 0 && (
            <li className="mx-2 mt-3 rounded-lg bg-surface p-4">
              <p className="font-semibold">Create your first playlist</p>
              <p className="mt-1 text-sm text-muted-foreground">Or bring one over from YouTube.</p>
              <ImportPlaylistDialog>
                <button
                  type="button"
                  className="mt-4 rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-background transition hover:scale-105"
                >
                  Import playlist
                </button>
              </ImportPlaylistDialog>
            </li>
          )}
        </ul>
      </section>
    </aside>
  );
}
