// Google Calendar API client (minimal).
import type { EventInput } from "../sync/eventMapper";

const API_BASE = 'https://www.googleapis.com/calendar/v3';

function mapGoogleEventToInput(g: Record<string, unknown>): EventInput {
  const id = (g.id as string | undefined) || undefined;
  const recurringEventId = (g.recurringEventId as string | undefined) || undefined;
  const summary = (g.summary as string | undefined) || '(no title)';
  const startObj = g.start as Record<string, unknown> | undefined;
  const endObj = g.end as Record<string, unknown> | undefined;
  const start = (startObj && ((startObj.dateTime as string) || (startObj.date as string))) || '';
  const end = (endObj && ((endObj.dateTime as string) || (endObj.date as string))) || undefined;
  const description = (g.description as string | undefined) || undefined;
  return { id, recurringEventId, title: summary, start, end, description };
}

async function authFetch(url: string, init: RequestInit = {}) {
  const mod = await import('./googleAuth');
  const token = await mod.getAccessToken();
  if (!token) throw new Error('No access token available');
  const headers = Object.assign({}, init.headers || {}, {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  });
  const res = await fetch(url, Object.assign({}, init, { headers }));
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function listEvents(calendarId = 'primary', timeMin?: string): Promise<EventInput[]> {
  const q = new URL(`${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`);
  if (timeMin) q.searchParams.set('timeMin', timeMin);
  q.searchParams.set('singleEvents', 'true');
  q.searchParams.set('orderBy', 'startTime');
  const data = await authFetch(q.toString());
  const items = (data.items as Record<string, unknown>[] | undefined) || [];
  return items.map(mapGoogleEventToInput);
}

export async function createOrUpdateEvent(event: EventInput, calendarId = 'primary') {
  if (event.id) {
    // update
    const url = `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(event.id)}`;
    const body = {
      summary: event.title,
      description: event.description,
      start: { dateTime: event.start },
      end: event.end ? { dateTime: event.end } : undefined,
    };
    return await authFetch(url, { method: 'PATCH', body: JSON.stringify(body) });
  }

  // create
  const url = `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`;
  const body = {
    summary: event.title,
    description: event.description,
    start: { dateTime: event.start },
    end: event.end ? { dateTime: event.end } : undefined,
  };
  return await authFetch(url, { method: 'POST', body: JSON.stringify(body) });
}

export async function deleteEvent(eventId: string, calendarId = 'primary') {
  const url = `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
  const mod = await import('./googleAuth');
  const token = await mod.getAccessToken();
  if (!token) throw new Error('No access token available');
  const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Google API delete error ${res.status}: ${txt}`);
  }
  return true;
}
