/**
 * Entity Types for Inxtone
 *
 * These types map to the SQLite schema defined in 04_DATA_LAYER.md.
 * They serve as the contract for all data operations.
 */

// ===========================================
// Base Types
// ===========================================

/** ISO 8601 datetime string */
export type ISODateTime = string;

/** Entity ID types for type safety */
export type CharacterId = string; // C001, C002, ...
export type LocationId = string; // L001, L002, ...
export type FactionId = string; // F001, F002, ...
export type ArcId = string; // ARC001, ARC002, ...
export type ForeshadowingId = string; // FS001, FS002, ...
export type HookId = string;
export type ChapterId = number; // 1, 2, 3, ...
export type VolumeId = number; // 1, 2, 3, ...

/** Common timestamps for all entities */
export interface Timestamps {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ===========================================
// Project
// ===========================================

export interface ProjectConfig {
  /** AI provider settings */
  ai?: {
    provider: 'gemini' | 'openai' | 'claude';
    model?: string;
    maxContextTokens?: number;
  };
  /** Export settings */
  export?: {
    defaultFormat: 'md' | 'txt' | 'docx';
    includeMetadata?: boolean;
  };
  /** Custom settings */
  [key: string]: unknown;
}

export interface Project extends Timestamps {
  id: string;
  name: string;
  description?: string;
  config: ProjectConfig;
}

// ===========================================
// Characters
// ===========================================

export type CharacterRole = 'main' | 'supporting' | 'antagonist' | 'mentioned';

export type ConflictType =
  | 'desire_vs_morality'
  | 'ideal_vs_reality'
  | 'self_vs_society'
  | 'love_vs_duty'
  | 'survival_vs_dignity';

export type CharacterTemplate =
  | 'avenger'
  | 'guardian'
  | 'seeker'
  | 'rebel'
  | 'redeemer'
  | 'bystander'
  | 'martyr'
  | 'fallen';

export type ArcType = 'positive' | 'negative' | 'flat' | 'supporting';

export interface CharacterMotivation {
  /** Visible, stated goal */
  surface: string;
  /** Hidden psychological driver */
  hidden?: string;
  /** Unconscious core need */
  core?: string;
}

export interface CharacterFacets {
  /** Public persona */
  public: string;
  /** Private self */
  private?: string;
  /** Hidden aspects */
  hidden?: string;
  /** Under pressure */
  underPressure?: string;
}

export interface CharacterArc {
  type: ArcType;
  startState: string;
  endState: string;
  phases?: Array<{
    chapter: ChapterId;
    event: string;
    change: string;
  }>;
}

export interface Character extends Timestamps {
  id: CharacterId;
  name: string;
  role: CharacterRole;

  // External
  appearance?: string;
  voiceSamples?: string[];

  // Internal
  motivation?: CharacterMotivation;
  conflictType?: ConflictType;
  template?: CharacterTemplate;
  facets?: CharacterFacets;

  // Arc
  arc?: CharacterArc;

  // Metadata
  firstAppearance?: ChapterId;
}

// ===========================================
// Relationships
// ===========================================

export type RelationshipType = 'companion' | 'rival' | 'enemy' | 'mentor' | 'confidant' | 'lover';

export interface Relationship extends Timestamps {
  id: number;
  sourceId: CharacterId;
  targetId: CharacterId;
  type: RelationshipType;

  // R1 check fields (Wayne Principles)
  joinReason?: string;
  independentGoal?: string;
  disagreeScenarios?: string[];
  leaveScenarios?: string[];
  mcNeeds?: string;

  // Evolution
  evolution?: string;
}

// ===========================================
// World
// ===========================================

export interface PowerSystem {
  name: string;
  levels?: string[];
  coreRules?: string[];
  constraints?: string[];
}

export interface World extends Timestamps {
  id: string;
  powerSystem?: PowerSystem;
  socialRules?: Record<string, string>;
}

export interface Location extends Timestamps {
  id: LocationId;
  name: string;
  type?: string;
  significance?: string;
  atmosphere?: string;
  details?: Record<string, unknown>;
}

export interface Faction extends Timestamps {
  id: FactionId;
  name: string;
  type?: string;
  status?: string;
  leaderId?: CharacterId;
  stanceToMC?: 'friendly' | 'neutral' | 'hostile';
  goals?: string[];
  resources?: string[];
  internalConflict?: string;
}

export interface TimelineEvent {
  id: number;
  eventDate?: string;
  description: string;
  relatedCharacters?: CharacterId[];
  relatedLocations?: LocationId[];
  createdAt: ISODateTime;
}

// ===========================================
// Plot
// ===========================================

export type ArcStatus = 'planned' | 'in_progress' | 'complete';

export interface ArcSection {
  name: string;
  chapters: ChapterId[];
  type: string;
  status: ArcStatus;
}

export interface Arc extends Timestamps {
  id: ArcId;
  name: string;
  type: 'main' | 'sub';

