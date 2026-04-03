/**
 * WritingRepository - Data access layer for writing module
 *
 * Handles all database operations for volumes, chapters, content, and versions.
 * Implements M3 Phase 1 repository layer with manual save and version control.
 */

import { BaseRepository } from './BaseRepository.js';
import type { Database } from '../Database.js';
import type {
  Volume,
  VolumeId,
  VolumeStatus,
  Chapter,
  ChapterId,
  ChapterStatus,
  ChapterOutline,
  CharacterId,
  LocationId,
  ForeshadowingId,
  ArcId,
  Version,
  EmotionCurve,
  TensionLevel,
} from '../../types/entities.js';
import type {
  CreateChapterInput,
  CreateVolumeInput,
  UpdateChapterInput,
} from '../../types/services.js';

// ===================================
// Database Row Types
// ===================================

interface VolumeRow {
  id: number;
  name: string | null;
  theme: string | null;
  core_conflict: string | null;
  mc_growth: string | null;
  chapter_start: number | null;
  chapter_end: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ChapterRow {
  id: number;
  volume_id: number | null;
  arc_id: string | null;
  title: string | null;
  status: string;
  sort_order: number;
  outline: string | null;
  content: string | null;
  word_count: number;
  characters: string | null;
  locations: string | null;
  foreshadowing_planted: string | null;
  foreshadowing_hinted: string | null;
  foreshadowing_resolved: string | null;
  emotion_curve: string | null;
  tension: string | null;
  created_at: string;
  updated_at: string;
}

interface VersionRow {
  id: number;
  entity_type: string;
  entity_id: string;
  content: string;
  change_summary: string | null;
  source: string;
  created_at: string;
}

// ===================================
// WritingRepository Class
// ===================================

/**
 * Repository for Writing module operations:
 * - Volumes (卷): Grouping chapters by story phase
 * - Chapters (章节): Individual story segments
 * - Content (内容): Chapter text with word count tracking
 * - Versions (版本): Snapshots for version control
 */
export class WritingRepository extends BaseRepository<Chapter, ChapterId> {
  constructor(db: Database) {
    super(db, 'chapters');
  }

  // ===================================
  // Volume Methods (5 methods)
  // ===================================

