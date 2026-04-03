/**
 * Foreshadowing React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { showError } from '../lib/utils';
import type {
  Foreshadowing,
  ForeshadowingId,
  ChapterId,
  CreateForeshadowingInput,
  UpdateForeshadowingInput,
} from '@inxtone/core';

// Helper to normalize filters (remove undefined values)
function normalizeFilters<T extends Record<string, unknown>>(filters?: T): T | undefined {
  if (!filters) return undefined;
  const normalized = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined)
  ) as T;
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

// Query Keys
export const foreshadowingKeys = {
  all: ['foreshadowing'] as const,
  list: (active?: boolean) => [...foreshadowingKeys.all, normalizeFilters({ active })] as const,
  detail: (id: ForeshadowingId) => [...foreshadowingKeys.all, id] as const,
};

// List all foreshadowing
export function useForeshadowing(activeOnly?: boolean) {
  return useQuery({
    queryKey: foreshadowingKeys.list(activeOnly),
    queryFn: () => apiGet<Foreshadowing[]>(activeOnly ? '/foreshadowing/active' : '/foreshadowing'),
  });
}

// Get single foreshadowing
export function useForeshadowingItem(id: ForeshadowingId | null) {
  return useQuery({
    queryKey: foreshadowingKeys.detail(id!),
    queryFn: () => apiGet<Foreshadowing>(`/foreshadowing/${id}`),
    enabled: !!id,
  });
}

// Create foreshadowing
export function useCreateForeshadowing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateForeshadowingInput) =>
      apiPost<Foreshadowing, CreateForeshadowingInput>('/foreshadowing', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: foreshadowingKeys.all });
    },
    onError: (error) => showError('Failed to create foreshadowing', error),
  });
}

// Update foreshadowing
export function useUpdateForeshadowing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: ForeshadowingId; data: UpdateForeshadowingInput }) =>
      apiPatch<Foreshadowing, UpdateForeshadowingInput>(`/foreshadowing/${id}`, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: foreshadowingKeys.all });
      void queryClient.invalidateQueries({ queryKey: foreshadowingKeys.detail(id) });
    },
    onError: (error) => showError('Failed to update foreshadowing', error),
  });
}

// Add hint to foreshadowing
export function useAddForeshadowingHint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      hint,
    }: {
      id: ForeshadowingId;
      hint: { chapter: ChapterId; text: string };
    }) =>
      apiPost<Foreshadowing, { chapter: ChapterId; text: string }>(
        `/foreshadowing/${id}/hint`,
        hint
      ),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: foreshadowingKeys.all });
      void queryClient.invalidateQueries({ queryKey: foreshadowingKeys.detail(id) });
    },
    onError: (error) => showError('Failed to add hint', error),
  });
}

// Resolve foreshadowing
export function useResolveForeshadowing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, chapterId }: { id: ForeshadowingId; chapterId: ChapterId }) =>
      apiPost<Foreshadowing, { chapterId: ChapterId }>(`/foreshadowing/${id}/resolve`, {
        chapterId,
      }),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: foreshadowingKeys.all });
      void queryClient.invalidateQueries({ queryKey: foreshadowingKeys.detail(id) });
    },
    onError: (error) => showError('Failed to resolve foreshadowing', error),
  });
}

// Abandon foreshadowing
export function useAbandonForeshadowing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: ForeshadowingId) =>
      apiPost<Foreshadowing, Record<string, never>>(`/foreshadowing/${id}/abandon`, {}),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: foreshadowingKeys.all });
      void queryClient.invalidateQueries({ queryKey: foreshadowingKeys.detail(id) });
    },
    onError: (error) => showError('Failed to abandon foreshadowing', error),
  });
}

// Delete foreshadowing
export function useDeleteForeshadowing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: ForeshadowingId) => apiDelete(`/foreshadowing/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: foreshadowingKeys.all });
    },
    onError: (error) => showError('Failed to delete foreshadowing', error),
  });
}
