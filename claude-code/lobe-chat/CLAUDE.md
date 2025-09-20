# CLAUDE.md

This is the user level guide for Claude Code.

## 💬 Communication

- Use Chinese for conversation and todo lists
- Prefer English for coding, eg: code comments, ui text, commit message, pr description, etc.
- You can call me `靖哥`

## 💻 Development Environment

- I use claude code within the integrated terminal of cursor IDE
- You can safely use the vscode mcp tools because cursor is the fork of vscode

## 📝 Output Style

- State the core conclusion or summary first, then provide further explanation.
- When referencing specific code, always provide the corresponding file path.

### Terminal Output Formatting

**Mandatory**: Use code blocks instead of markdown tables because Claude's code doesn't support markdown tables and mermaid rendering.

- Use left alignment for all columns
- Chinese characters width is double than English characters

example:

```plaintext
+------+---------+---------+
|  ID  |  Name   |  Role   |
+------+---------+---------+
|  1   |  Alice  |  Admin  |
|  2   |  Bob    |  User   |
+------+---------+---------+
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

### Core Principles

#### Universal Principles

- Prioritize stability and maintainability over performance optimization
- When facing uncertainty, explicitly output your assumptions, trade-offs, and validation plan rather than making assumptions
- Trust agreed prerequisites and avoid defensive coding against promised invariants; if conflicts arise, update the plan rather than add unnecessary guards.
- Conservative approach for refactoring existing code, modern approaches for new features
- Premature optimization is the root of all evil - implement functionality with simple, direct code first, then optimize when needed (avoid adding caching/debouncing upfront or splitting into multiple files prematurely)

#### When implement new features

- Write clean, readable, reusable, efficient and testable code
- Prefer well-supported and reliable cutting-edge APIs
- Extract reusable functions, types, or modules to eliminate code duplication while avoiding large-scale refactoring

#### When Refactoring or fixing bugs

- Favor incremental changes over large refactors; when major refactoring is necessary, discuss the refactoring scope beforehand
- Preserve original code structure during refactoring - avoid over-abstraction to minimize risk of introducing bugs or behavior changes

### Development Lifecycle Guide

**Exploration/Planning**:

- [ ] Understand requirements, think step by step
- [ ] Prioritize documentation and existing solution search (WebSearch + context7)
- [ ] Verify the answer by reading the actual code implementation
- [ ] create todo list

**Implementation/Refactoring/Fixing Bugs**:

- [ ] Read relevant template files and surrounding code to understand existing patterns
- [ ] Fail fast: throw errors for invalid inputs/states instead of silently handling them with fallback logic, expose problems early to the caller
- [ ] Maximize aesthetic and interaction design within requirement constraints for frontend UI

**Acceptance/Verification**:

- [ ] Verify the implementation by tests or temp nodejs test scripts
- [ ] Review implementation after multiple incremental modifications to the same code block - consider if the changes can be refactored into a single, more coherent modification
- [ ] Run quality checks
- [ ] Update the relevant documentation if exists

**Summary/Output**:

- [ ] Review output formatting requirements
- [ ] List deviations from the original plan and key decisions made during implementation for manual review of unplanned issues
- [ ] Provide optimization suggestions
- [ ] Provide complete reference links at end of output

### How to handle hard problems

**Definition**: Problems that remain unsolved after two attempts

**Useful approaches**:

- Try web search for solutions
- Add debug logging → request runtime logs, use pair programming to troubleshoot
- Consider complete rewrite or seek assistance when implementing new features

### Code Quality Checks

- **Use descriptive variable names** - avoid abbreviations like `mo`, `btn`, `el`; prefer `mutationObserver`, `button`, `element`
- Check for missing essential comments and verify comment language consistency
- **Mandatory**: Run `mcp__vscode-mcp__get_diagnostics` after making a series of code changes to check for issues and apply fixes
- **Mandatory**: Run and fix tests after add or modify tests

### How to handle lint errors

- For eslint warning level and cspell suggestion level error that are not actual issues, ignore them instead of add disable comments
- Lint tools can produce false positives; evaluate warnings based on business context and explicitly state when fixes aren't needed

### Forbidden Operations

Wait for explicit request before:

- Running `git commit`, `git push`
- Starting dev server (`npm dev`, `next dev`, etc.)
- Creating new test files (implementation should be manually reviewed by myself first)

## 🔧 Tool Preferences

**Note**: I have already installed all the tools mentioned below, they are ready to use.

### Package & Script Management

- `ni` → npm install
- `bun run` → npm run
- `bunx` → npx
- `tsx` → run TypeScript file directly

### Bash Tools

- ALWAYS use `rg` instead of `grep`
- Use `jq` to query large json and jsonl files
- Use `ls -F ./relative/path` instead of `ls -la /absolute/path` to list files in a folder for fewest tokens cost
- Use `tree` command for example `tree -F -L 2 ./relative/path` to get directory tree structure

### Web Search

- `WebSearch` → search latest web content
- `mcp__SearXNG__search` → comprehensive multi-engine search when WebSearch is insufficient

**Note**: Include "2025" in search keywords for latest information

### GitHub Contents

**Mandatory**: use `gh` to fetch/edit github issue, pr, discussion body and comments, instead of `WebFetch` tool

get issue comments strategies:

- by reactions (most helpful): `gh api repos/owner/repo/issues/123/comments --paginate | jq 'sort_by(-.reactions.total_count) | .[0:3]'`
- by time (latest + earliest): `jq 'sort_by(.created_at) | .[0:3], .[-3:]'`

**important**: When submit new issue/pr, be sure to read and follow the related template under `.github`

### Docs Search

- `context7` → get latest usage when installing new packages
- `mcp__grep__searchGitHub` → search API usage patterns across GitHub

### Lint Checks

- use `mcp__vscode-mcp__get_diagnostics` to get typescript and eslint errors
- Never use `tsc --noEmit single-file.ts`, it will validate entire project, very slow

### VSCode MCP Tools

- use `mcp__vscode-mcp__get_references` to find the symbol usages and determine the scope of refactoring, instead of `Grep` and `Search`
- use `mcp__vscode-mcp__rename_symbol` to rename a symbol with import path and reference auto updates, instead of `Search` and `Edit`
- use `mcp__vscode-mcp__execute_command` with `editor.action.fixAll` command to auto-fix linter errors, instead of running `eslint --fix` in shell
- use `mcp__vscode_get_symbol_lsp_info` to get symbol type information, especially useful when you don't know how to define function parameters or return types
