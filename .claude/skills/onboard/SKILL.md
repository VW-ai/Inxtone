---
name: onboard
description: One-time onboarding for new AI Coders joining the Inxtone project. Walks through project setup, spec system orientation, and track assignment. Use when someone is working on this project for the first time.
allowed-tools: Bash, Read, Glob, Grep
---

# /onboard — New AI Coder Onboarding

## Trigger

```
/onboard [track]
```

## Input

- Optional: track assignment (e.g., "m7-a", "m7-b", "m8-c"). If not provided, show available tracks and let user choose.
- Assumes the repo has already been cloned.

## Execution Flow

### Step 1: Environment Check

Verify prerequisites:

```bash
node --version   # >= 20.11.0
pnpm --version   # installed
git --version    # installed
```

If any are missing, provide installation instructions and stop.

### Step 2: Project Setup

Run setup commands:

```bash
pnpm install
git submodule update --init
git config core.hooksPath .githooks
git config submodule.recurse true
```

Verify build works:

```bash
pnpm build
pnpm test
```

Report results. If tests fail, investigate and report — do not proceed blindly.

### Step 3: Spec System Orientation

Read and summarize the key documents in this order:

1. **CLAUDE.md** — Project overview, tech stack, workflow
2. **spec/Meta.md** (or `Meta/Meta.md`) — Documentation routing table. Explain:
   - "This is the Context Injection Guide. When you need to understand something, find the right row in this table and read that file."
   - "Every folder has a Meta.md that tells you what's inside and how many lines each file is."
3. **spec/Core/Regulation/Meta.md** — Development standards overview. Highlight:
   - Test-first workflow (read Testing.md)
   - Conventional commits (read GitWorkflow.md)
   - Architecture constraints (read Architecture.md)
4. **spec/Progress/LATEST.md** — Current project state

Output a summary:

```
## Project Overview

**What**: {1-sentence from CLAUDE.md}
**Stack**: {tech stack summary}
**Current state**: {from LATEST.md — what milestone, what's active}
**Test count**: {from LATEST.md}

## How the Spec System Works

The project uses Context OS — a documentation structure where every folder has a
Meta.md routing file. When you need context for a task:

1. Start at spec/Meta.md
2. Find the row matching your task
3. Read the linked file(s)
4. Total context: usually 40-100 lines per topic

Key folders:
- spec/Core/Product/ — what to build
- spec/Core/Regulation/ — how to build it
- spec/Architecture/ — system design
- spec/Milestone/ — what's planned
- spec/Progress/ — what's been done
```

### Step 4: Show Available Tracks

Read the current active milestone file (find from spec/Milestone/Meta.md — look for "Draft" or "Active" status).

Parse the milestone file and extract Track A/B/C information.

Output:

```
## Available Tracks

### {Milestone Name}

| Track | Focus | Branch | Key Issues |
|-------|-------|--------|------------|
| A | {description} | {branch name} | {issue numbers} |
| B | {description} | {branch name} | {issue numbers} |
| C | {description} | {branch name} | {issue numbers} |

Which track do you want to work on?
```

If a track was provided as argument, skip the question and proceed.

### Step 5: Worktree Setup

Once a track is chosen, set up the worktree:

```bash
# Create the feature branch
git checkout -b {branch-name}

# Or if using worktree for parallel dev:
git worktree add ../{worktree-dir} {branch-name}
```

Explain the worktree workflow:
- Each track develops in its own worktree
- Run tests independently: `cd ../{worktree-dir} && pnpm test`
- Before merge: all tests must pass on main

### Step 6: Session Workflow Introduction

Explain the session protocol:

```
## Your Daily Workflow

1. **Start session**: Run `/start-session` to load recent context
2. **Work**: Implement your track's tasks (check boxes in milestone file)
3. **Test**: `pnpm test` frequently
4. **End session**: Run `/end-session` to record progress

### Key rules:
- Test-first: write test stubs before implementation
- Commit every phase: don't accumulate changes
- Update spec: if you discover spec needs changes, note it
- Stay in your track: don't touch files that belong to other tracks
```

### Step 7: First Task Suggestion

Based on the chosen track, suggest the first concrete task:

1. Read the track's task list from the milestone file
2. Identify the first unchecked `[ ]` task
3. Read any related spec files for that task
4. Suggest: "Your first task is: {task description}. Start by reading {spec files}."

## Output Summary

```
## Onboarding Complete!

**Project**: Inxtone — AI-Native Storytelling Framework
**Your track**: {track} ({branch})
**Worktree**: {path if created}
**First task**: {suggested task}

### Quick reference
- Run tests: `pnpm test`
- Start session: `/start-session`
- End session: `/end-session`
- Spec routing: `spec/Meta.md`
- Your milestone: `spec/Milestone/{file}.md`
- Your regulations: `spec/Core/Regulation/Meta.md`

You're ready to go! Run `/start-session` to begin.
```

## Constraints

- This skill is **mostly read-only** — it only writes when setting up git config or creating branches
- Do not run `pnpm install` if `node_modules/` already exists and looks fresh
- If build or tests fail during setup, report the issue clearly — the onboardee needs to fix their environment before starting
- Keep the orientation concise — don't dump entire spec files, summarize key points
- Always recommend `/start-session` as the next step after onboarding
