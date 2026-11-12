// Explicit synthetic integration test. Never invoked by npm test.
import { loadEnvFile } from "node:process";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import postgres from "postgres";

if (!process.argv.includes("--allow-db-writes")) throw new Error("Requires approval for synthetic database writes and --allow-db-writes.");
loadEnvFile(".env.local");
const base = process.env.WORKSPACE_TEST_URL ?? "http://localhost:3001";
const db = postgres(process.env.DATABASE_URL, { max: 1 });
const accountIds = [randomUUID(), randomUUID()];
const tokens = [randomBytes(32).toString("hex"), randomBytes(32).toString("hex")];
const docs = [randomUUID(), randomUUID()];
const terms = [randomUUID(), randomUUID()];
const grades = [randomUUID(), randomUUID()];
const students = [];
let checks = 0;
async function request(index, path, method = "GET", body, expected = 200) {
  const response = await fetch(`${base}${path}`, {
    method, headers: { Cookie: `scholarready_session=${tokens[index]}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert.equal(response.status, expected, `${method} ${path}`);
  checks++;
  return response.status === 204 ? null : response.json();
}
try {
  await db.begin(async (tx) => {
    for (let i = 0; i < 2; i++) {
      await tx`INSERT INTO accounts (id,email,password_hash,profile) VALUES (${accountIds[i]},${`integration-${accountIds[i]}@example.invalid`},${"test-only-not-a-password"},${tx.json({ name: `Synthetic ${i}`, track: "new", yearLevel: "1st Year", topics: [] })})`;
      await tx`INSERT INTO account_sessions (token_hash,account_id,expires_at) VALUES (${createHash("sha256").update(tokens[i]).digest("hex")},${accountIds[i]},${new Date(Date.now() + 600000)})`;
    }
  });
  for (let i = 0; i < 2; i++) {
    const profile = await request(i, "/api/students", "POST");
    assert.equal(profile.students.length, 1);
    students[i] = profile.students[0].id;
    await db`INSERT INTO documents (id,student_id,original_name,mime_type,storage_path,ocr_text,ocr_status) VALUES (${docs[i]},${students[i]},${"synthetic-ownership.png"},${"image/png"},${`data/uploads/${docs[i]}.png`},${"certificate of registration synthetic keyword"},${"complete"})`;
    await db`INSERT INTO academic_terms (id,student_id,academic_year,semester) VALUES (${terms[i]},${students[i]},${"2099-2100"},${"Synthetic"})`;
    await db`INSERT INTO grade_entries (id,term_id,subject_code,subject_name,grade) VALUES (${grades[i]},${terms[i]},${"TEST101"},${"Synthetic Subject"},${"1.0"})`;
  }
  for (let i = 0; i < 2; i++) {
    const other = 1 - i;
    const list = await request(i, "/api/documents?q=COR");
    assert.deepEqual(list.documents.map((document) => document.id), [docs[i]]);
    await request(i, `/api/documents/${docs[i]}`);
    await request(i, `/api/documents/${docs[other]}`, "GET", undefined, 404);
    await request(i, `/api/documents/${docs[other]}/file`, "GET", undefined, 404);
    await request(i, `/api/documents/${docs[other]}`, "DELETE", undefined, 404);
    await request(i, `/api/documents/${docs[other]}/text`, "PATCH", { ocrText: "forbidden" }, 404);
    await request(i, `/api/documents/${docs[other]}/ocr`, "POST", undefined, 404);
    await request(i, `/api/documents/${docs[other]}/ocr/retry`, "POST", undefined, 404);
    await request(i, `/api/terms?studentId=${students[other]}`, "GET", undefined, 404);
    await request(i, `/api/grades?termId=${terms[other]}`, "GET", undefined, 404);
    await request(i, "/api/grades", "PATCH", { id: grades[other], verified: true }, 404);
    await request(i, "/api/grades/parse", "POST", { documentId: docs[other] }, 404);
    await request(i, "/api/grades", "POST", { termId: terms[i], sourceDocumentId: docs[other], subjectCode: "TEST", subjectName: "Test", grade: "1" }, 404);
    await request(i, `/api/grades?termId=${terms[i]}`);
  }
  const customIds = [];
  for (let i = 0; i < 2; i++) {
    const initial = await request(i, "/api/checklist?type=new");
    assert.deepEqual(initial.items, {});
    const custom = await request(i, "/api/checklist", "POST", { applicationType: "new", title: "Synthetic extra requirement", description: "Test only" }, 201);
    customIds[i] = custom.requirement.id;
  }
  for (let i = 0; i < 2; i++) {
    const other = 1 - i;
    const body = { applicationType: "new" };
    await request(i, "/api/checklist/new-report-card", "PATCH", { ...body, notes: "Synthetic note" });
    let view = await request(i, "/api/checklist?type=new");
    assert.equal(view.items["new-report-card"].notes, "Synthetic note");
    await request(i, "/api/checklist/new-report-card/documents", "POST", { ...body, documentId: docs[i] });
    view = await request(i, "/api/checklist?type=new");
    assert.equal(view.items["new-report-card"].status, "uploaded");
    assert.deepEqual(view.items["new-report-card"].documentIds, [docs[i]]);
    await request(i, "/api/checklist/new-report-card", "PATCH", { ...body, documentIds: [docs[other]] }, 404);
    view = await request(i, "/api/checklist?type=new");
    assert.deepEqual(view.items["new-report-card"].documentIds, [docs[i]], "Rejected replacements must preserve existing attachments");
    await request(i, `/api/checklist/${customIds[other]}`, "PATCH", { ...body, notes: "Forbidden" }, 404);
    await request(i, "/api/checklist/new-report-card/documents", "DELETE", { ...body, documentId: docs[other] }, 404);
    await request(i, "/api/checklist/new-report-card", "PATCH", { ...body, status: "prepared" });
    await request(i, "/api/checklist", "PATCH", { ...body, deadline: "2099-02-28" });
    await request(i, "/api/checklist", "PATCH", { ...body, deadline: "2099-02-30" }, 400);
    const summary = await request(i, "/api/workspace/summary?type=new");
    assert.deepEqual(summary.checklist, { total: 5, prepared: 1, deadline: "2099-02-28" });
    assert.equal(summary.documents.total, 1);
    assert.equal(summary.grades.total, 1);
    const renewal = await request(i, "/api/checklist?type=renewal");
    assert.deepEqual(renewal, { items: {}, customTemplates: [], deadline: "" });
    await request(i, "/api/checklist/new-report-card", "PATCH", { applicationType: "renewal", notes: "Wrong track" }, 404);
    await request(i, "/api/checklist/new-report-card/documents", "DELETE", { ...body, documentId: docs[i] });
    view = await request(i, "/api/checklist?type=new");
    assert.equal(view.items["new-report-card"].status, "prepared", "Removing an attachment must preserve manual verification");
    assert.deepEqual(view.items["new-report-card"].documentIds, []);
    await request(i, "/api/checklist/new-residency/documents", "POST", { ...body, documentId: docs[i] });
    await request(i, "/api/checklist/new-residency/documents", "DELETE", { ...body, documentId: docs[i] });
    view = await request(i, "/api/checklist?type=new");
    assert.equal(view.items["new-residency"].status, "missing");
    await request(i, "/api/checklist/new-residency", "PATCH", { ...body, status: "invalid" }, 400);
    await request(i, "/api/checklist?type=invalid", "GET", undefined, 400);
  }
  console.log(`${checks} authenticated ownership checks passed.`);
} finally {
  await db.begin(async (tx) => {
    // Generated account IDs scope all cleanup; foreign keys remove only test descendants.
    await tx`DELETE FROM students WHERE account_id IN ${tx(accountIds)}`;
    await tx`DELETE FROM accounts WHERE id IN ${tx(accountIds)}`;
  });
  await db.end();
  console.log("Removed synthetic test accounts and their workspace records.");
}
