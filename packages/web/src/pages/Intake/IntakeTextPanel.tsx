/**
 * IntakeTextPanel
 *
 * Text input area with file drop zone for document intake.
 * Handles paste, file drop (.txt/.md), and extract button.
 */

import React, { useCallback, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useIntakeStore } from '../../stores/useIntakeStore';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { useDecompose } from '../../hooks/useIntake';
import type { IntakeHint } from '@inxtone/core';
import styles from './Intake.module.css';

export function IntakeTextPanel(): React.ReactElement {
  const { hint, inputText, setInputText, setResult } = useIntakeStore();
  const decomposeMutation = useDecompose();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleExtract = useCallback(() => {
    if (!inputText.trim()) return;

    const input: { text: string; hint?: IntakeHint } = { text: inputText };
    // 'chapters' is UI-only mode; only pass valid API hints
    if (hint && hint !== 'chapters') input.hint = hint;

    decomposeMutation.mutate(input, {
      onSuccess: (result) => {
        setResult(result);
      },
    });
  }, [inputText, hint, decomposeMutation, setResult]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      // Only accept text files
      if (!/\.(txt|md)$/i.exec(file.name)) {
        addNotification('Only .txt and .md files are supported.', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          setInputText(text);
        }
      };
      reader.readAsText(file);
    },
    [setInputText, addNotification]
  );

  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          setInputText(text);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setInputText]);

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;

  return (
    <div className={styles.textPanel}>
      <div
        className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          className={styles.textInput}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste your character descriptions, world-building notes, plot outlines, or any story content here...

Or drag & drop a .txt or .md file."
          rows={12}
        />
      </div>

      <div className={styles.textPanelFooter}>
        <div className={styles.textStats}>
          <span>{charCount.toLocaleString()} chars</span>
          <span>{wordCount.toLocaleString()} words</span>
        </div>
        <div className={styles.textActions}>
          <Button variant="ghost" size="sm" onClick={handleFileSelect}>
            Upload File
          </Button>
          <Button
            variant="primary"
            onClick={handleExtract}
            loading={decomposeMutation.isPending}
            disabled={decomposeMutation.isPending || !inputText.trim()}
          >
            Extract Entities
          </Button>
        </div>
      </div>
    </div>
  );
}
