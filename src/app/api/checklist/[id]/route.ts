import { NextResponse } from "next/server";
import { workspaceAccess } from "@/lib/server/workspace-access";
import { ChecklistError, track, updateChecklist } from "@/lib/server/checklist";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const body = await request.json();
    return NextResponse.json(await updateChecklist(access.studentId, track(body.applicationType), (await params).id, body));
  } catch (error) {
    return NextResponse.json({ error: error instanceof ChecklistError ? error.message : "Unable to save checklist changes." }, { status: error instanceof ChecklistError ? error.status : 500 });
  }
}
