/**
 * AI Prompt Presets — clickable instruction chips
 *
 * Grouped by category. Each preset provides a pre-written
 * userInstruction that gets appended to the prompt textarea.
 */

export interface PromptPreset {
  id: string;
  label: string;
  instruction: string;
  category: PresetCategory;
}

export type PresetCategory = 'pacing' | 'style' | 'content' | 'character';

export const PRESET_CATEGORIES: Record<PresetCategory, string> = {
  pacing: 'Pacing',
  style: 'Style',
  content: 'Content',
  character: 'Character',
};

export const PROMPT_PRESETS: PromptPreset[] = [
  // Pacing
  {
    id: 'pace-faster',
    label: 'Faster pace',
    instruction: 'Pick up the pace. Use shorter sentences and more action beats.',
    category: 'pacing',
  },
  {
    id: 'pace-tension',
    label: 'Build tension',
    instruction:
      'Build tension gradually. Use short paragraphs, sensory details, and a sense of foreboding.',
    category: 'pacing',
  },
  {
    id: 'pace-cliffhanger',
    label: 'Cliffhanger',
    instruction: 'End with a cliffhanger that makes the reader desperate to continue.',
    category: 'pacing',
  },
  {
    id: 'pace-breathe',
    label: 'Slow down',
    instruction:
      'Slow the pace. Let the scene breathe with reflection, atmosphere, and quiet moments.',
    category: 'pacing',
  },

  // Style
  {
    id: 'style-dialogue',
    label: 'More dialogue',
    instruction:
      'Use more dialogue. Let characters reveal information through conversation rather than narration.',
    category: 'style',
  },
  {
    id: 'style-descriptive',
    label: 'More descriptive',
    instruction:
      'Add richer sensory descriptions. Paint the scene with sight, sound, smell, touch, and taste.',
    category: 'style',
  },
  {
    id: 'style-shorter',
    label: 'Shorter sentences',
    instruction:
      'Use shorter, punchier sentences. Cut unnecessary words. Make every word earn its place.',
    category: 'style',
  },
  {
    id: 'style-show',
    label: "Show don't tell",
    instruction:
      'Show emotions and states through actions, body language, and dialogue instead of telling.',
    category: 'style',
  },

  // Content
  {
    id: 'content-conflict',
    label: 'Add conflict',
    instruction:
      'Introduce or escalate a conflict. Create tension between characters, goals, or circumstances.',
    category: 'content',
  },
  {
    id: 'content-twist',
    label: 'Plot twist',
    instruction: 'Introduce an unexpected twist that recontextualizes what came before.',
    category: 'content',
  },
  {
    id: 'content-foreshadow',
    label: 'Foreshadow',
    instruction: 'Subtly plant a foreshadowing element. It should feel natural, not obvious.',
    category: 'content',
  },
  {
    id: 'content-transition',
    label: 'Scene transition',
    instruction: 'Write a smooth transition to a new scene or time skip.',
    category: 'content',
  },

  // Character
  {
    id: 'char-motivation',
    label: 'Deepen motivation',
    instruction: 'Reveal deeper character motivation. Show what drives them beneath the surface.',
    category: 'character',
  },
  {
    id: 'char-vulnerability',
    label: 'Show vulnerability',
    instruction: "Show the character's vulnerable side. Let their guard down in a meaningful way.",
    category: 'character',
  },
  {
    id: 'char-voice',
    label: 'Distinct voice',
    instruction:
      "Make each character's dialogue distinctly their own. Differentiate speech patterns and word choices.",
    category: 'character',
  },
  {
    id: 'char-inner',
    label: 'Inner conflict',
    instruction:
      "Explore the character's inner conflict. Show the tension between what they want and what they need.",
    category: 'character',
  },
];
