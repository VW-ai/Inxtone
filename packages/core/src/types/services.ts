/**
 * Service Interfaces for Inxtone
 *
 * These interfaces define the contracts for all core services.
 * Implementations can vary (SQLite, API, Mock) but must conform to these interfaces.
 */

import type {
  Character,
  CharacterId,
  CharacterRole,
  ConflictType,
  CharacterTemplate,
  Relationship,
  Location,
  LocationId,
  Faction,
  FactionId,
  World,
  PowerSystem,
  Arc,
  ArcId,
  ArcStatus,
  ArcSection,
  Foreshadowing,
  ForeshadowingId,
  Hook,
  HookId,
  HookType,
  HookStyle,
  Volume,
  VolumeId,
  Chapter,
  ChapterId,
  ChapterStatus,
  ChapterOutline,
  VolumeStatus,
  WritingGoal,
  WritingSession,
  Version,
  CheckResult,
  Project,
  ProjectConfig,
  TimelineEvent,
} from './entities.js';

// ===========================================
// Common Types
// ===========================================

/** Pagination options */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

/** Paginated result */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Sort options */
export interface SortOptions<T> {
  field: keyof T;
  direction: 'asc' | 'desc';
}

/** Filter operators */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';

/** Generic filter condition */
export interface FilterCondition<T> {
  field: keyof T;
  operator: FilterOperator;
  value: unknown;
}

/** Result wrapper for operations that can fail */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

// ===========================================
// StoryBibleService
// ===========================================

/** Options for creating a character */
export interface CreateCharacterInput {
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
  firstAppearance?: ChapterId;
}

/** Options for updating a character */
export interface UpdateCharacterInput extends Partial<CreateCharacterInput> {
  facets?: {
    public: string;
    private?: string;
    hidden?: string;
    underPressure?: string;
  };
  arc?: {
    type: 'positive' | 'negative' | 'flat' | 'supporting';
    startState: string;
    endState: string;
  };
}

/** Options for creating a relationship */
export interface CreateRelationshipInput {
  sourceId: CharacterId;
  targetId: CharacterId;
  type: 'companion' | 'rival' | 'enemy' | 'mentor' | 'confidant' | 'lover';
  joinReason?: string;
  independentGoal?: string;
  disagreeScenarios?: string[];
  leaveScenarios?: string[];
  mcNeeds?: string;
  evolution?: string;
}

/** Options for creating a location */
export interface CreateLocationInput {
  name: string;
  type?: string;
  significance?: string;
  atmosphere?: string;
  details?: Record<string, unknown>;
}

/** Options for creating a faction */
export interface CreateFactionInput {
  name: string;
  type?: string;
  status?: string;
  leaderId?: CharacterId;
  stanceToMC?: 'friendly' | 'neutral' | 'hostile';
  goals?: string[];
  resources?: string[];
  internalConflict?: string;
}

/** Options for creating a timeline event */
export interface CreateTimelineEventInput {
  eventDate?: string;
  description: string;
  relatedCharacters?: CharacterId[];
  relatedLocations?: LocationId[];
}

/** Options for updating a timeline event */
export interface UpdateTimelineEventInput {
  eventDate?: string;
  description?: string;
}

/** Options for creating foreshadowing */
export interface CreateForeshadowingInput {
  content: string;
  plantedChapter?: ChapterId;
  plantedText?: string;
  plannedPayoff?: ChapterId;
  term?: 'short' | 'mid' | 'long';
}

/** Options for updating foreshadowing */
export interface UpdateForeshadowingInput extends Partial<CreateForeshadowingInput> {
  status?: 'active' | 'resolved' | 'abandoned';
}

/** Options for creating an arc */
export interface CreateArcInput {
  name: string;
  type: 'main' | 'sub';
  chapterStart?: ChapterId;
  chapterEnd?: ChapterId;
  status?: ArcStatus;
  sections?: ArcSection[];
  characterArcs?: Record<CharacterId, string>;
  mainArcRelation?: string;
}

