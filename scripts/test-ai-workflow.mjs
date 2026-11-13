// Explicit synthetic local-model integration tests; never invoked by npm test.
import { loadEnvFile } from "node:process";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import postgres from "postgres";

if (!process.argv.includes("--allow-db-writes")) throw new Error("Requires explicit approval for synthetic test records and cleanup, plus --allow-db-writes.");
loadEnvFile(".env.local");
const db = postgres(process.env.DATABASE_URL, { max: 1 });
const base = process.env.WORKSPACE_TEST_URL ?? "http://localhost:3001";
const accounts = [randomUUID(), randomUUID()];
const tokens = [randomBytes(32).toString("hex"), randomBytes(32).toString("hex")];
const ids = [randomUUID(), randomUUID()];
const studentIds = [];
const ocr = "Pamantasan ng Lungsod ng Pasig\nOFFICIALLY ENROLLED\n1st Sem 2026-2027\nCLASS SCHEDULE\nCS 112 Computer Science 3 units\nASSESSMENT OF FEES\nTuition Fee\nOffice of the University Registrar";
let checks = 0;
async function api(index, path, method = "GET", body, status = 200) {
  const response = await fetch(base + path, { method, headers: { Cookie: `scholarready_session=${tokens[index]}`, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(290000) });
  const data = await response.json();
  assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(data)}`);
  checks++;
  return data;
}
try {
  await db.begin(async (tx) => {
    for (let i = 0; i < 2; i++) {
      await tx`INSERT INTO accounts (id,email,password_hash,profile) VALUES (${accounts[i]},${`ai-test-${accounts[i]}@example.invalid`},${"synthetic-only"},${tx.json({ name: `AI Synthetic ${i}`, track: "renewal", yearLevel: "1st Year", topics: [] })})`;
      await tx`INSERT INTO account_sessions (token_hash,account_id,expires_at) VALUES (${createHash("sha256").update(tokens[i]).digest("hex")},${accounts[i]},${new Date(Date.now() + 3600000)})`;
    }
  });
  for (let i = 0; i < 2; i++) {
    const payload = await api(i, "/api/students", "POST");
    studentIds[i] = payload.students[0].id;
    await db`INSERT INTO documents (id,student_id,original_name,mime_type,storage_path) VALUES (${ids[i]},${studentIds[i]},${"IMG_synthetic.jpg"},${"image/jpeg"},${`data/uploads/ai-test-${ids[i]}.jpg`})`;
  }
  await api(0, `/api/documents/${ids[1]}/classification`, "GET", undefined, 404);
  await api(0, `/api/documents/${ids[1]}/classification`, "POST", { refresh: true }, 404);
  await api(0, `/api/documents/${ids[1]}/classification`, "PATCH", { category: "grade_report", tags: [], expectedVersion: 0 }, 404);
  // Simulate successful OCR using synthetic text. The route's after() must schedule AI automatically.
  await api(0, `/api/documents/${ids[0]}/text`, "PATCH", { ocrText: ocr, ocrStatus: "complete" });
  let record;
  const deadline = Date.now() + 220000;
  do {
    record = (await api(0, `/api/documents/${ids[0]}`)).document;
    if (!["pending", "processing"].includes(record.classificationStatus)) break;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  } while (Date.now() < deadline);
  assert.equal(record.classificationStatus, "ready", record.classificationError ?? "Automatic classification did not finish");
  assert.equal(record.category, "certificate_of_registration");
  assert.ok(record.tags.includes("Academic Year 2026-2027"));
  assert.ok(record.tags.includes("First Semester"));
  assert.equal(record.ocrText, ocr);
  console.log("Automatic OCR → local AI classification passed.");
  const [beforeCache] = await db`SELECT classification_updated_at FROM documents WHERE id=${ids[0]}`;
  await api(0, `/api/documents/${ids[0]}/classification`, "POST", {});
  const [afterCache] = await db`SELECT classification_updated_at FROM documents WHERE id=${ids[0]}`;
  assert.equal(String(afterCache.classification_updated_at), String(beforeCache.classification_updated_at));
  const found = await api(0, "/api/documents?q=First%20Semester");
  assert.ok(found.documents.some((entry) => entry.id === ids[0]));
  const attached = await api(0, "/api/checklist/renewal-proof-enrollment/documents", "POST", { applicationType: "renewal", documentId: ids[0] });
  assert.equal(attached.items["renewal-proof-enrollment"].status, "uploaded");
  const confirmed = await api(0, `/api/documents/${ids[0]}/classification`, "PATCH", { category: "grade_report", tags: ["SyntheticVerifiedMarker"], expectedVersion: record.metadataVersion });
  assert.ok(confirmed.document.classificationConfirmedAt);
  await api(0, `/api/documents/${ids[0]}/classification`, "PATCH", { category: "student_id", tags: [], expectedVersion: record.metadataVersion }, 409);
  const refreshed = await api(0, `/api/documents/${ids[0]}/classification`, "POST", { refresh: true });
  assert.equal(refreshed.document.category, "grade_report");
  assert.deepEqual(refreshed.document.tags, ["SyntheticVerifiedMarker"]);
  assert.equal(refreshed.document.ocrText, ocr);
  assert.ok((await api(0, "/api/documents?q=SyntheticVerifiedMarker")).documents.some((entry) => entry.id === ids[0]));
  console.log("Cache, metadata search, checklist attachment, stale edits, and confirmed override protection passed.");
  const chat = await api(0, "/api/assistant", "POST", { messages: [{ role: "user", content: "My nickname is SyntheticNova." }, { role: "assistant", content: "Nice to meet you, SyntheticNova." }, { role: "user", content: "What nickname did I give you? Answer briefly." }] });
  assert.match(chat.answer, /SyntheticNova/i);
  const search = await api(0, "/api/assistant", "POST", { messages: [{ role: "user", content: "Use search_documents to search my saved files for the tag SyntheticVerifiedMarker, then tell me what you found." }] });
  assert.ok(search.usedTools.includes("search_documents"), JSON.stringify(search));
  assert.ok(search.reviewLinks.some((link) => link.url === `/documents?review=${ids[0]}`));
  const classify = await api(0, "/api/assistant", "POST", { messages: [{ role: "user", content: `Use classify_document with documentId ${ids[0]} and refresh false. Tell me its existing classification without overwriting confirmed values.` }] });
  assert.ok(classify.usedTools.includes("classify_document"), JSON.stringify(classify));
  const final = (await api(0, `/api/documents/${ids[0]}`)).document;
  assert.equal(final.category, "grade_report");
  assert.deepEqual(final.tags, ["SyntheticVerifiedMarker"]);
  console.log(`${checks} API checks passed, including real Qwen multi-turn conversation and native tool calling.`);
} finally {
  await db.begin(async (tx) => {
    await tx`DELETE FROM students WHERE account_id IN ${tx(accounts)}`;
    await tx`DELETE FROM accounts WHERE id IN ${tx(accounts)}`;
  });
  await db.end();
  console.log("Removed only the generated AI test accounts and their descendant records.");
}
