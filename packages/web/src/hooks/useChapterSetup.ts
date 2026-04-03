/**
 * useChapterSetup — React Query hook for chapter setup assist suggestions
 *
 * Fetches heuristic entity suggestions for a chapter from the
 * GET /api/chapters/:id/setup-suggestions endpoint.
 */

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';
import type { ChapterId } from '@inxtone/core';

export interface SetupSuggestion {
  entityType: 'character' | 'location' | 'foreshadowing';
  entityId: string;
  name: string;
  source: 'previous_chapter' | 'arc_roster' | 'outline_mention';
  confidence: number;
}

export const setupKeys = {
  all: ['setup-suggestions'] as const,
  chapter: (id: ChapterId) => [...setupKeys.all, id] as const,
};

/**
 * Fetch setup suggestions for a chapter.
 * Enabled only when chapterId is provided.
 */
export function useChapterSetup(chapterId: ChapterId | null) {
  return useQuery({
    queryKey: setupKeys.chapter(chapterId!),
    queryFn: () => apiGet<SetupSuggestion[]>(`/chapters/${chapterId}/setup-suggestions`),
    enabled: chapterId != null,
    staleTime: 30 * 1000, // 30 seconds — suggestions change when chapter entities change
  });
}
