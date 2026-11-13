import { NextResponse } from "next/server";
import { workspaceAccess } from "@/lib/server/workspace-access";
import { assistantTurn } from "@/lib/server/assistant";
import { ChatInputError, parseChatInput } from "@/lib/ai/assistant-input";
import { AttachmentAccessError, prepareChatContext } from "@/lib/server/assistant-context";
import { LocalModelError } from "@/lib/ai/ollama";

export const maxDuration = 300;
export async function POST(request: Request) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const body = await request.json();
    const history = await prepareChatContext(access.studentId, parseChatInput(body.messages));
    return NextResponse.json(await assistantTurn(access.studentId, history, request.signal), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ChatInputError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof AttachmentAccessError) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof LocalModelError) return NextResponse.json({ error: error.message }, { status: 503 });
    return NextResponse.json({ error: error instanceof SyntaxError ? "Invalid JSON request." : "Local AI is unavailable or could not finish. Your document library is still available." }, { status: error instanceof SyntaxError ? 400 : 503 });
  }
}
