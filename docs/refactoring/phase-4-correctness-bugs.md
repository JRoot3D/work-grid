# Phase 4 — Correctness Bugs

**Risk:** moderate (each step needs care)
**Estimated effort:** varies per step; 4.1 is the largest at ~30 min including
test scenarios
**Goal:** fix the real bugs. Each step is self-contained and could be shipped
independently.

## 4.1 🟡 Fix same-column reorder off-by-one (highest priority)

**File:** `src/application/boardUseCases.ts:105` — `moveTask`.

### The Bug

When source and target are the same column **and** the user drags downward,
the target index becomes off-by-one because the source taskId is filtered out
of all columns before the splice.

**Repro:** column `[A, B, C, D]`, drag `B` and drop it before `D` (index 3).

- After filter: `[A, C, D]` (length 3)
- `splice(3, 0, B)` → `[A, C, D, B]`
- Expected: `[A, C, B, D]`

The bug only manifests when source position < target position in the same
column (i.e., dragging downward).

### Fix Options

**A. Decrement on same-column downward drag.**
Detect `task.columnId === targetColumnId && originalIndex < targetIndex` and
decrement `targetIndex` by 1 before the splice. Smallest diff (~5 lines).

**B. Single-pass rewrite.**
Build the new column from the original (un-filtered) `taskIds`, walking each
index and emitting either the moved task or the existing one. No
remove-then-insert. Most robust, slightly larger (~10 lines).

**C. Explicit "before-task-id" / "after-task-id" semantics.**
Change the action signature from `(targetColumnId, targetIndex)` to
`(targetColumnId, beforeTaskId | null)`. The reducer never deals with shifting
indices. Cleanest API but ripples into `ColumnView`/`TaskCard` drag handlers.

**Recommendation:** **B** for the use case, keep the existing index API.
Single-pass is bug-resistant (no off-by-one class to forget) and doesn't
change call sites. **C** is the "right" long-term answer if you ever swap to a
real DnD library — flag for later.

### Test Scenarios (manual)

After implementing, verify all paths in a single column `[A, B, C, D]`:

| Action | Expected |
|---|---|
| Drag A onto D (downward, far) | `[B, C, D, A]` |
| Drag B onto D (downward, near) | `[A, C, B, D]` ← regression case |
| Drag B onto C (downward, adjacent) | `[A, B, C, D]` (no-op equivalent) |
| Drag D onto A (upward, far) | `[D, A, B, C]` |
| Drag C onto A (upward, near) | `[C, A, B, D]` |

Cross-column moves should remain correct (they were never broken).

## 4.2 Remove the implicit `activeProjectId` self-heal

**File:** `src/features/board/state/boardSlice.ts:73` (or `workspaceSlice.ts`
after Phase 2) — `updateActiveBoard`.

The `state.activeProjectId = activeProject.id` line is a hidden side effect:
in the happy path it's a no-op, in the unhappy path it silently corrects a
stale active id during an unrelated edit.

- Drop the line from `updateActiveBoard`.
- If "normalize stale active id" behavior is genuinely desired, make it a
  separate explicit reducer `activeProjectNormalized`, called from
  `workspaceImported` and `projectDeleted` only.

## 4.3 🟡 Add a `NonEmptyArray<Project>` guard

**File:** `src/domain/board.ts` (type) and/or
`src/features/board/state/boardSlice.ts` (runtime guard).

`selectActiveProject` does `state.workspace.projects[0]!` — relying on a
nowhere-enforced invariant.

**Two options:**

- **A. Typed brand:** `type Workspace = { ...; projects: [Project, ...Project[]] }`.
  Stricter but viral — every spread has to satisfy it.
- **B. Runtime guard in `workspaceImported`:** if payload has zero projects,
  fall back to `createEmptyWorkspace()`. Pragmatic, localized.

**Recommendation:** **B**. Pragmatic for the size of this codebase.

## 4.4 Clean up legacy storage key on migration

**File:** `src/infrastructure/persistence/localWorkspaceRepository.ts:24`.

After a successful migration via `workspaceFromLegacyBoardJson(legacyBoard)`,
call `localStorage.removeItem(legacyBoardStorageKey)` so the legacy key
doesn't shadow forever.

Place the removal **only** on the success path inside the `try` block, after
the workspace is parsed.

## 4.5 Fix `URL.revokeObjectURL` race

**File:** `src/features/board/components/BoardPage.tsx:84` — `exportData`.

Two issues today:

1. The `<a>` is never appended to `document.body` — works in modern browsers
   but isn't guaranteed.
2. `URL.revokeObjectURL(url)` is called immediately after `link.click()`,
   racing with the download in some browsers.

Fix:

```ts
const exportData = () => {
  const blob = exportWorkspaceAsBlob(workspace); // assumes Phase 3 done
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `work-grid-workspace-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
```

## 4.6 Reset `TaskModal` form state on `task.id` change

**File:** `src/features/board/components/TaskModal.tsx`.

Local state is initialized once with `useState(task.title)`. If the task prop
changes while the modal is open, form values go stale.

**Two options:**

- **A.** Add `useEffect(() => { setTitle(task.title); /* etc */ }, [task.id])`.
- **B.** Add `key={selectedTask.id}` to the `<TaskModal>` element in
  `BoardPage.tsx:209`. React remounts the component cleanly.

**Recommendation:** **B**. Three characters of code, zero new code paths.

## Verification

```bash
npm run lint
npm run build
npm run dev
```

Manual checks:
- Reorder scenarios from 4.1 table.
- Export → file downloads cleanly in Chrome, Safari, Firefox.
- Open task A's modal, dispatch external update via Redux DevTools, verify
  form syncs (4.6).
