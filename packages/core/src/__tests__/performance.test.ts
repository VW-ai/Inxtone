/**
 * Performance Tests
 *
 * Tests system performance with large datasets
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { Database } from '../db/Database.js';
import { CharacterRepository, LocationRepository, FactionRepository } from '../db/index.js';
import type { IStoryBibleService } from '../types/services.js';
import { StoryBibleService, EventBus } from '../services/index.js';
import {
  RelationshipRepository,
  WorldRepository,
  TimelineEventRepository,
  ArcRepository,
  ForeshadowingRepository,
  HookRepository,
} from '../db/index.js';
import { generateCharacters, generateRelationships } from '../db/seeds/perf-test.js';

describe('Performance Tests', () => {
  let db: Database;
  let service: IStoryBibleService;
  let dbPath: string;

  beforeAll(async () => {
    // Create temp database for performance testing
    const tempDir = os.tmpdir();
    dbPath = path.join(tempDir, `inxtone-perf-${Date.now()}.db`);

    db = new Database({ path: dbPath, migrate: true });
    db.connect();

    const eventBus = new EventBus();
    service = new StoryBibleService({
      db,
      characterRepo: new CharacterRepository(db),
      relationshipRepo: new RelationshipRepository(db),
      worldRepo: new WorldRepository(db),
      locationRepo: new LocationRepository(db),
      factionRepo: new FactionRepository(db),
      timelineEventRepo: new TimelineEventRepository(db),
      arcRepo: new ArcRepository(db),
      foreshadowingRepo: new ForeshadowingRepository(db),
      hookRepo: new HookRepository(db),
      eventBus,
    });

    // Seed with performance test data
    console.log('Seeding performance test data...');
    const characters = generateCharacters(120);
    const characterIdMap = new Map<string, string>();

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      if (!char) continue;
      const created = await service.createCharacter(char);
      characterIdMap.set(`C${String(i + 1).padStart(3, '0')}`, created.id);
    }

    const relationships = generateRelationships(120);
    for (const rel of relationships) {
      const sourceId = characterIdMap.get(rel.sourceId);
      const targetId = characterIdMap.get(rel.targetId);
      if (!sourceId || !targetId) continue;
      await service.createRelationship({ ...rel, sourceId, targetId });
    }

    console.log('Performance test data seeded');
  }, 30000); // 30s timeout for seeding

  afterAll(() => {
    db.close();
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  describe('Character Loading Performance', () => {
    it('should load 120 characters in under 100ms', async () => {
      const start = Date.now();
      const characters = await service.getAllCharacters();
      const duration = Date.now() - start;

      expect(characters.length).toBe(120);
      expect(duration).toBeLessThan(100);

      console.log(`  ⏱️  Loaded 120 characters in ${duration}ms`);
    });

    it('should load characters with role filter efficiently', async () => {
      const start = Date.now();
      const mainCharacters = await service.getAllCharacters({ role: 'main' });
      const duration = Date.now() - start;

      expect(mainCharacters.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(50);

      console.log(`  ⏱️  Filtered ${mainCharacters.length} main characters in ${duration}ms`);
    });
  });

  describe('FTS5 Search Performance', () => {
    it('should search 120 characters by name in under 50ms', async () => {
      const start = Date.now();
      const results = await service.searchCharacters('林');
      const duration = Date.now() - start;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(50);

      console.log(`  ⏱️  FTS5 search found ${results.length} results in ${duration}ms`);
    });

    it('should handle complex search queries efficiently', async () => {
      const start = Date.now();
      const results = await service.searchCharacters('墨');
      const duration = Date.now() - start;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(50);

      console.log(`  ⏱️  Complex search found ${results.length} results in ${duration}ms`);
    });
  });

  describe('Relationship Query Performance', () => {
    it('should load all relationships efficiently', async () => {
      const start = Date.now();
      const relationships = await service.getAllRelationships();
      const duration = Date.now() - start;

      expect(relationships.length).toBeGreaterThan(200);
      expect(duration).toBeLessThan(100);

      console.log(`  ⏱️  Loaded ${relationships.length} relationships in ${duration}ms`);
    });

    it('should filter relationships by character efficiently', async () => {
      const characters = await service.getAllCharacters();
      const firstChar = characters[0];
      expect(firstChar).toBeDefined();

      const start = Date.now();
      const relationships = await service.getRelationshipsForCharacter(firstChar!.id);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(20);

      console.log(
        `  ⏱️  Filtered ${relationships.length} relationships for 1 character in ${duration}ms`
      );
    });
  });

  describe('Batch Operations Performance', () => {
    it('should create multiple characters in reasonable time', async () => {
      const newChars = generateCharacters(10);

      const start = Date.now();
      const created = [];
      for (const char of newChars) {
        created.push(await service.createCharacter(char));
      }
      const duration = Date.now() - start;

      expect(created.length).toBe(10);
      expect(duration).toBeLessThan(200); // 20ms per character

      console.log(
        `  ⏱️  Created 10 characters in ${duration}ms (${(duration / 10).toFixed(1)}ms/char)`
      );
    });

    it('should update multiple characters efficiently', async () => {
      const characters = await service.getAllCharacters();
      const toUpdate = characters.slice(0, 10);

      const start = Date.now();
      for (const char of toUpdate) {
        await service.updateCharacter(char.id, {
          appearance: 'Updated appearance',
        });
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200); // 20ms per update

      console.log(
        `  ⏱️  Updated 10 characters in ${duration}ms (${(duration / 10).toFixed(1)}ms/char)`
      );
    });

    it('should delete multiple characters efficiently', async () => {
      // Create temporary characters for deletion
      const tempChars = generateCharacters(5);
      const created = [];
      for (const char of tempChars) {
        created.push(await service.createCharacter(char));
      }

      const start = Date.now();
      for (const char of created) {
        await service.deleteCharacter(char.id);
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // 20ms per delete

      console.log(
        `  ⏱️  Deleted 5 characters in ${duration}ms (${(duration / 5).toFixed(1)}ms/char)`
      );
    });
  });

  describe('Database Size and Indexing', () => {
    it('should verify FTS5 index is being used', () => {
      // Query the unified search_index table
      const result = db.queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM search_index WHERE entity_type = 'character'`
      );

      expect(result).toBeDefined();
      expect(result!.count).toBeGreaterThan(120); // Including the 10 we created in batch test

      console.log(`  ✓ search_index has ${result!.count} character entries`);
    });

    it('should verify database file size is reasonable', () => {
      const stats = fs.statSync(dbPath);
      const sizeInMB = stats.size / (1024 * 1024);

      // With 120+ characters, ~250+ relationships, database should be under 5MB
      expect(sizeInMB).toBeLessThan(5);

      console.log(`  ✓ Database size: ${sizeInMB.toFixed(2)}MB`);
    });
  });

  describe('Concurrent Query Performance', () => {
    it('should handle multiple parallel queries efficiently', async () => {
      const start = Date.now();

      // Run multiple queries in parallel
      const [chars, rels, mainChars, searchResults] = await Promise.all([
        service.getAllCharacters(),
        service.getAllRelationships(),
        service.getAllCharacters({ role: 'main' }),
        service.searchCharacters('林'),
      ]);

      const duration = Date.now() - start;

      expect(chars.length).toBeGreaterThan(0);
      expect(rels.length).toBeGreaterThan(0);
      expect(mainChars.length).toBeGreaterThan(0);
      expect(searchResults.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(150); // All 4 queries in under 150ms

      console.log(`  ⏱️  4 parallel queries completed in ${duration}ms`);
    });
  });
});
