/**
 * BrainstormPanel — iterative brainstorm direction explorer
 *
 * Accordion UI: each suggestion is a collapsible row showing only its title.
 * Expanding reveals the body text and "Dig deeper" / "Write this" actions.
 * Breadcrumbs show the exploration path when depth > 1.
 */

import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import type { BrainstormSuggestion } from '../../lib/parseBrainstorm';
import type { BrainstormLayer } from '../../stores/useEditorStore';
import { Button } from '../../components/ui';
import styles from './BrainstormPanel.module.css';

interface BrainstormPanelProps {
  stack: BrainstormLayer[];
  onDigDeeper: (suggestion: BrainstormSuggestion) => void;
  onWriteThis: (suggestion: BrainstormSuggestion) => void;
  onBack: () => void;
  onRegenerate: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

export function BrainstormPanel({
  stack,
  onDigDeeper,
  onWriteThis,
  onBack,
  onRegenerate,
  onDismiss,
  isLoading,
}: BrainstormPanelProps): React.ReactElement {
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const topLayer = stack.length > 0 ? stack[stack.length - 1] : null;
  const suggestions = topLayer?.suggestions ?? [];

  // Reset expanded state when layer changes
  const layerKey = stack.length;
  React.useEffect(() => {
    setExpandedId(null);
  }, [layerKey]);

  const toggle = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.label}>Brainstorm Ideas</span>
        {!isLoading && suggestions.length > 0 && (
          <span className={styles.count}>{suggestions.length}</span>
        )}
      </div>

      {stack.length > 1 && (
        <div className={styles.breadcrumbs}>
          <span className={styles.breadcrumbItem}>Start</span>
          {stack.slice(0, -1).map((layer, i) => (
            <React.Fragment key={i}>
              <span className={styles.breadcrumbSep}>&rsaquo;</span>
              <span className={styles.breadcrumbItem}>{layer.topic}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className={styles.items}>
        {isLoading ? (
          <div className={styles.regenerating}>
            <span className={styles.pulse} />
            Generating ideas...
          </div>
        ) : (
          suggestions.map((s) => {
            const isOpen = expandedId === s.id;
            return (
              <div key={s.id} className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}>
                <button
                  className={styles.itemHeader}
                  onClick={() => toggle(s.id)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.chevron}>{isOpen ? '\u25BE' : '\u25B8'}</span>
                  <span className={styles.itemTitle}>{s.title}</span>
                </button>
                {isOpen && (
                  <div className={styles.itemBody} data-color-mode="dark">
                    {s.body && (
                      <MDEditor.Markdown source={s.body} className={styles.bodyText ?? ''} />
                    )}
                    <div className={styles.itemActions}>
                      <button
                        className={styles.digBtn}
                        onClick={() => onDigDeeper(s)}
                        title="Explore this direction further"
                      >
                        Dig deeper
                      </button>
                      <button
                        className={styles.writeBtn}
                        onClick={() => onWriteThis(s)}
                        title="Write prose based on this direction"
                      >
                        Write this
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className={styles.actions}>
        {stack.length > 1 && (
          <Button size="sm" variant="ghost" onClick={onBack}>
            Back
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={onRegenerate} disabled={isLoading}>
          Regenerate
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
