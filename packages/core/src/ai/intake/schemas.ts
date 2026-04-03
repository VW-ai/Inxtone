/**
 * Zod Validation Schemas for Smart Intake
 *
 * These schemas validate the JSON output from the AI decomposition pipeline.
 * They mirror the Create*Input types from services.ts but are designed for
 * AI output validation — lenient on optional fields, strict on required ones.
 */

import { z } from 'zod';

// ===========================================
// Shared Enums
// ===========================================

const confidenceSchema = z.enum(['high', 'medium', 'low']).default('medium');

const characterRoleSchema = z
  .enum(['main', 'supporting', 'antagonist', 'mentioned'])
  .default('supporting');

const conflictTypeSchema = z.enum([
  'desire_vs_morality',
  'ideal_vs_reality',
  'self_vs_society',
  'love_vs_duty',
  'survival_vs_dignity',
]);

const characterTemplateSchema = z.enum([
  'avenger',
  'guardian',
  'seeker',
  'rebel',
  'redeemer',
  'bystander',
  'martyr',
  'fallen',
]);

const relationshipTypeSchema = z.enum([
  'companion',
  'rival',
  'enemy',
  'mentor',
  'confidant',
  'lover',
]);

const hookStyleSchema = z.enum(['suspense', 'anticipation', 'emotion', 'mystery']);

const foreshadowingTermSchema = z.enum(['short', 'mid', 'long']);

const arcStatusSchema = z.enum(['planned', 'in_progress', 'complete']);

const stanceSchema = z.enum(['friendly', 'neutral', 'hostile']);

// ===========================================
// Per-Entity Schemas
// ===========================================

export const extractedCharacterSchema = z.object({
  name: z.string().min(1),
  role: characterRoleSchema,
  appearance: z.string().optional(),
  voiceSamples: z.array(z.string()).optional(),
  motivation: z
    .object({
      surface: z.string(),
      hidden: z.string().optional(),
      core: z.string().optional(),
    })
    .optional(),
  conflictType: conflictTypeSchema.optional(),
  template: characterTemplateSchema.optional(),
  confidence: confidenceSchema,
});

export const extractedRelationshipSchema = z.object({
  sourceName: z.string().min(1),
  targetName: z.string().min(1),
  type: relationshipTypeSchema,
  joinReason: z.string().optional(),
  independentGoal: z.string().optional(),
  disagreeScenarios: z.array(z.string()).optional(),
  leaveScenarios: z.array(z.string()).optional(),
  mcNeeds: z.string().optional(),
  evolution: z.string().optional(),
  confidence: confidenceSchema,
});

export const extractedLocationSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  significance: z.string().optional(),
  atmosphere: z.string().optional(),
  confidence: confidenceSchema,
});

export const extractedFactionSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  status: z.string().optional(),
  leaderName: z.string().optional(),
  stanceToMC: stanceSchema.optional(),
  goals: z.array(z.string()).optional(),
  resources: z.array(z.string()).optional(),
  internalConflict: z.string().optional(),
  confidence: confidenceSchema,
});

export const extractedWorldSchema = z.object({
  powerSystem: z
    .object({
      name: z.string(),
      levels: z.array(z.string()).optional(),
      coreRules: z.array(z.string()).optional(),
      constraints: z.array(z.string()).optional(),
    })
    .optional(),
  socialRules: z.record(z.string(), z.string()).optional(),
  confidence: confidenceSchema,
});

export const extractedTimelineEventSchema = z.object({
  eventDate: z.string().optional(),
  description: z.string().min(1),
  relatedCharacterNames: z.array(z.string()).optional(),
  relatedLocationNames: z.array(z.string()).optional(),
  confidence: confidenceSchema,
});

export const extractedForeshadowingSchema = z.object({
  content: z.string().min(1),
  plantedText: z.string().optional(),
  term: foreshadowingTermSchema.optional(),
  confidence: confidenceSchema,
});

export const extractedArcSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['main', 'sub']),
  status: arcStatusSchema.optional(),
  mainArcRelation: z.string().optional(),
  confidence: confidenceSchema,
});

const hookStyleValues = new Set(['suspense', 'anticipation', 'emotion', 'mystery']);

export const extractedHookSchema = z
  .object({
    type: z.string().min(1),
    content: z.string().min(1),
    hookType: hookStyleSchema.optional(),
    strength: z.number().min(0).max(100).optional(),
    confidence: confidenceSchema,
  })
  .transform((data) => {
    // AI often confuses type (structural: opening/arc/chapter) with hookType (style: mystery/suspense/…)
    // If type contains a style value, remap it to hookType and default type to 'chapter'
    if (hookStyleValues.has(data.type)) {
      return {
        ...data,
        hookType: data.type as 'suspense' | 'anticipation' | 'emotion' | 'mystery',
        type: 'chapter' as const,
      };
    }
    // Validate type is a valid HookType, default to 'chapter' if not
    const validTypes = new Set(['opening', 'arc', 'chapter']);
    return {
      ...data,
      type: validTypes.has(data.type)
        ? (data.type as 'opening' | 'arc' | 'chapter')
        : ('chapter' as const),
    };
  });

