# Phase 2 — Naming Consistency

**Risk:** low
**Estimated effort:** ~15 min
**Goal:** stop forcing readers to translate "board" ↔ "workspace" in their
head. Pure rename, no behavior change.

## Context

Today `boardSlice.ts` exports `boardReducer` but `createSlice({ name: 'workspace' })`
and the state shape is `Workspace`. Every reader has to mentally translate.

## 2.1 Rename slice file and exports

- Rename `src/features/board/state/boardSlice.ts` → `workspaceSlice.ts`.
- Inside the file:
  - `boardSlice` → `workspaceSlice`
  - `boardReducer` → `workspaceReducer`
- Update imports in:
  - `src/app/store.ts:3`
  - All components in `src/features/board/components/` that import actions
    or selectors from this slice (`BoardPage.tsx`, `TaskModal.tsx`,
    `CreateTaskModal.tsx`, `CreateProjectModal.tsx`).

## 2.2 🟡 Decide on directory rename

The slice now lives at `src/features/board/state/` but governs workspaces.

**Two options:**

- **A.** Leave the directory as-is. The *feature* is the board UI; the state
  happens to be wider.
- **B.** Move to `src/features/workspace/` and re-export from a thin
  `features/board/` entry.

**Recommendation:** leave as-is (A). The user-visible feature is "the board";
workspace is implementation detail. This is the kind of change that looks tidy
on paper but creates churn in git history.

## Verification

```bash
npm run lint
npm run build
npm run dev
```

Open the app — board should load, all actions should still dispatch (create
task, move task, switch project).
