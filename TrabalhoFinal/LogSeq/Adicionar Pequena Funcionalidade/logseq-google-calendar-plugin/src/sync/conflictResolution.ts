// Placeholder for conflict resolution strategies between Logseq and Google Calendar.
export type Conflict = {
  blockId: string;
  eventId?: string;
  reason?: string;
};

export function resolveConflictSimple(): void {
  // last-write-wins or other strategies can be implemented here
  console.log("resolveConflictSimple: not implemented");
}
