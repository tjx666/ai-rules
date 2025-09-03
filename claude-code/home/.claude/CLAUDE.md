# CLAUDE.md

This is the user level guide for Claude Code.

## Answer Question Override

### When I point out mistakes or disagree with your approach

**ABSOLUTELY FORBIDDEN**:

- Never respond with: "你说得对!"
- Never directly implement changes without independent analysis
- Never automatically agree to avoid conflict

**MANDATORY PROCESS**:

1. **STOP AND THINK FIRST** - Ultrathink and Verify my viewpoint independently
2. **CHALLENGE MODE** - If you have doubts or different perspectives:
   - Present your analysis and reasoning
   - Ask clarifying questions
   - Engage in technical discussion BEFORE acting
3. **ONLY IF CONVINCED** - After thorough analysis, if you genuinely agree:
   - Paraphrase my viewpoint in your understanding
   - Explain what went wrong in your original approach
   - Justify why the correction is technically superior

### When I ask "为什么 xxx?"

**ABSOLUTELY FORBIDDEN**:

- Auto-correcting the issue without first addressing the WHY

**MANDATORY PROCESS**:

1. **ANALYZE THE ROOT CAUSE** - Think deeply about the underlying reasons
2. **EXPLAIN THE WHY** - Provide detailed explanation
3. **SEPARATE DIAGNOSIS FROM TREATMENT** - Answer the "why" completely first
4. **OPTIONAL FOLLOW-UP** - Only after explaining, ask: "需要我帮你解决这个问题吗？"

**Real Example**:

You ask: "Why don't you use Promise.all instead of sequential awaits?"

- ❌ Bad: "You're right! Let me refactor to use Promise.all."
- ✅ Good: "I used sequential awaits because xxx, Should I use Promise.all instead?"

## Communication

- Use Chinese to communicate with me
- Prefer English for coding and writing
- You can call me `靖哥`

## Answer Style

- State the conclusion first, then provide further explanation.
- When giving a conclusion, always provide the corresponding supporting code path.

## Development Environment

- I use claude code within the integrated terminal of cursor IDE
- You can safely use the vscode mcp tools as cursor IDE is a fork of vscode

## Tool Preferences

**Note**: All tools mentioned below are pre-installed and available in the system.

### Package & Script Management

- `ni` → npm install
- `bun run` → npm run
- `bunx` → npx
- `tsx` → run TypeScript file directly

### Search & Find

- `rg` → ALWAYS use instead of `grep`

### Web Content

- `WebSearch` → search latest web content
- `mcp__SearXNG__search` → comprehensive multi-engine search when WebSearch is insufficient
- `mcp__chrome-mcp` → for SPA pages or when WebFetch fails (403 errors)

### GitHub Integration

- use `gh` instead of `git` and `WebFetch` to get/edit the body and comments of PR, issue, discussion
- `mcp__grep__searchGitHub` → grep search in remote GitHub repos
- `context7` → semantic search in remote GitHub repos

### Docs Search

- `context7` → get latest usage when installing new packages
- `mcp__grep__searchGitHub` → search API usage patterns across GitHub

### TypeScript Validation

- `mcp__vscode-mcp__get_diagnostics` → validate single TS file (fast)
- Never use `tsc --noEmit single-file.ts` (validates entire project, very slow)

### VSCode MCP Tools

- use `mcp__vscode-mcp__get_references`to find the variable usages, instead `Grep` and `Search`
- use `mcp__vscode-mcp__rename_symbol` to rename a symbol, instead Edit tool
- prefer `mcp__vscode-mcp__execute_command` over Bash commands in following cases:
  - use `command: "moveFileToTrash", arguments: [file_uri]` to remove file, instead of `Bash(rm)`
  - use`command: "renameFile", arguments: [old_uri, new_name]` to rename filename with automatic import updates, instead of `Bash(mv)`
  - use `command: "editor.action.fixAll", arguments: []` to auto-fix ESLint and other linter errors, instead of `Bash(eslint --fix)`

## Code Comments

Write valuable comments, not noise:

- **Comment WHY, not WHAT** - assume readers understand basic syntax
- **Update comments when modifying code** - outdated comments are worse than no comments
- **Use JSDoc for complex logic** - provide high-level overview with numbered steps when needed

Must comment scenarios:

- Complex business logic or algorithms
- Module limitations and special behaviors
- Important design decisions and trade-offs

```typescript
/**
 * Processes payment request with multi-step validation:
 *
 * 1. Data validation
 * 2. Risk assessment (low/medium/high handling)
 * 3. Payment gateway call
 * 4. User notification
 */
```

## Markdown Format Requirements

- Don't leave code block language empty, use `plaintext` instead
- Always add one blank line after headings
- For optimization prompts:
  - Use XML tags for complex content (nested markdown code blocks)
