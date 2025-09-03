---
argument-hint: '[issue-number | issue-url]'
description: Analyze GitHub issue and provide implementation plan
allowed-tools: Bash(git:*), Bash(gh:*), Bash(jq:*), Bash(wc:*), Bash(awk:*), Bash(sed:*), Bash(echo:*), Bash(rg:*), WebSearch, WebFetch, Grep, Glob, Read
model: claude-sonnet-4-0
---

<ultrathink />

# GitHub Issue 分析工作流程

**核心原则**：通过并行调用工具最大化执行效率，在一个响应中完成多个独立的信息获取任务。

## 1. Issue 获取与解析

**关键**：并行调用多个工具提高效率，避免 JSON 截断导致信息遗漏。

### 执行命令（并行）

```bash
Bash(description: "Get issue basic info", command: "gh issue view $ARGUMENTS --json number,title,body,state,author,assignees,labels,createdAt,updatedAt")
Bash(description: "Get issue with comments", command: "gh issue view $ARGUMENTS --comments")
```

**参数处理**：

- `$ARGUMENTS` 可以是 issue 号（如 `8931`）或完整 URL（如 `https://github.com/lobehub/lobe-chat/issues/8931`）
- `sed 's/.*\///g'` 从 URL 中提取 issue 号

**解析重点**：

- **基本信息**：标题、状态、作者、标签、创建时间
- **描述内容**：问题描述、复现步骤、预期行为、实际行为
- **环境信息**：浏览器、操作系统、版本信息
- **评论分析**（关键）：
  - 用户提供的额外错误日志和完整堆栈跟踪
  - 社区成员的复现验证和测试环境
  - 开发者的回复和问题确认
  - 临时解决方案或 Workaround
  - 测试 API 或复现环境信息

## 2. Issue 分类判断

根据标签和内容判断 issue 类型：

- **🐛 Bug Report**: 功能异常、错误、崩溃
- **✨ Feature Request**: 新功能、改进建议
- **其他类型**: 文档、配置、问题等

## 3. 相关信息搜索策略

### 执行命令（并行）

```bash
Bash(description: "Search related issues", command: "gh issue list --search \"[从issue提取的关键词]\" --state all --limit 10")
Bash(description: "Search related PRs", command: "gh pr list --search \"[从issue提取的关键词]\" --state all --limit 10")
WebSearch(query: "lobe-chat [具体错误信息或功能关键词]")
```

**搜索策略**：

- **Repository 搜索**：使用从 issue 标题和描述中提取的关键词
- **Web 搜索**：结合 `lobe-chat + 错误信息` 或 `drizzle orm + 具体技术问题`
- **代码搜索**：使用 `Grep` 和 `Glob` 工具定位相关代码文件

## 4. 代码库分析

### 执行命令（并行）

```bash
Grep(pattern: "[从错误日志提取的关键词]", output_mode: "files_with_matches")
Grep(pattern: "[函数名或组件名]", output_mode: "content", -n: true)
Bash(description: "Check recent changes", command: "git log --oneline --since=\"2024-08-01\" -- [相关文件路径]")
```

**分析重点**：

- **功能定位**：使用 `Grep` 搜索相关组件、函数、类型定义
- **错误追踪**：定位错误信息来源和完整调用链
- **最近更改**：检查相关文件的 git 历史，特别关注最近的修改
- **依赖关系**：分析模块间的导入导出关系

---

## 5. 生成分析报告

在完成上述分析后，根据在步骤2中判断的 Issue 类型，选择下面的一个模板来格式化你的最终报告。请确保报告内容详实、准确，并填充所有字段。

<template_bug>

### A. 如果是 Bug Report, 使用此模板:

# 【Bug】[请在此处填写 Bug 标题]

## 🚨 结论摘要

- **严重程度**：[紧急/重要/一般]
- **修复复杂度**：[简单/中等/复杂]
- **影响范围**：[具体功能模块]
- **问题类型**：[UI异常/功能错误/性能问题/兼容性问题]

## 🔍 根本原因

**问题本质**：[一句话概括核心问题]
**技术原因**：[简要说明技术层面的根本原因]

## ⚡ 快速修复方案

**推荐修复**：[简要描述修复方案]
**修复文件**：[主要需要修改的文件]
**修复风险**：[低/中/高 - 简要说明风险点]

## 📋 详细分析

### 问题复现

**复现步骤**：
**预期 vs 实际**：

### 环境信息

_(从 Issue 中提取)_

### 错误信息

_(从 Issue 或日志中提取)_

### 技术分析详情

- **问题定位**：
- **调用链分析**：
- **数据流问题**：

### 修复方案详情

```diff
// 修复前
- [有问题的代码]
// 修复后
+ [修复后的代码]
```

### 测试验证

</template_bug>

---

<template_feature>

### B. 如果是 Feature Request, 使用此模板:

# 【Feature】[请在此处填写功能标题]

## 🎯 结论摘要

- **复杂度评估**：[简单/中等/复杂]
- **工作量预估**：[X人天]
- **建议优先级**：[高/中/低]
- **技术风险**：[低/中/高]

## 💡 核心价值

**解决问题**：[一句话描述解决什么用户痛点]
**实现思路**：[简要描述技术方案]

## 🚀 快速实现方案

1. [关键步骤一]
2. [关键步骤二]
   **涉及文件**：[主要修改的文件]

## 📋 详细分析

### 需求背景

- **用户痛点**：
- **使用场景**：
- **期望功能**：

### 相关 Issue

_(通过 `gh issue list` 等工具搜索)_

### 技术方案详情

- **架构适配**：
- **详细实现步骤**：
- **依赖变更**：

### 风险评估

- **技术风险**：
- **影响范围**：

### 测试建议

</template_feature>

---

## 6. 执行效率与常见陷阱

### 并行执行策略

- **批量工具调用**：在单个响应中并行调用多个独立工具
- **避免串行等待**：不要等待一个工具完成后再调用下一个
- **最大化并发**：同时执行获取issue、搜索相关信息、分析代码等任务

### 数据获取陷阱

- **JSON截断**：`gh issue view --json` 在数据量大时会截断，通过并行获取多种格式避免
- **评论遗漏**：评论往往包含最关键的技术细节，必须获取
- **URL解析**：正确处理 issue 号和 URL 两种输入格式

### 分析质量检查

- **复现验证**：是否从用户评论中获取了实际的复现步骤和环境
- **错误日志**：是否获得了完整的错误信息而非仅描述
- **技术深度**：是否定位到具体的代码文件和行数
- **修复风险**：是否评估了修复方案对其他功能的潜在影响

## 7. 完成检查清单

- [ ] ✅ Issue 基本信息获取完整（包括评论）
- [ ] ✅ 相关 issue 搜索并分析
- [ ] ✅ Web搜索获取更多技术信息
- [ ] ✅ 代码库分析定位相关文件和调用链
- [ ] ✅ 技术方案/修复方案合理性检验
- [ ] ✅ 报告格式完整，信息清晰
- [ ] ✅ 风险评估和测试建议完备
- [ ] ✅ 从用户评论中获取了关键技术细节
