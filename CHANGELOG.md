# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **M6: Smart Intake** — AI-powered Story Bible population from natural language and existing chapters
  - IntakeService: `decompose()` for NL text → structured entities, `extractFromChapters()` for multi-pass chapter extraction, `commitEntities()` for transactional write
  - Bilingual prompt templates (English system instructions + Chinese domain examples) with `generateJSON<DecomposeResult>()`
  - 3 API endpoints: `POST /api/intake/decompose` (JSON), `POST /api/intake/import-chapters` (SSE streaming), `POST /api/intake/commit` (JSON)
  - Intake page (`/intake`): topic selector chips (Characters, World, Plot, Locations, Factions, Chapters, Auto-detect)
  - Document intake: textarea + .txt/.md file drop, hint-aware extraction, entity review with Accept/Edit/Reject per entity
  - Chapter import: file upload (.txt/.md/.docx) + paste, chapter boundary detection (`第N章`, `Chapter N`), 3-pass SSE extraction with progress bar
  - Entity review panel: cards grouped by type with confidence badges, batch actions (Accept All, Accept All [type])
  - Entity edit modal: dynamic form fields pre-filled with AI-extracted data
  - DOCX parsing via `mammoth` library
  - Zustand store + React Query hooks for intake state management
  - SSE streaming hook with `fetch()` + `ReadableStream`, abort on unmount
  - Accessibility: `role="progressbar"`, `aria-pressed` on topic chips, `role="group"` on selector
  - 1262 tests passing across all packages
- **M5: Export + Issues #9 & #8** — Multi-format export, StoryBiblePanel refactor, Context Preview UI
  - ExportService with formatter strategy pattern: MarkdownFormatter, TxtFormatter, DocxFormatter, BibleFormatter
  - Export API: `POST /api/export/chapters` (MD/TXT/DOCX), `POST /api/export/story-bible` (Markdown) — raw file download with Content-Disposition
  - Web UI Export page: format selector, range picker (all/volume/chapters), outline/metadata options, blob download
  - CLI: `inxtone export md|txt|docx|bible` with `--output`, `--volume`, `--chapters`, `--outline`, `--metadata` options
  - StoryBiblePanel refactored: 848-line monolith → 15 focused modules (BibleSection, BibleEntityItem, 7 detail components, contextBuilders)
  - Context Preview UI: token usage progress bar (green/yellow/red), color-coded L1-L5 layer badges with tooltips, pinned items section with bulk clear, empty/not-built states
  - ADR-0005: Export Interface Simplification (dropped PDF, templates, pre-export checks)
  - 1188 tests passing across 59 files
- **M4.5: Writing Intelligence** — Search, interactive Bible panel, keyboard shortcuts, setup assist, entity extraction
  - Unified FTS5 `search_index` table: 6 entity types (character, chapter, location, faction, arc, foreshadowing), 18 auto-sync triggers, migration 003
  - SearchService: FTS5 MATCH with BM25 ranking, snippet highlighting, entity type filtering
  - Cmd+K search modal: 300ms debounced search, grouped results, keyboard navigation (arrows + Enter/Escape), entity type filter chips
  - Interactive Bible panel: 8 collapsible sections (Characters, Relationships, Locations, Arc, Foreshadowing, Hooks, World, Factions), inline detail cards, quick-search filter
  - Inject-to-context: pin Bible entities as L5 context items for AI generation, visual indicators in ContextPreview
  - Keyboard shortcuts: `Cmd+K` (search), `Cmd+S` (save), `Cmd+Enter` (AI Continue), `Cmd+/` (shortcut reference modal)
  - Chapter Setup Assist: heuristic engine (previous chapter carry-over, arc roster, outline mention), suggestion chips with one-click attach
  - Post-accept entity extraction: `generateJSON<T>()` on GeminiProvider, extraction prompt template, background extraction after AI accept, ExtractionReview panel with Link/Create/Dismiss actions
  - Search API route: `GET /api/search?q=&types=&limit=`
  - Extract entities API route: `POST /api/ai/extract-entities`
  - 1093 tests passing across 50 files
- **M3.5: Hackathon Submission** — Gemini 3 Hackathon deployment readiness
  - English AI prompts: all 5 templates + context builder labels translated
  - BYOK API key architecture: per-request `X-Gemini-Key` header, `POST /api/ai/verify-key` endpoint
  - API Key Dialog: first-visit modal with masked display, verify flow, skip option
  - Seed Loader: raw SQL seeds (EN + ZH) with full chapters, `GET /api/seed/status`, `POST /load`, `POST /clear`
  - Welcome Screen: 3-card first-run UX (English Demo / Chinese Demo / Start Empty)
  - Settings page: functional API key management + seed data controls
  - Dockerfile: multi-stage build (node:20-slim + pnpm + better-sqlite3)
  - 1001 tests passing across 42 files
