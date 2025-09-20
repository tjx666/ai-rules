/**
 * Tests for utils/command.js
 */

const { describe, it, expect } = require('bun:test');

describe('utils/command', () => {
  const { parseMvCommand, parseRmCommand, parseGitCommand, usesGrep, parseCommandChain } = require('../../utils/command');

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