/** Options for creating a hook */
export interface CreateHookInput {
  type: HookType;
  content: string;
  chapterId?: ChapterId;
  hookType?: HookStyle;
  strength?: number;
}

/** Character with relationships loaded */
export interface CharacterWithRelations extends Character {
  relationships: Array<Relationship & { targetName: string }>;
}

/**
 * StoryBibleService - Manages story bible: characters, world, plot
 */
export interface IStoryBibleService {
  // === Characters ===
  createCharacter(input: CreateCharacterInput): Promise<Character>;
  getCharacter(id: CharacterId): Promise<Character | null>;
  getCharacterWithRelations(id: CharacterId): Promise<CharacterWithRelations | null>;
  getAllCharacters(): Promise<Character[]>;
  getCharactersByRole(role: CharacterRole): Promise<Character[]>;
  updateCharacter(id: CharacterId, input: UpdateCharacterInput): Promise<Character>;
  deleteCharacter(id: CharacterId): Promise<void>;
  searchCharacters(query: string): Promise<Character[]>;

  // === Relationships ===
  createRelationship(input: CreateRelationshipInput): Promise<Relationship>;
  getRelationship(id: number): Promise<Relationship | null>;
  getAllRelationships(): Promise<Relationship[]>;
  getRelationshipsForCharacter(characterId: CharacterId): Promise<Relationship[]>;
  updateRelationship(id: number, input: Partial<CreateRelationshipInput>): Promise<Relationship>;
  deleteRelationship(id: number): Promise<void>;

  // === World ===
  getWorld(): Promise<World | null>;
  updateWorld(input: Partial<World>): Promise<World>;
  setPowerSystem(powerSystem: PowerSystem): Promise<void>;
  setSocialRules(rules: Record<string, string>): Promise<void>;

  // === Locations ===
  createLocation(input: CreateLocationInput): Promise<Location>;
  getLocation(id: LocationId): Promise<Location | null>;
  getAllLocations(): Promise<Location[]>;
  updateLocation(id: LocationId, input: Partial<CreateLocationInput>): Promise<Location>;
  deleteLocation(id: LocationId): Promise<void>;

  // === Factions ===
  createFaction(input: CreateFactionInput): Promise<Faction>;
  getFaction(id: FactionId): Promise<Faction | null>;
  getAllFactions(): Promise<Faction[]>;
  updateFaction(id: FactionId, input: Partial<CreateFactionInput>): Promise<Faction>;
  deleteFaction(id: FactionId): Promise<void>;

  // === Timeline ===
  createTimelineEvent(input: CreateTimelineEventInput): Promise<TimelineEvent>;
  getTimelineEvents(): Promise<TimelineEvent[]>;
  updateTimelineEvent(id: number, input: UpdateTimelineEventInput): Promise<TimelineEvent>;
  deleteTimelineEvent(id: number): Promise<void>;

  // === Arcs ===
  createArc(input: CreateArcInput): Promise<Arc>;
  getArc(id: ArcId): Promise<Arc | null>;
  getAllArcs(): Promise<Arc[]>;
  updateArc(id: ArcId, input: Partial<CreateArcInput> & { progress?: number }): Promise<Arc>;
  deleteArc(id: ArcId): Promise<void>;

  // === Foreshadowing ===
  createForeshadowing(input: CreateForeshadowingInput): Promise<Foreshadowing>;
  getForeshadowing(id: ForeshadowingId): Promise<Foreshadowing | null>;
  getAllForeshadowing(): Promise<Foreshadowing[]>;
  getActiveForeshadowing(): Promise<Foreshadowing[]>;
  updateForeshadowing(id: ForeshadowingId, input: UpdateForeshadowingInput): Promise<Foreshadowing>;
  addForeshadowingHint(
    id: ForeshadowingId,
    chapter: ChapterId,
    text: string
  ): Promise<Foreshadowing>;
  resolveForeshadowing(id: ForeshadowingId, resolvedChapter: ChapterId): Promise<Foreshadowing>;
  abandonForeshadowing(id: ForeshadowingId): Promise<Foreshadowing>;
  deleteForeshadowing(id: ForeshadowingId): Promise<void>;

