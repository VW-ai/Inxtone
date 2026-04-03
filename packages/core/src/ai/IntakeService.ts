/**
 * IntakeService - AI-powered Story Bible entity extraction
 *
 * Three intake modes:
 * 1. Document Intake (decompose) - user pastes text tagged by topic
 * 2. Chapter Import (extractFromChapters) - multi-pass extraction from chapters
 * 3. Auto-detect - decompose with hint='auto'
 *
 * All modes produce DecomposeResult → human review → commitEntities
 */

import type { IEventBus } from '../types/services.js';
import type { CharacterRepository } from '../db/repositories/CharacterRepository.js';
import type { RelationshipRepository } from '../db/repositories/RelationshipRepository.js';
import type { LocationRepository } from '../db/repositories/LocationRepository.js';
import type { FactionRepository } from '../db/repositories/FactionRepository.js';
import type { ArcRepository } from '../db/repositories/ArcRepository.js';
import type { ForeshadowingRepository } from '../db/repositories/ForeshadowingRepository.js';
import type { HookRepository } from '../db/repositories/HookRepository.js';
import type { WorldRepository } from '../db/repositories/WorldRepository.js';
import type { TimelineEventRepository } from '../db/repositories/TimelineEventRepository.js';
import type { Database } from '../db/Database.js';

import { GeminiProvider } from './GeminiProvider.js';
import { PromptAssembler } from './PromptAssembler.js';

import type {
  IntakeHint,
  DecomposeResult,
  ChapterText,
  IntakeProgressEvent,
  DuplicateCandidate,
  IntakeCommitEntity,
  IntakeCommitResult,
} from './intake/types.js';
import type { DecomposeResultParsed } from './intake/schemas.js';
import { validateDecomposeResult, duplicateCheckResponseSchema } from './intake/schemas.js';
import {
  INTAKE_DECOMPOSE_TEMPLATE,
  INTAKE_CHAPTER_EXTRACT_TEMPLATE,
  INTAKE_DUPLICATE_CHECK_TEMPLATE,
  HINT_FOCUS,
  buildEntitySchemas,
} from './intake/templates.js';

// ===========================================
// Helpers
// ===========================================

/**
 * Convert Zod-parsed result (T | undefined) to DecomposeResult (?: T).
 * Under exactOptionalPropertyTypes, Zod's `prop?: T | undefined` differs
 * from our interface's `prop?: T`. The runtime shapes are identical.
 */
function toDecomposeResult(
  parsed: DecomposeResultParsed,
  extraWarnings: string[] = []
): DecomposeResult {
  // Shallow-clone so we don't mutate the original parsed object
  const result = { ...parsed } as unknown as DecomposeResult;
  result.warnings = [...parsed.warnings, ...extraWarnings];
  return result;
}

// ===========================================
// Dependencies
// ===========================================

export interface IntakeServiceDeps {
  db: Database;
  characterRepo: CharacterRepository;
  relationshipRepo: RelationshipRepository;
  locationRepo: LocationRepository;
  factionRepo: FactionRepository;
  arcRepo: ArcRepository;
  foreshadowingRepo: ForeshadowingRepository;
  hookRepo: HookRepository;
  worldRepo: WorldRepository;
  timelineEventRepo: TimelineEventRepository;
  eventBus: IEventBus;
}

export interface IntakeServiceOptions {
  geminiApiKey?: string;
}

// ===========================================
// IntakeService
// ===========================================

export class IntakeService {
  private provider: GeminiProvider;
  private promptAssembler: PromptAssembler;

  constructor(
    private deps: IntakeServiceDeps,
    options?: IntakeServiceOptions
  ) {
    this.provider = new GeminiProvider(options?.geminiApiKey);

    this.promptAssembler = new PromptAssembler();
    this.promptAssembler.registerTemplate('intake_decompose', INTAKE_DECOMPOSE_TEMPLATE);
    this.promptAssembler.registerTemplate(
      'intake_chapter_extract',
      INTAKE_CHAPTER_EXTRACT_TEMPLATE
    );
    this.promptAssembler.registerTemplate(
      'intake_duplicate_check',
      INTAKE_DUPLICATE_CHECK_TEMPLATE
    );
  }

