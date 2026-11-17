import type { Track } from "./types";

export const MAX_RECENT = 50;

/** Moves (or inserts) a track to the front of the recently played list. */
export function pushRecent(list: Track[], track: Track, max = MAX_RECENT): Track[] {
  return [track, ...list.filter((t) => t.id !== track.id)].slice(0, max);
}

export function toggleTrack(list: Track[], track: Track): Track[] {
  return list.some((t) => t.id === track.id)
    ? list.filter((t) => t.id !== track.id)
    : [track, ...list];
}
