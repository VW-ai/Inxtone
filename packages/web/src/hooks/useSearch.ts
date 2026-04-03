/**
 * useSearch — React Query hook for full-text search across all entity types.
 */

import { useQuery } from '@tanstack/react-query';
import type { SearchResultItem } from '@inxtone/core';
import { apiGet } from '../lib/api';

export const searchKeys = {
  all: ['search'] as const,
  query: (q: string, types?: string[]) => [...searchKeys.all, q, types] as const,
};

/**
 * Search across all entity types with debounced query.
 *
 * @param query - Search query (min 2 chars to trigger)
 * @param types - Optional entity type filter
 * @param enabled - Whether the query is enabled
 */
export function useSearch(query: string, types?: string[], enabled = true) {
  const params = new URLSearchParams();
  params.set('q', query);
  if (types && types.length > 0) params.set('types', types.join(','));

  return useQuery({
    queryKey: searchKeys.query(query, types),
    queryFn: async () => {
      const response = await apiGet<{ results: SearchResultItem[] }>(
        `/search?${params.toString()}`
      );
      return response.results;
    },
    enabled: enabled && query.trim().length >= 2,
    staleTime: 30_000,
  });
}
