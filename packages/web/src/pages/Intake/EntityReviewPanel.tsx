/**
 * EntityReviewPanel
 *
 * Groups extracted entities by type with review cards.
 * Shows batch actions and commit button.
 */

import React from 'react';
import { Button } from '../../components/ui/Button';
import { EntityCard } from './EntityCard';
import { useIntakeStore, makeEntityKey, type EntityKey } from '../../stores/useIntakeStore';
import { useCommitEntities } from '../../hooks/useIntake';
import { useNotificationStore } from '../../stores/useNotificationStore';
import type { DecomposeResult } from '@inxtone/core';
import styles from './Intake.module.css';

/** Safely extract string from unknown value */
function str(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

/** Entity group definition for rendering order */
interface EntityGroup {
  type: string;
  pluralKey: keyof DecomposeResult;
  label: string;
  getName: (entity: Record<string, unknown>) => string;
  getSubtitle: (entity: Record<string, unknown>) => string | undefined;
}

const ENTITY_GROUPS: EntityGroup[] = [
  {
    type: 'character',
    pluralKey: 'characters',
    label: 'Characters',
    getName: (e) => str(e.name),
    getSubtitle: (e) => str(e.role) || undefined,
  },
  {
    type: 'relationship',
    pluralKey: 'relationships',
    label: 'Relationships',
    getName: (e) => `${str(e.sourceName)} \u2192 ${str(e.targetName)}`,
    getSubtitle: (e) => str(e.type) || undefined,
  },
  {
    type: 'location',
    pluralKey: 'locations',
    label: 'Locations',
    getName: (e) => str(e.name),
    getSubtitle: (e) => str(e.type) || undefined,
  },
  {
    type: 'faction',
    pluralKey: 'factions',
    label: 'Factions',
    getName: (e) => str(e.name),
    getSubtitle: (e) => str(e.status) || undefined,
  },
  {
    type: 'arc',
    pluralKey: 'arcs',
    label: 'Arcs',
    getName: (e) => str(e.name),
    getSubtitle: (e) => {
      const t = str(e.type);
      return t ? `${t} arc` : undefined;
    },
  },
  {
    type: 'foreshadowing',
    pluralKey: 'foreshadowing',
    label: 'Foreshadowing',
    getName: (e) => {
      const c = str(e.content);
      return c.length > 60 ? `${c.slice(0, 60)}...` : c;
    },
    getSubtitle: (e) => str(e.term) || undefined,
  },
  {
    type: 'hook',
    pluralKey: 'hooks',
    label: 'Hooks',
    getName: (e) => {
      const c = str(e.content);
      return c.length > 60 ? `${c.slice(0, 60)}...` : c;
    },
    getSubtitle: (e) => str(e.type) || undefined,
  },
  {
    type: 'timeline',
    pluralKey: 'timeline',
    label: 'Timeline',
    getName: (e) => {
      const d = str(e.description);
      return d.length > 60 ? `${d.slice(0, 60)}...` : d;
    },
    getSubtitle: (e) => str(e.eventDate) || undefined,
  },
];

export function EntityReviewPanel(): React.ReactElement | null {
  const {
    result,
    decisions,
    editedData,
    acceptAll,
    rejectAll,
    setDecision,
    openEditor,
    acceptAllOfType,
    reset,
  } = useIntakeStore();
  const commitMutation = useCommitEntities();
  const addNotification = useNotificationStore((s) => s.addNotification);

  if (!result) return null;

  // Count accepted entities
  const acceptedCount = Object.values(decisions).filter((d) => d === 'accept').length;
  const totalCount = Object.keys(decisions).length;

  const handleCommit = () => {
    const entities: Array<{
      entityType: string;
      action: 'create' | 'merge' | 'skip';
      data: Record<string, unknown>;
    }> = [];

    for (const group of ENTITY_GROUPS) {
      const arr = result[group.pluralKey];
      if (!Array.isArray(arr)) continue;

      for (const [i, entity] of (arr as unknown as Record<string, unknown>[]).entries()) {
        const key: EntityKey = makeEntityKey(group.type, i);
        const decision = decisions[key];
        if (decision === 'reject') continue;

        // Use edited data if available
        const data = editedData[key] ?? entity;
        entities.push({
          entityType: group.type,
          action: 'create',
          data,
        });
      }
    }

    if (entities.length === 0) {
      addNotification('No entities accepted for commit.', 'error');
      return;
    }

    commitMutation.mutate(
      { entities },
      {
        onSuccess: (commitResult) => {
          const created = commitResult.created.length;
          const merged = commitResult.merged.length;
          const unresolved = commitResult.unresolved ?? 0;
          let msg = `Committed ${created} new + ${merged} merged entities to Story Bible.`;
          if (unresolved > 0) {
            msg += ` ${unresolved} could not be resolved.`;
          }
          addNotification(msg, 'success');
          reset();
        },
      }
    );
  };

  return (
    <div className={styles.reviewPanel}>
      <div className={styles.reviewHeader}>
        <h2>Review Entities</h2>
        <span className={styles.reviewCount}>
          {acceptedCount} / {totalCount} accepted
        </span>
      </div>

      <div className={styles.batchActions}>
        <Button variant="secondary" size="sm" onClick={acceptAll}>
          Accept All
        </Button>
        <Button variant="ghost" size="sm" onClick={rejectAll}>
          Reject All
        </Button>
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className={styles.warnings}>
          {result.warnings.map((w, i) => (
            <p key={i} className={styles.warning}>
              {w}
            </p>
          ))}
        </div>
      )}

      {/* Entity groups */}
      {ENTITY_GROUPS.map((group) => {
        const arr = result[group.pluralKey];
        if (!Array.isArray(arr) || arr.length === 0) return null;

        return (
          <div key={group.type} className={styles.entityGroup}>
            <div className={styles.entityGroupHeader}>
              <h3>
                {group.label} ({arr.length})
              </h3>
              <Button variant="ghost" size="sm" onClick={() => acceptAllOfType(group.type)}>
                Accept all {group.label.toLowerCase()}
              </Button>
            </div>
            <div className={styles.entityGrid}>
              {(arr as unknown as Record<string, unknown>[]).map((entity, i) => {
                const key = makeEntityKey(group.type, i);
                const edited = editedData[key];
                const data = edited ?? entity;
                const subtitle = group.getSubtitle(data);
                return (
                  <EntityCard
                    key={key}
                    entityType={group.type}
                    name={group.getName(data)}
                    {...(subtitle !== undefined ? { subtitle } : {})}
                    confidence={str(data.confidence) || 'medium'}
                    decision={decisions[key] ?? 'accept'}
                    onAccept={() => setDecision(key, 'accept')}
                    onReject={() => setDecision(key, 'reject')}
                    onEdit={() => openEditor(key)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Commit button */}
      <div className={styles.commitSection}>
        <Button
          variant="primary"
          onClick={handleCommit}
          loading={commitMutation.isPending}
          disabled={commitMutation.isPending || acceptedCount === 0}
        >
          Commit {acceptedCount} {acceptedCount === 1 ? 'Entity' : 'Entities'} to Story Bible
        </Button>
      </div>
    </div>
  );
}
