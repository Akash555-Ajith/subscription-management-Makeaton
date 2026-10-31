# Cycvera payment workspace

React + Vite frontend, Node 24 API, SQLite database, Razorpay test checkout, SMTP reminders and PDF downloads. All pages and data are intentionally open. There is no authentication or role system. Only use synthetic customer data on a public demonstration deployment.

## Setup

1. Install Node.js 24 or later and run `npm install`.
2. Copy `.env.example` to `.env`. Never commit `.env`.
3. Set Razorpay TEST key ID, key secret and a separate webhook secret. The public key ID is returned at checkout; secret keys never reach the frontend.
4. Run `npm run db:seed` once for 60 customers, 60 subscriptions and 540 invoices. Tables are migrated automatically at database startup. Do not seed a production database.
5. Run `npm run server` in one terminal and `npm run dev` in another. Open the Vite URL. Vite proxies `/api` to port 3001.
6. Configure SMTP variables to send reminders. Without SMTP, reminders remain in the database outbox and the UI explains this.

## Gateway verification

Expose API port 3001 with `ngrok http 3001`. Register the resulting HTTPS URL plus `/api/webhooks/razorpay` in the Razorpay TEST dashboard. Subscribe to `payment.captured`, `payment.failed` and `refund.processed`; use the same webhook secret as `.env`. Set automatic capture in your Razorpay dashboard. Use current test instruments from https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/ . Open any payable invoice and follow its Pay Now link. The frontend waits for confirmation; it cannot mark an online invoice paid.

`npm test` exercises signed webhook captures, failures, invalid signatures, duplicate event IDs and payment IDs, partial captures, refunds, out-of-order failures, unknown orders and recurring invoice idempotency. `npm run build` builds the frontend. Live gateway checkout and SMTP delivery require your own credentials and are not simulated by passing these tests.

## Files

- `server/migrations/001.sql`: schema and indexes.
- `server/db.js`: migrations and SQLite transaction helpers.
- `server/webhook.js`: raw-body HMAC verification, idempotent capture/refund processing.
- `server/billing.js`: recurring invoices, overdue transitions and reminder outbox.
- `server/index.js`: API, Razorpay orders, CSV/PDF downloads, SMTP worker and scheduler.
- `server/seed.js`: synthetic seed dataset.
- `src/main.jsx`: React dashboard, transaction history, checkout and detail drawer. React escapes text; no HTML injection is used.
- `tests/payments.test.js`: isolated in-memory database tests.

## API

GET `/api/health`, `/api/dashboard`, `/api/customers`, `/api/subscriptions`, `/api/invoices`

GET `/api/transactions?page=1&status=captured&method=upi&from=2026-01-01&to=2026-12-31&invoice=INV&customer=1&min=10&max=1000&search=Studio`

GET `/api/transactions/export` accepts the same filters. Amount filters and JSON output are rupees. Money is stored internally as integer paise to avoid floating-point rounding.

GET `/api/invoices/:pay_token`, GET `/api/invoices/:pay_token/pdf`, POST `/api/invoices/:pay_token/order`

POST `/api/webhooks/razorpay` requires HMAC signature and supports Razorpay event ID deduplication. Sanitized gateway payloads retain payment identifiers and status rather than card metadata or personal information.

POST `/api/payments/manual`: invoice_id, method (cash/bank_transfer), amount (rupees), date (YYYY-MM-DD), note.

POST `/api/invoices/:id/remind`: queue a reminder once per day.

GET `/api/transactions/:id/receipt`: payment PDF. Failed payments are explicitly labeled and are not presented as successful receipts.

## Billing and deployment

While the API runs, the scheduler checks each minute and runs billing once per UTC day. A database unique constraint on subscription and period prevents duplicate invoices after restarts. Dates and monthly reports use UTC. Plan prices are snapshots on subscriptions; invoice lines are snapshots on invoices. The sample recurring engine supports Daily, Weekly, Monthly and Yearly. Optional automatic charging/UPI AutoPay is not enabled.

Deploy the built `dist` directory through an HTTPS reverse proxy with SPA fallback for `/pay/*`, route `/api` to Node, and keep Node bound to loopback. Set `NODE_ENV=production`, `APP_URL=https://your-domain`, and overwrite `X-Forwarded-Proto` at your trusted proxy. Do not expose the Node listener directly. SQLite requires persistent disk and a single application instance. Back up the database and monitor failed outbox deliveries. API POST endpoints are rate limited by connection address; configure gateway traffic separately at the proxy for higher throughput.

## Go-live checklist

- Complete Razorpay merchant KYC and approval.
- Perform real test-mode checkout, capture, failure, partial manual payment, refund, duplicate webhook and email-delivery checks.
- Register your production HTTPS webhook and use a separate secret.
- Replace test keys with live credentials only after explicitly updating the test-only key guard in `server/index.js`; the current build deliberately rejects live keys.
- Review the intentional public access model: all customer data, reports and manual payment actions are open as requested.
- Configure TLS, persistent storage, backups, email domain authentication and process restart monitoring.
- Benchmark your actual deployment; the indexes and pagination support large datasets, but no production latency SLA has been established.
