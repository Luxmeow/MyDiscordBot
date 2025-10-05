import express from "express";
import fetch from "node-fetch";
import 'dotenv/config'; // load environment variables

const app = express();
const PORT = process.env.PORT || 1254; // dynamic port for Render

// Use environment variables for secrets
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI; // should match your Discord OAuth2 app

// --- Home page ---
app.get("/", (req, res) => {
  const scopes = ["identify", "email", "guilds", "connections"];
  const authorizeURL =
    `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${scopes.join("%20")}`;
  res.send(`<a href="${authorizeURL}">Login with Discord</a>`);
});

// --- Callback from Discord ---
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("❌ No code returned from Discord");

  // exchange code for token
  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      scope: "identify email guilds connections",
    }),
  });

  const tokenData = await tokenResponse.json();
  if (tokenData.error) {
    return res.send(`❌ Error getting token: ${tokenData.error_description}`);
  }

  const accessToken = tokenData.access_token;

  // fetch user data
  const userResponse = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const userData = await userResponse.json();

  // fetch user's guilds
  const guildResponse = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const guildData = await guildResponse.json();

  // fetch user's connected accounts
  const connectionsResponse = await fetch("https://discord.com/api/users/@me/connections", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const connectionsData = await connectionsResponse.json();

  // send results to browser
  res.send(`
    <h2>✅ Welcome, ${userData.global_name || userData.username}</h2>
    <img src="https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png" width="100">
    <p>Email: ${userData.email || "Not available"}</p>
    <p>ID: ${userData.id}</p>
    <h3>🧩 Your Servers:</h3>
    <ul>${guildData.map(g => `<li>${g.name}</li>`).join("")}</ul>
    <h3>🔗 Connected Accounts:</h3>
    <ul>${connectionsData.map(c => `<li>${c.type}</li>`).join("")}</ul>
  `);

  console.log("👤 Logged in:", userData.username);
});

// Start server
app.listen(PORT, () => console.log(`✅ Server running at ${REDIRECT_URI.replace("/callback","")}`));