  /**
   * Create a new volume.
   */
  createVolume(input: CreateVolumeInput): Volume {
    const now = this.now();

    const result = this.db.run(
      `INSERT INTO volumes (
        name, theme, core_conflict, mc_growth,
        chapter_start, chapter_end, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.name ?? null,
        input.theme ?? null,
        input.coreConflict ?? null,
        input.mcGrowth ?? null,
        input.chapterStart ?? null,
        input.chapterEnd ?? null,
        input.status,
        now,
        now,
      ]
    );

    return this.findVolumeById(result.lastInsertRowid as VolumeId)!;
  }

  /**
   * Find a volume by ID.
   */
  findVolumeById(id: VolumeId): Volume | null {
    const row = this.db.queryOne<VolumeRow>(`SELECT * FROM volumes WHERE id = ?`, [id]);
    return row ? this.mapVolumeRow(row) : null;
  }

  /**
   * Get all volumes.
   */
  findAllVolumes(): Volume[] {
    const rows = this.db.query<VolumeRow>(`SELECT * FROM volumes ORDER BY id ASC`);
    return rows.map((row) => this.mapVolumeRow(row));
  }

  /**
   * Update a volume.
   */
  updateVolume(id: VolumeId, input: Partial<Volume>): Volume {
    const now = this.now();

    // Build dynamic SQL for partial updates
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name ?? null);
    }
    if (input.theme !== undefined) {
      updates.push('theme = ?');
      values.push(input.theme ?? null);
    }
    if (input.coreConflict !== undefined) {
      updates.push('core_conflict = ?');
      values.push(input.coreConflict ?? null);
    }
    if (input.mcGrowth !== undefined) {
      updates.push('mc_growth = ?');
      values.push(input.mcGrowth ?? null);
    }
    if (input.chapterStart !== undefined) {
      updates.push('chapter_start = ?');
      values.push(input.chapterStart ?? null);
    }
    if (input.chapterEnd !== undefined) {
      updates.push('chapter_end = ?');
      values.push(input.chapterEnd ?? null);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    this.db.run(`UPDATE volumes SET ${updates.join(', ')} WHERE id = ?`, values);

    return this.findVolumeById(id)!;
  }

  /**
   * Delete a volume.
   * Returns true if deleted, false if not found.
   */
  deleteVolume(id: VolumeId): boolean {
    const result = this.db.run(`DELETE FROM volumes WHERE id = ?`, [id]);
    return result.changes > 0;
  }

  // ===================================
  // Chapter Methods (9 methods)
  // ===================================

  /**
   * Create a new chapter.
   */
  createChapter(input: CreateChapterInput): Chapter {
    const now = this.now();

    // Auto-assign sort_order: next max within volume (or globally)
    const maxRow = input.volumeId
      ? this.db.queryOne<{ max_sort: number | null }>(
          `SELECT MAX(sort_order) as max_sort FROM chapters WHERE volume_id = ?`,
          [input.volumeId]
        )
      : this.db.queryOne<{ max_sort: number | null }>(
          `SELECT MAX(sort_order) as max_sort FROM chapters`
        );
    const nextSortOrder = (maxRow?.max_sort ?? 0) + 1;

    const result = this.db.run(
      `INSERT INTO chapters (
        volume_id, arc_id, title, status, sort_order, outline,
        content, word_count,
        characters, locations,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.volumeId ?? null,
        input.arcId ?? null,
        input.title ?? null,
        input.status ?? 'outline', // Use input status or default to 'outline'
        nextSortOrder,
        this.toJson(input.outline),
        null, // No content on creation
        0, // Initial word count
        this.toJson(input.characters ?? []), // Use input characters or empty array
        this.toJson(input.locations ?? []), // Use input locations or empty array
        now,
        now,
      ]
    );

    return this.findChapterById(result.lastInsertRowid as ChapterId)!;
  }

  /**
   * Find a chapter by ID (WITHOUT content field for performance).
   */
  findChapterById(id: ChapterId): Chapter | null {
    const row = this.db.queryOne<ChapterRow>(
      `SELECT id, volume_id, arc_id, title, status, sort_order, outline,
              word_count, characters, locations,
              foreshadowing_planted, foreshadowing_hinted, foreshadowing_resolved,
              emotion_curve, tension, created_at, updated_at
       FROM chapters WHERE id = ?`,
      [id]
    );
    return row ? this.mapChapterRow(row, false) : null;
  }

  /**
   * Find a chapter by ID (WITH content field).
   */
  findChapterWithContent(id: ChapterId): Chapter | null {
    const row = this.db.queryOne<ChapterRow>(`SELECT * FROM chapters WHERE id = ?`, [id]);
    return row ? this.mapChapterRow(row, true) : null;
  }

  /**
   * Get all chapters (without content).
   */
  findAllChapters(): Chapter[] {
    const rows = this.db.query<ChapterRow>(
      `SELECT id, volume_id, arc_id, title, status, sort_order, outline,
              word_count, characters, locations,
              foreshadowing_planted, foreshadowing_hinted, foreshadowing_resolved,
              emotion_curve, tension, created_at, updated_at
       FROM chapters ORDER BY sort_order ASC, id ASC`
    );
    return rows.map((row) => this.mapChapterRow(row, false));
  }

  /**
   * Find chapters by volume ID.
   */
  findChaptersByVolume(volumeId: VolumeId): Chapter[] {
    const rows = this.db.query<ChapterRow>(
      `SELECT id, volume_id, arc_id, title, status, sort_order, outline,
              word_count, characters, locations,
              foreshadowing_planted, foreshadowing_hinted, foreshadowing_resolved,
              emotion_curve, tension, created_at, updated_at
       FROM chapters WHERE volume_id = ? ORDER BY sort_order ASC, id ASC`,
      [volumeId]
    );
    return rows.map((row) => this.mapChapterRow(row, false));
  }

