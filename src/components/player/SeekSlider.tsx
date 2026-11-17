import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

/** Spotify-style thin slider: fills green and shows a thumb on hover. */
export function SeekSlider({
  value,
  max,
  onChange,
  onCommit,
  label,
  className,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  onCommit?: (v: number) => void;
  label: string;
  className?: string;
}) {
  return (
    <SliderPrimitive.Root
      value={[Math.min(value, max)]}
      max={max || 1}
      step={max > 0 ? Math.max(max / 1000, 0.1) : 1}
      onValueChange={([v]) => onChange(v ?? 0)}
      onValueCommit={([v]) => onCommit?.(v ?? 0)}
      aria-label={label}
      className={cn("group relative flex h-4 w-full cursor-pointer touch-none items-center select-none", className)}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-foreground/20">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-foreground transition-colors group-hover:bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-3 w-3 rounded-full bg-foreground opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none" />
    </SliderPrimitive.Root>
  );
}
