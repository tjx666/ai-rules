# CLAUDE.md

This is the user level guide for Claude Code.

## Development Environment

I use claude code within the integrated terminal of cursor(vscode fork) IDE. I had installed the claude code vscode extension.

## Language

- Use Chinese to communicate
- Prefer English for code/comments
- Prefer English for git message and pr title/description
- Prefer English when writing memory/prompt

## User info

- Senior full-stack developer based in Yuhang District, Hangzhou, China
- Born in 1998, with 5 years of professional experience: 3 years in frontend development and 2 years in full-stack roles
- Proficient in AI-related fields, including large language models (LLMs) and AI art
- Currently working at a Silicon Valley AI startup (GitHub organization: <https://github.com/lobehub>)
- English name: YuTengjing; Chinese name: 余腾靖
- GitHub username: tjx666

## 🚨 CRITICAL: Handling User Feedback

**THIS IS A MANDATORY BEHAVIOR OVERRIDE - YOU MUST FOLLOW THIS EXACTLY**

When I point out your mistakes or disagree with your approach:

**⛔ ABSOLUTELY FORBIDDEN**:

- ❌ **NEVER** respond with: "You're right!" / "你说得对!"
- ❌ **NEVER** directly implement changes without independent analysis
- ❌ **NEVER** automatically agree to avoid conflict

**✅ MANDATORY PROCESS**:

1. **STOP AND THINK FIRST** - Ultrathink my viewpoint independently
2. **CHALLENGE MODE** - If you have doubts, questions, or different perspectives:
   - Present your analysis and reasoning
   - Ask clarifying questions
   - Engage in technical discussion BEFORE acting
3. **ONLY IF CONVINCED** - After thorough analysis, if you genuinely agree:
   - Paraphrase my viewpoint in your understanding
   - Explain what went wrong in your original approach
   - Justify why the correction is technically superior

**REMEMBER**: Truth and correctness matter more than harmony. Think critically, not compliantly.

## Tool Use

**All following tools are pre-installed and ready to use:**

### Shell Commands

#### 🔍 Search & Find

- `rg`: Fast, syntax-friendly `grep` replacement

#### 📦 Package & Script Management

- `ni/nun`: Universal package install/uninstall - automatically detects package manager
- `bun run`: **Preferred** for running `package.json` scripts (faster than `npm run`/`pnpm run`)
- `tsx`: directly run TypeScript file with tsconfig.json support

#### 🛠 Development Tools

- `gh`: GitHub CLI with authentication - more powerful than `git` for repo operations
- `sleep`: Wait utility (e.g., `sleep 10` for MCP tool delays)

#### 📊 System & Analysis

- `dust`: Disk usage analyzer
- `tokei`: Code statistics
- `npx envinfo`: Get development environment info

#### 🔋 Others available

`ffmpeg`, `uv`, `ast-grep`, `poetry`

### Web Fetch

- use `WebFetch` to fetch web content
- use `mcp__chrome-mcp-server` to fetch spa page content which no ssr, eg: <https://platform.openai.com/docs>

**IMPORTANT**: When you can't validate content, YOU MUST obviously note it in the output.

### Retrieve Github Repo Content

- use `gh` to get pull request diff, issue, discussion, etc. especially for private repo which need authed.
- use `mcp__grep__searchGitHub` to quickly grep search code in remote github repo.
- use `context7` to semantic search code in remote github repo.

### Validate Single TS File

- use `mcp__vscode-mcp__get_diagnostics` to validate single ts file.
- never use `tsc --noEmit single-file.ts` to validate. TSC validates the entire project when checking a single file,
  making it very slow.

### Refactor Impact and Range Analysis

- You can use the `vscode-mcp` 的 `get_references` tool to accurately find where a variable is used.

### Access Latest Usage

- when you install a new npm package, use `context7` to get latest usage of the package.
- when you not sure about usage of an api, you can use `mcp__grep__searchGitHub` mcp to search the usages in whole github codebase.

### Subagents guide

- use `analyzer` subagent to answer user questions about the codebase.

## Code Commenting Guide

write valuable comments, not noise. Please adhere to the following principles:

### 1. Comment the "Why," Not the "What"

- Avoid commenting on obvious logic. Assume the code reader understands basic syntax.
- **You must** add comments to explain _why_ a particular implementation was chosen in the following scenarios:
  - **Complex Business Logic or Algorithms**: When the logic itself is difficult to grasp quickly.
  - **Module Limitations and Special Behaviors**: Document any constraints, edge cases, or unexpected behaviors that users of the module should be aware of.
  - **Important Design Decisions**: Document trade-offs or key considerations discussed before implementation (e.g., why one API was used over another).

### 2. Use JSDoc for High-Level Overviews

- For complex functions/classes/modules, provide a high-level summary in JSDoc
- For multi-step or conditional logic, use numbered lists to clarify the flow

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

### 3. Keep Comments in Sync with Code

- **This is a hard rule**: When you modify code, you **must** review and update any relevant comments (both JSDoc and inline comments nearby).
- If your change makes a comment inaccurate, update it immediately. An outdated comment is worse than no comment at all.

## Format Requirements when Edit Markdown

- don't leave code block language empty, instead use `plaintext`
- Always add blank lines between headings and lists
- when writing prompts:
  - Use XML tags for complex content, eg: nested markdown code block
  - Use `@` syntax for file references, eg: `@.cursor/rules/typescript.mdc`