- **M2: Story Bible Core** — Full Story Bible system with 9 domains
  - Repository layer: 7 repositories (Character, World, Relationship, Location, Faction, TimelineEvent, Arc, Foreshadowing, Hook) with FTS5 search
  - Service layer: StoryBibleService (41 methods) + EventBus (pub/sub with metadata injection)
  - API layer: 45 REST endpoints across 9 route files with error handler middleware
  - Web UI: Forms, modals, error handling for all domains, design system compliance
  - CLI: `inxtone bible list/show/search` commands for terminal browsing
  - Performance: sub-millisecond operations, 120+ characters, FTS5 indexing
  - Demo seed data: 《墨渊记》Ink Abyss Chronicles (6 characters, 7 relationships, world, arcs, foreshadowing, hooks)
  - 695 tests across 32 test files
- **M3 Phase 1: Writing Service** — Chapter/Volume CRUD with version control
  - WritingRepository: Volume/Chapter CRUD, content operations, version management, FK cleanup
  - WritingService: 25 methods, status state machine (outline→draft→revision→done), rollback with backup
  - EventBus integration: 10 event types for writing operations
  - 127 tests (50 repo + 77 service)
- **M3 Phase 2: AI Service** — AI generation with Gemini 2.5 Pro
  - GeminiProvider: `@google/genai` SDK streaming, retry with exponential backoff, error mapping
  - ContextBuilder: 5-layer FK-based context assembly with token budget management
  - PromptAssembler: YAML front-matter parsing, `{{variable}}` substitution, 5 built-in templates
  - AIService: 6 generation methods (continue, dialogue, describe, brainstorm, ask, complete)
  - SSE API routes: 6 streaming + 2 JSON endpoints with Zod validation
  - Token counter: heuristic estimation (CJK x1.5, English x1.3)
  - AIProviderError class with 4 error codes
  - 109 new tests, 936 total tests across 40 test files
- **M3 Phase 3: Writing API Routes** — RESTful endpoints for writing workspace
  - 18 endpoints: volumes (5), chapters (10), versions (2), stats (1)
  - Zod schema validation on all request bodies
  - Server bootstrap: WritingService creation with shared repos + EventBus
  - 39 integration tests, 976 total tests across 41 test files
- **M3 Phase 4: Chapter Editor UI** — Three-panel writing workspace
  - Three-panel layout: chapter sidebar (280px), markdown editor (flex), AI sidebar (360px, collapsible)
  - `@uiw/react-md-editor` with dark gold theme, Ctrl+S save, dirty tracking, word count
  - Chapter list with arc filter, Story Bible quick-ref panel, create/edit chapter modal
  - AI sidebar: Continue + Brainstorm with SSE streaming, accept/reject/regenerate flow
  - Context preview with layer grouping (L1-L5), streaming response with auto-scroll
  - Zustand store + React Query hooks for state management
  - 19 new files, 984 tests passing, build clean
- **M3 Phase 5: Plot UI** — Standalone Plot page with arc outliner, foreshadowing tracker, hook tracker
  - Arc Outliner: collapsible tree (Arc → Sections → Chapters), progress bars, status badges, chapter click → Write page
  - Foreshadowing Tracker: lifecycle timeline (planted → hints → resolved/pending), overdue warnings, Add Hint modal, inline Resolve, Abandon with confirm
  - Hook Tracker: hooks grouped by chapter with color-coded strength bars (low/mid/high)
  - Sidebar navigation with plot icon, 3-tab layout (Arcs | Foreshadowing | Hooks)
  - 10 new files, build clean
- **M3 Phase 6: Testing & Polish** — E2E tests, performance benchmarks, and deferred feature completion
  - Accept at cursor position: AI text inserts at editor cursor (3-part preview), not just appended
  - Context item toggle: checkboxes to exclude L2-L5 context items before AI generation
  - E2E tests: 7 tests covering writing flow, version rollback, plot lifecycle, status transitions, word count
  - Performance tests: 7 benchmarks (all under threshold — save 1ms, load 1ms, context build 2ms)
  - Context exclusion wired through full stack: web store → AISidebar → server schema → AIService filter
  - 1015 tests passing across 44 files

## [0.1.0] - 2026-02-05

### Added
- **Monorepo setup** — pnpm workspaces with 4 packages (core, tui, server, web)
- **TypeScript strict mode** — across all packages with ESLint v9 + Prettier
- **Interface contract system** — 7 service interfaces, 60+ typed events, full API types
- **Test infrastructure** — Vitest with 247 tests, contract tests, mock services
- **Database layer** — SQLite via better-sqlite3, migration system, 18 core tables, FTS5 search
- **CLI** — `inxtone init`, `inxtone serve`, `--version`, `--help` via Commander.js + Ink
- **HTTP server** — Fastify with CORS, health check, static file serving, SPA fallback
- **Web UI shell** — React 18 + Vite, AppShell layout, 4 page stubs (Dashboard, Story Bible, Write, Settings)
- **Design system** — CSS custom properties (dark theme, gold accents, responsive)
- **Pre-commit hooks** — husky + lint-staged (eslint, prettier, typecheck)
- **Documentation** — Meta/ folder hierarchy, ADR system, milestone tracking, CLAUDE.md

---

[Unreleased]: https://github.com/VW-ai/Inxtone/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/VW-ai/Inxtone/releases/tag/v0.1.0
