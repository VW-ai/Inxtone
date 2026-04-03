/**
 * ExtractionReview — review AI-extracted entities after accept
 *
 * Shows at the top of the Bible panel when pendingExtraction is not null.
 * Actions: Link existing, Create & Link new, Dismiss individual, Dismiss all.
 */

import React from 'react';
import { Badge } from '../../components/ui';
import {
  usePendingExtraction,
  useSelectedChapterId,
  useEditorActions,
} from '../../stores/useEditorStore';
import { useUpdateChapter, useChapterWithContent } from '../../hooks';
import { useCreateCharacter, useCreateLocation } from '../../hooks';
import type { ExtractedEntity, UpdateChapterInput } from '@inxtone/core';
import styles from './ExtractionReview.module.css';

export function ExtractionReview(): React.ReactElement | null {
  const pendingExtraction = usePendingExtraction();
  const chapterId = useSelectedChapterId();
  const { data: chapter } = useChapterWithContent(chapterId);
  const { setPendingExtraction } = useEditorActions();
  const updateChapter = useUpdateChapter();
  const createCharacter = useCreateCharacter();
  const createLocation = useCreateLocation();

  if (!pendingExtraction || !chapterId || !chapter) return null;

  const allEntities = [
    ...pendingExtraction.characters.map((e) => ({ ...e, entityType: 'character' as const })),
    ...pendingExtraction.locations.map((e) => ({ ...e, entityType: 'location' as const })),
  ];

  if (allEntities.length === 0) return null;

  const handleLink = (entity: ExtractedEntity & { entityType: 'character' | 'location' }) => {
    if (!entity.existingId) return;
    const update: UpdateChapterInput = {};

    if (entity.entityType === 'character') {
      const current = chapter.characters ?? [];
      if (current.includes(entity.existingId)) return;
      update.characters = [...current, entity.existingId];
    } else {
      const current = chapter.locations ?? [];
      if (current.includes(entity.existingId)) return;
      update.locations = [...current, entity.existingId];
    }

    updateChapter.mutate(
      { id: chapterId, data: update },
      {
        onSuccess: () => {
          removeEntity(entity);
        },
      }
    );
  };

  const handleCreate = (entity: ExtractedEntity & { entityType: 'character' | 'location' }) => {
    if (entity.entityType === 'character') {
      createCharacter.mutate(
        { name: entity.name, role: 'supporting' },
        {
          onSuccess: (newChar) => {
            const current = chapter.characters ?? [];
            updateChapter.mutate(
              {
                id: chapterId,
                data: { characters: [...current, newChar.id] },
              },
              {
                onSuccess: () => {
                  removeEntity(entity);
                },
              }
            );
          },
        }
      );
    } else {
      createLocation.mutate(
        { name: entity.name },
        {
          onSuccess: (newLoc) => {
            const current = chapter.locations ?? [];
            updateChapter.mutate(
              {
                id: chapterId,
                data: { locations: [...current, newLoc.id] },
              },
              {
                onSuccess: () => {
                  removeEntity(entity);
                },
              }
            );
          },
        }
      );
    }
  };

  const removeEntity = (entity: ExtractedEntity & { entityType: string }) => {
    if (!pendingExtraction) return;
    const updated = {
      characters: pendingExtraction.characters.filter(
        (e) => !(e.name === entity.name && entity.entityType === 'character')
      ),
      locations: pendingExtraction.locations.filter(
        (e) => !(e.name === entity.name && entity.entityType === 'location')
      ),
    };
    const remaining = updated.characters.length + updated.locations.length;
    setPendingExtraction(remaining > 0 ? updated : null);
  };

  const handleDismissAll = () => {
    setPendingExtraction(null);
  };

  const handleLinkAll = () => {
    const charIds = pendingExtraction.characters
      .filter((e) => e.existingId)
      .map((e) => e.existingId!);
    const locIds = pendingExtraction.locations
      .filter((e) => e.existingId)
      .map((e) => e.existingId!);

    const update: UpdateChapterInput = {};
    if (charIds.length > 0) {
      const current = chapter.characters ?? [];
      const newIds = charIds.filter((id) => !current.includes(id));
      if (newIds.length > 0) update.characters = [...current, ...newIds];
    }
    if (locIds.length > 0) {
      const current = chapter.locations ?? [];
      const newIds = locIds.filter((id) => !current.includes(id));
      if (newIds.length > 0) update.locations = [...current, ...newIds];
    }

    if (update.characters || update.locations) {
      updateChapter.mutate(
        { id: chapterId, data: update },
        {
          onSuccess: () => {
            // Keep only new entities that need manual creation
            const remaining = {
              characters: pendingExtraction.characters.filter((e) => e.isNew),
              locations: pendingExtraction.locations.filter((e) => e.isNew),
            };
            const count = remaining.characters.length + remaining.locations.length;
            setPendingExtraction(count > 0 ? remaining : null);
          },
        }
      );
    } else {
      // No existing entities to link, just clear the linked ones
      const remaining = {
        characters: pendingExtraction.characters.filter((e) => e.isNew),
        locations: pendingExtraction.locations.filter((e) => e.isNew),
      };
      const count = remaining.characters.length + remaining.locations.length;
      setPendingExtraction(count > 0 ? remaining : null);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Detected Entities</span>
        <Badge variant="primary">{allEntities.length}</Badge>
        <div className={styles.headerActions}>
          <button className={styles.batchBtn} onClick={handleLinkAll}>
            Link all
          </button>
          <button className={styles.batchBtn} onClick={handleDismissAll}>
            Dismiss
          </button>
        </div>
      </div>
      <div className={styles.list}>
        {allEntities.map((entity) => (
          <div key={`${entity.entityType}-${entity.name}`} className={styles.item}>
            <span className={styles.typeIcon}>
              {entity.entityType === 'character' ? '\u4eba' : '\u5730'}
            </span>
            <span className={styles.name}>{entity.name}</span>
            {entity.isNew ? (
              <Badge variant="warning">new</Badge>
            ) : (
              <Badge variant="success">match</Badge>
            )}
            <div className={styles.itemActions}>
              {entity.existingId && !entity.isNew && (
                <button className={styles.actionBtn} onClick={() => handleLink(entity)}>
                  Link
                </button>
              )}
              {entity.isNew && (
                <button className={styles.actionBtn} onClick={() => handleCreate(entity)}>
                  Create
                </button>
              )}
              <button className={styles.dismissBtn} onClick={() => removeEntity(entity)}>
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
