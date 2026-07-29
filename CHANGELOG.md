# Changelog

All notable changes to the CSS Compressor VS Code extension will be documented in this file.

## [1.0.8] - 2026-07-29

### Fixed
- 修复保留注释时，注释与紧随其后的 CSS 规则被合并到同一行的问题，注释现在始终独占一行
- 修复 Compressed 模式下属性值中必要空格被错误删除的问题（如 `2px solid` 被压缩为 `2pxsolid`）

### Changed
- 排除 `assets/` 目录，不再打包到 .vsix 安装包中
- 优化 CSS 压缩核心逻辑，改进注释预处理和 tokenizer 的协作方式

## [1.0.7] - 2026-07-28

### Changed
- 重构代码结构，提取核心压缩逻辑为独立模块，提升可读性和可维护性
- 优化 HTML style 标签提取与压缩流程

## [1.0.6] - 2026-07-25

### Changed
- 更新发布名称，统一为 CSS Compressor Beautify

## [1.0.0] - 2026-07-24

### Added
- Initial release of CSS Compressor
- Four compression modes: Expanded, Compact-Spaces, Compact, Compressed
- Support for `.css`, `.scss`, `.less`, `.sass`, `.wxss`, and `.html` files
- HTML `<style>` tag content extraction and compression
- Selection-only compression mode
- Comment removal with important comment preservation (`/*! */`)
- Configurable indentation size (Expanded mode)
- Default keyboard shortcut `Shift+Alt+F` (Compact mode)
- Status bar button for quick access
- Right-click context menu integration
- GitHub Actions auto-publish workflow
