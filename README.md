# ScholarReady

ScholarReady helps Pasig City college students prepare scholarship applications and renewals: track requirements, manage scanned documents, search OCR text, and review academic grades.

## Status

This repository contains the shared app structure and an announcement feed. The remaining feature modules and Lumen OCR integration still need implementation and verification.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in local values.
3. Start a local PostgreSQL instance (the included `compose.yaml` is optional).
4. Apply only reviewed, committed migrations once they exist.
5. Run `npm run dev`.

The app does not initialize, migrate, seed, or reset the database automatically. Keep `.env.local`, `data/uploads/`, database dumps, and real student files out of version control.

## Announcements

The public Pasig Scholars Telegram preview (`https://t.me/s/pasigscholarship`) can be imported without a Telegram account or bot token. Preview recent matching notices without database writes:

```powershell
node --use-system-ca scripts/import-public-telegram.mjs
```

After explicit database-write approval, add `--apply` to insert them. This checks up to five public preview pages within a 90-day window, preserves full post text and original dates/links, skips image-only posts without captions, and deduplicates by channel/post ID. Inserts and the sync checkpoint are committed in one transaction; existing records are not overwritten.

The general `notifications:import` command also uses the public preview when `TELEGRAM_PASIG_BOT_TOKEN` is absent. An authorized channel bot remains optional: when its token is configured, the general importer uses bot updates instead. Neither path runs automatically at application startup.

For historical Telegram notices, use the manual import command with `source` set to `pasig-scholars-telegram` and `permalink_url` set to a direct `https://t.me/pasigscholarship/<post-number>` link. The importer uses the post number to deduplicate manual and bot imports. Keep the publication date and a short verified summary.

Set `DATABASE_URL` in `.env.local` and use the existing database. Starting a database, applying migrations, or running an import requires explicit approval under the project's database-safety instructions. Do not reset or seed the database to populate this feed.
The Announcements page displays saved posts from Pasig City Scholarship Office and Pamantasan ng Lungsod ng Pasig, with category, keyword, and Philippine publication-date filters.

Run `npm run notifications:import` with Node.js 22.15 or newer to import from Pasig City's News and Releases archive and PLP's RSS feed. The first run checks available items from the past 30 days and includes three verified historical city notices. Each source saves its own checkpoint after a successful run. Subsequent runs keep previous announcements. Facebook import is optional and runs for Pages configured with a Meta Graph API version, numeric Page ID, and authorized token.

After verifying the import, run `powershell -NoProfile -File .\scripts\schedule-announcements.ps1` to register the daily 7:00 AM Philippine time job on a Windows machine that can reach PostgreSQL. Task Scheduler records the exit status, and the job appends its output to `data/announcement-import/sync.log`.

To add a verified post manually, run `npm run notifications:import -- --manual path/to/post.json`. The JSON needs `source` (`scholarship-office` or `plp`), `id` (the original post ID), `created_time` (ISO timestamp with an offset), `permalink_url` (the direct Facebook post link), `title`, `message`, and a `categories` array containing `allowance`, `spes`, or `scholarship`. Use this path for relevant image-only posts after reviewing them.

## Repository layout

- `src/app/` — App Router pages and thin route wrappers
- `src/features/` — feature-owned UI and logic
- `src/components/` — shared UI and layout components
- `src/db/` — Drizzle schema, client, and migrations
- `src/lib/server/` — server-only Lumen and file-storage code
- `src/types/` — shared domain contracts
- `src/data/` — versioned demo fixtures
