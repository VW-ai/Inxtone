/**
 * SetupAssistPanel — suggests entities to link to a chapter
 *
 * Shows when the current chapter has few linked entities.
 * Displays suggestion chips with source indicator and one-click attach.
 */

import React from 'react';
import { useChapterSetup } from '../../hooks/useChapterSetup';
import type { SetupSuggestion } from '../../hooks/useChapterSetup';
import { useUpdateChapter, useChapterWithContent } from '../../hooks';
import { useSelectedChapterId } from '../../stores/useEditorStore';
import type { UpdateChapterInput } from '@inxtone/core';
import styles from './SetupAssistPanel.module.css';

const SOURCE_LABELS: Record<SetupSuggestion['source'], string> = {
  previous_chapter: 'prev',
  arc_roster: 'arc',
  outline_mention: 'outline',
};

const TYPE_ICONS: Record<SetupSuggestion['entityType'], string> = {
  character: '\u4eba', // 人
  location: '\u5730', // 地
  foreshadowing: '\u4f0f', // 伏
};

export function SetupAssistPanel(): React.ReactElement | null {
  const chapterId = useSelectedChapterId();
  const { data: suggestions } = useChapterSetup(chapterId);
  const { data: chapter } = useChapterWithContent(chapterId);
  const updateChapter = useUpdateChapter();

  // Only show when chapter has few linked entities and there are suggestions
  if (!chapterId || !chapter || !suggestions || suggestions.length === 0) return null;

  const linkedCount =
    (chapter.characters?.length ?? 0) +
    (chapter.locations?.length ?? 0) +
    (chapter.foreshadowingHinted?.length ?? 0);

  // Hide once the chapter already has plenty of linked entities
  if (linkedCount >= 6) return null;

  const handleAttach = (suggestion: SetupSuggestion) => {
    if (!chapter) return;
    const update: UpdateChapterInput = {};

    if (suggestion.entityType === 'character') {
      const current = chapter.characters ?? [];
      if (current.includes(suggestion.entityId)) return;
      update.characters = [...current, suggestion.entityId];
    } else if (suggestion.entityType === 'location') {
      const current = chapter.locations ?? [];
      if (current.includes(suggestion.entityId)) return;
      update.locations = [...current, suggestion.entityId];
    } else if (suggestion.entityType === 'foreshadowing') {
      const current = chapter.foreshadowingHinted ?? [];
      if (current.includes(suggestion.entityId)) return;
      update.foreshadowingHinted = [...current, suggestion.entityId];
    }

    updateChapter.mutate({ id: chapterId, data: update });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.icon}>&#x2728;</span>
        <span className={styles.title}>Setup Suggestions</span>
        <span className={styles.count}>{suggestions.length}</span>
      </div>
      <div className={styles.chips}>
        {suggestions.map((s) => (
          <button
            key={`${s.entityType}-${s.entityId}`}
            className={styles.chip}
            onClick={() => handleAttach(s)}
            title={`${s.name} — source: ${SOURCE_LABELS[s.source]} (${Math.round(s.confidence * 100)}%)`}
          >
            <span className={styles.chipIcon}>{TYPE_ICONS[s.entityType]}</span>
            <span className={styles.chipName}>{s.name}</span>
            <span className={styles.chipSource}>{SOURCE_LABELS[s.source]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
