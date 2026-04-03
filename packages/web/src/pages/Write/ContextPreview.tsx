/**
 * ContextPreview — displays built AI context items grouped by type
 *
 * Shows expandable cards for each entity type (Characters, Locations, etc.)
 * with counts and individual entity previews when expanded.
 *
 * Features:
 * - Token usage progress bar (green/yellow/red)
 * - Color-coded L1-L5 layer badges with tooltips
 * - Dedicated pinned items section with bulk clear
 * - Empty & error states
 */

import React from 'react';
import { Badge } from '../../components/ui';
import {
  useBuiltContextState,
  useInjectedEntities,
  useEditorActions,
} from '../../stores/useEditorStore';
import { TOTAL_BUDGET } from '@inxtone/core';
import type { ContextItemType, ContextItem } from '@inxtone/core';
import styles from './ContextPreview.module.css';

const typeLabels: Record<ContextItemType, string> = {
  chapter_content: 'Content',
  chapter_outline: 'Outline',
  chapter_prev_tail: 'Prev Tail',
  character: 'Character',
  relationship: 'Relationship',
  location: 'Location',
  arc: 'Arc',
  foreshadowing: 'Foreshadowing',
  hook: 'Hook',
  power_system: 'Power System',
  social_rules: 'Social Rules',
  custom: 'Custom',
};

const layerMap: Record<ContextItemType, string> = {
  chapter_content: 'L1',
  chapter_outline: 'L1',
  chapter_prev_tail: 'L1',
  character: 'L2',
  relationship: 'L2',
  location: 'L2',
  arc: 'L2',
  foreshadowing: 'L3',
  hook: 'L3',
  power_system: 'L4',
  social_rules: 'L4',
  custom: 'L5',
};

type LayerBadgeVariant = 'primary' | 'success' | 'warning' | 'muted' | 'default';

const layerVariant: Record<string, LayerBadgeVariant> = {
  L1: 'primary',
  L2: 'success',
  L3: 'warning',
  L4: 'muted',
  L5: 'default',
};

const layerDescription: Record<string, string> = {
  L1: 'Chapter content, outline, and previous tail',
  L2: 'Characters, relationships, locations, arcs',
  L3: 'Foreshadowing and hooks',
  L4: 'World rules (power system, social)',
  L5: 'Custom / pinned entities',
};

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function ContextPreview(): React.ReactElement {
  const context = useBuiltContextState();
  const injectedEntities = useInjectedEntities();
  const { removeInjectedEntity, clearInjectedEntities } = useEditorActions();
  const [open, setOpen] = React.useState(false);
  const [expandedTypes, setExpandedTypes] = React.useState<Set<ContextItemType>>(new Set());

  const injectedIds = React.useMemo(
    () => new Set(injectedEntities.map((e) => e.id).filter(Boolean)),
    [injectedEntities]
  );

  // Group items by type
  const itemsByType = React.useMemo(() => {
    if (!context) return new Map<ContextItemType, ContextItem[]>();
    const groups = new Map<ContextItemType, ContextItem[]>();
    context.items.forEach((item) => {
      const existing = groups.get(item.type) ?? [];
      existing.push(item);
      groups.set(item.type, existing);
    });
    return groups;
  }, [context]);

  // Pinned items from context
  const pinnedItems = React.useMemo(() => {
    if (!context) return [];
    return context.items.filter((item) => item.id && injectedIds.has(item.id));
  }, [context, injectedIds]);

  // ── Not built state ───────────────────────────

  if (!context) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <span className={styles.label}>Context</span>
          <span className={styles.meta}>Not built</span>
        </div>
        <p className={styles.emptyMessage}>
          Select a chapter and start writing to build AI context
        </p>
      </div>
    );
  }

  // ── Token usage ───────────────────────────────

  const usageRatio = context.totalTokens / TOTAL_BUDGET;
  const usagePercent = Math.min(usageRatio * 100, 100);
  const usageColor = usageRatio < 0.5 ? 'green' : usageRatio < 0.8 ? 'yellow' : 'red';

  const toggleTypeExpansion = (type: ContextItemType) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  return (
    <div className={styles.wrapper}>
      <button className={styles.header} onClick={() => setOpen(!open)}>
        <span className={styles.chevron}>{open ? '\u25BE' : '\u25B8'}</span>
        <span className={styles.label}>Context</span>
        <span className={styles.meta}>
          {context.items.length} items &middot; {formatTokens(context.totalTokens)} /{' '}
          {formatTokens(TOTAL_BUDGET)}
          {context.truncated && ' (truncated)'}
        </span>
      </button>

      {/* Token usage bar */}
      <div className={styles.tokenBar}>
        <div
          className={`${styles.tokenFill} ${styles[`token${usageColor.charAt(0).toUpperCase()}${usageColor.slice(1)}`]}`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>

      {open && (
        <div className={styles.items}>
          {/* Empty items state */}
          {context.items.length === 0 && (
            <p className={styles.emptyMessage}>
              No context items yet. Add Story Bible entities or write chapter content.
            </p>
          )}

          {/* Pinned items section */}
          {pinnedItems.length > 0 && (
            <div className={styles.pinnedSection}>
              <div className={styles.pinnedHeader}>
                <span className={styles.pinnedLabel}>Pinned ({pinnedItems.length})</span>
                <button
                  className={styles.clearAllButton}
                  onClick={clearInjectedEntities}
                  title="Clear all pinned items"
                >
                  Clear all
                </button>
              </div>
              <div className={styles.pinnedItems}>
                {pinnedItems.map((item, i) => {
                  const itemId = item.id ?? `pin-${i}`;
                  return (
                    <div key={itemId} className={styles.pinnedItem}>
                      <span className={styles.itemPreview}>
                        {item.content.length > 60
                          ? item.content.slice(0, 60) + '...'
                          : item.content}
                      </span>
                      <button
                        className={styles.unpinButton}
                        onClick={() => removeInjectedEntity(itemId)}
                        title="Unpin from context"
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Type-grouped items */}
          {Array.from(itemsByType.entries()).map(([type, items]) => {
            const isExpanded = expandedTypes.has(type);
            const layer = layerMap[type];
            return (
              <div key={type} className={styles.typeCard}>
                <button className={styles.typeHeader} onClick={() => toggleTypeExpansion(type)}>
                  <span className={styles.typeChevron}>{isExpanded ? '\u25BE' : '\u25B8'}</span>
                  <Badge
                    variant={layerVariant[layer] ?? 'muted'}
                    size="sm"
                    className={styles.layerBadge ?? ''}
                  >
                    {layer}
                  </Badge>
                  <span className={styles.typeLabel}>
                    {typeLabels[type]} ({items.length})
                  </span>
                  <span className={styles.layerTooltip} title={layerDescription[layer]}>
                    ?
                  </span>
                </button>
                {isExpanded && (
                  <div className={styles.typeItems}>
                    {items.map((item, i) => {
                      const itemId = item.id ?? `idx-${i}`;
                      const isPinned = injectedIds.has(itemId);
                      return (
                        <div
                          key={itemId}
                          className={`${styles.item} ${isPinned ? styles.itemPinned : ''}`}
                        >
                          {isPinned && (
                            <Badge variant="primary" size="sm">
                              Pinned
                            </Badge>
                          )}
                          <span className={styles.itemPreview}>
                            {item.content.length > 60
                              ? item.content.slice(0, 60) + '...'
                              : item.content}
                          </span>
                          {isPinned && (
                            <button
                              className={styles.unpinButton}
                              onClick={() => removeInjectedEntity(itemId)}
                              title="Unpin from context"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
