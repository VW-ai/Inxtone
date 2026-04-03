/**
 * React Query Hooks Barrel Export
 */

// Characters
export {
  characterKeys,
  useCharacters,
  useCharacter,
  useCharacterWithRelations,
  useCreateCharacter,
  useUpdateCharacter,
  useDeleteCharacter,
} from './useCharacters';

// Relationships
export {
  relationshipKeys,
  useRelationships,
  useRelationship,
  useCreateRelationship,
  useUpdateRelationship,
  useDeleteRelationship,
} from './useRelationships';

// World
export { worldKeys, useWorld, useUpdateWorld, useSetPowerSystem } from './useWorld';

// Locations
export {
  locationKeys,
  useLocations,
  useLocation,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from './useLocations';

// Factions
export {
  factionKeys,
  useFactions,
  useFaction,
  useCreateFaction,
  useUpdateFaction,
  useDeleteFaction,
} from './useFactions';

// Timeline
export {
  timelineKeys,
  useTimeline,
  useTimelineEvent,
  useCreateTimelineEvent,
  useUpdateTimelineEvent,
  useDeleteTimelineEvent,
} from './useTimeline';

// Arcs
export { arcKeys, useArcs, useArc, useCreateArc, useUpdateArc, useDeleteArc } from './useArcs';

// Foreshadowing
export {
  foreshadowingKeys,
  useForeshadowing,
  useForeshadowingItem,
  useCreateForeshadowing,
  useUpdateForeshadowing,
  useAddForeshadowingHint,
  useResolveForeshadowing,
  useAbandonForeshadowing,
  useDeleteForeshadowing,
} from './useForeshadowing';

// Hooks
export {
  hookKeys,
  useHooks,
  useHook,
  useCreateHook,
  useUpdateHook,
  useDeleteHook,
} from './useHooks';

// Search
export { searchKeys, useSearch } from './useSearch';

// Keyboard Shortcuts
export { useShortcut, getShortcutDefinitions, SHORTCUT_REFERENCE } from './useKeyboardShortcuts';
export type { ShortcutDef } from './useKeyboardShortcuts';

// Entity Extraction
export { useExtractEntities } from './useEntityExtraction';

// Chapter Setup Assist
export { setupKeys, useChapterSetup } from './useChapterSetup';
export type { SetupSuggestion } from './useChapterSetup';

// Chapters & Volumes
export {
  chapterKeys,
  volumeKeys,
  versionKeys,
  contextKeys,
  useChapters,
  useChapterWithContent,
  useCreateChapter,
  useUpdateChapter,
  useSaveContent,
  useDeleteChapter,
  useVolumes,
  useVersions,
  useBuildContext,
} from './useChapters';

// Intake
export { useDecompose, useCommitEntities } from './useIntake';
export { useIntakeImport } from './useIntakeImport';
