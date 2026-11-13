// Explicit, one-time reconciliation of the inspected Dev 1 database.
// Default is read-only. --apply requires the database owner's approval.
import { loadEnvFile } from "node:process";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import postgres from "postgres";

try { loadEnvFile(".env.local"); } catch (error) { if (error.code !== "ENOENT") throw error; }
const apply = process.argv.includes("--apply");
const directory = new URL("../src/db/migrations/", import.meta.url);
const journal = JSON.parse(await readFile(new URL("meta/_journal.json", directory), "utf8"));
const snapshot = JSON.parse(await readFile(new URL("meta/0002_snapshot.json", directory), "utf8"));
const baselineHash = "fe626b2ef00fc58f0742135a9bd72e1b4bf058615784f944dc8393a0085f29db";
const baselineTables = ["academic_terms", "checklist_documents", "checklist_items", "documents", "grade_entries", "notifications", "requirements", "students"];
const normalizeType = (value) => value.replaceAll('"', '').replace(/^public\./, '').replace("character varying", "varchar");
const db = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 5 });

async function inspect(tx) {
  const history = await tx`SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`;
  assert.equal(history.length, 1, "Expected exactly the inspected Dev 1 baseline. Stop and review this database.");
  assert.equal(history[0].hash, baselineHash, "Database migration baseline differs from the inspected baseline.");
  assert.equal(String(history[0].created_at), "1794503456677");
  const tables = await tx`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
  assert.deepEqual(tables.map((row) => row.tablename), baselineTables, "Unexpected existing tables. Stop and review.");
  const columns = await tx`SELECT c.relname AS table_name, a.attname AS name, format_type(a.atttypid,a.atttypmod) AS type, a.attnotnull AS not_null
    FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND a.attnum>0 AND NOT a.attisdropped ORDER BY c.relname,a.attname`;
  for (const table of baselineTables) {
    const expected = Object.values(snapshot.tables[`public.${table}`].columns).map((column) => ({ name: column.name, type: normalizeType(column.type), not_null: column.notNull })).sort((a,b) => a.name.localeCompare(b.name));
    const actual = columns.filter((column) => column.table_name === table).map(({ name, type, not_null }) => ({ name, type: normalizeType(type), not_null })).sort((a,b) => a.name.localeCompare(b.name));
    assert.deepEqual(actual, expected, `Existing ${table} columns differ from the combined baseline.`);
  }
  const counts = await tx`SELECT (SELECT count(*) FROM documents)::int AS documents, (SELECT count(*) FROM students)::int AS students, (SELECT count(*) FROM grade_entries)::int AS grades`;
  return counts[0];
}

try {
  if (!apply) {
    console.log({ mode: "read-only", records: await inspect(db), plan: "Add announcements/accounts, search indexes, student account link, and reconcile migration history. Preserve legacy records without assigning ownership." });
  } else {
    await db.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(713031)`;
      await tx`LOCK TABLE drizzle.__drizzle_migrations, academic_terms, checklist_documents, checklist_items, documents, grade_entries, notifications, requirements, students IN ACCESS EXCLUSIVE MODE`;
      const before = await inspect(tx);
      for (const entry of journal.entries) {
        const content = await readFile(new URL(`${entry.tag}.sql`, directory), "utf8");
        // 0002 describes Dev 1 tables already verified above; do not recreate them.
        if (entry.idx !== 2) {
          for (const statement of content.split("--> statement-breakpoint").filter((part) => part.trim())) await tx.unsafe(statement);
        }
        await tx`INSERT INTO drizzle.__drizzle_migrations (hash,created_at) VALUES (${createHash("sha256").update(content).digest("hex")},${entry.when})`;
      }
      const [after] = await tx`SELECT (SELECT count(*) FROM documents)::int AS documents, (SELECT count(*) FROM students)::int AS students, (SELECT count(*) FROM grade_entries)::int AS grades`;
      assert.deepEqual(after, before, "Record counts changed unexpectedly; rolling back.");
      console.log({ mode: "applied", preservedRecords: after });
    });
  }
} finally { await db.end(); }
