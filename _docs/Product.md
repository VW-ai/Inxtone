# Inxtone 砚台 — Product Requirements Document

**Version:** 1.1
**Last Updated:** February 2026
**Status:** Draft for Review

---

## 1. Executive Summary

Inxtone is an **open-source, local-first CLI tool** with a web-based UI that helps writers create long-form serial fiction (web novels) with structural integrity and commercial viability. It combines literary craft principles with AI assistance to solve the core problem: AI can generate text, but it can't tell stories that hold up at scale.

**Architecture:** CLI + Local Web UI (similar to Ollama, Jupyter)
- Run `inxtone serve` → opens `localhost:3456` with full-featured writing interface
- All data stored locally as **Markdown files + SQLite index**
- **Git-friendly** project structure for version control
- **BYOK (Bring Your Own Key)** for Gemini API

**Core Value Proposition:**
- For Chinese market (网文市场): 让AI真正懂得讲故事，而不只是生成文字
- For International market: Turn AI from a text generator into a story architect
- For developers/power users: Open source, hackable, no vendor lock-in

---

## 2. Target Users

### 2.1 Primary Persona: The Serial Writer (网文作者)

**Demographics:**
- Writing 500K-2M+ word novels
- Publishing on platforms (起点/Qidian, Royal Road, Webnovel, Kindle Vellum)
- Mix of hobbyists and semi-professionals seeking monetization
- Age 18-40, comfortable with technology

**Pain Points:**
- Plot holes accumulate over hundreds of chapters
- Character consistency breaks down (忘了自己写过什么)
- AI-generated content feels hollow, readers drop off
- No good tools for managing million-word narratives
- Context window limits make AI "forget" earlier story

**Goals:**
- Write faster without sacrificing quality
- Maintain consistency across 1000+ chapters
- Build reader-sticky stories that convert to paid subscribers
- Leverage AI without losing their creative voice

### 2.2 Secondary Persona: The AI-First Creator

**Demographics:**
- Heavy AI users (Claude, GPT, Gemini)
- Want AI to do more of the heavy lifting
- May be new to fiction writing

**Pain Points:**
- AI outputs feel generic and forgettable
- Don't know what prompts to use for good fiction
- No framework for quality control

**Goals:**
- Learn storytelling craft through AI assistance
- Produce commercially viable content efficiently
- Build a sustainable content creation workflow

### 2.3 Tertiary Persona: The Learning Writer

**Demographics:**
- Aspiring authors wanting to improve
- May have abandoned stories before
- Seeking structured guidance

**Pain Points:**
- Don't know why their stories "feel wrong"
- Overwhelmed by writing advice
- Start strong but lose steam

**Goals:**
- Understand what makes stories work
- Complete a full-length novel
- Develop repeatable creative process

---

## 3. Product Positioning

| Market | Product Name | Tagline | Key Message |
|--------|-------------|---------|-------------|
| 中国 | Inxtone 砚台 | 让AI学会讲故事 | 网文创作的AI基建，从人设到大纲到正文，系统性提升AI协作质量 |
| International | Inxtone | AI-Native Storytelling | The framework that turns AI into a story architect, not just a text generator |

**Competitive Differentiation:**
- vs. Sudowrite/NovelAI: Structured methodology, not just generation; **open source**
- vs. Notion/Scrivener: AI-native, built for serial fiction scale
- vs. ChatGPT/Claude direct: Persistent story memory, quality guardrails
- vs. 各种AI写作助手: 不是"一键生成"，而是"系统协作"
- vs. Web-based tools: **Local-first, own your data, no subscription fees**

---

## 4. Core Functionalities

### 4.1 Story Bible (故事圣经)

The persistent knowledge base that AI references throughout creation.

**4.1.1 Character System (人物系统)**

| Feature | Description | Priority |
|---------|-------------|----------|
| Character Cards | Structured profiles with name, appearance, personality, background, motivation layers (表层/深层/核心) | P0 |
| Relationship Map | Visual graph showing character connections, conflict lines, alliance shifts | P0 |
| Arc Tracker | Track character growth phases, transformation moments, consistency checks | P1 |
| Voice Samples | Store dialogue snippets that define how each character speaks | P1 |
| Conflict Matrix | Map internal conflicts (5 types) to characters | P2 |

**4.1.2 World System (世界观系统)**

| Feature | Description | Priority |
|---------|-------------|----------|
| World Rules | Codified laws of the world (magic system, power levels, social structure) | P0 |
| Location Registry | Places with descriptions, atmosphere, significance | P1 |
| Faction Builder | Organizations with goals, resources, relationships | P1 |
| Timeline | Historical events, prophecies, future plot points | P1 |
| Power Scaling | Track power levels to prevent inconsistency | P2 |

