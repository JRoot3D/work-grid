# Mental Model

Six independent point-fixes with zero shared blast radius. Mentally:

- **4.1** is a *pure-function* fix (use case layer): replace remove-then-insert with single-pass rewrite. Same-column off-by-one disappears because the moved task is never globally pre-filtered out — it's emitted in its new slot during a single walk over the original `taskIds`.
- **4.2** is a *side-effect removal* (slice layer): `updateActiveBoard` becomes a clean board-replacement helper. Stale `activeProjectId` is no longer auto-fixed by unrelated edits — corruption-recovery is explicitly out of scope.
- **4.3** is a *boundary guard* (slice layer): one runtime check at the import-action boundary mirrors the graceful-degradation pattern in `parseWorkspace`/`parseBoard`. The `selectActiveProject [0]!` assertion stays syntactically (out of scope to remove) but becomes empirically safe.
- **4.4** is a *storage cleanup* (infrastructure layer): one legacy-key delete on the migration success path. Throw-safety on `removeItem` is the load-bearing detail.
- **4.5** is a *DOM lifecycle* fix (UI layer): append → click → remove → deferred revoke. Doc snippet applied verbatim.
- **4.6** is a *React identity* fix (UI layer, call-site only): `key={task.id}` forces remount when the modal swaps tasks, resetting `useState` initial values cleanly. The internal `TaskModal` component is intentionally untouched.

The four hexagonal layers (`application`, `infrastructure`, `features`, plus the slice within `features/state`) are each touched in isolation; no phase crosses a boundary, no phase's diff overlaps another's symbol.
