/**
 * ShortcutReferenceModal — Cmd+/ shows all available keyboard shortcuts
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { SHORTCUT_REFERENCE } from '../hooks/useKeyboardShortcuts';
import type { ShortcutDef } from '../hooks/useKeyboardShortcuts';
import styles from './ShortcutReferenceModal.module.css';

const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');

function formatKey(def: ShortcutDef): string {
  const parts: string[] = [];
  if (def.meta) parts.push(isMac ? '\u2318' : 'Ctrl');
  if (def.shift) parts.push(isMac ? '\u21E7' : 'Shift');
  parts.push(def.key === 'Enter' ? '\u21B5' : def.key.toUpperCase());
  return parts.join(isMac ? '' : '+');
}

const categoryLabels: Record<ShortcutDef['category'], string> = {
  general: 'General',
  editing: 'Editing',
  ai: 'AI',
  navigation: 'Navigation',
};

const categoryOrder: ShortcutDef['category'][] = ['general', 'editing', 'ai', 'navigation'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutReferenceModal({ isOpen, onClose }: Props): React.ReactElement | null {
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const grouped = new Map<ShortcutDef['category'], ShortcutDef[]>();
  for (const def of SHORTCUT_REFERENCE) {
    const list = grouped.get(def.category) ?? [];
    list.push(def);
    grouped.set(def.category, list);
  }

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Keyboard Shortcuts</h3>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className={styles.body}>
          {categoryOrder.map((cat) => {
            const items = grouped.get(cat);
            if (!items || items.length === 0) return null;
            return (
              <div key={cat} className={styles.group}>
                <h4 className={styles.groupTitle}>{categoryLabels[cat]}</h4>
                {items.map((def) => (
                  <div key={def.id} className={styles.row}>
                    <span className={styles.description}>{def.description}</span>
                    <kbd className={styles.kbd}>{formatKey(def)}</kbd>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
