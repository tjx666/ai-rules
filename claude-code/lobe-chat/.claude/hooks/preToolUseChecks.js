#!/usr/bin/env node

/**
 * PreToolUse Hook: Tool Usage Checks
 *
 * This hook provides various checks for tool usage and suggests better alternatives:
 * - mv command detection: suggests using VSCode MCP renameFile instead
 * - More checks can be added in the future
 *
 * Environment Variables:
 * - DEBUG_PRETOOL_CHECKS=true: Enable debug logging to .claude/logs/
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const startTime = process.hrtime.bigint();

// Configuration
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const LOG_DIR = path.join(PROJECT_DIR, '.claude', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'preToolUseChecks.log');
const DEBUG = !!process.env.CC_HOOK_DEBUG;

// Helper function for debug logging
async function log(message) {
  if (DEBUG) {
    if (!fsSync.existsSync(LOG_DIR)) {
      await fs.mkdir(LOG_DIR, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logMessage = `${timestamp} [DEBUG] ${message}\n`;
    await fs.appendFile(LOG_FILE, logMessage);
  }
}

// Helper function to exit with execution time logging
async function exitWithTime(exitCode, status) {
  const endTime = process.hrtime.bigint();
  const executionTime = Number(endTime - startTime) / 1_000_000;
  await log(`Hook execution time: ${executionTime.toFixed(2)}ms (${status})`);
  process.exit(exitCode);
}

// Check if mv command is being used for file renaming
function checkMvCommand(command) {
  // Pattern to detect mv command for renaming (not moving to different directories)
  const mvPattern = /\bmv\s+(['"]?)([^\s'"]+)\1\s+(['"]?)([^\s'"]+)\3/;
  const match = command.match(mvPattern);

  if (!match) {
    return null;
  }

  const sourceFile = match[2];
  const targetFile = match[4];

  // Check if it's a rename operation (same directory)
  const sourceDir = path.dirname(sourceFile);
  const targetDir = path.dirname(targetFile);

  // Consider it a rename if:
  // 1. Same directory, or
  // 2. Both are relative paths in current directory (no path separators)
  const isRename =
    sourceDir === targetDir || (sourceFile.indexOf('/') === -1 && targetFile.indexOf('/') === -1);

  if (isRename) {
    return {
      sourceFile,
      targetFile,
      isWorkspaceFile: isWorkspaceFile(sourceFile),
    };
  }

  return null;
}

// Check if file is within workspace
function isWorkspaceFile(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    const relativePath = path.relative(PROJECT_DIR, absolutePath);
    return !relativePath.startsWith('../') && !path.isAbsolute(relativePath);
  } catch (error) {
    return false;
  }
}

// Main checker function that can be extended with more checks
async function performChecks(toolName, toolInput) {
  const issues = [];

  // Only check Bash tool calls
  if (toolName !== 'Bash') {
    await log(`Tool is not Bash (${toolName}), skipping checks`);
    return issues;
  }

  const command = toolInput.command || '';
  await log(`Checking bash command: ${command}`);

  if (!command.trim()) {
    await log('Empty command, skipping checks');
    return issues;
  }

  // Check 1: mv command detection
  const mvCheck = checkMvCommand(command);
  if (mvCheck) {
    await log(`Detected mv rename: ${mvCheck.sourceFile} -> ${mvCheck.targetFile}`);

    if (mvCheck.isWorkspaceFile) {
      issues.push({
        type: 'mv_rename_suggestion',
        command,
        sourceFile: mvCheck.sourceFile,
        targetFile: mvCheck.targetFile,
        suggestion: 'VSCode MCP renameFile 命令可以自动更新导入引用',
      });
    }
  }

  // Future checks can be added here:
  // - Check 2: other command patterns
  // - Check 3: more suggestions

  return issues;
}

// Generate system reminder for issues
function generateSystemReminder(issues) {
  const reminders = issues
    .map((issue) => {
      switch (issue.type) {
        case 'mv_rename_suggestion':
          return (
            `💡 检测到文件重命名操作：\n` +
            `   命令: ${issue.command}\n` +
            `   建议: 使用 VSCode MCP 工具替代 mv 命令\n` +
            `   推荐: mcp__vscode-mcp__execute_command\n` +
            `         command: "renameFile"\n` +
            `         arguments: ["file://${path.resolve(issue.sourceFile)}", "${path.basename(issue.targetFile)}"]\n` +
            `   优势: ${issue.suggestion}`
          );
        default:
          return `未知检查类型: ${issue.type}`;
      }
    })
    .join('\n\n');

  return `<system-reminder>\n${reminders}\n</system-reminder>`;
}

async function main() {
  // Read JSON input from stdin
  let inputData = '';

  if (process.stdin.isTTY) {
    await log('No stdin data available');
    await exitWithTime(0, 'no-stdin');
    return;
  }

  process.stdin.setEncoding('utf8');

  process.stdin.on('data', (chunk) => {
    inputData += chunk;
  });

  process.stdin.on('end', async () => {
    try {
      if (!inputData.trim()) {
        await log('Empty stdin');
        await exitWithTime(0, 'empty-stdin');
        return;
      }

      await log(`Hook triggered with input: ${inputData.substring(0, 200)}...`);

      const toolData = JSON.parse(inputData.trim());
      const toolName = toolData.tool_name;
      const toolInput = toolData.tool_input || {};

      // Perform all checks
      const issues = await performChecks(toolName, toolInput);

      if (issues.length > 0) {
        await log(`Found ${issues.length} suggestion(s)`);

        // Generate and output system reminder
        const reminder = generateSystemReminder(issues);
        process.stderr.write(reminder);

        await exitWithTime(0, 'suggestions-provided');
        return;
      }

      await log('No suggestions needed');
      await exitWithTime(0, 'success');
    } catch (error) {
      await log(`Error processing input: ${error.message}`);
      console.error('PreToolUse Hook Error:', error);
      await exitWithTime(1, 'error');
    }
  });
}

main();