  // === Hooks ===
  createHook(input: CreateHookInput): Promise<Hook>;
  getHook(id: HookId): Promise<Hook | null>;
  getAllHooks(): Promise<Hook[]>;
  getHooksForChapter(chapterId: ChapterId): Promise<Hook[]>;
  updateHook(id: HookId, input: Partial<CreateHookInput>): Promise<Hook>;
  deleteHook(id: HookId): Promise<void>;
}

// ===========================================
// WritingService
// ===========================================

/** Options for creating a volume */
export interface CreateVolumeInput {
  name?: string;
  theme?: string;
  coreConflict?: string;
  mcGrowth?: string;
  chapterStart?: ChapterId;
  chapterEnd?: ChapterId;
  status?: VolumeStatus;
}

/** Options for updating a volume */
export type UpdateVolumeInput = Partial<CreateVolumeInput>;

/** Options for creating a chapter */
export interface CreateChapterInput {
  volumeId?: VolumeId;
  arcId?: ArcId;
  title?: string;
  status?: ChapterStatus;
  outline?: {
    goal?: string;
    scenes?: string[];
    hookEnding?: string;
  };
  characters?: CharacterId[];
  locations?: LocationId[];
  foreshadowingHinted?: ForeshadowingId[];
}

/** Options for updating a chapter */
export interface UpdateChapterInput {
  volumeId?: VolumeId | null;
  arcId?: ArcId | null;
  title?: string;
  status?: ChapterStatus;
  outline?: ChapterOutline;
  characters?: CharacterId[];
  locations?: LocationId[];
  foreshadowingPlanted?: ForeshadowingId[];
  foreshadowingHinted?: ForeshadowingId[];
  foreshadowingResolved?: ForeshadowingId[];
  emotionCurve?: string;
  tension?: string;
}

/** Options for saving chapter content */
export interface SaveContentInput {
  chapterId: ChapterId;
  content: string;
  createVersion?: boolean;
}

/** Version comparison result */
export interface VersionDiff {
  added: number;
  removed: number;
  wordCountDelta: number;
}

/** Writing statistics for a date range */
export interface WritingStats {
  totalWords: number;
  totalTime: number; // minutes
  chaptersEdited: number;
  avgWordsPerDay: number;
  streak: number;
}

/**
 * WritingService - Manages writing workflow: chapters, versions, goals
 */
export interface IWritingService {
  // === Volumes ===
  createVolume(input: CreateVolumeInput): Promise<Volume>;
  getVolume(id: VolumeId): Promise<Volume>;
  getAllVolumes(): Promise<Volume[]>;
  updateVolume(id: VolumeId, input: UpdateVolumeInput): Promise<Volume>;
  deleteVolume(id: VolumeId): Promise<void>;

  // === Chapters ===
  createChapter(input: CreateChapterInput): Promise<Chapter>;
  getChapter(id: ChapterId): Promise<Chapter>;
  getChapterWithContent(id: ChapterId): Promise<Chapter>;
  getAllChapters(): Promise<Chapter[]>;
  getChaptersByVolume(volumeId: VolumeId): Promise<Chapter[]>;
  getChaptersByArc(arcId: ArcId): Promise<Chapter[]>;
  getChaptersByStatus(status: ChapterStatus): Promise<Chapter[]>;
  updateChapter(id: ChapterId, input: UpdateChapterInput): Promise<Chapter>;
  deleteChapter(id: ChapterId): Promise<void>;
  reorderChapters(chapterIds: ChapterId[]): Promise<void>;

  // === Content Editing ===
  saveContent(input: SaveContentInput): Promise<Chapter>;
  getWordCount(chapterId: ChapterId): Promise<number>;
  getTotalWordCount(): Promise<number>;

  // === Version Control ===
  createVersion(input: { chapterId: ChapterId; changeSummary?: string }): Promise<Version>;
  getVersions(chapterId: ChapterId): Promise<Version[]>;
  getVersion(versionId: number): Promise<Version>;
  compareVersions(versionId1: number, versionId2: number): Promise<VersionDiff>;
  rollbackToVersion(chapterId: ChapterId, versionId: number): Promise<Chapter>;
  cleanupOldVersions(olderThanDays: number): Promise<number>;

