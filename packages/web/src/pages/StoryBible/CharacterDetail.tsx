/**
 * CharacterDetail Component
 *
 * Displays full character information with inline editing.
 * Click any field to edit, saves on blur/Enter.
 */

import React from 'react';
import { Button, Badge, EditableField, EditableList, LoadingSpinner } from '../../components/ui';
import { useCharacter, useUpdateCharacter } from '../../hooks/useCharacters';
import type { CharacterId, UpdateCharacterInput } from '@inxtone/core';
import styles from './CharacterDetail.module.css';

/** Strip undefined values so exactOptionalPropertyTypes is satisfied */
function clean(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

export interface CharacterDetailProps {
  characterId: CharacterId;
  onDelete: (id: CharacterId) => void;
}

const ROLE_OPTIONS = [
  { label: 'Main', value: 'main' },
  { label: 'Supporting', value: 'supporting' },
  { label: 'Antagonist', value: 'antagonist' },
  { label: 'Mentioned', value: 'mentioned' },
];

const ARC_TYPE_OPTIONS = [
  { label: 'Positive', value: 'positive' },
  { label: 'Negative', value: 'negative' },
  { label: 'Flat', value: 'flat' },
  { label: 'Supporting', value: 'supporting' },
];

export function CharacterDetail({
  characterId,
  onDelete,
}: CharacterDetailProps): React.ReactElement {
  const { data: character, isLoading } = useCharacter(characterId);
  const updateCharacter = useUpdateCharacter();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading character..." />
      </div>
    );
  }

  if (!character) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Character not found</div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const save = (data: Record<string, any>) => {
    updateCharacter.mutate({ id: character.id, data: data as UpdateCharacterInput });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <EditableField
            value={character.name}
            onSave={(name) => save({ name })}
            heading
            placeholder="Character name..."
          />
          <EditableField
            value={character.role}
            onSave={(role) =>
              save({ role: role as 'main' | 'supporting' | 'antagonist' | 'mentioned' })
            }
            as="select"
            options={ROLE_OPTIONS}
          />
        </div>
        <div className={styles.meta}>
          <span className={styles.id}>{character.id}</span>
          {character.template && <Badge variant="default">{character.template}</Badge>}
          {character.conflictType && (
            <Badge variant="muted">{character.conflictType.replace(/_/g, ' ')}</Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Appearance */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Appearance</h3>
          <EditableField
            value={character.appearance ?? ''}
            onSave={(appearance) => save({ appearance })}
            as="textarea"
            placeholder="Describe appearance..."
          />
        </section>

        {/* Voice Samples */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Voice Samples</h3>
          <EditableList
            items={(character.voiceSamples ?? []).map((s) =>
              typeof s === 'string'
                ? s
                : `${(s as { character: string; text: string }).character}: ${(s as { character: string; text: string }).text}`
            )}
            onSave={(voiceSamples) => save({ voiceSamples })}
            addLabel="Add sample"
          />
        </section>

        {/* Motivation Layers */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Motivation Layers</h3>
          <div className={styles.layers}>
            <div className={styles.layer}>
              <EditableField
                label="Surface Goal"
                value={character.motivation?.surface ?? ''}
                onSave={(surface) =>
                  save({
                    motivation: clean({
                      surface,
                      hidden: character.motivation?.hidden,
                      core: character.motivation?.core,
                    }),
                  })
                }
                as="textarea"
                placeholder="What do they want on the surface?"
              />
            </div>
            <div className={styles.layer}>
              <EditableField
                label="Hidden Driver"
                value={character.motivation?.hidden ?? ''}
                onSave={(hidden) =>
                  save({
                    motivation: clean({
                      surface: character.motivation?.surface ?? '',
                      hidden,
                      core: character.motivation?.core,
                    }),
                  })
                }
                as="textarea"
                placeholder="What secretly drives them?"
              />
            </div>
            <div className={styles.layer}>
              <EditableField
                label="Core Need"
                value={character.motivation?.core ?? ''}
                onSave={(core) =>
                  save({
                    motivation: clean({
                      surface: character.motivation?.surface ?? '',
                      hidden: character.motivation?.hidden,
                      core,
                    }),
                  })
                }
                as="textarea"
                placeholder="What do they truly need?"
              />
            </div>
          </div>
        </section>

        {/* Facets */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Character Facets</h3>
          <div className={styles.facets}>
            <div className={styles.facet}>
              <EditableField
                label="Public Persona"
                value={character.facets?.public ?? ''}
                onSave={(pub) =>
                  save({
                    facets: clean({
                      public: pub,
                      private: character.facets?.private,
                      hidden: character.facets?.hidden,
                      underPressure: character.facets?.underPressure,
                    }),
                  })
                }
                as="textarea"
                placeholder="How they present to the world..."
              />
            </div>
            <div className={styles.facet}>
              <EditableField
                label="Private Self"
                value={character.facets?.private ?? ''}
                onSave={(priv) =>
                  save({
                    facets: clean({
                      public: character.facets?.public ?? '',
                      private: priv,
                      hidden: character.facets?.hidden,
                      underPressure: character.facets?.underPressure,
                    }),
                  })
                }
                as="textarea"
                placeholder="Who they are alone..."
              />
            </div>
            <div className={styles.facet}>
              <EditableField
                label="Hidden Aspects"
                value={character.facets?.hidden ?? ''}
                onSave={(hidden) =>
                  save({
                    facets: clean({
                      public: character.facets?.public ?? '',
                      private: character.facets?.private,
                      hidden,
                      underPressure: character.facets?.underPressure,
                    }),
                  })
                }
                as="textarea"
                placeholder="What they hide from everyone..."
              />
            </div>
            <div className={styles.facet}>
              <EditableField
                label="Under Pressure"
                value={character.facets?.underPressure ?? ''}
                onSave={(underPressure) =>
                  save({
                    facets: clean({
                      public: character.facets?.public ?? '',
                      private: character.facets?.private,
                      hidden: character.facets?.hidden,
                      underPressure,
                    }),
                  })
                }
                as="textarea"
                placeholder="How they react under stress..."
              />
            </div>
          </div>
        </section>

        {/* Character Arc */}
        {character.arc && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Character Arc</h3>
            <div className={styles.arc}>
              <div className={styles.arcHeader}>
                <EditableField
                  value={character.arc.type}
                  onSave={(type) =>
                    save({
                      arc: {
                        type: type as 'positive' | 'negative' | 'flat' | 'supporting',
                        startState: character.arc!.startState,
                        endState: character.arc!.endState,
                      },
                    })
                  }
                  as="select"
                  options={ARC_TYPE_OPTIONS}
                />
                <div className={styles.arcStates}>
                  <EditableField
                    value={character.arc.startState}
                    onSave={(startState) =>
                      save({
                        arc: {
                          type: character.arc!.type,
                          startState,
                          endState: character.arc!.endState,
                        },
                      })
                    }
                    placeholder="Start state..."
                  />
                  <span className={styles.arcArrow}>&rarr;</span>
                  <EditableField
                    value={character.arc.endState}
                    onSave={(endState) =>
                      save({
                        arc: {
                          type: character.arc!.type,
                          startState: character.arc!.startState,
                          endState,
                        },
                      })
                    }
                    placeholder="End state..."
                  />
                </div>
              </div>
              {character.arc.phases && character.arc.phases.length > 0 && (
                <div className={styles.phases}>
                  <h4 className={styles.phasesTitle}>Transformation Phases</h4>
                  <ul className={styles.phasesList}>
                    {character.arc.phases.map((phase, index) => (
                      <li key={index} className={styles.phase}>
                        <span className={styles.phaseChapter}>Chapter {phase.chapter}</span>
                        <span className={styles.phaseEvent}>{phase.event}</span>
                        <span className={styles.phaseChange}>&rarr; {phase.change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Metadata */}
        {character.firstAppearance && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Metadata</h3>
            <div className={styles.metadata}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>First Appearance</span>
                <span className={styles.metaValue}>Chapter {character.firstAppearance}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Created</span>
                <span className={styles.metaValue}>
                  {new Date(character.createdAt).toLocaleDateString()}
                </span>
              </div>
              {character.updatedAt !== character.createdAt && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Updated</span>
                  <span className={styles.metaValue}>
                    {new Date(character.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Actions — only Delete remains (edit is inline) */}
      <div className={styles.actions}>
        <Button onClick={() => onDelete(character.id)} variant="danger" size="md">
          Delete Character
        </Button>
      </div>
    </div>
  );
}
