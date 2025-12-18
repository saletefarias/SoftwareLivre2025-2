// Minimal TypeScript declarations for the Logseq plugin runtime used by this project.
// These are intentionally partial — they cover only the surface needed by
// `src/services/logseqApi.ts` and can be extended later as needed.

declare global {
  interface LogseqEditor {
    // parentUid is intentionally permissive because Logseq accepts different
    // identity types; keep it optional for convenience.
    insertBlock(parentUid?: unknown, content?: string): Promise<Record<string, unknown> | void>;
    insertAtEditingCursor?(content: string): Promise<Record<string, unknown> | void>;
    updateBlock(uid: string, content: string): Promise<Record<string, unknown> | void>;
  }

  interface LogseqDB {
    datascriptQuery(query: string): Promise<unknown[]>;
  }

  const logseq: {
    Editor: LogseqEditor;
    DB: LogseqDB;
    [key: string]: unknown;
  };
}

export {};
