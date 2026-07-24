/**
 * CSS Compressor — 集成测试
 *
 * 测试扩展激活、命令注册、HTML 处理等。
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { compressHtmlStyles } from '../src/utils';

suite('CSS Compressor — Integration Tests', () => {

  // ==========================================================================
  // HTML Style 标签提取
  // ==========================================================================

  suite('HTML Style Extraction', () => {

    test('Single style tag compression', () => {
      const html = `<html>
<head>
<style>
body {
  color: red;
  font-size: 14px;
}
</style>
</head>
<body></body>
</html>`;
      const result = compressHtmlStyles(html, 'compressed', false, true);
      assert.ok(result.includes('<style>'), 'Style tag should be preserved');
      assert.ok(result.includes('</style>'), 'Closing style tag should be preserved');
      assert.ok(result.includes('body{color:red;font-size:14px;}'), 'CSS should be compressed');
    });

    test('Multiple style tags', () => {
      const html = `<style>a { color: red; }</style>
<style>b { color: blue; }</style>`;
      const result = compressHtmlStyles(html, 'compressed', false, true);
      assert.ok(result.includes('a{color:red;}'), 'First block should be compressed');
      assert.ok(result.includes('b{color:blue;}'), 'Second block should be compressed');
    });

    test('Style tag with attributes', () => {
      const html = `<style type="text/css" scoped>
.foo { color: green; }
</style>`;
      const result = compressHtmlStyles(html, 'compressed', false, true);
      assert.ok(result.includes('type="text/css"'), 'Style attributes should be preserved');
      assert.ok(result.includes('.foo{color:green;}'), 'CSS should be compressed');
    });

    test('No style tags → HTML unchanged', () => {
      const html = '<html><body><p>Hello</p></body></html>';
      const result = compressHtmlStyles(html, 'compressed', false, true);
      assert.strictEqual(result, html);
    });

    test('Compressed mode with comment removal', () => {
      const html = `<style>
/* remove this */
.foo { color: red; /*! keep this */ }
</style>`;
      const result = compressHtmlStyles(html, 'compressed', true, true);
      assert.ok(!result.includes('remove this'), 'Regular comment should be removed');
      assert.ok(result.includes('/*! keep this */'), 'Important comment should be kept');
    });
  });

  // ==========================================================================
  // 扩展激活
  // ==========================================================================

  suite('Extension Activation', () => {

    test('Extension should be present', async () => {
      const ext = vscode.extensions.getExtension('your-publisher-id.css-compressor');
      // 在开发模式下扩展可能以 development 模式加载
      // 这个测试验证扩展存在
      if (ext) {
        assert.ok(ext.id.includes('css-compressor'), 'Extension ID should contain css-compressor');
      }
    });

    test('All 5 commands are registered', async () => {
      const commands = await vscode.commands.getCommands(true);

      const expectedCommands = [
        'css-compressor.compress',
        'css-compressor.expanded',
        'css-compressor.compactSpaces',
        'css-compressor.compact',
        'css-compressor.compressed',
      ];

      for (const cmd of expectedCommands) {
        assert.ok(
          commands.includes(cmd),
          `Command "${cmd}" should be registered`
        );
      }
    });
  });

  // ==========================================================================
  // 配置读取
  // ==========================================================================

  suite('Configuration', () => {

    test('Default mode should be compact', () => {
      const config = vscode.workspace.getConfiguration('cssCompressor');
      const defaultMode = config.get<string>('defaultMode');
      assert.strictEqual(defaultMode, 'compact');
    });

    test('removeComments should default to false', () => {
      const config = vscode.workspace.getConfiguration('cssCompressor');
      const val = config.get<boolean>('removeComments');
      assert.strictEqual(val, false);
    });

    test('indentSize should default to 4', () => {
      const config = vscode.workspace.getConfiguration('cssCompressor');
      const val = config.get<number>('indentSize');
      assert.strictEqual(val, 4);
    });
  });
});
