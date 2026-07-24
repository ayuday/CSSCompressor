// 独立测试脚本：验证 compressHtmlStyles 逻辑
const { compressCSS } = require('./out/compressor');
const fs = require('fs');

// 复制 compressHtmlStyles 逻辑（去掉 vscode 依赖）
function extractStyleBlocks(html) {
  const blocks = [];
  const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let match;

  while ((match = styleRegex.exec(html)) !== null) {
    const fullMatchStart = match.index;
    const openTagEnd = html.indexOf('>', fullMatchStart) + 1;
    const closeTagStart = html.indexOf('</style>', openTagEnd);
    let contentStart = openTagEnd;
    let contentEnd = closeTagStart;
    const rawContent = html.substring(contentStart, contentEnd);
    const trimmedStart = rawContent.match(/^(\s*)/)?.[1]?.length ?? 0;
    const trimmedEnd = rawContent.match(/(\s*)$/)?.[1]?.length ?? 0;
    contentStart += trimmedStart;
    contentEnd -= trimmedEnd;
    const actualContent = html.substring(contentStart, contentEnd);
    blocks.push({ content: actualContent, contentStart, contentEnd });
  }
  return blocks;
}

function compressHtmlStyles(html, mode) {
  const blocks = extractStyleBlocks(html);
  if (blocks.length === 0) return html;

  let result = html;
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    const compressed = compressCSS(block.content, mode, false, true);
    result =
      result.substring(0, block.contentStart) +
      '\n' + compressed.trim() + '\n' +
      result.substring(block.contentEnd);
  }
  return result;
}

const html = fs.readFileSync('g:/my/CSSCompressor/test/test.html', 'utf8');
const result = compressHtmlStyles(html, 'compact');

console.log('=== Input ===');
console.log(html);

console.log('\n=== Output ===');
console.log(result);

console.log('\n=== DIFF ===');
console.log('Input length:', html.length);
console.log('Output length:', result.length);
console.log('Same?', result === html);

// Check the style section specifically
const origStyle = html.match(/<style>([\s\S]*?)<\/style>/i)[1];
const newStyle = result.match(/<style>([\s\S]*?)<\/style>/i)[1];
console.log('\nOriginal style first line:', JSON.stringify(origStyle.split('\n')[0]));
console.log('New style first line:', JSON.stringify(newStyle.split('\n')[0]));
