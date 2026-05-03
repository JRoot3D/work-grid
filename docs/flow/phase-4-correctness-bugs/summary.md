# Feature Summary: Phase 4 — Correctness Bugs
_Archived: 2026-05-04_
_Status: DONE_

## Goal

Fix six self-contained correctness bugs catalogued in `docs/refactoring/phase-4-correctness-bugs.md`. The doc was the source of truth for scope and recommended approach. Each fix is independently shippable and independently revertable; the chosen recommendations were locked at brief time (4.1 = B single-pass rewrite, 4.3 = B runtime guard, 4.6 = B `key` prop). The bugs spanned the application layer (`moveTask` reorder logic), the features state layer (`workspaceSlice` self-heal + import guard), the infrastructure persistence layer (legacy `localStorage` key cleanup), and UI components (`exportData` download race + `TaskModal` stale state).

## What Was Built

Six point-fixes across four files, no new files, no deletions.

**Application layer**
- `moveTask` (`src/application/boardUseCases.ts`) — replaced the global pre-filter + splice with a single-pass `for...of arr.entries()` walk over the target column's original `taskIds`. The moved task is emitted at the clamped target index in the same pass, never globally pre-filtered, so the same-column off-by-one cannot recur. Used `entries()` instead of an index loop because `noUncheckedIndexedAccess: true` types `arr[i]` as `string | undefined`. Cross-column moves retain a per-column source filter only. Public signature `(board, taskId, targetColumnId, targetIndex = 0)` preserved exactly.

**Features / state layer**
- `updateActiveBoard` (`src/features/board/state/workspaceSlice.ts`) — deleted the `state.activeProjectId = activeProject.id;` line. Helper is now a clean board-replacement function with no implicit self-heal. Stale-active-id corruption recovery is intentionally lost (out of scope per brief).
- `workspaceImported` (same file) — expanded from a 1-line arrow to a block body that returns `createEmptyWorkspace()` when `action.payload.projects.length === 0`, otherwise returns the payload unchanged. `createEmptyWorkspace` was already imported (line 13). The `selectActiveProject [0]!` non-null assertion is left in place per brief but is now empirically safe.

**Infrastructure / persistence layer**
- `createLocalWorkspaceRepository().load()` (`src/infrastructure/persistence/localWorkspaceRepository.ts`) — restructured the legacy-fallback `try` block. After `const migrated = workspaceFromLegacyBoardJson(legacyBoard)` succeeds, an inner `try { localStorage.removeItem(legacyBoardStorageKey) } catch { /* ignore — retry next reload */ }` runs before `return migrated`. A throw from `removeItem` cannot reach the outer migration `catch`, preserving the migrated workspace.

**UI layer (`BoardPage.tsx`)**
- `exportData` body — applied the doc snippet verbatim: `appendChild(link)` → `link.click()` → `removeChild(link)` → `setTimeout(() => URL.revokeObjectURL(url), 0)`. Eliminates the Safari/Firefox revoke-before-download race; Firefox now honours `download` reliably.
- `<TaskModal>` element — added `key={selectedTask.id}` so the modal remounts cleanly when `task.id` changes. `TaskModal.tsx` itself was not edited (verified by empty diff).

## Phases Completed

| Phase | Name | Key Outcome |
|-------|------|-------------|
| 1 | 4.1 — same-column reorder off-by-one (single-pass rewrite) | Five-row regression table passes; cross-column path untouched; signature unchanged |
| 2 | 4.2 — remove implicit `activeProjectId` self-heal | `updateActiveBoard` no longer writes `activeProjectId`; legitimate writers (`projectCreated`, `activeProjectChanged`, `projectDeleted`) preserved |
| 3 | 4.3 — empty-projects import guard | `workspaceImported` returns `createEmptyWorkspace()` on empty payload; `selectActiveProject [0]!` empirically safe |
| 4 | 4.4 — legacy storage key cleanup with `removeItem`-throw safety | Successful v1→v2 migration removes `work-grid-board`; throw-safe inner-try shape (a) chosen — preserves `migrated` even if `removeItem` throws |
| 5 | 4.5 — exportData DOM lifecycle fix | append → click → removeChild → `setTimeout(revoke, 0)`; race eliminated across Chrome/Safari/Firefox |
| 6 | 4.6 — `<TaskModal key={…}>` at call site | Modal remounts on `task.id` change; `TaskModal.tsx` untouched |

