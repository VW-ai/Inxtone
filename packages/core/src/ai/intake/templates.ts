/**
 * Smart Intake Prompt Templates (Bilingual 双语)
 *
 * Templates for AI-powered entity extraction. All prompts are bilingual
 * (English + Chinese) to handle both English and Chinese fiction content.
 *
 * Uses the same YAML front-matter + {{variable}} format as core templates.ts.
 */

// ===========================================
// Document Intake: Decompose Text → Entities
// ===========================================

export const INTAKE_DECOMPOSE_TEMPLATE = `---
name: intake_decompose
description: Extract Story Bible entities from natural language text
variables:
  - text
  - hint
  - known_entities
  - entity_schemas
---

You are a Story Bible extraction assistant for fiction writing.
你是一个小说故事圣经（Story Bible）提取助手。

Given the following text, extract structured Story Bible entities.
根据以下文本，提取结构化的故事圣经实体。

## Extraction Focus / 提取重点
{{hint}}

## Known Entities (avoid duplicates) / 已有实体（避免重复）
{{known_entities}}

## Text to Analyze / 待分析文本
{{text}}

## Expected Output Format / 期望输出格式

Return a JSON object. Only include arrays that have extracted entities — empty arrays can be omitted.
请返回 JSON 对象。只包含提取到实体的数组，空数组可省略。

{{entity_schemas}}

## Rules / 提取规则
- Only include entities that are clearly named or described. Do not invent entities not present in the text.
  只包含文本中明确提及或描述的实体，不要虚构。
- For Chinese names, use the full name as it appears. Match known entities by name similarity.
  中文名使用原文全名。通过名称相似度匹配已有实体。
- If a known entity is mentioned, do NOT re-extract it. Only extract new entities.
  如果已有实体被提及，不要重复提取，只提取新实体。
- Set confidence: "high" when entity details are explicit, "medium" when inferred, "low" when uncertain.
  信心度：明确描述="high"，推断="medium"，不确定="low"。
- For relationships, use character names (sourceName/targetName), not IDs.
  关系使用角色名称（sourceName/targetName），不要用 ID。
- For factions, use leaderName (character name), not leaderId.
  势力用 leaderName（角色名），不要用 leaderId。`;

// ===========================================
// Hint-specific extraction focus strings
// ===========================================

/**
 * Maps IntakeHint → extraction focus instructions (bilingual).
 * Appended to the {{hint}} variable in the decompose prompt.
 */
export const HINT_FOCUS: Record<string, string> = {
  character: `Focus on extracting CHARACTERS and their RELATIONSHIPS.
重点提取角色及其关系。
Primary: characters[] — name, role, appearance, motivation, voiceSamples, conflictType, template
Secondary: relationships[] — sourceName, targetName, type, joinReason, independentGoal
Also extract any relationships mentioned between characters.
同时提取角色之间提到的关系。`,

  world: `Focus on extracting WORLD-BUILDING elements.
重点提取世界观设定。
Primary: worldRules (powerSystem, socialRules), locations[], factions[]
Extract power systems, magic/cultivation rules, social norms, notable locations, and organizations.
提取力量体系、修炼/魔法规则、社会规范、重要地点和组织。`,

  plot: `Focus on extracting PLOT elements.
重点提取剧情元素。
Primary: arcs[], foreshadowing[], hooks[]
Secondary: timeline[]
Extract story arcs (main/sub), foreshadowing seeds, narrative hooks, and timeline events.
提取故事弧线（主线/支线）、伏笔、叙事钩子和时间线事件。
Note for hooks: "type" = where it appears (opening/arc/chapter), "hookType" = technique used (suspense/mystery/etc). Do NOT confuse them.
注意 hooks："type"=出现位置（opening/arc/chapter），"hookType"=手法风格（suspense/mystery等），不要搞混。`,

  location: `Focus on extracting LOCATIONS.
重点提取地点。
Primary: locations[] — name, type, significance, atmosphere
Secondary: factions[] — organizations based at these locations
提取地点的名称、类型、意义、氛围，以及驻扎在这些地点的势力。`,

  faction: `Focus on extracting FACTIONS and organizations.
重点提取势力和组织。
Primary: factions[] — name, type, status, leaderName, stanceToMC, goals, resources, internalConflict
Secondary: locations[] — faction headquarters or territories
提取势力的名称、类型、领导者、对主角态度、目标、资源、内部矛盾。`,

  auto: `Extract ALL types of Story Bible entities from the text.
从文本中提取所有类型的故事圣经实体。
Extract: characters, relationships, locations, factions, worldRules, arcs, foreshadowing, hooks, timeline.
Focus on entities that are explicitly described with enough detail to be useful.
重点提取有足够细节描述的实体。`,
};

