import { describe, it, expect } from 'vitest';
import { MarkdownFormatter } from '../MarkdownFormatter.js';
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

const defaultOptions: ExportOptions = { format: 'md', range: { type: 'all' } };
const formatter = new MarkdownFormatter();

describe('MarkdownFormatter', () => {
  it('should produce valid markdown with heading structure', async () => {
    const result = await formatter.formatChapters([makeChapter()], [makeVolume()], defaultOptions);

    expect(result.mimeType).toBe('text/markdown');
    expect(result.filename).toBe('export.md');
    const data = result.data as string;
    expect(data).toContain('# Export');
    expect(data).toContain('## Table of Contents');
    expect(data).toContain('## Test Chapter');
    expect(data).toContain('Chapter content here.');
  });

  it('should group chapters by volume', async () => {
    const vol1 = makeVolume({ id: 1, name: 'First Volume' });
    const vol2 = makeVolume({ id: 2, name: 'Second Volume' });
    const ch1 = makeChapter({ id: 1, volumeId: 1, sortOrder: 1, title: 'Ch 1' });
    const ch2 = makeChapter({ id: 2, volumeId: 2, sortOrder: 2, title: 'Ch 2' });

    const result = await formatter.formatChapters([ch1, ch2], [vol1, vol2], defaultOptions);
    const data = result.data as string;

    expect(data).toContain('# First Volume');
    expect(data).toContain('# Second Volume');
    expect(data.indexOf('First Volume')).toBeLessThan(data.indexOf('Second Volume'));
  });

  it('should put unassigned chapters at the end', async () => {
    const vol = makeVolume({ id: 1, name: 'Volume' });
    const assigned = makeChapter({ id: 1, volumeId: 1, title: 'Assigned' });
    const unassigned = makeChapter({ id: 2, title: 'Unassigned' });

    const result = await formatter.formatChapters([assigned, unassigned], [vol], defaultOptions);
    const data = result.data as string;

    expect(data).toContain('Unassigned Chapters');
    expect(data.indexOf('Assigned')).toBeLessThan(data.indexOf('Unassigned Chapters'));
  });

  it('should show placeholder for empty content', async () => {
    const ch = makeChapter({ content: undefined });
    const result = await formatter.formatChapters([ch], [], defaultOptions);
    expect(result.data as string).toContain('*(No content yet)*');
  });

  it('should include metadata when requested', async () => {
    const ch = makeChapter({ wordCount: 5000, status: 'revision' });
    const result = await formatter.formatChapters([ch], [], {
      ...defaultOptions,
      includeMetadata: true,
    });
    const data = result.data as string;
    expect(data).toContain('Words: 5000');
    expect(data).toContain('Status: revision');
  });

  it('should include outline when requested', async () => {
    const ch = makeChapter({
      outline: {
        goal: 'Introduce conflict',
        scenes: ['Battle', 'Aftermath'],
        hookEnding: 'Cliffhanger',
      },
    });
    const result = await formatter.formatChapters([ch], [], {
      ...defaultOptions,
      includeOutline: true,
    });
    const data = result.data as string;
    expect(data).toContain('**Goal**: Introduce conflict');
    expect(data).toContain('Battle, Aftermath');
    expect(data).toContain('**Hook**: Cliffhanger');
  });

  it('should handle empty chapters list', async () => {
    const result = await formatter.formatChapters([], [], defaultOptions);
    expect(result.data as string).toContain('No chapters to export');
  });

  it('should generate TOC entries', async () => {
    const vol = makeVolume({ name: 'Main' });
    const ch1 = makeChapter({ id: 1, volumeId: 1, title: 'Opening' });
    const ch2 = makeChapter({ id: 2, volumeId: 1, title: 'Rising Action' });

    const result = await formatter.formatChapters([ch1, ch2], [vol], defaultOptions);
    const data = result.data as string;
    expect(data).toContain('- **Main**');
    expect(data).toContain('  - Opening');
    expect(data).toContain('  - Rising Action');
  });
});
