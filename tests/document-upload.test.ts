import assert from "node:assert/strict";
import test from "node:test";
import { uploadError, MAX_DOCUMENT_BYTES } from "../src/lib/document-upload";
import { uploadToLumen, syncLumenDocument, LumenError } from "../src/lib/server/lumen";

test("upload validation rejects empty, unsupported and oversized files", () => {
  const file = { name: "test.png", type: "image/png", size: 100 };
  assert.equal(uploadError(file), null);
  assert.ok(uploadError({ ...file, size: 0 }));
  assert.ok(uploadError({ ...file, type: "text/html" }));
  assert.ok(uploadError({ ...file, size: MAX_DOCUMENT_BYTES + 1 }));
  assert.equal(uploadError({ ...file, size: MAX_DOCUMENT_BYTES }), null);
});

test("Lumen adapter uses raw bytes, validates responses, and keeps errors credential-free", async (t) => {
  const names = ["LUMEN_API_BASE_URL", "LUMEN_OCR_PATH", "LUMEN_API_KEY", "LUMEN_API_SECRET"];
  const previous = names.map((key) => process.env[key]);
  const fetchBefore = globalThis.fetch;
  t.after(() => { globalThis.fetch = fetchBefore; names.forEach((key, index) => { if (previous[index] === undefined) delete process.env[key]; else process.env[key] = previous[index]; }); });
  process.env.LUMEN_API_BASE_URL = "https://ocr.example.invalid";
  process.env.LUMEN_OCR_PATH = "/ocr/documents";
  process.env.LUMEN_API_KEY = "synthetic-test-key";
  process.env.LUMEN_API_SECRET = "synthetic-test-secret";
  const file = new File([new Uint8Array([1, 2, 3])], "synthetic test.png", { type: "image/png" });
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "https://ocr.example.invalid/ocr/documents");
    assert.equal(init?.method, "POST");
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("Content-Type"), "image/png");
    assert.equal(headers.get("X-Lumen-Document-Name"), "synthetic%20test.png");
    assert.equal(headers.get("lumen-api-secret"), "synthetic-test-secret");
    assert.deepEqual([...new Uint8Array(init?.body as ArrayBuffer)], [1, 2, 3]);
    return Response.json({ data: { DocumentID: "test-id", Status: "PENDING" }, requestId: "test-request" }, { status: 202 });
  };
  assert.equal((await uploadToLumen(file)).data.DocumentID, "test-id");
  for (const status of [400, 401, 403, 413, 415, 429, 503]) {
    globalThis.fetch = async () => Response.json({ error: { message: "synthetic-test-secret" } }, { status });
    await assert.rejects(uploadToLumen(file), (error: unknown) => error instanceof LumenError && error.status === status && !error.message.includes("synthetic-test-secret"));
  }
  globalThis.fetch = async () => Response.json({ data: {} });
  await assert.rejects(uploadToLumen(file), (error: unknown) => error instanceof LumenError && error.status === 502);
  globalThis.fetch = async () => { throw new TypeError("network failure"); };
  await assert.rejects(uploadToLumen(file), (error: unknown) => error instanceof LumenError && error.status === 503);
  globalThis.fetch = async (url) => String(url).includes("/pages")
    ? Response.json({ data: { Items: [{ Lines: [{ text: "Certificate of registration" }] }] } })
    : Response.json({ data: { Status: "PARTIAL", DocumentID: "test-id" } });
  assert.deepEqual(await syncLumenDocument("test-id"), { status: "complete", text: "Certificate of registration", providerStatus: "PARTIAL" });
  globalThis.fetch = async (url) => String(url).includes("/pages")
    ? Response.json({ data: { Items: [{ Text: "", Lines: [], Words: [{ text: "Word fallback" }] }] } })
    : Response.json({ data: { Status: "READY", DocumentID: "test-id" } });
  assert.equal((await syncLumenDocument("test-id")).text, "Word fallback");
  globalThis.fetch = async () => Response.json({ data: { Status: "FAILED", FailureReason: "synthetic-test-secret" } });
  const failed = await syncLumenDocument("test-id");
  assert.equal(failed.status, "failed");
  assert.ok(!("error" in failed) || !failed.error?.includes("synthetic-test-secret"));
});
