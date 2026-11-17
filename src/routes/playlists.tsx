import { createFileRoute } from "@tanstack/react-router";
import { Plus, Youtube } from "lucide-react";

import { PlaylistGrid } from "@/components/music/PlaylistGrid";
import { CreatePlaylistDialog, ImportPlaylistForm } from "@/components/music/PlaylistDialogs";
import { useLibrary } from "@/context/library";

export const Route = createFileRoute("/playlists")({
  head: () => ({
    meta: [
      { title: "Playlists — Pulse" },
      { name: "description", content: "Create playlists and import your YouTube playlists into Pulse." },
      { property: "og:title", content: "Playlists — Pulse" },
      { property: "og:description", content: "Create playlists or import them straight from YouTube." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlaylistsPage,
});

function PlaylistsPage() {
  const { playlists } = useLibrary();

  return (
    <div className="min-h-full bg-gradient-hero px-4 pt-6 pb-12 md:px-6 md:pt-8">
      <h1 className="text-3xl font-extrabold md:text-4xl">Playlists</h1>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface/70 p-5 md:p-7">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Youtube className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold">Import from YouTube</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste any public playlist link from YouTube or YouTube Music to bring every song into Pulse.
            </p>
            <div className="mt-4">
              <ImportPlaylistForm />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-10 mb-3 flex items-center justify-between gap-3 px-2.5">
        <h2 className="text-xl font-bold md:text-2xl">Your playlists</h2>
        <CreatePlaylistDialog>
          <button type="button" className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:scale-105">
            <Plus className="h-4 w-4" /> New playlist
          </button>
        </CreatePlaylistDialog>
      </div>
      {playlists.length ? (
        <PlaylistGrid playlists={playlists} />
      ) : (
        <p className="px-2.5 text-muted-foreground">No playlists yet — create one or import from YouTube above.</p>
      )}
    </div>
  );
}
