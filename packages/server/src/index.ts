/**
 * @inxtone/server
 *
 * HTTP server using Fastify for Inxtone Web GUI
 */

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { VERSION } from '@inxtone/core';
import type {
  IStoryBibleService,
  IAIService,
  IWritingService,
  ISearchService,
  IExportService,
} from '@inxtone/core';
import {
  Database,
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
  AIService,
  WritingService,
  SearchService,
  ChapterSetupAssist,
  ExportService,
  IntakeService,
} from '@inxtone/core/services';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';

import { errorHandler } from './middleware/errorHandler.js';
import { registerRoutes } from './routes/index.js';

export const DEFAULT_PORT = 3456;

export interface ServerOptions {
  port?: number;
  logger?: boolean;
  staticDir?: string; // Path to web build directory

  // Dependency injection for testing/customization
  storyBibleService?: IStoryBibleService;
  aiService?: IAIService;
  writingService?: IWritingService;
  searchService?: ISearchService;
  exportService?: IExportService;
  setupAssist?: ChapterSetupAssist;
  intakeService?: IntakeService;

  // Database instance for seed routes
  db?: InstanceType<typeof Database>;

  // Database path for production bootstrap
  dbPath?: string;
}

/**
 * Create and configure the Fastify server
 *
 * @param options - Server configuration options
 * @returns Configured Fastify instance (not yet listening)
 */
export async function createServer(options: ServerOptions = {}): Promise<FastifyInstance> {
  const server = Fastify({
    logger: options.logger ?? true,
  });

  // Register global error handler
  server.setErrorHandler(errorHandler);

  // Register CORS for development
  await server.register(cors, {
    origin: true,
  });

  // Health check endpoint
  server.get('/api/health', () => {
    return {
      status: 'ok',
      version: VERSION,
      timestamp: new Date().toISOString(),
    };
  });

  // API info endpoint
  server.get('/api', () => {
    return {
      name: 'Inxtone API',
      version: VERSION,
      endpoints: {
        health: '/api/health',
        // Story Bible API
        characters: '/api/characters',
        relationships: '/api/relationships',
        world: '/api/world',
        locations: '/api/locations',
        factions: '/api/factions',
        timeline: '/api/timeline',
        arcs: '/api/arcs',
        foreshadowing: '/api/foreshadowing',
        hooks: '/api/hooks',
        ai: '/api/ai',
        search: '/api/search',
        // Writing API
        volumes: '/api/volumes',
        chapters: '/api/chapters',
        versions: '/api/versions',
        stats: '/api/stats',
        // Export API
        export: '/api/export',
        // Smart Intake API
        intake: '/api/intake',
        // Future endpoints
        // quality: '/api/quality',
      },
    };
  });

  // Register API routes if service is provided
  if (options.storyBibleService) {
    const deps: Parameters<typeof registerRoutes>[1] = {
      storyBibleService: options.storyBibleService,
    };
    if (options.aiService) {
      deps.aiService = options.aiService;
    }
    if (options.writingService) {
      deps.writingService = options.writingService;
    }
    if (options.searchService) {
      deps.searchService = options.searchService;
    }
    if (options.exportService) {
      deps.exportService = options.exportService;
    }
    if (options.setupAssist) {
      deps.setupAssist = options.setupAssist;
    }
    if (options.intakeService) {
      deps.intakeService = options.intakeService;
    }
    if (options.db) {
      deps.db = options.db;
    }
    await registerRoutes(server, deps);
  }

  // Serve static files from web build (if available)
  const staticDir = options.staticDir ?? findWebBuildDir();
  if (staticDir && fs.existsSync(staticDir)) {
    await server.register(fastifyStatic, {
      root: staticDir,
      prefix: '/',
      // Serve index.html for SPA routes
      wildcard: false,
    });

    // SPA fallback - serve index.html for non-API routes
    server.setNotFoundHandler((request, reply) => {
      if (!request.url.startsWith('/api')) {
        return reply.sendFile('index.html');
      }
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
      });
    });
  }

  return server;
}

/**
 * Attempt to find the web build directory
 */
function findWebBuildDir(): string | undefined {
  // Try common locations relative to server package
  const candidates = [
    path.join(process.cwd(), 'packages', 'web', 'dist'),
    path.join(process.cwd(), '..', 'web', 'dist'),
    path.join(import.meta.dirname, '..', '..', 'web', 'dist'),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }

  return undefined;
}

/**
 * Create and initialize all services with shared infrastructure.
 *
 * Creates a single Database, EventBus, and repository set shared by
 * StoryBibleService and AIService.
 */
