/**
 * Smart Intake Module
 *
 * AI-powered entity extraction pipeline for populating the Story Bible
 * from natural language text or existing story chapters.
 */

export * from './types.js';
export {
  extractedCharacterSchema,
  extractedRelationshipSchema,
  extractedLocationSchema,
  extractedFactionSchema,
  extractedWorldSchema,
  extractedTimelineEventSchema,
  extractedForeshadowingSchema,
  extractedArcSchema,
  extractedHookSchema,
  decomposeResultSchema,
  duplicateCheckResponseSchema,
  validateEntityData,
  validateDecomposeResult,
} from './schemas.js';
export type {
  DecomposeResultRaw,
  DecomposeResultParsed,
  DuplicateCheckResponse,
} from './schemas.js';
export {
  INTAKE_DECOMPOSE_TEMPLATE,
  INTAKE_CHAPTER_EXTRACT_TEMPLATE,
  INTAKE_DUPLICATE_CHECK_TEMPLATE,
  HINT_FOCUS,
  HINT_SCHEMAS,
  ENTITY_SCHEMA_DESCRIPTIONS,
  buildEntitySchemas,
} from './templates.js';
export { detectChapterBoundaries, mergeShortChapters } from './chapterSplitter.js';
export { readDocx } from './docxReader.js';
