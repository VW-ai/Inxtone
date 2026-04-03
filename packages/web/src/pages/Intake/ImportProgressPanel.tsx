/**
 * ImportProgressPanel
 *
 * Shows multi-pass extraction progress with step checklist.
 */

import React from 'react';
import { Button } from '../../components/ui/Button';
import styles from './Intake.module.css';

interface ImportProgressPanelProps {
  currentStep: string | null;
  currentPass: number;
  progress: number;
  error: string | null;
  onCancel: () => void;
}

interface PassInfo {
  pass: number;
  label: string;
}

const PASSES: PassInfo[] = [
  { pass: 1, label: 'Characters, Locations, Factions, World' },
  { pass: 2, label: 'Relationships' },
  { pass: 3, label: 'Arcs, Foreshadowing, Hooks, Timeline' },
];

export function ImportProgressPanel({
  currentStep,
  currentPass,
  progress,
  error,
  onCancel,
}: ImportProgressPanelProps): React.ReactElement {
  return (
    <div className={styles.progressPanel}>
      <h3 className={styles.progressTitle}>Extracting Story Bible...</h3>

      {/* Progress bar */}
      <div
        className={styles.progressBar}
        role="progressbar"
        aria-valuenow={Math.min(progress, 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Extraction progress"
      >
        <div className={styles.progressFill} style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>

      {/* Step text */}
      {currentStep && <p className={styles.progressStep}>{currentStep}</p>}

      {/* Pass checklist */}
      <div className={styles.passChecklist}>
        {PASSES.map((p) => {
          let status: 'done' | 'active' | 'pending';
          if (currentPass > p.pass) {
            status = 'done';
          } else if (currentPass === p.pass) {
            status = 'active';
          } else {
            status = 'pending';
          }

          const statusClass =
            status === 'done'
              ? styles.passDone
              : status === 'active'
                ? styles.passActive
                : styles.passPending;

          return (
            <div key={p.pass} className={`${styles.passItem} ${statusClass ?? ''}`}>
              <span className={styles.passIcon}>
                {status === 'done' ? '\u2713' : status === 'active' ? '\u25CF' : '\u25CB'}
              </span>
              <span className={styles.passLabel}>
                Pass {p.pass}: {p.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error display */}
      {error && <p className={styles.progressError}>{error}</p>}

      {/* Cancel button */}
      <div className={styles.progressActions}>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