  /** Set Gemini API key (BYOK pattern) */
  setGeminiApiKey(key: string): void {
    this.provider.updateApiKey(key);
  }

  // ===================================
  // Document Intake: Decompose
  // ===================================

  /**
   * Decompose natural language text into structured Story Bible entities.
   * Single AI call — extracts entity types based on the hint.
   */
  async decompose(text: string, hint: IntakeHint = 'auto'): Promise<DecomposeResult> {
    const knownEntities = this.buildKnownEntitiesList();
    const hintFocus = HINT_FOCUS[hint] ?? HINT_FOCUS.auto;
    const entitySchemas = buildEntitySchemas(hint);

    const prompt = this.promptAssembler.assemble('intake_decompose', {
      text,
      hint: hintFocus ?? '',
      known_entities: knownEntities,
      entity_schemas: entitySchemas,
    });

    const raw = await this.provider.generateJSON<unknown>(prompt, {
      temperature: 0.3,
      maxTokens: 8192,
    });

    const { result, validationWarnings } = validateDecomposeResult(raw);

    return toDecomposeResult(result, validationWarnings);
  }

  // ===================================
  // Chapter Import: Multi-Pass Extraction
  // ===================================

  /**
   * Extract Story Bible entities from story chapters using multi-pass extraction.
   * Yields progress events for SSE streaming to the UI.
   *
   * Pass 1: characters, locations, factions, world rules
   * Pass 2: relationships (needs character names from Pass 1)
   * Pass 3: arcs, foreshadowing, hooks, timeline
   */
  async *extractFromChapters(chapters: ChapterText[]): AsyncGenerator<IntakeProgressEvent> {
    const knownEntities = this.buildKnownEntitiesList();

    // Format chapters for the prompt
    const chaptersText = chapters
      .map((ch) => `## ${ch.title}\n\n${ch.content}`)
      .join('\n\n---\n\n');

    // --- Pass 1: Characters, Locations, Factions, World ---
    yield {
      type: 'progress',
      step: 'Pass 1/3: Extracting characters, locations, world...',
      pass: 1,
      progress: 10,
    };

    const pass1Schemas = buildEntitySchemas('auto');
    // For pass 1, we only want characters, locations, factions, world
    const pass1Prompt = this.promptAssembler.assemble('intake_chapter_extract', {
      chapters: chaptersText,
      pass_target:
        'Extract ONLY: characters[], locations[], factions[], worldRules\n' +
        '本轮只提取：角色、地点、势力、世界观设定\n' +
        'Do NOT extract relationships, arcs, foreshadowing, hooks, or timeline in this pass.',
      known_entities: knownEntities,
      already_extracted: '(first pass — nothing extracted yet)',
      entity_schemas: pass1Schemas,
    });

    let pass1Result: DecomposeResult;
    try {
      const raw1 = await this.provider.generateJSON<unknown>(pass1Prompt, {
        temperature: 0.3,
        maxTokens: 8192,
      });
      const { result, validationWarnings } = validateDecomposeResult(raw1);
      pass1Result = toDecomposeResult(result, validationWarnings);
    } catch (err) {
      yield {
        type: 'error',
        error: `Pass 1 failed: ${err instanceof Error ? err.message : String(err)}`,
      };
      return;
    }

    const pass1Entities: Partial<DecomposeResult> = {
      characters: pass1Result.characters,
      locations: pass1Result.locations,
      factions: pass1Result.factions,
    };
    if (pass1Result.worldRules !== undefined) {
      pass1Entities.worldRules = pass1Result.worldRules;
    }
    yield {
      type: 'pass_complete',
      pass: 1,
      progress: 35,
      step: `Pass 1 complete: ${pass1Result.characters.length} characters, ${pass1Result.locations.length} locations, ${pass1Result.factions.length} factions`,
      entities: pass1Entities,
    };

    // --- Pass 2: Relationships ---
    yield {
      type: 'progress',
      step: 'Pass 2/3: Extracting relationships...',
      pass: 2,
      progress: 40,
    };

    const characterNames = pass1Result.characters.map((c) => `- ${c.name} (${c.role})`).join('\n');
    const alreadyExtracted =
      `Characters:\n${characterNames || '(none)'}\n\n` +
      `Locations:\n${pass1Result.locations.map((l) => `- ${l.name}`).join('\n') || '(none)'}`;

    const pass2Prompt = this.promptAssembler.assemble('intake_chapter_extract', {
      chapters: chaptersText,
      pass_target:
        'Extract ONLY: relationships[]\n' +
        '本轮只提取：角色之间的关系\n' +
        'Use sourceName/targetName from the characters listed in "Already Extracted".\n' +
        '使用已提取角色列表中的角色名作为 sourceName/targetName。',
      known_entities: knownEntities,
      already_extracted: alreadyExtracted,
      entity_schemas: buildEntitySchemas('character'), // includes relationships schema
    });

    let pass2Result: DecomposeResult;
    try {
      const raw2 = await this.provider.generateJSON<unknown>(pass2Prompt, {
        temperature: 0.3,
        maxTokens: 8192,
      });
      const { result, validationWarnings } = validateDecomposeResult(raw2);
      pass2Result = toDecomposeResult(result, validationWarnings);
    } catch (err) {
      yield {
        type: 'error',
        error: `Pass 2 failed: ${err instanceof Error ? err.message : String(err)}`,
      };
      return;
    }

    yield {
      type: 'pass_complete',
      pass: 2,
      progress: 65,
      step: `Pass 2 complete: ${pass2Result.relationships.length} relationships`,
      entities: {
        relationships: pass2Result.relationships,
      },
    };

    // --- Pass 3: Arcs, Foreshadowing, Hooks, Timeline ---
    yield {
      type: 'progress',
      step: 'Pass 3/3: Extracting plot elements...',
      pass: 3,
      progress: 70,
    };

    const pass3Prompt = this.promptAssembler.assemble('intake_chapter_extract', {
      chapters: chaptersText,
      pass_target:
        'Extract ONLY: arcs[], foreshadowing[], hooks[], timeline[]\n' +
        '本轮只提取：故事弧线、伏笔、钩子、时间线事件',
      known_entities: knownEntities,
      already_extracted:
        alreadyExtracted +
        `\n\nRelationships:\n${pass2Result.relationships.map((r) => `- ${r.sourceName} → ${r.targetName} (${r.type})`).join('\n') || '(none)'}`,
      entity_schemas: buildEntitySchemas('plot'),
    });

    let pass3Result: DecomposeResult;
    try {
      const raw3 = await this.provider.generateJSON<unknown>(pass3Prompt, {
        temperature: 0.3,
        maxTokens: 8192,
      });
      const { result, validationWarnings } = validateDecomposeResult(raw3);
      pass3Result = toDecomposeResult(result, validationWarnings);
    } catch (err) {
      yield {
        type: 'error',
        error: `Pass 3 failed: ${err instanceof Error ? err.message : String(err)}`,
      };
      return;
    }

    yield {
      type: 'pass_complete',
      pass: 3,
      progress: 90,
      step: `Pass 3 complete: ${pass3Result.arcs.length} arcs, ${pass3Result.foreshadowing.length} foreshadowing, ${pass3Result.hooks.length} hooks, ${pass3Result.timeline.length} timeline events`,
      entities: {
        arcs: pass3Result.arcs,
        foreshadowing: pass3Result.foreshadowing,
        hooks: pass3Result.hooks,
        timeline: pass3Result.timeline,
      },
    };

    // --- Merge all passes ---
    const merged: DecomposeResult = {
      characters: pass1Result.characters,
      relationships: pass2Result.relationships,
      locations: pass1Result.locations,
      factions: pass1Result.factions,
      foreshadowing: pass3Result.foreshadowing,
      arcs: pass3Result.arcs,
      hooks: pass3Result.hooks,
      timeline: pass3Result.timeline,
      warnings: [...pass1Result.warnings, ...pass2Result.warnings, ...pass3Result.warnings],
    };
    if (pass1Result.worldRules !== undefined) {
      merged.worldRules = pass1Result.worldRules;
    }

    yield {
      type: 'done',
      progress: 100,
      step: 'Extraction complete',
      entities: merged,
    };
  }

