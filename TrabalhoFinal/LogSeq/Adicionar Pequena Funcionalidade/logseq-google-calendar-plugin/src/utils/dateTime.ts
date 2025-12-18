export function toIso(dt: Date): string {
  return dt.toISOString();
}

export function fromIso(s: string): Date {
  return new Date(s);
}
