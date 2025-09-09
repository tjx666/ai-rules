#!/usr/bin/env node

/**
 * PreToolUse Hook: Cursor Rules Checker (JavaScript Version)
 * 
 * This hook simulates Cursor's project rules glob auto-loading mechanism:
 * - Checks if Read/Edit/MultiEdit tools access files matching rule glob patterns
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

const startTime = process.hrtime.bigint();

// Configuration
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const RULES_DIR = path.join(PROJECT_DIR, '.cursor', 'rules');
const LOG_DIR = path.join(PROJECT_DIR, '.claude', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'cursor_rules_checker.log');
const DEBUG = process.env.DEBUG_CURSOR_RULES === 'true';

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

// Extract file paths from tool input
function extractReadPaths(toolInput) {
  const paths = [];
  
  if (toolInput.file_path) {
    paths.push(toolInput.file_path);
  }
  
  if (toolInput.edits && Array.isArray(toolInput.edits)) {
    // MultiEdit case - file_path is at root level, not in individual edits
    // but just in case, check edits array too
    toolInput.edits.forEach(edit => {
      if (edit.file_path) {
        paths.push(edit.file_path);
      }
    });
  }
  
  return [...new Set(paths)]; // Remove duplicates
}

// Extract glob patterns from rule file frontmatter
async function extractGlobsFromRule(rulePath) {
  try {
    const content = await fs.readFile(rulePath, 'utf8');
    
    // Extract YAML frontmatter
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      await log(`No frontmatter found in ${rulePath}`);
      return [];
    }
    
    const frontmatter = frontmatterMatch[1];
    
    // Extract globs line
    const globsMatch = frontmatter.match(/^globs:\s*(.+)$/m);
    if (!globsMatch) {
      await log(`No globs found in ${rulePath}`);
      return [];
    }
    
    const globsValue = globsMatch[1].trim();
    
    // Split by comma and clean up
    const globs = globsValue.split(',').map(glob => glob.trim()).filter(Boolean);
    
    await log(`Extracted globs from ${rulePath}: ${JSON.stringify(globs)}`);
    return globs;
  } catch (error) {
    await log(`Error reading rule file ${rulePath}: ${error.message}`);
    return [];
  }
}

// Get already read .mdc files from current session transcript
async function getReadMdcFiles(transcriptPath) {
  const readMdcFiles = [];
  
  try {
    if (!transcriptPath || !fsSync.existsSync(transcriptPath)) {
      await log(`Transcript file not found: ${transcriptPath}`);
      return readMdcFiles;
    }

    // Search for Read tool calls in the transcript
    const { stdout } = await execAsync(`rg '"name":"Read"' "${transcriptPath}" 2>/dev/null || true`);
    if (!stdout.trim()) {
      return readMdcFiles;
    }

    // Parse each line to extract file paths from Read tool calls
    const lines = stdout.trim().split('\n');
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const content = entry.message?.content || [];
        for (const item of content) {
          if (item.type === 'tool_use' && item.name === 'Read' && item.input?.file_path) {
            const filePath = item.input.file_path;
            if (filePath.endsWith('.mdc')) {
              readMdcFiles.push(filePath);
            }
          }
        }
      } catch (parseError) {
        // Skip invalid JSON lines
        await log(`Failed to parse transcript line: ${parseError.message}`);
      }
    }

    const uniqueReadFiles = [...new Set(readMdcFiles)];
    await log(`Already read .mdc files: ${JSON.stringify(uniqueReadFiles)}`);
    return uniqueReadFiles;
  } catch (error) {
    await log(`Error checking transcript for read files: ${error.message}`);
    return readMdcFiles;
  }
}

// Use bash shell for glob matching (more reliable than custom implementation)
async function matchesGlob(filePath, globPattern) {
  try {
    // Use bash case statement for glob matching
    const script = `case "${filePath}" in ${globPattern}) echo "match" ;; *) echo "no match" ;; esac`;
    const { stdout } = await execAsync(`bash -c '${script}'`);
    const result = stdout.trim() === 'match';
    
    await log(`Glob match test: "${filePath}" against "${globPattern}" -> ${result}`);
    return result;
  } catch (error) {
    await log(`Error in glob matching: ${error.message}`);
    return false;
  }
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
      const toolInput = toolData.tool_input || {};
      const transcriptPath = toolData.transcript_path;
      
      // Extract file paths from tool input
      const filePaths = extractReadPaths(toolInput);
      await log(`File paths: ${JSON.stringify(filePaths)}`);
      
      if (filePaths.length === 0) {
        await log('No file paths found in tool input');
        await exitWithTime(0, 'no-paths');
        return;
      }
      
      // Check if rules directory exists
      if (!fsSync.existsSync(RULES_DIR)) {
        await log(`Rules directory does not exist: ${RULES_DIR}`);
        await exitWithTime(0, 'no-rules-dir');
        return;
      }
      
      // Get all rule files
      let ruleFiles;
      try {
        const { stdout } = await execAsync(`find "${RULES_DIR}" -name "*.mdc" -type f`);
        ruleFiles = stdout.trim().split('\n').filter(Boolean);
        await log(`Found rule files: ${JSON.stringify(ruleFiles)}`);
      } catch (error) {
        await log(`Error finding rule files: ${error.message}`);
        await exitWithTime(0, 'find-error');
        return;
      }
      
      if (ruleFiles.length === 0) {
        await log('No rule files found');
        await exitWithTime(0, 'no-rules');
        return;
      }
      
      // Get already read .mdc files from current session transcript
      const readMdcFiles = await getReadMdcFiles(transcriptPath);
      
      // Check each file path against rule globs and collect all unread rules
      const unreadRules = [];
      
      for (const filePath of filePaths) {
        await log(`Checking file: ${filePath}`);
        
        for (const ruleFile of ruleFiles) {
          const globs = await extractGlobsFromRule(ruleFile);
          
          for (const globPattern of globs) {
            if (await matchesGlob(filePath, globPattern)) {
              await log(`File ${filePath} matches glob ${globPattern} in rule ${ruleFile}`);
              
              // Check if this rule file has been read in current session
              const hasBeenRead = readMdcFiles.includes(ruleFile);
              
              if (!hasBeenRead) {
                await log(`Rule file ${ruleFile} has not been read yet.`);
                
                // Add to unread rules if not already added
                if (!unreadRules.some(rule => rule.ruleFile === ruleFile)) {
                  unreadRules.push({ filePath, ruleFile, globPattern });
                }
              } else {
                await log(`Rule file ${ruleFile} has been read, allowing access`);
              }
            }
          }
        }
      }
      
      // If there are unread rules, block execution with all of them
      if (unreadRules.length > 0) {
        await log(`Found ${unreadRules.length} unread rule(s). Blocking execution.`);
        
        // Build comprehensive system reminder
        const rulesList = unreadRules.map(rule => 
          `- 文件 ${rule.filePath} 匹配规则 ${rule.ruleFile} 的模式 "${rule.globPattern}"`
        ).join('\n');
        
        const readCommands = [...new Set(unreadRules.map(rule => rule.ruleFile))]
          .map(ruleFile => `Read("${ruleFile}")`)
          .join('\n');
        
        const reminder = `<system-reminder>
检测到以下文件匹配未读取的规则：
${rulesList}

请先读取相关规则文件以了解约定：
${readCommands}
</system-reminder>`;
        
        process.stderr.write(reminder);
        await exitWithTime(2, 'blocked');
        return;
      }
      
      await log('All file accesses are allowed');
      await exitWithTime(0, 'success');
      
    } catch (error) {
      await log(`Error processing input: ${error.message}`);
      await exitWithTime(1, 'error');
    }
  });
}

main();