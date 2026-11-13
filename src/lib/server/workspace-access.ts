import "server-only";
import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db/client";
import { accounts, accountSessions, students, documents, academicTerms, gradeEntries } from "@/db/schema";

type Access = { studentId: string; error?: never } | { studentId?: never; error: NextResponse };
const fail = (message: string, status: number): Access => ({ error: NextResponse.json({ error: message }, { status }) });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Authenticate every workspace API, including direct file and OCR requests. */
export async function workspaceAccess(request: Request, provision = false): Promise<Access> {
  const req = new NextRequest(request.url, { headers: request.headers });
  const origin = req.headers.get("origin");
  // Next can normalize the URL hostname to localhost even when the browser uses 127.0.0.1.
  const host = req.headers.get("host");
  const expectedOrigin = host ? `${req.nextUrl.protocol}//${host}` : req.nextUrl.origin;
  if (request.method !== "GET" && origin && origin !== expectedOrigin) {
    return fail("Invalid request origin.", 403);
  }
  const token = req.cookies.get("scholarready_session")?.value;
  if (!token) return fail("Sign in to access your documents and grades.", 401);
  try {
    const db = getDb();
    const [account] = await db.select({ id: accounts.id, profile: accounts.profile }).from(accounts)
      .innerJoin(accountSessions, eq(accountSessions.account_id, accounts.id))
      .where(and(eq(accountSessions.token_hash, createHash("sha256").update(token).digest("hex")), gt(accountSessions.expires_at, new Date()))).limit(1);
    if (!account) return fail("Your session has expired. Sign in again.", 401);
    if (!account.profile) return fail("Complete your account profile first.", 409);
    if (provision) {
      await db.insert(students).values({ accountId: account.id, displayName: account.profile.name, applicationType: account.profile.track })
        .onConflictDoUpdate({ target: students.accountId, set: { displayName: account.profile.name, applicationType: account.profile.track } });
    }
    const [student] = await db.select().from(students).where(eq(students.accountId, account.id)).limit(1);
    if (!student) return fail("Open your workspace to initialize your account profile.", 409);
    const studentId = student.id;
    const ownsDocument = async (id: string) => uuid.test(id) && (await db.select({ id: documents.id }).from(documents).where(and(eq(documents.id, id), eq(documents.studentId, studentId))).limit(1)).length > 0;
    const ownsTerm = async (id: string) => uuid.test(id) && (await db.select({ id: academicTerms.id }).from(academicTerms).where(and(eq(academicTerms.id, id), eq(academicTerms.studentId, studentId))).limit(1)).length > 0;
    const pathId = req.nextUrl.pathname.match(/^\/api\/documents\/([^/]+)/)?.[1];
    if (pathId && !await ownsDocument(pathId)) return fail("Document not found.", 404);
    const requestedStudent = req.nextUrl.searchParams.get("studentId");
    if (requestedStudent && requestedStudent !== studentId) return fail("Student profile not found.", 404);
    const termId = req.nextUrl.searchParams.get("termId");
    if (termId && !await ownsTerm(termId)) return fail("Academic term not found.", 404);
    if (req.headers.get("content-type")?.startsWith("application/json")) {
      const body = await request.clone().json();
      if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Expected a JSON object.", 400);
      if (body.studentId && body.studentId !== studentId) return fail("Student profile not found.", 404);
      if (body.termId && !await ownsTerm(body.termId)) return fail("Academic term not found.", 404);
      for (const id of [body.documentId, body.sourceDocumentId].filter(Boolean)) {
        if (typeof id !== "string" || !await ownsDocument(id)) return fail("Document not found.", 404);
      }
      if (req.nextUrl.pathname === "/api/grades" && body.id) {
        const [grade] = uuid.test(body.id) ? await db.select({ id: gradeEntries.id }).from(gradeEntries)
          .innerJoin(academicTerms, eq(academicTerms.id, gradeEntries.termId))
          .where(and(eq(gradeEntries.id, body.id), eq(academicTerms.studentId, studentId))).limit(1) : [];
        if (!grade) return fail("Grade entry not found.", 404);
      }
    }
    return { studentId };
  } catch (error) {
    if (error instanceof SyntaxError) return fail("Invalid JSON request.", 400);
    return fail("Account workspace unavailable. Check database alignment.", 503);
  }
}
