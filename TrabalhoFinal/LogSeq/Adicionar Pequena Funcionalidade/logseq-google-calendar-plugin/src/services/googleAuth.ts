// Minimal PKCE-based Google OAuth helper (PoC).
//
// This implementation is intentionally lightweight and suitable for development
// or as a starting point. It uses `localStorage` to persist tokens and relies on
// a manual code-paste flow (opens the OAuth page and asks you to paste the
// authorization code). For production use you should provide a redirect URI and
// a more robust exchange (server-side if necessary).

const TOKEN_STORAGE_KEY = 'gcal_plugin_token';

// Client ID and Redirect URI are read from environment variables set by Vite.
// Do NOT commit your secrets to git. Create a `.env.local` (ignored) with the
// variables below. Example in `.env.example`.
const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || '';
const REDIRECT_URI = (import.meta.env.VITE_GOOGLE_REDIRECT_URI as string) || 'urn:ietf:wg:oauth:2.0:oob';
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// Optional development-only client secret support (NOT recommended for production)
const CLIENT_SECRET = (import.meta.env.VITE_GOOGLE_CLIENT_SECRET as string) || '';
const ALLOW_INSECURE_CLIENT_SECRET = (import.meta.env.VITE_ALLOW_INSECURE_CLIENT_SECRET as string) === 'true';
// Optional backend exchange URL: when set, POST code to this URL and let backend
// perform token exchange with client_secret server-side.
const BACKEND_EXCHANGE_URL = (import.meta.env.VITE_BACKEND_EXCHANGE_URL as string) || '';

type TokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

function base64UrlEncode(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return await crypto.subtle.digest('SHA-256', data);
}

function generateCodeVerifier() {
  // 128 chars max; generate a random base64url string
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return base64UrlEncode(array.buffer);
}

async function generateCodeChallenge(verifier: string) {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
}

async function saveToken(token: TokenResponse) {
  const expiresAt = token.expires_in ? Date.now() + token.expires_in * 1000 : undefined;
  const payload = { token, expiresAt };

  try {
  const ls = (globalThis as unknown as { logseq?: { updateSettings?: (...args: unknown[]) => unknown; settings?: Record<string, string> } }).logseq;
    // Prefer storing in Logseq plugin settings when available
    if (ls && typeof ls.updateSettings === 'function') {
  const existing = (ls as unknown as { settings?: Record<string, string> }).settings || {};
  const toSave = Object.assign({}, existing, { [TOKEN_STORAGE_KEY]: JSON.stringify(payload) });
      // updateSettings may be sync or async depending on runtime
      await Promise.resolve(ls.updateSettings(toSave));
      return;
    }
  } catch (err) {
    console.warn('logseq storage save failed, falling back to localStorage', err);
  }

  // Fallback to localStorage for non-Logseq environments
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(payload));
}

async function getTokenFromStorage(): Promise<{ token: TokenResponse; expiresAt?: number } | null> {
  try {
    const ls = (globalThis as unknown as { logseq?: { settings?: Record<string, string> } }).logseq;
    if (ls && (ls as unknown as { settings?: Record<string, string> }).settings && (ls as unknown as { settings?: Record<string, string> }).settings![TOKEN_STORAGE_KEY]) {
      const raw = (ls as unknown as { settings?: Record<string, string> }).settings![TOKEN_STORAGE_KEY];
      try {
        return JSON.parse(raw);
      } catch (err) {
        console.warn('Failed to parse token from logseq.settings', err);
        return null;
      }
    }
  } catch (err) {
    console.warn('logseq storage read failed, falling back to localStorage', err);
  }

  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse token from localStorage', err);
    return null;
  }
}

