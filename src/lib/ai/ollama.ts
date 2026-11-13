export type ModelToolCall = { function: { name: string; arguments: Record<string, unknown> } };
export type ModelMessage = { role: "system" | "user" | "assistant" | "tool"; content: string; tool_calls?: ModelToolCall[]; tool_name?: string };
export class LocalModelError extends Error {}
export function qwenSettings() {
  const base = new URL(process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434");
  if (!["http:", "https:"].includes(base.protocol) || !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname) || base.username || base.password) throw new Error("Configure a local Ollama endpoint.");
  return { url: new URL("/api/chat", base), model: process.env.QWEN_MODEL ?? "qwen3.5:2b" };
}
export async function qwenChat(messages: ModelMessage[], options: { format?: object; tools?: readonly object[]; signal?: AbortSignal } = {}) {
  const settings = qwenSettings();
  let response: Response;
  try {
    const timeout = AbortSignal.timeout(180000);
    response = await fetch(settings.url, { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", signal: options.signal ? AbortSignal.any([timeout, options.signal]) : timeout, body: JSON.stringify({ model: settings.model, messages, stream: false, think: false, keep_alive: "5m", ...(options.format ? { format: options.format } : {}), ...(options.tools ? { tools: options.tools } : {}), options: { temperature: options.format ? 0 : 0.4, ...(options.format ? { presence_penalty: 0, repeat_penalty: 1, top_p: 1 } : {}), num_predict: options.format ? 1400 : 1800, num_ctx: 8192 } }) });
  } catch { throw new LocalModelError("Local AI is unavailable or timed out. You can still save documents and edit their category manually."); }
  if (!response.ok) throw new LocalModelError("Local AI could not process this request. Check that Ollama and the configured model are running.");
  const result = await response.json().catch(() => { throw new LocalModelError("Local AI returned an invalid response. Please try again."); });
  if (!result || !result.message || typeof result.message.content !== "string" || result.done === false || result.done_reason === "length") throw new LocalModelError("Local AI returned an incomplete response. Please try a shorter question or one document at a time.");
  const message = result.message as ModelMessage;
  if (message.tool_calls && (!Array.isArray(message.tool_calls) || message.tool_calls.some((call) => !call.function || typeof call.function.name !== "string" || !call.function.arguments || typeof call.function.arguments !== "object" || Array.isArray(call.function.arguments)))) throw new LocalModelError("Local AI returned an invalid tool call. Please try again.");
  return message;
}
