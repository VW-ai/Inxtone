/**
 * BibleFormatter - Export Story Bible as structured Markdown
 *
 * Sections: Characters, Relationships, World, Locations,
 *           Factions, Arcs, Foreshadowing, Hooks
 */

import type {
  Character,
  Relationship,
  World,
  Location,
  Faction,
  Arc,
  Foreshadowing,
  Hook,
  BibleExportOptions,
  ExportResult,
} from '../../types/index.js';

/** All Bible data needed for export */
export interface BibleData {
  characters: Character[];
  relationships: Relationship[];
  world: World | null;
  locations: Location[];
  factions: Faction[];
  arcs: Arc[];
  foreshadowing: Foreshadowing[];
  hooks: Hook[];
}

type SectionName = NonNullable<BibleExportOptions['sections']>[number];

const ALL_SECTIONS: SectionName[] = [
  'characters',
  'relationships',
  'world',
  'locations',
  'factions',
  'arcs',
  'foreshadowing',
  'hooks',
];

/** Escape pipe characters in markdown table cells */
function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|');
}

export class BibleFormatter {
  format(data: BibleData, options?: BibleExportOptions): ExportResult {
    const sections = options?.sections ?? ALL_SECTIONS;
    const lines: string[] = [];

    lines.push('# Story Bible');
    lines.push('');

    for (const section of sections) {
      const sectionLines = this.formatSection(section, data);
      if (sectionLines.length > 0) {
        lines.push(...sectionLines);
        lines.push('');
      }
    }

    // Handle completely empty bible
    if (lines.length <= 2) {
      lines.push('*No Story Bible data yet.*');
      lines.push('');
    }

    return {
      data: lines.join('\n'),
      filename: 'story-bible.md',
      mimeType: 'text/markdown',
    };
  }

  private formatSection(section: SectionName, data: BibleData): string[] {
    switch (section) {
      case 'characters':
        return this.formatCharacters(data.characters);
      case 'relationships':
        return this.formatRelationships(data.relationships);
      case 'world':
        return this.formatWorld(data.world);
      case 'locations':
        return this.formatLocations(data.locations);
      case 'factions':
        return this.formatFactions(data.factions);
      case 'arcs':
        return this.formatArcs(data.arcs);
      case 'foreshadowing':
        return this.formatForeshadowing(data.foreshadowing);
      case 'hooks':
        return this.formatHooks(data.hooks);
    }
  }

  private formatCharacters(characters: Character[]): string[] {
    if (characters.length === 0) return [];
    const lines: string[] = [];
    lines.push('## Characters');
    lines.push('');

    for (const char of characters) {
      lines.push(`### ${char.name} (${char.role})`);
      lines.push('');
      if (char.appearance) lines.push(`- **Appearance**: ${char.appearance}`);
      if (char.motivation) {
        lines.push(`- **Motivation (surface)**: ${char.motivation.surface}`);
        if (char.motivation.hidden)
          lines.push(`- **Motivation (hidden)**: ${char.motivation.hidden}`);
        if (char.motivation.core) lines.push(`- **Motivation (core)**: ${char.motivation.core}`);
      }
      if (char.conflictType) lines.push(`- **Conflict**: ${char.conflictType}`);
      if (char.template) lines.push(`- **Template**: ${char.template}`);
      if (char.voiceSamples && char.voiceSamples.length > 0) {
        lines.push(`- **Voice**: "${char.voiceSamples[0]}"`);
      }
      if (char.arc) {
        lines.push(`- **Arc**: ${char.arc.type} (${char.arc.startState} → ${char.arc.endState})`);
      }
      lines.push('');
    }

    return lines;
  }

  private formatRelationships(relationships: Relationship[]): string[] {
    if (relationships.length === 0) return [];
    const lines: string[] = [];
    lines.push('## Relationships');
    lines.push('');
    lines.push('| Source | Target | Type | Join Reason | Independent Goal |');
    lines.push('|--------|--------|------|-------------|------------------|');

    for (const rel of relationships) {
      const joinReason = escapeCell(rel.joinReason ?? '-');
      const independentGoal = escapeCell(rel.independentGoal ?? '-');
      lines.push(
        `| ${escapeCell(rel.sourceId)} | ${escapeCell(rel.targetId)} | ${escapeCell(rel.type)} | ${joinReason} | ${independentGoal} |`
      );
    }

    lines.push('');
    return lines;
  }

