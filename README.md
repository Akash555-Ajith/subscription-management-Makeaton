# Cycvera Software

React + Vite, Node 24, SQLite, Razorpay TEST checkout, invoice PDFs and SMTP reminders.

## Start locally

1. Install Node 24 or newer and run `npm install`.
2. Copy `.env.example` to `.env`. Keep secrets out of Git.
3. Run `npm run db:seed` only on an empty database for demonstration data (60 customers and 540 invoices). Existing data is preserved by additive migrations.
4. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD` and optionally `ADMIN_NAME` in .env. Password must have 9-128 characters including uppercase, lowercase and a special character. Run `npm run admin:create` once, then remove ADMIN_PASSWORD from .env. No demo credentials are installed. The command refuses to create another administrator.
5. Run `npm run server` and `npm run dev` in separate terminals. Open the Vite URL and sign in.
6. Public signup creates Customer accounts. Admins create Staff accounts from the Staff screen.

## Roles

Admin: catalog, rules, plans, templates, staff creation and all operational records.
Staff: customers, quotations, subscription lifecycle, invoices and offline payment recording; catalog is read-only.
Customer: only their own invoices, subscriptions, transactions, exports and receipts; subscription self-service remains subject to plan rules.

All protected API routes enforce permissions. Identity is stored in hashed, expiring database sessions using HttpOnly, SameSite cookies, with Secure enabled in production. Reset tokens expire after 30 minutes, are hashed, single-use and revoke sessions. SMTP is required for reset email delivery. Signup does not automatically claim existing customer records by email.

Random-token invoice links remain public bearer links for checkout and invoice PDF access. Anyone holding such a link can view that invoice.

## Configuration workflow

Create Products, Variants, Taxes and Plans. Monetary fields in forms use rupees; database amounts use integer paise. Add template product lines with variants, quantities and tax rules. Create a quotation/subscription from a template or direct lines. Follow Draft -> Quotation -> Confirmed -> Active -> Closed. View the detail dialog for lines and history.

Plan rules control pause, resume, early close and renewal. Paused subscriptions retain their Active state with a separate paused flag and are excluded from billing and MRR. Resume restarts billing from the resume date without billing paused periods. A closed subscription renewal returns to Confirmed and needs activation.

Discount rules support product or whole-subscription scope, fixed or percentage discounts, minimum quantity/value, dates and usage limits. Zero usage limit means unlimited. Discounts apply in ID order against remaining eligible amounts; fixed amounts are allocated proportionally. Tax is calculated after discounts and rounded per line. Usage is recorded atomically with invoice creation. Existing line price/tax snapshots remain stable when catalog rules change.

Invoices support confirmation of drafts, cancellation of unpaid invoices, email reminders and PDF downloads containing line details. Captures and refunds are matched using trusted gateway orders and reconciled transactionally. Online payments are marked successful only from verified webhooks.

## Payments and email

Configure RAZORPAY_KEY_ID (rzp_test_), RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET in .env. Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM and APP_URL for email.

Expose port 3001 with `ngrok http 3001`. Register its HTTPS URL plus `/api/webhooks/razorpay` in Razorpay TEST mode. Subscribe to payment.captured, payment.failed and refund.processed and enable automatic capture. Set the same webhook secret in .env. Test using current instruments from Razorpay's official documentation: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/

Without SMTP, invoice reminders remain queued; password reset returns a neutral response. Actual gateway checkout and email delivery require your credentials and have not been verified by the local automated tests.

## Files and checks

- server/migrations/001.sql: original schema and indexes.
- server/auth.js: additive workflow-v2 migration, accounts, sessions and reset flow.
- server/workflow.js: catalog, templates, pricing, lifecycle and role rules.
- server/billing.js: recurring invoices and overdue/reminder scheduling.
- server/webhook.js: raw HMAC verification and transactional capture/refund reconciliation.
- server/index.js: scoped APIs, PDFs, CSV, SMTP worker and scheduler.
- src/Workspace.jsx: catalog forms, line editor and subscription details/actions.
- src/Auth.jsx: real authentication forms.
- tests/: isolated payment, auth, billing and HTTP authorization tests.

Run `npm test` and `npm run build`. Tests include forged customer filters, CSV/PDF isolation, password resets, variant/tax/discount calculations, usage limits and subscription transitions, alongside the gateway event tests. Data lives in data/cycvera.sqlite and is ignored by Git.

## Deployment and go-live checklist

- Use persistent disk for SQLite and one API instance; back up the database.
- Serve dist through HTTPS with SPA fallback and proxy /api to the Node listener. Keep Node bound to loopback. Overwrite X-Forwarded-Proto at the trusted proxy and set NODE_ENV=production and APP_URL to the HTTPS origin.
- Run Node under a process manager. The scheduler runs billing once per UTC day and retries the email outbox while the API is running.
- Complete Razorpay KYC and test real captures, failures, refunds and email delivery.
- Register a production webhook with a separate secret. Update the explicit test-only key guard before switching to live keys.
- Review role permissions, bearer links, SMTP domain authentication, backups and monitoring.
- Benchmark actual deployment latency; indexes and pagination are present but no production response-time guarantee is asserted.
- Optional Razorpay Subscriptions / UPI AutoPay is not enabled.
