# CSS Compressor VS Code 插件 - 最终实施计划

## 上下文

### 问题与需求
用户需要创建一个 VS Code 插件用于 CSS 压缩。当前仓库只有 `README.md`（含完整需求规格），需要从零构建完整的 VS Code 扩展项目，并支持手动发布和 Git 自动发布到 VS Code Marketplace。

### 需求摘要
| 需求 | 说明 |
|------|------|
| 文件类型 | `.html`, `.css`, `.scss`, `.less`, `.sass`, `.wxss` |
| HTML 处理 | 自动提取 `<style>` 标签内容 → 压缩 → 替换回 HTML |
| 选中压缩 | 选中文本仅压缩选中部分；未选中则处理整个文档 |
| 4 种模式 | Expanded / Compact-Spaces / Compact / Compressed |
| 注释处理 | 去除注释 + 保留 `/*! */` 重要注释 |
| 默认快捷键 | `Shift+Alt+F` = Compact 模式 |
| 发布目标 | VS Code Marketplace（手动 + GitHub Actions 自动）|

### 关键决策
1. **自实现压缩器**：clean-css 的 format 选项无法精准映射 4 种模式需求（Expanded/Compact-Spaces/Compact/Compressed），自实现状态机压缩器能精细控制每种模式下的空白语义。
2. **零外部依赖**：不依赖 clean-css、cheerio、parse5 等，保持扩展体积最小（~50KB vs 2MB+）。
3. **TypeScript**：类型安全 + VS Code API 类型支持。
4. **按语言激活**：使用 `onLanguage:css` 等激活事件，减少启动性能影响。

---

## 项目结构

```
CSSCompressor/
├── .vscode/
│   ├── launch.json               # F5 调试配置
│   └── tasks.json                # TypeScript 编译任务
├── src/
│   ├── extension.ts              # 扩展入口：activate/deactivate，命令注册
│   ├── compressor.ts             # CSS 压缩核心（状态机 + 4 模式格式化）
│   └── utils.ts                  # HTML style 标签提取、配置读取
├── test/
│   ├── compressor.test.ts        # 压缩器单元测试（35+ 用例）
│   ├── extension.test.ts         # 集成测试
│   └── runTest.ts                # 测试运行器入口
├── .github/
│   └── workflows/
│       └── publish.yml           # 自动发布工作流
├── package.json                  # 扩展清单
├── tsconfig.json                 # TypeScript 配置
├── .vscodeignore                 # 打包排除文件
├── .gitignore
├── CHANGELOG.md
└── README.md                     # 已存在，更新使用说明
```

---

## 核心设计：压缩器状态机

### 两阶段处理

**阶段一：注释预处理**
- 遍历 CSS 字符串，识别 `/* ... */` 注释块
- `removeComments=true` → 移除所有注释（用空占位符替换）
- `preserveImportantComments=true` → `/*! ... */` 用哨兵字符串（`__C0__`, `__C1__`...）替换
- 跟踪引号状态避免匹配字符串内的 `/*`

**阶段二：Token 化 + 格式化**
```
Token 类型：SELECTOR | BLOCK_OPEN | PROPERTY | COLON | VALUE | SEMICOLON | BLOCK_CLOSE | COMMENT | RAW

状态机流程：
SEEK → 遇到 @非块关键词 → IN_AT_RULE → ; → 输出 RAW → SEEK
SEEK → 任何字符 → IN_SELECTOR → { → 输出 SELECTOR+BLOCK_OPEN → IN_BLOCK
IN_BLOCK → } → 输出 BLOCK_CLOSE → SEEK
IN_BLOCK → 属性名 → IN_PROPERTY → : → 输出 PROPERTY+COLON → IN_VALUE
IN_VALUE → ; → 输出 VALUE+SEMICOLON → IN_BLOCK
IN_VALUE → } → 输出 VALUE+BLOCK_CLOSE → pop depth
```

