/**
 * Mock StoryBibleService
 *
 * In-memory implementation for testing and parallel development.
 * Conforms to IStoryBibleService interface.
 */

import type {
  IStoryBibleService,
  CreateCharacterInput,
  UpdateCharacterInput,
  CreateRelationshipInput,
  CreateForeshadowingInput,
  UpdateForeshadowingInput,
  CreateArcInput,
  CreateHookInput,
  UpdateTimelineEventInput,
  CharacterWithRelations,
} from '../../types/services.js';

import type {
  Character,
  CharacterId,
  CharacterRole,
  Relationship,
  Location,
  LocationId,
  Faction,
  FactionId,
  World,
  PowerSystem,
  Arc,
  ArcId,
  Foreshadowing,
  ForeshadowingId,
  Hook,
  HookId,
  ChapterId,
  TimelineEvent,
} from '../../types/entities.js';

export class MockStoryBibleService implements IStoryBibleService {
  private characters: Map<CharacterId, Character> = new Map();
  private relationships: Map<number, Relationship> = new Map();
  private locations: Map<LocationId, Location> = new Map();
  private factions: Map<FactionId, Faction> = new Map();
  private arcs: Map<ArcId, Arc> = new Map();
  private foreshadowing: Map<ForeshadowingId, Foreshadowing> = new Map();
  private hooks: Map<HookId, Hook> = new Map();
  private timelineEvents: Map<number, TimelineEvent> = new Map();
  private world: World | null = null;

  private nextRelationshipId = 1;
  private nextTimelineEventId = 1;
  private nextCharacterId = 1;

  private now(): string {
    return new Date().toISOString();
  }

  private generateCharacterId(): CharacterId {
    return `C${String(this.nextCharacterId++).padStart(3, '0')}`;
  }

  // === Characters ===

  async createCharacter(input: CreateCharacterInput): Promise<Character> {
    const id = this.generateCharacterId();
    const character: Character = {
      id,
      name: input.name,
      role: input.role,
      appearance: input.appearance,
      voiceSamples: input.voiceSamples,
      motivation: input.motivation,
      conflictType: input.conflictType,
      template: input.template,
      firstAppearance: input.firstAppearance,
      createdAt: this.now(),
      updatedAt: this.now(),
    };
    this.characters.set(id, character);
    return character;
  }

  async getCharacter(id: CharacterId): Promise<Character | null> {
    return this.characters.get(id) ?? null;
  }

  async getCharacterWithRelations(id: CharacterId): Promise<CharacterWithRelations | null> {
    const character = this.characters.get(id);
    if (!character) return null;

    const relationships: Array<Relationship & { targetName: string }> = [];
    for (const rel of this.relationships.values()) {
      if (rel.sourceId === id || rel.targetId === id) {
        const targetId = rel.sourceId === id ? rel.targetId : rel.sourceId;
        const target = this.characters.get(targetId);
        relationships.push({
          ...rel,
          targetName: target?.name ?? 'Unknown',
        });
      }
    }

    return { ...character, relationships };
  }

  async getAllCharacters(): Promise<Character[]> {
    return Array.from(this.characters.values());
  }

  async getCharactersByRole(role: CharacterRole): Promise<Character[]> {
    return Array.from(this.characters.values()).filter((c) => c.role === role);
  }

  async updateCharacter(id: CharacterId, input: UpdateCharacterInput): Promise<Character> {
    const character = this.characters.get(id);
    if (!character) {
      throw new Error(`Character not found: ${id}`);
    }

    const updated: Character = {
      ...character,
      ...input,
      updatedAt: this.now(),
    };
    this.characters.set(id, updated);
    return updated;
  }

  async deleteCharacter(id: CharacterId): Promise<void> {
    this.characters.delete(id);
    // Also delete relationships involving this character
    for (const [relId, rel] of this.relationships) {
      if (rel.sourceId === id || rel.targetId === id) {
        this.relationships.delete(relId);
      }
    }
  }

