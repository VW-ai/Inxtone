/**
 * StoryBiblePanel — interactive 8-section Bible panel for the Write page
 *
 * Sections: Characters, Relationships, Locations, Arc, Foreshadowing, Hooks, World, Factions
 * Features: collapsible sections, expandable detail cards, quick-search filter,
 * pin/unpin to inject entities into AI context (L5).
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Select } from '../../../components/ui';
import {
  useChapterWithContent,
  useCharacters,
  useRelationships,
  useLocations,
  useArcs,
  useForeshadowing,
  useHooks,
  useWorld,
  useFactions,
  useUpdateChapter,
} from '../../../hooks';
import {
  useSelectedChapterId,
  useInjectedEntities,
  useEditorActions,
} from '../../../stores/useEditorStore';
import { contextKeys } from '../../../hooks/useChapters';
import { SetupAssistPanel } from '../SetupAssistPanel';
import { ExtractionReview } from '../ExtractionReview';
import { BibleSection } from './BibleSection';
import { BibleEntityItem } from './BibleEntityItem';
import {
  CharacterDetail,
  RelationshipDetail,
  LocationDetail,
  ArcDetail,
  ForeshadowingDetail,
  HookDetail,
  FactionDetail,
} from './details';
import {
  buildCharacterContext,
  buildRelationshipContext,
  buildLocationContext,
  buildArcContext,
  buildForeshadowingContext,
  buildHookContext,
  buildFactionContext,
} from './contextBuilders';
import styles from '../StoryBiblePanel.module.css';

export function StoryBiblePanel(): React.ReactElement {
  const queryClient = useQueryClient();
  const selectedId = useSelectedChapterId();
  const { data: chapter } = useChapterWithContent(selectedId);
  const { data: allChars } = useCharacters();
  const { data: allRels } = useRelationships();
  const { data: allLocations } = useLocations();
  const { data: allArcs } = useArcs();
  const { data: allForeshadowing } = useForeshadowing();
  const { data: allHooks } = useHooks(selectedId ?? undefined);
  const { data: world } = useWorld();
  const { data: allFactions } = useFactions();

  const updateChapter = useUpdateChapter();
  const injectedEntities = useInjectedEntities();
  const { injectEntity, removeInjectedEntity } = useEditorActions();

  const [filterText, setFilterText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const injectedIds = useMemo(
    () => new Set(injectedEntities.map((e) => e.id).filter(Boolean)),
    [injectedEntities]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // ── Link/Unlink handlers ──────────────────────

  const invalidateContext = useCallback(() => {
    if (!selectedId) return;
    void queryClient.invalidateQueries({
      queryKey: contextKeys.build(selectedId, undefined),
    });
  }, [selectedId, queryClient]);

  const handleLinkCharacter = useCallback(
    (characterId: string) => {
      if (!selectedId || !chapter) return;
      const updated = [...(chapter.characters ?? []), characterId];
      updateChapter.mutate(
        { id: selectedId, data: { characters: updated } },
        { onSuccess: invalidateContext }
      );
    },
    [selectedId, chapter, updateChapter, invalidateContext]
  );

  const handleUnlinkCharacter = useCallback(
    (characterId: string) => {
      if (!selectedId || !chapter) return;
      const updated = (chapter.characters ?? []).filter((id) => id !== characterId);
      updateChapter.mutate(
        { id: selectedId, data: { characters: updated } },
        { onSuccess: invalidateContext }
      );
    },
    [selectedId, chapter, updateChapter, invalidateContext]
  );

  const handleLinkLocation = useCallback(
    (locationId: string) => {
      if (!selectedId || !chapter) return;
      const updated = [...(chapter.locations ?? []), locationId];
      updateChapter.mutate(
        { id: selectedId, data: { locations: updated } },
        { onSuccess: invalidateContext }
      );
    },
    [selectedId, chapter, updateChapter, invalidateContext]
  );

  const handleUnlinkLocation = useCallback(
    (locationId: string) => {
      if (!selectedId || !chapter) return;
      const updated = (chapter.locations ?? []).filter((id) => id !== locationId);
      updateChapter.mutate(
        { id: selectedId, data: { locations: updated } },
        { onSuccess: invalidateContext }
      );
    },
    [selectedId, chapter, updateChapter, invalidateContext]
  );

  const handleLinkForeshadowing = useCallback(
    (foreshadowingId: string) => {
      if (!selectedId || !chapter) return;
      const updated = [...(chapter.foreshadowingHinted ?? []), foreshadowingId];
      updateChapter.mutate(
        { id: selectedId, data: { foreshadowingHinted: updated } },
        { onSuccess: invalidateContext }
      );
    },
    [selectedId, chapter, updateChapter, invalidateContext]
  );

  const handleUnlinkForeshadowing = useCallback(
    (foreshadowingId: string) => {
      if (!selectedId || !chapter) return;
      const updated = (chapter.foreshadowingHinted ?? []).filter((id) => id !== foreshadowingId);
      updateChapter.mutate(
        { id: selectedId, data: { foreshadowingHinted: updated } },
        { onSuccess: invalidateContext }
      );
    },
    [selectedId, chapter, updateChapter, invalidateContext]
  );

  const handleArcChange = useCallback(
    (arcId: string) => {
      if (!selectedId) return;
      const data: { arcId?: string } = {};
      if (arcId !== '') {
        data.arcId = arcId;
      }
      updateChapter.mutate({ id: selectedId, data }, { onSuccess: invalidateContext });
    },
    [selectedId, updateChapter, invalidateContext]
  );

  // ── Empty state ───────────────────────────────

  if (!selectedId || !chapter) {
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>Select a chapter to see its Story Bible references</div>
      </div>
    );
  }

  // ── Computed data ─────────────────────────────

  const filter = filterText.trim().toLowerCase();
  const matchFilter = (name: string) => !filter || name.toLowerCase().includes(filter);

  const charMap = new Map((allChars ?? []).map((c) => [c.id, c]));

  const linkedCharIds = new Set(chapter.characters ?? []);
  const linkedLocIds = new Set(chapter.locations ?? []);
  const linkedForeshadowingIds = new Set(chapter.foreshadowingHinted ?? []);

  const allCharacters = (allChars ?? []).filter((c) => matchFilter(c.name));
  const characters = [
    ...allCharacters.filter((c) => linkedCharIds.has(c.id)),
    ...allCharacters.filter((c) => !linkedCharIds.has(c.id)),
  ];

  const chapterCharIds = new Set(chapter.characters ?? []);
  const relationships = (allRels ?? []).filter(
    (r) =>
      chapterCharIds.has(r.sourceId) &&
      chapterCharIds.has(r.targetId) &&
      matchFilter(`${charMap.get(r.sourceId)?.name ?? ''} ${charMap.get(r.targetId)?.name ?? ''}`)
  );

  const allLocs = (allLocations ?? []).filter((l) => matchFilter(l.name));
  const locations = [
    ...allLocs.filter((l) => linkedLocIds.has(l.id)),
    ...allLocs.filter((l) => !linkedLocIds.has(l.id)),
  ];

  const arc = chapter.arcId ? (allArcs ?? []).find((a) => a.id === chapter.arcId) : undefined;

  const allForeshadowingItems = (allForeshadowing ?? []).filter((f) => matchFilter(f.content));
  const foreshadowing = [
    ...allForeshadowingItems.filter((f) => linkedForeshadowingIds.has(f.id)),
    ...allForeshadowingItems.filter((f) => !linkedForeshadowingIds.has(f.id)),
  ];

  const hooks = (allHooks ?? []).filter((h) => matchFilter(h.content));

  const hasWorld =
    (world?.powerSystem?.coreRules?.length ?? 0) > 0 ||
    (world?.socialRules && Object.keys(world.socialRules).length > 0);

  const factions = (allFactions ?? []).filter((f) => matchFilter(f.name));

  const linkedCharCount = characters.filter((c) => linkedCharIds.has(c.id)).length;
  const linkedLocCount = locations.filter((l) => linkedLocIds.has(l.id)).length;
  const linkedForeshadowingCount = foreshadowing.filter((f) =>
    linkedForeshadowingIds.has(f.id)
  ).length;

  // ── Render ────────────────────────────────────

  return (
    <div className={styles.panel}>
      <ExtractionReview />
      <SetupAssistPanel />

      {/* Quick-search filter */}
      <div className={styles.filterRow}>
        <input
          className={styles.filterInput}
          type="text"
          placeholder="Filter..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        {filterText && (
          <button className={styles.filterClear} onClick={() => setFilterText('')}>
            &times;
          </button>
        )}
      </div>

      {/* 1. Characters */}
      <BibleSection
        title={`Characters (${linkedCharCount} / ${characters.length})`}
        count={linkedCharCount}
      >
        {characters.length === 0 && <p className={styles.emptySection}>No characters available</p>}
        {characters.map((c) => (
          <BibleEntityItem
            key={c.id}
            id={c.id}
            name={c.name}
            badge={c.role}
            badgeVariant="primary"
            isLinked={linkedCharIds.has(c.id)}
            onLink={() => handleLinkCharacter(c.id)}
            onUnlink={() => handleUnlinkCharacter(c.id)}
            isPinned={injectedIds.has(c.id)}
            onPin={() => injectEntity(buildCharacterContext(c))}
            onUnpin={() => removeInjectedEntity(c.id)}
            expandedId={expandedId}
            onToggleExpand={toggleExpand}
          >
            <CharacterDetail character={c} />
          </BibleEntityItem>
        ))}
      </BibleSection>

      {/* 2. Relationships */}
      <BibleSection title="Relationships" count={relationships.length} defaultOpen={false}>
        {relationships.length === 0 && (
          <p className={styles.emptySection}>No relationships between linked characters</p>
        )}
        {relationships.map((r) => {
          const relId = `rel-${r.id}`;
          const source = charMap.get(r.sourceId);
          const target = charMap.get(r.targetId);
          const name = `${source?.name ?? '?'} \u2194 ${target?.name ?? '?'}`;
          return (
            <BibleEntityItem
              key={relId}
              id={relId}
              name={name}
              badge={r.type}
              isPinned={injectedIds.has(relId)}
              onPin={() => injectEntity(buildRelationshipContext(r, charMap))}
              onUnpin={() => removeInjectedEntity(relId)}
              expandedId={expandedId}
              onToggleExpand={toggleExpand}
            >
              <RelationshipDetail rel={r} characters={charMap} />
            </BibleEntityItem>
          );
        })}
      </BibleSection>

      {/* 3. Locations */}
      <BibleSection
        title={`Locations (${linkedLocCount} / ${locations.length})`}
        count={linkedLocCount}
      >
        {locations.length === 0 && <p className={styles.emptySection}>No locations available</p>}
        {locations.map((l) => (
          <BibleEntityItem
            key={l.id}
            id={l.id}
            name={l.name}
            {...(l.type ? { badge: l.type } : {})}
            isLinked={linkedLocIds.has(l.id)}
            onLink={() => handleLinkLocation(l.id)}
            onUnlink={() => handleUnlinkLocation(l.id)}
            isPinned={injectedIds.has(l.id)}
            onPin={() => injectEntity(buildLocationContext(l))}
            onUnpin={() => removeInjectedEntity(l.id)}
            expandedId={expandedId}
            onToggleExpand={toggleExpand}
          >
            <LocationDetail location={l} />
          </BibleEntityItem>
        ))}
      </BibleSection>

      {/* 4. Arc */}
      <BibleSection title="Arc" count={chapter.arcId ? 1 : 0} defaultOpen={false}>
        {(allArcs ?? []).length === 0 ? (
          <p className={styles.emptySection}>No arcs created</p>
        ) : (
          <div className={styles.arcSelector}>
            <label className={styles.arcLabel}>Assign chapter to arc:</label>
            <div className={styles.arcSelectRow}>
              <Select
                size="sm"
                value={chapter.arcId ?? ''}
                onChange={(e) => handleArcChange(e.target.value)}
                placeholder="-- No arc --"
                options={[
                  { value: '', label: '-- No arc --' },
                  ...(allArcs ?? []).map((a) => ({
                    value: a.id,
                    label: `${a.name} (${a.status})`,
                  })),
                ]}
              />
              {arc && (
                <button
                  className={`${styles.pinButton} ${injectedIds.has(arc.id) ? styles.pinned : ''}`}
                  onClick={() => {
                    if (injectedIds.has(arc.id)) {
                      removeInjectedEntity(arc.id);
                    } else {
                      injectEntity(buildArcContext(arc));
                    }
                  }}
                  title={
                    injectedIds.has(arc.id) ? 'Unpin from context' : 'Pin to AI context (temporary)'
                  }
                >
                  {injectedIds.has(arc.id) ? '\u2605' : '\u2606'}
                </button>
              )}
            </div>
            {arc && (
              <div className={styles.arcDetail}>
                <ArcDetail arc={arc} />
              </div>
            )}
          </div>
        )}
      </BibleSection>

      {/* 5. Foreshadowing */}
      <BibleSection
        title={`Foreshadowing (${linkedForeshadowingCount} / ${foreshadowing.length})`}
        count={linkedForeshadowingCount}
        defaultOpen={false}
      >
        {foreshadowing.length === 0 && (
          <p className={styles.emptySection}>No foreshadowing items available</p>
        )}
        {foreshadowing.map((f) => (
          <BibleEntityItem
            key={f.id}
            id={f.id}
            name={f.content.length > 50 ? f.content.slice(0, 50) + '...' : f.content}
            badge={f.status}
            badgeVariant={f.status === 'active' ? 'primary' : 'muted'}
            isLinked={linkedForeshadowingIds.has(f.id)}
            onLink={() => handleLinkForeshadowing(f.id)}
            onUnlink={() => handleUnlinkForeshadowing(f.id)}
            isPinned={injectedIds.has(f.id)}
            onPin={() => injectEntity(buildForeshadowingContext(f))}
            onUnpin={() => removeInjectedEntity(f.id)}
            expandedId={expandedId}
            onToggleExpand={toggleExpand}
          >
            <ForeshadowingDetail item={f} />
          </BibleEntityItem>
        ))}
      </BibleSection>

      {/* 6. Hooks */}
      <BibleSection title="Hooks" count={hooks.length} defaultOpen={false}>
        {hooks.length === 0 && <p className={styles.emptySection}>No hooks for this chapter</p>}
        {hooks.map((h) => (
          <BibleEntityItem
            key={h.id}
            id={h.id}
            name={h.content.length > 50 ? h.content.slice(0, 50) + '...' : h.content}
            {...(h.hookType ? { badge: h.hookType } : {})}
            isPinned={injectedIds.has(h.id)}
            onPin={() => injectEntity(buildHookContext(h))}
            onUnpin={() => removeInjectedEntity(h.id)}
            expandedId={expandedId}
            onToggleExpand={toggleExpand}
          >
            <HookDetail hook={h} />
          </BibleEntityItem>
        ))}
      </BibleSection>

      {/* 7. World */}
      <BibleSection title="World" count={hasWorld ? 1 : 0} defaultOpen={false}>
        {!hasWorld && <p className={styles.emptySection}>No world rules configured</p>}
        {world?.powerSystem?.coreRules && world.powerSystem.coreRules.length > 0 && (
          <div className={styles.worldBlock}>
            <span className={styles.worldLabel}>Power System: {world.powerSystem.name}</span>
            {world.powerSystem.levels && world.powerSystem.levels.length > 0 && (
              <span className={styles.worldDetail}>
                Levels: {world.powerSystem.levels.join(' \u2192 ')}
              </span>
            )}
            <span className={styles.worldDetail}>
              Rules: {world.powerSystem.coreRules.join('; ')}
            </span>
          </div>
        )}
        {world?.socialRules && Object.keys(world.socialRules).length > 0 && (
          <div className={styles.worldBlock}>
            <span className={styles.worldLabel}>Social Rules</span>
            {Object.entries(world.socialRules).map(([key, value]) => (
              <span key={key} className={styles.worldDetail}>
                {key}: {value}
              </span>
            ))}
          </div>
        )}
      </BibleSection>

      {/* 8. Factions */}
      <BibleSection title="Factions" count={factions.length} defaultOpen={false}>
        {factions.length === 0 && <p className={styles.emptySection}>No factions created</p>}
        {factions.map((f) => (
          <BibleEntityItem
            key={f.id}
            id={`faction-${f.id}`}
            name={f.name}
            {...(f.stanceToMC
              ? {
                  badge: f.stanceToMC,
                  badgeVariant:
                    f.stanceToMC === 'friendly'
                      ? ('success' as const)
                      : f.stanceToMC === 'hostile'
                        ? ('danger' as const)
                        : ('muted' as const),
                }
              : {})}
            isPinned={injectedIds.has(`faction-${f.id}`)}
            onPin={() => injectEntity(buildFactionContext(f))}
            onUnpin={() => removeInjectedEntity(`faction-${f.id}`)}
            expandedId={expandedId}
            onToggleExpand={toggleExpand}
          >
            <FactionDetail faction={f} />
          </BibleEntityItem>
        ))}
      </BibleSection>
    </div>
  );
}
