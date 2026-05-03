# Dependency Map

Within scope (all inward-only, all preserved):

- **Phase 1** mutates `boardUseCases.moveTask`. Consumers: `workspaceSlice.taskMoved` (calls `moveTaskUseCase`) and `boardUseCases.moveTaskToAdjacentColumn` (cross-column path with `targetIndex=0`, never the broken same-column path). Verified via Serena `find_referencing_symbols`. Signature unchanged → no consumer ripple.
- **Phase 2 + Phase 3** both touch `workspaceSlice.ts` but **different reducers** (`updateActiveBoard` is a private helper used only by other reducers in the same file; `workspaceImported` is a public reducer). Independent diffs.
- **Phase 4** stays inside `localWorkspaceRepository.ts`; consumers (the bootstrap in `src/main.tsx` / `src/app/store.ts`) use the `WorkspaceRepository` port — unchanged.
- **Phase 5 + Phase 6** both touch `BoardPage.tsx` but **different lines** (`exportData` body at 75–84 vs. `<TaskModal>` JSX at 208). Independent diffs.

Hexagonal layering check (re-run by reviewer/checker per `eslint-plugin-boundaries`): zero new cross-layer imports introduced.
