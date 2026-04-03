/**
 * EntityCard
 *
 * Displays a single extracted entity with confidence badge and actions.
 */

import React from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { EntityDecision } from '../../stores/useIntakeStore';
import styles from './Intake.module.css';

interface EntityCardProps {
  entityType: string;
  name: string;
  subtitle?: string;
  confidence: string;
  decision: EntityDecision;
  onAccept: () => void;
  onReject: () => void;
  onEdit: () => void;
}

const confidenceColors: Record<string, 'success' | 'warning' | 'danger'> = {
  high: 'success',
  medium: 'warning',
  low: 'danger',
};

/** Human-friendly entity type labels */
const TYPE_LABELS: Record<string, string> = {
  character: 'Character',
  relationship: 'Relationship',
  location: 'Location',
  faction: 'Faction',
  world: 'World',
  timeline: 'Timeline',
  foreshadowing: 'Foreshadowing',
  arc: 'Arc',
  hook: 'Hook',
};

export function EntityCard({
  entityType,
  name,
  subtitle,
  confidence,
  decision,
  onAccept,
  onReject,
  onEdit,
}: EntityCardProps): React.ReactElement {
  const isAccepted = decision === 'accept';
  const isRejected = decision === 'reject';

  return (
    <div
      className={`${styles.entityCard} ${isRejected ? styles.entityCardRejected : ''} ${isAccepted ? styles.entityCardAccepted : ''}`}
    >
      <div className={styles.entityCardHeader}>
        <span className={styles.entityTypeBadge}>{TYPE_LABELS[entityType] ?? entityType}</span>
        <Badge variant={confidenceColors[confidence] ?? 'warning'}>{confidence}</Badge>
      </div>

      <h4 className={styles.entityName}>{name}</h4>
      {subtitle && <p className={styles.entitySubtitle}>{subtitle}</p>}

      <div className={styles.entityActions}>
        <Button variant={isAccepted ? 'primary' : 'secondary'} size="sm" onClick={onAccept}>
          Accept
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant={isRejected ? 'danger' : 'ghost'} size="sm" onClick={onReject}>
          Reject
        </Button>
      </div>
    </div>
  );
}
