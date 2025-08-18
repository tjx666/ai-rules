---
description: Add comprehensive tests for recent code changes
argument-hint: [<test-files>]
---

<ultrathink />

Generate comprehensive tests for the specified files or recent code changes.

## Test File Resolution

1. **If test files provided via `#$ARGUMENTS`**: Use the specified files
2. **Otherwise**: Analyze recent discussion and code changes to determine which files need testing

## Test Implementation Process

1. **Follow Testing Guidelines**
   - Reference `@../agents/testing-expert.md` for project-specific testing patterns

2. **Write Tests Directly**
   - No need to use testing-expert subagent
