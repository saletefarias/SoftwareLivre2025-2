// Lightweight wrappers around Logseq plugin APIs.
// These functions assume the plugin runs inside Logseq where `logseq` is
// available on the global object. They perform simple checks and surface
// errors so callers can handle them.

/**
 * Insert a block. If `parentUid` is provided the block will be inserted as a child
 * of that block; otherwise it will be inserted at the current editing cursor.
 * Returns the created block object from the Logseq API (or null if insertion
 * didn't happen).
 */
export async function createBlock(content: string, parentUid?: string): Promise<Record<string, unknown> | null> {
  try {
    const ls = globalThis.logseq;
    if (!ls || !ls.Editor) throw new Error('logseq.Editor is not available');

    if (parentUid) {
      // Insert as child of a block (insertBlock returns the created block)
      // the Logseq runtime typings may mark these methods as void in some envs;
      // cast to any to preserve runtime behavior and satisfy tests.
      const created = await (ls.Editor.insertBlock as any)(parentUid, content);
      return (created || null) as Record<string, unknown> | null;
    }

    // No parent provided: insert at current editing cursor
    if (typeof ls.Editor.insertAtEditingCursor === 'function') {
      const created = await (ls.Editor.insertAtEditingCursor as any)(content);
      return (created || null) as Record<string, unknown> | null;
    }

    // Fallback: try insertBlock with undefined parent
    const fallback = await (ls.Editor.insertBlock as any)(undefined, content);
    return (fallback || null) as Record<string, unknown> | null;
  } catch (err) {
    console.error('createBlock error', err, { content, parentUid });
    throw err;
  }
}

/**
 * Update the content of an existing block. Returns the updated block/entity
 * from Logseq, or throws if the API is not available.
 */
export async function updateBlock(uid: string, content: string): Promise<Record<string, unknown> | null> {
  try {
    const ls = globalThis.logseq;
    if (!ls || !ls.Editor) throw new Error('logseq.Editor is not available');
    const updated = await (ls.Editor.updateBlock as any)(uid, content);
    return (updated || null) as Record<string, unknown> | null;
  } catch (err) {
    console.error('updateBlock error', err, { uid, content });
    throw err;
  }
}

/**
 * Run a datascript query against Logseq's DB. Returns the raw query result.
 * Example: queryBlocks("[:find ?b :where [?b :block/uuid ?uuid]]")
 */
export async function queryBlocks(query: string): Promise<unknown[]> {
  try {
    const ls = globalThis.logseq;
    if (!ls || !ls.DB || typeof ls.DB.datascriptQuery !== 'function') {
      throw new Error('logseq.DB.datascriptQuery is not available');
    }
    return await ls.DB.datascriptQuery(query);
  } catch (err) {
    console.error('queryBlocks error', err, { query });
    return [];
  }
}
