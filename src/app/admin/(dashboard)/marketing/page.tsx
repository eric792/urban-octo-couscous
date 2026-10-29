import Link from "next/link";
import { ArrowRight, Download, Mail, Percent, ShoppingCart, Target, Trash2 } from "lucide-react";
import { createDiscount, deleteDiscount, toggleDiscount } from "@/actions/admin-marketing";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatDate, formatZAR, toNumber, whatsappLink } from "@/lib/utils";

export const metadata = { title: "Marketing" };

export default async function AdminMarketingPage() {
  const [codes, subscriberCount, recentSubscribers, abandoned, settings] = await Promise.all([
    db.discountCode.findMany({ orderBy: { createdAt: "desc" } }),
    db.subscriber.count(),
    db.subscriber.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    db.order.findMany({
      where: { status: { in: ["PENDING_PAYMENT", "CANCELLED"] }, paidAt: null, createdAt: { gte: new Date(Date.now() - 14 * 86_400_000) } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, orderNumber: true, customerName: true, customerEmail: true, customerPhone: true, totalAmount: true, createdAt: true },
    }),
    getSettings(),
  ]);

  const pixels = [
    ["Meta Pixel", settings.metaPixelId],
    ["TikTok Pixel", settings.tiktokPixelId],
    ["Google Analytics 4", settings.ga4MeasurementId],
    ["Google Tag Manager", settings.googleTagManagerId],
  ] as const;

  return (
    <>
      <AdminHeader eyebrow="Growth" title="Marketing" />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="admin-card lg:col-span-2">
          <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-4">
            <Percent className="h-5 w-5 text-gold-400" />
            <h2 className="font-medium text-white">Discount codes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Offer</th>
                  <th className="px-6 py-3">Used</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {codes.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState variant="admin" icon={Percent} title="No discount codes yet" description="Create your first code with the form below — e.g. WELCOME10 for new subscribers." />
                    </td>
                  </tr>
                )}
                {codes.map((c) => {
                  const expired = c.expiresAt && c.expiresAt < new Date();
                  return (
                    <tr key={c.id}>
                      <td className="px-6 py-3">
                        <p className="font-mono font-semibold text-gold-300">{c.code}</p>
                        {c.description && <p className="text-xs text-zinc-500">{c.description}</p>}
                      </td>
                      <td className="px-6 py-3 text-zinc-300">
                        {c.type === "PERCENTAGE" ? `${toNumber(c.value)}% off` : c.type === "FIXED_AMOUNT" ? `${formatZAR(c.value)} off` : "Free delivery"}
                        {c.minSubtotal && <p className="text-xs text-zinc-500">Min. spend {formatZAR(c.minSubtotal)}</p>}
                        {c.expiresAt && <p className="text-xs text-zinc-500">Ends {formatDate(c.expiresAt)}</p>}
                      </td>
                      <td className="px-6 py-3 text-zinc-400">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                      <td className="px-6 py-3">
                        {expired ? <Badge tone="zinc">Expired</Badge> : c.active ? <Badge tone="green">Active</Badge> : <Badge tone="zinc">Paused</Badge>}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex justify-end gap-3">
                          <ActionForm action={toggleDiscount.bind(null, c.id)}>
                            <SubmitButton variant="plain" className="text-xs text-zinc-400 hover:text-white">{c.active ? "Pause" : "Activate"}</SubmitButton>
                          </ActionForm>
                          <ActionForm action={deleteDiscount.bind(null, c.id)} confirmText={`Delete ${c.code}?`}>
                            <SubmitButton variant="plain" className="text-zinc-500 hover:text-rose-300" aria-label={`Delete ${c.code}`}><Trash2 className="h-4 w-4" /></SubmitButton>
                          </ActionForm>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ActionForm action={createDiscount} className="grid gap-4 border-t border-zinc-800 p-6 sm:grid-cols-3" resetOnSuccess>
            <h3 className="text-sm font-medium text-white sm:col-span-3">Create a code</h3>
            <div>
              <label className="admin-label" htmlFor="code">Code</label>
              <input id="code" name="code" required placeholder="WINTER15" className="admin-input font-mono uppercase" />
            </div>
            <div>
              <label className="admin-label" htmlFor="type">Type</label>
              <select id="type" name="type" className="admin-input">
                <option value="PERCENTAGE">% off</option>
                <option value="FIXED_AMOUNT">Rand amount off</option>
                <option value="FREE_SHIPPING">Free delivery</option>
              </select>
            </div>
            <div>
              <label className="admin-label" htmlFor="value">Value</label>
              <input id="value" name="value" type="number" min="0" step="0.01" placeholder="15" className="admin-input" />
            </div>
            <div>
              <label className="admin-label" htmlFor="minSubtotal">Min. spend (R)</label>
              <input id="minSubtotal" name="minSubtotal" type="number" min="0" step="0.01" placeholder="Optional" className="admin-input" />
            </div>
            <div>
              <label className="admin-label" htmlFor="maxUses">Max uses</label>
              <input id="maxUses" name="maxUses" type="number" min="1" placeholder="Unlimited" className="admin-input" />
            </div>
            <div>
              <label className="admin-label" htmlFor="expiresAt">Ends on</label>
              <input id="expiresAt" name="expiresAt" type="date" className="admin-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="admin-label" htmlFor="description">Internal note</label>
              <input id="description" name="description" placeholder="Instagram influencer campaign" className="admin-input" />
            </div>
            <div className="flex items-end">
              <SubmitButton variant="admin" className="w-full" pendingText="Creating…">Create code</SubmitButton>
            </div>
          </ActionForm>
        </section>

        <div className="space-y-6">
          <section className="admin-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-medium text-white"><Target className="h-4 w-4 text-gold-400" /> Ad pixels</h2>
              <Link href="/admin/settings/marketing" className="inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300">Configure <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              {pixels.map(([label, id]) => (
                <li key={label} className="flex items-center justify-between">
                  <span className="text-zinc-400">{label}</span>
                  {id ? <Badge tone="green">Live</Badge> : <Badge tone="zinc">Not set</Badge>}
                </li>
              ))}
            </ul>
          </section>

          <section className="admin-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-medium text-white"><Mail className="h-4 w-4 text-gold-400" /> Newsletter</h2>
              <a href="/api/admin/subscribers/export" className="inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300"><Download className="h-3.5 w-3.5" /> CSV</a>
            </div>
            <p className="mt-3 font-serif text-3xl text-white">{subscriberCount}</p>
            <p className="text-xs text-zinc-500">subscribers — import the CSV into Mailchimp, Klaviyo or Omnisend</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {recentSubscribers.length === 0 && <li className="text-zinc-500">No subscribers yet. The homepage and checkout sign-ups land here.</li>}
              {recentSubscribers.map((s) => (
                <li key={s.id} className="flex justify-between gap-3 text-zinc-400">
                  <span className="truncate">{s.email}</span>
                  <span className="shrink-0 text-xs text-zinc-600">{formatDate(s.createdAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section className="admin-card mt-6">
        <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-4">
          <ShoppingCart className="h-5 w-5 text-gold-400" />
          <div>
            <h2 className="font-medium text-white">Abandoned checkouts · 14 days</h2>
            <p className="text-xs text-zinc-500">Shoppers who started paying but didn&apos;t finish. A friendly WhatsApp often recovers the sale.</p>
          </div>
        </div>
        {abandoned.length === 0 ? (
          <EmptyState variant="admin" icon={ShoppingCart} title="No abandoned checkouts" description="Unpaid checkouts from the last 14 days show up here so you can follow up." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-zinc-800/60">
                {abandoned.map((o) => (
                  <tr key={o.id}>
                    <td className="px-6 py-3"><Link href={`/admin/orders/${o.id}`} className="text-gold-400 hover:text-gold-300">{o.orderNumber}</Link></td>
                    <td className="px-6 py-3"><p className="text-zinc-200">{o.customerName}</p><p className="text-xs text-zinc-500">{o.customerEmail}</p></td>
                    <td className="px-6 py-3 text-white">{formatZAR(o.totalAmount)}</td>
                    <td className="px-6 py-3 text-zinc-500">{formatDate(o.createdAt, true)}</td>
                    <td className="px-6 py-3 text-right">
                      {o.customerPhone && (
                        <a
                          href={whatsappLink(o.customerPhone, `Hi ${o.customerName.split(" ")[0]}, it's Zen Amour! We noticed your order didn't go through — can we help? Use code WELCOME10 for 10% off.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gold-400 hover:text-gold-300"
                        >
                          WhatsApp follow-up
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
