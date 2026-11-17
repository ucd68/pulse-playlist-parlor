import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

import { usePersistentState } from "@/hooks/use-persistent-state";
import { pushRecent, toggleTrack } from "@/lib/library";
import type { Playlist, Track } from "@/lib/types";

type LibraryContextValue = {
  /** False until saved data has been read from this browser. */
  ready: boolean;
  liked: Track[];
  recent: Track[];
  playlists: Playlist[];
  isLiked: (id: string) => boolean;
  toggleLike: (track: Track) => void;
  addRecent: (track: Track) => void;
  clearRecent: () => void;
  createPlaylist: (name: string, tracks?: Track[], sourceId?: string) => string;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addToPlaylist: (id: string, track: Track) => boolean;
  removeFromPlaylist: (id: string, trackId: string) => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

function newId() {
  return `pl_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [liked, setLiked] = usePersistentState<Track[]>("pulse:liked", []);
  const [recent, setRecent] = usePersistentState<Track[]>("pulse:recent", []);
  const [playlists, setPlaylists, ready] = usePersistentState<Playlist[]>("pulse:playlists", []);

  const likedIds = useMemo(() => new Set(liked.map((t) => t.id)), [liked]);

  const isLiked = useCallback((id: string) => likedIds.has(id), [likedIds]);
  const toggleLike = useCallback((track: Track) => setLiked((l) => toggleTrack(l, track)), [setLiked]);
  const addRecent = useCallback((track: Track) => setRecent((r) => pushRecent(r, track)), [setRecent]);
  const clearRecent = useCallback(() => setRecent([]), [setRecent]);

  const createPlaylist = useCallback(
    (name: string, tracks: Track[] = [], sourceId?: string) => {
      const id = newId();
      setPlaylists((p) => [{ id, name, tracks, sourceId, createdAt: Date.now() }, ...p]);
      return id;
    },
    [setPlaylists],
  );
  const deletePlaylist = useCallback(
    (id: string) => setPlaylists((p) => p.filter((pl) => pl.id !== id)),
    [setPlaylists],
  );
  const renamePlaylist = useCallback(
    (id: string, name: string) =>
      setPlaylists((p) => p.map((pl) => (pl.id === id ? { ...pl, name } : pl))),
    [setPlaylists],
  );
  const addToPlaylist = useCallback(
    (id: string, track: Track) => {
      const target = playlists.find((pl) => pl.id === id);
      if (!target || target.tracks.some((t) => t.id === track.id)) return false;
      setPlaylists((p) =>
        p.map((pl) => (pl.id === id ? { ...pl, tracks: [...pl.tracks, track] } : pl)),
      );
      return true;
    },
    [playlists, setPlaylists],
  );
  const removeFromPlaylist = useCallback(
    (id: string, trackId: string) =>
      setPlaylists((p) =>
        p.map((pl) =>
          pl.id === id ? { ...pl, tracks: pl.tracks.filter((t) => t.id !== trackId) } : pl,
        ),
      ),
    [setPlaylists],
  );

  const value = useMemo(
    () => ({
      ready,
      liked,
      recent,
      playlists,
      isLiked,
      toggleLike,
      addRecent,
      clearRecent,
      createPlaylist,
      deletePlaylist,
      renamePlaylist,
      addToPlaylist,
      removeFromPlaylist,
    }),
    [ready, liked, recent, playlists, isLiked, toggleLike, addRecent, clearRecent, createPlaylist, deletePlaylist, renamePlaylist, addToPlaylist, removeFromPlaylist],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used inside LibraryProvider");
  return ctx;
}
