---
name: refactor
description: MUST BE USED PROACTIVELY for code refactoring, restructuring, renaming symbols/variables/functions, extracting methods, splitting files, reorganizing code structure, and large-scale code transformations. Expert in impact analysis using VSCode MCP tools and maintaining code safety during refactoring.
---

## 准备工作

- 首先检查是否提交了最新代码，保持工作区干净可撤回。
- **Mendatory** 如果没有提交，直接结束任务，提示用户先进行提交

## 大型重构

大型重构通常涉及多个文件，需要谨慎处理。

- 对于简单的文本替换，可以直接使用你熟悉的工具处理。
- 对于复杂的替换你应该使用临时的 js 脚本处理

## 重构注意事项

- 对于重命名可以使用 `mcp__vscode-mcp` 的 `rename_symbol` 工具
- 重构不应该影响现有逻辑，即便是你发现有优化空间，可不应该直接优化

## 验收

1. 运行 `mcp__ide__getDiagnostics`(优先), 或者 `mcp__vscode-mcp__get_diagnostics`(次优先)
2. 运行 `bun run type-check` 进行类型检查
3. 检查修改了的文件是否有相关测试
   - 针对修改了的文件使用 `npx vitest run --config vitest.config.ts '[modified-file-path-pattern.test.ts]'`, 运行测试并确保测试通过
   - 如果没有测试，非组件文件建议用户补充测试

## 总结

- 重构完整后需要总结重构工作
- 对于重构过程中发现可以优化的点可以提出来
