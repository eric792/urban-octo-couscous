import Link from "next/link";
import { Download, Mail, Search, SearchX, Users } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { MetricsCard } from "@/components/admin/MetricsCard";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCustomers, SEGMENT_INFO, type Segment } from "@/lib/crm";
import { cn, formatDate, formatZAR, whatsappLink } from "@/lib/utils";

export const metadata = { title: "Customers" };

const SEGMENTS: Segment[] = ["VIP", "Loyal", "Repeat", "New", "Lapsed"];
const TONES: Record<Segment, BadgeTone> = { VIP: "gold", Loyal: "purple", Repeat: "blue", New: "green", Lapsed: "zinc" };

type SearchParams = Promise<{ q?: string; segment?: string }>;

export default async function AdminCustomersPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", segment } = await searchParams;
  const all = await getCustomers();
  const query = q.trim().toLowerCase();
  const customers = all.filter(
    (c) =>
      (!segment || c.segment === segment) &&
      (!query || c.email.includes(query) || c.name.toLowerCase().includes(query) || (c.phone ?? "").includes(query)),
  );

  const totalSpent = all.reduce((s, c) => s + c.spent, 0);
  const repeatRate = all.length ? (all.filter((c) => c.orders > 1).length / all.length) * 100 : 0;
  const count = (s: Segment) => all.filter((c) => c.segment === s).length;

  return (
    <>
      <AdminHeader eyebrow="CRM & Segmentation" title="Customers">
        <a href={`/api/admin/customers/export${segment ? `?segment=${segment}` : ""}`} className="admin-btn-secondary">
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </AdminHeader>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricsCard label="Customers" value={String(all.length)} hint="with a paid order" />
        <MetricsCard label="Lifetime value" value={formatZAR(all.length ? totalSpent / all.length : 0)} hint="average per customer" />
        <MetricsCard label="Repeat rate" value={`${repeatRate.toFixed(0)}%`} hint="ordered more than once" />
        <MetricsCard label="Subscribers" value={String(all.filter((c) => c.subscribed).length)} hint="customers on your list" />
      </div>

      <div className="mb-6 flex flex-col justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 lg:flex-row lg:items-center">
        <div className="scrollbar-thin flex gap-2 overflow-x-auto">
          <Link
            href="/admin/customers"
            className={cn("whitespace-nowrap rounded px-3.5 py-2 text-xs font-medium uppercase tracking-wider", !segment ? "bg-gold-500 font-bold text-ink-900" : "bg-zinc-800 text-zinc-400 hover:text-white")}
          >
            All ({all.length})
          </Link>
          {SEGMENTS.map((s) => (
            <Link
              key={s}
              href={`/admin/customers?segment=${s}`}
              title={SEGMENT_INFO[s]}
              className={cn("whitespace-nowrap rounded px-3.5 py-2 text-xs font-medium uppercase tracking-wider", segment === s ? "bg-gold-500 font-bold text-ink-900" : "bg-zinc-800 text-zinc-400 hover:text-white")}
            >
              {s} ({count(s)})
            </Link>
          ))}
        </div>
        <form className="relative w-full lg:w-72">
          {segment && <input type="hidden" name="segment" value={segment} />}
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input name="q" defaultValue={q} placeholder="Search name, email, phone…" className="admin-input py-2 pl-9" />
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Segment</th>
                <th className="px-5 py-4">Orders</th>
                <th className="px-5 py-4">Total spent</th>
                <th className="px-5 py-4">Last order</th>
                <th className="px-5 py-4">Province</th>
                <th className="px-5 py-4 text-right">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {customers.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    {all.length === 0 ? (
                      <EmptyState variant="admin" icon={Users} title="No customers yet" description="Customers appear here after their first paid order." />
                    ) : (
                      <EmptyState
                        variant="admin"
                        icon={SearchX}
                        title={query ? `No customers match “${q.trim()}”` : "No customers in this segment"}
                        description="Try a different name, email or phone number, or another segment."
                        action={{ label: "Show all customers", href: "/admin/customers" }}
                      />
                    )}
                  </td>
                </tr>
              )}
              {customers.map((c) => (
                <tr key={c.email} className="hover:bg-zinc-900/60">
                  <td className="px-5 py-4">
                    <Link href={`/admin/orders?q=${encodeURIComponent(c.email)}`} className="font-medium text-white hover:text-gold-300">{c.name}</Link>
                    <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                      {c.email}
                      {c.subscribed && <Mail className="h-3 w-3 text-gold-500" aria-label="Newsletter subscriber" />}
                    </p>
                  </td>
                  <td className="px-5 py-4"><Badge tone={TONES[c.segment]}>{c.segment}</Badge></td>
                  <td className="px-5 py-4 text-zinc-300">{c.orders}</td>
                  <td className="px-5 py-4 font-semibold text-white">{formatZAR(c.spent)}</td>
                  <td className="px-5 py-4 text-zinc-400">{formatDate(c.lastOrder)}</td>
                  <td className="px-5 py-4 text-zinc-400">{c.province ?? "—"}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-3 text-xs">
                      <a href={`mailto:${c.email}`} className="text-zinc-400 hover:text-gold-300">Email</a>
                      {c.phone && <a href={whatsappLink(c.phone)} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-gold-300">WhatsApp</a>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
