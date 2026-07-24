/**
 * CSS Compressor — 工具函数
 *
 * 包含 HTML style 标签提取、配置读取等辅助功能。
 */

import * as vscode from 'vscode';
import { compressCSS, type CompressMode } from './compressor';

// ============================================================================
// HTML Style 标签处理
// ============================================================================

interface StyleBlock {
  /** CSS 内容（<style> 和 </style> 之间的部分） */
  content: string;
  /** 内容在原文中的起始位置 */
  contentStart: number;
  /** 内容在原文中的结束位置 */
  contentEnd: number;
}

/**
 * 从 HTML 字符串中提取所有 <style> 标签块。
 * 支持带属性的 style 标签，如 <style type="text/css">。
 */
function extractStyleBlocks(html: string): StyleBlock[] {
  const blocks: StyleBlock[] = [];
  // 匹配 <style ...> ... </style>，支持多行和属性
  const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null;

  while ((match = styleRegex.exec(html)) !== null) {
    const fullMatchStart = match.index;

    // 定位 > 的位置（开标签结束）
    const openTagEnd = html.indexOf('>', fullMatchStart) + 1;
    // 定位 </style> 的位置
    const closeTagStart = html.indexOf('</style>', openTagEnd);

    // 计算内容区域的起止
    // 跳过开标签后的空白行首
    let contentStart = openTagEnd;
    let contentEnd = closeTagStart;

    // 去掉内容首尾的空白行
    const rawContent = html.substring(contentStart, contentEnd);
    const trimmedStart = rawContent.match(/^(\s*)/)?.[1]?.length ?? 0;
    const trimmedEnd = rawContent.match(/(\s*)$/)?.[1]?.length ?? 0;

    contentStart += trimmedStart;
    contentEnd -= trimmedEnd;

    const actualContent = html.substring(contentStart, contentEnd);

    blocks.push({
      content: actualContent,
      contentStart,
      contentEnd,
    });
  }

  return blocks;
}

/**
 * 压缩 HTML 文件中所有 <style> 标签内的 CSS 内容。
 *
 * 对每个 <style> 标签的内容独立压缩，保留标签本身和属性不变。
 * 从后向前替换以保持索引有效。
 */
export function compressHtmlStyles(
  html: string,
  mode: CompressMode,
  removeComments: boolean,
  preserveImportantComments: boolean,
  indentSize?: number
): string {
  const blocks = extractStyleBlocks(html);
  if (blocks.length === 0) {
    return html;
  }

  // 从后向前处理，确保索引不会失效
  let result = html;
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    const compressed = compressCSS(
      block.content,
      mode,
      removeComments,
      preserveImportantComments,
      indentSize
    );

    // 在压缩结果外添加合适的格式
    // 如果原内容有缩进，保留基本格式
    result =
      result.substring(0, block.contentStart) +
      '\n' + compressed.trim() + '\n' +
      result.substring(block.contentEnd);
  }

  return result;
}

// ============================================================================
// 配置读取
// ============================================================================

/**
 * 从 VS Code 工作区配置中读取 CSS Compressor 设置。
 */
export function getCompressConfig(): {
  defaultMode: CompressMode;
  removeComments: boolean;
  preserveImportantComments: boolean;
  indentSize: number;
} {
  const config = vscode.workspace.getConfiguration('cssCompressor');

  return {
    defaultMode: config.get<CompressMode>('defaultMode', 'compact'),
    removeComments: config.get<boolean>('removeComments', false),
    preserveImportantComments: config.get<boolean>('preserveImportantComments', true),
    indentSize: config.get<number>('indentSize', 4),
  };
}

/**
 * 设置上下文键，用于菜单条件判断。
 */
export function setContextKeys(mode: CompressMode): void {
  vscode.commands.executeCommand('setContext', 'cssCompressor.currentMode', mode);
}
