/**
 * Tests for utils modules
 */

const { describe, it, expect } = require('bun:test');
const path = require('path');

// Test command utilities
describe('utils/command', () => {
  const { parseMvCommand, parseRmCommand, parseGitCommand, usesGrep, parseCommandChain } = require('../utils/command');

  it('should parse mv command correctly', () => {
    const result = parseMvCommand('mv old.js new.js');
    expect(result).toBeTruthy();
    expect(result.sourceFile).toBe('old.js');
    expect(result.targetFile).toBe('new.js');
    expect(result.isRename).toBe(true);
  });

  it('should parse rm command with flags', () => {
    const result = parseRmCommand('rm -rf node_modules');
    expect(result).toBeTruthy();
    expect(result.files).toEqual(['node_modules']);
    expect(result.isForce).toBe(true);
    expect(result.isRecursive).toBe(true);
  });

  it('should parse git command', () => {
    const result = parseGitCommand('git push -f origin main');
    expect(result).toBeTruthy();
    expect(result.subcommand).toBe('push');
    expect(result.isForce).toBe(true);
    expect(result.subArgs).toEqual(['origin', 'main']);
  });

  it('should detect grep usage', () => {
    expect(usesGrep('grep pattern file.txt')).toBe(true);
    expect(usesGrep('rg pattern file.txt')).toBe(false);
  });

  it('should parse command chain', () => {
    const result = parseCommandChain('cd src && npm install; npm test');
    expect(result).toHaveLength(3);
    expect(result[0].command).toBe('cd src');
    expect(result[0].requireSuccess).toBe(true);
    expect(result[2].continueOnError).toBe(true);
  });
});

// Test filesystem utilities
describe('utils/filesystem', () => {
  const { isPathInWorkspace, extractFilePaths } = require('../utils/filesystem');

  it('should check if path is in workspace', () => {
    const result = isPathInWorkspace('./test.js');
    expect(result).toBe(true);

    const outside = isPathInWorkspace('/etc/passwd');
    expect(outside).toBe(false);
  });

  it('should extract file paths from tool input', () => {
    const paths = extractFilePaths({
      file_path: '/test.js',
      edits: [{ file_path: '/other.js' }],
    });
    expect(paths).toContain('/test.js');
    expect(paths).toContain('/other.js');
  });
});

// Test reminder utilities
describe('utils/reminder', () => {
  const { generateSystemReminder, formatSuggestion } = require('../utils/reminder');

  it('should generate system reminder', () => {
    const reminder = generateSystemReminder('Test message');
    expect(reminder).toContain('<system-reminder>');
    expect(reminder).toContain('Test message');
    expect(reminder).toContain('</system-reminder>');
  });

  it('should format grep usage suggestion', () => {
    const suggestion = formatSuggestion('grep_usage', {
      command: 'grep pattern',
      suggestion: 'Use rg instead',
    });
    expect(suggestion).toContain('grep 命令使用');
    expect(suggestion).toContain('grep pattern');
  });
});

// Test logger utilities
describe('utils/logger', () => {
  const { createLogger } = require('../utils/logger');

  it('should create logger instance', () => {
    const logger = createLogger('test.log');
    expect(logger).toBeTruthy();
    expect(logger.debug).toBeInstanceOf(Function);
    expect(logger.error).toBeInstanceOf(Function);
    expect(logger.time).toBeInstanceOf(Function);
    expect(logger.json).toBeInstanceOf(Function);
  });
});

// Test core utilities
describe('utils/core', () => {
  const { extractToolInfo } = require('../utils/core');

  it('should extract tool info', () => {
    const toolData = {
      tool_name: 'Read',
      tool_input: { file_path: 'test.js' },
      tool_response: { content: 'test' },
      transcript_path: '/tmp/transcript.json',
    };

    const info = extractToolInfo(toolData);
    expect(info.toolName).toBe('Read');
    expect(info.toolInput.file_path).toBe('test.js');
    expect(info.toolResponse.content).toBe('test');
    expect(info.transcriptPath).toBe('/tmp/transcript.json');
  });
});

