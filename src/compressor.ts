/**
 * CSS Compressor — 核心压缩引擎
 *
 * 纯函数设计，零外部依赖。无 VS Code API 依赖，便于单元测试。
 */

// ============================================================================
// 类型定义
// ============================================================================

export type CompressMode = 'expanded' | 'compact-spaces' | 'compact' | 'compressed';

export interface CompressOptions {
  mode: CompressMode;
  removeComments: boolean;
  preserveImportantComments: boolean;
  indentSize?: number;
}

// ============================================================================
// 阶段一：注释预处理
// ============================================================================

interface PreprocessResult {
  text: string;
  // 哨兵 → 注释原文
  comments: Map<string, string>;
}

/**
 * 扫描 CSS 源码，处理注释。
 * - removeComments=true: 移除普通注释，可能保留重要注释
 * - preserveImportantComments=true: 保留 \/*! *\/ 注释（用哨兵替换）
 *
 * 关键：引号内的 \/* 和 *\/ 不被视为注释边界。
 */
function preprocessComments(
  source: string,
  removeComments: boolean,
  preserveImportantComments: boolean
): PreprocessResult {
  const comments = new Map<string, string>();
  if (!removeComments) {
    return { text: source, comments };
  }

  let counter = 0;
  const out: string[] = [];
  let i = 0;
  const len = source.length;
  let inSQ = false;
  let inDQ = false;

  while (i < len) {
    const ch = source[i];

    // 转义字符跳过
    if (ch === '\\' && (inSQ || inDQ)) {
      out.push(ch);
      i++;
      if (i < len) out.push(source[i]);
      i++;
      continue;
    }

    // 引号切换
    if (ch === "'" && !inDQ) { inSQ = !inSQ; out.push(ch); i++; continue; }
    if (ch === '"' && !inSQ) { inDQ = !inDQ; out.push(ch); i++; continue; }

    // 注释检测（仅在引号外）
    if (!inSQ && !inDQ && ch === '/' && i + 1 < len && source[i + 1] === '*') {
      const commentStart = i;
      i += 2;
      // 找到 */
      const endIdx = source.indexOf('*/', i);
      if (endIdx === -1) {
        // 未闭合注释，保留
        out.push('/*');
        continue;
      }
      const commentText = source.substring(commentStart, endIdx + 2);
      const isImportant = source[commentStart + 2] === '!';

      if (isImportant && preserveImportantComments) {
        const sentinel = `__IC${counter}__`;
        counter++;
        comments.set(sentinel, commentText);
        out.push(sentinel);
      }
      // 否则丢弃注释

      i = endIdx + 2;
      continue;
    }

    out.push(ch);
    i++;
  }

  return { text: out.join(''), comments };
}

// ============================================================================
// 阶段二：Token 化
// ============================================================================

const enum T {
  SELECTOR,
  BLOCK_OPEN,
  PROPERTY,
  COLON,
  VALUE,
  SEMICOLON,
  BLOCK_CLOSE,
  COMMENT,
  RAW,
}

interface Token {
  type: T;
  value: string;
  depth: number;
}

/**
 * 最小 CSS tokenizer。
 *
 * 策略：
 * 1. 使用简单的逐字符遍历
 * 2. 通过预读区分属性名与嵌套选择器
 * 3. { → 增加深度, } → 减少深度
 */
