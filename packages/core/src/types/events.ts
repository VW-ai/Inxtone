/**
 * Event Types for Inxtone
 *
 * Defines all events emitted by the application.
 * Events are used for module decoupling and real-time UI updates.
 */

import type {
  Character,
  CharacterId,
  Relationship,
  World,
  Location,
  Faction,
  TimelineEvent,
  Arc,
  Foreshadowing,
  Hook,
  Chapter,
  ChapterId,
  Volume,
  VolumeId,
  ChapterStatus,
  Version,
  WritingGoal,
  CheckResult,
} from './entities.js';

import type { Issue } from './services.js';

// ===========================================
// Event Metadata
// ===========================================

/** Metadata added to all events */
export interface EventMeta {
  /** Unique event ID */
  _id: string;
  /** Timestamp when event was emitted */
  _timestamp: number;
  /** If true, event won't be broadcast via WebSocket */
  _localOnly?: boolean;
}

// ===========================================
// Content Events (Chapters) (M3 Writing Service)
// ===========================================

export interface ChapterCreatedEvent extends EventMeta {
  type: 'CHAPTER_CREATED';
  chapter: Chapter;
}

export interface ChapterUpdatedEvent extends EventMeta {
  type: 'CHAPTER_UPDATED';
  chapter: Chapter;
  changes: Partial<Chapter>;
}

export interface ChapterSavedEvent extends EventMeta {
  type: 'CHAPTER_SAVED';
  chapter: Chapter;
  wordCountDelta: number;
}

export interface ChapterDeletedEvent extends EventMeta {
  type: 'CHAPTER_DELETED';
  chapterId: ChapterId;
}

export interface ChapterRolledBackEvent extends EventMeta {
  type: 'CHAPTER_ROLLED_BACK';
  chapter: Chapter;
  versionId: number;
}

export interface ChapterStatusChangedEvent extends EventMeta {
  type: 'CHAPTER_STATUS_CHANGED';
  chapter: Chapter;
  oldStatus: ChapterStatus;
  newStatus: ChapterStatus;
}

export interface ChaptersReorderedEvent extends EventMeta {
  type: 'CHAPTERS_REORDERED';
  chapterIds: ChapterId[];
}

// ===========================================
// Character Events
// ===========================================

export interface CharacterCreatedEvent extends EventMeta {
  type: 'CHARACTER_CREATED';
  character: Character;
}

export interface CharacterUpdatedEvent extends EventMeta {
  type: 'CHARACTER_UPDATED';
  character: Character;
  changes: Record<string, unknown>;
}

export interface CharacterDeletedEvent extends EventMeta {
  type: 'CHARACTER_DELETED';
  characterId: CharacterId;
}

// ===========================================
// Relationship Events
// ===========================================

export interface RelationshipCreatedEvent extends EventMeta {
  type: 'RELATIONSHIP_CREATED';
  relationship: Relationship;
}

export interface RelationshipUpdatedEvent extends EventMeta {
  type: 'RELATIONSHIP_UPDATED';
  relationship: Relationship;
  changes?: Record<string, unknown>;
}

export interface RelationshipDeletedEvent extends EventMeta {
  type: 'RELATIONSHIP_DELETED';
  relationshipId: number;
}

// ===========================================
// World Events
// ===========================================

export interface WorldUpdatedEvent extends EventMeta {
  type: 'WORLD_UPDATED';
  world?: World;
  changes?: Record<string, unknown>;
}

export interface LocationCreatedEvent extends EventMeta {
  type: 'LOCATION_CREATED';
  location: Location;
}

export interface LocationUpdatedEvent extends EventMeta {
  type: 'LOCATION_UPDATED';
  location: Location;
  changes?: Record<string, unknown>;
}

export interface LocationDeletedEvent extends EventMeta {
  type: 'LOCATION_DELETED';
  locationId: string;
}

export interface FactionCreatedEvent extends EventMeta {
  type: 'FACTION_CREATED';
  faction: Faction;
}

export interface FactionUpdatedEvent extends EventMeta {
  type: 'FACTION_UPDATED';
  faction: Faction;
  changes?: Record<string, unknown>;
}

export interface FactionDeletedEvent extends EventMeta {
  type: 'FACTION_DELETED';
  factionId: string;
}

// ===========================================
// Timeline Events
// ===========================================

export interface TimelineEventCreatedEvent extends EventMeta {
  type: 'TIMELINE_EVENT_CREATED';
  event: TimelineEvent;
}

export interface TimelineEventUpdatedEvent extends EventMeta {
  type: 'TIMELINE_EVENT_UPDATED';
  event: TimelineEvent;
  changes?: Record<string, unknown>;
}

export interface TimelineEventDeletedEvent extends EventMeta {
  type: 'TIMELINE_EVENT_DELETED';
  eventId: number;
}

