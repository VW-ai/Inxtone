/**
 * BibleSection — collapsible section wrapper for StoryBiblePanel
 */

import React, { useState } from 'react';
import styles from '../StoryBiblePanel.module.css';

interface BibleSectionProps {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function BibleSection({
  title,
  count,
  defaultOpen = true,
  children,
}: BibleSectionProps): React.ReactElement {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={styles.section}>
      <button className={styles.sectionHeader} onClick={() => setOpen(!open)}>
        <span className={styles.chevron}>{open ? '\u25BE' : '\u25B8'}</span>
        <span className={styles.sectionTitle}>{title}</span>
        <span className={styles.count}>{count}</span>
      </button>
      {open && <div className={styles.sectionContent}>{children}</div>}
    </div>
  );
}