// ===========================================
// Master Decompose Result Schema
// ===========================================

export const decomposeResultSchema = z.object({
  characters: z.array(extractedCharacterSchema).default([]),
  relationships: z.array(extractedRelationshipSchema).default([]),
  locations: z.array(extractedLocationSchema).default([]),
  factions: z.array(extractedFactionSchema).default([]),
  worldRules: extractedWorldSchema.optional(),
  foreshadowing: z.array(extractedForeshadowingSchema).default([]),
  arcs: z.array(extractedArcSchema).default([]),
  hooks: z.array(extractedHookSchema).default([]),
  timeline: z.array(extractedTimelineEventSchema).default([]),
  warnings: z.array(z.string()).default([]),
});

export type DecomposeResultRaw = z.input<typeof decomposeResultSchema>;

/**
 * Parsed result type — uses `T | undefined` from Zod (vs `?: T` in DecomposeResult).
 * Compatible for reading but distinct under exactOptionalPropertyTypes.
 * validateDecomposeResult returns this type; callers can spread into DecomposeResult.
 */
export type DecomposeResultParsed = z.infer<typeof decomposeResultSchema>;

// ===========================================
// Duplicate Check AI Response
// ===========================================

export const duplicateCheckResponseSchema = z.object({
  isSame: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});

export type DuplicateCheckResponse = z.infer<typeof duplicateCheckResponseSchema>;

// ===========================================
// Validation Helpers
// ===========================================

/** Schema map by entity type for per-entity validation */
const entitySchemaMap: Record<string, z.ZodType> = {
  character: extractedCharacterSchema,
  relationship: extractedRelationshipSchema,
  location: extractedLocationSchema,
  faction: extractedFactionSchema,
  world: extractedWorldSchema,
  timeline: extractedTimelineEventSchema,
  foreshadowing: extractedForeshadowingSchema,
  arc: extractedArcSchema,
  hook: extractedHookSchema,
};

/**
 * Validate a single entity's data against its type-specific schema.
 * Returns the validated data or null with error details.
 */
export function validateEntityData(
  entityType: string,
  data: unknown
): { valid: true; data: unknown } | { valid: false; errors: string[] } {
  const schema = entitySchemaMap[entityType];
  if (!schema) {
    return { valid: false, errors: [`Unknown entity type: ${entityType}`] };
  }

  const result = schema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data };
  }

  const errors = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  return { valid: false, errors };
}

/**
 * Validate the full AI decompose response.
 * Returns validated result with warnings for entities that failed validation.
 * Partial success: valid entities are kept, invalid ones are dropped with warnings.
 */
export function validateDecomposeResult(raw: unknown): {
  result: DecomposeResultParsed;
  validationWarnings: string[];
} {
  const warnings: string[] = [];

  // First try to parse the overall structure
  const parsed = decomposeResultSchema.safeParse(raw);
  if (parsed.success) {
    return { result: parsed.data, validationWarnings: warnings };
  }

  // If full parse fails, try to salvage what we can
  const fallback: DecomposeResultParsed = {
    characters: [],
    relationships: [],
    locations: [],
    factions: [],
    foreshadowing: [],
    arcs: [],
    hooks: [],
    timeline: [],
    warnings: [],
  };

  if (typeof raw !== 'object' || raw === null) {
    warnings.push('AI response was not a valid JSON object');
    return { result: fallback, validationWarnings: warnings };
  }

  const obj = raw as Record<string, unknown>;

  // Try to salvage each entity array individually
  const arrayFields = [
    'characters',
    'relationships',
    'locations',
    'factions',
    'foreshadowing',
    'arcs',
    'hooks',
    'timeline',
  ] as const;

  for (const field of arrayFields) {
    const arr = obj[field];
    if (!Array.isArray(arr)) continue;

    const schemaKey = field === 'timeline' ? 'timeline' : field.replace(/s$/, '');
    // Map plural form to schema key
    const lookupKey =
      field === 'characters'
        ? 'character'
        : field === 'relationships'
          ? 'relationship'
          : field === 'locations'
            ? 'location'
            : field === 'factions'
              ? 'faction'
              : field === 'hooks'
                ? 'hook'
                : schemaKey;

    const schema = entitySchemaMap[lookupKey];
    if (!schema) continue;

    for (const item of arr) {
      const itemResult = schema.safeParse(item);
      if (itemResult.success) {
        (fallback[field] as unknown[]).push(itemResult.data);
      } else {
        const name =
          typeof item === 'object' && item !== null && 'name' in item
            ? String((item as Record<string, unknown>).name)
            : 'unknown';
        warnings.push(
          `Failed to validate ${lookupKey} "${name}": ${itemResult.error.issues[0]?.message ?? 'unknown error'}`
        );
      }
    }
  }

  // Try to parse worldRules separately
  if (obj.worldRules) {
    const worldResult = extractedWorldSchema.safeParse(obj.worldRules);
    if (worldResult.success) {
      fallback.worldRules = worldResult.data;
    } else {
      warnings.push(
        `Failed to validate world rules: ${worldResult.error.issues[0]?.message ?? 'unknown error'}`
      );
    }
  }

  return { result: fallback, validationWarnings: warnings };
}
