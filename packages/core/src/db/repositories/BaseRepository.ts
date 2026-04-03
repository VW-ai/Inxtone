/**
 * BaseRepository - Abstract base class for all repositories
 *
 * Provides common functionality for CRUD operations on SQLite.
 */

import type { ZodType } from 'zod';
import type { Database } from '../Database.js';
import type { ISODateTime } from '../../types/entities.js';

/**
 * Abstract base repository providing common database operations.
 *
 * @typeParam T - Entity type
 * @typeParam ID - Entity ID type (string for prefixed IDs, number for auto-increment)
 */
export abstract class BaseRepository<_T, ID> {
  constructor(
    protected db: Database,
    protected tableName: string
  ) {}

  /**
   * Get current ISO datetime string.
   */
  protected now(): ISODateTime {
    return new Date().toISOString();
  }

  /**
   * Generate a prefixed ID (e.g., C001, L001, F001).
   *
   * @param prefix - ID prefix (e.g., 'C', 'L', 'F')
   * @param padLength - Number of digits to pad (default: 3)
   * @returns Generated ID string
   */
  protected generatePrefixedId(prefix: string, padLength = 3): string {
    const result = this.db.queryOne<{ maxNum: number | null }>(
      `SELECT MAX(CAST(SUBSTR(id, ${prefix.length + 1}) AS INTEGER)) as maxNum FROM ${this.tableName}`
    );
    const nextNum = (result?.maxNum ?? 0) + 1;
    return `${prefix}${String(nextNum).padStart(padLength, '0')}`;
  }

  /**
   * Parse JSON field safely with optional Zod schema validation.
   *
   * @param value - JSON string or null
   * @param schema - Optional Zod schema for runtime validation
   * @returns Parsed value or undefined
   */
  protected parseJson<R>(value: string | null | undefined, schema?: ZodType<R>): R | undefined {
    if (!value) return undefined;
    try {
      const parsed: unknown = JSON.parse(value);
      if (schema) {
        const result = schema.safeParse(parsed);
        if (result.success) return result.data;
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[parseJson] Schema validation failed for ${this.tableName}:`,
            result.error.issues
          );
        }
        return undefined;
      }
      return parsed as R;
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[parseJson] JSON parse failed for ${this.tableName}:`,
          err instanceof Error ? err.message : err
        );
      }
      return undefined;
    }
  }

  /**
   * Stringify value for JSON storage.
   *
   * @param value - Value to stringify
   * @returns JSON string or null
   */
  protected toJson<R>(value: R | undefined): string | null {
    if (value === undefined || value === null) return null;
    return JSON.stringify(value);
  }

  /**
   * Count all records in the table.
   */
  count(): number {
    const result = this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName}`
    );
    return result?.count ?? 0;
  }

  /**
   * Check if a record exists by ID.
   */
  exists(id: ID): boolean {
    const result = this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE id = ?`,
      [id as unknown]
    );
    return (result?.count ?? 0) > 0;
  }

  /**
   * Delete a record by ID.
   * Returns true if a record was deleted.
   */
  delete(id: ID): boolean {
    const result = this.db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id as unknown]);
    return result.changes > 0;
  }
}
