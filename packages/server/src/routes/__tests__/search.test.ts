/**
 * Search API Route Integration Tests
 *
 * Tests the HTTP endpoints for full-text search using real SearchService + in-memory DB.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestServer, type TestContext } from './testHelper.js';

describe('Search Routes', () => {
  let server: FastifyInstance;
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestServer();
    server = ctx.server;

    // Seed test data via service
    await ctx.service.createCharacter({ name: '林墨渊', role: 'main', appearance: '白衣如雪' });
    await ctx.service.createCharacter({ name: '苏澜', role: 'supporting', appearance: '紫衣少女' });
    await ctx.service.createCharacter({ name: '云阙', role: 'antagonist' });

    await ctx.service.createLocation({ name: '青墨峰', type: 'mountain', atmosphere: '云雾缭绕' });
    await ctx.service.createLocation({ name: '墨渊城', type: 'city', significance: '修仙圣地' });

    await ctx.service.createFaction({ name: '青云宗', type: 'sect', stanceToMC: 'friendly' });

    const volume = await ctx.writingService.createVolume({ title: '第一卷' });
    await ctx.writingService.createChapter({
      volumeId: volume.id,
      title: '第一章：初入仙门',
      content: '林墨渊踏入青云宗的那一天',
    });
  });

  afterEach(async () => {
    await server.close();
    ctx.db.close();
  });

  describe('GET /api/search', () => {
    it('should search across all entity types', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/search?q=墨',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.results)).toBe(true);
      expect(body.data.results.length).toBeGreaterThan(0);

      // Should find 林墨渊 (character), 青墨峰 (location), 墨渊城 (location)
      const types = new Set(body.data.results.map((r: { entityType: string }) => r.entityType));
      expect(types.has('character')).toBe(true);
      expect(types.has('location')).toBe(true);
    });

    it('should filter by single entity type', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/search?q=墨&types=character',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(
        body.data.results.every((r: { entityType: string }) => r.entityType === 'character')
      ).toBe(true);
    });

    it('should filter by multiple entity types', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/search?q=墨&types=character,location',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      const types = new Set(body.data.results.map((r: { entityType: string }) => r.entityType));
      expect(types.has('character') || types.has('location')).toBe(true);
      expect(types.has('faction')).toBe(false);
    });

    it('should respect limit parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/search?q=墨&limit=2',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.results.length).toBeLessThanOrEqual(2);
    });

    it('should include highlights with <mark> tags', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/search?q=林墨渊',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      const charResult = body.data.results.find(
        (r: { entityType: string }) => r.entityType === 'character'
      );
      expect(charResult).toBeDefined();
      expect(charResult.highlight).toContain('<mark>');
      expect(charResult.highlight).toContain('</mark>');
    });

    it('should return empty results for no matches', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/search?q=不存在的内容xyz123',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.results).toEqual([]);
    });

    it('should return 400 if query is missing', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/search',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should return 400 if query is too short', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/search?q=a',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('at least 2 characters');
    });

    it('should handle CJK text search', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/search?q=青云宗',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      const factionResult = body.data.results.find(
        (r: { entityType: string }) => r.entityType === 'faction'
      );
      expect(factionResult).toBeDefined();
      expect(factionResult.title).toBe('青云宗');
    });

    it('should search chapter content', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/search?q=初入仙门',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      const chapterResult = body.data.results.find(
        (r: { entityType: string }) => r.entityType === 'chapter'
      );
      expect(chapterResult).toBeDefined();
      expect(chapterResult.title).toContain('初入仙门');
    });

    it('should handle URL-encoded Chinese queries', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/search?q=' + encodeURIComponent('青云'),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.results.length).toBeGreaterThan(0);
    });
  });
});