// ===========================================
// Plot Events (Arc, Foreshadowing, Hook)
// ===========================================

export interface ArcCreatedEvent extends EventMeta {
  type: 'ARC_CREATED';
  arc: Arc;
}

export interface ArcUpdatedEvent extends EventMeta {
  type: 'ARC_UPDATED';
  arc: Arc;
  changes?: Record<string, unknown>;
}

export interface ArcDeletedEvent extends EventMeta {
  type: 'ARC_DELETED';
  arcId: string;
}

export interface ForeshadowingCreatedEvent extends EventMeta {
  type: 'FORESHADOWING_CREATED';
  foreshadowing: Foreshadowing;
}

export interface ForeshadowingHintAddedEvent extends EventMeta {
  type: 'FORESHADOWING_HINT_ADDED';
  foreshadowing: Foreshadowing;
  hintChapter: ChapterId;
}

export interface ForeshadowingResolvedEvent extends EventMeta {
  type: 'FORESHADOWING_RESOLVED';
  foreshadowing: Foreshadowing;
  resolvedChapter: ChapterId;
}

export interface ForeshadowingAbandonedEvent extends EventMeta {
  type: 'FORESHADOWING_ABANDONED';
  foreshadowing: Foreshadowing;
}

export interface HookCreatedEvent extends EventMeta {
  type: 'HOOK_CREATED';
  hook: Hook;
}

export interface HookUpdatedEvent extends EventMeta {
  type: 'HOOK_UPDATED';
  hook: Hook;
  changes?: Record<string, unknown>;
}

export interface HookDeletedEvent extends EventMeta {
  type: 'HOOK_DELETED';
  hookId: string;
}

// ===========================================
// Quality Check Events
// ===========================================

export interface CheckStartedEvent extends EventMeta {
  type: 'CHECK_STARTED';
  chapterId: ChapterId;
  checkType: string;
}

export interface CheckProgressEvent extends EventMeta {
  type: 'CHECK_PROGRESS';
  chapterId: ChapterId;
  progress: number; // 0-100
  currentRule?: string;
}

export interface CheckCompletedEvent extends EventMeta {
  type: 'CHECK_COMPLETED';
  chapterId: ChapterId;
  result: CheckResult;
}

export interface IssueFoundEvent extends EventMeta {
  type: 'ISSUE_FOUND';
  issue: Issue;
}

export interface IssueResolvedEvent extends EventMeta {
  type: 'ISSUE_RESOLVED';
  issueId: number;
}

export interface IssueIgnoredEvent extends EventMeta {
  type: 'ISSUE_IGNORED';
  issueId: number;
  reason: string;
}

// ===========================================
// AI Events
// ===========================================

export interface AIGenerationStartedEvent extends EventMeta {
  type: 'AI_GENERATION_STARTED';
  taskId: string;
  generationType: 'continue' | 'dialogue' | 'describe' | 'brainstorm' | 'ask' | 'complete';
}

export interface AIGenerationProgressEvent extends EventMeta {
  type: 'AI_GENERATION_PROGRESS';
  taskId: string;
  chunk: string;
  tokensGenerated: number;
}

export interface AIGenerationCompletedEvent extends EventMeta {
  type: 'AI_GENERATION_COMPLETED';
  taskId: string;
  result: string;
  tokensUsed: {
    input: number;
    output: number;
  };
  /** Generation latency in milliseconds (from STARTED to COMPLETED) */
  latencyMs: number;
}

export interface AIGenerationErrorEvent extends EventMeta {
  type: 'AI_GENERATION_ERROR';
  taskId: string;
  error: string;
  retriable: boolean;
}

export interface AIContextBuiltEvent extends EventMeta {
  type: 'AI_CONTEXT_BUILT';
  taskId: string;
  tokensUsed: number;
  itemCount: number;
  truncated: boolean;
}

// ===========================================
// Writing Goal Events
// ===========================================

export interface GoalProgressUpdatedEvent extends EventMeta {
  type: 'GOAL_PROGRESS_UPDATED';
  goal: WritingGoal;
  previousWords: number;
}

export interface GoalCompletedEvent extends EventMeta {
  type: 'GOAL_COMPLETED';
  goal: WritingGoal;
}

export interface StreakUpdatedEvent extends EventMeta {
  type: 'STREAK_UPDATED';
  days: number;
  previousDays: number;
}

// ===========================================
// File Sync Events
// ===========================================

export interface FileSyncedEvent extends EventMeta {
  type: 'FILE_SYNCED';
  path: string;
  entityType: string;
  entityId: string;
  direction: 'import' | 'export';
}

