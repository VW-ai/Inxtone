/**
 * API Types for Inxtone
 *
 * Defines the HTTP API contracts between client and server.
 * Used by both the server package (implementation) and web package (consumption).
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
  World,
  Arc,
  ArcId,
  Foreshadowing,
  ForeshadowingId,
  Hook,
  Volume,
  VolumeId,
  Chapter,
  ChapterId,
  ChapterStatus,
  WritingGoal,
  WritingSession,
  Version,
  CheckResult,
  Project,
} from './entities.js';

import type {
  Issue,
  WaynePrincipleResult,
  PacingAnalysis,
  SearchResultItem,
  ExportOptions,
  AIGenerationOptions,
  ContextItem,
  BuiltContext,
  WritingStats,
  CharacterWithRelations,
} from './services.js';

// ===========================================
// Common API Types
// ===========================================

/** Standard API response wrapper */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

/** Standard API error response */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Paginated API response */
export interface PaginatedApiResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** API result type */
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

// ===========================================
// Error Codes
// ===========================================

export const ApiErrorCodes = {
  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',

  // Entity-specific
  DUPLICATE_NAME: 'DUPLICATE_NAME',
  ENTITY_IN_USE: 'ENTITY_IN_USE',
  INVALID_REFERENCE: 'INVALID_REFERENCE',

  // AI-specific
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  AI_RATE_LIMITED: 'AI_RATE_LIMITED',
  AI_CONTEXT_TOO_LARGE: 'AI_CONTEXT_TOO_LARGE',
  AI_CONTENT_FILTERED: 'AI_CONTENT_FILTERED',

  // Export-specific
  EXPORT_FAILED: 'EXPORT_FAILED',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',

  // Database-specific
  DATABASE_ERROR: 'DATABASE_ERROR',
  MIGRATION_FAILED: 'MIGRATION_FAILED',
} as const;

export type ApiErrorCode = (typeof ApiErrorCodes)[keyof typeof ApiErrorCodes];

// ===========================================
// Project API
// ===========================================

/** GET /api/project */
export type GetProjectResponse = ApiResponse<Project | null>;

/** POST /api/project */
export interface InitProjectRequest {
  name: string;
  description?: string;
}
export type InitProjectResponse = ApiResponse<Project>;

/** PATCH /api/project */
export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  config?: Partial<Project['config']>;
}
export type UpdateProjectResponse = ApiResponse<Project>;

// ===========================================
// Characters API
// ===========================================

/** GET /api/characters */
export interface GetCharactersQuery {
  role?: CharacterRole;
  search?: string;
}
export type GetCharactersResponse = ApiResponse<Character[]>;

/** GET /api/characters/:id */
export type GetCharacterResponse = ApiResponse<Character>;

/** GET /api/characters/:id/relations */
export type GetCharacterRelationsResponse = ApiResponse<CharacterWithRelations>;

