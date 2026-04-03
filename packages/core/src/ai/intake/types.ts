/**
 * Smart Intake Types
 *
 * Types for the AI-powered entity extraction pipeline.
 * Covers three intake modes:
 * 1. Document Intake (tagged by topic) — user selects what they're importing
 * 2. Chapter Import — multi-pass extraction from story chapters
 * 3. Auto-detect — AI figures out entity types from mixed text
 */

import type {
  CharacterRole,
  ConflictType,
  CharacterTemplate,
  RelationshipType,
  HookType,
  HookStyle,
  ForeshadowingTerm,
  ArcStatus,
} from '../../types/entities.js';

// ===========================================
// Intake Configuration
// ===========================================

/**
 * What the user is importing — drives which entity types the AI focuses on.
 *
 * Hint → Primary extraction:
 * - character → characters[], relationships[]
 * - world → worldRules, locations[], factions[]
 * - plot → arcs[], foreshadowing[], hooks[], timeline[]
 * - location → locations[], factions[]
 * - faction → factions[], locations[]
 * - auto → all types
 */
export type IntakeHint = 'character' | 'world' | 'plot' | 'location' | 'faction' | 'auto';

/** How confident the AI is about an extracted entity */
export type IntakeConfidence = 'high' | 'medium' | 'low';

// ===========================================
// Extracted Entity Types (AI Output)
// ===========================================

/** Extracted character — mirrors CreateCharacterInput shape */
export interface ExtractedCharacter {
  name: string;
  role: CharacterRole;
  appearance?: string;
  voiceSamples?: string[];
  motivation?: {
    surface: string;
    hidden?: string;
    core?: string;
  };
  conflictType?: ConflictType;
  template?: CharacterTemplate;
  confidence: IntakeConfidence;
}

/**
 * Extracted relationship — uses character NAMES (not IDs).
 * Names are resolved to CharacterId at commit time via nameToIdMap.
 */
export interface ExtractedRelationship {
  sourceName: string;
  targetName: string;
  type: RelationshipType;
  joinReason?: string;
  independentGoal?: string;
  disagreeScenarios?: string[];
  leaveScenarios?: string[];
  mcNeeds?: string;
  evolution?: string;
  confidence: IntakeConfidence;
}

/** Extracted location — mirrors CreateLocationInput shape */
export interface ExtractedLocation {
  name: string;
  type?: string;
  significance?: string;
  atmosphere?: string;
  confidence: IntakeConfidence;
}

/** Extracted faction — uses leader NAME (not ID) */
export interface ExtractedFaction {
  name: string;
  type?: string;
  status?: string;
  leaderName?: string; // resolved to CharacterId at commit time
  stanceToMC?: 'friendly' | 'neutral' | 'hostile';
  goals?: string[];
  resources?: string[];
  internalConflict?: string;
  confidence: IntakeConfidence;
}

/** Extracted world rules */
export interface ExtractedWorld {
  powerSystem?: {
    name: string;
    levels?: string[];
    coreRules?: string[];
    constraints?: string[];
  };
  socialRules?: Record<string, string>;
  confidence: IntakeConfidence;
}

/** Extracted timeline event — uses character/location NAMES */
export interface ExtractedTimelineEvent {
  eventDate?: string;
  description: string;
  relatedCharacterNames?: string[];
  relatedLocationNames?: string[];
  confidence: IntakeConfidence;
}

/** Extracted foreshadowing */
export interface ExtractedForeshadowing {
  content: string;
  plantedText?: string;
  term?: ForeshadowingTerm;
  confidence: IntakeConfidence;
}

/** Extracted arc */
export interface ExtractedArc {
  name: string;
  type: 'main' | 'sub';
  status?: ArcStatus;
  mainArcRelation?: string;
  confidence: IntakeConfidence;
}

/** Extracted hook */
export interface ExtractedHook {
  type: HookType;
  content: string;
  hookType?: HookStyle;
  strength?: number;
  confidence: IntakeConfidence;
}

// ===========================================
// Decompose Result
// ===========================================

/** Full result from AI decomposition — separate arrays per entity type */
export interface DecomposeResult {
  characters: ExtractedCharacter[];
  relationships: ExtractedRelationship[];
  locations: ExtractedLocation[];
  factions: ExtractedFaction[];
  worldRules?: ExtractedWorld;
  foreshadowing: ExtractedForeshadowing[];
  arcs: ExtractedArc[];
  hooks: ExtractedHook[];
  timeline: ExtractedTimelineEvent[];
  warnings: string[];
}

// ===========================================
// Chapter Import
// ===========================================

/** A chapter's text content for import */
export interface ChapterText {
  title: string;
  content: string;
  sortOrder: number;
}

/** A detected chapter boundary from raw text */
export interface DetectedChapter {
  title: string;
  content: string;
  startLine: number;
  endLine: number;
  wordCount: number;
}

/** Progress event streamed during chapter import (SSE) */
export interface IntakeProgressEvent {
  type: 'progress' | 'pass_complete' | 'done' | 'error';
  /** Human-readable description, e.g. "Extracting characters (Pass 1/3)" */
  step?: string;
  /** Which pass (1, 2, or 3) */
  pass?: number;
  /** 0-100 progress percentage */
  progress?: number;
  /** Partial results after each pass */
  entities?: Partial<DecomposeResult>;
  /** Error message (when type = 'error') */
  error?: string;
}

// ===========================================
// Duplicate Detection
// ===========================================

/** A candidate duplicate: an imported entity that may match an existing one */
export interface DuplicateCandidate {
  /** Index into the decompose result array */
  index: number;
  /** Entity type (character, location, etc.) */
  entityType: string;
  /** Name of the imported entity */
  importedName: string;
  /** The imported entity's data */
  importedData: Record<string, unknown>;
  /** Existing entity ID in the Story Bible */
  existingId: string;
  /** Existing entity name */
  existingName: string;
  /** 0-1 confidence that they're the same entity */
  confidence: number;
  /** Why we think they match */
  reason: string;
}

// ===========================================
// Commit
// ===========================================

/** An entity the user has decided to commit */
export interface IntakeCommitEntity {
  /** Entity type */
  entityType:
    | 'character'
    | 'relationship'
    | 'location'
    | 'faction'
    | 'world'
    | 'timeline'
    | 'foreshadowing'
    | 'arc'
    | 'hook';
  /** What to do with it */
  action: 'create' | 'merge' | 'skip';
  /** The entity data (shape depends on entityType) */
  data: Record<string, unknown>;
  /** For merge: which existing entity to update */
  existingId?: string;
}

/** Result of committing entities */
export interface IntakeCommitResult {
  created: Array<{ type: string; id: string; name: string }>;
  merged: Array<{ type: string; id: string; name: string }>;
  skipped: number;
  /** Number of entities that couldn't be resolved (e.g. relationships with unknown characters) */
  unresolved: number;
}
