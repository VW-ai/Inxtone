/**
 * DOCX Reader
 *
 * Reads .docx files and extracts plain text content using mammoth.
 * The `docx` package (already a dependency) is for WRITING .docx (export).
 * `mammoth` is for READING .docx (import).
 */

import mammoth from 'mammoth';

/**
 * Extract plain text content from a .docx file buffer.
 *
 * @param buffer - File content as Buffer
 * @returns Plain text content
 */
export async function readDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
