# Feature Summary: Phase 3 — Architectural Boundary Restoration
_Archived: 2026-05-03_
_Status: DONE_

## Goal
Restore strict hexagonal layering by removing the UI's direct dependency on `src/infrastructure/persistence/workspaceSerializer.ts`, and add an ESLint guard rail so future PRs cannot reintroduce the violation. After this change, `src/features/board/components/BoardPage.tsx` goes through an application-layer seam (`src/application/workspaceUseCases.ts`) for export/import, and ESLint fails the build on any cross-layer import that points the wrong way.

## What Was Built
- **New application seam** at `src/application/workspaceUseCases.ts` (10 lines) exposing two thin wrappers:
  - `exportWorkspaceAsBlob(workspace: Workspace): Blob` — returns `new Blob([serializeWorkspace(workspace)], { type: 'application/json' })`.
  - `importWorkspaceFromText(text: string): Workspace` — delegates directly to `parseWorkspace(text)` with **no** try/catch, preserving the existing exception-propagation contract for `BoardPage.importData()`.
- **`BoardPage.tsx` decoupled from infrastructure**: import line swapped to `'../../../application/workspaceUseCases'`; `exportData()` and `importData()` updated to call the new wrappers. Surrounding `URL.createObjectURL` / `link.click` / `URL.revokeObjectURL` and the `try/catch/finally` block are unchanged.
- **ESLint boundary guard rail** in `eslint.config.js` (+33 lines): registered `eslint-plugin-boundaries`, declared five layer elements (`domain`, `application`, `infrastructure`, `features`, `app`), enabled `boundaries/element-types` with `default: 'disallow'` and an inward-only allow matrix, plus a per-file override granting `src/application/workspaceUseCases.ts` permission to import from `infrastructure` (the single locked layering exception).
- **Dev-dependency added**: `eslint-plugin-boundaries@^6.0.2` in `package.json`. No new runtime dependencies.

## Phases Completed
| Phase | Name | Key Outcome |
|-------|------|-------------|
| 1 | Application seam + remove UI infra import | New `workspaceUseCases.ts` created; `BoardPage.tsx` no longer imports from `infrastructure/`. Behavior byte-stable. |
| 2 | ESLint boundary guard rail | `eslint-plugin-boundaries` installed + configured. Layer-named lint errors confirmed via regression check; per-file override confirmed load-bearing via inverse check. |

## Edge Cases Handled
- **`parseWorkspace` throws** (`JSON.parse` syntax error or `'Workspace has no valid projects.'`) — propagates through `importWorkspaceFromText` (no try/catch) into `BoardPage.importData()`'s existing `catch (error)` → `setImportError(error.message)` path. Contract preserved.
- **Legacy v1 import payload** — `parseWorkspace`'s existing v1 fallback (`workspaceFromLegacyBoardJson` + `parseBoard` + `createProject('Imported project', …)`) is inherited unchanged through the new wrapper. No additional plumbing.
- **`localWorkspaceRepository.ts` infra→infra import** — left untouched (legitimate within-layer import; brief: "do not change it").
- **`workspaceUseCases.ts` itself imports infrastructure** — the single permitted layering exception, isolated by a file-scoped ESLint override (decision D2).
- **`verbatimModuleSyntax`** — `Workspace` imported via `import type` in the new file, satisfying the strict TypeScript setting.
- **No type-system escape hatches** introduced (`any`, `as`, `!`, `// @ts-*`, `// eslint-disable-*` all absent from the diff).

## Deviations From Original Plan
- **Plan amendment mid-phase 2 (approved by user):** the original `features` allow row was `[domain, application, features]`, omitting `app`. After enabling the rule, lint tripped on 5 legitimate existing imports of the typed Redux pattern (`useAppDispatch`, `useAppSelector`, `RootState`) from `src/app/`. `app` was added to the `features` allow row. Plan file updated to reflect.
- **Plugin version drift:** plan expected `eslint-plugin-boundaries@5.x`; `npm install --save-dev` resolved `@6.0.2`. The v5-style selector syntax remains functional in v6 with a non-fatal deprecation warning. Filed as out-of-scope follow-up.
- **`import/resolver` setting added (not in plan):** `eslint-module-utils/resolve` (transitive dep) returns `undefined` for TypeScript relative imports without it, causing the rule to silently skip all local imports. Added `'import/resolver': { node: { extensions: ['.ts', '.tsx', '.js', '.jsx'] } }` to settings. Minimal and required for correctness — the inverse check during phase 2 caught it.

