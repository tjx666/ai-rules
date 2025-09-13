#!/usr/bin/env node

/**
 * PreToolUse Hook: Dangerous Bash Commands Checker
 *
 * This hook detects dangerous bash commands and requires user confirmation:
 * - rm commands (file deletion outside workspace or untracked files)
 * - git push --force commands (remote repository operations)
 *
 * Environment Variables:
 * - DEBUG_DANGEROUS_BASH=true: Enable debug logging to .claude/logs/
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

const startTime = process.hrtime.bigint();

// Configuration
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const LOG_DIR = path.join(PROJECT_DIR, '.claude', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'dangerous_bash_checker.log');
const DEBUG = !!process.env.CC_HOOK_DEBUG;

// Dangerous command patterns
const DANGEROUS_PATTERNS = [
  {
    pattern: /\brm\s+/,
    command: 'rm',
    description: '文件删除操作',
    reason: '可能会意外删除重要文件',
  },
  {
    pattern: /\bgit\s+push\b.*\s(-f|--force)\b/,
    command: 'git push --force',
    description: '🚀 强制推送到远程仓库',
    reason: '会覆盖远程仓库历史，可能影响其他协作者',
  },
];

// Helper function for debug logging
async function logDebug(message) {
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
async function exitWithTime(exitCode, status, jsonOutput = null) {
  const endTime = process.hrtime.bigint();
  const executionTime = Number(endTime - startTime) / 1_000_000;
  await logDebug(`Hook execution time: ${executionTime.toFixed(2)}ms (${status})`);

  if (jsonOutput) {
    console.log(JSON.stringify(jsonOutput, null, 2));
  }

  process.exit(exitCode);
}

// Extract file paths from rm command
function extractRmFilePaths(command) {
  // Match rm command with various flags and extract file paths
  const rmMatch = command.match(/\brm\s+(?:[-\w\s]*\s+)?(.+)/);
  if (!rmMatch) return [];

  // Split arguments and filter out flags
  const args = rmMatch[1].trim().split(/\s+/);
  return args.filter((arg) => !arg.startsWith('-'));
}

// Check if path is within workspace
function isPathInWorkspace(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    const relativePath = path.relative(PROJECT_DIR, absolutePath);
    // If relative path starts with ../ it means it's outside workspace
    return !relativePath.startsWith('../') && !path.isAbsolute(relativePath);
  } catch (error) {
    return false;
  }
}

// Check if file is tracked by git
async function isFileTrackedByGit(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    const relativePath = path.relative(PROJECT_DIR, absolutePath);

    // Use git ls-files to check if file is tracked
    const { stdout } = await execAsync(
      `cd "${PROJECT_DIR}" && git ls-files "${relativePath}" 2>/dev/null`,
      { cwd: PROJECT_DIR },
    );
    return stdout.trim().length > 0;
  } catch (error) {
    await logDebug(`Error checking git status for ${filePath}: ${error.message}`);
    return false;
  }
}

// Check if command contains dangerous patterns
async function checkDangerousCommand(command) {
  const dangerousCommands = [];

  for (const { pattern, command: cmdName, description, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      // Special handling for rm command
      if (cmdName === 'rm') {
        const filePaths = extractRmFilePaths(command);
        await logDebug(`Extracted rm file paths: ${JSON.stringify(filePaths)}`);

        let hasDangerousFiles = false;
        const dangerousFiles = [];

        for (const filePath of filePaths) {
          const inWorkspace = isPathInWorkspace(filePath);
          await logDebug(`File ${filePath} in workspace: ${inWorkspace}`);

          if (!inWorkspace) {
            // File outside workspace is always dangerous
            dangerousFiles.push(`${filePath} (workspace外)`);
            hasDangerousFiles = true;
          } else {
            // File in workspace, check git status
            const isTracked = await isFileTrackedByGit(filePath);
            await logDebug(`File ${filePath} tracked by git: ${isTracked}`);

            if (!isTracked) {
              // File in workspace but not tracked by git is dangerous
              dangerousFiles.push(`${filePath} (未被git跟踪)`);
              hasDangerousFiles = true;
            }
          }
        }

        if (hasDangerousFiles) {
          dangerousCommands.push({
            command: cmdName,
            description: `🗑️ 删除以下文件`,
            reason: dangerousFiles.join(', '),
            pattern: pattern.toString(),
          });
        }
      } else if (cmdName === 'git push --force') {
        // Special handling for git push --force
        dangerousCommands.push({
          command: cmdName,
          description: '🚀 强制推送到远程仓库',
          reason: '会覆盖远程仓库历史，可能导致其他协作者丢失代码',
          pattern: pattern.toString(),
        });
      } else {
        // For other commands, use original logic
        dangerousCommands.push({
          command: cmdName,
          description,
          reason,
          pattern: pattern.toString(),
        });
      }
    }
  }

  return dangerousCommands;
}

async function main() {
  // Read JSON input from stdin
  let inputData = '';

  if (process.stdin.isTTY) {
    await logDebug('No stdin data available');
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
        await logDebug('Empty stdin');
        await exitWithTime(0, 'empty-stdin');
        return;
      }

      await logDebug(`Hook triggered with input: ${inputData.substring(0, 200)}...`);

      const toolData = JSON.parse(inputData.trim());
      const toolName = toolData.tool_name;
      const toolInput = toolData.tool_input || {};

      // Only check Bash tool calls
      if (toolName !== 'Bash') {
        await logDebug(`Tool is not Bash (${toolName}), allowing`);
        await exitWithTime(0, 'not-bash', {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'allow',
            permissionDecisionReason: `Tool is not Bash: ${toolName}`,
          },
        });
        return;
      }

      const command = toolInput.command || '';
      await logDebug(`Checking bash command: ${command}`);

      if (!command.trim()) {
        await logDebug('Empty command, allowing');
        await exitWithTime(0, 'empty-command', {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'allow',
            permissionDecisionReason: 'Empty command',
          },
        });
        return;
      }

      // Check for dangerous patterns
      const dangerousCommands = await checkDangerousCommand(command);

      if (dangerousCommands.length > 0) {
        await logDebug(
          `Found dangerous command(s): ${dangerousCommands.map((c) => c.command).join(', ')}`,
        );

        const commandsList = dangerousCommands
          .map((cmd) => `- ${cmd.description}: ${cmd.reason}`)
          .join('\n');

        await exitWithTime(0, 'dangerous-command-detected', {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'ask',
            permissionDecisionReason: `\n⚠️  检测到 Bash(${command})\n\n🚨 包含以下危险操作:\n${commandsList}\n\n❓ 是否继续执行？`,
          },
        });
        return;
      }

      await logDebug('Command is safe, allowing');
      await exitWithTime(0, 'safe-command', {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'allow',
          permissionDecisionReason: 'Command is safe',
        },
      });
    } catch (error) {
      await logDebug(`Error processing input: ${error.message}`);
      console.error('PreToolUse Hook Error:', error);
      await exitWithTime(1, 'error', {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: `Hook error: ${error.message}`,
        },
      });
    }
  });
}

main();
