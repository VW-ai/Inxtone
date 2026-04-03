/**
 * ExportService - Multi-format chapter and Story Bible export
 *
 * Simplified per ADR-0005: no templates, no pre-export checks, no PDF.
 * Uses formatter strategy pattern — each format has its own ChapterFormatter.
 */

import type {
  ExportOptions,
  ExportResult,
  ExportFormat,
  ExportRange,
  BibleExportOptions,
  IExportService,
  Chapter,
} from '../types/index.js';
import type { WritingRepository } from '../db/repositories/WritingRepository.js';
import type { CharacterRepository } from '../db/repositories/CharacterRepository.js';
import type { RelationshipRepository } from '../db/repositories/RelationshipRepository.js';
import type { WorldRepository } from '../db/repositories/WorldRepository.js';
import type { LocationRepository } from '../db/repositories/LocationRepository.js';
import type { FactionRepository } from '../db/repositories/FactionRepository.js';
import type { ArcRepository } from '../db/repositories/ArcRepository.js';
import type { ForeshadowingRepository } from '../db/repositories/ForeshadowingRepository.js';
import type { HookRepository } from '../db/repositories/HookRepository.js';
import { MarkdownFormatter } from './export/MarkdownFormatter.js';
import { TxtFormatter } from './export/TxtFormatter.js';
import { DocxFormatter } from './export/DocxFormatter.js';
import { BibleFormatter } from './export/BibleFormatter.js';
import type { ChapterFormatter } from './export/types.js';
import { ValidationError } from '../errors/index.js';

export interface ExportServiceDeps {
  writingRepo: WritingRepository;
  characterRepo: CharacterRepository;
  relationshipRepo: RelationshipRepository;
  worldRepo: WorldRepository;
  locationRepo: LocationRepository;
  factionRepo: FactionRepository;
  arcRepo: ArcRepository;
  foreshadowingRepo: ForeshadowingRepository;
  hookRepo: HookRepository;
}

export class ExportService implements IExportService {
  private formatters: Record<ExportFormat, ChapterFormatter> = {
    md: new MarkdownFormatter(),
    txt: new TxtFormatter(),
    docx: new DocxFormatter(),
  };

  constructor(private deps: ExportServiceDeps) {}

  async exportChapters(options: ExportOptions): Promise<ExportResult> {
    // 1. Resolve which chapters to export
    const chapters = this.resolveChapters(options.range);

    // 2. Load content for each chapter
    const chaptersWithContent: Chapter[] = [];
    for (const ch of chapters) {
      const full = this.deps.writingRepo.findChapterWithContent(ch.id);
      if (full) {
        chaptersWithContent.push(full);
      }
    }

    // 3. Load volumes for grouping
    const volumes = this.deps.writingRepo.findAllVolumes();

    // 4. Dispatch to formatter
    const formatter = this.formatters[options.format];
    return formatter.formatChapters(chaptersWithContent, volumes, options);
  }

  exportStoryBible(options?: BibleExportOptions): Promise<ExportResult> {
    const data = {
      characters: this.deps.characterRepo.findAll(),
      relationships: this.deps.relationshipRepo.findAll(),
      world: this.deps.worldRepo.get(),
      locations: this.deps.locationRepo.findAll(),
      factions: this.deps.factionRepo.findAll(),
      arcs: this.deps.arcRepo.findAll(),
      foreshadowing: this.deps.foreshadowingRepo.findAll(),
      hooks: this.deps.hookRepo.findAll(),
    };

    const formatter = new BibleFormatter();
    return Promise.resolve(formatter.format(data, options));
  }

  /**
   * Resolve which chapters to export based on range specification.
   * Returns chapters sorted by sortOrder.
   */
  private resolveChapters(range: ExportRange): Chapter[] {
    let chapters: Chapter[];

    switch (range.type) {
      case 'all':
        chapters = this.deps.writingRepo.findAllChapters();
        break;

      case 'volume':
        if (range.volumeId == null) {
          throw new ValidationError('volumeId is required for volume range');
        }
        chapters = this.deps.writingRepo.findChaptersByVolume(range.volumeId);
        break;

      case 'chapters':
        if (!range.chapterIds || range.chapterIds.length === 0) {
          throw new ValidationError('chapterIds is required for chapters range');
        }
        chapters = range.chapterIds
          .map((id) => this.deps.writingRepo.findChapterById(id))
          .filter((ch): ch is Chapter => ch != null);
        break;

      default:
        throw new ValidationError(`Unknown range type: ${String(range.type)}`);
    }

    // Sort by sortOrder
    return chapters.sort((a, b) => a.sortOrder - b.sortOrder);
  }
}
