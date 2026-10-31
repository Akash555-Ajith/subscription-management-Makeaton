# main.html → React conversion

Source: `main.html`, commit `2f44d95` (Amal Babu). The HTML is retained unchanged for comparison.

The default Vite entry now renders React components in `src/brightloop/`:
- `Auth.jsx`: login, demo autofill, role-specific signup, validation and location capture.
- `entry.jsx`: role navigation, dashboard, tables, CRUD dialogs, payments, reports, settings and rules.
- `model.js`: original seed, entities, validation rules, status calculation and navigation definitions.
- `workspace.css`: original layout with an always-light creamy white / warm brown palette.

React state and JSX replace HTML-string rendering and inline handlers. No iframe, runtime HTML parser, eval, or dangerouslySetInnerHTML is used. Existing `bl_v2` localStorage and `bl_s` sessionStorage keys are retained. The previous API-backed React entry is preserved at `/legacy`; `/pay/:token` still uses that entry.

## Preserved behavior

Admin: Dashboard, Products, Plans, Subscriptions, Invoices, Payments, Taxes, Discounts, Customers, Staff, Reports, Rules, Settings.
Employee: My Work, Customers, Subscriptions, Quotations, Invoices, Payments, Overdue, Reports, Rules.
Client: Portal Overview, My Subscriptions (including cancel), My Invoices (including payment), My Payments, Rules.

The original forms, defaults, validation, search/status filters, delete dependency checks, audit entries, charts, partial payment balances, modal Escape/backdrop dismissal and mobile navigation are carried over.

## Source limitations retained for feature parity

This upload is a browser-local demo; it does not use the API database or a hosted payment gateway. Its Razorpay option records a local payment. Authentication and credentials are stored in browser storage, and signup permits choosing an administrator. The reporting reference date remains 2026-10-31. The original Employee demo autofill uses EMP001, but the seeded user lacks an empid field; the seeded employee can sign in with staff@brightloop.com / Staff@123. These are existing behaviors, not new backend integrations or production security claims.

`npm run build` checks the React production bundle. `npm test` includes source-comparison tests for seed records, statuses, role menus, entity definitions, pricing, validation and delete dependencies.
