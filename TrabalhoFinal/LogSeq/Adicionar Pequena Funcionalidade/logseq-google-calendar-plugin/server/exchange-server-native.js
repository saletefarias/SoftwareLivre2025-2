// Minimal token-exchange server using only built-in Node APIs and global fetch (Node 18+)
// Development only. Reads server/.env in same folder for SERVER_CLIENT_ID, SERVER_CLIENT_SECRET, SERVER_REDIRECT_URI
// Usage: node exchange-server-native.js

const http = require('http');
const fs = require('fs');
const { URLSearchParams } = require('url');

const ROOT = __dirname;
const ENV_PATH = ROOT + '/.env';
let env = {};
try {
  const txt = fs.readFileSync(ENV_PATH, 'utf8');
  txt.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  });
} catch (e) {
  console.error('Warning: could not read server/.env. Make sure SERVER_CLIENT_ID and SERVER_CLIENT_SECRET are present.');
}

const CLIENT_ID = env.SERVER_CLIENT_ID || process.env.SERVER_CLIENT_ID;
const CLIENT_SECRET = env.SERVER_CLIENT_SECRET || process.env.SERVER_CLIENT_SECRET;
const REDIRECT_URI = env.SERVER_REDIRECT_URI || process.env.SERVER_REDIRECT_URI || 'http://localhost:5173/oauth2callback.html';
const PORT = process.env.PORT || 3000;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Please set SERVER_CLIENT_ID and SERVER_CLIENT_SECRET in server/.env');
  process.exit(1);
}

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': 'http://localhost:5173',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/exchange') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
  const code = data.code;
  const redirect_uri = data.redirect_uri || REDIRECT_URI;
  const code_verifier = data.code_verifier;
        if (!code) return sendJSON(res, 400, { error: 'missing_code' });

        const paramsObj = {
          client_id: CLIENT_ID,
          code,
          redirect_uri,
          grant_type: 'authorization_code',
        };
        // include client_secret if available (server-side confidential client)
        if (CLIENT_SECRET) paramsObj.client_secret = CLIENT_SECRET;
        // include code_verifier when provided (PKCE)
        if (code_verifier) paramsObj.code_verifier = code_verifier;
        const params = new URLSearchParams(paramsObj);

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });

        const text = await tokenRes.text();
        try {
          const parsed = JSON.parse(text);
          sendJSON(res, tokenRes.ok ? 200 : 500, parsed);
        } catch (e) {
          res.writeHead(tokenRes.ok ? 200 : 500, {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': 'http://localhost:5173',
          });
          res.end(text);
        }
      } catch (err) {
        console.error(err);
        sendJSON(res, 500, { error: 'server_error', message: String(err) });
      }
    });
    return;
  }

  // default
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Native exchange server listening on http://localhost:${PORT}`);
});
