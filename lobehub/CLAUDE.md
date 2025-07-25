# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Language

- Use Chinese to communicate
- Prefer English for code/comments

## Tool Use

### Shell Commands

all the commands following metioned is preinstalled in the environment, you can use them directly.

- `ast-grep`: whenever a search requires syntax-aware or structural matching, default to `ast-grep --lang typescript -p '<pattern>'` (or set `--lang` appropriately) and avoid falling back to text-only tools like `rg` or `grep` unless I explicitly request a plain-text search.
- `fd`: fasted and syntax friendly `find` replacement.
- `rg`: fasted and syntax friendly `grep` replacement.
- `gh`: GitHub CLI, more powerful than `git` and authed with github account.
- `ni/nun/nr`: use it for install/uninstall packages and run scripts and needn't care which package manager is used.
- `bun run`: run scripts in `package.json` for better speed.
- `node --experimental-strip-types`: use it to directly run a ts file without compiling.
- `sleep`: use it when you need to wait for some time, eg, some mcp tool crawl a website need some time, you can use `sleep 10` to wait for some time and then try to retrieve the result again.
- `bat`: syntax highlight for `cat`
- `delta`: better `git diff` with syntax highlight.
- `dust`: disk usage
- `tokei`: code statistics

## Suggestions

- 搜索项目源码时建议 exclude： `src/database/migrations/meta`， `**/*.test.*`, `**/__snapshots__`, `**/fixtures`

## Technologies Stack

- **Package Manager**: pnpm
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: antd, @lobehub/ui, antd-style (CSS-in-JS)
- **State**: Zustand, nuqs (search params)
- **Data Fetching**: SWR, tRPC
- **Database**: PGLite (client), PostgreSQL (server), Drizzle ORM
- **Testing**: Vitest, Testing Library
- **AI**: Multiple providers integration in `src/libs/model-runtime/`

## Architecture Overview

### Directory Structure

```
src/
├── app/                 # Next.js App Router
├── features/            # Feature-based UI components
├── store/              # Zustand state stores
├── services/           # Client services (tRPC/Model calls)
├── server/             # Server-side (tRPC routers, services)
├── database/           # Schemas, models, repositories
├── libs/               # External library integrations
```

### Backend Three-Layer Architecture

- **Models**: Single-table CRUD (`src/database/models/`)
- **Repositories**: Complex queries (`src/database/repositories/`)
- **Services**: Business logic (`src/server/services/`)

### Data Flow

- **Client**: UI → Zustand → Service → Model → PGLite
- **Server**: UI → Zustand → Service → tRPC → Repository/Model → PostgreSQL

## Development Guidelines

### TypeScript Code Style Guide

- Avoid explicit type annotations when TypeScript can infer types.
- Avoid defining `any` type variables (e.g., `let a: number;` instead of `let a;`).
- Use the most accurate type possible (e.g., use `Record<PropertyKey, unknown>` instead of `object`).
- Prefer `interface` over `type` (e.g., define react component props).
- Use `as const satisfies XyzInterface` instead of `as const` when suitable
- import index.ts module(directory module) like `@/db/index` instead of `@/db`
- Instead of calling Date.now() multiple times, assign it to a constant once and reuse it. This ensures consistency and improves readability
- Always refactor repeated logic into a reusable function
- Don't remove meaningful code comments, be sure to keep original comments when providing applied code
- Update the code comments when needed after you modify the related code
- Please respect my prettier preferences when you provide code
- Prefer object destructuring when accessing and using properties
- Prefer async version api than sync version, eg: use readFile from 'fs/promises' instead of 'fs'

### Code Quality

- **Comment Language Rules**:
  - For files with existing Chinese comments: Continue using Chinese to maintain consistency
  - For new files or files without Chinese comments: MUST use American English
- **Changes**: Conservative for existing code, modern approaches for new features

### Logging

- Use consoe.log for temp log
- Use `debug` package to log for new module, read `.cursor/rules/debug-usage.mdc` for more details

**Important**:

- Don't define logger as a function argument, logging should not affect business logic, eg: `function computeSize(gen, usedLog) {}`
- Never log user private information like api key, etc
- Don't use `import { log } from 'debug'` to log messages, because it will directly log the message to the console.

### Database

- **Schema**: Read `.cursor/rules/drizzle-schema-style-guide.mdc` first
- **Models**: Use `src/database/models/_template.ts` template
- **Naming**: Tables `plural_snake_case`, columns `snake_case`

### Testing

- **Strategy**: Read `.cursor/rules/testing-guide/testing-guide.mdc` first
- **Command**: `npx vitest run --config vitest.config.ts '[file-path-pattern]'`, wrapped in single quotes to avoid shell expansion

**Important**:

- Never run `bun run test` etc to run tests, this will run all tests and cost about 10mins
- If try to fix the same test twice, but still failed, stop and ask for help.

### Internationalization

- **Keys**: Add to `src/locales/default/namespace.ts`
- **Dev**: Translate at least `zh-CN` files for preview
- **Structure**: Hierarchical nested objects, not flat keys
- **Script**: DON'T run `pnpm i18n` (user/CI handles it)

## Workflows

### Post-Edit Diagnostics Workflow

⚠️ **When files are edited or use Edit|MultiEdit|Write tools, YOU MUST follow this diagnostic strategy:**

1. **First Priority**: Use `mcp__ide__getDiagnostics` (if IDE is connected)
2. **Second Priority**: Use `mcp__vscode-mcp__get_diagnostics` (if VSCode MCP is available)
3. **Third Priority**: For TypeScript files, run `bun run type-check` as last resort

**Quick Commands:**

- IDE diagnostics: `mcp__ide__getDiagnostics`
- VSCode diagnostics: `mcp__vscode-mcp__get_diagnostics`
- Type check: `bun run type-check`

**Important**:

- Skip diagnostics if `<new-diagnostics>` is already provided in the output.
- If you plan to edit multiple files, run diagnostics after all edits are done.

### Post-Read Rules Check Workflow

⚠️ **When files are read, YOU MUST check Rules Index in CLAUDE.md for relevant rules to review.**

## Rules Index

⚠️ **YOU MUST read corresponding rule files before starting tasks!**

### 🔴 Critical Rules - Read Before Action

- **React**: `.cursor/rules/react-component.mdc`
- **Database**: `.cursor/rules/backend-architecture.mdc`, `.cursor/rules/drizzle-schema-style-guide.mdc`
- **Testing**: `.cursor/rules/testing-guide/testing-guide.mdc`
- **Desktop**: `.cursor/rules/desktop-feature-implementation.mdc`

### 📋 Complete Rule Files

#### Core Development

- `backend-architecture.mdc` - Three-layer architecture, data flow
- `react-component.mdc` - antd-style, Lobe UI usage

#### Store

- `zustand-slice-organization.mdc` - Store organization
- `zustand-action-patterns.mdc` - Action patterns

#### Database

- `drizzle-schema-style-guide.mdc` - Schema naming, patterns
- `define-database-model.mdc` - Model templates, CRUD patterns

#### Quality & Testing

- `testing-guide/testing-guide.mdc` - Test strategy, mock patterns
- `code-review.mdc` - Review process and standards

#### Desktop (Electron)

- `desktop-feature-implementation.mdc` - Main/renderer process patterns
- `desktop-local-tools-implement.mdc` - Tool integration workflow

#### Utilities

- `i18n.mdc` - Internationalization workflow
- `debug.mdc` - Debugging strategies
- `packages/react-layout-kit.mdc` - Layout components usage
