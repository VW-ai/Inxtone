/**
 * TxtFormatter - Export chapters as plain text
 *
 * Structure:
 *   ========================================
 *   VOLUME 1: [name]
 *   ========================================
 *
 *   ----------------------------------------
 *   CHAPTER 1: [title]
 *   ----------------------------------------
 *   [content]
 */

import type { Chapter, Volume, ExportOptions, ExportResult } from '../../types/index.js';
import type { ChapterFormatter } from './types.js';
import { groupChaptersByVolume } from './types.js';

const VOLUME_SEP = '========================================';
const CHAPTER_SEP = '----------------------------------------';

export class TxtFormatter implements ChapterFormatter {
  formatChapters(
    chapters: Chapter[],
    volumes: Volume[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const groups = groupChaptersByVolume(chapters, volumes);
    const lines: string[] = [];

    for (const group of groups) {
      // Volume header
      if (group.volume) {
        lines.push(VOLUME_SEP);
        lines.push(group.volume.name ?? `VOLUME ${group.volume.id}`);
        lines.push(VOLUME_SEP);
        lines.push('');
      } else if (groups.length > 1) {
        lines.push(VOLUME_SEP);
        lines.push('UNASSIGNED CHAPTERS');
        lines.push(VOLUME_SEP);
        lines.push('');
      }

      for (const ch of group.chapters) {
        const title = ch.title ?? `Chapter ${ch.sortOrder}`;

        lines.push(CHAPTER_SEP);
        lines.push(title);
        lines.push(CHAPTER_SEP);
        lines.push('');

        // Metadata
        if (options.includeMetadata) {
          lines.push(`[Words: ${ch.wordCount} | Status: ${ch.status}]`);
          lines.push('');
        }

        // Outline
        if (options.includeOutline && ch.outline) {
          if (ch.outline.goal) {
            lines.push(`[Goal] ${ch.outline.goal}`);
          }
          if (ch.outline.scenes && ch.outline.scenes.length > 0) {
            lines.push(`[Scenes] ${ch.outline.scenes.join(', ')}`);
          }
          if (ch.outline.hookEnding) {
            lines.push(`[Hook] ${ch.outline.hookEnding}`);
          }
          lines.push('');
        }

        // Content
        if (ch.content) {
          lines.push(ch.content);
        } else {
          lines.push('(No content yet)');
        }

        lines.push('');
      }
    }

    // Handle empty export
    if (chapters.length === 0) {
      lines.push('No chapters to export.');
      lines.push('');
    }

    return Promise.resolve({
      data: lines.join('\n'),
      filename: 'export.txt',
      mimeType: 'text/plain',
    });
  }
}
