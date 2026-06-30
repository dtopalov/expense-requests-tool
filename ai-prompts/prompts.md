# AI Prompts Used

## Data Models
> "Based on this seed data (users.json and requests.json), define TypeScript
> interfaces for User, ExpenseRequest, RequestValues, and RequestEvent.
> Amount should be stored in cents. Status should be derived from the last
> event type, not stored as a separate field."

## Server Endpoints
> "Design a RESTful API for an expense request system. Actions: create draft,
> update draft, submit (triggers server-side validation and approver routing),
> approve, reject, and resubmit. Auth is faked via X-User-Id header. Include
> error response shape with per-field validation errors."

## Validation Logic
> "Write a validation function for expense request submission. Rules:
> expenseType required (enum), amountCents required (non-negative integer),
> description required, client required when billable is true, extra
> justification required when amount >= $1000, otherReason required when
> type is Other. Return a map of field → error message."

## Approver Routing
> "Implement approver routing: under $1000 goes to requester's manager,
> $1000+ goes to finance. If manager is missing or would be the requester,
> fall back to finance. If finance would also be the requester, refuse
> submission with a clear error. Write unit tests covering all branches."

## Custom Dropdown Component
> "Build a React SelectField component with full keyboard navigation and
> ARIA combobox pattern. Arrow keys navigate, Enter selects, Escape closes.
> On close return focus to trigger. Include aria-expanded and
> aria-activedescendant. Apply classes from styles.css using BEM naming."

## Grid Keyboard Navigation
> "Add ARIA grid pattern to a React table component: arrow key cell nav,
> Enter to navigate to row detail, aria-rowcount and aria-colcount on the
> grid element. Sort cycles through none → ascending → descending → none.
> Only Enter activates sort on column headers; 
> Use roving tabindex at the cell level."

## Amount Range Filter
> "Add a range filter for expense amount with min and max inputs. Both values
> must be non-negative. Include a dedicated Apply button so the filter only
> fires when the user is ready. If only min is entered filter as >=, if only
> max as <=, if both as a range. Validate on the server side via
> minAmountCents/maxAmountCents query params."

## Single Callback Filter Refactor
> "Replace three separate filter state variables and callbacks (onSearchChange,
> onStatusChange, onAmountChange) with a single FilterValues object and one
> onFiltersChange callback. The Clear button must call onFiltersChange once
> so React batches the state update into a single re-render and a single API
> request."

## Dropdown Tab-Close Behavior
> "When the user tabs out of a SelectField (trigger button or option list),
> close the options list without stealing focus back. Natural tab order must
> be preserved — focus must land on the next focusable element, not return
> to the dropdown trigger. Escape should still return focus to the trigger."

## Safari Tab Order Fix
> "All interactive elements (buttons, links) need explicit tabIndex={0} for
> Safari on macOS when the system-level 'Tab highlights each item' setting
> is off. Exception: grid cells use roving tabindex — those must NOT get
> tabIndex={0} unconditionally."

## AI Observations
- Agreed with AI suggestion to derive status from events — single source of
  truth, no sync bugs possible
- Disagreed with AI suggestion to use Zod for validation — hand-rolled
  validation better demonstrates understanding of the rules for the interview
- Modified AI-generated dropdown to return focus to trigger button on close
  (AI missed this focus management step)
- AI initially suggested CSS Modules; went with single styles.css for
  simplicity given the assignment's "minimal styling is fine" guidance
- AI's first attempt at tab-close used `e.key === 'Tab'` inside the listbox
  keydown handler, but that fires before focus moves so it had to call
  `preventDefault()` to stop natural tabbing — wrong. Correct approach:
  `onBlur` + `relatedTarget` on the container div, closing silently only
  when focus leaves the component entirely
- AI repeatedly tried to run failing tests multiple times rather than reading
  the full output first and diagnosing before re-running; required explicit
  instruction to run once, fix, then confirm
- AI proposed three separate filter callbacks which caused three sequential
  API requests on Clear; user identified the batching issue and prompted
  the consolidation into a single FilterValues object
- AI initially rendered the Clear button conditionally (`{hasActive && <button>}`);
  user asked for it to always be visible but disabled — a meaningful UX
  distinction the AI didn't anticipate
- AI missed that `@vitejs/plugin-react@6` (Vite 8 / rolldown) is type-
  incompatible with `vitest@3`'s bundled Vite (rollup-based internal copy);
  temporary fix was `extends: './vite.config.ts'` in the project config to
  avoid importing react() directly in vitest.config.ts. Root fix: upgrading
  to `vitest@4.1` eliminated the bundled Vite entirely — it now resolves the
  project's own Vite as a peer dep, so `plugins: [react()]` can live directly
  in vitest.config.ts with no type clash. Zero test changes were needed;
  all tests passed after a one-command upgrade.