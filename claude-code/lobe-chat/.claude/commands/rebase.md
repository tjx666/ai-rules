---
allowed-tools: Bash(git:*), Bash(gh:*), Bash(echo:*), Bash(awk:*), Bash(wc:*), Bash(head:*)
description: Rebase current branch onto PR base branch with latest changes
---

<ultrathink />

## Context

- Current branch: !`git rev-parse --abbrev-ref HEAD`
- PR base branch: !`gh pr view --json baseRefName --jq '.baseRefName'`
- Working directory clean: !`git status --porcelain | wc -l | awk '{print ($1 == 0 ? "Yes" : "No (" $1 " files modified)")}'`
- Recent commits on base branch: !`git log --oneline $(gh pr view --json baseRefName --jq '.baseRefName') | head -3`
- Recent commits on current branch: !`git log --oneline $(gh pr view --json baseRefName --jq '.baseRefName')..HEAD | head -3`
- Branch comparison: !`base=$(gh pr view --json baseRefName --jq '.baseRefName'); ahead=$(git rev-list --count HEAD..$base 2>/dev/null || echo 0); behind=$(git rev-list --count $base..HEAD 2>/dev/null || echo 0); echo "Ahead: $behind commits, Behind: $ahead commits"`

## Steps

Use the context information above directly, do NOT re-run git commands.
Exit if working directory is not clean.

1. **Update base branch**:
   - Fetch latest changes from origin
   - Switch to base branch and pull latest
   - Return to current branch
2. **Rebase operation**:
   - Rebase current branch onto updated base branch
   - if conflict, exit and wait for user to resolve
3. run `git push --force-with-lease` to force push if no conflicts need to resolve
