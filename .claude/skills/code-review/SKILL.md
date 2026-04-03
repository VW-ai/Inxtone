# Code Review Skill

> Structured code review against project docs, architecture, and practices

## Trigger

Use this skill when:
- Before opening a PR or merging a branch
- After completing a milestone phase
- User says `/code-review` or "review the code"

## Input

The skill accepts an optional scope:
- `/code-review` — review all uncommitted + staged changes
- `/code-review feat/branch-name` — review diff of branch vs main
- `/code-review packages/web/src/features/writing/` — review a specific path

## Workflow

### 0. Determine Scope

Identify what code to review:
- If no argument: use `git diff HEAD` (staged + unstaged) and `git diff --cached`
- If branch name: use `git diff main...{branch}` to get full branch diff
- If path: review all files under that path
- List all changed/added files and categorize by package (core, web, server)

### 1. Code ↔ Documentation Alignment

**Goal**: Docs and code tell the same story. Catch drift early.

Read the relevant docs for the changed modules:
- `Meta/Modules/{module}_service.md` — service specs
- `Meta/Architecture/ModuleDesign/APIContracts.md` — API contracts
- `Meta/Architecture/BusinessLogic/Schemas/` — data models
- `Meta/Architecture/DataLayer/` — DB schema

For each changed file, check:

| Check | Question |
|-------|----------|
| **Interface match** | Do function signatures match what the module doc specifies? |
| **Schema match** | Do DB tables/columns match schema docs? Any new columns undocumented? |
| **API contract** | Do route paths, methods, request/response shapes match APIContracts? |
| **New concepts** | Are there new entities, enums, or states not reflected in any doc? |
| **Removed features** | Was anything removed from code that docs still reference? |

**Verdict per file**: `✅ Aligned` / `📝 Doc needs update` / `⚠️ Code diverged from spec (discuss first)`

### 2. Practices & Pattern Compliance

**Goal**: Follow existing patterns, keep coupling low, maintain consistency.

Read project standards:
- `Meta/Core/Regulation.md` — coding conventions
- `Meta/Decisions/` — relevant ADRs
- Existing code in the same package for pattern reference

| Category | Checks |
|----------|--------|
| **Naming** | camelCase vars/fns, PascalCase types, UPPER_SNAKE constants, kebab-case files |
| **TypeScript** | No `any`, strict mode compatible, `interface` preferred over `type` for objects |
| **Architecture** | Services communicate via EventBus (no direct cross-service calls, exception: utility services). DB access only through Repository layer. AI calls only through AIService |
| **Coupling** | New imports don't create circular dependencies. Feature modules don't reach into other features' internals. Shared code goes through proper public APIs |
| **Existing patterns** | Uses established hooks pattern (React Query keys, Zustand stores). Follows existing file/folder structure in the same package. Re-uses existing utilities rather than reinventing |
| **Error handling** | Errors typed and handled at boundaries. No swallowed errors. User-facing errors are meaningful |
| **i18n** | No hardcoded user-facing strings (use `t('key')`) |
| **Imports** | Ordered: external → internal → relative. No unused imports |

### 3. Feature ↔ Product Alignment

**Goal**: What we build matches what we designed.

Read product/design docs:
- `Meta/Core/Product/Features.md` — feature definitions
- `Meta/Core/Product/UserStories.md` — user stories
- `Meta/Core/Product/Interfaces.md` — UI/UX specs
- `Meta/Design/` — design language, components, patterns
- Current milestone: `Meta/Milestone/M{N}.md` — scope + acceptance criteria

