/**
 * StoryBibleService - Manages story bible: characters, world, plot
 *
 * This service provides business logic for all Story Bible entities,
 * including validation, event emission, and cross-entity operations.
 *
 * Methods are async to match IStoryBibleService interface (Promise return types)
 * even though underlying repositories are synchronous. This ensures consistent
 * error handling (throws become rejected promises) and future-proofs for
 * potential async repository implementations.
 */

/* eslint-disable @typescript-eslint/require-await */

import type {
  IStoryBibleService,
  IEventBus,
  CreateCharacterInput,
  UpdateCharacterInput,
  CreateRelationshipInput,
  CreateLocationInput,
  CreateFactionInput,
  CreateTimelineEventInput,
  UpdateTimelineEventInput,
  CreateForeshadowingInput,
  UpdateForeshadowingInput,
  CreateArcInput,
  CreateHookInput,
  CharacterWithRelations,
} from '../types/services.js';
import type {
  Character,
  CharacterId,
  CharacterRole,
  Relationship,
  World,
  PowerSystem,
  Location,
  LocationId,
  Faction,
  FactionId,
  TimelineEvent,
  Arc,
  ArcId,
  Foreshadowing,
  ForeshadowingId,
  Hook,
  HookId,
  ChapterId,
} from '../types/entities.js';
import type { CharacterRepository } from '../db/repositories/CharacterRepository.js';
import type { RelationshipRepository } from '../db/repositories/RelationshipRepository.js';
import type { WorldRepository } from '../db/repositories/WorldRepository.js';
import type { LocationRepository } from '../db/repositories/LocationRepository.js';
import type { FactionRepository } from '../db/repositories/FactionRepository.js';
import type { TimelineEventRepository } from '../db/repositories/TimelineEventRepository.js';
import type { ArcRepository } from '../db/repositories/ArcRepository.js';
import type { ForeshadowingRepository } from '../db/repositories/ForeshadowingRepository.js';
import type { HookRepository } from '../db/repositories/HookRepository.js';
import type { Database } from '../db/Database.js';
import {
  EntityNotFoundError,
  ValidationError,
  ReferenceNotFoundError,
  SelfReferenceError,
  TransactionError,
} from '../errors/index.js';

/**
 * Dependencies for StoryBibleService.
 * Uses dependency injection for testability.
 */
export interface StoryBibleServiceDeps {
  db: Database;
  characterRepo: CharacterRepository;
  relationshipRepo: RelationshipRepository;
  worldRepo: WorldRepository;
  locationRepo: LocationRepository;
  factionRepo: FactionRepository;
  timelineEventRepo: TimelineEventRepository;
  arcRepo: ArcRepository;
  foreshadowingRepo: ForeshadowingRepository;
  hookRepo: HookRepository;
  eventBus: IEventBus;
}

/**
 * StoryBibleService implementation.
 *
 * @example
 * ```typescript
 * const service = new StoryBibleService({
 *   characterRepo,
 *   relationshipRepo,
 *   worldRepo,
 *   locationRepo,
 *   factionRepo,
 *   timelineEventRepo,
 *   arcRepo,
 *   foreshadowingRepo,
 *   hookRepo,
 *   eventBus,
 * });
 *
 * const character = await service.createCharacter({
 *   name: '张三',
 *   role: 'main',
 * });
 * ```
 */
export class StoryBibleService implements IStoryBibleService {
  constructor(private deps: StoryBibleServiceDeps) {}

  // ============================================
  // Characters
  // ============================================

  async createCharacter(input: CreateCharacterInput): Promise<Character> {
    // Validation
    this.validateCharacterInput(input);

    // Create
    const character = this.deps.characterRepo.create(input);

    // Emit event
    this.deps.eventBus.emit({
      type: 'CHARACTER_CREATED',
      character,
    });

    return character;
  }

  async getCharacter(id: CharacterId): Promise<Character | null> {
    return this.deps.characterRepo.findById(id);
  }

  async getCharacterWithRelations(id: CharacterId): Promise<CharacterWithRelations | null> {
    const character = this.deps.characterRepo.findById(id);
    if (!character) return null;

    const relationships = this.deps.relationshipRepo.findByCharacter(id);

    // Enrich relationships with target names
    const relationshipsWithNames = relationships.map((rel) => {
      const targetId = rel.sourceId === id ? rel.targetId : rel.sourceId;
      const target = this.deps.characterRepo.findById(targetId);
      return {
        ...rel,
        targetName: target?.name ?? 'Unknown',
      };
    });

    return {
      ...character,
      relationships: relationshipsWithNames,
    };
  }

