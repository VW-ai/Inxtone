/**
 * Integration Tests for Export API Routes
 *
 * Tests the /api/export endpoints end-to-end with an in-memory database.
 * Export routes return raw file data (not JSON envelope).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, type TestContext } from './testHelper.js';

describe('Export API Routes', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestServer();
  });

  afterEach(async () => {
    ctx.db.close();
    await ctx.server.close();
  });

  // Helper: seed a volume and chapter with content
  async function seedChapter(title: string, content: string, volumeId?: number) {
    const vol = volumeId ?? (await ctx.writingService.createVolume({})).id;
    const ch = await ctx.writingService.createChapter({ title, volumeId: vol });
    await ctx.writingService.saveContent({ chapterId: ch.id, content });
    return { volumeId: vol, chapter: ch };
  }

  // ============================================
  // POST /api/export/chapters
  // ============================================

  describe('POST /api/export/chapters', () => {
    it('should export all chapters as Markdown', async () => {
      await seedChapter('Chapter One', 'Hello world');

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/chapters',
        payload: {
          format: 'md',
          range: { type: 'all' },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/markdown');
      expect(res.headers['content-disposition']).toContain('export.md');
      expect(res.body).toContain('Chapter One');
      expect(res.body).toContain('Hello world');
    });

    it('should export as plain text', async () => {
      await seedChapter('My Chapter', 'Some text');

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/chapters',
        payload: {
          format: 'txt',
          range: { type: 'all' },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/plain');
      expect(res.headers['content-disposition']).toContain('export.txt');
      expect(res.body).toContain('My Chapter');
    });

    it('should export as DOCX with correct Content-Type', async () => {
      await seedChapter('DOCX Test', 'Docx content');

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/chapters',
        payload: {
          format: 'docx',
          range: { type: 'all' },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      expect(res.headers['content-disposition']).toContain('export.docx');
      // DOCX starts with PK zip header
      expect(res.rawPayload[0]).toBe(0x50); // P
      expect(res.rawPayload[1]).toBe(0x4b); // K
    });

    it('should filter by volume', async () => {
      const { volumeId } = await seedChapter('In Volume', 'Yes');
      // Create another chapter in a different volume
      await seedChapter('Other Volume', 'No');

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/chapters',
        payload: {
          format: 'md',
          range: { type: 'volume', volumeId },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('In Volume');
      expect(res.body).not.toContain('Other Volume');
    });

    it('should filter by chapter IDs', async () => {
      const { chapter: ch1 } = await seedChapter('First', 'Content 1');
      await seedChapter('Second', 'Content 2');

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/chapters',
        payload: {
          format: 'md',
          range: { type: 'chapters', chapterIds: [ch1.id] },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('First');
      expect(res.body).not.toContain('Second');
    });

    it('should handle empty export', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/chapters',
        payload: {
          format: 'md',
          range: { type: 'all' },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('No chapters to export');
    });

    it('should return 400 for invalid format', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/chapters',
        payload: {
          format: 'pdf',
          range: { type: 'all' },
        },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // ============================================
  // POST /api/export/story-bible
  // ============================================

  describe('POST /api/export/story-bible', () => {
    it('should export Story Bible as Markdown', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/story-bible',
        payload: {},
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/markdown');
      expect(res.headers['content-disposition']).toContain('story-bible.md');
      expect(res.body).toContain('# Story Bible');
    });

    it('should include character data in export', async () => {
      // Seed a character via Story Bible service
      ctx.service.createCharacter({ name: 'Lin Mo', role: 'main' });

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/story-bible',
        payload: {},
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('Lin Mo');
      expect(res.body).toContain('Characters');
    });

    it('should filter by sections', async () => {
      ctx.service.createCharacter({ name: 'Test Char', role: 'main' });
      ctx.service.createLocation({ name: 'Test Place' });

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/story-bible',
        payload: { sections: ['characters'] },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('Characters');
      expect(res.body).not.toContain('Locations');
    });
  });
});