**4.1.3 Plot System (剧情系统)**

| Feature | Description | Priority |
|---------|-------------|----------|
| Arc Outliner | Hierarchical structure: Main plot → Sub-arcs → Chapters → Scenes | P0 |
| Foreshadowing Ledger | Plant seeds, track payoffs, alert on forgotten threads | P0 |
| Hook Tracker | First chapter hooks, ongoing hooks, cliffhangers | P1 |
| Pacing Visualizer | Tension curve over chapters, identify flat spots | P1 |
| Branching Paths | Explore alternate directions before committing | P2 |

### 4.2 Writing Workspace (写作空间)

Where actual content creation happens.

**4.2.1 Chapter Editor**

| Feature | Description | Priority |
|---------|-------------|----------|
| Distraction-free Editor | Clean markdown editor with chapter navigation | P0 |
| AI Sidebar | Contextual AI assistance without leaving editor | P0 |
| Story Bible Panel | Quick access to characters, settings, plot points | P0 |
| Word Count & Targets | Daily/chapter/total goals with progress tracking | P2 (deferred) |
| Version History | Track changes, compare versions, rollback | P1 |
| Split View | Reference previous chapters while writing | P2 |

**4.2.2 AI Collaboration Mode**

| Feature | Description | Priority |
|---------|-------------|----------|
| Context Injection | Auto-include relevant Story Bible info in AI prompts | P0 |
| Scenario Prompts | 50+ pre-built prompts for common writing tasks | P0 |
| Continuation | "Continue from here" with style matching | P0 |
| Dialogue Generation | Generate conversations with character voice consistency | P1 |
| Description Enhancement | Expand sparse descriptions while maintaining tone | P1 |
| Brainstorm Mode | Generate multiple options for scenes/dialogue/plot points | P1 |
| Consistency Check | AI reviews draft against Story Bible for contradictions | P2 |

### 4.3 Quality Control (质量守护)

Automated checks and guardrails.

**4.3.1 Real-time Checks**

| Feature | Description | Priority |
|---------|-------------|----------|
| Character Consistency | Alert when character behavior contradicts profile | P1 |
| World Rule Violations | Flag when content breaks established rules | P1 |
| Repetition Detection | Identify overused phrases, descriptions | P1 |
| Pacing Alerts | Warn when action-to-dialogue ratio is off | P2 |

**4.3.2 Phase Checkpoints**

| Feature | Description | Priority |
|---------|-------------|----------|
| Pre-Writing Review | Validate Story Bible completeness before starting | P1 |
| Arc Completion Check | Ensure all planted seeds resolved before new arc | P1 |
| Publication Readiness | Final quality gate before export | P2 |

### 4.4 Commercial Tools (商业化工具)

Features for monetization-minded writers.

| Feature | Description | Priority |
|---------|-------------|----------|
| Reader Persona | Define target reader for tone calibration | P1 |
| Hook Analyzer | Evaluate first-chapter hook strength | P2 |
| Paywall Planning | Mark optimal paid chapter break points | P2 |
| Platform Guidelines | Checklist for specific platform requirements | P2 |

### 4.5 Export & Integration

| Feature | Description | Priority |
|---------|-------------|----------|
| TXT Export | Plain text export for platform upload | P0 |
| Word Export | .docx format for traditional publishing/editing | P0 |
| Markdown Export | For writers who want local files | P1 |
| EPUB Export | For Kindle/ebook distribution | P2 |
| Platform API | Direct publish to Royal Road, etc. (future) | P3 |

---

## 5. User Stories

### 5.1 Onboarding & Setup

```
US-001: Quick Start
As a new writer
I want to install Inxtone and start a project quickly
So that I can begin writing without friction

Acceptance Criteria:
- Install via brew/cargo in one command
- `inxtone init my-novel` creates project structure
- `inxtone serve` opens browser with welcome tutorial
- Sample project available to explore
- First chapter creatable within 2 minutes
```

```
US-002: Import Existing Work [M6 — Smart Intake]
As a writer with an in-progress novel
I want to import my existing chapters and notes
So that I can use Inxtone without starting over

Acceptance Criteria:
- Upload/paste chapter files (TXT/MD/DOCX) or bulk text
- AI extracts characters, relationships, world rules, plot threads from imported content
- Step-by-step review: AI suggests → writer confirms/edits → commit to Story Bible
- Natural language descriptions also accepted (paste a character sketch → structured card)
- Original content preserved exactly

Note: This is M6 (Smart Intake), not part of MVP scope.
See Meta/Milestone/M6.md for full scope, ADR-0003 for rationale.
```

