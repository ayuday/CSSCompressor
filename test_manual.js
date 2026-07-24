// 快速冒烟测试脚本
const { compressCSS } = require('./out/src/compressor');

const tests = [];

function test(name, fn) {
  try {
    fn();
    tests.push({ name, pass: true });
    console.log('  PASS:', name);
  } catch (e) {
    tests.push({ name, pass: false, error: e.message });
    console.log('  FAIL:', name, '→', e.message);
  }
}

function eq(actual, expected) {
  if (actual !== expected) {
    throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function contains(haystack, needle) {
  if (!haystack.includes(needle)) {
    throw new Error(`expected to contain ${JSON.stringify(needle)}, got ${JSON.stringify(haystack)}`);
  }
}

function notContains(haystack, needle) {
  if (haystack.includes(needle)) {
    throw new Error(`expected NOT to contain ${JSON.stringify(needle)}, got ${JSON.stringify(haystack)}`);
  }
}

test('Compressed basic', () => {
  eq(compressCSS('body { color: red; }', 'compressed', false, true), 'body{color:red;}');
});

test('Compressed multi property', () => {
  eq(compressCSS('body { color: red; font-size: 14px; }', 'compressed', false, true), 'body{color:red;font-size:14px;}');
});

test('Compressed multi rules', () => {
  eq(compressCSS('a { color: red; } b { color: blue; }', 'compressed', false, true), 'a{color:red;}b{color:blue;}');
});

test('Compressed @media nested', () => {
  // @media 保留括号前一个空格（选择器内部空格在 compressed 模式合理保留）
  const r = compressCSS('@media (max-width: 768px) { .foo { padding: 20px; } }', 'compressed', false, true);
  contains(r, '@media');
  contains(r, '(max-width: 768px)');
  contains(r, '.foo{padding:20px;}');
});

test('Compressed SCSS nesting', () => {
  eq(compressCSS('nav { ul { li { color: red; } } }', 'compressed', false, true),
     'nav{ul{li{color:red;}}}');
});

test('Compressed multi selectors', () => {
  eq(compressCSS('.a, .b, .c { color: red; }', 'compressed', false, true),
     '.a,.b,.c{color:red;}');
});

test('Remove comments', () => {
  const r = compressCSS('a { /* remove */ color: red; }', 'compressed', true, false);
  notContains(r, 'remove');
  contains(r, 'color:red');
});

test('Preserve important comments', () => {
  const r = compressCSS('a { /*! keep */ color: red; }', 'compressed', true, true);
  contains(r, '/*! keep */');
});

test('Both flags: regular removed, important kept', () => {
  const r = compressCSS('a { /* remove */ color: red; /*! keep */ }', 'compressed', true, true);
  notContains(r, 'remove');
  contains(r, '/*! keep */');
});

test('Comment inside string NOT removed', () => {
  const r = compressCSS('a { content: "/* not a comment */"; }', 'compressed', true, false);
  contains(r, '"/* not a comment */"');
});

test('Empty block removed', () => {
  const r = compressCSS('a { color: red; } .empty { }', 'compressed', false, true);
  notContains(r, 'empty');
});

test('Gradient preserved', () => {
  // 括号内保留原始格式（逗号后空格保留）
  const r = compressCSS('.box { background: linear-gradient(135deg, #008de1 0%, #00b5e2 100%); }', 'compressed', false, true);
  contains(r, 'linear-gradient(135deg, #008de1 0%, #00b5e2 100%)');
});

test('calc() preserved', () => {
  const r = compressCSS('.foo { width: calc(100% - 20px); }', 'compressed', false, true);
  contains(r, 'calc(100% - 20px)');
});

test('CSS variables', () => {
  const r = compressCSS(':root { --main-color: #333; }', 'compressed', false, true);
  contains(r, '--main-color:#333');
});

test('@import preserved', () => {
  const r = compressCSS('@import "foo.css"; body { color: red; }', 'compressed', false, true);
  contains(r, '@import "foo.css"');
});

test('@keyframes', () => {
  const r = compressCSS('@keyframes slide { from { left: 0; } to { left: 100%; } }', 'compressed', false, true);
  contains(r, '@keyframes slide');
  contains(r, 'from{left:0;}');
  contains(r, 'to{left:100%;}');
});

test('Attribute selector', () => {
  const r = compressCSS('input[type="text"] { border: 1px solid #ccc; }', 'compressed', false, true);
  contains(r, 'input[type="text"]');
});

test('Empty input', () => {
  eq(compressCSS('', 'compressed', false, true), '');
});

test('Whitespace only input', () => {
  eq(compressCSS('   \n  \t  ', 'compressed', false, true), '');
});

test('Roundtrip compressed→expanded→compressed', () => {
  const input = 'body{color:red;font-size:14px;}a{color:blue;}';
  const expanded = compressCSS(input, 'expanded', false, true, 4);
  const recompressed = compressCSS(expanded, 'compressed', false, true);
  eq(recompressed, input);
});

console.log('\n' + tests.filter(t => t.pass).length + '/' + tests.length + ' tests passed');