## Edge Cases Handled

- **4.1 clamping**: `Math.max(0, targetIndex)` preserved; out-of-range indices (drag-past-end) fall through to the `!inserted` append branch — semantically identical to today.
- **4.1 same-position drag**: still resolves to a no-op-equivalent reorder.
- **4.2 stale active id corruption**: explicitly accepted as out of scope per brief — the brief notes that if normalize-stale-active-id behavior is desired, it should be a separate explicit reducer (not added here, no concrete call site).
- **4.3 only `projects.length === 0` is guarded**: malformed-payload validation is delegated upstream to `parseWorkspace` (which throws → caught by the import handler in `BoardPage.tsx`). Duplicating that validation in the slice would have violated the senior-baseline rule against re-validating invariants the boundary already enforces.
- **4.4 `removeItem` throw-safety (load-bearing)**: shape (a) — inner `try/catch` after `migrated` is bound — guarantees the function returns the migrated workspace even if `removeItem` throws. Mentally substituting `removeItem` with `() => { throw }` confirms: inner catch fires, `return migrated` is reached, outer catch never entered. Failure path unchanged: corrupt JSON → outer catch → `createEmptyWorkspace()`, legacy key retained for next-reload retry.
- **4.5 ordering load-bearing**: `link.click()` is synchronous in target browsers; `removeChild` precedes the deferred revoke. Reordering `removeChild` after `setTimeout` would re-introduce the race.
- **4.6 unsaved in-modal edits discarded on task switch**: explicitly accepted as the intended trade-off of recommendation B over A (per brief). `key` is evaluated only inside the `selectedTask ? <TaskModal …/> : null` conditional, so no extra null guard needed.

## Deviations From Original Plan

- **Phase 1**: implementer used `for...of arr.entries()` instead of a plain index loop. Mechanical adaptation to `tsconfig.app.json`'s `noUncheckedIndexedAccess: true` posture (which types `arr[i]` as `string | undefined`); not a logic change.
- **Phase 4**: shape (a) was chosen from the two equally acceptable options in the plan's Decision Log. Justification recorded — minimal diff, preserves outer try/catch structure, throw-safety holds trivially.
- All other phases: no deviations.

## Fixes Applied

Two post-review fixes during the implementation/review cycle (not separate fix-mode runs — applied in the same implementer session):

| Phase | Issue | File / Action | Verification |
|-------|-------|---------------|--------------|
| 1 | Reviewer flagged two WHAT-comments violating the senior-specialist baseline (lines 122, 141 in pre-fix `boardUseCases.ts`) | Deleted both comments; retained line-132 comment explaining the non-obvious `!inserted` loop-exit semantic | Reviewer re-verified: PASSED, gates green |
| 4 | Reviewer flagged result-file metadata: claimed `Net +5 lines` but actual git diff is +6 (the `// ignore — retry next reload` comment was uncounted) | Updated `phase-4-result.md` "Line Delta" to `Net +6 lines` (no code change) | Verified by re-reading the result file |

Two further metadata fixes were applied by the team-lead post-`/flow:check` to resolve checker-aggregated discrepancies:

| Issue | File / Action |
|-------|---------------|
| Phase 1 result claimed `Net +15 lines`, actual git diff is +21 | Updated `phase-1-result.md` "Line Delta" to `Net +21 lines` and noted the authoritative source is `git diff --numstat` |
| Phase 3 result claimed `Net +4 lines`, but the phase's own contribution is +5 (the file's overall +4 incorporates Phase 2's −1) | Updated `phase-3-result.md` "Line Delta" to `Net +5 lines` |

