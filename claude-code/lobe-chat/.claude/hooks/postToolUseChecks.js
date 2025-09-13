#!/usr/bin/env node

/**
 * PostToolUse Hook: Tool Usage Optimization & Quality Checks
 *
 * This hook analyzes completed tool usage and suggests improvements:
 * - grep command detection: suggests using rg (ripgrep) instead
 * - WebFetch GitHub URLs: suggests using gh CLI for better results
 * - Write tool content corruption: detects garbled text and encoding issues
 * - More optimization checks can be added in the future
 *
 * Environment Variables:
 * - DEBUG_POSTTOOL_CHECKS=true: Enable debug logging to .claude/logs/
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const startTime = process.hrtime.bigint();

// Configuration
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const LOG_DIR = path.join(PROJECT_DIR, '.claude', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'postToolUseChecks.log');
const DEBUG = !!process.env.CC_HOOK_DEBUG;

// Helper function for debug logging
async function log(message) {
  if (DEBUG) {
    if (!fsSync.existsSync(LOG_DIR)) {
      await fs.mkdir(LOG_DIR, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logMessage = `${timestamp} [DEBUG] ${message}\n`;
    await fs.appendFile(LOG_FILE, logMessage);
  }
}

// Helper function to exit with execution time logging
async function exitWithTime(exitCode, status) {
  const endTime = process.hrtime.bigint();
  const executionTime = Number(endTime - startTime) / 1_000_000;
  await log(`Hook execution time: ${executionTime.toFixed(2)}ms (${status})`);
  process.exit(exitCode);
}

// Check if Bash command uses grep
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

// Check if Write tool output contains corrupted text (focused on Chinese-English content)
function checkWriteCorruption(filePath, content) {
  if (!content || typeof content !== 'string') return null;

  // Quick skip for pure ASCII content
  if (!/[\u4e00-\u9fff]/.test(content)) {
    return null; // Pure English content, skip complex detection
  }

  // Check if this is likely an empty file write (simple heuristic)
  const isEmptyFileWrite = content.length > 0 && (
    // Common empty file indicators - file paths ending in common extensions
    /\.(md|txt|js|ts|json|yml|yaml)$/.test(filePath) ||
    // Or if content starts from beginning (no existing content mixed)
    /^[#\s]*[\u4e00-\u9fff]/.test(content)
  );

  // Performance optimization: sample large files intelligently
  let sampleContent = content;
  if (content.length > 10000) {
    // For large files, sample more strategically to catch issues
    const head = content.slice(0, 3000);
    const middle = content.slice(Math.floor(content.length / 2) - 1500, Math.floor(content.length / 2) + 1500);
    const tail = content.slice(-2000);
    sampleContent = head + middle + tail;
  }

  // Specialized patterns for Chinese-English corruption
  const chineseCorruptionPatterns = [
    // Unicode replacement characters (most common)
    { pattern: /�/g, name: '中文字符丢失', severity: 'high' },
    // Chinese UTF-8 byte sequence corruption (more comprehensive)
    { pattern: /[\uE400-\uE9FF][\x00-\x7F]/gu, name: '中文UTF-8字节截断', severity: 'high' },
    // Direct byte pattern for corrupted UTF-8 (when treated as Latin-1)
    { pattern: /\xE4[\x00-\x7F]|\xE5[\x00-\x7F]|\xE6[\x00-\x7F]|\xE7[\x00-\x7F]|\xE8[\x00-\x7F]|\xE9[\x00-\x7F]/g, name: '中文字节序列损坏', severity: 'high' },
    // Multiple consecutive question marks (Chinese chars lost)
    { pattern: /[?]{3,}/g, name: '中文字符替换为问号', severity: 'medium' },
    // Abnormal Chinese-English boundaries
    { pattern: /[a-zA-Z][\u4e00-\u9fff]{1}[a-zA-Z]/g, name: '中英文边界异常', severity: 'low' },
    // Control characters that shouldn't appear in text
    { pattern: /[\x00-\x08\x0E-\x1F\x7F-\x9F]{2,}/g, name: '异常控制字符', severity: 'high' },
  ];

  const detectedIssues = [];
  let totalIssueCount = 0;
  let highSeverityCount = 0;

  for (const { pattern, name, severity } of chineseCorruptionPatterns) {
    const matches = sampleContent.match(pattern);
    if (matches) {
      detectedIssues.push({
        type: name,
        count: matches.length,
        severity: severity,
        examples: matches.slice(0, 2), // Show up to 2 examples
      });
      totalIssueCount += matches.length;
      if (severity === 'high') {
        highSeverityCount += matches.length;
      }
    }
  }

  // Calculate corruption metrics
  const replacementCharCount = (sampleContent.match(/�/g) || []).length;
  const replacementRatio = replacementCharCount / sampleContent.length;
  const chineseCharCount = (sampleContent.match(/[\u4e00-\u9fff]/g) || []).length;
  const chineseCorruptionRatio = replacementCharCount / Math.max(chineseCharCount, 1);

  // Check for specific UTF-8 byte corruption patterns
  const hasUtf8ByteCorruption = /\xE4[\x00-\x7F]|\xE5[\x00-\x7F]|\xE6[\x00-\x7F]|\xE7[\x00-\x7F]|\xE8[\x00-\x7F]|\xE9[\x00-\x7F]/g.test(sampleContent);

  // More nuanced corruption detection
  const isSignificantCorruption =
    replacementRatio > 0.005 || // More than 0.5% replacement characters
    chineseCorruptionRatio > 0.1 || // More than 10% of Chinese characters corrupted
    highSeverityCount > 2 || // More than 2 high-severity issues (lowered threshold)
    hasUtf8ByteCorruption || // Direct UTF-8 byte corruption detected
    (isEmptyFileWrite && replacementCharCount > 0); // Any corruption in empty file write

  if (isSignificantCorruption) {
    return {
      type: 'write_corruption',
      filePath: filePath,
      replacementRatio: (replacementRatio * 100).toFixed(2),
      chineseCorruptionRatio: (chineseCorruptionRatio * 100).toFixed(1),
      totalIssues: totalIssueCount,
      highSeverityIssues: highSeverityCount,
      detectedIssues: detectedIssues,
      isEmptyFileWrite: isEmptyFileWrite,
      suggestion: isEmptyFileWrite
        ? '空文件写入中文内容时出现编码问题，建议重新写入'
        : '中文字符编码可能存在问题，建议检查文件内容',
    };
  }

  return null;
}

// Main checker function for post-tool analysis
async function performPostToolChecks(toolName, toolInput, toolResponse) {
  const suggestions = [];

  await log(`Checking completed tool: ${toolName}`);

  // Check 1: Bash grep usage
  if (toolName === 'Bash') {
    const command = toolInput.command || '';
    await log(`Checking bash command: ${command}`);

    const grepCheck = checkGrepUsage(command);
    if (grepCheck) {
      suggestions.push(grepCheck);
      await log(`Found grep usage: ${command}`);
    }
  }

  // Check 2: WebFetch GitHub URLs
  if (toolName === 'WebFetch') {
    const url = toolInput.url || '';
    await log(`Checking WebFetch URL: ${url}`);

    const githubCheck = checkWebFetchGitHub(url);
    if (githubCheck) {
      suggestions.push(githubCheck);
      await log(`Found GitHub WebFetch: ${url} (${githubCheck.githubType})`);
    }
  }

  // Check 3: Write tool content corruption - read actual file content
  if (toolName === 'Write') {
    const filePath = toolInput.file_path || '';

    if (filePath) {
      await log(`Checking Write tool output for corruption in: ${filePath}`);

      try {
        // Read the actual file content after the Write operation
        const actualContent = await fs.readFile(filePath, 'utf8');

        const corruptionCheck = checkWriteCorruption(filePath, actualContent);
        if (corruptionCheck) {
          suggestions.push(corruptionCheck);
          await log(
            `Found content corruption in Write output: ${filePath} (${corruptionCheck.totalIssues} issues, ${corruptionCheck.replacementRatio}% replacement chars)`,
          );
        }
      } catch (error) {
        await log(`Error reading Write output file ${filePath}: ${error.message}`);
        // Don't fail the hook if we can't read the file, just log it
      }
    }
  }

  // Future checks can be added here:
  // - Check 4: other tool usage patterns
  // - Check 5: more optimization suggestions

  return suggestions;
}

// Generate system reminder for optimization suggestions
function generateSystemReminder(suggestions) {
  const reminders = suggestions
    .map((suggestion) => {
      switch (suggestion.type) {
        case 'grep_usage':
          return (
            `🔍 检测到 grep 命令使用：\n` +
            `   命令: ${suggestion.command}\n` +
            `   建议: 使用 rg (ripgrep) 替代 grep\n` +
            `   优势: ${suggestion.suggestion}\n` +
            `   示例: rg "pattern" 或 rg "pattern" --type js`
          );

        case 'webfetch_github':
          return (
            `🐙 检测到 WebFetch 访问 GitHub ${suggestion.githubType}：\n` +
            `   URL: ${suggestion.url}\n` +
            `   建议: 使用 gh CLI 替代 WebFetch\n` +
            `   推荐: ${suggestion.ghCommand}\n` +
            `   优势: ${suggestion.suggestion}`
          );

        case 'write_corruption':
          const issuesSummary = suggestion.detectedIssues
            .map((issue) => `${issue.type}: ${issue.count}个${issue.severity === 'high' ? ' [严重]' : ''} (如: ${issue.examples.join(', ')})`)
            .join(', ');

          return (
            `⚠️ 检测到 Write 工具输出文件疑似中文乱码：\n` +
            `   文件: ${suggestion.filePath}\n` +
            `   替换字符比例: ${suggestion.replacementRatio}%\n` +
            `   中文损坏比例: ${suggestion.chineseCorruptionRatio}%\n` +
            `   检测到问题: ${issuesSummary}\n` +
            `   严重问题数: ${suggestion.highSeverityIssues}/${suggestion.totalIssues}\n` +
            `${suggestion.isEmptyFileWrite ? '   ⚠️ 空文件写入场景 - 高风险\n' : ''}` +
            `   建议: ${suggestion.suggestion}\n` +
            `   解决方案:\n` +
            `   1. ${suggestion.isEmptyFileWrite ? '重新使用 Write 工具完整写入内容' : '检查文件中的 � 字符'}\n` +
            `   2. 确保输入文本为纯UTF-8编码\n` +
            `   3. 避免复制粘贴包含隐藏字符的文本内容`
          );

        default:
          return `未知建议类型: ${suggestion.type}`;
      }
    })
    .join('\n\n');

  return `<system-reminder>\n${reminders}\n</system-reminder>`;
}

async function main() {
  // Read JSON input from stdin
  let inputData = '';

  if (process.stdin.isTTY) {
    await log('No stdin data available');
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
        await log('Empty stdin');
        await exitWithTime(0, 'empty-stdin');
        return;
      }

      await log(`Hook triggered with input: ${inputData.substring(0, 200)}...`);

      const toolData = JSON.parse(inputData.trim());
      const toolName = toolData.tool_name || 'Unknown';
      const toolInput = toolData.tool_input || {};
      const toolResponse = toolData.tool_response || {};

      // Perform post-tool analysis
      const suggestions = await performPostToolChecks(toolName, toolInput, toolResponse);

      if (suggestions.length > 0) {
        await log(`Found ${suggestions.length} optimization suggestion(s)`);

        // Generate and output system reminder
        const reminder = generateSystemReminder(suggestions);
        process.stderr.write(reminder);

        await exitWithTime(0, 'suggestions-provided');
        return;
      }

      await log('No optimization suggestions needed');
      await exitWithTime(0, 'success');
    } catch (error) {
      await log(`Error processing input: ${error.message}`);
      console.error('PostToolUse Hook Error:', error);
      await exitWithTime(1, 'error');
    }
  });
}

main();
