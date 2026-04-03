# Inxtone 砚台

> AI-Native Storytelling Framework - Local-first CLI + Web UI for serial fiction writers

## Overview

Inxtone is an **open-source, local-first CLI tool** with a web-based UI that helps writers create long-form serial fiction (web novels) with structural integrity. It combines literary craft principles with AI assistance to solve the core problem: AI can generate text, but it can't tell stories that hold up at scale.

**Architecture:** CLI + Local Web UI (similar to Ollama, Jupyter)
- Run `inxtone serve` → opens `localhost:3456` with full-featured writing interface
- All data stored in **SQLite** (source of truth), Markdown for export
- **Git-friendly** project structure for version control
- **BYOK (Bring Your Own Key)** for Gemini API

## Quick Start

```bash
# Clone the repository
git clone https://github.com/VW-ai/Inxtone.git
cd inxtone

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Load demo data (optional - showcases all features)
pnpm --filter @inxtone/core seed:demo
```

### Demo Data

The project includes a comprehensive demo story **《墨渊记》Ink Abyss Chronicles** (a xianxia cultivation novel) that showcases all Story Bible features:

- 6 characters with full profiles (motivation layers, voice samples, character arcs)
- 7 relationships with Wayne Principles analysis
- Complete world settings (5-level power system, social rules)
- 4 locations, 3 factions, 5 timeline events
- 2 story arcs with sections, 3 foreshadowing items, 4 hooks

**Usage:**
```bash
# Seed demo data (writes to ~/.inxtone/data.db)
pnpm --filter @inxtone/core seed:demo

# Then explore via CLI
inxtone bible list
inxtone bible show character C001

# Or via Web UI
pnpm dev
# Navigate to http://localhost:5173/bible
```

## Documentation

All project documentation lives in the `spec/` submodule (separate repo linked via git submodule):

| Folder | Purpose |
|--------|---------|
| [spec/Core/](spec/Core/Meta.md) | Core documents (Product, Regulation, Technical) |
| [spec/Design/](spec/Design/Meta.md) | Design language system |
| [spec/Architecture/](spec/Architecture/Meta.md) | Technical architecture |
| [spec/Modules/](spec/Modules/Meta.md) | Service module designs |
| [spec/Decisions/](spec/Decisions/Meta.md) | Architecture Decision Records |
| [spec/Milestone/](spec/Milestone/Meta.md) | Milestone planning and tracking |

Quick links:
- [Product Requirements](spec/Core/Product/Meta.md)
- [Development Standards](spec/Core/Regulation/Meta.md)
- [Current Progress](spec/Progress/LATEST.md)
- [Session Skills](spec/Skills/Meta.md)
- [Change Log](CHANGELOG.md)

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | pnpm workspaces |
| **Language** | TypeScript |
| **TUI** | Ink (React for CLI) |
| **Web** | React 18 + Vite |
| **Server** | Fastify |
| **Database** | SQLite (better-sqlite3) + sqlite-vss |
| **Testing** | Vitest |

## Development Workflow

### Core Principle: Test-Oriented Parallel Development

We use **git worktree** for parallel feature development. This requires:

1. **Interface-First**: Define TypeScript interfaces before implementation
2. **Test-First**: Write tests before code (tests = interface contract)
3. **Parallel Branches**: Multiple features developed simultaneously via worktree

```
M1 (Foundation) ──→ Interface + Test Stubs defined
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   feat/story-bible  feat/writing     feat/ai-service
   (worktree-1)      (worktree-2)     (worktree-3)
        │                 │                 │
        └─────────────────┴─────────────────┘
                          │
                    merge to main
```

**Before starting any phase**: Run `/test-plan` skill to design test cases.

See [Testing.md](spec/Core/Regulation/Testing.md) for detailed workflow.

### Branching Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feat/*` - Feature branches
- `fix/*` - Bug fix branches

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Request Process
1. Create branch from `develop`
2. Make changes with atomic commits
3. Write/update tests
4. Update documentation if needed
5. Open PR with clear description
6. Request review
7. Address feedback
8. Squash and merge

### Code Review Checklist
- [ ] Code follows project conventions
- [ ] Tests pass and coverage maintained
- [ ] Documentation updated
- [ ] No security issues introduced
- [ ] Performance impact considered

## Project Conventions

### File Naming
- Documentation: Title Case (`Product.md`, `Meta.md`)
- Code files: camelCase or kebab-case per framework
- Folders: Title Case for docs, lowercase for code

### Labels
See [spec/Labels.md](spec/Labels.md) for issue/PR labeling conventions.

## Contributing

### For New Contributors
1. Read [Product.md](spec/Core/Product/Meta.md) to understand the project
2. Read [Regulation](spec/Core/Regulation/Meta.md) for coding standards
3. Check [spec/Milestone/](spec/Milestone/Meta.md) for current priorities
4. Pick a task or open an issue

### Making Decisions
For architectural decisions:
1. Create an ADR in `spec/Decisions/`
2. Discuss with team
3. Update status once decided

### Tracking Progress
- Update [Progress/LATEST.md](spec/Progress/LATEST.md) at end of each session
- Move completed items in [Todo.md](spec/Todo.md) to archive
- Update milestone status when deliverables complete
