/**
 * Transcript analysis utilities for Claude Code hooks
 */

const fsSync = require('fs');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

/**
 * Get already read files from current session transcript
 * @param {string} transcriptPath - Path to transcript file
 * @param {Object} logger - Logger instance
 * @returns {Promise<Array<string>>} List of file paths that have been read
 */
async function getReadFiles(transcriptPath, logger) {
  const readFiles = [];

  try {
    if (!transcriptPath || !fsSync.existsSync(transcriptPath)) {
      await logger.debug(`Transcript file not found: ${transcriptPath}`);
      return readFiles;
    }

    // Search for Read tool calls in the transcript
    const { stdout } = await execAsync(
      `rg '"name":"Read"' "${transcriptPath}" 2>/dev/null || true`,
    );

    if (!stdout.trim()) {
      return readFiles;
    }

    // Parse each line to extract file paths from Read tool calls
    const lines = stdout.trim().split('\n');
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const content = entry.message?.content || [];
        for (const item of content) {
          if (item.type === 'tool_use' && item.name === 'Read' && item.input?.file_path) {
            readFiles.push(item.input.file_path);
          }
        }
      } catch (parseError) {
        // Skip invalid JSON lines
        await logger.debug(`Failed to parse transcript line: ${parseError.message}`);
      }
    }

    const uniqueReadFiles = [...new Set(readFiles)];
    await logger.debug(`Already read files in session: ${JSON.stringify(uniqueReadFiles)}`);
    return uniqueReadFiles;
  } catch (error) {
    await logger.debug(`Error checking transcript for read files: ${error.message}`);
    return readFiles;
  }
}

/**
 * Get files of a specific type that have been read
 * @param {string} transcriptPath - Path to transcript file
 * @param {string} extension - File extension to filter (e.g., '.mdc')
 * @param {Object} logger - Logger instance
 * @returns {Promise<Array<string>>} List of file paths with specified extension
 */
async function getReadFilesByType(transcriptPath, extension, logger) {
  const allReadFiles = await getReadFiles(transcriptPath, logger);
  return allReadFiles.filter(file => file.endsWith(extension));
}

/**
 * Get already executed tools from current session
 * @param {string} transcriptPath - Path to transcript file
 * @param {Object} logger - Logger instance
 * @returns {Promise<Array<Object>>} List of executed tools with their inputs
 */
async function getExecutedTools(transcriptPath, logger) {
  const executedTools = [];

  try {
    if (!transcriptPath || !fsSync.existsSync(transcriptPath)) {
      await logger.debug(`Transcript file not found: ${transcriptPath}`);
      return executedTools;
    }

    // Search for tool_use entries in the transcript
    const { stdout } = await execAsync(
      `rg '"type":"tool_use"' "${transcriptPath}" 2>/dev/null || true`,
    );

    if (!stdout.trim()) {
      return executedTools;
    }

    // Parse each line to extract tool information
    const lines = stdout.trim().split('\n');
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const content = entry.message?.content || [];
        for (const item of content) {
          if (item.type === 'tool_use') {
            executedTools.push({
              name: item.name,
              input: item.input,
              id: item.id,
            });
          }
        }
      } catch (parseError) {
        await logger.debug(`Failed to parse transcript line: ${parseError.message}`);
      }
    }

    await logger.debug(`Found ${executedTools.length} executed tools in session`);
    return executedTools;
  } catch (error) {
    await logger.debug(`Error checking transcript for executed tools: ${error.message}`);
    return executedTools;
  }
}

/**
 * Check if a specific tool has been executed with given parameters
 * @param {string} transcriptPath - Path to transcript file
 * @param {string} toolName - Tool name to check
 * @param {Object} inputMatcher - Object to match against tool input (partial match)
 * @param {Object} logger - Logger instance
 * @returns {Promise<boolean>} True if tool has been executed with matching input
 */
async function hasExecutedTool(transcriptPath, toolName, inputMatcher, logger) {
  const executedTools = await getExecutedTools(transcriptPath, logger);

  return executedTools.some(tool => {
    if (tool.name !== toolName) return false;

    // Check if all inputMatcher properties exist in tool.input
    for (const [key, value] of Object.entries(inputMatcher)) {
      if (tool.input[key] !== value) return false;
    }

    return true;
  });
}

module.exports = {
  getReadFiles,
  getReadFilesByType,
  getExecutedTools,
  hasExecutedTool,
};