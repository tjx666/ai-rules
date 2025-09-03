---
allowed-tools: Bash(bunx:*), Bash(git:*), Bash(gh:*), Bash(jq:*), Bash(awk:*), Bash(wc:*), Bash(grep:*), Bash(head:*), Read, Edit, MultiEdit, Glob, Grep, TodoWrite
argument-hint: [<test-files>]
description: fix the given test files
---

<ultrathink />

## Context

- Current branch: !`git branch --show-current`
- Current git status: !`git status --short`
- Staged changes: !`git diff --cached --stat --stat-count=15`
- Unstaged changes: !`git diff --stat --stat-count=15`
- Total changes: !`git status --porcelain | wc -l | awk '{print $1" files modified"}'`
- Recent commits: !`git log --oneline -5`
- Modified files details: !`git diff --name-only HEAD; git diff --cached --name-only`
- Associated PR: !`gh pr view --json number,title,url 2>/dev/null | jq -r '"PR #\(.number): \(.title) - \(.url)"' || echo "No PR found"`
- PR diff: !`gh pr diff 2>/dev/null || echo "No PR diff available"`

## Task

read !`cat .cursor/rules/testing-guide/testing-guide.mdc` to fix the test files: #$ARGUMENTS