```
US-002b: Configure AI
As a writer
I want to set up my Gemini API key easily
So that I can use AI features

Acceptance Criteria:
- `inxtone config set api-key` prompts for key
- Key stored securely in ~/.inxtone/config.toml
- Clear error message if key is invalid
- Usage instructions linked in web UI
```

### 5.2 Story Bible Creation

```
US-003: Character Creation
As a writer
I want to create detailed character profiles using guided templates
So that AI can maintain character consistency

Acceptance Criteria:
- Template prompts for appearance, personality, motivation (3 layers)
- Can add custom fields
- Visual relationship mapping
- AI can suggest missing details
```

```
US-004: World Building
As a writer
I want to define my world's rules systematically
So that AI never generates content that breaks these rules

Acceptance Criteria:
- Structured templates for magic/power systems
- Faction relationship builder
- Location registry with tags
- Rules explicitly codified (not prose)
```

```
US-005: Plot Outlining
As a writer
I want to outline my story at multiple levels (arc → chapter → scene)
So that I always know where the story is going

Acceptance Criteria:
- Nested outline structure
- Drag-and-drop reordering
- Foreshadowing links between outline items
- Progress percentage per arc
```

### 5.3 Writing Workflow

```
US-006: Start Writing Session
As a writer
I want to quickly resume where I left off
So that I can maximize writing time

Acceptance Criteria:
- Dashboard shows current chapter, word count, daily goal
- One-click to continue writing
- Recent AI conversations preserved
- "Previously on..." summary available
```

```
US-007: AI-Assisted Drafting
As a writer
I want AI to help me write while respecting my story's established elements
So that generated content is consistent and useful

Acceptance Criteria:
- AI automatically receives relevant Story Bible context
- Can select specific characters/locations to include
- Generated content matches story tone
- Easy accept/reject/edit workflow
```

```
US-008: Dialogue Writing
As a writer
I want to generate dialogue that sounds like my characters
So that each character has a distinct voice

Acceptance Criteria:
- Select participants from character list
- AI references voice samples and personality
- Multiple dialogue options generated
- Can specify emotional tone of scene
```

```
US-009: Scene Continuation
As a writer stuck mid-scene
I want AI to suggest how to continue
So that I can overcome writer's block

Acceptance Criteria:
- "Continue" button in editor
- AI reads recent paragraphs + scene outline
- Generates 2-3 continuation options
- Options respect established plot direction
```

### 5.4 Quality & Consistency

```
US-010: Consistency Check
As a writer
I want to verify my chapter doesn't contradict earlier content
So that readers don't find plot holes

Acceptance Criteria:
- Run check on draft chapter
- AI compares against Story Bible + previous chapters
- Lists potential contradictions with references
- Can mark issues as "intentional" or "needs fix"
```

```
US-011: Foreshadowing Management
As a writer
I want to track all planted story seeds
So that I never forget to pay them off

Acceptance Criteria:
- Log foreshadowing when writing
- Link to planned payoff chapter/scene
- Alert when approaching payoff point
- Dashboard of open vs. resolved threads
```

```
US-012: Character Arc Tracking
As a writer
I want to visualize each character's growth over the story
So that arcs feel complete and satisfying

Acceptance Criteria:
- Timeline view of character moments
- Tag moments as "growth", "setback", "revelation"
- AI suggests if arc feels incomplete
- Compare to archetypal patterns
```

### 5.5 Long-form Management

```
US-013: Chapter Navigation
As a writer with 500+ chapters
I want to quickly find and reference earlier content
So that I can maintain consistency in long works

Acceptance Criteria:
- Chapter list with search
- Filter by character appearance, location, plot arc
- Quick preview without leaving editor
- Bookmark important passages
```

```
US-014: Story Bible Search
As a writer
I want to search across all my story notes
So that I can quickly find established facts

Acceptance Criteria:
- Full-text search across Story Bible
- Search by entity type (character, location, etc.)
- AI-powered "ask about my story" feature
- Results show source and context
```

```
US-015: Context Window Management
As a writer using AI for a 1M+ word novel
I want AI to "remember" my entire story
So that suggestions are always relevant

Acceptance Criteria:
- Story Bible auto-summarized for AI context
- Recent chapter summaries maintained
- Relevant historical content retrieved on-demand
- User controls what AI "knows" per session
```

### 5.6 Export & Publishing

```
US-016: Export to TXT/Word
As a writer
I want to export my chapters as plain text or Word document
So that I can upload to publishing platforms or share for editing

Acceptance Criteria:
- Select chapters to export
- Choose format: TXT or DOCX
- Configurable formatting (chapter titles, separators)
- Single file or multiple files option
- Preserves Chinese/Unicode correctly
- Word export maintains basic formatting (headings, paragraphs)
```

---

## 6. Key Interfaces

