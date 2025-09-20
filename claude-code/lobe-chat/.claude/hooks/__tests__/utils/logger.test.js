/**
 * Tests for utils/logger.js
 */

const { describe, it, expect } = require('bun:test');

describe('utils/logger', () => {
  const { createLogger } = require('../../utils/logger');

  it('should create logger instance', () => {
    const logger = createLogger('test.log');
    expect(logger).toBeTruthy();
    expect(logger.debug).toBeInstanceOf(Function);
    expect(logger.error).toBeInstanceOf(Function);
    expect(logger.time).toBeInstanceOf(Function);
    expect(logger.json).toBeInstanceOf(Function);
  });
});