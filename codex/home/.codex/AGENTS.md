# AGENTS.md

This is the user level guide for Codex.

## Communication

- Use Chinese to communicate with me
- Prefer English for coding, eg: code comments, ui text, commit message, pr description, etc.
- You can call me `靖哥`

## Code Comments

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

// ❌ Bad: Change-oriented comments, and even add comment for deleted old code
async function deactivateSubscription(subscriptionId: string) {
  // other front code...
  // New design: Don't delete budget on cancellation, control access via subscription status
}

// ✅ Good: Use `1.`
// 1. step1
// ❌ Bad: Use `1)`
// 1) step1
```

## Development Guidelines

### Core Coding Principles

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

_For complete feature development and requirement implementation:_

**Exploration/Planning**:

- [ ] Read relevant template files and surrounding code to understand existing patterns
- [ ] Prioritize documentation and existing solution search (WebSearch + context7)
- [ ] Verify the answer by reading the actual code implementation
- [ ] Understand requirements, think step by step
- [ ] create todo list

**Implementation/Refactoring/Fixing Bugs**:

- [ ] Maintain code consistency: read template files, adjacent similar files, and surrounding code to understand existing patterns before making changes
- [ ] Fail fast: expose errors early, ensure clear API behavior, and make callers take appropriate responsibility
- [ ] Maximize aesthetic and interaction design within requirement constraints for frontend UI

**Acceptance/Verification**:

- [ ] Verify the implementation by tests or temp nodejs test scripts
- [ ] Review implementation after multiple modifications to the same code block
- [ ] Run quality checks
- [ ] Update the relevant documentation if exists

**Summary/Output**:

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

### Code Quality Checks

- **Use descriptive variable names** - avoid abbreviations like `mo`, `btn`, `el`; prefer `mutationObserver`, `button`, `element`
- Check for missing essential comments and verify comment language consistency
- **Mandatory**: Run `mcp__vscode-mcp__get_diagnostics` after making a series of code changes to check for issues and apply fixes
- **Mandatory**: Run and fix tests after add or modify tests

### 🚨 Forbidden Behaviors

- For eslint warning level and cspell suggestion level error that are not actual issues, ignore them instead of add disable comments
- **MANDATORY**: Wait for explicit request before:
  - Running `git commit`, `git push`
  - Starting dev server (`npm dev`, `next dev`, etc.)
  - Creating new test files (implementation should be manually reviewed by myself first)

## Tool Preferences

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
- use `crwl https://website.com -o markdown` to fetch website content instead of `curl` for better LLM friendly output

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
- use `mcp__vscode_get_symbol_lsp_info` to get symbol type information, especially useful when you need to define a parameter type but are unsure of the exact type
