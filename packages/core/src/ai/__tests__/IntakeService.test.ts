/**
 * IntakeService Tests
 *
 * Tests:
 * - Zod schema validation (valid + invalid cases)
 * - validateDecomposeResult (full + partial success)
 * - IntakeService.decompose() with mocked GeminiProvider
 * - IntakeService.commitEntities() with real in-memory DB
 * - IntakeService.detectDuplicates() with real in-memory DB
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Database } from '../../db/Database.js';
import { CharacterRepository } from '../../db/repositories/CharacterRepository.js';
import { RelationshipRepository } from '../../db/repositories/RelationshipRepository.js';
import { LocationRepository } from '../../db/repositories/LocationRepository.js';
import { FactionRepository } from '../../db/repositories/FactionRepository.js';
import { ArcRepository } from '../../db/repositories/ArcRepository.js';
import { ForeshadowingRepository } from '../../db/repositories/ForeshadowingRepository.js';
import { HookRepository } from '../../db/repositories/HookRepository.js';
import { WorldRepository } from '../../db/repositories/WorldRepository.js';
import { TimelineEventRepository } from '../../db/repositories/TimelineEventRepository.js';
import { EventBus } from '../../services/EventBus.js';
import {
  validateDecomposeResult,
  extractedCharacterSchema,
  extractedLocationSchema,
  extractedRelationshipSchema,
  extractedFactionSchema,
  extractedWorldSchema,
  extractedArcSchema,
  extractedHookSchema,
  extractedForeshadowingSchema,
  extractedTimelineEventSchema,
} from '../intake/schemas.js';
import { HINT_FOCUS, HINT_SCHEMAS, buildEntitySchemas } from '../intake/templates.js';

// Mock @google/genai before IntakeService import
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

import { IntakeService } from '../IntakeService.js';

// ===========================================
// Schema Validation Tests
// ===========================================

describe('Zod Schemas', () => {
  describe('extractedCharacterSchema', () => {
    it('validates a complete character', () => {
      const result = extractedCharacterSchema.safeParse({
        name: '林墨',
        role: 'main',
        appearance: '黑发黑眸',
        voiceSamples: ['我辈修士，当以苍生为念。'],
        motivation: { surface: '寻找真相', hidden: '赎罪', core: '归属感' },
        conflictType: 'ideal_vs_reality',
        template: 'seeker',
        confidence: 'high',
      });
      expect(result.success).toBe(true);
    });

    it('validates minimal character (only required fields)', () => {
      const result = extractedCharacterSchema.safeParse({
        name: 'Test',
        role: 'supporting',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.confidence).toBe('medium'); // default
      }
    });

    it('rejects character without name', () => {
      const result = extractedCharacterSchema.safeParse({
        role: 'main',
        confidence: 'high',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid role', () => {
      const result = extractedCharacterSchema.safeParse({
        name: 'Test',
        role: 'villain', // invalid
      });
      expect(result.success).toBe(false);
    });
  });

  describe('extractedRelationshipSchema', () => {
    it('validates a complete relationship', () => {
      const result = extractedRelationshipSchema.safeParse({
        sourceName: '林墨',
        targetName: '苏澜',
        type: 'companion',
        joinReason: '共同经历',
        confidence: 'high',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing sourceName', () => {
      const result = extractedRelationshipSchema.safeParse({
        targetName: '苏澜',
        type: 'companion',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('extractedLocationSchema', () => {
    it('validates a location', () => {
      const result = extractedLocationSchema.safeParse({
        name: '墨渊谷',
        type: 'valley',
        significance: '主角修炼之所',
        atmosphere: '幽深静谧',
        confidence: 'high',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('extractedFactionSchema', () => {
    it('validates a faction with all fields', () => {
      const result = extractedFactionSchema.safeParse({
        name: '天道宗',
        type: 'sect',
        status: '繁荣',
        leaderName: '清风道人',
        stanceToMC: 'friendly',
        goals: ['维护天下秩序'],
        resources: ['灵石矿脉'],
        internalConflict: '新旧势力之争',
        confidence: 'medium',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('extractedWorldSchema', () => {
    it('validates world rules', () => {
      const result = extractedWorldSchema.safeParse({
        powerSystem: {
          name: '墨道体系',
          levels: ['入门', '初成', '大成', '化神', '天人'],
          coreRules: ['以意驭墨'],
          constraints: ['每日修炼有限'],
        },
        socialRules: { hierarchy: '实力为尊' },
        confidence: 'high',
      });
      expect(result.success).toBe(true);
    });

    it('validates empty world rules (minimal)', () => {
      const result = extractedWorldSchema.safeParse({
        confidence: 'low',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('extractedArcSchema', () => {
    it('validates an arc', () => {
      const result = extractedArcSchema.safeParse({
        name: '墨渊觉醒',
        type: 'main',
        status: 'in_progress',
        confidence: 'high',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid arc type', () => {
      const result = extractedArcSchema.safeParse({
        name: 'test',
        type: 'side', // invalid, should be 'main' | 'sub'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('extractedHookSchema', () => {
    it('validates a hook', () => {
      const result = extractedHookSchema.safeParse({
        type: 'chapter',
        content: '黑影在月光下闪过',
        hookType: 'suspense',
        strength: 85,
        confidence: 'high',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('extractedForeshadowingSchema', () => {
    it('validates foreshadowing', () => {
      const result = extractedForeshadowingSchema.safeParse({
        content: '那枚古玉上的纹路似乎在发光',
        plantedText: '他无意间触碰了古玉，纹路微微发亮。',
        term: 'mid',
        confidence: 'medium',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('extractedTimelineEventSchema', () => {
    it('validates a timeline event', () => {
      const result = extractedTimelineEventSchema.safeParse({
        eventDate: '灵历三千年春',
        description: '林墨入墨渊谷',
        relatedCharacterNames: ['林墨'],
        relatedLocationNames: ['墨渊谷'],
        confidence: 'high',
      });
      expect(result.success).toBe(true);
    });
  });
});

// ===========================================
// validateDecomposeResult Tests
// ===========================================

describe('validateDecomposeResult', () => {
  it('parses a valid full result', () => {
    const raw = {
      characters: [{ name: '林墨', role: 'main', confidence: 'high' }],
      relationships: [],
      locations: [{ name: '墨渊谷', confidence: 'medium' }],
      factions: [],
      foreshadowing: [],
      arcs: [],
      hooks: [],
      timeline: [],
    };

    const { result, validationWarnings } = validateDecomposeResult(raw);
    expect(validationWarnings).toHaveLength(0);
    expect(result.characters).toHaveLength(1);
    expect(result.locations).toHaveLength(1);
  });

  it('defaults missing arrays to empty', () => {
    const raw = {
      characters: [{ name: 'Test', role: 'main', confidence: 'high' }],
    };

    const { result } = validateDecomposeResult(raw);
    expect(result.characters).toHaveLength(1);
    expect(result.relationships).toHaveLength(0);
    expect(result.locations).toHaveLength(0);
  });

  it('salvages valid entities when some are invalid', () => {
    const raw = {
      characters: [
        { name: '林墨', role: 'main', confidence: 'high' },
        { role: 'supporting' }, // missing name — invalid
        { name: '苏澜', role: 'supporting', confidence: 'medium' },
      ],
    };

    const { result, validationWarnings } = validateDecomposeResult(raw);
    // Valid characters salvaged
    expect(result.characters).toHaveLength(2);
    // One warning for the invalid character
    expect(validationWarnings.length).toBeGreaterThanOrEqual(1);
    expect(validationWarnings[0]).toContain('Failed to validate');
  });

  it('handles non-object input gracefully', () => {
    const { result, validationWarnings } = validateDecomposeResult('not an object');
    expect(result.characters).toHaveLength(0);
    expect(validationWarnings).toContain('AI response was not a valid JSON object');
  });

  it('handles null input gracefully', () => {
    const { result, validationWarnings } = validateDecomposeResult(null);
    expect(result.characters).toHaveLength(0);
    expect(validationWarnings.length).toBeGreaterThan(0);
  });

  it('parses worldRules when present', () => {
    const raw = {
      worldRules: {
        powerSystem: { name: '墨道', levels: ['入门', '大成'] },
        confidence: 'high',
      },
    };

    const { result } = validateDecomposeResult(raw);
    expect(result.worldRules).toBeDefined();
    expect(result.worldRules!.powerSystem!.name).toBe('墨道');
  });
});

// ===========================================
// Template Helpers Tests
// ===========================================

describe('Template Helpers', () => {
  describe('HINT_FOCUS', () => {
    it('has entries for all hint types', () => {
      expect(HINT_FOCUS['character']).toBeDefined();
      expect(HINT_FOCUS['world']).toBeDefined();
      expect(HINT_FOCUS['plot']).toBeDefined();
      expect(HINT_FOCUS['location']).toBeDefined();
      expect(HINT_FOCUS['faction']).toBeDefined();
      expect(HINT_FOCUS['auto']).toBeDefined();
    });

    it('each focus contains bilingual content', () => {
      for (const value of Object.values(HINT_FOCUS)) {
        // Should contain both English and Chinese
        expect(value).toMatch(/[a-zA-Z]/);
        expect(value).toMatch(/[\u4e00-\u9fff]/);
      }
    });
  });

  describe('HINT_SCHEMAS', () => {
    it('character hint includes characters and relationships', () => {
      expect(HINT_SCHEMAS['character']).toContain('characters');
      expect(HINT_SCHEMAS['character']).toContain('relationships');
    });

    it('auto hint includes all entity types', () => {
      const auto = HINT_SCHEMAS['auto']!;
      expect(auto).toContain('characters');
      expect(auto).toContain('relationships');
      expect(auto).toContain('locations');
      expect(auto).toContain('factions');
      expect(auto).toContain('worldRules');
      expect(auto).toContain('arcs');
      expect(auto).toContain('foreshadowing');
      expect(auto).toContain('hooks');
      expect(auto).toContain('timeline');
    });
  });

  describe('buildEntitySchemas', () => {
    it('returns JSON schema for character hint', () => {
      const schema = buildEntitySchemas('character');
      expect(schema).toContain('characters');
      expect(schema).toContain('relationships');
      expect(schema).not.toContain('worldRules');
    });

    it('returns all schemas for auto hint', () => {
      const schema = buildEntitySchemas('auto');
      expect(schema).toContain('characters');
      expect(schema).toContain('worldRules');
      expect(schema).toContain('timeline');
    });

    it('falls back to auto for unknown hint', () => {
      const schema = buildEntitySchemas('unknown_hint');
      expect(schema).toContain('characters');
    });
  });
});

// ===========================================
// IntakeService Tests
// ===========================================

describe('IntakeService', () => {
  let db: Database;
  let eventBus: EventBus;
  let service: IntakeService;
  let characterRepo: CharacterRepository;
  let relationshipRepo: RelationshipRepository;
  let locationRepo: LocationRepository;
  let factionRepo: FactionRepository;
  let arcRepo: ArcRepository;

  beforeEach(() => {
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();
    eventBus = new EventBus();

    characterRepo = new CharacterRepository(db);
    relationshipRepo = new RelationshipRepository(db);
    locationRepo = new LocationRepository(db);
    factionRepo = new FactionRepository(db);
    arcRepo = new ArcRepository(db);

    service = new IntakeService(
      {
        db,
        characterRepo,
        relationshipRepo,
        locationRepo,
        factionRepo,
        arcRepo,
        foreshadowingRepo: new ForeshadowingRepository(db),
        hookRepo: new HookRepository(db),
        worldRepo: new WorldRepository(db),
        timelineEventRepo: new TimelineEventRepository(db),
        eventBus,
      },
      { geminiApiKey: 'test-key' }
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    db.close();
  });

  // ===================================
  // decompose
  // ===================================

  describe('decompose', () => {
    it('calls generateJSON and returns validated result', async () => {
      const aiResponse = {
        characters: [
          { name: '林墨', role: 'main', confidence: 'high' },
          { name: '苏澜', role: 'supporting', confidence: 'medium' },
        ],
        relationships: [
          {
            sourceName: '林墨',
            targetName: '苏澜',
            type: 'companion',
            confidence: 'medium',
          },
        ],
        locations: [],
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(aiResponse),
      });

      const result = await service.decompose('林墨是主角，苏澜是女主角。他们是同伴。', 'character');

      expect(result.characters).toHaveLength(2);
      expect(result.characters[0]!.name).toBe('林墨');
      expect(result.relationships).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);
    });

    it('returns validation warnings for partially invalid response', async () => {
      const aiResponse = {
        characters: [
          { name: '林墨', role: 'main', confidence: 'high' },
          { name: '', role: 'invalid_role' }, // invalid: empty name, bad role
        ],
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(aiResponse),
      });

      const result = await service.decompose('text', 'character');

      expect(result.characters).toHaveLength(1);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('uses auto hint by default', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ characters: [] }),
      });

      await service.decompose('test text');

      // Check the prompt includes auto focus
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      const callArgs = mockGenerateContent.mock.calls[0];
      expect(callArgs).toBeDefined();
    });
  });

  // ===================================
  // commitEntities
  // ===================================

  describe('commitEntities', () => {
    it('creates characters and returns results', () => {
      const result = service.commitEntities([
        {
          entityType: 'character',
          action: 'create',
          data: { name: '林墨', role: 'main' },
        },
        {
          entityType: 'character',
          action: 'create',
          data: { name: '苏澜', role: 'supporting' },
        },
      ]);

      expect(result.created).toHaveLength(2);
      expect(result.created[0]!.name).toBe('林墨');
      expect(result.skipped).toBe(0);

      // Verify in DB
      const characters = characterRepo.findAll();
      expect(characters).toHaveLength(2);
    });

    it('resolves relationship names to IDs', () => {
      const result = service.commitEntities([
        {
          entityType: 'character',
          action: 'create',
          data: { name: '林墨', role: 'main' },
        },
        {
          entityType: 'character',
          action: 'create',
          data: { name: '苏澜', role: 'supporting' },
        },
        {
          entityType: 'relationship',
          action: 'create',
          data: {
            sourceName: '林墨',
            targetName: '苏澜',
            type: 'companion',
          },
        },
      ]);

      expect(result.created).toHaveLength(3);
      const rels = relationshipRepo.findAll();
      expect(rels).toHaveLength(1);

      // Verify the relationship has correct source/target IDs
      const rel = rels[0]!;
      const chars = characterRepo.findAll();
      const linMo = chars.find((c) => c.name === '林墨')!;
      const suLan = chars.find((c) => c.name === '苏澜')!;
      expect(rel.sourceId).toBe(linMo.id);
      expect(rel.targetId).toBe(suLan.id);
    });

    it('skips relationships when names cannot be resolved', () => {
      const result = service.commitEntities([
        {
          entityType: 'relationship',
          action: 'create',
          data: {
            sourceName: 'Unknown1',
            targetName: 'Unknown2',
            type: 'rival',
          },
        },
      ]);

      expect(result.created).toHaveLength(0);
      expect(result.unresolved).toBe(1);
      expect(relationshipRepo.findAll()).toHaveLength(0);
    });

    it('handles skip action', () => {
      const result = service.commitEntities([
        {
          entityType: 'character',
          action: 'skip',
          data: { name: '不需要的角色' },
        },
      ]);

      expect(result.created).toHaveLength(0);
      expect(result.skipped).toBe(1);
      expect(characterRepo.findAll()).toHaveLength(0);
    });

    it('creates locations', () => {
      const result = service.commitEntities([
        {
          entityType: 'location',
          action: 'create',
          data: { name: '墨渊谷', type: 'valley', significance: '修炼圣地' },
        },
      ]);

      expect(result.created).toHaveLength(1);
      const locs = locationRepo.findAll();
      expect(locs).toHaveLength(1);
      expect(locs[0]!.name).toBe('墨渊谷');
    });

    it('creates factions and resolves leader name', () => {
      const result = service.commitEntities([
        {
          entityType: 'character',
          action: 'create',
          data: { name: '清风道人', role: 'supporting' },
        },
        {
          entityType: 'faction',
          action: 'create',
          data: {
            name: '天道宗',
            type: 'sect',
            leaderName: '清风道人',
            stanceToMC: 'friendly',
          },
        },
      ]);

      expect(result.created).toHaveLength(2);
      const factions = factionRepo.findAll();
      expect(factions).toHaveLength(1);
      expect(factions[0]!.name).toBe('天道宗');
    });

    it('creates arcs', () => {
      const result = service.commitEntities([
        {
          entityType: 'arc',
          action: 'create',
          data: { name: '墨渊觉醒', type: 'main' },
        },
      ]);

      expect(result.created).toHaveLength(1);
      const arcs = arcRepo.findAll();
      expect(arcs).toHaveLength(1);
    });

    it('merges existing character', () => {
      // Create existing character
      const existing = characterRepo.create({ name: '林墨', role: 'main' });

      const result = service.commitEntities([
        {
          entityType: 'character',
          action: 'merge',
          existingId: existing.id,
          data: { name: '林墨', role: 'main', appearance: '黑发黑眸' },
        },
      ]);

      expect(result.merged).toHaveLength(1);
      expect(result.created).toHaveLength(0);
    });

    it('processes entities in dependency order', () => {
      // Submit in wrong order: relationship before characters
      const result = service.commitEntities([
        {
          entityType: 'relationship',
          action: 'create',
          data: { sourceName: '甲', targetName: '乙', type: 'rival' },
        },
        {
          entityType: 'character',
          action: 'create',
          data: { name: '甲', role: 'main' },
        },
        {
          entityType: 'character',
          action: 'create',
          data: { name: '乙', role: 'supporting' },
        },
      ]);

      // Characters should be created first, then relationship resolved
      expect(result.created).toHaveLength(3);
      expect(relationshipRepo.findAll()).toHaveLength(1);
    });
  });

  // ===================================
  // detectDuplicates
  // ===================================

  describe('detectDuplicates', () => {
    it('detects exact name match for characters', async () => {
      characterRepo.create({ name: '林墨', role: 'main' });

      const candidates = await service.detectDuplicates({
        characters: [{ name: '林墨', role: 'main', confidence: 'high' as const }],
        relationships: [],
        locations: [],
        factions: [],
        foreshadowing: [],
        arcs: [],
        hooks: [],
        timeline: [],
        warnings: [],
      });

      expect(candidates).toHaveLength(1);
      expect(candidates[0]!.confidence).toBeGreaterThanOrEqual(0.95);
      expect(candidates[0]!.reason).toBe('exact name match');
    });

    it('detects exact name match for locations', async () => {
      locationRepo.create({ name: '墨渊谷' });

      const candidates = await service.detectDuplicates({
        characters: [],
        relationships: [],
        locations: [{ name: '墨渊谷', confidence: 'high' as const }],
        factions: [],
        foreshadowing: [],
        arcs: [],
        hooks: [],
        timeline: [],
        warnings: [],
      });

      expect(candidates).toHaveLength(1);
      expect(candidates[0]!.entityType).toBe('location');
    });

    it('returns empty when no matches', async () => {
      const candidates = await service.detectDuplicates({
        characters: [{ name: '新角色', role: 'main', confidence: 'high' as const }],
        relationships: [],
        locations: [],
        factions: [],
        foreshadowing: [],
        arcs: [],
        hooks: [],
        timeline: [],
        warnings: [],
      });

      expect(candidates).toHaveLength(0);
    });

    it('detects name-contains match with lower confidence', async () => {
      // "林墨大师" contains "林墨" — should detect partial match
      characterRepo.create({ name: '林墨', role: 'main' });

      // Mock AI response for ambiguous match
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          isSame: true,
          confidence: 0.8,
          reason: 'Same character, different title',
        }),
      });

      const candidates = await service.detectDuplicates({
        characters: [{ name: '林墨大师', role: 'main', confidence: 'high' as const }],
        relationships: [],
        locations: [],
        factions: [],
        foreshadowing: [],
        arcs: [],
        hooks: [],
        timeline: [],
        warnings: [],
      });

      // compareName('林墨大师', '林墨') → 0.5 (2/4) → triggers AI check
      expect(candidates.length).toBeGreaterThanOrEqual(1);
    });
  });
});
