/**
 * FactionList Component
 *
 * Card grid with split layout: cards on left, detail/create panel on right.
 */

import React, { useState } from 'react';
import {
  Button,
  Card,
  EmptyState,
  Badge,
  EditableField,
  LoadingSpinner,
} from '../../components/ui';
import { useFactions, useCreateFaction, useDeleteFaction, useCharacters } from '../../hooks';
import { useSelectedId, useFormMode, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { FactionDetail } from './FactionDetail';
import type { Faction, CharacterId, FactionId } from '@inxtone/core';
import styles from './shared.module.css';
import cardStyles from './FactionList.module.css';
import layoutStyles from './CharacterList.module.css';
import detailStyles from './CharacterDetail.module.css';

const STANCE_VARIANTS: Record<
  NonNullable<Faction['stanceToMC']>,
  'success' | 'default' | 'danger'
> = {
  friendly: 'success',
  neutral: 'default',
  hostile: 'danger',
};

const STANCE_OPTIONS = [
  { label: '(None)', value: '' },
  { label: 'Friendly', value: 'friendly' },
  { label: 'Neutral', value: 'neutral' },
  { label: 'Hostile', value: 'hostile' },
];

function FactionCreatePanel({
  onCreated,
}: {
  onCreated: (id: FactionId) => void;
}): React.ReactElement {
  const createFaction = useCreateFaction();
  const { closeForm } = useStoryBibleActions();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [stanceToMC, setStanceToMC] = useState('');

  const canCreate = name.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    const input: { name: string; type?: string; stanceToMC?: 'friendly' | 'neutral' | 'hostile' } =
      {
        name: name.trim(),
      };
    if (type.trim()) input.type = type.trim();
    if (stanceToMC) input.stanceToMC = stanceToMC as 'friendly' | 'neutral' | 'hostile';
    createFaction.mutate(input, {
      onSuccess: (faction) => onCreated(faction.id),
    });
  };

  return (
    <div className={detailStyles.container}>
      <div className={detailStyles.header}>
        <div className={detailStyles.headerTop}>
          <EditableField value={name} onSave={setName} heading placeholder="Faction name..." />
        </div>
        <div className={detailStyles.meta}>
          <EditableField value={type} onSave={setType} placeholder="Type (e.g. sect, guild)..." />
          <EditableField
            value={stanceToMC}
            onSave={setStanceToMC}
            as="select"
            options={STANCE_OPTIONS}
          />
        </div>
      </div>
      <div className={detailStyles.content}>
        <p
          style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
          }}
        >
          Create the faction first, then add goals, resources, and leader in the detail panel.
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
          disabled={!canCreate || createFaction.isPending}
        >
          {createFaction.isPending ? 'Creating...' : 'Create Faction'}
        </Button>
      </div>
    </div>
  );
}

export function FactionList(): React.ReactElement {
  const { data: factions, isLoading } = useFactions();
  const { data: characters } = useCharacters();
  const deleteFaction = useDeleteFaction();
  const selectedId = useSelectedId();
  const formMode = useFormMode();
  const { select, openForm } = useStoryBibleActions();

  const charMap = React.useMemo(() => {
    if (!characters) return new Map<CharacterId, string>();
    return new Map(characters.map((c) => [c.id, c.name]));
  }, [characters]);

  if (isLoading) {
    return <LoadingSpinner text="Loading factions..." />;
  }

  const handleCreate = () => {
    openForm('create');
  };

  const handleSelect = (id: FactionId) => {
    select(id);
  };

  const handleDelete = (id: FactionId) => {
    deleteFaction.mutate(id);
    if (selectedId === id) {
      select(null);
    }
  };

  const handleCreated = (id: FactionId) => {
    select(id);
  };

  if (!factions || factions.length === 0) {
    return (
      <div className={layoutStyles.layout}>
        <div className={layoutStyles.listPanel}>
          <EmptyState
            title="No factions yet"
            description="Add factions to create political intrigue and alliances."
            action={{ label: 'Add Faction', onClick: handleCreate }}
          />
        </div>
        {formMode === 'create' && (
          <div className={layoutStyles.detailPanel}>
            <FactionCreatePanel onCreated={handleCreated} />
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
          <h2 className={styles.sectionTitle}>Factions ({factions.length})</h2>
          <Button onClick={handleCreate}>+ Add Faction</Button>
        </div>

        <div className={`${styles.grid} ${styles.grid2}`}>
          {factions.map((faction) => (
            <Card
              key={faction.id}
              onClick={() => handleSelect(faction.id)}
              selected={selectedId === faction.id}
            >
              <div className={cardStyles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{faction.name}</h3>
                  <div className={cardStyles.badges}>
                    {faction.type && <Badge variant="default">{faction.type}</Badge>}
                    {faction.status && <Badge variant="muted">{faction.status}</Badge>}
                    {faction.stanceToMC && (
                      <Badge variant={STANCE_VARIANTS[faction.stanceToMC]}>
                        {faction.stanceToMC}
                      </Badge>
                    )}
                  </div>
                </div>
                {faction.goals && faction.goals.length > 0 && (
                  <>
                    <ul className={cardStyles.goals}>
                      {faction.goals.slice(0, 3).map((goal, i) => (
                        <li key={i}>{goal}</li>
                      ))}
                    </ul>
                    {faction.goals.length > 3 && (
                      <span className={cardStyles.moreGoals}>+{faction.goals.length - 3} more</span>
                    )}
                  </>
                )}
                {faction.leaderId && (
                  <p className={cardStyles.leader}>
                    Led by <strong>{charMap.get(faction.leaderId) ?? faction.leaderId}</strong>
                  </p>
                )}
                <div className={styles.cardActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(faction.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {showCreate && (
        <div className={layoutStyles.detailPanel}>
          <FactionCreatePanel onCreated={handleCreated} />
        </div>
      )}
      {showDetail && (
        <div className={layoutStyles.detailPanel}>
          <FactionDetail factionId={selectedId as FactionId} onDelete={handleDelete} />
        </div>
      )}
    </div>
  );
}