function tokenize(source: string, comments: Map<string, string>): Token[] {
  const tokens: Token[] = [];
  const len = source.length;
  let i = 0;
  let depth = 0;

  function skipWS(): void {
    while (i < len && /\s/.test(source[i])) i++;
  }

  // 读取直到指定字符之一（引号/括号感知）
  function readUntil(stopChars: readonly string[], opts?: { balanceParens?: boolean }): string {
    let s = '';
    let sq = false, dq = false, paren = 0;
    while (i < len) {
      const c = source[i];
      if (c === '\\' && (sq || dq)) { s += c; i++; if (i < len) s += source[i]; i++; continue; }
      if (c === "'" && !dq) { sq = !sq; s += c; i++; continue; }
      if (c === '"' && !sq) { dq = !dq; s += c; i++; continue; }
      if (!sq && !dq) {
        if (opts?.balanceParens && c === '(') paren++;
        if (opts?.balanceParens && c === ')') paren--;
        if (paren <= 0 && stopChars.includes(c)) break;
      }
      s += c;
      i++;
    }
    return s;
  }

  // 预读：在块内判断下一个 token 是属性名还是嵌套选择器
  function peekPropertyOrSelector(): 'property' | 'selector' {
    let j = i;
    let sq = false, dq = false, paren = 0;
    while (j < len) {
      const c = source[j];
      if (c === '\\') { j += 2; continue; }
      if (c === "'" && !dq) { sq = !sq; j++; continue; }
      if (c === '"' && !sq) { dq = !dq; j++; continue; }
      if (!sq && !dq) {
        if (c === '(') paren++;
        if (c === ')') paren--;
        if (c === '{' || c === '}' || c === ';') return 'selector';
        if (c === ':' && paren === 0) return 'property';
      }
      j++;
    }
    return 'selector';
  }

  while (i < len) {
    skipWS();
    if (i >= len) break;

    // 哨兵注释
    let foundComment = false;
    for (const [sentinel, text] of comments) {
      if (source.startsWith(sentinel, i)) {
        tokens.push({ type: T.COMMENT, value: text, depth });
        i += sentinel.length;
        foundComment = true;
        break;
      }
    }
    if (foundComment) continue;

    const ch = source[i];

    // 块关闭
    if (ch === '}') {
      i++;
      if (depth > 0) depth--;
      tokens.push({ type: T.BLOCK_CLOSE, value: '}', depth });
      continue;
    }

    // 块开启
    if (ch === '{') {
      i++;
      tokens.push({ type: T.BLOCK_OPEN, value: '{', depth });
      depth++;
      continue;
    }

    // 分号
    if (ch === ';') {
      i++;
      tokens.push({ type: T.SEMICOLON, value: ';', depth });
      continue;
    }

    // 冒号
    if (ch === ':') {
      i++;
      tokens.push({ type: T.COLON, value: ':', depth });
      continue;
    }

    // @-rules
    if (ch === '@') {
      const start = i;
      readUntil([';', '{']);
      const atText = source.substring(start, i);
      if (i < len && source[i] === '{') {
        // 带块 at-rule
        tokens.push({ type: T.SELECTOR, value: atText, depth });
        // { 由下一轮处理
      } else {
        // 无块 at-rule (@import 等)
        tokens.push({ type: T.RAW, value: atText, depth });
        if (i < len) { i++; /* 跳过 ; */ }
        tokens.push({ type: T.SEMICOLON, value: ';', depth });
      }
      continue;
    }

    // --- 上下文判断 ---
    const prev = tokens.length > 0 ? tokens[tokens.length - 1] : null;
    const inBlock = depth > 0;
    const prevIsColon = prev?.type === T.COLON;
    const prevIsBlockOrSemi = prev?.type === T.BLOCK_OPEN || prev?.type === T.SEMICOLON;

    if (prevIsColon && inBlock) {
      // 属性值
      const val = readUntil([';', '}'], { balanceParens: true });
      tokens.push({ type: T.VALUE, value: val, depth });
    } else if (prevIsBlockOrSemi && inBlock) {
      // 块内第一项：属性名 或 嵌套选择器
      if (peekPropertyOrSelector() === 'property') {
        const prop = readUntil([':']).trimEnd();
        if (i < len) i++; // 跳过 :
        tokens.push({ type: T.PROPERTY, value: prop, depth });
        tokens.push({ type: T.COLON, value: ':', depth });
      } else {
        const sel = readUntil(['{', '}']).trim();
        if (sel) tokens.push({ type: T.SELECTOR, value: sel, depth });
      }
    } else {
      // 最外层选择器
      const sel = readUntil(['{', '}']).trim();
      if (sel) tokens.push({ type: T.SELECTOR, value: sel, depth });
      else {
        if (i < len && source[i] === '{') { i++; tokens.push({ type: T.BLOCK_OPEN, value: '{', depth }); depth++; }
        else if (i < len && source[i] === '}') { i++; if (depth > 0) depth--; tokens.push({ type: T.BLOCK_CLOSE, value: '}', depth }); }
      }
    }
  }

  return tokens;
}

