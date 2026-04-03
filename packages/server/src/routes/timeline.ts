/**
 * Timeline API Routes
 *
 * RESTful endpoints for timeline event management.
 * 4 endpoints: list, create, update, delete.
 */

import type { FastifyPluginAsync } from 'fastify';
import type { TimelineEvent, UpdateTimelineEventInput } from '@inxtone/core';
import type { RouteDeps } from './index.js';
import { success } from '../utils/response.js';

/**
 * Timeline routes factory.
 */
export const timelineRoutes = (deps: RouteDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    const { storyBibleService } = deps;

    /**
     * GET / - List all timeline events
     */
    fastify.get('/', async () => {
      const events = await storyBibleService.getTimelineEvents();
      return success(events);
    });

    /**
     * POST / - Create a new timeline event
     */
    fastify.post<{
      Body: Omit<TimelineEvent, 'id' | 'createdAt'>;
    }>('/', async (request, reply) => {
      const event = await storyBibleService.createTimelineEvent(request.body);
      return reply.status(201).send(success(event));
    });

    /**
     * PATCH /:id - Update a timeline event
     */
    fastify.patch<{
      Params: { id: string };
      Body: UpdateTimelineEventInput;
    }>('/:id', async (request) => {
      const id = parseInt(request.params.id, 10);
      const event = await storyBibleService.updateTimelineEvent(id, request.body);
      return success(event);
    });

    /**
     * DELETE /:id - Delete a timeline event
     */
    fastify.delete<{
      Params: { id: string };
    }>('/:id', async (request) => {
      const id = parseInt(request.params.id, 10);
      await storyBibleService.deleteTimelineEvent(id);
      return success({ deleted: true });
    });
  };
};
