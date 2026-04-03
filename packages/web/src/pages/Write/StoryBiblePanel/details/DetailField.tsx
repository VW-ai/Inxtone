/**
 * DetailField — label + value pair for entity detail grids
 */

import React from 'react';
import styles from '../../StoryBiblePanel.module.css';

export function DetailField({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className={styles.detailField}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}
