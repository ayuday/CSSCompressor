/**
 * CSS Compressor — 单元测试
 *
 * 测试压缩器核心功能：4 种模式、注释处理、边界情况。
 */

import * as assert from 'assert';
import { compressCSS } from '../src/compressor';

// ============================================================================
// 测试入口
// ============================================================================

suite('CSS Compressor — Unit Tests', () => {

  // ==========================================================================
  // 注释处理
  // ==========================================================================

  suite('Comment Handling', () => {

    test('removeComments=true removes all /* */ comments', () => {
      const input = 'body { color: red; /* a comment */ font-size: 14px; }';
      const result = compressCSS(input, 'compressed', true, false);
      assert.ok(!result.includes('comment'), 'Comment should be removed');
      assert.ok(result.includes('color:red'));
      assert.ok(result.includes('font-size:14px'));
    });

    test('preserveImportantComments=true keeps /*! */ comments', () => {
      const input = 'body { color: red; /*! keep me */ font-size: 14px; }';
      const result = compressCSS(input, 'compressed', true, true);
      assert.ok(result.includes('/*! keep me */'), 'Important comment should be preserved');
    });

    test('Both flags: regular comments removed, important kept', () => {
      const input = 'body { /* remove */ color: red; /*! keep */ }';
      const result = compressCSS(input, 'compressed', true, true);
      assert.ok(!result.includes('remove'), 'Regular comment should be removed');
      assert.ok(result.includes('/*! keep */'), 'Important comment should be kept');
    });

    test('Comments inside strings are NOT removed', () => {
      const input = 'body { content: "/* not a comment */"; }';
      const result = compressCSS(input, 'compressed', true, false);
      assert.ok(result.includes('"/* not a comment */"'), 'Comment-like string should be preserved');
    });

    test('Nested comment pattern: /* /* inner */ ends at first */', () => {
      const input = 'body { color: red; /* /* inner */ outer */ }';
      const result = compressCSS(input, 'compressed', true, false);
      // The outer "outer */" would remain as non-comment text
      assert.ok(!result.includes('inner'), 'Inner comment text should be removed');
    });

    test('Preserved comments after a property are not corrupted (no __IC leak)', () => {
      const input = `.a {
  fill: #fafbfc;      /* .key 默认浅灰白 */
  stroke: #bfc8d4;    /* .key 边框色 */
  stroke-width: 1;
}`;
      const result = compressCSS(input, 'compressed', false, true);
      assert.ok(!result.includes('__IC'), 'Sentinel must not leak into output');
      assert.ok(result.includes('fill:#fafbfc'), 'First property should compress correctly');
      assert.ok(result.includes('stroke:#bfc8d4'), 'Property after comment should compress correctly');
      assert.ok(result.includes('stroke-width:1'), 'Property after second comment should compress correctly');
      assert.ok(result.includes('/* .key 默认浅灰白 */'), 'Comment should be preserved');
      assert.ok(result.includes('/* .key 边框色 */'), 'Second comment should be preserved');
    });

    test('Property after preserved comment keeps its name (all modes)', () => {
      const input = 'body { color: red; /* keep */ font-size: 14px; }';
      for (const mode of ['compressed', 'compact', 'compact-spaces', 'expanded'] as const) {
        const result = compressCSS(input, mode, false, true, 4);
        assert.ok(result.includes('color'), `${mode}: color property should keep name`);
        assert.ok(result.includes('font-size'), `${mode}: property after comment should keep name`);
        assert.ok(!result.includes('__IC'), `${mode}: sentinel must not leak`);
      }
    });
  });

  // ==========================================================================
  // 选择器处理
  // ==========================================================================

  suite('Selector Handling', () => {

    test(':root and :where(...) selectors are not split (all modes)', () => {
      const input = `:root {
  --ink: #18314f;
}
:where(a, button, textarea):focus-visible {
  outline: 3px solid var(--orange);
}`;
      for (const mode of ['compressed', 'compact', 'compact-spaces', 'expanded'] as const) {
        const result = compressCSS(input, mode, false, true, 4);
        // compact-spaces 和 expanded 在 { 前保留空格，其余紧凑
        const brace = (mode === 'compact-spaces' || mode === 'expanded') ? ' {' : '{';
        assert.ok(result.includes(':root' + brace), `${mode}: :root should stay intact`);
        assert.ok(result.includes(':where(a, button, textarea):focus-visible' + brace), `${mode}: :where(...) should stay intact`);
        assert.ok(!result.includes(':\n'), `${mode}: colon should not be orphaned`);
      }
    });

    test('Pseudo-element selectors keep colons', () => {
      const input = '.foo::before { content: "x"; } a:hover { color: red; }';
      const result = compressCSS(input, 'compressed', false, true);
      assert.ok(result.includes('.foo::before'), '::before should be preserved');
      assert.ok(result.includes('a:hover'), 'a:hover should be preserved');
    });
  });

  // ==========================================================================
  // Compressed 模式
  // ==========================================================================

  suite('Compressed Mode', () => {

    test('Single rule, single property → one line', () => {
      const input = 'body {\n  background-color: #f5f5f5;\n}';
      const result = compressCSS(input, 'compressed', false, true);
      assert.strictEqual(result, 'body{background-color:#f5f5f5;}');
    });

    test('Multiple selectors → compressed correctly', () => {
      const input = '.a, .b, .c { color: red; }';
      const result = compressCSS(input, 'compressed', false, true);
      assert.strictEqual(result, '.a,.b,.c{color:red;}');
    });

    test('Multiple rules → all on one line', () => {
      const input = 'a { color: red; } b { color: blue; }';
      const result = compressCSS(input, 'compressed', false, true);
      assert.strictEqual(result, 'a{color:red;}b{color:blue;}');
    });

    test('@media query → compressed with nested rules', () => {
      const input = '@media (max-width: 768px) { .foo { padding: 20px; } }';
      const result = compressCSS(input, 'compressed', false, true);
      assert.strictEqual(result, '@media(max-width:768px){.foo{padding:20px;}}');
    });

    test('Empty rule blocks are removed', () => {
      const input = 'a { color: red; } .empty { } b { color: blue; }';
      const result = compressCSS(input, 'compressed', false, true);
      assert.ok(!result.includes('empty'), 'Empty block should be removed');
      assert.ok(result.includes('a{'));
      assert.ok(result.includes('b{'));
    });
  });

  // ==========================================================================
  // Compact 模式
  // ==========================================================================

  suite('Compact Mode', () => {

    test('Single rule: no space between selector and brace', () => {
      const input = 'body { color: red; font-size: 14px; }';
      const result = compressCSS(input, 'compact', false, true);
      assert.strictEqual(result, 'body{color:red;font-size:14px;}\n');
    });

    test('Multiple rules separated by newlines', () => {
      const input = 'a { color: red; }\nb { color: blue; }';
      const result = compressCSS(input, 'compact', false, true);
      assert.ok(result.includes('\n'), 'Multiple rules should have newlines between them');
    });

    test('Media query nested blocks', () => {
      const input = '@media screen { a { color: red; } }';
      const result = compressCSS(input, 'compact', false, true);
      // 每个闭块应有换行
      assert.ok(result.includes('red;}}'), 'Nested closing braces should be on same line');
    });
  });

  // ==========================================================================
  // Compact-Spaces 模式
  // ==========================================================================

  suite('Compact-Spaces Mode', () => {

    test('Selector { prop: val; } has spaces', () => {
      const input = 'body{color:red;font-size:14px;}';
      const result = compressCSS(input, 'compact-spaces', false, true);
      assert.strictEqual(result.trim(), 'body { color: red; font-size: 14px; }');
    });

    test('Multiple blocks separated by newlines', () => {
      const input = 'a { color: red; } b { color: blue; }';
      const result = compressCSS(input, 'compact-spaces', false, true);
      const lines = result.trim().split('\n');
      assert.ok(lines.length >= 2, 'Should have multiple lines');
    });
  });

  // ==========================================================================
  // Expanded 模式
  // ==========================================================================

  suite('Expanded Mode', () => {

    test('Each property on its own line with indentation', () => {
      const input = 'body { color: red; font-size: 14px; }';
      const result = compressCSS(input, 'expanded', false, true, 4);
      const lines = result.split('\n').filter(l => l.trim().length > 0);
      // 应该至少有 body {, color: red;, font-size: 14px;, }
      assert.ok(lines.some(l => l.includes('color: red')), 'Should contain color property');
      assert.ok(lines.some(l => l.includes('font-size: 14px')), 'Should contain font-size property');
      // 属性行应有缩进
      const propLine = lines.find(l => l.includes('color: red'));
      assert.ok(propLine!.startsWith('    '), 'Property line should be indented');
    });

    test('Multi-selector split: each selector on its own line', () => {
      const input = '.a, .b, .c { color: red; }';
      const result = compressCSS(input, 'expanded', false, true, 4);
      assert.ok(result.includes('.a,\n'), 'Selectors should be split');
      assert.ok(result.includes('.b,\n'), 'Second selector should be on its own line');
      assert.ok(result.includes('.c'), 'Third selector should be on its own line');
    });

    test('Custom indent size is honored', () => {
      const input = 'body { color: red; }';
      const result = compressCSS(input, 'expanded', false, true, 2);
      const propLine = result.split('\n').find(l => l.includes('color: red'));
      assert.ok(propLine!.startsWith('  '), 'Should use 2-space indent');
    });
  });

  // ==========================================================================
  // 边界情况
  // ==========================================================================

  suite('Edge Cases', () => {

    test('String with escaped quote', () => {
      const input = 'body { content: "he said \\"hello\\""; }';
      const result = compressCSS(input, 'compressed', false, true);
      assert.ok(result.includes('"he said \\"hello\\""'), 'Escaped quotes should be preserved');
    });

    test('url() function value', () => {
      const input = 'body { background: url("image.png"); }';
      const result = compressCSS(input, 'compressed', false, true);
      assert.ok(result.includes('url("image.png")'), 'url() should be preserved');
    });

    test('calc() expression', () => {
      const input = '.foo { width: calc(100% - 20px); }';
      const result = compressCSS(input, 'compressed', false, true);
      assert.ok(result.includes('calc(100% - 20px)'), 'calc() should be preserved');
    });

    test('Gradient with multiple color stops', () => {
      const input = '.box { background: linear-gradient(135deg, #008de1 0%, #00b5e2 100%); }';
      const result = compressCSS(input, 'compressed', false, true);
      assert.ok(result.includes('linear-gradient(135deg,#008de1 0%,#00b5e2 100%)'), 'Gradient should be preserved');
    });

    test('CSS custom properties (variables)', () => {
      const input = ':root { --main-color: #333; --spacing: 8px; }';
      const result = compressCSS(input, 'compressed', false, true);
      assert.ok(result.includes('--main-color:#333'), 'Custom property should be preserved');
      assert.ok(result.includes('--spacing:8px'), 'Custom property should be preserved');
    });

    test('@import statement (no block)', () => {
      const input = '@import "foo.css";\nbody { color: red; }';
      const result = compressCSS(input, 'compressed', false, true);
      assert.ok(result.includes('@import "foo.css"'), '@import should be preserved');
    });

    test('Pseudo-elements ::before / ::after', () => {
      const input = '.foo::before { content: "x"; }';
      const result = compressCSS(input, 'compressed', false, true);
      assert.ok(result.includes('.foo::before'), 'Pseudo-element should be preserved');
    });

    test('Attribute selectors [type="text"]', () => {
      const input = 'input[type="text"] { border: 1px solid #ccc; }';
      const result = compressCSS(input, 'compressed', false, true);
      assert.ok(result.includes('input[type="text"]'), 'Attribute selector should be preserved');
    });

    test('Empty input → empty output', () => {
      const result = compressCSS('', 'compressed', false, true);
      assert.strictEqual(result, '');
    });

    test('Whitespace-only input', () => {
      const result = compressCSS('   \n  \t  ', 'compressed', false, true);
      assert.strictEqual(result, '');
    });

    test('SCSS/LESS nested rules', () => {
      const input = 'nav { ul { li { color: red; } } }';
      const result = compressCSS(input, 'compressed', false, true);
      assert.strictEqual(result, 'nav{ul{li{color:red;}}}');
    });
  });

  // ==========================================================================
  // 往返一致性
  // ==========================================================================

  suite('Roundtrip Fidelity', () => {

    test('Compressed → Expanded → Compressed yields same result', () => {
      const input = 'body{color:red;font-size:14px;}a{color:blue;}';
      const expanded = compressCSS(input, 'expanded', false, true, 4);
      const recompressed = compressCSS(expanded, 'compressed', false, true);
      assert.strictEqual(recompressed, input);
    });

    test('All property values preserved exactly', () => {
      const input = 'a{color:#ff0;margin:0 auto;padding:10px 5px 10px 5px;}';
      const expanded = compressCSS(input, 'expanded', false, true, 4);
      const recompressed = compressCSS(expanded, 'compressed', false, true);
      assert.strictEqual(recompressed, input);
    });
  });
});
