/**
 * Chapter & Volume React Query Hooks
 *
 * Server-state management for writing workspace.
 * Follows the same pattern as useArcs.ts.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '../lib/api';
import { showError } from '../lib/utils';
import type {
  Chapter,
  Volume,
  Version,
  ChapterId,
  VolumeId,
  ArcId,
  ChapterStatus,
  CreateChapterInput,
  UpdateChapterInput,
  BuiltContext,
  ContextItem,
} from '@inxtone/core';

// ===================================
// Query Keys
// ===================================

export const chapterKeys = {
  all: ['chapters'] as const,
  list: (filters?: { volumeId?: VolumeId; arcId?: ArcId; status?: ChapterStatus }) =>
    [...chapterKeys.all, 'list', filters] as const,
  detail: (id: ChapterId) => [...chapterKeys.all, id] as const,
  withContent: (id: ChapterId) => [...chapterKeys.all, id, 'content'] as const,
};

export const volumeKeys = {
  all: ['volumes'] as const,
  list: () => [...volumeKeys.all, 'list'] as const,
};

export const versionKeys = {
  all: ['versions'] as const,
  list: (chapterId: ChapterId) => [...versionKeys.all, 'list', chapterId] as const,
};

export const contextKeys = {
  all: ['context'] as const,
  build: (chapterId: ChapterId, additionalIds?: string[]) =>
    [...contextKeys.all, chapterId, additionalIds] as const,
};

// ===================================
// Chapter Hooks
// ===================================

/** List chapters with optional filters */
export function useChapters(filters?: {
  volumeId?: VolumeId;
  arcId?: ArcId;
  status?: ChapterStatus;
}) {
  const params = new URLSearchParams();
  if (filters?.volumeId) params.set('volumeId', String(filters.volumeId));
  if (filters?.arcId) params.set('arcId', filters.arcId);
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString();

  return useQuery({
    queryKey: chapterKeys.list(filters),
    queryFn: () => apiGet<Chapter[]>(`/chapters${qs ? `?${qs}` : ''}`),
  });
}

/** Get chapter with content */
export function useChapterWithContent(id: ChapterId | null) {
  return useQuery({
    queryKey: chapterKeys.withContent(id!),
    queryFn: () => apiGet<Chapter>(`/chapters/${id}?includeContent=true`),
    enabled: id != null,
  });
}

/** Create chapter */
export function useCreateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChapterInput) =>
      apiPost<Chapter, CreateChapterInput>('/chapters', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chapterKeys.all });
    },
    onError: (error) => showError('Failed to create chapter', error),
  });
}

/** Update chapter metadata */
export function useUpdateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: ChapterId; data: UpdateChapterInput }) =>
      apiPatch<Chapter, UpdateChapterInput>(`/chapters/${id}`, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: chapterKeys.all });
      void queryClient.invalidateQueries({ queryKey: chapterKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: chapterKeys.withContent(id) });
    },
    onError: (error) => showError('Failed to update chapter', error),
  });
}

/** Save chapter content */
export function useSaveContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chapterId,
      content,
      createVersion,
    }: {
      chapterId: ChapterId;
      content: string;
      createVersion?: boolean;
    }) => {
      const body: { content: string; createVersion?: boolean } = { content };
      if (createVersion !== undefined) body.createVersion = createVersion;
      return apiPut<Chapter, { content: string; createVersion?: boolean }>(
        `/chapters/${chapterId}/content`,
        body
      );
    },
    onSuccess: (_, { chapterId }) => {
      void queryClient.invalidateQueries({ queryKey: chapterKeys.all });
      void queryClient.invalidateQueries({ queryKey: chapterKeys.withContent(chapterId) });
    },
    onError: (error) => showError('Failed to save content', error),
  });
}

/** Delete chapter */
export function useDeleteChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: ChapterId) => apiDelete(`/chapters/${id}`),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: chapterKeys.all });
      void queryClient.removeQueries({ queryKey: chapterKeys.detail(id) });
      void queryClient.removeQueries({ queryKey: chapterKeys.withContent(id) });
    },
    onError: (error) => showError('Failed to delete chapter', error),
  });
}

// ===================================
// Volume Hooks
// ===================================

/** List all volumes */
export function useVolumes() {
  return useQuery({
    queryKey: volumeKeys.list(),
    queryFn: () => apiGet<Volume[]>('/volumes'),
  });
}

// ===================================
// Version Hooks
// ===================================

/** List versions for a chapter */
export function useVersions(chapterId: ChapterId | null) {
  return useQuery({
    queryKey: versionKeys.list(chapterId!),
    queryFn: () => apiGet<Version[]>(`/chapters/${chapterId}/versions`),
    enabled: chapterId != null,
  });
}

// ===================================
// Context Hook
// ===================================

/** Build AI context for a chapter, optionally with additional L5 items */
export function useBuildContext(chapterId: ChapterId | null, additionalItems?: ContextItem[]) {
  const additionalIds = additionalItems?.map((i) => i.id ?? '').filter(Boolean);

  return useQuery({
    queryKey: contextKeys.build(chapterId!, additionalIds),
    queryFn: () => {
      const body: { chapterId: ChapterId; additionalItems?: ContextItem[] } = {
        chapterId: chapterId!,
      };
      if (additionalItems && additionalItems.length > 0) {
        body.additionalItems = additionalItems;
      }
      return apiPost<BuiltContext, typeof body>('/ai/context', body);
    },
    enabled: chapterId != null,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
