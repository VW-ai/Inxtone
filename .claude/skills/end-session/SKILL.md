---
name: end-session
description: Wrap up a coding session by recording progress, updating context, and running compliance checks. Use at the end of each AI session before final commit.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# /end-session — Session Wrap-Up Protocol

## Trigger

```
/end-session [slug]
```

## Input

- Optional: slug for the progress file name (e.g., "M7_quality_rules"). If not provided, auto-generate from git branch name or recent commit messages.
- Assumes current working directory is the project root

## Execution Flow

### Step 1: Summarize changes

Run git commands to understand what was done:

```bash
git diff --stat HEAD
git log --oneline -10
```

Categorize changes: new files, modified files, deleted files. Count by package/area.

### Step 2: Gather stats

```bash
# Run tests if possible (non-blocking)
pnpm test 2>&1 | tail -5
# Check build
pnpm build 2>&1 | tail -3
```

Extract test count and build status.

### Step 3: Generate progress file

Determine the spec directory:
- If `spec/` submodule exists, write to `spec/Progress/`
- Otherwise, write to `Meta/Progress/`

Create file: `{spec-dir}/Progress/{YYYY-MM-DD}_{slug}.md`

Template:
```markdown
# {date}: {summary title}

**Branch**: {current git branch}
**Milestone**: {current milestone from LATEST.md}

---

## Completed

{bullet list of work done this session}

## New Files
| File | Purpose |
|------|---------|
{table of new files if any}

## Modified Files
| File | Change |
|------|--------|
{table of modified files if any}

## Stats
- Tests: **{count} passed**
- Build: {clean / errors}
```

### Step 4: Update LATEST.md

Read the existing LATEST.md, then update:

1. **Active Work table**: Update status of current work items
2. **Last 48h Summary**: Add this session's summary, remove entries older than 48h
3. **Blockers**: Update or clear
4. **Next Up**: Set based on what's remaining

### Step 5: Compliance checks

Run these checks and report results:

```
[ ] All new spec files <= 150 lines
[ ] All new folders have Meta.md
[ ] Progress file follows naming convention ({YYYY-MM-DD}_{slug}.md)
[ ] LATEST.md updated
```

For each check, report PASS or FAIL with details.

### Step 6: Commit spec changes (if submodule)

If spec/ is a submodule:

```bash
cd spec/
git add -A
git commit -m "progress: {slug}"
git push
cd ..
git add spec
git commit -m "docs: update spec submodule"
```

If no submodule, the spec files are part of the main repo and will be committed with the next code commit.

### Step 7: Output summary

```
## Session Complete

**Progress file**: {path to new progress file}
**LATEST.md**: Updated
**Compliance**: {pass count}/{total checks} passed
**Spec committed**: {yes/no}

### Session stats
- Duration: {approximate}
- Files changed: {count}
- Tests: {count}
```

## Constraints

- **Never skip progress recording** — even if the session was short, record what was done
- If tests or build fail, still record progress but note the failures
- Compliance check failures are **warnings**, not blockers — report but don't prevent completion
- Always ask user before pushing to remote (spec push)
- If LATEST.md doesn't exist yet, create it from scratch using the template
