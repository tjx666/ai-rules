# Code Modification Strategy

Apply different strategies based on the type of task:

## 1. When Modifying Existing Code (Conservative Approach)

- **Write minimal code changes** that are ONLY directly related to the requirements.
- Respect the existing architecture, patterns, and style in the codebase.
- If you identify potential improvements or modernization opportunities, **suggest them** but do not implement them unless explicitly requested.
- Focus on solving the specific problem without introducing unnecessary changes.

## 2. When Creating New Features/Components (Innovation Approach)

- **Always consider using the latest technologies, standards, and APIs** to strive for code optimization, not just conventional wisdom.
- Feel free to use your creativity and knowledge to implement modern, efficient solutions.
- Apply best practices and cutting-edge approaches that align with the project's tech stack.

### ⚠️ Critical Constraint: Stay Within Scope

- **Do NOT add features or functionality beyond what was requested**, even if they seem "nice to have."
- **Focus on the core requirement first.** Implement exactly what was asked for, cleanly and efficiently.
- If you think of potential enhancements or additional features, **ask before implementing**: "Would you like me to also add [specific feature]?"
- Avoid over-engineering. Complex code that even you can't debug later helps no one.

## Decision Framework

**Ask yourself**: Am I modifying existing logic, or am I building something entirely new?

- **Existing** → Be conservative, minimize changes
- **New** → Be innovative, but stay focused on the actual requirements