  // === Writing Goals (deferred to post-M3) ===
  setDailyGoal(targetWords: number): Promise<WritingGoal>;
  setChapterGoal(chapterId: ChapterId, targetWords: number): Promise<WritingGoal>;
  getActiveGoals(): Promise<WritingGoal[]>;
  updateGoalProgress(goalId: number, wordsWritten: number): Promise<WritingGoal>;
  completeGoal(goalId: number): Promise<WritingGoal>;

  // === Writing Sessions (deferred to post-M3) ===
  startSession(chapterId?: ChapterId): Promise<WritingSession>;
  endSession(sessionId: number): Promise<WritingSession>;
  getSession(sessionId: number): Promise<WritingSession | null>;
  getTodaySessions(): Promise<WritingSession[]>;

  // === Statistics (deferred to post-M3) ===
  getWritingStats(startDate: string, endDate: string): Promise<WritingStats>;
  getCurrentStreak(): Promise<number>;
}

// ===========================================
// AIService
// ===========================================

/** AI provider types */
export type AIProvider = 'gemini' | 'openai' | 'claude';

/** AI generation options */
export interface AIGenerationOptions {
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/** Context item type — fine-grained categories for AI context assembly */
export type ContextItemType =
  | 'chapter_content' // L1: current chapter text
  | 'chapter_outline' // L1: chapter outline
  | 'chapter_prev_tail' // L1: previous chapter tail
  | 'character' // L2: character profile
  | 'relationship' // L2: character relationship
  | 'location' // L2: location description
  | 'arc' // L2: story arc structure
  | 'foreshadowing' // L3: foreshadowing hints
  | 'hook' // L3: previous chapter hooks
  | 'power_system' // L4: world power system rules
  | 'social_rules' // L4: world social rules
  | 'custom'; // L5: user-provided context

/** Context item for AI generation */
export interface ContextItem {
  type: ContextItemType;
  id?: string;
  content: string;
  priority: number;
}

/** Built context result */
export interface BuiltContext {
  items: ContextItem[];
  totalTokens: number;
  truncated: boolean;
}

/** AI generation result */
export interface AIGenerationResult {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
  };
  provider: AIProvider;
  model: string;
}

/** Stream chunk for AI generation */
export interface AIStreamChunk {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
  /** Token usage from the provider (present on 'done' chunks when available) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

/**
 * AIService - AI generation with provider abstraction
 */
export interface IAIService {
  // === Generation ===
  /**
   * Continue writing from the current point
   */
  continueScene(
    chapterId: ChapterId,
    options?: AIGenerationOptions,
    userInstruction?: string,
    excludedContextIds?: string[]
  ): AsyncIterable<AIStreamChunk>;

  /**
   * Generate dialogue for characters.
   * When chapterId is provided, augments with chapter-scoped context.
   */
  generateDialogue(
    characterIds: CharacterId[],
    context: string,
    options?: AIGenerationOptions,
    userInstruction?: string,
    chapterId?: ChapterId
  ): AsyncIterable<AIStreamChunk>;

  /**
   * Generate scene description.
   * When chapterId is provided, augments with chapter-scoped context.
   */
  describeScene(
    locationId: LocationId,
    mood: string,
    options?: AIGenerationOptions,
    userInstruction?: string,
    chapterId?: ChapterId
  ): AsyncIterable<AIStreamChunk>;

  /**
   * Brainstorm ideas.
   * When chapterId is provided, augments with chapter-scoped context.
   */
  brainstorm(
    topic: string,
    options?: AIGenerationOptions,
    userInstruction?: string,
    chapterId?: ChapterId
  ): AsyncIterable<AIStreamChunk>;

  /**
   * Ask a question about the story bible
   */
  askStoryBible(question: string, options?: AIGenerationOptions): AsyncIterable<AIStreamChunk>;

