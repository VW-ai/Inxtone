/**
 * SearchService Unit Tests
 *
 * Tests the FTS5 full-text search service against a real in-memory SQLite DB.
 * Covers search(), rebuildIndexes(), and updateIndex() methods.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../db/Database.js';
import { CharacterRepository } from '../../db/repositories/CharacterRepository.js';
import { LocationRepository } from '../../db/repositories/LocationRepository.js';
import { FactionRepository } from '../../db/repositories/FactionRepository.js';
import { ArcRepository } from '../../db/repositories/ArcRepository.js';
import { ForeshadowingRepository } from '../../db/repositories/ForeshadowingRepository.js';
import { WritingRepository } from '../../db/repositories/WritingRepository.js';
import { SearchService } from '../SearchService.js';

describe('SearchService', async () => {
  let db: Database;
  let searchService: SearchService;
  let characterRepo: CharacterRepository;
  let locationRepo: LocationRepository;
  let factionRepo: FactionRepository;
  let arcRepo: ArcRepository;
  let foreshadowingRepo: ForeshadowingRepository;
  let writingRepo: WritingRepository;

  beforeEach(() => {
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();
    searchService = new SearchService(db);
    characterRepo = new CharacterRepository(db);
    locationRepo = new LocationRepository(db);
    factionRepo = new FactionRepository(db);
    arcRepo = new ArcRepository(db);
    foreshadowingRepo = new ForeshadowingRepository(db);
    writingRepo = new WritingRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('search()', () => {
    beforeEach(() => {
      // Create test data
      characterRepo.create({ name: '林墨渊', role: 'main', appearance: '白衣如雪，气质出尘' });
      characterRepo.create({ name: '苏澜', role: 'supporting', appearance: '紫衣少女，清丽动人' });
      characterRepo.create({ name: '云阙', role: 'antagonist', appearance: '黑袍老者，阴冷邪魅' });

      locationRepo.create({ name: '青墨峰', type: 'mountain', atmosphere: '云雾缭绕，钟灵毓秀' });
      locationRepo.create({ name: '墨渊城', type: 'city', significance: '修仙者的圣地' });

      factionRepo.create({ name: '青云宗', type: 'sect', stanceToMC: 'friendly' });

      arcRepo.create({ name: '入门篇', type: 'main' });

      foreshadowingRepo.create({
        content: '林墨渊的真实身份',
        status: 'active',
        plantedText: '他的双眼深处，藏着不为人知的秘密',
      });

      const ch = writingRepo.createChapter({ sortOrder: 1, title: '第一章：初入仙门' });
      writingRepo.updateChapter(ch.id, {
        content: '林墨渊踏入青云宗的那一天，天空格外晴朗',
      });

      // Ensure FTS5 index is populated (triggers should handle this, but rebuild just in case)
      searchService.rebuildIndexes();
    });

    it('should return empty results for no matches', async () => {
      const results = await searchService.search('不存在的内容xyz123', { limit: 10 });
      expect(results).toEqual([]);
    });

    it('should search across all entity types', async () => {
      const results = await searchService.search('墨', { limit: 10 });
      expect(results.length).toBeGreaterThan(0);
      // Should find 林墨渊 (character), 青墨峰 (location), 墨渊城 (location)
      const types = new Set(results.map((r) => r.entityType));
      expect(types.has('character')).toBe(true);
      expect(types.has('location')).toBe(true);
    });

    it('should filter by entity type', async () => {
      const results = await searchService.search('墨', { entityTypes: ['character'], limit: 10 });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.entityType === 'character')).toBe(true);
    });

    it('should filter by multiple entity types', async () => {
      const results = await searchService.search('墨', {
        entityTypes: ['character', 'location'],
        limit: 10,
      });
      expect(results.length).toBeGreaterThan(0);
      const types = new Set(results.map((r) => r.entityType));
      expect(types.has('character') || types.has('location')).toBe(true);
      expect(types.has('faction')).toBe(false);
    });

    it('should return highlights with <mark> tags', async () => {
      const results = await searchService.search('林墨渊', { limit: 10 });
      expect(results.length).toBeGreaterThan(0);
      const charResult = results.find((r) => r.entityType === 'character');
      expect(charResult).toBeDefined();
      expect(charResult!.highlight).toContain('<mark>');
      expect(charResult!.highlight).toContain('</mark>');
    });

    it('should limit results', async () => {
      const results = await searchService.search('墨', { limit: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should handle CJK text search', async () => {
      const results = await searchService.search('青云宗', { limit: 10 });
      expect(results.length).toBeGreaterThan(0);
      const factionResult = results.find((r) => r.entityType === 'faction');
      expect(factionResult).toBeDefined();
      expect(factionResult!.title).toBe('青云宗');
    });

    it('should handle prefix matching for single words', async () => {
      const results = await searchService.search('青', { limit: 10 });
      expect(results.length).toBeGreaterThan(0);
      // Should find 青墨峰, 青云宗, etc.
    });

    it('should sanitize special FTS5 characters', async () => {
      // Quotes and asterisks should be escaped
      const results = await searchService.search('"林*墨', { limit: 10 });
      // Should not throw an error
      expect(Array.isArray(results)).toBe(true);
    });

    it('should search chapter content', async () => {
      const results = await searchService.search('初入仙门', { limit: 10 });
      expect(results.length).toBeGreaterThan(0);
      const chapterResult = results.find((r) => r.entityType === 'chapter');
      expect(chapterResult).toBeDefined();
      expect(chapterResult!.title).toContain('初入仙门');
    });

    it('should search foreshadowing content', async () => {
      const results = await searchService.search('真实身份', { limit: 10 });
      expect(results.length).toBeGreaterThan(0);
      const foreshadowingResult = results.find((r) => r.entityType === 'foreshadowing');
      expect(foreshadowingResult).toBeDefined();
    });
  });

  describe('rebuildIndexes()', async () => {
    it('should rebuild index from scratch', async () => {
      // Create data
      characterRepo.create({ name: 'Test Character', role: 'mentioned' });
      locationRepo.create({ name: 'Test Location' });

      // Manually corrupt the index
      db.run('DELETE FROM search_index');
      expect(await searchService.search('Test', { limit: 10 })).toEqual([]);

      // Rebuild
      searchService.rebuildIndexes();

      // Should find results now
      const results = await searchService.search('Test', { limit: 10 });
      expect(results.length).toBe(2);
    });

    it('should handle empty tables', async () => {
      searchService.rebuildIndexes();
      const results = await searchService.search('anything', { limit: 10 });
      expect(results).toEqual([]);
    });
  });

  describe('updateIndex()', async () => {
    it('should update character in index', async () => {
      const char = characterRepo.create({ name: 'Original Name', role: 'mentioned' });
      let results = await searchService.search('Original', { limit: 10 });
      expect(results.length).toBe(1);

      // Update character
      characterRepo.update(char.id, { name: 'New Name' });

      // Manually trigger index update (normally triggers handle this)
      searchService.updateIndex('character', char.id);

      // Should find with new name
      results = await searchService.search('New Name', { limit: 10 });
      expect(results.length).toBeGreaterThan(0);

      // Should NOT find with old name
      results = await searchService.search('Original', { limit: 10 });
      expect(results.length).toBe(0);
    });

    it('should update location in index', async () => {
      const loc = locationRepo.create({ name: 'Old Location' });
      let results = await searchService.search('Old Location', { limit: 10 });
      expect(results.length).toBe(1);

      // Update location
      locationRepo.update(loc.id, { name: 'New Location' });
      searchService.updateIndex('location', loc.id);

      // Should find with new name
      results = await searchService.search('New Location', { limit: 10 });
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle unknown entity types', async () => {
      // Should not throw
      expect(() => searchService.updateIndex('unknown', 'id123')).not.toThrow();
    });
  });

  describe('removeFromIndex()', async () => {
    it('should remove entity from index', async () => {
      const char = characterRepo.create({ name: 'To Be Removed', role: 'mentioned' });
      let results = await searchService.search('To Be Removed', { limit: 10 });
      expect(results.length).toBe(1);

      // Remove from index
      searchService.removeFromIndex('character', char.id);

      // Should not find anymore
      results = await searchService.search('To Be Removed', { limit: 10 });
      expect(results.length).toBe(0);
    });
  });
});
