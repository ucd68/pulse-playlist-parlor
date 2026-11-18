# Pulse Discord companion

Shows the song you're playing in Pulse on your Discord profile ("Listening to ...").
Works with **Discord in your browser** (no desktop app needed) and also with the Discord desktop app.

## Setup (Discord in the browser, e.g. Linux Mint + Firefox/Chrome)

1. Create an app at https://discord.com/developers/applications, name it **Pulse**, copy its **Application ID**.
2. Install the Vencord browser extension: https://vencord.dev/download (Chrome or Firefox).
3. Open https://discord.com/app → Settings → Vencord → Plugins → enable **WebRichPresence (arRPC)**.
4. Install Node.js 18+ (`sudo apt install nodejs npm`), then in this folder: `npm install`
5. Run: `DISCORD_CLIENT_ID=<your id> npm start`
6. Reload the Discord tab so it connects (the terminal prints "Discord (browser) connected").
7. In Pulse, click the Discord button in the player bar and turn it on.

In Discord: User Settings → Activity Privacy → "Share my activity" must be on.

Ports: website → companion `ws://127.0.0.1:6473` (`PULSE_PORT`), companion → browser Discord `ws://127.0.0.1:1337` (`ARRPC_PORT`).
If you already run arRPC, stop it first (both use port 1337).