> All interfaces rendered in browser at `localhost:3456` after running `inxtone serve`

### 6.1 Dashboard (首页)

**Purpose:** Entry point, status at a glance, quick actions

**Components:**
- Current project card (cover, title, word count, progress)
- Today's writing goal + streak
- Quick resume button → last chapter
- Recent AI conversations
- Notifications (consistency alerts, unresolved foreshadowing)

```
┌─────────────────────────────────────────────────────────────┐
│  INXTONE                               [New Project] [?]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  📖 [Cover]  我的网文                                  │  │
│  │              ─────────────────                        │  │
│  │              Chapter 127 / Arc 3                      │  │
│  │              234,892 words                            │  │
│  │                                                       │  │
│  │              [▓▓▓▓▓▓▓▓░░] 73% of Arc 3               │  │
│  │                                                       │  │
│  │              [Continue Writing →]                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Today's Goal                 Story Health                  │
│  ┌─────────────────────┐     ┌─────────────────────────┐   │
│  │ 1,247 / 3,000 words │     │ ⚠ 2 unresolved threads  │   │
│  │ 🔥 12 day streak    │     │ ✓ Character consistency │   │
│  └─────────────────────┘     │ ✓ World rules OK        │   │
│                              └─────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Story Bible (故事圣经)

**Purpose:** Central hub for all story knowledge

**Tabs:**
- Characters (人物)
- World (世界观)
- Plot (剧情)
- Notes (笔记)

**Characters View:**
```
┌─────────────────────────────────────────────────────────────┐
│  STORY BIBLE > Characters                    [+ New]        │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  Main (4)    │  林逸 Lin Yi                                  │
│  ├ 林逸       │  ────────────────────────────────────────    │
│  ├ 苏瑶       │                                              │
│  ├ 陈浩       │  Role: Protagonist                           │
│  └ 赵薇       │  First Appearance: Chapter 1                 │
│              │                                              │
│  Supporting  │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  (12)        │  │Appearance│ │Personality│ │Background│       │
│              │  └─────────┘ └─────────┘ └─────────┘        │
│  Mentioned   │                                              │
│  (8)         │  Motivation Layers                           │
│              │  ┌──────────────────────────────────────┐    │
│              │  │ Surface: 想要变强                      │    │
│              │  │ Hidden:  证明自己不是废物               │    │
│              │  │ Core:    害怕被抛弃                    │    │
│              │  └──────────────────────────────────────┘    │
│              │                                              │
│              │  Relationships              [View Map]       │
│              │  ├ 苏瑶 — 恋人 (从冷漠到信任)                  │
│              │  ├ 陈浩 — 宿敌 (嫉妒与对抗)                   │
│              │  └ 老爷子 — 师父 (引导者)                     │
│              │                                              │
│              │  Voice Sample                                │
│              │  "哼，你以为我会怕你？"                         │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

