import { NextResponse } from "next/server";
import { sampleNotifications } from "@/data/sample-notifications";

export async function GET() { return NextResponse.json({ notifications: sampleNotifications }); }
