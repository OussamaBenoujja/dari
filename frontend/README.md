# Darna Frontend Monorepo

A pnpm workspace that houses the Darna operations console, the Tirelire savings companion, and a shared UI kit built with React and Vite (JavaScript only).

## Directory layout

```
apps/
  darna/        # Control room for operations teams
  tirelire/     # Savings experience for households
packages/
  ui-kit/       # Reusable buttons, sections, and stat cards
```

## Requirements

- Node.js 20+
- pnpm (the repo already encodes `pnpm@10.23.0` via `packageManager`)

## Getting started

1. **Install dependencies** (run once):
   ```bash
   pnpm install
   ```
2. **Start a single app**:
   ```bash
   pnpm dev:darna    # Runs Darna on http://localhost:5173
   pnpm dev:tirelire # Runs Tirelire on http://localhost:5174
   ```
3. **Run both apps in parallel** (streams logs from each workspace):
   ```bash
   pnpm dev
   ```

## Quality gates

- **Lint** all workspaces:
  ```bash
  pnpm lint
  ```
- **Format** check / fix with Prettier:
  ```bash
  pnpm format
  pnpm format:fix
  ```
- **Build** both apps:
  ```bash
  pnpm build
  ```

## Shared UI kit

The UI kit is published as the local package `@darna/ui-kit`. Each app consumes it via the workspace alias and Vite resolves it directly from `packages/ui-kit/src` for hot reloading.

To add new primitives:

1. Create the component inside `packages/ui-kit/src/`.
2. Export it through `src/index.js`.
3. Re-run `pnpm lint && pnpm build` inside the consuming app for quick validation.

## Debugging

- `pnpm dev:darna` launches a Vite dev server with React Fast Refresh.
- `pnpm dev:tirelire` launches a second Vite server on port 5174.
- Use your browser devtools or add `console.log` statements; Vite will hot reload automatically.

## Next steps

- Expand the UI kit with form controls once backend APIs are ready.
- Wire the Socket.IO and Keycloak integrations into the respective apps.
