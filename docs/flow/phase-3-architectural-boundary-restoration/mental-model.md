# Mental Model

**Hexagonal layering, inward-only:**
```
domain          (no deps)
   ↑
application     (depends on domain; defines ports)
   ↑                    ↑
features / app          infrastructure  (implements application ports)
```
Any import arrow that points downward in this diagram (e.g. `features → infrastructure`, or `application → infrastructure` outside the named seam) is a layering violation. The single permitted exception in this feature is `src/application/workspaceUseCases.ts → src/infrastructure/persistence/workspaceSerializer.ts`, which is a temporary seam acknowledged in the source doc's "Follow-up (deferred)" section.

After this feature: the hexagonal layering invariant is enforced by ESLint, not just convention. The reviewer/checker can rely on `npm run lint` to catch inward-violating drift.
