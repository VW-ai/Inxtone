/**
 * FactionDetail Component
 *
 * Detail panel with inline editing for faction fields.
 */

import React from 'react';
import { Button, EditableField, EditableList, LoadingSpinner } from '../../components/ui';
import { useFaction, useUpdateFaction, useCharacters } from '../../hooks';
import type { FactionId, CharacterId, CreateFactionInput } from '@inxtone/core';
import styles from './CharacterDetail.module.css';

export interface FactionDetailProps {
  factionId: FactionId;
  onDelete: (id: FactionId) => void;
}

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Disbanded', value: 'disbanded' },
  { label: 'Secret', value: 'secret' },
];

const STANCE_OPTIONS = [
  { label: 'Friendly', value: 'friendly' },
  { label: 'Neutral', value: 'neutral' },
  { label: 'Hostile', value: 'hostile' },
];

export function FactionDetail({ factionId, onDelete }: FactionDetailProps): React.ReactElement {
  const { data: faction, isLoading } = useFaction(factionId);
  const { data: characters } = useCharacters();
  const updateFaction = useUpdateFaction();

  const charMap = React.useMemo(() => {
    if (!characters) return new Map<CharacterId, string>();
    return new Map(characters.map((c) => [c.id, c.name]));
  }, [characters]);

  const leaderOptions = React.useMemo(() => {
    if (!characters) return [];
    return [
      { label: '(None)', value: '' },
      ...characters.map((c) => ({ label: c.name, value: c.id })),
    ];
  }, [characters]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading faction..." />
      </div>
    );
  }

  if (!faction) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Faction not found</div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const save = (data: Record<string, any>) => {
    updateFaction.mutate({ id: faction.id, data: data as Partial<CreateFactionInput> });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <EditableField
            value={faction.name}
            onSave={(name) => save({ name })}
            heading
            placeholder="Faction name..."
          />
        </div>
        <div className={styles.meta}>
          {faction.type && (
            <EditableField
              value={faction.type}
              onSave={(type) => save({ type })}
              placeholder="Type..."
            />
          )}
          <EditableField
            value={faction.status ?? ''}
            onSave={(status) => save({ status })}
            as="select"
            options={STATUS_OPTIONS}
          />
          <EditableField
            value={faction.stanceToMC ?? ''}
            onSave={(stanceToMC) => save({ stanceToMC })}
            as="select"
            options={STANCE_OPTIONS}
          />
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Goals</h3>
          <EditableList
            items={faction.goals ?? []}
            onSave={(goals) => save({ goals })}
            addLabel="Add goal"
          />
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Leader</h3>
          <EditableField
            value={faction.leaderId ?? ''}
            onSave={(leaderId) => save({ leaderId: leaderId || undefined })}
            as="select"
            options={leaderOptions}
          />
          {faction.leaderId && (
            <p
              style={{
                fontSize: 'var(--font-sm)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--space-1)',
              }}
            >
              {charMap.get(faction.leaderId) ?? faction.leaderId}
            </p>
          )}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Internal Conflict</h3>
          <EditableField
            value={faction.internalConflict ?? ''}
            onSave={(internalConflict) => save({ internalConflict })}
            as="textarea"
            placeholder="Describe internal tensions..."
          />
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Resources</h3>
          <EditableList
            items={faction.resources ?? []}
            onSave={(resources) => save({ resources })}
            addLabel="Add resource"
          />
        </section>

        {/* Metadata */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Metadata</h3>
          <div className={styles.metadata}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Created</span>
              <span className={styles.metaValue}>
                {new Date(faction.createdAt).toLocaleDateString()}
              </span>
            </div>
            {faction.updatedAt !== faction.createdAt && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Updated</span>
                <span className={styles.metaValue}>
                  {new Date(faction.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button onClick={() => onDelete(faction.id)} variant="danger" size="md">
          Delete Faction
        </Button>
      </div>
    </div>
  );
}
