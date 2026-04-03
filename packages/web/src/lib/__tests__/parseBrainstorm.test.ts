import { describe, it, expect } from 'vitest';
import { parseBrainstorm } from '../parseBrainstorm';

describe('parseBrainstorm', () => {
  it('parses bold-title numbered format', () => {
    const text = `1. **The Hidden Letter**: A mysterious letter is discovered under the floorboards.
2. **A Rival Appears**: The antagonist's apprentice arrives in town.
3. **Broken Trust**: The protagonist discovers their mentor lied about the prophecy.`;

    const result = parseBrainstorm(text);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: 1,
      title: 'The Hidden Letter',
      body: 'A mysterious letter is discovered under the floorboards.',
    });
    expect(result[1].title).toBe('A Rival Appears');
    expect(result[2].title).toBe('Broken Trust');
  });

  it('parses plain numbered format with colon separator', () => {
    const text = `1. Hidden Letter: A mysterious letter is found.
2. Rival Appears: The antagonist shows up.`;

    const result = parseBrainstorm(text);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Hidden Letter');
    expect(result[0].body).toBe('A mysterious letter is found.');
  });

  it('parses plain numbered format with dash separator', () => {
    const text = `1. Hidden Letter - A mysterious letter is found.
2. Rival Appears - The antagonist shows up.`;

    const result = parseBrainstorm(text);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Hidden Letter');
    expect(result[0].body).toBe('A mysterious letter is found.');
  });

  it('handles multi-line body text', () => {
    const text = `1. **The Hidden Letter**: A mysterious letter is discovered.
   It contains a map to the ancient temple.
   The ink appears to be blood.
2. **A Rival Appears**: The antagonist arrives.`;

    const result = parseBrainstorm(text);
    expect(result).toHaveLength(2);
    expect(result[0].body).toContain('map to the ancient temple');
    expect(result[0].body).toContain('ink appears to be blood');
  });

  it('falls back to single card when no numbered items', () => {
    const text = 'This is just a freeform brainstorm response with no numbered items.';
    const result = parseBrainstorm(text);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Brainstorm Result');
    expect(result[0].body).toBe(text);
  });

  it('returns empty array for empty text', () => {
    expect(parseBrainstorm('')).toEqual([]);
    expect(parseBrainstorm('   ')).toEqual([]);
  });

  it('truncates long plain titles', () => {
    const longLine =
      '1. This is a very long title that exceeds sixty characters and should be truncated appropriately by the parser';
    const result = parseBrainstorm(longLine);
    expect(result).toHaveLength(1);
    expect(result[0].title.length).toBeLessThanOrEqual(60);
    expect(result[0].title).toContain('...');
  });

  it('parses bold-title with en-dash separator', () => {
    const text = `1. **The Hidden Letter**\u2013 A mysterious letter is found.
2. **A Rival Appears**\u2013 The antagonist shows up.`;

    const result = parseBrainstorm(text);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('The Hidden Letter');
    expect(result[0].body).toBe('A mysterious letter is found.');
  });

  it('parses mixed bold + plain formats', () => {
    const text = `1. **Bold Title**: Description one.
2. Plain Title: Description two.
3. **Another Bold** Description three.`;

    const result = parseBrainstorm(text);
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe('Bold Title');
    expect(result[1].title).toBe('Plain Title');
    expect(result[2].title).toBe('Another Bold');
    expect(result[2].body).toBe('Description three.');
  });

  it('parses bold-title without separator', () => {
    const text = `1. **Title Only**
2. **Another Title** with trailing text`;

    const result = parseBrainstorm(text);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Title Only');
    expect(result[0].body).toBe('');
    expect(result[1].title).toBe('Another Title');
    expect(result[1].body).toBe('with trailing text');
  });

  it('parses markdown heading format (### N.)', () => {
    const text = `### 1. The Vacuum of Silence
**Core Concept:** Elara creates a zone of absolute silence.
**Connection to Plot:** This reinforces the mentor's warning.
### 2. The Unbound Intervention
**Core Concept:** Maren breaks the silence with oral magic.
### 3. The Cryptic Distraction
**Core Concept:** Pip drops a forbidden volume.`;

    const result = parseBrainstorm(text);
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe('The Vacuum of Silence');
    expect(result[0].body).toContain('Core Concept');
    expect(result[0].body).toContain('Connection to Plot');
    expect(result[1].title).toBe('The Unbound Intervention');
    expect(result[2].title).toBe('The Cryptic Distraction');
  });

  it('parses ## N. heading format', () => {
    const text = `## 1. **Bold in Heading**: Description here.
## 2. **Another Heading**: More description.`;

    const result = parseBrainstorm(text);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Bold in Heading');
    expect(result[0].body).toBe('Description here.');
    expect(result[1].title).toBe('Another Heading');
  });
});
