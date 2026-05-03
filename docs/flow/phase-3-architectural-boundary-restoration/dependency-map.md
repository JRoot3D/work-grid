# Dependency Map

This feature crosses three layers (`features` → `application` → `infrastructure`) and modifies the build/lint tooling, so the cross-layer wiring is worth persisting.

- **`src/features/board/components/BoardPage.tsx`** (UI)
  - Currently imports → `src/infrastructure/persistence/workspaceSerializer` _(violation removed in phase 1)_
  - After phase 1 imports → `src/application/workspaceUseCases` _(new)_
- **`src/application/workspaceUseCases.ts`** (new application seam)
  - Imports → `src/domain/board` (type only) — invariant-compliant.
  - Imports → `src/infrastructure/persistence/workspaceSerializer` — the single permitted layering exception, enforced by file-scoped ESLint override (D2).
- **`src/infrastructure/persistence/workspaceSerializer.ts`** (untouched)
  - Still consumed by `src/infrastructure/persistence/localWorkspaceRepository.ts` (infra→infra; legitimate; out of scope).
- **`eslint.config.js`** (build/lint tooling)
  - New runtime dep on `eslint-plugin-boundaries`.
  - Path globs reference all five layer roots: `src/{domain,application,infrastructure,features,app}/**`.
  - Per-file override pinned to `src/application/workspaceUseCases.ts`.
