/**
 * Migration 003: Unified FTS5 search_index table.
 *
 * Replaces the separate `chapters_fts` and `characters_fts` tables with a
 * single `search_index` table that spans 6 entity types (character, chapter,
 * location, faction, arc, foreshadowing).
 *
 * The `entity_type` and `entity_id` columns are UNINDEXED — stored for
 * filtering/joining but not included in full-text matching.
 */

import type { Migration } from '../MigrationRunner.js';

export const migration003: Migration = {
  version: 3,
  description: 'Unified FTS5 search_index replacing chapters_fts and characters_fts',
  up: `
-- ============================================
-- 1. Create unified search_index
-- ============================================

CREATE VIRTUAL TABLE search_index USING fts5(
    title,
    body,
    entity_type UNINDEXED,
    entity_id UNINDEXED,
    tokenize='unicode61'
);

-- ============================================
-- 2. Populate from existing data
-- ============================================

INSERT INTO search_index(title, body, entity_type, entity_id)
  SELECT name, COALESCE(appearance, ''), 'character', id FROM characters;

INSERT INTO search_index(title, body, entity_type, entity_id)
  SELECT COALESCE(title, ''), COALESCE(content, ''), 'chapter', CAST(id AS TEXT) FROM chapters;

INSERT INTO search_index(title, body, entity_type, entity_id)
  SELECT name, COALESCE(significance, '') || ' ' || COALESCE(atmosphere, ''), 'location', id FROM locations;

INSERT INTO search_index(title, body, entity_type, entity_id)
  SELECT name, COALESCE(internal_conflict, '') || ' ' || COALESCE(stance_to_mc, ''), 'faction', id FROM factions;

INSERT INTO search_index(title, body, entity_type, entity_id)
  SELECT name, COALESCE(type, ''), 'arc', id FROM arcs;

INSERT INTO search_index(title, body, entity_type, entity_id)
  SELECT content, COALESCE(planted_text, ''), 'foreshadowing', id FROM foreshadowing;

-- ============================================
-- 3. Drop old FTS triggers + tables
-- ============================================

DROP TRIGGER IF EXISTS characters_au;
DROP TRIGGER IF EXISTS characters_ad;
DROP TRIGGER IF EXISTS characters_ai;
DROP TRIGGER IF EXISTS chapters_au;
DROP TRIGGER IF EXISTS chapters_ad;
DROP TRIGGER IF EXISTS chapters_ai;
DROP TABLE IF EXISTS characters_fts;
DROP TABLE IF EXISTS chapters_fts;

-- ============================================
-- 4. Create new triggers — Characters
-- ============================================

CREATE TRIGGER search_characters_ai AFTER INSERT ON characters BEGIN
    INSERT INTO search_index(title, body, entity_type, entity_id)
    VALUES (new.name, COALESCE(new.appearance, ''), 'character', new.id);
END;

CREATE TRIGGER search_characters_ad AFTER DELETE ON characters BEGIN
    DELETE FROM search_index WHERE entity_type = 'character' AND entity_id = old.id;
END;

CREATE TRIGGER search_characters_au AFTER UPDATE ON characters BEGIN
    DELETE FROM search_index WHERE entity_type = 'character' AND entity_id = old.id;
    INSERT INTO search_index(title, body, entity_type, entity_id)
    VALUES (new.name, COALESCE(new.appearance, ''), 'character', new.id);
END;

-- ============================================
-- 5. Create new triggers — Chapters
-- ============================================

CREATE TRIGGER search_chapters_ai AFTER INSERT ON chapters BEGIN
    INSERT INTO search_index(title, body, entity_type, entity_id)
    VALUES (COALESCE(new.title, ''), COALESCE(new.content, ''), 'chapter', CAST(new.id AS TEXT));
END;

CREATE TRIGGER search_chapters_ad AFTER DELETE ON chapters BEGIN
    DELETE FROM search_index WHERE entity_type = 'chapter' AND entity_id = CAST(old.id AS TEXT);
END;

CREATE TRIGGER search_chapters_au AFTER UPDATE ON chapters BEGIN
    DELETE FROM search_index WHERE entity_type = 'chapter' AND entity_id = CAST(old.id AS TEXT);
    INSERT INTO search_index(title, body, entity_type, entity_id)
    VALUES (COALESCE(new.title, ''), COALESCE(new.content, ''), 'chapter', CAST(new.id AS TEXT));
END;

-- ============================================
-- 6. Create new triggers — Locations
-- ============================================

CREATE TRIGGER search_locations_ai AFTER INSERT ON locations BEGIN
    INSERT INTO search_index(title, body, entity_type, entity_id)
    VALUES (new.name, COALESCE(new.significance, '') || ' ' || COALESCE(new.atmosphere, ''), 'location', new.id);
END;

CREATE TRIGGER search_locations_ad AFTER DELETE ON locations BEGIN
    DELETE FROM search_index WHERE entity_type = 'location' AND entity_id = old.id;
END;

CREATE TRIGGER search_locations_au AFTER UPDATE ON locations BEGIN
    DELETE FROM search_index WHERE entity_type = 'location' AND entity_id = old.id;
    INSERT INTO search_index(title, body, entity_type, entity_id)
    VALUES (new.name, COALESCE(new.significance, '') || ' ' || COALESCE(new.atmosphere, ''), 'location', new.id);
END;

-- ============================================
-- 7. Create new triggers — Factions
-- ============================================

CREATE TRIGGER search_factions_ai AFTER INSERT ON factions BEGIN
    INSERT INTO search_index(title, body, entity_type, entity_id)
    VALUES (new.name, COALESCE(new.internal_conflict, '') || ' ' || COALESCE(new.stance_to_mc, ''), 'faction', new.id);
END;

CREATE TRIGGER search_factions_ad AFTER DELETE ON factions BEGIN
    DELETE FROM search_index WHERE entity_type = 'faction' AND entity_id = old.id;
END;

CREATE TRIGGER search_factions_au AFTER UPDATE ON factions BEGIN
    DELETE FROM search_index WHERE entity_type = 'faction' AND entity_id = old.id;
    INSERT INTO search_index(title, body, entity_type, entity_id)
    VALUES (new.name, COALESCE(new.internal_conflict, '') || ' ' || COALESCE(new.stance_to_mc, ''), 'faction', new.id);
END;

-- ============================================
-- 8. Create new triggers — Arcs
-- ============================================

CREATE TRIGGER search_arcs_ai AFTER INSERT ON arcs BEGIN
    INSERT INTO search_index(title, body, entity_type, entity_id)
    VALUES (new.name, COALESCE(new.type, ''), 'arc', new.id);
END;

CREATE TRIGGER search_arcs_ad AFTER DELETE ON arcs BEGIN
    DELETE FROM search_index WHERE entity_type = 'arc' AND entity_id = old.id;
END;

CREATE TRIGGER search_arcs_au AFTER UPDATE ON arcs BEGIN
    DELETE FROM search_index WHERE entity_type = 'arc' AND entity_id = old.id;
    INSERT INTO search_index(title, body, entity_type, entity_id)
    VALUES (new.name, COALESCE(new.type, ''), 'arc', new.id);
END;

-- ============================================
-- 9. Create new triggers — Foreshadowing
-- ============================================

CREATE TRIGGER search_foreshadowing_ai AFTER INSERT ON foreshadowing BEGIN
    INSERT INTO search_index(title, body, entity_type, entity_id)
    VALUES (new.content, COALESCE(new.planted_text, ''), 'foreshadowing', new.id);
END;

CREATE TRIGGER search_foreshadowing_ad AFTER DELETE ON foreshadowing BEGIN
    DELETE FROM search_index WHERE entity_type = 'foreshadowing' AND entity_id = old.id;
END;

CREATE TRIGGER search_foreshadowing_au AFTER UPDATE ON foreshadowing BEGIN
    DELETE FROM search_index WHERE entity_type = 'foreshadowing' AND entity_id = old.id;
    INSERT INTO search_index(title, body, entity_type, entity_id)
    VALUES (new.content, COALESCE(new.planted_text, ''), 'foreshadowing', new.id);
END;
  `.trim(),

  down: `
-- Drop all search_index triggers
DROP TRIGGER IF EXISTS search_foreshadowing_au;
DROP TRIGGER IF EXISTS search_foreshadowing_ad;
DROP TRIGGER IF EXISTS search_foreshadowing_ai;
DROP TRIGGER IF EXISTS search_arcs_au;
DROP TRIGGER IF EXISTS search_arcs_ad;
DROP TRIGGER IF EXISTS search_arcs_ai;
DROP TRIGGER IF EXISTS search_factions_au;
DROP TRIGGER IF EXISTS search_factions_ad;
DROP TRIGGER IF EXISTS search_factions_ai;
DROP TRIGGER IF EXISTS search_locations_au;
DROP TRIGGER IF EXISTS search_locations_ad;
DROP TRIGGER IF EXISTS search_locations_ai;
DROP TRIGGER IF EXISTS search_chapters_au;
DROP TRIGGER IF EXISTS search_chapters_ad;
DROP TRIGGER IF EXISTS search_chapters_ai;
DROP TRIGGER IF EXISTS search_characters_au;
DROP TRIGGER IF EXISTS search_characters_ad;
DROP TRIGGER IF EXISTS search_characters_ai;

-- Drop the unified search_index
DROP TABLE IF EXISTS search_index;

-- Restore old FTS tables and triggers
CREATE VIRTUAL TABLE IF NOT EXISTS chapters_fts USING fts5(
    content,
    title,
    content='chapters',
    content_rowid='id'
);

CREATE VIRTUAL TABLE IF NOT EXISTS characters_fts USING fts5(
    name,
    appearance,
    content='characters',
    content_rowid='rowid'
);

CREATE TRIGGER chapters_ai AFTER INSERT ON chapters BEGIN
    INSERT INTO chapters_fts(rowid, content, title)
    VALUES (new.id, new.content, new.title);
END;

CREATE TRIGGER chapters_ad AFTER DELETE ON chapters BEGIN
    INSERT INTO chapters_fts(chapters_fts, rowid, content, title)
    VALUES ('delete', old.id, old.content, old.title);
END;

CREATE TRIGGER chapters_au AFTER UPDATE ON chapters BEGIN
    INSERT INTO chapters_fts(chapters_fts, rowid, content, title)
    VALUES ('delete', old.id, old.content, old.title);
    INSERT INTO chapters_fts(rowid, content, title)
    VALUES (new.id, new.content, new.title);
END;

CREATE TRIGGER characters_ai AFTER INSERT ON characters BEGIN
    INSERT INTO characters_fts(rowid, name, appearance)
    VALUES (new.rowid, new.name, new.appearance);
END;

CREATE TRIGGER characters_ad AFTER DELETE ON characters BEGIN
    INSERT INTO characters_fts(characters_fts, rowid, name, appearance)
    VALUES ('delete', old.rowid, old.name, old.appearance);
END;

CREATE TRIGGER characters_au AFTER UPDATE ON characters BEGIN
    INSERT INTO characters_fts(characters_fts, rowid, name, appearance)
    VALUES ('delete', old.rowid, old.name, old.appearance);
    INSERT INTO characters_fts(rowid, name, appearance)
    VALUES (new.rowid, new.name, new.appearance);
END;

-- Rebuild old tables from source data
INSERT INTO chapters_fts(rowid, content, title)
  SELECT id, content, title FROM chapters;

INSERT INTO characters_fts(rowid, name, appearance)
  SELECT rowid, name, appearance FROM characters;
  `,
};
