# CLAUDE Hooks

- official document: https://docs.anthropic.com/en/docs/claude-code/hooks

## Testing

Tests are organized to match the actual file structure in `./__tests__` folder:

```
__tests__/
└── utils/
    ├── command.test.js      - Tests for utils/command.js
    ├── filesystem.test.js   - Tests for utils/filesystem.js
    ├── reminder.test.js     - Tests for utils/reminder.js
    ├── logger.test.js       - Tests for utils/logger.js
    └── core.test.js         - Tests for utils/core.js
```

Testing commands:

```bash
cd .claude/hooks && bun test
```
