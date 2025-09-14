#!/usr/bin/env node

/**
 * PostToolUse Hook: Tool Usage Optimization & Quality Checks
 *
 * This hook analyzes completed tool usage and suggests improvements:
 * - grep command detection: suggests using rg (ripgrep) instead
 * - WebFetch GitHub URLs: suggests using gh CLI for better results
 * - Write tool content corruption: detects garbled text and encoding issues
 * - More optimization checks can be added in the future
 */

const fs = require('fs').promises;

// Import utils
const { exitWithTime, hookMain, extractToolInfo } = require('./utils/core');
const { checkGrepUsage } = require('./utils/command');
const { generateSystemReminder } = require('./utils/reminder');

// Configuration
const LOG_FILE = 'postToolUseChecks.log';

// Check if WebFetch is accessing GitHub content that could use gh CLI
function checkWebFetchGitHub(url) {
  if (!url) return null;

  // GitHub patterns that could benefit from gh CLI
  const githubPatterns = [
    {
      pattern: /github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/,
      type: 'issue',
      ghCommand: (match) => `gh issue view ${match[3]} --repo ${match[1]}/${match[2]}`,
    },
    {
      pattern: /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/,
      type: 'pull_request',
      ghCommand: (match) => `gh pr view ${match[3]} --repo ${match[1]}/${match[2]}`,
    },
    {
      pattern: /github\.com\/([^\/]+)\/([^\/]+)\/discussions\/(\d+)/,
      type: 'discussion',
      ghCommand: (match) => `gh api repos/${match[1]}/${match[2]}/discussions/${match[3]}`,
    },
    {
      pattern: /github\.com\/([^\/]+)\/([^\/]+)\/releases/,
      type: 'releases',
      ghCommand: (match) => `gh release list --repo ${match[1]}/${match[2]}`,
    },
  ];

  for (const { pattern, type, ghCommand } of githubPatterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        type: 'webfetch_github',
        url: url.trim(),
        githubType: type,
        ghCommand: ghCommand(match),
        suggestion: 'gh CLI 可以提供结构化数据和更好的API访问',
      };
    }
  }

  return null;
}

// Simple direct comparison for Write tool corruption
function checkWriteCorruption(intendedContent, actualContent) {
  if (intendedContent === actualContent) {
    return null; // Content matches perfectly
  }

  // Calculate basic metrics
  const intendedBytes = Buffer.from(intendedContent, 'utf8');
  const actualBytes = Buffer.from(actualContent, 'utf8');

  // Find first difference position
  let firstDiffIndex = -1;
  for (let i = 0; i < Math.max(intendedContent.length, actualContent.length); i++) {
    if (intendedContent[i] !== actualContent[i]) {
      firstDiffIndex = i;
      break;
    }
  }

  // Count replacement characters and control characters
  const replacementChars = (actualContent.match(/�/g) || []).length;
  const controlChars = (actualContent.match(/[\x00-\x08\x0E-\x1F\x7F-\x9F]/g) || []).length;

  return {
    type: 'write_corruption',
    intendedLength: intendedContent.length,
    actualLength: actualContent.length,
    intendedBytes: intendedBytes.length,
    actualBytes: actualBytes.length,
    firstDiffAt: firstDiffIndex,
    replacementChars: replacementChars,
    controlChars: controlChars,
    suggestion: '文件写入后内容与预期不符，存在数据损坏',
  };
}

// Main checker function for post-tool analysis
async function performPostToolChecks(toolName, toolInput, toolResponse, logger) {
  const suggestions = [];

  await logger.debug(`Checking completed tool: ${toolName}`);

  // Check 1: Bash grep usage
  if (toolName === 'Bash') {
    const command = toolInput.command || '';
    await logger.debug(`Checking bash command: ${command}`);

    const grepCheck = checkGrepUsage(command);
    if (grepCheck) {
      suggestions.push(grepCheck);
      await logger.debug(`Found grep usage: ${command}`);
    }
  }

  // Check 2: WebFetch GitHub URLs
  if (toolName === 'WebFetch') {
    const url = toolInput.url || '';
    await logger.debug(`Checking WebFetch URL: ${url}`);

    const githubCheck = checkWebFetchGitHub(url);
    if (githubCheck) {
      suggestions.push(githubCheck);
      await logger.debug(`Found GitHub WebFetch: ${url} (${githubCheck.githubType})`);
    }
  }

  // Check 3: Write tool content corruption - simple direct comparison
  if (toolName === 'Write') {
    const filePath = toolInput.file_path || '';
    const intendedContent = toolInput.content || '';

    if (filePath && intendedContent) {
      await logger.debug(`Checking Write tool output: ${filePath}`);

      try {
        // Read the actual file content after Write operation
        const actualContent = await fs.readFile(filePath, 'utf8');

        // Direct comparison
        const corruption = checkWriteCorruption(intendedContent, actualContent);
        if (corruption) {
          suggestions.push({
            ...corruption,
            filePath: filePath,
          });

          await logger.debug(
            `Write corruption detected: ${filePath} - intended ${corruption.intendedBytes}B != actual ${corruption.actualBytes}B, first diff at char ${corruption.firstDiffAt}`,
          );
        } else {
          await logger.debug(`Write tool output matches intended content: ${filePath}`);
        }
      } catch (error) {
        await logger.debug(`Error reading Write output file ${filePath}: ${error.message}`);
      }
    }
  }

  // Future checks can be added here:
  // - Check 4: other tool usage patterns
  // - Check 5: more optimization suggestions

  return suggestions;
}

// Main hook processing logic
async function processHook(toolData, logger) {
  const { toolName, toolInput, toolResponse } = extractToolInfo(toolData);

  // Perform post-tool analysis
  const suggestions = await performPostToolChecks(toolName, toolInput, toolResponse, logger);

  if (suggestions.length > 0) {
    await logger.debug(`Found ${suggestions.length} optimization suggestion(s)`);

    // Generate and output system reminder
    const reminder = generateSystemReminder(suggestions);
    process.stderr.write(reminder);

    await exitWithTime(2, 'suggestions-provided', logger);
    return;
  }

  await logger.debug('No optimization suggestions needed');
  await exitWithTime(0, 'success', logger);
}

// Use the hookMain utility for consistent stdin handling
hookMain(processHook, LOG_FILE);
