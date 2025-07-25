# todo_write 工具使用指南

## 🎯 何时必须使用 todo_write 工具

以下情况**必须**创建 todo list：

### 1. 复杂多步骤任务（3+ 步骤）

- 需要多个文件修改的功能开发
- 涉及多个组件或服务的重构
- 需要配置、实现、测试的完整流程
- 编辑一个超过 800 行的大文件，因为文件内容越大，编辑难度越高，使用 todo list 可以降低出错率

### 2. 用户明确提供多个任务

- 用户使用数字列表 (1., 2., 3.) 描述需求
- 用户使用逗号，换行分隔多个任务
- 用户明确说"需要做几件事"

### 3. 需要依赖关系管理的任务

- 某些步骤必须在其他步骤完成后才能进行
- 需要先准备环境再执行主要任务

## 🚀 并行执行优化原则

### 强制并行思维

在创建 todo list 时，**默认假设所有任务都可以并行执行**，除非存在明确的依赖关系。

### 并行任务识别

以下类型的任务**必须**设计为并行执行：

- 读取/搜索多个文件
- 创建多个独立的组件或模块
- 运行多个独立的命令
- 处理多个不相关的配置项

### 依赖关系设计

只有在以下情况才设置依赖关系：

- 任务 B 需要任务 A 的输出作为输入
- 任务 B 需要任务 A 创建的文件或配置
- 任务 B 是对任务 A 结果的验证或测试

## 📋 创建 Todolist 的具体流程

### 1. 任务分解策略

```plaintext
原始需求 → 识别独立子任务 → 分析依赖关系 → 最大化并行度
```

### 2. 任务粒度标准

- **每个任务应该在 5-15 分钟内完成**
- **每个任务应该有明确的完成标准**
- **任务描述应该包含具体的操作动词**

### 3. 状态管理规则

- **立即开始**：接收需求后立即创建 todolist（merge=false）
- **实时更新**：完成任务后立即标记为 completed（merge=true）
- **并行执行**：同时启动所有无依赖的任务，多个任务可以同时标记为 in_progress

## ⚡ 执行效率提升

### 🔄 执行时的并行策略

在执行 todo 任务时，**必须最大化并行执行**：

#### 1. 批量执行无依赖任务

- 识别所有 `dependencies: []` 的任务
- 同时启动所有无依赖的任务
- 不要等待一个任务完成再开始下一个

#### 2. 工具调用并行化

- 需要读取多个文件时，一次性并行读取所有文件
- 需要搜索多个模式时，同时执行所有搜索
- 需要修改多个文件时，尽可能并行修改

#### 3. 依赖链优化

- 一旦某个任务完成，立即启动所有依赖它的任务
- 不要等待所有任务完成后再处理下一批
- 动态调整执行顺序以最大化并行度

#### 4. 实时状态更新

- 任务完成后立即更新状态为 `completed`
- 立即检查并启动新的可执行任务
- 避免"等待-检查-启动"的串行模式

### 并行执行检查清单

在创建每个任务时问自己：

- [ ] 这个任务是否真的依赖于其他任务？
- [ ] 是否可以与其他任务同时进行？
- [ ] 是否可以进一步拆分为更小的并行任务？

### 避免伪依赖

常见的错误依赖关系：

- ❌ "先创建文件 A，再创建文件 B"（如果 A 和 B 不相关）
- ❌ "先实现功能，再写测试"（可以并行开发）
- ❌ "先读取文件 A，再读取文件 B"（应该并行读取）
- ❌ "先搜索代码，再分析结构"（可以同时进行）
- ❌ "先修改组件 A，再修改组件 B"（如果修改互不影响）

### 并行执行示例

正确的并行思维：

- ✅ **同时创建**多个独立的组件文件
- ✅ **同时读取**需要分析的所有文件
- ✅ **同时搜索**多个不同的代码模式
- ✅ **同时修改**多个不相关的配置文件

## 📊 成功评估标准

一个好的 todo list 应该：

### 设计标准

- **50%+ 的任务可以并行执行**
- 每个任务描述清晰具体
- 依赖关系真正必要且最小化
- 任务粒度适中（5-15 分钟完成）

### 执行标准

- **首批启动多个无依赖任务**
- **工具调用实现并行化**
- **任务完成后立即触发后续任务**
- 整体执行时间显著缩短

## 🎯 核心要点

### 创建阶段

- **并行是默认，串行是例外**
- 默认假设所有任务都可以并行执行
- 只有真正的依赖关系才设置依赖

### 执行阶段

- **同时启动所有无依赖任务**
- **工具调用必须并行化**
- **动态更新状态，立即触发后续任务**

记住：高效的 todo list 不仅要设计得好，更要执行得快！
