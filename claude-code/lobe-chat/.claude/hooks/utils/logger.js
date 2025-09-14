/**
 * Logger utilities for Claude Code hooks
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Configuration
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const LOG_DIR = path.join(PROJECT_DIR, '.claude', 'logs');

/**
 * Helper function for debug logging
 * @param {string} logFile - Log file name (e.g., 'myHook.log')
 * @param {string} message - Message to log
 * @param {boolean} forceLog - Force logging regardless of DEBUG flag
 */
async function logDebug(logFile, message, forceLog = false) {
  const DEBUG = !!process.env.CC_HOOK_DEBUG;

  if (DEBUG || forceLog) {
    if (!fsSync.existsSync(LOG_DIR)) {
      await fs.mkdir(LOG_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logMessage = `${timestamp} [DEBUG] ${message}\n`;
    const logPath = path.join(LOG_DIR, logFile);
    await fs.appendFile(logPath, logMessage);
  }
}

/**
 * Log an error with stack trace
 * @param {string} logFile - Log file name
 * @param {string} context - Context where error occurred
 * @param {Error} error - Error object
 */
async function logError(logFile, context, error) {
  const message = `ERROR in ${context}: ${error.message}\nStack: ${error.stack}`;
  await logDebug(logFile, message, true); // Force log errors
}

/**
 * Log execution time
 * @param {string} logFile - Log file name
 * @param {string} operation - Operation name
 * @param {bigint} startTime - Start time from process.hrtime.bigint()
 */
async function logExecutionTime(logFile, operation, startTime) {
  const endTime = process.hrtime.bigint();
  const executionTime = Number(endTime - startTime) / 1_000_000;
  await logDebug(logFile, `${operation} execution time: ${executionTime.toFixed(2)}ms`);
}

/**
 * Log JSON data in readable format
 * @param {string} logFile - Log file name
 * @param {string} label - Label for the data
 * @param {any} data - Data to log
 * @param {number} maxLength - Maximum string length before truncation
 */
async function logJson(logFile, label, data, maxLength = 500) {
  let jsonStr = JSON.stringify(data, null, 2);
  if (jsonStr.length > maxLength) {
    jsonStr = jsonStr.substring(0, maxLength) + '... (truncated)';
  }
  await logDebug(logFile, `${label}: ${jsonStr}`);
}

/**
 * Create a logger instance with a fixed log file and start time
 * @param {string} logFile - Log file name
 * @param {bigint} startTime - Start time from process.hrtime.bigint()
 * @returns {Object} Logger instance with bound methods
 */
function createLogger(logFile, startTime = null) {
  return {
    debug: (message) => logDebug(logFile, message),
    error: (context, error) => logError(logFile, context, error),
    time: (operation) => startTime ? logExecutionTime(logFile, operation, startTime) : null,
    json: (label, data, maxLength) => logJson(logFile, label, data, maxLength),
  };
}

module.exports = {
  LOG_DIR,
  createLogger,
};