export type Track = {
  /** YouTube video id */
  id: string;
  title: string;
  artist: string;
  /** Length in seconds (0 when unknown, e.g. live streams) */
  duration: number;
};

export type Playlist = {
  id: string;
  name: string;
  description?: string | undefined;
  tracks: Track[];
  createdAt: number;
  /** YouTube playlist id when imported */
  sourceId?: string | undefined;
};

export type RepeatMode = "off" | "all" | "one";

export function thumbnailUrl(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0:00";
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export function formatTotal(tracks: Track[]) {
  const total = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const h = Math.floor(total / 3600);
  const m = Math.round((total % 3600) / 60);
  return h > 0 ? `${h} hr ${m} min` : `${m} min`;
}