  async searchCharacters(query: string): Promise<Character[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.characters.values()).filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.appearance?.toLowerCase().includes(lowerQuery)
    );
  }

  // === Relationships ===

  async createRelationship(input: CreateRelationshipInput): Promise<Relationship> {
    const id = this.nextRelationshipId++;
    const relationship: Relationship = {
      id,
      sourceId: input.sourceId,
      targetId: input.targetId,
      type: input.type,
      joinReason: input.joinReason,
      independentGoal: input.independentGoal,
      disagreeScenarios: input.disagreeScenarios,
      leaveScenarios: input.leaveScenarios,
      mcNeeds: input.mcNeeds,
      createdAt: this.now(),
      updatedAt: this.now(),
    };
    this.relationships.set(id, relationship);
    return relationship;
  }

  async getRelationship(id: number): Promise<Relationship | null> {
    return this.relationships.get(id) ?? null;
  }

  async getAllRelationships(): Promise<Relationship[]> {
    return Array.from(this.relationships.values());
  }

  async getRelationshipsForCharacter(characterId: CharacterId): Promise<Relationship[]> {
    return Array.from(this.relationships.values()).filter(
      (r) => r.sourceId === characterId || r.targetId === characterId
    );
  }

  async updateRelationship(
    id: number,
    input: Partial<CreateRelationshipInput>
  ): Promise<Relationship> {
    const relationship = this.relationships.get(id);
    if (!relationship) {
      throw new Error(`Relationship not found: ${id}`);
    }

    const updated: Relationship = {
      ...relationship,
      ...input,
      updatedAt: this.now(),
    };
    this.relationships.set(id, updated);
    return updated;
  }

  async deleteRelationship(id: number): Promise<void> {
    this.relationships.delete(id);
  }

  // === World ===

  async getWorld(): Promise<World | null> {
    return this.world;
  }

  async updateWorld(input: Partial<World>): Promise<World> {
    if (!this.world) {
      this.world = {
        id: 'main',
        createdAt: this.now(),
        updatedAt: this.now(),
      };
    }

    this.world = {
      ...this.world,
      ...input,
      updatedAt: this.now(),
    };
    return this.world;
  }

  async setPowerSystem(powerSystem: PowerSystem): Promise<void> {
    await this.updateWorld({ powerSystem });
  }

  async setSocialRules(rules: Record<string, string>): Promise<void> {
    await this.updateWorld({ socialRules: rules });
  }

  // === Locations ===

  async createLocation(input: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> {
    const id = `L${String(this.locations.size + 1).padStart(3, '0')}`;
    const location: Location = {
      ...input,
      id,
      createdAt: this.now(),
      updatedAt: this.now(),
    };
    this.locations.set(id, location);
    return location;
  }

  async getLocation(id: LocationId): Promise<Location | null> {
    return this.locations.get(id) ?? null;
  }

  async getAllLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }

  async updateLocation(id: LocationId, input: Partial<Location>): Promise<Location> {
    const location = this.locations.get(id);
    if (!location) {
      throw new Error(`Location not found: ${id}`);
    }

    const updated: Location = {
      ...location,
      ...input,
      updatedAt: this.now(),
    };
    this.locations.set(id, updated);
    return updated;
  }

  async deleteLocation(id: LocationId): Promise<void> {
    this.locations.delete(id);
  }

  // === Factions ===

  async createFaction(input: Omit<Faction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Faction> {
    const id = `F${String(this.factions.size + 1).padStart(3, '0')}`;
    const faction: Faction = {
      ...input,
      id,
      createdAt: this.now(),
      updatedAt: this.now(),
    };
    this.factions.set(id, faction);
    return faction;
  }

  async getFaction(id: FactionId): Promise<Faction | null> {
    return this.factions.get(id) ?? null;
  }

  async getAllFactions(): Promise<Faction[]> {
    return Array.from(this.factions.values());
  }

  async updateFaction(id: FactionId, input: Partial<Faction>): Promise<Faction> {
    const faction = this.factions.get(id);
    if (!faction) {
      throw new Error(`Faction not found: ${id}`);
    }

    const updated: Faction = {
      ...faction,
      ...input,
      updatedAt: this.now(),
    };
    this.factions.set(id, updated);
    return updated;
  }

  async deleteFaction(id: FactionId): Promise<void> {
    this.factions.delete(id);
  }

  // === Timeline ===

  async createTimelineEvent(
    input: Omit<TimelineEvent, 'id' | 'createdAt'>
  ): Promise<TimelineEvent> {
    const id = this.nextTimelineEventId++;
    const event: TimelineEvent = {
      ...input,
      id,
      createdAt: this.now(),
    };
    this.timelineEvents.set(id, event);
    return event;
  }

  async getTimelineEvents(): Promise<TimelineEvent[]> {
    return Array.from(this.timelineEvents.values());
  }

  async updateTimelineEvent(id: number, input: UpdateTimelineEventInput): Promise<TimelineEvent> {
    const event = this.timelineEvents.get(id);
    if (!event) {
      throw new Error(`Timeline event not found: ${id}`);
    }

    const updated: TimelineEvent = { ...event };
    if (input.eventDate !== undefined) updated.eventDate = input.eventDate;
    if (input.description !== undefined) updated.description = input.description;

    this.timelineEvents.set(id, updated);
    return updated;
  }

  async deleteTimelineEvent(id: number): Promise<void> {
    this.timelineEvents.delete(id);
  }

  // === Arcs ===

  async createArc(input: CreateArcInput): Promise<Arc> {
    const id = `ARC${String(this.arcs.size + 1).padStart(3, '0')}`;
    const arc: Arc = {
      id,
      name: input.name,
      type: input.type,
      status: input.status ?? 'planned',
      progress: 0,
      chapterStart: input.chapterStart,
      chapterEnd: input.chapterEnd,
      sections: input.sections,
      characterArcs: input.characterArcs,
      mainArcRelation: input.mainArcRelation,
      createdAt: this.now(),
      updatedAt: this.now(),
    };
    this.arcs.set(id, arc);
    return arc;
  }

  async getArc(id: ArcId): Promise<Arc | null> {
    return this.arcs.get(id) ?? null;
  }

  async getAllArcs(): Promise<Arc[]> {
    return Array.from(this.arcs.values());
  }

  async updateArc(id: ArcId, input: Partial<CreateArcInput> & { progress?: number }): Promise<Arc> {
    const arc = this.arcs.get(id);
    if (!arc) {
      throw new Error(`Arc not found: ${id}`);
    }

    const updated: Arc = {
      ...arc,
      ...input,
      updatedAt: this.now(),
    };
    this.arcs.set(id, updated);
    return updated;
  }

  async deleteArc(id: ArcId): Promise<void> {
    this.arcs.delete(id);
  }

  // === Foreshadowing ===

  async createForeshadowing(input: CreateForeshadowingInput): Promise<Foreshadowing> {
    const id = `FS${String(this.foreshadowing.size + 1).padStart(3, '0')}`;
    const fs: Foreshadowing = {
      id,
      content: input.content,
      plantedChapter: input.plantedChapter,
      plantedText: input.plantedText,
      plannedPayoff: input.plannedPayoff,
      term: input.term,
      status: 'active',
      createdAt: this.now(),
      updatedAt: this.now(),
    };
    this.foreshadowing.set(id, fs);
    return fs;
  }

  async getForeshadowing(id: ForeshadowingId): Promise<Foreshadowing | null> {
    return this.foreshadowing.get(id) ?? null;
  }

  async getAllForeshadowing(): Promise<Foreshadowing[]> {
    return Array.from(this.foreshadowing.values());
  }

  async getActiveForeshadowing(): Promise<Foreshadowing[]> {
    return Array.from(this.foreshadowing.values()).filter((f) => f.status === 'active');
  }

  async addForeshadowingHint(
    id: ForeshadowingId,
    chapter: ChapterId,
    text: string
  ): Promise<Foreshadowing> {
    const fs = this.foreshadowing.get(id);
    if (!fs) {
      throw new Error(`Foreshadowing not found: ${id}`);
    }

    const hints = fs.hints ?? [];
    hints.push({ chapter, text });

    const updated: Foreshadowing = {
      ...fs,
      hints,
      updatedAt: this.now(),
    };
    this.foreshadowing.set(id, updated);
    return updated;
  }

  async resolveForeshadowing(
    id: ForeshadowingId,
    resolvedChapter: ChapterId
  ): Promise<Foreshadowing> {
    const fs = this.foreshadowing.get(id);
    if (!fs) {
      throw new Error(`Foreshadowing not found: ${id}`);
    }

    const updated: Foreshadowing = {
      ...fs,
      status: 'resolved',
      resolvedChapter,
      updatedAt: this.now(),
    };
    this.foreshadowing.set(id, updated);
    return updated;
  }

  async abandonForeshadowing(id: ForeshadowingId): Promise<Foreshadowing> {
    const fs = this.foreshadowing.get(id);
    if (!fs) {
      throw new Error(`Foreshadowing not found: ${id}`);
    }

    const updated: Foreshadowing = {
      ...fs,
      status: 'abandoned',
      updatedAt: this.now(),
    };
    this.foreshadowing.set(id, updated);
    return updated;
  }

  async updateForeshadowing(
    id: ForeshadowingId,
    input: UpdateForeshadowingInput
  ): Promise<Foreshadowing> {
    const fs = this.foreshadowing.get(id);
    if (!fs) {
      throw new Error(`Foreshadowing not found: ${id}`);
    }

    const updated: Foreshadowing = {
      ...fs,
      ...input,
      updatedAt: this.now(),
    };
    this.foreshadowing.set(id, updated);
    return updated;
  }

  async deleteForeshadowing(id: ForeshadowingId): Promise<void> {
    this.foreshadowing.delete(id);
  }

  // === Hooks ===

  async createHook(input: CreateHookInput): Promise<Hook> {
    const id = `HK${String(this.hooks.size + 1).padStart(3, '0')}`;
    const hook: Hook = {
      id,
      type: input.type,
      content: input.content,
      chapterId: input.chapterId,
      hookType: input.hookType,
      strength: input.strength,
      createdAt: this.now(),
    };
    this.hooks.set(id, hook);
    return hook;
  }

  async getHook(id: HookId): Promise<Hook | null> {
    return this.hooks.get(id) ?? null;
  }

  async getAllHooks(): Promise<Hook[]> {
    return Array.from(this.hooks.values());
  }

  async getHooksForChapter(chapterId: ChapterId): Promise<Hook[]> {
    return Array.from(this.hooks.values()).filter((h) => h.chapterId === chapterId);
  }

  async updateHook(id: HookId, input: Partial<CreateHookInput>): Promise<Hook> {
    const hook = this.hooks.get(id);
    if (!hook) {
      throw new Error(`Hook not found: ${id}`);
    }

    const updated: Hook = {
      ...hook,
      ...input,
    };
    this.hooks.set(id, updated);
    return updated;
  }

  async deleteHook(id: HookId): Promise<void> {
    this.hooks.delete(id);
  }

  // === Test Helpers ===

  reset(): void {
    this.characters.clear();
    this.relationships.clear();
    this.locations.clear();
    this.factions.clear();
    this.arcs.clear();
    this.foreshadowing.clear();
    this.hooks.clear();
    this.timelineEvents.clear();
    this.world = null;
    this.nextRelationshipId = 1;
    this.nextTimelineEventId = 1;
    this.nextCharacterId = 1;
  }
}
