/**
 * ChapterImportPanel
 *
 * File upload + paste area for importing existing chapters.
 * Shows detected chapter boundaries and word counts.
 */

import React, { useCallback, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useNotificationStore } from '../../stores/useNotificationStore';
import type { DetectedChapter } from '@inxtone/core';
import styles from './Intake.module.css';

interface ChapterImportPanelProps {
  onChaptersReady: (chapters: Array<{ title: string; content: string; sortOrder: number }>) => void;
  disabled?: boolean;
}

/** Simple client-side chapter detection matching chapterSplitter patterns */
function detectChapters(text: string): DetectedChapter[] {
  const lines = text.split('\n');
  const chapterPattern =
    /^(?:\s*)(?:第[一二三四五六七八九十百千\d]+[章回]|Chapter\s+\d+|CHAPTER\s+\d+)/i;
  const marks: Array<{ line: number; title: string }> = [];

  for (const [i, line] of lines.entries()) {
    if (chapterPattern.test(line.trim())) {
      marks.push({ line: i, title: line.trim() });
    }
  }

  if (marks.length === 0) {
    // No chapter markers found — treat entire text as one chapter
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return [{ title: 'Chapter 1', content: text, startLine: 0, endLine: lines.length, wordCount }];
  }

  const chapters: DetectedChapter[] = [];
  for (const [i, mark] of marks.entries()) {
    const startLine = mark.line;
    const endLine = i < marks.length - 1 ? marks[i + 1]!.line : lines.length;
    const content = lines.slice(startLine, endLine).join('\n');
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    chapters.push({
      title: mark.title,
      content,
      startLine,
      endLine,
      wordCount,
    });
  }

  return chapters;
}

export function ChapterImportPanel({
  onChaptersReady,
  disabled,
}: ChapterImportPanelProps): React.ReactElement {
  const [rawText, setRawText] = useState('');
  const [chapters, setChapters] = useState<DetectedChapter[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const handleTextChange = useCallback((text: string) => {
    setRawText(text);
    if (text.trim()) {
      setChapters(detectChapters(text));
    } else {
      setChapters([]);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (!/\.(txt|md)$/i.exec(file.name)) {
        addNotification('Only .txt and .md files are supported.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') handleTextChange(text);
      };
      reader.readAsText(file);
    },
    [handleTextChange, addNotification]
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
        if (typeof text === 'string') handleTextChange(text);
      };
      reader.readAsText(file);
    };
    input.click();
  }, [handleTextChange]);

  const handleStartExtract = () => {
    const formatted = chapters.map((ch, i) => ({
      title: ch.title,
      content: ch.content,
      sortOrder: i,
    }));
    onChaptersReady(formatted);
  };

  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

  return (
    <div className={styles.textPanel}>
      <div
        className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <textarea
          className={styles.textInput}
          value={rawText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Paste your chapter text here. Use markers like 第一章, Chapter 1, etc. to separate chapters.

Or drag & drop a .txt or .md file."
          rows={10}
        />
      </div>

      {/* Chapter preview */}
      {chapters.length > 0 && (
        <div className={styles.chapterPreview}>
          <div className={styles.chapterPreviewHeader}>
            <span>{chapters.length} chapters detected</span>
            <span>{totalWords.toLocaleString()} total words</span>
          </div>
          <div className={styles.chapterList}>
            {chapters.map((ch, i) => (
              <div key={i} className={styles.chapterItem}>
                <span className={styles.chapterTitle}>{ch.title}</span>
                <span className={styles.chapterWords}>{ch.wordCount.toLocaleString()} words</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.textPanelFooter}>
        <div className={styles.textActions}>
          <Button variant="ghost" size="sm" onClick={handleFileSelect}>
            Upload File
          </Button>
          <Button
            variant="primary"
            onClick={handleStartExtract}
            disabled={disabled ?? chapters.length === 0}
          >
            Extract Story Bible
          </Button>
        </div>
      </div>
    </div>
  );
}
