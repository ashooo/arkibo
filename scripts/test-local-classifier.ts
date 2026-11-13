// Synthetic OCR only; no database writes and no Lumen calls.
import assert from "node:assert/strict";
import { classificationMessages, classificationSchema, validateClassification } from "../src/lib/ai/document-classification";
import { qwenChat } from "../src/lib/ai/ollama";
const candidates = [{ id: "renewal-proof-enrollment", title: "Proof of Enrollment", description: "Current enrollment record" }];
async function main() {
const ocr = "Pamantasan ng Lungsod ng Pasig\nOFFICIALLY ENROLLED\n1st Sem 2026-2027\nCLASS SCHEDULE\nCS 112 Computer Science 3 units\nASSESSMENT OF FEES\nTuition Fee\nOffice of the University Registrar";
const reply = await qwenChat(classificationMessages(ocr, candidates), { format: classificationSchema });
const result = validateClassification(JSON.parse(reply.content), ocr, candidates);
console.log({ test: "Synthetic registration record", result });
assert.equal(result.category, "certificate_of_registration");
const unknown = "Synthetic shopping list: tomatoes, apples, soap.";
const unknownReply = await qwenChat(classificationMessages(unknown, candidates), { format: classificationSchema });
assert.equal(validateClassification(JSON.parse(unknownReply.content), unknown, candidates).category, "unclassified");
console.log("Synthetic local model classification checks passed.");
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });
