import { NextResponse } from "next/server";
import { ApiError, withApi } from "@/lib/api";
import { getAdminSession } from "@/lib/auth";
import { toCsv } from "@/lib/crm";
import { db } from "@/lib/db";

export const GET = withApi({ name: "admin.export", rateLimit: ["adminExport"], timeoutMs: 20_000 }, async () => {
  if (!(await getAdminSession())) throw new ApiError(401, "UNAUTHORIZED", "Please sign in again.");
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
});
