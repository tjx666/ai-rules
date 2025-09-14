#!/usr/bin/env node

/**
 * PreToolUse Hook: Tool Usage Checks
 *
 * This hook provides various checks for tool usage and suggests better alternatives:
 * - mv command detection: suggests using VSCode MCP renameFile instead
 * - More checks can be added in the future
 */

const path = require('path');

// Import utils
const { exitWithTime, hookMain, extractToolInfo } = require('./utils/core');
const { isPathInWorkspace } = require('./utils/filesystem');
const { parseMvCommand } = require('./utils/command');
const { generateSystemReminder } = require('./utils/reminder');

// Configuration
const LOG_FILE = 'preToolUseChecks.log';

// Check if mv command is being used for file renaming
function checkMvCommand(command) {
  const mvInfo = parseMvCommand(command);

  if (mvInfo && mvInfo.isRename) {
    return {
      sourceFile: mvInfo.sourceFile,
      targetFile: mvInfo.targetFile,
      isWorkspaceFile: isPathInWorkspace(mvInfo.sourceFile),
    };
  }

  return null;
}

// Main checker function that can be extended with more checks
async function performChecks(toolName, toolInput, logger) {
  const issues = [];

  // Only check Bash tool calls
  if (toolName !== 'Bash') {
    await logger.debug(`Tool is not Bash (${toolName}), skipping checks`);
    return issues;
  }

  const command = toolInput.command || '';
  await logger.debug(`Checking bash command: ${command}`);

  if (!command.trim()) {
    await logger.debug('Empty command, skipping checks');
    return issues;
  }

  // Check 1: mv command detection
  const mvCheck = checkMvCommand(command);
  if (mvCheck) {
    await logger.debug(`Detected mv rename: ${mvCheck.sourceFile} -> ${mvCheck.targetFile}`);

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

// Main hook processing logic
async function processHook(toolData, logger) {
  const { toolName, toolInput } = extractToolInfo(toolData);

  // Perform all checks
  const issues = await performChecks(toolName, toolInput, logger);

  if (issues.length > 0) {
    await logger.debug(`Found ${issues.length} suggestion(s)`);

    // Generate and output system reminder
    const reminder = generateSystemReminder(issues);
    process.stderr.write(reminder);

    await exitWithTime(2, 'suggestions-provided', logger);
    return;
  }

  await logger.debug('No suggestions needed');
  await exitWithTime(0, 'success', logger);
}

// Use the hookMain utility for consistent stdin handling
hookMain(processHook, LOG_FILE);
