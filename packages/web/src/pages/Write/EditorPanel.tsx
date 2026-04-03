/**
 * EditorPanel — MDEditor wrapper with Ctrl+S and dirty tracking
 */

import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useChapterWithContent, useSaveContent } from '../../hooks';
import { useAutoSave } from '../../hooks/useAutoSave';
import {
  useEditorStore,
  useSelectedChapterId,
  useIsDirty,
  useEditorActions,
} from '../../stores/useEditorStore';
import { EditorToolbar } from './EditorToolbar';
import { OutlinePanel } from './OutlinePanel';
import { EmptyState } from '../../components/ui';
import styles from './EditorPanel.module.css';

interface EditorPanelProps {
  contentRef?: React.MutableRefObject<string>;
}

export function EditorPanel({
  contentRef: externalContentRef,
}: EditorPanelProps): React.ReactElement {
  const selectedId = useSelectedChapterId();
  const isDirty = useIsDirty();
  const { markDirty, markSaved } = useEditorActions();
  const { data: chapter } = useChapterWithContent(selectedId);
  const saveMutation = useSaveContent();

  const [content, setContent] = React.useState('');
  const contentRef = React.useRef(content);
  contentRef.current = content;
  if (externalContentRef) externalContentRef.current = content;

  const editorWrapperRef = React.useRef<HTMLDivElement>(null);
  const setCursorPosition = useEditorStore((s) => s.setCursorPosition);
  const { scheduleAutoSave, notifyManualSave } = useAutoSave(selectedId, contentRef);

  // Sync content from server when chapter changes
  React.useEffect(() => {
    if (chapter) {
      setContent(chapter.content ?? '');
    } else {
      setContent('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally sync only on id/content change, not whole chapter object
  }, [chapter?.id, chapter?.content]);

  const handleChange = (val?: string) => {
    const newVal = val ?? '';
    setContent(newVal);
    markDirty();
    scheduleAutoSave();
    // Read cursor position after React re-renders the textarea
    requestAnimationFrame(() => {
      const textarea = editorWrapperRef.current?.querySelector('textarea');
      if (textarea) setCursorPosition(textarea.selectionStart);
    });
  };

  // Track cursor position via DOM events on the editor textarea
  React.useEffect(() => {
    const wrapper = editorWrapperRef.current;
    if (!wrapper) return;
    const updateCursor = () => {
      const textarea = wrapper.querySelector('textarea');
      if (textarea) setCursorPosition(textarea.selectionStart);
    };
    wrapper.addEventListener('keyup', updateCursor);
    wrapper.addEventListener('mouseup', updateCursor);
    return () => {
      wrapper.removeEventListener('keyup', updateCursor);
      wrapper.removeEventListener('mouseup', updateCursor);
    };
  }, [setCursorPosition]);

  const handleSave = React.useCallback(
    (createVersion: boolean) => {
      if (selectedId == null) return;
      const savedContent = contentRef.current;
      saveMutation.mutate(
        { chapterId: selectedId, content: savedContent, createVersion },
        {
          onSuccess: () => {
            markSaved();
            notifyManualSave(savedContent);
          },
        }
      );
    },
    [selectedId, saveMutation, markSaved, notifyManualSave]
  );

  // Ctrl+S / Cmd+S handler
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  // Warn on page unload with unsaved changes
  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  if (selectedId == null) {
    return (
      <div className={styles.emptyWrapper}>
        <EmptyState
          title="No chapter selected"
          description="Select a chapter from the sidebar or create a new one to start writing."
        />
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <EditorToolbar content={content} onSave={handleSave} saving={saveMutation.isPending} />
      <OutlinePanel />
      <div ref={editorWrapperRef} className={styles.editorWrapper} data-color-mode="dark">
        <MDEditor
          value={content}
          onChange={handleChange}
          height="100%"
          visibleDragbar={false}
          preview="edit"
        />
      </div>
    </div>
  );
}
