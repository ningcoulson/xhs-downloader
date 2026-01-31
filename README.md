# XHS Downloader (小红书下载器)

[English](#english) | [中文](#chinese)

<a name="english"></a>
## English

**XHS Downloader** is a web application built with [Next.js](https://nextjs.org) designed to easily download high-quality images and videos from Xiaohongshu (Little Red Book).

### Features

- 🔗 **Link Parsing**: Extract images and videos from Xiaohongshu note links.
- 📦 **Batch Download**: One-click download for all images in a note.
- 🛡️ **Proxy Support**: Built-in proxy to bypass referrer checks and download restrictions.
- 🎨 **Modern UI**: Clean, responsive design with preview functionality.
- 🌐 **Cross-Browser**: Compatible with Chrome (Preview & Save) and Safari (Direct Download).

### Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

<a name="chinese"></a>
## 中文 (Chinese)

**XHS Downloader** 是一个基于 [Next.js](https://nextjs.org) 开发的网页应用，旨在帮助用户轻松下载小红书（Xiaohongshu）上的高清图片和视频。

### 功能特点

- 🔗 **链接解析**：一键提取小红书笔记中的图片和视频资源。
- 📦 **批量下载**：支持一键打包下载笔记中的所有图片。
- 🛡️ **代理支持**：内置代理服务，有效绕过防盗链限制，解决下载不可用问题。
- 🎨 **现代界面**：简洁美观的响应式设计，支持大图预览。
- 🌐 **跨浏览器兼容**：完美支持 Chrome（预览另存为）和 Safari（直接下载）等主流浏览器。

### 快速开始

首先，启动开发服务器：

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 即可使用。

---

### Tech Stack / 技术栈

- **Framework**: Next.js 15 (App Router)
- **Styling**: Vanilla CSS (Global Styles)
- **Language**: TypeScript
- **Deployment**: Vercel / Docker (Optional)
