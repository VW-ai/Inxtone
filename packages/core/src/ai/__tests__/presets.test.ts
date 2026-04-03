import { describe, it, expect } from 'vitest';
import { PROMPT_PRESETS, PRESET_CATEGORIES } from '../presets.js';
import type { PresetCategory } from '../presets.js';

describe('PROMPT_PRESETS', () => {
  it('should have unique IDs', () => {
    const ids = PROMPT_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have non-empty labels and instructions', () => {
    for (const preset of PROMPT_PRESETS) {
      expect(preset.label.trim().length).toBeGreaterThan(0);
      expect(preset.instruction.trim().length).toBeGreaterThan(0);
    }
  });

  it('should only reference valid categories', () => {
    const validCategories = Object.keys(PRESET_CATEGORIES) as PresetCategory[];
    for (const preset of PROMPT_PRESETS) {
      expect(validCategories).toContain(preset.category);
    }
  });

  it('should have at least one preset per category', () => {
    const categories = Object.keys(PRESET_CATEGORIES) as PresetCategory[];
    for (const cat of categories) {
      const count = PROMPT_PRESETS.filter((p) => p.category === cat).length;
      expect(count).toBeGreaterThan(0);
    }
  });

  it('should have reasonable instruction lengths', () => {
    for (const preset of PROMPT_PRESETS) {
      expect(preset.instruction.length).toBeGreaterThan(10);
      expect(preset.instruction.length).toBeLessThan(500);
    }
  });
});
