#!/usr/bin/env node

/**
 * PreToolUse Hook: Dangerous Bash Commands Checker
 *
 * This hook detects dangerous bash commands and requires user confirmation:
 * - rm commands (file deletion)
 * - git push commands (remote repository operations)
 *
 * Environment Variables:
 * - DEBUG_DANGEROUS_BASH=true: Enable debug logging to .claude/logs/
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const startTime = process.hrtime.bigint();

// Configuration
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const LOG_DIR = path.join(PROJECT_DIR, '.claude', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'dangerous_bash_checker.log');
const DEBUG = process.env.DEBUG_DANGEROUS_BASH === 'true' || true;

// Dangerous command patterns
const DANGEROUS_PATTERNS = [
  {
    pattern: /\brm\s+/,
    command: 'rm',
    description: '文件删除操作',
    reason: '可能会意外删除重要文件'
  },
  {
    pattern: /\bgit\s+push\b/,
    command: 'git push',
    description: '推送到远程仓库',
    reason: '会修改远程仓库，可能影响其他协作者'
  }
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

// Check if command contains dangerous patterns
function checkDangerousCommand(command) {
  const dangerousCommands = [];
  
  for (const { pattern, command: cmdName, description, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      dangerousCommands.push({
        command: cmdName,
        description,
        reason,
        pattern: pattern.toString()
      });
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
            permissionDecisionReason: `Tool is not Bash: ${toolName}`
          }
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
            permissionDecisionReason: 'Empty command'
          }
        });
        return;
      }

      // Check for dangerous patterns
      const dangerousCommands = checkDangerousCommand(command);

      if (dangerousCommands.length > 0) {
        await logDebug(`Found dangerous command(s): ${dangerousCommands.map(c => c.command).join(', ')}`);
        
        const commandsList = dangerousCommands
          .map(cmd => `- ${cmd.command}: ${cmd.description} (${cmd.reason})`)
          .join('\n');

        await exitWithTime(0, 'dangerous-command-detected', {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'ask',
            permissionDecisionReason: `\n⚠️  检测到 Bash(${command})\n\n🚨 包含以下危险操作:\n${commandsList}\n\n❓ 是否继续执行？`
          }
        });
        return;
      }

      await logDebug('Command is safe, allowing');
      await exitWithTime(0, 'safe-command', {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'allow',
          permissionDecisionReason: 'Command is safe'
        }
      });
    } catch (error) {
      await logDebug(`Error processing input: ${error.message}`);
      console.error('PreToolUse Hook Error:', error);
      await exitWithTime(1, 'error', {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: `Hook error: ${error.message}`
        }
      });
    }
  });
}

main();