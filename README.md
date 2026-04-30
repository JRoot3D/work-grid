# Work Grid

A local-first Kanban board for tracking work across multiple projects. Runs entirely in the browser — no backend, no account, no telemetry. Tasks, columns, and projects live in `localStorage`, with explicit JSON import/export when you need to move them between machines.

**Live:** https://jroot3d.github.io/work-grid/

## Features

- **Multiple projects** in a single workspace, with quick project switching from the topbar.
- **Four fixed columns** (`Backlog → In progress → Review → Done`) — opinionated by design, no column customisation.
- **Rich tasks**: title, description, priority (`highest` … `lowest`), one of seven color tags, ordered checklist items, threaded comments, and an auto-generated issue key (`WG-XXXX`).
- **Drag-and-drop** between columns, with adjacent-column moves available from the task modal.
- **Workspace-wide search** that matches title, description, priority, color label, comment bodies, and checklist titles.
- **Versioned import/export** — workspaces are serialised to JSON with a `schemaVersion` field so old exports keep working as the model evolves.

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 18 + TypeScript |
| State | Redux Toolkit (one slice for the whole workspace) |
| Build | Vite 7 |
| Styling | SCSS (single global stylesheet at `src/styles/main.scss`) |
| Icons | `lucide-react` |
| Persistence | `localStorage`, with serializer round-trips for forward compatibility |
| Hosting | GitHub Pages, deployed via GitHub Actions |

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
```

Other scripts:

```bash
npm run build     # tsc -b + vite build → dist/
npm run lint      # ESLint (typescript-eslint + react-hooks + react-refresh)
npm run preview   # Serve the built dist/ locally to verify production output
```

Requires Node 20+ (matches the GitHub Actions build).

## Project structure

The codebase follows a layered hex-style split:

```
src/
├── domain/              # Pure board model + invariants (no React, no I/O)
├── application/         # Use cases that operate on a Board / Workspace
├── infrastructure/
│   └── persistence/     # localStorage repos + JSON serializers (versioned)
├── features/board/      # UI components and the Redux slice
├── app/                 # Store wiring + typed hooks
└── styles/              # Global SCSS
```

Rules of thumb:

- Business rules belong in `domain/` and `application/` — they should never import from React or browser APIs.
- Browser specifics (localStorage, file APIs) live in `infrastructure/`.
- React components in `features/board/` consume the slice via the typed `useAppDispatch` / `useAppSelector` hooks from `src/app/hooks.ts`.

## Deployment

GitHub Pages is configured for SPA hosting (Vite `base` is `/work-grid/`, with a `404.html` fallback so deep links survive a refresh).

Releases are **tag-driven** — the deploy workflow only fires on tag pushes matching `v*`:

```bash
git tag v0.2.0
git push origin v0.2.0
```

Manual runs are also available from **Actions → Deploy to GitHub Pages → Run workflow**.

The first deploy of a fresh fork requires two one-time settings changes:

1. **Settings → Pages → Source** → set to *GitHub Actions*.
2. **Settings → Environments → `github-pages` → Deployment branches and tags** → switch to *Selected branches and tags* and add a tag rule for `v*` (the default rule blocks tag deploys).

If you fork under a different repo name, also update the `repoBase` constant in `vite.config.ts` to match (`/<your-repo-name>/`).

## Contributing

See [`AGENTS.md`](./AGENTS.md) for repository guidelines — coding style, naming conventions, and PR expectations. There is no test framework wired up yet; if you add one, also add a `test` script to `package.json`.

## License

[MIT](./LICENSE) © JRoot3D
