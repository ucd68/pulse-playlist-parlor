import type { Track } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function parseDuration(text?: string): number {
  if (!text) return 0;
  const parts = text.trim().split(":").map(Number);
  if (parts.length === 0 || parts.some((p) => Number.isNaN(p))) return 0;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

export function cleanArtist(name: string): string {
  return name
    .replace(/\s*-\s*Topic$/i, "")
    .replace(/VEVO$/i, "")
    .replace(/\s+and\s+\d+\s+more$/i, "")
    .trim();
}

export function cleanTitle(title: string): string {
  return title
    .replace(
      /\s*[([](official\s*)?(music\s*)?(video|audio|lyric(s)?(\s*video)?|visuali[sz]er|hd|4k)[)\]]/gi,
      "",
    )
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Accepts a playlist URL (any youtube.com / music.youtube.com link with list=) or a raw id. */
export function extractPlaylistId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  const match = value.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (match?.[1]) return match[1];
  if (/^[A-Za-z0-9_-]{10,64}$/.test(value)) return value;
  return null;
}

function textOf(t: any): string {
  if (!t) return "";
  if (typeof t === "string") return t;
  if (typeof t.simpleText === "string") return t.simpleText;
  if (Array.isArray(t.runs)) return t.runs.map((r: any) => r.text).join("");
  if (typeof t.content === "string") return t.content;
  return "";
}

function findToken(node: any): string | undefined {
  if (!node || typeof node !== "object") return undefined;
  if (typeof node.continuationCommand?.token === "string") return node.continuationCommand.token;
  for (const key in node) {
    const found = findToken(node[key]);
    if (found) return found;
  }
  return undefined;
}

function findDurationBadge(node: any): string | undefined {
  if (!node || typeof node !== "object") return undefined;
  if (node.thumbnailBadgeViewModel && typeof node.thumbnailBadgeViewModel.text === "string") {
    const text = node.thumbnailBadgeViewModel.text;
    if (/^\d+(:\d{2})+$/.test(text)) return text;
  }
  for (const key in node) {
    const found = findDurationBadge(node[key]);
    if (found) return found;
  }
  return undefined;
}

/**
 * Walks an InnerTube response and pulls out every playable video, plus the
 * continuation token for the next page when present.
 */
export function extractTracks(root: unknown): { tracks: Track[]; continuation?: string | undefined } {
  const tracks: Track[] = [];
  const seen = new Set<string>();
  let continuation: string | undefined;

  const add = (id: string, title: string, artist: string, duration: number) => {
    if (!id || seen.has(id) || !title) return;
    seen.add(id);
    tracks.push({ id, title: cleanTitle(title), artist: cleanArtist(artist) || "YouTube", duration });
  };

  const visit = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    const vr = node.videoRenderer ?? node.playlistVideoRenderer ?? node.playlistPanelVideoRenderer;
    if (vr?.videoId) {
      const lengthText = textOf(vr.lengthText);
      const duration = vr.lengthSeconds ? Number(vr.lengthSeconds) : parseDuration(lengthText);
      add(
        vr.videoId,
        textOf(vr.title),
        textOf(vr.ownerText ?? vr.shortBylineText ?? vr.longBylineText),
        duration || 0,
      );
      return;
    }

    const lv = node.lockupViewModel;
    if (lv && lv.contentType === "LOCKUP_CONTENT_TYPE_VIDEO" && lv.contentId) {
      const meta = lv.metadata?.lockupMetadataViewModel;
      const rows = meta?.metadata?.contentMetadataViewModel?.metadataRows ?? [];
      const artist = textOf(rows[0]?.metadataParts?.[0]?.text);
      add(lv.contentId, textOf(meta?.title), artist, parseDuration(findDurationBadge(lv.contentImage)));
      return;
    }

    const cont = node.continuationItemRenderer ?? node.continuationItemViewModel;
    if (cont) {
      continuation = findToken(cont) ?? continuation;
      return;
    }

    for (const key in node) visit(node[key]);
  };

  visit(root);
  return { tracks, continuation };
}

export function extractPlaylistTitle(root: any): string | undefined {
  return (
    root?.metadata?.playlistMetadataRenderer?.title ??
    root?.header?.pageHeaderRenderer?.pageTitle ??
    textOf(root?.header?.playlistHeaderRenderer?.title) ??
    undefined
  );
}