  // ===================================
  // Duplicate Detection
  // ===================================

  /**
   * Detect potential duplicates between extracted entities and existing Story Bible.
   * Two-tier: exact name match first, then AI-assisted for ambiguous cases.
   */
  async detectDuplicates(result: DecomposeResult): Promise<DuplicateCandidate[]> {
    const candidates: DuplicateCandidate[] = [];

    // Check characters
    const existingCharacters = this.deps.characterRepo.findAll();
    for (const [i, extracted] of result.characters.entries()) {
      for (const existing of existingCharacters) {
        const nameMatch = this.compareName(extracted.name, existing.name);
        if (nameMatch >= 0.95) {
          candidates.push({
            index: i,
            entityType: 'character',
            importedName: extracted.name,
            importedData: extracted as unknown as Record<string, unknown>,
            existingId: existing.id,
            existingName: existing.name,
            confidence: nameMatch,
            reason: 'exact name match',
          });
        } else if (nameMatch >= 0.5) {
          // AI-assisted check for ambiguous matches
          const aiResult = await this.aiDuplicateCheck(
            'character',
            extracted as unknown as Record<string, unknown>,
            existing as unknown as Record<string, unknown>
          );
          if (aiResult.isSame) {
            candidates.push({
              index: i,
              entityType: 'character',
              importedName: extracted.name,
              importedData: extracted as unknown as Record<string, unknown>,
              existingId: existing.id,
              existingName: existing.name,
              confidence: aiResult.confidence,
              reason: `AI similarity: ${aiResult.reason}`,
            });
          }
        }
      }
    }

    // Check locations
    const existingLocations = this.deps.locationRepo.findAll();
    for (const [i, extracted] of result.locations.entries()) {
      for (const existing of existingLocations) {
        const nameMatch = this.compareName(extracted.name, existing.name);
        if (nameMatch >= 0.95) {
          candidates.push({
            index: i,
            entityType: 'location',
            importedName: extracted.name,
            importedData: extracted as unknown as Record<string, unknown>,
            existingId: existing.id,
            existingName: existing.name,
            confidence: nameMatch,
            reason: 'exact name match',
          });
        } else if (nameMatch >= 0.5) {
          const aiResult = await this.aiDuplicateCheck(
            'location',
            extracted as unknown as Record<string, unknown>,
            existing as unknown as Record<string, unknown>
          );
          if (aiResult.isSame) {
            candidates.push({
              index: i,
              entityType: 'location',
              importedName: extracted.name,
              importedData: extracted as unknown as Record<string, unknown>,
              existingId: existing.id,
              existingName: existing.name,
              confidence: aiResult.confidence,
              reason: `AI similarity: ${aiResult.reason}`,
            });
          }
        }
      }
    }

    // Check factions
    const existingFactions = this.deps.factionRepo.findAll();
    for (const [i, extracted] of result.factions.entries()) {
      for (const existing of existingFactions) {
        const nameMatch = this.compareName(extracted.name, existing.name);
        if (nameMatch >= 0.95) {
          candidates.push({
            index: i,
            entityType: 'faction',
            importedName: extracted.name,
            importedData: extracted as unknown as Record<string, unknown>,
            existingId: existing.id,
            existingName: existing.name,
            confidence: nameMatch,
            reason: 'exact name match',
          });
        }
        // Factions are less likely to have name variations, skip AI check
      }
    }

    // Sort by confidence descending
    candidates.sort((a, b) => b.confidence - a.confidence);

    return candidates;
  }

