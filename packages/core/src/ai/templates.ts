/**
 * Prompt Templates for AI Generation
 *
 * Stored as TypeScript string constants to avoid build tool asset bundling issues.
 * Each template uses YAML-like front-matter for metadata and {{variable}} for substitution.
 */

export const CONTINUE_TEMPLATE = `---
name: continue
description: Continue the current chapter content
variables:
  - context
  - current_content
  - user_instruction
---

You are a fiction writing assistant. Based on the following story bible and context, continue the story.

{{context}}

## Current Content
{{current_content}}

{{user_instruction}}

Continue writing from where the text ends. Requirements:
- Maintain consistent character personalities
- Transition naturally, do not repeat existing content
- Maintain consistent writing style

Output the continuation directly, without explanation.`;

export const DIALOGUE_TEMPLATE = `---
name: dialogue
description: Generate character dialogue
variables:
  - context
  - characters
  - scene_description
  - user_instruction
---

You are a fiction writing assistant specializing in character dialogue.

{{context}}

## Characters in the Dialogue
{{characters}}

## Scene
{{scene_description}}

{{user_instruction}}

Generate a natural dialogue between the characters. Requirements:
- Each character's tone and word choice must match their personality
- The dialogue should advance the plot
- Include appropriate actions and expressions

Output the dialogue directly, without explanation.`;

export const DESCRIBE_TEMPLATE = `---
name: describe
description: Generate scene description
variables:
  - context
  - location
  - mood
  - user_instruction
---

You are a fiction writing assistant specializing in scene and atmosphere description.

{{context}}

## Location
{{location}}

## Mood
{{mood}}

{{user_instruction}}

Generate a scene description. Requirements:
- Use multiple sensory details (visual, auditory, tactile, etc.)
- Align with character emotions and narrative atmosphere
- Write beautifully but without excessive embellishment

Output the description directly, without explanation.`;

export const BRAINSTORM_TEMPLATE = `---
name: brainstorm
description: Brainstorm plot directions
variables:
  - context
  - topic
  - user_instruction
---

You are a fiction writing consultant. Brainstorm based on the current story state.

{{context}}

## Topic
{{topic}}

{{user_instruction}}

Provide 3-5 possible directions. Use EXACTLY this format:

1. **Title**: Core concept in 2-3 sentences. How it connects to the current plot.
2. **Title**: Core concept in 2-3 sentences. How it connects to the current plot.

Keep each direction to 2-4 sentences. Use bold **Title** followed by a colon.`;

export const ASK_BIBLE_TEMPLATE = `---
name: ask_bible
description: Story Bible Q&A
variables:
  - context
  - question
---

You are a story setting consultant. Answer questions based on the following story bible.

{{context}}

## Question
{{question}}

Answer based on the provided story materials. If the information is not available, clearly state so.`;

export const ENTITY_EXTRACTION_TEMPLATE = `---
name: extract_entities
description: Extract characters and locations from written content
variables:
  - context
  - content
  - known_characters
  - known_locations
---

You are an entity extraction assistant for a fiction writing tool.

Given the following story bible context and a piece of newly written content, identify all characters and locations mentioned.

{{context}}

## Known Characters
{{known_characters}}

## Known Locations
{{known_locations}}

## Content to Analyze
{{content}}

For each entity found, determine:
1. Whether it matches a known entity from the story bible (use the exact ID)
2. Whether it is a new entity not yet in the bible

Return a JSON object with this exact structure:
{
  "characters": [
    { "name": "Character Name", "existingId": "C001_or_null", "isNew": false }
  ],
  "locations": [
    { "name": "Location Name", "existingId": "L001_or_null", "isNew": false }
  ]
}

Rules:
- Only include entities that are clearly named (not pronouns or generic references)
- Match existing entities by name similarity
- Set existingId to the known ID if matched, null if new
- Set isNew to true only if the entity has no match in the known lists
- Return empty arrays if no entities are found`;