  async getAllCharacters(): Promise<Character[]> {
    return this.deps.characterRepo.findAll();
  }

  async getCharactersByRole(role: CharacterRole): Promise<Character[]> {
    return this.deps.characterRepo.findByRole(role);
  }

  async updateCharacter(id: CharacterId, input: UpdateCharacterInput): Promise<Character> {
    const existing = this.deps.characterRepo.findById(id);
    if (!existing) {
      throw new EntityNotFoundError('Character', id);
    }

    // Validate update input
    if (input.name?.trim() === '') {
      throw new ValidationError('Character name cannot be empty', 'name');
    }

    const character = this.deps.characterRepo.update(id, input);

    this.deps.eventBus.emit({
      type: 'CHARACTER_UPDATED',
      character,
      changes: input,
    });

    return character;
  }

  async deleteCharacter(id: CharacterId): Promise<void> {
    const character = this.deps.characterRepo.findById(id);
    if (!character) {
      throw new EntityNotFoundError('Character', id);
    }

    // Use transaction to ensure atomicity
    const result = this.deps.db.transaction(() => {
      // Delete related relationships first
      this.deps.relationshipRepo.deleteByCharacter(id);
      // Delete character
      this.deps.characterRepo.delete(id);
    });

    if (!result.success) {
      throw new TransactionError('Failed to delete character', result.error);
    }

    this.deps.eventBus.emit({
      type: 'CHARACTER_DELETED',
      characterId: id,
    });
  }

  async searchCharacters(query: string): Promise<Character[]> {
    if (!query.trim()) {
      return [];
    }
    return this.deps.characterRepo.search(query);
  }

  private validateCharacterInput(input: CreateCharacterInput): void {
    if (!input.name || input.name.trim() === '') {
      throw new ValidationError('Character name is required', 'name');
    }

    if (!input.role) {
      throw new ValidationError('Character role is required', 'role');
    }

    const validRoles: CharacterRole[] = ['main', 'supporting', 'antagonist', 'mentioned'];
    if (!validRoles.includes(input.role)) {
      throw new ValidationError(`Invalid character role: ${input.role}`, 'role', {
        value: input.role,
      });
    }
  }

  // ============================================
  // Relationships
  // ============================================

  async createRelationship(input: CreateRelationshipInput): Promise<Relationship> {
    // Validation
    this.validateRelationshipInput(input);

    // Create
    const relationship = this.deps.relationshipRepo.create(input);

    this.deps.eventBus.emit({
      type: 'RELATIONSHIP_CREATED',
      relationship,
    });

    return relationship;
  }

  async getRelationship(id: number): Promise<Relationship | null> {
    return this.deps.relationshipRepo.findById(id);
  }

  async getAllRelationships(): Promise<Relationship[]> {
    return this.deps.relationshipRepo.findAll();
  }

  async getRelationshipsForCharacter(characterId: CharacterId): Promise<Relationship[]> {
    return this.deps.relationshipRepo.findByCharacter(characterId);
  }

  async updateRelationship(
    id: number,
    input: Partial<CreateRelationshipInput>
  ): Promise<Relationship> {
    const existing = this.deps.relationshipRepo.findById(id);
    if (!existing) {
      throw new EntityNotFoundError('Relationship', id);
    }

    const relationship = this.deps.relationshipRepo.update(id, input);

    this.deps.eventBus.emit({
      type: 'RELATIONSHIP_UPDATED',
      relationship,
      changes: input,
    });

    return relationship;
  }

  async deleteRelationship(id: number): Promise<void> {
    const relationship = this.deps.relationshipRepo.findById(id);
    if (!relationship) {
      throw new EntityNotFoundError('Relationship', id);
    }

    this.deps.relationshipRepo.delete(id);

    this.deps.eventBus.emit({
      type: 'RELATIONSHIP_DELETED',
      relationshipId: id,
    });
  }

  private validateRelationshipInput(input: CreateRelationshipInput): void {
    if (!input.sourceId || !input.targetId) {
      throw new ValidationError('Source and target character IDs are required');
    }

    if (input.sourceId === input.targetId) {
      throw new SelfReferenceError('Relationship', 'sourceId', 'targetId');
    }

    // Verify both characters exist
    const source = this.deps.characterRepo.findById(input.sourceId);
    const target = this.deps.characterRepo.findById(input.targetId);

    if (!source) {
      throw new ReferenceNotFoundError('Character', input.sourceId, 'sourceId');
    }
    if (!target) {
      throw new ReferenceNotFoundError('Character', input.targetId, 'targetId');
    }

    const validTypes = ['companion', 'rival', 'enemy', 'mentor', 'confidant', 'lover'] as const;
    if (!validTypes.includes(input.type)) {
      throw new ValidationError(`Invalid relationship type: ${input.type}`, 'type', {
        value: input.type,
      });
    }
  }

