import express from "express";
import fetch from "node-fetch";
import 'dotenv/config'; // ✅ add this line

const app = express();
const PORT = 1254;

// ✅ replace hardcoded values with environment variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:1254/callback";



// Home page
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Discord Login</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white flex flex-col justify-center items-center h-screen">
  <div class="text-center">
    <h1 class="text-4xl font-bold mb-6">Login with Discord</h1>
    <a href="https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=identify%20email%20guilds%20connections">
      <button class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-xl transition">Login</button>
    </a>
  </div>
</body>
</html>
`);
});

// Callback route
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("❌ No code received.");

  try {
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
      return res.send("❌ Token error: " + tokenData.error);
    }

    // ✅ Successful login, redirect to a page (e.g. YouTube, Discord, etc.)
    res.redirect("https://youtu.be/dQw4w9WgXcQ");
  } catch (error) {
    console.error(error);
    res.send("❌ An error occurred while handling the callback.");
  }
});

// 🟢 Keeps the server running
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});

