/**
 * ChapterContextBuilder - 5-layer FK-based context assembly
 *
 * The "core brain" of the AI system for chapter-scoped context.
 * Assembles context from chapter FK references following a deterministic,
 * author-intent-driven approach.
 *
 * Layer priorities (higher = included first):
 *   L1 (1000) - Required: chapter content + outline + prev chapter tail
 *   L2 (800)  - FK Expansion: characters, locations, arc, scoped relationships
 *   L3 (600)  - Plot Awareness: foreshadowing, active foreshadowing in arc, prev hook
 *   L4 (400)  - World Rules: power system core rules, social rules
 *   L5 (200)  - User-Selected: additional items passed by caller
 *
 * Token budget: 1M total - 4K output reserve - 2K prompt reserve = ~994K available
 * When budget is exceeded, lower priority items are dropped first.
 *
 * @see spec/Modules/03_ai_service.md §二 ContextBuilder 构建流程
 * @see spec/Decisions/ADR-0002-ai-context-injection-strategy.md
 */

import type { Chapter, ChapterId } from '../types/entities.js';
import type { ContextItem, BuiltContext } from '../types/services.js';
import { EntityNotFoundError } from '../errors/index.js';
import {
  BaseContextBuilder,
  L1_PRIORITY,
  L2_PRIORITY,
  L3_PRIORITY,
  L4_PRIORITY,
  L5_PRIORITY,
  TOTAL_BUDGET,
  OUTPUT_RESERVE,
  PROMPT_RESERVE,
} from './BaseContextBuilder.js';

const PREV_CHAPTER_TAIL_LENGTH = 500;

export class ChapterContextBuilder extends BaseContextBuilder {
  /**
   * Build context for a chapter following the 5-layer assembly.
   *
   * @param chapterId - The chapter to build context for
   * @param additionalItems - User-selected additional context (L5)
   * @returns Assembled context with token count and truncation flag
   * @throws EntityNotFoundError if chapter not found
   */
  build(chapterId: ChapterId, additionalItems?: ContextItem[]): BuiltContext {
    const chapter = this.deps.writingRepo.findChapterWithContent(chapterId);
    if (!chapter) {
      throw new EntityNotFoundError('Chapter', String(chapterId));
    }

    // Cache previous chapter to avoid duplicate DB queries (#26)
    const prevChapter = this.getPreviousChapter(chapter);

    // Collect items from all layers
    const items: ContextItem[] = [
      ...this.buildL1Required(chapter, prevChapter),
      ...this.buildL2FKExpansion(chapter),
      ...this.buildL3PlotAwareness(chapter, prevChapter),
      ...this.buildL4WorldRules(),
      ...this.buildL5UserSelected(additionalItems),
    ];

    // Apply token budget
    const budget = TOTAL_BUDGET - OUTPUT_RESERVE - PROMPT_RESERVE;
    return this.truncateToFitBudget(items, budget);
  }

  // ===================================
  // Layer Builders
  // ===================================

  /**
   * L1 - Required: chapter content + outline + previous chapter tail
   */
  private buildL1Required(chapter: Chapter, prevChapter: Chapter | null): ContextItem[] {
    const items: ContextItem[] = [];

    // Current chapter content
    if (chapter.content) {
      items.push({
        type: 'chapter_content',
        id: String(chapter.id),
        content: chapter.content,
        priority: L1_PRIORITY,
      });
    }

    // Current chapter outline
    if (chapter.outline) {
      const outlineParts: string[] = [];
      if (chapter.outline.goal) outlineParts.push(`Goal: ${chapter.outline.goal}`);
      if (chapter.outline.scenes?.length) {
        outlineParts.push(
          `Scenes:\n${chapter.outline.scenes.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}`
        );
      }
      if (chapter.outline.hookEnding)
        outlineParts.push(`Hook ending: ${chapter.outline.hookEnding}`);

      if (outlineParts.length > 0) {
        items.push({
          type: 'chapter_outline',
          id: String(chapter.id),
          content: outlineParts.join('\n'),
          priority: L1_PRIORITY,
        });
      }
    }

    // Previous chapter tail (last 500 chars)
    if (prevChapter?.content) {
      const tail = prevChapter.content.slice(-PREV_CHAPTER_TAIL_LENGTH);
      items.push({
        type: 'chapter_prev_tail',
        id: `prev-${prevChapter.id}`,
        content: `[Previous chapter ending]\n${tail}`,
        priority: L1_PRIORITY,
      });
    }

    return items;
  }

