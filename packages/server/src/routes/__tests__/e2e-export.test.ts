/**
 * E2E Export Tests
 *
 * Seeds a full project (volumes, chapters, Story Bible entities)
 * then exports in all formats and verifies output integrity.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, type TestContext } from './testHelper.js';

describe('E2E Export', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestServer();
  });

  afterEach(async () => {
    ctx.db.close();
    await ctx.server.close();
  });

  /**
   * Seed a realistic project: 2 volumes, 3 chapters, 2 characters, 1 location
   */
  async function seedProject() {
    // Volumes
    const vol1 = await ctx.writingService.createVolume({ name: 'Volume One' });
    const vol2 = await ctx.writingService.createVolume({ name: 'Volume Two' });

    // Chapters
    const ch1 = await ctx.writingService.createChapter({
      title: 'The Beginning',
      volumeId: vol1.id,
    });
    await ctx.writingService.saveContent({
      chapterId: ch1.id,
      content: 'In the beginning, there was darkness.',
    });

    const ch2 = await ctx.writingService.createChapter({
      title: 'The Middle',
      volumeId: vol1.id,
    });
    await ctx.writingService.saveContent({
      chapterId: ch2.id,
      content: 'The hero pressed onward through the mist.',
    });

    const ch3 = await ctx.writingService.createChapter({
      title: 'A New Arc',
      volumeId: vol2.id,
    });
    await ctx.writingService.saveContent({
      chapterId: ch3.id,
      content: 'Everything changed when the storm arrived.',
    });

    // Story Bible entities
    ctx.service.createCharacter({ name: 'Lin Mo', role: 'main' });
    ctx.service.createCharacter({ name: 'Wei Jun', role: 'supporting' });
    ctx.service.createLocation({ name: 'Shadow Valley' });

    return { vol1, vol2, ch1, ch2, ch3 };
  }

  describe('Full project export (all formats)', () => {
    it('should export all chapters as Markdown with correct structure', async () => {
      await seedProject();

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/chapters',
        payload: { format: 'md', range: { type: 'all' } },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/markdown');

      const body = res.body;
      // Volume headers
      expect(body).toContain('Volume One');
      expect(body).toContain('Volume Two');
      // All 3 chapters present
      expect(body).toContain('The Beginning');
      expect(body).toContain('The Middle');
      expect(body).toContain('A New Arc');
      // Content present
      expect(body).toContain('In the beginning, there was darkness.');
      expect(body).toContain('The hero pressed onward');
      expect(body).toContain('Everything changed');
    });

    it('should export all chapters as TXT with separators', async () => {
      await seedProject();

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/chapters',
        payload: { format: 'txt', range: { type: 'all' } },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/plain');

      const body = res.body;
      // Volume separators
      expect(body).toContain('========');
      // Chapter separators
      expect(body).toContain('--------');
      // All content
      expect(body).toContain('The Beginning');
      expect(body).toContain('A New Arc');
    });

    it('should export all chapters as DOCX with valid binary', async () => {
      await seedProject();

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/chapters',
        payload: { format: 'docx', range: { type: 'all' } },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      // Valid ZIP header (PK)
      expect(res.rawPayload[0]).toBe(0x50);
      expect(res.rawPayload[1]).toBe(0x4b);
      // Non-trivial size (3 chapters + 2 volumes of content)
      expect(res.rawPayload.length).toBeGreaterThan(1000);
    });

    it('should export Story Bible with seeded characters and locations', async () => {
      await seedProject();

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/story-bible',
        payload: {},
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/markdown');

      const body = res.body;
      expect(body).toContain('# Story Bible');
      expect(body).toContain('Lin Mo');
      expect(body).toContain('Wei Jun');
      expect(body).toContain('Shadow Valley');
      expect(body).toContain('Characters');
      expect(body).toContain('Locations');
    });
  });

  describe('Volume-scoped export', () => {
    it('should only include chapters from specified volume', async () => {
      const { vol1 } = await seedProject();

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/chapters',
        payload: {
          format: 'md',
          range: { type: 'volume', volumeId: vol1.id },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('The Beginning');
      expect(res.body).toContain('The Middle');
      expect(res.body).not.toContain('A New Arc');
    });
  });

  describe('Empty project export', () => {
    it('should produce valid MD with no-content message', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/chapters',
        payload: { format: 'md', range: { type: 'all' } },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('No chapters to export');
    });

    it('should produce valid TXT with no-content message', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/chapters',
        payload: { format: 'txt', range: { type: 'all' } },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('No chapters to export');
    });

    it('should produce valid DOCX even with no chapters', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/chapters',
        payload: { format: 'docx', range: { type: 'all' } },
      });

      expect(res.statusCode).toBe(200);
      // Still a valid ZIP
      expect(res.rawPayload[0]).toBe(0x50);
      expect(res.rawPayload[1]).toBe(0x4b);
    });

    it('should produce valid Story Bible even with no entities', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/export/story-bible',
        payload: {},
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('# Story Bible');
    });
  });
});
