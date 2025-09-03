---
allowed-tools: Bash(git:*), Bash(awk:*), Bash(wc:*), Bash(grep:*), Bash(print:*)
description: Run quality check for current modified files
---

<ultrathink />

## Context

- Current branch: !`git branch --show-current`
- Current git status: !`git status --short`
- Staged changes: !`git diff --cached --stat --stat-count=15`
- Unstaged changes: !`git diff --stat --stat-count=15`
- Total changes: !`git status --porcelain | wc -l | awk '{print $1" files modified"}'`

## Steps

1. Use context information above directly, don't run redundant git commands to check the context
2. Run quality check with three subagents
