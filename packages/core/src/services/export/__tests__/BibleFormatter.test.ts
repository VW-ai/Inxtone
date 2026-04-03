import { describe, it, expect } from 'vitest';
import { BibleFormatter } from '../BibleFormatter.js';
import type { BibleData } from '../BibleFormatter.js';

function emptyBible(): BibleData {
  return {
    characters: [],
    relationships: [],
    world: null,
    locations: [],
    factions: [],
    arcs: [],
    foreshadowing: [],
    hooks: [],
  };
}

const formatter = new BibleFormatter();

describe('BibleFormatter', () => {
  it('should produce Story Bible heading', () => {
    const result = formatter.format(emptyBible());
    expect(result.filename).toBe('story-bible.md');
    expect(result.mimeType).toBe('text/markdown');
    expect(result.data as string).toContain('# Story Bible');
  });

  it('should show empty state for empty Bible', () => {
    const result = formatter.format(emptyBible());
    expect(result.data as string).toContain('No Story Bible data yet');
  });

  it('should format characters section', () => {
    const data = emptyBible();
    data.characters = [
      {
        id: 'C001',
        name: 'Lin Mo',
        role: 'main',
        appearance: 'Tall with dark hair',
        motivation: { surface: 'Find the truth', hidden: 'Redemption', core: 'Love' },
        conflictType: 'ideal_vs_reality',
        template: 'seeker',
        voiceSamples: ['I will not yield.'],
        arc: { type: 'positive', startState: 'Lost', endState: 'Enlightened' },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const result = formatter.format(data);
    const text = result.data as string;
    expect(text).toContain('## Characters');
    expect(text).toContain('### Lin Mo (main)');
    expect(text).toContain('Tall with dark hair');
    expect(text).toContain('Find the truth');
    expect(text).toContain('Redemption');
    expect(text).toContain('Love');
    expect(text).toContain('I will not yield.');
    expect(text).toContain('positive');
  });

  it('should format relationships as table', () => {
    const data = emptyBible();
    data.relationships = [
      {
        id: 1,
        sourceId: 'C001',
        targetId: 'C002',
        type: 'mentor',
        joinReason: 'Shared quest',
        independentGoal: 'Self-improvement',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const result = formatter.format(data);
    const text = result.data as string;
    expect(text).toContain('## Relationships');
    expect(text).toContain('| C001 | C002 | mentor |');
    expect(text).toContain('Shared quest');
  });

  it('should format world section', () => {
    const data = emptyBible();
    data.world = {
      id: 'main',
      powerSystem: {
        name: 'Cultivation',
        levels: ['Mortal', 'Foundation', 'Core'],
        coreRules: ['Qi flows through meridians'],
        constraints: ['Cannot exceed realm'],
      },
      socialRules: { hierarchy: 'Strength determines rank' },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    const result = formatter.format(data);
    const text = result.data as string;
    expect(text).toContain('## World');
    expect(text).toContain('Cultivation');
    expect(text).toContain('Mortal');
    expect(text).toContain('Qi flows through meridians');
    expect(text).toContain('hierarchy');
  });

  it('should format locations', () => {
    const data = emptyBible();
    data.locations = [
      {
        id: 'L001',
        name: 'Azure Peak',
        type: 'mountain',
        atmosphere: 'Misty and serene',
        significance: 'Training ground',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const result = formatter.format(data);
    const text = result.data as string;
    expect(text).toContain('## Locations');
    expect(text).toContain('Azure Peak');
    expect(text).toContain('Misty and serene');
  });

  it('should format factions', () => {
    const data = emptyBible();
    data.factions = [
      {
        id: 'F001',
        name: 'Cloud Sect',
        type: 'cultivation',
        stanceToMC: 'friendly',
        goals: ['Protect the realm'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const result = formatter.format(data);
    const text = result.data as string;
    expect(text).toContain('## Factions');
    expect(text).toContain('Cloud Sect');
    expect(text).toContain('friendly');
  });

  it('should format arcs', () => {
    const data = emptyBible();
    data.arcs = [
      {
        id: 'ARC001',
        name: 'Awakening Arc',
        type: 'main',
        status: 'in_progress',
        progress: 60,
        chapterStart: 1,
        chapterEnd: 30,
        sections: [{ name: 'Opening', chapters: [1, 2, 3], type: 'setup', status: 'complete' }],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const result = formatter.format(data);
    const text = result.data as string;
    expect(text).toContain('## Story Arcs');
    expect(text).toContain('Awakening Arc (main, in_progress)');
    expect(text).toContain('60%');
    expect(text).toContain('Opening');
  });

  it('should format foreshadowing as table', () => {
    const data = emptyBible();
    data.foreshadowing = [
      {
        id: 'FS001',
        content: 'The mysterious stone glows at midnight',
        status: 'active',
        term: 'long',
        plantedChapter: 3,
        plannedPayoff: 25,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const result = formatter.format(data);
    const text = result.data as string;
    expect(text).toContain('## Foreshadowing');
    expect(text).toContain('FS001');
    expect(text).toContain('active');
    expect(text).toContain('long');
  });

  it('should format hooks as table', () => {
    const data = emptyBible();
    data.hooks = [
      {
        id: 'HK001',
        type: 'opening',
        chapterId: 1,
        content: 'What lies beyond the veil?',
        hookType: 'mystery',
        strength: 85,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];

    const result = formatter.format(data);
    const text = result.data as string;
    expect(text).toContain('## Hooks');
    expect(text).toContain('opening');
    expect(text).toContain('mystery');
    expect(text).toContain('85');
  });

  it('should filter sections when specified', () => {
    const data = emptyBible();
    data.characters = [
      {
        id: 'C001',
        name: 'Test',
        role: 'main',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];
    data.locations = [
      {
        id: 'L001',
        name: 'Place',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const result = formatter.format(data, { sections: ['characters'] });
    const text = result.data as string;
    expect(text).toContain('## Characters');
    expect(text).not.toContain('## Locations');
  });

  it('should truncate long content in tables', () => {
    const data = emptyBible();
    data.foreshadowing = [
      {
        id: 'FS001',
        content: 'A'.repeat(100),
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const result = formatter.format(data);
    const text = result.data as string;
    expect(text).toContain('...');
    // Should not contain the full 100-char string in the table
    expect(text).not.toContain('A'.repeat(100));
  });
});
