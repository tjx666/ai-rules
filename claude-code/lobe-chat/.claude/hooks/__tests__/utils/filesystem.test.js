/**
 * Tests for utils/filesystem.js
 */

const { describe, it, expect } = require('bun:test');
const path = require('path');
const fs = require('fs').promises;

describe('utils/filesystem', () => {
  const { isPathInWorkspace, extractFilePaths, extractRulesFromClaudeMd } = require('../../utils/filesystem');

  describe('path and file utilities', () => {
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

  describe('extractRulesFromClaudeMd', () => {
    // Mock logger
    const mockLogger = {
      debug: () => {},
    };

    it('should extract @ format rules from CLAUDE.md', async () => {
      const claudeMdPath = path.join(process.cwd(), '../../CLAUDE.md');
      const rules = await extractRulesFromClaudeMd(claudeMdPath, mockLogger);

      // Check @ format rules
      expect(rules).toContain('.cursor/rules/lobe-cloud.mdc');
      expect(rules).toContain('.cursor/rules/project-introduce.mdc');
      expect(rules).toContain('.cursor/rules/project-structure.mdc');
      expect(rules).toContain('.cursor/rules/typescript.mdc');
    });



    it('should extract all 4 @ format rules from current CLAUDE.md', async () => {
      const claudeMdPath = path.join(process.cwd(), '../../CLAUDE.md');
      const rules = await extractRulesFromClaudeMd(claudeMdPath, mockLogger);

      expect(rules).toHaveLength(4);
    });

    it('should return empty array if CLAUDE.md does not exist', async () => {
      const nonExistentPath = '/non/existent/CLAUDE.md';
      const rules = await extractRulesFromClaudeMd(nonExistentPath, mockLogger);

      expect(rules).toEqual([]);
    });

    it('should handle malformed content gracefully', async () => {
      // Create a temp file with test content
      const tempPath = path.join(process.cwd(), 'utils/test-claude.md');
      await fs.writeFile(
        tempPath,
        `
        This is a test file
        @.cursor/rules/valid.mdc
        @invalid-format
        \`not-mdc-file.js\`
        @.cursor/rules/valid-rule.mdc
        `,
        'utf8',
      );

      const rules = await extractRulesFromClaudeMd(tempPath, mockLogger);

      expect(rules).toContain('.cursor/rules/valid.mdc');
      expect(rules).toContain('.cursor/rules/valid-rule.mdc');
      expect(rules).toHaveLength(2);

      // Clean up
      await fs.unlink(tempPath);
    });
  });
});