// ============================================================================
// 格式化
// ============================================================================

function format(tokens: Token[], opts: CompressOptions): string {
  switch (opts.mode) {
    case 'expanded': return formatExpanded(tokens, opts);
    case 'compact-spaces': return formatCompactSpaces(tokens, opts);
    case 'compact': return formatCompact(tokens, opts);
    case 'compressed': return formatCompressed(tokens, opts);
    default: return formatCompact(tokens, opts);
  }
}

// === Expanded ===

function formatExpanded(tokens: Token[], opts: CompressOptions): string {
  const isize = opts.indentSize ?? 4;
  const out: string[] = [];
  let d = 0;

  function NL(): void { out.push('\n'); }
  function IND(): string { return ' '.repeat(d * isize); }

  for (let idx = 0; idx < tokens.length; idx++) {
    const tok = tokens[idx];

    switch (tok.type) {
      case T.SELECTOR: {
        const parts = splitSelectors(tok.value);
        if (out.length > 0 && out[out.length - 1] !== '\n') NL();
        for (let s = 0; s < parts.length; s++) {
          if (s > 0) out.push(',\n');
          out.push(IND() + parts[s]);
        }
        break;
      }
      case T.BLOCK_OPEN:
        out.push(' {');
        d++;
        break;
      case T.PROPERTY:
        NL();
        out.push(IND() + tok.value);
        break;
      case T.COLON:
        out.push(': ');
        break;
      case T.VALUE:
        out.push(tok.value);
        break;
      case T.SEMICOLON: {
        const next = tokens[idx + 1];
        out.push(';');
        if (next?.type === T.BLOCK_CLOSE && next.depth === d - 1) {
          NL();
        }
        break;
      }
      case T.BLOCK_CLOSE:
        d = Math.max(0, d - 1);
        // 如果上一个不是分号，需要换行
        if (out.length > 0 && out[out.length - 1] !== '\n') {
          NL();
        }
        out.push(IND() + '}');
        {
          const next = tokens[idx + 1];
          if (next && next.type !== T.BLOCK_CLOSE) NL();
        }
        break;
      case T.COMMENT:
        NL();
        out.push(IND() + tok.value);
        break;
      case T.RAW:
        if (out.length > 0) NL();
        out.push(IND() + tok.value + ';');
        break;
    }
  }

  let result = out.join('');
  result = result.replace(/^\n+/, '').replace(/\n+$/, '\n');
  return result === '\n' ? '' : result;
}

// === Compact-Spaces ===

function formatCompactSpaces(tokens: Token[], _opts: CompressOptions): string {
  const lines: string[] = [];
  let cur = '';
  let d = 0;

  function flush(): void {
    if (cur.trim()) lines.push(cur.trim());
    cur = '';
  }

  for (const tok of tokens) {
    switch (tok.type) {
      case T.SELECTOR:
        if (d === 0 && cur) flush();
        cur += collapseSelectorWhitespace(tok.value);
        break;
      case T.BLOCK_OPEN:
        cur += ' {';
        d++;
        break;
        cur += (cur.endsWith('{') || cur.endsWith(';') ? ' ' : '') + tok.value;
        break;
      case T.COLON:
        cur += ': ';
        break;
      case T.VALUE:
        cur += tok.value;
        break;
      case T.SEMICOLON:
        cur += ';';
        break;
      case T.BLOCK_CLOSE:
        d = Math.max(0, d - 1);
        cur = cur.trimEnd();
        cur += '}';
        if (d === 0) flush();
        break;
      case T.COMMENT:
        cur += ' ' + tok.value;
        break;
      case T.RAW:
        if (cur) flush();
        lines.push(tok.value + ';');
        break;
    }
  }
  flush();
  return lines.join('\n').trim() + (lines.length > 0 ? '\n' : '');
}

// === Compact ===

function formatCompact(tokens: Token[], _opts: CompressOptions): string {
  const lines: string[] = [];
  let cur = '';
  let d = 0;

  function flush(): void {
    if (cur) lines.push(cur);
    cur = '';
  }

  for (const tok of tokens) {
    switch (tok.type) {
      case T.SELECTOR:
        if (d === 0 && cur) flush();
        cur += collapseSelectorWhitespace(tok.value);
        break;
      case T.BLOCK_OPEN:
        cur += '{';
        d++;
        break;
      case T.PROPERTY:
        cur += tok.value;
        break;
      case T.COLON:
        cur += ':';
        break;
      case T.VALUE:
        cur += tok.value;
        break;
      case T.SEMICOLON:
        cur += ';';
        break;
      case T.BLOCK_CLOSE:
        d = Math.max(0, d - 1);
        cur += '}';
        if (d === 0) flush();
        break;
      case T.COMMENT:
        cur += tok.value;
        break;
      case T.RAW:
        if (cur) flush();
        lines.push(tok.value + ';');
        break;
    }
  }
  flush();
  return lines.join('\n').trim() + (lines.length > 0 ? '\n' : '');
}

// === Compressed ===

function formatCompressed(tokens: Token[], _opts: CompressOptions): string {
  // 移除空块
  const filtered: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (
      tokens[i].type === T.SELECTOR &&
      i + 2 < tokens.length &&
      tokens[i + 1].type === T.BLOCK_OPEN &&
      tokens[i + 2].type === T.BLOCK_CLOSE
    ) {
      i += 2;
      continue;
    }
    filtered.push(tokens[i]);
  }

  const out: string[] = [];
  for (const tok of filtered) {
    switch (tok.type) {
      case T.SELECTOR: out.push(compressSelector(tok.value)); break;
      case T.BLOCK_OPEN: out.push('{'); break;
      case T.PROPERTY: out.push(tok.value); break;
      case T.COLON: out.push(':'); break;
      case T.VALUE: out.push(compressValue(tok.value)); break;
      case T.SEMICOLON: out.push(';'); break;
      case T.BLOCK_CLOSE: out.push('}'); break;
      case T.COMMENT: out.push(tok.value); break;
      case T.RAW: out.push(tok.value + ';'); break;
    }
  }
  return out.join('');
}

// 压缩选择器中的空格（保留括号内空格和 at-rule 关键字后的空格）
function compressSelector(sel: string): string {
  let result = '';
  let sq = false, dq = false, paren = 0;
  for (let i = 0; i < sel.length; i++) {
    const c = sel[i];
    if (c === '\\') { result += c; i++; if (i < sel.length) result += sel[i]; continue; }
    if (c === "'" && !dq) { sq = !sq; result += c; continue; }
    if (c === '"' && !sq) { dq = !dq; result += c; continue; }
    if (!sq && !dq) {
      if (c === '(') { paren++; result += c; continue; }
      if (c === ')') { paren--; result += c; continue; }
      if (paren > 0) { result += c; continue; }
      // 压缩空格，但保留 at-rule 关键字后的空格
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
        // after @xxx keyword, before name/params, preserve one space
        // e.g. "@keyframes slide" or "@media (query)" — keep space before non-brace/non-paren
        const prev = result[result.length - 1] || '';
        if (prev === '' || prev === ' ' || prev === ',' || prev === ':' || prev === '{') continue;
        // Keep one space (only if previous char isn't already a space)
        if (prev !== ' ') result += ' ';
        continue;
      }
    }
    result += c;
  }
  return result;
}

