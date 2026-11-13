// Explicit synthetic DB fixtures and cleanup. Never run automatically at startup.
import { loadEnvFile } from "node:process";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import postgres from "postgres";
if (!process.argv.includes("--allow-db-writes")) throw new Error("Requires explicit approval for synthetic test writes and cleanup.");
loadEnvFile(".env.local");
const db = postgres(process.env.DATABASE_URL, { max: 1 });
const base = process.env.WORKSPACE_TEST_URL ?? "http://localhost:3001";
const accounts = [randomUUID(), randomUUID()];
const tokens = accounts.map(() => randomBytes(32).toString("hex"));
const students = [];
const docs = accounts.map(() => randomUUID());
let checks = 0;
async function api(index, path, method = "GET", body, expected = 200) {
  const r = await fetch(base + path, { method, headers: { Cookie: `scholarready_session=${tokens[index]}`, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000) });
  const data = r.status === 204 ? null : await r.json();
  assert.equal(r.status, expected, `${method} ${path}: ${JSON.stringify(data)}`); checks++;
  return data;
}
try {
  for (let i = 0; i < 2; i++) {
    await db`INSERT INTO accounts (id,email,password_hash,profile) VALUES (${accounts[i]},${`folder-test-${accounts[i]}@example.invalid`},'synthetic-only',${db.json({ name: `Folder Synthetic ${i}`, track: "renewal", yearLevel: "1st Year", topics: [] })})`;
    await db`INSERT INTO account_sessions (token_hash,account_id,expires_at) VALUES (${createHash("sha256").update(tokens[i]).digest("hex")},${accounts[i]},${new Date(Date.now() + 3600000)})`;
    students[i] = (await api(i, "/api/students", "POST")).students[0].id;
    await db`INSERT INTO documents (id,student_id,original_name,mime_type,storage_path,ocr_status,ocr_text) VALUES (${docs[i]},${students[i]},'IMG_folder_test.jpg','image/jpeg',${`data/uploads/${docs[i]}.jpg`},'complete','OFFICIALLY ENROLLED Class Schedule synthetic folder test')`;
    assert.deepEqual((await api(i, "/api/checklist")).lists, []);
    const [count] = await db`SELECT count(*)::int AS n FROM checklist_lists WHERE student_id=${students[i]}`;
    assert.equal(count.n, 0, "GET must not seed a default folder");
  }
  const a = await api(0, "/api/checklist", "POST", { name: "Synthetic renewal A", template: "renewal" }, 201);
  const a2 = await api(0, "/api/checklist", "POST", { name: "Synthetic renewal B", template: "renewal" }, 201);
  const b = await api(1, "/api/checklist", "POST", { name: "Synthetic new", template: "new" }, 201);
  assert.equal(a.customTemplates.length, 5); assert.equal(a2.customTemplates.length, 5); assert.equal(b.customTemplates.length, 4);
  const requirement = a.customTemplates.find((r) => r.title === "Proof of Enrollment").id;
  const otherRequirement = a2.customTemplates.find((r) => r.title === "Proof of Enrollment").id;
  assert.notEqual(requirement, otherRequirement);
  await api(1, `/api/checklist?listId=${a.listId}`, "GET", undefined, 404);
  await api(0, "/api/checklist", "PATCH", { listId: b.listId, deadline: "2027-01-01" }, 404);
  await api(0, `/api/checklist/${requirement}`, "PATCH", { listId: a2.listId, status: "prepared" }, 404);
  await api(1, `/api/checklist/${requirement}`, "DELETE", { listId: a.listId }, 404);
  await api(0, "/api/checklist", "PATCH", { listId: a.listId, deadline: "2027-01-01" });
  await api(0, "/api/checklist", "PATCH", { listId: a2.listId, deadline: "2027-02-02" });
  assert.equal((await api(0, `/api/checklist?listId=${a.listId}`)).deadline, "2027-01-01");
  assert.equal((await api(0, `/api/checklist?listId=${a2.listId}`)).deadline, "2027-02-02");
  await api(0, `/api/checklist/${requirement}/documents`, "POST", { listId: a.listId, documentId: docs[1] }, 404);
  const attached = await api(0, `/api/checklist/${requirement}/documents`, "POST", { listId: a.listId, documentId: docs[0] });
  assert.equal(attached.items[requirement].status, "uploaded");
  assert.deepEqual((await api(0, `/api/checklist?listId=${a2.listId}`)).items, {});
  const saved = await api(0, `/api/checklist/${requirement}`, "PATCH", { listId: a.listId, status: "prepared", notes: "Synthetic verified note" });
  assert.equal(saved.items[requirement].notes, "Synthetic verified note");
  const custom = (await api(0, "/api/checklist", "POST", { listId: a.listId, title: "Custom synthetic", description: "Synthetic" }, 201)).requirement;
  assert.equal((await api(0, `/api/checklist/${custom.id}`, "PATCH", { listId: a.listId, title: "Renamed synthetic" })).requirement.id, custom.id);
  const candidates = (await api(0, `/api/documents/${docs[0]}/classification`)).requirements;
  assert.ok(candidates.some((r) => r.id === requirement && r.listId === a.listId && r.listName === "Synthetic renewal A"));
  assert.ok(candidates.some((r) => r.id === otherRequirement && r.listId === a2.listId));
  assert.ok(candidates.every((r) => r.listId !== b.listId));
  const summary = await api(0, "/api/workspace/summary");
  assert.equal(summary.checklist.total, 11); assert.equal(summary.checklist.prepared, 1); assert.equal(summary.checklist.folders, 2);
  await api(0, `/api/checklist/${custom.id}`, "DELETE", { listId: a.listId });
  await api(0, `/api/checklist/${requirement}`, "DELETE", { listId: a.listId });
  assert.ok((await api(0, `/api/documents/${docs[0]}`)).document);
  const [links] = await db`SELECT count(*)::int AS n FROM checklist_documents WHERE document_id=${docs[0]}`;
  assert.equal(links.n, 0);
  await api(0, `/api/checklist/${otherRequirement}/documents`, "POST", { listId: a2.listId, documentId: docs[0] });
  const preparedRequirement = a2.customTemplates.find((r) => r.title === "Report Card").id;
  const multipleFilesRequirement = a2.customTemplates.find((r) => r.title === "Proof of Income").id;
  const extraDocument = randomUUID();
  await db`INSERT INTO documents (id,student_id,original_name,mime_type,storage_path) VALUES (${extraDocument},${students[0]},'synthetic-extra.png','image/png',${`data/uploads/${extraDocument}.png`})`;
  await api(0, `/api/checklist/${preparedRequirement}/documents`, "POST", { listId: a2.listId, documentId: docs[0] });
  await api(0, `/api/checklist/${preparedRequirement}`, "PATCH", { listId: a2.listId, status: "prepared" });
  await api(0, `/api/checklist/${multipleFilesRequirement}/documents`, "POST", { listId: a2.listId, documentId: docs[0] });
  await api(0, `/api/checklist/${multipleFilesRequirement}/documents`, "POST", { listId: a2.listId, documentId: extraDocument });
  await api(0, `/api/documents/${docs[0]}`, "DELETE", undefined, 204);
  const reloaded = await api(0, `/api/checklist?listId=${a2.listId}`);
  assert.deepEqual(reloaded.items[otherRequirement].documentIds, []);
  assert.equal(reloaded.items[otherRequirement].status, "missing");
  assert.equal(reloaded.items[preparedRequirement].status, "prepared", "Document deletion must preserve manual verification");
  assert.deepEqual(reloaded.items[preparedRequirement].documentIds, []);
  assert.equal(reloaded.items[multipleFilesRequirement].status, "uploaded", "A remaining file must preserve the uploaded status");
  assert.deepEqual(reloaded.items[multipleFilesRequirement].documentIds, [extraDocument]);
  console.log(`${checks} folder integration API checks passed; read-only GETs, duplicate templates, ownership, deadlines, edits, attachments, cleanup, AI candidates and dashboard totals verified.`);
} finally {
  await db.begin(async (tx) => { await tx`DELETE FROM students WHERE account_id IN ${tx(accounts)}`; await tx`DELETE FROM accounts WHERE id IN ${tx(accounts)}`; });
  await db.end();
  console.log("Removed only generated folder-test accounts and their descendant fixtures.");
}
