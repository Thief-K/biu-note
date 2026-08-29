# BiuNote AI Agent Guidelines (AGENTS.md)

## 1. Quick Commands

```bash
pnpm install                           # Install dependencies
pnpm dev                               # Start Fastify (:3000) and Vite (:5173)
pnpm test                              # Run Vitest test suite
pnpm lint                              # Run oxlint checks
pnpm --filter biunote-frontend build   # Build frontend production bundle
```

## 2. Operating Invariants & Rules

### Data & Storage
- **Decoupled Metadata**: Physical `.md` files are **100% pure plaintext**—never inject YAML frontmatter or `#tag` lines. Tags and metadata reside exclusively in SQLite (`notes/.biunote/biunote.db`) which is tracked by Git.
- **Local Secrets & Config**: AI API keys and model configs reside in `notes/.biunote/config.json` and are strictly ignored in `.gitignore`.
- **Sparks & Tasks**: Files under `sparks/` and `tasks/` never contain tags.
- **Dynamic Renaming**: Saving a note via `POST /api/notes/raw` may rename the physical file based on its first H1 heading. Always use the returned `filepath`.
- **JIT Embeddings**: Vector embeddings are strictly generated **Just-in-Time (JIT)** in `notes/.biunote/vectors.json` (ignored in `.gitignore`) prior to `/api/ai/process` or `/api/ai/chat`. Never trigger batch embeddings during startup, save, or import.

### Architecture & Runtime
- **Entry Points**: `backend/server.js` and `frontend/src/main.jsx`. Production serves assets from `frontend/dist/`.
- **Native Node.js 22 Runtime**: Uses native `import.meta.dirname` and built-in `node:sqlite` (`DatabaseSync`). `biunote.db` is tracked by Git, while `config.json` and `vectors.json` are ignored in `notes/.gitignore`. Git features gracefully degrade if Git is not installed.
- **Authentication**: All private API endpoints require `Authorization: Bearer <LOGIN_TOKEN>` header (`localStorage.biunote_token`).

### UI & Component Invariants
- **Flat Aesthetic (Zero Shadow)**: Use crisp borders (`border-zinc-800` / semantic accents) and avoid drop shadows (`shadow-none`).
- **Color System & Module Accents**:
  - Dark: Canvas `#09090b`, Card `#18181b`, Border `#27272a`.
  - Light: Canvas `#f4f4f6`, Card `#ffffff`, Border `#d4d4d8`.
  - **Module Semantic Colors**:
    - ⚡ AI & Core: Emerald (`primary-emerald` / `emerald`)
    - 💡 Sparks: Amber (`primary-amber` / `amber`)
    - 📝 Notes: Blue (`primary-blue` / `blue`)
    - 🤖 AI Chat: Purple (`primary-purple` / `purple`)
    - 🚨 Danger: Red (`primary-danger` / `danger`)
- **Reusable Common Components**: Always reuse from `frontend/src/components/common/`:
  - `IconButton`: Pure minimalist icon button. Zero text labels, zero `title` tooltips, micro-press physics (`active:scale-95`).
  - `AlertBanner`: High-contrast notification/error/warning banner with optional `action` slot for `IconButton`.
  - `PageHeader`: Sticky header with badge, title, count, optional `onBack`, and actions.
  - `SearchFilterBar`: Search input with `#tag` query support and clear button.
  - `TagBadge` & `TagList`: Standard emerald capsule badges (`dark:bg-zinc-900 text-emerald-400 border-emerald-500/30 h-5 px-2 text-[11px] leading-none`).
  - `MarkdownViewer`: Shared high-fidelity Markdown renderer (`marked` + `highlight.js` + static copy button markup + event delegation). Shared 100% between PC preview and mobile reader.
  - `EmptyState`: Standard centered placeholder (icon + single concise title).
  - `QuickModal`: Modal wrapper for fast capture and sparks (`Ctrl + Enter`).
  - `OutlineDrawer` & `AiModifyDrawer`: Slide-over drawers for reader and editor. Standardized `h-14` header baseline.
- **Editor & Preview Lifecycle Invariants**:
  - **New Note (`/notes/new`)**: Defaults to **edit mode** (`isPreview = false`) with first-line auto-focus.
  - **Existing Note Detail (`/notes/:filepath`)**: Defaults to **high-fidelity preview mode** (`isPreview = true`).
  - **Save Transition**: Saving in edit mode automatically transitions to preview mode (`isPreview = true`).
  - **VS Code Single-Pane Toggle**: Toggle preview/edit via `Eye`/`Edit3` icon button or `Ctrl+P` shortcut.
  - **Mobile vs Desktop Invariant**: Mobile view (`< 768px`) is strictly read-only (`NoteReader`), hiding note creation triggers (`/notes/new` redirects to `/notes`).
  - **Outline TOC Invariant**: Headings are extracted via `marked.lexer` (AST-synced, H1~H3 only), completely ignoring comments inside code blocks. Click triggers smooth scroll (`scrollIntoView` in preview, `container.scrollTo` + `preventScroll: true` in editor).
- **Card & List Invariants**:
  - Note cards display **only the title**, tags (if present), and metadata footer (no body text snippet).
  - Footer metadata rows use `pt-1 border-t border-zinc-850/50 text-[11px] text-zinc-500` with `font-mono` timestamp and `size="xs"` action buttons.
- **Interactive Highlighting & Dirty State**:
  - Input-driven CTA buttons (`QuickModal`, `AiModifyDrawer`, `ChatPage`, `LoginPage`) remain muted (`disabled:opacity-40`) until valid input is provided, then immediately light up.
  - Form/Editor save buttons remain muted until modified (`isDirty`), then light up with dynamic feedback.
- **Navigation & Chat Layout Invariants**:
  - `FloatingPillNav` displays on primary tabs (`/sparks`, `/notes`, `/settings`), but is hidden on `/chat` where the input bar naturally adheres to the bottom (`pb-safe`).
  - `ChatPage` uses a pinned **Context Attachment Bar** for `@` mentioned documents, a pure native auto-growing `<textarea>` (zero baseline jitter), and renders reference tags **outside** message bubbles.
  - Tab buttons use **`grid place-items-center`** with explicit `size={20}` icons.
- **Typography & Inputs**:
  - Prefer concise icon buttons over text labels.
  - Keep all prompt and error copy minimalist, crisp, and concise.
  - When an input has a descriptive `label`, keep placeholder minimal (`placeholder="请输入"`).
- **Anti-FOUC**: `index.html` uses Critical Inline CSS and synchronous `<head>` script to eliminate theme flicker.

### Internationalization (i18n) Invariants
- **No Hardcoded UI Strings**: All user-facing labels, buttons, placehholders, alerts, and confirmations must use `useI18n()` hook via `t('category.key', params)`.
- **Synchronized Dictionaries**: Any key added to `frontend/src/i18n/locales/zh.js` must have an identical counterpart in `frontend/src/i18n/locales/en.js` (enforced by automated unit tests).
- **Concise Translations**: Keep English and Chinese copy concise, crisp, and clear without unnecessary verbiage.
