/**
 * LoadingSpinner — reusable loading state component
 *
 * Replaces inconsistent loading patterns across the app.
 */

import React from 'react';
import styles from './LoadingSpinner.module.css';

export interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md';
}

export function LoadingSpinner({ text, size = 'md' }: LoadingSpinnerProps): React.ReactElement {
  return (
    <div className={`${styles.wrapper} ${styles[size]}`}>
      <div className={styles.spinner} />
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
}
