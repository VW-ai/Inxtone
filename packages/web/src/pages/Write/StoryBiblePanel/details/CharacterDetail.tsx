/**
 * CharacterDetail — expanded detail view for a Character entity
 */

import React from 'react';
import type { Character } from '@inxtone/core';
import { DetailField } from './DetailField';
import styles from '../../StoryBiblePanel.module.css';

export function CharacterDetail({ character }: { character: Character }): React.ReactElement {
  return (
    <div className={styles.detailGrid}>
      {character.appearance && <DetailField label="Appearance" value={character.appearance} />}
      {character.motivation?.surface && (
        <DetailField label="Surface Motivation" value={character.motivation.surface} />
      )}
      {character.motivation?.hidden && (
        <DetailField label="Hidden Motivation" value={character.motivation.hidden} />
      )}
      {character.facets?.public && <DetailField label="Public" value={character.facets.public} />}
      {character.facets?.underPressure && (
        <DetailField label="Under Pressure" value={character.facets.underPressure} />
      )}
      {character.voiceSamples && character.voiceSamples.length > 0 && (
        <DetailField label="Voice" value={character.voiceSamples[0] ?? ''} />
      )}
    </div>
  );
}
