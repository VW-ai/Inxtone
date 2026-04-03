/**
 * EditorToolbar — horizontal bar above the editor
 *
 * Shows chapter title, status badge, word count, save indicator, save button, AI toggle.
 */

import React from 'react';
import { Badge, Button } from '../../components/ui';
import {
  useSelectedChapterId,
  useIsDirty,
  useLastSavedAt,
  useAIPanelOpen,
  useAutoSaveStatus,
  useEditorActions,
} from '../../stores/useEditorStore';
import { useChapterWithContent } from '../../hooks';
import type { ChapterStatus } from '@inxtone/core';
import styles from './EditorToolbar.module.css';

const statusVariant: Record<ChapterStatus, 'muted' | 'default' | 'primary' | 'success'> = {
  outline: 'muted',
  draft: 'default',
  revision: 'primary',
  done: 'success',
};

interface EditorToolbarProps {
  content: string;
  onSave: (createVersion: boolean) => void;
  saving: boolean;
}

/** Count words: CJK chars counted individually, English by whitespace */
export function countWords(text: string): number {
  if (!text.trim()) return 0;
  const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) ?? []).length;
  const english = text
    .replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return cjk + english;
}

export function EditorToolbar({ content, onSave, saving }: EditorToolbarProps): React.ReactElement {
  const selectedId = useSelectedChapterId();
  const isDirty = useIsDirty();
  const lastSavedAt = useLastSavedAt();
  const aiPanelOpen = useAIPanelOpen();
  const autoSaveStatus = useAutoSaveStatus();
  const { toggleAIPanel, openChapterForm } = useEditorActions();
  const { data: chapter } = useChapterWithContent(selectedId);

  const wordCount = React.useMemo(() => countWords(content), [content]);

  const saveLabel = React.useMemo(() => {
    if (saving) return 'Saving...';
    if (isDirty) return 'Unsaved *';
    if (lastSavedAt) {
      const ago = Math.round((Date.now() - lastSavedAt) / 1000);
      if (ago < 5) return 'Saved';
      if (ago < 60) return `Saved ${ago}s ago`;
      return `Saved ${Math.round(ago / 60)}m ago`;
    }
    return 'Saved';
  }, [saving, isDirty, lastSavedAt]);

  const autoSaveLabel =
    autoSaveStatus === 'saving'
      ? 'Auto-saving...'
      : autoSaveStatus === 'saved'
        ? 'Auto-saved'
        : autoSaveStatus === 'error'
          ? 'Auto-save failed'
          : null;

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        {chapter && (
          <>
            <span
              className={styles.chapterTitle}
              onClick={() => {
                if (selectedId != null) openChapterForm('edit', selectedId);
              }}
              title="Click to edit chapter info"
            >
              {chapter.title ?? 'Untitled'}
            </span>
            <Badge variant={statusVariant[chapter.status]} size="sm">
              {chapter.status}
            </Badge>
          </>
        )}
      </div>

      <div className={styles.right}>
        <span className={styles.wordCount}>{wordCount} words</span>
        {autoSaveLabel && (
          <span
            className={`${styles.autoSave} ${autoSaveStatus === 'error' ? styles.autoSaveError : ''}`}
          >
            <span
              className={`${styles.autoSaveDot} ${autoSaveStatus === 'saving' ? styles.autoSaveDotPulse : ''}`}
            />
            {autoSaveLabel}
          </span>
        )}
        <span className={`${styles.saveIndicator} ${isDirty ? styles.unsaved : ''}`}>
          {saveLabel}
        </span>
        <Button
          size="sm"
          variant="primary"
          onClick={() => onSave(true)}
          disabled={!isDirty || saving}
          loading={saving}
        >
          Save
        </Button>
        <button
          className={`${styles.aiToggle} ${aiPanelOpen ? styles.aiToggleActive : ''}`}
          onClick={toggleAIPanel}
          title={aiPanelOpen ? 'Hide AI panel' : 'Show AI panel'}
        >
          AI
        </button>
      </div>
    </div>
  );
}
