/**
 * Tests for utils/reminder.js
 */

const { describe, it, expect } = require('bun:test');

describe('utils/reminder', () => {
  const { generateSystemReminder, formatSuggestion } = require('../../utils/reminder');

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