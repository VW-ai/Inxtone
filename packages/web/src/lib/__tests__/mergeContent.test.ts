import { describe, it, expect } from 'vitest';
import { mergeContent } from '../mergeContent';

describe('mergeContent', () => {
  describe('append mode (no cursor position)', () => {
    it('appends with paragraph break', () => {
      expect(mergeContent('existing text', 'new text')).toBe('existing text\n\nnew text');
    });

    it('handles empty current content', () => {
      expect(mergeContent('', 'new text')).toBe('new text');
    });

    it('works with null cursor position', () => {
      expect(mergeContent('existing', 'new', null)).toBe('existing\n\nnew');
    });

    it('works with cursor at end (>= content length)', () => {
      expect(mergeContent('abc', 'new', 3)).toBe('abc\n\nnew');
    });
  });

  describe('insert mode (with cursor position)', () => {
    it('inserts at cursor with paragraph breaks', () => {
      const result = mergeContent('before after', 'middle', 7);
      expect(result).toBe('before \n\nmiddle\n\nafter');
    });

    it('reuses existing newlines at join points', () => {
      const result = mergeContent('before\n\nafter', 'middle', 8);
      expect(result).toBe('before\n\nmiddle\n\nafter');
    });

    it('adds one newline when text already has one', () => {
      const result = mergeContent('before\nafter', 'middle', 7);
      expect(result).toBe('before\n\nmiddle\n\nafter');
    });

    it('inserts at beginning', () => {
      expect(mergeContent('existing', 'prefix', 0)).toBe('prefix\n\nexisting');
    });
  });
});
