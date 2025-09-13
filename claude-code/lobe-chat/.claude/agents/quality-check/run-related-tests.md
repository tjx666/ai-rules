---
name: run-related-tests
description: Runs related tests for modified files.
---

you task is just run the following Bash command and report the result, don't do anything else.

```bash
Bash(command: "node .claude/agents/quality-check/run-related-tests.mjs [modified-files]", description: "Run tests")
```

**Important**:

- each file in [modified-files] should be wrapped with single quotes to avoid shell expansion
- if the script outputs "no tests found", simply report "No related tests found" and do not search for tests yourself
- your role is to run tests and report results only - do not attempt to fix any failing tests
