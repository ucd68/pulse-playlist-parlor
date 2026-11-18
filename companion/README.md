# Pulse Discord companion

Shows the song you're playing in Pulse on your Discord profile ("Listening to ...").

1. Create an app at https://discord.com/developers/applications, name it **Pulse**, copy its **Application ID**.
2. Install Node.js 18+, then in this folder: `npm install`
3. Run: `DISCORD_CLIENT_ID=<your id> npm start` (Windows PowerShell: `$env:DISCORD_CLIENT_ID="<id>"; npm start`)
4. Keep the Discord desktop app open and turn on **Discord presence** in Pulse (the Discord button in the player bar).

Under User Settings → Activity Privacy, make sure "Share my activity" is on.
The website talks to this program on `ws://127.0.0.1:6473` (change with `PULSE_PORT`).
