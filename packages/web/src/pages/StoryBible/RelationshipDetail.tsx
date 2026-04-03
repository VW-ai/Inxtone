/**
 * RelationshipDetail Component
 *
 * Detail panel showing Wayne Principles with inline editing.
 * Click any field to edit, saves on blur/Enter.
 */

import React from 'react';
import { Button, EditableField, EditableList, LoadingSpinner } from '../../components/ui';
import { useRelationship, useCharacters, useUpdateRelationship } from '../../hooks';
import type { CharacterId, CreateRelationshipInput } from '@inxtone/core';
import styles from './RelationshipDetail.module.css';

const TYPE_OPTIONS = [
  { label: 'Companion', value: 'companion' },
  { label: 'Rival', value: 'rival' },
  { label: 'Enemy', value: 'enemy' },
  { label: 'Mentor', value: 'mentor' },
  { label: 'Confidant', value: 'confidant' },
  { label: 'Lover', value: 'lover' },
];

export interface RelationshipDetailProps {
  relationshipId: number;
  onDelete: (id: number) => void;
}

export function RelationshipDetail({
  relationshipId,
  onDelete,
}: RelationshipDetailProps): React.ReactElement {
  const { data: rel, isLoading } = useRelationship(relationshipId);
  const { data: characters } = useCharacters();
  const updateRelationship = useUpdateRelationship();

  const charMap = React.useMemo(() => {
    if (!characters) return new Map<CharacterId, string>();
    return new Map(characters.map((c) => [c.id, c.name]));
  }, [characters]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading relationship..." />
      </div>
    );
  }

  if (!rel) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Relationship not found</div>
      </div>
    );
  }

  const sourceName = charMap.get(rel.sourceId) ?? rel.sourceId;
  const targetName = charMap.get(rel.targetId) ?? rel.targetId;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const save = (data: Record<string, any>) => {
    updateRelationship.mutate({ id: rel.id, data: data as Partial<CreateRelationshipInput> });
  };

  return (
    <div className={styles.container}>
      {/* Header — source/target are display-only */}
      <div className={styles.header}>
        <div className={styles.headerNames}>
          <span className={styles.name}>{sourceName}</span>
          <span className={styles.arrow}>&rarr;</span>
          <span className={styles.name}>{targetName}</span>
        </div>
        <div className={styles.meta}>
          <EditableField
            value={rel.type}
            onSave={(type) => save({ type })}
            as="select"
            options={TYPE_OPTIONS}
          />
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Wayne Principles — always shown, editable */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Wayne Principles</h3>
          <div className={styles.layers}>
            <div className={`${styles.layer} ${styles.primary}`}>
              <EditableField
                label="Why They Joined"
                value={rel.joinReason ?? ''}
                onSave={(joinReason) => save({ joinReason })}
                as="textarea"
                placeholder="Why did they join forces?"
              />
            </div>
            <div className={styles.layer}>
              <EditableField
                label="Independent Goal"
                value={rel.independentGoal ?? ''}
                onSave={(independentGoal) => save({ independentGoal })}
                as="textarea"
                placeholder="What do they want independently?"
              />
            </div>
            <div className={styles.layer}>
              <EditableList
                label="Disagree Scenarios"
                items={rel.disagreeScenarios ?? []}
                onSave={(disagreeScenarios) => save({ disagreeScenarios })}
                addLabel="Add scenario"
              />
            </div>
            <div className={styles.layer}>
              <EditableList
                label="Leave Scenarios"
                items={rel.leaveScenarios ?? []}
                onSave={(leaveScenarios) => save({ leaveScenarios })}
                addLabel="Add scenario"
              />
            </div>
            <div className={`${styles.layer} ${styles.accent}`}>
              <EditableField
                label="What MC Needs"
                value={rel.mcNeeds ?? ''}
                onSave={(mcNeeds) => save({ mcNeeds })}
                as="textarea"
                placeholder="What does the MC need from this relationship?"
              />
            </div>
          </div>
        </section>

        {/* Evolution */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Evolution</h3>
          <EditableField
            value={rel.evolution ?? ''}
            onSave={(evolution) => save({ evolution })}
            as="textarea"
            placeholder="How does this relationship change over time?"
          />
        </section>
      </div>

      {/* Actions — only Delete remains */}
      <div className={styles.actions}>
        <Button onClick={() => onDelete(rel.id)} variant="danger" size="md">
          Delete Relationship
        </Button>
      </div>
    </div>
  );
}