  /**
   * Find chapters by arc ID.
   */
  findChaptersByArc(arcId: ArcId): Chapter[] {
    const rows = this.db.query<ChapterRow>(
      `SELECT id, volume_id, arc_id, title, status, sort_order, outline,
              word_count, characters, locations,
              foreshadowing_planted, foreshadowing_hinted, foreshadowing_resolved,
              emotion_curve, tension, created_at, updated_at
       FROM chapters WHERE arc_id = ? ORDER BY sort_order ASC, id ASC`,
      [arcId]
    );
    return rows.map((row) => this.mapChapterRow(row, false));
  }

  /**
   * Find chapters by status.
   */
  findChaptersByStatus(status: ChapterStatus): Chapter[] {
    const rows = this.db.query<ChapterRow>(
      `SELECT id, volume_id, arc_id, title, status, sort_order, outline,
              word_count, characters, locations,
              foreshadowing_planted, foreshadowing_hinted, foreshadowing_resolved,
              emotion_curve, tension, created_at, updated_at
       FROM chapters WHERE status = ? ORDER BY sort_order ASC, id ASC`,
      [status]
    );
    return rows.map((row) => this.mapChapterRow(row, false));
  }

  /**
   * Update a chapter.
   */
  updateChapter(id: ChapterId, input: UpdateChapterInput): Chapter {
    const now = this.now();

    // Build dynamic SQL for partial updates
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.volumeId !== undefined) {
      updates.push('volume_id = ?');
      values.push(input.volumeId ?? null);
    }
    if (input.arcId !== undefined) {
      updates.push('arc_id = ?');
      values.push(input.arcId ?? null);
    }
    if (input.title !== undefined) {
      updates.push('title = ?');
      values.push(input.title ?? null);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }
    if (input.outline !== undefined) {
      updates.push('outline = ?');
      values.push(this.toJson(input.outline));
    }
    if (input.characters !== undefined) {
      updates.push('characters = ?');
      values.push(this.toJson(input.characters));
    }
    if (input.locations !== undefined) {
      updates.push('locations = ?');
      values.push(this.toJson(input.locations));
    }
    if (input.foreshadowingPlanted !== undefined) {
      updates.push('foreshadowing_planted = ?');
      values.push(this.toJson(input.foreshadowingPlanted));
    }
    if (input.foreshadowingHinted !== undefined) {
      updates.push('foreshadowing_hinted = ?');
      values.push(this.toJson(input.foreshadowingHinted));
    }
    if (input.foreshadowingResolved !== undefined) {
      updates.push('foreshadowing_resolved = ?');
      values.push(this.toJson(input.foreshadowingResolved));
    }
    if (input.emotionCurve !== undefined) {
      updates.push('emotion_curve = ?');
      values.push(input.emotionCurve ?? null);
    }
    if (input.tension !== undefined) {
      updates.push('tension = ?');
      values.push(input.tension ?? null);
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    this.db.run(`UPDATE chapters SET ${updates.join(', ')} WHERE id = ?`, values);

    return this.findChapterById(id)!;
  }

  /**
   * Delete a chapter.
   * Returns true if deleted, false if not found.
   */
  deleteChapter(id: ChapterId): boolean {
    return this.delete(id);
  }

  /**
   * Reorder chapters by providing ordered chapter IDs.
   * Updates sort_order for each chapter based on array position.
   */
  reorderChapters(chapterIds: ChapterId[]): void {
    // Validate all chapters exist
    for (const id of chapterIds) {
      if (!this.exists(id)) {
        throw new Error(`Chapter ${id} not found`);
      }
    }

    const now = this.now();
    for (let i = 0; i < chapterIds.length; i++) {
      this.db.run(`UPDATE chapters SET sort_order = ?, updated_at = ? WHERE id = ?`, [
        i + 1,
        now,
        chapterIds[i]!,
      ]);
    }
  }