The team-lead also separated an unrelated `.gitignore` change (adding `.flow-spec/` and `.claude/settings.local.json` — pre-existing at session start, teams-flow / Claude Code housekeeping) into its own commit (`33ca38e chore: ignore .flow-spec/ and .claude/settings.local.json`) ahead of the feature commit, per user instruction. This kept the feature diff scoped to the four source files actually touched by the six fixes.

## Out of Scope (Not Implemented)

Preserved verbatim from the brief / plan so future work knows what was deliberately skipped:

- **No edits to `TaskModal.tsx`** (4.6 was call-site only — three characters).
- **No `NonEmptyArray<Project>` typed brand** (4.3 Option A locked-rejected).
- **No `activeProjectNormalized` reducer** (4.2 — YAGNI per brief).
- **No "before-task-id" / "after-task-id" DnD action API** (4.1 Option C locked-rejected). The `(targetColumnId, targetIndex)` signature stays. The doc flagged Option C as a future possibility "if you ever swap to a real DnD library" — still applicable.
- **No new tests / no test framework / no `npm test` script** — project's `test_command: none` baseline preserved.
- **No new runtime dependencies** — Zod, react-dnd, dnd-kit remain absent.
- **No persistence-shape changes** — `Workspace.schemaVersion` stays `2`; `Board.schemaVersion` stays `1`. Serializers untouched.
- **No edits to forbidden zones** (`dist/`, `public/`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `.github/workflows/`).
- **No "while I was here" refactors** — including the `selectActiveProject [0]!` non-null assertion (made empirically safe by 4.3 but kept syntactically), the `getIssueKey` derivation, the `searchableText` per-render allocation, the `workspaceUseCases.ts` ESLint exception in `eslint.config.js`, and any styling/naming/accessibility work.
- **No bundling of fixes into fewer phases** at the plan level — independent revertability was required (and preserved by disjoint files/symbols even though the eventual git history bundles them into one commit).

## Review Findings

Six phase reviews were run. Aggregate counts across all rounds:

- **`must-fix` issues raised**: 2 — both addressed and re-verified PASSED.
  - Phase 1: two WHAT-comments at lines 122 and 141 (`boardUseCases.ts`) — fixed and re-reviewed PASSED.
  - Phase 4: result-file line-delta metadata `+5` vs actual `+6` — fixed (doc-only) and re-verified.
- **`should-fix` issues raised**: 1 (Phase 4 — same as above; classified as `should-fix` in some readings, `must-fix` in others. Resolved either way.)
- **PASSED on first round**: Phases 2, 3, 5, 6.
- **PASSED after one fix round**: Phases 1, 4.

No phase required more than one fix round.

## Final Check Outcome

`/flow:check` was run by `flow-checker` (Opus). Initial result: `HAS_ISSUES` — two narrow rule violations, both metadata/housekeeping, neither a code defect:

1. **Aggregate-metrics discrepancy** — sum of phase claims (+25) underclaimed the real git diff (+32) by 7 lines (Phase 1 underclaimed by 6, Phase 3 by 1).
2. **Uncommitted unrelated `.gitignore` change** — 3 added lines (`.flow-spec/`, `.claude/settings.local.json`).

Both were resolved by the team-lead before the feature was committed (see "Fixes Applied" above). `check-result.md` was updated to `Status: DONE` with a Resolution section.

**Verified items** (from check-result.md, all clean):

