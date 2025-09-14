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

// Import utils
const { exitWithTime, hookMain, extractToolInfo } = require('./utils/core');
const { isPathInWorkspace } = require('./utils/filesystem');
const { isFileTrackedByGit } = require('./utils/git');
const { extractRmFilePaths, checkDangerousPatterns } = require('./utils/command');

// Configuration
const LOG_FILE = 'dangerous_bash_checker.log';

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


// Check if command contains dangerous patterns
async function checkDangerousCommand(command, logger) {
  const dangerousCommands = [];

  for (const { pattern, command: cmdName, description, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      // Special handling for rm command
      if (cmdName === 'rm') {
        const filePaths = extractRmFilePaths(command);
        await logger.debug(`Extracted rm file paths: ${JSON.stringify(filePaths)}`);

        let hasDangerousFiles = false;
        const dangerousFiles = [];

        for (const filePath of filePaths) {
          const inWorkspace = isPathInWorkspace(filePath);
          await logger.debug(`File ${filePath} in workspace: ${inWorkspace}`);

          if (!inWorkspace) {
            // File outside workspace is always dangerous
            dangerousFiles.push(`${filePath} (workspace外)`);
            hasDangerousFiles = true;
          } else {
            // File in workspace, check git status
            const isTracked = await isFileTrackedByGit(filePath, LOG_FILE);
            await logger.debug(`File ${filePath} tracked by git: ${isTracked}`);

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

// Main hook processing logic
async function processHook(toolData, logger) {
  const { toolName, toolInput } = extractToolInfo(toolData);

  // Only check Bash tool calls
  if (toolName !== 'Bash') {
    await logger.debug(`Tool is not Bash (${toolName}), allowing`);
    await exitWithTime(0, 'not-bash', logger, {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        permissionDecisionReason: `Tool is not Bash: ${toolName}`,
      },
    });
    return;
  }

  const command = toolInput.command || '';
  await logger.debug(`Checking bash command: ${command}`);

  if (!command.trim()) {
    await logger.debug('Empty command, allowing');
    await exitWithTime(0, 'empty-command', logger, {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        permissionDecisionReason: 'Empty command',
      },
    });
    return;
  }

  // Check for dangerous patterns
  const dangerousCommands = await checkDangerousCommand(command, logger);

  if (dangerousCommands.length > 0) {
    await logger.debug(
      `Found dangerous command(s): ${dangerousCommands.map((c) => c.command).join(', ')}`,
    );

    const commandsList = dangerousCommands
      .map((cmd) => `- ${cmd.description}: ${cmd.reason}`)
      .join('\n');

    await exitWithTime(0, 'dangerous-command-detected', logger, {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: `\n⚠️  检测到 Bash(${command})\n\n🚨 包含以下危险操作:\n${commandsList}\n\n❓ 是否继续执行？`,
      },
    });
    return;
  }

  await logger.debug('Command is safe, allowing');
  await exitWithTime(0, 'safe-command', logger, {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      permissionDecisionReason: 'Command is safe',
    },
  });
}

// Use the hookMain utility for consistent stdin handling
hookMain(processHook, LOG_FILE);
