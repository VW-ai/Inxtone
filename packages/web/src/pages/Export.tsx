/**
 * Export Page
 *
 * Multi-format chapter export and Story Bible export.
 */

import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { useVolumes, useChapters } from '../hooks/useChapters';
import { exportChapters, exportStoryBible } from '../lib/exportApi';
import styles from './Page.module.css';

type ExportFormat = 'md' | 'txt' | 'docx';
type RangeType = 'all' | 'volume' | 'chapters';

export function Export(): React.ReactElement {
  // Chapter export state
  const [format, setFormat] = useState<ExportFormat>('md');
  const [rangeType, setRangeType] = useState<RangeType>('all');
  const [volumeId, setVolumeId] = useState<number | undefined>();
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);
  const [includeOutline, setIncludeOutline] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterMessage, setChapterMessage] = useState<string | null>(null);

  // Bible export state
  const [bibleLoading, setBibleLoading] = useState(false);
  const [bibleMessage, setBibleMessage] = useState<string | null>(null);

  // Data for selectors
  const { data: volumes } = useVolumes();
  const { data: chapters } = useChapters();

  const handleExportChapters = async () => {
    setChapterLoading(true);
    setChapterMessage(null);
    try {
      const range: { type: RangeType; volumeId?: number; chapterIds?: number[] } = {
        type: rangeType,
      };
      if (rangeType === 'volume' && volumeId) range.volumeId = volumeId;
      if (rangeType === 'chapters' && selectedChapters.length > 0)
        range.chapterIds = selectedChapters;

      const payload: Parameters<typeof exportChapters>[0] = { format, range };
      if (includeOutline) payload.includeOutline = true;
      if (includeMetadata) payload.includeMetadata = true;

      await exportChapters(payload);
      setChapterMessage('Download started.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      setChapterMessage(`Error: ${msg}`);
    } finally {
      setChapterLoading(false);
    }
  };

  const handleExportBible = async () => {
    setBibleLoading(true);
    setBibleMessage(null);
    try {
      await exportStoryBible();
      setBibleMessage('Download started.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      setBibleMessage(`Error: ${msg}`);
    } finally {
      setBibleLoading(false);
    }
  };

  const handleChapterToggle = (id: number) => {
    setSelectedChapters((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Export</h1>
        <p className={styles.subtitle}>
          Download your chapters or Story Bible in multiple formats.
        </p>
      </header>

      <section className={styles.section}>
        {/* Chapter Export */}
        <div className={styles.card}>
          <h3>Chapter Export</h3>

          {/* Format selector */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Format</label>
            <div className={styles.buttonRow}>
              {(['md', 'txt', 'docx'] as const).map((f) => (
                <Button
                  key={f}
                  variant={format === f ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setFormat(f)}
                >
                  {f.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          {/* Range selector */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Range</label>
            <Select
              size="sm"
              value={rangeType}
              onChange={(e) => setRangeType(e.target.value as RangeType)}
              options={[
                { value: 'all', label: 'All chapters' },
                { value: 'volume', label: 'By volume' },
                { value: 'chapters', label: 'Select chapters' },
              ]}
            />
          </div>

          {/* Volume picker (if range = volume) */}
          {rangeType === 'volume' && volumes && volumes.length > 0 && (
            <div className={styles.fieldGroup}>
              <Select
                size="sm"
                value={volumeId ? String(volumeId) : ''}
                onChange={(e) => setVolumeId(Number(e.target.value))}
                placeholder="Select a volume"
                options={volumes.map((v) => ({
                  value: String(v.id),
                  label: v.name ?? `Volume ${v.id}`,
                }))}
              />
            </div>
          )}

          {/* Chapter multi-select (if range = chapters) */}
          {rangeType === 'chapters' && chapters && chapters.length > 0 && (
            <div className={styles.checkboxList}>
              {chapters.map((ch) => (
                <label key={ch.id} className={styles.checkboxListItem}>
                  <input
                    type="checkbox"
                    checked={selectedChapters.includes(ch.id)}
                    onChange={() => handleChapterToggle(ch.id)}
                  />
                  {ch.title ?? `Chapter ${ch.sortOrder}`}
                </label>
              ))}
            </div>
          )}

          {/* Options */}
          <div className={styles.checkboxRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={includeOutline}
                onChange={(e) => setIncludeOutline(e.target.checked)}
              />
              Include outlines
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
              />
              Include metadata
            </label>
          </div>

          {/* Download button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleExportChapters()}
            loading={chapterLoading}
            disabled={chapterLoading}
          >
            Download {format.toUpperCase()}
          </Button>

          {chapterMessage && (
            <p
              className={`${styles.feedbackMessage} ${chapterMessage.startsWith('Error') ? styles.feedbackError : styles.feedbackSuccess}`}
            >
              {chapterMessage}
            </p>
          )}
        </div>

        {/* Story Bible Export */}
        <div className={styles.card}>
          <h3>Story Bible Export</h3>
          <p>Export your complete Story Bible as structured Markdown.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleExportBible()}
            loading={bibleLoading}
            disabled={bibleLoading}
          >
            Download Story Bible
          </Button>
          {bibleMessage && (
            <p
              className={`${styles.feedbackMessage} ${bibleMessage.startsWith('Error') ? styles.feedbackError : styles.feedbackSuccess}`}
            >
              {bibleMessage}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
