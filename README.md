# Asset Registry

An end-to-end IT asset management system for tracking company-owned laptops,
phones, and other equipment through their full lifecycle: purchase → stock →
assigned to an employee → returned → retired, with a complete history log.

## Stack

- **Framework:** Next.js 16 (App Router, JavaScript)
- **Database:** PostgreSQL (built for [Neon](https://neon.tech), works with any Postgres)
- **DB access:** `pg` (node-postgres) — plain SQL, no ORM
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Features

- **Asset inventory** — add assets singly or in bulk (a purchase batch of N units),
  track vendor, price, purchase date, warranty
- **Stock dashboard** — live counts by type and status
- **Employee directory**
- **Assign workflow** — hand an in-stock asset to an employee; a DB constraint
  prevents double-assigning the same asset
- **Return workflow** — close out an assignment, mark condition (good / damaged / lost);
  damaged or lost items are automatically retired instead of going back to stock
- **Full audit history** — every asset's page shows every employee it has ever
  been assigned to and when; every employee's page shows every asset they've held

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to your Postgres
   connection string (a local Postgres instance, or a free Neon project).
3. Apply the schema:
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   ```
4. (Optional) Load realistic demo data:
   ```bash
   node db/seed.js
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

## Deploying to Vercel

1. Push this repo to GitHub.
2. Create a free project at [neon.tech](https://neon.tech), copy its connection string.
3. Run the schema against it: `psql "<neon-connection-string>" -f db/schema.sql`
   (and optionally `DATABASE_URL="<neon-connection-string>" node db/seed.js` for demo data).
4. In Vercel, "Add New Project" → import the GitHub repo.
5. In the project's Settings → Environment Variables, add:
   - `DATABASE_URL` = your Neon connection string
6. Deploy. Vercel builds and hosts the app; API routes run as serverless functions
   against Neon.

## Data model

- `assets` — one row per physical unit (asset_tag, type, brand, model, purchase
  info, current status/condition)
- `employees` — basic directory
- `assignments` — one row per assign/return cycle; never deleted, so this table
  *is* the audit history. A partial unique index guarantees only one `ACTIVE`
  assignment can exist per asset at a time.

## Out of scope (by design, for a time-boxed exercise)

Authentication/login, file attachments, depreciation schedules, approval
workflows, notifications/emails, CSV export. These would be natural next steps
but weren't required for the core lifecycle-tracking exercise.
