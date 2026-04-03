import { describe, it, expect } from 'vitest';
import { DocxFormatter } from '../DocxFormatter.js';
import type { Chapter, Volume, ExportOptions } from '../../../types/index.js';

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 1,
    title: 'Test Chapter',
    status: 'draft',
    sortOrder: 1,
    wordCount: 100,
    content: 'Chapter content here.\n\nSecond paragraph.',
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

const defaultOptions: ExportOptions = { format: 'docx', range: { type: 'all' } };
const formatter = new DocxFormatter();

describe('DocxFormatter', () => {
  it('should return a Buffer with DOCX MIME type', async () => {
    const result = await formatter.formatChapters([makeChapter()], [makeVolume()], defaultOptions);

    expect(result.mimeType).toContain('officedocument');
    expect(result.filename).toBe('export.docx');
    expect(Buffer.isBuffer(result.data)).toBe(true);
  });

  it('should produce a valid zip (DOCX is a zip archive)', async () => {
    const result = await formatter.formatChapters([makeChapter()], [makeVolume()], defaultOptions);

    const buf = result.data as Buffer;
    // ZIP files start with PK (0x50 0x4b)
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
  });

  it('should handle multiple chapters', async () => {
    const ch1 = makeChapter({ id: 1, title: 'First', sortOrder: 1 });
    const ch2 = makeChapter({ id: 2, title: 'Second', sortOrder: 2 });

    const result = await formatter.formatChapters([ch1, ch2], [], defaultOptions);
    expect(Buffer.isBuffer(result.data)).toBe(true);
    // Just verify it doesn't throw
    expect((result.data as Buffer).length).toBeGreaterThan(0);
  });

  it('should handle chapters without content', async () => {
    const ch = makeChapter({ content: undefined });
    const result = await formatter.formatChapters([ch], [], defaultOptions);
    expect(Buffer.isBuffer(result.data)).toBe(true);
  });

  it('should handle empty chapters list', async () => {
    const result = await formatter.formatChapters([], [], defaultOptions);
    expect(Buffer.isBuffer(result.data)).toBe(true);
    expect((result.data as Buffer).length).toBeGreaterThan(0);
  });

  it('should handle metadata option', async () => {
    const result = await formatter.formatChapters([makeChapter()], [], {
      ...defaultOptions,
      includeMetadata: true,
    });
    expect(Buffer.isBuffer(result.data)).toBe(true);
  });

  it('should handle outline option', async () => {
    const ch = makeChapter({
      outline: { goal: 'Test goal', scenes: ['Scene 1'], hookEnding: 'Hook' },
    });
    const result = await formatter.formatChapters([ch], [], {
      ...defaultOptions,
      includeOutline: true,
    });
    expect(Buffer.isBuffer(result.data)).toBe(true);
  });
});
