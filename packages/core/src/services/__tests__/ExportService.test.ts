import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../db/Database.js';
import { WritingRepository } from '../../db/repositories/WritingRepository.js';
import { CharacterRepository } from '../../db/repositories/CharacterRepository.js';
import { RelationshipRepository } from '../../db/repositories/RelationshipRepository.js';
import { WorldRepository } from '../../db/repositories/WorldRepository.js';
import { LocationRepository } from '../../db/repositories/LocationRepository.js';
import { FactionRepository } from '../../db/repositories/FactionRepository.js';
import { ArcRepository } from '../../db/repositories/ArcRepository.js';
import { ForeshadowingRepository } from '../../db/repositories/ForeshadowingRepository.js';
import { HookRepository } from '../../db/repositories/HookRepository.js';
import { ExportService } from '../ExportService.js';
import { ValidationError } from '../../errors/index.js';

describe('ExportService', () => {
  let db: Database;
  let service: ExportService;
  let writingRepo: WritingRepository;
  let characterRepo: CharacterRepository;

  beforeEach(() => {
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();

    writingRepo = new WritingRepository(db);
    characterRepo = new CharacterRepository(db);

    service = new ExportService({
      writingRepo,
      characterRepo,
      relationshipRepo: new RelationshipRepository(db),
      worldRepo: new WorldRepository(db),
      locationRepo: new LocationRepository(db),
      factionRepo: new FactionRepository(db),
      arcRepo: new ArcRepository(db),
      foreshadowingRepo: new ForeshadowingRepository(db),
      hookRepo: new HookRepository(db),
    });
  });

  afterEach(() => {
    db.close();
  });

  // Helper: seed a volume and chapters
  function seedData() {
    const vol = writingRepo.createVolume({ name: 'Volume One', status: 'in_progress' });
    const ch1 = writingRepo.createChapter({ title: 'Chapter 1', status: 'draft' });
    writingRepo.saveContent(ch1.id, 'Content of chapter one.');
    const ch1Updated = writingRepo.findChapterById(ch1.id)!;
    // Assign to volume
    writingRepo.updateChapter(ch1.id, { volumeId: vol.id });

    const ch2 = writingRepo.createChapter({ title: 'Chapter 2', status: 'outline' });
    writingRepo.saveContent(ch2.id, 'Content of chapter two.');
    writingRepo.updateChapter(ch2.id, { volumeId: vol.id });

    const ch3 = writingRepo.createChapter({ title: 'Unassigned Chapter', status: 'draft' });
    writingRepo.saveContent(ch3.id, 'Content of unassigned chapter.');

    return { vol, ch1: ch1Updated, ch2, ch3 };
  }

  describe('exportChapters', () => {
    it('should export all chapters as markdown', async () => {
      seedData();
      const result = await service.exportChapters({
        format: 'md',
        range: { type: 'all' },
      });

      expect(result.filename).toBe('export.md');
      expect(result.mimeType).toBe('text/markdown');
      expect(typeof result.data).toBe('string');
      expect(result.data as string).toContain('Chapter 1');
      expect(result.data as string).toContain('Chapter 2');
      expect(result.data as string).toContain('Unassigned Chapter');
      expect(result.data as string).toContain('Content of chapter one.');
    });

    it('should export all chapters as txt', async () => {
      seedData();
      const result = await service.exportChapters({
        format: 'txt',
        range: { type: 'all' },
      });

      expect(result.filename).toBe('export.txt');
      expect(result.mimeType).toBe('text/plain');
      expect(result.data as string).toContain('Chapter 1');
      expect(result.data as string).toContain('========');
    });

    it('should export all chapters as docx', async () => {
      seedData();
      const result = await service.exportChapters({
        format: 'docx',
        range: { type: 'all' },
      });

      expect(result.filename).toBe('export.docx');
      expect(result.mimeType).toContain('officedocument');
      expect(Buffer.isBuffer(result.data)).toBe(true);
      // DOCX files are zip archives, should start with PK
      const buf = result.data as Buffer;
      expect(buf[0]).toBe(0x50); // P
      expect(buf[1]).toBe(0x4b); // K
    });

    it('should filter by volume', async () => {
      const { vol } = seedData();
      const result = await service.exportChapters({
        format: 'md',
        range: { type: 'volume', volumeId: vol.id },
      });

      const data = result.data as string;
      expect(data).toContain('Chapter 1');
      expect(data).toContain('Chapter 2');
      expect(data).not.toContain('Unassigned Chapter');
    });

    it('should filter by chapter IDs', async () => {
      const { ch3 } = seedData();
      const result = await service.exportChapters({
        format: 'md',
        range: { type: 'chapters', chapterIds: [ch3.id] },
      });

      const data = result.data as string;
      expect(data).toContain('Unassigned Chapter');
      expect(data).not.toContain('Chapter 1');
    });

    it('should include outline when requested', async () => {
      seedData();
      // Update chapter with outline
      writingRepo.updateChapter(1, {
        outline: { goal: 'Introduce the hero', scenes: ['Opening', 'Discovery'] },
      });

      const result = await service.exportChapters({
        format: 'md',
        range: { type: 'all' },
        includeOutline: true,
      });

      const data = result.data as string;
      expect(data).toContain('Introduce the hero');
      expect(data).toContain('Opening');
    });

    it('should include metadata when requested', async () => {
      seedData();
      const result = await service.exportChapters({
        format: 'md',
        range: { type: 'all' },
        includeMetadata: true,
      });

      const data = result.data as string;
      expect(data).toContain('Words:');
      expect(data).toContain('Status: draft');
    });

    it('should handle empty chapters (no chapters exist)', async () => {
      const result = await service.exportChapters({
        format: 'md',
        range: { type: 'all' },
      });

      expect(result.data as string).toContain('No chapters to export');
    });

    it('should throw ValidationError for volume range without volumeId', async () => {
      await expect(
        service.exportChapters({
          format: 'md',
          range: { type: 'volume' },
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for chapters range without chapterIds', async () => {
      await expect(
        service.exportChapters({
          format: 'md',
          range: { type: 'chapters' },
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should sort chapters by sortOrder', async () => {
      // Create chapters in reverse order
      const ch3 = writingRepo.createChapter({ title: 'Third', status: 'draft' });
      const ch1 = writingRepo.createChapter({ title: 'First', status: 'draft' });
      const ch2 = writingRepo.createChapter({ title: 'Second', status: 'draft' });

      // Reorder: First, Second, Third
      writingRepo.reorderChapters([ch1.id, ch2.id, ch3.id]);

      const result = await service.exportChapters({
        format: 'md',
        range: { type: 'all' },
      });

      const data = result.data as string;
      const firstIdx = data.indexOf('First');
      const secondIdx = data.indexOf('Second');
      const thirdIdx = data.indexOf('Third');
      expect(firstIdx).toBeLessThan(secondIdx);
      expect(secondIdx).toBeLessThan(thirdIdx);
    });
  });

  describe('exportStoryBible', () => {
    it('should export all Bible sections as markdown', async () => {
      // Seed a character
      characterRepo.create({
        name: 'Lin Mo',
        role: 'main',
      });

      const result = await service.exportStoryBible();

      expect(result.filename).toBe('story-bible.md');
      expect(result.mimeType).toBe('text/markdown');
      const data = result.data as string;
      expect(data).toContain('# Story Bible');
      expect(data).toContain('Lin Mo');
    });

    it('should filter by sections', async () => {
      characterRepo.create({ name: 'Test Character', role: 'supporting' });

      const result = await service.exportStoryBible({
        sections: ['characters'],
      });

      const data = result.data as string;
      expect(data).toContain('## Characters');
      expect(data).toContain('Test Character');
      // Should not have other sections
      expect(data).not.toContain('## Relationships');
      expect(data).not.toContain('## World');
    });

    it('should handle empty Bible', async () => {
      const result = await service.exportStoryBible();

      const data = result.data as string;
      expect(data).toContain('Story Bible');
      expect(data).toContain('No Story Bible data yet');
    });
  });
});
