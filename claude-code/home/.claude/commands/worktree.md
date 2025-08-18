---
description: 'Git worktree 管理助手 - 自动创建、配置和切换到 git worktree'
argument-hint: '[optional: branch-name]'
allowed-tools: ['Bash', 'Read', 'Write', 'LS', 'TodoWrite']
---

# Git Worktree 管理助手

管理 git worktree 的创建、配置和切换。支持基于现有分支或新建分支创建 worktree，并自动配置 Claude 环境。

## 执行流程

### 1. 检查当前环境

- 检查当前是否已在 worktree 中（通过路径判断，如：`/Users/yutengjing/code/lobe-chat.worktrees/tj/refactor/pricing`）
- 如果已在 worktree 中：
  - 检查是否存在 `.claude` 文件夹
  - 如果没有，从主仓库复制 `.claude` 文件夹和 `CLAUDE.local.md`
  - 完成配置后结束

### 2. 创建新 worktree（如果不在 worktree 中）

- 询问用户选择：
  - **基于现有分支创建**：显示最近 10 个分支供选择
  - **创建新分支**：要求输入新分支名称

#### 获取最近分支的命令

```bash
git for-each-ref --sort=-committerdate refs/heads/ --format='%(refname:short) - %(committerdate:relative)' --count=10
```

### 3. 分支处理

- **现有分支**：基于选择的分支创建 worktree
- **新分支**：先创建分支，再基于该分支创建 worktree

### 4. 环境配置

#### 复制配置文件

```bash
# 复制 .claude 文件夹到新 worktree
cp -r /path/to/original/repo/.claude /path/to/worktree/

# 复制 docs/.local 文件夹到新 worktree
cp -r /path/to/original/repo/docs/.local /path/to/worktree/docs/.local

# 复制环境变量
cp -r /path/to/original/repo/.env /path/to/worktree/.env

# 复制 CLAUDE.local.md（如果存在）
cp /path/to/original/repo/CLAUDE.local.md /path/to/worktree/
```

#### 安装依赖和打开编辑器

```bash
# 在后台静默安装依赖
pnpm install --dir [worktree-path] > /dev/null 2>&1 &

# 在新 Cursor 窗口中打开 worktree
c [worktree-path]
```

## 参数说明

- 如果提供了 `$ARGUMENTS`，将作为分支名称直接创建新分支的 worktree
