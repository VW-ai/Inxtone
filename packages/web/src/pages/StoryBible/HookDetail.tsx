/**
 * HookDetail Component
 *
 * Detail panel with inline editing for hook fields.
 */

import React from 'react';
import { Button, EditableField, LoadingSpinner } from '../../components/ui';
import { useHook, useUpdateHook } from '../../hooks';
import type { HookId, CreateHookInput } from '@inxtone/core';
import styles from './CharacterDetail.module.css';

export interface HookDetailProps {
  hookId: HookId;
  onDelete: (id: HookId) => void;
}

const TYPE_OPTIONS = [
  { label: 'Opening', value: 'opening' },
  { label: 'Arc', value: 'arc' },
  { label: 'Chapter', value: 'chapter' },
];

const STYLE_OPTIONS = [
  { label: '(None)', value: '' },
  { label: 'Suspense', value: 'suspense' },
  { label: 'Anticipation', value: 'anticipation' },
  { label: 'Emotion', value: 'emotion' },
  { label: 'Mystery', value: 'mystery' },
];

export function HookDetail({ hookId, onDelete }: HookDetailProps): React.ReactElement {
  const { data: hook, isLoading } = useHook(hookId);
  const updateHook = useUpdateHook();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading hook..." />
      </div>
    );
  }

  if (!hook) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Hook not found</div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const save = (data: Record<string, any>) => {
    updateHook.mutate({ id: hook.id, data: data as Partial<CreateHookInput> });
  };

  const strengthColor =
    (hook.strength ?? 0) >= 70
      ? 'var(--color-success)'
      : (hook.strength ?? 0) >= 40
        ? 'var(--color-gold)'
        : 'var(--color-danger)';

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <EditableField
            value={hook.type}
            onSave={(type) => save({ type })}
            as="select"
            options={TYPE_OPTIONS}
          />
          <EditableField
            value={hook.hookType ?? ''}
            onSave={(hookType) => save({ hookType: hookType || undefined })}
            as="select"
            options={STYLE_OPTIONS}
          />
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Content</h3>
          <EditableField
            value={hook.content}
            onSave={(content) => save({ content })}
            as="textarea"
            placeholder="Hook content..."
          />
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Strength</h3>
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
                  width: `${hook.strength ?? 0}%`,
                  background: strengthColor,
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <EditableField
              value={String(hook.strength ?? 0)}
              onSave={(val) => {
                const n = Math.min(100, Math.max(0, parseInt(val, 10) || 0));
                save({ strength: n });
              }}
              placeholder="0-100"
            />
          </div>
        </section>

        {hook.chapterId && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Chapter</h3>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
              Chapter {hook.chapterId}
            </p>
          </section>
        )}

        {/* Metadata */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Metadata</h3>
          <div className={styles.metadata}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Created</span>
              <span className={styles.metaValue}>
                {new Date(hook.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button onClick={() => onDelete(hook.id)} variant="danger" size="md">
          Delete Hook
        </Button>
      </div>
    </div>
  );
}