// ===========================================
// Entity Schema Descriptions (for AI prompt)
// ===========================================

/**
 * JSON schema descriptions included in the prompt so the AI knows
 * the exact shape to produce. Only relevant schemas are included
 * based on the hint.
 */
export const ENTITY_SCHEMA_DESCRIPTIONS: Record<string, string> = {
  characters: `"characters": [
  {
    "name": "Character full name / 角色全名",
    "role": "main | supporting | antagonist | mentioned",
    "appearance": "Physical description / 外貌描述 (optional)",
    "voiceSamples": ["Example dialogue line / 对话示例"] (optional),
    "motivation": {
      "surface": "Visible goal / 表面目标",
      "hidden": "Hidden psychological driver / 深层心理驱动 (optional)",
      "core": "Unconscious core need / 无意识核心需求 (optional)"
    } (optional),
    "conflictType": "desire_vs_morality | ideal_vs_reality | self_vs_society | love_vs_duty | survival_vs_dignity (optional)",
    "template": "avenger | guardian | seeker | rebel | redeemer | bystander | martyr | fallen (optional)",
    "confidence": "high | medium | low"
  }
]`,

  relationships: `"relationships": [
  {
    "sourceName": "Character A name / 角色A名",
    "targetName": "Character B name / 角色B名",
    "type": "companion | rival | enemy | mentor | confidant | lover",
    "joinReason": "Why they are connected / 联结原因 (optional)",
    "independentGoal": "Character B's own goal / 角色B自身目标 (optional)",
    "disagreeScenarios": ["When they might disagree / 意见分歧场景"] (optional),
    "leaveScenarios": ["When they might part ways / 分道扬镳场景"] (optional),
    "mcNeeds": "What MC needs from this character / 主角需要什么 (optional)",
    "evolution": "How the relationship changes / 关系发展 (optional)",
    "confidence": "high | medium | low"
  }
]`,

  locations: `"locations": [
  {
    "name": "Location name / 地点名称",
    "type": "Type (city/mountain/cave/etc.) / 类型 (optional)",
    "significance": "Story significance / 故事意义 (optional)",
    "atmosphere": "Sensory description / 氛围描写 (optional)",
    "confidence": "high | medium | low"
  }
]`,

  factions: `"factions": [
  {
    "name": "Faction name / 势力名称",
    "type": "Type (sect/guild/kingdom/etc.) / 类型 (optional)",
    "status": "Current status / 当前状态 (optional)",
    "leaderName": "Leader character name / 领导者角色名 (optional)",
    "stanceToMC": "friendly | neutral | hostile (optional)",
    "goals": ["Faction goals / 目标"] (optional),
    "resources": ["Key resources / 关键资源"] (optional),
    "internalConflict": "Internal conflicts / 内部矛盾 (optional)",
    "confidence": "high | medium | low"
  }
]`,

  worldRules: `"worldRules": {
  "powerSystem": {
    "name": "System name / 体系名称",
    "levels": ["Level 1", "Level 2", ...] (optional),
    "coreRules": ["Rule 1 / 规则1", ...] (optional),
    "constraints": ["Limitation 1 / 限制1", ...] (optional)
  } (optional),
  "socialRules": {
    "rule_key": "rule description / 规则描述",
    ...
  } (optional),
  "confidence": "high | medium | low"
}`,

  foreshadowing: `"foreshadowing": [
  {
    "content": "What is being foreshadowed / 伏笔内容",
    "plantedText": "The text that plants this seed / 埋下伏笔的文字 (optional)",
    "term": "short | mid | long (optional)",
    "confidence": "high | medium | low"
  }
]`,

  arcs: `"arcs": [
  {
    "name": "Arc name / 弧线名称",
    "type": "main | sub",
    "status": "planned | in_progress | complete (optional)",
    "mainArcRelation": "How sub-arc relates to main arc / 与主线关系 (optional, sub arcs only)",
    "confidence": "high | medium | low"
  }
]`,

  hooks: `"hooks": [
  {
    "type": "opening | arc | chapter — WHERE the hook appears (scope/structural level) / 钩子出现的位置（结构层级）",
    "content": "Hook content / 钩子内容",
    "hookType": "suspense | anticipation | emotion | mystery — HOW the hook works (technique/style) / 钩子的手法风格 (optional)",
    "strength": 0-100 (optional),
    "confidence": "high | medium | low"
  }
]`,

  timeline: `"timeline": [
  {
    "eventDate": "Date or time marker / 日期或时间标记 (optional)",
    "description": "Event description / 事件描述",
    "relatedCharacterNames": ["Character names / 相关角色名"] (optional),
    "relatedLocationNames": ["Location names / 相关地点名"] (optional),
    "confidence": "high | medium | low"
  }
]`,
};

