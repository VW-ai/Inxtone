/**
 * Smart Intake API Routes
 *
 * Endpoints for AI-powered Story Bible entity extraction:
 * - POST /decompose — NL text → structured entities
 * - POST /detect-duplicates — check extracted entities against existing Bible
 * - POST /commit — write confirmed entities to Story Bible
 * - POST /import-chapters — multi-pass chapter extraction (SSE stream)
 *
 * @see spec/Milestone/M6.md
 */

import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import type { IntakeProgressEvent } from '@inxtone/core';
import type { IntakeService } from '@inxtone/core/services';
import { success, error } from '../utils/response.js';
import { z } from 'zod';

// ===========================================
// Zod Schemas for Request Validation
// ===========================================

const decomposeSchema = z.object({
  text: z.string().min(1, 'Text is required').max(500000, 'Text too long (max 500K characters)'),
  hint: z.enum(['character', 'world', 'plot', 'location', 'faction', 'auto']).optional(),
});

const commitEntitySchema = z.object({
  entityType: z.enum([
    'character',
    'relationship',
    'location',
    'faction',
    'world',
    'timeline',
    'foreshadowing',
    'arc',
    'hook',
  ]),
  action: z.enum(['create', 'merge', 'skip']),
  data: z.record(z.string(), z.unknown()),
  existingId: z.string().optional(),
});

const commitSchema = z.object({
  entities: z.array(commitEntitySchema).min(1, 'At least one entity is required'),
});

const detectDuplicatesSchema = z.object({
  characters: z.array(z.record(z.string(), z.unknown())).default([]),
  relationships: z.array(z.record(z.string(), z.unknown())).default([]),
  locations: z.array(z.record(z.string(), z.unknown())).default([]),
  factions: z.array(z.record(z.string(), z.unknown())).default([]),
  worldRules: z.record(z.string(), z.unknown()).optional(),
  foreshadowing: z.array(z.record(z.string(), z.unknown())).default([]),
  arcs: z.array(z.record(z.string(), z.unknown())).default([]),
  hooks: z.array(z.record(z.string(), z.unknown())).default([]),
  timeline: z.array(z.record(z.string(), z.unknown())).default([]),
  warnings: z.array(z.string()).default([]),
});

const importChaptersSchema = z.object({
  chapters: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1).max(500000),
        sortOrder: z.number().int().nonnegative(),
      })
    )
    .min(1, 'At least one chapter is required'),
});

// ===========================================
// Validation Helper
// ===========================================

function validateBody<T>(body: unknown, schema: z.ZodType<T>, reply: FastifyReply): T | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    void reply
      .status(400)
      .send(error('VALIDATION_ERROR', `Invalid request body: ${errors.join('; ')}`));
    return null;
  }
  return result.data;
}

// ===========================================
// API Key Injection (BYOK)
// ===========================================

function injectApiKey(
  request: { headers: Record<string, unknown> },
  intakeService: IntakeService
): void {
  const apiKey = request.headers['x-gemini-key'];
  if (typeof apiKey === 'string' && apiKey.length > 0) {
    intakeService.setGeminiApiKey(apiKey);
  }
}

// ===========================================
// SSE Streaming for Chapter Import
// ===========================================

async function streamIntakeSSE(
  reply: FastifyReply,
  events: AsyncIterable<IntakeProgressEvent>
): Promise<void> {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  try {
    for await (const event of events) {
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      if (event.type === 'error' || event.type === 'done') break;
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    reply.raw.write(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`);
  } finally {
    reply.raw.end();
  }
}

// ===========================================
// Route Factory
// ===========================================

export interface IntakeRouteDeps {
  intakeService: IntakeService;
}

export const intakeRoutes = (deps: IntakeRouteDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    const { intakeService } = deps;

    /**
     * POST /decompose
     *
     * Decompose natural language text into structured Story Bible entities.
     * Returns a DecomposeResult with entities grouped by type.
     */
    fastify.post('/decompose', async (request, reply) => {
      const body = validateBody(request.body, decomposeSchema, reply);
      if (!body) return reply;

      injectApiKey(request, intakeService);

      try {
        const result = await intakeService.decompose(body.text, body.hint);
        return success(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Decomposition failed';
        return reply.status(500).send(error('INTAKE_ERROR', msg));
      }
    });

    /**
     * POST /detect-duplicates
     *
     * Check extracted entities against existing Story Bible for duplicates.
     * Returns a list of potential duplicate candidates with confidence scores.
     */
    fastify.post('/detect-duplicates', async (request, reply) => {
      const body = validateBody(request.body, detectDuplicatesSchema, reply);
      if (!body) return reply;

      injectApiKey(request, intakeService);

      try {
        // The body is already shaped like DecomposeResult from the schema
        const candidates = await intakeService.detectDuplicates(
          body as unknown as Parameters<typeof intakeService.detectDuplicates>[0]
        );
        return success(candidates);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Duplicate detection failed';
        return reply.status(500).send(error('INTAKE_ERROR', msg));
      }
    });

    /**
     * POST /commit
     *
     * Commit confirmed entities to the Story Bible.
     * Entities are processed in dependency order (characters first, relationships last).
     */
    fastify.post('/commit', (request, reply) => {
      const body = validateBody(request.body, commitSchema, reply);
      if (!body) return reply;

      try {
        const result = intakeService.commitEntities(
          body.entities as Parameters<typeof intakeService.commitEntities>[0]
        );
        return reply.status(201).send(success(result));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Commit failed';
        return reply.status(500).send(error('INTAKE_ERROR', msg));
      }
    });

    /**
     * POST /import-chapters
     *
     * Multi-pass chapter extraction streamed as Server-Sent Events.
     * Pass 1: characters, locations, factions, world
     * Pass 2: relationships
     * Pass 3: arcs, foreshadowing, hooks, timeline
     */
    fastify.post('/import-chapters', async (request, reply) => {
      const body = validateBody(request.body, importChaptersSchema, reply);
      if (!body) return reply;

      injectApiKey(request, intakeService);

      const events = intakeService.extractFromChapters(body.chapters);
      await streamIntakeSSE(reply, events);
      return reply;
    });
  };
};
