---
allowed-tools: Bash(git:*), Bash(awk:*), Bash(wc:*), Bash(grep:*), Bash(print:*)
argument-hint: [all|staged|<files>]
description: Create a git commit with smart file selection
---

<ultrathink />

## Context

- Current branch: !`git branch --show-current`
- Branch protection: !`git branch --show-current | grep -E '^(main|master)$' && echo "Protected branch" || echo "Safe to commit"`
- Current git status: !`git status --short`
- Staged changes: !`git diff --cached --stat --stat-count=15`
- Unstaged changes: !`git diff --stat --stat-count=15`
- Total changes: !`git status --porcelain | wc -l | awk '{print $1" files modified"}'`
- Recent commits (for style reference): !`git log --oneline -3`

## Steps

1. **Pre-commit validation**:
   - Skip redundant checks: Use context information above directly
   - If "Protected branch": Ask user to switch to feature branch first
   - Ensure no sensitive data (API keys, secrets) in changes
   - Check for obvious errors or incomplete changes
2. **Smart file selection**:
   - If `$ARGUMENTS` is `all`: Stage and commit all changes
   - If `$ARGUMENTS` contains `staged`: Commit staged changes
   - If `$ARGUMENTS` contains files: Stage and commit those files
   - If `$ARGUMENTS` is empty: Intelligently select modified files
3. **Create commit**:
   - Generate commit message following gitmoji convention
   - Format: `<gitmoji> <type>(<scope>): <description>`
   - Keep first line under 50 characters
   - Execute git commit with the generated message
4. **Output confirmation**:
   - Display final commit hash and message
