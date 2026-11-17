import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Youtube } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLibrary } from "@/context/library";
import { extractPlaylistId } from "@/lib/youtube-parse";
import { getYouTubePlaylist } from "@/lib/youtube.functions";

export function CreatePlaylistDialog({ children }: { children: ReactNode }) {
  const { createPlaylist, playlists } = useLibrary();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = createPlaylist(name.trim() || `My Playlist #${playlists.length + 1}`);
    setOpen(false);
    setName("");
    navigate({ to: "/playlist/$id", params: { id } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="border-border bg-popover sm:max-w-md">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Create playlist</DialogTitle>
            <DialogDescription>Give it a name — you can add songs from anywhere.</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            placeholder={`My Playlist #${playlists.length + 1}`}
          />
          <DialogFooter>
            <Button type="submit" className="rounded-full px-6 font-semibold">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ImportPlaylistDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="border-border bg-popover sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-primary" /> Import a YouTube playlist
          </DialogTitle>
          <DialogDescription>
            Paste a link from YouTube or YouTube Music. Public and unlisted playlists work.
          </DialogDescription>
        </DialogHeader>
        <ImportPlaylistForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function ImportPlaylistForm({ onDone }: { onDone?: () => void }) {
  const { createPlaylist, playlists } = useLibrary();
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  const mutation = useMutation({
    mutationFn: (playlistId: string) => getYouTubePlaylist({ data: { playlistId } }),
    onSuccess: (pl) => {
      const existing = playlists.find((p) => p.sourceId === pl.id);
      const id = existing?.id ?? createPlaylist(pl.title, pl.tracks, pl.id);
      toast.success(
        existing ? `“${pl.title}” is already in your library` : `Imported ${pl.tracks.length} songs from “${pl.title}”`,
      );
      setValue("");
      onDone?.();
      navigate({ to: "/playlist/$id", params: { id } });
    },
    onError: () => toast.error("Couldn't import that playlist. Check the link and that it's public."),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractPlaylistId(value);
    if (!id) {
      toast.error("That doesn't look like a YouTube playlist link");
      return;
    }
    mutation.mutate(id);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="https://www.youtube.com/playlist?list=…"
        className="h-11 flex-1 rounded-full bg-surface px-5"
        disabled={mutation.isPending}
      />
      <Button type="submit" disabled={mutation.isPending} className="h-11 rounded-full px-6 font-semibold">
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {mutation.isPending ? "Importing…" : "Import"}
      </Button>
    </form>
  );
}
