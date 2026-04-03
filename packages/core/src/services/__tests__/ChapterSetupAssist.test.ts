/**
 * ChapterSetupAssist Unit Tests
 *
 * Tests the heuristic entity suggestion engine against a real in-memory SQLite DB.
 * Three sources: previous chapter carry-over, arc roster, outline mention.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../db/Database.js';
import { WritingRepository } from '../../db/repositories/WritingRepository.js';
import { CharacterRepository } from '../../db/repositories/CharacterRepository.js';
import { LocationRepository } from '../../db/repositories/LocationRepository.js';
import { ForeshadowingRepository } from '../../db/repositories/ForeshadowingRepository.js';
import { ArcRepository } from '../../db/repositories/ArcRepository.js';
import { ChapterSetupAssist } from '../ChapterSetupAssist.js';

describe('ChapterSetupAssist', () => {
  let db: Database;
  let writingRepo: WritingRepository;
  let characterRepo: CharacterRepository;
  let locationRepo: LocationRepository;
  let foreshadowingRepo: ForeshadowingRepository;
  let arcRepo: ArcRepository;
  let assist: ChapterSetupAssist;

  beforeEach(() => {
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();
    writingRepo = new WritingRepository(db);
    characterRepo = new CharacterRepository(db);
    locationRepo = new LocationRepository(db);
    foreshadowingRepo = new ForeshadowingRepository(db);
    arcRepo = new ArcRepository(db);
    assist = new ChapterSetupAssist({
      writingRepo,
      characterRepo,
      locationRepo,
      foreshadowingRepo,
    });
  });

  afterEach(() => {
    db.close();
  });

  it('should return empty for non-existent chapter', () => {
    expect(assist.suggest(999)).toEqual([]);
  });

  it('should return empty when no suggestions available', () => {
    const ch = writingRepo.createChapter({ sortOrder: 1 });
    expect(assist.suggest(ch.id)).toEqual([]);
  });

  describe('previous chapter carry-over', () => {
    it('should suggest characters from the previous chapter', () => {
      const c1 = characterRepo.create({ name: 'Alice', role: 'main' });
      const c2 = characterRepo.create({ name: 'Bob', role: 'supporting' });

      const ch1 = writingRepo.createChapter({ sortOrder: 1 });
      writingRepo.updateChapter(ch1.id, { characters: [c1.id, c2.id] });

      const ch2 = writingRepo.createChapter({ sortOrder: 2 });

      const suggestions = assist.suggest(ch2.id);
      expect(suggestions).toHaveLength(2);
      expect(suggestions.map((s) => s.name)).toContain('Alice');
      expect(suggestions.map((s) => s.name)).toContain('Bob');
      expect(suggestions[0].source).toBe('previous_chapter');
      expect(suggestions[0].confidence).toBe(0.7);
    });

    it('should suggest locations from the previous chapter', () => {
      const loc = locationRepo.create({ name: 'Mountain Peak' });

      const ch1 = writingRepo.createChapter({ sortOrder: 1 });
      writingRepo.updateChapter(ch1.id, { locations: [loc.id] });

      const ch2 = writingRepo.createChapter({ sortOrder: 2 });

      const suggestions = assist.suggest(ch2.id);
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].entityType).toBe('location');
      expect(suggestions[0].name).toBe('Mountain Peak');
    });

    it('should not suggest already-assigned entities', () => {
      const c1 = characterRepo.create({ name: 'Alice', role: 'main' });

      const ch1 = writingRepo.createChapter({ sortOrder: 1 });
      writingRepo.updateChapter(ch1.id, { characters: [c1.id] });

      const ch2 = writingRepo.createChapter({ sortOrder: 2 });
      writingRepo.updateChapter(ch2.id, { characters: [c1.id] });

      const suggestions = assist.suggest(ch2.id);
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('arc roster', () => {
    it('should suggest characters from other chapters in the same arc', () => {
      const arc = arcRepo.create({ name: 'Main Arc', type: 'main' });
      const c1 = characterRepo.create({ name: 'Alice', role: 'main' });
      const c2 = characterRepo.create({ name: 'Bob', role: 'supporting' });

      const ch1 = writingRepo.createChapter({ sortOrder: 1, arcId: arc.id });
      writingRepo.updateChapter(ch1.id, { characters: [c1.id] });

      const ch2 = writingRepo.createChapter({ sortOrder: 2, arcId: arc.id });
      writingRepo.updateChapter(ch2.id, { characters: [c2.id] });

      const ch3 = writingRepo.createChapter({ sortOrder: 3, arcId: arc.id });

      const suggestions = assist.suggest(ch3.id);
      const charSuggestions = suggestions.filter((s) => s.entityType === 'character');
      expect(charSuggestions.map((s) => s.name)).toContain('Alice');
      expect(charSuggestions.map((s) => s.name)).toContain('Bob');
    });

    it('should rank arc roster lower than previous chapter', () => {
      const arc = arcRepo.create({ name: 'Main Arc', type: 'main' });
      const c1 = characterRepo.create({ name: 'Alice', role: 'main' });
      const c2 = characterRepo.create({ name: 'Bob', role: 'supporting' });

      // c1 is only in arc (via ch1), c2 is in previous chapter (ch2)
      const ch1 = writingRepo.createChapter({ sortOrder: 1, arcId: arc.id });
      writingRepo.updateChapter(ch1.id, { characters: [c1.id] });

      const ch2 = writingRepo.createChapter({ sortOrder: 2, arcId: arc.id });
      writingRepo.updateChapter(ch2.id, { characters: [c2.id] });

      const ch3 = writingRepo.createChapter({ sortOrder: 3, arcId: arc.id });

      const suggestions = assist.suggest(ch3.id);
      // Bob (previous_chapter, 0.7) should be before Alice (arc_roster, 0.5)
      const bobIdx = suggestions.findIndex((s) => s.name === 'Bob');
      const aliceIdx = suggestions.findIndex((s) => s.name === 'Alice');
      expect(bobIdx).toBeLessThan(aliceIdx);
    });
  });

  describe('outline mention', () => {
    it('should suggest characters mentioned in outline text', () => {
      const c1 = characterRepo.create({ name: 'Alice', role: 'main' });
      characterRepo.create({ name: 'Charlie', role: 'supporting' });

      const ch = writingRepo.createChapter({
        sortOrder: 1,
        outline: { goal: 'Alice discovers the truth', scenes: [], hookEnding: '' },
      });

      const suggestions = assist.suggest(ch.id);
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].name).toBe('Alice');
      expect(suggestions[0].source).toBe('outline_mention');
      expect(suggestions[0].confidence).toBe(0.9);
    });

    it('should suggest locations mentioned in outline text', () => {
      locationRepo.create({ name: 'Crystal Cave' });
      locationRepo.create({ name: 'Dark Forest' });

      const ch = writingRepo.createChapter({
        sortOrder: 1,
        outline: { goal: 'Enter the Crystal Cave', scenes: [] },
      });

      const suggestions = assist.suggest(ch.id);
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].name).toBe('Crystal Cave');
      expect(suggestions[0].entityType).toBe('location');
    });

    it('should rank outline mentions highest', () => {
      const c1 = characterRepo.create({ name: 'Alice', role: 'main' });
      const c2 = characterRepo.create({ name: 'Bob', role: 'supporting' });

      // c2 from previous chapter, c1 from outline
      const ch1 = writingRepo.createChapter({ sortOrder: 1 });
      writingRepo.updateChapter(ch1.id, { characters: [c2.id] });

      const ch2 = writingRepo.createChapter({
        sortOrder: 2,
        outline: { goal: 'Alice fights the boss', scenes: [] },
      });

      const suggestions = assist.suggest(ch2.id);
      // Alice (outline, 0.9) before Bob (previous_chapter, 0.7)
      const aliceIdx = suggestions.findIndex((s) => s.name === 'Alice');
      const bobIdx = suggestions.findIndex((s) => s.name === 'Bob');
      expect(aliceIdx).toBeLessThan(bobIdx);
    });

    it('should handle string outline format', () => {
      characterRepo.create({ name: 'Alice', role: 'main' });

      const ch = writingRepo.createChapter({
        sortOrder: 1,
        outline: 'Alice goes to the market' as unknown as { goal: string; scenes?: string[] },
      });

      const suggestions = assist.suggest(ch.id);
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].name).toBe('Alice');
    });
  });

  describe('deduplication', () => {
    it('should not duplicate entities across sources', () => {
      const c1 = characterRepo.create({ name: 'Alice', role: 'main' });

      const ch1 = writingRepo.createChapter({ sortOrder: 1 });
      writingRepo.updateChapter(ch1.id, { characters: [c1.id] });

      // Alice is both in previous chapter AND mentioned in outline
      const ch2 = writingRepo.createChapter({
        sortOrder: 2,
        outline: { goal: 'Alice continues her journey', scenes: [] },
      });

      const suggestions = assist.suggest(ch2.id);
      const aliceSuggestions = suggestions.filter((s) => s.name === 'Alice');
      // Should only appear once, with highest confidence (outline: 0.9)
      expect(aliceSuggestions).toHaveLength(1);
      expect(aliceSuggestions[0].source).toBe('outline_mention');
      expect(aliceSuggestions[0].confidence).toBe(0.9);
    });
  });

  describe('foreshadowing suggestions', () => {
    it('should suggest active foreshadowing from previous chapter', () => {
      const f = foreshadowingRepo.create({
        content: 'The ancient seal weakens',
        status: 'active',
      });

      const ch1 = writingRepo.createChapter({ sortOrder: 1 });
      writingRepo.updateChapter(ch1.id, { foreshadowingHinted: [f.id] });

      const ch2 = writingRepo.createChapter({ sortOrder: 2 });

      const suggestions = assist.suggest(ch2.id);
      const foreSuggestions = suggestions.filter((s) => s.entityType === 'foreshadowing');
      expect(foreSuggestions).toHaveLength(1);
      expect(foreSuggestions[0].name).toBe('The ancient seal weakens');
    });

    it('should not suggest resolved foreshadowing', () => {
      const f = foreshadowingRepo.create({
        content: 'The ancient seal weakens',
      });

      const ch1 = writingRepo.createChapter({ sortOrder: 1 });
      writingRepo.updateChapter(ch1.id, { foreshadowingHinted: [f.id] });

      // Resolve the foreshadowing (create always sets status to 'active')
      foreshadowingRepo.resolve(f.id, ch1.id);

      const ch2 = writingRepo.createChapter({ sortOrder: 2 });

      const suggestions = assist.suggest(ch2.id);
      const foreSuggestions = suggestions.filter((s) => s.entityType === 'foreshadowing');
      expect(foreSuggestions).toHaveLength(0);
    });
  });
});
