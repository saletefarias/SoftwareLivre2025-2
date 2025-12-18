import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBlock, updateBlock, queryBlocks } from './logseqApi';

beforeEach(() => {
  // Setup a mock Logseq runtime on globalThis
  (globalThis as any).logseq = {
    Editor: {
      insertBlock: vi.fn().mockResolvedValue({ uuid: 'created-block' }),
      insertAtEditingCursor: vi.fn().mockResolvedValue({ uuid: 'cursor-block' }),
      updateBlock: vi.fn().mockResolvedValue({ uuid: 'updated-block' }),
    },
    DB: {
      datascriptQuery: vi.fn().mockResolvedValue([['result']]),
    },
  };
});

describe('logseqApi wrappers', () => {
  it('createBlock with parentUid should call insertBlock with parent', async () => {
    const res = await createBlock('hello world', 'parent-uid');
    expect((globalThis as any).logseq.Editor.insertBlock).toHaveBeenCalledWith('parent-uid', 'hello world');
    expect(res).toHaveProperty('uuid', 'created-block');
  });

  it('createBlock without parentUid should call insertAtEditingCursor when available', async () => {
    const res = await createBlock('at-cursor');
    expect((globalThis as any).logseq.Editor.insertAtEditingCursor).toHaveBeenCalledWith('at-cursor');
    expect(res).toHaveProperty('uuid', 'cursor-block');
  });

  it('updateBlock should call updateBlock API', async () => {
    const res = await updateBlock('uid-1', 'new content');
    expect((globalThis as any).logseq.Editor.updateBlock).toHaveBeenCalledWith('uid-1', 'new content');
    expect(res).toHaveProperty('uuid', 'updated-block');
  });

  it('queryBlocks should call datascriptQuery and return results', async () => {
    const res = await queryBlocks('[:find ?b]');
    expect((globalThis as any).logseq.DB.datascriptQuery).toHaveBeenCalledWith('[:find ?b]');
    expect(res).toEqual([['result']]);
  });
});
