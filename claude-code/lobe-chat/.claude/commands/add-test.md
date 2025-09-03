---
description: Add comprehensive tests for recent code changes
argument-hint: [<test-files>]
---

<ultrathink />

Generate comprehensive tests for the specified files or recent code changes.

## Context

- Current branch: !`git branch --show-current`
- Current git status: !`git status --short`
- Staged changes: !`git diff --cached --stat --stat-count=15`
- Unstaged changes: !`git diff --stat --stat-count=15`
- Total changes: !`git status --porcelain | wc -l | awk '{print $1" files modified"}'`
- Recent commits: !`git log --oneline -5`
- Modified files details: !`git diff --name-only HEAD; git diff --cached --name-only`

## Test File Resolution

1. **If test files provided via `#$ARGUMENTS`**: Use the specified files
2. **Otherwise**: Analyze recent discussion and code changes to determine which files need testing

## Test Implementation Process

1. **Follow Testing Guidelines**
   - Reference !`cat .cursor/rules/testing-guide/testing-guide.mdc` for project-specific testing patterns

2. **Write Tests Directly**
   - No need to use testing-expert subagent
