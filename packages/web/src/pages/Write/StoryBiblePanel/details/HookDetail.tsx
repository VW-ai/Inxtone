/**
 * HookDetail — expanded detail view for a Hook entity
 */

import React from 'react';
import type { Hook } from '@inxtone/core';
import { DetailField } from './DetailField';
import styles from '../../StoryBiblePanel.module.css';

export function HookDetail({ hook }: { hook: Hook }): React.ReactElement {
  return (
    <div className={styles.detailGrid}>
      <DetailField label="Content" value={hook.content} />
      {hook.hookType && <DetailField label="Hook Type" value={hook.hookType} />}
      {typeof hook.strength === 'number' && (
        <DetailField label="Strength" value={`${hook.strength}/100`} />
      )}
    </div>
  );
}
