# GitHub 仓库分析实战指南

## 🎯 分析策略

### 📋 决策流程

```plaintext
知名项目 → DeepWiki → Repomix 深度分析
小项目   → uithub.com 获取完整内容
大项目   → Repomix → 精确文件用 Firecrawl
```

## 🛠️ 工具介绍

| 工具           | 用途                        | 最佳场景                  |
| -------------- | --------------------------- | ------------------------- |
| **DeepWiki**   | 知名项目结构化文档          | React、Vue 等热门开源项目 |
| **uithub.com** | 完整项目代码（AI 优化格式） | 小型项目、快速理解        |
| **Repomix**    | 项目打包 + 强大搜索         | 复杂项目深度分析          |
| **Firecrawl**  | 精确抓取特定内容            | 查看特定文件或网页        |

> **重要说明**: uithub.com 是一个专门的工具网站（**不是** github.com 的拼写错误）

## 项目规模判断

### 快速判断

- 知名大项目: 'facebook/react', 'microsoft/vscode', 'nodejs/node', 'vuejs/vue'
- 小项目特征: 'demo', 'example', 'tutorial', 'starter', 'template'
- 大项目特征: 'framework', 'platform', 'system', 'core', 'enterprise', 'monorepo'

### 精确判断

使用 github mcp 的 get_file_contents 访问项目根目录，获取项目文件，大小统计信息

## ⚡ 快速模板

```typescript
// 策略 A：知名项目
const overview = await mcp_deepwiki_read_wiki_contents({ repoName: 'facebook/react' });
const details = await mcp_repomix_pack_remote_repository({ remote: 'facebook/react' });

// 策略 B：小项目
const fullRepo = await mcp_firecrawl_scrape({ url: 'https://uithub.com/user/small-project' });

// 策略 C：大项目
const repoAnalysis = await mcp_repomix_pack_remote_repository({ remote: 'large/project' });
```

## 💡 核心原则

1. **先判断项目类型**：知名/小型/大型
2. **选对工具**：不要一上来就用最复杂的
3. **并行执行**：能同时跑的绝不串行
4. **优雅降级**：工具失效时有备用方案