function createServices(options: {
  dbPath?: string | undefined;
  geminiApiKey?: string | undefined;
}): {
  storyBibleService: IStoryBibleService;
  aiService: IAIService;
  writingService: IWritingService;
  searchService: ISearchService;
  exportService: IExportService;
  setupAssist: ChapterSetupAssist;
  intakeService: IntakeService;
  db: InstanceType<typeof Database>;
} {
  // Use provided path or default to ~/.inxtone/data.db
  const finalDbPath = options.dbPath ?? path.join(os.homedir(), '.inxtone', 'data.db');

  // Ensure directory exists
  const dbDir = path.dirname(finalDbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create database and run migrations
  const db = new Database({
    path: finalDbPath,
    migrate: true,
  });
  db.connect();

  // Shared infrastructure
  const eventBus = new EventBus();

  // Shared repositories
  const characterRepo = new CharacterRepository(db);
  const relationshipRepo = new RelationshipRepository(db);
  const worldRepo = new WorldRepository(db);
  const locationRepo = new LocationRepository(db);
  const factionRepo = new FactionRepository(db);
  const timelineEventRepo = new TimelineEventRepository(db);
  const arcRepo = new ArcRepository(db);
  const foreshadowingRepo = new ForeshadowingRepository(db);
  const hookRepo = new HookRepository(db);
  const writingRepo = new WritingRepository(db);

  // Create StoryBibleService
  const storyBibleService = new StoryBibleService({
    db,
    characterRepo,
    relationshipRepo,
    worldRepo,
    locationRepo,
    factionRepo,
    timelineEventRepo,
    arcRepo,
    foreshadowingRepo,
    hookRepo,
    eventBus,
  });

  // Create AIService
  const aiService = new AIService(
    {
      writingRepo,
      characterRepo,
      locationRepo,
      arcRepo,
      relationshipRepo,
      foreshadowingRepo,
      hookRepo,
      worldRepo,
      eventBus,
    },
    { geminiApiKey: options.geminiApiKey }
  );

  // Create IntakeService
  const intakeOpts = options.geminiApiKey ? { geminiApiKey: options.geminiApiKey } : undefined;
  const intakeService = new IntakeService(
    {
      db,
      characterRepo,
      relationshipRepo,
      locationRepo,
      factionRepo,
      arcRepo,
      foreshadowingRepo,
      hookRepo,
      worldRepo,
      timelineEventRepo,
      eventBus,
    },
    intakeOpts
  );

  // Create WritingService
  const writingService = new WritingService({
    db,
    writingRepo,
    characterRepo,
    locationRepo,
    arcRepo,
    foreshadowingRepo,
    eventBus,
  });

  // Create ExportService
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

  // Create SearchService
  const searchService = new SearchService(db);

  // Create ChapterSetupAssist
  const setupAssist = new ChapterSetupAssist({
    writingRepo,
    characterRepo,
    locationRepo,
    foreshadowingRepo,
  });

  return {
    storyBibleService,
    aiService,
    writingService,
    searchService,
    exportService,
    setupAssist,
    intakeService,
    db,
  };
}

/**
 * Start the server (for standalone execution)
 */
export async function startServer(options: ServerOptions = {}): Promise<FastifyInstance> {
  const port = options.port ?? DEFAULT_PORT;
  const server = await createServer(options);

  await server.listen({ port, host: '0.0.0.0' });

  return server;
}

// Re-export types for consumers
export type { FastifyInstance };
export type { RouteDeps } from './routes/index.js';

// CLI entry point - only runs when executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const port = parseInt(process.env.PORT ?? String(DEFAULT_PORT), 10);
  const dbPath = process.env.DB_PATH;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // Create all services with shared infrastructure
  const {
    storyBibleService,
    aiService,
    writingService,
    searchService,
    exportService,
    setupAssist,
    intakeService,
    db,
  } = createServices({ dbPath, geminiApiKey });

  console.log('Starting Inxtone server...');
  console.log(`Database: ${dbPath ?? path.join(os.homedir(), '.inxtone', 'data.db')}`);
  if (geminiApiKey) {
    console.log('AI Service: Gemini API key configured (server-side)');
  } else {
    console.log('AI Service: No server key — clients provide key via BYOK');
  }

  startServer({
    port,
    storyBibleService,
    aiService,
    writingService,
    searchService,
    exportService,
    setupAssist,
    intakeService,
    db,
  })
    .then(() => {
      console.log(`Server running at http://localhost:${port}`);
      console.log(`API available at http://localhost:${port}/api`);

      // Handle shutdown
      const shutdown = () => {
        console.log('\nShutting down...');
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