  /**
   * Generic completion with custom prompt
   */
  complete(
    prompt: string,
    context?: ContextItem[],
    options?: AIGenerationOptions
  ): AsyncIterable<AIStreamChunk>;

  // === Context Building ===
  /**
   * Build context for a chapter
   */
  buildContext(chapterId: ChapterId, additionalItems?: ContextItem[]): Promise<BuiltContext>;

  /**
   * Search for relevant context items
   */
  searchRelevantContext(query: string, maxItems?: number): Promise<ContextItem[]>;

  // === API Key Management ===
  /**
   * Update the Gemini API key at runtime (per-request BYOK).
   */
  setGeminiApiKey(key: string): void;

  // === Provider Management ===
  /**
   * Get available providers
   */
  getAvailableProviders(): AIProvider[];

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(provider: AIProvider): boolean;

  /**
   * Set the default provider
   */
  setDefaultProvider(provider: AIProvider): void;

  /**
   * Get token count for text
   */
  countTokens(text: string, provider?: AIProvider): number;

  // === Entity Extraction ===
  /**
   * Extract entities (characters, locations) from AI-generated content.
   * Non-streaming — returns structured JSON.
   */
  extractEntities(
    chapterId: ChapterId,
    content: string,
    options?: AIGenerationOptions
  ): Promise<ExtractedEntities>;
}

// ===========================================
// Entity Extraction Types
// ===========================================

/** A single entity extracted from content */
export interface ExtractedEntity {
  name: string;
  existingId: string | null; // matched against Bible, null if new
  isNew: boolean;
}

/** Result of entity extraction */
export interface ExtractedEntities {
  characters: ExtractedEntity[];
  locations: ExtractedEntity[];
}

// ===========================================
// QualityService
// ===========================================

/** Issue from quality check */
export interface Issue {
  id: number;
  ruleId: string;
  severity: 'info' | 'warning' | 'error';
  status: 'open' | 'resolved' | 'ignored';
  chapterId?: ChapterId;
  lineNumber?: number;
  message: string;
  suggestion?: string;
  autoFixable: boolean;
  ignoredReason?: string;
  resolvedAt?: string;
  createdAt: string;
}

/** Wayne principle check result */
export interface WaynePrincipleResult {
  principle: string;
  passed: boolean;
  note?: string;
  suggestion?: string;
}

/** Pacing analysis result */
export interface PacingAnalysis {
  chapterId: ChapterId;
  tensionCurve: Array<{ position: number; tension: number }>;
  emotionCurve: Array<{ position: number; emotion: string; intensity: number }>;
  paceScore: number;
  suggestions: string[];
}

/**
 * QualityService - Quality control: consistency, Wayne principles, pacing
 */
export interface IQualityService {
  // === Checks ===
  /**
   * Run all checks on a chapter
   */
  checkChapter(chapterId: ChapterId): Promise<CheckResult>;

  /**
   * Run consistency check
   */
  checkConsistency(chapterId: ChapterId): Promise<CheckResult>;

  /**
   * Run Wayne principles check (AI-assisted)
   */
  checkWaynePrinciples(chapterId: ChapterId): Promise<WaynePrincipleResult[]>;

  /**
   * Analyze pacing
   */
  analyzePacing(chapterId: ChapterId): Promise<PacingAnalysis>;

  /**
   * Check all chapters
   */
  checkAllChapters(): Promise<Map<ChapterId, CheckResult>>;

  // === Issues ===
  /**
   * Get all issues
   */
  getAllIssues(): Promise<Issue[]>;

  /**
   * Get issues for a chapter
   */
  getIssuesForChapter(chapterId: ChapterId): Promise<Issue[]>;

  /**
   * Get open issues
   */
  getOpenIssues(): Promise<Issue[]>;

  /**
   * Resolve an issue
   */
  resolveIssue(issueId: number): Promise<Issue>;

  /**
   * Ignore an issue
   */
  ignoreIssue(issueId: number, reason: string): Promise<Issue>;

