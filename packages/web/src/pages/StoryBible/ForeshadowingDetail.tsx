/**
 * ForeshadowingDetail Component
 *
 * Detail panel with inline editing for foreshadowing fields.
 */

import React from 'react';
import { Button, Badge, EditableField, LoadingSpinner } from '../../components/ui';
import { useForeshadowingItem, useUpdateForeshadowing } from '../../hooks';
import type {
  ForeshadowingId,
  ForeshadowingStatus,
  ForeshadowingTerm,
  UpdateForeshadowingInput,
} from '@inxtone/core';
import styles from './CharacterDetail.module.css';

export interface ForeshadowingDetailProps {
  foreshadowingId: ForeshadowingId;
  onDelete: (id: ForeshadowingId) => void;
}

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Abandoned', value: 'abandoned' },
];

const STATUS_VARIANTS: Record<ForeshadowingStatus, 'primary' | 'success' | 'muted'> = {
  active: 'primary',
  resolved: 'success',
  abandoned: 'muted',
};

const TERM_OPTIONS = [
  { label: '(None)', value: '' },
  { label: 'Short', value: 'short' },
  { label: 'Mid', value: 'mid' },
  { label: 'Long', value: 'long' },
];

const TERM_VARIANTS: Record<ForeshadowingTerm, 'default' | 'warning' | 'danger'> = {
  short: 'default',
  mid: 'warning',
  long: 'danger',
};

export function ForeshadowingDetail({
  foreshadowingId,
  onDelete,
}: ForeshadowingDetailProps): React.ReactElement {
  const { data: item, isLoading } = useForeshadowingItem(foreshadowingId);
  const updateForeshadowing = useUpdateForeshadowing();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading foreshadowing..." />
      </div>
    );
  }

  if (!item) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Foreshadowing not found</div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const save = (data: Record<string, any>) => {
    updateForeshadowing.mutate({ id: item.id, data: data as UpdateForeshadowingInput });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h3 className={styles.name}>Foreshadowing</h3>
          <span className={styles.id}>{item.id}</span>
        </div>
        <div className={styles.meta}>
          <Badge variant={STATUS_VARIANTS[item.status]}>{item.status}</Badge>
          {item.term && <Badge variant={TERM_VARIANTS[item.term]}>{item.term}</Badge>}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Content</h3>
          <EditableField
            value={item.content}
            onSave={(content) => save({ content })}
            as="textarea"
            placeholder="Describe the foreshadowing element..."
          />
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Status</h3>
          <EditableField
            value={item.status}
            onSave={(status) => save({ status })}
            as="select"
            options={STATUS_OPTIONS}
          />
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Term</h3>
          <EditableField
            value={item.term ?? ''}
            onSave={(term) => {
              const input: UpdateForeshadowingInput = {};
              if (term) input.term = term as ForeshadowingTerm;
              save(input);
            }}
            as="select"
            options={TERM_OPTIONS}
          />
        </section>

        {/* Planted/Resolved chapter info (read-only) */}
        {(item.plantedChapter !== undefined || item.resolvedChapter !== undefined) && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Chapter References</h3>
            <div className={styles.metadata}>
              {item.plantedChapter !== undefined && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Planted Chapter</span>
                  <span className={styles.metaValue}>Ch. {item.plantedChapter}</span>
                </div>
              )}
              {item.resolvedChapter !== undefined && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Resolved Chapter</span>
                  <span className={styles.metaValue}>Ch. {item.resolvedChapter}</span>
                </div>
              )}
              {item.plannedPayoff !== undefined && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Planned Payoff</span>
                  <span className={styles.metaValue}>Ch. {item.plannedPayoff}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Planted Text */}
        {item.plantedText && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Planted Text</h3>
            <p className={styles.text}>{item.plantedText}</p>
          </section>
        )}

        {/* Hints */}
        {item.hints && item.hints.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Hints ({item.hints.length})</h3>
            <ul className={styles.list}>
              {item.hints.map((hint, i) => (
                <li key={i} className={styles.listItem}>
                  <span
                    style={{
                      fontSize: 'var(--font-xs)',
                      fontWeight: 600,
                      color: 'var(--color-accent)',
                      fontFamily: 'var(--font-mono)',
                      marginRight: 'var(--space-2)',
                    }}
                  >
                    Ch. {hint.chapter}
                  </span>
                  {hint.text}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Metadata */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Metadata</h3>
          <div className={styles.metadata}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Created</span>
              <span className={styles.metaValue}>
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
            {item.updatedAt !== item.createdAt && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Updated</span>
                <span className={styles.metaValue}>
                  {new Date(item.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button onClick={() => onDelete(item.id)} variant="danger" size="md">
          Delete Foreshadowing
        </Button>
      </div>
    </div>
  );
}
