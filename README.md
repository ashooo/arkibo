# ScholarReady

ScholarReady helps Pasig City college students prepare scholarship applications and renewals: track requirements, manage scanned documents, search OCR text, and review academic grades.

## Status

The account workspace includes documents with Lumen OCR, searchable text and metadata, a scholarship checklist, grades, announcements, and a local Qwen assistant.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in local values.
3. Start a local PostgreSQL instance (the included `compose.yaml` is optional).
4. Apply only reviewed, committed migrations once they exist.
5. Run `npm run dev`.

The app does not initialize, migrate, seed, or reset the database automatically. Keep `.env.local`, `data/uploads/`, database dumps, and real student files out of version control.

## Local AI and document organization

Run Ollama with the locally installed `qwen3.5:2b` model. The defaults are `OLLAMA_BASE_URL=http://127.0.0.1:11434` and `QWEN_MODEL=qwen3.5:2b`; override them in `.env.local` if your local model tag differs. Only loopback Ollama URLs are accepted. No AI API key or cloud model is used. Lumen still performs OCR using its separately configured key and secret.

Upload through **My Documents → Add document** without choosing a category. Once OCR finishes, an independent AI task proposes a document type, grounded tags, academic metadata, and matching requirements for the student's application track. Files remain saved if AI is unavailable. Unknown or inconsistent results need review. Open **Category & tags** from a document's menu to confirm or edit metadata, analyze existing OCR again, or explicitly attach a suggested checklist match. Attaching sets the existing uploaded state; it never approves or completes a requirement. Original OCR is preserved and is not displayed in document cards.

Confirmed metadata is protected from later AI results. Analysis reuses cached results unless explicitly refreshed, and optimistic version checks protect concurrent edits. Existing manually categorized documents are preserved. Search includes filenames, OCR, type labels, tags, synonyms, and fuzzy matching. AI suggestions do not guarantee scholarship-office acceptance.

The **Assistant** page supports general conversation and document attachments. Choose **Upload document** to save a PDF/image using the existing upload dialog and Lumen consent, or **My Documents** to attach an already saved file. Up to three files can accompany a message; a file-only message asks the assistant to inspect and suggest uses automatically. Removing a message attachment or starting a new conversation keeps the original in My Documents. The assistant reads extracted OCR rather than directly viewing the image, so pending or unreadable text is reported honestly.

Native `search_documents`, `get_document`, `check_document_processing`, `classify_document`, and `get_checklist_requirements` tools are scoped to the signed-in student. The OCR-status tool checks an existing job once per document per turn and reuses completed OCR; it never uploads again or retries failed submissions. Ask to check the file again if extraction is still pending. Attachment ownership and current metadata are verified server-side on every turn, including follow-up references. Tool activity and document review links appear with responses. History stays in memory while the page is open. Classification has a separate prompt and never enters conversation history. Retrieved OCR and filenames are treated as untrusted data. Confirmation and checklist attachment require the review form.

`src/lib/server/document-classifier.ts` is shared by OCR completion, manual OCR updates, the classification API, and assistant tools. Background work uses Next.js `after()` rather than a durable queue; interrupted processing can be retried through **Analyze again** after its four-minute lease expires. A cold local model may take several minutes. Manual categorization remains available while it runs or when it fails.

Review migrations `0006_fearless_chimera` and `0007_bumpy_leader` before applying them with `npm run db:migrate`, and obtain explicit database-write approval first. They add classification/tag/cache/confirmation fields and a metadata search index without seeding records. Startup never runs migrations.

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` for ordinary checks. `node node_modules/tsx/dist/cli.mjs scripts/test-local-classifier.ts` additionally checks synthetic text against local Ollama. `node scripts/test-ai-workflow.mjs --allow-db-writes` requires explicit approval: it creates two synthetic accounts and fixtures, checks automatic classification, confirmation, search, checklist attachment, ownership, multi-turn chat, and real native tools, then removes only those fixtures. It makes no Lumen calls.

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
