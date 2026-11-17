import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { extractPlaylistTitle, extractTracks } from "./youtube-parse";
import type { Track } from "./types";

const CLIENT = { clientName: "WEB", clientVersion: "2.20241101.00.00", hl: "en", gl: "US" };
const MAX_PLAYLIST_PAGES = 10;

async function innertube(endpoint: "search" | "browse" | "next", body: Record<string, unknown>) {
  const res = await fetch(`https://www.youtube.com/youtubei/v1/${endpoint}?prettyPrint=false`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      "accept-language": "en-US,en;q=0.9",
    },
    body: JSON.stringify({ context: { client: CLIENT }, ...body }),
  });
  if (!res.ok) throw new Error(`YouTube responded with ${res.status}`);
  return res.json();
}

export const searchYouTube = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ query: z.string().trim().min(1).max(200) }).parse(input))
  .handler(async ({ data }): Promise<Track[]> => {
    // params = "videos only" search filter
    const json = await innertube("search", { query: data.query, params: "EgIQAQ%3D%3D" });
    return extractTracks(json).tracks;
  });

export const getYouTubePlaylist = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ playlistId: z.string().regex(/^[A-Za-z0-9_-]{10,64}$/) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ id: string; title: string; tracks: Track[] }> => {
    const first = await innertube("browse", { browseId: `VL${data.playlistId}` });
    let { tracks, continuation } = extractTracks(first);
    let title = extractPlaylistTitle(first);

    for (let page = 1; continuation && page < MAX_PLAYLIST_PAGES; page++) {
      const next = extractTracks(await innertube("browse", { continuation }));
      const known = new Set(tracks.map((t) => t.id));
      tracks = tracks.concat(next.tracks.filter((t) => !known.has(t.id)));
      continuation = next.continuation;
    }

    // Mixes (RD…) and some auto playlists only resolve through the watch endpoint.
    if (tracks.length === 0) {
      const json = await innertube("next", { playlistId: data.playlistId });
      tracks = extractTracks(json?.contents?.twoColumnWatchNextResults?.playlist).tracks;
      title = title || json?.contents?.twoColumnWatchNextResults?.playlist?.playlist?.title;
    }

    if (tracks.length === 0) throw new Error("Playlist not found, private, or empty");
    return { id: data.playlistId, title: title || "YouTube playlist", tracks };
  });
