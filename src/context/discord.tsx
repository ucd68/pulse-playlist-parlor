import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { usePlayer } from "@/context/player";
import { usePersistentState } from "@/hooks/use-persistent-state";

export const COMPANION_URL = "ws://127.0.0.1:6473";
export type DiscordStatus = "off" | "no-companion" | "no-discord" | "connected";

type DiscordContextValue = { enabled: boolean; setEnabled: (v: boolean) => void; status: DiscordStatus };
const DiscordContext = createContext<DiscordContextValue | null>(null);

/** Syncs playback to the local Pulse companion, which shows it on Discord. Never affects playback. */
export function DiscordProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = usePersistentState("pulse:discord-enabled", false);
  const [status, setStatus] = useState<DiscordStatus>("off");
  const { current, isPlaying, getCurrentTime, getDuration } = usePlayer();
  const ws = useRef<WebSocket | null>(null);
  const live = useRef({ current, isPlaying, getCurrentTime, getDuration });
  live.current = { current, isPlaying, getCurrentTime, getDuration };
  const lastSent = useRef<{ at: number; pos: number; id: string | null; playing: boolean } | null>(null);

  const sendState = () => {
    const sock = ws.current;
    if (!sock || sock.readyState !== WebSocket.OPEN) return;
    const { current: t, isPlaying: p, getCurrentTime: ct, getDuration: gd } = live.current;
    const pos = ct() || 0;
    lastSent.current = { at: Date.now(), pos, id: t?.id ?? null, playing: p };
    sock.send(JSON.stringify(t ? { type: "state", track: t, isPlaying: p, position: pos, duration: gd() || t.duration } : { type: "clear" }));
  };

  // Connection with backoff while enabled.
  useEffect(() => {
    if (!enabled) { setStatus("off"); return; }
    let stopped = false, retry: ReturnType<typeof setTimeout> | undefined, delay = 2000;
    const connect = () => {
      if (stopped) return;
      let sock: WebSocket;
      try { sock = new WebSocket(COMPANION_URL); } catch { setStatus("no-companion"); return; }
      ws.current = sock;
      sock.onopen = () => { delay = 2000; setStatus("no-discord"); sendState(); };
      sock.onmessage = (e) => {
        try {
          const m = JSON.parse(String(e.data)) as { type: string; discord?: boolean };
          if (m.type === "status") { setStatus(m.discord ? "connected" : "no-discord"); if (m.discord) sendState(); }
        } catch { /* ignore */ }
      };
      sock.onerror = () => {};
      sock.onclose = () => {
        if (ws.current === sock) ws.current = null;
        if (stopped) return;
        setStatus("no-companion");
        retry = setTimeout(connect, delay);
        delay = Math.min(delay * 2, 30000);
      };
    };
    connect();
    return () => { stopped = true; clearTimeout(retry); ws.current?.close(); ws.current = null; };
  }, [enabled]);

  // Song change, play, pause, resume.
  useEffect(() => { if (enabled) sendState(); }, [enabled, current?.id, isPlaying]);

  // Detect seeks: compare real position with where it should be.
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      const last = lastSent.current;
      const { isPlaying: p, getCurrentTime: ct } = live.current;
      if (!last || !p) return;
      const expected = last.pos + (last.playing ? (Date.now() - last.at) / 1000 : 0);
      if (Math.abs(ct() - expected) > 2.5) sendState();
    }, 2000);
    return () => clearInterval(id);
  }, [enabled]);

  return <DiscordContext.Provider value={{ enabled, setEnabled, status }}>{children}</DiscordContext.Provider>;
}

export function useDiscord() {
  const ctx = useContext(DiscordContext);
  if (!ctx) throw new Error("useDiscord must be used inside DiscordProvider");
  return ctx;
}
