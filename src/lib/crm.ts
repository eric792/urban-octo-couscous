import { db } from "@/lib/db";
import { PAID_STATUSES } from "@/lib/constants";
import { toNumber } from "@/lib/utils";

export type Segment = "VIP" | "Loyal" | "Repeat" | "New" | "Lapsed";

export const SEGMENT_INFO: Record<Segment, string> = {
  VIP: "Spent R3,000+",
  Loyal: "3+ orders",
  Repeat: "2 orders",
  New: "First order in the last 90 days",
  Lapsed: "No order in 90+ days",
};

export interface CustomerRow {
  email: string;
  name: string;
  phone: string | null;
  province: string | null;
  orders: number;
  spent: number;
  firstOrder: string;
  lastOrder: string;
  segment: Segment;
  subscribed: boolean;
}

function segmentFor(spent: number, orders: number, lastOrder: Date): Segment {
  if (spent >= 3000) return "VIP";
  if (Date.now() - lastOrder.getTime() > 90 * 86_400_000) return "Lapsed";
  if (orders >= 3) return "Loyal";
  if (orders === 2) return "Repeat";
  return "New";
}

/** Customers are built from paid orders, so guest checkout shoppers are included. */
export async function getCustomers(): Promise<CustomerRow[]> {
  const [orders, subscribers] = await Promise.all([
    db.order.findMany({
      where: { status: { in: PAID_STATUSES } },
      select: { customerEmail: true, customerName: true, customerPhone: true, totalAmount: true, createdAt: true, shippingAddress: true },
      orderBy: { createdAt: "asc" },
    }),
    db.subscriber.findMany({ select: { email: true } }),
  ]);
  const subscribed = new Set(subscribers.map((s) => s.email));

  const map = new Map<string, { name: string; phone: string | null; province: string | null; orders: number; spent: number; first: Date; last: Date }>();
  for (const o of orders) {
    const province = (o.shippingAddress as Record<string, string> | null)?.province ?? null;
    const row = map.get(o.customerEmail);
    if (!row) {
      map.set(o.customerEmail, { name: o.customerName, phone: o.customerPhone, province, orders: 1, spent: toNumber(o.totalAmount), first: o.createdAt, last: o.createdAt });
    } else {
      row.orders += 1;
      row.spent += toNumber(o.totalAmount);
      row.last = o.createdAt;
      row.name = o.customerName; // latest
      row.phone = o.customerPhone ?? row.phone;
      row.province = province ?? row.province;
    }
  }

  return [...map.entries()]
    .map(([email, r]) => ({
      email,
      name: r.name,
      phone: r.phone,
      province: r.province,
      orders: r.orders,
      spent: r.spent,
      firstOrder: r.first.toISOString(),
      lastOrder: r.last.toISOString(),
      segment: segmentFor(r.spent, r.orders, r.last),
      subscribed: subscribed.has(email),
    }))
    .sort((a, b) => b.spent - a.spent);
}

export function toCsv(rows: (string | number | boolean | null)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          let value = cell === null ? "" : String(cell);
          // Prevent spreadsheet formula injection.
          if (/^[=+\-@]/.test(value)) value = `'${value}`;
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(","),
    )
    .join("\n");
}
