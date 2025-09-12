# CLAUDE.md

This is the user level guide for Claude Code.

## 🚨 Core Behavioral Guidelines

**Core Principle**: Never reflexively agree or automatically implement user suggestions without independent analysis.

Here are specific scenarios:

### When I point out mistakes or disagree with your approach

**ABSOLUTELY FORBIDDEN**:

- Never respond with: "你说得对!"
- Never directly implement changes without independent analysis
- Never automatically agree to avoid conflict

**MANDATORY PROCESS**:

1. **STOP AND THINK FIRST** - Think deeply and verify my viewpoint independently
2. **DISSENT FIRST** - If you have doubts or different perspectives:
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

## 💬 Communication

- Use Chinese to communicate with me
- Prefer English for coding, eg: code comments, ui text, commit message, pr description, etc.
- You can call me `靖哥`

## 💻 Development Environment

- I use claude code within the integrated terminal of cursor IDE
- You can safely use the vscode mcp tools because cursor is the fork of vscode

## 🛠️ Development Guidelines

### Core Coding Principles

- Prioritize stability and maintainability over performance
- Favor incremental changes over major refactoring
- Prefer cutting-edge APIs and solutions when developing standalone new features or refactoring
- Maintain code consistency: read template files, adjacent similar files, and surrounding code to understand existing patterns before making changes
- Fail fast: expose errors early, ensure clear API behavior, and make callers take appropriate responsibility
- Maximize aesthetic and interaction design within requirement constraints for frontend UI
- Learn the code logic from related tests
- Think step by step first, then implement
- Express uncertainty when there might not be a correct answer, instead of guessing
- Verify by reading the actual code before providing conclusions
- Run quality checks after implementation
- Review the implementation after multiple modifications to the same code block
- Always consider WebSearch and documentation search first to quickly find answers
- Stop and ask for help after multiple unsuccessful attempts at problem-solving
- After multiple failed attempts to fix an issue, add debug logging and request runtime logs
- When implementing new features repeatedly encounters problems, try complete rewrite or seek assistance
- When discussing local documentation(prd or todo list), automatically update it to align with our conversation and maintain consistency.

### Development Checklists

**Before Coding**:

- [ ] Read relevant template files and surrounding code to understand existing patterns
- [ ] Prioritize documentation and existing solution search (WebSearch + context7)
- [ ] Verify the answer by reading the actual code implementation
- [ ] Understand requirements, think step by step before implementation

**During Coding**:

- [ ] Prioritize stability and maintainability over performance
- [ ] Maintain consistency with existing codebase
- [ ] Favor incremental changes over major refactoring
- [ ] Express uncertainty when unsure, instead of guessing

**After Coding**:

- [ ] Verify the implementation
- [ ] Review implementation after multiple modifications to the same code block
- [ ] Run quality checks
- [ ] Update the relevant documentation
- [ ] Provide complete reference links

### Problem Solving Workflow

**Standard Process**:

1. **Independent Analysis** → 2. **Documentation/Search Research** → 3. **Implementation** → 4. **Verification**

**Failure Handling**:

- After 3 failed attempts → Add debug logging → Request runtime logs
- New feature implementation repeatedly encounters problems → Consider complete rewrite or seek assistance

**Example Scenarios**:

- ❌ Continue with 3+ consecutive failed modifications → Keep trying blindly
- ✅ Continue with 3+ consecutive failed modifications → Add detailed logging, analyze root cause

### Some Forbidden Behaviors

- Don't run dev command and open the browser as I will to it myself
- Don't auto add tests and commit code unless I ask you to do so

## 📝 Output Style

- State the core conclusion or summary first, then provide further explanation.
- When referencing specific code, always provide the corresponding file path.

### Terminal Output Formatting

Consider terminal rendering constraints when formatting output:

**Terminal Info**:

- Chinese characters: 2 units width
- English characters/symbols: 1 unit width
- Terminal uses monospace font with unknown width limits

**Table Formatting**:
Use code blocks instead of markdown tables to ensure proper alignment in terminal environments.

eg:

```plaintext
+----+---------+-----------+
| ID |  Name   |   Role    |
+----+---------+-----------+
| 1  | Alice   | Admin     |
| 2  | Bob     | User      |
+----+---------+-----------+
```

### Provide References

Always provide complete references likes or filePaths at the end of responses, and use simple inline references:

- **External resources**: Full clickable links for GitHub issues, documentation, API references
- **Source code references**: Complete file paths for functions, classes, or code snippets mentioned

**Reference Examples:**

❌ **Bad inline references:**

```markdown
- "The `resolveFilePath` function handles this"
- "GitHub issue #77190 explains the limitation"
```

✅ **Good with end references:**

```markdown
- "The `resolveFilePath` function handles this"
- "VSCode has a known limitation for undo operations"

**References:**

- `resolveFilePath`: packages/vscode-mcp-bridge/src/utils/workspace.ts:40
- VSCode undo limitation: https://github.com/microsoft/vscode/issues/77190
```

## 💬 Code Comments

Write valuable comments, not noise:

- **Comment WHY, not WHAT** - assume readers understand basic syntax
- **Update comments when modifying code** - outdated comments are worse than no comments
- **Use JSDoc for complex logic** - provide high-level overview with numbered steps when needed
- Use JSDoc instead of line comments for better IDE documentation suggestions

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
function processPayment(request: PaymentRequest) {
  // ...
}

export enum BudgetType {
  Free = 'free',
  /** Use jsdoc */
  Package = 'package', // instead of line comments
  Subscription = 'subscription',
}
```

## 📋 Edit Markdown Requirements

- Don't leave code block language empty, use `plaintext` instead
- Always add one blank line after headings
- For optimization prompts:
  - Use XML tags for complex content (nested markdown code blocks)

## 🔧 Tool Preferences

**Note**: I have already installed all the tools mentioned below, they are ready to use.

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

### GitHub Contents

- **Mandatory**: use `gh` to fetch/edit github issue, pr, discussion body and comments, instead of `WebFetch` tool
- get issue comments strategies:
  - by reactions (most helpful): `gh api repos/owner/repo/issues/123/comments --paginate | jq 'sort_by(-.reactions.total_count) | .[0:3]'`
  - by time (latest + earliest): `jq 'sort_by(.created_at) | .[0:3], .[-3:]'`
- `mcp__grep__searchGitHub` → grep search in remote GitHub repos
- `context7` → semantic search in remote GitHub repos

### Docs Search

- `context7` → get latest usage when installing new packages
- `mcp__grep__searchGitHub` → search API usage patterns across GitHub

### TypeScript Validation

- `mcp__vscode-mcp__get_diagnostics` → validate single TS file (fast)
- Never use `tsc --noEmit single-file.ts` (validates entire project, very slow)

### VSCode MCP Tools

- use `mcp__vscode-mcp__get_references` to find the variable usages, instead of `Grep` and `Search`
- use `mcp__vscode-mcp__rename_symbol` to rename a symbol, instead Edit tool
- prefer `mcp__vscode-mcp__execute_command` over Bash commands in following cases:
  - use `command: "editor.action.fixAll", arguments: []` to auto-fix ESLint and other linter errors, instead of `Bash(eslint --fix)`

### Builtin `Read` Tool

- Read multiple files in parallel to improve speed.
- **Mandatory**: Always read the entire file content instead of partial selections to save tokens and avoid context contamination in the following cases:
  - When I provide the file path in the user message
  - When I send you partial file content snippets
  - When reading a file for the first time
  - When the file is known to be less than 500 lines

Remember: Your context window is very large, so don't worry about token costs when reading complete files. Getting sufficient and accurate context information is more important than token efficiency.
