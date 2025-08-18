---
allowed-tools: Bash(git:*), Bash(gh:*), Bash(jq:*), Bash(wc:*), Bash(awk:*), Bash(sed:*), Bash(echo:*), Base(print:*)
description: Create a PR for the current branch
---

<ultrathink />

## Context

- Branch info: !`git branch --show-current`
- Remote tracking: !`git rev-parse --abbrev-ref @{u} 2>/dev/null || echo "No upstream"`
- Push status: !`git log --oneline origin/main..HEAD 2>/dev/null | wc -l | awk '{if($1>0) print $1" unpushed commits"; else print "All commits pushed"}'`
- PR status: !`gh pr list --head "$(git branch --show-current)" --json number,title,state,url 2>/dev/null | jq -r 'if length == 0 then "No PR created" else .[] | "#\(.number): \(.title) (\(.state)) - \(.url)" end'`
- Default branch: !`git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@refs/remotes/origin/@@' || echo "main"`
- Recent commits (to inspire the pr title): !`git log --oneline -5`
- Change summary: !`git diff --stat --stat-count=20 origin/main..HEAD 2>/dev/null || echo "No diff available"`

## Steps

1. **Skip redundant checks**: Use the context information above directly,
   do NOT re-run git status/log/diff commands
2. **Push if needed**: If commits need pushing, push to remote:
   - If "No upstream": `git push -u origin $(git branch --show-current)`
   - Otherwise: `git push origin $(git branch --show-current)`
3. **Create PR**: Use `gh pr create` with:
   - Title following format: `<gitmoji> <type>(<scope>): <description>`
   - **🚨 Critical**: Body based on @../../.github/PULL_REQUEST_TEMPLATE.md and fill checkboxes
4. After PR created, use `gh pr view --web` to open the PR in browser

## Notes

- **Release impact**: Avoid "fix" or "feat" types unless it's actually a big
  bugfix/feature (triggers releases)
- **Language**: All PR content should be in English
