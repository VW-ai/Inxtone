/**
 * Timeline React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { showError } from '../lib/utils';
import type {
  TimelineEvent,
  CharacterId,
  LocationId,
  UpdateTimelineEventInput,
} from '@inxtone/core';

// Query Keys
export const timelineKeys = {
  all: ['timeline'] as const,
  list: () => [...timelineKeys.all, 'list'] as const,
};

// Input type for creating timeline events
interface CreateTimelineEventInput {
  eventDate?: string;
  description: string;
  relatedCharacters?: CharacterId[];
  relatedLocations?: LocationId[];
}

// List all timeline events
export function useTimeline() {
  return useQuery({
    queryKey: timelineKeys.list(),
    queryFn: () => apiGet<TimelineEvent[]>('/timeline'),
  });
}

// Get single timeline event (derived from list cache)
export function useTimelineEvent(id: number | null) {
  const { data: events, ...rest } = useTimeline();
  const event = id != null ? events?.find((e) => e.id === id) : undefined;
  return { data: event, ...rest };
}

// Create timeline event
export function useCreateTimelineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTimelineEventInput) =>
      apiPost<TimelineEvent, CreateTimelineEventInput>('/timeline', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineKeys.all });
    },
    onError: (error) => showError('Failed to create timeline event', error),
  });
}

// Update timeline event
export function useUpdateTimelineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTimelineEventInput }) =>
      apiPatch<TimelineEvent, UpdateTimelineEventInput>(`/timeline/${id}`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineKeys.all });
    },
    onError: (error) => showError('Failed to update timeline event', error),
  });
}

// Delete timeline event
export function useDeleteTimelineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiDelete(`/timeline/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineKeys.all });
    },
    onError: (error) => showError('Failed to delete timeline event', error),
  });
}
