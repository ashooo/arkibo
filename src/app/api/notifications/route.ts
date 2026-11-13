import { NextResponse } from "next/server";
import { listAnnouncements, openAnnouncementDb } from "@/features/notifications/store.mjs";

export async function GET() {
  let db: ReturnType<typeof openAnnouncementDb> | undefined;
  try {
    db = openAnnouncementDb();
    return NextResponse.json({ notifications: await listAnnouncements(db) }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Announcements are temporarily unavailable." }, { status: 503 });
  } finally {
    await db?.end();
  }
}
