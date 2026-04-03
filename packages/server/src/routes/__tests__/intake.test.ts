/**
 * Intake API Route Integration Tests
 *
 * Tests validation, commit endpoint (no AI needed), and error handling.
 * Decompose/detect-duplicates are AI-dependent and tested at service level.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, type TestContext } from './testHelper.js';

describe('Intake API - /api/intake', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestServer();
  });

  afterEach(async () => {
    ctx.db.close();
    await ctx.server.close();
  });

  // ============================================
  // POST /api/intake/decompose — validation
  // ============================================

  describe('POST /api/intake/decompose', () => {
    it('should return 400 when text is missing', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/intake/decompose',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when text is empty string', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/intake/decompose',
        payload: { text: '' },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when hint is invalid', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/intake/decompose',
        payload: { text: 'some content', hint: 'invalid_hint' },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ============================================
  // POST /api/intake/commit
  // ============================================

  describe('POST /api/intake/commit', () => {
    it('should return 400 when entities array is empty', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/intake/commit',
        payload: { entities: [] },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when entities is missing', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/intake/commit',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when entityType is invalid', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/intake/commit',
        payload: {
          entities: [
            {
              entityType: 'invalid_type',
              action: 'create',
              data: { name: 'test' },
            },
          ],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should create a character via commit and return 201', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/intake/commit',
        payload: {
          entities: [
            {
              entityType: 'character',
              action: 'create',
              data: { name: '林墨', role: 'main' },
            },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.created).toHaveLength(1);
      expect(body.data.created[0].type).toBe('character');
      expect(body.data.created[0].name).toBe('林墨');
      expect(body.data.skipped).toBe(0);

      // Verify character exists via GET
      const getResponse = await ctx.server.inject({
        method: 'GET',
        url: '/api/characters',
      });
      const getBody = getResponse.json();
      expect(getBody.data).toHaveLength(1);
      expect(getBody.data[0].name).toBe('林墨');
    });

    it('should create multiple entity types in one commit', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/intake/commit',
        payload: {
          entities: [
            {
              entityType: 'character',
              action: 'create',
              data: { name: '林墨', role: 'main' },
            },
            {
              entityType: 'character',
              action: 'create',
              data: { name: '苏澜', role: 'supporting' },
            },
            {
              entityType: 'location',
              action: 'create',
              data: { name: '墨渊谷' },
            },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.created).toHaveLength(3);
      expect(body.data.skipped).toBe(0);
    });

    it('should skip entities with action=skip', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/intake/commit',
        payload: {
          entities: [
            {
              entityType: 'character',
              action: 'create',
              data: { name: '林墨', role: 'main' },
            },
            {
              entityType: 'character',
              action: 'skip',
              data: { name: '跳过', role: 'minor' },
            },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.data.created).toHaveLength(1);
      expect(body.data.skipped).toBe(1);
    });
  });

  // ============================================
  // POST /api/intake/detect-duplicates — validation
  // ============================================

  describe('POST /api/intake/detect-duplicates', () => {
    it('should accept empty arrays and return 200', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/intake/detect-duplicates',
        payload: {
          characters: [],
          relationships: [],
          locations: [],
          factions: [],
          foreshadowing: [],
          arcs: [],
          hooks: [],
          timeline: [],
          warnings: [],
        },
      });

      // Even though it succeeds, detectDuplicates may need AI for some paths.
      // With empty arrays, it should return an empty result.
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
    });
  });

  // ============================================
  // POST /api/intake/import-chapters — validation
  // ============================================

  describe('POST /api/intake/import-chapters', () => {
    it('should return 400 when chapters is missing', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/intake/import-chapters',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when chapters array is empty', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/intake/import-chapters',
        payload: { chapters: [] },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when chapter title is empty', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/intake/import-chapters',
        payload: {
          chapters: [{ title: '', content: 'some content', sortOrder: 0 }],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
