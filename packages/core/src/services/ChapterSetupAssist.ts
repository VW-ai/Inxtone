/**
 * ChapterSetupAssist — heuristic entity suggestion engine
 *
 * Suggests characters, locations, and foreshadowing for a chapter based on:
 * 1. Previous chapter carry-over (entities from chapter[N-1])
 * 2. Arc roster (characters from chapters in the same arc)
 * 3. Outline mention (regex match known entity names against chapter outline)
 *
 * Deduplicates, ranks by source (outline > carry-over > arc), and filters
 * already-assigned entities.
 */

import type { Chapter, ChapterId } from '../types/entities.js';
import type { WritingRepository } from '../db/repositories/WritingRepository.js';
import type { CharacterRepository } from '../db/repositories/CharacterRepository.js';
import type { LocationRepository } from '../db/repositories/LocationRepository.js';
import type { ForeshadowingRepository } from '../db/repositories/ForeshadowingRepository.js';

export interface SetupSuggestion {
  entityType: 'character' | 'location' | 'foreshadowing';
  entityId: string;
  name: string;
  source: 'previous_chapter' | 'arc_roster' | 'outline_mention';
  confidence: number; // 0-1
}

export interface ChapterSetupAssistDeps {
  writingRepo: WritingRepository;
  characterRepo: CharacterRepository;
  locationRepo: LocationRepository;
  foreshadowingRepo: ForeshadowingRepository;
}

export class ChapterSetupAssist {
  constructor(private deps: ChapterSetupAssistDeps) {}

  /**
   * Generate setup suggestions for a chapter.
   * Returns deduplicated suggestions ranked by source confidence.
   */
  suggest(chapterId: ChapterId): SetupSuggestion[] {
    const chapter = this.deps.writingRepo.findChapterById(chapterId);
    if (!chapter) return [];

    const existing = {
      characters: new Set(chapter.characters ?? []),
      locations: new Set(chapter.locations ?? []),
      foreshadowing: new Set(chapter.foreshadowingHinted ?? []),
    };

    const suggestions = new Map<string, SetupSuggestion>();

    // Source 1: Previous chapter carry-over (confidence: 0.7)
    const prevChapter = this.getPreviousChapter(chapter);
    if (prevChapter) {
      this.addCharacterSuggestions(
        prevChapter.characters,
        existing.characters,
        'previous_chapter',
        0.7,
        suggestions
      );
      this.addLocationSuggestions(
        prevChapter.locations,
        existing.locations,
        'previous_chapter',
        0.7,
        suggestions
      );
      this.addForeshadowingSuggestions(
        prevChapter.foreshadowingHinted,
        existing.foreshadowing,
        'previous_chapter',
        0.7,
        suggestions
      );
    }

    // Source 2: Arc roster (confidence: 0.5)
    if (chapter.arcId) {
      const arcChapters = this.deps.writingRepo.findChaptersByArc(chapter.arcId);
      const arcCharIds = new Set<string>();
      for (const ac of arcChapters) {
        if (ac.id === chapter.id) continue;
        for (const cid of ac.characters ?? []) arcCharIds.add(cid);
      }
      this.addCharacterSuggestions(
        [...arcCharIds],
        existing.characters,
        'arc_roster',
        0.5,
        suggestions
      );
    }

    // Source 3: Outline mention (confidence: 0.9)
    if (chapter.outline) {
      const outlineText =
        typeof chapter.outline === 'string'
          ? chapter.outline
          : [chapter.outline.goal, ...(chapter.outline.scenes ?? []), chapter.outline.hookEnding]
              .filter(Boolean)
              .join(' ');

      if (outlineText) {
        this.matchOutlineCharacters(outlineText, existing.characters, suggestions);
        this.matchOutlineLocations(outlineText, existing.locations, suggestions);
      }
    }

    // Sort: outline_mention (0.9) > previous_chapter (0.7) > arc_roster (0.5)
    return [...suggestions.values()].sort((a, b) => b.confidence - a.confidence);
  }

  // ───────────────────────────────────────────
  // Helpers
  // ───────────────────────────────────────────

  private getPreviousChapter(chapter: Chapter): Chapter | null {
    let chapters: Chapter[];
    if (chapter.volumeId) {
      chapters = this.deps.writingRepo.findChaptersByVolume(chapter.volumeId);
    } else {
      chapters = this.deps.writingRepo.findAllChapters();
    }
    const idx = chapters.findIndex((c) => c.id === chapter.id);
    if (idx <= 0) return null;
    return chapters[idx - 1] ?? null;
  }

  private addCharacterSuggestions(
    ids: string[] | undefined,
    existing: Set<string>,
    source: SetupSuggestion['source'],
    confidence: number,
    map: Map<string, SetupSuggestion>
  ): void {
    if (!ids) return;
    const characters = this.deps.characterRepo.findByIds(ids);
    for (const c of characters) {
      const key = `character-${c.id}`;
      if (existing.has(c.id) || map.has(key)) continue;
      map.set(key, { entityType: 'character', entityId: c.id, name: c.name, source, confidence });
    }
  }

  private addLocationSuggestions(
    ids: string[] | undefined,
    existing: Set<string>,
    source: SetupSuggestion['source'],
    confidence: number,
    map: Map<string, SetupSuggestion>
  ): void {
    if (!ids) return;
    const locations = this.deps.locationRepo.findByIds(ids);
    for (const l of locations) {
      const key = `location-${l.id}`;
      if (existing.has(l.id) || map.has(key)) continue;
      map.set(key, { entityType: 'location', entityId: l.id, name: l.name, source, confidence });
    }
  }

  private addForeshadowingSuggestions(
    ids: string[] | undefined,
    existing: Set<string>,
    source: SetupSuggestion['source'],
    confidence: number,
    map: Map<string, SetupSuggestion>
  ): void {
    if (!ids) return;
    const items = this.deps.foreshadowingRepo.findByIds(ids);
    for (const f of items) {
      const key = `foreshadowing-${f.id}`;
      if (existing.has(f.id) || map.has(key)) continue;
      if (f.status !== 'active') continue; // Only suggest active foreshadowing
      const name = f.content.length > 50 ? f.content.slice(0, 50) + '...' : f.content;
      map.set(key, { entityType: 'foreshadowing', entityId: f.id, name, source, confidence });
    }
  }

  private matchOutlineCharacters(
    outlineText: string,
    existing: Set<string>,
    map: Map<string, SetupSuggestion>
  ): void {
    const allCharacters = this.deps.characterRepo.findAll();
    for (const c of allCharacters) {
      const key = `character-${c.id}`;
      if (existing.has(c.id)) continue;
      if (outlineText.includes(c.name)) {
        // Outline match overrides lower-confidence suggestions
        map.set(key, {
          entityType: 'character',
          entityId: c.id,
          name: c.name,
          source: 'outline_mention',
          confidence: 0.9,
        });
      }
    }
  }

  private matchOutlineLocations(
    outlineText: string,
    existing: Set<string>,
    map: Map<string, SetupSuggestion>
  ): void {
    const allLocations = this.deps.locationRepo.findAll();
    for (const l of allLocations) {
      const key = `location-${l.id}`;
      if (existing.has(l.id)) continue;
      if (outlineText.includes(l.name)) {
        map.set(key, {
          entityType: 'location',
          entityId: l.id,
          name: l.name,
          source: 'outline_mention',
          confidence: 0.9,
        });
      }
    }
  }
}
