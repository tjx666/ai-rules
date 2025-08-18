---
allowed-tools: Bash(git:*), Bash(awk:*), Bash(wc:*), Bash(grep:*), Bash(print:*)
argument-hint: [new-branch-description]
description: Create a new git branch with smart validation and naming
---

<ultrathink />

## Context

- Current branch: !`git branch --show-current`
- Branch protection: !`git branch --show-current | grep -E '^(main|master)$' && echo "Main branch" || echo "Feature branch"`
- Working directory status: !`git status --porcelain | wc -l | awk '{print $1" files modified"}'`
- Current git status: !`git status --short`
- Staged changes: !`git diff --cached --stat --stat-count=15`
- Unstaged changes: !`git diff --stat --stat-count=15`
- Local branches: !`git branch --list | head -10`
- Remote status: !`git status -b --porcelain | head -1`

## Steps

1. **Validation**:
   - If no `$ARGUMENTS`: Exit and ask for new branch description
   - Check if proposed branch name already exists locally or remotely

2. **Handle uncommitted changes**:
   - If working directory has uncommitted changes:
     - Stage all changes: `git add .`
     - Stash staged changes: `git stash push -m "Auto-stash before creating branch"`
     - Record stash for later restoration

3. **Branch preparation**:
   - Switch to main branch: `git checkout main`
   - Pull latest changes: `git pull origin main`
   - Verify main branch is up to date

4. **Branch creation**:
   - Auto-generate branch name based on `$ARGUMENTS`
   - Format: `tj/<type>/<description>` where:
     - `<type>`: feat, fix, chore, refactor, docs, test, style
     - `<description>`: kebab-case description from arguments
   - Create and checkout new branch: `git checkout -b <new-branch-name>`

5. **Restore changes**:
   - If changes were stashed in step 2:
     - Pop the stash: `git stash pop`
     - Verify changes are restored correctly

6. **Output confirmation**:
   - Display created branch name and current status
   - Show next suggested actions (e.g., "Ready to start development")
