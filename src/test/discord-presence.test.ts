import { describe, expect, it } from "vitest";
// @ts-expect-error plain JS module
import { buildActivity } from "../../companion/presence.mjs";

const track = { id: "abc", title: "Song", artist: "Artist", duration: 200 };
describe("buildActivity", () => {
  it("playing sets timestamps from position", () => {
    const a = buildActivity({ track, isPlaying: true, position: 50, duration: 200 }, 1_000_000);
    expect(a.timestamps).toEqual({ start: 950_000, end: 1_150_000 });
    expect(a.assets.large_image).toBe("https://i.ytimg.com/vi/abc/hqdefault.jpg");
  });
  it("paused has no timestamps", () => {
    const a = buildActivity({ track, isPlaying: false, position: 50, duration: 200 });
    expect(a.timestamps).toBeUndefined();
    expect(a.state).toContain("Paused");
  });
  it("no track clears", () => {
    expect(buildActivity({ track: null, isPlaying: false, position: 0, duration: 0 })).toBeNull();
  });
});
