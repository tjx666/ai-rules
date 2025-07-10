# 工具调用完整指南

## 🔧 环境说明

### 开发环境

- **OS**: macOS 15.5
- **Hardware**: Apple Silicon (M4 Pro)
- **IDE**: Cursor（VSCode 的 fork）
- **Default Terminal Editor**: `cursor`

你已经处在一个打开的 Cursor 工作区环境中，可以使用所有 vscode-mcp 提供的工具。

## 🎯 核心原则

### 1. 工具选择优先级

1. **具体代码位置已知** → 优先使用 VSCode LSP 工具
2. **需要探索和搜索** → 使用内置搜索工具
3. **复杂操作需求** → 使用终端命令行工具

### 2. 基本原则

- codebase_search, grep_search, file_search 适合在不清楚代码位置时收集上下文
- vscode-mcp 提供的 LSP tools 适合在清楚代码位置时获取精确代码信息
- 终端工具适合在内置工具无法满足需求时使用

## 🛠️ 工具分类详解

### 1. VSCode MCP LSP 工具（精确代码分析）

| 工具名称             | 用途               | 使用场景                                 |
| -------------------- | ------------------ | ---------------------------------------- |
| `get_definition`     | 获取符号定义       | 查看函数/变量的定义位置                  |
| `get_references`     | 查找所有引用位置   | 评估修改影响范围                         |
| `get_hovers`         | 获取类型信息和文档 | 理解代码含义和类型                       |
| `get_diagnostics`    | 获取错误和警告信息 | 排查代码问题，检查编辑文件没有引入新错误 |
| `get_signature_help` | 获取函数签名帮助   | 调用函数时获取参数信息                   |
| `rename_symbol`      | 重命名符号         | 安全, 准确地重构代码                     |
| `highlight_code`     | 高亮显示代码区域   | 用户友好，可视化向用户展示重要代码片段   |

#### 🎯 代码高亮最佳实践（仅用于查找类请求）

**核心原则**：**仅当用户明确要求查找、定位代码时**，才使用 `highlight_code` 对最终找到的结果进行可视化展示。

- **适用场景**：用户的请求包含“查找”、“定位”、“在哪里”、“帮我看看”等关键词，明确指向一个探索和定位代码的目的。
- **禁止场景**：对于执行类任务（如“重构”、“实现”、“修改”），在完成任务后进行成果汇报时，**禁止**使用 `highlight_code` 来展示你修改或创建的代码，除非用户后续明确要求你高亮展示。

**示例：**

- ✅ **正确使用**: 用户: "帮我找到处理用户认证的逻辑" -> (分析后) -> `highlight_code(...)`
- ❌ **错误使用**: 用户: "帮我重构认证逻辑" -> (重构后) -> "重构已完成，请看高亮部分" -> `highlight_code(...)`

### 2. 内置搜索工具（代码探索）

它们的用途和限制你已经很清楚了，这里不加赘述。

### 3. 终端命令行工具（复杂操作）

通过 `run_terminal_cmd` 使用以下现代化工具：

| 任务类型     | 传统工具     | **推荐工具**       | 使用理由              |
| ------------ | ------------ | ------------------ | --------------------- |
| **文件查找** | `find`       | `fd`               | 更快速、语法友好      |
| **代码搜索** | `grep`       | `ripgrep` (`rg`)   | 极快、遵守 .gitignore |
| **代码重构** | `sed`        | `ast-grep`         | 语法感知、安全重构    |
| **Git 操作** | `git`        | `gh`               | GitHub 集成           |
| **包管理**   | `npm`/`pnpm` | `@antfu/ni` (`ni`) | 统一的包管理器命令    |
| **运行脚本** | `node`       | `tsx`              | 直接运行 TypeScript   |

其他可用的 shell 工具：

- **文件查看**: `bat`（语法高亮 cat）、`delta`（更好的 git diff）
- **系统分析**: `dust`（磁盘使用）、`tokei`（代码统计）
- **等待控制**: `sleep`（暂停执行，主动等待）
- **代码重构**: `ast-grep`（语法感知的搜索和替换）

#### 🎯 ast-grep 详解（语法感知的代码重构）

`ast-grep` 基于 AST（抽象语法树）的搜索和替换工具，核心场景：

**1. 大规模简单重构**

- 批量替换一个模式的代码到另一个模式
- 优于 `sed`：语法感知，不会误替换字符串、注释
- ⚠️ **限制**：只适合简单的大规模重构，复杂的重构还是需要一个一个改

**2. 复杂模式搜索**

- 基于 AST 的搜索效果更好
- 支持复杂的代码模式匹配

## 🎯 决策流程图

