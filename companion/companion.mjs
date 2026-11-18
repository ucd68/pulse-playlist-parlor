#!/usr/bin/env node
// Pulse Discord companion: bridges the Pulse website (WebSocket on localhost)
// to the Discord desktop app (local IPC socket) to show Rich Presence.
import net from "node:net";
import path from "node:path";
import { WebSocketServer } from "ws";
import { buildActivity } from "./presence.mjs";

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || process.argv[2];
const PORT = Number(process.env.PULSE_PORT || 6473);
if (!CLIENT_ID) {
  console.error("Missing Discord application ID.\nUsage: DISCORD_CLIENT_ID=123456789 npm start");
  process.exit(1);
}

// ---------- Discord IPC ----------
function ipcPath(i) {
  if (process.platform === "win32") return `\\\\?\\pipe\\discord-ipc-${i}`;
  const base = process.env.XDG_RUNTIME_DIR || process.env.TMPDIR || process.env.TMP || "/tmp";
  return path.join(base.replace(/\/$/, ""), `discord-ipc-${i}`);
}

let sock = null, ready = false, buf = Buffer.alloc(0), lastActivity = null;

function send(op, payload) {
  const json = Buffer.from(JSON.stringify(payload));
  const header = Buffer.alloc(8);
  header.writeInt32LE(op, 0);
  header.writeInt32LE(json.length, 4);
  sock.write(Buffer.concat([header, json]));
}

function connectDiscord(i = 0) {
  if (i > 9) { setTimeout(() => connectDiscord(0), 5000); return; }
  const s = net.createConnection(ipcPath(i));
  s.once("error", () => { s.destroy(); connectDiscord(i + 1); });
  s.once("connect", () => {
    sock = s; buf = Buffer.alloc(0);
    s.removeAllListeners("error");
    s.on("error", () => {});
    s.on("close", () => {
      if (ready) console.log("Discord disconnected, retrying...");
      sock = null; ready = false; broadcast();
      setTimeout(() => connectDiscord(0), 5000);
    });
    s.on("data", onData);
    send(0, { v: 1, client_id: CLIENT_ID });
  });
}

function onData(chunk) {
  buf = Buffer.concat([buf, chunk]);
  while (buf.length >= 8) {
    const op = buf.readInt32LE(0), len = buf.readInt32LE(4);
    if (buf.length < 8 + len) return;
    const msg = JSON.parse(buf.subarray(8, 8 + len).toString());
    buf = buf.subarray(8 + len);
    if (op === 1 && msg.evt === "READY") {
      ready = true;
      console.log(`Connected to Discord as ${msg.data?.user?.username ?? "you"}`);
      broadcast(); pushActivity(lastActivity, true);
    } else if (op === 1 && msg.evt === "ERROR") {
      console.error("Discord error:", msg.data?.message);
    } else if (op === 2) {
      console.error("Discord closed the connection:", msg.message); sock?.destroy();
    } else if (op === 3) {
      send(4, msg); // pong
    }
  }
}

// Discord allows ~5 updates per 20s, so throttle and skip duplicates.
let pending = null, timer = null, lastSentAt = 0, lastSentKey = "";
function pushActivity(activity, force = false) {
  lastActivity = activity;
  if (!ready) return;
  const key = JSON.stringify(activity);
  if (!force && key === lastSentKey) return;
  pending = activity;
  const wait = Math.max(0, 4000 - (Date.now() - lastSentAt));
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    if (!ready) return;
    lastSentAt = Date.now(); lastSentKey = JSON.stringify(pending);
    send(1, { cmd: "SET_ACTIVITY", args: { pid: process.pid, activity: pending ?? undefined }, nonce: String(Date.now()) });
  }, wait);
}

// ---------- WebSocket for the website ----------
const wss = new WebSocketServer({ host: "127.0.0.1", port: PORT });
const clients = new Set();
function broadcast() {
  const msg = JSON.stringify({ type: "status", discord: ready });
  for (const c of clients) if (c.readyState === 1) c.send(msg);
}
let lastStatePos = null;
wss.on("connection", (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: "status", discord: ready }));
  ws.on("message", (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.type === "state") {
      const act = buildActivity(m);
      // Ignore tiny clock drift on timestamps so we don't spam Discord.
      if (act?.timestamps && lastActivity?.timestamps && lastStatePos &&
          lastActivity.details === act.details && Math.abs(act.timestamps.start - lastActivity.timestamps.start) < 3000) return;
      lastStatePos = m.position;
      pushActivity(act);
    } else if (m.type === "clear") pushActivity(null);
  });
  ws.on("close", () => { clients.delete(ws); if (clients.size === 0) pushActivity(null); });
});
wss.on("listening", () => console.log(`Pulse companion listening on ws://127.0.0.1:${PORT}`));
wss.on("error", (e) => { console.error("WebSocket error:", e.message); process.exit(1); });

connectDiscord();
process.on("SIGINT", () => { if (ready) send(1, { cmd: "SET_ACTIVITY", args: { pid: process.pid }, nonce: "bye" }); setTimeout(() => process.exit(0), 200); });
