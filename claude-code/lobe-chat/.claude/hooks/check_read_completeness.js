#!/usr/bin/env node

/**
 * PreToolUse Hook: Read Tool Completeness Checker (Simplified)
 *
 * Core Rule: First time reading a file < 500 lines must be complete (no offset/limit)
 *
 * Environment Variables:
 * - CC_HOOK_DEBUG=1: Enable debug logging to .claude/logs/
 */

const { hookMain, exitWithTime, extractToolInfo } = require('./utils/core');
const { getReadFiles } = require('./utils/transcript');
const { getFileLineCount } = require('./utils/filesystem');

const LOG_FILE = 'read_completeness.log';

// Helper function to send system reminder message
function sendReminderMessage(reason, filePath, totalLines) {
  const reminder = `<system-reminder>
读取规则违规：文件 ${filePath} (${totalLines} 行) ${reason}。
请重新完整读取该文件以获得完整上下文。
</system-reminder>`;
  process.stderr.write(reminder);
}

async function processHook(toolData, logger) {
  const { toolName, toolInput, transcriptPath } = extractToolInfo(toolData);

  // Only check Read tool calls
  if (toolName !== 'Read') {
    await logger.debug(`Tool is not Read (${toolName}), allowing`);
    await exitWithTime(0, 'not-read', logger);
    return;
  }

  const filePath = toolInput.file_path || '';
  const offset = toolInput.offset;
  const limit = toolInput.limit;

  if (!filePath) {
    await logger.debug('No file path specified');
    await exitWithTime(0, 'no-path', logger);
    return;
  }

  await logger.debug(`File: ${filePath}, Offset: ${offset}, Limit: ${limit}`);

  // Check if partial read (has offset or limit)
  const hasOffset = offset !== undefined && offset !== null && offset !== '';
  const hasLimit = limit !== undefined && limit !== null && limit !== '';
  const isPartialRead = hasOffset || hasLimit;

  if (!isPartialRead) {
    await logger.debug('Complete read requested, allowing');
    await exitWithTime(0, 'complete-read', logger);
    return;
  }

  // Get file line count
  const lineCount = await getFileLineCount(filePath, logger);

  if (lineCount < 0) {
    await logger.debug('Could not get file line count, allowing');
    await exitWithTime(0, 'count-error', logger);
    return;
  }

  // Core rule: Files < 500 lines must be read completely on first read
  if (lineCount >= 500) {
    await logger.debug(`File has ${lineCount} lines (>= 500), partial read allowed`);
    await exitWithTime(0, 'large-file', logger);
    return;
  }

  // Check if this is the first read of the file
  const readFiles = await getReadFiles(transcriptPath, logger);
  const hasBeenRead = readFiles.includes(filePath);

  if (hasBeenRead) {
    await logger.debug(`File has been read before, partial read allowed`);
    await exitWithTime(0, 'already-read', logger);
    return;
  }

  // First time reading a small file with partial read - block it
  await logger.debug(`Rule violation: First read of file < 500 lines with partial read`);
  sendReminderMessage('小于 500 行，必须完整读取', filePath, lineCount);
  await exitWithTime(2, 'blocked', logger);
}

hookMain(processHook, LOG_FILE);