import { useDiscord, type DiscordStatus } from "@/context/discord";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const LABEL: Record<DiscordStatus, string> = {
  off: "Off",
  "no-companion": "Companion app not running",
  "no-discord": "Waiting for Discord app",
  connected: "Showing on your Discord profile",
};

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.3 18.3 0 0 0-5.5 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18.1A19.9 19.9 0 0 0 6.2 21l1.3-2.1c-.7-.3-1.4-.6-2-1l.5-.4a14.2 14.2 0 0 0 12 0l.5.4c-.6.4-1.3.7-2 1l1.3 2.1a19.8 19.8 0 0 0 6.1-2.9c.5-5.2-.8-9.7-3.6-13.7ZM8 15.4c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.6 8 10.6s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z" />
    </svg>
  );
}

export function DiscordButton() {
  const { enabled, setEnabled, status } = useDiscord();
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Discord presence"
        className={cn(
          "relative grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:text-foreground",
          status === "connected" && "text-primary hover:text-primary",
        )}
      >
        <DiscordIcon className="h-4 w-4" />
        {enabled && (
          <span className={cn("absolute right-1 top-1 h-1.5 w-1.5 rounded-full", status === "connected" ? "bg-primary" : "bg-muted-foreground")} />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Discord presence</p>
            <p className="text-xs text-muted-foreground">{LABEL[status]}</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Show on Discord" />
        </div>
        {enabled && status !== "connected" && (
          <div className="space-y-1 rounded-md bg-surface p-3 text-xs text-muted-foreground">
            <p>Run the Pulse companion on this computer with Discord open:</p>
            <code className="block rounded bg-background px-2 py-1 font-mono text-foreground">
              cd companion && npm install
              <br />
              DISCORD_CLIENT_ID=your_id npm start
            </code>
            <p>See companion/README.md for setup.</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
