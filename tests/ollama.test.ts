import assert from "node:assert/strict";
import test from "node:test";
import { qwenChat, qwenSettings } from "../src/lib/ai/ollama";

test("Ollama configuration rejects remote endpoints and embedded credentials", () => {
  const previous = process.env.OLLAMA_BASE_URL;
  try {
    for (const endpoint of ["https://example.com", "http://user:secret@localhost:11434", "file:///tmp/model"]) {
      process.env.OLLAMA_BASE_URL = endpoint;
      assert.throws(qwenSettings);
    }
  } finally {
    if (previous === undefined) delete process.env.OLLAMA_BASE_URL;
    else process.env.OLLAMA_BASE_URL = previous;
  }
});

test("local inference failures remain honest and do not leak provider output", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => { throw new Error("private provider diagnostics"); };
    await assert.rejects(qwenChat([{ role: "user", content: "Synthetic text" }]), /unavailable or timed out/);
    globalThis.fetch = async () => new Response("private provider diagnostics", { status: 503 });
    await assert.rejects(qwenChat([]), /could not process/);
    for (const output of [
      { message: { content: "partial" }, done_reason: "length" },
      { message: { content: "", tool_calls: [{ function: { name: "get_document", arguments: "invalid" } }] } },
    ]) {
      globalThis.fetch = async () => Response.json(output);
      await assert.rejects(qwenChat([]), /incomplete response|invalid tool call/);
    }
  } finally { globalThis.fetch = original; }
});

test("classification and conversational native tools use separate request contracts", async () => {
  const original = globalThis.fetch;
  const requests: Record<string, unknown>[] = [];
  try {
    globalThis.fetch = async (_input, init) => {
      requests.push(JSON.parse(String(init?.body)));
      return Response.json({ done: true, message: { role: "assistant", content: "Synthetic response" } });
    };
    await qwenChat([{ role: "user", content: "Synthetic OCR" }], { format: { type: "object" } });
    await qwenChat([{ role: "user", content: "Hello" }], { tools: [{ type: "function" }] });
    assert.ok(requests[0].format);
    assert.equal(requests[0].tools, undefined);
    assert.ok(requests[1].tools);
    assert.equal(requests[1].format, undefined);
    assert.deepEqual(requests[1].messages, [{ role: "user", content: "Hello" }]);
  } finally { globalThis.fetch = original; }
});
