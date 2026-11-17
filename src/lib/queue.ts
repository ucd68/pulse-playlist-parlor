import type { RepeatMode } from "./types";

/** Seconds into a song after which "previous" restarts it instead of going back. */
export const RESTART_THRESHOLD = 3;

export function getNextIndex(index: number, length: number, repeat: RepeatMode): number | null {
  if (length === 0) return null;
  if (index < length - 1) return index + 1;
  return repeat === "all" ? 0 : null;
}

export function getPrevIndex(index: number, length: number, repeat: RepeatMode): number | null {
  if (length === 0) return null;
  if (index > 0) return index - 1;
  return repeat === "all" ? length - 1 : null;
}

export function nextRepeatMode(mode: RepeatMode): RepeatMode {
  return mode === "off" ? "all" : mode === "all" ? "one" : "off";
}

/** Keeps the item at `index` first and randomises the rest (Fisher–Yates). */
export function shuffleQueue<T>(queue: T[], index: number, rand: () => number = Math.random): T[] {
  const current = queue[index];
  const rest = queue.filter((_, i) => i !== index);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = rest[i] as T;
    rest[i] = rest[j] as T;
    rest[j] = tmp;
  }
  return current === undefined ? rest : [current, ...rest];
}
