/**
 * Search API Route
 *
 * Full-text search across all Story Bible entity types.
 *
 * GET /api/search?q=<query>&types=<csv>&limit=<number>
 */

import type { FastifyPluginAsync } from 'fastify';
import type { ISearchService, SearchResultItem } from '@inxtone/core';
import { success } from '../utils/response.js';

export interface SearchRouteDeps {
  searchService: ISearchService;
}

export const searchRoutes = (deps: SearchRouteDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    const { searchService } = deps;

    /**
     * GET / — Search across all entity types
     *
     * Query params:
     *   q     - Search query (required, min 1 char)
     *   types - Comma-separated entity types (optional)
     *   limit - Max results (optional, default 20, max 100)
     */
    fastify.get<{
      Querystring: { q?: string; types?: string; limit?: string };
    }>('/', async (request, reply) => {
      const { q, types, limit: limitStr } = request.query;

      if (!q || q.trim().length === 0) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Query parameter "q" is required' },
        });
      }

      // Reject single non-CJK characters (e.g., 'a'), but allow single CJK characters (e.g., '墨')
      const trimmed = q.trim();
      if (trimmed.length === 1 && !/[\u4E00-\u9FFF]/.test(trimmed)) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query must be at least 2 characters long',
          },
        });
      }

      const validTypes = new Set<SearchResultItem['entityType']>([
        'character',
        'chapter',
        'location',
        'faction',
        'arc',
        'foreshadowing',
      ]);

      let entityTypes: SearchResultItem['entityType'][] | undefined;
      if (types) {
        entityTypes = types
          .split(',')
          .map((t) => t.trim())
          .filter((t): t is SearchResultItem['entityType'] =>
            validTypes.has(t as SearchResultItem['entityType'])
          );
        if (entityTypes.length === 0) entityTypes = undefined;
      }

      const limit = Math.min(Math.max(1, Number(limitStr) || 20), 100);

      const opts: { entityTypes?: SearchResultItem['entityType'][]; limit: number } = { limit };
      if (entityTypes) opts.entityTypes = entityTypes;

      const results = await searchService.search(q.trim(), opts);
      return success({ results });
    });
  };
};
