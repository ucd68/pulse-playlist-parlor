import { useNavigate } from "@tanstack/react-router";

import { PlaylistCover } from "@/components/music/Artwork";
import { MediaCard, PlayFab } from "@/components/music/TrackCard";
import { usePlayer } from "@/context/player";
import type { Playlist } from "@/lib/types";

export function PlaylistGrid({ playlists }: { playlists: Playlist[] }) {
  const navigate = useNavigate();
  const { current, isPlaying, playTracks, togglePlay } = usePlayer();

  return (
    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] [&>*]:w-auto">
      {playlists.map((pl) => {
        const here = !!current && pl.tracks.some((t) => t.id === current.id);
        return (
          <MediaCard
            key={pl.id}
            onClick={() => navigate({ to: "/playlist/$id", params: { id: pl.id } })}
            art={<PlaylistCover tracks={pl.tracks} className="w-full rounded-lg shadow-elevated" />}
            title={pl.name}
            subtitle={`${pl.sourceId ? "From YouTube" : "Playlist"} · ${pl.tracks.length} songs`}
            active={here && isPlaying}
            fab={
              pl.tracks.length > 0 ? (
                <PlayFab playing={here && isPlaying} onClick={() => (here ? togglePlay() : playTracks(pl.tracks, 0))} />
              ) : undefined
            }
          />
        );
      })}
    </div>
  );
}