**Relationship Map View:**
```
┌─────────────────────────────────────────────────────────────┐
│  STORY BIBLE > Characters > Relationship Map               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                        ┌─────┐                              │
│              敌对 ←────│ 陈浩 │                              │
│                        └──┬──┘                              │
│                           │ 嫉妒                            │
│         ┌─────┐          │           ┌─────┐               │
│         │ 老爷子│←─师徒──→┼←──────────│ 苏瑶 │               │
│         └─────┘          │    恋人    └─────┘               │
│                          ▼                                  │
│                       ┌─────┐                               │
│                       │ 林逸 │  ← PROTAGONIST                │
│                       └─────┘                               │
│                          │                                  │
│                    信任 ─┼─ 依赖                             │
│                          │                                  │
│                       ┌─────┐                               │
│                       │ 小狐 │                               │
│                       └─────┘                               │
│                                                             │
│  [Edit Mode]  [Add Connection]  [Filter by Arc]            │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Writing Workspace (写作空间)

**Purpose:** Primary content creation interface

**Layout:** Three-panel (collapsible)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Chapter 127: 对决                                    [Save] [Check] [Export]│
├───────────────┬─────────────────────────────────────┬───────────────────────┤
│ CHAPTERS      │                                     │ AI ASSISTANT          │
│               │                                     │                       │
│ Arc 3         │  林逸站在擂台中央，目光如刀。          │ Context: Ch.127       │
│ ├ Ch.120      │                                     │ Characters: 林逸,陈浩   │
│ ├ Ch.121      │  "陈浩，"他缓缓开口，"三年前你         │ Location: 宗门擂台      │
│ ├ Ch.122      │  说我是废物。"                        │                       │
│ ├ Ch.123      │                                     │ ─────────────────────  │
│ ├ Ch.124      │  台下一片寂静。                       │                       │
│ ├ Ch.125      │                                     │ [Continue Scene]      │
│ ├ Ch.126      │  |                                  │ [Generate Dialogue]   │
│ ├ Ch.127 ←    │                                     │ [Describe Setting]    │
│ └ Ch.128      │                                     │ [Brainstorm Options]  │
│   (outline)   │                                     │                       │
│               │                                     │ ─────────────────────  │
│ ───────────── │                                     │                       │
│ STORY BIBLE   │                                     │ Recent:               │
│ ├ 林逸         │                                     │ "Continue the         │
│ ├ 陈浩         │                                     │  confrontation..."    │
│ └ 宗门擂台     │                                     │                       │
│               │                                     │ [Ask anything...]     │
├───────────────┴─────────────────────────────────────┴───────────────────────┤
│  Words: 2,847  │  Goal: ▓▓▓▓▓▓░░░░ 2847/3000  │  Last saved: 2 min ago    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Plot Outliner (剧情大纲)

**Purpose:** Hierarchical story structure management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PLOT OUTLINER                                    [View: Outline] [Timeline]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ▼ ARC 1: 废物觉醒 (Ch.1-45) ✓ Complete                                      │
│    ├ ▼ Setup: 被嘲笑的天才 (Ch.1-5)                                          │
│    │   ├ Scene: 宗门大比惨败                                                 │
│    │   ├ Scene: 陈浩羞辱                           ← 伏笔: 三年之约           │
│    │   └ Scene: 老爷子出现                                                   │
│    ├ ▷ Training: 秘境修炼 (Ch.6-20)                                          │
│    ├ ▷ Conflict: 初露锋芒 (Ch.21-35)                                         │
│    └ ▷ Climax: 初战告捷 (Ch.36-45)                                           │
│                                                                             │
│  ▼ ARC 2: 宗门危机 (Ch.46-100) ✓ Complete                                    │
│    └ ...                                                                    │
│                                                                             │
│  ▼ ARC 3: 天才对决 (Ch.101-150) ◐ 73% In Progress                            │
│    ├ ✓ 陈浩归来 (Ch.101-110)                                                 │
│    ├ ◐ 三年之约 (Ch.111-130)                      ← 伏笔回收: 三年之约        │
│    │   ├ ✓ Ch.127: 对决开始                                                 │
│    │   ├ ○ Ch.128: 激战                                                     │
│    │   └ ○ Ch.129: 逆转                                                     │
│    └ ○ 真相揭露 (Ch.131-150)                                                 │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────    │
│  FORESHADOWING TRACKER                                     [View All]       │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ ⚠ 老爷子的真实身份 — Planted: Ch.3 — Payoff: Ch.200 (planned)       │    │
│  │ ⚠ 苏瑶的秘密 — Planted: Ch.45 — Payoff: TBD                        │    │
│  │ ✓ 三年之约 — Planted: Ch.2 — Resolved: Ch.127-129                   │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.5 AI Prompt Panel (AI对话面板)

**Purpose:** Natural language interaction with context-aware AI

```
┌─────────────────────────────────────────────────────────────┐
│  AI ASSISTANT                              [Context: Ch.127] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📎 Context Attached:                                 │   │
│  │    • 林逸 (character profile)                        │   │
│  │    • 陈浩 (character profile)                        │   │
│  │    • Ch.126 summary                                  │   │
│  │    • Scene outline: 对决开始                          │   │
│  │                                           [Edit ✏️]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ You: 帮我写陈浩看到林逸实力后的反应，要体现他的震惊      │ │
│  │      和不甘心                                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ AI: 这里有三个方向可以选择：                            │ │
│  │                                                        │ │
│  │ **Option A - 内心独白**                                │ │
│  │ 陈浩瞳孔骤缩。不可能...三年前那个连灵力都凝聚不了的废物...  │ │
│  │                                                        │ │
│  │ **Option B - 外在反应**                                │ │
│  │ "你..."陈浩退后一步，手中的剑微微颤抖。台下有人惊呼...     │ │
│  │                                                        │ │
│  │ **Option C - 对比回忆**                                │ │
│  │ 三年前的画面闪过脑海：那个跪在地上的少年，那双绝望的眼睛... │ │
│  │ 而现在，那双眼睛里只有平静的杀意。                        │ │
│  │                                                        │ │
│  │            [Use A] [Use B] [Use C] [Regenerate]        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Ask about your story...                               │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Quick Actions:                                             │
│  [Continue Scene] [Dialogue] [Describe] [Check Consistency] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.6 Consistency Checker (一致性检查)

**Purpose:** Automated quality assurance