**关键边界情况**：
- 转义引号：`content: "he said \"hello\""` → 反斜杠预读避免过早终止字符串
- 括号内值：`linear-gradient(135deg, #008de1, #00b5e2)` → 匹配括号深度
- 多选择器：Expanded 模式下按逗号拆分为多行
- 空规则块：Compressed 模式下移除
- `@import`/`@charset`：以 `;` 结尾（非块），作为 RAW token 输出
- SCSS/LESS 嵌套：深度栈正确处理

### 四种模式输出规则

| 模式 | 选择器与{之间 | 属性:值与;之间 | 块之间 | 规则之间换行 |
|------|--------|-----------|------|---------|
| **Expanded** | 空格 | `prop: value;` 每个属性独立行+缩进 | 嵌套块独立行 | 有换行 |
| **Compact-Spaces** | 空格 | `prop: value;` + 空格 | 单空格 | 每个块一行 |
| **Compact** | 无空格 | `prop:value;` 无空格 | 无空格 | 每个块一行 |
| **Compressed** | 无空格 | `prop:value;` 无空格 | 无空格 | 全部一行，空块移除 |

---

## 扩展入口设计

### package.json 核心配置

```json
{
  "name": "css-compressor",
  "displayName": "CSS Compressor",
  "engines": { "vscode": "^1.95.0" },
  "activationEvents": [
    "onLanguage:css", "onLanguage:scss", "onLanguage:less",
    "onLanguage:sass", "onLanguage:wxss", "onLanguage:html"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      { "command": "css-compressor.compress", "title": "CSS Compressor: Compress (Default Mode)" },
      { "command": "css-compressor.expanded", "title": "CSS Compressor: Format (Expanded)" },
      { "command": "css-compressor.compactSpaces", "title": "CSS Compressor: Compact-Spaces" },
      { "command": "css-compressor.compact", "title": "CSS Compressor: Compact" },
      { "command": "css-compressor.compressed", "title": "CSS Compressor: Compressed" }
    ],
    "keybindings": [
      { "command": "css-compressor.compact", "key": "shift+alt+f",
        "when": "editorTextFocus && !editorReadonly && editorLangId =~ /^(css|scss|less|sass|wxss|html)$/" }
    ],
    "menus": {
      "editor/context": [
        { "command": "css-compressor.compress", "when": "editorHasSelection && ...", "group": "1_modification" }
      ]
    },
    "configuration": {
      "title": "CSS Compressor",
      "properties": {
        "cssCompressor.defaultMode": {
          "type": "string", "enum": ["expanded","compact-spaces","compact","compressed"], "default": "compact"
        },
        "cssCompressor.removeComments": { "type": "boolean", "default": false },
        "cssCompressor.preserveImportantComments": { "type": "boolean", "default": true },
        "cssCompressor.indentSize": { "type": "number", "default": 4, "minimum": 1, "maximum": 8 }
      }
    }
  }
}
```

### 命令处理流程
```
1. 检查 activeTextEditor → 无则提示并返回
2. 读取 cssCompressor 配置
3. 确定模式（命令指定 > defaultMode 配置）
4. 获取源文本（有选中 → selection；无选中 → 全文）
5. HTML 文件 → compressHtmlStyles()；否则 → compressCSS()
6. editor.edit() 替换文本
7. 状态栏提示
```

### 快捷键策略
- 静态绑定：`package.json` 中 `css-compressor.compact` 绑定 `shift+alt+f`
- 其他 4 个命令通过 VS Code 内置的 **Keyboard Shortcuts UI** (`Ctrl+K Ctrl+S`) 自定义
- 不使用配置项中的 keybindings 字段（简化设计，避免重复造轮子）

---

## HTML 处理方案

使用正则 `/<\s*style\b[^>]*>([\s\S]*?)<\s*\/\s*style\s*>/gi` 匹配所有 `<style>` 标签：
1. 提取每个 style 标签的 CSS 内容
2. 对每个块独立调用 `compressCSS()`
3. 从后向前替换（保持索引有效）
4. 保留 `<style>` 标签本身和其属性（如 `type="text/css"`）
5. 不支持 `style` 属性内联样式

---

## 发布方案

### 手动发布
```bash
npm run compile
npx @vscode/vsce package          # 打包为 .vsix
npx @vscode/vsce publish [patch|minor|major]  # 发布到 Marketplace
```

### 自动发布 (GitHub Actions)
`.github/workflows/publish.yml`：
- **触发器**：推送 `v*` 标签（如 `v1.0.0`）
- **步骤**：Checkout → Node.js 22 → npm ci → tsc 编译 → 测试 → vsce publish
- **需要配置**：GitHub Secret `VSCE_PAT`（Azure DevOps Personal Access Token）

### 发布流程
```bash
npm version patch           # 更新版本号
git tag v1.0.1
git push origin main --tags  # GitHub Actions 自动触发发布
```

---

## 测试策略

### 单元测试（compressor.test.ts，35+ 用例）
| 类别 | 测试数量 | 覆盖内容 |
|------|------|------|
| 注释处理 | 5 | removeComments, preserveImportantComments, 字符串内注释, 嵌套注释 |
| Compressed 模式 | 5 | 单规则、多规则、@media、空块移除 |
| Compact 模式 | 3 | 无空格选择器/属性分隔 |
| Compact-Spaces 模式 | 3 | 空格保留、嵌套媒体查询 |
| Expanded 模式 | 4 | 属性独立行、缩进、多选择器拆分、自定义 indentSize |
| 边界情况 | 11 | 转义引号、url()、calc()、@import、@keyframes、自定义属性等 |
| 往返保真 | 2 | Compressed→Expanded→Compressed 一致性 |

### 集成测试（extension.test.ts）
- 扩展激活、命令注册、配置读取、选中/全文模式、HTML style 提取替换

### 手动测试清单
- 4 种模式输出验证、选中压缩、HTML 文件、设置切换、SCSS/LESS 嵌套

---

## 实施步骤（共9步）

| # | 步骤 | 涉及文件 |
|---|------|------|
| 1 | 项目脚手架 | `package.json`, `tsconfig.json`, `.gitignore`, `.vscodeignore`, `.vscode/launch.json`, `.vscode/tasks.json` |
| 2 | 压缩核心 | `src/compressor.ts` |
| 3 | 压缩器单元测试 | `test/compressor.test.ts`, `test/runTest.ts` |
| 4 | 工具函数 | `src/utils.ts`（HTML 提取 + 配置读取） |
| 5 | 扩展入口 | `src/extension.ts`（命令注册 + 编辑器操作） |
| 6 | 集成测试 | `test/extension.test.ts` |
| 7 | 自动发布 | `.github/workflows/publish.yml` |
| 8 | 文档 | 更新 `README.md`（安装/使用说明） |
| 9 | 打包发布 | `vsce package` + `vsce publish` |

---

## 已确认事项

- [x] **Publisher ID**：暂用占位符 `your-publisher-id`，发布前由用户填入
- [x] **GitHub 仓库 URL**：`https://github.com/ayuday/CSSCompressor`
- [x] **扩展图标**：创建 SVG 图标（转换为 PNG 作为扩展 icon.png）
- [x] **Node.js 版本**：使用 `"engines": {"vscode": "^1.95.0"}`，`"@types/node": "^22.0.0"`

## 验证方法

1. `npm run compile` — TypeScript 编译通过
2. `npm test` — 单元测试 + 集成测试全部通过
3. F5 启动扩展宿主 — 打开测试 CSS 文件，验证 4 种模式输出
4. `npx vsce package` — 打包 .vsix 成功
5. 本地安装 .vsix 测试
6. 推送 tag → GitHub Actions 自动发布到 Marketplace
