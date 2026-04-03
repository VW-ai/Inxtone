/**
 * FTS5 query sanitization utilities
 */

/**
 * Check if text contains CJK characters (Chinese, Japanese, Korean).
 */
function containsCJK(text: string): boolean {
  // Unicode ranges for CJK:
  // - CJK Unified Ideographs: 4E00-9FFF
  // - CJK Extension A: 3400-4DBF
  // - Hiragana: 3040-309F
  // - Katakana: 30A0-30FF
  // - Hangul: AC00-D7AF
  const cjkRegex = /[\u3400-\u4DBF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/;
  return cjkRegex.test(text);
}

/**
 * Sanitize query for FTS5 full-text search.
 *
 * Escapes special FTS5 operators and adds prefix matching for ASCII text.
 * For CJK text, uses phrase matching instead of prefix matching.
 *
 * @param query - User input query string
 * @returns Sanitized query suitable for FTS5 MATCH clause
 */
export function sanitizeFtsQuery(query: string): string {
  // Remove quotes and special FTS5 operators
  const sanitized = query
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[*^]/g, '') // Remove wildcard operators
    .trim();

  if (!sanitized) return '';

  // For single-word queries:
  // - ASCII: add prefix matching (e.g., "test" → "test*")
  // - CJK: use as-is for phrase matching (e.g., "墨" → "墨")
  if (!sanitized.includes(' ')) {
    if (containsCJK(sanitized)) {
      return sanitized; // CJK: phrase match
    } else {
      return `${sanitized}*`; // ASCII: prefix match
    }
  }

  // Multi-word queries: use as-is (FTS5 treats as AND of terms)
  return sanitized;
}
