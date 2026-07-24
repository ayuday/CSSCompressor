# CSS Compressor

一个高效的 CSS 压缩 VS Code 插件工具，能够去除 CSS 文件中的空格、换行和注释，从而减小文件大小，提高网页加载速度。

支持选中代码段压缩，也支持整个 `.html`、`.css`、`.scss`、`.less`、`.sass`、`.wxss` 文件压缩。如果是 `.html` 文件，会自动提取其中的 `<style>` 标签内容进行压缩。

安装后默认快捷键 `Shift+Alt+F`（Compact 模式），可在 VS Code 快捷键设置中自定义快捷键和压缩模式。

## 环境要求

- VS Code 1.95.0 及以上版本
- Node.js 22.0.0 及以上版本

## 支持的模式

| 模式 | 说明 | 示例 |
|------|------|------|
| **Expanded** | 格式化 CSS 样式，展开所有属性，每个属性独占一行，便于阅读和调试 | `prop: value;`（每个属性独占一行，带缩进） |
| **Compact-Spaces** | 去掉多余的换行，每个属性和选择器间用一个空格隔开 | `selector { prop: value; prop: value; }` |
| **Compact** | 去掉多余的换行和空格，每个属性和选择器间没有空格隔开 | `selector{prop:value;prop:value;}` |
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
- 默认快捷键 `Shift+Alt+F`（Compact 模式）
- 状态栏快捷按钮
- 右键菜单快捷入口

## 配置项

在 VS Code 设置中搜索 `cssCompressor` 可配置以下选项：

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `cssCompressor.defaultMode` | string | `"compact"` | 默认压缩模式：`"expanded"`、`"compact-spaces"`、`"compact"`、`"compressed"` |
| `cssCompressor.removeComments` | boolean | `false` | 是否移除所有 CSS 注释 |
| `cssCompressor.preserveImportantComments` | boolean | `true` | 移除注释时是否保留 `/*! */` 重要注释 |
| `cssCompressor.indentSize` | number | `4` | Expanded 模式的缩进空格数（1-8） |

## 使用方法

### 命令面板

按 `Ctrl+Shift+P` 打开命令面板，搜索以下命令：

- **CSS Compressor: Compress (Default Mode)** — 使用默认模式压缩
- **CSS Compressor: Format (Expanded)** — 使用 Expanded 模式
- **CSS Compressor: Compact-Spaces** — 使用 Compact-Spaces 模式
- **CSS Compressor: Compact** — 使用 Compact 模式
- **CSS Compressor: Compressed** — 使用 Compressed 模式

### 快捷键

默认快捷键 `Shift+Alt+F` 绑定到 Compact 模式。你可以通过 VS Code 的 **键盘快捷方式** 设置（`Ctrl+K Ctrl+S`）为其他命令绑定自定义快捷键。

### 右键菜单

在支持的 CSS 文件中，选中文本后右键菜单中会显示 **CSS Compressor: Compress (Default Mode)**。

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

### Compact 模式压缩后:
```css
body{background-color:#f5f5f5}
.about-hero{background:linear-gradient(135deg,#008de1 0,#00b5e2 100%);color:#fff;padding:60px 0;text-align:center;margin-bottom:30px}
.about-hero h1{font-size:36px;font-weight:700;margin-bottom:12px}
.about-hero .subtitle{font-size:18px;opacity:.9;max-width:700px;margin:0 auto;line-height:1.8}
.section-box{background:#fff;border-radius:10px;padding:32px 28px;margin-bottom:24px;box-shadow:0 1px 6px rgba(0,0,0,.06)}
.section-box h2{font-size:24px;font-weight:700;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #008de1;position:relative}
.section-box h2::after{content:'';position:absolute;bottom:-2px;left:0;width:60px;height:2px;background:#00b5e2}
.section-box h3{font-size:17px;font-weight:700;margin:22px 0 10px;color:#333}
.section-box p{font-size:15px;color:#555;line-height:1.9;margin-bottom:12px}
.feature-list,.pain-list,.scene-list{list-style:none;padding-left:0}
.feature-list li,.pain-list li,.scene-list li{position:relative;padding:10px 0 10px 28px;font-size:15px;color:#555;line-height:1.8;border-bottom:1px dashed #eee}
.pain-list li::before{content:'✕';position:absolute;left:0;top:10px;color:#e74c3c;font-weight:700;font-size:14px}
.scene-list li::before{content:'✓';position:absolute;left:0;top:10px;color:#27ae60;font-weight:700;font-size:14px}
.feature-list li::before{content:'◆';position:absolute;left:0;top:10px;color:#008de1;font-size:10px}
.step-row{display:flex;flex-wrap:wrap;gap:20px;margin-top:16px}
.step-card{flex:1;min-width:180px;text-align:center;padding:24px 16px;background:#f8f9fa;border-radius:10px;position:relative;transition:transform .2s,box-shadow .2s}
.step-card:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,.1)}
.step-num{width:44px;height:44px;line-height:44px;background:#008de1;color:#fff;border-radius:50%;font-size:20px;font-weight:700;margin:0 auto 12px}
.step-card h4{font-size:15px;font-weight:700;margin-bottom:8px;color:#333}
.step-card p{font-size:13px;color:#777;margin:0;line-height:1.7}
.format-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.format-tag{display:inline-block;padding:4px 14px;background:#e8f4fd;color:#008de1;border-radius:20px;font-size:13px;font-weight:600}
.highlight-box{background:#fff8e1;border-left:4px solid #f9a825;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0}
.highlight-box p{margin:0;font-size:14px;color:#795548}
.stat-row{display:flex;flex-wrap:wrap;gap:20px;margin:20px 0}
.stat-item{flex:1;min-width:140px;text-align:center;padding:20px 12px;background:linear-gradient(135deg,#e8f4fd,#f0f9ff);border-radius:10px}
.stat-num{font-size:32px;font-weight:700;color:#008de1}
.stat-label{font-size:13px;color:#777;margin-top:4px}
.accordion-item{border:1px solid #e0e0e0;border-radius:8px;margin-bottom:10px;overflow:hidden}
.accordion-header{padding:14px 40px 14px 18px;font-size:15px;font-weight:600;color:#333;cursor:pointer;position:relative;user-select:none;background:#fafafa;transition:background .2s}
.accordion-header:hover{background:#f0f0f0}
.accordion-header::after{content:'+';position:absolute;right:18px;top:50%;transform:translateY(-50%);font-size:20px;color:#999;transition:transform .2s}
.accordion-item.open .accordion-header::after{content:'−';color:#008de1}
.accordion-body{display:none;padding:0 18px 16px;font-size:14px;color:#666;line-height:1.9}
.accordion-item.open .accordion-body{display:block}
@media (max-width:768px){
.about-hero{padding:36px 16px}
.about-hero h1{font-size:26px}
.about-hero .subtitle{font-size:15px}
.section-box{padding:20px 16px}
.section-box h2{font-size:20px}
.step-row{flex-direction:column}
.stat-row{flex-direction:column;gap:10px}
}
```

### Compressed 模式压缩后：
```css
body{background-color:#f5f5f5;}.about-hero{background:linear-gradient(135deg, #008de1 0%, #00b5e2 100%);color:#fff;padding:60px 0;text-align:center;margin-bottom:30px;}.about-hero h1{font-size:36px;font-weight:700;margin-bottom:12px;}
```


## License

MIT
