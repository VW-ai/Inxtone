/**
 * Route Registration
 *
 * Central point for registering all API routes.
 * Uses the route factory pattern for dependency injection.
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type {
  IStoryBibleService,
  IAIService,
  IWritingService,
  ISearchService,
  IExportService,
} from '@inxtone/core';
import type { ChapterSetupAssist, IntakeService } from '@inxtone/core/services';
import type { Database } from '@inxtone/core/db';

import { characterRoutes } from './characters.js';
import { relationshipRoutes } from './relationships.js';
import { worldRoutes } from './world.js';
import { locationRoutes } from './locations.js';
import { factionRoutes } from './factions.js';
import { timelineRoutes } from './timeline.js';
import { arcRoutes } from './arcs.js';
import { foreshadowingRoutes } from './foreshadowing.js';
import { hookRoutes } from './hooks.js';
import { aiRoutes } from './ai.js';
import { volumeRoutes, chapterRoutes, versionRoutes, statsRoutes } from './writing.js';
import { seedRoutes } from './seed.js';
import { searchRoutes } from './search.js';
import { exportRoutes } from './export.js';
import { intakeRoutes } from './intake.js';

/**
 * Dependencies required by route handlers.
 */
export interface RouteDeps {
  storyBibleService: IStoryBibleService;
  aiService?: IAIService;
  writingService?: IWritingService;
  searchService?: ISearchService;
  exportService?: IExportService;
  setupAssist?: ChapterSetupAssist;
  intakeService?: IntakeService;
  db?: Database;
}

/**
 * Register all Story Bible API routes.
 *
 * @param fastify - Fastify instance
 * @param deps - Route dependencies
 */
export async function registerRoutes(fastify: FastifyInstance, deps: RouteDeps): Promise<void> {
  // Register each domain's routes with appropriate prefix
  await fastify.register(characterRoutes(deps), { prefix: '/api/characters' });
  await fastify.register(relationshipRoutes(deps), { prefix: '/api/relationships' });
  await fastify.register(worldRoutes(deps), { prefix: '/api/world' });
  await fastify.register(locationRoutes(deps), { prefix: '/api/locations' });
  await fastify.register(factionRoutes(deps), { prefix: '/api/factions' });
  await fastify.register(timelineRoutes(deps), { prefix: '/api/timeline' });
  await fastify.register(arcRoutes(deps), { prefix: '/api/arcs' });
  await fastify.register(foreshadowingRoutes(deps), { prefix: '/api/foreshadowing' });
  await fastify.register(hookRoutes(deps), { prefix: '/api/hooks' });

  // AI routes (optional - only registered if aiService is provided)
  if (deps.aiService) {
    await fastify.register(aiRoutes(deps), { prefix: '/api/ai' });
  }

  // Writing routes (optional - only registered if writingService is provided)
  if (deps.writingService) {
    await fastify.register(volumeRoutes(deps), { prefix: '/api/volumes' });
    await fastify.register(chapterRoutes(deps), { prefix: '/api/chapters' });
    await fastify.register(versionRoutes(deps), { prefix: '/api/versions' });
    await fastify.register(statsRoutes(deps), { prefix: '/api/stats' });
  }

  // Export routes (optional - only registered if exportService is provided)
  if (deps.exportService) {
    await fastify.register(exportRoutes(deps), { prefix: '/api/export' });
  }

  // Search routes (optional - only registered if searchService is provided)
  if (deps.searchService) {
    await fastify.register(searchRoutes({ searchService: deps.searchService }), {
      prefix: '/api/search',
    });
  }

  // Intake routes (optional - only registered if intakeService is provided)
  if (deps.intakeService) {
    await fastify.register(intakeRoutes({ intakeService: deps.intakeService }), {
      prefix: '/api/intake',
    });
  }

  // Seed routes (optional - only registered if db is provided)
  if (deps.db) {
    await fastify.register(seedRoutes({ db: deps.db }), { prefix: '/api/seed' });
  }
}

/**
 * Type for route factory functions.
 * Each domain exports a function that takes deps and returns a FastifyPluginAsync.
 */
export type RouteFactory = (deps: RouteDeps) => FastifyPluginAsync;
