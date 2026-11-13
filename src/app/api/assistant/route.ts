import { NextResponse } from "next/server";
import { workspaceAccess } from "@/lib/server/workspace-access";
import { assistantTurn } from "@/lib/server/assistant";
import type { ModelMessage } from "@/lib/ai/ollama";

export const maxDuration = 300;
export async function POST(request: Request) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const body = await request.json();
    if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 20) return NextResponse.json({ error: "Send 1–20 conversation messages." }, { status: 400 });
    const history: ModelMessage[] = [];
    let length = 0;
    for (const entry of body.messages) {
      if (!entry || !["user", "assistant"].includes(entry.role) || typeof entry.content !== "string" || !entry.content.trim() || entry.content.length > 4000) return NextResponse.json({ error: "Messages must be user/assistant text up to 4,000 characters." }, { status: 400 });
      length += entry.content.length;
      history.push({ role: entry.role, content: entry.content });
    }
    if (length > 20000 || history.at(-1)?.role !== "user") return NextResponse.json({ error: "Shorten this conversation or start a new one." }, { status: 400 });
    return NextResponse.json(await assistantTurn(access.studentId, history, request.signal), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return NextResponse.json({ error: error instanceof SyntaxError ? "Invalid JSON request." : "Local AI is unavailable or could not finish. Your document library is still available." }, { status: error instanceof SyntaxError ? 400 : 503 }); }
}
