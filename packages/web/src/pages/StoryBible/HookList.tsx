/**
 * HookList Component
 *
 * Card grid with split layout: compact hook cards on left, detail panel on right.
 * "Add Hook" opens a create panel in the detail area.
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
import { useHooks, useCreateHook, useDeleteHook } from '../../hooks';
import { useSelectedId, useFormMode, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { HookDetail } from './HookDetail';
import type { HookType, HookStyle, HookId } from '@inxtone/core';
import styles from './shared.module.css';
import layoutStyles from './CharacterList.module.css';
import detailStyles from './CharacterDetail.module.css';

const TYPE_VARIANTS: Record<HookType, 'primary' | 'warning' | 'default'> = {
  opening: 'primary',
  arc: 'warning',
  chapter: 'default',
};

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

function StrengthBar({ value }: { value: number }): React.ReactElement {
  const color =
    value >= 70
      ? 'var(--color-success)'
      : value >= 40
        ? 'var(--color-gold)'
        : 'var(--color-danger)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
      }}
    >
      <div
        style={{
          flex: 1,
          height: '3px',
          background: 'var(--color-border)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${value}%`,
            background: color,
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span
        style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', minWidth: '30px' }}
      >
        {value}%
      </span>
    </div>
  );
}

/** Inline create panel for new hooks */
function HookCreatePanel({ onCreated }: { onCreated: (id: HookId) => void }): React.ReactElement {
  const createHook = useCreateHook();
  const { closeForm } = useStoryBibleActions();
  const [type, setType] = useState<HookType>('chapter');
  const [hookType, setHookType] = useState<HookStyle | ''>('');
  const [content, setContent] = useState('');
  const [strength, setStrength] = useState(50);

  const canCreate = content.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    const input: { type: HookType; content: string; hookType?: HookStyle; strength: number } = {
      type,
      content: content.trim(),
      strength,
    };
    if (hookType) input.hookType = hookType;
    createHook.mutate(input, {
      onSuccess: (hook) => {
        onCreated(hook.id);
      },
    });
  };

  const strengthColor =
    strength >= 70
      ? 'var(--color-success)'
      : strength >= 40
        ? 'var(--color-gold)'
        : 'var(--color-danger)';

  return (
    <div className={detailStyles.container}>
      <div className={detailStyles.header}>
        <div className={detailStyles.headerTop}>
          <EditableField
            value={type}
            onSave={(v) => setType(v as HookType)}
            as="select"
            options={TYPE_OPTIONS}
          />
          <EditableField
            value={hookType}
            onSave={(v) => setHookType(v as HookStyle | '')}
            as="select"
            options={STYLE_OPTIONS}
          />
        </div>
      </div>

      <div className={detailStyles.content}>
        <section className={detailStyles.section}>
          <h3 className={detailStyles.sectionTitle}>Content</h3>
          <EditableField
            value={content}
            onSave={setContent}
            as="textarea"
            placeholder="Write your hook content..."
          />
        </section>

        <section className={detailStyles.section}>
          <h3 className={detailStyles.sectionTitle}>Strength</h3>
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
                  width: `${strength}%`,
                  background: strengthColor,
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <EditableField
              value={String(strength)}
              onSave={(val) => {
                setStrength(Math.min(100, Math.max(0, parseInt(val, 10) || 0)));
              }}
              placeholder="0-100"
            />
          </div>
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
          disabled={!canCreate || createHook.isPending}
        >
          {createHook.isPending ? 'Creating...' : 'Create Hook'}
        </Button>
      </div>
    </div>
  );
}

export function HookList(): React.ReactElement {
  const { data: hooks, isLoading } = useHooks();
  const deleteHook = useDeleteHook();
  const selectedId = useSelectedId();
  const formMode = useFormMode();
  const { select, openForm } = useStoryBibleActions();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingSpinner text="Loading hooks..." />;
  }

  const handleCreate = () => {
    openForm('create');
  };

  const handleSelect = (id: HookId) => {
    select(id);
  };

  const handleDelete = (id: HookId) => {
    deleteHook.mutate(id);
    if (selectedId === id) {
      select(null);
    }
  };

  const handleCreated = (id: HookId) => {
    select(id);
  };

  if (!hooks || hooks.length === 0) {
    return (
      <div className={layoutStyles.layout}>
        <div className={layoutStyles.listPanel}>
          <EmptyState
            title="No hooks yet"
            description="Add hooks to keep readers engaged with questions, mysteries, and promises."
            action={{ label: 'Add Hook', onClick: handleCreate }}
          />
        </div>
        {formMode === 'create' && (
          <div className={layoutStyles.detailPanel}>
            <HookCreatePanel onCreated={handleCreated} />
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
          <h2 className={styles.sectionTitle}>Narrative Hooks ({hooks.length})</h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/plot')}>
              View in Plot &rarr;
            </Button>
            <Button onClick={handleCreate}>+ Add Hook</Button>
          </div>
        </div>

        <div className={`${styles.grid} ${styles.grid2}`}>
          {hooks.map((hook) => (
            <Card
              key={hook.id}
              onClick={() => handleSelect(hook.id)}
              selected={selectedId === hook.id}
            >
              <div className={styles.cardHeader}>
                <Badge variant={TYPE_VARIANTS[hook.type]}>{hook.type}</Badge>
                {hook.hookType && <Badge variant="muted">{hook.hookType}</Badge>}
              </div>
              <p className={styles.cardDescription}>
                {hook.content.length > 120 ? `${hook.content.slice(0, 120)}...` : hook.content}
              </p>
              {hook.chapterId && (
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                  Ch. {hook.chapterId}
                </span>
              )}
              {hook.strength !== undefined && <StrengthBar value={hook.strength} />}
              <div className={styles.cardActions}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(hook.id);
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
          <HookCreatePanel onCreated={handleCreated} />
        </div>
      )}
      {showDetail && (
        <div className={layoutStyles.detailPanel}>
          <HookDetail hookId={selectedId as HookId} onDelete={handleDelete} />
        </div>
      )}
    </div>
  );
}
