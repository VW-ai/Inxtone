/**
 * Shared types for export formatters
 */

import type { Chapter, Volume, ExportOptions, ExportResult } from '../../types/index.js';

/** Interface for chapter export formatters */
export interface ChapterFormatter {
  formatChapters(
    chapters: Chapter[],
    volumes: Volume[],
    options: ExportOptions
  ): Promise<ExportResult>;
}

/** Chapters grouped by volume for formatting */
export interface VolumeGroup {
  volume: Volume | null; // null = unassigned chapters
  chapters: Chapter[];
}

/**
 * Group chapters by their volumeId.
 * Chapters without a volumeId go into a group with volume = null (at the end).
 */
export function groupChaptersByVolume(chapters: Chapter[], volumes: Volume[]): VolumeGroup[] {
  const groups = new Map<number | null, Chapter[]>();

  for (const ch of chapters) {
    const key = ch.volumeId ?? null;
    const list = groups.get(key);
    if (list) {
      list.push(ch);
    } else {
      groups.set(key, [ch]);
    }
  }

  const result: VolumeGroup[] = [];

  // Volumes first, in order
  for (const v of volumes) {
    const chs = groups.get(v.id);
    if (chs && chs.length > 0) {
      result.push({ volume: v, chapters: chs });
    }
  }

  // Unassigned chapters at the end
  const unassigned = groups.get(null);
  if (unassigned && unassigned.length > 0) {
    result.push({ volume: null, chapters: unassigned });
  }

  return result;
}
