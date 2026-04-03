/**
 * WelcomeScreen - Shown when the database is empty
 *
 * Offers three paths: load English demo, load Chinese demo, or start empty.
 */

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../lib/api';
import styles from './WelcomeScreen.module.css';

export function WelcomeScreen(): React.ReactElement {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleLoad = async (lang: 'en' | 'zh') => {
    setLoading(lang);
    setError(null);
    try {
      await apiPost('/seed/load', { lang });
      await queryClient.invalidateQueries();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load demo data';
      setError(msg);
    } finally {
      setLoading(null);
    }
  };

  const handleEmpty = () => {
    // Just close - the Dashboard will re-render and show stats (all zeros)
    // We need to set a flag so Dashboard doesn't show WelcomeScreen again
    sessionStorage.setItem('inxtone-skipped-welcome', '1');
    window.location.reload();
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome to Inxtone</h1>
      <p className={styles.subtitle}>
        AI-native storytelling framework for serial fiction writers. Pick a demo story to explore,
        or start from scratch.
      </p>

      <div className={styles.cards}>
        <div
          className={`${styles.card}${loading ? ` ${styles.cardLoading}` : ''}`}
          onClick={() => void handleLoad('en')}
        >
          <div className={styles.cardTitle}>{loading === 'en' ? 'Loading...' : 'English Demo'}</div>
          <div className={styles.cardDescription}>
            &ldquo;The Wound of Stars&rdquo; &mdash; A literary fantasy where language holds magical
            power
          </div>
        </div>

        <div
          className={`${styles.card}${loading ? ` ${styles.cardLoading}` : ''}`}
          onClick={() => void handleLoad('zh')}
        >
          <div className={styles.cardTitle}>{loading === 'zh' ? 'Loading...' : 'Chinese Demo'}</div>
          <div className={styles.cardDescription}>
            《墨渊记》&mdash; A xianxia cultivation novel set in a world of ink magic
          </div>
        </div>

        <div
          className={`${styles.card}${loading ? ` ${styles.cardLoading}` : ''}`}
          onClick={handleEmpty}
        >
          <div className={styles.cardTitle}>Start Empty</div>
          <div className={styles.cardDescription}>
            Begin with a blank canvas and build your story from scratch
          </div>
        </div>
      </div>

      {error && (
        <p className={styles.hint} style={{ color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}
      <p className={styles.hint}>You can clear demo data anytime in Settings.</p>
    </div>
  );
}
