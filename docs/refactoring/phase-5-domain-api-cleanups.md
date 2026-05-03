# Phase 5 — Domain & API Cleanups

**Risk:** low
**Estimated effort:** ~45 min total; 5.1 is the largest at ~30 min
**Goal:** tighten the use case contracts and remove the smaller smells.

## 5.1 🟡 Decide use-case error semantics

**Files:** `src/application/boardUseCases.ts` — `createTask`, `updateTask`,
`addComment`, `addChecklistItem`.

Today these silently return the unchanged board on bad input:

```ts
if (!title) { return board; }
```

The dispatcher has no way to know the operation failed. Today the
`<input required>` saves you, but the use cases speak the wrong vocabulary —
they're not really pure transformations, they're "best effort" mutators.

**Three options:**

- **A. Throw `DomainError` — caller must catch.**
  Clear failure signal. Forces the slice to handle errors but creates noise
  in reducers (try/catch in immer producers is awkward).
- **B. Return a Result type:** `{ board, ok: boolean, reason?: string }`.
  Forces the slice to face failure without exception machinery. Clean upgrade
  path when toasts/error UI arrive.
- **C. Keep as-is** and rely on form-level `required`.

**Recommendation:** **B**. Codex-style "best effort" mutators hide failure;
a Result type forces the slice to face it. Slice can ignore `ok=false`
(matching today's behavior) and we get a clean upgrade path.

This is a **design choice you should own** — it sets the tone for the whole
application layer. Worth a short discussion before writing code.

### Sketch (option B)

```ts
export type UseCaseResult = { board: Board; ok: boolean; reason?: string };

export function createTask(board: Board, input: CreateTaskInput): UseCaseResult {
  const title = input.title.trim();
  if (!title) return { board, ok: false, reason: 'Title is required' };
  // ...build new task...
  return { board: nextBoard, ok: true };
}
```

Slice consumes only `result.board`; `ok`/`reason` are available for future
UI. Migrate use cases one at a time.

## 5.2 Refactor `parseBoard` to avoid JSON round-trip

**File:** `src/infrastructure/persistence/boardSerializer.ts`.

Today `workspaceSerializer.ts:22` does:

```ts
board: parseBoard(JSON.stringify(value.board)),
```

Stringifying-then-parsing inside a parser is wasteful and a smell.

**Refactor into:**

- `parseBoardObject(value: unknown): Board` — validates an already-parsed
  object. The actual core.
- `parseBoardJson(json: string): Board` — `JSON.parse` then `parseBoardObject`.
  Thin wrapper for callers with a string.

Then in `workspaceSerializer.ts`:

```ts
board: parseBoardObject(value.board),
```

No round trip. ~15 lines moved.

## 5.3 Hoist shared `isRecord` and schema constants

`isRecord` is defined identically in `boardSerializer.ts:16` and
`workspaceSerializer.ts:4`.

- Create `src/infrastructure/persistence/typeGuards.ts` exporting `isRecord`.
- Import from both serializers; delete the duplicates.

Schema versions are scattered magic literals (`schemaVersion: 1`,
`schemaVersion: 2`).

- In `src/domain/board.ts` (or a new `src/domain/schema.ts`), add:
  ```ts
  export const BOARD_SCHEMA = 1 as const;
  export const WORKSPACE_SCHEMA = 2 as const;
  ```
- Reference these constants in `Board['schemaVersion']`,
  `Workspace['schemaVersion']`, and in both serializers' validation checks.

## 5.4 Persistence dedup in `store.subscribe`

**File:** `src/app/store.ts:16`.

Today every dispatch calls `workspaceRepository.save(...)`, even when the
workspace reference didn't change (e.g., a rejected `taskCreated` from an
empty title).

```ts
let lastWorkspace = store.getState().workspace;
store.subscribe(() => {
  const next = store.getState().workspace;
  if (next !== lastWorkspace) {
    lastWorkspace = next;
    workspaceRepository.save(next);
  }
});
```

RTK + Immer preserves references for unchanged sub-trees, so the identity
check short-circuits cheaply.

## 5.5 Replace `PriorityIcon` ternary chain with a Record

**File:** `src/features/board/components/PriorityIcon.tsx:10`.

Today:

```ts
const Icon =
  priority === 'highest' ? ChevronsUp
  : priority === 'high' ? ChevronUp
  : priority === 'medium' ? Equal
  : priority === 'low' ? ChevronDown
  : ChevronsDown;
```

Replace with a `Record<Priority, LucideIcon>` map. Mirrors the existing
`priorityLabels` style and reads in three lines.

## 5.6 🟡 Decide search semantics

**File:** `src/features/board/components/BoardPage.tsx:25` —
`taskMatchesSearch`.

Today the function mixes raw enum (`'highest'`) with formatted labels
(`taskColorLabels[task.color]`). It also omits the column title.

**Two options:**

- **A. Search canonical text** (what's stored in the model).
- **B. Search rendered text** (what the user sees on the card).

**Recommendation:** **B**. The user types what they see.

Implementation:
- Replace `task.priority` with `priorityLabels[task.priority]`.
- Add the column title — look it up from
  `board.columns.find((c) => c.id === task.columnId)?.title`.
- Keep `taskColorLabels[task.color]` as-is (already rendered text).

## Verification

```bash
npm run lint
npm run build
```

Targeted checks:
- 5.1: existing flows still work (slice ignores `ok=false`).
- 5.2: import a workspace JSON; no behavior change.
- 5.4: open Redux DevTools, dispatch an action that returns the same state
  (e.g., `taskCreated` with empty title) — `localStorage` should not be
  written. Verify with `localStorage.setItem` spy or Chrome DevTools
  Application tab.
