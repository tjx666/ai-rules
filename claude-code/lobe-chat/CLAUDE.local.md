# CLAUDE.local.md

this is a local claude code guide.

## 🚨 Quality Checks (Mandatory)

**CRITICAL**: Use three parallel quality-check subagents after any code modifications:

<command_example>
Task(subagent_type: "code-review", description: "Code review analysis", prompt: "Modified 6 files: ragEval models, UserService constructors changed from (userId) to (db, userId). Fixed #8826 dependency injection. Check consistency.")
Task(subagent_type: "diagnostics", description: "Diagnostic analysis", prompt: "[Use same file list and summary as above]")
Task(subagent_type: "testing", description: "Testing analysis", prompt: "[Use same file list and summary as above]")
</command_example>

**Note**: Always provide the same detailed file list and modification summary to all three subagents.

**Priority**: Fix CRITICAL (compilation/security) → HIGH (ESLint errors/missing tests) → MEDIUM/LOW
