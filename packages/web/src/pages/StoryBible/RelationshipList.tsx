/**
 * RelationshipList Component
 *
 * Split layout: card grid (left) + RelationshipDetail panel (right).
 * "Add Relationship" opens a create panel in the detail area.
 * Follows CharacterList / HookList pattern.
 */

import React, { useMemo, useCallback, useState } from 'react';
import {
  Button,
  Card,
  EmptyState,
  Badge,
  EditableField,
  ConfirmDialog,
  LoadingSpinner,
} from '../../components/ui';
import {
  useRelationships,
  useCharacters,
  useDeleteRelationship,
  useCreateRelationship,
} from '../../hooks';
import { useSelectedId, useFormMode, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { RelationshipDetail } from './RelationshipDetail';
import type { Relationship, CharacterId } from '@inxtone/core';
import styles from './shared.module.css';
import layoutStyles from './CharacterList.module.css';
import detailStyles from './CharacterDetail.module.css';

const TYPE_OPTIONS = [
  { label: 'Companion', value: 'companion' },
  { label: 'Rival', value: 'rival' },
  { label: 'Enemy', value: 'enemy' },
  { label: 'Mentor', value: 'mentor' },
  { label: 'Confidant', value: 'confidant' },
  { label: 'Lover', value: 'lover' },
];

function TypeBadge({ type }: { type: Relationship['type'] }): React.ReactElement {
  const variants: Record<
    Relationship['type'],
    'primary' | 'success' | 'danger' | 'warning' | 'default' | 'muted'
  > = {
    companion: 'success',
    rival: 'warning',
    enemy: 'danger',
    mentor: 'primary',
    confidant: 'default',
    lover: 'primary',
  };
  return <Badge variant={variants[type]}>{type}</Badge>;
}

/** Inline create panel for new relationships */
function RelationshipCreatePanel({
  onCreated,
}: {
  onCreated: (id: number) => void;
}): React.ReactElement {
  const createRelationship = useCreateRelationship();
  const { closeForm } = useStoryBibleActions();
  const { data: characters } = useCharacters();

  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [relType, setRelType] = useState('');
  const [joinReason, setJoinReason] = useState('');

  const charOptions = useMemo(() => {
    if (!characters) return [];
    return characters.map((c) => ({ label: c.name, value: c.id }));
  }, [characters]);

  const canCreate = sourceId !== '' && targetId !== '' && relType !== '';

  const handleCreate = () => {
    if (!canCreate) return;
    const input: {
      sourceId: CharacterId;
      targetId: CharacterId;
      type: 'companion' | 'rival' | 'enemy' | 'mentor' | 'confidant' | 'lover';
      joinReason?: string;
    } = {
      sourceId: sourceId,
      targetId: targetId,
      type: relType as 'companion' | 'rival' | 'enemy' | 'mentor' | 'confidant' | 'lover',
    };
    if (joinReason.trim()) input.joinReason = joinReason.trim();
    createRelationship.mutate(input, {
      onSuccess: (rel) => {
        onCreated(rel.id);
      },
    });
  };

  return (
    <div className={detailStyles.container}>
      <div className={detailStyles.header}>
        <div className={detailStyles.headerTop}>
          <EditableField
            label="Source Character"
            value={sourceId}
            onSave={(v) => setSourceId(v)}
            as="select"
            options={charOptions}
            placeholder="Select source..."
          />
          <EditableField
            label="Target Character"
            value={targetId}
            onSave={(v) => setTargetId(v)}
            as="select"
            options={charOptions}
            placeholder="Select target..."
          />
        </div>
        <div className={detailStyles.headerTop}>
          <EditableField
            label="Type"
            value={relType}
            onSave={(v) => setRelType(v)}
            as="select"
            options={TYPE_OPTIONS}
            placeholder="Select type..."
          />
        </div>
      </div>

      <div className={detailStyles.content}>
        <section className={detailStyles.section}>
          <h3 className={detailStyles.sectionTitle}>Why They Joined</h3>
          <EditableField
            value={joinReason}
            onSave={setJoinReason}
            as="textarea"
            placeholder="Why did they join forces? (optional)"
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
          disabled={!canCreate || createRelationship.isPending}
        >
          {createRelationship.isPending ? 'Creating...' : 'Create Relationship'}
        </Button>
      </div>
    </div>
  );
}

export function RelationshipList(): React.ReactElement {
  const { data: relationships, isLoading, error } = useRelationships();
  const { data: characters } = useCharacters();
  const deleteRelationship = useDeleteRelationship();
  const selectedId = useSelectedId();
  const formMode = useFormMode();
  const { openForm, select } = useStoryBibleActions();
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const hasRelationships = relationships && relationships.length > 0;

  const characterMap = useMemo(() => {
    if (!characters) return new Map<CharacterId, string>();
    return new Map(characters.map((c) => [c.id, c.name]));
  }, [characters]);

  const getCharacterName = useCallback(
    (id: CharacterId): string => characterMap.get(id) ?? `Character ${id}`,
    [characterMap]
  );

  const handleDelete = useCallback((id: number) => {
    setDeleteTarget(id);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTarget !== null) {
      deleteRelationship.mutate(deleteTarget);
      if (selectedId === deleteTarget) {
        select(null);
      }
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteRelationship, selectedId, select]);

  const handleCreated = (id: number) => {
    select(id);
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading relationships..." />;
  }

  if (error) {
    return (
      <div className={styles.error}>
        Failed to load relationships: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  const handleCreate = () => {
    openForm('create');
  };

  const handleSelect = (id: number) => {
    select(id);
  };

  if (!hasRelationships) {
    return (
      <div className={layoutStyles.layout}>
        <div className={layoutStyles.listPanel}>
          <EmptyState
            title="No relationships yet"
            description="Define relationships between your characters to build a rich social network."
            action={{ label: 'Add Relationship', onClick: handleCreate }}
          />
        </div>
        {formMode === 'create' && (
          <div className={layoutStyles.detailPanel}>
            <RelationshipCreatePanel onCreated={handleCreated} />
          </div>
        )}
      </div>
    );
  }

  // Stats
  const typeCounts = relationships.reduce(
    (acc, r) => {
      acc[r.type] = (acc[r.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const topTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const showDetail = selectedId != null && formMode !== 'create';
  const showCreate = formMode === 'create';

  return (
    <>
      <div className={layoutStyles.layout}>
        <div className={layoutStyles.listPanel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Relationships ({relationships.length})</h2>
            <Button onClick={handleCreate}>+ Add Relationship</Button>
          </div>

          <div className={styles.stats}>
            {topTypes.map(([type, count]) => (
              <div key={type} className={styles.stat}>
                <span className={styles.statValue}>{count}</span>
                <span className={styles.statLabel}>{type}</span>
              </div>
            ))}
          </div>

          <div className={`${styles.grid} ${styles.grid2}`}>
            {relationships.map((rel) => (
              <Card
                key={rel.id}
                onClick={() => handleSelect(rel.id)}
                selected={selectedId === rel.id}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    {getCharacterName(rel.sourceId)}
                    <span style={{ color: 'var(--color-text-muted)', margin: '0 0.5rem' }}>
                      &rarr;
                    </span>
                    {getCharacterName(rel.targetId)}
                  </h3>
                  <TypeBadge type={rel.type} />
                </div>
                {rel.joinReason && (
                  <p className={styles.cardDescription}>
                    {rel.joinReason.slice(0, 100)}
                    {rel.joinReason.length > 100 ? '...' : ''}
                  </p>
                )}
                {rel.evolution && (
                  <p className={styles.cardMeta}>
                    {rel.evolution.slice(0, 80)}
                    {rel.evolution.length > 80 ? '...' : ''}
                  </p>
                )}
                <div className={styles.cardActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(rel.id);
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
            <RelationshipCreatePanel onCreated={handleCreated} />
          </div>
        )}
        {showDetail && (
          <div className={layoutStyles.detailPanel}>
            <RelationshipDetail relationshipId={selectedId as number} onDelete={handleDelete} />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Relationship"
        message="Are you sure you want to delete this relationship? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteRelationship.isPending}
      />
    </>
  );
}