/** Maps hint → which entity schemas to include in the prompt */
export const HINT_SCHEMAS: Record<string, string[]> = {
  character: ['characters', 'relationships'],
  world: ['worldRules', 'locations', 'factions'],
  plot: ['arcs', 'foreshadowing', 'hooks', 'timeline'],
  location: ['locations', 'factions'],
  faction: ['factions', 'locations'],
  auto: [
    'characters',
    'relationships',
    'locations',
    'factions',
    'worldRules',
    'foreshadowing',
    'arcs',
    'hooks',
    'timeline',
  ],
};

/**
 * Build the {{entity_schemas}} variable for the decompose prompt.
 * Only includes schemas relevant to the given hint.
 */
export function buildEntitySchemas(hint: string): string {
  const schemaKeys = HINT_SCHEMAS[hint] ?? HINT_SCHEMAS.auto!;
  const parts = schemaKeys.map((key) => ENTITY_SCHEMA_DESCRIPTIONS[key]).filter(Boolean);
  return `{\n${parts.join(',\n')}\n}`;
}

// ===========================================
// Chapter Import: Multi-Pass Extraction
// ===========================================

export const INTAKE_CHAPTER_EXTRACT_TEMPLATE = `---
name: intake_chapter_extract
description: Extract Story Bible entities from story chapters (per pass)
variables:
  - chapters
  - pass_target
  - known_entities
  - already_extracted
  - entity_schemas
---

You are a Story Bible extraction assistant analyzing story chapters.
你是一个分析小说章节的故事圣经提取助手。

Read the following chapters carefully and extract the specified entity types.
仔细阅读以下章节，提取指定类型的实体。

## Extraction Target for This Pass / 本轮提取目标
{{pass_target}}

## Known Entities (already in Story Bible) / 已有实体
{{known_entities}}

## Already Extracted (from previous passes) / 上轮已提取
{{already_extracted}}

## Chapters / 章节内容
{{chapters}}

## Expected Output Format / 期望输出格式

Return a JSON object with ONLY the entity types requested in this pass.
请返回 JSON 对象，只包含本轮要求提取的实体类型。

{{entity_schemas}}

## Rules / 提取规则
- Extract entities based on their appearances across ALL chapters, not just one.
  基于所有章节的出现提取实体，不仅仅是单个章节。
- For characters: include details accumulated across multiple chapters.
  角色：汇总多个章节中的描述细节。
- For relationships: only extract relationships between characters listed in "Already Extracted" or "Known Entities".
  关系：只提取已提取或已有角色之间的关系。
- Deduplicate: if the same entity appears in multiple chapters, combine into one entry.
  去重：同一实体在多个章节出现时，合并为一条。
- Do NOT re-extract entities that are already in "Known Entities".
  不要重复提取已有实体。
- Set confidence based on how much textual evidence supports the extraction.
  根据文本证据的充分程度设置信心度。`;

// ===========================================
// Duplicate Detection
// ===========================================

export const INTAKE_DUPLICATE_CHECK_TEMPLATE = `---
name: intake_duplicate_check
description: Determine if two entities are the same
variables:
  - entity_type
  - imported_entity
  - existing_entity
---

You are a fiction entity matching assistant.
你是一个小说实体匹配助手。

Determine whether the following two entities refer to the same {{entity_type}} in a story.
判断以下两个实体是否指向故事中的同一个{{entity_type}}。

## Imported Entity (new) / 导入的实体（新）
{{imported_entity}}

## Existing Entity (in Story Bible) / 已有实体
{{existing_entity}}

Return a JSON object:
请返回 JSON 对象：
{
  "isSame": true/false,
  "confidence": 0.0-1.0,
  "reason": "Brief explanation / 简要说明"
}

Consider:
- Name variations (nickname, alias, title) / 名称变体（绰号、别名、称号）
- Descriptions that match but use different wording / 描述匹配但用词不同
- Context clues (same role, same location, etc.) / 上下文线索（相同角色、地点等）
- Characters in Chinese fiction may be referred to by surname only, courtesy name, or title / 中文小说中角色可能用姓、字、号来称呼`;