  // ===================================
  // Commit Entities
  // ===================================

  /**
   * Commit confirmed entities to the Story Bible in a transaction.
   *
   * Processing order: characters → locations → factions → world →
   * relationships → arcs → foreshadowing → hooks → timeline
   *
   * Builds a nameToIdMap as entities are created, used to resolve
   * relationship sourceId/targetId and faction leaderId from names.
   */
  commitEntities(entities: IntakeCommitEntity[]): IntakeCommitResult {
    const created: IntakeCommitResult['created'] = [];
    const merged: IntakeCommitResult['merged'] = [];
    let skipped = 0;
    let unresolved = 0;

    // Name → ID maps built during commit (for resolving references)
    const charNameToId = new Map<string, string>();
    const locNameToId = new Map<string, string>();

    // Pre-populate maps from existing entities
    for (const c of this.deps.characterRepo.findAll()) {
      charNameToId.set(this.normalizeName(c.name), c.id);
    }
    for (const l of this.deps.locationRepo.findAll()) {
      locNameToId.set(this.normalizeName(l.name), l.id);
    }

    // Group entities by type for ordered processing
    const byType = new Map<string, IntakeCommitEntity[]>();
    for (const entity of entities) {
      const list = byType.get(entity.entityType) ?? [];
      list.push(entity);
      byType.set(entity.entityType, list);
    }

    const processingOrder = [
      'character',
      'location',
      'faction',
      'world',
      'relationship',
      'arc',
      'foreshadowing',
      'hook',
      'timeline',
    ];

    this.deps.db.transactionSync(() => {
      for (const type of processingOrder) {
        const items = byType.get(type) ?? [];
        for (const item of items) {
          if (item.action === 'skip') {
            skipped++;
            continue;
          }

          const commitResult = this.commitSingleEntity(item, charNameToId, locNameToId);
          if (commitResult) {
            if (item.action === 'create') {
              created.push(commitResult);
            } else {
              merged.push(commitResult);
            }
          } else {
            unresolved++;
          }
        }
      }
    });

    return { created, merged, skipped, unresolved };
  }

