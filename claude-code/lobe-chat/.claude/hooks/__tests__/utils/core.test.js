/**
 * Tests for utils/core.js
 */

const { describe, it, expect } = require('bun:test');

describe('utils/core', () => {
  const { extractToolInfo } = require('../../utils/core');

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