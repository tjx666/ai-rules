编写 JavaScript 务必遵循以下风格

- 当一个 API 同时有同步版本和异步版本，请使用异步版本，异步非阻塞性能由于同步版本。
- 优先使用 `import { commands } from 'vscode'` 而不是 `import * as vscode from 'vscode'` 的导入风格，其实就是优先使用 named import 而不是 namespace import.
- 编写对象的 keys 时请把关键的 key 放前面，例如 id, title 之类的，函数属性放后面。对于 jsx props，建议把相关联的 value 和 回调放一起，例如 value 和 onChange。
