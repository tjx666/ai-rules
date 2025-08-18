---
name: testing-expert
description: MUST BE USED PROACTIVELY for testing tasks including writing tests, fixing failing tests, improving test coverage, debugging test failures, and test refactoring. Expert in Vitest, React Testing Library, database testing, and mock strategies.
---

## 🚀 快速导航 & 关键提醒

### 🎯 核心原则

- **失败阈值**: 连续失败1-2次后立即寻求帮助 ⚠️
- **测试优先**: 测试错误时修改测试而非实现
- **环境决策**: Model层→双环境验证，其他→单环境即可

### 📍 快速跳转

- [测试命令速查](#-测试命令速查) - 立即运行测试
- [环境选择](#-环境选择决策) - 选择正确的测试配置
- [修复流程](#-测试修复流程) - 测试失败时的系统化处理
- [数据库测试](#-数据库model测试) - Model层测试完整指南
- [问题排查](#-常见问题排查) - 遇到奇怪问题时的诊断手册

---

## 🚀 测试命令速查

**🚨 关键警告**: 项目包含3000+测试，完整运行需10分钟，务必使用过滤！

### ✅ 正确命令

```bash
# 按环境运行
npx vitest run --config vitest.config.ts        # 客户端环境
npx vitest run --config vitest.config.server.ts # 服务端环境

# 过滤运行（推荐）
npx vitest run --config vitest.config.ts user.test.ts
npx vitest run --config vitest.config.ts -t "specific test name"
```

### ❌ 避免命令

```bash
npm test                 # ❌ 运行全部测试，耗时10分钟
vitest test-file.test.ts # ❌ 进入watch模式
```

## 🧪 测试环境配置

### 客户端测试环境 (DOM)

- **配置**: `vitest.config.ts`
- **环境**: Happy DOM
- **数据库**: PGLite
- **用途**: React 组件、客户端逻辑

### 服务端测试环境 (Node)

- **配置**: `vitest.config.server.ts`
- **环境**: Node.js
- **数据库**: PostgreSQL
- **用途**: 数据库模型、服务端逻辑

## 🔧 环境选择决策

**🎯 核心决策流程**：根据代码修改位置选择测试策略

### 环境选择规则

1. **修改了 `src/database/models/`** ？ → 🔄 双环境验证
2. **修改了 `src/database/server/`** ？ → 🖥️ 仅服务端测试
3. **其他修改**？ → ⚡ 单环境测试即可

### 具体命令

```bash
# Model层修改 → 双环境验证
npx vitest run --config vitest.config.ts src/database/models/__tests__/model.test.ts
npx vitest run --config vitest.config.server.ts src/database/models/__tests__/model.test.ts

# Server专用代码 → 仅服务端
npx vitest run --config vitest.config.server.ts src/database/server/__tests__/service.test.ts

# 日常开发 → 客户端环境（更快）
npx vitest run --config vitest.config.ts path/to/test.ts
```

---

## ⚡ 测试修复流程

### 🎯 核心原则

1. **理解测试意图** - 修复前完整阅读测试代码
2. **测试优先** - 测试错误时修改测试而非实现
3. **🚨 失败阈值** - 连续失败1-2次后寻求帮助
4. **专注单一** - 只修复指定测试

### 📋 修复步骤

1. **复现问题** - 运行失败测试，确认本地复现
2. **分析原因** - 检查代码、错误日志、Git历史
3. **建立假设** - 判断问题在测试/实现/环境
4. **修复验证** - 实施修复，确认测试通过
5. **扩大验证** - 运行文件内所有测试

## 🎯 测试编写最佳实践

### Mock策略：低成本真实性

**原则**: 默认追求真实性，仅在"高成本"时简化

```typescript
// ✅ 好：Mock I/O，保留真实格式
beforeEach(() => {
  vi.spyOn(fs, 'readFileSync').mockImplementation((path) => {
    if (path.includes('.pdf')) return '%PDF-1.4\n%âãÏÓ'; // 真实PDF头
    return '';
  });
});

// ❌ 过度简化
const result = parseContentType('fake-pdf-content');
```

### 错误测试：测试行为非文本

```typescript
// ✅ 推荐
expect(() => processInput(null)).toThrow();
expect(() => validateUser({})).toThrow(ValidationError);

// ❌ 避免
expect(() => processUser({})).toThrow('具体错误文案');
```

### TypeScript类型放宽

```typescript
// ✅ 测试中适度放宽类型
const result = await someFunction();
expect(result!.data).toBeDefined(); // 非空断言

// 访问私有成员优先使用中括号
await instance['getFromCache']('key'); // ✅ 推荐
await (instance as any).getFromCache; // ❌ 避免
```

---

## 🗃️ 数据库Model测试

> **💡 提示**: 环境选择决策请参考上方 [环境选择决策](#-环境选择决策) 章节

### 🔒 安全第一：用户权限检查

**最关键要求**：所有用户数据操作必须包含权限检查

```typescript
// ✅ 安全实现
update = async (id: string, data: Partial<MyModel>) => {
  return this.db
    .update(myTable)
    .set(data)
    .where(
      and(
        eq(myTable.id, id),
        eq(myTable.userId, this.userId), // ✅ 必需的权限检查
      ),
    )
    .returning();
};

// ❌ 危险实现
update = async (id: string, data: Partial<MyModel>) => {
  return this.db.update(myTable).set(data).where(eq(myTable.id, id)); // ❌ 缺少userId检查
};
```

### 必测安全场景

```typescript
it('should not update records of other users', async () => {
  // 创建其他用户记录
  const [otherRecord] = await serverDB
    .insert(myTable)
    .values({ userId: 'other-user', data: 'original' });

  // 尝试更新（应该失败）
  const result = await myModel.update(otherRecord.id, { data: 'hacked' });

  expect(result).toBeUndefined(); // 权限检查阻止

  // 验证数据未被修改
  const unchanged = await serverDB.query.myTable.findFirst({
    where: eq(myTable.id, otherRecord.id),
  });
  expect(unchanged?.data).toBe('original');
});
```

### 测试文件结构

```typescript
// @vitest-environment node
describe('MyModel', () => {
  describe('create', () => {
    it('should create new record');
  });

  describe('update', () => {
    it('should update own records');
    it('should NOT update other users records'); // 🔒 安全测试
  });

  describe('delete', () => {
    it('should delete own records');
    it('should NOT delete other users records'); // 🔒 安全测试
  });

  describe('user isolation', () => {
    it('should enforce user data isolation'); // 🔒 核心安全
  });
});
```

### Mock外部依赖

```typescript
// 文件顶部Mock设置
const mockGetFullFileUrl = vi.fn();
vi.mock('@/server/services/file', () => ({
  FileService: vi.fn().mockImplementation(() => ({
    getFullFileUrl: mockGetFullFileUrl,
  })),
}));

// beforeEach重置和配置
beforeEach(async () => {
  vi.clearAllMocks();
  mockGetFullFileUrl.mockImplementation((url) => `https://example.com/${url}`);
});
```

### 数据处理要点

```typescript
// ✅ 使用Schema类型
import { NewGeneration } from '../../schemas';

const testData: NewGeneration = {
  id: 'test-id',
  asyncTaskId: null, // 外键约束：使用null
  fileId: null, // 而非无效字符串
  userId,
};

// ✅ 可预测排序测试
it('should return in correct order', async () => {
  const oldDate = new Date('2024-01-01T10:00:00Z');
  const newDate = new Date('2024-01-02T10:00:00Z');

  const batch1 = { ...testBatch, createdAt: oldDate };
  const batch2 = { ...testBatch, createdAt: newDate };

  // 明确时间戳确保排序可预测
});
```

### 数据库状态管理

```typescript
beforeEach(async () => {
  await serverDB.delete(users); // 清理（级联删除）
  await serverDB.insert(users).values([{ id: userId }]);
});

afterEach(async () => {
  await serverDB.delete(users);
});
```

### ✅ Model测试验收清单

**🎯 使用提醒**: 完成Model测试后，用此清单确保测试质量

#### 🔧 基础配置

- [ ] 双环境验证通过
- [ ] 使用正确Schema类型

#### 🔒 安全测试

- [ ] 包含用户权限检查
- [ ] 测试用户隔离场景
- [ ] 验证无法访问他人数据

#### 🗃️ 数据处理

- [ ] 正确处理外键约束
- [ ] 排序测试使用明确时间戳
- [ ] 数据库状态管理正确

#### 🎭 Mock和依赖

- [ ] Mock外部依赖服务
- [ ] 重置和配置Mock
- [ ] 验证Mock调用

#### 📋 覆盖完整

- [ ] 覆盖主要方法
- [ ] 测试边界和错误场景
- [ ] 两环境结果一致

## 🖥️ Electron IPC测试

对于Electron IPC接口，采用Mock返回值策略：

```typescript
vi.mock('@/server/modules/ElectronIPCClient', () => ({
  electronIpcClient: {
    getFilePathById: vi.fn(),
    deleteFiles: vi.fn(),
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(electronIpcClient.deleteFiles).mockResolvedValue({
    success: true,
  });
});
```

---

## 🔍 常见问题排查

> **🎯 使用提醒**: 遇到奇怪问题时，按问题现象对照下方场景进行系统性排查

### 🔧 Git历史分析：定位测试失败原因

当测试突然失败时，系统性检查代码修改历史往往能快速定位根本原因。

**Step 1: 检查当前工作区**

```bash
git status               # 查看未提交的修改
git diff path/to/test.ts # 测试文件的具体改动
git diff path/to/impl.ts # 实现文件的具体改动
```

**Step 2: 追溯最近提交历史**

```bash
git log --oneline -5 path/to/file.ts # 文件最近5次提交记录
git show HEAD~1 -- path/to/file.ts   # 查看上一次提交的具体改动内容
```

**Step 3: 时间关联性分析**
根据提交时间判断问题相关性：

- 🔴 **24小时内提交**：高度可疑，很可能是直接原因
- 🟡 **1-7天内提交**：中等相关，需要仔细分析改动
- ⚪ **超过1周的提交**：低相关性，除非是重大架构调整

**实际应用示例**：

```bash
# 场景：UserService.test.ts 突然失败
git log --oneline -3 src/services/UserService.ts
# 输出：
# a1b2c3d (2小时前) fix: update user validation logic  🔴 高度可疑
# d4e5f6g (3天前) refactor: extract common utils      🟡 可能相关
# g7h8i9j (2周前) docs: add JSDoc comments           ⚪ 不太相关

git show a1b2c3d -- src/services/UserService.ts
# 查看具体改动，很可能找到测试失败的真正原因
```

### 🚨 问题1：模块污染导致的"灵异"失败

**现象识别**：

- 单独运行某个测试 ✅ 通过
- 和其他测试一起运行 ❌ 失败
- 测试执行顺序影响结果
- Mock设置看起来正确，但实际使用旧版本

**典型场景**：多个测试动态Mock同一模块

```typescript
// ❌ 问题代码：容易模块污染
describe('ConfigService', () => {
  it('dev mode test', async () => {
    vi.doMock('./config', () => ({ isDev: true }));
    const { getSettings } = await import('./service'); // 第1次加载
    expect(getSettings().debug).toBe(true);
  });

  it('prod mode test', async () => {
    vi.doMock('./config', () => ({ isDev: false }));
    const { getSettings } = await import('./service'); // 可能使用缓存！
    expect(getSettings().debug).toBe(false); // ❌ 可能失败
  });
});
```

**解决方案**：

```typescript
// ✅ 正确解决：清除模块缓存
beforeEach(() => {
  vi.resetModules(); // 确保每个测试都是干净环境
});
```

### ⚠️ 问题2：Mock未生效或验证失败

**现象识别**：

- 错误：`undefined is not a spy`
- Mock函数没有被调用
- Mock返回值不是预期的

**常见原因及解决**：

```typescript
// ❌ 问题1：Mock设置时机错误
it('should call service', () => {
  const mockFn = vi.fn(); // ❌ 测试内设置，可能太晚
  vi.mock('./service', () => ({ callApi: mockFn }));
});

// ✅ 解决1：在文件顶部设置Mock
const mockCallApi = vi.fn();
vi.mock('./service', () => ({
  callApi: mockCallApi,
}));

beforeEach(() => {
  vi.clearAllMocks(); // 每次测试前重置
});
```

### 💾 问题3：测试数据相互污染

**现象识别**：

- 测试单独运行通过，批量运行失败
- 数据库中有"意外"的数据
- 断言数量不符合预期

**解决策略**：

```typescript
// ✅ 正确的数据清理
beforeEach(async () => {
  // 级联清理：先清理主表，自动清理关联数据
  await serverDB.delete(users);

  // 重新创建测试数据
  await serverDB.insert(users).values([{ id: testUserId }, { id: otherUserId }]);
});

afterEach(async () => {
  // 测试后清理
  await serverDB.delete(users);
});
```

### ⏰ 问题4：异步操作竞态条件

**现象识别**：

- 测试结果不稳定，有时通过有时失败
- 涉及setTimeout、Promise的测试

**解决方案**：

```typescript
// ❌ 问题：异步操作没有正确等待
it('should process async data', () => {
  processDataAsync(data);
  expect(result).toBeDefined(); // ❌ 可能还未完成
});

// ✅ 解决：正确等待异步操作
it('should process async data', async () => {
  await processDataAsync(data);
  expect(result).toBeDefined(); // ✅ 等待完成后断言
});
```

### 🔗 问题5：外键约束违反

**现象识别**：

- 错误：`violates foreign key constraint`
- 数据库插入失败

**解决方案**：

```typescript
// ❌ 问题：使用无效外键值
const testData = {
  fileId: 'invalid-file-id', // ❌ 表中不存在
  userId: 'non-existent-user' // ❌ 表中不存在
};

// ✅ 解决1：使用null值
const testData = {
  fileId: null,    // ✅ 避免约束检查
  userId: testUser.id // ✅ 使用真实存在的ID
};

// ✅ 解决2：先创建依赖数据
beforeEach(async () => {
  // 先创建用户
  await serverDB.insert(users).values({ id: testUserId });

  // 如果需要文件关联，创建文件
  await serverDB.insert(files).values({
    id: testFileId,
    userId: testUserId,
    name: 'test.jpg'
  });
});
```


---

## 📝 修复总结格式

```markdown
## 测试修复总结

**错误原因**: [具体原因分析]

**修复方法**: [采用的解决方案和修改文件]
```
