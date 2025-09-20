#!/usr/bin/env node

/**
 * PreToolUse Hook: Cursor Rules Checker (JavaScript Version)
 *
 * This hook simulates Cursor's project rules glob auto-loading mechanism:
 * - Checks if Read/Edit/MultiEdit tools access files matching rule glob patterns
 * - Skips rules with "alwaysApply: true" (those are always applied by Claude Code)
 * - Only processes rules with defined "globs" patterns
 * - If a matching rule hasn't been read yet, blocks execution and prompts to read the rule
 *
 * Environment Variables:
 * - DEBUG_CURSOR_RULES=true: Enable debug logging to .claude/logs/
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

// Import utils
const { exitWithTime, hookMain, extractToolInfo, PROJECT_DIR } = require('./utils/core');
const { extractFilePaths, matchesGlob, extractRulesFromClaudeMd } = require('./utils/filesystem');
const { checkFileHadRead } = require('./utils/transcript');
const { generateSuggestionsReminder } = require('./utils/reminder');

// Configuration
const RULES_DIR = path.join(PROJECT_DIR, '.cursor', 'rules');
const LOG_FILE = 'cursor_rules_checker.log';

// Extract rule information from file frontmatter
async function extractRuleInfo(rulePath, logger) {
  try {
    const content = await fs.readFile(rulePath, 'utf8');

    // Extract YAML frontmatter
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      await logger.debug(`No frontmatter found in ${rulePath}`);
      return { globs: [], alwaysApply: false };
    }

    const frontmatter = frontmatterMatch[1];

    // Parse YAML manually by splitting into lines
    const lines = frontmatter
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line);

    let alwaysApply = false;
    let globsValue = '';

    for (const line of lines) {
      // Check for alwaysApply
      if (line.startsWith('alwaysApply:')) {
        const value = line.substring('alwaysApply:'.length).trim();
        alwaysApply = value === 'true';
      }
      // Check for globs
      else if (line.startsWith('globs:')) {
        globsValue = line.substring('globs:'.length).trim();
      }
    }

    // If alwaysApply is true, skip this rule completely
    if (alwaysApply) {
      await logger.debug(`Rule ${rulePath} has alwaysApply: true, skipping`);
      return { globs: [], alwaysApply: true };
    }

    // If globs value is empty, return empty array
    if (!globsValue) {
      await logger.debug(`Empty globs in ${rulePath}`);
      return { globs: [], alwaysApply: false };
    }

    // Split by comma and clean up
    const globs = globsValue
      .split(',')
      .map((glob) => glob.trim())
      .filter(Boolean);

    await logger.debug(`Extracted globs from ${rulePath}: ${JSON.stringify(globs)}`);
    return { globs, alwaysApply: false };
  } catch (error) {
    await logger.debug(`Error reading rule file ${rulePath}: ${error.message}`);
    return { globs: [], alwaysApply: false };
  }
}

// Main hook processing logic
async function processHook(toolData, logger) {
  const { toolName, toolInput, transcriptPath } = extractToolInfo(toolData);

  // Extract file paths from tool input
  const filePaths = extractFilePaths(toolInput);
  await logger.debug(`File paths: ${JSON.stringify(filePaths)}`);

  if (filePaths.length === 0) {
    await logger.debug('No file paths found in tool input');
    await exitWithTime(0, 'no-paths', logger);
    return;
  }

  // Check if rules directory exists
  if (!fsSync.existsSync(RULES_DIR)) {
    await logger.debug(`Rules directory does not exist: ${RULES_DIR}`);
    await exitWithTime(0, 'no-rules-dir', logger);
    return;
  }

  // Get all rule files
  let ruleFiles;
  try {
    const { stdout } = await execAsync(`find "${RULES_DIR}" -name "*.mdc" -type f`);
    ruleFiles = stdout.trim().split('\n').filter(Boolean);
    await logger.debug(`Found rule files: ${JSON.stringify(ruleFiles)}`);
  } catch (error) {
    await logger.debug(`Error finding rule files: ${error.message}`);
    await exitWithTime(0, 'find-error', logger);
    return;
  }

  if (ruleFiles.length === 0) {
    await logger.debug('No rule files found');
    await exitWithTime(0, 'no-rules', logger);
    return;
  }

  // Check if CLAUDE.md has been read and extract its rules
  const claudeMdPath = path.join(PROJECT_DIR, 'CLAUDE.md');
  const claudeMdRules = await extractRulesFromClaudeMd(claudeMdPath, logger);
  logger.debug(`CLAUDE.md rules: ${JSON.stringify(claudeMdRules)}`);

  // Check each file path against rule globs and collect all unread rules
  const unreadRules = [];

  for (const filePath of filePaths) {
    await logger.debug(`Checking file: ${filePath}`);

    for (const ruleFile of ruleFiles) {
      const ruleInfo = await extractRuleInfo(ruleFile, logger);

      // Skip if rule has no globs
      if (ruleInfo.globs.length === 0) {
        continue;
      }

      for (const globPattern of ruleInfo.globs) {
        const matches = await matchesGlob(filePath, globPattern, logger);

        if (matches) {
          await logger.debug(`File ${filePath} matches glob ${globPattern} in rule ${ruleFile}`);

          // Check if rule is referenced in CLAUDE.md
          const isInClaudeMd = claudeMdRules.some((rule) => {
            const fullRulePath = path.resolve(PROJECT_DIR, rule);
            return fullRulePath === ruleFile;
          });

          if (isInClaudeMd) {
            await logger.debug(`Rule file ${ruleFile} is referenced in CLAUDE.md, allowing access`);
            continue;
          }

          // Check if this rule file has been read before (excluding current if it's a Read)
          const { hasBeenRead } = await checkFileHadRead(
            transcriptPath,
            ruleFile,
            toolName,
            logger,
          );

          if (!hasBeenRead) {
            await logger.debug(`Rule file ${ruleFile} has not been read yet.`);

            // Add to unread rules if not already added
            if (!unreadRules.some((rule) => rule.ruleFile === ruleFile)) {
              unreadRules.push({
                filePath,
                ruleFile,
                globPattern,
              });
            }
          } else {
            await logger.debug(`Rule file ${ruleFile} has been read, allowing access`);
          }
        }
      }
    }
  }

  // If there are unread rules, block execution with all of them
  if (unreadRules.length > 0) {
    await logger.debug(`Found ${unreadRules.length} unread rule(s). Blocking execution.`);

    // Get unique unread rule files and convert to relative paths
    const uniqueRuleFiles = [...new Set(unreadRules.map((rule) => rule.ruleFile))];
    const relativeRuleFiles = uniqueRuleFiles.map((ruleFile) =>
      ruleFile.startsWith(PROJECT_DIR) ? path.relative(PROJECT_DIR, ruleFile) : ruleFile,
    );

    const suggestion = {
      type: 'cursor_rules',
      ruleFiles: relativeRuleFiles,
    };

    const reminder = generateSuggestionsReminder([suggestion]);
    process.stderr.write(reminder);
    await exitWithTime(2, 'blocked', logger);
    return;
  }

  await logger.debug('All file accesses are allowed');
  await exitWithTime(0, 'success', logger);
}

// Use the hookMain utility for consistent stdin handling
hookMain(processHook, LOG_FILE);
