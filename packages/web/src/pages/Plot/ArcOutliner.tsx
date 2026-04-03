/**
 * ArcOutliner — Tree view of story arcs
 *
 * Displays Arc → Sections → Chapters hierarchy with progress bars.
 * Clicking a chapter navigates to the Write page.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { useArcs, useChapters } from '../../hooks';
import { useEditorStore } from '../../stores/useEditorStore';
import type { Arc, ArcSection, ArcStatus, ChapterId, Chapter } from '@inxtone/core';
import styles from './ArcOutliner.module.css';

function buildChapterMap(chapters: Chapter[]): Map<number, Chapter> {
  const map = new Map<number, Chapter>();
  for (const ch of chapters) {
    map.set(ch.id, ch);
  }
  return map;
}

const STATUS_VARIANTS: Record<ArcStatus, 'muted' | 'warning' | 'success'> = {
  planned: 'muted',
  in_progress: 'warning',
  complete: 'success',
};

function ProgressBar({ value }: { value: number }): React.ReactElement {
  return (
    <div className={styles.progressBar}>
      <div className={styles.progressFill} style={{ width: `${value}%` }} />
    </div>
  );
}

function SectionNode({
  section,
  chapterMap,
  onChapterClick,
}: {
  section: ArcSection;
  chapterMap: Map<number, Chapter>;
  onChapterClick: (id: ChapterId) => void;
}): React.ReactElement {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionName}>{section.name}</span>
        <Badge variant={STATUS_VARIANTS[section.status]}>{section.status.replace('_', ' ')}</Badge>
      </div>
      {section.chapters.length > 0 && (
        <ul className={styles.chapterList}>
          {section.chapters.map((chId) => {
            const ch = chapterMap.get(chId);
            return (
              <li key={chId}>
                <button className={styles.chapterLink} onClick={() => onChapterClick(chId)}>
                  Ch. {chId} — {ch?.title ?? 'Untitled'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ArcNode({
  arc,
  chapterMap,
  onChapterClick,
}: {
  arc: Arc;
  chapterMap: Map<number, Chapter>;
  onChapterClick: (id: ChapterId) => void;
}): React.ReactElement {
  const [expanded, setExpanded] = React.useState(false);
  const hasSections = arc.sections && arc.sections.length > 0;

  return (
    <div className={styles.arcCard}>
      <button className={styles.arcHeader} onClick={() => setExpanded(!expanded)}>
        <span className={styles.expandIcon}>{expanded ? '\u25BE' : '\u25B8'}</span>
        <span className={styles.arcName}>{arc.name}</span>
        <Badge variant={arc.type === 'main' ? 'primary' : 'default'}>{arc.type}</Badge>
        <Badge variant={STATUS_VARIANTS[arc.status]}>{arc.status.replace('_', ' ')}</Badge>
        <span className={styles.progressLabel}>{arc.progress}%</span>
      </button>
      <ProgressBar value={arc.progress} />

      {expanded && hasSections && (
        <div className={styles.arcBody}>
          {arc.sections!.map((section, i) => (
            <SectionNode
              key={i}
              section={section}
              chapterMap={chapterMap}
              onChapterClick={onChapterClick}
            />
          ))}
        </div>
      )}

      {expanded && !hasSections && (
        <div className={styles.arcBody}>
          <p className={styles.noSections}>No sections defined for this arc.</p>
        </div>
      )}
    </div>
  );
}

export function ArcOutliner(): React.ReactElement {
  const { data: arcs, isLoading: arcsLoading } = useArcs();
  const { data: chapters, isLoading: chaptersLoading } = useChapters();
  const navigate = useNavigate();

  const isLoading = arcsLoading || chaptersLoading;

  const chapterMap = React.useMemo(() => buildChapterMap(chapters ?? []), [chapters]);

  const sortedArcs = React.useMemo(() => {
    if (!arcs) return [];
    return [...arcs].sort((a, b) => {
      if (a.type === 'main' && b.type !== 'main') return -1;
      if (a.type !== 'main' && b.type === 'main') return 1;
      return 0;
    });
  }, [arcs]);

  const handleChapterClick = React.useCallback(
    (chapterId: ChapterId) => {
      useEditorStore.getState().selectChapter(chapterId);
      navigate('/write');
    },
    [navigate]
  );

  if (isLoading) {
    return <LoadingSpinner text="Loading arcs..." />;
  }

  if (sortedArcs.length === 0) {
    return (
      <EmptyState
        title="No arcs defined"
        description="Add story arcs in the Story Bible to visualize your plot structure here."
      />
    );
  }

  return (
    <div className={styles.outliner}>
      {sortedArcs.map((arc) => (
        <ArcNode
          key={arc.id}
          arc={arc}
          chapterMap={chapterMap}
          onChapterClick={handleChapterClick}
        />
      ))}
    </div>
  );
}
