/**
 * Integration Tests for Foreshadowing API Routes
 *
 * Tests the /api/foreshadowing endpoints end-to-end with an in-memory database.
 * Covers CRUD operations, hint/resolve/abandon actions, and validation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, type TestContext } from './testHelper.js';

describe('Foreshadowing API Routes', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestServer();
  });

  afterEach(async () => {
    ctx.db.close();
    await ctx.server.close();
  });

  // ============================================
  // GET /api/foreshadowing
  // ============================================

  describe('GET /api/foreshadowing', () => {
    it('should return 200 with empty array when no foreshadowing exists', async () => {
      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/foreshadowing',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });
  });

  // ============================================
  // POST /api/foreshadowing
  // ============================================

  describe('POST /api/foreshadowing', () => {
    it('should create foreshadowing with minimal body and return 201 with id FS001', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing',
        payload: { content: '神秘宝剑' },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        id: 'FS001',
        content: '神秘宝剑',
        status: 'active',
      });
      expect(body.data.createdAt).toBeDefined();
    });

    it('should create foreshadowing with full body and return 201', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing',
        payload: {
          content: '暗线伏笔',
          term: 'long',
          plantedText: '第一章提及',
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        content: '暗线伏笔',
        term: 'long',
        plantedText: '第一章提及',
      });
      expect(body.data.id).toBeDefined();
    });

    it('should return 400 validation error when content is empty', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing',
        payload: { content: '' },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
      expect(body.error.code).toMatch(/VALIDATION/i);
    });
  });

  // ============================================
  // GET /api/foreshadowing/:id
  // ============================================

  describe('GET /api/foreshadowing/:id', () => {
    it('should return 200 with foreshadowing data for existing item', async () => {
      // Create foreshadowing first
      await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing',
        payload: { content: '神秘宝剑' },
      });

      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/foreshadowing/FS001',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('FS001');
      expect(body.data.content).toBe('神秘宝剑');
    });

    it('should return 404 for non-existent foreshadowing', async () => {
      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/foreshadowing/FS999',
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  // ============================================
  // GET /api/foreshadowing/active
  // ============================================

  describe('GET /api/foreshadowing/active', () => {
    it('should return 200 with active foreshadowing items', async () => {
      // Create a foreshadowing item (defaults to active status)
      await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing',
        payload: { content: '神秘宝剑' },
      });

      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/foreshadowing/active',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  // ============================================
  // PATCH /api/foreshadowing/:id
  // ============================================

  describe('PATCH /api/foreshadowing/:id', () => {
    it('should update content and return 200', async () => {
      // Create foreshadowing first
      await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing',
        payload: { content: '神秘宝剑' },
      });

      const res = await ctx.server.inject({
        method: 'PATCH',
        url: '/api/foreshadowing/FS001',
        payload: { content: '修改后的伏笔' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.content).toBe('修改后的伏笔');
      expect(body.data.id).toBe('FS001');
    });

    it('should update term and return 200', async () => {
      await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing',
        payload: { content: '神秘宝剑', term: 'short' },
      });

      const res = await ctx.server.inject({
        method: 'PATCH',
        url: '/api/foreshadowing/FS001',
        payload: { term: 'long' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.term).toBe('long');
    });

    it('should reflect update in subsequent GET', async () => {
      await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing',
        payload: { content: '神秘宝剑' },
      });

      await ctx.server.inject({
        method: 'PATCH',
        url: '/api/foreshadowing/FS001',
        payload: { content: '修改后的伏笔' },
      });

      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/foreshadowing/FS001',
      });

      const body = res.json();
      expect(body.data.content).toBe('修改后的伏笔');
    });
  });

  // ============================================
  // DELETE /api/foreshadowing/:id
  // ============================================

  describe('DELETE /api/foreshadowing/:id', () => {
    it('should delete foreshadowing and return 200 with deleted: true', async () => {
      await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing',
        payload: { content: '神秘宝剑' },
      });

      const res = await ctx.server.inject({
        method: 'DELETE',
        url: '/api/foreshadowing/FS001',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ deleted: true });
    });

    it('should reflect deletion in subsequent GET', async () => {
      await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing',
        payload: { content: '神秘宝剑' },
      });
      await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing',
        payload: { content: '暗线伏笔' },
      });

      await ctx.server.inject({
        method: 'DELETE',
        url: '/api/foreshadowing/FS001',
      });

      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/foreshadowing',
      });

      const body = res.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe('FS002');
    });
  });

  // ============================================
  // POST /api/foreshadowing/:id/hint
  // ============================================

  describe('POST /api/foreshadowing/:id/hint', () => {
    it('should add a hint to foreshadowing and return 200', async () => {
      // Create foreshadowing first
      await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing',
        payload: { content: '神秘宝剑' },
      });

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing/FS001/hint',
        payload: { chapter: 3, text: '第三章暗示' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('FS001');
      // Verify hint was added
      expect(body.data.hints).toBeDefined();
      expect(Array.isArray(body.data.hints)).toBe(true);
      expect(body.data.hints.length).toBeGreaterThanOrEqual(1);

      const lastHint = body.data.hints[body.data.hints.length - 1];
      expect(lastHint.chapter).toBe(3);
      expect(lastHint.text).toBe('第三章暗示');
    });
  });

  // ============================================
  // POST /api/foreshadowing/:id/resolve
  // ============================================

  describe('POST /api/foreshadowing/:id/resolve', () => {
    it('should resolve foreshadowing and set status to resolved', async () => {
      // Create foreshadowing first
      await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing',
        payload: { content: '神秘宝剑' },
      });

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing/FS001/resolve',
        payload: { resolvedChapter: 10 },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('resolved');
      expect(body.data.resolvedChapter).toBe(10);
    });
  });

  // ============================================
  // POST /api/foreshadowing/:id/abandon
  // ============================================

  describe('POST /api/foreshadowing/:id/abandon', () => {
    it('should abandon foreshadowing and set status to abandoned', async () => {
      // Create two foreshadowing items so FS002 exists
      await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing',
        payload: { content: '神秘宝剑' },
      });
      await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing',
        payload: { content: '暗线伏笔' },
      });

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing/FS002/abandon',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('abandoned');
    });
  });
});
