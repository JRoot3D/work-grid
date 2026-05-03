# work-grid Fix Plan

Step-by-step plan to address issues found during the deep code review of the
codebase. Phases are ordered by risk (lowest first) and dependency (earlier
work unblocks later).

Each phase is independently shippable: the code compiles, lints, and works at
every checkpoint.

## Phases

1. [Phase 1 — Dead-Code Removal](./phase-1-dead-code-removal.md)
2. [Phase 2 — Naming Consistency](./phase-2-naming-consistency.md)
3. [Phase 3 — Architectural Boundary Restoration](./phase-3-architectural-boundary.md)
4. [Phase 4 — Correctness Bugs](./phase-4-correctness-bugs.md)
5. [Phase 5 — Domain & API Cleanups](./phase-5-domain-api-cleanups.md)
6. [Phase 6 — Accessibility](./phase-6-accessibility.md)

## Suggested Execution Order

Ship in this order — each PR is small, tested, and unlocks the next:

1. **PR 1:** Phase 1 (dead code) + Phase 2 (rename). Pure cleanup.
2. **PR 2:** Phase 3 (boundary restoration + ESLint guard).
3. **PR 3:** Phase 4.1 (the reorder bug fix) — ship alone since it's the only behavior-changing fix.
4. **PR 4:** Phase 4.2–4.6 (the small bug batch).
5. **PR 5:** Phase 5 (domain cleanups), with Phase 5.1 (Result type) potentially split out as its own PR since it changes the use-case contract.
6. **PR 6+:** Phase 6 (a11y) — slice into per-modal and DnD PRs.

## Open Decisions

The following items need a call before implementation. Items marked 🟡 in the
phase docs surface here:

| # | Phase | Question | Recommendation |
|---|---|---|---|
| 1 | 1.4 | Delete `projectRenamed`/`boardImported` or build the UI? | Delete now |
| 2 | 2.2 | Move slice directory to `features/workspace/`? | Leave as-is |
| 3 | 3.3 | Adopt `eslint-plugin-boundaries`? | Yes |
| 4 | 4.1 | Reorder fix algorithm (decrement / single-pass / before-id)? | Single-pass |
| 5 | 4.3 | `NonEmptyArray` brand or runtime guard? | Runtime guard |
| 6 | 5.1 | Use-case error semantics (throw / Result / silent)? | Result type |
| 7 | 5.6 | Search canonical text or rendered text? | Rendered text |
| 8 | 6.1 | Modals: hand-roll, Radix, or react-aria? | Hand-roll for now |
| 9 | 6.2 | Keyboard DnD: dnd-kit or minimal shortcuts? | Minimal first, dnd-kit later |
