/**
 * OutlinePanel — collapsible chapter outline editor
 *
 * Fields: goal, scenes (sortable list), hookEnding.
 * Auto-saves outline changes via debounced useUpdateChapter.
 */

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChapterWithContent, useUpdateChapter } from '../../hooks';
import { useSelectedChapterId } from '../../stores/useEditorStore';
import { contextKeys } from '../../hooks/useChapters';
import type { ChapterOutline } from '@inxtone/core';
import styles from './OutlinePanel.module.css';

const SAVE_DELAY = 1500;

export function OutlinePanel(): React.ReactElement | null {
  const queryClient = useQueryClient();
  const selectedId = useSelectedChapterId();
  const { data: chapter } = useChapterWithContent(selectedId);
  const updateChapter = useUpdateChapter();

  const [open, setOpen] = React.useState(false);
  const [goal, setGoal] = React.useState('');
  const [scenes, setScenes] = React.useState<string[]>([]);
  const [hookEnding, setHookEnding] = React.useState('');
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveStateTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from server when chapter changes
  React.useEffect(() => {
    const outline = chapter?.outline;
    setGoal(outline?.goal ?? '');
    setScenes(outline?.scenes ?? []);
    setHookEnding(outline?.hookEnding ?? '');
  }, [chapter?.id, chapter?.outline]);

  const scheduleOutlineSave = React.useCallback(
    (outline: ChapterOutline) => {
      if (selectedId == null) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setSaveState('saving');
        updateChapter.mutate(
          { id: selectedId, data: { outline } },
          {
            onSuccess: () => {
              setSaveState('saved');
              // Trigger context rebuild since outline changed
              void queryClient.invalidateQueries({
                queryKey: contextKeys.build(selectedId, undefined),
              });
              if (saveStateTimerRef.current) clearTimeout(saveStateTimerRef.current);
              saveStateTimerRef.current = setTimeout(() => setSaveState('idle'), 2000);
            },
            onError: () => setSaveState('idle'),
          }
        );
      }, SAVE_DELAY);
    },
    [selectedId, updateChapter, queryClient]
  );

  // Cleanup timers
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (saveStateTimerRef.current) clearTimeout(saveStateTimerRef.current);
    };
  }, [selectedId]);

  // Build outline object without undefined values (exactOptionalPropertyTypes)
  const buildOutline = (g: string, s: string[], h: string): ChapterOutline => {
    const outline: ChapterOutline = { scenes: s };
    if (g) outline.goal = g;
    if (h) outline.hookEnding = h;
    return outline;
  };

  const handleGoalChange = (value: string) => {
    setGoal(value);
    scheduleOutlineSave(buildOutline(value, scenes, hookEnding));
  };

  const handleHookEndingChange = (value: string) => {
    setHookEnding(value);
    scheduleOutlineSave(buildOutline(goal, scenes, value));
  };

  const handleSceneChange = (index: number, value: string) => {
    const updated = [...scenes];
    updated[index] = value;
    setScenes(updated);
    scheduleOutlineSave(buildOutline(goal, updated, hookEnding));
  };

  const addScene = () => {
    const updated = [...scenes, ''];
    setScenes(updated);
    scheduleOutlineSave(buildOutline(goal, updated, hookEnding));
  };

  const removeScene = (index: number) => {
    const updated = scenes.filter((_, i) => i !== index);
    setScenes(updated);
    scheduleOutlineSave(buildOutline(goal, updated, hookEnding));
  };

  if (selectedId == null) return null;

  return (
    <div className={styles.panel}>
      <button className={styles.header} onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className={styles.chevron}>{open ? '\u25BE' : '\u25B8'}</span>
        <span className={styles.title}>Outline</span>
        {saveState !== 'idle' && (
          <span className={styles.saveStatus}>
            {saveState === 'saving' ? 'Saving...' : 'Saved'}
          </span>
        )}
        {!open && goal && <span className={styles.preview}>{goal}</span>}
      </button>
      {open && (
        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>Goal</label>
            <input
              className={styles.input}
              value={goal}
              onChange={(e) => handleGoalChange(e.target.value)}
              placeholder="What should this chapter accomplish?"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Scenes
              <button className={styles.addBtn} onClick={addScene} type="button">
                + Add
              </button>
            </label>
            {scenes.length === 0 && <p className={styles.empty}>No scenes defined</p>}
            {scenes.map((scene, i) => (
              <div key={i} className={styles.sceneRow}>
                <span className={styles.sceneNum}>{i + 1}.</span>
                <input
                  className={styles.input}
                  value={scene}
                  onChange={(e) => handleSceneChange(i, e.target.value)}
                  placeholder={`Scene ${i + 1} description...`}
                />
                <button
                  className={styles.removeBtn}
                  onClick={() => removeScene(i)}
                  type="button"
                  title="Remove scene"
                >
                  x
                </button>
              </div>
            ))}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Hook / Ending</label>
            <input
              className={styles.input}
              value={hookEnding}
              onChange={(e) => handleHookEndingChange(e.target.value)}
              placeholder="How should this chapter end?"
            />
          </div>
        </div>
      )}
    </div>
  );
}
