编写 Nodejs 代码，务必遵循以下规则：

- 使用例如 fs 等同时支持同步和异步 api 的模块时，采用 `fs/promise` 而不是 promisify 使用异步 API
