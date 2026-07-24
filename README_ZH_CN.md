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

### Compressed 模式压缩后：
```css
body{background-color:#f5f5f5;}.about-hero{background:linear-gradient(135deg, #008de1 0%, #00b5e2 100%);color:#fff;padding:60px 0;text-align:center;margin-bottom:30px;}.about-hero h1{font-size:36px;font-weight:700;margin-bottom:12px;}
```

## 开发

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 在 VS Code 中按 F5 启动调试

# 测试
npm test

# 打包为 .vsix
npm run package

# 发布到 Marketplace
npm run publish
```

## 项目文件清单

## 自动发布
CSSCompressor/
├── src/
│   ├── compressor.ts      # CSS 压缩引擎（自实现状态机，零依赖）
│   ├── extension.ts        # VS Code 扩展入口（5 个命令 + 状态栏）
│   └── utils.ts            # HTML style 提取 + 配置读取
├── test/
│   ├── compressor.test.ts  # 压缩器单元测试（35+ 用例）
│   ├── extension.test.ts   # 集成测试
│   ├── runTest.ts          # 测试运行器
│   └── suite/index.ts      # Mocha 测试套件
├── .github/workflows/publish.yml  # 自动发布工作流
├── .vscode/launch.json     # F5 调试配置
├── .vscode/tasks.json      # TypeScript 编译任务
├── package.json            # 扩展清单（commands, keybindings, configuration）
├── tsconfig.json           # TypeScript 配置
├── .vscodeignore           # 打包排除规则
├── icon.png                # 扩展图标（128x128）
├── CHANGELOG.md
├── LICENSE
└── README.md               # 完整使用文档


本项目配置了 GitHub Actions 自动发布工作流。推送 `v*` 标签（如 `v1.0.0`）将自动触发编译、测试和发布到 VS Code Marketplace。

```bash
npm version patch
git tag v1.0.1
git push origin main --tags
```

首次使用前需要在 GitHub 仓库设置中添加 `VSCE_PAT` Secret（从 Azure DevOps 获取 Personal Access Token）。


## 发布到 Marketplace
### 手动发布：
```bash
npx @vscode/vsce publish patch
```
### 自动发布：
- 1.在 GitHub 仓库设置中添加 VSCE_PAT Secret
- 2.执行 git tag v1.0.0 && git push origin main --tags
- 3.GitHub Actions 自动构建并发布

> 发布前请将 package.json 中的 "publisher": "your-publisher-id" 替换为你在 VS Code [Marketplace](https://marketplace.visualstudio.com/) 的实际发布者 ID。


## License

MIT
