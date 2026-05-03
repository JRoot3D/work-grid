# Phase 3 — Architectural Boundary Restoration

**Risk:** medium
**Estimated effort:** ~30 min
**Goal:** stop the UI from reaching past the application layer into
infrastructure, and add a guard rail to prevent regression.

## Context

Hexagonal / Ports & Adapters layering is intended:

```
domain          ← entities, no deps
application     ← use cases + ports, depends on domain
infrastructure  ← adapters, depends on application + domain
features        ← UI, should depend on application + domain
```

`src/features/board/components/BoardPage.tsx:5` violates this by importing
`parseWorkspace` and `serializeWorkspace` directly from
`infrastructure/persistence/workspaceSerializer`. The dependency arrow points
the wrong way.

## 3.1 Introduce `application/workspaceUseCases.ts`

Create a new file `src/application/workspaceUseCases.ts` exposing the
application-layer contract for serialization:

```ts
import type { Workspace } from '../domain/board';
import {
  parseWorkspace,
  serializeWorkspace,
} from '../infrastructure/persistence/workspaceSerializer';

export function exportWorkspaceAsBlob(workspace: Workspace): Blob {
  return new Blob([serializeWorkspace(workspace)], { type: 'application/json' });
}

export function importWorkspaceFromText(text: string): Workspace {
  return parseWorkspace(text);
}
```

> Note: this file imports from `infrastructure/`, which is a **temporary**
> layering compromise. The cleaner long-term design pushes the parser into
> `application/` and keeps `infrastructure/` for I/O only. For now, the goal is
> simply to remove the UI's direct knowledge of the serializer.

## 3.2 Update `BoardPage.tsx`

- Replace `import { parseWorkspace, serializeWorkspace } from '...infrastructure/persistence/workspaceSerializer'`
  with imports from `application/workspaceUseCases`.
- In `exportData()`: call `exportWorkspaceAsBlob(workspace)` instead of
  building the `Blob` inline.
- In `importData()`: call `importWorkspaceFromText(await file.text())` instead
  of `parseWorkspace(await file.text())`.

## 3.3 🟡 Decide: enforce layer boundaries with ESLint?

**Two options:**

- **A.** Add `eslint-plugin-boundaries` (or `no-restricted-paths` from
  `eslint-plugin-import`) with rules:
  - `domain` cannot import anything outside itself.
  - `application` can import `domain` only.
  - `infrastructure` can import `domain` + `application`.
  - `features` can import `application` + `domain` (NOT infrastructure).
- **B.** Skip it — rely on review.

**Recommendation:** add it (A). It's a one-time ~20-line config edit that pays
back forever. This is the kind of guard that keeps Codex-style "import
whatever resolves" drift out of future PRs.

## Verification

```bash
npm run lint
npm run build
```

Try this regression check: temporarily re-add the old direct import in
`BoardPage.tsx`. If 3.3 was implemented, ESLint should reject it. Revert the
test edit.

## Follow-up (deferred)

Eventually move the parsers into `application/` and turn
`infrastructure/persistence/` into pure I/O (just `localStorage` reads/writes
of strings). Out of scope for this phase.
