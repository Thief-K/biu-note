# BiuNote AI Agent Guidelines (AGENTS.md)

## 1. Quick Development Commands

```bash
pnpm install                           # Install dependencies
pnpm dev                               # Start Fastify (:3000) and Vite (:5173)
pnpm test                              # Run Vitest test suite
pnpm lint                              # Run oxlint checks
pnpm --filter biunote-frontend build   # Build frontend production bundle
```

### Local Setup & Environment
- **Runtime Requirements**: Node.js `>= 22.0.0`, pnpm `>= 9.0.0`, Git installed.
- **Backend Configuration** (`backend/.env`):
  ```env
  PORT=3000
  NOTES_DIR=../notes
  LOGIN_TOKEN=biunote-secret-token
  ```
  *(AI API Key and models are configured in Web UI and stored in `notes/.biunote/config.json`)*

---

## 2. Project Directory Structure

```text
biu-note/
├── backend/            # Fastify backend, SQLite DB, Git & Vector engine (TypeScript)
│   ├── lib/            # Shared utilities (note parsing, diffing)
│   ├── types/          # Backend TypeScript interfaces & types
│   ├── server.ts       # Fastify server entry point
│   ├── db.ts           # SQLite metadata layer (node:sqlite)
│   ├── git.ts          # Git auto-commit tracking layer
│   └── vector.ts       # JIT vector embedding & cosine search
├── frontend/           # React 19 SPA, Tailwind 4, Zustand i18n & editor (TypeScript)
│   ├── src/
│   │   ├── components/ # Atomic & common UI components (.tsx)
│   │   ├── stores/     # Zustand stores (notes, sparks, i18n, theme) (.ts)
│   │   ├── i18n/       # Lightweight i18n store & locales (en/zh) (.ts)
│   │   ├── pages/      # Route pages (Notes, Sparks, Chat, Settings) (.tsx)
│   │   └── types/      # Frontend TypeScript interfaces & types
│   └── dist/           # Production static assets served by backend
├── notes/              # Local notes directory (auto-managed Git repo)
│   ├── .biunote/       # Native SQLite database (biunote.db) & vector cache
│   └── sparks/         # Instant sparks stream files
├── .github/workflows/  # Automated multi-arch CI/CD (GHCR docker publish)
├── AGENTS.md           # AI Agent guidelines, invariants & developer reference
├── DESIGN.md           # System architecture specification
├── Dockerfile          # Multi-stage production container build
├── docker-compose.yml  # Production deployment specification
├── tsconfig.json       # Composite TypeScript project root configuration
├── README.md           # Product documentation (English)
└── README_zh.md        # Product documentation (Chinese)
```

---

## 3. Operating Invariants & Rules

### Data & Storage
- **Decoupled Metadata**: Physical `.md` files are **100% pure plaintext**—never inject YAML frontmatter or `#tag` lines. Tags and metadata reside exclusively in SQLite (`notes/.biunote/biunote.db`) which is tracked by Git.
- **Local Secrets & Config**: AI API keys and model configs reside in `notes/.biunote/config.json` and are strictly ignored in `.gitignore`.
- **Sparks & Tasks**: Files under `sparks/` and `tasks/` never contain tags.
- **Dynamic Renaming**: Saving a note via `POST /api/notes/raw` may rename the physical file based on its first H1 heading. Always use the returned `filepath`.
- **JIT Embeddings**: Vector embeddings are strictly generated **Just-in-Time (JIT)** in `notes/.biunote/vectors.json` (ignored in `.gitignore`) prior to `/api/ai/process` or `/api/ai/chat`. Never trigger batch embeddings during startup, save, or import.

### Architecture & Runtime
- **Entry Points**: `backend/server.ts` and `frontend/src/main.tsx`. Production serves assets from `frontend/dist/`.
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
  - When an input has a descriptive `label`, keep placeholder minimal (e.g., `placeholder="Enter..."`).
- **Anti-FOUC**: `index.html` uses Critical Inline CSS and synchronous `<head>` script to eliminate theme flicker.

### Internationalization (i18n) Invariants
- **No Hardcoded UI Strings**: All user-facing labels, buttons, placehholders, alerts, and confirmations must use `useI18n()` hook via `t('category.key', params)`.
- **Synchronized Dictionaries**: Any key added to `frontend/src/i18n/locales/zh.ts` must have an identical counterpart in `frontend/src/i18n/locales/en.ts` (enforced by automated unit tests).
- **Concise Translations**: Keep English and Chinese copy concise, crisp, and clear without unnecessary verbiage.

---

## 4. Release & Version Bumping Workflow

When instructed to **"Bump to v[x.x.x]"**, **"Release v[x.x.x]"**, or **"更新到 v[x.x.x] 版本"**, strictly follow this 5-step Standard Operating Procedure (SOP):

1. **Synchronize Version Identifiers**:
   - Root `package.json`: update `"version": "x.x.x"`
   - Frontend `frontend/package.json`: update `"version": "x.x.x"`
   - Backend `backend/package.json`: update `"version": "x.x.x"`
   - Production config `docker-compose.yml`: update `image: ghcr.io/thief-k/biu-note:x.x.x`

2. **Update Changelog (`CHANGELOG.md`)**:
   - Follow Keep a Changelog 1.1.0 specifications and insert `## [x.x.x] - YYYY-MM-DD` at the top of `CHANGELOG.md`;
   - Categorize changes systematically (`### Added`, `### Changed`, `### Fixed`, `### Performance`, etc.);
   - Update version comparison link references at the bottom (e.g., `[x.x.x]: https://github.com/Thief-K/biu-note/compare/v<prev>...vx.x.x`).

3. **Execute Comprehensive Automated Verification**:
   - `pnpm test` (Ensure 100% unit tests pass)
   - `pnpm lint` (Ensure zero code style / type lint errors)
   - `pnpm --filter biunote-frontend build` (Ensure production bundling and TypeScript checks pass)

4. **Local Git Commit & Tagging (Do not push automatically; wait for user confirmation)**:
   - Stage and commit all changes: `git commit -m "chore(release): bump version to vx.x.x and update CHANGELOG.md"`
   - Create annotated tag: `git tag -a vx.x.x -m "Release vx.x.x: <Concise Summary>"`

5. **Report & Provide Remote Push Commands**:
   - Inform the user that the local bump, test verification, and tagging are complete;
   - Provide the exact push command to trigger the GitHub Actions release build: `git push && git push origin vx.x.x`.