async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenResponse> {
  // If a backend exchange URL is provided, forward the code + redirect to that
  // backend and let it perform the token exchange using its client_secret.
  if (BACKEND_EXCHANGE_URL) {
  // Include PKCE code_verifier when available so backend can perform PKCE exchange
  const body = { code, redirect_uri: REDIRECT_URI, code_verifier: codeVerifier };
    const res = await fetch(BACKEND_EXCHANGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    let text = '';
    let parsed: Record<string, unknown> | null = null;
    const maybeResponse = res as unknown as { text?: () => Promise<string>; json?: () => Promise<Record<string, unknown>> };
    if (maybeResponse && typeof maybeResponse.text === 'function') {
      text = await maybeResponse.text();
      try { parsed = JSON.parse(text) as Record<string, unknown>; } catch (_e) { /* ignore */ }
    } else if (maybeResponse && typeof maybeResponse.json === 'function') {
      parsed = await maybeResponse.json();
      try { text = JSON.stringify(parsed); } catch (_e) { text = String(parsed); }
    }
    if (!res.ok) {
      const msg = parsed && parsed.error_description ? `${parsed.error}: ${parsed.error_description}` : `HTTP ${res.status} ${res.statusText}`;
      const bodySnippet = typeof text === 'string' ? text.substring(0, 2000) : String(text);
      try { console.error('[googleAuth] backend exchange error', { status: res.status, statusText: res.statusText, body: parsed || text }); } catch (_e) { /* ignore */ }
      throw new Error('Backend token exchange failed: ' + msg + '\n' + bodySnippet);
    }
    return parsed as TokenResponse;
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    code,
    code_verifier: codeVerifier,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });
  // If a developer provided a client secret in env and explicitly allowed insecure use,
  // include it for development-only scenarios where the OAuth client requires a secret.
  if (CLIENT_SECRET && ALLOW_INSECURE_CLIENT_SECRET) {
    try { console.warn('[googleAuth] Using CLIENT_SECRET from env for development only (insecure).'); } catch (_e) { /* ignore */ }
    params.set('client_secret', CLIENT_SECRET);
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  let text = '';
  let parsed: Record<string, unknown> | null = null;
  // Support both fetch Response with text()/json() and mocked objects used in tests
  const maybeResponse = res as unknown as { text?: () => Promise<string>; json?: () => Promise<Record<string, unknown>> };
  if (maybeResponse && typeof maybeResponse.text === 'function') {
    text = await maybeResponse.text();
    try { parsed = JSON.parse(text) as Record<string, unknown>; } catch (_e) { /* ignore */ }
  } else if (maybeResponse && typeof maybeResponse.json === 'function') {
    parsed = await maybeResponse.json();
    try { text = JSON.stringify(parsed); } catch (_e) { text = String(parsed); }
  }
  if (!res.ok) {
    const msg = parsed && parsed.error_description ? `${parsed.error}: ${parsed.error_description}` : `HTTP ${res.status} ${res.statusText}`;
    // include body for diagnostics
    const bodySnippet = typeof text === 'string' ? text.substring(0, 2000) : String(text);
    const err = new Error('Token exchange failed: ' + msg + '\n' + bodySnippet);
    // also log for plugin console
    try { console.error('[googleAuth] token exchange error', { status: res.status, statusText: res.statusText, body: parsed || text }); } catch (_e) { /* ignore */ }
    throw err;
  }
  return parsed as TokenResponse;
}

// --- Cross-window communication helpers ---
let popupResolver: ((code: string | null) => void) | null = null;
let manualCodeResolver: ((code: string | null) => void) | null = null;

function globalMessageHandler(ev: MessageEvent) {
  try {
    const data = ev.data as unknown;
    if (data && typeof data === 'object') {
      const d = data as { type?: unknown; code?: unknown };
      if (d.type === 'logseq_gcal_code' && typeof d.code === 'string') {
        const code = d.code as string;
        // prefer popup resolver first
        if (popupResolver) {
          const r = popupResolver;
          popupResolver = null;
          r(code);
          return;
        }
        if (manualCodeResolver) {
          const r = manualCodeResolver;
          manualCodeResolver = null;
          r(code);
          return;
        }
      }
    }
  } catch (_e) {
    // ignore
  }
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('message', globalMessageHandler);
}

function dispatchStatus(status: string, detail?: Record<string, unknown>) {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('gcal:status', { detail: Object.assign({ status }, detail || {}) }));
    }
  } catch (_e) {
    // ignore
  }
}