export interface FileConflictEvent extends EventMeta {
  type: 'FILE_CONFLICT';
  path: string;
  resolution: 'db_wins' | 'file_wins' | 'manual';
}

export interface FileErrorEvent extends EventMeta {
  type: 'FILE_ERROR';
  path: string;
  error: string;
}

// ===========================================
// Index Events
// ===========================================

export interface IndexUpdateStartedEvent extends EventMeta {
  type: 'INDEX_UPDATE_STARTED';
  entityType: string;
  entityId?: string;
}

export interface IndexUpdateCompletedEvent extends EventMeta {
  type: 'INDEX_UPDATE_COMPLETED';
  entityType: string;
  count: number;
}

export interface IndexRebuildStartedEvent extends EventMeta {
  type: 'INDEX_REBUILD_STARTED';
  totalEntities: number;
}

export interface IndexRebuildProgressEvent extends EventMeta {
  type: 'INDEX_REBUILD_PROGRESS';
  progress: number; // 0-100
  currentEntity?: string;
}

export interface IndexRebuildCompletedEvent extends EventMeta {
  type: 'INDEX_REBUILD_COMPLETED';
  totalIndexed: number;
  duration: number; // ms
}

// ===========================================
// Config Events
// ===========================================

export interface ConfigChangedEvent extends EventMeta {
  type: 'CONFIG_CHANGED';
  key: string;
  previousValue: unknown;
  newValue: unknown;
}

export interface PresetAppliedEvent extends EventMeta {
  type: 'PRESET_APPLIED';
  presetId: string;
  changedKeys: string[];
}

export interface RuleToggledEvent extends EventMeta {
  type: 'RULE_TOGGLED';
  ruleId: string;
  enabled: boolean;
}

// ===========================================
// Project Events
// ===========================================

export interface ProjectOpenedEvent extends EventMeta {
  type: 'PROJECT_OPENED';
  projectId: string;
  projectName: string;
}

export interface ProjectClosedEvent extends EventMeta {
  type: 'PROJECT_CLOSED';
}

export interface ExportStartedEvent extends EventMeta {
  type: 'EXPORT_STARTED';
  format: string;
  totalChapters: number;
}

export interface ExportProgressEvent extends EventMeta {
  type: 'EXPORT_PROGRESS';
  current: number;
  total: number;
  currentItem: string;
}

export interface ExportCompletedEvent extends EventMeta {
  type: 'EXPORT_COMPLETED';
  format: string;
  path: string;
  totalWords: number;
}

export interface ExportErrorEvent extends EventMeta {
  type: 'EXPORT_ERROR';
  format: string;
  error: string;
}

// ===========================================
// Volume Events (M3 Writing Service)
// ===========================================

export interface VolumeCreatedEvent extends EventMeta {
  type: 'VOLUME_CREATED';
  volume: Volume;
}

export interface VolumeUpdatedEvent extends EventMeta {
  type: 'VOLUME_UPDATED';
  volume: Volume;
  changes: Partial<Volume>;
}

export interface VolumeDeletedEvent extends EventMeta {
  type: 'VOLUME_DELETED';
  volumeId: VolumeId;
}

// ===========================================
// Version Events (M3 Writing Service)
// ===========================================

export interface VersionCreatedEvent extends EventMeta {
  type: 'VERSION_CREATED';
  version: Version;
  chapterId: ChapterId;
}

export interface VersionsCleanedUpEvent extends EventMeta {
  type: 'VERSIONS_CLEANED_UP';
  count: number;
  olderThanDays: number;
}

// ===========================================
// Session Events
// ===========================================

export interface SessionStartedEvent extends EventMeta {
  type: 'SESSION_STARTED';
  sessionId: number;
  chapterId?: ChapterId;
}

export interface SessionEndedEvent extends EventMeta {
  type: 'SESSION_ENDED';
  sessionId: number;
  duration: number; // minutes
  wordsWritten: number;
}

// ===========================================
// Union Type of All Events
// ===========================================

