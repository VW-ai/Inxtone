/**
 * ChapterListPanel — chapter sidebar with arc filter
 */

import React from 'react';
import { Badge, Button, ConfirmDialog, LoadingSpinner } from '../../components/ui';
import { Select } from '../../components/forms';
import { useChapters, useArcs, useDeleteChapter } from '../../hooks';
import {
  useSelectedChapterId,
  useIsDirty,
  useArcFilter,
  useEditorActions,
} from '../../stores/useEditorStore';
import type { Chapter, ChapterStatus } from '@inxtone/core';
import styles from './ChapterListPanel.module.css';

const statusVariant: Record<ChapterStatus, 'muted' | 'default' | 'primary' | 'success'> = {
  outline: 'muted',
  draft: 'default',
  revision: 'primary',
  done: 'success',
};

export function ChapterListPanel(): React.ReactElement {
  const selectedId = useSelectedChapterId();
  const isDirty = useIsDirty();
  const arcFilter = useArcFilter();
  const { selectChapter, setArcFilter, openChapterForm } = useEditorActions();

  const { data: chapters, isLoading } = useChapters(arcFilter ? { arcId: arcFilter } : undefined);
  const { data: arcs } = useArcs();
  const deleteMutation = useDeleteChapter();

  const [confirmSwitchId, setConfirmSwitchId] = React.useState<number | null>(null);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);

  const handleSelect = (id: number) => {
    if (id === selectedId) return;
    if (isDirty) {
      setConfirmSwitchId(id);
    } else {
      selectChapter(id);
    }
  };

  const arcOptions = [
    { value: '', label: 'All Arcs' },
    ...(arcs ?? []).map((a) => ({ value: a.id, label: a.name })),
  ];

  const sorted = React.useMemo(() => {
    if (!chapters) return [];
    return [...chapters].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [chapters]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Chapters</h3>
        <Button size="sm" onClick={() => openChapterForm('create')}>
          + New
        </Button>
      </div>

      <div className={styles.filter}>
        <Select
          options={arcOptions}
          value={arcFilter ?? ''}
          onChange={(e) => setArcFilter(e.target.value || null)}
          placeholder="Filter by arc..."
        />
      </div>

      <div className={styles.list}>
        {isLoading && <LoadingSpinner text="Loading..." size="sm" />}
        {!isLoading && sorted.length === 0 && <p className={styles.empty}>No chapters yet</p>}
        {sorted.map((ch: Chapter) => (
          <div
            key={ch.id}
            className={`${styles.item} ${ch.id === selectedId ? styles.selected : ''}`}
            onClick={() => handleSelect(ch.id)}
          >
            <div className={styles.itemHeader}>
              <span className={styles.itemOrder}>#{ch.id}</span>
              <span className={styles.itemTitle}>{ch.title ?? 'Untitled'}</span>
            </div>
            <div className={styles.itemMeta}>
              <Badge variant={statusVariant[ch.status]} size="sm">
                {ch.status}
              </Badge>
              <span className={styles.wordCount}>{ch.wordCount}w</span>
              <button
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(ch.id);
                }}
                title="Delete chapter"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={confirmSwitchId != null}
        title="Unsaved Changes"
        message="You have unsaved changes. Switch chapter anyway?"
        onConfirm={() => {
          if (confirmSwitchId != null) selectChapter(confirmSwitchId);
          setConfirmSwitchId(null);
        }}
        onCancel={() => setConfirmSwitchId(null)}
      />

      <ConfirmDialog
        isOpen={deleteId != null}
        title="Delete Chapter"
        message="This will permanently delete this chapter and all its versions."
        onConfirm={() => {
          if (deleteId != null) {
            const wasSelected = deleteId === selectedId;
            deleteMutation.mutate(deleteId, {
              onSuccess: () => {
                if (wasSelected) selectChapter(null);
              },
            });
          }
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