// Open a popup and wait for the callback page to postMessage the authorization code.
async function openPopupAndWaitForCode(url: string): Promise<string | null> {
  const popup = window.open(url, '_blank', '');
  if (!popup) return null;

  return new Promise((resolve) => {
    function onMessage(ev: MessageEvent) {
      try {
        const data = ev.data as unknown;
        try { console.debug('[googleAuth] postMessage received', data); } catch (_e) { /* ignore */ }
        if (data && typeof data === 'object') {
          const d = data as { type?: unknown; code?: unknown };
          if (d.type === 'logseq_gcal_code' && typeof d.code === 'string') {
            cleanup();
            try { popup?.close(); } catch (_err) { /* ignore */ }
            resolve(d.code as string);
          }
        }
      } catch (_e) { /* ignore */ }
    }

    function checkPopup() {
      if (!popup || popup.closed) {
        cleanup();
        resolve(null);
      }
    }

    function cleanup() {
      window.removeEventListener('message', onMessage);
      clearInterval(pollTimer);
    }

    window.addEventListener('message', onMessage);
    const pollTimer = setInterval(() => {
      try { checkPopup(); } catch (_) { /* ignore */ }
    }, 500);
  });
}

/**
 * External API: allow UI to provide an authorization code (manual paste).
 * Returns true if a pending manual resolver was present and was resolved.
 */
export function provideAuthCode(code: string): boolean {
  if (manualCodeResolver) {
    const r = manualCodeResolver;
    manualCodeResolver = null;
    r(code);
    return true;
  }
  return false;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  let text = '';
  let parsed: Record<string, unknown> | null = null;
  const maybeResp2 = res as unknown as { text?: () => Promise<string>; json?: () => Promise<Record<string, unknown>> };
  if (maybeResp2 && typeof maybeResp2.text === 'function') {
    text = await maybeResp2.text();
    try { parsed = JSON.parse(text) as Record<string, unknown>; } catch (_e) { /* ignore */ }
  } else if (maybeResp2 && typeof maybeResp2.json === 'function') {
    parsed = await maybeResp2.json();
    try { text = JSON.stringify(parsed); } catch (_e) { text = String(parsed); }
  }
  if (!res.ok) {
    const msg = parsed && parsed.error_description ? `${parsed.error}: ${parsed.error_description}` : `HTTP ${res.status} ${res.statusText}`;
    const bodySnippet = typeof text === 'string' ? text.substring(0, 2000) : String(text);
    try { console.error('[googleAuth] refresh token error', { status: res.status, statusText: res.statusText, body: parsed || text }); } catch (_e) { /* ignore */ }
    throw new Error('Refresh token failed: ' + msg + '\n' + bodySnippet);
  }
  return parsed as TokenResponse;
}

/**
 * Start OAuth flow using PKCE. This will open the Google consent page and then
 * prompt you to paste the authorization code into a prompt. After exchanging
 * the code the token will be stored in localStorage.
 */