  // ============================================
  // World
  // ============================================

  async getWorld(): Promise<World | null> {
    return this.deps.worldRepo.get();
  }

  async updateWorld(input: Partial<World>): Promise<World> {
    const world = this.deps.worldRepo.upsert(input);

    this.deps.eventBus.emit({
      type: 'WORLD_UPDATED',
      world,
      changes: input,
    });

    return world;
  }

  async setPowerSystem(powerSystem: PowerSystem): Promise<void> {
    this.deps.worldRepo.setPowerSystem(powerSystem);

    this.deps.eventBus.emit({
      type: 'WORLD_UPDATED',
      changes: { powerSystem },
    });
  }

  async setSocialRules(rules: Record<string, string>): Promise<void> {
    this.deps.worldRepo.setSocialRules(rules);

    this.deps.eventBus.emit({
      type: 'WORLD_UPDATED',
      changes: { socialRules: rules },
    });
  }

  // ============================================
  // Locations
  // ============================================

  async createLocation(input: CreateLocationInput): Promise<Location> {
    if (!input.name || input.name.trim() === '') {
      throw new ValidationError('Location name is required', 'name');
    }

    const location = this.deps.locationRepo.create(input);

    this.deps.eventBus.emit({
      type: 'LOCATION_CREATED',
      location,
    });

    return location;
  }

  async getLocation(id: LocationId): Promise<Location | null> {
    return this.deps.locationRepo.findById(id);
  }

  async getAllLocations(): Promise<Location[]> {
    return this.deps.locationRepo.findAll();
  }

  async updateLocation(id: LocationId, input: Partial<CreateLocationInput>): Promise<Location> {
    const existing = this.deps.locationRepo.findById(id);
    if (!existing) {
      throw new EntityNotFoundError('Location', id);
    }

    if (input.name?.trim() === '') {
      throw new ValidationError('Location name cannot be empty', 'name');
    }

    const location = this.deps.locationRepo.update(id, input);

    this.deps.eventBus.emit({
      type: 'LOCATION_UPDATED',
      location,
      changes: input,
    });

    return location;
  }

  async deleteLocation(id: LocationId): Promise<void> {
    const location = this.deps.locationRepo.findById(id);
    if (!location) {
      throw new EntityNotFoundError('Location', id);
    }

    this.deps.locationRepo.delete(id);

    this.deps.eventBus.emit({
      type: 'LOCATION_DELETED',
      locationId: id,
    });
  }

  // ============================================
  // Factions
  // ============================================

  async createFaction(input: CreateFactionInput): Promise<Faction> {
    if (!input.name || input.name.trim() === '') {
      throw new ValidationError('Faction name is required', 'name');
    }

    // Validate leader exists if provided
    if (input.leaderId) {
      const leader = this.deps.characterRepo.findById(input.leaderId);
      if (!leader) {
        throw new ReferenceNotFoundError('Character', input.leaderId, 'leaderId');
      }
    }

    const faction = this.deps.factionRepo.create(input);

    this.deps.eventBus.emit({
      type: 'FACTION_CREATED',
      faction,
    });

    return faction;
  }

  async getFaction(id: FactionId): Promise<Faction | null> {
    return this.deps.factionRepo.findById(id);
  }

  async getAllFactions(): Promise<Faction[]> {
    return this.deps.factionRepo.findAll();
  }

  async updateFaction(id: FactionId, input: Partial<CreateFactionInput>): Promise<Faction> {
    const existing = this.deps.factionRepo.findById(id);
    if (!existing) {
      throw new EntityNotFoundError('Faction', id);
    }

    if (input.name?.trim() === '') {
      throw new ValidationError('Faction name cannot be empty', 'name');
    }

    // Validate leader exists if provided
    if (input.leaderId) {
      const leader = this.deps.characterRepo.findById(input.leaderId);
      if (!leader) {
        throw new ReferenceNotFoundError('Character', input.leaderId, 'leaderId');
      }
    }

    const faction = this.deps.factionRepo.update(id, input);

    this.deps.eventBus.emit({
      type: 'FACTION_UPDATED',
      faction,
      changes: input,
    });

    return faction;
  }

