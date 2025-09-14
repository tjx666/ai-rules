/**
 * Core utilities for Claude Code hooks
 */


// Configuration
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

/**
 * Helper function to exit with execution time logging
 *
 * Exit codes for use stdout/stderr:
 * 0: success
 * 1: error (report to user but not to Claude)
 * 2: blocked (report to Claude to provide suggestions)
 *
 * Exit codes for use advanced json output: just use exit code 0
 *
 * @param {number} exitCode - Exit code
 * @param {string} status - Status message
 * @param {Object} logger - Logger instance with time() method
 * @param {Object} jsonOutput - Optional JSON output for PreToolUse hooks
 */
async function exitWithTime(exitCode, status, logger, jsonOutput = null) {
  await logger.time('Hook');
  await logger.debug(`Exiting with code ${exitCode} (${status})`);

  if (jsonOutput) {
    console.log(JSON.stringify(jsonOutput, null, 2));
  }

  process.exit(exitCode);
}

/**
 * Read and parse JSON from stdin
 * @returns {Promise<Object|null>} Parsed JSON data or null if no input
 */
async function readStdinJson() {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) {
      resolve(null);
      return;
    }

    let inputData = '';
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (chunk) => {
      inputData += chunk;
    });

    process.stdin.on('end', () => {
      try {
        if (!inputData.trim()) {
          resolve(null);
        } else {
          const data = JSON.parse(inputData.trim());
          resolve(data);
        }
      } catch (error) {
        reject(error);
      }
    });

    process.stdin.on('error', reject);
  });
}

/**
 * Standard hook main function wrapper
 * Handles stdin reading, error handling, and logging
 *
 * @param {Function} handler - Async function to handle the tool data, receives (toolData, logger)
 * @param {string} logFile - Log file name
 * @returns {Promise<void>}
 */
async function hookMain(handler, logFile) {
  const startTime = process.hrtime.bigint();
  const { createLogger } = require('./logger');
  const logger = createLogger(logFile, startTime);

  try {
    const toolData = await readStdinJson();

    if (!toolData) {
      await logger.debug('No stdin data available');
      await exitWithTime(0, 'no-stdin', logger);
      return;
    }

    await logger.debug(`Hook triggered with tool: ${toolData.tool_name || 'Unknown'}`);

    // Call the handler with toolData and logger
    const result = await handler(toolData, logger);

    // Handler can return custom exit behavior
    if (result && typeof result === 'object') {
      const { exitCode = 0, status = 'success', jsonOutput = null } = result;
      await exitWithTime(exitCode, status, logger, jsonOutput);
    } else {
      await exitWithTime(0, 'success', logger);
    }
  } catch (error) {
    await logger.debug(`Error: ${error.message}\nStack: ${error.stack}`);
    console.error('Hook Error:', error);
    await exitWithTime(1, 'error', logger);
  }
}

/**
 * Extract tool name and input from tool data
 * @param {Object} toolData - Tool data from stdin
 * @returns {Object} Object with toolName and toolInput
 */
function extractToolInfo(toolData) {
  return {
    toolName: toolData.tool_name || 'Unknown',
    toolInput: toolData.tool_input || {},
    toolResponse: toolData.tool_response || {},
    transcriptPath: toolData.transcript_path,
  };
}

module.exports = {
  PROJECT_DIR,
  exitWithTime,
  readStdinJson,
  hookMain,
  extractToolInfo,
};
