# CLAUDE.local.md

this is a local claude code guide.

## User info

- I am a core member of this project with elevated permissions.
- I am mainly responsible for the development and maintenance of LobeChat's multimodal features (currently focusing on the AI image modality).

## Some Useful Resources

- [[RFC] 108 - AI 绘画模态](https://github.com/lobehub/lobe-chat/discussions/7442)

## 🚨 Quality Checks (Mandatory)

**Critical**: After completing a series of code changes, always run the quality checks instead of just `type-check` or `eslint`.

```bash
Task(subagent_type: "code-review", description: "Code review", prompt: "[change description]")
Task(subagent_type: "diagnostics", description: "Diagnostics", prompt: "[same as above]")
Task(subagent_type: "run-related-tests", description: "Run tests", prompt: "[same as above]")
```

<change_description_example>

- **Modified files**: Workspace relative paths list
- **Context**: Feature/business background

</example_change_description>

### Workflow

1. **Initial Check**: Execute parallel checks immediately after code modification
2. **Critical Issues**: Fix non-controversial critical issues (security/blocking bugs) directly
3. **Re-check**: Re-run checks after fixes with updated change description and changed file paths
4. **Iteration**: Repeat until all critical issues are resolved

### Important Notes

- **Parallel execution**: Run all three tasks concurrently for speed
- **Read-only analysis**: Quality check tools don't modify code, fix the issues by your own
