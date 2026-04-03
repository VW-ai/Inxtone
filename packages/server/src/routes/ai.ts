/**
 * AI API Routes
 *
 * Streaming AI generation endpoints using Server-Sent Events (SSE).
 * Non-streaming endpoints for context building and provider info.
 *
 * SSE endpoints: POST /continue, /dialogue, /describe, /brainstorm, /ask, /complete
 * JSON endpoints: POST /context, GET /providers
 *
 * @see spec/Modules/03_ai_service.md
 */

import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import type { AIStreamChunk, AIGenerationOptions, ContextItem } from '@inxtone/core';
import { GeminiProvider } from '@inxtone/core/services';
import type { RouteDeps } from './index.js';
import { success } from '../utils/response.js';
import { z } from 'zod';

// ===================================
// Zod Schemas for Request Validation
// ===================================

const aiGenerationOptionsSchema = z
  .object({
    provider: z.enum(['gemini', 'openai', 'claude']).optional(),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().positive().optional(),
  })
  .optional();

const contextItemSchema = z.object({
  type: z.enum([
    'chapter_content',
    'chapter_outline',
    'chapter_prev_tail',
    'character',
    'relationship',
    'location',
    'arc',
    'foreshadowing',
    'hook',
    'power_system',
    'social_rules',
    'custom',
  ]),
  id: z.string().optional(),
  content: z.string(),
  priority: z.number(),
});

const continueSchema = z.object({
  chapterId: z.coerce.number().int().positive(),
  options: aiGenerationOptionsSchema,
  userInstruction: z.string().optional(),
  excludedContextIds: z.array(z.string()).optional(),
});

const dialogueSchema = z.object({
  characterIds: z.array(z.string().min(1)).min(1),
  context: z.string().min(1),
  options: aiGenerationOptionsSchema,
  userInstruction: z.string().optional(),
  chapterId: z.coerce.number().int().positive().optional(),
});

const describeSchema = z.object({
  locationId: z.string().min(1),
  mood: z.string().min(1),
  options: aiGenerationOptionsSchema,
  userInstruction: z.string().optional(),
  chapterId: z.coerce.number().int().positive().optional(),
});

const brainstormSchema = z.object({
  topic: z.string().min(1),
  options: aiGenerationOptionsSchema,
  userInstruction: z.string().optional(),
  chapterId: z.coerce.number().int().positive().optional(),
});

const askSchema = z.object({
  question: z.string().min(1),
  options: aiGenerationOptionsSchema,
});

const completeSchema = z.object({
  prompt: z.string().min(1),
  context: z.array(contextItemSchema).optional(),
  options: aiGenerationOptionsSchema,
});

const buildContextSchema = z.object({
  chapterId: z.coerce.number().int().positive(),
  additionalItems: z.array(contextItemSchema).optional(),
});

const extractEntitiesSchema = z.object({
  chapterId: z.coerce.number().int().positive(),
  content: z.string().min(1),
  options: aiGenerationOptionsSchema,
});

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
 * Stream an AsyncIterable<AIStreamChunk> as Server-Sent Events to the reply.
 *
 * Sets SSE headers and writes each chunk as a `data:` line.
 * Closes the connection when done or on error.
 */
