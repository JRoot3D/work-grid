# Repository Guidelines

## Project Structure & Module Organization

This is a Vite React + TypeScript application. Runtime code lives in `src/`:

- `src/app/` contains Redux store setup and typed hooks.
- `src/domain/` holds core board domain models and logic.
- `src/application/` defines use cases and repository contracts.
- `src/infrastructure/persistence/` implements local persistence and serializers.
- `src/features/board/` contains board UI components and Redux state.
- `src/styles/main.scss` contains global styles.
- `dist/` is build output and should not be edited by hand.

## Build, Test, and Development Commands

- `npm run dev` starts the Vite development server.
- `npm run build` runs TypeScript project checks with `tsc -b` and creates a production build.
- `npm run lint` runs ESLint across the project.
- `npm run preview` serves the production build locally for verification.

There is no test script configured yet. When adding tests, also add the corresponding `npm test` script.

## Coding Style & Naming Conventions

Write TypeScript with ES modules, functional React components, and typed Redux hooks. Use two-space indentation, single quotes, and trailing commas where surrounding code does.

Name React components and component files in `PascalCase`, such as `TaskCard.tsx`. Name hooks with a `use` prefix. Keep business logic in `src/domain/` and browser storage details under `src/infrastructure/`.

Run `npm run lint` before handing off changes. ESLint uses `@eslint/js`, `typescript-eslint`, React Hooks rules, and React Refresh checks.

## Testing Guidelines

No testing framework is currently installed. For future coverage, prefer colocated tests named `*.test.ts` or `*.test.tsx`, or `src/**/__tests__/` when a feature needs fixtures.

Prioritize tests for `src/domain/`, serializers in `src/infrastructure/persistence/`, and Redux state in `src/features/board/state/`. UI tests should cover user-visible board flows rather than implementation details.

## Commit & Pull Request Guidelines

Git history is not available in this checkout, so no existing convention can be inferred. Use short imperative commit messages, optionally scoped, for example `board: add task color picker`.

Pull requests should include a concise description, the reason for the change, manual verification steps, and screenshots or screen recordings for UI changes. Link related issues when available, and call out any changes to persistence formats or local storage behavior.

## Agent-Specific Instructions

Keep edits scoped to source files and configuration needed for the task. Do not modify `dist/` unless the user explicitly asks for generated build artifacts. When changing behavior, verify with `npm run lint` and `npm run build` when practical.
