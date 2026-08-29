# Changelog (更新日志)

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.2] - 2026-08-30

### Added
- **Proportional Synchronized Dual-Pane Scrolling**: Robust synchronized scroll tracking with proportional height percentage alignment across original and proposed diff panes in `DiffModal`.
- **Responsive Mobile Segmented View**: Dedicated segmented tab switcher (`Proposed` vs `Original`) for small screens in AI Diff modal.
- **Interactive Tag Creation Capsule**: Native inline tag creation and deletion directly inside the reusable `TagList` component.

### Changed
- **Streamlined Diff Modal UI & Icons**: Refined modal title (`AI Merge`), concise column headers (`Original` vs `Proposed`), and symmetrical icon styling (`FileText` for note title, `Tag` for tag capsules).
- **Design Token Standardization**: Replaced manual overriding CSS color classes with standard `IconButton` variant tokens (`emerald`, `blue`, `amber`, `default`).

### Fixed
- **AI Document Transformation on Existing Notes**: Fixed `/api/ai/process` prompt to properly recognize summary, polishing, and expansion instructions on existing notes, and ensured `original_content` is always returned.
- **Defensive Diff Calculation**: Added optional-chaining and fallback guards to avoid runtime exceptions during diff calculations.

### Refactor
- **Code Shrink & Deduplication**: Unified duplicate JSX diff renderers, module-scoped `diff_match_patch` singleton, centralized tag input logic, and removed orphan development scripts.

---

## [1.0.1] - 2026-08-29

### Added
- **UI Layout Consistency**: Extracted reusable `ContentContainer` component to standardize content widths (`w-full max-w-3xl mx-auto`) across Notes, Sparks, and Settings pages.

### Changed
- **Editor Styling & Interaction**:
  - Enhanced button color accents across the editor and top navigation bar (Emerald for AI, Blue for Preview, Amber for unsaved changes, Emerald capsule for tags).
  - Streamlined editor header by hiding Outline TOC button during edit mode and hiding Save button in preview mode.

### Performance
- **Docker Layer Caching**: Optimized `Dockerfile` multi-stage layer copy order to drastically reduce incremental update pull size (from ~58MB down to <2MB for routine code edits).

---

## [1.0.0] - 2026-08-29

### Added
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

[1.0.2]: https://github.com/Thief-K/biu-note/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Thief-K/biu-note/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Thief-K/biu-note/releases/tag/v1.0.0
