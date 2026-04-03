/**
 * Writing API Routes
 *
 * RESTful endpoints for the writing workspace: volumes, chapters, content,
 * versions, and stats.
 *
 * Volume endpoints: GET/POST/PATCH/DELETE /api/volumes
 * Chapter endpoints: GET/POST/PATCH/PUT/DELETE /api/chapters
 * Version endpoints: GET /api/versions
 * Stats endpoints: GET /api/stats
 *
 * @see spec/Modules/02_writing_service.md
 */

import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import type {
  CreateVolumeInput,
  CreateChapterInput,
  UpdateChapterInput,
  SaveContentInput,
} from '@inxtone/core';
import type { RouteDeps } from './index.js';
import { success } from '../utils/response.js';
import { z } from 'zod';

/**
 * Strip keys with `undefined` values from an object.
 * Bridges Zod's `T | undefined` optional output to service input types
 * that use `?: T` (required by exactOptionalPropertyTypes).
 */
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

// ===================================
// Zod Schemas for Request Validation
// ===================================

const createVolumeSchema = z.object({
  name: z.string().optional(),
  theme: z.string().optional(),
  coreConflict: z.string().optional(),
  mcGrowth: z.string().optional(),
  status: z.enum(['planned', 'in_progress', 'complete']).optional(),
});

const updateVolumeSchema = z.object({
  name: z.string().optional(),
  theme: z.string().optional(),
  coreConflict: z.string().optional(),
  mcGrowth: z.string().optional(),
  status: z.enum(['planned', 'in_progress', 'complete']).optional(),
});

const outlineSchema = z.object({
  goal: z.string().optional(),
  scenes: z.array(z.string()).optional(),
  hookEnding: z.string().optional(),
});

const createChapterSchema = z.object({
  volumeId: z.coerce.number().int().positive().optional(),
  arcId: z.string().min(1).optional(),
  title: z.string().optional(),
  status: z.enum(['outline', 'draft', 'revision', 'done']).optional(),
  outline: outlineSchema.optional(),
  characters: z.array(z.string().min(1)).optional(),
  locations: z.array(z.string().min(1)).optional(),
  foreshadowingHinted: z.array(z.string().min(1)).optional(),
});

const updateChapterSchema = z.object({
  volumeId: z.coerce.number().int().positive().nullable().optional(),
  arcId: z.string().min(1).nullable().optional(),
  title: z.string().optional(),
  status: z.enum(['outline', 'draft', 'revision', 'done']).optional(),
  outline: outlineSchema.optional(),
  characters: z.array(z.string().min(1)).optional(),
  locations: z.array(z.string().min(1)).optional(),
  foreshadowingPlanted: z.array(z.string().min(1)).optional(),
  foreshadowingHinted: z.array(z.string().min(1)).optional(),
  foreshadowingResolved: z.array(z.string().min(1)).optional(),
  emotionCurve: z.enum(['low_to_high', 'high_to_low', 'stable', 'wave']).optional(),
  tension: z.enum(['low', 'medium', 'high']).optional(),
});

const saveContentSchema = z.object({
  content: z.string(),
  createVersion: z.boolean().optional(),
});

const reorderChaptersSchema = z.object({
  chapterIds: z.array(z.coerce.number().int().positive()).min(1),
});

const createVersionSchema = z.object({
  summary: z.string().optional(),
});

const rollbackSchema = z.object({
  versionId: z.coerce.number().int().positive(),
});

// ===================================
// Validation Helper
// ===================================

/**
 * Validate request body against a Zod schema.
 * Returns parsed data on success, or sends a 400 error and returns null.
 */
function validateBody<T>(body: unknown, schema: z.ZodType<T>, reply: FastifyReply): T | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    void reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid request body: ${errors.join('; ')}`,
      },
    });
    return null;
  }
  return result.data;
}

/**
 * Validate query params against a Zod schema.
 * Returns parsed data on success, or sends a 400 error and returns null.
 */
function validateQuery<T>(query: unknown, schema: z.ZodType<T>, reply: FastifyReply): T | null {
  const result = schema.safeParse(query);
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    void reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid query parameters: ${errors.join('; ')}`,
      },
    });
    return null;
  }
  return result.data;
}

