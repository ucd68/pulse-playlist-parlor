/**
 * Turns a playback state message from the Pulse website into a Discord activity.
 * Pure function so it can be unit tested.
 * @param {{track: {id:string,title:string,artist:string,duration:number}|null, isPlaying:boolean, position:number, duration:number}} state
 * @param {number} now epoch ms
 */
export function buildActivity(state, now = Date.now()) {
  if (!state || !state.track) return null;
  const { track } = state;
  const clip = (s, fallback) => {
    const v = String(s || fallback).trim();
    return (v.length < 2 ? v + "  " : v).slice(0, 128);
  };
  const activity = {
    type: 2, // "Listening to"
    details: clip(track.title, "Unknown song"),
    state: clip(state.isPlaying ? `by ${track.artist}` : `Paused · ${track.artist}`, "Unknown artist"),
    assets: {
      large_image: `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`,
      large_text: clip(track.title, "Pulse"),
    },
    buttons: [{ label: "Listen on YouTube", url: `https://www.youtube.com/watch?v=${track.id}` }],
  };
  if (state.isPlaying) {
    const duration = state.duration || track.duration || 0;
    const start = now - Math.max(0, state.position) * 1000;
    activity.timestamps = duration > 0
      ? { start: Math.round(start), end: Math.round(start + duration * 1000) }
      : { start: Math.round(start) };
  }
  return activity;
}

/**
 * Converts a Discord RPC activity into the "local activity" shape that Discord's
 * web client expects (what arRPC sends to the Vencord "WebRichPresence (arRPC)" plugin).
 * @param {ReturnType<typeof buildActivity>} activity
 * @param {string} clientId Discord application id
 */
export function toWebActivity(activity, clientId) {
  if (!activity) return null;
  const { buttons, ...rest } = activity;
  const web = { ...rest, application_id: clientId, name: "Pulse", flags: 0 };
  if (buttons?.length) {
    web.buttons = buttons.map((b) => b.label);
    web.metadata = { button_urls: buttons.map((b) => b.url) };
  }
  return web;
}