  // ===================================
  // Content Methods (3 methods)
  // ===================================

  /**
   * Save content to a chapter and update word count.
   */
  saveContent(chapterId: ChapterId, content: string): Chapter {
    const wordCount = this.calculateWordCount(content);
    const now = this.now();

    this.db.run(`UPDATE chapters SET content = ?, word_count = ?, updated_at = ? WHERE id = ?`, [
      content,
      wordCount,
      now,
      chapterId,
    ]);

    // Return chapter without content field for performance
    return this.findChapterById(chapterId)!;
  }

  /**
   * Get word count for a specific chapter.
   */
  getWordCount(chapterId: ChapterId): number {
    const result = this.db.queryOne<{ word_count: number }>(
      `SELECT word_count FROM chapters WHERE id = ?`,
      [chapterId]
    );
    return result?.word_count ?? 0;
  }

  /**
   * Get total word count across all chapters.
   */
  getTotalWordCount(): number {
    const result = this.db.queryOne<{ total: number }>(
      `SELECT SUM(word_count) as total FROM chapters`
    );
    return result?.total ?? 0;
  }

  // ===================================
  // Version Methods (5 methods)
  // ===================================

  /**
   * Create a new version snapshot.
   * Stores a full snapshot of the entity for version control.
   */
  createVersion(input: {
    entityType: 'chapter';
    entityId: string;
    content: unknown;
    changeSummary?: string;
    source: 'auto' | 'manual' | 'ai_backup' | 'rollback_backup';
  }): Version {
    const now = this.now();

    const result = this.db.run(
      `INSERT INTO versions (
        entity_type, entity_id, content, change_summary, source, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.entityType,
        input.entityId,
        this.toJson(input.content),
        input.changeSummary ?? null,
        input.source,
        now,
      ]
    );

    return this.findVersionById(result.lastInsertRowid as number)!;
  }

  /**
   * Find all versions for a chapter, ordered by creation time (newest first).
   */
  findVersionsByChapter(chapterId: ChapterId): Version[] {
    const rows = this.db.query<VersionRow>(
      `SELECT * FROM versions
       WHERE entity_type = 'chapter' AND entity_id = ?
       ORDER BY created_at DESC`,
      [String(chapterId)]
    );
    return rows.map((row) => this.mapVersionRow(row));
  }

  /**
   * Find a version by ID.
   */
  findVersionById(versionId: number): Version | null {
    const row = this.db.queryOne<VersionRow>(`SELECT * FROM versions WHERE id = ?`, [versionId]);
    return row ? this.mapVersionRow(row) : null;
  }

  /**
   * Delete a version.
   * Returns true if deleted, false if not found.
   */
  deleteVersion(versionId: number): boolean {
    const result = this.db.run(`DELETE FROM versions WHERE id = ?`, [versionId]);
    return result.changes > 0;
  }

  /**
   * Cleanup old versions with stratified retention.
   *
   * Strategy:
   * - Keep ALL versions within `olderThanDays` days (full history)
   * - For older versions: Keep only FIRST version per day (daily snapshots)
   *
   * This provides detailed recent history while keeping long-term storage manageable.
   *
   * @param olderThanDays - Number of days to keep full history (default: 7)
   * @param sourceFilter - Filter by source: 'auto' (default) only deletes auto versions, 'all' deletes all sources
   * @returns Number of versions deleted
   */
  cleanupOldVersions(olderThanDays: number, sourceFilter: 'auto' | 'all' = 'auto'): number {
    // Build dynamic SQL based on sourceFilter
    let sql = `DELETE FROM versions
       WHERE entity_type = 'chapter'
         AND created_at < datetime('now', '-' || ? || ' days')`;

    // Only cleanup 'auto' versions by default, preserve manual/ai_backup
    if (sourceFilter === 'auto') {
      sql += ` AND source = 'auto'`;
    }

    sql += ` AND id NOT IN (
           SELECT MIN(id)
           FROM versions
           WHERE entity_type = 'chapter'
             AND created_at < datetime('now', '-' || ? || ' days')`;

    if (sourceFilter === 'auto') {
      sql += ` AND source = 'auto'`;
    }

    sql += ` GROUP BY entity_id, date(created_at)
         )`;

    const result = this.db.run(sql, [olderThanDays, olderThanDays]);

    return result.changes;
  }

  // ===================================
  // FK Cleanup Methods (3 methods)
  // ===================================

  /**
   * Cleanup character references from chapters.
   * Removes the specified character ID from all chapter.characters arrays.
   *
   * @param characterId - Character ID to remove
   */
  cleanupCharacterReferences(characterId: CharacterId): void {
    const chapters = this.db.query<ChapterRow>(
      `SELECT id, characters FROM chapters WHERE characters LIKE ?`,
      [`%${characterId}%`]
    );

    for (const chapter of chapters) {
      const chars = this.parseJson<CharacterId[]>(chapter.characters) ?? [];
      const updated = chars.filter((c) => c !== characterId);

      this.db.run(`UPDATE chapters SET characters = ? WHERE id = ?`, [
        this.toJson(updated),
        chapter.id,
      ]);
    }
  }

  /**
   * Cleanup location references from chapters.
   * Removes the specified location ID from all chapter.locations arrays.
   *
   * @param locationId - Location ID to remove
   */
  cleanupLocationReferences(locationId: LocationId): void {
    const chapters = this.db.query<ChapterRow>(
      `SELECT id, locations FROM chapters WHERE locations LIKE ?`,
      [`%${locationId}%`]
    );

    for (const chapter of chapters) {
      const locs = this.parseJson<LocationId[]>(chapter.locations) ?? [];
      const updated = locs.filter((l) => l !== locationId);

      this.db.run(`UPDATE chapters SET locations = ? WHERE id = ?`, [
        this.toJson(updated),
        chapter.id,
      ]);
    }
  }

  /**
   * Cleanup foreshadowing references from chapters.
   * Removes the specified foreshadowing ID from all foreshadowing arrays
   * (planted, hinted, resolved).
   *
   * @param foreshadowingId - Foreshadowing ID to remove
   */
  cleanupForeshadowingReferences(foreshadowingId: ForeshadowingId): void {
    // Query chapters that might contain this foreshadowing ID in any array
    const chapters = this.db.query<ChapterRow>(
      `SELECT id, foreshadowing_planted, foreshadowing_hinted, foreshadowing_resolved
       FROM chapters
       WHERE foreshadowing_planted LIKE ?
          OR foreshadowing_hinted LIKE ?
          OR foreshadowing_resolved LIKE ?`,
      [`%${foreshadowingId}%`, `%${foreshadowingId}%`, `%${foreshadowingId}%`]
    );

    for (const chapter of chapters) {
      const planted = this.parseJson<ForeshadowingId[]>(chapter.foreshadowing_planted) ?? [];
      const hinted = this.parseJson<ForeshadowingId[]>(chapter.foreshadowing_hinted) ?? [];
      const resolved = this.parseJson<ForeshadowingId[]>(chapter.foreshadowing_resolved) ?? [];

      const updatedPlanted = planted.filter((f) => f !== foreshadowingId);
      const updatedHinted = hinted.filter((f) => f !== foreshadowingId);
      const updatedResolved = resolved.filter((f) => f !== foreshadowingId);

      this.db.run(
        `UPDATE chapters
         SET foreshadowing_planted = ?,
             foreshadowing_hinted = ?,
             foreshadowing_resolved = ?
         WHERE id = ?`,
        [
          this.toJson(updatedPlanted),
          this.toJson(updatedHinted),
          this.toJson(updatedResolved),
          chapter.id,
        ]
      );
    }
  }

  // ===================================
  // Private Helper Methods
  // ===================================

  /**
   * Map VolumeRow to Volume entity.
   * Uses conditional assignment to satisfy exactOptionalPropertyTypes.
   */
  private mapVolumeRow(row: VolumeRow): Volume {
    const volume: Volume = {
      id: row.id,
      status: row.status as VolumeStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    if (row.name !== null) volume.name = row.name;
    if (row.theme !== null) volume.theme = row.theme;
    if (row.core_conflict !== null) volume.coreConflict = row.core_conflict;
    if (row.mc_growth !== null) volume.mcGrowth = row.mc_growth;
    if (row.chapter_start !== null) volume.chapterStart = row.chapter_start;
    if (row.chapter_end !== null) volume.chapterEnd = row.chapter_end;

    return volume;
  }

  /**
   * Map ChapterRow to Chapter entity.
   * Uses conditional assignment to satisfy exactOptionalPropertyTypes.
   * @param row - Database row
   * @param includeContent - Whether to include content field (performance optimization)
   */
  private mapChapterRow(row: ChapterRow, includeContent: boolean): Chapter {
    const chapter: Chapter = {
      id: row.id,
      status: row.status as ChapterStatus,
      sortOrder: row.sort_order ?? 0,
      wordCount: row.word_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    if (row.volume_id !== null) chapter.volumeId = row.volume_id;
    if (row.arc_id !== null) chapter.arcId = row.arc_id;
    if (row.title !== null) chapter.title = row.title;

    const outline = this.parseJson<ChapterOutline>(row.outline);
    if (outline) chapter.outline = outline;

    const characters = this.parseJson<CharacterId[]>(row.characters);
    if (characters) chapter.characters = characters;

    const locations = this.parseJson<LocationId[]>(row.locations);
    if (locations) chapter.locations = locations;

    const foreshadowingPlanted = this.parseJson<ForeshadowingId[]>(row.foreshadowing_planted);
    if (foreshadowingPlanted) chapter.foreshadowingPlanted = foreshadowingPlanted;

    const foreshadowingHinted = this.parseJson<ForeshadowingId[]>(row.foreshadowing_hinted);
    if (foreshadowingHinted) chapter.foreshadowingHinted = foreshadowingHinted;

    const foreshadowingResolved = this.parseJson<ForeshadowingId[]>(row.foreshadowing_resolved);
    if (foreshadowingResolved) chapter.foreshadowingResolved = foreshadowingResolved;

    if (row.emotion_curve) chapter.emotionCurve = row.emotion_curve as EmotionCurve;
    if (row.tension) chapter.tension = row.tension as TensionLevel;

    if (includeContent && row.content !== null) {
      chapter.content = row.content;
    }

    return chapter;
  }

  /**
   * Map VersionRow to Version entity.
   * Uses conditional assignment to satisfy exactOptionalPropertyTypes.
   */
  private mapVersionRow(row: VersionRow): Version {
    const version: Version = {
      id: row.id,
      entityType: row.entity_type as 'chapter',
      entityId: row.entity_id,
      content: this.parseJson(row.content),
      source: row.source as Version['source'],
      createdAt: row.created_at,
    };

    if (row.change_summary !== null) version.changeSummary = row.change_summary;

    return version;
  }

  /**
   * Calculate word count for content.
   * Handles both English (word-based) and Chinese (character-based) counting.
   *
   * @param content - Text content
   * @returns Word count
   */
  private calculateWordCount(content: string): number {
    if (!content || content.trim().length === 0) {
      return 0;
    }

    // Remove excessive whitespace
    const normalized = content.trim().replace(/\s+/g, ' ');

    // Count Chinese characters (CJK Unified Ideographs)
    const chineseChars = normalized.match(/[\u4e00-\u9fa5]/g) ?? [];

    // Count English words (sequences of alphanumeric characters)
    const englishWords = normalized.match(/[a-zA-Z0-9]+/g)?.filter((word) => word.length > 0) ?? [];

    // Total = Chinese characters + English words
    return chineseChars.length + englishWords.length;
  }
}