// ===================================
// Volume Routes (/api/volumes)
// ===================================

/**
 * Volume routes factory.
 */
export const volumeRoutes = (deps: RouteDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    const { writingService } = deps;
    if (!writingService) return;

    /** GET / - List all volumes */
    fastify.get('/', async () => {
      const volumes = await writingService.getAllVolumes();
      return success(volumes);
    });

    /** GET /:id - Get volume by ID */
    fastify.get<{ Params: { id: string } }>('/:id', async (request) => {
      const volume = await writingService.getVolume(Number(request.params.id));
      return success(volume);
    });

    /** POST / - Create volume */
    fastify.post('/', async (request, reply) => {
      const body = validateBody(request.body, createVolumeSchema, reply);
      if (!body) return reply;
      const volume = await writingService.createVolume(stripUndefined(body) as CreateVolumeInput);
      return reply.status(201).send(success(volume));
    });

    /** PATCH /:id - Update volume */
    fastify.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
      const body = validateBody(request.body, updateVolumeSchema, reply);
      if (!body) return reply;
      const volume = await writingService.updateVolume(
        Number(request.params.id),
        stripUndefined(body) as Partial<CreateVolumeInput>
      );
      return success(volume);
    });

    /** DELETE /:id - Delete volume (cascades chapters) */
    fastify.delete<{ Params: { id: string } }>('/:id', async (request) => {
      await writingService.deleteVolume(Number(request.params.id));
      return success({ deleted: true });
    });
  };
};

// ===================================
// Chapter Routes (/api/chapters)
// ===================================

/**
 * Chapter routes factory.
 * Includes nested version and rollback endpoints.
 */
