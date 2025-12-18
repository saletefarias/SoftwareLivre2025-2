import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { getAccessToken } from './googleAuth';

const STORAGE_KEY = 'gcal_plugin_token';

describe('googleAuth storage + refresh', () => {
  type LogseqMock = { settings?: Record<string, string>; updateSettings?: (s: Record<string, string>) => void };
  let originalLogseq: LogseqMock | undefined;
  let originalFetch: typeof fetch | undefined;

  beforeEach(() => {
  originalLogseq = (globalThis as unknown as { logseq?: LogseqMock }).logseq;
  originalFetch = globalThis.fetch;
    // Provide a simple in-memory localStorage for node test environment
    if (typeof (globalThis as unknown as { localStorage?: Storage }).localStorage === 'undefined') {
      const store = new Map<string, string>();
      const mockStorage = {
        getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
        setItem: (k: string, v: string) => { store.set(k, v); },
        removeItem: (k: string) => { store.delete(k); },
        clear: () => { store.clear(); },
      };
      (globalThis as unknown as { localStorage?: Storage }).localStorage = mockStorage as unknown as Storage;
    }
  });

  afterEach(() => {
  (globalThis as unknown as { logseq?: LogseqMock }).logseq = originalLogseq;
  if (originalFetch) (globalThis as unknown as { fetch?: typeof fetch }).fetch = originalFetch;
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('returns existing access token from logseq.settings when valid', async () => {
    const tokenObj = { token: { access_token: 'abc', expires_in: 3600 }, expiresAt: Date.now() + 60_000 };
  (globalThis as unknown as { logseq?: LogseqMock }).logseq = { settings: { [STORAGE_KEY]: JSON.stringify(tokenObj) } };

    const t = await getAccessToken();
    expect(t).toBe('abc');
  });

  it('refreshes token when expired and calls updateSettings', async () => {
    const expired = { token: { access_token: 'old', refresh_token: 'r1', expires_in: 10 }, expiresAt: Date.now() - 1000 };
    const savedSettings = { [STORAGE_KEY]: JSON.stringify(expired) };
    const updateSettings = vi.fn().mockImplementation((s) => { Object.assign(savedSettings, s); });
  (globalThis as unknown as { logseq?: LogseqMock }).logseq = { settings: savedSettings, updateSettings };

    // Mock fetch to respond with refreshed token
    const mockResp = { access_token: 'newtok', expires_in: 3600, refresh_token: 'r2' };
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockResp });

    const t = await getAccessToken();
    expect(t).toBe('newtok');
    expect(updateSettings).toHaveBeenCalled();

    // Stored settings should now include the refreshed token
    const stored = JSON.parse(savedSettings[STORAGE_KEY]);
    expect(stored.token.access_token).toBe('newtok');
    expect(stored.token.refresh_token).toBe('r2');
  });

  it('falls back to localStorage when logseq is not present', async () => {
  (globalThis as unknown as { logseq?: LogseqMock }).logseq = undefined;
    const tokenObj = { token: { access_token: 'ls-token', expires_in: 3600 }, expiresAt: Date.now() + 60_000 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokenObj));

    const t = await getAccessToken();
    expect(t).toBe('ls-token');
  });
});