```
┌─────────────────────────────────────────────────────────────┐
│  CONSISTENCY CHECK — Chapter 127                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✓ Passed: 12 checks                                        │
│  ⚠ Warnings: 2 items                                        │
│  ✗ Issues: 1 item                                           │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ✗ CHARACTER CONTRADICTION                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Line 47: "陈浩笑了笑，大度地说道..."                    │   │
│  │                                                      │   │
│  │ Issue: 陈浩's personality is defined as "心胸狭窄,     │   │
│  │ 睚眦必报". This dialogue seems out of character.       │   │
│  │                                                      │   │
│  │ Reference: Character Profile > 陈浩 > Personality     │   │
│  │                                                      │   │
│  │ [Go to Line] [Mark Intentional] [Edit Character]     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ⚠ UNRESOLVED FORESHADOWING                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "三年之约" was planted in Ch.2 and this chapter is    │   │
│  │ marked as its resolution. Make sure the payoff is    │   │
│  │ satisfying and explicit.                             │   │
│  │                                                      │   │
│  │ [View Original Plant] [Mark Resolved]                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ⚠ POWER LEVEL                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 林逸 uses "天雷诀" but his current level is 金丹初期.   │   │
│  │ This technique requires 金丹中期 per World Rules.     │   │
│  │                                                      │   │
│  │ [Check World Rules] [Update Character Level]         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Technical Architecture (High-Level)

### 7.1 System Overview

**Architecture: CLI + Local Web UI**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER'S MACHINE                                 │
│                                                                             │
│   Terminal                        Browser (localhost:3456)                  │
│   ┌─────────────────┐            ┌─────────────────────────────────────┐   │
│   │ $ inxtone init │            │  ┌─────────┐ ┌─────────┐ ┌───────┐ │   │
│   │ $ inxtone serve│───────────→│  │Dashboard│ │  Story  │ │Writing│ │   │
│   │                 │            │  │         │ │  Bible  │ │  ...  │ │   │
│   │ $ inxtone      │            │  └─────────┘ └─────────┘ └───────┘ │   │
│   │   export --txt  │            │         React + Vite Frontend       │   │
│   └─────────────────┘            └─────────────────────────────────────┘   │
│          │                                         │                        │
│          │              ┌──────────────────────────┘                        │
│          │              │                                                   │
│          ▼              ▼                                                   │
│   ┌─────────────────────────────────────────────┐                          │
│   │            Inxtone Core (Rust)             │                          │
│   │  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │                          │
│   │  │ HTTP API │ │  File    │ │  AI Bridge  │ │                          │
│   │  │ Server   │ │  Watcher │ │  (Gemini)   │ │                          │
│   │  └──────────┘ └──────────┘ └─────────────┘ │                          │
│   │  ┌──────────────────────────────────────┐  │                          │
│   │  │         SQLite + FTS5 Index          │  │                          │
│   │  └──────────────────────────────────────┘  │                          │
│   └─────────────────────────────────────────────┘                          │
│          │                              │                                   │
│          ▼                              ▼                                   │
│   ┌─────────────────┐           ┌─────────────────┐                        │
│   │  Project Folder │           │   ~/.inxtone/  │                        │
│   │  (Markdown)     │           │   config.toml   │                        │
│   │                 │           │   (API keys)    │                        │
│   │  my-novel/      │           └─────────────────┘                        │
│   │  ├── .inxtone/ │                                                      │
│   │  │   └── db.sqlite                                                     │
│   │  ├── chapters/  │                                                      │
│   │  │   ├── 001.md │                                                      │
│   │  │   └── 002.md │                                                      │
│   │  ├── bible/     │                                                      │
│   │  │   ├── characters/                                                   │
│   │  │   ├── world/     │                                                  │
│   │  │   └── plot/      │                                                  │
│   │  └── inxtone.toml  │                                                  │
│   └─────────────────────┘                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │   Gemini API        │
                          │   (External, BYOK)  │
                          └─────────────────────┘
```

### 7.2 Project Structure (Local Files)

```
my-novel/
├── inxtone.toml           # Project config (title, author, settings)
├── .inxtone/
│   ├── db.sqlite           # Index, relationships, search
│   └── cache/              # AI response cache
├── chapters/
│   ├── arc-1/
│   │   ├── 001-awakening.md
│   │   ├── 002-training.md
│   │   └── _arc.toml       # Arc metadata
│   └── arc-2/
│       └── ...
├── bible/
│   ├── characters/
│   │   ├── lin-yi.md       # Character profile in markdown
│   │   └── chen-hao.md
│   ├── world/
│   │   ├── magic-system.md
│   │   ├── factions.md
│   │   └── locations.md
│   └── plot/
│       ├── outline.md      # Main plot outline
│       └── foreshadowing.md
├── exports/                # Generated TXT/DOCX files
└── .git/                   # Optional: version control
```

### 7.3 CLI Commands