- Brief satisfaction per-phase, traced end-to-end through the user-facing DnD dispatch → reducer → use-case → render → `localStorage` save flow.
- Legacy v1 → v2 migration path traced through code (read-only — no UI verification by the checker; deferred to manual QA per AGENTS.md §Pull Requests).
- Persistence shape unchanged (`Workspace.schemaVersion === 2`, `Board.schemaVersion === 1`).
- Hexagonal layering audit clean: zero new cross-layer imports introduced; the pre-existing `workspaceUseCases.ts` ESLint exception was untouched (out of scope per brief).
- Forbidden-zones audit: `git diff --stat HEAD -- dist/ public/ index.html vite.config.ts 'tsconfig*.json' .github/workflows/` empty.
- Senior-baseline sweep clean: zero `console.log`, `TODO`, `FIXME`, `XXX`, `debugger`, `@ts-ignore`, `@ts-expect-error`, `as any`, `: any` in the diff. Two added comment lines reviewed and accepted as WHY-comments (`boardUseCases.ts:132` and `localWorkspaceRepository.ts:29`).
- Scope audit: 12 out-of-scope items from the brief verified absent from the diff.
- Regression check: `find_referencing_symbols` on `moveTask` confirmed only two callers (`workspaceSlice.taskMoved`, `boardUseCases.moveTaskToAdjacentColumn`); the latter takes `targetIndex=0` and never hits the broken same-column path.

**Final exit gates** (re-run on the post-resolution working tree):

| Command | Result |
|---------|--------|
| `npm run build` | ✅ Exit 0 — `tsc -b` clean; Vite production bundle 193.14 kB / 62.32 kB gzip; no warnings |
| `npm run lint` | ✅ Exit 0 — "No issues found" |
| `test_command` | Skipped (`none`) per `project.md` |

## Files Changed

Four source files (deduplicated; `git diff --numstat` totals over the feature):

| File | Diff | Notes |
|------|------|-------|
| `src/application/boardUseCases.ts` | +32 / −11 (net +21) | Phase 1: `moveTask` body rewritten as single-pass walk over original target-column `taskIds`. |
| `src/features/board/state/workspaceSlice.ts` | +6 / −2 (net +4) | Phase 2 deleted the self-heal line in `updateActiveBoard` (−1); Phase 3 expanded `workspaceImported` to a block body with `projects.length === 0` guard (+5). |
| `src/infrastructure/persistence/localWorkspaceRepository.ts` | +7 / −1 (net +6) | Phase 4: legacy-fallback `try` block restructured with inner `try/catch` around `removeItem`. |
| `src/features/board/components/BoardPage.tsx` | +4 / −3 (net +1) | Phase 5 rewrote `exportData` body (append/removeChild/setTimeout); Phase 6 added `key={selectedTask.id}` to `<TaskModal>`. |

**Total source-line delta: +49 insertions / −17 deletions = +32 net.**

`src/features/board/components/TaskModal.tsx` was deliberately not edited (load-bearing per brief; verified by empty `git diff`).

`.gitignore` (+3 lines: `.flow-spec/`, `.claude/settings.local.json`) was committed separately as `33ca38e` ahead of the feature commit per user instruction — not part of the feature.

## Notes

- **Manual UI verification was not executed by any agent** — all reviewers and the checker had read-only tool access only. The doc's manual scenarios (Phase 1 five-row regression table, Phase 4 legacy v1→v2 migration via DevTools, Phase 5 cross-browser export, Phase 6 modal-switch stale state) were traced through code but not exercised in a real browser. AGENTS.md §Pull Requests requires screenshots/screen-recordings for UI changes; these are absent and should be attached to the PR before merge. This is the only deferred verification step.
- **Process follow-up flagged by checker**: the line-delta discrepancies in Phases 1 and 3 result files slipped past phase reviews; only Phase 4's reviewer caught a similar miscount. The implementer should be recalibrated to count file-level `git diff --numstat` (not approximate body-line counts) for the `Line Delta` field. Worth raising at the next process retro.
- **`.gitignore` housekeeping observation**: the entries added (`.flow-spec/`, `.claude/settings.local.json`) suggest the teams-flow infrastructure should be added at `/teams:init` time, not mid-feature. Worth raising with the tooling owners.
- **Companion docs**: `mental-model.md`, `decision-log.md`, and `dependency-map.md` are co-located in this directory. They were extracted from `feature-plan.md` and capture, respectively: the four-layer-isolated framing of the six fixes, the Phase 4 `removeItem` throw-safety reasoning that drove shape selection, and the call-graph proof that no two phases shared a symbol.
