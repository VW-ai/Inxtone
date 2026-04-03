/**
 * Migration 002: Add sort_order column to chapters table.
 *
 * Enables explicit chapter ordering instead of relying on id-based ordering.
 * Fixes issue #25: Chapter ordering is stub — affects prev-chapter context lookup.
 */

import type { Migration } from '../MigrationRunner.js';

export const migration002: Migration = {
  version: 2,
  description: 'Add sort_order column to chapters',
  up: `
    ALTER TABLE chapters ADD COLUMN sort_order INTEGER DEFAULT 0;
    UPDATE chapters SET sort_order = id;
    CREATE INDEX idx_chapters_sort_order ON chapters(volume_id, sort_order);
  `,
  down: `
    DROP INDEX IF EXISTS idx_chapters_sort_order;
    -- SQLite does not support DROP COLUMN before 3.35.0
    -- sort_order column will remain but be unused
  `,
};
