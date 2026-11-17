import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Heart, Plus, Youtube } from "lucide-react";

import { PlaylistGrid } from "@/components/music/PlaylistGrid";
import { CreatePlaylistDialog, ImportPlaylistDialog } from "@/components/music/PlaylistDialogs";
import { TrackList } from "@/components/music/TrackList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLibrary } from "@/context/library";

const TABS = ["playlists", "liked", "recent"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/library")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab | undefined } => ({
    tab: TABS.includes(search["tab"] as Tab) ? (search["tab"] as Tab) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Your Library — Pulse" },
      { name: "description", content: "Your playlists, liked songs and listening history on Pulse." },
      { property: "og:title", content: "Your Library — Pulse" },
      { property: "og:description", content: "Playlists, liked songs and listening history in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LibraryPage,
});

const pill =
  "rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-foreground data-[state=active]:bg-foreground data-[state=active]:text-background";

function LibraryPage() {
  const { tab = "playlists" } = Route.useSearch();
  const navigate = useNavigate({ from: "/library" });
  const { playlists, liked, recent, clearRecent } = useLibrary();

  return (
    <div className="min-h-full bg-gradient-hero px-4 pt-6 pb-12 md:px-6 md:pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold md:text-4xl">Your Library</h1>
        <div className="flex gap-2">
          <ImportPlaylistDialog>
            <button type="button" className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold transition hover:bg-surface-hover">
              <Youtube className="h-4 w-4" /> Import
            </button>
          </ImportPlaylistDialog>
          <CreatePlaylistDialog>
            <button type="button" className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:scale-105">
              <Plus className="h-4 w-4" /> New playlist
            </button>
          </CreatePlaylistDialog>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v as Tab }, replace: true })} className="mt-6">
        <TabsList className="h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="playlists" className={pill}>Playlists</TabsTrigger>
          <TabsTrigger value="liked" className={pill}>Liked</TabsTrigger>
          <TabsTrigger value="recent" className={pill}>Recently played</TabsTrigger>
        </TabsList>

        <TabsContent value="playlists" className="mt-6">
          <Link
            to="/liked"
            className="mb-4 flex items-center gap-4 rounded-xl bg-gradient-liked p-4 transition hover:brightness-110"
          >
            <Heart className="h-8 w-8 fill-current" />
            <span>
              <span className="block text-lg font-bold">Liked Songs</span>
              <span className="text-sm text-foreground/80">{liked.length} songs</span>
            </span>
          </Link>
          {playlists.length ? (
            <PlaylistGrid playlists={playlists} />
          ) : (
            <Empty title="No playlists yet" text="Create one or import a playlist from YouTube." />
          )}
        </TabsContent>

        <TabsContent value="liked" className="mt-6">
          {liked.length ? (
            <TrackList tracks={liked} />
          ) : (
            <Empty title="No liked songs yet" text="Tap the heart on any song to save it here." />
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          {recent.length ? (
            <>
              <div className="mb-2 flex justify-end">
                <button type="button" onClick={clearRecent} className="text-sm font-semibold text-muted-foreground hover:text-foreground">
                  Clear history
                </button>
              </div>
              <TrackList tracks={recent} />
            </>
          ) : (
            <Empty title="Nothing played yet" text="Songs you play will show up here." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl bg-surface/60 px-6 py-14 text-center">
      <p className="text-lg font-bold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
