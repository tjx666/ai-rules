/**
 * Filesystem utilities for Claude Code hooks
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

// Configuration
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

/**
 * Check if path is within workspace
 * @param {string} filePath - Path to check
 * @returns {boolean} True if path is within workspace
 */
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

/**
 * Get line count of a file
 * @param {string} filePath - Path to the file
 * @param {Object} logger - Logger instance
 * @returns {Promise<number>} Number of lines in the file, or -1 if error
 */
async function getFileLineCount(filePath, logger) {
  try {
    if (!fsSync.existsSync(filePath)) {
      await logger.debug(`File does not exist: ${filePath}`);
      return -1;
    }

    // Use wc -l to get line count
    const { stdout } = await execAsync(`wc -l < "${filePath}"`);
    const lineCount = parseInt(stdout.trim(), 10);

    await logger.debug(`File ${filePath} has ${lineCount} lines`);
    return lineCount;
  } catch (error) {
    await logger.debug(`Error getting line count for ${filePath}: ${error.message}`);
    return -1;
  }
}

/**
 * Use bash shell for glob matching
 * @param {string} filePath - File path to test
 * @param {string} globPattern - Glob pattern to match against
 * @param {Object} logger - Logger instance
 * @returns {Promise<boolean>} True if file matches glob pattern
 */
async function matchesGlob(filePath, globPattern, logger) {
  try {
    // Convert absolute path to relative path for glob matching
    let relativePath = filePath;
    if (filePath.startsWith(PROJECT_DIR)) {
      relativePath = path.relative(PROJECT_DIR, filePath);
    }

    // Use bash case statement for glob matching
    const script = `case "${relativePath}" in ${globPattern}) echo "match" ;; *) echo "no match" ;; esac`;
    const { stdout } = await execAsync(`bash -c '${script}'`);
    const result = stdout.trim() === 'match';

    await logger.debug(`Glob match test: "${relativePath}" against "${globPattern}" -> ${result}`);
    return result;
  } catch (error) {
    await logger.debug(`Error in glob matching: ${error.message}`);
    return false;
  }
}

/**
 * Extract file paths from tool input
 * Handles Read, Edit, MultiEdit, Write tools
 * @param {Object} toolInput - Tool input object
 * @returns {Array<string>} List of file paths
 */
function extractFilePaths(toolInput) {
  const paths = [];

  // Direct file_path property (Read, Edit, Write)
  if (toolInput.file_path) {
    paths.push(toolInput.file_path);
  }

  // MultiEdit case - file_path is at root level
  if (toolInput.edits && Array.isArray(toolInput.edits)) {
    // MultiEdit has file_path at root, but check edits too for safety
    toolInput.edits.forEach((edit) => {
      if (edit.file_path) {
        paths.push(edit.file_path);
      }
    });
  }

  // NotebookEdit case
  if (toolInput.notebook_path) {
    paths.push(toolInput.notebook_path);
  }

  // Glob tool case
  if (toolInput.path) {
    paths.push(toolInput.path);
  }

  return [...new Set(paths)]; // Remove duplicates
}

/**
 * Check if file exists
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} True if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file stats
 * @param {string} filePath - Path to file
 * @returns {Promise<Object|null>} File stats or null if error
 */
async function getFileStats(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      modified: stats.mtime,
      created: stats.ctime,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Read file content safely
 * @param {string} filePath - Path to file
 * @param {string} encoding - File encoding (default: 'utf8')
 * @returns {Promise<string|null>} File content or null if error
 */
async function readFileSafe(filePath, encoding = 'utf8') {
  try {
    const content = await fs.readFile(filePath, encoding);
    return content;
  } catch (error) {
    return null;
  }
}

/**
 * Extract rule file references from CLAUDE.md content
 * @param {string} claudeMdPath - Path to CLAUDE.md file
 * @param {Object} logger - Logger instance
 * @returns {Promise<Array<string>>} List of referenced rule file paths
 */
async function extractRulesFromClaudeMd(claudeMdPath, logger) {
  const rules = new Set();

  try {
    const content = await readFileSafe(claudeMdPath);
    if (!content) {
      logger.debug(`Could not read CLAUDE.md at ${claudeMdPath}`);
      return [];
    }

    // Pattern 1: @.cursor/rules/*.mdc format
    const atRulePattern = /@\.cursor\/rules\/[a-zA-Z0-9_\-\/]+\.mdc/g;
    const atRuleMatches = content.match(atRulePattern) || [];
    atRuleMatches.forEach((match) => {
      // Remove @ prefix and add to set
      const rulePath = match.substring(1);
      rules.add(rulePath);
    });

    const rulesList = Array.from(rules);
    logger.debug(
      `Extracted ${rulesList.length} rules from CLAUDE.md: ${JSON.stringify(rulesList)}`,
    );
    return rulesList;
  } catch (error) {
    logger.debug(`Error extracting rules from CLAUDE.md: ${error.message}`);
    return [];
  }
}

module.exports = {
  PROJECT_DIR,
  isPathInWorkspace,
  getFileLineCount,
  matchesGlob,
  extractFilePaths,
  fileExists,
  getFileStats,
  readFileSafe,
  extractRulesFromClaudeMd,
};
