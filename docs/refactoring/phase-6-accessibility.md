# Phase 6 — Accessibility

**Risk:** medium (larger surface; behavioral changes)
**Estimated effort:** ~2-4 hours total; easy to ship in slices
**Goal:** bring the modals and DnD up to WCAG basics. This is the longest
phase and the right place to pause for design decisions before writing code.

## 6.1 🟡 Modal: Esc to close + focus trap + focus restore

`ConfirmModal`, `CreateProjectModal`, `CreateTaskModal`, `TaskModal` all close
on backdrop click but:

- ignore the Escape key
- don't trap focus on Tab
- don't restore focus to the trigger element on close

`role="dialog" aria-modal="true"` already promises this contract; the code
doesn't deliver it.

**Three options:**

- **A. Hand-roll a `useModal()` hook** (~40 LOC). Capture trigger element,
  trap focus on Tab/Shift+Tab, listen for Escape, restore focus on unmount.
  Apply to all four modals.
- **B. Adopt `@radix-ui/react-dialog`.** Production-grade primitives,
  ~5 LOC per modal, but adds a dependency.
- **C. Adopt `react-aria-components`.** Similar to Radix, different
  flavor.

**Recommendation:** **A** for now. Small, you learn the patterns, can swap to
Radix later if accessibility scope grows. But if you're already planning to
add a UI library, do **B** and skip the throwaway hook.

### Hand-roll sketch

```ts
// src/features/board/components/useModal.ts
export function useModal(onClose: () => void) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') trapFocus(containerRef.current, e);
    };

    document.addEventListener('keydown', onKey);
    containerRef.current?.querySelector<HTMLElement>(
      '[autofocus], input, button, select, textarea',
    )?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      trigger?.focus();
    };
  }, [onClose]);

  return containerRef;
}
```

Apply via `<section ref={useModal(onClose)} ...>` in each modal. `trapFocus`
finds first/last focusable elements in the container and wraps Tab.

## 6.2 🟡 Keyboard DnD

Today drag-and-drop is mouse-only. Keyboard users cannot reorder tasks.

**Two options:**

- **A. Add `@dnd-kit/core` + `@dnd-kit/sortable`** (~150 LOC change in
  `ColumnView`/`TaskCard`). First-class keyboard support, screen-reader
  announcements, accessible by default.
- **B. Add minimal keyboard shortcuts** on focused cards using the existing
  `taskMovedToAdjacentColumn` action — no library, but no live drag
  preview. ~20 LOC.

**Recommendation:** **B** as a stop-gap; **A** as a follow-up when there's
appetite for a real DnD overhaul.

### Stop-gap (option B) sketch

In `TaskCard.tsx`, add `onKeyDown`:

```ts
const handleKeyDown = (event: React.KeyboardEvent) => {
  if (event.key === 'ArrowLeft' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    onMoveAdjacent(-1);
  } else if (event.key === 'ArrowRight' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    onMoveAdjacent(1);
  }
};
```

Wire `onMoveAdjacent` through `ColumnView` to dispatch
`taskMovedToAdjacentColumn` from `BoardPage`. Document the shortcut in the
card's `aria-label` or a tooltip so screen-reader users discover it.

## Verification

Per-modal manual checks:
- Tab/Shift+Tab cycles only inside the modal.
- Escape closes the modal.
- After closing, focus returns to the button that opened it.
- Screen reader announces the modal title (`aria-labelledby` already set).

Per keyboard-DnD checks:
- Focus a card with Tab.
- Cmd/Ctrl + Arrow Left/Right moves it across columns.
- Screen reader announces the new column.

## Slicing for PRs

This phase is the biggest. Suggested split:

- **PR 6a:** `useModal` hook + apply to `ConfirmModal` only (smallest blast
  radius, easiest review).
- **PR 6b:** Apply `useModal` to the remaining three modals.
- **PR 6c:** Keyboard shortcuts for adjacent-column moves.
- **PR 6d (deferred):** Full `@dnd-kit` migration.
