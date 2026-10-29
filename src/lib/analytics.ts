import { db } from "@/lib/db";
import { PAID_STATUSES } from "@/lib/constants";
import { toNumber } from "@/lib/utils";

const DAY = 86_400_000;
const SAST_OFFSET = 2 * 3_600_000; // South Africa has no daylight saving

/** YYYY-MM-DD in South African time. */
export function sastDay(date: Date): string {
  return new Date(date.getTime() + SAST_OFFSET).toISOString().slice(0, 10);
}

export function startOfSastToday(): Date {
  const now = Date.now() + SAST_OFFSET;
  return new Date(Math.floor(now / DAY) * DAY - SAST_OFFSET);
}

export async function getDashboardStats() {
  const today = startOfSastToday();
  const since30 = new Date(today.getTime() - 29 * DAY);
  const since60 = new Date(today.getTime() - 59 * DAY);

  const [paidOrders, statusCounts, lowStock, recent, items30, subscribers] = await Promise.all([
    db.order.findMany({
      where: { status: { in: PAID_STATUSES }, createdAt: { gte: since60 } },
      select: { createdAt: true, totalAmount: true, customerEmail: true },
    }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
    db.productVariant.findMany({
      where: { stock: { lte: 5 }, product: { isActive: true } },
      include: { product: { select: { name: true, id: true } } },
      orderBy: { stock: "asc" },
      take: 8,
    }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { items: { select: { quantity: true } } } }),
    db.orderItem.findMany({
      where: { order: { status: { in: PAID_STATUSES }, createdAt: { gte: since30 } } },
      select: { productName: true, quantity: true, price: true },
    }),
    db.subscriber.count(),
  ]);

  const current = paidOrders.filter((o) => o.createdAt >= since30);
  const previous = paidOrders.filter((o) => o.createdAt < since30);
  const sum = (list: { totalAmount: unknown }[]) => list.reduce((s, o) => s + toNumber(o.totalAmount as number), 0);

  const revenue30 = sum(current);
  const revenuePrev = sum(previous);
  const revenueToday = sum(current.filter((o) => o.createdAt >= today));

  // Last 14 days revenue, oldest first.
  const days = Array.from({ length: 14 }, (_, i) => sastDay(new Date(today.getTime() - (13 - i) * DAY)));
  const byDay = new Map(days.map((d) => [d, { revenue: 0, orders: 0 }]));
  for (const o of current) {
    const bucket = byDay.get(sastDay(o.createdAt));
    if (bucket) {
      bucket.revenue += toNumber(o.totalAmount);
      bucket.orders += 1;
    }
  }

  const products = new Map<string, { units: number; revenue: number }>();
  for (const i of items30) {
    const p = products.get(i.productName) ?? { units: 0, revenue: 0 };
    p.units += i.quantity;
    p.revenue += toNumber(i.price) * i.quantity;
    products.set(i.productName, p);
  }

  const counts = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all])) as Record<string, number>;

  return {
    revenueToday,
    revenue30,
    revenueChange: revenuePrev > 0 ? ((revenue30 - revenuePrev) / revenuePrev) * 100 : null,
    orders30: current.length,
    aov: current.length ? revenue30 / current.length : 0,
    customers30: new Set(current.map((o) => o.customerEmail)).size,
    toFulfil: (counts.NEW ?? 0) + (counts.PROCESSING ?? 0),
    awaitingPayment: counts.PENDING_PAYMENT ?? 0,
    counts,
    subscribers,
    daily: days.map((d) => ({ day: d, ...byDay.get(d)! })),
    topProducts: [...products.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
    lowStock: lowStock.map((v) => ({ id: v.id, productId: v.product.id, name: v.product.name, volume: v.volume, sku: v.sku, stock: v.stock })),
    recent: recent.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      total: toNumber(o.totalAmount),
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      units: o.items.reduce((n, i) => n + i.quantity, 0),
    })),
  };
}
