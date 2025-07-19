# Markdown 代码块格式规范

## 🎯 核心要求

在生成 markdown 的代码块时：

- **必须指定编程语言**：使用 `plaintext` 代替留空
- **代码示例必须是合法语法**：避免语法错误，确保 ESLint 等工具能正确解析

## 📋 格式规范

### ✅ 正确格式

```typescript
const user = { name: 'Alice', age: 30 };
```

```json
{
  "name": "example",
  "version": "1.0.0"
}
```

```bash
npm install
npm run dev
```

```plaintext
这是纯文本内容
或者算法描述
```

### ❌ 错误格式

```plaintext
// 没有指定语言标识符
const user = { name: 'Alice', age: 30 };
```

```javascript
// 语法错误的代码
const user = {
  name: 'Alice'
  age: 30  // 缺少逗号
}
```

## 🔧 语言标识符建议

| 内容类型             | 使用标识符  |
| -------------------- | ----------- |
| 命令行               | `bash`      |
| 文件树/纯文本/伪代码 | `plaintext` |

## 📝 目的

- **工具兼容性**：确保代码块能被 ESLint、Prettier 等工具正确识别
- **语法高亮**：提供正确的语法高亮显示
- **格式统一**：保持代码块格式的一致性