// 压缩属性值中的空格（保留字符串/括号内的空格）
function compressValue(val: string): string {
  let result = '';
  let sq = false, dq = false, paren = 0;
  for (let i = 0; i < val.length; i++) {
    const c = val[i];
    if (c === '\\') { result += c; i++; if (i < val.length) result += val[i]; continue; }
    if (c === "'" && !dq) { sq = !sq; result += c; continue; }
    if (c === '"' && !sq) { dq = !dq; result += c; continue; }
    if (!sq && !dq) {
      if (c === '(') paren++;
      if (c === ')') paren--;
      if (paren > 0) { result += c; continue; }
      // 保留逗号后的必要空格（如 rgba、gradient 中用空格分隔的值）
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
        // 不添加空格，但某些 CSS 函数需要空格分隔参数
        // 如 linear-gradient(direction, color1 stop1, color2 stop2)
        // 实际上 color-stop 语法是 "color position" 用空格分隔
        // 对于 Compressed 模式，我们一律不压缩括号内空格（上面已保留）
        continue;
      }
    }
    result += c;
  }
  return result;
}

// ============================================================================
// 工具函数：拆分多选择器
// ============================================================================

/**
 * 压缩选择器文本中的空白（换行→空格，多余空格合并）。
 * 注意：引号和括号内的空白保持不变。
 */
function collapseSelectorWhitespace(sel: string): string {
  let result = '';
  let sq = false, dq = false, paren = 0;

  for (let i = 0; i < sel.length; i++) {
    const c = sel[i];
    if (c === '\\') { result += c; i++; if (i < sel.length) result += sel[i]; continue; }
    if (c === "'" && !dq) { sq = !sq; result += c; continue; }
    if (c === '"' && !sq) { dq = !dq; result += c; continue; }
    if (!sq && !dq) {
      if (c === '(') paren++;
      if (c === ')') paren--;
      if (paren > 0) { result += c; continue; }
      // 空白字符 → 单个空格
      if (c === '\n' || c === '\r' || c === '\t' || c === ' ') {
        // 跳过前导空白
        if (result.length === 0) continue;
        // 跳过已有空格后的空白
        if (result[result.length - 1] === ' ') continue;
        // 逗号后紧跟选择器（不加空格，Compact 风格）
        if (result[result.length - 1] === ',') continue;
        result += ' ';
        continue;
      }
      // 逗号 → 紧凑（去掉后面即将到来的空格，由上面的逻辑处理）
      if (c === ',') {
        // 去掉逗号前空格
        if (result[result.length - 1] === ' ') {
          result = result.slice(0, -1);
        }
        result += c;
        continue;
      }
    }
    result += c;
  }

  // 去除首尾空白
  return result.trim();
}

function splitSelectors(selector: string): string[] {
  const parts: string[] = [];
  let cur = '';
  let paren = 0;
  let sq = false, dq = false;

  for (let i = 0; i < selector.length; i++) {
    const c = selector[i];
    if (c === '\\') { cur += c; i++; if (i < selector.length) cur += selector[i]; continue; }
    if (c === "'" && !dq) { sq = !sq; cur += c; continue; }
    if (c === '"' && !sq) { dq = !dq; cur += c; continue; }
    if (!sq && !dq) {
      if (c === '(') paren++;
      if (c === ')') paren--;
      if (c === ',' && paren === 0) { parts.push(cur.trim()); cur = ''; continue; }
    }
    cur += c;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts.length > 0 ? parts : [selector];
}

// ============================================================================
// 主入口
// ============================================================================

/**
 * 压缩/格式化 CSS 字符串。
 *
 * @param source  - 原始 CSS 文本
 * @param mode    - 压缩模式
 * @param removeComments - 是否移除注释
 * @param preserveImportantComments - 是否保留 \/*! *\/ 注释
 * @param indentSize - Expanded 模式缩进空格数
 */
export function compressCSS(
  source: string,
  mode: CompressMode,
  removeComments: boolean,
  preserveImportantComments: boolean,
  indentSize?: number
): string {
  if (!source || source.trim().length === 0) return '';

  const { text, comments } = preprocessComments(source, removeComments, preserveImportantComments);
  const tokens = tokenize(text, comments);
  return format(tokens, { mode, removeComments, preserveImportantComments, indentSize });
}
