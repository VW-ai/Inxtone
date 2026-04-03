import { describe, it, expect } from 'vitest';
import { TxtFormatter } from '../TxtFormatter.js';
import type { Chapter, Volume, ExportOptions } from '../../../types/index.js';

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 1,
    title: 'Test Chapter',
    status: 'draft',
    sortOrder: 1,
    wordCount: 100,
    content: 'Chapter content here.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeVolume(overrides: Partial<Volume> = {}): Volume {
  return {
    id: 1,
    name: 'Volume One',
    status: 'in_progress',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const defaultOptions: ExportOptions = { format: 'txt', range: { type: 'all' } };
const formatter = new TxtFormatter();

describe('TxtFormatter', () => {
  it('should produce plain text with separators', async () => {
    const result = await formatter.formatChapters(
      [makeChapter({ volumeId: 1 })],
      [makeVolume()],
      defaultOptions
    );

    expect(result.mimeType).toBe('text/plain');
    expect(result.filename).toBe('export.txt');
    const data = result.data as string;
    expect(data).toContain('========');
    expect(data).toContain('--------');
    expect(data).toContain('Test Chapter');
    expect(data).toContain('Chapter content here.');
  });

  it('should show volume headers', async () => {
    const vol = makeVolume({ name: 'Epic Saga' });
    const ch = makeChapter({ volumeId: 1 });

    const result = await formatter.formatChapters([ch], [vol], defaultOptions);
    const data = result.data as string;
    expect(data).toContain('Epic Saga');
  });

  it('should show unassigned chapters header when mixed', async () => {
    const vol = makeVolume();
    const assigned = makeChapter({ id: 1, volumeId: 1, title: 'A' });
    const unassigned = makeChapter({ id: 2, title: 'B' });

    const result = await formatter.formatChapters([assigned, unassigned], [vol], defaultOptions);
    expect(result.data as string).toContain('UNASSIGNED CHAPTERS');
  });

  it('should show placeholder for empty content', async () => {
    const ch = makeChapter({ content: undefined });
    const result = await formatter.formatChapters([ch], [], defaultOptions);
    expect(result.data as string).toContain('(No content yet)');
  });

  it('should include metadata when requested', async () => {
    const ch = makeChapter({ wordCount: 3000, status: 'done' });
    const result = await formatter.formatChapters([ch], [], {
      ...defaultOptions,
      includeMetadata: true,
    });
    const data = result.data as string;
    expect(data).toContain('[Words: 3000 | Status: done]');
  });

  it('should include outline when requested', async () => {
    const ch = makeChapter({
      outline: { goal: 'Hero departs', scenes: ['Farewell'] },
    });
    const result = await formatter.formatChapters([ch], [], {
      ...defaultOptions,
      includeOutline: true,
    });
    const data = result.data as string;
    expect(data).toContain('[Goal] Hero departs');
    expect(data).toContain('[Scenes] Farewell');
  });

  it('should handle empty chapters', async () => {
    const result = await formatter.formatChapters([], [], defaultOptions);
    expect(result.data as string).toContain('No chapters to export');
  });
});
