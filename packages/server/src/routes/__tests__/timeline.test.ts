/**
 * Integration Tests: Timeline API Routes
 *
 * Tests the /api/timeline endpoints through Fastify's inject() method
 * against an in-memory SQLite database.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, type TestContext } from './testHelper.js';

describe('Timeline API - /api/timeline', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestServer();
  });

  afterEach(async () => {
    ctx.db.close();
    await ctx.server.close();
  });

  // ------------------------------------------
  // GET /api/timeline
  // ------------------------------------------

  describe('GET /api/timeline', () => {
    it('should return 200 with empty array initially', async () => {
      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/timeline',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });
  });

  // ------------------------------------------
  // POST /api/timeline
  // ------------------------------------------

  describe('POST /api/timeline', () => {
    it('should create a timeline event with minimal fields and return 201', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/timeline',
        payload: { description: '故事开始' },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.description).toBe('故事开始');
      expect(body.data.id).toBeDefined();
      expect(body.data.createdAt).toBeDefined();
    });

    it('should create a timeline event with eventDate and return 201', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/timeline',
        payload: {
          description: '主角觉醒',
          eventDate: '2024-01-01',
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.description).toBe('主角觉醒');
      expect(body.data.eventDate).toBe('2024-01-01');
    });
  });

  // ------------------------------------------
  // GET /api/timeline (after creating events)
  // ------------------------------------------

  describe('GET /api/timeline (with data)', () => {
    it('should return 200 with 2 events after creating them', async () => {
      // Create two events
      await ctx.server.inject({
        method: 'POST',
        url: '/api/timeline',
        payload: { description: '故事开始' },
      });

      await ctx.server.inject({
        method: 'POST',
        url: '/api/timeline',
        payload: { description: '主角觉醒', eventDate: '2024-01-01' },
      });

      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/timeline',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
    });
  });

  // ------------------------------------------
  // PATCH /api/timeline/:id
  // ------------------------------------------

  describe('PATCH /api/timeline/:id', () => {
    it('should update description and return 200', async () => {
      // Create an event first
      const createRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/timeline',
        payload: { description: '故事开始' },
      });
      const eventId = createRes.json().data.id;

      const res = await ctx.server.inject({
        method: 'PATCH',
        url: `/api/timeline/${eventId}`,
        payload: { description: '故事正式开始' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.description).toBe('故事正式开始');
      expect(body.data.id).toBe(eventId);
    });

    it('should update eventDate and return 200', async () => {
      const createRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/timeline',
        payload: { description: '主角觉醒', eventDate: '2024-01-01' },
      });
      const eventId = createRes.json().data.id;

      const res = await ctx.server.inject({
        method: 'PATCH',
        url: `/api/timeline/${eventId}`,
        payload: { eventDate: '2024-06-15' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.eventDate).toBe('2024-06-15');
    });

    it('should reflect update in subsequent GET', async () => {
      const createRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/timeline',
        payload: { description: '故事开始' },
      });
      const eventId = createRes.json().data.id;

      await ctx.server.inject({
        method: 'PATCH',
        url: `/api/timeline/${eventId}`,
        payload: { description: '修改后的描述' },
      });

      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/timeline',
      });

      const body = res.json();
      expect(body.data[0].description).toBe('修改后的描述');
    });
  });

  // ------------------------------------------
  // DELETE /api/timeline/:id
  // ------------------------------------------

  describe('DELETE /api/timeline/:id', () => {
    it('should delete a timeline event and return 200 with deleted: true', async () => {
      // Create an event first
      const createRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/timeline',
        payload: { description: '故事开始' },
      });
      const eventId = createRes.json().data.id;

      const res = await ctx.server.inject({
        method: 'DELETE',
        url: `/api/timeline/${eventId}`,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ deleted: true });
    });

    it('should reflect deletion in subsequent GET requests', async () => {
      // Create two events
      const createRes1 = await ctx.server.inject({
        method: 'POST',
        url: '/api/timeline',
        payload: { description: '故事开始' },
      });
      const eventId1 = createRes1.json().data.id;

      await ctx.server.inject({
        method: 'POST',
        url: '/api/timeline',
        payload: { description: '主角觉醒', eventDate: '2024-01-01' },
      });

      // Delete the first event
      await ctx.server.inject({
        method: 'DELETE',
        url: `/api/timeline/${eventId1}`,
      });

      // Verify only one event remains
      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/timeline',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].description).toBe('主角觉醒');
    });
  });
});