  // ===================================
  // Private Helpers
  // ===================================

  /**
   * Build a list of known entities for dedup-aware extraction.
   * Included in prompts so AI knows what already exists.
   */
  private buildKnownEntitiesList(): string {
    const parts: string[] = [];

    const characters = this.deps.characterRepo.findAll();
    if (characters.length > 0) {
      parts.push(
        'Characters / 角色:\n' +
          characters.map((c) => `- ${c.name} (${c.role}, ID: ${c.id})`).join('\n')
      );
    }

    const locations = this.deps.locationRepo.findAll();
    if (locations.length > 0) {
      parts.push(
        'Locations / 地点:\n' + locations.map((l) => `- ${l.name} (ID: ${l.id})`).join('\n')
      );
    }

    const factions = this.deps.factionRepo.findAll();
    if (factions.length > 0) {
      parts.push(
        'Factions / 势力:\n' + factions.map((f) => `- ${f.name} (ID: ${f.id})`).join('\n')
      );
    }

    const arcs = this.deps.arcRepo.findAll();
    if (arcs.length > 0) {
      parts.push(
        'Arcs / 弧线:\n' + arcs.map((a) => `- ${a.name} (${a.type}, ID: ${a.id})`).join('\n')
      );
    }

    return parts.length > 0 ? parts.join('\n\n') : '(none — empty Story Bible)';
  }

  /**
   * Compare two entity names for similarity.
   * Returns 0-1 confidence score.
   */
  private compareName(a: string, b: string): number {
    const na = this.normalizeName(a);
    const nb = this.normalizeName(b);

    // Exact match after normalization
    if (na === nb) return 1.0;

    // One contains the other (e.g., "林墨" vs "林墨大师")
    if (na.includes(nb) || nb.includes(na)) {
      const shorter = Math.min(na.length, nb.length);
      const longer = Math.max(na.length, nb.length);
      return shorter / longer;
    }

    // No match
    return 0;
  }

