/**
 * ArcDetail — expanded detail view for an Arc entity
 */

import React from 'react';
import type { Arc } from '@inxtone/core';
import { DetailField } from './DetailField';
import styles from '../../StoryBiblePanel.module.css';

export function ArcDetail({ arc }: { arc: Arc }): React.ReactElement {
  return (
    <div className={styles.detailGrid}>
      <DetailField label="Type" value={arc.type} />
      <DetailField label="Status" value={arc.status} />
      {typeof arc.progress === 'number' && (
        <DetailField label="Progress" value={`${arc.progress}%`} />
      )}
      {arc.sections && arc.sections.length > 0 && (
        <DetailField
          label="Sections"
          value={arc.sections.map((s) => `${s.name} (${s.status})`).join(', ')}
        />
      )}
    </div>
  );
}
