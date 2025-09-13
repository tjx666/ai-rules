---
allowed-tools: Bash(git:*), Bash(awk:*), Bash(wc:*), Bash(grep:*), Bash(print:*)
argument-hint: [all|staged|<files>]
description: Create a git commit with smart file selection
model: claude-sonnet-4-0
---

<ultrathink />

## Context

- Current branch: !`git branch --show-current`
- Branch protection: !`git branch --show-current | grep -E '^(main|master)$' && echo "Protected branch" || echo "Safe to commit"`
- Current git status: !`git status --short`
- Staged changes: !`git diff --cached --stat --stat-count=15`
- Unstaged changes: !`git diff --stat --stat-count=15`
- Total changes: !`git status --porcelain | wc -l | awk '{print $1" files modified"}'`
- Recent commits (for style reference): !`git log --oneline -5`
- Modified files details: !`git diff --name-only HEAD; git diff --cached --name-only`
- File change summary: !`git diff --stat HEAD; git diff --cached --stat`
- Has untracked files: !`git ls-files --others --exclude-standard | wc -l | awk '{if($1>0) print "Yes ("$1" files)"; else print "No"}'`
- Working tree status: !`git status --porcelain | head -10`
- Last commit info: !`git log -1 --pretty="format:%h %s (%an, %ar)"`

## Steps

1. **Pre-commit validation**:
   - **Use context directly**: Skip redundant git commands - all info is in context above
   - **Protected branch check**: If "Protected branch" detected, ask user to switch to feature branch first

2. **Smart file selection** (based on `$ARGUMENTS`):
   - `all` → Stage and commit all unstaged + untracked files
   - `staged` → Commit only currently staged files (no additional staging)
   - `<files>` → Stage specified files and commit
   - _empty_ → Intelligently stage all modified files (exclude untracked unless obvious)

3. **Analyze commit scope**:
   - **Check independence**: Multiple unrelated changes that don't touch same files → suggest splitting
   - **Keep atomic**: Related changes across multiple files → single commit

4. **Generate commit message**:
   - **Analyze changes**: Use file change summary from context to understand what changed
   - **Follow gitmoji convention**: `<gitmoji> <type>(<scope>): <description>`
   - **Common patterns**:
     - ✨ feat: new features
     - 🐛 fix: bug fixes
     - ♻️ refactor: code restructuring
     - 💄 style: UI/styling changes
     - 📝 docs: documentation
     - ✅ test: test changes
     - 🔧 chore: build/config changes
   - **Reference recent commits**: Match style/tone from recent commits in context
   - **Keep concise**: First line under 50 chars, clear and descriptive
   - **Add body when needed**: For complex changes, add explanation after blank line

5. **Execute commit**:
   - Use `git commit -m "$(cat <<'EOF'\n[message]\nEOF\n)"` format for proper escaping
   - Handle pre-commit hooks gracefully (don't fail on hook warnings)
   - Show concise success confirmation in format:
     ```plaintext
     [branch-name]: [commit-hash]\n
     [commit message]\n
     N file(s) changed, X insertions(+), Y deletions(-)
     ```
   - Summary your work