  /** Normalize a name for comparison: trim, lowercase, collapse whitespace */
  private normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, '');
  }

  /**
   * AI-assisted duplicate check for ambiguous name matches.
   */
  private async aiDuplicateCheck(
    entityType: string,
    imported: Record<string, unknown>,
    existing: Record<string, unknown>
  ): Promise<{ isSame: boolean; confidence: number; reason: string }> {
    try {
      const prompt = this.promptAssembler.assemble('intake_duplicate_check', {
        entity_type: entityType,
        imported_entity: JSON.stringify(imported, null, 2),
        existing_entity: JSON.stringify(existing, null, 2),
      });

      const raw = await this.provider.generateJSON<unknown>(prompt, {
        temperature: 0.1,
        maxTokens: 256,
      });

      const parsed = duplicateCheckResponseSchema.safeParse(raw);
      if (parsed.success) {
        return parsed.data;
      }
      return { isSame: false, confidence: 0, reason: 'AI response invalid' };
    } catch {
      // If AI check fails, assume not a match
      return { isSame: false, confidence: 0, reason: 'AI check failed' };
    }
  }

  /**
   * Commit a single entity to the Story Bible.
   * Returns { type, id, name } on success, null on failure.
   */
  private commitSingleEntity(
    item: IntakeCommitEntity,
    charNameToId: Map<string, string>,
    locNameToId: Map<string, string>
  ): { type: string; id: string; name: string } | null {
    const data = item.data;

    switch (item.entityType) {
      case 'character': {
        if (item.action === 'merge' && item.existingId) {
          this.deps.characterRepo.update(item.existingId, data);
          const name = (data.name as string) ?? item.existingId;
          return { type: 'character', id: item.existingId, name };
        }
        const charInput: Record<string, unknown> = {
          name: data.name as string,
          role: (data.role as string) ?? 'supporting',
        };
        if (data.appearance !== undefined) charInput.appearance = data.appearance;
        if (data.voiceSamples !== undefined) charInput.voiceSamples = data.voiceSamples;
        if (data.motivation !== undefined) charInput.motivation = data.motivation;
        if (data.conflictType !== undefined) charInput.conflictType = data.conflictType;
        if (data.template !== undefined) charInput.template = data.template;
        const character = this.deps.characterRepo.create(
          charInput as unknown as Parameters<typeof this.deps.characterRepo.create>[0]
        );
        charNameToId.set(this.normalizeName(character.name), character.id);
        return { type: 'character', id: character.id, name: character.name };
      }

      case 'location': {
        if (item.action === 'merge' && item.existingId) {
          this.deps.locationRepo.update(item.existingId, data);
          const name = (data.name as string) ?? item.existingId;
          return { type: 'location', id: item.existingId, name };
        }
        const locInput: Record<string, unknown> = {
          name: data.name as string,
        };
        if (data.type !== undefined) locInput.type = data.type;
        if (data.significance !== undefined) locInput.significance = data.significance;
        if (data.atmosphere !== undefined) locInput.atmosphere = data.atmosphere;
        const location = this.deps.locationRepo.create(
          locInput as unknown as Parameters<typeof this.deps.locationRepo.create>[0]
        );
        locNameToId.set(this.normalizeName(location.name), location.id);
        return { type: 'location', id: location.id, name: location.name };
      }

      case 'faction': {
        if (item.action === 'merge' && item.existingId) {
          this.deps.factionRepo.update(item.existingId, data);
          const name = (data.name as string) ?? item.existingId;
          return { type: 'faction', id: item.existingId, name };
        }
        // Resolve leaderName → leaderId
        const leaderName = data.leaderName as string | undefined;
        let leaderId: string | undefined;
        if (leaderName) {
          leaderId = charNameToId.get(this.normalizeName(leaderName));
        }
        const input: Record<string, unknown> = {
          name: data.name as string,
          type: data.type,
          status: data.status,
          stanceToMC: data.stanceToMC,
          goals: data.goals,
          resources: data.resources,
          internalConflict: data.internalConflict,
        };
        if (leaderId) {
          input.leaderId = leaderId;
        }
        const faction = this.deps.factionRepo.create(
          input as unknown as Parameters<typeof this.deps.factionRepo.create>[0]
        );
        return { type: 'faction', id: faction.id, name: faction.name };
      }

      case 'world': {
        if (data.powerSystem) {
          this.deps.worldRepo.setPowerSystem(
            data.powerSystem as Parameters<typeof this.deps.worldRepo.setPowerSystem>[0]
          );
        }
        if (data.socialRules) {
          this.deps.worldRepo.setSocialRules(data.socialRules as Record<string, string>);
        }
        return { type: 'world', id: 'world', name: 'World Settings' };
      }

      case 'relationship': {
        // Resolve sourceName/targetName → sourceId/targetId
        const sourceName = data.sourceName as string;
        const targetName = data.targetName as string;
        const sourceId = charNameToId.get(this.normalizeName(sourceName));
        const targetId = charNameToId.get(this.normalizeName(targetName));

        if (!sourceId || !targetId) {
          // Can't resolve — skip silently
          return null;
        }

        const relInput: Record<string, unknown> = {
          sourceId,
          targetId,
          type: data.type as string,
        };
        if (data.joinReason !== undefined) relInput.joinReason = data.joinReason;
        if (data.independentGoal !== undefined) relInput.independentGoal = data.independentGoal;
        if (data.disagreeScenarios !== undefined)
          relInput.disagreeScenarios = data.disagreeScenarios;
        if (data.leaveScenarios !== undefined) relInput.leaveScenarios = data.leaveScenarios;
        if (data.mcNeeds !== undefined) relInput.mcNeeds = data.mcNeeds;
        if (data.evolution !== undefined) relInput.evolution = data.evolution;
        const rel = this.deps.relationshipRepo.create(
          relInput as unknown as Parameters<typeof this.deps.relationshipRepo.create>[0]
        );
        return {
          type: 'relationship',
          id: String(rel.id),
          name: `${sourceName} → ${targetName}`,
        };
      }

      case 'arc': {
        if (item.action === 'merge' && item.existingId) {
          this.deps.arcRepo.update(item.existingId, data);
          const name = (data.name as string) ?? item.existingId;
          return { type: 'arc', id: item.existingId, name };
        }
        const arcInput: Record<string, unknown> = {
          name: data.name as string,
          type: data.type as string,
        };
        if (data.status !== undefined) arcInput.status = data.status;
        if (data.mainArcRelation !== undefined) arcInput.mainArcRelation = data.mainArcRelation;
        const arc = this.deps.arcRepo.create(
          arcInput as unknown as Parameters<typeof this.deps.arcRepo.create>[0]
        );
        return { type: 'arc', id: arc.id, name: arc.name };
      }

      case 'foreshadowing': {
        const fsInput: Record<string, unknown> = {
          content: data.content as string,
        };
        if (data.plantedText !== undefined) fsInput.plantedText = data.plantedText;
        if (data.term !== undefined) fsInput.term = data.term;
        const fs = this.deps.foreshadowingRepo.create(
          fsInput as unknown as Parameters<typeof this.deps.foreshadowingRepo.create>[0]
        );
        return { type: 'foreshadowing', id: fs.id, name: fs.content.slice(0, 40) };
      }

      case 'hook': {
        const hookInput: Record<string, unknown> = {
          type: data.type as string,
          content: data.content as string,
        };
        if (data.hookType !== undefined) hookInput.hookType = data.hookType;
        if (data.strength !== undefined) hookInput.strength = data.strength;
        const hook = this.deps.hookRepo.create(
          hookInput as unknown as Parameters<typeof this.deps.hookRepo.create>[0]
        );
        return { type: 'hook', id: String(hook.id), name: hook.content.slice(0, 40) };
      }

      case 'timeline': {
        // Resolve character/location names → IDs
        const charNames = data.relatedCharacterNames as string[] | undefined;
        const locNames = data.relatedLocationNames as string[] | undefined;

        const relatedCharacters = charNames
          ?.map((name) => charNameToId.get(this.normalizeName(name)))
          .filter((id): id is string => !!id);
        const relatedLocations = locNames
          ?.map((name) => locNameToId.get(this.normalizeName(name)))
          .filter((id): id is string => !!id);

        const input: Record<string, unknown> = {
          description: data.description as string,
          eventDate: data.eventDate,
        };
        if (relatedCharacters && relatedCharacters.length > 0) {
          input.relatedCharacters = relatedCharacters;
        }
        if (relatedLocations && relatedLocations.length > 0) {
          input.relatedLocations = relatedLocations;
        }

        const event = this.deps.timelineEventRepo.create(
          input as unknown as Parameters<typeof this.deps.timelineEventRepo.create>[0]
        );
        return {
          type: 'timeline',
          id: String(event.id),
          name: (data.description as string).slice(0, 40),
        };
      }

      default:
        return null;
    }
  }
}
