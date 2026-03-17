# DocManager 文献管理助手

一个简洁高效的本地文献管理桌面应用，基于 Electron 构建，支持 Windows x64。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20x64-lightgrey.svg)

## ✨ 功能特性

- 📚 **文献管理** - 添加、编辑、删除、搜索文献
- 🏷️ **分类与标签** - 灵活的分类系统和标签云
- 📖 **阅读进度** - 跟踪阅读状态和进度
- ⭐ **收藏功能** - 快速收藏重要文献
- 📝 **引用生成** - 支持 APA、MLA、Chicago、Harvard、IEEE、GB/T 7714 等格式
- 📥 **多格式导入** - 支持 BibTeX、RIS、EndNote XML、JSON、PDF、Word
- 📤 **导出功能** - 导出为 BibTeX 或 JSON 格式
- 💾 **本地存储** - 数据安全存储在本地

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm start
```

### 打包构建

```bash
# 打包为 Windows x64 安装包
npm run build

# 仅生成未打包的目录（用于测试）
npm run build:dir
```

打包后的安装程序位于 `dist/` 目录。

## 📁 项目结构

```
docmanager/
├── main.js          # Electron 主进程
├── preload.js       # 预加载脚本（安全 API 桥接）
├── index.html       # 主界面
├── styles.css       # 样式文件
├── app.js           # 应用逻辑
├── package.json     # 项目配置
└── README.md        # 项目说明
```

## 💾 数据存储

应用数据存储在用户目录下：

- **Windows**: `%APPDATA%\refmanager\RefManager\`
  - `references.json` - 文献数据
  - `categories.json` - 分类数据

## 🔧 技术栈

- **Electron** - 跨平台桌面应用框架
- **electron-builder** - 应用打包工具
- **原生 HTML/CSS/JS** - 轻量级前端

## 📝 支持的导入格式

| 格式 | 扩展名 | 说明 |
|------|--------|------|
| BibTeX | .bib | 学术文献标准格式 |
| RIS | .ris | 通用文献交换格式 |
| EndNote XML | .xml | EndNote 导出格式 |
| JSON | .json | 通用数据格式 |
| PDF | .pdf | 自动提取文件名 |
| Word | .doc/.docx | 自动提取文件名 |

## 📜 License

MIT License
