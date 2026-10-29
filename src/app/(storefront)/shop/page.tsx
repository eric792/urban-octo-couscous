import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { SortSelect } from "@/components/storefront/SortSelect";
import { getCategories, searchProducts, type SortOption } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const SORTS: SortOption[] = ["featured", "newest", "price-asc", "price-desc", "rating"];
const PRICE_BANDS = [
  { key: "under-400", label: "Under R400", min: undefined, max: 399.99 },
  { key: "400-600", label: "R400 – R600", min: 400, max: 600 },
  { key: "over-600", label: "Over R600", min: 600.01, max: undefined },
];

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams;
  const category = one(params.category);
  const categories = await getCategories();
  const match = categories.find((c) => c.slug === category);
  return {
    title: match ? `${match.name} — Shop` : "Shop the Collection",
    description: match?.description ?? "Inspired fragrances, skincare and wellness essentials delivered across South Africa.",
    alternates: { canonical: match ? `/shop?category=${match.slug}` : "/shop" },
  };
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const category = one(params.category);
  const q = one(params.q)?.trim().slice(0, 80) || undefined;
  const sortParam = one(params.sort) as SortOption | undefined;
  const sort = sortParam && SORTS.includes(sortParam) ? sortParam : "featured";
  const priceKey = one(params.price);
  const band = PRICE_BANDS.find((b) => b.key === priceKey);
  const inStock = one(params.stock) === "1";

  const [categories, products] = await Promise.all([
    getCategories(),
    searchProducts({ category, q, sort, minPrice: band?.min, maxPrice: band?.max, inStock }),
  ]);
  const active = categories.find((c) => c.slug === category);

  const href = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { category, q, sort: sort === "featured" ? undefined : sort, price: priceKey, stock: inStock ? "1" : undefined, ...changes };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const s = next.toString();
    return s ? `/shop?${s}` : "/shop";
  };

  const filterLink = (selected: boolean) =>
    cn(
      "flex items-center justify-between py-1.5 text-sm transition",
      selected ? "text-gold-300" : "text-zinc-400 hover:text-white",
    );

  const filters = (
    <div className="space-y-10">
      <div>
        <h3 className="label">Category</h3>
        <ul className="space-y-1">
          <li>
            <Link href={href({ category: undefined })} className={filterLink(!category)}>
              All products
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={href({ category: c.slug })} className={filterLink(c.slug === category)}>
                {c.name}
                <span className="text-xs text-zinc-600">{c.productCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="label">Price</h3>
        <ul className="space-y-1">
          {PRICE_BANDS.map((b) => (
            <li key={b.key}>
              <Link href={href({ price: b.key === priceKey ? undefined : b.key })} className={filterLink(b.key === priceKey)}>
                {b.label}
                {b.key === priceKey && <X className="h-3.5 w-3.5" />}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="label">Availability</h3>
        <Link href={href({ stock: inStock ? undefined : "1" })} className={filterLink(inStock)}>
          <span className="flex items-center gap-2.5">
            <span className={cn("h-3.5 w-3.5 border", inStock ? "border-gold-400 bg-gold-400" : "border-ink-500")} />
            In stock only
          </span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="container-luxe py-14">
      <nav className="text-xs uppercase tracking-[0.18em] text-zinc-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-gold-300">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">{active?.name ?? "Shop"}</span>
      </nav>

      <header className="mb-12 mt-6 max-w-2xl">
        <h1 className="font-serif text-5xl font-light text-white sm:text-6xl">
          {q ? <>Results for “{q}”</> : active?.name ?? "The Collection"}
        </h1>
        <p className="mt-4 text-zinc-400">
          {active?.description ?? "Inspired fragrances, results-driven skincare and wellness rituals — all in one place."}
        </p>
      </header>

      <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>

        <div>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-ink-600 pb-5">
            <details className="lg:hidden">
              <summary className="btn-ghost cursor-pointer list-none px-0">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </summary>
              <div className="mt-6 border border-ink-500 bg-ink-800 p-6">{filters}</div>
            </details>
            <p className="text-sm text-zinc-500">
              {products.length} {products.length === 1 ? "product" : "products"}
              {q && (
                <Link href={href({ q: undefined })} className="ml-3 text-gold-400 hover:text-gold-300">
                  Clear search
                </Link>
              )}
            </p>
            <Suspense fallback={null}>
              <SortSelect value={sort} />
            </Suspense>
          </div>

          {products.length === 0 ? (
            <div className="card flex flex-col items-center gap-4 px-6 py-20 text-center">
              <p className="font-serif text-2xl text-white">Nothing matches those filters</p>
              <p className="text-sm text-zinc-500">Try another category or clear your filters.</p>
              <Link href="/shop" className="btn-outline mt-2">View everything</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 xl:grid-cols-3">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 3} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
