/**
 * Command parsing utilities for Claude Code hooks
 */

const path = require('path');

/**
 * Parse mv command
 * @param {string} command - Full command string
 * @returns {Object|null} Parsed mv info or null
 */
function parseMvCommand(command) {
  // Pattern to detect mv command for renaming
  const mvPattern = /\bmv\s+(['"]?)([^\s'"]+)\1\s+(['"]?)([^\s'"]+)\3/;
  const match = command.match(mvPattern);

  if (!match) {
    return null;
  }

  const sourceFile = match[2];
  const targetFile = match[4];

  // Check if it's a rename operation (same directory)
  const sourceDir = path.dirname(sourceFile);
  const targetDir = path.dirname(targetFile);

  // Consider it a rename if:
  // 1. Same directory, or
  // 2. Both are relative paths in current directory (no path separators)
  const isRename =
    sourceDir === targetDir || (sourceFile.indexOf('/') === -1 && targetFile.indexOf('/') === -1);

  return {
    sourceFile,
    targetFile,
    sourceDir,
    targetDir,
    isRename,
  };
}

/**
 * Parse rm command
 * @param {string} command - Full command string
 * @returns {Object|null} Parsed rm info or null
 */
function parseRmCommand(command) {
  // Match rm command with various flags and extract file paths
  const rmMatch = command.match(/\brm\s+(.*)/);
  if (!rmMatch) return null;

  const args = rmMatch[1].trim();
  const flags = [];
  const files = [];

  // Split arguments and categorize
  const parts = args.split(/\s+/);
  for (const part of parts) {
    if (part.startsWith('-')) {
      flags.push(part);
    } else {
      // Handle quoted paths
      const unquoted = part.replace(/^['"]|['"]$/g, '');
      if (unquoted) {
        files.push(unquoted);
      }
    }
  }

  return {
    flags,
    files,
    isForce: flags.some(f => f.includes('f') || f === '--force'),
    isRecursive: flags.some(f => f.includes('r') || f.includes('R') || f === '--recursive'),
    isInteractive: flags.some(f => f.includes('i') || f === '--interactive'),
  };
}

/**
 * Check if command contains dangerous patterns
 * @param {string} command - Command to check
 * @param {Array<Object>} patterns - Array of pattern objects with {pattern, name, description}
 * @returns {Array<Object>} Matched dangerous patterns
 */
function checkDangerousPatterns(command, patterns) {
  const matches = [];

  for (const patternObj of patterns) {
    if (patternObj.pattern.test(command)) {
      matches.push({
        ...patternObj,
        matched: command.match(patternObj.pattern)[0],
      });
    }
  }

  return matches;
}

/**
 * Extract command arguments
 * @param {string} command - Full command string
 * @param {string} commandName - Command name to extract (e.g., 'git', 'npm')
 * @returns {Object|null} Command info with args
 */
function extractCommandArgs(command, commandName) {
  const pattern = new RegExp(`\\b${commandName}\\s+(.*)`);
  const match = command.match(pattern);

  if (!match) return null;

  const fullArgs = match[1].trim();
  const args = [];
  const flags = [];
  const options = {};

  // Parse arguments
  const parts = fullArgs.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];

  let i = 0;
  while (i < parts.length) {
    const part = parts[i];
    const unquoted = part.replace(/^['"]|['"]$/g, '');

    if (part.startsWith('-')) {
      // Check if it's a known flag (single letter flags like -f, -r, etc.)
      const isFlag = part.length === 2 || part.startsWith('--');

      if (isFlag) {
        // Add to flags
        flags.push(unquoted);
        i++;
      } else {
        // Multi-character short option or regular argument
        args.push(unquoted);
        i++;
      }
    } else {
      // Regular argument
      args.push(unquoted);
      i++;
    }
  }

  return {
    command: commandName,
    args,
    flags,
    options,
    fullArgs,
  };
}

/**
 * Parse git command
 * @param {string} command - Full command string
 * @returns {Object|null} Parsed git command info
 */
function parseGitCommand(command) {
  const gitInfo = extractCommandArgs(command, 'git');
  if (!gitInfo) return null;

  const subcommand = gitInfo.args[0];
  const subArgs = gitInfo.args.slice(1);

  return {
    ...gitInfo,
    subcommand,
    subArgs,
    isPush: subcommand === 'push',
    isForce: gitInfo.flags.some(f => f === '-f' || f === '--force'),
    isCommit: subcommand === 'commit',
    isCheckout: subcommand === 'checkout',
  };
}

/**
 * Check if command uses grep
 * @param {string} command - Command to check
 * @returns {boolean} True if command uses grep (not rg)
 */
function usesGrep(command) {
  const grepPattern = /\bgrep\s+/;
  const isRipgrep = /\brg\s+/.test(command);
  return grepPattern.test(command) && !isRipgrep;
}

/**
 * Parse pipe commands
 * @param {string} command - Full command string
 * @returns {Array<string>} Array of individual commands in the pipe
 */
function parsePipeCommands(command) {
  return command.split('|').map(cmd => cmd.trim());
}

/**
 * Parse command chain (commands separated by && or ;)
 * @param {string} command - Full command string
 * @returns {Array<Object>} Array of command objects with separator info
 */
function parseCommandChain(command) {
  const commands = [];
  const pattern = /([^;&]+)([;&]{1,2})?/g;
  let match;

  while ((match = pattern.exec(command)) !== null) {
    const separator = match[2] || null;
    commands.push({
      command: match[1].trim(),
      separator: separator,
      continueOnError: separator === ';' || separator === null,
      requireSuccess: separator === '&&',
    });
  }

  return commands;
}

/**
 * Extract file paths from rm command
 * @param {string} command - Full command string
 * @returns {Array<string>} Array of file paths to be deleted
 */
function extractRmFilePaths(command) {
  // Match rm command with various flags and extract file paths
  const rmMatch = command.match(/\brm\s+(?:[-\w\s]*\s+)?(.+)/);
  if (!rmMatch) return [];

  // Split arguments and filter out flags
  const args = rmMatch[1].trim().split(/\s+/);
  return args.filter((arg) => !arg.startsWith('-'));
}

/**
 * Check if command uses grep (not rg/ripgrep)
 * @param {string} command - Command to check
 * @returns {Object|null} Grep usage info or null
 */
function checkGrepUsage(command) {
  // Pattern to detect grep command usage (but not rg which is the recommended alternative)
  const grepPattern = /\bgrep\s+/;
  const isRipgrep = /\brg\s+/.test(command);

  if (grepPattern.test(command) && !isRipgrep) {
    return {
      type: 'grep_usage',
      command: command.trim(),
      suggestion: 'rg (ripgrep) 提供更好的性能和功能',
    };
  }

  return null;
}

module.exports = {
  parseMvCommand,
  parseRmCommand,
  checkDangerousPatterns,
  extractCommandArgs,
  parseGitCommand,
  usesGrep,
  parsePipeCommands,
  parseCommandChain,
  extractRmFilePaths,
  checkGrepUsage,
};