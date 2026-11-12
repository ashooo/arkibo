import { NextResponse } from "next/server";
import { workspaceAccess } from "@/lib/server/workspace-access";
import { ChecklistError, track, updateChecklist } from "@/lib/server/checklist";

type Context = { params: Promise<{ id: string }> };
async function change(request: Request, context: Context, action: "append" | "remove") {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const body = await request.json();
    return NextResponse.json(await updateChecklist(access.studentId, track(body.applicationType), (await context.params).id, body, action));
  } catch (error) {
    return NextResponse.json({ error: error instanceof ChecklistError ? error.message : "Unable to update the attachment." }, { status: error instanceof ChecklistError ? error.status : 500 });
  }
}
export async function POST(request: Request, context: Context) { return change(request, context, "append"); }
export async function DELETE(request: Request, context: Context) { return change(request, context, "remove"); }