export type AppEvent =
  // Content (M3 Writing)
  | ChapterCreatedEvent
  | ChapterUpdatedEvent
  | ChapterSavedEvent
  | ChapterDeletedEvent
  | ChapterRolledBackEvent
  | ChapterStatusChangedEvent
  | ChaptersReorderedEvent
  // Character
  | CharacterCreatedEvent
  | CharacterUpdatedEvent
  | CharacterDeletedEvent
  // Relationship
  | RelationshipCreatedEvent
  | RelationshipUpdatedEvent
  | RelationshipDeletedEvent
  // World
  | WorldUpdatedEvent
  | LocationCreatedEvent
  | LocationUpdatedEvent
  | LocationDeletedEvent
  | FactionCreatedEvent
  | FactionUpdatedEvent
  | FactionDeletedEvent
  // Timeline
  | TimelineEventCreatedEvent
  | TimelineEventUpdatedEvent
  | TimelineEventDeletedEvent
  // Plot
  | ArcCreatedEvent
  | ArcUpdatedEvent
  | ArcDeletedEvent
  | ForeshadowingCreatedEvent
  | ForeshadowingHintAddedEvent
  | ForeshadowingResolvedEvent
  | ForeshadowingAbandonedEvent
  | HookCreatedEvent
  | HookUpdatedEvent
  | HookDeletedEvent
  // Quality
  | CheckStartedEvent
  | CheckProgressEvent
  | CheckCompletedEvent
  | IssueFoundEvent
  | IssueResolvedEvent
  | IssueIgnoredEvent
  // AI
  | AIGenerationStartedEvent
  | AIGenerationProgressEvent
  | AIGenerationCompletedEvent
  | AIGenerationErrorEvent
  | AIContextBuiltEvent
  // Goals
  | GoalProgressUpdatedEvent
  | GoalCompletedEvent
  | StreakUpdatedEvent
  // File Sync
  | FileSyncedEvent
  | FileConflictEvent
  | FileErrorEvent
  // Index
  | IndexUpdateStartedEvent
  | IndexUpdateCompletedEvent
  | IndexRebuildStartedEvent
  | IndexRebuildProgressEvent
  | IndexRebuildCompletedEvent
  // Config
  | ConfigChangedEvent
  | PresetAppliedEvent
  | RuleToggledEvent
  // Project
  | ProjectOpenedEvent
  | ProjectClosedEvent
  | ExportStartedEvent
  | ExportProgressEvent
  | ExportCompletedEvent
  | ExportErrorEvent
  // Volume (M3 Writing)
  | VolumeCreatedEvent
  | VolumeUpdatedEvent
  | VolumeDeletedEvent
  // Version (M3 Writing)
  | VersionCreatedEvent
  | VersionsCleanedUpEvent
  // Session
  | SessionStartedEvent
  | SessionEndedEvent;

// ===========================================
// Event Type Helpers
// ===========================================

/** Extract event by type */
export type EventByType<T extends AppEvent['type']> = Extract<AppEvent, { type: T }>;

/** All event types */
export type EventType = AppEvent['type'];

/** Event without metadata (for emitting) */
export type EmitEvent<T extends AppEvent> = Omit<T, keyof EventMeta>;

// ===========================================
// Event Categories
// ===========================================

/** Events that should be broadcast via WebSocket */
export const BROADCAST_EVENTS: EventType[] = [
  // M3 Writing Events
  'CHAPTER_CREATED',
  'CHAPTER_UPDATED',
  'CHAPTER_SAVED',
  'CHAPTER_DELETED',
  'CHAPTER_ROLLED_BACK',
  'CHAPTER_STATUS_CHANGED',
  'CHAPTERS_REORDERED',
  'VOLUME_CREATED',
  'VOLUME_UPDATED',
  'VOLUME_DELETED',
  'VERSION_CREATED',
  // Story Bible Events

  'CHARACTER_CREATED',
  'CHARACTER_UPDATED',
  'CHARACTER_DELETED',
  'RELATIONSHIP_CREATED',
  'RELATIONSHIP_UPDATED',
  'RELATIONSHIP_DELETED',
  'WORLD_UPDATED',
  'LOCATION_CREATED',
  'LOCATION_UPDATED',
  'LOCATION_DELETED',
  'FACTION_CREATED',
  'FACTION_UPDATED',
  'FACTION_DELETED',
  'TIMELINE_EVENT_CREATED',
  'TIMELINE_EVENT_UPDATED',
  'TIMELINE_EVENT_DELETED',
  'ARC_CREATED',
  'ARC_UPDATED',
  'ARC_DELETED',
  'FORESHADOWING_CREATED',
  'FORESHADOWING_RESOLVED',
  'CHECK_COMPLETED',
  'ISSUE_FOUND',
  'ISSUE_RESOLVED',
  'AI_GENERATION_STARTED',
  'AI_CONTEXT_BUILT',
  'AI_GENERATION_PROGRESS',
  'AI_GENERATION_COMPLETED',
  'AI_GENERATION_ERROR',
  'GOAL_PROGRESS_UPDATED',
  'GOAL_COMPLETED',
  'STREAK_UPDATED',
  'EXPORT_PROGRESS',
  'EXPORT_COMPLETED',
] as const;

/** Events that are local-only (not broadcast) */
export const LOCAL_ONLY_EVENTS: EventType[] = [
  'INDEX_UPDATE_STARTED',
  'INDEX_UPDATE_COMPLETED',
  'CHECK_STARTED',
  'CHECK_PROGRESS',
  'CONFIG_CHANGED',
] as const;
