/**
 * ForeshadowingDetail — expanded detail view for a Foreshadowing entity
 */

import React from 'react';
import type { Foreshadowing } from '@inxtone/core';
import { DetailField } from './DetailField';
import styles from '../../StoryBiblePanel.module.css';

export function ForeshadowingDetail({ item }: { item: Foreshadowing }): React.ReactElement {
  return (
    <div className={styles.detailGrid}>
      <DetailField label="Content" value={item.content} />
      <DetailField label="Status" value={item.status} />
      {item.plantedText && <DetailField label="Planted" value={item.plantedText} />}
    </div>
  );
}
