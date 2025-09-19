# CLAUDE.md

This is the user level guide for Claude Code.

## 🚨 Common Mistakes When Answering Questions

**Core Principle**: Never reflexively agree or automatically implement user suggestions without independent analysis.

Here are specific scenarios:

### When I point out mistakes or disagree with your approach

**ABSOLUTELY FORBIDDEN**:

- Never respond with "你说得对!" or "你说的说得完全正确!" etc. sycophantic behavior
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

- Use Chinese for conversation and todo lists
- Prefer English for coding, eg: code comments, ui text, commit message, pr description, etc.
- You can call me `靖哥`

## 💻 Development Environment

- I use claude code within the integrated terminal of cursor IDE
- You can safely use the vscode mcp tools because cursor is the fork of vscode

## 🔧 Tool Preferences

**Note**: I have already installed all the tools mentioned below, they are ready to use.

### Package & Script Management

- `ni` → npm install
- `bun run` → npm run
- `bunx` → npx
- `tsx` → run TypeScript file directly

### Bash Tools

- `rg` → ALWAYS use instead of `grep`
- Use `jq` to query large json and jsonl files

### Web Search

- `WebSearch` → search latest web content
- `mcp__SearXNG__search` → comprehensive multi-engine search when WebSearch is insufficient

**Note**: Include "2025" in search keywords for latest information

### GitHub Contents

**Mandatory**: use `gh` to fetch/edit github issue, pr, discussion body and comments, instead of `WebFetch` tool

get issue comments strategies:

- by reactions (most helpful): `gh api repos/owner/repo/issues/123/comments --paginate | jq 'sort_by(-.reactions.total_count) | .[0:3]'`
- by time (latest + earliest): `jq 'sort_by(.created_at) | .[0:3], .[-3:]'`

**important**: When submit new issue/pr, be sure to read and follow the related template

### Docs Search

- `context7` → get latest usage when installing new packages
- `mcp__grep__searchGitHub` → search API usage patterns across GitHub

### TypeScript Validation

- `mcp__vscode-mcp__get_diagnostics` → validate single TS file (fast)
- Never use `tsc --noEmit single-file.ts`, it will validate entire project, very slow

### VSCode MCP Tools

- use `mcp__vscode-mcp__get_references` to find the symbol usages and determine the scope of refactoring, instead of `Grep` and `Search`
- use `mcp__vscode-mcp__rename_symbol` to rename a symbol, instead of `Edit` tool
- prefer `mcp__vscode-mcp__execute_command` run `editor.action.fixAll` command over `Bash(eslint --fix)` to auto-fix ESLint and other linter errors

### Builtin `Read` Tool

**Mandatory**: Always read the entire file content instead of partial selections to save tokens and avoid context contamination in the following cases:

- When I provide the file path in the user message
- When I send you partial file content snippets
- When reading a file for the first time
- When the file is known to be less than 500 lines

Remember: Your context window is very large, so don't worry about token costs when reading complete files. Getting sufficient and accurate context information is more important than token efficiency.

## 📝 Output Style

- State the core conclusion or summary first, then provide further explanation.
- When referencing specific code, always provide the corresponding file path.

### Terminal Output Formatting

Consider terminal rendering constraints when formatting markdown output:

#### Terminal Info

- Chinese characters/symbols: 2 units width
- English characters/symbols: 1 unit width
- Terminal uses monospace font with unknown width limits

#### Table Formatting

**Mandatory**: Use code blocks instead of markdown tables because Claude's code doesn't support markdown tables and mermaid rendering.

- Use left alignment for all columns
- Add two spaces padding on both sides of each cell content

✅ **Good Example:**

```plaintext
+------+---------+---------+
|  ID  |  Name   |  Role   |
+------+---------+---------+
|  1   |  Alice  |  Admin  |
|  2   |  Bob    |  User   |
+------+---------+---------+
```

❌ **Bad Example (DO NOT USE):**

```markdown
| ID  | Name  | Role  |
| --- | ----- | ----- |
| 1   | Alice | Admin |
| 2   | Bob   | User  |
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

**🔗 References:**

- `resolveFilePath`: packages/vscode-mcp-bridge/src/utils/workspace.ts:40
- VSCode undo limitation: https://github.com/microsoft/vscode/issues/77190
```

