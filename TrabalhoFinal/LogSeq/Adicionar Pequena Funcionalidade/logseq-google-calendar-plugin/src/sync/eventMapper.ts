export interface EventInput {
  id?: string;
  recurringEventId?: string;
  title: string;
  start: string; // ISO
  end?: string; // ISO
  description?: string;
}

export function eventToBlock(event: EventInput): string {
  return `- ${event.title} (${event.start}${event.end ? ' - ' + event.end : ''})`;
}

export function blockToEvent(blockText: string): EventInput | null {
  // Very naive parser for scaffold
  const m = blockText.match(/^-\s+(.+)\s+\((.+)\)/);
  if (!m) return null;
  return { title: m[1], start: m[2] };
}
