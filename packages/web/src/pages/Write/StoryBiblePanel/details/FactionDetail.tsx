/**
 * FactionDetail — expanded detail view for a Faction entity
 */

import React from 'react';
import type { Faction } from '@inxtone/core';
import { DetailField } from './DetailField';
import styles from '../../StoryBiblePanel.module.css';

export function FactionDetail({ faction }: { faction: Faction }): React.ReactElement {
  return (
    <div className={styles.detailGrid}>
      {faction.type && <DetailField label="Type" value={faction.type} />}
      {faction.stanceToMC && <DetailField label="Stance to MC" value={faction.stanceToMC} />}
      {faction.internalConflict && (
        <DetailField label="Conflict" value={faction.internalConflict} />
      )}
      {faction.goals && faction.goals.length > 0 && (
        <DetailField label="Goals" value={faction.goals.join('; ')} />
      )}
    </div>
  );
}
