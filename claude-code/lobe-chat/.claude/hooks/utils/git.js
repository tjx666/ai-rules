/**
 * Git utilities for Claude Code hooks
 */

const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

// Configuration
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

/**
 * Check if file is tracked by git
 * @param {string} filePath - Path to file
 * @param {Object} logger - Logger instance
 * @returns {Promise<boolean>} True if file is tracked by git
 */
async function isFileTrackedByGit(filePath, logger) {
  try {
    const absolutePath = path.resolve(filePath);
    const relativePath = path.relative(PROJECT_DIR, absolutePath);

    // Use git ls-files to check if file is tracked
    const { stdout } = await execAsync(
      `cd "${PROJECT_DIR}" && git ls-files "${relativePath}" 2>/dev/null`,
      { cwd: PROJECT_DIR },
    );

    const isTracked = stdout.trim().length > 0;
    await logger.debug(`File ${filePath} tracked by git: ${isTracked}`);
    return isTracked;
  } catch (error) {
    await logger.debug(`Error checking git status for ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Get git status for a file
 * @param {string} filePath - Path to file
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Git status information
 */
async function getGitStatus(filePath, logger) {
  try {
    const absolutePath = path.resolve(filePath);
    const relativePath = path.relative(PROJECT_DIR, absolutePath);

    // Get porcelain status
    const { stdout } = await execAsync(
      `cd "${PROJECT_DIR}" && git status --porcelain "${relativePath}" 2>/dev/null`,
      { cwd: PROJECT_DIR },
    );

    const status = stdout.trim();
    const result = {
      tracked: false,
      modified: false,
      staged: false,
      untracked: false,
      deleted: false,
      statusCode: status.substring(0, 2),
    };

    if (!status) {
      // File is tracked and unmodified
      result.tracked = true;
    } else {
      const x = status[0]; // Index status
      const y = status[1]; // Working tree status

      result.untracked = status.startsWith('??');
      result.modified = y === 'M';
      result.staged = x !== ' ' && x !== '?';
      result.deleted = y === 'D' || x === 'D';
      result.tracked = !result.untracked;
    }

    await logger.debug(`Git status for ${filePath}: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    await logger.debug(`Error getting git status for ${filePath}: ${error.message}`);
    return {
      tracked: false,
      modified: false,
      staged: false,
      untracked: true,
      deleted: false,
      statusCode: '??',
    };
  }
}

/**
 * Check if current directory is a git repository
 * @param {Object} logger - Logger instance
 * @returns {Promise<boolean>} True if in a git repository
 */
async function isInGitRepo(logger) {
  try {
    await execAsync('git rev-parse --git-dir', { cwd: PROJECT_DIR });
    await logger.debug('Current directory is a git repository');
    return true;
  } catch (error) {
    await logger.debug('Current directory is not a git repository');
    return false;
  }
}

/**
 * Get list of modified files
 * @param {Object} logger - Logger instance
 * @returns {Promise<Array<string>>} List of modified file paths
 */
async function getModifiedFiles(logger) {
  try {
    // Get both staged and unstaged modifications
    const { stdout } = await execAsync(
      'git diff --name-only HEAD 2>/dev/null',
      { cwd: PROJECT_DIR },
    );

    const files = stdout.trim().split('\n').filter(Boolean);
    await logger.debug(`Found ${files.length} modified files`);
    return files;
  } catch (error) {
    await logger.debug(`Error getting modified files: ${error.message}`);
    return [];
  }
}

/**
 * Get current branch name
 * @param {Object} logger - Logger instance
 * @returns {Promise<string|null>} Current branch name or null
 */
async function getCurrentBranch(logger) {
  try {
    const { stdout } = await execAsync(
      'git rev-parse --abbrev-ref HEAD 2>/dev/null',
      { cwd: PROJECT_DIR },
    );

    const branch = stdout.trim();
    await logger.debug(`Current branch: ${branch}`);
    return branch;
  } catch (error) {
    await logger.debug(`Error getting current branch: ${error.message}`);
    return null;
  }
}

/**
 * Get list of untracked files
 * @param {Object} logger - Logger instance
 * @returns {Promise<Array<string>>} List of untracked file paths
 */
async function getUntrackedFiles(logger) {
  try {
    const { stdout } = await execAsync(
      'git ls-files --others --exclude-standard 2>/dev/null',
      { cwd: PROJECT_DIR },
    );

    const files = stdout.trim().split('\n').filter(Boolean);
    await logger.debug(`Found ${files.length} untracked files`);
    return files;
  } catch (error) {
    await logger.debug(`Error getting untracked files: ${error.message}`);
    return [];
  }
}

module.exports = {
  isFileTrackedByGit,
  getGitStatus,
  isInGitRepo,
  getModifiedFiles,
  getCurrentBranch,
  getUntrackedFiles,
};