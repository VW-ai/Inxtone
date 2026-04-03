/**
 * ForeshadowingList Component
 *
 * Card grid with split layout for foreshadowing elements.
 * "Add Foreshadowing" opens a create panel in the detail area.
 * Clicking a card opens ForeshadowingDetail for viewing/editing.
 * Rich tracker lives in the Plot page.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  EmptyState,
  Badge,
  EditableField,
  LoadingSpinner,
} from '../../components/ui';
import { useForeshadowing, useCreateForeshadowing, useDeleteForeshadowing } from '../../hooks';
import { useSelectedId, useFormMode, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { ForeshadowingDetail } from './ForeshadowingDetail';
import type { ForeshadowingId, ForeshadowingStatus, ForeshadowingTerm } from '@inxtone/core';
import styles from './shared.module.css';
import layoutStyles from './CharacterList.module.css';
import detailStyles from './CharacterDetail.module.css';

const STATUS_VARIANTS: Record<ForeshadowingStatus, 'primary' | 'success' | 'muted'> = {
  active: 'primary',
  resolved: 'success',
  abandoned: 'muted',
};

const TERM_VARIANTS: Record<ForeshadowingTerm, 'default' | 'warning' | 'danger'> = {
  short: 'default',
  mid: 'warning',
  long: 'danger',
};

const TERM_OPTIONS = [
  { label: '(None)', value: '' },
  { label: 'Short', value: 'short' },
  { label: 'Mid', value: 'mid' },
  { label: 'Long', value: 'long' },
];

/** Inline create panel for new foreshadowing */
function ForeshadowingCreatePanel(): React.ReactElement {
  const createForeshadowing = useCreateForeshadowing();
  const { closeForm } = useStoryBibleActions();
  const [content, setContent] = useState('');
  const [term, setTerm] = useState<ForeshadowingTerm | ''>('');

  const canCreate = content.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    const input: { content: string; term?: 'short' | 'mid' | 'long' } = {
      content: content.trim(),
    };
    if (term) input.term = term;
    createForeshadowing.mutate(input, {
      onSuccess: () => {
        closeForm();
      },
    });
  };

  return (
    <div className={detailStyles.container}>
      <div className={detailStyles.header}>
        <div className={detailStyles.headerTop}>
          <h3 className={detailStyles.name}>New Foreshadowing</h3>
        </div>
      </div>

      <div className={detailStyles.content}>
        <section className={detailStyles.section}>
          <h3 className={detailStyles.sectionTitle}>Content</h3>
          <EditableField
            value={content}
            onSave={setContent}
            as="textarea"
            placeholder="Describe the foreshadowing element..."
          />
        </section>

        <section className={detailStyles.section}>
          <h3 className={detailStyles.sectionTitle}>Term</h3>
          <EditableField
            value={term}
            onSave={(v) => setTerm(v as ForeshadowingTerm | '')}
            as="select"
            options={TERM_OPTIONS}
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
          disabled={!canCreate || createForeshadowing.isPending}
        >
          {createForeshadowing.isPending ? 'Creating...' : 'Create Foreshadowing'}
        </Button>
      </div>
    </div>
  );
}

export function ForeshadowingList(): React.ReactElement {
  const { data: items, isLoading } = useForeshadowing();
  const deleteForeshadowing = useDeleteForeshadowing();
  const selectedId = useSelectedId();
  const formMode = useFormMode();
  const { select, openForm } = useStoryBibleActions();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingSpinner text="Loading foreshadowing..." />;
  }

  const handleCreate = () => {
    openForm('create');
  };

  const handleSelect = (id: ForeshadowingId) => {
    select(id);
  };

  const handleDelete = (id: ForeshadowingId) => {
    deleteForeshadowing.mutate(id);
    if (selectedId === id) {
      select(null);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className={layoutStyles.layout}>
        <div className={layoutStyles.listPanel}>
          <EmptyState
            title="No foreshadowing yet"
            description="Add foreshadowing to build your story's hidden threads and future payoffs."
            action={{ label: 'Add Foreshadowing', onClick: handleCreate }}
          />
        </div>
        {formMode === 'create' && (
          <div className={layoutStyles.detailPanel}>
            <ForeshadowingCreatePanel />
          </div>
        )}
      </div>
    );
  }

  const showDetail = selectedId && formMode !== 'create';
  const showCreate = formMode === 'create';

  return (
    <div className={layoutStyles.layout}>
      <div className={layoutStyles.listPanel}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Foreshadowing ({items.length})</h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/plot')}>
              View Tracker &rarr;
            </Button>
            <Button onClick={handleCreate}>+ Add Foreshadowing</Button>
          </div>
        </div>

        <div className={`${styles.grid} ${styles.grid2}`}>
          {items.map((item) => (
            <Card
              key={item.id}
              onClick={() => handleSelect(item.id)}
              selected={selectedId === item.id}
            >
              <div className={styles.cardHeader}>
                <Badge variant={STATUS_VARIANTS[item.status]}>{item.status}</Badge>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {item.term && <Badge variant={TERM_VARIANTS[item.term]}>{item.term}</Badge>}
                </div>
              </div>
              <p className={styles.cardDescription}>
                {item.content.length > 120 ? `${item.content.slice(0, 120)}...` : item.content}
              </p>
              {item.plantedChapter && (
                <p className={styles.cardMeta}>Planted in Ch. {item.plantedChapter}</p>
              )}
              <div className={styles.cardActions}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {showCreate && (
        <div className={layoutStyles.detailPanel}>
          <ForeshadowingCreatePanel />
        </div>
      )}
      {showDetail && (
        <div className={layoutStyles.detailPanel}>
          <ForeshadowingDetail
            foreshadowingId={selectedId as ForeshadowingId}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
}
