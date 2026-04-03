/**
 * Chapter Boundary Detection
 *
 * Detects chapter boundaries in raw text using regex patterns
 * for both Chinese and English chapter markers.
 */

import type { DetectedChapter } from './types.js';

// ===========================================
// Chapter Pattern Regexes
// ===========================================

/** Chinese number characters for chapter matching */
const CN_NUMS = '一二三四五六七八九十百千零壹贰叁肆伍陆柒捌玖拾佰仟';

/**
 * Chapter heading patterns, ordered by specificity.
 * Each pattern matches at the START of a line.
 */
const CHAPTER_PATTERNS: RegExp[] = [
  // Chinese patterns (\u3000 = ideographic space, \uff1a = fullwidth colon)
  new RegExp(`^第[${CN_NUMS}\\d]+章[\\s\uFF1A:\u3000]*(.*?)$`, 'm'), // 第一章 标题
  new RegExp(`^第[${CN_NUMS}\\d]+回[\\s\uFF1A:\u3000]*(.*?)$`, 'm'), // 第一回 标题
  new RegExp(`^第[${CN_NUMS}\\d]+节[\\s\uFF1A:\u3000]*(.*?)$`, 'm'), // 第一节 标题
  // English patterns
  /^Chapter\s+\d+[:\s]*(.*?)$/im, // Chapter 1: Title or Chapter 1 Title
  /^CHAPTER\s+\d+[:\s]*(.*?)$/m, // CHAPTER 1
  /^Part\s+\d+[:\s]*(.*?)$/im, // Part 1: Title
];

/**
 * Combined pattern that matches ANY chapter heading.
 * Used for splitting text into chapters.
 */
function buildCombinedPattern(): RegExp {
  const patterns = [
    `第[${CN_NUMS}\\d]+章[\\s\uFF1A:\u3000]*.*?`,
    `第[${CN_NUMS}\\d]+回[\\s\uFF1A:\u3000]*.*?`,
    `第[${CN_NUMS}\\d]+节[\\s\uFF1A:\u3000]*.*?`,
    `Chapter\\s+\\d+[:\\s]*.*?`,
    `CHAPTER\\s+\\d+[:\\s]*.*?`,
    `Part\\s+\\d+[:\\s]*.*?`,
  ];
  return new RegExp(`^(${patterns.join('|')})$`, 'gim');
}

// ===========================================
// Word Count Utility
// ===========================================

/** CJK Unicode range for word counting */
const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g;

/**
 * Count words in mixed CJK + English text.
 * CJK characters counted individually, English words by whitespace.
 */
function countWords(text: string): number {
  const cjkCount = (text.match(CJK_REGEX) ?? []).length;
  const nonCjkText = text.replace(CJK_REGEX, ' ');
  const wordCount = nonCjkText.split(/\s+/).filter((w) => w.length > 0).length;
  return cjkCount + wordCount;
}

// ===========================================
// Chapter Boundary Detection
// ===========================================

/**
 * Detect chapter boundaries in raw text.
 *
 * If no chapter markers are found, returns the entire text as a single chapter.
 *
 * @param text - Raw text content
 * @returns Array of detected chapters with titles, content, and word counts
 */
export function detectChapterBoundaries(text: string): DetectedChapter[] {
  if (!text.trim()) return [];

  const lines = text.split('\n');
  const pattern = buildCombinedPattern();

  // Find all chapter heading positions
  interface ChapterMark {
    lineIndex: number;
    title: string;
  }

  const marks: ChapterMark[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;

    // Reset regex lastIndex for each line
    pattern.lastIndex = 0;
    const match = pattern.exec(line);
    if (match) {
      // Extract title: everything after the chapter number marker
      let title = line;
      // Try to extract just the title part
      for (const p of CHAPTER_PATTERNS) {
        const titleMatch = p.exec(line);
        if (titleMatch) {
          title = titleMatch[1]?.trim() ?? line;
          break;
        }
      }
      marks.push({ lineIndex: i, title: title || line });
    }
  }

  // No chapter markers found → return entire text as single chapter
  if (marks.length === 0) {
    const content = text.trim();
    return [
      {
        title: 'Chapter 1',
        content,
        startLine: 1,
        endLine: lines.length,
        wordCount: countWords(content),
      },
    ];
  }

  // Build chapters from marks
  const chapters: DetectedChapter[] = [];

  // Content before first chapter marker (preamble) — include if substantial
  const firstMark = marks[0]!;
  if (firstMark.lineIndex > 0) {
    const preambleLines = lines.slice(0, firstMark.lineIndex);
    const preambleContent = preambleLines.join('\n').trim();
    if (preambleContent && countWords(preambleContent) > 50) {
      chapters.push({
        title: 'Preamble',
        content: preambleContent,
        startLine: 1,
        endLine: firstMark.lineIndex,
        wordCount: countWords(preambleContent),
      });
    }
  }

  // Process each chapter
  for (let i = 0; i < marks.length; i++) {
    const mark = marks[i]!;
    const nextMark = marks[i + 1];
    const start = mark.lineIndex;
    const end = nextMark ? nextMark.lineIndex : lines.length;

    // Chapter content = everything from the line AFTER the heading to the next heading
    const contentLines = lines.slice(start + 1, end);
    const content = contentLines.join('\n').trim();

    chapters.push({
      title: mark.title,
      content,
      startLine: start + 1, // 1-indexed
      endLine: end,
      wordCount: countWords(content),
    });
  }

  return chapters;
}

/**
 * Merge chapters that are too short (< minWords) into the previous chapter.
 * Useful for cleaning up false-positive chapter detections.
 *
 * @param chapters - Detected chapters
 * @param minWords - Minimum word count threshold (default: 200)
 * @returns Merged chapters
 */
export function mergeShortChapters(chapters: DetectedChapter[], minWords = 200): DetectedChapter[] {
  if (chapters.length <= 1) return chapters;

  const merged: DetectedChapter[] = [{ ...chapters[0]! }];

  for (let i = 1; i < chapters.length; i++) {
    const current = chapters[i]!;
    const prev = merged[merged.length - 1]!;

    if (current.wordCount < minWords) {
      // Merge into previous chapter
      prev.content = prev.content + '\n\n' + current.title + '\n' + current.content;
      prev.endLine = current.endLine;
      prev.wordCount = countWords(prev.content);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}