  private formatWorld(world: World | null): string[] {
    if (!world) return [];
    const lines: string[] = [];
    lines.push('## World');
    lines.push('');

    if (world.powerSystem) {
      lines.push(`### Power System: ${world.powerSystem.name}`);
      lines.push('');
      if (world.powerSystem.levels && world.powerSystem.levels.length > 0) {
        lines.push('**Levels:**');
        for (const level of world.powerSystem.levels) {
          lines.push(`- ${level}`);
        }
        lines.push('');
      }
      if (world.powerSystem.coreRules && world.powerSystem.coreRules.length > 0) {
        lines.push('**Core Rules:**');
        for (const rule of world.powerSystem.coreRules) {
          lines.push(`- ${rule}`);
        }
        lines.push('');
      }
      if (world.powerSystem.constraints && world.powerSystem.constraints.length > 0) {
        lines.push('**Constraints:**');
        for (const constraint of world.powerSystem.constraints) {
          lines.push(`- ${constraint}`);
        }
        lines.push('');
      }
    }

    if (world.socialRules && Object.keys(world.socialRules).length > 0) {
      lines.push('### Social Rules');
      lines.push('');
      for (const [key, value] of Object.entries(world.socialRules)) {
        lines.push(`- **${key}**: ${value}`);
      }
      lines.push('');
    }

    return lines;
  }

  private formatLocations(locations: Location[]): string[] {
    if (locations.length === 0) return [];
    const lines: string[] = [];
    lines.push('## Locations');
    lines.push('');

    for (const loc of locations) {
      lines.push(`### ${loc.name}`);
      lines.push('');
      if (loc.type) lines.push(`- **Type**: ${loc.type}`);
      if (loc.atmosphere) lines.push(`- **Atmosphere**: ${loc.atmosphere}`);
      if (loc.significance) lines.push(`- **Significance**: ${loc.significance}`);
      lines.push('');
    }

    return lines;
  }

  private formatFactions(factions: Faction[]): string[] {
    if (factions.length === 0) return [];
    const lines: string[] = [];
    lines.push('## Factions');
    lines.push('');

    for (const faction of factions) {
      lines.push(`### ${faction.name}`);
      lines.push('');
      if (faction.type) lines.push(`- **Type**: ${faction.type}`);
      if (faction.status) lines.push(`- **Status**: ${faction.status}`);
      if (faction.stanceToMC) lines.push(`- **Stance**: ${faction.stanceToMC}`);
      if (faction.goals && faction.goals.length > 0)
        lines.push(`- **Goals**: ${faction.goals.join(', ')}`);
      if (faction.internalConflict)
        lines.push(`- **Internal Conflict**: ${faction.internalConflict}`);
      lines.push('');
    }

    return lines;
  }

  private formatArcs(arcs: Arc[]): string[] {
    if (arcs.length === 0) return [];
    const lines: string[] = [];
    lines.push('## Story Arcs');
    lines.push('');

    for (const arc of arcs) {
      lines.push(`### ${arc.name} (${arc.type}, ${arc.status})`);
      lines.push('');
      lines.push(`- **Progress**: ${arc.progress}%`);
      if (arc.chapterStart != null)
        lines.push(`- **Chapters**: ${arc.chapterStart} - ${arc.chapterEnd ?? '?'}`);
      if (arc.sections && arc.sections.length > 0) {
        lines.push('- **Sections**:');
        for (const section of arc.sections) {
          lines.push(
            `  - ${section.name} (${section.status}): chapters ${section.chapters.join(', ')}`
          );
        }
      }
      if (arc.mainArcRelation) lines.push(`- **Main Arc Relation**: ${arc.mainArcRelation}`);
      lines.push('');
    }

    return lines;
  }

  private formatForeshadowing(foreshadowing: Foreshadowing[]): string[] {
    if (foreshadowing.length === 0) return [];
    const lines: string[] = [];
    lines.push('## Foreshadowing');
    lines.push('');
    lines.push('| ID | Content | Status | Term | Planted | Payoff |');
    lines.push('|----|---------|--------|------|---------|--------|');

    for (const item of foreshadowing) {
      const content = escapeCell(
        item.content.length > 50 ? item.content.slice(0, 50) + '...' : item.content
      );
      const planted = item.plantedChapter != null ? `Ch ${item.plantedChapter}` : '-';
      const payoff =
        item.resolvedChapter != null
          ? `Ch ${item.resolvedChapter}`
          : item.plannedPayoff != null
            ? `Ch ${item.plannedPayoff} (planned)`
            : '-';
      lines.push(
        `| ${escapeCell(item.id)} | ${content} | ${escapeCell(item.status)} | ${escapeCell(item.term ?? '-')} | ${planted} | ${payoff} |`
      );
    }

    lines.push('');
    return lines;
  }

  private formatHooks(hooks: Hook[]): string[] {
    if (hooks.length === 0) return [];
    const lines: string[] = [];
    lines.push('## Hooks');
    lines.push('');
    lines.push('| Type | Chapter | Content | Style | Strength |');
    lines.push('|------|---------|---------|-------|----------|');

    for (const hook of hooks) {
      const content = escapeCell(
        hook.content.length > 50 ? hook.content.slice(0, 50) + '...' : hook.content
      );
      const chapter = hook.chapterId != null ? `Ch ${hook.chapterId}` : '-';
      lines.push(
        `| ${escapeCell(hook.type)} | ${chapter} | ${content} | ${escapeCell(hook.hookType ?? '-')} | ${hook.strength ?? '-'} |`
      );
    }

    lines.push('');
    return lines;
  }
}