async function streamSSE(reply: FastifyReply, chunks: AsyncIterable<AIStreamChunk>): Promise<void> {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable proxy buffering (nginx)
  });

  try {
    for await (const chunk of chunks) {
      reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
      if (chunk.type === 'error' || chunk.type === 'done') break;
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    reply.raw.write(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`);
  } finally {
    reply.raw.end();
  }
}

const verifyKeySchema = z.object({
  apiKey: z.string().min(1),
});

/**
 * Inject per-request API key from X-Gemini-Key header into the AIService.
 */
function injectApiKey(
  request: { headers: Record<string, unknown> },
  aiService: { setGeminiApiKey(key: string): void }
): void {
  const apiKey = request.headers['x-gemini-key'];
  if (typeof apiKey === 'string' && apiKey.length > 0) {
    aiService.setGeminiApiKey(apiKey);
  }
}

/**
 * AI routes factory.
 *
 * @param deps - Route dependencies including AIService
 * @returns Fastify plugin with AI routes
 */
export const aiRoutes = (deps: RouteDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    const { aiService } = deps;

    /**
     * POST /verify-key - Validate a Gemini API key with a lightweight call
     */
    fastify.post('/verify-key', async (request, reply) => {
      const body = validateBody(request.body, verifyKeySchema, reply);
      if (!body) return reply;
      const result = await GeminiProvider.verifyApiKey(body.apiKey);
      return success(result);
    });

    // Guard: remaining routes require aiService
    if (!aiService) return;

    /**
     * POST /continue - Continue scene (SSE stream)
     */
    fastify.post('/continue', async (request, reply) => {
      const body = validateBody(request.body, continueSchema, reply);
      if (!body) return reply;
      injectApiKey(request, aiService);
      const stream = aiService.continueScene(
        body.chapterId,
        body.options as AIGenerationOptions | undefined,
        body.userInstruction,
        body.excludedContextIds
      );
      await streamSSE(reply, stream);
      return reply;
    });

    /**
     * POST /dialogue - Generate dialogue (SSE stream)
     */
    fastify.post('/dialogue', async (request, reply) => {
      const body = validateBody(request.body, dialogueSchema, reply);
      if (!body) return reply;
      injectApiKey(request, aiService);
      const stream = aiService.generateDialogue(
        body.characterIds,
        body.context,
        body.options as AIGenerationOptions | undefined,
        body.userInstruction,
        body.chapterId
      );
      await streamSSE(reply, stream);
      return reply;
    });

    /**
     * POST /describe - Describe scene (SSE stream)
     */
    fastify.post('/describe', async (request, reply) => {
      const body = validateBody(request.body, describeSchema, reply);
      if (!body) return reply;
      injectApiKey(request, aiService);
      const stream = aiService.describeScene(
        body.locationId,
        body.mood,
        body.options as AIGenerationOptions | undefined,
        body.userInstruction,
        body.chapterId
      );
      await streamSSE(reply, stream);
      return reply;
    });

    /**
     * POST /brainstorm - Brainstorm ideas (SSE stream)
     */
    fastify.post('/brainstorm', async (request, reply) => {
      const body = validateBody(request.body, brainstormSchema, reply);
      if (!body) return reply;
      injectApiKey(request, aiService);
      const stream = aiService.brainstorm(
        body.topic,
        body.options as AIGenerationOptions | undefined,
        body.userInstruction,
        body.chapterId
      );
      await streamSSE(reply, stream);
      return reply;
    });

    /**
     * POST /ask - Ask story bible (SSE stream)
     */
    fastify.post('/ask', async (request, reply) => {
      const body = validateBody(request.body, askSchema, reply);
      if (!body) return reply;
      injectApiKey(request, aiService);
      const stream = aiService.askStoryBible(
        body.question,
        body.options as AIGenerationOptions | undefined
      );
      await streamSSE(reply, stream);
      return reply;
    });

    /**
     * POST /complete - Generic completion (SSE stream)
     */
    fastify.post('/complete', async (request, reply) => {
      const body = validateBody(request.body, completeSchema, reply);
      if (!body) return reply;
      injectApiKey(request, aiService);
      const stream = aiService.complete(
        body.prompt,
        body.context as ContextItem[] | undefined,
        body.options as AIGenerationOptions | undefined
      );
      await streamSSE(reply, stream);
      return reply;
    });

    /**
     * POST /context - Build context for a chapter (JSON)
     */
    fastify.post('/context', async (request, reply) => {
      const body = validateBody(request.body, buildContextSchema, reply);
      if (!body) return reply;
      const result = await aiService.buildContext(
        body.chapterId,
        body.additionalItems as ContextItem[] | undefined
      );
      return success(result);
    });

    /**
     * POST /extract-entities - Extract entities from content (JSON)
     */
    fastify.post('/extract-entities', async (request, reply) => {
      const body = validateBody(request.body, extractEntitiesSchema, reply);
      if (!body) return reply;
      injectApiKey(request, aiService);
      const result = await aiService.extractEntities(
        body.chapterId,
        body.content,
        body.options as AIGenerationOptions | undefined
      );
      return success(result);
    });

    /**
     * GET /providers - Get provider info (JSON)
     */
    // eslint-disable-next-line @typescript-eslint/require-await
    fastify.get('/providers', async () => {
      const available = aiService.getAvailableProviders();
      const configured = available.filter((p) => aiService.isProviderConfigured(p));
      return success({
        available,
        configured,
        default: 'gemini',
      });
    });
  };
};
