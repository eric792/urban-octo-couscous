import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { toCsv } from "@/lib/crm";
import { db } from "@/lib/db";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const subscribers = await db.subscriber.findMany({ orderBy: { createdAt: "desc" } });
  const csv = toCsv([
    ["Email", "Source", "Subscribed at"],
    ...subscribers.map((s) => [s.email, s.source, s.createdAt.toISOString()]),
  ]);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="zen-amour-subscribers.csv"',
    },
  });
}
