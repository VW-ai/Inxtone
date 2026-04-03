/**
 * SearchModal — Cmd+K quick search across all entity types
 *
 * Portal-based overlay with debounced FTS5 search, entity type filters,
 * keyboard navigation (arrows/enter/escape), and navigation on select.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { SearchResultItem } from '@inxtone/core';
import { useSearch } from '../hooks/useSearch';
import { useStoryBibleStore } from '../stores/useStoryBibleStore';
import { useEditorStore } from '../stores/useEditorStore';
import styles from './SearchModal.module.css';

// ───────────────────────────────────────────
// Types
// ───────────────────────────────────────────

type EntityType = SearchResultItem['entityType'];

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'character', label: 'Characters' },
  { value: 'chapter', label: 'Chapters' },
  { value: 'location', label: 'Locations' },
  { value: 'faction', label: 'Factions' },
  { value: 'arc', label: 'Arcs' },
  { value: 'foreshadowing', label: 'Foreshadowing' },
];

// ───────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────

/**
 * Sanitize FTS5 snippet HTML to only allow <mark> tags.
 * Prevents XSS from user-generated content in the database.
 */
function sanitizeHighlight(html: string): string {
  // Strip all HTML tags except <mark> and </mark>
  return html.replace(/<(?!\/?mark\b)[^>]*>/gi, '');
}

const ENTITY_ICONS: Record<EntityType, string> = {
  character: '\u4eba', // 人
  chapter: '\u7ae0', // 章
  location: '\u5730', // 地
  faction: '\u7fa4', // 群
  arc: '\u5f27', // 弧
  foreshadowing: '\u4f0f', // 伏
};

const TAB_MAP: Record<EntityType, string> = {
  character: 'characters',
  chapter: '',
  location: 'locations',
  faction: 'factions',
  arc: 'arcs',
  foreshadowing: 'foreshadowing',
};

// ───────────────────────────────────────────
// Component
// ───────────────────────────────────────────

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps): React.ReactElement | null {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [typeFilter, setTypeFilter] = useState<EntityType | null>(null);

  const filterTypes = useMemo(() => (typeFilter ? [typeFilter] : undefined), [typeFilter]);

  const { data: results, isLoading, error } = useSearch(debouncedQuery, filterTypes, isOpen);

  // Debounce query by 250ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setDebouncedQuery('');
      setActiveIndex(0);
      setTypeFilter(null);
      // Focus input after portal mounts
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.children[activeIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Navigate to entity
  const handleSelect = useCallback(
    (item: SearchResultItem) => {
      onClose();

      if (item.entityType === 'chapter') {
        // Navigate to Write page and select chapter
        const chapterId = Number(item.entityId);
        if (!Number.isNaN(chapterId)) {
          useEditorStore.getState().selectChapter(chapterId);
          navigate('/write');
        }
      } else {
        // Navigate to Bible page with correct tab + selection
        const tab = TAB_MAP[item.entityType];
        const store = useStoryBibleStore.getState();
        store.setTab(tab as ReturnType<typeof useStoryBibleStore.getState>['activeTab']);
        store.select(item.entityId);
        navigate('/bible');
      }
    },
    [navigate, onClose]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const count = results?.length ?? 0;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % Math.max(count, 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((i) => (i - 1 + Math.max(count, 1)) % Math.max(count, 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (results?.[activeIndex]) {
            handleSelect(results[activeIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [results, activeIndex, handleSelect, onClose]
  );

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose} onKeyDown={handleKeyDown}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Search input */}
        <div className={styles.inputRow}>
          <svg
            className={styles.searchIcon}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Search characters, chapters, locations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <span className={styles.shortcutHint}>esc</span>
        </div>

        {/* Filter chips */}
        <div className={styles.filters}>
          <button
            className={`${styles.chip} ${typeFilter === null ? styles.chipActive : ''}`}
            onClick={() => setTypeFilter(null)}
          >
            All
          </button>
          {ENTITY_TYPES.map((et) => (
            <button
              key={et.value}
              className={`${styles.chip} ${typeFilter === et.value ? styles.chipActive : ''}`}
              onClick={() => setTypeFilter(typeFilter === et.value ? null : et.value)}
            >
              {et.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className={styles.results} ref={listRef}>
          {debouncedQuery.length < 2 ? (
            <div className={styles.empty}>Type 2+ characters to search</div>
          ) : error ? (
            <div className={styles.error}>
              <div className={styles.errorTitle}>Search failed</div>
              <div className={styles.errorMessage}>
                {error instanceof Error ? error.message : 'An error occurred'}
              </div>
            </div>
          ) : isLoading ? (
            <div className={styles.empty}>Searching...</div>
          ) : !results || results.length === 0 ? (
            <div className={styles.empty}>No results found</div>
          ) : (
            results.map((item, index) => (
              <div
                key={`${item.entityType}-${item.entityId}`}
                className={`${styles.resultItem} ${index === activeIndex ? styles.resultItemActive : ''}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <div className={styles.entityIcon} data-type={item.entityType}>
                  {ENTITY_ICONS[item.entityType]}
                </div>
                <div className={styles.resultBody}>
                  <div className={styles.resultTitle}>{item.title}</div>
                  {item.highlight && (
                    <div
                      className={styles.resultHighlight}
                      dangerouslySetInnerHTML={{ __html: sanitizeHighlight(item.highlight) }}
                    />
                  )}
                </div>
                <span className={styles.resultType}>{item.entityType}</span>
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className={styles.footer}>
          <span>
            <span className={styles.footerKey}>↑↓</span> navigate
          </span>
          <span>
            <span className={styles.footerKey}>↵</span> open
          </span>
          <span>
            <span className={styles.footerKey}>esc</span> close
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
