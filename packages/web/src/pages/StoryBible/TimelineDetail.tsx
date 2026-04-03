/**
 * TimelineDetail Component
 *
 * Detail panel with inline editing for timeline event fields.
 */

import React from 'react';
import { Button, EditableField, LoadingSpinner } from '../../components/ui';
import { useTimelineEvent, useUpdateTimelineEvent } from '../../hooks';
import type { UpdateTimelineEventInput } from '@inxtone/core';
import styles from './CharacterDetail.module.css';

export interface TimelineDetailProps {
  eventId: number;
  onDelete: (id: number) => void;
}

export function TimelineDetail({ eventId, onDelete }: TimelineDetailProps): React.ReactElement {
  const { data: event, isLoading } = useTimelineEvent(eventId);
  const updateEvent = useUpdateTimelineEvent();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading event..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Timeline event not found</div>
      </div>
    );
  }

  const save = (data: UpdateTimelineEventInput) => {
    updateEvent.mutate({ id: event.id, data });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h3 className={styles.name}>Timeline Event</h3>
          <span className={styles.id}>#{event.id}</span>
        </div>
        <div className={styles.meta}>
          <EditableField
            value={event.eventDate ?? ''}
            onSave={(eventDate) => {
              const input: UpdateTimelineEventInput = {};
              if (eventDate) input.eventDate = eventDate;
              save(input);
            }}
            placeholder="Event date (e.g. 2024-01-15)..."
          />
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Description</h3>
          <EditableField
            value={event.description}
            onSave={(description) => save({ description })}
            as="textarea"
            placeholder="What happened at this point in the story..."
          />
        </section>

        {/* Metadata */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Metadata</h3>
          <div className={styles.metadata}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Created</span>
              <span className={styles.metaValue}>
                {new Date(event.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button onClick={() => onDelete(event.id)} variant="danger" size="md">
          Delete Event
        </Button>
      </div>
    </div>
  );
}
