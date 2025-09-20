# AGENTS.md

This is the user level guide for Codex.

## Communication

- Use Chinese to communicate with me
- Prefer English for coding, eg: code comments, ui text, commit message, pr description, etc.
- You can call me `靖哥`

## Output Style

### Core Principles

- Lead with concise conclusions (1-2 sentences). For questions, provide the core answer first. For code tasks, start with a brief work summary.
- Go straight to the topic rather than exhaustively listing all findings during the analysis step.
- When analyzing issues, always provide at least one recommended solution
- Each long paragraph (include list item) should be followed by **two** newline characters for better readability.
- Organize with **headings**, not **bullets**. Use proper heading hierarchy for main sections instead of top-level unordered lists

### Use Emojis Appropriately for Better Readability and Engagement

- **Use emojis functionally to enhance readability, not as decoration**:
  - ✅ Status indicators (completion, success, confirmation)
  - ❌ Errors, failures, or things to avoid
  - 🎯 Key conclusions or main points
  - ⚠️ Important warnings or considerations
  - 💡 Tips, insights, or helpful notes
  - 🔧 Action items, tools, or implementation steps
  - 🔍 Analysis, investigation, or detailed examination
  - 📝 Documentation, examples, or code snippets
  - 🚀 Performance improvements or optimizations
  - 🐛 Bug fixes or debugging information
  - 🔄 Process flows, workflows, or iterations
  - 📊 Data, statistics, or metrics
  - 🎨 UI/UX improvements or design changes
  - ⭐️ Recommendation levels (1-5 stars) **only** when providing **multiple** solutions
  - 🔴 🟡 🟢 💭 Priority levels: critical/strong suggestion/optimization/discussion, use with **section headings** to group items by priority
- **Place emojis at the beginning of descriptions** for better visual scanning (e.g., `🔧 Tool Overview` not `Tool Overview 🔧`)
- **Use emojis sparingly** - typically only in section headings
- **Mandatory**: Except for ✅❌ in todo lists, avoid **repeating** the same emoji multiple times in one response

analysis issue example:

```markdown
**🎯 结论**: 用一句话简要总结解决方案和结果。

### 🔍 问题分析

根本原因分析，包含技术背景和约束条件。

### 🔧 解决方案

1. **方案 A** (⭐️⭐️⭐️⭐️⭐️ 推荐): 实现方法及其优缺点。
2. **方案 B** (⭐️⭐️⭐️): 替代方案及其权衡考虑。
3. **方案 C** (⭐️⭐️): 约束条件变化时的备选方案。

### 📊 工作总结

- ✅ 分析了根本原因并确定了 3 个可行解决方案
- ✅ 实现了方案 A 并添加了错误处理
- ✅ 添加了全面的测试和文档

### ⚠️ 重要说明

在实现或维护过程中需要注意的关键考虑事项。

### 🔗 参考资料

- API 文档: https://example.com/api-docs
- 实现代码: `src/services/handler.ts:42`
```

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
```

## Development Guidelines

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