  /**
   * Auto-fix an issue if possible
   */
  autoFix(issueId: number): Promise<Result<void, string>>;

  /**
   * Reopen an ignored issue
   */
  reopenIssue(issueId: number): Promise<Issue>;

  // === Rules ===
  /**
   * Get all available rules
   */
  getAvailableRules(): Promise<
    Array<{ id: string; name: string; description: string; enabled: boolean }>
  >;

  /**
   * Enable/disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): Promise<void>;
}

// ===========================================
// SearchService
// ===========================================

/** Search result item */
export interface SearchResultItem {
  entityType: 'character' | 'chapter' | 'location' | 'faction' | 'arc' | 'foreshadowing';
  entityId: string;
  title: string;
  highlight: string;
  score: number;
}

/** Search options */
export interface SearchOptions {
  /** Entity types to search */
  entityTypes?: SearchResultItem['entityType'][];
  /** Use semantic search */
  semantic?: boolean;
  /** Maximum results */
  limit?: number;
  /** Minimum relevance score (0-1) */
  minScore?: number;
}

/**
 * SearchService - Full-text and semantic search
 */
export interface ISearchService {
  // === Search ===
  /**
   * Search across all entities
   */
  search(query: string, options?: SearchOptions): Promise<SearchResultItem[]>;

  /**
   * Full-text search only
   */
  fullTextSearch(query: string, options?: SearchOptions): Promise<SearchResultItem[]>;

  /**
   * Semantic (vector) search only
   */
  semanticSearch(query: string, options?: SearchOptions): Promise<SearchResultItem[]>;

  /**
   * Find similar content
   */
  findSimilar(entityType: string, entityId: string, limit?: number): Promise<SearchResultItem[]>;

  // === Index Management ===
  /**
   * Update index for an entity
   */
  updateIndex(entityType: string, entityId: string): Promise<void>;

  /**
   * Remove entity from index
   */
  removeFromIndex(entityType: string, entityId: string): Promise<void>;

  /**
   * Rebuild all indexes
   */
  rebuildIndexes(): Promise<void>;

  /**
   * Get index statistics
   */
  getIndexStats(): Promise<{
    totalDocuments: number;
    totalEmbeddings: number;
    lastUpdated: string;
  }>;
}

// ===========================================
// ExportService (simplified per ADR-0005)
// ===========================================

/** Export format (PDF deferred — see GitHub #10) */
export type ExportFormat = 'md' | 'txt' | 'docx';

/** Export range */
export interface ExportRange {
  type: 'all' | 'volume' | 'chapters';
  volumeId?: VolumeId;
  chapterIds?: ChapterId[];
}

/** Export options */
export interface ExportOptions {
  format: ExportFormat;
  range: ExportRange;
  includeOutline?: boolean;
  includeMetadata?: boolean;
}

/** Story Bible export options */
export interface BibleExportOptions {
  sections?: Array<
    | 'characters'
    | 'relationships'
    | 'world'
    | 'locations'
    | 'factions'
    | 'arcs'
    | 'foreshadowing'
    | 'hooks'
  >;
}

/** Export result — returned by all export methods */
export interface ExportResult {
  data: Buffer | string;
  filename: string;
  mimeType: string;
}

/**
 * ExportService - Multi-format export (simplified per ADR-0005)
 *
 * Template system → GitHub #11
 * Pre-export checks → GitHub #12 (depends on QualityService, M7)
 */
export interface IExportService {
  /** Export chapters in specified format */
  exportChapters(options: ExportOptions): Promise<ExportResult>;

  /** Export Story Bible as structured Markdown */
  exportStoryBible(options?: BibleExportOptions): Promise<ExportResult>;
}

// ===========================================
// ConfigService
// ===========================================

/** Configuration key paths */
export type ConfigKey =
  | 'ai.provider'
  | 'ai.model'
  | 'ai.maxContextTokens'
  | 'export.defaultFormat'
  | 'export.includeMetadata'
  | 'writing.autoSaveInterval'
  | 'writing.versionInterval'
  | 'quality.enabledRules'
  | 'ui.theme'
  | 'ui.language';

/**
 * ConfigService - Application configuration
 */
export interface IConfigService {
  // === Project ===
  /**
   * Get project configuration
   */
  getProject(): Promise<Project | null>;

