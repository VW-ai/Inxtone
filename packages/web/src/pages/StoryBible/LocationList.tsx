/**
 * LocationList Component
 *
 * Card grid with split layout: cards on left, detail/create panel on right.
 */

import React, { useState } from 'react';
import {
  Button,
  Card,
  EmptyState,
  Badge,
  EditableField,
  LoadingSpinner,
} from '../../components/ui';
import { useLocations, useCreateLocation, useDeleteLocation } from '../../hooks';
import { useSelectedId, useFormMode, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { LocationDetail } from './LocationDetail';
import type { LocationId } from '@inxtone/core';
import styles from './shared.module.css';
import cardStyles from './LocationList.module.css';
import layoutStyles from './CharacterList.module.css';
import detailStyles from './CharacterDetail.module.css';

const TYPE_OPTIONS = [
  { label: 'City', value: 'city' },
  { label: 'Wilderness', value: 'wilderness' },
  { label: 'Building', value: 'building' },
  { label: 'Realm', value: 'realm' },
  { label: 'Other', value: 'other' },
];

function LocationCreatePanel({
  onCreated,
}: {
  onCreated: (id: LocationId) => void;
}): React.ReactElement {
  const createLocation = useCreateLocation();
  const { closeForm } = useStoryBibleActions();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [significance, setSignificance] = useState('');
  const [atmosphere, setAtmosphere] = useState('');

  const canCreate = name.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    const input: { name: string; type?: string; significance?: string; atmosphere?: string } = {
      name: name.trim(),
    };
    if (type) input.type = type;
    if (significance.trim()) input.significance = significance.trim();
    if (atmosphere.trim()) input.atmosphere = atmosphere.trim();
    createLocation.mutate(input, {
      onSuccess: (loc) => onCreated(loc.id),
    });
  };

  return (
    <div className={detailStyles.container}>
      <div className={detailStyles.header}>
        <div className={detailStyles.headerTop}>
          <EditableField value={name} onSave={setName} heading placeholder="Location name..." />
          <EditableField value={type} onSave={setType} as="select" options={TYPE_OPTIONS} />
        </div>
      </div>
      <div className={detailStyles.content}>
        <section className={detailStyles.section}>
          <h3 className={detailStyles.sectionTitle}>Significance</h3>
          <EditableField
            value={significance}
            onSave={setSignificance}
            as="textarea"
            placeholder="Why is this location important?"
          />
        </section>
        <section className={detailStyles.section}>
          <h3 className={detailStyles.sectionTitle}>Atmosphere</h3>
          <EditableField
            value={atmosphere}
            onSave={setAtmosphere}
            as="textarea"
            placeholder="Describe the mood, sounds, smells..."
          />
        </section>
      </div>
      <div className={detailStyles.actions}>
        <Button variant="ghost" size="md" onClick={closeForm}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleCreate}
          disabled={!canCreate || createLocation.isPending}
        >
          {createLocation.isPending ? 'Creating...' : 'Create Location'}
        </Button>
      </div>
    </div>
  );
}

export function LocationList(): React.ReactElement {
  const { data: locations, isLoading } = useLocations();
  const deleteLocation = useDeleteLocation();
  const selectedId = useSelectedId();
  const formMode = useFormMode();
  const { select, openForm } = useStoryBibleActions();

  if (isLoading) {
    return <LoadingSpinner text="Loading locations..." />;
  }

  const handleCreate = () => {
    openForm('create');
  };

  const handleSelect = (id: LocationId) => {
    select(id);
  };

  const handleDelete = (id: LocationId) => {
    deleteLocation.mutate(id);
    if (selectedId === id) {
      select(null);
    }
  };

  const handleCreated = (id: LocationId) => {
    select(id);
  };

  if (!locations || locations.length === 0) {
    return (
      <div className={layoutStyles.layout}>
        <div className={layoutStyles.listPanel}>
          <EmptyState
            title="No locations yet"
            description="Add locations to build your story's geography."
            action={{ label: 'Add Location', onClick: handleCreate }}
          />
        </div>
        {formMode === 'create' && (
          <div className={layoutStyles.detailPanel}>
            <LocationCreatePanel onCreated={handleCreated} />
          </div>
        )}
      </div>
    );
  }

  const showDetail = selectedId && formMode !== 'create';
  const showCreate = formMode === 'create';

  return (
    <div className={layoutStyles.layout}>
      <div className={layoutStyles.listPanel}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Locations ({locations.length})</h2>
          <Button onClick={handleCreate}>+ Add Location</Button>
        </div>

        <div className={`${styles.grid} ${styles.grid2}`}>
          {locations.map((loc) => (
            <Card
              key={loc.id}
              onClick={() => handleSelect(loc.id)}
              selected={selectedId === loc.id}
            >
              <div className={cardStyles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={cardStyles.cardName}>{loc.name}</h3>
                  {loc.type && <Badge variant="default">{loc.type}</Badge>}
                </div>
                {loc.significance && <p className={cardStyles.significance}>{loc.significance}</p>}
                {loc.atmosphere && <p className={cardStyles.atmosphere}>{loc.atmosphere}</p>}
                <div className={styles.cardActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(loc.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {showCreate && (
        <div className={layoutStyles.detailPanel}>
          <LocationCreatePanel onCreated={handleCreated} />
        </div>
      )}
      {showDetail && (
        <div className={layoutStyles.detailPanel}>
          <LocationDetail locationId={selectedId as LocationId} onDelete={handleDelete} />
        </div>
      )}
    </div>
  );
}
