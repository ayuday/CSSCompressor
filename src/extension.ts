/**
 * CSS Compressor — VS Code 扩展入口
 *
 * 注册 5 个命令，处理编辑器中的 CSS/HTML 文件压缩。
 */

import * as vscode from 'vscode';
import { compressCSS, type CompressMode } from './compressor';
import { compressHtmlStyles, getCompressConfig, setContextKeys } from './utils';

// ============================================================================
// 支持的文件类型
// ============================================================================

const SUPPORTED_LANGUAGES = new Set([
  'css',
  'scss',
  'less',
  'sass',
  'wxss',
  'html',
]);

// ============================================================================
// 命令枚举
// ============================================================================

const COMMANDS = {
  compress: 'css-compressor.compress',
  expanded: 'css-compressor.expanded',
  compactSpaces: 'css-compressor.compactSpaces',
  compact: 'css-compressor.compact',
  compressed: 'css-compressor.compressed',
} as const;

// ============================================================================
// 核心处理逻辑
// ============================================================================

/**
 * 处理编辑器内容：检测选中/全文，判断文件类型，执行压缩并替换。
 */
async function processEditor(
  editor: vscode.TextEditor,
  mode: CompressMode
): Promise<void> {
  const document = editor.document;
  const selection = editor.selection;
  const config = getCompressConfig();

  const indentSize = config.indentSize;
  const removeComments = config.removeComments;
  const preserveImportantComments = config.preserveImportantComments;

  // 判断是否有选中文本
  let text: string;
  let range: vscode.Range;

  if (!selection.isEmpty) {
    // --- 选中文本压缩 ---
    text = document.getText(selection);
    range = selection;
  } else {
    // --- 整个文档压缩 ---
    text = document.getText();
    const lastLine = document.lineAt(document.lineCount - 1);
    range = new vscode.Range(
      0, 0,
      document.lineCount - 1,
      lastLine.text.length
    );
  }

  // 空文本直接跳过
  if (!text || text.trim().length === 0) {
    return;
  }

  let result: string;

  // HTML 文件特殊处理
  if (document.languageId === 'html') {
    result = compressHtmlStyles(
      text,
      mode,
      removeComments,
      preserveImportantComments,
      indentSize
    );
  } else {
    result = compressCSS(
      text,
      mode,
      removeComments,
      preserveImportantComments,
      indentSize
    );
  }

  // 替换文本
  const success = await editor.edit(
    (editBuilder) => {
      editBuilder.replace(range, result);
    },
    { undoStopBefore: true, undoStopAfter: true }
  );

  if (success) {
    setContextKeys(mode);
    const modeLabel = getModeLabel(mode);
    vscode.window.setStatusBarMessage(
      `$(check) CSS Compressed (${modeLabel})`,
      3000
    );
  }
}

/**
 * 获取模式的友好显示名称。
 */
function getModeLabel(mode: CompressMode): string {
  switch (mode) {
    case 'expanded':
      return 'Expanded';
    case 'compact-spaces':
      return 'Compact-Spaces';
    case 'compact':
      return 'Compact';
    case 'compressed':
      return 'Compressed';
    default:
      return mode;
  }
}

// ============================================================================
// 扩展生命周期
// ============================================================================

export function activate(context: vscode.ExtensionContext): void {
  console.log('CSS Compressor extension activated');

  // --- 注册命令 ---

  // 使用默认模式压缩
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.compress, () => {
      const editor = vscode.window.activeTextEditor;
      if (!checkEditor(editor)) return;

      const config = getCompressConfig();
      processEditor(editor!, config.defaultMode);
    })
  );

  // Expanded 模式
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.expanded, () => {
      const editor = vscode.window.activeTextEditor;
      if (!checkEditor(editor)) return;
      processEditor(editor!, 'expanded');
    })
  );

  // Compact-Spaces 模式
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.compactSpaces, () => {
      const editor = vscode.window.activeTextEditor;
      if (!checkEditor(editor)) return;
      processEditor(editor!, 'compact-spaces');
    })
  );

  // Compact 模式
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.compact, () => {
      const editor = vscode.window.activeTextEditor;
      if (!checkEditor(editor)) return;
      processEditor(editor!, 'compact');
    })
  );

  // Compressed 模式
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.compressed, () => {
      const editor = vscode.window.activeTextEditor;
      if (!checkEditor(editor)) return;
      processEditor(editor!, 'compressed');
    })
  );

  // --- 状态栏按钮 ---
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = '$(file-code) CSS';
  statusBarItem.tooltip = 'CSS Compressor: Compress CSS (Click)';
  statusBarItem.command = COMMANDS.compress;
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // --- 监听配置变更，更新状态栏 ---
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('cssCompressor')) {
        const config = getCompressConfig();
        statusBarItem.tooltip = `CSS Compressor: Compress CSS (${getModeLabel(config.defaultMode)})`;
      }
    })
  );

  // --- 初始化上下文 ---
  const config = getCompressConfig();
  setContextKeys(config.defaultMode);
}

export function deactivate(): void {
  // 清理工作（如有需要）
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 检查编辑器是否可用且文件类型受支持。
 */
function checkEditor(editor: vscode.TextEditor | undefined): editor is vscode.TextEditor {
  if (!editor) {
    vscode.window.showWarningMessage(
      'CSS Compressor: No active editor found.'
    );
    return false;
  }

  if (!SUPPORTED_LANGUAGES.has(editor.document.languageId)) {
    vscode.window.showWarningMessage(
      `CSS Compressor: Unsupported file type "${editor.document.languageId}". ` +
      `Supported types: ${[...SUPPORTED_LANGUAGES].join(', ')}.`
    );
    return false;
  }

  return true;
}
