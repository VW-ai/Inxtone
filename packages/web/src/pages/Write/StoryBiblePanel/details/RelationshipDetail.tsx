/**
 * RelationshipDetail — expanded detail view for a Relationship entity
 */

import React from 'react';
import type { Character, Relationship } from '@inxtone/core';
import { DetailField } from './DetailField';
import styles from '../../StoryBiblePanel.module.css';

export function RelationshipDetail({
  rel,
  characters,
}: {
  rel: Relationship;
  characters: Map<string, Character>;
}): React.ReactElement {
  const source = characters.get(rel.sourceId);
  const target = characters.get(rel.targetId);
  return (
    <div className={styles.detailGrid}>
      <DetailField label="Type" value={rel.type} />
      <DetailField label="Between" value={`${source?.name ?? '?'} \u2194 ${target?.name ?? '?'}`} />
      {rel.joinReason && <DetailField label="Bond" value={rel.joinReason} />}
      {rel.independentGoal && <DetailField label="Goal" value={rel.independentGoal} />}
      {rel.evolution && <DetailField label="Evolution" value={rel.evolution} />}
    </div>
  );
}
