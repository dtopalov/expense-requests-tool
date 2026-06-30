# Expense Requests Tool — Implementation Notes

## Overview

Internal tool for employees to submit expense requests and managers/finance to approve them. Single-page React app with an Express API backend. No database — all data lives in memory, seeded from JSON files.

## Architecture

### Server (`server/`)

- **Express 5** with TypeScript strict mode
- **In-memory store** (`server/store/`) seeded from `data/requests.json` and `data/users.json`
- **Status derived** from last entry in `events[]` — never stored as a field
- **Auth simulated** via `X-User-Id` request header; middleware rejects missing/unknown user IDs
- **Routing logic** (`server/services/routing.service.ts`): builds an ordered *approval chain*. Amounts < $1000 need a single sign-off (manager, or finance when there is no manager); amounts ≥ $1000 need the manager **then** finance, in order. No approver is ever the requester, and the chain never contains duplicates; submission is refused if no eligible approver remains. Edge case: a requester who is themselves a finance user but has a manager routes small expenses to that manager (a valid non-self approver) rather than being refused; large expenses still require a *different* finance approver and are refused when none exists.

Layer responsibilities:
- `models/` — types and hand-rolled validation only
- `store/` — in-memory CRUD, no business logic
- `services/` — all business logic (status transitions, authorization checks, approver routing)
- `routes/` — thin HTTP layer; delegates to services

### Client (`src/`)

- **React 19** with **React Router v7** (declarative component routes defined in `App.tsx`)
- **AuthContext** manages current user; simulates login via a user-switcher in the nav
- All amounts stored as **whole cents** (integer); formatted to display as dollars only in UI
- **Controlled form components** throughout; no form library
- **BEM class names** in a single `src/styles/styles.css` file

Layer responsibilities:
- `api/` — fetch wrappers (sets `X-User-Id` header from stored userId)
- `hooks/` — data-fetching and state (useRequests, useRequest)
- `components/` — reusable UI split by domain: `form/`, `list/`, `request/`, `common/`, `layout/`
- `pages/` — route-level components; thin, delegate to hooks and components

## Key Design Decisions

**Status from events, not a field.** The `status` field on `ExpenseRequest` is derived at read time from the last event type. This avoids status/event desync and makes history the single source of truth. The client type also carries `status` for convenience, populated by the API response.

**Cents for money.** Storing `amountCents: number` (integer) avoids floating-point errors and makes comparisons exact. The `$1000 → finance` threshold is `amountCents >= 100000`.

**No real auth.** `X-User-Id` header is set by the client from `localStorage`. The server validates it against the user store. This is sufficient for a demo; a real app would use sessions or JWTs.

**Server is authoritative.** Client mirrors some validation for UX (e.g. showing the justification field when amount ≥ $1000) but all rules are re-enforced server-side. Server errors always win.

**Multi-step approval via the event log.** Large requests (≥ $1000) require sequential sign-off from the manager and then finance. The approver chain is resolved at submit time and recorded on the `submitted`/`resubmitted` event (`approverChain: string[]`) — the same point-in-time pattern already used for `approverId`, so it survives org changes mid-flight. Each intermediate sign-off appends a `step-approved` event (status stays `Submitted`); the final approval appends `approved`. The *currently pending* approver is derived (`deriveApprovalProgress`) from the chain on the latest submit event minus the sign-offs since, so authorization stays a single "are you the pending approver?" check for both single- and multi-step flows. The UI adds a read-only progress stepper on the detail page and an `n/m` marker on the list; everything else (history timeline, approver-gated actions) generalized for free.

**Server-side sorting and filtering.** The list endpoint accepts a `ListQuery` object — `status`, `search`, `requesterId`, `minAmountCents`, `maxAmountCents`, `sortKey`, `sortDir` — and returns already-sorted, already-filtered data. The client sends the full query state on every relevant change. Search input is debounced (300 ms) in `RequestListPage` via `useDebounce` before the query is dispatched, preventing a network round-trip per keystroke. Sort state is owned by `RequestListPage` and passed down to `RequestGrid` as props; the grid is a purely controlled component.

**Native table elements for the grid.** `RequestGrid` uses `<table role="grid">`, `<thead>`, `<tbody>`, `<tr>`, `<th scope="col">`, `<td>`. Only `role="grid"` is explicit — `<tr>`, `<th>`, and `<td>` carry their ARIA roles implicitly. Column widths are set via `<colgroup>`/`<col>` with `table-layout: fixed`; border, radius, and `overflow: hidden` live on a `.grid-wrap` div wrapper because those CSS properties are unreliable on `<table>` itself. One JSDOM limitation to note: JSDOM does not implement context-sensitive role inheritance, so `<td>` inside `role="grid"` is not resolved as `role="gridcell"` by testing-library — grid cell tests query by `data-grid-row`/`data-grid-col` attributes instead.

## Testing Strategy

- **Server**: Vitest 4 in Node environment. Route integration tests use `supertest`. Service unit tests directly call service functions with in-memory store.
- **Client**: Vitest 4 in jsdom environment. Component tests use `@testing-library/react`. E2E tests render full router trees with `createMemoryRouter` and `initialEntries` to land directly at the target URL without programmatic navigation.
- **Fetch mocking**: `vi.stubGlobal('fetch', mockFetch)` with a hand-written mock in `src/test/mock-fetch.ts`. No MSW — avoids the react-router v7 / jsdom / undici `AbortSignal` incompatibility that arises when MSW intercepts internal router fetches.
- **Known env quirk**: react-router v7 calls `new Request(url, { signal })` using undici's `Request` class, but jsdom's `AbortController` produces a jsdom `AbortSignal`, not an undici one. This causes an unhandled rejection after any programmatic navigation. Suppressed in `src/test/setup.ts` via `process.on('unhandledRejection')` — it does not affect test correctness.

## Running Locally

```bash
npm install
npm run dev        # starts Vite (port 5173) + Express (port 3001) concurrently
npm test           # all 205 tests
npm run test:client
npm run test:server
```

Vite proxies `/api` to `http://localhost:3001` in development.

## Seed Data

`data/users.json` — six users: Alice (employee, reports to Bob), Bob (manager), Carol (finance), Dave (employee, reports to Bob), Eve (manager), Frank (employee, reports to Eve).

`data/requests.json` — a few seed requests in various states (draft, submitted, approved, rejected) owned by Alice, so the default login (Alice) has something to view.
