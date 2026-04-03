/**
 * Settings Page
 *
 * API key management and seed data controls.
 */

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { useApiKey, useApiKeyActions } from '../stores/useApiKeyStore';
import { apiPost } from '../lib/api';
import styles from './Page.module.css';

function maskKey(key: string): string {
  if (key.length <= 4) return key;
  return '\u00B7'.repeat(Math.min(key.length - 4, 20)) + key.slice(-4);
}

export function Settings(): React.ReactElement {
  const apiKey = useApiKey();
  const { openDialog, clearApiKey } = useApiKeyActions();
  const queryClient = useQueryClient();

  const [seedLoading, setSeedLoading] = useState<string | null>(null);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleLoadSeed = async (lang: 'en' | 'zh') => {
    setSeedLoading(lang);
    setSeedMessage(null);
    try {
      await apiPost('/seed/load', { lang });
      await queryClient.invalidateQueries();
      setSeedMessage(`${lang === 'en' ? 'English' : 'Chinese'} demo loaded successfully.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load';
      setSeedMessage(`Error: ${msg}`);
    } finally {
      setSeedLoading(null);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Clear all story data? This cannot be undone.')) return;
    setSeedLoading('clear');
    setSeedMessage(null);
    try {
      await apiPost('/seed/clear', {});
      await queryClient.invalidateQueries();
      sessionStorage.removeItem('inxtone-skipped-welcome');
      setSeedMessage('All data cleared.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear';
      setSeedMessage(`Error: ${msg}`);
    } finally {
      setSeedLoading(null);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Settings</h1>
        <p className={styles.subtitle}>Manage your API key and demo data.</p>
      </header>

      <section className={styles.section}>
        {/* API Key */}
        <div className={styles.card}>
          <h3>Gemini API Key</h3>
          {apiKey ? (
            <div className={styles.inlineRow}>
              <code className={styles.maskedKey}>{maskKey(apiKey)}</code>
              <Button variant="secondary" size="sm" onClick={openDialog}>
                Change
              </Button>
              <Button variant="ghost" size="sm" onClick={clearApiKey}>
                Remove
              </Button>
            </div>
          ) : (
            <div>
              <p>No API key configured. AI features are disabled.</p>
              <Button variant="primary" size="sm" onClick={openDialog}>
                Set API Key
              </Button>
            </div>
          )}
        </div>

        {/* Seed Data */}
        <div className={styles.card}>
          <h3>Demo Data</h3>
          <p>Load a demo story to explore all features, or clear existing data.</p>
          <div className={styles.buttonRow}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleLoadSeed('en')}
              loading={seedLoading === 'en'}
              disabled={!!seedLoading}
            >
              Load English Demo
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleLoadSeed('zh')}
              loading={seedLoading === 'zh'}
              disabled={!!seedLoading}
            >
              Load Chinese Demo
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => void handleClearData()}
              loading={seedLoading === 'clear'}
              disabled={!!seedLoading}
            >
              Clear All Data
            </Button>
          </div>
          {seedMessage && (
            <p
              className={`${styles.feedbackMessage} ${seedMessage.startsWith('Error') ? styles.feedbackError : styles.feedbackSuccess}`}
            >
              {seedMessage}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
