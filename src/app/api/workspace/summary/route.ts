import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { academicTerms, documents, gradeEntries } from "@/db/schema";
import { workspaceAccess } from "@/lib/server/workspace-access";
import { checklistView, ChecklistError } from "@/lib/server/checklist";

export async function GET(request: Request) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  try {
    const checklist = await checklistView(access.studentId);
    const templates = checklist.customTemplates;
    const prepared = templates.filter((entry) => checklist.items[entry.id]?.status === "prepared").length;
    const [documentCounts] = await getDb().select({ total: sql<number>`count(*)::int`, complete: sql<number>`count(*) filter (where ${documents.ocrStatus} = 'complete')::int`, pending: sql<number>`count(*) filter (where ${documents.ocrStatus} = 'pending')::int`, failed: sql<number>`count(*) filter (where ${documents.ocrStatus} = 'failed')::int` }).from(documents).where(eq(documents.studentId, access.studentId));
    const [gradeCounts] = await getDb().select({ total: sql<number>`count(*)::int`, verified: sql<number>`count(*) filter (where ${gradeEntries.verified})::int` }).from(gradeEntries).innerJoin(academicTerms, eq(academicTerms.id, gradeEntries.termId)).where(eq(academicTerms.studentId, access.studentId));
    return NextResponse.json({ checklist: { total: templates.length, prepared, deadline: checklist.deadline }, documents: documentCounts, grades: gradeCounts }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return NextResponse.json({ error: error instanceof ChecklistError ? error.message : "Unable to load workspace progress." }, { status: error instanceof ChecklistError ? error.status : 500 }); }
}