  async deleteFaction(id: FactionId): Promise<void> {
    const faction = this.deps.factionRepo.findById(id);
    if (!faction) {
      throw new EntityNotFoundError('Faction', id);
    }

    this.deps.factionRepo.delete(id);

    this.deps.eventBus.emit({
      type: 'FACTION_DELETED',
      factionId: id,
    });
  }

  // ============================================
  // Timeline Events
  // ============================================

  async createTimelineEvent(input: CreateTimelineEventInput): Promise<TimelineEvent> {
    if (!input.description || input.description.trim() === '') {
      throw new ValidationError('Timeline event description is required', 'description');
    }

    const event = this.deps.timelineEventRepo.create(input);

    this.deps.eventBus.emit({
      type: 'TIMELINE_EVENT_CREATED',
      event,
    });

    return event;
  }

  async getTimelineEvents(): Promise<TimelineEvent[]> {
    return this.deps.timelineEventRepo.findAll();
  }

  async updateTimelineEvent(id: number, input: UpdateTimelineEventInput): Promise<TimelineEvent> {
    const existing = this.deps.timelineEventRepo.findById(id);
    if (!existing) {
      throw new EntityNotFoundError('TimelineEvent', id);
    }

    const event = this.deps.timelineEventRepo.update(id, input);

    this.deps.eventBus.emit({
      type: 'TIMELINE_EVENT_UPDATED',
      event,
      changes: input,
    });

    return event;
  }

  async deleteTimelineEvent(id: number): Promise<void> {
    const event = this.deps.timelineEventRepo.findById(id);
    if (!event) {
      throw new EntityNotFoundError('TimelineEvent', id);
    }

    this.deps.timelineEventRepo.delete(id);

    this.deps.eventBus.emit({
      type: 'TIMELINE_EVENT_DELETED',
      eventId: id,
    });
  }

  // ============================================
  // Arcs
  // ============================================

  async createArc(input: CreateArcInput): Promise<Arc> {
    if (!input.name || input.name.trim() === '') {
      throw new ValidationError('Arc name is required', 'name');
    }

    const arc = this.deps.arcRepo.create(input);

    this.deps.eventBus.emit({
      type: 'ARC_CREATED',
      arc,
    });

    return arc;
  }

  async getArc(id: ArcId): Promise<Arc | null> {
    return this.deps.arcRepo.findById(id);
  }

  async getAllArcs(): Promise<Arc[]> {
    return this.deps.arcRepo.findAll();
  }

  async updateArc(id: ArcId, input: Partial<CreateArcInput> & { progress?: number }): Promise<Arc> {
    const existing = this.deps.arcRepo.findById(id);
    if (!existing) {
      throw new EntityNotFoundError('Arc', id);
    }

    if (input.name?.trim() === '') {
      throw new ValidationError('Arc name cannot be empty', 'name');
    }

    const arc = this.deps.arcRepo.update(id, input);

    this.deps.eventBus.emit({
      type: 'ARC_UPDATED',
      arc,
      changes: input,
    });

    return arc;
  }

  async deleteArc(id: ArcId): Promise<void> {
    const arc = this.deps.arcRepo.findById(id);
    if (!arc) {
      throw new EntityNotFoundError('Arc', id);
    }

    this.deps.arcRepo.delete(id);

    this.deps.eventBus.emit({
      type: 'ARC_DELETED',
      arcId: id,
    });
  }

  // ============================================
  // Foreshadowing
  // ============================================

  async createForeshadowing(input: CreateForeshadowingInput): Promise<Foreshadowing> {
    if (!input.content || input.content.trim() === '') {
      throw new ValidationError('Foreshadowing content is required', 'content');
    }

    const foreshadowing = this.deps.foreshadowingRepo.create(input);

    this.deps.eventBus.emit({
      type: 'FORESHADOWING_CREATED',
      foreshadowing,
    });

    return foreshadowing;
  }

  async getForeshadowing(id: ForeshadowingId): Promise<Foreshadowing | null> {
    return this.deps.foreshadowingRepo.findById(id);
  }

  async getAllForeshadowing(): Promise<Foreshadowing[]> {
    return this.deps.foreshadowingRepo.findAll();
  }

  async getActiveForeshadowing(): Promise<Foreshadowing[]> {
    return this.deps.foreshadowingRepo.findActive();
  }

  async addForeshadowingHint(
    id: ForeshadowingId,
    chapter: ChapterId,
    text: string
  ): Promise<Foreshadowing> {
    const foreshadowing = this.deps.foreshadowingRepo.addHint(id, chapter, text);

    this.deps.eventBus.emit({
      type: 'FORESHADOWING_HINT_ADDED',
      foreshadowing,
      hintChapter: chapter,
    });

    return foreshadowing;
  }

