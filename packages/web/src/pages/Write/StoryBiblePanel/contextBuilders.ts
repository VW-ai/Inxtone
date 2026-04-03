/**
 * Context Item Builders — convert Bible entities to AI context items (L5)
 */

import type { ContextItem, ContextItemType } from '@inxtone/core';
import type {
  Character,
  Relationship,
  Location,
  Arc,
  Foreshadowing,
  Hook,
  Faction,
} from '@inxtone/core';

export const L5_PRIORITY = 200;

export function buildCharacterContext(c: Character): ContextItem {
  const parts = [c.name, c.role];
  if (c.appearance) parts.push(c.appearance);
  if (c.motivation?.surface) parts.push(`Motivation: ${c.motivation.surface}`);
  return {
    type: 'character' as ContextItemType,
    id: c.id,
    content: parts.join('\n'),
    priority: L5_PRIORITY,
  };
}

export function buildRelationshipContext(
  rel: Relationship,
  charMap: Map<string, Character>
): ContextItem {
  const source = charMap.get(rel.sourceId)?.name ?? rel.sourceId;
  const target = charMap.get(rel.targetId)?.name ?? rel.targetId;
  const parts = [`${source} \u2192 ${target}: ${rel.type}`];
  if (rel.joinReason) parts.push(`Bond: ${rel.joinReason}`);
  return {
    type: 'relationship' as ContextItemType,
    id: `rel-${rel.id}`,
    content: parts.join('\n'),
    priority: L5_PRIORITY,
  };
}

export function buildLocationContext(l: Location): ContextItem {
  const parts = [l.name];
  if (l.atmosphere) parts.push(`Atmosphere: ${l.atmosphere}`);
  if (l.significance) parts.push(`Significance: ${l.significance}`);
  return {
    type: 'location' as ContextItemType,
    id: l.id,
    content: parts.join('\n'),
    priority: L5_PRIORITY,
  };
}

export function buildArcContext(arc: Arc): ContextItem {
  const parts = [`Arc: ${arc.name}`, `Type: ${arc.type}`, `Status: ${arc.status}`];
  return {
    type: 'arc' as ContextItemType,
    id: arc.id,
    content: parts.join('\n'),
    priority: L5_PRIORITY,
  };
}

export function buildForeshadowingContext(f: Foreshadowing): ContextItem {
  return {
    type: 'foreshadowing' as ContextItemType,
    id: f.id,
    content: `[Foreshadowing] ${f.content} (${f.status})`,
    priority: L5_PRIORITY,
  };
}

export function buildHookContext(h: Hook): ContextItem {
  return {
    type: 'hook' as ContextItemType,
    id: h.id,
    content: `[Hook] ${h.content}`,
    priority: L5_PRIORITY,
  };
}

export function buildFactionContext(f: Faction): ContextItem {
  const parts = [f.name];
  if (f.stanceToMC) parts.push(`Stance: ${f.stanceToMC}`);
  if (f.internalConflict) parts.push(`Conflict: ${f.internalConflict}`);
  return {
    type: 'custom' as ContextItemType,
    id: `faction-${f.id}`,
    content: parts.join('\n'),
    priority: L5_PRIORITY,
  };
}