  /**
   * Update project configuration
   */
  updateProject(config: Partial<ProjectConfig>): Promise<Project>;

  /**
   * Initialize a new project
   */
  initProject(name: string, description?: string): Promise<Project>;

  // === Config Access ===
  /**
   * Get a configuration value
   */
  get<T>(key: ConfigKey): Promise<T | undefined>;

  /**
   * Set a configuration value
   */
  set<T>(key: ConfigKey, value: T): Promise<void>;

  /**
   * Get all configuration
   */
  getAll(): Promise<ProjectConfig>;

  /**
   * Reset to defaults
   */
  resetToDefaults(): Promise<void>;
}

// ===========================================
// EventBus
// ===========================================

/** Event handler function */
export type EventHandler<T = unknown> = (event: T) => void | Promise<void>;

/** Unsubscribe function */
export type Unsubscribe = () => void;

/**
 * EventBus - Pub/sub event system
 */
export interface IEventBus {
  /**
   * Subscribe to an event type
   */
  on<T>(eventType: string, handler: EventHandler<T>): Unsubscribe;

  /**
   * Subscribe to all events
   */
  onAny(handler: EventHandler): Unsubscribe;

  /**
   * Unsubscribe from an event type
   */
  off<T>(eventType: string, handler: EventHandler<T>): void;

  /**
   * Emit an event
   */
  emit<T>(event: T & { type: string }): void;

  /**
   * Emit and wait for all handlers to complete
   */
  emitAsync<T>(event: T & { type: string }): Promise<void>;
}

// ===========================================
// Database (Repository Pattern)
// ===========================================

/**
 * Base repository interface
 */
export interface IRepository<T, ID> {
  findAll(): Promise<T[]>;
  findById(id: ID): Promise<T | null>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: ID, data: Partial<T>): Promise<T>;
  delete(id: ID): Promise<void>;
  count(): Promise<number>;
}

/**
 * Database manager interface
 */
export interface IDatabaseManager {
  /**
   * Execute a query
   */
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;

  /**
   * Execute a single-result query
   */
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>;

  /**
   * Execute a write operation
   */
  run(sql: string, params?: unknown[]): Promise<{ lastInsertRowid: number; changes: number }>;

  /**
   * Execute multiple statements
   */
  exec(sql: string): Promise<void>;

  /**
   * Run operations in a transaction
   */
  transaction<T>(fn: () => Promise<T>): Promise<T>;

  /**
   * Run migrations
   */
  migrate(): Promise<void>;

  /**
   * Close the database connection
   */
  close(): Promise<void>;

  /**
   * Create a backup
   */
  backup(destPath: string): Promise<void>;
}

// ===========================================
// RuleEngine
// ===========================================

/** Rule severity levels */
export type RuleSeverity = 'info' | 'warning' | 'error';

/** Rule check types */
export type RuleCheckType = 'comparison' | 'regex' | 'count' | 'custom' | 'ai';

/** Rule definition */
export interface RuleDefinition {
  id: string;
  name: string;
  description?: string;
  category: string;
  severity: RuleSeverity;
  enabled: boolean;
  priority: number;

  check: {
    type: RuleCheckType;
    target?: string;
    condition?: string;
    pattern?: string;
    function?: string;
  };

  context?: string[];
  quickFix?: {
    available: boolean;
    type: 'replace' | 'insert' | 'delete';
    template?: string;
  };
}

/** Rule check result */
export interface RuleCheckResult {
  ruleId: string;
  passed: boolean;
  issues: Array<{
    ruleId: string;
    severity: RuleSeverity;
    message: string;
    location?: { line: number; text: string };
    suggestion?: string;
    autoFixable?: boolean;
  }>;
  metadata?: Record<string, unknown>;
}

/** Preset definition */
export interface RulePreset {
  id: string;
  name: string;
  description?: string;
  rules: Record<string, { enabled?: boolean; severity?: RuleSeverity }>;
}

/**
 * RuleEngine - Data-driven rule execution
 */
export interface IRuleEngine {
  // === Rule Management ===
  /**
   * Load rules from directory
   */
  loadRules(directory?: string): Promise<void>;

