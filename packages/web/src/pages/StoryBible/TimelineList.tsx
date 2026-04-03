/**
 * TimelineList Component
 *
 * Vertical timeline visualization with date badges and connecting lines.
 * Split layout: timeline on left, create/detail panel on right.
 */

import React, { useState } from 'react';
import { Button, EmptyState, EditableField, LoadingSpinner } from '../../components/ui';
import { useTimeline, useCreateTimelineEvent, useDeleteTimelineEvent } from '../../hooks';
import { useSelectedId, useFormMode, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { TimelineDetail } from './TimelineDetail';
import styles from './shared.module.css';
import tlStyles from './TimelineList.module.css';
import layoutStyles from './CharacterList.module.css';
import detailStyles from './CharacterDetail.module.css';

function TimelineCreatePanel(): React.ReactElement {
  const createEvent = useCreateTimelineEvent();
  const { closeForm } = useStoryBibleActions();
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');

  const canCreate = description.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    const input: { description: string; eventDate?: string } = {
      description: description.trim(),
    };
    if (eventDate.trim()) input.eventDate = eventDate.trim();
    createEvent.mutate(input, {
      onSuccess: () => closeForm(),
    });
  };

  return (
    <div className={detailStyles.container}>
      <div className={detailStyles.header}>
        <div className={detailStyles.headerTop}>
          <h3 className={detailStyles.name}>New Timeline Event</h3>
        </div>
        <div className={detailStyles.meta}>
          <EditableField
            value={eventDate}
            onSave={setEventDate}
            placeholder="Event date (e.g. 2024-01-15)..."
          />
        </div>
      </div>

      <div className={detailStyles.content}>
        <section className={detailStyles.section}>
          <h3 className={detailStyles.sectionTitle}>Description</h3>
          <EditableField
            value={description}
            onSave={setDescription}
            as="textarea"
            placeholder="What happened at this point in the story..."
          />
        </section>
      </div>

      <div className={detailStyles.actions}>
        <Button variant="ghost" size="md" onClick={closeForm}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleCreate}
          disabled={!canCreate || createEvent.isPending}
        >
          {createEvent.isPending ? 'Creating...' : 'Create Event'}
        </Button>
      </div>
    </div>
  );
}

export function TimelineList(): React.ReactElement {
  const { data: events, isLoading } = useTimeline();
  const deleteEvent = useDeleteTimelineEvent();
  const selectedId = useSelectedId();
  const formMode = useFormMode();
  const { openForm, select } = useStoryBibleActions();

  if (isLoading) {
    return <LoadingSpinner text="Loading timeline..." />;
  }

  const handleCreate = () => {
    openForm('create');
  };

  const handleSelect = (id: number) => {
    select(id);
  };

  const handleDelete = (id: number): void => {
    deleteEvent.mutate(id);
    if (selectedId === id) {
      select(null);
    }
  };

  if (!events || events.length === 0) {
    return (
      <div className={layoutStyles.layout}>
        <div className={layoutStyles.listPanel}>
          <EmptyState
            title="No timeline events yet"
            description="Add events to track your story's chronology."
            action={{ label: 'Add Event', onClick: handleCreate }}
          />
        </div>
        {formMode === 'create' && (
          <div className={layoutStyles.detailPanel}>
            <TimelineCreatePanel />
          </div>
        )}
      </div>
    );
  }

  // Sort chronologically by eventDate, fall back to createdAt
  const sorted = [...events].sort((a, b) => {
    const dateA = a.eventDate ?? a.createdAt;
    const dateB = b.eventDate ?? b.createdAt;
    return dateA.localeCompare(dateB);
  });

  const showCreate = formMode === 'create';
  const showDetail = selectedId != null && formMode !== 'create';

  return (
    <div className={layoutStyles.layout}>
      <div className={layoutStyles.listPanel}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Timeline ({events.length})</h2>
          <Button onClick={handleCreate}>+ Add Event</Button>
        </div>

        <div className={tlStyles.timeline}>
          {sorted.map((event) => (
            <div
              key={event.id}
              className={`${tlStyles.event} ${selectedId === event.id ? tlStyles.selected : ''}`}
              onClick={() => handleSelect(event.id)}
              style={{ cursor: 'pointer' }}
            >
              {event.eventDate && <span className={tlStyles.dateBadge}>{event.eventDate}</span>}
              <div className={tlStyles.eventCard}>
                <p className={tlStyles.description}>{event.description}</p>
                <div className={tlStyles.actions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(event.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <div className={layoutStyles.detailPanel}>
          <TimelineCreatePanel />
        </div>
      )}
      {showDetail && (
        <div className={layoutStyles.detailPanel}>
          <TimelineDetail eventId={selectedId as number} onDelete={handleDelete} />
        </div>
      )}
    </div>
  );
}
