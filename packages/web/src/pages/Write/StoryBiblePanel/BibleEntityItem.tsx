/**
 * BibleEntityItem — entity list item with expand + pin actions
 */

import React from 'react';
import { Badge } from '../../../components/ui';
import styles from '../StoryBiblePanel.module.css';

export interface BibleEntityItemProps {
  id: string;
  name: string;
  badge?: string;
  badgeVariant?: 'default' | 'primary' | 'muted' | 'success' | 'warning' | 'danger';
  isLinked?: boolean;
  onLink?: () => void;
  onUnlink?: () => void;
  isPinned: boolean;
  onPin: () => void;
  onUnpin: () => void;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  children?: React.ReactNode;
}

export function BibleEntityItem({
  id,
  name,
  badge,
  badgeVariant,
  isLinked,
  onLink,
  onUnlink,
  isPinned,
  onPin,
  onUnpin,
  expandedId,
  onToggleExpand,
  children,
}: BibleEntityItemProps): React.ReactElement {
  const isExpanded = expandedId === id;

  return (
    <div className={styles.entityItem}>
      <div className={styles.entityRow} onClick={() => onToggleExpand(id)}>
        {isLinked !== undefined && onLink && onUnlink && (
          <button
            className={`${styles.linkButton} ${isLinked ? styles.linked : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (isLinked) {
                onUnlink();
              } else {
                onLink();
              }
            }}
            title={isLinked ? 'Remove from chapter' : 'Add to chapter'}
          >
            {isLinked ? '\u2611' : '\u2610'}
          </button>
        )}
        <span className={styles.expandChevron}>{isExpanded ? '\u25BE' : '\u25B8'}</span>
        <span className={styles.entityName}>{name}</span>
        {badge && (
          <Badge variant={badgeVariant ?? 'default'} size="sm">
            {badge}
          </Badge>
        )}
        <button
          className={`${styles.pinButton} ${isPinned ? styles.pinned : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (isPinned) {
              onUnpin();
            } else {
              onPin();
            }
          }}
          title={isPinned ? 'Unpin from context' : 'Pin to AI context (temporary)'}
        >
          {isPinned ? '\u2605' : '\u2606'}
        </button>
      </div>
      {isExpanded && children && <div className={styles.entityDetail}>{children}</div>}
    </div>
  );
}
