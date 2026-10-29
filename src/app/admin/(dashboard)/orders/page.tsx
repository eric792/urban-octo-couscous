import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ChevronLeft, ChevronRight, Search, SearchX, ShoppingCart } from "lucide-react";
import { updateOrderStatus } from "@/actions/admin-orders";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { startOfSastToday } from "@/lib/analytics";
import { DELIVERY_OPTIONS, PAID_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { cn, formatDate, formatZAR, toNumber } from "@/lib/utils";
import type { OrderStatus } from "@/types";

export const metadata = { title: "Orders" };

const PAGE_SIZE = 25;
const FILTERS: (OrderStatus | "ALL")[] = ["ALL", "NEW", "PROCESSING", "SHIPPED", "DELIVERED", "PENDING_PAYMENT", "CANCELLED"];

const NEXT_STEP: Partial<Record<OrderStatus, { to: OrderStatus; label: string; className: string }>> = {
  NEW: { to: "PROCESSING", label: "Process", className: "bg-gold-500/20 text-gold-300 hover:bg-gold-500 hover:text-ink-900" },
  PROCESSING: { to: "SHIPPED", label: "Mark shipped", className: "bg-violet-500/20 text-violet-300 hover:bg-violet-500 hover:text-ink-900" },
  SHIPPED: { to: "DELIVERED", label: "Complete", className: "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-ink-900" },
};

type SearchParams = Promise<{ status?: string; q?: string; page?: string }>;

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status = FILTERS.includes(params.status as OrderStatus) ? (params.status as OrderStatus | "ALL") : "ALL";
  const q = params.q?.trim().slice(0, 80) ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(status !== "ALL" && { status }),
    ...(q && {
      OR: [
        { orderNumber: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { customerEmail: { contains: q, mode: "insensitive" } },
        { pargoWaybillCode: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const [orders, total, counts, today] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { items: { select: { productName: true, variantLabel: true, quantity: true } } },
    }),
    db.order.count({ where }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
    db.order.aggregate({
      where: { status: { in: PAID_STATUSES }, createdAt: { gte: startOfSastToday() } },
      _sum: { totalAmount: true },
    }),
  ]);
  const countFor = (s: OrderStatus | "ALL") =>
    s === "ALL" ? counts.reduce((n, c) => n + c._count._all, 0) : counts.find((c) => c.status === s)?._count._all ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (changes: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams();
    const merged = { status: status === "ALL" ? undefined : status, q: q || undefined, page: undefined, ...changes };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "") next.set(k, String(v));
    return `/admin/orders${next.size ? `?${next}` : ""}`;
  };

  return (
    <>
      <AdminHeader eyebrow="Zen Amour Admin" title="Order Management">
        <div className="rounded border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
          Total revenue today: <span className="font-bold text-gold-400">{formatZAR(today._sum.totalAmount)}</span>
        </div>
      </AdminHeader>

      <div className="mb-6 flex flex-col items-stretch justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 lg:flex-row lg:items-center">
        <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1 lg:pb-0">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={link({ status: f === "ALL" ? undefined : f })}
              className={cn(
                "whitespace-nowrap rounded px-3.5 py-2 text-xs font-medium uppercase tracking-wider transition",
                status === f ? "bg-gold-500 font-bold text-ink-900" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white",
              )}
            >
              {f === "ALL" ? "All" : f === "PENDING_PAYMENT" ? "Awaiting payment" : STATUS_LABELS[f]} ({countFor(f)})
            </Link>
          ))}
        </div>
        <form className="relative w-full lg:w-72">
          {status !== "ALL" && <input type="hidden" name="status" value={status} />}
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input name="q" defaultValue={q} placeholder="Search order #, customer, waybill…" className="admin-input py-2 pl-9" />
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/30">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-400">
                <th className="px-4 py-4">Order</th>
                <th className="px-4 py-4">Customer</th>
                <th className="px-4 py-4">Items</th>
                <th className="px-4 py-4">Total (ZAR)</th>
                <th className="px-4 py-4">Payment · Delivery</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-sm">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    {q || status !== "ALL" ? (
                      <EmptyState
                        variant="admin"
                        icon={SearchX}
                        title={q ? `No orders match “${q}”` : "No orders with this status"}
                        description="Try an order number, customer name or email — or clear the filters."
                        action={{ label: "Clear filters", href: "/admin/orders" }}
                      />
                    ) : (
                      <EmptyState
                        variant="admin"
                        icon={ShoppingCart}
                        title="No orders yet"
                        description="Orders appear here the moment a customer checks out."
                        action={{ label: "View store", href: "/" }}
                      />
                    )}
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const step = NEXT_STEP[order.status];
                  return (
                    <tr key={order.id} className="transition hover:bg-zinc-900/60">
                      <td className="whitespace-nowrap px-4 py-4">
                        <Link href={`/admin/orders/${order.id}`} className="font-medium text-gold-400 hover:text-gold-300">#{order.orderNumber}</Link>
                        <p className="text-xs text-zinc-500">{formatDate(order.createdAt, true)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="whitespace-nowrap font-medium text-white">{order.customerName}</div>
                        <div className="text-xs text-zinc-500">{order.customerEmail}</div>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-4 text-zinc-400">
                        {order.items.map((i) => `${i.productName}${i.variantLabel ? ` ${i.variantLabel}` : ""} (x${i.quantity})`).join(", ")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-white">{formatZAR(toNumber(order.totalAmount))}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-zinc-400">
                        <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-300">{order.gateway}</span>
                        <p className="mt-1.5">{DELIVERY_OPTIONS[order.deliveryMethod].short}</p>
                        {order.pargoWaybillCode && <p className="font-mono text-zinc-500">{order.pargoWaybillCode}</p>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4"><OrderStatusBadge status={order.status} /></td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        {step ? (
                          <ActionForm action={updateOrderStatus.bind(null, order.id, step.to)} messageClassName="text-right">
                            <SubmitButton variant="plain" className={cn("rounded px-3 py-1 text-xs font-medium transition", step.className)}>
                              {step.label}
                            </SubmitButton>
                          </ActionForm>
                        ) : (
                          <Link href={`/admin/orders/${order.id}`} className="text-xs text-zinc-500 hover:text-white">View</Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-zinc-400">
          <span>Page {page} of {pages} · {total} orders</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={link({ page: page - 1 })} className="admin-btn-secondary py-1.5"><ChevronLeft className="h-4 w-4" /> Prev</Link>}
            {page < pages && <Link href={link({ page: page + 1 })} className="admin-btn-secondary py-1.5">Next <ChevronRight className="h-4 w-4" /></Link>}
          </div>
        </div>
      )}
    </>
  );
}
