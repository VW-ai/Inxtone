/**
 * RelationshipRepository - Data access layer for character relationships
 *
 * Handles all database operations for the relationships table,
 * including Wayne Principles fields.
 */

import { BaseRepository } from './BaseRepository.js';
import type { Database } from '../Database.js';
import type { Relationship, RelationshipType, CharacterId } from '../../types/entities.js';
import type { CreateRelationshipInput } from '../../types/services.js';

/** Raw database row type */
interface RelationshipRow {
  id: number;
  source_id: string;
  target_id: string;
  type: string;
  join_reason: string | null;
  independent_goal: string | null;
  disagree_scenarios: string | null;
  leave_scenarios: string | null;
  mc_needs: string | null;
  evolution: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for Relationship entity operations.
 */
export class RelationshipRepository extends BaseRepository<Relationship, number> {
  constructor(db: Database) {
    super(db, 'relationships');
  }

  /**
   * Create a new relationship.
   */
  create(input: CreateRelationshipInput): Relationship {
    const now = this.now();

    const result = this.db.run(
      `INSERT INTO relationships (
        source_id, target_id, type,
        join_reason, independent_goal, disagree_scenarios,
        leave_scenarios, mc_needs,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.sourceId,
        input.targetId,
        input.type,
        input.joinReason ?? null,
        input.independentGoal ?? null,
        this.toJson(input.disagreeScenarios),
        this.toJson(input.leaveScenarios),
        input.mcNeeds ?? null,
        now,
        now,
      ]
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  /**
   * Find a relationship by ID.
   */
  findById(id: number): Relationship | null {
    const row = this.db.queryOne<RelationshipRow>(`SELECT * FROM relationships WHERE id = ?`, [id]);
    return row ? this.mapRow(row) : null;
  }

  /**
   * Get all relationships.
   */
  findAll(): Relationship[] {
    const rows = this.db.query<RelationshipRow>(
      `SELECT * FROM relationships ORDER BY created_at DESC`
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Get all relationships for a character (as source or target).
   */
  findByCharacter(characterId: CharacterId): Relationship[] {
    const rows = this.db.query<RelationshipRow>(
      `SELECT * FROM relationships
       WHERE source_id = ? OR target_id = ?
       ORDER BY created_at DESC`,
      [characterId, characterId]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Get relationships where the character is the source.
   */
  findBySource(characterId: CharacterId): Relationship[] {
    const rows = this.db.query<RelationshipRow>(
      `SELECT * FROM relationships WHERE source_id = ? ORDER BY created_at DESC`,
      [characterId]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Get relationships where the character is the target.
   */
  findByTarget(characterId: CharacterId): Relationship[] {
    const rows = this.db.query<RelationshipRow>(
      `SELECT * FROM relationships WHERE target_id = ? ORDER BY created_at DESC`,
      [characterId]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find relationship between two specific characters.
   */
  findBetween(sourceId: CharacterId, targetId: CharacterId): Relationship | null {
    const row = this.db.queryOne<RelationshipRow>(
      `SELECT * FROM relationships
       WHERE source_id = ? AND target_id = ?`,
      [sourceId, targetId]
    );
    return row ? this.mapRow(row) : null;
  }

  /**
   * Get relationships by type.
   */
  findByType(type: RelationshipType): Relationship[] {
    const rows = this.db.query<RelationshipRow>(
      `SELECT * FROM relationships WHERE type = ? ORDER BY created_at DESC`,
      [type]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Update a relationship.
   */
  update(id: number, input: Partial<CreateRelationshipInput>): Relationship {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Relationship ${id} not found`);
    }

    const now = this.now();

    // Build dynamic update
    const updates: string[] = ['updated_at = ?'];
    const params: unknown[] = [now];

    if (input.sourceId !== undefined) {
      updates.push('source_id = ?');
      params.push(input.sourceId);
    }
    if (input.targetId !== undefined) {
      updates.push('target_id = ?');
      params.push(input.targetId);
    }
    if (input.type !== undefined) {
      updates.push('type = ?');
      params.push(input.type);
    }
    if (input.joinReason !== undefined) {
      updates.push('join_reason = ?');
      params.push(input.joinReason);
    }
    if (input.independentGoal !== undefined) {
      updates.push('independent_goal = ?');
      params.push(input.independentGoal);
    }
    if (input.disagreeScenarios !== undefined) {
      updates.push('disagree_scenarios = ?');
      params.push(this.toJson(input.disagreeScenarios));
    }
    if (input.leaveScenarios !== undefined) {
      updates.push('leave_scenarios = ?');
      params.push(this.toJson(input.leaveScenarios));
    }
    if (input.mcNeeds !== undefined) {
      updates.push('mc_needs = ?');
      params.push(input.mcNeeds);
    }
    if (input.evolution !== undefined) {
      updates.push('evolution = ?');
      params.push(input.evolution);
    }

    params.push(id);

    this.db.run(`UPDATE relationships SET ${updates.join(', ')} WHERE id = ?`, params);

    return this.findById(id)!;
  }

  /**
   * Update evolution field for a relationship.
   */
  updateEvolution(id: number, evolution: string): Relationship {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Relationship ${id} not found`);
    }

    this.db.run(`UPDATE relationships SET evolution = ?, updated_at = ? WHERE id = ?`, [
      evolution,
      this.now(),
      id,
    ]);

    return this.findById(id)!;
  }

  /**
   * Delete all relationships for a character.
   * Used when deleting a character.
   */
  deleteByCharacter(characterId: CharacterId): number {
    const result = this.db.run(`DELETE FROM relationships WHERE source_id = ? OR target_id = ?`, [
      characterId,
      characterId,
    ]);
    return result.changes;
  }

  /**
   * Normalize independentGoal: legacy Chinese seed stored it as
   * json_object('source','…','target','…'). Convert to plain string.
   */
  private normalizeGoal(raw: string): string {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && ('source' in parsed || 'target' in parsed)) {
        const obj = parsed as Record<string, string>;
        return [obj.source, obj.target].filter(Boolean).join('；');
      }
    } catch {
      // not JSON — plain string, return as-is
    }
    return raw;
  }

  /**
   * Map database row to Relationship entity.
   */
  private mapRow(row: RelationshipRow): Relationship {
    const relationship: Relationship = {
      id: row.id,
      sourceId: row.source_id,
      targetId: row.target_id,
      type: row.type as RelationshipType,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    // Only add optional fields if they have values
    if (row.join_reason) relationship.joinReason = row.join_reason;
    if (row.independent_goal)
      relationship.independentGoal = this.normalizeGoal(row.independent_goal);
    if (row.mc_needs) relationship.mcNeeds = row.mc_needs;
    if (row.evolution) relationship.evolution = row.evolution;

    // Parse JSON fields with explicit null checks
    const disagreeScenarios = this.parseJson<string[]>(row.disagree_scenarios);
    if (disagreeScenarios) relationship.disagreeScenarios = disagreeScenarios;

    const leaveScenarios = this.parseJson<string[]>(row.leave_scenarios);
    if (leaveScenarios) relationship.leaveScenarios = leaveScenarios;

    return relationship;
  }
}
