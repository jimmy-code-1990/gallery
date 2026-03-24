---
name: ai-gallery
description: >
  AI 图片/视频画廊浏览器。启动本地服务器浏览 Gemini MCP 生成的所有图片和视频。
  当用户想要查看、浏览、管理 AI 生成的图片时使用此技能。
  当用户说"打开画廊"、"查看生成的图片"、"看看图片"、"打开浏览器"、"open gallery"、
  "show my images"、"browse creations"时触发。
  当使用 Gemini 生成图片后想要查看结果时，也应主动建议使用此技能。
allowed-tools: Bash(node *), Bash(lsof *), Bash(curl *), Bash(kill *)
---

# AI Gallery — 本地视觉浏览器

Midjourney 风格的 AI 图片/视频画廊，用于浏览通过 Gemini MCP 生成的所有图片。

## 自动启动流程（必须遵循）

每次触发此 skill 时，**必须**按以下步骤自动执行，无需用户额外操作：

### 步骤 1：检测服务器状态

```bash
lsof -ti:3777 2>/dev/null && echo "RUNNING" || echo "STOPPED"
```

### 步骤 2：如果 STOPPED，后台启动服务器

```bash
node /Users/jimmyzhong/Documents/开放项目/视觉浏览器/server.js &
sleep 1
curl -s http://localhost:3777/api/images | head -c 50
```

确认输出包含 `{"images"` 则启动成功。如果失败，重试一次。

### 步骤 3：打开浏览器预览

使用 `preview_url` 工具打开 `http://localhost:3777`。

**重要**：以上三步必须自动连续执行，不要中途停下来等待用户确认。

## 生成图片后自动关联 Prompt

当通过 Gemini MCP 生成图片后，**必须**立即调用以下命令将 prompt 关联到最近生成的图片：

```bash
curl -X POST http://localhost:3777/api/set-prompt \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"生成时使用的完整prompt","tags":["tag1","tag2"]}'
```

这会自动匹配最近没有 prompt 的图片并关联上。

## 带视频目录启动

如果当前项目有视频文件需要浏览，通过环境变量指定视频目录：

```bash
GALLERY_VIDEO_DIRS="/path/to/videos" node /Users/jimmyzhong/Documents/开放项目/视觉浏览器/server.js &
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `GALLERY_PORT` | `3777` | 服务器端口 |
| `GALLERY_IMAGES_DIR` | `~/.config/gemini-mcp/output` | 图片扫描根目录 |
| `GALLERY_VIDEO_DIRS` | 空 | 视频目录，多个用逗号分隔 |

## 数据存储

- **图片源**: `~/.config/gemini-mcp/output/` (Gemini MCP 默认输出目录)
- **元数据**: `~/.config/ai-gallery/metadata.json` (prompt、tags 等信息，全局持久化)

## 功能特性

- 单击图片全屏查看 (Lightbox)，支持左右键导航
- 自动按生成批次分组（30s 时间窗口）
- 横图 2×2 网格排列，竖图 1×N 横排
- 每组右侧内联显示 prompt、缩略图、tags
- 搜索过滤（按文件名或 prompt 内容）
- 视频浏览和播放
