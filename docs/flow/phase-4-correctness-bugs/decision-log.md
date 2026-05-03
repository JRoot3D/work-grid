# Decision Log

## Phase 4 (4.4) sequencing — `removeItem` throw-safety

The doc says "place removal inside the `try` block on the success path". The brief's edge case says "a throw from `removeItem` must not cause the function to return `createEmptyWorkspace()` instead of the just-migrated workspace". A naive read of the doc — `try { migrated = …; removeItem(…); return migrated; } catch { return empty; }` — violates the brief: a `removeItem` throw lands in the same `catch` and returns `empty`. The plan therefore prescribed a structure where the migration result is bound first and the cleanup is guarded so a `removeItem` throw cannot corrupt the success return. Two acceptable shapes (implementer's choice, both satisfy the brief):

- **(a)** Inner try around `removeItem` that swallows-and-continues, inside the outer `try`.
- **(b)** Two sequential `try` blocks: outer covers the migration (catch → empty); a second covers `removeItem` (catch → ignore, retry-on-next-load).

Either was fine; both required justification in `phase-4-result.md` per implementer rules. Doc + brief reconciled: doc's "success path inside try" means *logically gated on migration success*, not "co-located in the same `catch` scope".

**Chosen: shape (a).** Justification recorded by the implementer: minimal diff — the outer try/catch structure is preserved unchanged; only the migration call is split from the return and a single inner guard is added. The throw-safety invariant holds trivially: the inner `catch` catches any `removeItem` throw, execution falls through to `return migrated`, and the outer `catch` is never entered.

**Reviewer reasoning check:** mentally replace `localStorage.removeItem` with `() => { throw new Error(); }` → inner `catch` fires → `return migrated` is still reached → function returns the migrated workspace, not `createEmptyWorkspace()`. ✅
