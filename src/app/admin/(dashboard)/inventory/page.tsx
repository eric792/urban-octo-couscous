import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Eye, EyeOff, Plus, Search, Star } from "lucide-react";
import { toggleProductActive, updateStock } from "@/actions/admin-products";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ProductImage } from "@/components/storefront/ProductImage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { db } from "@/lib/db";
import { cn, formatZAR } from "@/lib/utils";

export const metadata = { title: "Inventory" };

type SearchParams = Promise<{ q?: string; category?: string; filter?: string }>;

export default async function AdminInventoryPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", category, filter } = await searchParams;
  const where: Prisma.ProductWhereInput = {
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { variants: { some: { sku: { contains: q, mode: "insensitive" } } } }] }),
    ...(category && { category: { slug: category } }),
    ...(filter === "low" && { variants: { some: { stock: { lte: 5 } } } }),
    ...(filter === "hidden" && { isActive: false }),
  };

  const [products, categories, totals] = await Promise.all([
    db.product.findMany({
      where,
      include: { category: true, variants: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.productVariant.aggregate({ _sum: { stock: true }, _count: true }),
  ]);
  const stockValue = await db.productVariant.findMany({ select: { stock: true, price: true } });
  const retailValue = stockValue.reduce((s, v) => s + Math.max(v.stock, 0) * Number(v.price), 0);

  const chip = (label: string, href: string, active: boolean) => (
    <Link
      href={href}
      className={cn(
        "whitespace-nowrap rounded px-3.5 py-2 text-xs font-medium uppercase tracking-wider transition",
        active ? "bg-gold-500 font-bold text-ink-900" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white",
      )}
    >
      {label}
    </Link>
  );

  return (
    <>
      <AdminHeader eyebrow="Product & Stock Control" title="Inventory">
        <div className="rounded border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300">
          {totals._sum.stock ?? 0} units · <span className="text-gold-400">{formatZAR(retailValue)}</span> retail value
        </div>
        <Link href="/admin/inventory/new" className="admin-btn"><Plus className="h-4 w-4" /> New product</Link>
      </AdminHeader>

      <div className="mb-6 flex flex-col justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 lg:flex-row lg:items-center">
        <div className="scrollbar-thin flex gap-2 overflow-x-auto">
          {chip("All", "/admin/inventory", !category && !filter)}
          {categories.map((c) => chip(c.name, `/admin/inventory?category=${c.slug}`, category === c.slug))}
          {chip("Low stock", "/admin/inventory?filter=low", filter === "low")}
          {chip("Hidden", "/admin/inventory?filter=hidden", filter === "hidden")}
        </div>
        <form className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input name="q" defaultValue={q} placeholder="Search name or SKU…" className="admin-input py-2 pl-9" />
        </form>
      </div>

      <div className="space-y-3">
        {products.length === 0 && <p className="admin-card p-10 text-center text-zinc-500">No products match.</p>}
        {products.map((p) => (
          <div key={p.id} className={cn("admin-card flex flex-col gap-5 p-4 md:flex-row md:items-start", !p.isActive && "opacity-60")}>
            <div className="flex flex-1 items-start gap-4">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded bg-zinc-800">
                <ProductImage src={p.images[0]} alt={p.name} sizes="64px" />
              </div>
              <div className="min-w-0">
                <Link href={`/admin/inventory/${p.id}`} className="flex items-center gap-2 font-medium text-white hover:text-gold-300">
                  {p.name}
                  {p.isFeatured && <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />}
                </Link>
                <p className="text-xs text-zinc-500">{p.category.name} · /product/{p.slug}</p>
                <div className="mt-3 flex gap-3">
                  <Link href={`/admin/inventory/${p.id}`} className="text-xs text-gold-400 hover:text-gold-300">Edit</Link>
                  <ActionForm action={toggleProductActive.bind(null, p.id)}>
                    <SubmitButton variant="plain" className="text-xs text-zinc-400 hover:text-white">
                      {p.isActive ? <><EyeOff className="h-3.5 w-3.5" /> Hide</> : <><Eye className="h-3.5 w-3.5" /> Show</>}
                    </SubmitButton>
                  </ActionForm>
                  {p.isActive && <Link href={`/product/${p.slug}`} target="_blank" className="text-xs text-zinc-500 hover:text-white">View ↗</Link>}
                </div>
              </div>
            </div>
            <div className="grid flex-[1.4] gap-2">
              {p.variants.map((v) => (
                <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded bg-zinc-950/60 px-3 py-2 text-sm">
                  <span className="w-36 font-mono text-xs text-zinc-500">{v.sku}</span>
                  <span className="w-24 text-zinc-300">{v.volume ?? "—"}</span>
                  <span className="w-24 text-white">{formatZAR(v.price)}</span>
                  <ActionForm action={updateStock.bind(null, v.id)} className="flex items-center gap-2" messageClassName="mt-0">
                    <input
                      name="stock"
                      type="number"
                      min={0}
                      defaultValue={v.stock}
                      aria-label={`Stock for ${v.sku}`}
                      className={cn(
                        "w-20 rounded border bg-zinc-950 px-2 py-1 text-right text-sm focus:border-gold-500 focus:outline-none",
                        v.stock === 0 ? "border-rose-500/50 text-rose-300" : v.stock <= 5 ? "border-gold-500/50 text-gold-300" : "border-zinc-800 text-zinc-200",
                      )}
                    />
                    <SubmitButton variant="plain" className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700">Save</SubmitButton>
                  </ActionForm>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
