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

## 🐳 Docker 极简自部署（推荐）

BiuNote 提供官方预编译的多架构 Docker 镜像，只需一个 `docker-compose.yml` 即可在秒级内完成部署，无需配置复杂的编译环境。

### 1. 编写 `docker-compose.yml`

在服务器上创建任意目录（如 `~/biunote`），并在该目录下创建 `docker-compose.yml`：

```yaml
services:
  biunote:
    # 官方镜像源（海外服务器）：
    image: ghcr.io/thief-k/biu-note:latest
    # 国内服务器推荐使用高速镜像代理源加速拉取：
    # image: ghcr.dockerproxy.net/thief-k/biu-note:latest
    container_name: biunote
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NOTES_DIR=/app/notes
      - LOGIN_TOKEN=your-secret-token     # 自定义 Web 登录口令
      - TZ=Asia/Shanghai
      # 可选：直接注入 AI 配置（也可启动后在 Web 设置面板中配置）
      # - AI_BASE_URL=https://api.openai.com/v1
      # - AI_API_KEY=sk-xxx
      # - AI_MODEL=gpt-4o-mini
      # - AI_EMBEDDING_MODEL=text-embedding-3-small
    volumes:
      # 持久化挂载点：包含所有 Markdown 笔记、独立 Git 仓库与 SQLite 数据库
      - ./notes:/app/notes
```

### 2. 启动服务

```bash
docker compose up -d
```

启动完成后，访问 `http://<你的服务器IP>:3000` 即可开始使用。

---

## 🔄 镜像一键更新

当发布新版本时，无需重新上传源码或重新构建，只需在服务器的 `docker-compose.yml` 所在目录执行：

### 方式 A：手动一键拉取更新（推荐）
```bash
docker compose pull && docker compose up -d
```
> Docker 将自动拉取最新的代码层并平滑重启容器，数据完全保留在 `./notes` 目录中，数秒内即可完成升级。

### 方式 B：全自动静默热更新（Watchtower）
如需实现完全无人值守的自动化升级，可在 `docker-compose.yml` 中追加 `watchtower` 服务：
```yaml
  watchtower:
    image: containrrr/watchtower
    container_name: biunote-watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 3600 --cleanup biunote
```

---

## ⚙️ 环境变量说明

| 环境变量 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `PORT` | `3000` | 后端服务监听端口 |
| `NOTES_DIR` | `/app/notes` | 笔记与元数据持久化存储目录 |
| `LOGIN_TOKEN` | `biunote-secret-token` | Web 端访问口令（建议生产环境务必修改） |
| `TZ` | `Asia/Shanghai` | 容器时区设置 |
| `AI_BASE_URL` | - | OpenAI 兼容的 API Base URL（可选，可在前端设置） |
| `AI_API_KEY` | - | AI 接口密钥（可选，可在前端设置） |
| `AI_MODEL` | `gpt-4o-mini` | 对话与速记处理模型名称 |
| `AI_EMBEDDING_MODEL`| `text-embedding-3-small` | 语义检索向量嵌入模型名称 |

---

## 🛠️ 本地开发与架构设计

- **本地开发环境搭建与命令**：详见 [AGENTS.md](AGENTS.md)
- **系统架构与技术设计说明**：详见 [DESIGN.md](DESIGN.md)

---

## 📄 开源许可

[MIT License](LICENSE)