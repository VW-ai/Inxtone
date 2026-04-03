/**
 * Intake React Query Hooks
 *
 * Mutations for Smart Intake API: decompose, commit.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../lib/api';
import { showError } from '../lib/utils';
import { characterKeys, relationshipKeys, locationKeys, factionKeys } from './index';
import { arcKeys } from './useArcs';
import { foreshadowingKeys } from './useForeshadowing';
import { hookKeys } from './useHooks';
import { timelineKeys } from './useTimeline';
import { worldKeys } from './useWorld';
import type { DecomposeResult, IntakeHint, IntakeCommitResult } from '@inxtone/core';

// ─── Types ───────────────────────────────────────────────

interface DecomposeInput {
  text: string;
  hint?: IntakeHint;
}

interface CommitEntity {
  entityType: string;
  action: 'create' | 'merge' | 'skip';
  data: Record<string, unknown>;
  existingId?: string;
}

interface CommitInput {
  entities: CommitEntity[];
}

// ─── Hooks ───────────────────────────────────────────────

/** Decompose NL text into structured entities */
export function useDecompose() {
  return useMutation({
    mutationFn: (input: DecomposeInput) =>
      apiPost<DecomposeResult, DecomposeInput>('/intake/decompose', input),
    onError: (error) => showError('Extraction failed', error),
  });
}

/** Commit confirmed entities to Story Bible */
export function useCommitEntities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CommitInput) =>
      apiPost<IntakeCommitResult, CommitInput>('/intake/commit', input),
    onSuccess: () => {
      // Invalidate all entity caches so pages reflect new data
      void queryClient.invalidateQueries({ queryKey: characterKeys.all });
      void queryClient.invalidateQueries({ queryKey: relationshipKeys.all });
      void queryClient.invalidateQueries({ queryKey: locationKeys.all });
      void queryClient.invalidateQueries({ queryKey: factionKeys.all });
      void queryClient.invalidateQueries({ queryKey: arcKeys.all });
      void queryClient.invalidateQueries({ queryKey: foreshadowingKeys.all });
      void queryClient.invalidateQueries({ queryKey: hookKeys.all });
      void queryClient.invalidateQueries({ queryKey: timelineKeys.all });
      void queryClient.invalidateQueries({ queryKey: worldKeys.all });
    },
    onError: (error) => showError('Commit failed', error),
  });
}
