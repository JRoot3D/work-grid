# Feature Summary: Phase 1 — Dead-Code Removal
_Archived: 2026-05-03_
_Status: DONE_

## Goal
Execute the dead-code sweep specified in `docs/phase-1-dead-code-removal.md` to shrink the codebase surface area before later refactoring phases (phases 2–6 in the same `docs/` series). The change is purely subtractive: delete unused ports, adapters, helper functions, and reducers that have zero callers. No behavior change is observable in the running app.

## What Was Built

Pure deletion sweep across two phases. Cumulative diff: 7 files changed, **+5 / −70 (net −65 lines)**, 2 files removed entirely.

**Phase 1 — persistence-layer cascade** (atomic by build dependency):
- Deleted `src/application/boardRepository.ts` — unused `BoardRepository` port interface.
- Deleted `src/infrastructure/persistence/localBoardRepository.ts` — implemented the unused port via `createLocalBoardRepository`.
- Modified `src/infrastructure/persistence/workspaceSerializer.ts` — removed `exportBoardFromWorkspace` and dropped the now-unused `createEmptyWorkspace` and `serializeBoard` imports (forced by `noUnusedLocals`).
- Modified `src/infrastructure/persistence/boardSerializer.ts` — removed `serializeBoard` (its only callers vanished in this same phase).

**Phase 2 — feature-layer dead-code** (independent, file-local):
- Modified `src/features/board/components/taskColorMeta.ts` — removed the trivial wrappers `getTaskColorValue` and `getTaskColorTintValue`. The underlying `taskColorValues` / `taskColorTintValues` / `taskColorLabels` dictionaries were preserved.
- Modified `src/features/board/components/TaskCard.tsx` — inlined the deleted helpers to direct dictionary indexing (`taskColorValues[task.color]`, `taskColorTintValues[task.color]`); the index is type-safe under `noUncheckedIndexedAccess` because both dictionaries are total `Record<TaskColor, string>`.
- Modified `src/features/board/state/boardSlice.ts` — removed the `RenameProjectPayload` type alias, the `projectRenamed` reducer, the `boardImported` reducer, and both names from the destructured `boardSlice.actions` exports. Alphabetisation of the remaining 13 surviving exports preserved.

Zero new dependencies. Zero type-system escape hatches (`any`, `as any`, `// @ts-ignore`, `// @ts-expect-error`, `!`, `// eslint-disable-*`) introduced. Zero forbidden-zone edits.

## Phases Completed

| Phase | Name | Key Outcome |
|-------|------|-------------|
| 1 | Persistence-layer dead-code cascade | Removed `BoardRepository` port + adapter, `exportBoardFromWorkspace`, `serializeBoard`, plus two forced-fix imports. Atomic because deletions are mutually dependent (`tsc -b` + `noUnusedLocals` would fail mid-phase otherwise). −39 net lines. |
| 2 | Feature-layer dead-code (color helpers + unused reducers) | Removed `getTaskColor{Value,TintValue}` wrappers and inlined to direct `Record` indexing; removed `projectRenamed`/`boardImported` reducers and `RenameProjectPayload` type. −23 net lines. |

## Edge Cases Handled

- **No runtime escape hatches needed.** The deletion of helper functions is replaceable by direct `Record<TaskColor, string>` indexing — total maps never trip `noUncheckedIndexedAccess`. Confirmed by both phase reports and the checker.
- **`parseBoard` preserved.** Still used by `normalizeProject`, `parseWorkspace`, and `workspaceFromLegacyBoardJson`. Not removable despite `serializeBoard` being unused.
- **Persistence backwards compatibility intact.** `parseBoard` / `parseWorkspace` / `workspaceFromLegacyBoardJson` / `serializeWorkspace` / `normalizeProject` and all hand-written type guards (`isRecord`, `isColumnId`, …) untouched. `Workspace.schemaVersion === 2` and `Board.schemaVersion === 1` constants unchanged. The legacy v1 → v2 migration path (`localWorkspaceRepository.load → workspaceFromLegacyBoardJson → parseBoard → createProject`) traced symbolically; byte-identical to the pre-feature state.
- **TaskCard import alphabetisation.** After inlining the helpers the import becomes `import { taskColorTintValues, taskColorValues } from './taskColorMeta';` — alphabetical, matching project style.
- **Action-exports alphabetisation.** Surviving 13 entries in the `boardSlice.actions` destructure (`activeProjectChanged`, `checklistItemAdded`, `checklistItemDeleted`, `checklistItemToggled`, `commentAdded`, `projectCreated`, `projectDeleted`, `taskCreated`, `taskDeleted`, `taskMoved`, `taskMovedToAdjacentColumn`, `taskUpdated`, `workspaceImported`) remain alphabetically ordered.
- **Adjacent feature `TaskColorPicker.tsx` unaffected.** Continues to consume `taskColorValues` and `taskColorLabels` from `taskColorMeta.ts`; only the wrapper functions were removed.

## Deviations From Original Plan

None. Both phase reports state "Out-of-scope follow-ups: None identified." Implementation matched the plan file-for-file.

## Fixes Applied

None. No fix-mode runs were needed; both phase reviews PASSED on first submission.

## Out of Scope (Not Implemented)

Carried forward verbatim from the brief — these were deliberately deferred:

