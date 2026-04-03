/**
 * AcceptPreviewModal — Preview merged content before accepting AI response
 *
 * Supports insertion at cursor position (3-part preview: before | AI | after)
 * or append at end (2-part preview: existing | AI continuation).
 */

import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Modal } from '../../components/forms';
import { mergeContent } from '../../lib/mergeContent';
import styles from './AcceptPreviewModal.module.css';

interface AcceptPreviewModalProps {
  isOpen: boolean;
  currentContent: string;
  newText: string;
  cursorPosition?: number | null;
  onConfirm: (mergedContent: string) => void;
  onCancel: () => void;
}

export function AcceptPreviewModal({
  isOpen,
  currentContent,
  newText,
  cursorPosition,
  onConfirm,
  onCancel,
}: AcceptPreviewModalProps): React.ReactElement | null {
  const dividerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && dividerRef.current) {
      requestAnimationFrame(() => {
        dividerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [isOpen]);

  // Determine if inserting mid-content or appending at end
  const isInsertMode =
    cursorPosition != null && cursorPosition >= 0 && cursorPosition < currentContent.length;

  const beforeCursor = isInsertMode ? currentContent.slice(0, cursorPosition) : '';
  const afterCursor = isInsertMode ? currentContent.slice(cursorPosition) : '';

  const handleConfirm = () => {
    onConfirm(mergeContent(currentContent, newText, cursorPosition));
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen
      title={isInsertMode ? 'Preview AI Insertion' : 'Preview AI Continuation'}
      onClose={onCancel}
      onSubmit={handleConfirm}
      submitLabel="Confirm Accept"
      cancelLabel="Cancel"
      size="lg"
    >
      <div className={styles.preview} data-color-mode="dark">
        {isInsertMode ? (
          <>
            {beforeCursor && (
              <div className={styles.existingContent}>
                <MDEditor.Markdown source={beforeCursor} />
              </div>
            )}
            <div ref={dividerRef} className={styles.divider}>
              <span className={styles.dividerLabel}>AI Insertion</span>
            </div>
            <div className={styles.newContent}>
              <MDEditor.Markdown source={newText} />
            </div>
            {afterCursor && (
              <>
                <div className={styles.dividerAfter}>
                  <span className={styles.dividerLabel}>Continues</span>
                </div>
                <div className={styles.existingContent}>
                  <MDEditor.Markdown source={afterCursor} />
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {currentContent && (
              <div className={styles.existingContent}>
                <MDEditor.Markdown source={currentContent} />
              </div>
            )}
            <div ref={dividerRef} className={styles.divider}>
              <span className={styles.dividerLabel}>AI Continuation</span>
            </div>
            <div className={styles.newContent}>
              <MDEditor.Markdown source={newText} />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
