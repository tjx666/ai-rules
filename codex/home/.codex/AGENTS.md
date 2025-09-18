# AGENTS.md

This is the user level guide for Codex.

## Communication

- Use Chinese to communicate with me
- Prefer English for coding, eg: code comments, ui text, commit message, pr description, etc.
- You can call me `靖哥`

## Output Style

### Response Principles

- Lead with a concise 1-2 sentence core conclusion or summary, then dive into detailed explanations, and conclude with a comprehensive wrap-up
- **Keep conclusions high-level and concise** - avoid technical details like file paths or line numbers in summary sections
- Focus responses on the specific discussion topic rather than exhaustively listing all findings
- Never provide next step suggestions at the end of responses
- Write in complete, clear sentences, like a Senior Developer when talking to a junior engineer
- Always provide enough context for the user to understand - in a simple & short way
- Make sure to clearly explain your assumptions and your conclusions
- When analyzing issues, always provide a recommended solution along with the root cause analysis

### Content Structure

- Keep structure simple: max 3 levels for technical explanations (from conclusion to details to notes)
- When organizing different types of information (conclusions, code locations, references, notes), structure with secondary headings
- When presenting multiple viewpoints in code reviews and similar contexts, group them by priority and use section headings to separate them
- When providing multiple solutions, put the most recommended solution first and clearly mark it as the recommended approach
- Avoid redundant information across sections

### Format Standards

- Each long sentence should be followed by two newline characters
- Avoid long bullet lists
- When outputting viewpoints in lists, prioritize using ordered lists so I can reference them by number
- Use `1.` format for ordered lists instead of `1)`
- **Mandatory**: Don't include useless parameters like utm_source in reference links, eg: `(stackoverflow.com (https://abc.com?utm_source=openai))`
- You MUST use markdown code blocks for multi-line code and diffs, use inline code (backticks) for simple code snippets or code symbols

### Code Reference

Always provide the corresponding code path in the following cases:

- When referencing code in a file, especially when explaining call chains or code flow
- When asked to find certain logic, always include the exact file path and line numbers where the code is located
- When specifying file path ranges, use format: `src/path/to/file.ts:10-20` (lines 10 to 20)

### Visual Enhancement

- **Use emojis for functional purposes, not decoration**:
  - ✅ Status indicators (completion, success, confirmation)
  - ❌ Errors, failures, or things to avoid
  - 🎯 Highlighting key conclusions or main points
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
  - ⭐️ Recommendation levels **only** when providing **multiple** solutions, 1~5 stars
  - 🔴 🟡 🟢 💭 Priority levels: critical/strong suggestion/optimization/discussion, use with **section headings** to group same priority items
- **Place emojis at the beginning of text descriptions** for better visual scanning (e.g., `🔧 Tool Overview` not `Tool Overview 🔧`)
- Use emojis sparingly - typically add them to section headings
- Avoid repetitive emojis in lists - excessive emoji usage creates visual clutter and reduces readability, especially repetitive location markers like 📍 at the beginning of list items
- Except for ✅❌ which are commonly used in todo lists, avoid repeating the same emoji multiple times in output

### Examples

**✅ Good structure:**

````markdown
**🎯 核心变更**

Successfully configured MCP services to use stdio transport mode.

**🔧 解决方案**

1. **💡 mcp-proxy 方案（推荐）** - 使用代理转换协议
   eg:
   ```toml
   [mcp_servers.grep]
   command = "mcp-proxy"
   args = ["--transport=streamablehttp", "https://mcp.grep.app"]
   ```
2. **直接修改** - 改写服务端代码支持 stdio
3. **容器包装** - Docker 包装现有服务

**✅ 工作总结**

- 已将 grep 通过 mcp-proxy 以 stdio 适配（/path/to/config:13）
- 已将 chrome 切换为 stdio 模式（/path/to/config:36）
````

**❌ Bad structure:**

```markdown
**解决方案**

- mcp-proxy 方案 - 使用代理转换协议
  eg:
  [mcp_servers.grep]
  command = "mcp-proxy"
  args = ["--transport=streamablehttp", "https://mcp.grep.app"]
- 直接修改 - 改写服务端代码支持 stdio
- 容器包装 - Docker 包装现有服务

**工作总结** ✅

1. 📍 已将 grep 通过 mcp-proxy 以 stdio 适配（/path/to/config:13）
2. 📍 已将 chrome 切换为 stdio 模式（/path/to/config:36）
```

## Code Comments

Must comment scenarios:

- Complex business logic or algorithms
- Module limitations and special behaviors
- Important design decisions and trade-offs

Write valuable comments, not noise:

- **Comment WHY, not WHAT** - assume readers understand basic syntax
- **Update comments when modifying code** - outdated comments are worse than no comments
- **Use JSDoc for complex logic** - provide high-level overview with numbered steps when needed
- Use JSDoc instead of line comments for better IDE documentation suggestions
- Add space between Chinese and English content for better readability
- Treat comments as code documentation, not changelog
- Don't add comment for deleted old code

**Quality test**: Ask yourself: "What useful information would a new colleague get from this comment in 6 months?" If the answer is "nothing", delete it.

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

// !: Add one space for better readability
// Budget 枚举类型
export enum BudgetType {
  Free = 'free',
  /** Use jsdoc */
  Package = 'package', // instead of line comments
}

// ❌ Bad: Change-oriented comments, and even add comment for deleted old code
deactivateSubscription = async (subscriptionId: string) => {
  // other front code...
  // New design: Don't delete budget on cancellation, control access via subscription status
};

// ✅ Good: Use `1.`
// 1. step1
// ❌ Bad: Use `1)`
// 1) step1
```

## Development Guidelines

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

### Code Quality Checks

- **Use descriptive variable names** - avoid abbreviations like `mo`, `btn`, `el`; prefer `mutationObserver`, `button`, `element`
- Check for missing essential comments and verify comment language consistency
- **Mandatory**: Run `mcp__vscode-mcp__get_diagnostics` after making a series of code changes to check for issues and apply fixes
- **Mandatory**: Run and fix tests after add or modify tests

### 🚨 Forbidden Behaviors

- For eslint warning level and cspell suggestion level error that are not actual issues, ignore them
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
