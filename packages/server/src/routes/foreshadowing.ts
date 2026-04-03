/**
 * Foreshadowing API Routes
 *
 * RESTful endpoints for foreshadowing/clue management.
 * 7 endpoints: CRUD + hint/resolve/abandon actions.
 */

import type { FastifyPluginAsync } from 'fastify';
import type {
  CreateForeshadowingRequest,
  UpdateForeshadowingRequest,
  AddForeshadowingHintRequest,
  ResolveForeshadowingRequest,
} from '@inxtone/core';
import type { RouteDeps } from './index.js';
import { success, error } from '../utils/response.js';

/**
 * Foreshadowing routes factory.
 */
export const foreshadowingRoutes = (deps: RouteDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    const { storyBibleService } = deps;

    /**
     * GET / - List all foreshadowing
     */
    fastify.get('/', async () => {
      const items = await storyBibleService.getAllForeshadowing();
      return success(items);
    });

    /**
     * GET /active - List active (unresolved) foreshadowing
     */
    fastify.get('/active', async () => {
      const items = await storyBibleService.getActiveForeshadowing();
      return success(items);
    });

    /**
     * GET /:id - Get foreshadowing by ID
     */
    fastify.get<{
      Params: { id: string };
    }>('/:id', async (request, reply) => {
      const item = await storyBibleService.getForeshadowing(request.params.id);

      if (!item) {
        return reply
          .status(404)
          .send(error('NOT_FOUND', `Foreshadowing ${request.params.id} not found`));
      }

      return success(item);
    });

    /**
     * POST / - Create new foreshadowing
     */
    fastify.post<{
      Body: CreateForeshadowingRequest;
    }>('/', async (request, reply) => {
      const item = await storyBibleService.createForeshadowing(request.body);
      return reply.status(201).send(success(item));
    });

    /**
     * PATCH /:id - Update a foreshadowing
     */
    fastify.patch<{
      Params: { id: string };
      Body: UpdateForeshadowingRequest;
    }>('/:id', async (request) => {
      const item = await storyBibleService.updateForeshadowing(request.params.id, request.body);
      return success(item);
    });

    /**
     * DELETE /:id - Delete a foreshadowing
     */
    fastify.delete<{
      Params: { id: string };
    }>('/:id', async (request) => {
      await storyBibleService.deleteForeshadowing(request.params.id);
      return success({ deleted: true });
    });

    /**
     * POST /:id/hint - Add a hint to existing foreshadowing
     * Tracks where hints are dropped throughout the story.
     */
    fastify.post<{
      Params: { id: string };
      Body: AddForeshadowingHintRequest;
    }>('/:id/hint', async (request) => {
      const { chapter, text } = request.body;
      const item = await storyBibleService.addForeshadowingHint(request.params.id, chapter, text);
      return success(item);
    });

    /**
     * POST /:id/resolve - Mark foreshadowing as resolved/paid off
     */
    fastify.post<{
      Params: { id: string };
      Body: ResolveForeshadowingRequest;
    }>('/:id/resolve', async (request) => {
      const { resolvedChapter } = request.body;
      const item = await storyBibleService.resolveForeshadowing(request.params.id, resolvedChapter);
      return success(item);
    });

    /**
     * POST /:id/abandon - Mark foreshadowing as abandoned
     * Used when a planned payoff is no longer happening.
     */
    fastify.post<{
      Params: { id: string };
    }>('/:id/abandon', async (request) => {
      const item = await storyBibleService.abandonForeshadowing(request.params.id);
      return success(item);
    });
  };
};
