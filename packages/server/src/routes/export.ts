/**
 * Export API Routes
 *
 * Endpoints for exporting chapters and Story Bible data.
 * Returns raw file data with Content-Disposition (NOT JSON envelope).
 *
 * POST /api/export/chapters — Export chapters in MD/TXT/DOCX format
 * POST /api/export/story-bible — Export Story Bible as Markdown
 */

import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import type { ExportOptions } from '@inxtone/core';
import type { RouteDeps } from './index.js';
import { z } from 'zod';

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

function validateBody<T>(body: unknown, schema: z.ZodType<T>, reply: FastifyReply): T | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    void reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: errors.join('; ') },
    });
    return null;
  }
  return result.data;
}

const exportChaptersSchema = z.object({
  format: z.enum(['md', 'txt', 'docx']),
  range: z.object({
    type: z.enum(['all', 'volume', 'chapters']),
    volumeId: z.number().int().optional(),
    chapterIds: z.array(z.number().int()).optional(),
  }),
  includeOutline: z.boolean().optional(),
  includeMetadata: z.boolean().optional(),
});

const exportBibleSchema = z.object({
  sections: z
    .array(
      z.enum([
        'characters',
        'relationships',
        'world',
        'locations',
        'factions',
        'arcs',
        'foreshadowing',
        'hooks',
      ])
    )
    .optional(),
});

const MIME_TYPES: Record<string, string> = {
  md: 'text/markdown',
  txt: 'text/plain',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export const exportRoutes = (deps: RouteDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    if (!deps.exportService) return;

    const { exportService } = deps;

    // POST /api/export/chapters
    fastify.post('/chapters', async (request, reply) => {
      const body = validateBody(request.body, exportChaptersSchema, reply);
      if (!body) return reply;

      const options: ExportOptions = {
        format: body.format,
        range: stripUndefined(body.range) as ExportOptions['range'],
      };
      if (body.includeOutline !== undefined) options.includeOutline = body.includeOutline;
      if (body.includeMetadata !== undefined) options.includeMetadata = body.includeMetadata;

      const result = await exportService.exportChapters(options);
      const mimeType = MIME_TYPES[body.format] ?? 'application/octet-stream';

      return reply
        .header('Content-Type', mimeType)
        .header('Content-Disposition', `attachment; filename="${result.filename}"`)
        .send(result.data);
    });

    // POST /api/export/story-bible
    fastify.post('/story-bible', async (request, reply) => {
      const body = validateBody(request.body, exportBibleSchema, reply);
      if (!body) return reply;

      const options = body.sections ? { sections: body.sections } : undefined;
      const result = await exportService.exportStoryBible(options);

      return reply
        .header('Content-Type', result.mimeType)
        .header('Content-Disposition', `attachment; filename="${result.filename}"`)
        .send(result.data);
    });
  };
};
