# Language Preferences

## 1. Communication Language

- **Always use Chinese** for our chat conversations. This is my native language and improves my reading efficiency.

## 2. Code, Comments, and UI Text

### a. Code Identifiers

- All variables, function names, class names, etc., **must be in American English**.

### b. Comments and UI Text (Decision Flow)

The guiding principle is **consistency with the file being edited**. Before writing any comments or UI text, follow this decision flow:

#### **Scenario 1: Creating a NEW file**

- **Use American English exclusively** for all comments and UI text.
- **Reasoning:** As this is an open-source project, English is the default language to encourage international collaboration.

#### **Scenario 2: Modifying an EXISTING file**

1. **Analyze First:** Quickly scan the file to identify the dominant language used for comments and string literals.
2. **Maintain Consistency:**
   - If the file is predominantly in **English**, continue using **English**.
   - If the file is predominantly in **Chinese**, use **Chinese** for your edits to respect the existing style.
3. **The Exception for New, Large Blocks:** If you are adding a new, significant, and self-contained block of code (e.g., a new class, a complex multi-line function) to an existing file, prefer **American English** for the comments within that _new block_, even if other parts of the file contain Chinese.

### c. Critical Constraint

- **DO NOT** proactively translate existing Chinese comments or UI text into English. My goal is to collaborate, not to refactor language styles without being asked. Respect the work of other contributors.
