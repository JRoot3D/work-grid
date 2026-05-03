# Phase 1 — Dead-Code Removal

**Risk:** zero
**Estimated effort:** ~10 min
**Goal:** shrink the surface area before refactoring so we don't carry dead
weight into later phases.

## 1.1 Delete the unused `BoardRepository` port and adapter

The store wires `WorkspaceRepository` only. `BoardRepository` is fossilized
scaffolding from the schema-v1 era.

- Delete `src/application/boardRepository.ts`
- Delete `src/infrastructure/persistence/localBoardRepository.ts`
- Verify with `npm run build` — no imports anywhere.

## 1.2 Delete the unused `exportBoardFromWorkspace`

Zero callers anywhere in the codebase.

- Remove the function from `src/infrastructure/persistence/workspaceSerializer.ts:78`.

## 1.3 Inline trivial color getters

`getTaskColorValue` / `getTaskColorTintValue` are one-liner wrappers around a
dictionary lookup. They add no value.

- Delete both from `src/features/board/components/taskColorMeta.ts:33,37`.
- Update the single call site in `src/features/board/components/TaskCard.tsx:5,18`
  to index `taskColorValues[task.color]` and `taskColorTintValues[task.color]`
  directly.

## 1.4 🟡 Decide on `projectRenamed` and `boardImported`

These reducers are exported from `boardSlice.ts` but never dispatched.

**Two paths:**

- **A.** Delete them now → smallest codebase, easy to add back.
- **B.** Ship the matching UI now (rename button next to the project select;
  "Import board into active project" alongside the workspace import).

**Recommendation:** delete now (A). They smell like Codex-generated
speculation. Rename is genuinely useful and can be added in <30 LOC when
actually needed.

If A is chosen:
- Remove the `projectRenamed` and `boardImported` reducers from
  `src/features/board/state/boardSlice.ts:97,147`.
- Remove their exports at `src/features/board/state/boardSlice.ts:155,162`.
- Remove the `RenameProjectPayload` type at line 65.

## Verification

```bash
npm run lint
npm run build
```

Both should pass with no errors. No behavioral change should be observable in
the running app.
