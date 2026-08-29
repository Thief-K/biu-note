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
- 👓 **Single-Pane Preview & AST Outline**: VS Code style instant preview toggle (`Ctrl+P`), auto-focus on note creation, save-to-preview transition, and AST-synced heading TOC (H1~H3) with smooth scrolling.
- 🤖 **Context-Aware Multi-Doc RAG Chat**: Ask questions across your Markdown notes or `@mention` specific documents with auto-resizing input and clean citation references.
- 🌐 **Multi-Language (i18n)**: Native lightweight internationalization supporting **English** and **简体中文** with instant switching and auto-persistence.
- 🎨 **Adaptive Flat Design**: Clean zero-shadow aesthetic with crisp high-contrast light and dark themes and responsive mobile/desktop separation.
- 🛡️ **Local-First & Git Tracked**: Zero cloud lock-in with transparent local Markdown storage and automatic local Git version history.

---

## 🚀 Quick Start

### 1. Requirements
- **Node.js**: `>= 22.0.0`
- **pnpm**: `>= 9.0.0`
- **Git**: Installed and configured

### 2. Install & Configure

```bash
git clone https://github.com/your-username/biu-note.git
cd biu-note
pnpm install
```

Configure `backend/.env`:

```env
PORT=3000
NOTES_DIR=../notes
LOGIN_TOKEN=biunote-secret-token

# Optional: Configure AI provider (or configure via Settings page in Web UI)
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-your-api-key
AI_MODEL=gpt-4o-mini
AI_EMBEDDING_MODEL=text-embedding-3-small
```

### 3. Run Development Server

```bash
pnpm dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Development Commands

```bash
pnpm test                              # Run automated tests (Vitest)
pnpm lint                              # Code linting (oxlint)
pnpm --filter biunote-frontend build   # Production frontend build
```

---

## 📂 Project Structure

```text
biu-note/
├── backend/            # Fastify backend, SQLite DB, Git & Vector engine
├── frontend/           # React 19 SPA, Tailwind 4, Zustand i18n & editor
│   └── src/i18n/       # Lightweight i18n store & locales (en/zh)
├── notes/              # Local notes directory (auto-managed Git repo)
│   ├── .biunote/       # Native SQLite database & vector cache
│   └── sparks/         # Instant sparks files
├── AGENTS.md           # AI Agent guidelines & invariant rules
├── DESIGN.md           # System architecture specification
├── README.md           # Product documentation (English)
└── README_zh.md        # Product documentation (Chinese)
```

---

## 📄 License

[MIT License](LICENSE)
