# AGENTS.md

## Communication

- Use Chinese to communicate with me
- Prefer English for coding and writing
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
- When narrating numerous viewpoints in code reviews and similar contexts, group them by priority
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

### Visual Enhancement

- **Use emojis for functional purposes, not decoration**:
  - ✅ Status indicators (completion, success)
  - 🎯 Highlighting key conclusions or main points
  - ⚠️ Important warnings or considerations
  - 📍 Location/reference markers
  - 💡 Tips or notes
  - 🔧 Action items or tools
  - 🔍 Analyze
- **Place emojis at the beginning of text descriptions** for better visual scanning (e.g., `🔧 Tool Overview` not `Tool Overview 🔧`)
- Use emojis sparingly: 1-2 per response for emphasis (more allowed for reference/list content)

### Examples

**✅ Good structure:**

````markdown
**🎯 核心变更**

Successfully configured MCP services to use stdio transport mode.

**解决方案**

1. **mcp-proxy 方案（推荐）** - 使用代理转换协议
   eg:
   ```toml
   [mcp_servers.grep]
   command = "mcp-proxy"
   args = ["--transport=streamablehttp", "https://mcp.grep.app"]
   ```
2. **直接修改** - 改写服务端代码支持 stdio
3. **容器包装** - Docker 包装现有服务

**工作总结 ✅**

1. 已将 grep 通过 mcp-proxy 以 stdio 适配（/path/to/config:13）
2. 已将 chrome 切换为 stdio 模式（/path/to/config:36）
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

1. 已将 grep 通过 mcp-proxy 以 stdio 适配（/path/to/config:13）
2. 已将 chrome 切换为 stdio 模式（/path/to/config:36）
```

## Code Quality Standards

- **Use descriptive variable names** - avoid abbreviations like `mo`, `btn`, `el`; prefer `mutationObserver`, `button`, `element`
- **Write meaningful comments** - explain complex logic and business decisions, not obvious syntax

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

## Development Environment

- I use claude code within the integrated terminal of cursor IDE
- You can safely use the vscode mcp tools as cursor IDE is a fork of vscode

## Tool Preferences

**Note**: All tools mentioned below are pre-installed and available in the system.

### Package & Script Management

- Use `ni` instead of `npm install`
- Use `bun run` instead of `npm run`
- Use `bunx` instead of `npx`
- Use `tsx` to run TypeScript files directly

### Search & Find

- ALWAYS use `rg` instead of `grep`

### Web Content

- Use shell command `crwl [url]` to fetch LLM friendly content from url
- Use `WebSearch` to search latest web content
- Use `mcp__SearXNG__search` for comprehensive multi-engine search when WebSearch is insufficient

### GitHub Integration

- Use `gh` instead of `git` and `WebFetch` to get/edit the body and comments of PR, issue, discussion
- Use `mcp__grep__searchGitHub` to grep search in remote GitHub repos
- Use `context7` for semantic search in remote GitHub repos

### Docs Search

- Use `context7` to get latest usage when installing new packages
- Use `mcp__grep__searchGitHub` to search API usage patterns across GitHub

### TypeScript Validation

- Use `mcp__vscode-mcp__get_diagnostics` to validate single TS file (fast)
- Avoid `tsc --noEmit single-file.ts` (validates entire project, very slow)

### VSCode MCP Tools

- Use `mcp__vscode-mcp__get_references` to find the variable usages, instead of `Grep` and `Search`
- Use `mcp__vscode-mcp__rename_symbol` to rename a symbol, instead of Edit tool
- Prefer `mcp__vscode-mcp__execute_command` over Bash commands in following cases:
  - Use `command: "editor.action.fixAll", arguments: []` to auto-fix ESLint and other linter errors, instead of `Bash(eslint --fix)`
