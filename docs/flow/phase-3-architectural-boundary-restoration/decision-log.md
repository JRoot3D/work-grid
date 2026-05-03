# Decision Log

## D1. ESLint plugin: `eslint-plugin-boundaries` (over `eslint-plugin-import`'s `no-restricted-paths`)
- **Decided:** `eslint-plugin-boundaries` v5.x.
- **Alternative considered:** `eslint-plugin-import`'s `no-restricted-paths` rule.
- **Why this won:** `eslint-plugin-boundaries` v5 ships first-class ESLint 9 flat-config support, models layers as named "elements" (not raw path globs at the rule site), and emits errors of the form `'<features>' is not allowed to import '<infrastructure>'` — directly satisfying the brief's "clear, layer-named error message" criterion. `eslint-plugin-import` historically struggles with ESLint 9 flat config (the `eslint-plugin-import-x` shim is the usual workaround) and emits path-based errors that are less self-documenting under refactors.

## D2. `application → infrastructure` exemption: file-scoped to `src/application/workspaceUseCases.ts`
- **Decided:** Per-file ESLint override on exactly one file.
- **Alternative considered:** Globally relax the `application → infrastructure` rule.
- **Why this won:** the source doc frames the seam as a "temporary layering compromise" with a deferred follow-up to push parsers into `application/`. A file-scoped override keeps the layering hole single and visible — any new infra import elsewhere in `application/` will fail lint, forcing an explicit decision rather than silent expansion. A global allow-rule would defeat half the guard rail's value.
