/**
 * useEntityExtraction — mutation hook for post-accept entity extraction
 *
 * Calls POST /api/ai/extract-entities and stores result in editor store.
 */

import { useMutation } from '@tanstack/react-query';
import { apiPost } from '../lib/api';
import { useEditorStore } from '../stores/useEditorStore';
import type { ExtractedEntities, ChapterId } from '@inxtone/core';

interface ExtractEntitiesInput {
  chapterId: ChapterId;
  content: string;
}

/**
 * Mutation that extracts entities from content and stores result
 * in the editor store as pendingExtraction.
 */
export function useExtractEntities() {
  const setPendingExtraction = useEditorStore((s) => s.setPendingExtraction);

  return useMutation({
    mutationFn: (input: ExtractEntitiesInput) =>
      apiPost<ExtractedEntities, ExtractEntitiesInput>('/ai/extract-entities', input),
    onSuccess: (data) => {
      // Only set pending if there are actual entities to review
      const hasEntities = (data.characters?.length ?? 0) > 0 || (data.locations?.length ?? 0) > 0;
      if (hasEntities) {
        setPendingExtraction(data);
      }
    },
    onError: () => {
      // Silently fail — extraction is a background enhancement, not critical
    },
  });
}