## 💭 Code Comments

### Must comment scenarios

- Complex business logic or algorithms
- Special behaviors
- Important design decisions and trade-offs

### Comment Principles

- **Comment WHY, not WHAT, not CHANGELOG** - Write valuable comments, not noise
- **Update comments when modifying code** - outdated comments are worse than no comments
- **JSDoc instead of line comments** - better IDE hover suggestions
- Provide high-level overview for complex functions, comment each step clearly in the function body
- Add space between Chinese and English words for better readability
- Don't add comment for deleted old code

**Quality test**: Ask yourself: "What useful information would a new colleague get from this comment in 6 months?" If the answer is "nothing", delete it.

```typescript
/**
 * Processes payment request with multi-step validation
 */
function processPayment(request: PaymentRequest) {
  // 1. Data validation
  // some code...
  // 2. Risk assessment (low/medium/high handling)
  // some code...
  // 3. Payment gateway call
  // some code...
  // 4. User notification
  // some code...
}

/* ❌ Budget枚举类型 */
/* ✅ Budget 枚举类型 */
export enum BudgetType {
  Free = 'free',
  /** ✅ use jsdoc */
  Package = 'package', // ❌ instead of line comments
}
```

## 📋 Edit Markdown Requirements

- Don't leave code block language empty, use `plaintext` instead
- Always add one blank line after headings

## 🛠️ Development Guidelines

### Core Coding Principles

- Write clean, readable, reusable, efficient and testable code
- Prioritize stability and maintainability over performance optimization
- Favor incremental changes over large refactors; when major refactoring is necessary, raise the issue and discuss with me first
- Prefer well-supported and reliable cutting-edge APIs for isolated, standalone new features
- Extract reusable functions, types, or modules to eliminate code duplication while avoiding large-scale refactoring
- When facing uncertainty, explicitly output your assumptions, trade-offs, and validation plan rather than making assumptions
- Trust agreed prerequisites and avoid defensive coding against promised invariants; if conflicts arise, update the plan rather than add unnecessary guards.
- Premature optimization is the root of all evil - implement functionality with simple, direct code first, then optimize when needed (avoid adding caching/debouncing upfront or splitting into multiple files prematurely)

### Development Lifecycle Guide

_For complete feature development and requirement implementation:_

**Planning**:

- [ ] Read relevant template files and surrounding code to understand existing patterns
- [ ] Prioritize documentation and existing solution search (WebSearch + context7)
- [ ] Verify the answer by reading the actual code implementation
- [ ] Understand requirements, think step by step
- [ ] create todo list

**Implementation**:

- [ ] Maintain code consistency: read template files, adjacent similar files, and surrounding code to understand existing patterns before making changes
- [ ] Fail fast: expose errors early, ensure clear API behavior, and make callers take appropriate responsibility
- [ ] Maximize aesthetic and interaction design within requirement constraints for frontend UI

**Acceptance**:

- [ ] Verify the implementation by tests or temp nodejs test scripts
- [ ] Review implementation after multiple modifications to the same code block
- [ ] Run quality checks
- [ ] Update the relevant documentation if exists

**Output Working Summary**:

- [ ] Review output formatting requirements
- [ ] List deviations from the original plan and key decisions made during implementation for manual review of unplanned issues
- [ ] Provide optimization suggestions
- [ ] Provide complete reference links

### Problem Solving Methodology

_When encountering specific technical issues, bugs, or implementation blockers:_

**Standard Process**:

1. **Independent Analysis** → 2. **Documentation/Search Research** → 3. **Implementation** → 4. **Verification**

**Failure Handling**:

- After 3 failed attempts → Add debug logging → Request runtime logs
- New feature implementation repeatedly encounters problems → Consider complete rewrite or seek assistance

**Example Scenarios**:

- ❌ Continue with 3+ consecutive failed modifications → Keep trying blindly
- ✅ Continue with 3+ consecutive failed modifications → Add detailed logging, analyze root cause

### 🚨 Forbidden Behaviors

- For eslint warning level and cspell suggestion level error that are not actual issues, ignore them
- **MANDATORY**: Wait for explicit request before:
  - Running `git commit`, `git push`
  - Starting dev server (`npm dev`, `next dev`, etc.)
  - Creating new test files (implementation should be manually reviewed by myself first)
