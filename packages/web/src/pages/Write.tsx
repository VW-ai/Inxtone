/**
 * Write Page — Three-panel chapter editor
 *
 * Left: Chapter list + Story Bible quick-ref
 * Center: Markdown editor with toolbar
 * Right: AI sidebar (collapsible)
 */

import React from 'react';
import { Tabs } from '../components/ui';
import type { Tab } from '../components/ui';
import {
  useSelectedChapterId,
  useAIPanelOpen,
  useLeftPanelTab,
  useEditorActions,
} from '../stores/useEditorStore';
import { useChapterWithContent, useSaveContent } from '../hooks';
import { ChapterListPanel } from './Write/ChapterListPanel';
import { StoryBiblePanel } from './Write/StoryBiblePanel';
import { ChapterForm } from './Write/ChapterForm';
import { EditorPanel } from './Write/EditorPanel';
import { AISidebar } from './Write/AISidebar';
import { AcceptPreviewModal } from './Write/AcceptPreviewModal';
import styles from './Write.module.css';

const LEFT_TABS: Tab[] = [
  { id: 'chapters', label: 'Chapters' },
  { id: 'bible', label: 'Bible' },
];

export function Write(): React.ReactElement {
  const selectedId = useSelectedChapterId();
  const aiPanelOpen = useAIPanelOpen();
  const leftPanelTab = useLeftPanelTab();
  const { setLeftPanelTab, clearAIState } = useEditorActions();

  // For accept: append AI text to chapter content
  const { data: chapter } = useChapterWithContent(selectedId);
  const saveMutation = useSaveContent();

  // Accept preview state
  const [showAcceptPreview, setShowAcceptPreview] = React.useState(false);
  const [pendingAIText, setPendingAIText] = React.useState('');

  const handleAIAccept = React.useCallback(
    (text: string) => {
      if (selectedId == null) return;
      setPendingAIText(text);
      setShowAcceptPreview(true);
    },
    [selectedId]
  );

  const handlePreviewConfirm = React.useCallback(
    (mergedContent: string) => {
      if (selectedId == null) return;
      saveMutation.mutate({
        chapterId: selectedId,
        content: mergedContent,
        createVersion: false,
      });
      setShowAcceptPreview(false);
      setPendingAIText('');
      clearAIState();
    },
    [selectedId, saveMutation, clearAIState]
  );

  const handlePreviewCancel = React.useCallback(() => {
    setShowAcceptPreview(false);
    setPendingAIText('');
  }, []);

  return (
    <div className={styles.writePage}>
      <div className={styles.leftPanel}>
        <div className={styles.leftTabs}>
          <Tabs
            tabs={LEFT_TABS}
            activeTab={leftPanelTab}
            onChange={(id) => setLeftPanelTab(id as 'chapters' | 'bible')}
          />
        </div>
        <div className={styles.leftContent}>
          {leftPanelTab === 'chapters' ? <ChapterListPanel /> : <StoryBiblePanel />}
        </div>
      </div>

      <div className={styles.centerPanel}>
        <EditorPanel />
      </div>

      {aiPanelOpen && selectedId != null && (
        <div className={styles.rightPanel}>
          <AISidebar onAccept={handleAIAccept} />
        </div>
      )}

      <ChapterForm />

      <AcceptPreviewModal
        isOpen={showAcceptPreview}
        currentContent={chapter?.content ?? ''}
        newText={pendingAIText}
        onConfirm={handlePreviewConfirm}
        onCancel={handlePreviewCancel}
      />
    </div>
  );
}
