/**
 * @inxtone/core
 *
 * Core library containing types, interfaces, and shared utilities
 * for the Inxtone storytelling framework.
 */

// Types and Interfaces
export * from './types/index.js';

// Error types (shared across all layers)
export * from './errors/index.js';

// AI presets (shared between web + server)
export { PROMPT_PRESETS, PRESET_CATEGORIES } from './ai/presets.js';
export type { PromptPreset, PresetCategory } from './ai/presets.js';

// AI constants (shared between web + server)
export { TOTAL_BUDGET } from './ai/BaseContextBuilder.js';

// Smart Intake types (shared between web + server)
export type {
  IntakeHint,
  IntakeConfidence,
  ExtractedCharacter,
  ExtractedRelationship,
  ExtractedLocation,
  ExtractedFaction,
  ExtractedWorld,
  ExtractedTimelineEvent,
  ExtractedForeshadowing,
  ExtractedArc,
  ExtractedHook,
  DecomposeResult,
  ChapterText,
  DetectedChapter,
  IntakeProgressEvent,
  DuplicateCandidate,
  IntakeCommitEntity,
  IntakeCommitResult,
} from './ai/intake/types.js';

// Note: Database module is server-only, import via '@inxtone/core/db'
// Note: Services module is server-only, import via '@inxtone/core/services'

// Version
export const VERSION = '0.1.0';