- All work in `docs/phase-2-naming-consistency.md`, `docs/phase-3-architectural-boundary.md`, `docs/phase-4-correctness-bugs.md`, `docs/phase-5-domain-api-cleanups.md`, `docs/phase-6-accessibility.md`.
- Path B for §1.4 — adding rename / import-board UI. Explicitly rejected by the user; reducers were deleted instead.
- Any reformatting, renaming, or refactoring outside the listed deletions and the single-line `TaskCard.tsx` edit. ("While I was here" changes were forbidden.)
- Adding tests or an `npm test` script. `test_command` remains `none` in `.flow-spec/project.md`.
- Any edits to forbidden zones: `dist/`, `public/`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `.github/workflows/`.
- Any new runtime or dev dependencies.

## Review Findings

Both phase reviews returned **PASSED**:

- **Phase 1** — re-ran `npm run build` and `npm run lint` independently (both green); ran all 5 plan-specific grep / `git ls-files` exit criteria (zero matches as expected); ran `find_referencing_symbols` on surviving exports (`parseBoard`, `parseWorkspace`, `serializeWorkspace`, `workspaceFromLegacyBoardJson`) — no orphans. Persistence shape and forbidden zones verified untouched. Minor diff-counting drift in the implementer's report flagged but classified no-correctness-impact.
- **Phase 2** — re-ran both gates independently (green); ran all 7 plan-specific exit criteria; verified `taskColorValues[task.color]` is type-safe without escape hatches; confirmed alphabetisation of the surviving action-exports block; ran `find_referencing_symbols` on `taskColorValues`, `taskColorTintValues`, `boardReducer`, `workspaceImported`, `taskCreated` — all retain live callers.

**Aggregate counts: 0 must-fix, 0 should-fix across both reviews.**

## Final Check Outcome

**Status: DONE.** Verified by checker on 2026-05-03 with `model: opus`.

Re-ran exit gates on a clean tree:

| Gate | Command | Exit code |
|------|---------|-----------|
| `build_command` | `npm run build` (folds in `tsc -b && vite build`) | 0 ✅ |
| `type_check_command` | `tsc -b` (folded into `npm run build`) | 0 ✅ |
| `lint_command` | `npm run lint` (`eslint .`) | 0 ✅ |
| `test_command` | `none` per `.flow-spec/project.md` | n/a |

Build: `1607 modules transformed`, `dist/assets/index-*.js 192.86 kB`. Lint: `ESLint: No issues found`.

Audits performed (all clean):
- Hexagonal layering — `grep -rE "from ['\"]\.\.?/.*infrastructure" src/application src/domain` and the `features` variant: 0 matches.
- Forbidden zones — `git diff --stat HEAD -- dist/ public/ index.html vite.config.ts 'tsconfig*.json' .github/workflows/`: empty.
- Senior-baseline scaffolding sweep — no `console.*`, `debugger`, `TODO`, `FIXME`, `XXX`, commented-out code, or new escape hatches in additions.
- Scope audit against brief's "Out of scope" — confirmed only the 7 listed files changed.
- Persistence-shape contract — domain types and serializer parsers byte-identical to `HEAD~2`.

**No regressions found.** Test count `0 → 0` is expected and not a Known Delta (`test_command: none`).

## Files Changed

| File | Change | Notes |
|------|--------|-------|
| `src/application/boardRepository.ts` | deleted | Unused `BoardRepository` port interface. |
| `src/infrastructure/persistence/localBoardRepository.ts` | deleted | Implemented the unused port via `createLocalBoardRepository`. |
| `src/infrastructure/persistence/workspaceSerializer.ts` | modified | Removed `exportBoardFromWorkspace`; dropped now-unused `createEmptyWorkspace` and `serializeBoard` imports. |
| `src/infrastructure/persistence/boardSerializer.ts` | modified | Removed `serializeBoard` function. |
| `src/features/board/components/taskColorMeta.ts` | modified | Removed `getTaskColorValue` and `getTaskColorTintValue` wrappers; underlying dictionaries preserved. |
| `src/features/board/components/TaskCard.tsx` | modified | Inlined removed helpers to direct `Record` indexing; import re-spelled. |
| `src/features/board/state/boardSlice.ts` | modified | Removed `RenameProjectPayload` type, `projectRenamed` and `boardImported` reducers, and their entries in the destructured action-exports block. |

## Notes

### Process follow-ups recorded by the checker (non-blocking)
- Per-phase `phase-N-result.md` line-delta convention doesn't fully match `git diff --numstat` (in-place edits counted as net-zero rather than `+1/−1`). Aggregate skewed by 3 lines vs. git reality (−62 in phase reports vs. −65 in `git numstat`). Recalibrate phase-result counting to mirror `git diff --numstat` for cleaner reconciliation in future features.
- `phase-2-result.md` reports `boardSlice.ts: −16`; `git numstat` shows `−17`. Substantively correct, off-by-one in the metric.

### Tooling friction observed
- The first attempt at phase-2 implementation stalled on a permission prompt for Serena's `mcp__plugin_serena_serena__replace_content` MCP tool (regex find/replace inside a file). Resolution: respawned the implementer with explicit guidance to prefer the standard `Edit` tool for small file-local changes. Worth pre-allowlisting Serena's symbolic editors in user settings for future runs.

### PR notes
- AGENTS.md §Pull Requests requires screenshots/screen-recordings for UI-visible changes. This feature has zero user-visible behavior changes (deletion-only), so no screenshots are required, but worth calling out in the eventual PR description.

### Commit
- Landed as `a24bddd refactor: remove dead code per phase-1 sweep` on `main`.
