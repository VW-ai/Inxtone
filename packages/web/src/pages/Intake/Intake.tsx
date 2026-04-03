/**
 * Intake Page
 *
 * Smart Intake — AI-powered Story Bible entity extraction.
 * Two modes:
 * - Document Intake: paste/upload text, select topic, extract entities
 * - Chapter Import: paste/upload chapters, multi-pass AI extraction (SSE)
 */

import React from 'react';
import { Icon } from '../../components/Icon';
import { useIntakeStore, useIntakeResult, type TopicHint } from '../../stores/useIntakeStore';
import { useIntakeImport } from '../../hooks/useIntakeImport';
import { IntakeTextPanel } from './IntakeTextPanel';
import { ChapterImportPanel } from './ChapterImportPanel';
import { ImportProgressPanel } from './ImportProgressPanel';
import { EntityReviewPanel } from './EntityReviewPanel';
import { EntityEditModal } from './EntityEditModal';
import styles from './Intake.module.css';
import pageStyles from '../Page.module.css';

interface TopicChip {
  hint: TopicHint;
  label: string;
  description: string;
}

const TOPICS: TopicChip[] = [
  { hint: 'character', label: 'Characters', description: 'Extract character profiles' },
  { hint: 'world', label: 'World', description: 'World rules, magic systems' },
  { hint: 'plot', label: 'Plot', description: 'Arcs, hooks, foreshadowing' },
  { hint: 'location', label: 'Locations', description: 'Places and settings' },
  { hint: 'faction', label: 'Factions', description: 'Groups and organizations' },
  { hint: 'chapters', label: 'Chapters', description: 'Import existing story chapters' },
  { hint: 'auto', label: 'Auto-detect', description: 'AI identifies all types' },
];

export function Intake(): React.ReactElement {
  const { hint, setHint, reset } = useIntakeStore();
  const result = useIntakeResult();
  const { startImport, cancel, isImporting, currentStep, currentPass, progress, error } =
    useIntakeImport();

  const isChapterMode = hint === 'chapters';

  const handleTopicSelect = (selected: TopicHint) => {
    if (selected === hint) {
      setHint(undefined);
    } else {
      setHint(selected);
    }
  };

  return (
    <div className={pageStyles.page}>
      <header className={pageStyles.header}>
        <h1>
          <span className={styles.headerIcon}>
            <Icon name="sparkle" />
          </span>
          Smart Intake
        </h1>
        <p className={pageStyles.subtitle}>
          Paste your notes or story content — AI will extract structured entities for your Story
          Bible.
        </p>
      </header>

      {/* Topic Selector */}
      <section className={styles.topicSection}>
        <label className={styles.topicLabel}>What are you importing?</label>
        <div className={styles.topicGrid} role="group" aria-label="Import topic selector">
          {TOPICS.map((topic) => (
            <button
              key={topic.hint}
              className={`${styles.topicChip} ${hint === topic.hint ? styles.topicChipActive : ''}`}
              onClick={() => handleTopicSelect(topic.hint)}
              aria-pressed={hint === topic.hint}
            >
              <span className={styles.topicChipLabel}>{topic.label}</span>
              <span className={styles.topicChipDesc}>{topic.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Input Area — switches based on mode */}
      <section className={styles.inputSection}>
        {isChapterMode ? (
          <ChapterImportPanel onChaptersReady={startImport} disabled={isImporting} />
        ) : (
          <IntakeTextPanel />
        )}
      </section>

      {/* Import Progress (chapter mode) */}
      {isImporting && (
        <section className={styles.inputSection}>
          <ImportProgressPanel
            currentStep={currentStep}
            currentPass={currentPass}
            progress={progress}
            error={error}
            onCancel={cancel}
          />
        </section>
      )}

      {/* Results */}
      {result && !isImporting && (
        <section className={styles.resultsSection}>
          <div className={styles.resultsDivider}>
            <span>Extraction Results</span>
          </div>
          <EntityReviewPanel />
          <div className={styles.resetRow}>
            <button className={styles.resetButton} onClick={reset}>
              Start Over
            </button>
          </div>
        </section>
      )}

      {/* Edit Modal */}
      <EntityEditModal />
    </div>
  );
}
