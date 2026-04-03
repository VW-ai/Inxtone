/**
 * LocationDetail — expanded detail view for a Location entity
 */

import React from 'react';
import type { Location } from '@inxtone/core';
import { DetailField } from './DetailField';
import styles from '../../StoryBiblePanel.module.css';

export function LocationDetail({ location }: { location: Location }): React.ReactElement {
  return (
    <div className={styles.detailGrid}>
      {location.type && <DetailField label="Type" value={location.type} />}
      {location.atmosphere && <DetailField label="Atmosphere" value={location.atmosphere} />}
      {location.significance && <DetailField label="Significance" value={location.significance} />}
    </div>
  );
}