```bash
# Installation
brew install inxtone          # macOS
cargo install inxtone         # From source
# or download binary from GitHub releases

# Project Management
inxtone init [name]           # Create new project in current dir
inxtone open                  # Open project in browser (serve + open)
inxtone serve                 # Start local server at localhost:3456

# Quick Commands (headless)
inxtone add character "林逸"  # Add character from CLI
inxtone add chapter "觉醒"    # Create new chapter
inxtone status                # Show project stats, warnings

# AI Commands
inxtone ask "林逸的性格是什么？"  # Query story bible
inxtone continue ch:127       # Generate continuation for chapter
inxtone check ch:127          # Run consistency check

# Export
inxtone export --txt          # Export all chapters to TXT
inxtone export --docx         # Export to Word
inxtone export --txt ch:1-50  # Export specific range

# Config
inxtone config set api-key    # Set Gemini API key (stored in ~/.inxtone/)
inxtone config show           # Show current config
```

### 7.4 Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Core Runtime | **Rust** | Fast, single binary, cross-platform, no runtime deps |
| HTTP Server | Axum | Rust-native, async, lightweight |
| Frontend | **React + Vite** | Familiar stack, fast HMR, easy to embed |
| Editor | **@uiw/react-md-editor** (MVP) | Lightweight (~4.6kB), quick integration; upgrade to CodeMirror 6 if needed |
| Storage | **Markdown files** | Human-readable, git-friendly, portable |
| Index/Search | **SQLite + FTS5** | Zero-config, fast full-text search |
| AI | **Gemini API (BYOK)** | User provides key, no server costs |
| Packaging | Single binary + embedded frontend | Easy distribution |
| Config | TOML | Human-readable, Rust-friendly |

### 7.5 AI Context Strategy

For million-word novels, context management is critical:

1. **Story Bible in SQLite**: Structured entity data (characters, world, relationships) queryable via foreign keys
2. **ContextBuilder (FK-based Assembly)**: Chapter metadata drives context — `chapter.characters[]`, `chapter.locations[]`, `chapter.foreshadowingHinted[]` provide deterministic, author-intent-driven context without semantic search
3. **Full-Text Search**: SQLite FTS5 for instant search across all content
4. **Layered Context Assembly** (MVP):
   - Layer 1: Current chapter content + outline + previous chapter tail (required)
   - Layer 2: FK expansion — characters, locations, arcs, relationships (auto-detected)
   - Layer 3: Plot awareness — foreshadowing hints, arc progress, hooks (auto-detected)
   - Layer 4: World rules — power system, social rules (always included)
   - Layer 5: User-selected additional context
5. **Token Budget Management**: Priority-based truncation from lowest layer; Gemini 2.5 Pro provides 1M token context window
6. **Semantic Search (M4+)**: Embeddings-based context enhancement, additive to FK-based assembly

### 7.6 Data Privacy & Security

- **All data stays local**: Nothing uploaded to any server except Gemini API calls
- **API key stored locally**: `~/.inxtone/config.toml` (chmod 600)
- **Optional encryption**: Future feature for sensitive projects
- **Git-friendly**: Easy to backup, version control, collaborate via git

---

## 8. MVP Scope

**Milestone Mapping:** M4 (Writing UX) → M5 (Export) → M6 (Smart Intake) → M7 (Search, Quality & v0.1.0)

### M4–M5: Core Product Loop (Writing + Export)

**Must Have (P0) — M4:**
- [x] `inxtone init` — Project scaffolding
- [x] `inxtone serve` — Local web UI server
- [x] Project dashboard (list chapters, word count)
- [x] Chapter editor with auto-save
- [x] Character cards (structured data in SQLite)
- [x] World rules, locations, factions, timeline
- [x] Plot system (arcs, foreshadowing, hooks)
- [x] Gemini 3.0 Pro integration (continuation, dialogue, brainstorm)
- [x] 5-layer context injection engine
- [x] Prompt presets (16 presets, 4 categories)
- [x] Chapter outline editing
- [x] Brainstorm mode with selectable suggestion cards
- [ ] `inxtone config` — API key management

**Must Have (P0) — M5:**
- [ ] `inxtone export md/docx/txt` — Multi-format export
- [ ] Story Bible export (structured document)
- [ ] Web UI export controls

### M6: Smart Intake (Key Adoption Unlock)

**Not part of MVP core, but critical for real-world adoption:**
- [ ] Natural language → Story Bible (paste text → structured entities)
- [ ] Chapter import + auto-extraction (bulk chapters → full Story Bible)
- [ ] Outline import → plot architecture
- [ ] "AI suggests → human confirms" review flow

See [M6.md](Meta/Milestone/M6.md) and [ADR-0003](Meta/Decisions/ADR-0003-milestone-reorder-smart-intake.md).