```plaintext
问题：需要处理代码相关任务

1. 我知道具体的代码位置吗？
   ├─ 是 → 使用 VSCode LSP 工具
   │   ├─ 查看定义 → get_definition
   │   ├─ 查找引用 → get_references
   │   ├─ 获取类型 → get_hovers
   │   ├─ 检查错误 → get_diagnostics
   │   └─ 展示代码 → highlight_code
   └─ 否 → 继续下一步

2. 我知道要查找什么吗？
   ├─ 知道具体代码/函数名 → grep_search 或 rg
   ├─ 需要理解功能/概念 → codebase_search
   ├─ 只知道文件名 → file_search 或 fd
   └─ 需要代码重构/批量替换 → ast-grep

3. 需要进行什么操作？
   ├─ 包管理 → ni/nr/nun
   ├─ 运行脚本 → tsx
   ├─ Git 操作 → gh
   └─ 代码重构 → ast-grep 或 rename_symbol
```

## 💡 最佳实践

### 1. 工具组合使用

```plaintext
搜索工具找位置 → LSP 工具获取详细信息 → 终端工具执行操作
```

### 2. 选择策略

- **内置工具优先**：速度快，返回结构化结果
- **终端工具补充**：处理内置工具的限制情况
- **VSCode 工具精确**：已知位置时的首选

### 3. 常见组合

- **搜索定位**: `codebase_search` + `grep_search` + `file_search`
- **探索 + 分析**: `codebase_search` + `grep_search` + `file_search` → `get_hovers` / `get_signature_help` + `get_definition` + `get_references`
- **重构流程**: `get_references` → `rename_symbol`
- **批量重构**: `ast-grep` → `get_diagnostics`（验证语法）
- **按照用户要求查找代码**: `codebase_search` + `grep_search` + `file_search` → `highlight_code` + `get_references`

### 4. 等待时间处理策略

当遇到需要等待的工具或操作时（如 gitdiagram 分析、网络请求等），应该使用以下策略：

```bash
# 主动等待一定时间后再继续
sleep 5 # 等待 5 秒

# 或者使用工具的等待参数 firecrawl_scrape 的 waitFor 参数
```

## ❌ 常见误区

1. **工具选择误区**：
   - 理解函数功能时使用 `codebase_search` 搜索函数名，应该使用 `get_hovers` 获取函数文档
   - 查找变量使用时使用 `grep_search`（可能有误报），应该使用 `get_references` 查找所有引用
   - 安装依赖时手动判断并使用 npm/yarn/pnpm，应该使用 `ni` 统一处理
   - 大规模搜索时使用 `grep_search`（限制 50 个结果），应该使用 `rg` 进行无限制搜索

2. **代码展示误区**：
   - **混淆任务类型**：在完成了“执行类”任务（如重构、添加功能）后，使用 `highlight_code` 来展示工作成果。`highlight_code` **仅用于**响应用户的“查找类”请求。对于执行结果的汇报，应使用文字总结。
   - 根据用户要求找到代码后仅描述位置，不进行可视化展示。
   - 你自己在分析代码时不要使用 `highlight_code`，这会打扰用户。

3. **代码重构工具选择误区**：
   - 盲目使用 `rg + sed` 进行文本替换，可能误替换字符串、注释中的内容
   - 对于大规模重构不使用 `ast-grep`，而是手动逐个替换
   - 过度依赖 `ast-grep` 处理复杂重构，复杂的重构还是需要一个一个改

4. **编辑检查误区**：
   - 每次编辑代码都检查错误：如果确定要多次编辑或者修改多个文件，建议在编辑完所有文件后调用 `get_diagnostics` 检查错误，不要编辑一次就检查一次

5. **等待时间处理误区**：
   - 遇到需要等待的工具（如抓取 gitdiagram.com 的内容）时，返回内容提示平台在处理需要等待一段时间，应该使用 `sleep` 命令主动等待适当时间
   - 不要直接重试或结束对话，应该调用 `run_terminal_cmd` 使用 `sleep` 命令主动等待

## 🚀 快速参考

### 按任务选择工具

- **查看代码定义** → `get_definition`
- **找到所有使用** → `get_references`
- **理解代码类型** → `get_hovers` / `get_signature_help`
- **检查错误警告** → `get_diagnostics`
- **按查找要求向用户高亮代码** → `highlight_code`
- **搜索代码概念** → `codebase_search`
- **精确文本匹配** → `grep_search` 或 `rg`
- **查找文件路径** → `file_search` 或 `fd`
- **安装依赖包** → `ni`
- **运行 TS 文件** → `tsx`
- **安装新的 npm 包, 获取最新的文档了解安装和使用方法** → `context7 mcp`
- **抓取链接内容** → `firecrawl mcp`
- **控制等待时间** → `sleep` 命令
- **了解不熟悉的 api 用法** -> 使用 github mcp 的 search_code tool，看看 github 上大家是怎么用的
- **大规模代码重构** → `ast-grep` + `get_diagnostics`
