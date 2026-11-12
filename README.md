# ScholarReady

ScholarReady helps Pasig City college students prepare scholarship applications and renewals: track requirements, manage scanned documents, search OCR text, and review academic grades.

## Status

This repository contains the shared initial structure. Feature modules, database schema, migrations, and Lumen OCR endpoint details remain to be implemented and verified.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in local values.
3. Start a local PostgreSQL instance (the included `compose.yaml` is optional).
4. Apply only reviewed, committed migrations once they exist.
5. Run `npm run dev`.

The app does not initialize, migrate, seed, or reset the database automatically. Keep `.env.local`, `data/uploads/`, database dumps, and real student files out of version control.

## Repository layout

- `src/app/` — App Router pages and thin route wrappers
- `src/features/` — feature-owned UI and logic
- `src/components/` — shared UI and layout components
- `src/db/` — Drizzle schema, client, and migrations
- `src/lib/server/` — server-only Lumen and file-storage code
- `src/types/` — shared domain contracts
- `src/data/` — versioned demo fixtures
