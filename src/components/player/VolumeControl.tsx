import { Volume, Volume1, Volume2, VolumeX } from "lucide-react";

import { SeekSlider } from "@/components/player/SeekSlider";
import { usePlayer } from "@/context/player";

export function VolumeControl() {
  const { volume, muted, setVolume, toggleMute } = usePlayer();
  const level = muted ? 0 : volume;
  const Icon = level === 0 ? VolumeX : level < 35 ? Volume : level < 70 ? Volume1 : Volume2;

  return (
    <div className="flex w-36 items-center gap-2">
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className="grid h-8 w-8 shrink-0 place-items-center text-muted-foreground transition hover:text-foreground"
      >
        <Icon className="h-4 w-4" />
      </button>
      <SeekSlider label="Volume" value={level} max={100} onChange={(v) => setVolume(Math.round(v))} />
    </div>
  );
}
