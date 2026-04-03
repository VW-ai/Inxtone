/**
 * MarkdownFormatter - Export chapters as Markdown
 *
 * Structure:
 *   # Export
 *   ## Table of Contents
 *   ---
 *   # Volume 1: [name]
 *   ## Chapter 1: [title]
 *   [content]
 */

import type { Chapter, Volume, ExportOptions, ExportResult } from '../../types/index.js';
import type { ChapterFormatter } from './types.js';
import { groupChaptersByVolume } from './types.js';

export class MarkdownFormatter implements ChapterFormatter {
  formatChapters(
    chapters: Chapter[],
    volumes: Volume[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const groups = groupChaptersByVolume(chapters, volumes);
    const lines: string[] = [];

    // Title
    lines.push('# Export');
    lines.push('');

    // Table of Contents
    if (chapters.length > 0) {
      lines.push('## Table of Contents');
      lines.push('');
      for (const group of groups) {
        if (group.volume) {
          lines.push(`- **${group.volume.name ?? `Volume ${group.volume.id}`}**`);
        } else {
          lines.push('- **Unassigned Chapters**');
        }
        for (const ch of group.chapters) {
          const title = ch.title ?? `Chapter ${ch.sortOrder}`;
          lines.push(`  - ${title}`);
        }
      }
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    // Content
    for (const group of groups) {
      // Volume heading
      if (group.volume) {
        lines.push(`# ${group.volume.name ?? `Volume ${group.volume.id}`}`);
        lines.push('');
      } else if (groups.length > 1) {
        lines.push('# Unassigned Chapters');
        lines.push('');
      }

      for (const ch of group.chapters) {
        const title = ch.title ?? `Chapter ${ch.sortOrder}`;
        lines.push(`## ${title}`);
        lines.push('');

        // Metadata
        if (options.includeMetadata) {
          const meta: string[] = [];
          meta.push(`Words: ${ch.wordCount}`);
          meta.push(`Status: ${ch.status}`);
          lines.push(`> ${meta.join(' | ')}`);
          lines.push('');
        }

        // Outline
        if (options.includeOutline && ch.outline) {
          if (ch.outline.goal) {
            lines.push(`> **Goal**: ${ch.outline.goal}`);
          }
          if (ch.outline.scenes && ch.outline.scenes.length > 0) {
            lines.push(`> **Scenes**: ${ch.outline.scenes.join(', ')}`);
          }
          if (ch.outline.hookEnding) {
            lines.push(`> **Hook**: ${ch.outline.hookEnding}`);
          }
          lines.push('');
        }

        // Content
        if (ch.content) {
          lines.push(ch.content);
        } else {
          lines.push('*(No content yet)*');
        }

        lines.push('');
        lines.push('---');
        lines.push('');
      }
    }

    // Handle empty export
    if (chapters.length === 0) {
      lines.push('*No chapters to export.*');
      lines.push('');
    }

    return Promise.resolve({
      data: lines.join('\n'),
      filename: 'export.md',
      mimeType: 'text/markdown',
    });
  }
}