/** POST /api/characters */
export interface CreateCharacterRequest {
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
export type CreateCharacterResponse = ApiResponse<Character>;

/** PATCH /api/characters/:id */
export interface UpdateCharacterRequest extends Partial<CreateCharacterRequest> {
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
export type UpdateCharacterResponse = ApiResponse<Character>;

/** DELETE /api/characters/:id */
export type DeleteCharacterResponse = ApiResponse<{ deleted: true }>;

// ===========================================
// Relationships API
// ===========================================

/** GET /api/relationships */
export interface GetRelationshipsQuery {
  characterId?: CharacterId;
}
export type GetRelationshipsResponse = ApiResponse<Relationship[]>;

/** POST /api/relationships */
export interface CreateRelationshipRequest {
  sourceId: CharacterId;
  targetId: CharacterId;
  type: Relationship['type'];
  joinReason?: string;
  independentGoal?: string;
  disagreeScenarios?: string[];
  leaveScenarios?: string[];
  mcNeeds?: string;
  evolution?: string;
}
export type CreateRelationshipResponse = ApiResponse<Relationship>;

/** PATCH /api/relationships/:id */
export type UpdateRelationshipRequest = Partial<CreateRelationshipRequest>;
export type UpdateRelationshipResponse = ApiResponse<Relationship>;

/** DELETE /api/relationships/:id */
export type DeleteRelationshipResponse = ApiResponse<{ deleted: true }>;

// ===========================================
// World API
// ===========================================

/** GET /api/world */
export type GetWorldResponse = ApiResponse<World | null>;

/** PATCH /api/world */
export interface UpdateWorldRequest {
  powerSystem?: World['powerSystem'];
  socialRules?: World['socialRules'];
}
export type UpdateWorldResponse = ApiResponse<World>;

// ===========================================
// Locations API
// ===========================================

/** GET /api/locations */
export type GetLocationsResponse = ApiResponse<Location[]>;

/** GET /api/locations/:id */
export type GetLocationResponse = ApiResponse<Location>;

/** POST /api/locations */
export interface CreateLocationRequest {
  name: string;
  type?: string;
  significance?: string;
  atmosphere?: string;
  details?: Record<string, unknown>;
}
export type CreateLocationResponse = ApiResponse<Location>;

/** PATCH /api/locations/:id */
export type UpdateLocationRequest = Partial<CreateLocationRequest>;
export type UpdateLocationResponse = ApiResponse<Location>;

/** DELETE /api/locations/:id */
export type DeleteLocationResponse = ApiResponse<{ deleted: true }>;

// ===========================================
// Factions API
// ===========================================

/** GET /api/factions */
export type GetFactionsResponse = ApiResponse<Faction[]>;

/** GET /api/factions/:id */
export type GetFactionResponse = ApiResponse<Faction>;

/** POST /api/factions */
export interface CreateFactionRequest {
  name: string;
  type?: string;
  status?: string;
  leaderId?: CharacterId;
  stanceToMC?: Faction['stanceToMC'];
  goals?: string[];
  resources?: string[];
  internalConflict?: string;
}
export type CreateFactionResponse = ApiResponse<Faction>;

/** PATCH /api/factions/:id */
export type UpdateFactionRequest = Partial<CreateFactionRequest>;
export type UpdateFactionResponse = ApiResponse<Faction>;

/** DELETE /api/factions/:id */
export type DeleteFactionResponse = ApiResponse<{ deleted: true }>;

// ===========================================
// Arcs API
// ===========================================

/** GET /api/arcs */
export type GetArcsResponse = ApiResponse<Arc[]>;

/** GET /api/arcs/:id */
export type GetArcResponse = ApiResponse<Arc>;

/** POST /api/arcs */
export interface CreateArcRequest {
  name: string;
  type: 'main' | 'sub';
  chapterStart?: ChapterId;
  chapterEnd?: ChapterId;
  status?: Arc['status'];
  sections?: Arc['sections'];
  characterArcs?: Arc['characterArcs'];
  mainArcRelation?: string;
}
export type CreateArcResponse = ApiResponse<Arc>;

/** PATCH /api/arcs/:id */
export type UpdateArcRequest = Partial<CreateArcRequest> & { progress?: number };
export type UpdateArcResponse = ApiResponse<Arc>;

/** DELETE /api/arcs/:id */
export type DeleteArcResponse = ApiResponse<{ deleted: true }>;

// ===========================================
// Foreshadowing API
// ===========================================

/** GET /api/foreshadowing */
export interface GetForeshadowingQuery {
  status?: 'active' | 'resolved' | 'abandoned';
}
export type GetForeshadowingResponse = ApiResponse<Foreshadowing[]>;

/** GET /api/foreshadowing/:id */
export type GetForeshadowingItemResponse = ApiResponse<Foreshadowing>;

/** POST /api/foreshadowing */
export interface CreateForeshadowingRequest {
  content: string;
  plantedChapter?: ChapterId;
  plantedText?: string;
  plannedPayoff?: ChapterId;
  term?: 'short' | 'mid' | 'long';
}
export type CreateForeshadowingResponse = ApiResponse<Foreshadowing>;

/** PATCH /api/foreshadowing/:id */
export type UpdateForeshadowingRequest = Partial<CreateForeshadowingRequest> & {
  status?: 'active' | 'resolved' | 'abandoned';
};
export type UpdateForeshadowingResponse = ApiResponse<Foreshadowing>;

/** POST /api/foreshadowing/:id/hint */
export interface AddForeshadowingHintRequest {
  chapter: ChapterId;
  text: string;
}
export type AddForeshadowingHintResponse = ApiResponse<Foreshadowing>;

/** POST /api/foreshadowing/:id/resolve */
export interface ResolveForeshadowingRequest {
  resolvedChapter: ChapterId;
}
export type ResolveForeshadowingResponse = ApiResponse<Foreshadowing>;

/** POST /api/foreshadowing/:id/abandon */
export type AbandonForeshadowingResponse = ApiResponse<Foreshadowing>;

/** DELETE /api/foreshadowing/:id */
export type DeleteForeshadowingResponse = ApiResponse<{ deleted: true }>;

// ===========================================
// Hooks API
// ===========================================

/** GET /api/hooks */
export interface GetHooksQuery {
  chapterId?: ChapterId;
  type?: Hook['type'];
}
export type GetHooksResponse = ApiResponse<Hook[]>;

/** POST /api/hooks */
export interface CreateHookRequest {
  type: Hook['type'];
  chapterId?: ChapterId;
  content: string;
  hookType?: Hook['hookType'];
  strength?: number;
}
export type CreateHookResponse = ApiResponse<Hook>;

/** PATCH /api/hooks/:id */
export type UpdateHookRequest = Partial<CreateHookRequest>;
export type UpdateHookResponse = ApiResponse<Hook>;

/** DELETE /api/hooks/:id */
export type DeleteHookResponse = ApiResponse<{ deleted: true }>;

// ===========================================
// Volumes API
// ===========================================

/** GET /api/volumes */
export type GetVolumesResponse = ApiResponse<Volume[]>;

/** GET /api/volumes/:id */
export type GetVolumeResponse = ApiResponse<Volume>;

/** POST /api/volumes */
export interface CreateVolumeRequest {
  name?: string;
  theme?: string;
  coreConflict?: string;
  mcGrowth?: string;
  status?: Volume['status'];
}
export type CreateVolumeResponse = ApiResponse<Volume>;

/** PATCH /api/volumes/:id */
export type UpdateVolumeRequest = Partial<CreateVolumeRequest>;
export type UpdateVolumeResponse = ApiResponse<Volume>;

/** DELETE /api/volumes/:id */
export type DeleteVolumeResponse = ApiResponse<{ deleted: true }>;

// ===========================================
// Chapters API
// ===========================================

/** GET /api/chapters */
export interface GetChaptersQuery {
  volumeId?: VolumeId;
  arcId?: ArcId;
  status?: ChapterStatus;
}
export type GetChaptersResponse = ApiResponse<Chapter[]>;

/** GET /api/chapters/:id */
export interface GetChapterQuery {
  includeContent?: boolean;
}
export type GetChapterResponse = ApiResponse<Chapter>;

/** POST /api/chapters */
export interface CreateChapterRequest {
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
export type CreateChapterResponse = ApiResponse<Chapter>;

/** PATCH /api/chapters/:id */
export interface UpdateChapterRequest {
  volumeId?: VolumeId | null;
  arcId?: ArcId | null;
  title?: string;
  status?: ChapterStatus;
  outline?: Chapter['outline'];
  characters?: CharacterId[];
  locations?: LocationId[];
  foreshadowingPlanted?: ForeshadowingId[];
  foreshadowingHinted?: ForeshadowingId[];
  foreshadowingResolved?: ForeshadowingId[];
  emotionCurve?: Chapter['emotionCurve'];
  tension?: Chapter['tension'];
}
export type UpdateChapterResponse = ApiResponse<Chapter>;

/** PUT /api/chapters/:id/content */
export interface SaveChapterContentRequest {
  content: string;
  createVersion?: boolean;
}
export type SaveChapterContentResponse = ApiResponse<Chapter>;

/** POST /api/chapters/reorder */
export interface ReorderChaptersRequest {
  chapterIds: ChapterId[];
}
export type ReorderChaptersResponse = ApiResponse<{ reordered: true }>;

/** DELETE /api/chapters/:id */
export type DeleteChapterResponse = ApiResponse<{ deleted: true }>;

// ===========================================
// Versions API
// ===========================================

/** GET /api/chapters/:chapterId/versions */
export type GetVersionsResponse = ApiResponse<Version[]>;

/** GET /api/versions/:id */
export type GetVersionResponse = ApiResponse<Version>;

/** POST /api/chapters/:chapterId/versions */
export interface CreateVersionRequest {
  summary?: string;
}
export type CreateVersionResponse = ApiResponse<Version>;

/** GET /api/versions/compare */
export interface CompareVersionsQuery {
  versionId1: number;
  versionId2: number;
}
export interface VersionComparisonResult {
  added: number;
  removed: number;
  wordCountDelta: number;
}
export type CompareVersionsResponse = ApiResponse<VersionComparisonResult>;

/** POST /api/chapters/:chapterId/rollback */
export interface RollbackRequest {
  versionId: number;
}
export type RollbackResponse = ApiResponse<Chapter>;

// ===========================================
// Writing Goals API
// ===========================================

/** GET /api/goals */
export interface GetGoalsQuery {
  active?: boolean;
}
export type GetGoalsResponse = ApiResponse<WritingGoal[]>;

/** POST /api/goals/daily */
export interface SetDailyGoalRequest {
  targetWords: number;
}
export type SetDailyGoalResponse = ApiResponse<WritingGoal>;

/** POST /api/goals/chapter */
export interface SetChapterGoalRequest {
  chapterId: ChapterId;
  targetWords: number;
}
export type SetChapterGoalResponse = ApiResponse<WritingGoal>;

/** PATCH /api/goals/:id */
export interface UpdateGoalRequest {
  currentWords?: number;
  status?: WritingGoal['status'];
}
export type UpdateGoalResponse = ApiResponse<WritingGoal>;

// ===========================================
// Writing Sessions API
// ===========================================

/** GET /api/sessions */
export interface GetSessionsQuery {
  date?: string; // ISO date
}
export type GetSessionsResponse = ApiResponse<WritingSession[]>;

/** POST /api/sessions/start */
export interface StartSessionRequest {
  chapterId?: ChapterId;
}
export type StartSessionResponse = ApiResponse<WritingSession>;

/** POST /api/sessions/:id/end */
export type EndSessionResponse = ApiResponse<WritingSession>;

// ===========================================
// Statistics API
// ===========================================

/** GET /api/stats */
export interface GetStatsQuery {
  startDate: string;
  endDate: string;
}
export type GetStatsResponse = ApiResponse<WritingStats>;

/** GET /api/stats/streak */
export type GetStreakResponse = ApiResponse<{ streak: number }>;

/** GET /api/stats/word-count */
export type GetTotalWordCountResponse = ApiResponse<{ totalWords: number }>;

// ===========================================
// AI API
// ===========================================

/** POST /api/ai/continue */
export interface AIContinueRequest {
  chapterId: ChapterId;
  options?: AIGenerationOptions;
}
// Response is SSE stream

/** POST /api/ai/dialogue */
export interface AIDialogueRequest {
  characterIds: CharacterId[];
  context: string;
  options?: AIGenerationOptions;
}
// Response is SSE stream

/** POST /api/ai/describe */
export interface AIDescribeRequest {
  locationId: LocationId;
  mood: string;
  options?: AIGenerationOptions;
}
// Response is SSE stream

/** POST /api/ai/brainstorm */
export interface AIBrainstormRequest {
  topic: string;
  options?: AIGenerationOptions;
}
// Response is SSE stream

/** POST /api/ai/ask */
export interface AIAskRequest {
  question: string;
  options?: AIGenerationOptions;
}
// Response is SSE stream

/** POST /api/ai/complete */
export interface AICompleteRequest {
  prompt: string;
  context?: ContextItem[];
  options?: AIGenerationOptions;
}
// Response is SSE stream

/** POST /api/ai/context */
export interface AIBuildContextRequest {
  chapterId: ChapterId;
  additionalItems?: ContextItem[];
}
export type AIBuildContextResponse = ApiResponse<BuiltContext>;

/** GET /api/ai/providers */
export interface AIProvidersInfo {
  available: string[];
  configured: string[];
  default: string;
}
export type AIProvidersResponse = ApiResponse<AIProvidersInfo>;

// ===========================================
// Quality API
// ===========================================

/** POST /api/quality/check/:chapterId */
export type CheckChapterResponse = ApiResponse<CheckResult>;

/** POST /api/quality/check-all */
export type CheckAllResponse = ApiResponse<Record<ChapterId, CheckResult>>;

/** GET /api/quality/wayne/:chapterId */
export type CheckWayneResponse = ApiResponse<WaynePrincipleResult[]>;

/** GET /api/quality/pacing/:chapterId */
export type PacingAnalysisResponse = ApiResponse<PacingAnalysis>;

/** GET /api/issues */
export interface GetIssuesQuery {
  chapterId?: ChapterId;
  status?: Issue['status'];
  severity?: Issue['severity'];
}
export type GetIssuesResponse = ApiResponse<Issue[]>;

/** POST /api/issues/:id/resolve */
export type ResolveIssueResponse = ApiResponse<Issue>;

/** POST /api/issues/:id/ignore */
export interface IgnoreIssueRequest {
  reason: string;
}
export type IgnoreIssueResponse = ApiResponse<Issue>;

/** POST /api/issues/:id/reopen */
export type ReopenIssueResponse = ApiResponse<Issue>;

/** POST /api/issues/:id/auto-fix */
export type AutoFixIssueResponse = ApiResponse<{ fixed: boolean; error?: string }>;

/** GET /api/rules */
export interface RuleInfo {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}
export type GetRulesResponse = ApiResponse<RuleInfo[]>;

/** PATCH /api/rules/:id */
export interface UpdateRuleRequest {
  enabled: boolean;
}
export type UpdateRuleResponse = ApiResponse<RuleInfo>;

// ===========================================
// Search API
// ===========================================

/** GET /api/search */
export interface SearchQuery {
  q: string;
  types?: string; // comma-separated
  semantic?: boolean;
  limit?: number;
  minScore?: number;
}
export type SearchResponse = ApiResponse<SearchResultItem[]>;

/** GET /api/search/similar */
export interface SimilarQuery {
  entityType: string;
  entityId: string;
  limit?: number;
}
export type SimilarResponse = ApiResponse<SearchResultItem[]>;

/** POST /api/search/rebuild */
export type RebuildIndexResponse = ApiResponse<{ started: true }>;

/** GET /api/search/stats */
export interface IndexStatsInfo {
  totalDocuments: number;
  totalEmbeddings: number;
  lastUpdated: string;
}
export type IndexStatsResponse = ApiResponse<IndexStatsInfo>;

// ===========================================
// Export API
// ===========================================

/** POST /api/export */
export type ExportRequest = ExportOptions;
export type ExportResponse = ApiResponse<{ path: string }>;
// Also supports SSE for progress updates

/** POST /api/export/story-bible */
export interface ExportStoryBibleRequest {
  format: 'md' | 'txt' | 'docx';
  outputPath: string;
}
export type ExportStoryBibleResponse = ApiResponse<{ path: string }>;

/** GET /api/export/templates */
export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
}
export type GetExportTemplatesResponse = ApiResponse<ExportTemplate[]>;

/** POST /api/export/preview */
export interface PreviewExportRequest {
  templateId: string;
  chapterId: ChapterId;
}
export type PreviewExportResponse = ApiResponse<{ preview: string }>;

/** POST /api/export/pre-check */
export interface PreExportCheckRequest {
  range: ExportOptions['range'];
}
export interface PreExportCheckResult {
  hasErrors: boolean;
  issues: Issue[];
  unresolvedForeshadowing: Foreshadowing[];
  incompleteChapters: Chapter[];
}
export type PreExportCheckResponse = ApiResponse<PreExportCheckResult>;

// ===========================================
// Config API
// ===========================================

/** GET /api/config */
export type GetConfigResponse = ApiResponse<Project['config']>;

/** PATCH /api/config */
export type UpdateConfigRequest = Partial<Project['config']>;
export type UpdateConfigResponse = ApiResponse<Project['config']>;

/** POST /api/config/reset */
export type ResetConfigResponse = ApiResponse<Project['config']>;
