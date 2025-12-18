// Simple token-exchange server for Google OAuth (development/example only)
// Usage:
// 1. Create a .env file next to this script with SERVER_CLIENT_ID, SERVER_CLIENT_SECRET, SERVER_REDIRECT_URI
// 2. Install deps: npm install express dotenv node-fetch cors
// 3. Run: node exchange-server.js
// 4. Configure the plugin dev env: VITE_BACKEND_EXCHANGE_URL=http://localhost:3000/exchange

const express = require('express');
const cors = require('cors');
const fetch = globalThis.fetch || require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.SERVER_CLIENT_ID;
const CLIENT_SECRET = process.env.SERVER_CLIENT_SECRET;
const REDIRECT_URI = process.env.SERVER_REDIRECT_URI;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Please set SERVER_CLIENT_ID and SERVER_CLIENT_SECRET in .env');
  process.exit(1);
}

app.use(cors({ origin: ['http://localhost:5173'] }));
app.use(express.json());

app.post('/exchange', async (req, res) => {
  try {
    const { code, redirect_uri, code_verifier } = req.body || {};
    if (!code) return res.status(400).json({ error: 'missing_code' });

    const paramsObj = {
      client_id: CLIENT_ID,
      code,
      redirect_uri: redirect_uri || REDIRECT_URI,
      grant_type: 'authorization_code',
    };
    // include client_secret if present (server-side confidential client)
    if (CLIENT_SECRET) paramsObj.client_secret = CLIENT_SECRET;
    // include PKCE code_verifier when provided
    if (code_verifier) paramsObj.code_verifier = code_verifier;

    const params = new URLSearchParams(paramsObj);

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const bodyText = await tokenRes.text();
    try {
      const parsed = JSON.parse(bodyText);
      res.status(tokenRes.ok ? 200 : 500).json(parsed);
    } catch (_e) {
      res.status(tokenRes.ok ? 200 : 500).send(bodyText);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error', message: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Exchange server listening on http://localhost:${PORT}`);
});
