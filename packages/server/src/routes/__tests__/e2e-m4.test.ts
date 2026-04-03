/**
 * M4 E2E Tests — Chapter Ordering, Auto-Save, Outline
 *
 * Integration tests for the M4 milestone features.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, type TestContext } from './testHelper.js';

let ctx: TestContext;

beforeEach(async () => {
  ctx = await createTestServer();
});

afterEach(async () => {
  ctx.db.close();
  await ctx.server.close();
});

// ===================================
// Chapter Ordering (#25)
// ===================================

describe('Chapter Ordering', () => {
  it('should return chapters in sort_order after reordering', async () => {
    const ch1 = await ctx.writingService.createChapter({ title: 'Chapter 1' });
    const ch2 = await ctx.writingService.createChapter({ title: 'Chapter 2' });
    const ch3 = await ctx.writingService.createChapter({ title: 'Chapter 3' });

    // Reorder: ch3, ch1, ch2
    await ctx.server.inject({
      method: 'POST',
      url: '/api/chapters/reorder',
      payload: { chapterIds: [ch3.id, ch1.id, ch2.id] },
    });

    const res = await ctx.server.inject({ method: 'GET', url: '/api/chapters' });
    const chapters = res.json().data;

    expect(chapters[0].id).toBe(ch3.id);
    expect(chapters[1].id).toBe(ch1.id);
    expect(chapters[2].id).toBe(ch2.id);
  });

  it('should assign sequential sortOrder values', async () => {
    const ch1 = await ctx.writingService.createChapter({ title: 'A' });
    const ch2 = await ctx.writingService.createChapter({ title: 'B' });

    const res = await ctx.server.inject({ method: 'GET', url: '/api/chapters' });
    const chapters = res.json().data;

    expect(chapters[0].id).toBe(ch1.id);
    expect(chapters[0].sortOrder).toBeLessThan(chapters[1].sortOrder);
    expect(chapters[1].id).toBe(ch2.id);
  });

  it('should sort new chapters after existing ones', async () => {
    await ctx.writingService.createChapter({ title: 'First' });
    const ch2 = await ctx.writingService.createChapter({ title: 'Second' });
    const ch3 = await ctx.writingService.createChapter({ title: 'Third' });

    const res = await ctx.server.inject({ method: 'GET', url: '/api/chapters' });
    const chapters = res.json().data;

    // Last created should be last in list
    expect(chapters[chapters.length - 1].id).toBe(ch3.id);
    expect(chapters[chapters.length - 2].id).toBe(ch2.id);
  });

  it('should persist correct sortOrder values after reorder', async () => {
    const ch1 = await ctx.writingService.createChapter({ title: 'A' });
    const ch2 = await ctx.writingService.createChapter({ title: 'B' });
    const ch3 = await ctx.writingService.createChapter({ title: 'C' });

    // Reorder: ch3, ch1, ch2
    await ctx.server.inject({
      method: 'POST',
      url: '/api/chapters/reorder',
      payload: { chapterIds: [ch3.id, ch1.id, ch2.id] },
    });

    const res = await ctx.server.inject({ method: 'GET', url: '/api/chapters' });
    const chapters = res.json().data;

    // Verify sortOrder values are strictly ascending
    expect(chapters[0].sortOrder).toBeLessThan(chapters[1].sortOrder);
    expect(chapters[1].sortOrder).toBeLessThan(chapters[2].sortOrder);

    // Verify the order matches requested order
    expect(chapters.map((c: { id: number }) => c.id)).toEqual([ch3.id, ch1.id, ch2.id]);
  });
});

// ===================================
// Auto-Save Without Version (#31)
// ===================================

describe('Auto-Save (content save without version)', () => {
  it('should save content without creating a version when createVersion=false', async () => {
    const ch = await ctx.writingService.createChapter({ title: 'Auto-save Test' });
    await ctx.writingService.saveContent({ chapterId: ch.id, content: 'initial content' });

    // Save updated content without version
    const res = await ctx.server.inject({
      method: 'PUT',
      url: `/api/chapters/${ch.id}/content`,
      payload: { content: 'auto-saved content', createVersion: false },
    });

    expect(res.statusCode).toBe(200);

    // Content should be updated
    const chRes = await ctx.server.inject({
      method: 'GET',
      url: `/api/chapters/${ch.id}?includeContent=true`,
    });
    expect(chRes.json().data.content).toBe('auto-saved content');

    // No new version should exist (only the initial save creates a version)
    const versRes = await ctx.server.inject({
      method: 'GET',
      url: `/api/chapters/${ch.id}/versions`,
    });
    const versions = versRes.json().data;
    // Initial save creates 1 version, auto-save should NOT add another
    expect(versions.length).toBeLessThanOrEqual(1);
  });

  it('should create a version when createVersion=true (manual save)', async () => {
    const ch = await ctx.writingService.createChapter({ title: 'Manual Save Test' });

    // First save with version (Ctrl+S equivalent)
    await ctx.server.inject({
      method: 'PUT',
      url: `/api/chapters/${ch.id}/content`,
      payload: { content: 'v1 content', createVersion: true },
    });

    // Second save with version
    const res = await ctx.server.inject({
      method: 'PUT',
      url: `/api/chapters/${ch.id}/content`,
      payload: { content: 'v2 content', createVersion: true },
    });
    expect(res.statusCode).toBe(200);

    const versRes = await ctx.server.inject({
      method: 'GET',
      url: `/api/chapters/${ch.id}/versions`,
    });
    const versions = versRes.json().data;
    expect(versions.length).toBeGreaterThanOrEqual(2);
  });
});

// ===================================
// Chapter Outline (#33)
// ===================================

describe('Chapter Outline', () => {
  it('should persist outline via PATCH', async () => {
    const ch = await ctx.writingService.createChapter({ title: 'Outline Test' });

    const outline = {
      goal: 'Introduce the protagonist',
      scenes: ['Morning routine', 'Discovery of the letter', 'Meeting with mentor'],
      hookEnding: 'The letter reveals a hidden enemy',
    };

    const res = await ctx.server.inject({
      method: 'PATCH',
      url: `/api/chapters/${ch.id}`,
      payload: { outline },
    });

    expect(res.statusCode).toBe(200);

    // Verify outline persisted
    const chRes = await ctx.server.inject({
      method: 'GET',
      url: `/api/chapters/${ch.id}`,
    });
    const data = chRes.json().data;
    expect(data.outline.goal).toBe('Introduce the protagonist');
    expect(data.outline.scenes).toHaveLength(3);
    expect(data.outline.hookEnding).toBe('The letter reveals a hidden enemy');
  });

  it('should allow partial outline update', async () => {
    const ch = await ctx.writingService.createChapter({ title: 'Partial Outline' });

    // Set initial outline
    await ctx.server.inject({
      method: 'PATCH',
      url: `/api/chapters/${ch.id}`,
      payload: {
        outline: {
          goal: 'Original goal',
          scenes: ['Scene 1'],
        },
      },
    });

    // Update with new outline (replaces whole outline)
    await ctx.server.inject({
      method: 'PATCH',
      url: `/api/chapters/${ch.id}`,
      payload: {
        outline: {
          goal: 'Updated goal',
          scenes: ['Scene A', 'Scene B'],
          hookEnding: 'Cliffhanger',
        },
      },
    });

    const chRes = await ctx.server.inject({
      method: 'GET',
      url: `/api/chapters/${ch.id}`,
    });
    const data = chRes.json().data;
    expect(data.outline.goal).toBe('Updated goal');
    expect(data.outline.scenes).toEqual(['Scene A', 'Scene B']);
    expect(data.outline.hookEnding).toBe('Cliffhanger');
  });
});
