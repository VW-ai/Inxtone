/**
 * ArcDetail Component
 *
 * Detail panel with inline editing for arc fields.
 * Matches ArcCreatePanel layout so the UX feels consistent.
 */

import React from 'react';
import { Button, Badge, EditableField, LoadingSpinner } from '../../components/ui';
import { useArc, useUpdateArc } from '../../hooks';
import type { ArcId, ArcStatus, CreateArcInput } from '@inxtone/core';
import styles from './CharacterDetail.module.css';

export interface ArcDetailProps {
  arcId: ArcId;
  onDelete: (id: ArcId) => void;
}

const TYPE_OPTIONS = [
  { label: 'Main Arc', value: 'main' },
  { label: 'Sub Arc', value: 'sub' },
];

const STATUS_OPTIONS = [
  { label: 'Planned', value: 'planned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Complete', value: 'complete' },
];

export function ArcDetail({ arcId, onDelete }: ArcDetailProps): React.ReactElement {
  const { data: arc, isLoading } = useArc(arcId);
  const updateArc = useUpdateArc();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading arc..." />
      </div>
    );
  }

  if (!arc) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Arc not found</div>
      </div>
    );
  }

  const save = (data: Partial<CreateArcInput>) => {
    updateArc.mutate({ id: arc.id, data });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <EditableField
            value={arc.name}
            onSave={(name) => save({ name })}
            heading
            placeholder="Arc name..."
          />
        </div>
        <div className={styles.meta}>
          <EditableField
            value={arc.type}
            onSave={(type) => save({ type: type as 'main' | 'sub' })}
            as="select"
            options={TYPE_OPTIONS}
          />
          <EditableField
            value={arc.status}
            onSave={(status) => save({ status: status as ArcStatus })}
            as="select"
            options={STATUS_OPTIONS}
          />
          <span className={styles.id}>{arc.id}</span>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Progress */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Progress</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                flex: 1,
                height: '6px',
                background: 'var(--color-border)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${arc.progress}%`,
                  background: 'var(--color-gold)',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 'var(--font-sm)',
                color: 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {arc.progress}%
            </span>
          </div>
        </section>

        {/* Chapter Range */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Chapter Range</h3>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <EditableField
              label="Start"
              value={arc.chapterStart != null ? String(arc.chapterStart) : ''}
              onSave={(v) => {
                const n = parseInt(v, 10);
                if (!isNaN(n)) save({ chapterStart: n });
              }}
              placeholder="Start..."
            />
            <span style={{ color: 'var(--color-text-muted)' }}>&rarr;</span>
            <EditableField
              label="End"
              value={arc.chapterEnd != null ? String(arc.chapterEnd) : ''}
              onSave={(v) => {
                const n = parseInt(v, 10);
                if (!isNaN(n)) save({ chapterEnd: n });
              }}
              placeholder="End..."
            />
          </div>
        </section>

        {/* Sub-arc relation */}
        {arc.type === 'sub' && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Main Arc Relation</h3>
            <EditableField
              value={arc.mainArcRelation ?? ''}
              onSave={(mainArcRelation) => save({ mainArcRelation })}
              as="textarea"
              placeholder="How does this sub-arc relate to the main arc?"
            />
          </section>
        )}

        {/* Sections */}
        {arc.sections && arc.sections.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Sections ({arc.sections.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {arc.sections.map((section, i) => (
                <div
                  key={i}
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--color-surface-alt)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 'var(--font-sm)' }}>{section.name}</span>
                  <Badge
                    variant={
                      section.status === 'complete'
                        ? 'success'
                        : section.status === 'in_progress'
                          ? 'warning'
                          : 'muted'
                    }
                  >
                    {section.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Character Arcs */}
        {arc.characterArcs && Object.keys(arc.characterArcs).length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Character Arcs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {Object.entries(arc.characterArcs).map(([charId, desc]) => (
                <div
                  key={charId}
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--color-surface-alt)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                    {charId}
                  </span>
                  <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-sm)' }}>{desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Metadata */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Metadata</h3>
          <div className={styles.metadata}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Created</span>
              <span className={styles.metaValue}>
                {new Date(arc.createdAt).toLocaleDateString()}
              </span>
            </div>
            {arc.updatedAt !== arc.createdAt && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Updated</span>
                <span className={styles.metaValue}>
                  {new Date(arc.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button onClick={() => onDelete(arc.id)} variant="danger" size="md">
          Delete Arc
        </Button>
      </div>
    </div>
  );
}
