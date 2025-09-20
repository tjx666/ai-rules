/**
 * System reminder utilities for Claude Code hooks
 */

/**
 * Generate system reminder wrapper
 * @param {string|Array<string>} messages - Message(s) to include in reminder
 * @returns {string} Formatted system reminder
 */
function generateSystemReminder(messages) {
  const content = Array.isArray(messages) ? messages.join('\n\n') : messages;
  return `<system-reminder>\n${content}\n</system-reminder>`;
}

/**
 * Format a suggestion message
 * @param {string} type - Suggestion type
 * @param {Object} data - Suggestion data
 * @returns {string} Formatted suggestion message
 */
function formatSuggestion(type, data) {
  const formatters = {
    // Grep usage suggestion
    grep_usage: (d) =>
      [
        `🔍 检测到 grep 命令使用：`,
        `   命令: ${d.command}`,
        `   建议: 使用 rg (ripgrep) 替代 grep`,
        `   优势: ${d.suggestion || 'rg (ripgrep) 提供更好的性能和功能'}`,
        `   示例: rg "pattern" 或 rg "pattern" --type js`,
      ].join('\n'),

    // WebFetch GitHub suggestion
    webfetch_github: (d) =>
      [
        `🐙 检测到 WebFetch 访问 GitHub ${d.githubType}：`,
        `   URL: ${d.url}`,
        `   建议: 使用 gh CLI 替代 WebFetch`,
        `   推荐: ${d.ghCommand}`,
        `   优势: ${d.suggestion || 'gh CLI 可以提供结构化数据和更好的API访问'}`,
      ].join('\n'),

    // Write corruption detection
    write_corruption: (d) =>
      [
        `⚠️ 检测到 Write 工具输出文件内容损坏：`,
        `   文件: ${d.filePath}`,
        `   预期长度: ${d.intendedLength} 字符 (${d.intendedBytes} 字节)`,
        `   实际长度: ${d.actualLength} 字符 (${d.actualBytes} 字节)`,
        `   首个差异位置: 第 ${d.firstDiffAt} 个字符`,
        `   替换字符(�): ${d.replacementChars} 个`,
        `   控制字符: ${d.controlChars} 个`,
        `   建议: ${d.suggestion || '文件写入后内容与预期不符，存在数据损坏'}`,
        `   解决方案:`,
        `   1. 重新使用 Write 工具写入内容`,
        `   2. 确保输入文本为纯UTF-8编码`,
        `   3. 向 anthropics/claude-code 报告此问题`,
      ].join('\n'),

    // mv rename suggestion
    mv_rename_suggestion: (d) =>
      [
        `💡 检测到文件重命名操作：`,
        `   命令: ${d.command}`,
        `   建议: 使用 VSCode MCP 工具替代 mv 命令`,
        `   推荐: mcp__vscode-mcp__rename_symbol`,
        `   源文件: ${d.sourceFile}`,
        `   目标文件: ${d.targetFile}`,
        `   优势: ${d.suggestion || 'VSCode MCP 可以自动更新导入引用'}`,
      ].join('\n'),

    // Read rule violation
    read_violation: (d) =>
      [
        `📖 读取规则违规：`,
        `   文件: ${d.filePath} (${d.lineCount} 行)`,
        `   原因: ${d.reason}`,
        `   建议: 请重新完整读取该文件以获得完整上下文`,
      ].join('\n'),

    // Dangerous command detection
    dangerous_command: (d) =>
      [
        `🚨 检测到危险命令：`,
        `   命令: ${d.command}`,
        `   类型: ${d.description}`,
        `   原因: ${d.reason}`,
        `   建议: 请确认是否继续执行`,
      ].join('\n'),

    // Cursor rules reminder
    cursor_rules: (d) =>
      [
        `📋 请先读取相关规则文件以了解约定：`,
        ...d.ruleFiles.map((file) => `   Read("${file}")`),
      ].join('\n'),

    // Generic suggestion
    generic: (d) =>
      [
        d.title || '💡 建议',
        ...Object.entries(d)
          .filter(([key]) => key !== 'title')
          .map(([key, value]) => `   ${key}: ${value}`),
      ].join('\n'),
  };

  const formatter = formatters[type] || formatters.generic;
  return formatter(data);
}

/**
 * Generate reminder for multiple suggestions
 * @param {Array<Object>} suggestions - Array of suggestion objects with type and data
 * @returns {string} Formatted system reminder with all suggestions
 */
function generateSuggestionsReminder(suggestions) {
  const messages = suggestions.map((s) => formatSuggestion(s.type, s));
  return generateSystemReminder(messages);
}

module.exports = {
  generateSystemReminder,
  formatSuggestion,
  generateSuggestionsReminder,
};
