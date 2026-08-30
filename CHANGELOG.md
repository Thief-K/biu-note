# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2026-08-30

### 🐛 Fixed
- **SPA Direct Access & Route Refresh (404 Resolution)**: Resolved 404 Not Found error when directly accessing or refreshing frontend SPA routes (`/sparks`, `/notes`, `/chat`, `/settings`) by standardizing production path resolution relative to `process.cwd()`.

### ♻️ Refactor
- **Standard Monorepo Deployment Conventions**: Aligned Docker container runtime structure with standard production conventions (`backend/dist/server.js` and `frontend/dist/`).

---

## [1.0.4] - 2026-08-30

### ⚡ Performance
- **Frontend Bundle Reduction**: Configured `highlight.js` with on-demand registration for common developer languages, slashing frontend JS bundle size from **1.31 MB down to 514 KB** (Gzip: 160 KB, **-61% reduction**).
- **Vite SSR Backend Build**: Unified backend production build with `vite build --ssr`, outputting a 35KB standalone `dist/server.js` with zero runtime compilation overhead.

### ♻️ Refactor
- **Vite-Powered Development & Build Pipeline**: Standardized backend execution on Vite's official SSR module runner, enabling clean extensionless imports without requiring `.ts` suffixes or third-party wrappers (`tsx` / `vite-node`).
- **Watch Path Isolation**: Configured targeted `--watch-path` for backend development to avoid infinite restart loops triggered by local SQLite database file updates.
- **Dependency Upgrades**: Upgraded `highlight.js` to `^11.12.0`, `fastify` to `v5`, `vite` to `v8`, and `zustand` to `v5`.

### 🔄 Changed
- **Note Editor Layout Standardization**: Unified note editor and reader navigation using standard `PageHeader` and `ContentContainer` components.
- **Action Button Styling**: Configured persistent semantic color variants for Preview (`blue`) and AI (`emerald`) action buttons.
- **Streamlined UI Copywriting**: Refined AI prompts and action labels ("AI 起草", "AI 速记", "AI 助手", and "你好呀，有什么想问的？").

### 🐛 Fixed
- **Mobile Text Selection Isolation**: Constrained CSS text selection boundaries to prevent mobile long-press gestures from selecting the entire page layout.

---

## [1.0.3] - 2026-08-30

### ⚡ Performance
- **Docker Layer Caching & Incremental Pull Optimization**:
  - Integrated `pnpm fetch` to strictly cache dependencies based on `pnpm-lock.yaml`, preventing routine version bumps in `package.json` from invalidating the layer cache.
  - Employed `pnpm deploy --prod` to isolate backend runtime dependencies, eliminating ~40MB of devDependencies from the production image and reducing routine update pulls to ~1.5MB.

### 🐛 Fixed
- **Backend Type Definition**: Added `original_content` optional property to `AiProcessResponse` in backend types to ensure 100% strict TypeScript compilation.

---

## [1.0.2] - 2026-08-30

### ✨ Added
- **Proportional Synchronized Dual-Pane Scrolling**: Robust synchronized scroll tracking with proportional height percentage alignment across original and proposed diff panes in `DiffModal`.
- **Responsive Mobile Segmented View**: Dedicated segmented tab switcher (`Proposed` vs `Original`) for small screens in AI Diff modal.
- **Interactive Tag Creation Capsule**: Native inline tag creation and deletion directly inside the reusable `TagList` component.

### 🔄 Changed
- **Streamlined Diff Modal UI & Icons**: Refined modal title (`AI Merge`), concise column headers (`Original` vs `Proposed`), and symmetrical icon styling (`FileText` for note title, `Tag` for tag capsules).
- **Design Token Standardization**: Replaced manual overriding CSS color classes with standard `IconButton` variant tokens (`emerald`, `blue`, `amber`, `default`).

### 🐛 Fixed
- **AI Document Transformation on Existing Notes**: Fixed `/api/ai/process` prompt to properly recognize summary, polishing, and expansion instructions on existing notes, and ensured `original_content` is always returned.
- **Defensive Diff Calculation**: Added optional-chaining and fallback guards to avoid runtime exceptions during diff calculations.

### ♻️ Refactor
- **Code Shrink & Deduplication**: Unified duplicate JSX diff renderers, module-scoped `diff_match_patch` singleton, centralized tag input logic, and removed orphan development scripts.

---

## [1.0.1] - 2026-08-29

### ✨ Added
- **UI Layout Consistency**: Extracted reusable `ContentContainer` component to standardize content widths (`w-full max-w-3xl mx-auto`) across Notes, Sparks, and Settings pages.

### 🔄 Changed
- **Editor Styling & Interaction**:
  - Enhanced button color accents across the editor and top navigation bar (Emerald for AI, Blue for Preview, Amber for unsaved changes, Emerald capsule for tags).
  - Streamlined editor header by hiding Outline TOC button during edit mode and hiding Save button in preview mode.

### ⚡ Performance
- **Docker Layer Caching**: Optimized `Dockerfile` multi-stage layer copy order to drastically reduce incremental update pull size (from ~58MB down to <2MB for routine code edits).

---

## [1.0.0] - 2026-08-29

### ✨ Added
- **Pure Markdown Note Engine**: 100% pure plaintext Markdown note-taking with local-first file storage.
- **Instant Sparks Stream**: Fast fleeting thoughts capture stream with full-text search.
- **Integrated AI Copilot**:
  - Context-aware RAG knowledge chat over local notes.
  - In-place AI drafting, expanding, and diff-comparison editor drawer.
  - JIT (Just-in-Time) vector embeddings with zero startup delay.
- **Decoupled SQLite Metadata**: Fast search indexing and tag management stored in `.biunote/biunote.db` without injecting YAML frontmatter.
- **Git Auto-Commit Tracking**: Seamless note history tracking powered by local Git.
- **Multi-Theme & Responsive Reader**: High-fidelity dark/light theme support with dedicated mobile read-only reader view.
- **Docker & CI/CD**: Production `Dockerfile` and automated multi-arch GHCR publishing pipeline.
- **License**: Released under standard MIT License.

[1.0.5]: https://github.com/Thief-K/biu-note/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/Thief-K/biu-note/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/Thief-K/biu-note/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/Thief-K/biu-note/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Thief-K/biu-note/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Thief-K/biu-note/releases/tag/v1.0.0
