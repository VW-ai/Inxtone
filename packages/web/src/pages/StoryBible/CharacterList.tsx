/**
 * CharacterList Component
 *
 * Card grid with split layout: cards on left, detail/create panel on right.
 */

import React, { useState } from 'react';
import {
  Button,
  Card,
  EmptyState,
  RoleBadge,
  EditableField,
  ConfirmDialog,
  LoadingSpinner,
} from '../../components/ui';
import { useCharacters, useDeleteCharacter, useCreateCharacter } from '../../hooks';
import { useSelectedId, useFormMode, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { CharacterDetail } from './CharacterDetail';
import type { CharacterId, CharacterRole } from '@inxtone/core';
import styles from './shared.module.css';
import layoutStyles from './CharacterList.module.css';
import charDetailStyles from './CharacterDetail.module.css';

const ROLE_OPTIONS = [
  { label: 'Main', value: 'main' },
  { label: 'Supporting', value: 'supporting' },
  { label: 'Antagonist', value: 'antagonist' },
  { label: 'Mentioned', value: 'mentioned' },
];

function CharacterCreatePanel({
  onCreated,
}: {
  onCreated: (id: CharacterId) => void;
}): React.ReactElement {
  const createCharacter = useCreateCharacter();
  const { closeForm } = useStoryBibleActions();
  const [name, setName] = useState('');
  const [role, setRole] = useState<CharacterRole>('supporting');

  const canCreate = name.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    createCharacter.mutate(
      { name: name.trim(), role },
      { onSuccess: (character) => onCreated(character.id) }
    );
  };

  return (
    <div className={charDetailStyles.container}>
      <div className={charDetailStyles.header}>
        <div className={charDetailStyles.headerTop}>
          <EditableField value={name} onSave={setName} heading placeholder="Character name..." />
        </div>
        <div className={charDetailStyles.meta}>
          <EditableField
            value={role}
            onSave={(v) => setRole(v as CharacterRole)}
            as="select"
            options={ROLE_OPTIONS}
          />
        </div>
      </div>
      <div className={charDetailStyles.content}>
        <p
          style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
          }}
        >
          Create the character first, then fill in appearance, motivation, and voice samples in the
          detail panel.
        </p>
      </div>
      <div className={charDetailStyles.actions}>
        <Button variant="ghost" size="md" onClick={closeForm}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleCreate}
          disabled={!canCreate || createCharacter.isPending}
        >
          {createCharacter.isPending ? 'Creating...' : 'Create Character'}
        </Button>
      </div>
    </div>
  );
}

export function CharacterList(): React.ReactElement {
  const { data: characters, isLoading, error } = useCharacters();
  const deleteCharacter = useDeleteCharacter();
  const selectedId = useSelectedId();
  const formMode = useFormMode();
  const { select, openForm } = useStoryBibleActions();
  const [deleteTarget, setDeleteTarget] = useState<CharacterId | null>(null);

  if (isLoading) {
    return <LoadingSpinner text="Loading characters..." />;
  }

  if (error) {
    return (
      <div className={styles.error}>
        Failed to load characters: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  const handleCreate = () => {
    openForm('create');
  };

  const handleSelect = (id: CharacterId) => {
    select(id);
  };

  const handleDelete = (id: CharacterId) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (deleteTarget !== null) {
      deleteCharacter.mutate(deleteTarget);
      if (selectedId === deleteTarget) {
        select(null);
      }
      setDeleteTarget(null);
    }
  };

  const handleCreated = (id: CharacterId) => {
    select(id);
  };

  if (!characters || characters.length === 0) {
    return (
      <>
        <div className={layoutStyles.layout}>
          <div className={layoutStyles.listPanel}>
            <EmptyState
              title="No characters yet"
              description="Create your first character to start building your story's cast."
              action={{ label: 'Create Character', onClick: handleCreate }}
            />
          </div>
          {formMode === 'create' && (
            <div className={layoutStyles.detailPanel}>
              <CharacterCreatePanel onCreated={handleCreated} />
            </div>
          )}
        </div>
        <ConfirmDialog
          isOpen={deleteTarget !== null}
          title="Delete Character"
          message="Are you sure you want to delete this character? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteCharacter.isPending}
        />
      </>
    );
  }

  // Stats based on actual CharacterRole values
  const stats = {
    total: characters.length,
    main: characters.filter((c) => c.role === 'main').length,
    antagonists: characters.filter((c) => c.role === 'antagonist').length,
    supporting: characters.filter((c) => c.role === 'supporting').length,
  };

  const showDetail = selectedId && formMode !== 'create';
  const showCreate = formMode === 'create';

  return (
    <>
      <div className={layoutStyles.layout}>
        <div className={layoutStyles.listPanel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Characters ({stats.total})</h2>
            <Button onClick={handleCreate}>+ Add Character</Button>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.main}</span>
              <span className={styles.statLabel}>Main</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.antagonists}</span>
              <span className={styles.statLabel}>Antagonists</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.supporting}</span>
              <span className={styles.statLabel}>Supporting</span>
            </div>
          </div>

          <div className={`${styles.grid} ${styles.grid2}`}>
            {characters.map((character) => (
              <Card
                key={character.id}
                onClick={() => handleSelect(character.id)}
                selected={selectedId === character.id}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{character.name}</h3>
                  <RoleBadge role={character.role} />
                </div>
                {character.appearance && (
                  <p className={styles.cardDescription}>
                    {character.appearance.slice(0, 100)}
                    {character.appearance.length > 100 ? '...' : ''}
                  </p>
                )}
                {character.motivation?.surface && (
                  <p className={styles.cardMeta}>
                    Goal: {character.motivation.surface.slice(0, 80)}
                    {character.motivation.surface.length > 80 ? '...' : ''}
                  </p>
                )}
                <div className={styles.cardActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(character.id);
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
            <CharacterCreatePanel onCreated={handleCreated} />
          </div>
        )}
        {showDetail && (
          <div className={layoutStyles.detailPanel}>
            <CharacterDetail characterId={selectedId as CharacterId} onDelete={handleDelete} />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Character"
        message="Are you sure you want to delete this character? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteCharacter.isPending}
      />
    </>
  );
}
