import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { useLibrary } from "@/context/library";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { getNextIndex, getPrevIndex, nextRepeatMode, RESTART_THRESHOLD, shuffleQueue } from "@/lib/queue";
import { thumbnailUrl, type RepeatMode, type Track } from "@/lib/types";
import { cn } from "@/lib/utils";
import { loadYouTubeApi, YT_STATE, type YTPlayer } from "@/lib/youtube-iframe";

type Session = { queue: Track[]; original: Track[]; index: number };
type Settings = { volume: number; muted: boolean; shuffle: boolean; repeat: RepeatMode };

type PlayerContextValue = {
  current: Track | null;
  queue: Track[];
  index: number;
  isPlaying: boolean;
  isBuffering: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  muted: boolean;
  showVideo: boolean;
  playTracks: (tracks: Track[], startIndex?: number, opts?: { shuffle?: boolean }) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  jumpTo: (index: number) => void;
  clearQueue: () => void;
  setShowVideo: (v: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

const EMPTY_SESSION: Session = { queue: [], original: [], index: 0 };
const DEFAULT_SETTINGS: Settings = { volume: 80, muted: false, shuffle: false, repeat: "off" };
const MAX_ERROR_STREAK = 5;

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { addRecent } = useLibrary();
  const [session, setSession, sessionLoaded] = usePersistentState<Session>("pulse:session", EMPTY_SESSION);
  const [settings, setSettings] = usePersistentState<Settings>("pulse:settings", DEFAULT_SETTINGS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  const pendingRef = useRef<{ id: string; autoplay: boolean } | null>(null);
  const loadedIdRef = useRef<string | null>(null);
  const errorStreak = useRef(0);
  const restored = useRef(false);

  // Event handlers registered once with the YouTube player read state through this ref.
  const latest = useRef({ session, settings });
  latest.current = { session, settings };

  const current = session.queue[session.index] ?? null;

  const load = useCallback(
    (track: Track, autoplay: boolean) => {
      loadedIdRef.current = track.id;
      if (autoplay) addRecent(track);
      const p = playerRef.current;
      if (!p || !readyRef.current) {
        pendingRef.current = { id: track.id, autoplay };
        return;
      }
      if (autoplay) p.loadVideoById(track.id);
      else p.cueVideoById(track.id);
    },
    [addRecent],
  );

  const startAt = useCallback(
    (next: Session, autoplay = true) => {
      latest.current = { ...latest.current, session: next };
      setSession(next);
      const track = next.queue[next.index];
      if (track) load(track, autoplay);
      if (!autoplay) setIsPlaying(false);
    },
    [load, setSession],
  );

  const playTracks = useCallback<PlayerContextValue["playTracks"]>(
    (tracks, startIndex = 0, opts) => {
      if (tracks.length === 0) return;
      const shuffle = opts?.shuffle ?? latest.current.settings.shuffle;
      if (opts?.shuffle !== undefined) setSettings((s) => ({ ...s, shuffle }));
      errorStreak.current = 0;
      startAt({
        queue: shuffle ? shuffleQueue(tracks, startIndex) : tracks,
        original: tracks,
        index: shuffle ? 0 : startIndex,
      });
    },
    [setSettings, startAt],
  );

  const advance = useCallback(
    (repeat: RepeatMode) => {
      const { session: s } = latest.current;
      const i = getNextIndex(s.index, s.queue.length, repeat);
      if (i === null) {
        setIsPlaying(false);
        return false;
      }
      startAt({ ...s, index: i });
      return true;
    },
    [startAt],
  );

  const next = useCallback(() => {
    const { session: s, settings: st } = latest.current;
    if (s.queue.length === 0) return;
    const moved = advance(st.repeat === "off" ? "off" : "all");
    if (!moved) startAt({ ...s, index: 0 }, false);
  }, [advance, startAt]);

  const previous = useCallback(() => {
    const p = playerRef.current;
    const { session: s, settings: st } = latest.current;
    if ((p?.getCurrentTime?.() ?? 0) > RESTART_THRESHOLD) {
      p?.seekTo(0, true);
      return;
    }
    const i = getPrevIndex(s.index, s.queue.length, st.repeat === "off" ? "off" : "all");
    if (i === null) p?.seekTo(0, true);
    else startAt({ ...s, index: i });
  }, [startAt]);

  const handlers = useRef({ onState: (_: number) => {}, onError: (_: number) => {} });
  handlers.current = {
    onState: (state) => {
      if (state === YT_STATE.PLAYING) {
        errorStreak.current = 0;
        setIsPlaying(true);
        setIsBuffering(false);
      } else if (state === YT_STATE.PAUSED || state === YT_STATE.CUED) {
        setIsPlaying(false);
        setIsBuffering(false);
      } else if (state === YT_STATE.BUFFERING) {
        setIsBuffering(true);
      } else if (state === YT_STATE.ENDED) {
        if (latest.current.settings.repeat === "one") {
          playerRef.current?.seekTo(0, true);
          playerRef.current?.playVideo();
        } else {
          advance(latest.current.settings.repeat);
        }
      }
    },
    onError: () => {
      setIsBuffering(false);
      errorStreak.current += 1;
      const { session: s } = latest.current;
      const title = s.queue[s.index]?.title ?? "This song";
      if (errorStreak.current >= MAX_ERROR_STREAK) {
        setIsPlaying(false);
        toast.error("Several songs in a row couldn't be played. Try another one.");
        return;
      }
      toast.error(`“${title}” can't be played outside YouTube — skipping`);
      advance(latest.current.settings.repeat === "off" ? "off" : "all");
    },
  };

  // Boot the YouTube player once; it survives every page change because it lives here.
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;
      const el = document.createElement("div");
      hostRef.current.appendChild(el);
      playerRef.current = new YT.Player(el, {
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          rel: 0,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            readyRef.current = true;
            const { settings: st } = latest.current;
            e.target.setVolume(st.volume);
            if (st.muted) e.target.mute();
            const pending = pendingRef.current;
            pendingRef.current = null;
            if (pending) {
              if (pending.autoplay) e.target.loadVideoById(pending.id);
              else e.target.cueVideoById(pending.id);
            }
          },
          onStateChange: (e) => handlers.current.onState(e.data),
          onError: (e) => handlers.current.onError(e.data),
        },
      });
    });
    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      readyRef.current = false;
    };
  }, []);

  // Restore the last session (paused) once storage has loaded.
  useEffect(() => {
    if (!sessionLoaded || restored.current) return;
    restored.current = true;
    const track = session.queue[session.index];
    if (track && !loadedIdRef.current) load(track, false);
  }, [sessionLoaded, session, load]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p || !readyRef.current) return;
    p.setVolume(settings.volume);
    if (settings.muted) p.mute();
    else p.unMute();
  }, [settings.volume, settings.muted]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    const track = latest.current.session.queue[latest.current.session.index];
    if (!track) return;
    if (isPlaying) {
      p?.pauseVideo();
      return;
    }
    if (loadedIdRef.current !== track.id || !readyRef.current) load(track, true);
    else p?.playVideo();
  }, [isPlaying, load]);

  const seek = useCallback((seconds: number) => playerRef.current?.seekTo(seconds, true), []);
  const setVolume = useCallback(
    (volume: number) => setSettings((s) => ({ ...s, volume, muted: volume === 0 ? s.muted : false })),
    [setSettings],
  );
  const toggleMute = useCallback(() => setSettings((s) => ({ ...s, muted: !s.muted })), [setSettings]);
  const cycleRepeat = useCallback(
    () => setSettings((s) => ({ ...s, repeat: nextRepeatMode(s.repeat) })),
    [setSettings],
  );

  const toggleShuffle = useCallback(() => {
    const { session: s, settings: st } = latest.current;
    const turningOn = !st.shuffle;
    setSettings((prev) => ({ ...prev, shuffle: turningOn }));
    if (s.queue.length === 0) return;
    if (turningOn) {
      setSession({ queue: shuffleQueue(s.queue, s.index), original: s.queue, index: 0 });
    } else {
      const playing = s.queue[s.index];
      const idx = s.original.findIndex((t) => t.id === playing?.id);
      if (idx >= 0) setSession({ queue: s.original, original: s.original, index: idx });
    }
  }, [setSession, setSettings]);

  const addToQueue = useCallback(
    (track: Track) => {
      const s = latest.current.session;
      if (s.queue.length === 0) {
        playTracks([track]);
        return;
      }
      setSession({ ...s, queue: [...s.queue, track], original: [...s.original, track] });
      toast.success("Added to queue");
    },
    [playTracks, setSession],
  );

  const playNext = useCallback(
    (track: Track) => {
      const s = latest.current.session;
      if (s.queue.length === 0) {
        playTracks([track]);
        return;
      }
      const queue = [...s.queue];
      queue.splice(s.index + 1, 0, track);
      const playing = s.queue[s.index];
      const origIdx = s.original.findIndex((t) => t.id === playing?.id);
      const original = [...s.original];
      original.splice(origIdx + 1, 0, track);
      setSession({ ...s, queue, original });
      toast.success("Will play next");
    },
    [playTracks, setSession],
  );

  const removeFromQueue = useCallback(
    (i: number) => {
      const s = latest.current.session;
      if (i === s.index || !s.queue[i]) return;
      const removed = s.queue[i];
      const origIdx = s.original.findIndex((t) => t.id === removed.id);
      setSession({
        queue: s.queue.filter((_, j) => j !== i),
        original: s.original.filter((_, j) => j !== origIdx),
        index: i < s.index ? s.index - 1 : s.index,
      });
    },
    [setSession],
  );

  const jumpTo = useCallback((i: number) => startAt({ ...latest.current.session, index: i }), [startAt]);

  const clearQueue = useCallback(() => {
    const s = latest.current.session;
    const playing = s.queue[s.index];
    setSession(playing ? { queue: [playing], original: [playing], index: 0 } : EMPTY_SESSION);
  }, [setSession]);

  const getCurrentTime = useCallback(() => playerRef.current?.getCurrentTime?.() ?? 0, []);
  const getDuration = useCallback(() => playerRef.current?.getDuration?.() ?? 0, []);

  // Hardware media keys / lock-screen controls.
  useEffect(() => {
    if (!current || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        album: "Pulse",
        artwork: [{ src: thumbnailUrl(current.id), sizes: "480x360", type: "image/jpeg" }],
      });
      navigator.mediaSession.setActionHandler("play", () => playerRef.current?.playVideo());
      navigator.mediaSession.setActionHandler("pause", () => playerRef.current?.pauseVideo());
      navigator.mediaSession.setActionHandler("nexttrack", next);
      navigator.mediaSession.setActionHandler("previoustrack", previous);
    } catch {
      /* unsupported */
    }
  }, [current, next, previous]);

  // Space bar toggles playback anywhere outside form fields.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, button, [role=slider], [contenteditable=true]")) return;
      e.preventDefault();
      togglePlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      current,
      queue: session.queue,
      index: session.index,
      isPlaying,
      isBuffering,
      shuffle: settings.shuffle,
      repeat: settings.repeat,
      volume: settings.volume,
      muted: settings.muted,
      showVideo,
      playTracks,
      togglePlay,
      next,
      previous,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      addToQueue,
      playNext,
      removeFromQueue,
      jumpTo,
      clearQueue,
      setShowVideo,
      getCurrentTime,
      getDuration,
    }),
    [current, session, isPlaying, isBuffering, settings, showVideo, playTracks, togglePlay, next, previous, seek, setVolume, toggleMute, toggleShuffle, cycleRepeat, addToQueue, playNext, removeFromQueue, jumpTo, clearQueue, getCurrentTime, getDuration],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {/* The real YouTube player. Kept rendered (just faded out) so playback never stops. */}
      <div
        aria-hidden={!showVideo}
        className={cn(
          "fixed right-3 bottom-40 z-[60] aspect-video w-64 overflow-hidden rounded-xl border border-border bg-card shadow-elevated transition-all duration-300 sm:w-80 md:bottom-28",
          showVideo ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <div ref={hostRef} className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full" />
        <button
          type="button"
          onClick={() => setShowVideo(false)}
          aria-label="Hide video"
          className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur transition hover:bg-background"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
