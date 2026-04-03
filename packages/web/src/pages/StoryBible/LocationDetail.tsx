/**
 * LocationDetail Component
 *
 * Detail panel with inline editing for location fields.
 */

import React from 'react';
import { Button, EditableField, LoadingSpinner } from '../../components/ui';
import { useLocation, useUpdateLocation } from '../../hooks';
import type { LocationId, CreateLocationInput } from '@inxtone/core';
import styles from './CharacterDetail.module.css';

export interface LocationDetailProps {
  locationId: LocationId;
  onDelete: (id: LocationId) => void;
}

const TYPE_OPTIONS = [
  { label: 'City', value: 'city' },
  { label: 'Wilderness', value: 'wilderness' },
  { label: 'Building', value: 'building' },
  { label: 'Realm', value: 'realm' },
  { label: 'Other', value: 'other' },
];

export function LocationDetail({ locationId, onDelete }: LocationDetailProps): React.ReactElement {
  const { data: location, isLoading } = useLocation(locationId);
  const updateLocation = useUpdateLocation();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading location..." />
      </div>
    );
  }

  if (!location) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Location not found</div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const save = (data: Record<string, any>) => {
    updateLocation.mutate({ id: location.id, data: data as Partial<CreateLocationInput> });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <EditableField
            value={location.name}
            onSave={(name) => save({ name })}
            heading
            placeholder="Location name..."
          />
          <EditableField
            value={location.type ?? ''}
            onSave={(type) => save({ type })}
            as="select"
            options={TYPE_OPTIONS}
          />
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Significance</h3>
          <EditableField
            value={location.significance ?? ''}
            onSave={(significance) => save({ significance })}
            as="textarea"
            placeholder="Why is this location important to the story?"
          />
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Atmosphere</h3>
          <EditableField
            value={location.atmosphere ?? ''}
            onSave={(atmosphere) => save({ atmosphere })}
            as="textarea"
            placeholder="Describe the mood, sounds, smells..."
          />
        </section>

        {/* Metadata */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Metadata</h3>
          <div className={styles.metadata}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Created</span>
              <span className={styles.metaValue}>
                {new Date(location.createdAt).toLocaleDateString()}
              </span>
            </div>
            {location.updatedAt !== location.createdAt && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Updated</span>
                <span className={styles.metaValue}>
                  {new Date(location.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button onClick={() => onDelete(location.id)} variant="danger" size="md">
          Delete Location
        </Button>
      </div>
    </div>
  );
}