### M7: Search, Quality & v0.1.0 Release

- [ ] FTS5 full-text search + Cmd+K modal
- [ ] Semantic search (sqlite-vec embeddings)
- [ ] QualityService (26 consistency rules)
- [ ] Wayne Principles automated checking
- [ ] Version history + diff viewer
- [ ] Performance optimization, documentation, v0.1.0 release

### Deferred (Post-v0.1.0)

- Consistency checker (advanced, AI-powered)
- Multi-model support (Claude, GPT, Ollama)
- Relationship graph visualization
- EPUB/PDF export
- Plugin system
- Cloud sync

---

## 9. Success Metrics

### 9.1 Open Source Metrics

| Metric | Target (6 months post-launch) |
|--------|-------------------------------|
| GitHub Stars | 2,000 |
| Forks | 200 |
| Contributors | 20 |
| Downloads (releases) | 5,000 |
| Homebrew installs | 1,000 |

### 9.2 Community Metrics

| Metric | Target |
|--------|--------|
| Discord/Community members | 500 |
| Issues opened (engagement) | 100 |
| PRs merged (external) | 30 |
| Documentation pages | 50 |
| Tutorial/blog posts (external) | 10 |

### 9.3 Quality Metrics

| Metric | Target |
|--------|--------|
| Binary size | < 30MB |
| Startup time | < 500ms |
| Memory usage (idle) | < 100MB |
| Test coverage | > 70% |
| Open bugs (P0/P1) | < 10 |

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Rust learning curve for contributors | Medium | Medium | Good docs, consider Go/Node alternatives for some parts |
| Users don't adopt structured workflow | High | High | Gradual onboarding, allow freeform writing first |
| Context management insufficient for long works | Medium | High | Invest in smart context assembly, user testing |
| Competition from AI writing tools | High | Medium | Focus on structure/consistency + open source advantage |
| Cross-platform compatibility issues | Medium | Medium | CI/CD for all platforms, community testing |
| Gemini API changes/deprecation | Low | High | Abstract AI layer, support multiple providers later |

---

## 11. Roadmap

### Active Development (M4–M7)

| Milestone | Focus | Status |
|-----------|-------|--------|
| M4 | Writing UX Polish | Active |
| M5 | Export | Draft |
| M6 | Smart Intake | Draft |
| M7 | Search, Quality & v0.1.0 | Draft |

See [Milestone Index](Meta/Milestone/Meta.md) for details.

### Post-v0.1.0

**M8: Multi-Model AI + Visualization (Q2 2026)**
- Multi-model support (Claude, GPT, local Ollama)
- Relationship graph visualization
- Ambient entity detection during writing
- Advanced consistency checking

**M9: Export+ & Plugin System (Q3 2026)**
- EPUB/PDF export
- Plugin/extension architecture
- Style matching from your writing

**M10: Ecosystem (Q4 2026)**
- Optional cloud sync (encrypted, user-controlled)
- Template marketplace (share Story Bible templates)
- VS Code extension
- Community-contributed prompts

---

## 12. Open Questions

1. **Language for Core**: Rust (performant, harder) vs Go (simpler, still fast) vs Node/Bun (JS ecosystem)?
2. **Localization Priority**: UI in English first, or simultaneous EN/CN?
3. **AI Provider Abstraction**: Support only Gemini MVP, or abstract from day 1?
4. **Plugin System**: Should the architecture support plugins/extensions early?
5. **Sync/Backup**: Optional cloud sync feature later? Which provider?

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Story Bible | Persistent knowledge base containing all story facts |
| Foreshadowing Ledger | Tracker for planted story seeds and their payoffs |
| Context Injection | Automatically including relevant story info in AI prompts |
| Arc | Major story segment, typically 30-50 chapters |
| 网文 | Chinese web novel, serialized long-form fiction |

---

## Appendix B: Competitive Analysis

| Product | Strengths | Weaknesses | Our Differentiation |
|---------|-----------|------------|---------------------|
| Sudowrite | Good prose generation | SaaS, no structure, $$$ | Open source, Story Bible, free |
| NovelAI | Image + text generation | Gaming-focused, subscription | Commercial writing focus, local |
| Scrivener | Great organization | No AI, closed source | AI-native, open source |
| Notion | Flexible database | Cloud-only, not writing-focused | Local-first, purpose-built |
| ChatGPT/Claude | Powerful AI | No persistence, no structure | Persistent story memory, local |
| Obsidian | Local markdown, plugins | No AI writing focus | AI-native, fiction-specific |

---

*Document maintained by: Wayne*
*Architecture: CLI + Local Web UI (v1.1)*
*Next review date: TBD*
