/**
 * HookTracker — Narrative hooks grouped by chapter with strength bars
 */

import React from 'react';
import { Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { useHooks, useChapters } from '../../hooks';
import type { Hook, HookType, HookStyle, Chapter } from '@inxtone/core';
import styles from './HookTracker.module.css';

const TYPE_VARIANTS: Record<HookType, 'primary' | 'warning' | 'default'> = {
  opening: 'primary',
  arc: 'warning',
  chapter: 'default',
};

const STYLE_VARIANTS: Record<HookStyle, 'default' | 'primary' | 'warning' | 'danger'> = {
  suspense: 'danger',
  anticipation: 'warning',
  emotion: 'primary',
  mystery: 'default',
};

function StrengthBar({ value }: { value: number }): React.ReactElement {
  let variant = styles.strengthLow;
  if (value >= 67) variant = styles.strengthHigh;
  else if (value >= 34) variant = styles.strengthMid;

  return (
    <div className={styles.strengthBar}>
      <div className={`${styles.strengthFill} ${variant}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function HookCard({ hook }: { hook: Hook }): React.ReactElement {
  return (
    <div className={styles.hookCard}>
      <div className={styles.hookTop}>
        <Badge variant={TYPE_VARIANTS[hook.type]}>{hook.type}</Badge>
        {hook.hookType && <Badge variant={STYLE_VARIANTS[hook.hookType]}>{hook.hookType}</Badge>}
        {hook.strength != null && (
          <div className={styles.strengthWrap}>
            <StrengthBar value={hook.strength} />
            <span className={styles.strengthLabel}>{hook.strength}%</span>
          </div>
        )}
      </div>
      <p className={styles.hookContent}>{hook.content}</p>
    </div>
  );
}

interface ChapterGroup {
  chapterId: number | null;
  chapter: Chapter | undefined;
  hooks: Hook[];
}

export function HookTracker(): React.ReactElement {
  const { data: hooks, isLoading: hooksLoading } = useHooks();
  const { data: chapters } = useChapters();

  const chapterMap = React.useMemo(() => {
    const map = new Map<number, Chapter>();
    for (const ch of chapters ?? []) {
      map.set(ch.id, ch);
    }
    return map;
  }, [chapters]);

  const groups = React.useMemo((): ChapterGroup[] => {
    if (!hooks) return [];

    const grouped = new Map<number | null, Hook[]>();
    for (const hook of hooks) {
      const key = hook.chapterId ?? null;
      const list = grouped.get(key);
      if (list) {
        list.push(hook);
      } else {
        grouped.set(key, [hook]);
      }
    }

    // Sort: numbered chapters first (ascending), then unattached
    const entries = [...grouped.entries()].sort(([a], [b]) => {
      if (a == null && b == null) return 0;
      if (a == null) return 1;
      if (b == null) return -1;
      return a - b;
    });

    return entries.map(([chapterId, hooksInGroup]) => ({
      chapterId,
      chapter: chapterId != null ? chapterMap.get(chapterId) : undefined,
      hooks: hooksInGroup,
    }));
  }, [hooks, chapterMap]);

  if (hooksLoading) {
    return <LoadingSpinner text="Loading hooks..." />;
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        title="No hooks defined"
        description="Add narrative hooks in the Story Bible to track their strength and placement here."
      />
    );
  }

  return (
    <div className={styles.tracker}>
      {groups.map((group) => (
        <div key={group.chapterId ?? 'unattached'} className={styles.chapterGroup}>
          <h3 className={styles.groupHeader}>
            {group.chapterId != null
              ? `Ch. ${group.chapterId} — ${group.chapter?.title ?? 'Untitled'}`
              : 'Unattached'}
          </h3>
          <div className={styles.hookList}>
            {group.hooks.map((hook) => (
              <HookCard key={hook.id} hook={hook} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
