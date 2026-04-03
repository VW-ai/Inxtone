/**
 * Schema Tests
 *
 * Verifies that the initial migration creates all expected tables
 * with the correct structure from 04_DATA_LAYER.md.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Database } from '../../db/Database.js';

describe('Database Schema', () => {
  let db: Database;

  beforeAll(async () => {
    db = new Database({
      path: ':memory:',
      migrate: true, // Run migrations
    });
    await db.connect();
  });

  afterAll(() => {
    if (db.isConnected) {
      db.close();
    }
  });

  // ============================================
  // Table Existence
  // ============================================

  describe('Table Existence', () => {
    const expectedTables = [
      'project',
      'characters',
      'relationships',
      'world',
      'locations',
      'factions',
      'timeline_events',
      'arcs',
      'foreshadowing',
      'hooks',
      'volumes',
      'chapters',
      'writing_goals',
      'writing_sessions',
      'versions',
      'check_results',
      'embeddings',
      'config',
      'schema_version',
    ];

    for (const table of expectedTables) {
      it(`should have ${table} table`, () => {
        expect(db.tableExists(table)).toBe(true);
      });
    }
  });

  // ============================================
  // Project Table
  // ============================================

  describe('project table', () => {
    it('should have correct columns', () => {
      const info = db.getTableInfo('project');
      const columns = info.map((c) => c.name);

      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('description');
      expect(columns).toContain('config');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
    });

    it('should allow insert and query', () => {
      db.run(
        'INSERT INTO project (id, name, description) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name',
        ['test', 'Test Project', 'A test project']
      );

      const project = db.queryOne<{ name: string }>('SELECT name FROM project WHERE id = ?', [
        'test',
      ]);

      expect(project?.name).toBe('Test Project');
    });
  });

  // ============================================
  // Characters Table
  // ============================================

  describe('characters table', () => {
    it('should have correct columns', () => {
      const info = db.getTableInfo('characters');
      const columns = info.map((c) => c.name);

      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('role');
      expect(columns).toContain('appearance');
      expect(columns).toContain('voice_samples');
      expect(columns).toContain('motivation');
      expect(columns).toContain('conflict_type');
      expect(columns).toContain('template');
      expect(columns).toContain('facets');
      expect(columns).toContain('arc');
      expect(columns).toContain('first_appearance');
    });

    it('should enforce role check constraint', () => {
      // Valid role
      db.run('INSERT INTO characters (id, name, role) VALUES (?, ?, ?)', ['C001', '林逸', 'main']);

      // Invalid role should fail
      expect(() => {
        db.run('INSERT INTO characters (id, name, role) VALUES (?, ?, ?)', [
          'C002',
          '张三',
          'invalid',
        ]);
      }).toThrow();
    });

    it('should store JSON fields', () => {
      const motivation = JSON.stringify({
        surface: '变强',
        hidden: '保护家人',
        core: '证明自己',
      });

      db.run(
        'INSERT INTO characters (id, name, motivation) VALUES (?, ?, json(?)) ON CONFLICT(id) DO UPDATE SET motivation = excluded.motivation',
        ['C003', '王五', motivation]
      );

      const row = db.queryOne<{ motivation: string }>(
        'SELECT motivation FROM characters WHERE id = ?',
        ['C003']
      );

      const parsed = JSON.parse(row?.motivation || '{}');
      expect(parsed.surface).toBe('变强');
    });
  });

  // ============================================
  // Relationships Table
  // ============================================

  describe('relationships table', () => {
    it('should have correct columns', () => {
      const info = db.getTableInfo('relationships');
      const columns = info.map((c) => c.name);

      expect(columns).toContain('id');
      expect(columns).toContain('source_id');
      expect(columns).toContain('target_id');
      expect(columns).toContain('type');
      expect(columns).toContain('join_reason');
      expect(columns).toContain('independent_goal');
    });

    it('should enforce unique source-target pairs', () => {
      // First insert
      db.run('INSERT INTO relationships (source_id, target_id, type) VALUES (?, ?, ?)', [
        'C001',
        'C003',
        'companion',
      ]);

      // Duplicate should fail
      expect(() => {
        db.run('INSERT INTO relationships (source_id, target_id, type) VALUES (?, ?, ?)', [
          'C001',
          'C003',
          'rival',
        ]);
      }).toThrow();
    });
  });

  // ============================================
  // Chapters Table
  // ============================================

  describe('chapters table', () => {
    it('should have correct columns', () => {
      const info = db.getTableInfo('chapters');
      const columns = info.map((c) => c.name);

      expect(columns).toContain('id');
      expect(columns).toContain('volume_id');
      expect(columns).toContain('arc_id');
      expect(columns).toContain('title');
      expect(columns).toContain('status');
      expect(columns).toContain('outline');
      expect(columns).toContain('content');
      expect(columns).toContain('word_count');
      expect(columns).toContain('characters');
      expect(columns).toContain('locations');
      expect(columns).toContain('emotion_curve');
      expect(columns).toContain('tension');
    });

    it('should enforce status check constraint', () => {
      // Valid status
      db.run('INSERT INTO chapters (id, title, status) VALUES (?, ?, ?)', [
        1,
        'Chapter 1',
        'draft',
      ]);

      // Invalid status should fail
      expect(() => {
        db.run('INSERT INTO chapters (id, title, status) VALUES (?, ?, ?)', [
          2,
          'Chapter 2',
          'invalid',
        ]);
      }).toThrow();
    });
  });

  // ============================================
  // Arcs Table
  // ============================================

  describe('arcs table', () => {
    it('should have correct columns', () => {
      const info = db.getTableInfo('arcs');
      const columns = info.map((c) => c.name);

      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('type');
      expect(columns).toContain('chapter_start');
      expect(columns).toContain('chapter_end');
      expect(columns).toContain('status');
      expect(columns).toContain('progress');
      expect(columns).toContain('sections');
      expect(columns).toContain('character_arcs');
    });

    it('should enforce type check constraint', () => {
      db.run('INSERT INTO arcs (id, name, type) VALUES (?, ?, ?)', ['ARC001', 'Main Arc', 'main']);

      expect(() => {
        db.run('INSERT INTO arcs (id, name, type) VALUES (?, ?, ?)', [
          'ARC002',
          'Bad Arc',
          'invalid',
        ]);
      }).toThrow();
    });
  });

  // ============================================
  // Foreshadowing Table
  // ============================================

  describe('foreshadowing table', () => {
    it('should have correct columns', () => {
      const info = db.getTableInfo('foreshadowing');
      const columns = info.map((c) => c.name);

      expect(columns).toContain('id');
      expect(columns).toContain('content');
      expect(columns).toContain('planted_chapter');
      expect(columns).toContain('planted_text');
      expect(columns).toContain('hints');
      expect(columns).toContain('planned_payoff');
      expect(columns).toContain('resolved_chapter');
      expect(columns).toContain('status');
      expect(columns).toContain('term');
    });

    it('should enforce status and term constraints', () => {
      db.run('INSERT INTO foreshadowing (id, content, status, term) VALUES (?, ?, ?, ?)', [
        'FS001',
        'A mysterious hint',
        'active',
        'short',
      ]);

      expect(() => {
        db.run('INSERT INTO foreshadowing (id, content, status, term) VALUES (?, ?, ?, ?)', [
          'FS002',
          'Bad',
          'invalid',
          'short',
        ]);
      }).toThrow();
    });
  });

  // ============================================
  // Writing Goals Table
  // ============================================

  describe('writing_goals table', () => {
    it('should have correct columns', () => {
      const info = db.getTableInfo('writing_goals');
      const columns = info.map((c) => c.name);

      expect(columns).toContain('id');
      expect(columns).toContain('type');
      expect(columns).toContain('target_words');
      expect(columns).toContain('date');
      expect(columns).toContain('chapter_id');
      expect(columns).toContain('volume_id');
      expect(columns).toContain('current_words');
      expect(columns).toContain('status');
    });

    it('should allow daily goals', () => {
      db.run('INSERT INTO writing_goals (type, target_words, date, status) VALUES (?, ?, ?, ?)', [
        'daily',
        2000,
        '2026-02-05',
        'active',
      ]);

      const goal = db.queryOne<{ target_words: number }>(
        'SELECT target_words FROM writing_goals WHERE date = ?',
        ['2026-02-05']
      );

      expect(goal?.target_words).toBe(2000);
    });
  });

  // ============================================
  // Versions Table
  // ============================================

  describe('versions table', () => {
    it('should have correct columns', () => {
      const info = db.getTableInfo('versions');
      const columns = info.map((c) => c.name);

      expect(columns).toContain('id');
      expect(columns).toContain('entity_type');
      expect(columns).toContain('entity_id');
      expect(columns).toContain('content');
      expect(columns).toContain('change_summary');
      expect(columns).toContain('source');
    });

    it('should store version snapshots', () => {
      const content = JSON.stringify({ title: 'Chapter 1', content: 'Some text...' });

      db.run(
        'INSERT INTO versions (entity_type, entity_id, content, change_summary) VALUES (?, ?, json(?), ?)',
        ['chapter', '1', content, 'Initial draft']
      );

      const versions = db.query<{ entity_type: string; change_summary: string }>(
        "SELECT entity_type, change_summary FROM versions WHERE entity_id = '1'"
      );

      expect(versions).toHaveLength(1);
      expect(versions[0]!.entity_type).toBe('chapter');
      expect(versions[0]!.change_summary).toBe('Initial draft');
    });
  });

  // ============================================
  // Check Results Table
  // ============================================

  describe('check_results table', () => {
    it('should have correct columns', () => {
      const info = db.getTableInfo('check_results');
      const columns = info.map((c) => c.name);

      expect(columns).toContain('id');
      expect(columns).toContain('chapter_id');
      expect(columns).toContain('check_type');
      expect(columns).toContain('status');
      expect(columns).toContain('violations');
      expect(columns).toContain('passed_rules');
      expect(columns).toContain('suggestions');
    });

    it('should store check results with JSON violations', () => {
      const violations = JSON.stringify([
        { rule: 'character.voice', severity: 'high', description: 'Voice mismatch' },
      ]);

      db.run(
        'INSERT INTO check_results (chapter_id, check_type, status, violations) VALUES (?, ?, ?, json(?))',
        [1, 'consistency', 'warning', violations]
      );

      const result = db.queryOne<{ violations: string }>(
        'SELECT violations FROM check_results WHERE chapter_id = ?',
        [1]
      );

      const parsed = JSON.parse(result?.violations || '[]');
      expect(parsed).toHaveLength(1);
      expect(parsed[0].rule).toBe('character.voice');
    });
  });

  // ============================================
  // FTS (Full Text Search)
  // ============================================

  describe('Full Text Search', () => {
    it('should have unified search_index virtual table', () => {
      const tables = db.query<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%search%'"
      );
      const tableNames = tables.map((t) => t.name);

      expect(tableNames).toContain('search_index');
    });

    it('should not have legacy FTS tables', () => {
      const tables = db.query<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_fts'"
      );
      expect(tables.length).toBe(0);
    });

    it('should index chapter content for search', () => {
      db.run('INSERT INTO chapters (id, title, content, status) VALUES (?, ?, ?, ?)', [
        100,
        'The Beginning',
        'Lin Yi stood on the mountain peak.',
        'draft',
      ]);

      // Search by title
      const results = db.query<{ entity_id: string; title: string }>(
        "SELECT entity_id, title FROM search_index WHERE entity_type = 'chapter' AND search_index MATCH 'Beginning'"
      );
      expect(results.length).toBeGreaterThan(0);

      // Search by content (body column)
      const contentResults = db.query<{ entity_id: string }>(
        "SELECT entity_id FROM search_index WHERE entity_type = 'chapter' AND search_index MATCH 'mountain'"
      );
      expect(contentResults.length).toBeGreaterThan(0);
    });

    it('should index character name and appearance for search', () => {
      db.run('INSERT INTO characters (id, name, role, appearance) VALUES (?, ?, ?, ?)', [
        'C100',
        '云天河',
        'main',
        '身穿青色道袍，面容俊朗',
      ]);

      // Search by name
      const resultsByName = db.query<{ entity_id: string }>(
        "SELECT entity_id FROM search_index WHERE entity_type = 'character' AND search_index MATCH '云天河'"
      );
      expect(resultsByName.length).toBeGreaterThan(0);

      // Search by appearance
      const resultsByAppearance = db.query<{ entity_id: string }>(
        "SELECT entity_id FROM search_index WHERE entity_type = 'character' AND search_index MATCH '身穿青色道袍'"
      );
      expect(resultsByAppearance.length).toBeGreaterThan(0);
    });

    it('should update search_index when character is updated', () => {
      db.run('INSERT INTO characters (id, name, role, appearance) VALUES (?, ?, ?, ?)', [
        'C101',
        '李青云',
        'supporting',
        '一袭白衣',
      ]);

      // Verify searchable
      let results = db.query<{ entity_id: string }>(
        "SELECT entity_id FROM search_index WHERE entity_type = 'character' AND search_index MATCH '李青云'"
      );
      expect(results.length).toBe(1);

      // Update the character name
      db.run('UPDATE characters SET name = ? WHERE id = ?', ['李青霄', 'C101']);

      // Old name should not be found
      results = db.query<{ entity_id: string }>(
        "SELECT entity_id FROM search_index WHERE entity_type = 'character' AND search_index MATCH '李青云'"
      );
      expect(results.length).toBe(0);

      // New name should be found
      results = db.query<{ entity_id: string }>(
        "SELECT entity_id FROM search_index WHERE entity_type = 'character' AND search_index MATCH '李青霄'"
      );
      expect(results.length).toBe(1);
    });

    it('should remove from search_index when character is deleted', () => {
      db.run('INSERT INTO characters (id, name, role) VALUES (?, ?, ?)', [
        'C102',
        '张无忌',
        'antagonist',
      ]);

      // Verify searchable
      let results = db.query<{ entity_id: string }>(
        "SELECT entity_id FROM search_index WHERE entity_type = 'character' AND search_index MATCH '张无忌'"
      );
      expect(results.length).toBe(1);

      // Delete the character
      db.run('DELETE FROM characters WHERE id = ?', ['C102']);

      // Should no longer be found
      results = db.query<{ entity_id: string }>(
        "SELECT entity_id FROM search_index WHERE entity_type = 'character' AND search_index MATCH '张无忌'"
      );
      expect(results.length).toBe(0);
    });

    it('should index locations, factions, arcs, foreshadowing', () => {
      db.run('INSERT INTO locations (id, name, significance, atmosphere) VALUES (?, ?, ?, ?)', [
        'L100',
        'Crystal Palace',
        'Ancient dragon lair',
        'Mystical and cold',
      ]);
      db.run('INSERT INTO factions (id, name, internal_conflict) VALUES (?, ?, ?)', [
        'F100',
        'Shadow Guild',
        'Power struggle between elders',
      ]);
      db.run('INSERT INTO arcs (id, name, type, status) VALUES (?, ?, ?, ?)', [
        'ARC100',
        'The Awakening',
        'main',
        'planned',
      ]);
      db.run('INSERT INTO foreshadowing (id, content, planted_text, status) VALUES (?, ?, ?, ?)', [
        'FS100',
        'Mysterious pendant glows',
        'The pendant hummed with power',
        'active',
      ]);

      // Search locations
      const locResults = db.query<{ entity_id: string }>(
        "SELECT entity_id FROM search_index WHERE entity_type = 'location' AND search_index MATCH 'Crystal'"
      );
      expect(locResults.length).toBe(1);

      // Search factions
      const facResults = db.query<{ entity_id: string }>(
        "SELECT entity_id FROM search_index WHERE entity_type = 'faction' AND search_index MATCH 'Shadow'"
      );
      expect(facResults.length).toBe(1);

      // Search arcs
      const arcResults = db.query<{ entity_id: string }>(
        "SELECT entity_id FROM search_index WHERE entity_type = 'arc' AND search_index MATCH 'Awakening'"
      );
      expect(arcResults.length).toBe(1);

      // Search foreshadowing
      const fsResults = db.query<{ entity_id: string }>(
        "SELECT entity_id FROM search_index WHERE entity_type = 'foreshadowing' AND search_index MATCH 'pendant'"
      );
      expect(fsResults.length).toBe(1);
    });
  });

  // ============================================
  // Indexes
  // ============================================

  describe('Indexes', () => {
    it('should have indexes for common queries', () => {
      const indexes = db.query<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
      );
      const indexNames = indexes.map((i) => i.name);

      // Check for expected indexes
      expect(indexNames).toContain('idx_characters_role');
      expect(indexNames).toContain('idx_chapters_volume');
      expect(indexNames).toContain('idx_chapters_status');
      expect(indexNames).toContain('idx_foreshadowing_status');
      expect(indexNames).toContain('idx_writing_goals_date');
      expect(indexNames).toContain('idx_versions_entity');
    });
  });

  // ============================================
  // Config Table
  // ============================================

  describe('config table', () => {
    it('should store key-value configuration', () => {
      const value = JSON.stringify({ theme: 'dark', fontSize: 14 });

      db.run('INSERT INTO config (key, value) VALUES (?, json(?))', ['ui', value]);

      const config = db.queryOne<{ value: string }>('SELECT value FROM config WHERE key = ?', [
        'ui',
      ]);

      const parsed = JSON.parse(config?.value || '{}');
      expect(parsed.theme).toBe('dark');
      expect(parsed.fontSize).toBe(14);
    });
  });
});
