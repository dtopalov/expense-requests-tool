# Expense Requests Tool

An internal expense-request tool: employees file requests, the server routes
them to the right approver based on amount, and managers/finance approve or
reject them. Requests start as drafts, are validated on submit, and move through
an append-only event log from which their status is always derived.

It's a full-stack demo — a React 19 + Vite client talking to an Express 5 API
over a small REST surface — with no database (data lives in memory, seeded from
`data/*.json`). See [NOTES.md](./NOTES.md) for design decisions and tradeoffs.

## Highlights

- **Conditional form** — fields appear/become required based on others (billable
  → client, ≥ $1,000 → justification, type `Other` → reason).
- **Server-side everything** — validation, approver routing, authorization, and
  status all enforced on the server; the client mirrors validation only for UX.
- **Multi-step approval chains** — small amounts need one sign-off; amounts
  ≥ $1,000 need the manager **then** finance, in order.
- **Accessible by hand** — keyboard-navigable grid (W3C APG grid pattern) and a
  custom ARIA listbox dropdown; no UI/form/grid libraries.
- **Tested** — full Vitest suite (client + server) including supertest route
  integration and end-to-end flows.

## Tech stack

- **Client:** React 19, React Router v7, Vite, TypeScript (strict)
- **Server:** Express 5, TypeScript (strict), in-memory stores
- **Tests:** Vitest, @testing-library/react, supertest
- **Auth:** simulated via an `X-User-Id` header (no real auth)

## Project structure

```
expense-requests-tool/
├── data/                 # seed data (users.json, requests.json)
├── server/               # Express API
│   ├── models/           #   types + validation (no side effects)
│   ├── store/            #   in-memory data access
│   ├── services/         #   business logic (routing, lifecycle, authz)
│   ├── routes/           #   thin HTTP layer
│   ├── middleware/       #   auth, error handling, body checks
│   └── __tests__/        #   service + supertest route tests
├── src/                  # React client
│   ├── api/              #   fetch wrappers (in-memory X-User-Id, no localStorage)
│   ├── components/       #   UI by domain: form/ list/ request/ common/ layout/
│   ├── context/          #   AuthContext (simulated login / user switching)
│   ├── pages/            #   route-level components
│   ├── hooks/            #   data-fetching + state hooks
│   ├── models/           #   shared client types + helpers
│   ├── validation/       #   client mirror of server validation
│   ├── styles/           #   single styles.css (BEM)
│   └── __tests__/        #   component, hook, and e2e tests
├── NOTES.md              # design decisions and tradeoffs
└── ai-prompts/           # AI usage notes
```

In development, Vite serves the client on port 5173 and proxies `/api` to the
Express server on port 3001.

## Getting started

```bash
npm install
npm run dev
```

`npm run dev` starts the Vite dev server and the Express API concurrently. Open
the printed local URL (http://localhost:5173) in a browser.

## npm commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the client (Vite, :5173) and server (Express, :3001) together |
| `npm run build` | Type-check + build the client and compile the server to `dist/` |
| `npm run preview` | Preview the production client build locally |
| `npm test` | Run the full test suite once (client + server) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:client` | Run only the client (jsdom) tests |
| `npm run test:server` | Run only the server (node) tests |
| `npm run lint` | Lint all `.ts`/`.tsx` files |
| `npm run lint:fix` | Lint and auto-fix |
| `npm run format` | Format with Prettier |