  /**
   * L2 - FK Expansion: characters, locations, arc, scoped relationships
   */
  private buildL2FKExpansion(chapter: Chapter): ContextItem[] {
    const items: ContextItem[] = [];

    // Characters — batch query instead of N individual queries
    if (chapter.characters?.length) {
      const characters = this.deps.characterRepo.findByIds(chapter.characters);
      const charMap = new Map(characters.map((c) => [c.id, c]));

      for (const character of characters) {
        items.push({
          type: 'character',
          id: character.id,
          content: this.formatCharacter(character),
          priority: L2_PRIORITY,
        });
      }

      // Scoped relationships (only between chapter characters)
      const relationships = this.getScopedRelationships(chapter.characters);
      for (const rel of relationships) {
        const source = charMap.get(rel.sourceId);
        const target = charMap.get(rel.targetId);
        if (source && target) {
          const relParts = [`${source.name} → ${target.name}: ${rel.type}`];
          if (rel.joinReason) relParts.push(`  Bond reason: ${rel.joinReason}`);
          if (rel.independentGoal) relParts.push(`  Independent goal: ${rel.independentGoal}`);

          items.push({
            type: 'relationship',
            id: `rel-${rel.id}`,
            content: `[Relationship] ${relParts.join('\n')}`,
            priority: L2_PRIORITY,
          });
        }
      }
    }

    // Locations — batch query instead of N individual queries
    if (chapter.locations?.length) {
      const locations = this.deps.locationRepo.findByIds(chapter.locations);
      for (const location of locations) {
        const locParts = [`### ${location.name}`];
        if (location.type) locParts.push(`Type: ${location.type}`);
        if (location.atmosphere) locParts.push(`Atmosphere: ${location.atmosphere}`);
        if (location.significance) locParts.push(`Significance: ${location.significance}`);

        items.push({
          type: 'location',
          id: location.id,
          content: locParts.join('\n'),
          priority: L2_PRIORITY,
        });
      }
    }

    // Arc
    if (chapter.arcId) {
      const arc = this.deps.arcRepo.findById(chapter.arcId);
      if (arc) {
        const arcParts = [`### Story Arc: ${arc.name}`];
        arcParts.push(`Type: ${arc.type}`);
        arcParts.push(`Status: ${arc.status}`);
        if (arc.sections?.length) {
          arcParts.push('Sections:');
          for (const section of arc.sections) {
            arcParts.push(`  - ${section.name} (${section.status})`);
          }
        }

        items.push({
          type: 'arc',
          id: arc.id,
          content: arcParts.join('\n'),
          priority: L2_PRIORITY,
        });
      }
    }

    return items;
  }

  /**
   * L3 - Plot Awareness: foreshadowing, active foreshadowing in arc, prev hook
   */
  private buildL3PlotAwareness(chapter: Chapter, prevChapter: Chapter | null): ContextItem[] {
    const items: ContextItem[] = [];

    // Foreshadowing hinted in this chapter — batch query
    if (chapter.foreshadowingHinted?.length) {
      const hinted = this.deps.foreshadowingRepo.findByIds(chapter.foreshadowingHinted);
      for (const fs of hinted) {
        items.push({
          type: 'foreshadowing',
          id: fs.id,
          content: `[Foreshadowing hint] ${fs.content} (status: ${fs.status})`,
          priority: L3_PRIORITY,
        });
      }
    }

    // Active foreshadowing in current arc
    if (chapter.arcId) {
      const allActive = this.deps.foreshadowingRepo.findActive();
      // Include active foreshadowing not already in chapter.foreshadowingHinted
      const hintedSet = new Set(chapter.foreshadowingHinted ?? []);
      for (const fs of allActive) {
        if (!hintedSet.has(fs.id)) {
          items.push({
            type: 'foreshadowing',
            id: `active-${fs.id}`,
            content: `[Active foreshadowing] ${fs.content} (status: ${fs.status})`,
            priority: L3_PRIORITY,
          });
        }
      }
    }

    // Previous chapter hook
    if (prevChapter) {
      const hooks = this.deps.hookRepo.findByChapter(prevChapter.id);
      for (const hook of hooks) {
        items.push({
          type: 'hook',
          id: hook.id,
          content: `[Previous chapter hook] ${hook.content} (strength: ${hook.strength ?? 'not set'})`,
          priority: L3_PRIORITY,
        });
      }
    }

    return items;
  }

  /**
   * L4 - World Rules: power system core rules, social rules
   */
  private buildL4WorldRules(): ContextItem[] {
    const items: ContextItem[] = [];

    const world = this.deps.worldRepo.get();
    if (!world) return items;

    // Power system core rules (always include if present)
    if (world.powerSystem?.coreRules?.length) {
      const rulesParts = [`### Power System: ${world.powerSystem.name}`];
      if (world.powerSystem.levels?.length) {
        rulesParts.push(`Levels: ${world.powerSystem.levels.join(' → ')}`);
      }
      rulesParts.push(
        `Core Rules:\n${world.powerSystem.coreRules.map((r) => `  - ${r}`).join('\n')}`
      );
      if (world.powerSystem.constraints?.length) {
        rulesParts.push(
          `Constraints:\n${world.powerSystem.constraints.map((c) => `  - ${c}`).join('\n')}`
        );
      }

      items.push({
        type: 'power_system',
        id: 'power-system',
        content: rulesParts.join('\n'),
        priority: L4_PRIORITY,
      });
    }

    // Social rules
    if (world.socialRules && Object.keys(world.socialRules).length > 0) {
      const socialParts = ['### Social Rules'];
      for (const [key, value] of Object.entries(world.socialRules)) {
        socialParts.push(`- ${key}: ${value}`);
      }

      items.push({
        type: 'social_rules',
        id: 'social-rules',
        content: socialParts.join('\n'),
        priority: L4_PRIORITY,
      });
    }

    return items;
  }

  /**
   * L5 - User-Selected: additional context items passed by caller
   */
  private buildL5UserSelected(additionalItems?: ContextItem[]): ContextItem[] {
    if (!additionalItems?.length) return [];

    // Ensure all user-selected items have L5 priority
    return additionalItems.map((item) => ({
      ...item,
      priority: item.priority || L5_PRIORITY,
    }));
  }

  // ===================================
  // Helpers
  // ===================================

  /**
   * Find the chapter immediately before the given chapter.
   * Uses volume ordering if available, otherwise falls back to ID ordering.
   */
  private getPreviousChapter(chapter: Chapter): Chapter | null {
    let chapters: Chapter[];

    if (chapter.volumeId) {
      chapters = this.deps.writingRepo.findChaptersByVolume(chapter.volumeId);
    } else {
      chapters = this.deps.writingRepo.findAllChapters();
    }

    const idx = chapters.findIndex((c) => c.id === chapter.id);
    if (idx <= 0) return null;

    // Return previous chapter WITH content (need it for tail)
    const prev = chapters[idx - 1];
    if (!prev) return null;
    return this.deps.writingRepo.findChapterWithContent(prev.id);
  }
}
