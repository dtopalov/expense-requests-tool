# CLAUDE.md

## Project Overview
Expense Requests craft demo. Vite-scaffolded React app with an Express server
in `server/`. Single `package.json`, single `vitest.config.ts` with two
projects (client + server).

## Tech Stack
- Node 24+, Express 5 (latest), TypeScript strict mode
- React 19, Vite (latest), React Router v7
- Vitest for all tests; @testing-library/react; MSW for API mocking in client tests
- supertest for server route integration tests
- No database — in-memory stores seeded from data/*.json
- Single styles.css with BEM class names (no CSS Modules, no CSS-in-JS)

## Architecture Rules
- Server is the source of truth: validation, status transitions, approver
  routing, authorization all live on the server
- Client mirrors validation only for UX; server errors always win
- Status is derived from the last event type in events[] — never stored separately
- Auth simulated via X-User-Id request header; no real auth
- Amount always stored as whole cents (integer); formatting is display-only
- Vite proxies /api to http://localhost:3001 in dev

## Code Style
- TypeScript strict mode everywhere
- No `any` — use proper types or `unknown`
- Named exports only (no default exports except page components)
- `function` declarations for components, not arrow functions
- Files < 200 lines; extract when larger
- All form components are controlled
- Explicit return types on all exported functions
- `import type` for type-only imports (verbatimModuleSyntax)

## CSS
- Single file: src/styles/styles.css
- Structure: reset → custom properties → base elements → BEM component classes
- Class names applied as plain strings in JSX — no CSS Modules, no cn() utility
- Status colors as CSS custom properties (--color-status-draft, etc.)

## Testing
- Every server service and route has tests
- Every client component with logic has tests
- Use server/__tests__/helpers/test-factory.ts for test data builders
- E2E tests use MSW handlers, not real server
- `npm test` runs all; `npm run test:server` / `npm run test:client` run subsets
- **Every code change must be accompanied by test updates in the same pass**: add tests for new behavior, update tests broken by changes, remove tests for deleted behavior — never leave tests lagging behind code

## Directory Conventions
- server/models/       — types and validation only, no side effects
- server/store/        — in-memory data access
- server/services/     — business logic
- server/routes/       — HTTP layer, thin (delegate to services)
- src/components/      — reusable UI; form/, list/, request/, common/
- src/pages/           — route-level components
- src/hooks/           — data-fetching and state hooks
- src/api/             — fetch wrappers

## Key Business Rules
- Draft save: no validation
- Submit: all conditional validations enforced server-side
- Routing: <$1000 → manager; ≥$1000 → finance; fallback to finance if no
  manager or manager === requester; refuse if finance === requester
- Only owner can edit/submit; only assigned approver can approve/reject
- events[] is append-only; status derived from last entry

## Accessibility
- Custom dropdowns: combobox/listbox pattern (aria-expanded, aria-activedescendant)
- Grid: aria-grid pattern (arrow key cell nav, aria-rowcount, aria-colcount)
- Errors linked via aria-describedby
- Status changes via aria-live="polite"
- Color never sole indicator — always paired with text or icon

## Grid Keyboard Pattern (W3C APG)
- Roving tabindex at cell level — only the active `[row, col]` cell gets `tabIndex=0`
- Arrow keys navigate between cells; tab moves focus in/out of the grid
- `Enter` activates interactive cells (sort on column headers, open on detail buttons)
- `Space` is reserved for selection — do NOT use it for sort or navigation actions
- Column sort cycles: none → ascending → descending → none (three-state)
- All data columns are sortable; the Details action column is not
- Event delegation: one `onKeyDown`, `onFocus`, `onClick` on the grid container;
  cells identify via `data-grid-row`/`data-grid-col`; detail buttons add `data-navigate-id`;
  sortable headers add `data-sort-key`

## Don't
- Don't install a form library (react-hook-form, formik, etc.)
- Don't install a UI component library (MUI, Chakra, shadcn, etc.)
- Don't install a data grid library
- Don't add a database or any external storage
- Don't use CSS Modules or styled-components
- Don't put business logic in route handlers — delegate to services
- Don't let the client set status, requesterId, or approverId