export const chapterRoutes = (deps: RouteDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    const { writingService } = deps;
    if (!writingService) return;

    // --- Chapter CRUD ---

    /** GET / - List chapters (filterable by volumeId, arcId, status) */
    fastify.get<{
      Querystring: { volumeId?: string; arcId?: string; status?: string };
    }>('/', async (request) => {
      const { volumeId, arcId, status } = request.query;

      let chapters;
      if (volumeId) {
        chapters = await writingService.getChaptersByVolume(Number(volumeId));
      } else if (arcId) {
        chapters = await writingService.getChaptersByArc(arcId);
      } else if (status) {
        chapters = await writingService.getChaptersByStatus(
          status as 'outline' | 'draft' | 'revision' | 'done'
        );
      } else {
        chapters = await writingService.getAllChapters();
      }

      return success(chapters);
    });

    /**
     * POST /reorder - Reorder chapters.
     * Must be registered BEFORE /:id to avoid Fastify treating "reorder" as a param.
     */
    fastify.post('/reorder', async (request, reply) => {
      const body = validateBody(request.body, reorderChaptersSchema, reply);
      if (!body) return reply;
      await writingService.reorderChapters(body.chapterIds);
      return success({ reordered: true });
    });

    /** GET /:id/setup-suggestions - Chapter setup assist suggestions */
    if (deps.setupAssist) {
      const setupAssist = deps.setupAssist;
      // eslint-disable-next-line @typescript-eslint/require-await
      fastify.get<{ Params: { id: string } }>('/:id/setup-suggestions', async (request) => {
        const suggestions = setupAssist.suggest(Number(request.params.id));
        return success(suggestions);
      });
    }

    /** GET /:id - Get chapter (with optional content via ?includeContent=true) */
    fastify.get<{
      Params: { id: string };
      Querystring: { includeContent?: string };
    }>('/:id', async (request) => {
      const id = Number(request.params.id);
      const includeContent = request.query.includeContent === 'true';

      const chapter = includeContent
        ? await writingService.getChapterWithContent(id)
        : await writingService.getChapter(id);

      return success(chapter);
    });

    /** POST / - Create chapter */
    fastify.post('/', async (request, reply) => {
      const body = validateBody(request.body, createChapterSchema, reply);
      if (!body) return reply;
      const chapter = await writingService.createChapter(
        stripUndefined(body) as CreateChapterInput
      );
      return reply.status(201).send(success(chapter));
    });

    /** PATCH /:id - Update chapter metadata */
    fastify.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
      const body = validateBody(request.body, updateChapterSchema, reply);
      if (!body) return reply;
      const chapter = await writingService.updateChapter(
        Number(request.params.id),
        stripUndefined(body) as UpdateChapterInput
      );
      return success(chapter);
    });

    /** PUT /:id/content - Save chapter content */
    fastify.put<{ Params: { id: string } }>('/:id/content', async (request, reply) => {
      const body = validateBody(request.body, saveContentSchema, reply);
      if (!body) return reply;
      const chapter = await writingService.saveContent(
        stripUndefined({
          chapterId: Number(request.params.id),
          content: body.content,
          createVersion: body.createVersion,
        }) as SaveContentInput
      );
      return success(chapter);
    });

    /** DELETE /:id - Delete chapter */
    fastify.delete<{ Params: { id: string } }>('/:id', async (request) => {
      await writingService.deleteChapter(Number(request.params.id));
      return success({ deleted: true });
    });

    // --- Version sub-endpoints (nested under chapters) ---

    /** GET /:chapterId/versions - List versions for a chapter */
    fastify.get<{ Params: { chapterId: string } }>('/:chapterId/versions', async (request) => {
      const versions = await writingService.getVersions(Number(request.params.chapterId));
      return success(versions);
    });

    /** POST /:chapterId/versions - Create version snapshot */
    fastify.post<{ Params: { chapterId: string } }>(
      '/:chapterId/versions',
      async (request, reply) => {
        const body = validateBody(request.body, createVersionSchema, reply);
        if (!body) return reply;
        const version = await writingService.createVersion(
          stripUndefined({
            chapterId: Number(request.params.chapterId),
            changeSummary: body.summary,
          }) as { chapterId: number; changeSummary?: string }
        );
        return reply.status(201).send(success(version));
      }
    );

    /** POST /:chapterId/rollback - Rollback to a specific version */
    fastify.post<{ Params: { chapterId: string } }>(
      '/:chapterId/rollback',
      async (request, reply) => {
        const body = validateBody(request.body, rollbackSchema, reply);
        if (!body) return reply;
        const chapter = await writingService.rollbackToVersion(
          Number(request.params.chapterId),
          body.versionId
        );
        return success(chapter);
      }
    );
  };
};

// ===================================
// Version Routes (/api/versions)
// ===================================

/**
 * Standalone version routes factory.
 * For endpoints not scoped under a specific chapter.
 */
export const versionRoutes = (deps: RouteDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    const { writingService } = deps;
    if (!writingService) return;

    const compareQuerySchema = z.object({
      versionId1: z.coerce.number().int().positive(),
      versionId2: z.coerce.number().int().positive(),
    });

    /**
     * GET /compare - Compare two versions.
     * Must be registered BEFORE /:id to avoid Fastify treating "compare" as a param.
     */
    fastify.get('/compare', async (request, reply) => {
      const query = validateQuery(request.query, compareQuerySchema, reply);
      if (!query) return reply;
      const diff = await writingService.compareVersions(query.versionId1, query.versionId2);
      return success(diff);
    });

    /** GET /:id - Get version by ID */
    fastify.get<{ Params: { id: string } }>('/:id', async (request) => {
      const version = await writingService.getVersion(Number(request.params.id));
      return success(version);
    });
  };
};

// ===================================
// Stats Routes (/api/stats)
// ===================================

/**
 * Stats routes factory.
 * Only includes implemented endpoints (word-count).
 * Goals, sessions, and other stats deferred to post-M3.
 */
export const statsRoutes = (deps: RouteDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    const { writingService } = deps;
    if (!writingService) return;

    /** GET /word-count - Get total word count across all chapters */

    fastify.get('/word-count', async () => {
      const totalWords = await writingService.getTotalWordCount();
      return success({ totalWords });
    });
  };
};
