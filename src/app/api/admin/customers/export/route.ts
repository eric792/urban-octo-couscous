import { NextResponse } from "next/server";
import { ApiError, withApi } from "@/lib/api";
import { getAdminSession } from "@/lib/auth";
import { getCustomers, toCsv } from "@/lib/crm";

export const GET = withApi({ name: "admin.export", rateLimit: ["adminExport"], timeoutMs: 20_000 }, async (req) => {
  if (!(await getAdminSession())) throw new ApiError(401, "UNAUTHORIZED", "Please sign in again.");
  const segment = new URL(req.url).searchParams.get("segment");
  const customers = (await getCustomers()).filter((c) => !segment || c.segment === segment);

  const csv = toCsv([
    ["Name", "Email", "Phone", "Province", "Segment", "Orders", "Total spent (ZAR)", "First order", "Last order", "Newsletter"],
    ...customers.map((c) => [c.name, c.email, c.phone, c.province, c.segment, c.orders, c.spent.toFixed(2), c.firstOrder.slice(0, 10), c.lastOrder.slice(0, 10), c.subscribed ? "yes" : "no"]),
  ]);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zen-amour-customers${segment ? `-${segment.toLowerCase()}` : ""}.csv"`,
    },
  });
});