export async function startGoogleAuth(): Promise<void> {
  if (!CLIENT_ID) {
    throw new Error('Missing Google Client ID. Set VITE_GOOGLE_CLIENT_ID in your .env.local (see .env.example).');
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

  try {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    // store verifier temporarily
    localStorage.setItem('gcal_code_verifier', verifier);

    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', SCOPES.join(' '));
    authUrl.searchParams.set('code_challenge', challenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    // request offline access to get a refresh token
    authUrl.searchParams.set('access_type', 'offline');

    // Use module-level openPopupAndWaitForCode helper

    let code: string | null = null;
    try {
      dispatchStatus('awaiting_code');
      code = await openPopupAndWaitForCode(authUrl.toString());
    } catch (_err) {
      // ignore and fall back
    }

    if (!code) {
      // Fallback manual flow
      window.open(authUrl.toString(), '_blank');
      dispatchStatus('awaiting_manual_code');
      window.alert('Se a entrega automática falhar, na página de callback clique "Enviar código ao plugin" ou copie o código e cole no plugin.');

      code = await new Promise<string | null>((resolve) => {
        manualCodeResolver = (c: string | null) => { manualCodeResolver = null; resolve(c); };
        setTimeout(() => {
          try {
            const manual = window.prompt('Depois de conceder acesso, cole o código de autorização aqui:');
            if (manual) {
              if (manualCodeResolver) {
                const r = manualCodeResolver;
                manualCodeResolver = null;
                r(manual.trim());
              } else {
                resolve(manual.trim());
              }
            }
          } catch (_e) { /* ignore */ }
        }, 100);
      });

      if (!code) throw new Error('No authorization code provided');
    }

    dispatchStatus('exchanging');

    const storedVerifier = localStorage.getItem('gcal_code_verifier');
    if (!storedVerifier) throw new Error('Code verifier not found in storage');

    const token = await exchangeCodeForToken(code, storedVerifier);
    await saveToken(token);
    dispatchStatus('connected');
    localStorage.removeItem('gcal_code_verifier');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    try { dispatchStatus('error', { message: msg, clientId: CLIENT_ID, redirectUri: REDIRECT_URI }); } catch (_e) { /* ignore */ }
    // Helpful guidance for a common misconfiguration: using a client that requires a client_secret
    try {
      if (typeof window !== 'undefined' && msg.toLowerCase().includes('client secret')) {
        // Log helpful debug info and show a clearer alert with next steps for the developer
        try {
          console.error('[googleAuth] token exchange failed with client-secret requirement', { clientId: CLIENT_ID, redirectUri: REDIRECT_URI });
        } catch (_e) { /* ignore */ }
        try {
          window.alert('Token exchange falhou porque o cliente OAuth requer um client secret. Para desenvolvimento local, crie um OAuth Client do tipo "Desktop app" ou use um client configurado para PKCE (sem client secret).\n\nPassos rápidos:\n1. Abra Google Cloud Console → APIs & Services → Credentials.\n2. Create Credentials → OAuth client ID → Application type: Desktop app.\n3. Copie o Client ID e coloque em .env.local como VITE_GOOGLE_CLIENT_ID.\n4. Atualize VITE_GOOGLE_REDIRECT_URI para a URL do seu dev server + /oauth2callback.html e reinicie o dev server.\n\nDebug: clientId=' + CLIENT_ID + '\nredirectUri=' + REDIRECT_URI);
        } catch (_e) { /* ignore */ }
      }
    } catch (_e) { /* ignore */ }
    throw err;
  }
}

/**
 * Returns a valid access token if available, attempts refresh if expired.
 */
export async function getAccessToken(): Promise<string | null> {
  const stored = await getTokenFromStorage();
  if (!stored) return null;
  const { token, expiresAt } = stored;
  if (expiresAt && Date.now() < expiresAt - 10_000) {
    // still valid with 10s buffer
    return token.access_token;
  }

  if (token.refresh_token) {
    try {
      const refreshed = await refreshAccessToken(token.refresh_token);
      // Keep the original refresh_token if the response doesn't include a new one
      if (!refreshed.refresh_token) refreshed.refresh_token = token.refresh_token;
      await saveToken(refreshed);
      return refreshed.access_token;
    } catch (err) {
      console.error('Failed to refresh access token', err);
      return null;
    }
  }

  return null;
}

/**
 * Clear persisted token from Logseq settings (when available) and localStorage.
 */
export async function clearToken(): Promise<void> {
  try {
    const ls = (globalThis as unknown as { logseq?: { updateSettings?: (...args: unknown[]) => unknown; settings?: Record<string, string> } }).logseq;
    if (ls && typeof ls.updateSettings === 'function') {
      const existing = (ls as unknown as { settings?: Record<string, string> }).settings || {};
      const copy = Object.assign({}, existing);
      // remove key
      delete (copy as Record<string, string>)[TOKEN_STORAGE_KEY];
      await Promise.resolve(ls.updateSettings(copy));
    }
  } catch (err) {
    console.warn('Failed clearing token from logseq settings', err);
  }

  try { localStorage.removeItem(TOKEN_STORAGE_KEY); } catch (_e) { /* ignore */ }
}