  chapterStart?: ChapterId;
  chapterEnd?: ChapterId;

  status: ArcStatus;
  progress: number; // 0-100

  sections?: ArcSection[];
  characterArcs?: Record<CharacterId, string>;

  // Sub-arc specific
  mainArcRelation?: string;
}

export type ForeshadowingStatus = 'active' | 'resolved' | 'abandoned';
export type ForeshadowingTerm = 'short' | 'mid' | 'long';

export interface ForeshadowingHint {
  chapter: ChapterId;
  text: string;
}

export interface Foreshadowing extends Timestamps {
  id: ForeshadowingId;
  content: string;

  plantedChapter?: ChapterId;
  plantedText?: string;

  hints?: ForeshadowingHint[];

  plannedPayoff?: ChapterId;
  resolvedChapter?: ChapterId;

  status: ForeshadowingStatus;
  term?: ForeshadowingTerm;
}

export type HookType = 'opening' | 'arc' | 'chapter';
export type HookStyle = 'suspense' | 'anticipation' | 'emotion' | 'mystery';

export interface Hook {
  id: HookId;
  type: HookType;
  chapterId?: ChapterId;
  content: string;
  hookType?: HookStyle;
  strength?: number; // 0-100
  createdAt: ISODateTime;
}

// ===========================================
// Volumes & Chapters
// ===========================================

export type VolumeStatus = 'planned' | 'in_progress' | 'complete';

export interface Volume extends Timestamps {
  id: VolumeId;
  name?: string;
  theme?: string;
  coreConflict?: string;
  mcGrowth?: string;

  chapterStart?: ChapterId;
  chapterEnd?: ChapterId;

  status: VolumeStatus;
}

export type ChapterStatus = 'outline' | 'draft' | 'revision' | 'done';
export type EmotionCurve = 'low_to_high' | 'high_to_low' | 'stable' | 'wave';
export type TensionLevel = 'low' | 'medium' | 'high';

export interface ChapterOutline {
  goal?: string;
  scenes?: string[];
  hookEnding?: string;
}

export interface Chapter extends Timestamps {
  id: ChapterId;
  volumeId?: VolumeId;
  arcId?: ArcId;

  title?: string;
  status: ChapterStatus;
  sortOrder: number;

  // Outline
  outline?: ChapterOutline;

  // Content
  content?: string;
  wordCount: number;

  // Appearances
  characters?: CharacterId[];
  locations?: LocationId[];

  // Foreshadowing
  foreshadowingPlanted?: ForeshadowingId[];
  foreshadowingHinted?: ForeshadowingId[];
  foreshadowingResolved?: ForeshadowingId[];

  // Emotion
  emotionCurve?: EmotionCurve;
  tension?: TensionLevel;
}

// ===========================================
// Writing Goals & Sessions
// ===========================================

export type GoalType = 'daily' | 'chapter' | 'volume' | 'total';
export type GoalStatus = 'active' | 'completed' | 'missed';

export interface WritingGoal extends Timestamps {
  id: number;
  type: GoalType;
  targetWords: number;

  date?: string; // For daily goals
  chapterId?: ChapterId;
  volumeId?: VolumeId;

  currentWords: number;
  status: GoalStatus;
}

export interface WritingSession {
  id: number;
  startedAt: ISODateTime;
  endedAt?: ISODateTime;

  chapterId?: ChapterId;

  wordsWritten: number;
  durationMinutes?: number;

  notes?: string;
  createdAt: ISODateTime;
}

// ===========================================
// Versions
// ===========================================

export type EntityType = 'chapter' | 'character' | 'world' | 'arc' | 'foreshadowing';

export interface Version {
  id: number;
  entityType: EntityType;
  entityId: string;
  content: unknown; // Full snapshot
  changeSummary?: string;
  source: 'auto' | 'manual' | 'ai_backup' | 'rollback_backup';
  createdAt: ISODateTime;
}

// ===========================================
// Check Results (Quality)
// ===========================================

export type CheckType = 'consistency' | 'wayne_principles' | 'pacing' | 'grammar';
export type CheckStatus = 'pass' | 'warning' | 'error';
export type Severity = 'info' | 'warning' | 'error';

export interface Violation {
  rule: string;
  location?: string;
  description: string;
  severity: Severity;
}

export interface CheckResult {
  id: number;
  chapterId?: ChapterId;
  checkType: CheckType;
  status: CheckStatus;

  violations?: Violation[];
  passedRules?: string[];
  suggestions?: string[];

  createdAt: ISODateTime;
}

// ===========================================
// Embeddings (Vector Search)
// ===========================================

export interface Embedding {
  id: number;
  entityType: EntityType;
  entityId: string;
  chunkIndex: number;

  content: string;
  embedding: ArrayBuffer; // Binary vector data

  createdAt: ISODateTime;
}

// ===========================================
// Config (Key-Value Store)
// ===========================================

export interface ConfigEntry {
  key: string;
  value: unknown;
  updatedAt: ISODateTime;
}
