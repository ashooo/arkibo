export type ChatInputMessage = { role: "user" | "assistant"; content: string; documentIds: string[] };
export class ChatInputError extends Error {}
export const DEFAULT_DOCUMENT_PROMPT = "Please inspect the attached documents, identify what they are, and suggest how I can use them for my scholarship checklist. Do not confirm changes or complete requirements.";
export function parseChatInput(value: unknown): ChatInputMessage[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) throw new ChatInputError("Send 1–20 conversation messages.");
  let length = 0;
  const ids = new Set<string>();
  const messages = value.map((entry) => {
    if (!entry || !["user", "assistant"].includes(entry.role) || typeof entry.content !== "string" || entry.content.length > 4000) throw new ChatInputError("Messages must be user/assistant text up to 4,000 characters.");
    const documentIds: unknown = entry.documentIds ?? [];
    if (!Array.isArray(documentIds) || documentIds.length > 3 || documentIds.some((id) => typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) || (entry.role !== "user" && documentIds.length)) throw new ChatInputError("Attach up to three saved documents to a user message.");
    const unique = [...new Set(documentIds as string[])];
    unique.forEach((id) => ids.add(id));
    const content = entry.content.trim() || (unique.length ? DEFAULT_DOCUMENT_PROMPT : "");
    if (!content) throw new ChatInputError("Write a message or attach a document.");
    length += content.length;
    return { role: entry.role as "user" | "assistant", content, documentIds: unique };
  });
  if (length > 20000 || ids.size > 20 || messages.at(-1)?.role !== "user") throw new ChatInputError("Shorten this conversation or start a new one.");
  return messages;
}
