#!/usr/bin/env node
// Pulse Discord companion: receives playback state from the Pulse website
// (WebSocket on localhost) and shows it as Rich Presence on Discord.
// Works with Discord in the browser (via the Vencord web extension's
// "WebRichPresence (arRPC)" plugin) and with the Discord desktop app.
import net from "node:net";
import path from "node:path";
import { WebSocketServer } from "ws";
import { buildActivity, toWebActivity } from "./presence.mjs";

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || process.argv[2];
const PORT = Number(process.env.PULSE_PORT || 6473); // website -> companion
const WEB_PORT = Number(process.env.ARRPC_PORT || 1337); // companion -> Discord in browser
if (!CLIENT_ID) {
  console.error("Missing Discord application ID.\nUsage: DISCORD_CLIENT_ID=123456789 npm start");
  process.exit(1);
}

let lastActivity = null;
const discordReady = () => ipcReady || webDiscord.size > 0;

// ---------- Discord in the browser (arRPC bridge protocol) ----------
const webDiscord = new Set();
const webWss = new WebSocketServer({ host: "127.0.0.1", port: WEB_PORT });
function sendWeb(activity, target) {
  const msg = JSON.stringify({ activity: toWebActivity(activity, CLIENT_ID), pid: process.pid, socketId: "pulse" });
  for (const c of target ? [target] : webDiscord) if (c.readyState === 1) c.send(msg);
}
webWss.on("connection", (ws, req) => {
  const origin = req.headers.origin || "";
  if (origin && !/^https:\/\/([a-z]+\.)?discord\.com$/.test(origin)) { ws.close(); return; }
  webDiscord.add(ws);
  console.log("Discord (browser) connected");
  broadcastStatus();
  sendWeb(lastActivity, ws);
  ws.on("close", () => { webDiscord.delete(ws); console.log("Discord (browser) disconnected"); broadcastStatus(); });
});
webWss.on("listening", () => console.log(`Waiting for Discord in your browser on ws://127.0.0.1:${WEB_PORT}`));
webWss.on("error", (e) => console.error(`Browser Discord bridge unavailable (port ${WEB_PORT}): ${e.message}. Is arRPC already running?`));

// ---------- Discord desktop app (local IPC, optional) ----------
function ipcPath(i) {
  if (process.platform === "win32") return `\\\\?\\pipe\\discord-ipc-${i}`;
  const base = process.env.XDG_RUNTIME_DIR || process.env.TMPDIR || process.env.TMP || "/tmp";
  return path.join(base.replace(/\/$/, ""), `discord-ipc-${i}`);
}
let sock = null, ipcReady = false, buf = Buffer.alloc(0);
function sendIpc(op, payload) {
  if (!sock) return;
  const json = Buffer.from(JSON.stringify(payload));
  const header = Buffer.alloc(8);
  header.writeInt32LE(op, 0);
  header.writeInt32LE(json.length, 4);
  sock.write(Buffer.concat([header, json]));
}
function connectDesktop(i = 0) {
  if (i > 9) { setTimeout(() => connectDesktop(0), 10000); return; }
  const s = net.createConnection(ipcPath(i));
  s.once("error", () => { s.destroy(); connectDesktop(i + 1); });
  s.once("connect", () => {
    sock = s; buf = Buffer.alloc(0);
    s.removeAllListeners("error");
    s.on("error", () => {});
    s.on("close", () => {
      if (ipcReady) console.log("Discord desktop app disconnected");
      sock = null; ipcReady = false; broadcastStatus();
      setTimeout(() => connectDesktop(0), 10000);
    });
    s.on("data", onIpcData);
    sendIpc(0, { v: 1, client_id: CLIENT_ID });
  });
}
function onIpcData(chunk) {
  buf = Buffer.concat([buf, chunk]);
  while (buf.length >= 8) {
    const op = buf.readInt32LE(0), len = buf.readInt32LE(4);
    if (buf.length < 8 + len) return;
    const msg = JSON.parse(buf.subarray(8, 8 + len).toString());
    buf = buf.subarray(8 + len);
    if (op === 1 && msg.evt === "READY") {
      ipcReady = true;
      console.log(`Discord desktop app connected as ${msg.data?.user?.username ?? "you"}`);
      broadcastStatus(); lastIpcKey = ""; pushActivity(lastActivity);
    } else if (op === 1 && msg.evt === "ERROR") console.error("Discord error:", msg.data?.message);
    else if (op === 2) { console.error("Discord closed the connection:", msg.message); sock?.destroy(); }
    else if (op === 3) sendIpc(4, msg);
  }
}

// Desktop IPC allows ~5 updates per 20s, so throttle it. The browser bridge has no limit.
let pending = null, timer = null, lastSentAt = 0, lastIpcKey = "";
function pushActivity(activity) {
  lastActivity = activity;
  sendWeb(activity);
  if (!ipcReady || JSON.stringify(activity) === lastIpcKey) return;
  pending = activity;
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    if (!ipcReady) return;
    lastSentAt = Date.now(); lastIpcKey = JSON.stringify(pending);
    sendIpc(1, { cmd: "SET_ACTIVITY", args: { pid: process.pid, activity: pending ?? undefined }, nonce: String(Date.now()) });
  }, Math.max(0, 4000 - (Date.now() - lastSentAt)));
}

// ---------- WebSocket for the Pulse website ----------
const wss = new WebSocketServer({ host: "127.0.0.1", port: PORT });
const sites = new Set();
function broadcastStatus() {
  const msg = JSON.stringify({ type: "status", discord: discordReady() });
  for (const c of sites) if (c.readyState === 1) c.send(msg);
}
wss.on("connection", (ws) => {
  sites.add(ws);
  ws.send(JSON.stringify({ type: "status", discord: discordReady() }));
  ws.on("message", (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.type === "state") {
      const act = buildActivity(m);
      // Ignore tiny clock drift on timestamps so we don't spam Discord.
      if (act?.timestamps && lastActivity?.timestamps && lastActivity.details === act.details &&
          lastActivity.state === act.state && Math.abs(act.timestamps.start - lastActivity.timestamps.start) < 3000) return;
      pushActivity(act);
    } else if (m.type === "clear") pushActivity(null);
  });
  ws.on("close", () => { sites.delete(ws); if (sites.size === 0) pushActivity(null); });
});
wss.on("listening", () => console.log(`Pulse companion listening for the website on ws://127.0.0.1:${PORT}`));
wss.on("error", (e) => { console.error("WebSocket error:", e.message); process.exit(1); });

connectDesktop();
process.on("SIGINT", () => {
  sendWeb(null);
  if (ipcReady) sendIpc(1, { cmd: "SET_ACTIVITY", args: { pid: process.pid }, nonce: "bye" });
  setTimeout(() => process.exit(0), 200);
});
