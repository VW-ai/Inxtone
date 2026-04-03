/**
 * StreamingResponse — AI response display area
 */

import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useAILoading, useAIResponse } from '../../stores/useEditorStore';
import styles from './StreamingResponse.module.css';

export function StreamingResponse(): React.ReactElement | null {
  const isLoading = useAILoading();
  const response = useAIResponse();
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom during streaming (only when near bottom)
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 80) {
      el.scrollTop = el.scrollHeight;
    }
  }, [response]);

  if (!isLoading && !response) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.label}>AI Response</span>
        {isLoading && <span className={styles.pulse} />}
      </div>
      <div ref={containerRef} className={styles.content} data-color-mode="dark">
        {response ? (
          <MDEditor.Markdown source={response} className={styles.text ?? ''} />
        ) : isLoading ? (
          <p className={styles.generating}>Generating...</p>
        ) : null}
      </div>
    </div>
  );
}
