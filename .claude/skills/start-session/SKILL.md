---
name: start-session
description: Start a coding session by loading recent context, active tasks, and project constraints. Use at the beginning of each AI session to quickly get up to speed.
allowed-tools: Bash, Read, Glob, Grep
---

# /start-session — Session Startup Protocol

## Trigger

```
/start-session [issue-number]
```

## Input

- Optional: GitHub issue number to load specific context for
- Assumes current working directory is the project root

## Execution Flow

### Step 1: Sync spec (if submodule exists)

Check if `spec/` directory exists and is a git submodule:

```bash
if [ -d spec/.git ] || [ -f spec/.git ]; then
  git submodule update --remote spec/
fi
```

### Step 2: Read recent context

Read the rolling context recovery file:

1. **Primary**: Read `spec/Progress/LATEST.md` (or `Meta/Progress/LATEST.md` if no submodule)
2. **Fallback**: If LATEST.md doesn't exist, find the most recent file in `spec/Progress/` (or `Meta/Progress/`) by filename sort
3. Read `spec/Todo.md` (or `Meta/Todo.md`) for current task backlog

### Step 3: Load issue context (if issue number provided)

If an issue number was provided as argument:

```bash
gh issue view {number} --json title,body,labels,milestone
```

Look for "Spec Context" or "Related Files" sections in the issue body. If found, read those spec files.

If no issue number but LATEST.md mentions active work, note the current focus area.

### Step 4: Read constraints

Based on the task type inferred from LATEST.md or the issue:

- For code changes: Read `spec/Core/Regulation/CodeStyle.md` + `spec/Core/Regulation/Architecture.md`
- For test work: Read `spec/Core/Regulation/Testing.md`
- For git operations: Read `spec/Core/Regulation/GitWorkflow.md`
- Always: Scan `spec/Core/Regulation/Meta.md` for the routing table

### Step 5: Output summary

Print a formatted summary:

```
## Session Ready

**Last activity**: {summary from LATEST.md}
**Active work**: {from LATEST.md Active Work table}
**Current task**: {from issue or Todo.md}
**Constraints loaded**: {list of regulation files read}
**Blockers**: {from LATEST.md or "none"}
**Test count**: {last known test count from LATEST.md}

### Next steps
{Suggested actions based on context}
```

## Constraints

- This skill is **read-only** — it does not modify any files
- If spec/ submodule pull fails (network), continue with local files
- Do not read more than 5 spec files to keep context window manageable
- Always check both `spec/` and `Meta/` paths (support both submodule and non-submodule setups)
