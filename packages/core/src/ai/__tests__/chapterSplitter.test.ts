/**
 * Chapter Splitter Tests
 *
 * Tests chapter boundary detection for Chinese and English patterns,
 * preamble handling, edge cases, and mergeShortChapters.
 */

import { describe, it, expect } from 'vitest';
import { detectChapterBoundaries, mergeShortChapters } from '../intake/chapterSplitter.js';

describe('detectChapterBoundaries', () => {
  it('detects Chinese 第N章 pattern', () => {
    const text = [
      '第一章 初入江湖',
      '少年林墨站在山门前。',
      '',
      '第二章 拜师',
      '老道士看了他一眼。',
    ].join('\n');

    const chapters = detectChapterBoundaries(text);
    expect(chapters).toHaveLength(2);
    expect(chapters[0]!.title).toBe('初入江湖');
    expect(chapters[0]!.content).toContain('少年林墨');
    expect(chapters[1]!.title).toBe('拜师');
    expect(chapters[1]!.content).toContain('老道士');
  });

  it('detects Chinese 第N章 with numeric digits', () => {
    const text = ['第1章 开端', '这是第一章的内容。', '', '第2章 发展', '这是第二章的内容。'].join(
      '\n'
    );

    const chapters = detectChapterBoundaries(text);
    expect(chapters).toHaveLength(2);
    expect(chapters[0]!.title).toBe('开端');
    expect(chapters[1]!.title).toBe('发展');
  });

  it('detects Chinese 第N回 (classical) pattern', () => {
    const text = [
      '第一回 风起云涌',
      '话说天下大势。',
      '',
      '第二回 英雄出少年',
      '少年英雄出世。',
    ].join('\n');

    const chapters = detectChapterBoundaries(text);
    expect(chapters).toHaveLength(2);
    expect(chapters[0]!.title).toBe('风起云涌');
  });

  it('detects English "Chapter N" pattern', () => {
    const text = [
      'Chapter 1: The Beginning',
      'It was a dark and stormy night.',
      '',
      'Chapter 2: The Journey',
      'They set out at dawn.',
    ].join('\n');

    const chapters = detectChapterBoundaries(text);
    expect(chapters).toHaveLength(2);
    expect(chapters[0]!.title).toBe('The Beginning');
    expect(chapters[1]!.title).toBe('The Journey');
  });

  it('detects "CHAPTER N" (all caps) pattern', () => {
    const text = [
      'CHAPTER 1 The Beginning',
      'Content one.',
      '',
      'CHAPTER 2 The End',
      'Content two.',
    ].join('\n');

    const chapters = detectChapterBoundaries(text);
    expect(chapters).toHaveLength(2);
  });

  it('returns single chapter when no markers found', () => {
    const text = 'This is just a block of text without any chapter markers.';

    const chapters = detectChapterBoundaries(text);
    expect(chapters).toHaveLength(1);
    expect(chapters[0]!.title).toBe('Chapter 1');
    expect(chapters[0]!.content).toBe(text);
  });

  it('returns empty array for empty text', () => {
    expect(detectChapterBoundaries('')).toHaveLength(0);
    expect(detectChapterBoundaries('   ')).toHaveLength(0);
  });

  it('includes preamble if substantial (>50 words)', () => {
    // Build a 60-word preamble
    const preamble = Array(60).fill('word').join(' ');
    const text = [preamble, '', '第一章 开始', '内容。'].join('\n');

    const chapters = detectChapterBoundaries(text);
    expect(chapters).toHaveLength(2);
    expect(chapters[0]!.title).toBe('Preamble');
    expect(chapters[1]!.title).toBe('开始');
  });

  it('skips short preamble (<=50 words)', () => {
    const text = ['Short intro.', '', '第一章 开始', '内容。'].join('\n');

    const chapters = detectChapterBoundaries(text);
    expect(chapters).toHaveLength(1);
    expect(chapters[0]!.title).toBe('开始');
  });

  it('counts CJK characters individually for word count', () => {
    const text = '第一章 开始\n' + '这是一个测试'.repeat(20); // 120 CJK chars

    const chapters = detectChapterBoundaries(text);
    expect(chapters[0]!.wordCount).toBeGreaterThan(50);
  });

  it('sets correct startLine and endLine (1-indexed)', () => {
    const text = [
      '第一章 开始', // line 1
      '内容一。', // line 2
      '', // line 3
      '第二章 继续', // line 4
      '内容二。', // line 5
    ].join('\n');

    const chapters = detectChapterBoundaries(text);
    // Ch1 heading at line index 0 → startLine = 1, endLine = 3 (next heading lineIndex)
    expect(chapters[0]!.startLine).toBe(1);
    expect(chapters[0]!.endLine).toBe(3);
    // Ch2 heading at line index 3 → startLine = 4, endLine = 5 (total lines)
    expect(chapters[1]!.startLine).toBe(4);
    expect(chapters[1]!.endLine).toBe(5);
  });

  it('handles mixed Chinese and English markers', () => {
    const text = [
      'Chapter 1: Prologue',
      'English content here.',
      '',
      '第二章 中文开始',
      '中文内容。',
    ].join('\n');

    const chapters = detectChapterBoundaries(text);
    expect(chapters).toHaveLength(2);
  });
});

describe('mergeShortChapters', () => {
  it('merges chapters below minWords into previous', () => {
    const chapters = [
      {
        title: 'Ch1',
        content: Array(300).fill('word').join(' '),
        startLine: 1,
        endLine: 10,
        wordCount: 300,
      },
      { title: 'Ch2', content: 'short', startLine: 11, endLine: 12, wordCount: 1 },
      {
        title: 'Ch3',
        content: Array(300).fill('word').join(' '),
        startLine: 13,
        endLine: 25,
        wordCount: 300,
      },
    ];

    const merged = mergeShortChapters(chapters, 200);
    expect(merged).toHaveLength(2);
    expect(merged[0]!.title).toBe('Ch1');
    expect(merged[0]!.content).toContain('short'); // Ch2 merged into Ch1
    expect(merged[0]!.endLine).toBe(12);
    expect(merged[1]!.title).toBe('Ch3');
  });

  it('returns unchanged when all chapters meet minWords', () => {
    const chapters = [
      {
        title: 'Ch1',
        content: Array(300).fill('word').join(' '),
        startLine: 1,
        endLine: 10,
        wordCount: 300,
      },
      {
        title: 'Ch2',
        content: Array(300).fill('word').join(' '),
        startLine: 11,
        endLine: 20,
        wordCount: 300,
      },
    ];

    const merged = mergeShortChapters(chapters, 200);
    expect(merged).toHaveLength(2);
  });

  it('returns single chapter unchanged', () => {
    const chapters = [{ title: 'Ch1', content: 'short', startLine: 1, endLine: 1, wordCount: 1 }];

    const merged = mergeShortChapters(chapters);
    expect(merged).toHaveLength(1);
  });

  it('returns empty array unchanged', () => {
    expect(mergeShortChapters([])).toHaveLength(0);
  });

  it('merges consecutive short chapters into one', () => {
    const chapters = [
      {
        title: 'Ch1',
        content: Array(300).fill('word').join(' '),
        startLine: 1,
        endLine: 10,
        wordCount: 300,
      },
      { title: 'Ch2', content: 'short2', startLine: 11, endLine: 12, wordCount: 1 },
      { title: 'Ch3', content: 'short3', startLine: 13, endLine: 14, wordCount: 1 },
    ];

    const merged = mergeShortChapters(chapters, 200);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.content).toContain('short2');
    expect(merged[0]!.content).toContain('short3');
  });
});
