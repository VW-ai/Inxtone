/**
 * ForeshadowingTracker — Lifecycle visualization for foreshadowing elements
 *
 * Displays each foreshadowing with:
 * - Status/term badges
 * - Plant → Hint → Resolve lifecycle timeline
 * - Collapsible hints list
 * - Action buttons (Add Hint, Resolve, Abandon)
 * - Overdue warnings
 */

import React from 'react';
import { Badge, Button, EmptyState, ConfirmDialog, LoadingSpinner } from '../../components/ui';
import { Input } from '../../components/forms';
import {
  useForeshadowing,
  useResolveForeshadowing,
  useAbandonForeshadowing,
  useChapters,
} from '../../hooks';
import { AddHintModal } from './AddHintModal';
import type { Foreshadowing, ForeshadowingStatus, ForeshadowingTerm } from '@inxtone/core';
import styles from './ForeshadowingTracker.module.css';

const STATUS_VARIANTS: Record<ForeshadowingStatus, 'primary' | 'success' | 'muted'> = {
  active: 'primary',
  resolved: 'success',
  abandoned: 'muted',
};

const TERM_VARIANTS: Record<ForeshadowingTerm, 'default' | 'warning' | 'danger'> = {
  short: 'default',
  mid: 'warning',
  long: 'danger',
};

function isOverdue(item: Foreshadowing, maxChapterId: number): boolean {
  if (item.status !== 'active') return false;
  if (item.plannedPayoff == null) return false;
  return maxChapterId > item.plannedPayoff;
}

/** Lifecycle timeline: planted → hints → resolved/pending */
function Timeline({ item }: { item: Foreshadowing }): React.ReactElement {
  const steps: { label: string; variant: string }[] = [];

  if (item.plantedChapter != null) {
    steps.push({ label: `Planted Ch.${item.plantedChapter}`, variant: 'planted' });
  }

  if (item.hints) {
    for (const hint of item.hints) {
      steps.push({ label: `Hint Ch.${hint.chapter}`, variant: 'hint' });
    }
  }

  if (item.status === 'resolved' && item.resolvedChapter != null) {
    steps.push({ label: `Resolved Ch.${item.resolvedChapter}`, variant: 'resolved' });
  } else if (item.status === 'abandoned') {
    steps.push({ label: 'Abandoned', variant: 'abandoned' });
  } else {
    steps.push({ label: 'Pending', variant: 'pending' });
  }

  return (
    <div className={styles.timeline}>
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          {i > 0 && <div className={styles.timelineLine} />}
          <div className={styles.timelineStep}>
            <div className={`${styles.timelineDot} ${styles[`dot_${step.variant}`] ?? ''}`} />
            <span className={styles.timelineLabel}>{step.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function ForeshadowingCard({
  item,
  maxChapterId,
}: {
  item: Foreshadowing;
  maxChapterId: number;
}): React.ReactElement {
  const [hintsExpanded, setHintsExpanded] = React.useState(false);
  const [hintModalOpen, setHintModalOpen] = React.useState(false);
  const [resolveInput, setResolveInput] = React.useState<string | null>(null);
  const [abandonConfirm, setAbandonConfirm] = React.useState(false);

  const resolveMutation = useResolveForeshadowing();
  const abandonMutation = useAbandonForeshadowing();

  const overdue = isOverdue(item, maxChapterId);
  const hintCount = item.hints?.length ?? 0;
  const isActive = item.status === 'active';

  const handleResolve = () => {
    if (resolveInput == null) return;
    const chapterId = parseInt(resolveInput, 10);
    if (isNaN(chapterId)) return;
    resolveMutation.mutate({ id: item.id, chapterId }, { onSuccess: () => setResolveInput(null) });
  };

  const handleAbandon = () => {
    abandonMutation.mutate(item.id, {
      onSuccess: () => setAbandonConfirm(false),
    });
  };

  return (
    <div className={`${styles.card} ${overdue ? styles.overdue : ''}`}>
      <div className={styles.cardTop}>
        <p className={styles.content}>{item.content}</p>
        <div className={styles.badges}>
          <Badge variant={STATUS_VARIANTS[item.status]}>{item.status}</Badge>
          {item.term && <Badge variant={TERM_VARIANTS[item.term]}>{item.term}</Badge>}
          {overdue && <Badge variant="warning">overdue</Badge>}
        </div>
      </div>

      <Timeline item={item} />

      {/* Hints section */}
      {hintCount > 0 && (
        <div className={styles.hintsSection}>
          <button className={styles.hintsToggle} onClick={() => setHintsExpanded(!hintsExpanded)}>
            {hintsExpanded ? '\u25BE' : '\u25B8'} {hintCount} hint{hintCount !== 1 ? 's' : ''}
          </button>
          {hintsExpanded && (
            <ul className={styles.hintsList}>
              {item.hints!.map((hint, i) => (
                <li key={i} className={styles.hintItem}>
                  <span className={styles.hintChapter}>Ch. {hint.chapter}</span>
                  <span className={styles.hintText}>{hint.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Actions */}
      {isActive && (
        <div className={styles.cardActions}>
          <Button variant="ghost" size="sm" onClick={() => setHintModalOpen(true)}>
            + Hint
          </Button>

          {resolveInput != null ? (
            <div className={styles.resolveInline}>
              <Input
                type="number"
                min="1"
                placeholder="Ch. #"
                value={resolveInput}
                onChange={(e) => setResolveInput(e.target.value)}
                className={styles.resolveInput}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleResolve}
                loading={resolveMutation.isPending}
                disabled={!resolveInput.trim()}
              >
                OK
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setResolveInput(null)}>
                X
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setResolveInput('')}>
              Resolve
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={() => setAbandonConfirm(true)}>
            Abandon
          </Button>
        </div>
      )}

      {hintModalOpen && (
        <AddHintModal foreshadowingId={item.id} onClose={() => setHintModalOpen(false)} />
      )}

      <ConfirmDialog
        isOpen={abandonConfirm}
        title="Abandon Foreshadowing"
        message={`Are you sure you want to abandon "${item.content.length > 60 ? item.content.slice(0, 60) + '...' : item.content}"?`}
        confirmLabel="Abandon"
        onConfirm={handleAbandon}
        onCancel={() => setAbandonConfirm(false)}
        loading={abandonMutation.isPending}
      />
    </div>
  );
}

export function ForeshadowingTracker(): React.ReactElement {
  const { data: items, isLoading } = useForeshadowing();
  const { data: chapters } = useChapters();

  const maxChapterId = React.useMemo(() => {
    if (!chapters || chapters.length === 0) return 0;
    return Math.max(...chapters.map((ch) => ch.id));
  }, [chapters]);

  const sortedItems = React.useMemo(() => {
    if (!items) return [];
    return [...items].sort((a, b) => {
      // Active first
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      // Then by planted chapter
      return (a.plantedChapter ?? 0) - (b.plantedChapter ?? 0);
    });
  }, [items]);

  if (isLoading) {
    return <LoadingSpinner text="Loading foreshadowing..." />;
  }

  if (sortedItems.length === 0) {
    return (
      <EmptyState
        title="No foreshadowing"
        description="Add foreshadowing elements in the Story Bible to track their lifecycle here."
      />
    );
  }

  return (
    <div className={styles.tracker}>
      {sortedItems.map((item) => (
        <ForeshadowingCard key={item.id} item={item} maxChapterId={maxChapterId} />
      ))}
    </div>
  );
}
