/**
 * Dashboard Page
 *
 * Live stats, active arcs, writing progress, foreshadowing overview,
 * and recent activity — your story at a glance.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacters, useChapters, useArcs, useForeshadowing, useHooks } from '../hooks';
import type { Arc, Chapter, Foreshadowing } from '@inxtone/core';
import { LoadingSpinner } from '../components/ui';
import { WelcomeScreen } from '../components/WelcomeScreen';
import styles from './Dashboard.module.css';

/* ── helpers ──────────────────────────────────────────── */

function formatNumber(n: number): string {
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ── sub-components ───────────────────────────────────── */

function ActiveArcs({
  arcs,
  onNavigate,
}: {
  arcs: Arc[];
  onNavigate: () => void;
}): React.ReactElement {
  const activeArcs = arcs.filter((a) => a.status === 'in_progress');

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Active Arcs</h3>
        <button className={styles.cardLink} onClick={onNavigate}>
          View All &rarr;
        </button>
      </div>
      <div className={styles.cardBody}>
        {activeArcs.length === 0 && <span className={styles.emptyHint}>No arcs in progress</span>}
        {activeArcs.map((arc) => (
          <div key={arc.id} className={styles.arcItem}>
            <div className={styles.arcInfo}>
              <span className={styles.arcName}>{arc.name}</span>
              <span className={styles.arcPercent}>{arc.progress}%</span>
            </div>
            <div className={styles.miniProgressBar}>
              <div className={styles.miniProgressFill} style={{ width: `${arc.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WritingProgress({
  chapters,
  onNavigate,
}: {
  chapters: Chapter[];
  onNavigate: () => void;
}): React.ReactElement {
  const counts = React.useMemo(() => {
    const c = { outline: 0, draft: 0, revision: 0, done: 0 };
    for (const ch of chapters) {
      c[ch.status]++;
    }
    return c;
  }, [chapters]);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Writing Progress</h3>
        <button className={styles.cardLink} onClick={onNavigate}>
          Open Editor &rarr;
        </button>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.statusList}>
          {Object.entries(counts).map(([status, count]) => (
            <div key={status} className={styles.statusRow}>
              <span className={styles.statusLabel}>{status}</span>
              <span className={`${styles.statusCount}${count > 0 ? ` ${styles.highlight}` : ''}`}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ForeshadowingOverview({
  items,
  chapters,
  onNavigate,
}: {
  items: Foreshadowing[];
  chapters: Chapter[];
  onNavigate: () => void;
}): React.ReactElement {
  const stats = React.useMemo(() => {
    const maxChapter = chapters.length > 0 ? Math.max(...chapters.map((c) => c.id)) : 0;
    let active = 0;
    let overdue = 0;
    let resolved = 0;
    for (const f of items) {
      if (f.status === 'active') {
        active++;
        if (f.plannedPayoff && f.plannedPayoff <= maxChapter) {
          overdue++;
        }
      } else if (f.status === 'resolved') {
        resolved++;
      }
    }
    return { active, overdue, resolved };
  }, [items, chapters]);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Foreshadowing</h3>
        <button className={styles.cardLink} onClick={onNavigate}>
          View Tracker &rarr;
        </button>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.foreshadowingSummary}>
          <div className={styles.foreshadowingStat}>
            <span className={`${styles.foreshadowingDot} ${styles.dotActive}`} />
            <span className={styles.foreshadowingCount}>{stats.active}</span>
            <span>active seeds</span>
          </div>
          {stats.overdue > 0 && (
            <div className={styles.foreshadowingStat}>
              <span className={`${styles.foreshadowingDot} ${styles.dotOverdue}`} />
              <span className={styles.foreshadowingCount}>{stats.overdue}</span>
              <span>overdue</span>
            </div>
          )}
          <div className={styles.foreshadowingStat}>
            <span className={`${styles.foreshadowingDot} ${styles.dotResolved}`} />
            <span className={styles.foreshadowingCount}>{stats.resolved}</span>
            <span>resolved</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ActivityEntry {
  label: React.ReactNode;
  time: string;
}

function RecentActivity({ entries }: { entries: ActivityEntry[] }): React.ReactElement {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Recent Activity</h3>
      </div>
      <div className={styles.cardBody}>
        {entries.length === 0 && <span className={styles.emptyHint}>No recent activity</span>}
        <div className={styles.activityList}>
          {entries.map((entry, i) => (
            <div key={i} className={styles.activityItem}>
              <span className={styles.activityLabel}>{entry.label}</span>
              <span className={styles.activityTime}>{relativeTime(entry.time)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── main component ───────────────────────────────────── */

export function Dashboard(): React.ReactElement {
  const { data: characters = [], isLoading: charsLoading } = useCharacters();
  const { data: chapters = [], isLoading: chaptersLoading } = useChapters();
  const { data: arcs = [], isLoading: arcsLoading } = useArcs();
  const { data: foreshadowing = [], isLoading: fsLoading } = useForeshadowing();
  const { data: hooks = [], isLoading: hooksLoading } = useHooks();
  const navigate = useNavigate();

  const isLoading = charsLoading || chaptersLoading || arcsLoading || fsLoading || hooksLoading;

  const totalWords = React.useMemo(
    () => chapters.reduce((sum, ch) => sum + ch.wordCount, 0),
    [chapters]
  );

  const recentActivity = React.useMemo((): ActivityEntry[] => {
    const entries: ActivityEntry[] = [];

    for (const ch of chapters) {
      entries.push({
        label: (
          <>
            <strong>Ch. {ch.id}</strong> {ch.title ? `\u2014 ${ch.title}` : ''} saved
          </>
        ),
        time: ch.updatedAt,
      });
    }
    for (const c of characters) {
      entries.push({
        label: (
          <>
            <strong>{c.name}</strong> updated
          </>
        ),
        time: c.updatedAt,
      });
    }
    for (const a of arcs) {
      entries.push({
        label: (
          <>
            Arc <strong>{a.name}</strong> updated
          </>
        ),
        time: a.updatedAt,
      });
    }

    entries.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return entries.slice(0, 5);
  }, [chapters, characters, arcs]);

  if (isLoading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  // Show WelcomeScreen when database is empty (no characters and no chapters)
  const isEmpty = characters.length === 0 && chapters.length === 0;
  const skippedWelcome = sessionStorage.getItem('inxtone-skipped-welcome');
  if (isEmpty && !skippedWelcome) {
    return <WelcomeScreen />;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <p className={styles.subtitle}>Your story at a glance</p>
      </header>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{characters.length}</span>
          <span className={styles.statLabel}>Characters</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{chapters.length}</span>
          <span className={styles.statLabel}>Chapters</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{formatNumber(totalWords)}</span>
          <span className={styles.statLabel}>Words</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{arcs.length}</span>
          <span className={styles.statLabel}>Arcs</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{foreshadowing.length}</span>
          <span className={styles.statLabel}>Foreshadowing</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{hooks.length}</span>
          <span className={styles.statLabel}>Hooks</span>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className={styles.cardsGrid}>
        <ActiveArcs arcs={arcs} onNavigate={() => navigate('/plot')} />
        <WritingProgress chapters={chapters} onNavigate={() => navigate('/write')} />
        <ForeshadowingOverview
          items={foreshadowing}
          chapters={chapters}
          onNavigate={() => navigate('/plot')}
        />
        <RecentActivity entries={recentActivity} />
      </div>
    </div>
  );
}

export default Dashboard;
