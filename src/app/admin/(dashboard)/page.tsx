import Link from "next/link";
import { AlertTriangle, ArrowRight, Mail, Package, ShoppingCart, Users, Wallet } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricsCard } from "@/components/admin/MetricsCard";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { getDashboardStats } from "@/lib/analytics";
import { formatDate, formatZAR } from "@/lib/utils";

export const metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  const s = await getDashboardStats();

  return (
    <>
      <AdminHeader eyebrow="Zen Amour Admin" title="Analytics & Overview">
        <div className="rounded border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
          Revenue today: <span className="font-bold text-gold-400">{formatZAR(s.revenueToday)}</span>
        </div>
      </AdminHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricsCard label="Revenue · 30 days" value={formatZAR(s.revenue30)} change={s.revenueChange} hint="vs previous 30" Icon={Wallet} />
        <MetricsCard label="Paid orders · 30 days" value={String(s.orders30)} hint={`${s.customers30} customers`} Icon={ShoppingCart} />
        <MetricsCard label="Average order" value={formatZAR(s.aov)} hint="30 days" Icon={Users} />
        <MetricsCard label="To fulfil" value={String(s.toFulfil)} hint={`${s.awaitingPayment} awaiting payment`} Icon={Package} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="admin-card p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-medium text-white">Daily revenue</h2>
              <p className="text-xs text-zinc-500">Paid orders, last 14 days (SAST)</p>
            </div>
          </div>
          <RevenueChart data={s.daily} />
        </section>

        <section className="admin-card p-6">
          <h2 className="font-medium text-white">Top products · 30 days</h2>
          {s.topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No sales yet.</p>
          ) : (
            <ol className="mt-4 space-y-4">
              {s.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-3">
                    <span className="w-4 text-zinc-600">{i + 1}</span>
                    <span className="text-zinc-200">{p.name}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-white">{formatZAR(p.revenue)}</span>
                    <span className="text-xs text-zinc-500">{p.units} sold</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-6 flex items-center gap-3 border-t border-zinc-800 pt-4 text-sm text-zinc-400">
            <Mail className="h-4 w-4 text-gold-500" /> {s.subscribers} newsletter subscribers
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="admin-card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
            <h2 className="font-medium text-white">Recent orders</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300">
              All orders <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {s.recent.length === 0 ? (
            <EmptyState variant="admin" icon={ShoppingCart} title="No orders yet" description="Orders appear here the moment a customer checks out." action={{ label: "View store", href: "/" }} />
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-zinc-800/60">
                {s.recent.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-900/60">
                    <td className="px-6 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="font-medium text-gold-400 hover:text-gold-300">{o.orderNumber}</Link>
                      <p className="text-xs text-zinc-500">{formatDate(o.createdAt, true)}</p>
                    </td>
                    <td className="px-6 py-3 text-zinc-300">{o.customerName}</td>
                    <td className="px-6 py-3 text-zinc-400">{o.units} items</td>
                    <td className="px-6 py-3 font-medium text-white">{formatZAR(o.total)}</td>
                    <td className="px-6 py-3"><OrderStatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </section>

        <section className="admin-card p-6">
          <h2 className="flex items-center gap-2 font-medium text-white">
            <AlertTriangle className="h-4 w-4 text-gold-400" /> Low stock
          </h2>
          {s.lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Everything is well stocked.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {s.lowStock.map((v) => (
                <li key={v.id} className="flex items-center justify-between text-sm">
                  <Link href={`/admin/inventory/${v.productId}`} className="text-zinc-300 hover:text-white">
                    {v.name} <span className="text-zinc-500">{v.volume}</span>
                  </Link>
                  <span className={v.stock === 0 ? "font-semibold text-rose-300" : "text-gold-300"}>
                    {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
