#!/usr/bin/env node

/**
 * PostToolUse Hook: Read Tool Completeness Checker (JavaScript Version)
 *
 * This hook monitors Read tool usage and enforces complete file reading for small files:
 * - Files < 500 lines: Must be read completely (no offset/limit allowed)
 * - Files < 1000 lines: First read should be complete (no limit on initial read)
 *
 * Environment Variables:
 * - HOOK_DEBUG=1: Enable debug logging to .claude/logs/
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const startTime = process.hrtime.bigint();

// Configuration
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const LOG_DIR = path.join(PROJECT_DIR, '.claude', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'read_completeness.log');
// const DEBUG = process.env.HOOK_DEBUG === '1';
const DEBUG = true;

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

// Helper function to send system reminder message
function sendReminderMessage(reason, filePath, totalLines) {
  const reminder = `<system-reminder>
读取规则违规：文件 ${filePath} (${totalLines} 行) ${reason}。
请重新完整读取该文件以获得完整上下文。
</system-reminder>`;
  process.stderr.write(reminder);
}

// Helper function to exit with execution time logging
async function exitWithTime(exitCode, status) {
  const endTime = process.hrtime.bigint();
  const executionTime = Number(endTime - startTime) / 1_000_000;
  await logDebug(`Hook execution time: ${executionTime.toFixed(2)}ms (${status})`);
  process.exit(exitCode);
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

      // Extract tool input parameters
      const toolInput = toolData.tool_input || {};
      const filePath = toolInput.file_path || '';
      const offset = toolInput.offset;
      const limit = toolInput.limit;

      // Extract tool response metadata
      const toolResponse = toolData.tool_response || {};

      await logDebug(`Tool response type: ${typeof toolResponse}`);
      await logDebug(`Tool response keys: ${Object.keys(toolResponse)}`);

      // Check if this is the expected Read tool response structure
      if (!toolResponse.file || typeof toolResponse.file.totalLines !== 'number') {
        await logDebug(
          `Invalid Read tool response structure. Response: ${JSON.stringify(toolResponse)}`,
        );
        await exitWithTime(0, 'invalid-structure');
        return;
      }

      const fileInfo = toolResponse.file;
      const totalLines = fileInfo.totalLines;
      const readLines = fileInfo.numLines || 0;
      const startLine = fileInfo.startLine || 1;

      await logDebug(`File: ${filePath}, Offset: ${offset}, Limit: ${limit}`);
      await logDebug(
        `Total lines: ${totalLines}, Read lines: ${readLines}, Start line: ${startLine}`,
      );

      // Check reading rules
      const hasOffset = offset !== undefined && offset !== null && offset !== '';
      const hasLimit = limit !== undefined && limit !== null && limit !== '';
      const isPartialRead = hasOffset || hasLimit;

      await logDebug(
        `Has offset: ${hasOffset}, Has limit: ${hasLimit}, Is partial: ${isPartialRead}`,
      );

      // Rule 1: Files < 500 lines must be read completely
      if (totalLines < 500 && isPartialRead) {
        await logDebug('Rule violation: File < 500 lines with partial read');
        sendReminderMessage('小于 500 行，必须完整读取', filePath, totalLines);
        await exitWithTime(2, 'blocked-rule1');
        return;
      }

      // Rule 2: Files < 1000 lines should be read completely on first read
      // (Only check if there's a limit but no offset, indicating first read with limit)
      if (totalLines < 1000 && !hasOffset && hasLimit) {
        await logDebug('Rule violation: File < 1000 lines with first partial read');
        sendReminderMessage('小于 1000 行，首次读取应当完整', filePath, totalLines);
        await exitWithTime(2, 'blocked-rule2');
        return;
      }

      await logDebug('No rule violations detected');
      await exitWithTime(0, 'success');
    } catch (error) {
      await logDebug(`Error processing input: ${error.message}`);
      console.error('PostToolUse Hook Error:', error);
      await exitWithTime(1, 'error');
    }
  });
}

main();
