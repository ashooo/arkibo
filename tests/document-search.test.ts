import assert from "node:assert/strict";
import test from "node:test";
import { expandSearchTerms, isExactOnlySearch, matchTypeForDocument } from "../src/lib/search/document-search";

const cor = { originalName: "Certificate of Registration 2026.jpg", category: "enrollment_proof", ocrText: "Certificate of Registration for Computer Science" };

test("COR aliases expand case-insensitively", () => {
  assert.deepEqual(expandSearchTerms("COR"), expandSearchTerms("cor"));
  assert.ok(expandSearchTerms("CoR").includes("certificate of registration"));
});

test("aliases only match whole search tokens", () => {
  assert.deepEqual(expandSearchTerms("scoring"), ["scoring"]);
});

test("OGR expands to grade-report equivalents", () => {
  assert.ok(expandSearchTerms("OGR").includes("official grade report"));
});

test("synonym and OCR matches are classified", () => {
  assert.equal(matchTypeForDocument(cor, "COR", expandSearchTerms("COR")), "synonym");
  assert.equal(matchTypeForDocument({ ...cor, originalName: "scan-1.jpg" }, "computer science", ["computer science"]), "ocr");
});

test("identifiers and subject codes use exact-only matching", () => {
  assert.equal(isExactOnlySearch("2026001234"), true);
  assert.equal(isExactOnlySearch("CS 112"), true);
  assert.equal(isExactOnlySearch("computor science"), false);
});

test("empty query has no expansion", () => {
  assert.deepEqual(expandSearchTerms("  "), []);
});
