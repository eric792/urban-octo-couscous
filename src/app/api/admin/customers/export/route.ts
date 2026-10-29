import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getCustomers, toCsv } from "@/lib/crm";

export async function GET(req: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
}
