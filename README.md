# ⚡ BiuNote

<div align="center">

**[English](README.md)** | **[中文](README_zh.md)**

*A pure, distraction-free Markdown note-taking app for individuals, supercharged with integrated AI assistance.*

</div>

---

## 🌟 Highlights

- 📝 **100% Pure Markdown**: Physical `.md` files remain pure plaintext with zero metadata pollution (tags decoupled in SQLite) and full local file ownership.
- ⚡ **AI Fast Drafting & Smart Capture**: Turn raw thoughts or prompts into polished notes. AI intelligently merges into existing Markdown notes or drafts new ones with interactive **Visual Diff Confirmation**.
- 💡 **Instant Sparks Stream**: Millisecond-level ephemeral capture for quick thoughts, seamlessly organized without disrupting your writing flow.
- 🎙️ **Native Voice Dictation (Voice-to-Sparks)**: Client-side speech-to-text powered by browser Web Speech API with zero Token cost and zero dependencies; live streaming dictation into instant sparks.
- 👓 **Single-Pane Preview & AST Outline**: VS Code style instant preview toggle (`Ctrl+P`), auto-focus on note creation, save-to-preview transition, and AST-synced heading TOC (H1~H3) with smooth scrolling.
- 🤖 **Context-Aware Multi-Doc RAG Chat**: Ask questions across your Markdown notes or `@mention` specific documents with auto-resizing input and clean citation references.
- 🌐 **Multi-Language (i18n)**: Native lightweight internationalization supporting **English** and **简体中文** with instant switching and auto-persistence.
- 🎨 **Adaptive Flat Design**: Clean zero-shadow aesthetic with crisp high-contrast light and dark themes and responsive mobile/desktop separation.
- 🛡️ **Local-First & Git Tracked**: Zero cloud lock-in with transparent local Markdown storage and automatic local Git version history.

---

## 🐳 Docker Deployment (Recommended)

BiuNote provides official pre-built multi-architecture Docker images. You can deploy it in seconds using a single `docker-compose.yml` file without configuring complex development environments.

### 1. Configure `docker-compose.yml`

Create a directory (e.g. `~/biunote`) on your server and create `docker-compose.yml`:

```yaml
services:
  biunote:
    image: ghcr.io/thief-k/biu-note:latest
    container_name: biunote
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - LOGIN_TOKEN=your-secret-token     # Set your custom web access token
      - TZ=Asia/Shanghai
    volumes:
      - ./notes:/app/notes
```

### 2. Start Service

```bash
docker compose up -d
```

Access `http://<your-server-ip>:3000` to start using BiuNote.

---

## 🔄 One-Click Updates

When a new version is released, you do not need to rebuild or re-upload files. Simply run:

### Method A: Manual Update (Recommended)
```bash
docker compose pull && docker compose up -d
```
> Docker will pull updated layers and smoothly restart the container in seconds. All data in `./notes` remains untouched.

### Method B: Automated Updates (Watchtower)
For unattended automatic updates, add the `watchtower` service to `docker-compose.yml`:
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

## ⚙️ Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Server listening port |
| `NOTES_DIR` | `/app/notes` | Notes and metadata storage path |
| `LOGIN_TOKEN` | `biunote-secret-token` | Web access token (strongly recommended to change in production) |
| `TZ` | `Asia/Shanghai` | Container timezone |

> Note: AI configuration (API key, base URL, models) is managed securely via the Web UI **Settings** page and stored in `notes/.biunote/config.json`.

---

## 🛠️ Local Development & Architecture

- **Local Setup & Development Commands**: See [AGENTS.md](AGENTS.md)
- **System Architecture & Design Specifications**: See [DESIGN.md](DESIGN.md)

---

## 📄 License

[MIT License](LICENSE)