  /**
   * Get all loaded rules
   */
  getRules(): RuleDefinition[];

  /**
   * Get rules by category
   */
  getRulesByCategory(category: string): RuleDefinition[];

  /**
   * Enable/disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void;

  /**
   * Update rule configuration
   */
  updateRuleConfig(ruleId: string, config: Partial<RuleDefinition>): void;

  // === Rule Execution ===
  /**
   * Execute all applicable rules
   */
  check(input: unknown, context: Record<string, unknown>): Promise<RuleCheckResult[]>;

  /**
   * Execute specific rules
   */
  checkWithRules(
    input: unknown,
    context: Record<string, unknown>,
    ruleIds: string[]
  ): Promise<RuleCheckResult[]>;

  /**
   * Execute rules by category
   */
  checkByCategory(
    input: unknown,
    context: Record<string, unknown>,
    category: string
  ): Promise<RuleCheckResult[]>;

  // === Presets ===
  /**
   * Get available presets
   */
  getPresets(): RulePreset[];

  /**
   * Apply a preset
   */
  applyPreset(presetId: string): void;

  /**
   * Save current configuration as preset
   */
  saveAsPreset(id: string, name: string, description?: string): RulePreset;

  // === Hot Reload ===
  /**
   * Reload rules (for hot reload)
   */
  reload(): Promise<void>;
}

// ===========================================
// FileWatcher
// ===========================================

/** File sync direction */
export type SyncDirection = 'import' | 'export';

/** Conflict resolution strategy */
export type ConflictStrategy = 'last_write_wins' | 'db_wins' | 'file_wins' | 'manual';

/** File sync status */
export interface FileSyncStatus {
  path: string;
  entityType: string;
  entityId: string;
  lastSynced: string;
  contentHash: string;
  syncSource: 'db' | 'file';
}

/** Conflict information */
export interface SyncConflict {
  path: string;
  entityType: string;
  entityId: string;
  dbVersion: unknown;
  fileVersion: unknown;
  dbUpdatedAt: string;
  fileModifiedAt: string;
}

/**
 * FileWatcher - Bidirectional file synchronization
 */
export interface IFileWatcher {
  // === Lifecycle ===
  /**
   * Start watching directories
   */
  start(): Promise<void>;

  /**
   * Stop watching
   */
  stop(): Promise<void>;

  /**
   * Check if watcher is running
   */
  isRunning(): boolean;

  // === Sync Operations ===
  /**
   * Initial sync check
   */
  performInitialSync(): Promise<{
    imported: number;
    exported: number;
    conflicts: SyncConflict[];
  }>;

  /**
   * Import a file to database
   */
  importFile(path: string): Promise<void>;

  /**
   * Export entity to file
   */
  exportToFile(entityType: string, entityId: string): Promise<string>;

  /**
   * Get sync status for a file
   */
  getSyncStatus(path: string): Promise<FileSyncStatus | null>;

  /**
   * Get all sync statuses
   */
  getAllSyncStatuses(): Promise<FileSyncStatus[]>;

  // === Conflict Handling ===
  /**
   * Get pending conflicts
   */
  getPendingConflicts(): SyncConflict[];

  /**
   * Resolve a conflict
   */
  resolveConflict(
    path: string,
    resolution: 'use_db' | 'use_file' | 'manual',
    manualContent?: unknown
  ): Promise<void>;

  /**
   * Set conflict resolution strategy
   */
  setConflictStrategy(strategy: ConflictStrategy): void;

  // === Configuration ===
  /**
   * Add path to watch
   */
  addWatchPath(path: string): void;

  /**
   * Remove path from watch
   */
  removeWatchPath(path: string): void;

  /**
   * Get watched paths
   */
  getWatchedPaths(): string[];
}