## Fixes Applied
None — no fix-mode runs were needed. Phase 1 review surfaced one should-fix advisory (smoke-test outcomes had been deferred to the reviewer instead of recorded in `phase-1-result.md`); the implementer recorded them and phase 1 was closed.

## Out of Scope (Not Implemented)
- Moving `parseWorkspace` / `serializeWorkspace` / `parseBoard` / `serializeBoard` into `application/`. **Deferred** per the source doc's "Follow-up (deferred)" section.
- Reducing `infrastructure/persistence/` to pure I/O. **Deferred.**
- Refactoring `localWorkspaceRepository.ts`'s direct serializer imports (still infra→infra; legitimate).
- Adding tests or a test framework. (`test_command: none` unchanged.)
- Changing the persisted JSON format, `Workspace.schemaVersion` (=2), or `Board.schemaVersion` (=1).
- Adding a runtime validation library (Zod, etc.).
- "While I was here" tidy-ups in unrelated files.
- Touching forbidden zones (`dist/`, `public/`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `.github/workflows/`).

## Review Findings
- **Phase 1 review:** PASSED — 1 should-fix advisory (smoke-test recording gap, resolved before phase close). 0 must-fix.
- **Phase 2 review:** PASSED — 0 must-fix, 0 should-fix. Reviewer independently re-executed the regression check and confirmed the layer-named error.

## Final Check Outcome
Status: DONE. All exit gates green:
- `npm run build` — exit 0 (1608 modules, `tsc -b` folded in).
- `npm run lint` — exit 0 ("ESLint: No issues found"; `eslint-plugin-boundaries` v6 deprecation notice is non-fatal).
- `test_command: none` — skipped, not invented.

Verified end-to-end: export click → `exportWorkspaceAsBlob` → Blob download; import file → `importWorkspaceFromText` → `parseWorkspace` → `workspaceImported` dispatch → `store.subscribe` writes `localStorage` → re-render. Error path: malformed JSON → `JSON.parse` `SyntaxError` → propagates to `BoardPage`'s `catch` → renders in `<p className="alert">`.

Independent regression check: re-injecting the violating import in `BoardPage.tsx` produces `error  There is no rule allowing dependencies from elements of type "features" to elements of type "infrastructure"  boundaries/element-types`. Reverted clean.

No regressions. No out-of-scope drift. Persistence shape unchanged. Hexagonal layering audit clean.

## Files Changed
| File | Change |
|------|--------|
| `src/application/workspaceUseCases.ts` | **Created** — 10-line application seam (`exportWorkspaceAsBlob`, `importWorkspaceFromText`). |
| `src/features/board/components/BoardPage.tsx` | Modified — import line + 2 call sites swapped to use the new application functions. |
| `eslint.config.js` | Modified — `eslint-plugin-boundaries` registration, `import/resolver` settings, `boundaries/elements` map, `boundaries/element-types` rule with allow matrix, and per-file override for `workspaceUseCases.ts`. |
| `package.json` | Modified — `eslint-plugin-boundaries@^6.0.2` added under `devDependencies`. |
| `package-lock.json` | Modified — mechanical regeneration (+326 lines for the plugin and its 24 transitive deps). |

**Files explicitly NOT touched** (per brief): `src/infrastructure/persistence/localWorkspaceRepository.ts`, `src/infrastructure/persistence/workspaceSerializer.ts`, any other `src/` file, all forbidden zones.

**Aggregate line delta:** +47 / −3 signal; +326 / 0 mechanical; total +373 / −3.

## Notes
- **Source spec:** `docs/phase-3-architectural-boundary.md` (one of seven sibling phase docs in `docs/`).
- **User-locked decision A** at intake: ESLint enforcement chosen over review-only (option B) — the value of the lint guard compounds across every future PR in the repo.
- **Planner decision D1:** `eslint-plugin-boundaries` chosen over `eslint-plugin-import`'s `no-restricted-paths` for cleaner ESLint 9 flat-config support and layer-named (not path-named) error messages.
- **Planner decision D2:** the `application → infrastructure` exemption is **file-scoped** to `workspaceUseCases.ts` rather than globally relaxing the rule — keeps the layering hole single and visible.
- **Process follow-up (advisory, non-blocking, from `check-result.md`):** UI screenshots not provided in any future PR description. The brief explicitly states behavior is unchanged, so this is advisory only.
- **Out-of-scope follow-up (carry forward):** migrate from deprecated `boundaries/element-types` to `boundaries/dependencies` (v6 preferred name) and from `{ from: 'string' }` to `{ from: { type: 'string' } }` selector syntax. Same semantics, no functional change. Worth scheduling next time `/teams:flow` has slack.
