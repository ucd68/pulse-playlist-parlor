import { queryOptions } from "@tanstack/react-query";

import { getYouTubePlaylist, searchYouTube } from "@/lib/youtube.functions";

export const searchQuery = (query: string) =>
  queryOptions({
    queryKey: ["search", query],
    queryFn: () => searchYouTube({ data: { query } }),
    staleTime: 10 * 60_000,
  });

export const youtubePlaylistQuery = (playlistId: string) =>
  queryOptions({
    queryKey: ["yt-playlist", playlistId],
    queryFn: () => getYouTubePlaylist({ data: { playlistId } }),
    staleTime: 30 * 60_000,
  });