| Check | Question |
|-------|----------|
| **Feature coverage** | Does the implementation fulfill the user story / acceptance criteria? |
| **UX alignment** | Do UI components follow the design system (spacing, colors, interaction patterns)? |
| **Scope creep** | Is anything implemented that's NOT in the current milestone scope? |
| **Deferred items** | Is anything built that was explicitly deferred? (Check milestone's "Deferred" section) |
| **Edge cases** | Does the implementation handle the edge cases from user stories? |

### 4. Architecture & Constraints

**Goal**: Respect architectural boundaries and decisions.

Read:
- `Meta/Architecture/Meta.md` — overall architecture
- `Meta/Decisions/ADR-*.md` — any ADRs relevant to the changed code
- `Meta/Architecture/BusinessLogic/Rules/` — Wayne Principles, consistency rules

| Check | Question |
|-------|----------|
| **ADR compliance** | Do changes align with accepted ADRs? Any decision being violated? |
| **Layer boundaries** | Is the layering clean? (UI → hooks → API client → server → service → repo) |
| **Consistency rules** | Are the 26 consistency rules respected? (Wayne Principles, B20 Checklist) |
| **Breaking changes** | Any API or interface changes that break existing consumers? If so, is there an ADR? |
| **Data flow** | Does data flow in one direction? No prop drilling or state leaks across boundaries? |

### 5. Security & Safety

**Goal**: No vulnerabilities introduced.

| Check | Question |
|-------|----------|
| **Secrets** | No API keys, tokens, or credentials in code or committed files |
| **SQL injection** | All DB queries use parameterized statements |
| **Input validation** | User inputs validated/sanitized at system boundaries (API routes, form submissions) |
| **XSS** | No `dangerouslySetInnerHTML` without sanitization. Content properly escaped |
| **Dependencies** | New dependencies justified? Well-maintained? No known vulnerabilities? |

### 6. Test Coverage

**Goal**: New code is tested, coverage maintained.

| Check | Question |
|-------|----------|
| **New tests** | Does new feature code have corresponding test files? |
| **Coverage targets** | Services ≥80%, Utils ≥90%, Components ≥70% |
| **Test quality** | Tests verify behavior, not implementation. Edge cases covered |
| **Bug fixes** | If this is a fix, is there a regression test? |

Run `pnpm test` if possible and report results.

### 7. Code Hygiene

**Goal**: Keep the codebase clean.

| Check | Question |
|-------|----------|
| **Dead code** | Any unused functions, variables, imports, or files? |
| **TODO debt** | New TODOs added? Are they tracked in `Meta/Todo.md`? |
| **Console logs** | No debug `console.log` left in production code |
| **Comments** | Comments explain "why" not "what". No commented-out code blocks |
| **Bundle impact** | Any large new dependencies? Impact on bundle size? |

## Output Format

```markdown
# Code Review: [scope description]

**Branch**: `feat/xxx` → `main`
**Files changed**: N files across M packages
**Review date**: YYYY-MM-DD

---

## Summary

[1-3 sentence overall assessment. Is this ready to merge? What's the biggest concern?]

## 1. Code ↔ Docs Alignment

| File/Area | Status | Notes |
|-----------|--------|-------|
| ... | ✅ / 📝 / ⚠️ | ... |

**Action items**:
- [ ] ...

## 2. Practices & Patterns

| Category | Status | Notes |
|----------|--------|-------|
| ... | ✅ / ⚠️ | ... |

**Action items**:
- [ ] ...

## 3. Feature ↔ Product

| Story/Criteria | Status | Notes |
|----------------|--------|-------|
| ... | ✅ / ❌ / ⏳ | ... |

**Action items**:
- [ ] ...

## 4. Architecture

| Check | Status | Notes |
|-------|--------|-------|
| ... | ✅ / ⚠️ | ... |

## 5. Security

| Check | Status |
|-------|--------|
| ... | ✅ / ⚠️ |

## 6. Tests

| Area | Coverage | Notes |
|------|----------|-------|
| ... | ✅ / ❌ | ... |

## 7. Hygiene

| Check | Status |
|-------|--------|
| ... | ✅ / ⚠️ |

---

## Verdict

**[✅ APPROVE / 🔄 APPROVE WITH NITS / ⚠️ CHANGES REQUESTED / ❌ BLOCK]**

### Must Fix (before merge)
- [ ] ...

### Should Fix (can be follow-up)
- [ ] ...

### Nits (optional)
- ...
```

## Output Location

- Display in chat for immediate review
- Optionally save to `Meta/Reviews/YYYY-MM-DD-{scope}.md` if user requests

## Example Invocation

```
User: /code-review
→ Reviews all uncommitted changes against docs and standards

User: /code-review feat/m4-ai-brainstorm
→ Reviews full branch diff, checks against M4 milestone scope

User: /code-review packages/web/src/features/writing/
→ Focused review of the writing feature module
```
