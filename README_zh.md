# ⚡ BiuNote

<div align="center">

**[English](README.md)** | **[中文](README_zh.md)**

*专为个人打造的纯粹 Markdown 笔记应用，深度集成 AI 辅助与知识对话*

</div>

---

## 🌟 核心亮点

- 📝 **100% 纯粹 Markdown**：物理 `.md` 文件保持纯粹文本存储，无格式绑架与私有标记（标签通过本地 SQLite 彻底解耦），数据完全归个人掌控。
- ⚡ **AI 智能速记与起草**：随时随地记录碎片想法或主题指令。AI 自动判断是**合并至已有笔记**还是**直接起草全新笔记**，提供直观的 **Diff 变更对比确认**。
- 💡 **灵感速捕 (Sparks)**：毫秒级捕捉瞬间闪念，按时间倒序流式呈现，轻量纯粹，免去分类负担，随时一键升华成正式笔记。
- 👓 **沉浸编辑与单栏一键预览**：类 VS Code 单栏预览极速切换（`Ctrl + P`），新建笔记自动聚焦首行，保存自动流转至预览；支持 AST 级语法大纲平滑滚动。
- 🤖 **多文档关联 RAG 对话**：直接向笔记提问，或通过 `@` 快捷引用单篇/多篇笔记与灵感，自适应输入框与外部元数据标签带来沉浸式对话体验。
- 🌐 **极简多语言支持 (i18n)**：基于 Zustand 原生支持**简体中文**与 **English**，全站文本即时切换、自动持久化与智能首选识别。
- 🎨 **双主题扁平美学与跨端协同**：无阴影极简设计，深色极夜黑与浅色高对比度清晰线框自适应切换；移动端专注阅读协同，桌面端专注沉浸创作。
- 🛡️ **本地优先 + Git 自动追踪**：笔记以纯文本文件保存在本地磁盘中，零云端绑定，支持独立 Git 仓库管理与版本留痕。

---

## 🚀 快速上手

### 1. 环境准备
- **Node.js**: `>= 22.0.0`
- **pnpm**: `>= 9.0.0`
- **Git**: 操作系统已安装并配置 `git`

### 2. 安装与配置

```bash
git clone https://github.com/your-username/biu-note.git
cd biu-note
pnpm install
```

配置 `backend/.env`：

```env
PORT=3000
NOTES_DIR=../notes
LOGIN_TOKEN=biunote-secret-token

# 可选：配置 AI 接口（也可启动后在 Web 界面「设置」中配置）
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-your-api-key
AI_MODEL=gpt-4o-mini
AI_EMBEDDING_MODEL=text-embedding-3-small
```

### 3. 启动服务

```bash
pnpm dev
```

- **前端界面**: [http://localhost:5173](http://localhost:5173)
- **后端接口**: [http://localhost:3000](http://localhost:3000)

---

## 🧪 常用开发命令

```bash
pnpm test                              # 运行自动化测试 (Vitest)
pnpm lint                              # 代码风格检查 (oxlint)
pnpm --filter biunote-frontend build   # 构建前端生产产物
```

---

## 📂 项目结构

```text
biu-note/
├── backend/            # Fastify 后端服务、SQLite 数据库、Git 提交与向量引擎
├── frontend/           # React 19 前端应用、Tailwind 4、Zustand i18n 与编辑器
│   └── src/i18n/       # 轻量 i18n 状态引擎与中英文字典 (zh/en)
├── notes/              # 本地笔记知识库目录（自动管理的 Git 独立仓库）
│   ├── .biunote/       # SQLite 数据库与向量缓存
│   └── sparks/         # 灵感记录存储目录
├── AGENTS.md           # 面向 AI Agent 的开发规范与硬性约束
├── DESIGN.md           # 面向 AI Agent 的系统架构与设计说明书
├── README.md           # 英文产品说明文档 (English)
└── README_zh.md        # 中文产品说明文档 (Chinese)
```

---

## 📄 开源许可

[MIT License](LICENSE)
