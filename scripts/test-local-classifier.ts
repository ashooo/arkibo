// Synthetic OCR only; no database writes and no Lumen calls.
import assert from "node:assert/strict";
import { classificationMessages, classificationSchemaFor, validateClassification } from "../src/lib/ai/document-classification";
import { qwenChat } from "../src/lib/ai/ollama";
const candidates = [{ id: "renewal-proof-enrollment", title: "Proof of Enrollment", description: "Current enrollment record" }];
async function main() {
if (process.argv.includes("--semantic")) {
  console.log(await qwenChat([{ role: "system", content: "Identify document types from content. Be accurate and concise." }, { role: "user", content: "A university document says OFFICIALLY ENROLLED, lists a CLASS SCHEDULE with subject codes and units, and includes an ASSESSMENT OF FEES for 1st Sem 2026-2027. Is it a Certificate of Registration, grade report, or residency certificate? Explain in one sentence." }]));
  return;
}
const ocr = "Pamantasan ng Lungsod ng Pasig\nOFFICIALLY ENROLLED\n1st Sem 2026-2027\nCLASS SCHEDULE\nCS 112 Computer Science 3 units\nASSESSMENT OF FEES\nTuition Fee\nOffice of the University Registrar";
const reply = await qwenChat(classificationMessages(ocr, candidates), { format: classificationSchemaFor(ocr) });
console.log({ syntheticRawResponse: reply.content });
const result = validateClassification(JSON.parse(reply.content), ocr, candidates);
console.log({ test: "Synthetic registration record", result });
assert.equal(result.category, "certificate_of_registration");
const unknown = "Synthetic shopping list: tomatoes, apples, soap.";
const unknownReply = await qwenChat(classificationMessages(unknown, candidates), { format: classificationSchemaFor(unknown) });
assert.equal(validateClassification(JSON.parse(unknownReply.content), unknown, candidates).category, "unclassified");
console.log("Synthetic local model classification checks passed.");
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });
