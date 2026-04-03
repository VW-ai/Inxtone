/**
 * ArcList Component
 *
 * Card grid with split layout: cards on left, create panel on right.
 * Rich visualization lives in the Plot page; this is the Bible tab view.
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
import { useArcs, useCreateArc, useDeleteArc } from '../../hooks';
import { useSelectedId, useFormMode, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { ArcDetail } from './ArcDetail';
import type { ArcId, ArcStatus, ChapterId, CreateArcInput } from '@inxtone/core';
import styles from './shared.module.css';
import layoutStyles from './CharacterList.module.css';
import detailStyles from './CharacterDetail.module.css';

const STATUS_VARIANTS: Record<ArcStatus, 'muted' | 'warning' | 'success'> = {
  planned: 'muted',
  in_progress: 'warning',
  complete: 'success',
};

const TYPE_OPTIONS = [
  { label: '(None)', value: '' },
  { label: 'Main Arc', value: 'main' },
  { label: 'Sub Arc', value: 'sub' },
];

const STATUS_OPTIONS = [
  { label: '(None)', value: '' },
  { label: 'Planned', value: 'planned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Complete', value: 'complete' },
];

/** Inline create panel for new arcs */
function ArcCreatePanel({ onCreated }: { onCreated: (id: ArcId) => void }): React.ReactElement {
  const createArc = useCreateArc();
  const { closeForm } = useStoryBibleActions();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [chapterStart, setChapterStart] = useState('');
  const [chapterEnd, setChapterEnd] = useState('');
  const [status, setStatus] = useState('');

  const canCreate = name.trim().length > 0 && type !== '';

  const handleCreate = () => {
    if (!canCreate) return;
    const input: {
      name: string;
      type: 'main' | 'sub';
      chapterStart?: ChapterId;
      chapterEnd?: ChapterId;
      status?: ArcStatus;
    } = {
      name: name.trim(),
      type: type as 'main' | 'sub',
    };
    const parsedStart = parseInt(chapterStart, 10);
    if (!isNaN(parsedStart)) input.chapterStart = parsedStart;
    const parsedEnd = parseInt(chapterEnd, 10);
    if (!isNaN(parsedEnd)) input.chapterEnd = parsedEnd;
    if (status) input.status = status as ArcStatus;
    createArc.mutate(input as CreateArcInput, {
      onSuccess: (arc) => onCreated(arc.id),
    });
  };

  return (
    <div className={detailStyles.container}>
      <div className={detailStyles.header}>
        <div className={detailStyles.headerTop}>
          <EditableField value={name} onSave={setName} heading placeholder="Arc name..." />
        </div>
        <div className={detailStyles.meta}>
          <EditableField value={type} onSave={setType} as="select" options={TYPE_OPTIONS} />
          <EditableField value={status} onSave={setStatus} as="select" options={STATUS_OPTIONS} />
        </div>
      </div>
      <div className={detailStyles.content}>
        <section className={detailStyles.section}>
          <h3 className={detailStyles.sectionTitle}>Chapter Range</h3>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <EditableField
              value={chapterStart}
              onSave={setChapterStart}
              placeholder="Start chapter..."
            />
            <EditableField value={chapterEnd} onSave={setChapterEnd} placeholder="End chapter..." />
          </div>
        </section>
        <p
          style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
          }}
        >
          Create the arc first, then manage sections and details in the Plot page.
        </p>
      </div>
      <div className={detailStyles.actions}>
        <Button variant="ghost" size="md" onClick={closeForm}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleCreate}
          disabled={!canCreate || createArc.isPending}
        >
          {createArc.isPending ? 'Creating...' : 'Create Arc'}
        </Button>
      </div>
    </div>
  );
}

export function ArcList(): React.ReactElement {
  const { data: arcs, isLoading } = useArcs();
  const deleteArc = useDeleteArc();
  const selectedId = useSelectedId();
  const formMode = useFormMode();
  const { select, openForm } = useStoryBibleActions();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingSpinner text="Loading arcs..." />;
  }

  const handleCreate = () => {
    openForm('create');
  };

  const handleSelect = (id: ArcId) => {
    select(id);
  };

  const handleDelete = (id: ArcId) => {
    deleteArc.mutate(id);
    if (selectedId === id) {
      select(null);
    }
  };

  const handleCreated = (id: ArcId) => {
    select(id);
  };

  if (!arcs || arcs.length === 0) {
    return (
      <div className={layoutStyles.layout}>
        <div className={layoutStyles.listPanel}>
          <EmptyState
            title="No arcs yet"
            description="Add arcs to organize your story's major plot threads."
            action={{ label: 'Add Arc', onClick: handleCreate }}
          />
        </div>
        {formMode === 'create' && (
          <div className={layoutStyles.detailPanel}>
            <ArcCreatePanel onCreated={handleCreated} />
          </div>
        )}
      </div>
    );
  }

  const showCreate = formMode === 'create';
  const showDetail = selectedId && formMode !== 'create';

  return (
    <div className={layoutStyles.layout}>
      <div className={layoutStyles.listPanel}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Story Arcs ({arcs.length})</h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/plot')}>
              View in Plot &rarr;
            </Button>
            <Button onClick={handleCreate}>+ Add Arc</Button>
          </div>
        </div>

        <div className={`${styles.grid} ${styles.grid2}`}>
          {arcs.map((arc) => (
            <Card
              key={arc.id}
              onClick={() => handleSelect(arc.id)}
              selected={selectedId === arc.id}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{arc.name}</h3>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Badge variant={arc.type === 'main' ? 'primary' : 'default'}>{arc.type}</Badge>
                  <Badge variant={STATUS_VARIANTS[arc.status]}>
                    {arc.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              {/* Mini progress bar */}
              <div
                style={{
                  height: '3px',
                  background: 'var(--color-border)',
                  borderRadius: '2px',
                  margin: '0 0 var(--space-3)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${arc.progress}%`,
                    background: 'var(--color-gold)',
                    borderRadius: '2px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                {arc.progress}% complete
              </span>
              <div className={styles.cardActions}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(arc.id);
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
          <ArcCreatePanel onCreated={handleCreated} />
        </div>
      )}
      {showDetail && (
        <div className={layoutStyles.detailPanel}>
          <ArcDetail arcId={selectedId as ArcId} onDelete={handleDelete} />
        </div>
      )}
    </div>
  );
}
