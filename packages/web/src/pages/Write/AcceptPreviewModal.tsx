/**
 * AcceptPreviewModal — Preview merged content before accepting AI response
 */

import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Modal } from '../../components/forms';
import styles from './AcceptPreviewModal.module.css';

interface AcceptPreviewModalProps {
  isOpen: boolean;
  currentContent: string;
  newText: string;
  onConfirm: (mergedContent: string) => void;
  onCancel: () => void;
}

export function AcceptPreviewModal({
  isOpen,
  currentContent,
  newText,
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

  const handleConfirm = () => {
    const merged = currentContent + (currentContent ? '\n\n' : '') + newText;
    onConfirm(merged);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen
      title="Preview AI Continuation"
      onClose={onCancel}
      onSubmit={handleConfirm}
      submitLabel="Confirm Accept"
      cancelLabel="Cancel"
      size="lg"
    >
      <div className={styles.preview} data-color-mode="dark">
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
      </div>
    </Modal>
  );
}
