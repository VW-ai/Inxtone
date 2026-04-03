/**
 * GlobalContextBuilder - Story-wide context assembly
 *
 * Builds context from all Story Bible entities (findAll-based),
 * for methods that need global awareness rather than chapter-scoped FK context.
 *
 * Two build modes:
 * - buildFull() — comprehensive: all entities with detail (for askStoryBible)
 * - buildSummary() — lightweight: names + status only (for brainstorm)
 *
 * Both return BuiltContext with same token budget/truncation as ChapterContextBuilder.
 *
 * @see spec/Decisions/ADR-0002-ai-context-injection-strategy.md
 */

import type { ContextItem, BuiltContext } from '../types/services.js';
import {
  BaseContextBuilder,
  L2_PRIORITY,
  L3_PRIORITY,
  L4_PRIORITY,
  TOTAL_BUDGET,
  OUTPUT_RESERVE,
  PROMPT_RESERVE,
} from './BaseContextBuilder.js';

export class GlobalContextBuilder extends BaseContextBuilder {
  /**
   * Build comprehensive global context — all Story Bible entities with moderate detail.
   * Used by askStoryBible for full story awareness.
   */
  buildFull(): BuiltContext {
    const items: ContextItem[] = [];

    // Characters with motivation + facets
    const characters = this.deps.characterRepo.findAll();
    if (characters.length > 0) {
      const charContent = characters
        .map((c) => {
          const parts = [`- ${c.name} (${c.role})`];
          if (c.motivation?.surface) parts.push(`  Motivation: ${c.motivation.surface}`);
          if (c.facets?.public) parts.push(`  Personality: ${c.facets.public}`);
          return parts.join('\n');
        })
        .join('\n');

      items.push({
        type: 'character',
        id: 'global-characters',
        content: '## Characters\n' + charContent,
        priority: L2_PRIORITY,
      });
    }

    // All relationships with name resolution
    const relationships = this.deps.relationshipRepo.findAll();
    if (relationships.length > 0) {
      const charMap = new Map(characters.map((c) => [c.id, c.name]));
      const relContent = relationships
        .map((r) => {
          const src = charMap.get(r.sourceId) ?? r.sourceId;
          const tgt = charMap.get(r.targetId) ?? r.targetId;
          return `- ${src} → ${tgt}: ${r.type}`;
        })
        .join('\n');

      items.push({
        type: 'relationship',
        id: 'global-relationships',
        content: '## Relationships\n' + relContent,
        priority: L2_PRIORITY,
      });
    }

    // All arcs with type + status
    const arcs = this.deps.arcRepo.findAll();
    if (arcs.length > 0) {
      items.push({
        type: 'arc',
        id: 'global-arcs',
        content:
          '## Story Arcs\n' + arcs.map((a) => `- ${a.name} (${a.type}, ${a.status})`).join('\n'),
        priority: L2_PRIORITY,
      });
    }

    // All locations
    const locations = this.deps.locationRepo.findAll();
    if (locations.length > 0) {
      items.push({
        type: 'location',
        id: 'global-locations',
        content:
          '## Locations\n' +
          locations.map((l) => `- ${l.name}${l.type ? ` (${l.type})` : ''}`).join('\n'),
        priority: L2_PRIORITY,
      });
    }

    // All foreshadowing with status
    const foreshadowing = this.deps.foreshadowingRepo.findAll();
    if (foreshadowing.length > 0) {
      items.push({
        type: 'foreshadowing',
        id: 'global-foreshadowing',
        content:
          '## Foreshadowing\n' +
          foreshadowing.map((f) => `- ${f.content} (${f.status})`).join('\n'),
        priority: L3_PRIORITY,
      });
    }

    // World: power system + social rules
    const world = this.deps.worldRepo.get();
    if (world?.powerSystem) {
      const rulesParts = [`## Power System: ${world.powerSystem.name}`];
      if (world.powerSystem.coreRules?.length) {
        rulesParts.push(`Core Rules: ${world.powerSystem.coreRules.join(', ')}`);
      }
      items.push({
        type: 'power_system',
        id: 'global-power-system',
        content: rulesParts.join('\n'),
        priority: L4_PRIORITY,
      });
    }
    if (world?.socialRules && Object.keys(world.socialRules).length > 0) {
      items.push({
        type: 'social_rules',
        id: 'global-social-rules',
        content:
          '## Social Rules\n' +
          Object.entries(world.socialRules)
            .map(([k, v]) => `- ${k}: ${v}`)
            .join('\n'),
        priority: L4_PRIORITY,
      });
    }

    const budget = TOTAL_BUDGET - OUTPUT_RESERVE - PROMPT_RESERVE;
    return this.truncateToFitBudget(items, budget);
  }

  /**
   * Build lightweight global summary — names + status only.
   * Used by brainstorm for quick story awareness without overwhelming the prompt.
   */
  buildSummary(): BuiltContext {
    const items: ContextItem[] = [];

    // Characters: name(role) one-liner
    const characters = this.deps.characterRepo.findAll();
    if (characters.length > 0) {
      items.push({
        type: 'character',
        id: 'summary-characters',
        content: 'Characters: ' + characters.map((c) => `${c.name}(${c.role})`).join(', '),
        priority: L2_PRIORITY,
      });
    }

    // Arcs: name(status) one-liner
    const arcs = this.deps.arcRepo.findAll();
    if (arcs.length > 0) {
      items.push({
        type: 'arc',
        id: 'summary-arcs',
        content: 'Story Arcs: ' + arcs.map((a) => `${a.name}(${a.status})`).join(', '),
        priority: L2_PRIORITY,
      });
    }

    // Active foreshadowing content
    const activeForeshadowing = this.deps.foreshadowingRepo.findActive();
    if (activeForeshadowing.length > 0) {
      items.push({
        type: 'foreshadowing',
        id: 'summary-foreshadowing',
        content: 'Active Foreshadowing: ' + activeForeshadowing.map((f) => f.content).join('; '),
        priority: L3_PRIORITY,
      });
    }

    const budget = TOTAL_BUDGET - OUTPUT_RESERVE - PROMPT_RESERVE;
    return this.truncateToFitBudget(items, budget);
  }
}
