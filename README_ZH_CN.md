# CSS Compressor

一个高效的 CSS 压缩 VS Code 插件工具，能够去除 CSS 文件中的空格、换行和注释，从而减小文件大小，提高网页加载速度。

支持选中代码段压缩，也支持整个 `.html`、`.css`、`.scss`、`.less`、`.sass`、`.wxss` 文件压缩。如果是 `.html` 文件，会自动提取其中的 `<style>` 标签内容进行压缩。

安装后默认快捷键 `Shift+Alt+C`（Compact 模式），可在 VS Code 快捷键设置中自定义快捷键和压缩模式。

## 环境要求

- VS Code 1.95.0 及以上版本
- Node.js 22.0.0 及以上版本

## 支持的模式

| 模式 | 说明 | 示例 |
|------|------|------|
| **Compact** | 去掉多余的换行和空格，每个属性和选择器间没有空格隔开 | `selector{prop:value;prop:value;}` |
| **Compact-Spaces** | 去掉多余的换行，每个属性和选择器间用一个空格隔开 | `selector { prop: value; prop: value; }` |
| **Expanded** | 格式化 CSS 样式，展开所有属性，每个属性独占一行，便于阅读和调试 | `prop: value;`（每个属性独占一行，带缩进） |
| **Compressed** | 压缩所有样式去掉空格和换行，所有样式压缩成一行，适合生产环境使用 | `selector{prop:value;prop:value;}@media{...}` |

不同模式可通过命令面板选择，也可在 VS Code 键盘快捷方式设置中为每种模式绑定不同的快捷键。

## 功能特性

- 去除多余的空格和换行
- 去除 CSS 注释（可配置保留 `/*! */` 重要注释）
- 支持选中代码段压缩
- 支持整个文件压缩
- 自动识别 HTML 文件中的 `<style>` 标签并压缩其内容
- 4 种压缩/格式化模式可选
- 支持 SCSS/LESS/SASS 嵌套语法
- 默认快捷键 `Shift+Alt+C`（Compact 模式）
- 状态栏快捷按钮
- 右键菜单快捷入口

## 配置项

在 VS Code 设置中搜索 `cssCompressor` 可配置以下选项：

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `cssCompressor.defaultMode` | string | `"compact"` | 默认压缩模式，用于快捷键和状态栏按钮：`"expanded"`、`"compact-spaces"`、`"compact"`、`"compressed"` |
| `cssCompressor.removeComments` | boolean | `false` | 是否移除所有 CSS 注释 |
| `cssCompressor.preserveImportantComments` | boolean | `true` | 移除注释时是否保留 `/*! */` 重要注释 |
| `cssCompressor.indentSize` | number | `4` | Expanded 模式的缩进空格数（1-8） |

## 使用方法

Press shortcuts `shift+alt+c` to format CSS file (make sure current file you edit type is css)

### 命令面板

按 `Ctrl+Shift+P` 打开命令面板，搜索以下命令：

- **CSS Compressor: Compact** — 使用 Compact 模式（默认快捷键 `Shift+Alt+C`）
- **CSS Compressor: Compact-Spaces** — 使用 Compact-Spaces 模式
- **CSS Compressor: Format (Expanded)** — 使用 Expanded 模式
- **CSS Compressor: Compressed** — 使用 Compressed 模式

### 快捷键

默认快捷键 `shift+alt+c` 绑定到 Compact 模式。你可以通过 VS Code 的 **键盘快捷方式** 设置（`Ctrl+K Ctrl+S`）为其他命令绑定自定义快捷键。

### 右键菜单

在支持的 CSS 文件中，选中文本后右键菜单中会显示 **CSS Compressor: Compact**。

## 支持的 CSS 示例

### 压缩前：
```css
body{background-color: #f5f5f5;}

.about-hero {
    background: linear-gradient(135deg, #008de1 0%, #00b5e2 100%);
    color: #fff;
    padding: 60px 0;
    text-align: center;
    margin-bottom: 30px;
}
.about-hero h1 {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 12px;
}
```

### Compact Mode:
.css - Compact before:
![Compact 模式压缩前](https://raw.githubusercontent.com/ayuday/CSSCompressor/main/assets/css-before.jpg)
.css - Compact after:
![Compact 模式压缩后](https://raw.githubusercontent.com/ayuday/CSSCompressor/main/assets/css-after.jpg)


.html - Compact before:
![Compact 模式压缩前](https://raw.githubusercontent.com/ayuday/CSSCompressor/main/assets/html-before.jpg)
.html - Compact after:
![Compact 模式压缩后](https://raw.githubusercontent.com/ayuday/CSSCompressor/main/assets/html-after.jpg)

## Changelog

详见 [CHANGELOG.md](CHANGELOG.md)。

### 1.0.8 (2026-07-29)
- 修复保留注释时，注释与紧随其后的 CSS 规则被合并到同一行的问题，注释现在始终独占一行
- 修复 Compressed 模式下属性值中必要空格被错误删除的问题（如 `2px solid` → `2pxsolid`）
- 排除 `assets/` 目录，不再打包到 .vsix 安装包中

### 1.0.7 (2026-07-28)
- 重构代码结构，提取核心压缩逻辑为独立模块，提升可读性和可维护性

### 1.0.6 (2026-07-25)
- 更新发布名称

### 1.0.0 (2026-07-24)
- 初始版本发布

## License

MIT