  async resolveForeshadowing(
    id: ForeshadowingId,
    resolvedChapter: ChapterId
  ): Promise<Foreshadowing> {
    const foreshadowing = this.deps.foreshadowingRepo.resolve(id, resolvedChapter);

    this.deps.eventBus.emit({
      type: 'FORESHADOWING_RESOLVED',
      foreshadowing,
      resolvedChapter,
    });

    return foreshadowing;
  }

  async abandonForeshadowing(id: ForeshadowingId): Promise<Foreshadowing> {
    const foreshadowing = this.deps.foreshadowingRepo.abandon(id);

    this.deps.eventBus.emit({
      type: 'FORESHADOWING_ABANDONED',
      foreshadowing,
    });

    return foreshadowing;
  }

  async updateForeshadowing(
    id: ForeshadowingId,
    input: UpdateForeshadowingInput
  ): Promise<Foreshadowing> {
    const existing = this.deps.foreshadowingRepo.findById(id);
    if (!existing) {
      throw new EntityNotFoundError('Foreshadowing', id);
    }

    // Handle status changes via dedicated methods
    if (input.status && input.status !== existing.status) {
      if (input.status === 'resolved') {
        // resolve requires resolvedChapter; ignore status-only change if not provided
        // The resolve action is handled via resolveForeshadowing
      } else if (input.status === 'abandoned') {
        this.deps.foreshadowingRepo.abandon(id);
      } else if (input.status === 'active') {
        if (existing.status === 'abandoned') {
          this.deps.foreshadowingRepo.reactivate(id);
        }
      }
    }

    // Update basic fields via repository
    const { status: _status, ...fieldsToUpdate } = input;
    if (Object.keys(fieldsToUpdate).length > 0) {
      this.deps.foreshadowingRepo.update(id, fieldsToUpdate);
    }

    const foreshadowing = this.deps.foreshadowingRepo.findById(id)!;

    this.deps.eventBus.emit({
      type: 'FORESHADOWING_UPDATED',
      foreshadowing,
      changes: input,
    });

    return foreshadowing;
  }

  async deleteForeshadowing(id: ForeshadowingId): Promise<void> {
    const existing = this.deps.foreshadowingRepo.findById(id);
    if (!existing) {
      throw new EntityNotFoundError('Foreshadowing', id);
    }

    this.deps.foreshadowingRepo.delete(id);

    this.deps.eventBus.emit({
      type: 'FORESHADOWING_DELETED',
      foreshadowingId: id,
    });
  }

  // ============================================
  // Hooks
  // ============================================

  async createHook(input: CreateHookInput): Promise<Hook> {
    if (!input.content || input.content.trim() === '') {
      throw new ValidationError('Hook content is required', 'content');
    }

    const validTypes = ['opening', 'arc', 'chapter'] as const;
    if (!validTypes.includes(input.type)) {
      throw new ValidationError(`Invalid hook type: ${input.type}`, 'type', { value: input.type });
    }

    const hook = this.deps.hookRepo.create(input);

    this.deps.eventBus.emit({
      type: 'HOOK_CREATED',
      hook,
    });

    return hook;
  }

  async getHook(id: HookId): Promise<Hook | null> {
    return this.deps.hookRepo.findById(id);
  }

  async getAllHooks(): Promise<Hook[]> {
    return this.deps.hookRepo.findAll();
  }

  async getHooksForChapter(chapterId: ChapterId): Promise<Hook[]> {
    return this.deps.hookRepo.findByChapter(chapterId);
  }

  async updateHook(id: HookId, input: Partial<CreateHookInput>): Promise<Hook> {
    const existing = this.deps.hookRepo.findById(id);
    if (!existing) {
      throw new EntityNotFoundError('Hook', id);
    }

    if (input.content?.trim() === '') {
      throw new ValidationError('Hook content cannot be empty', 'content');
    }

    const hook = this.deps.hookRepo.update(id, input);

    this.deps.eventBus.emit({
      type: 'HOOK_UPDATED',
      hook,
      changes: input,
    });

    return hook;
  }

  async deleteHook(id: HookId): Promise<void> {
    const hook = this.deps.hookRepo.findById(id);
    if (!hook) {
      throw new EntityNotFoundError('Hook', id);
    }

    this.deps.hookRepo.delete(id);

    this.deps.eventBus.emit({
      type: 'HOOK_DELETED',
      hookId: id,
    });
  }
}
