/**
 * Test Helper for Route Integration Tests
 *
 * Creates a fully wired Fastify server with in-memory SQLite database.
 * Used by all route test files for consistent setup.
 */

import Fastify, { type FastifyInstance } from 'fastify';
import { Database } from '@inxtone/core/db';
import {
  CharacterRepository,
  RelationshipRepository,
  WorldRepository,
  LocationRepository,
  FactionRepository,
  TimelineEventRepository,
  ArcRepository,
  ForeshadowingRepository,
  HookRepository,
  WritingRepository,
} from '@inxtone/core/db';
import {
  EventBus,
  StoryBibleService,
  WritingService,
  SearchService,
  ExportService,
  IntakeService,
} from '@inxtone/core/services';
import { errorHandler } from '../../middleware/errorHandler.js';
import { registerRoutes } from '../index.js';

export interface TestContext {
  server: FastifyInstance;
  service: StoryBibleService;
  writingService: WritingService;
  searchService: SearchService;
  exportService: ExportService;
  intakeService: IntakeService;
  db: Database;
}

/**
 * Create a test server with all routes registered against an in-memory database.
 */
export async function createTestServer(): Promise<TestContext> {
  const db = new Database({ path: ':memory:', migrate: true });
  db.connect();

  const eventBus = new EventBus();
  const characterRepo = new CharacterRepository(db);
  const relationshipRepo = new RelationshipRepository(db);
  const worldRepo = new WorldRepository(db);
  const locationRepo = new LocationRepository(db);
  const factionRepo = new FactionRepository(db);
  const arcRepo = new ArcRepository(db);
  const foreshadowingRepo = new ForeshadowingRepository(db);
  const hookRepo = new HookRepository(db);
  const writingRepo = new WritingRepository(db);

  const service = new StoryBibleService({
    db,
    characterRepo,
    relationshipRepo,
    worldRepo,
    locationRepo,
    factionRepo,
    timelineEventRepo: new TimelineEventRepository(db),
    arcRepo,
    foreshadowingRepo,
    hookRepo,
    eventBus,
  });

  const writingService = new WritingService({
    db,
    writingRepo,
    characterRepo,
    locationRepo,
    arcRepo,
    foreshadowingRepo,
    eventBus,
  });

  const searchService = new SearchService(db);

  const exportService = new ExportService({
    writingRepo,
    characterRepo,
    relationshipRepo,
    worldRepo,
    locationRepo,
    factionRepo,
    arcRepo,
    foreshadowingRepo,
    hookRepo,
  });

  const intakeService = new IntakeService({
    db,
    characterRepo,
    relationshipRepo,
    locationRepo,
    factionRepo,
    arcRepo,
    foreshadowingRepo,
    hookRepo,
    worldRepo,
    timelineEventRepo: new TimelineEventRepository(db),
    eventBus,
  });

  const server = Fastify({ logger: false });
  server.setErrorHandler(errorHandler);
  await registerRoutes(server, {
    storyBibleService: service,
    writingService,
    searchService,
    exportService,
    intakeService,
  });
  await server.ready();

  return { server, service, writingService, searchService, exportService, intakeService, db };
}
