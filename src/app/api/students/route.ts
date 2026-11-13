import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { students } from "@/db/schema";
import { workspaceAccess } from "@/lib/server/workspace-access";

export async function GET(request: Request) {
  const access = await workspaceAccess(request);
  if (access.error) return access.error;
  const profiles = await getDb().select().from(students).where(eq(students.id, access.studentId));
  return NextResponse.json({ students: profiles.map(({ id, displayName, applicationType }) => ({ id, displayName, applicationType })) });
}

/** Provision/synchronize only the signed-in account's student identity. */
export async function POST(request: Request) {
  const access = await workspaceAccess(request, true);
  if (access.error) return access.error;
  return GET(request);
}
