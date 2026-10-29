import Link from "next/link";
import { Suspense } from "react";
import { CreditCard, SlidersHorizontal, Store, Truck, X } from "lucide-react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { SortSelect } from "@/components/storefront/SortSelect";
import { searchProducts, type SortOption } from "@/lib/catalog";
import { extractFaqs, renderMarkdown } from "@/lib/markdown";
import { STORE_NAME } from "@/lib/constants";
import { absoluteUrl, cn, formatZAR, jsonLd } from "@/lib/utils";
import type { CategoryDTO } from "@/types";

export type ShopSearchParams = Record<string, string | string[] | undefined>;

const SORTS: SortOption[] = ["featured", "newest", "price-asc", "price-desc", "rating"];
const PRICE_BANDS = [
  { key: "under-400", label: "Under R400", min: undefined, max: 399.99 },
  { key: "400-600", label: "R400 – R600", min: 400, max: 600 },
  { key: "over-600", label: "Over R600", min: 600.01, max: undefined },
];

export function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Filtered, sorted or searched views shouldn't be indexed as separate pages. */
export function isFilteredView(params: ShopSearchParams): boolean {
  return ["q", "sort", "price", "stock", "page"].some((key) => one(params[key]));
}

export function categoryPath(slug: string): string {
  return `/shop/${slug}`;
}

export async function ShopView({
  category,
  categories,
  params,
  freeShippingThreshold,
}: {
  category: CategoryDTO | null;
  categories: CategoryDTO[];
  params: ShopSearchParams;
  freeShippingThreshold: number;
}) {
  const q = one(params.q)?.trim().slice(0, 80) || undefined;
  const sortParam = one(params.sort) as SortOption | undefined;
  const sort = sortParam && SORTS.includes(sortParam) ? sortParam : "featured";
  const priceKey = one(params.price);
  const band = PRICE_BANDS.find((b) => b.key === priceKey);
  const inStock = one(params.stock) === "1";

  const products = await searchProducts({
    category: category?.slug,
    q,
    sort,
    minPrice: band?.min,
    maxPrice: band?.max,
    inStock,
  });

  const basePath = category ? categoryPath(category.slug) : "/shop";
  const href = (changes: Record<string, string | undefined>, path = basePath) => {
    const next = new URLSearchParams();
    const merged = { q, sort: sort === "featured" ? undefined : sort, price: priceKey, stock: inStock ? "1" : undefined, ...changes };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const s = next.toString();
    return s ? `${path}?${s}` : path;
  };

  const filterLink = (selected: boolean) =>
    cn("flex items-center justify-between py-1.5 text-sm transition", selected ? "text-gold-300" : "text-zinc-400 hover:text-white");

  const filters = (
    <div className="space-y-10">
      <div>
        <p className="label">Category</p>
        <ul className="space-y-1">
          <li>
            <Link href={href({}, "/shop")} className={filterLink(!category)}>All products</Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={href({}, categoryPath(c.slug))} className={filterLink(c.slug === category?.slug)}>
                {c.name}
                <span className="text-xs text-zinc-600">{c.productCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="label">Price</p>
        <ul className="space-y-1">
          {PRICE_BANDS.map((b) => (
            <li key={b.key}>
              <Link href={href({ price: b.key === priceKey ? undefined : b.key })} rel="nofollow" className={filterLink(b.key === priceKey)}>
                {b.label}
                {b.key === priceKey && <X className="h-3.5 w-3.5" />}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="label">Availability</p>
        <Link href={href({ stock: inStock ? undefined : "1" })} rel="nofollow" className={filterLink(inStock)}>
          <span className="flex items-center gap-2.5">
            <span className={cn("h-3.5 w-3.5 border", inStock ? "border-gold-400 bg-gold-400" : "border-ink-500")} />
            In stock only
          </span>
        </Link>
      </div>
    </div>
  );

  const heading = q ? `Results for “${q}”` : category ? category.heading || category.name : "The Collection";
  const faqs = category ? extractFaqs(category.content) : [];
  const filtered = isFilteredView(params);

  const structuredData = category
    ? [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: category.heading || category.name,
          description: category.seoDescription || category.description || undefined,
          url: absoluteUrl(basePath),
          isPartOf: { "@type": "WebSite", name: STORE_NAME, url: absoluteUrl("/") },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: products.length,
            itemListElement: products.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: absoluteUrl(`/product/${p.slug}`),
              name: p.name,
            })),
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Shop", item: absoluteUrl("/shop") },
            { "@type": "ListItem", position: 3, name: category.name, item: absoluteUrl(basePath) },
          ],
        },
        ...(faqs.length
          ? [
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faqs.map((f) => ({
                  "@type": "Question",
                  name: f.question,
                  acceptedAnswer: { "@type": "Answer", text: f.answer },
                })),
              },
            ]
          : []),
      ]
    : [];

  return (
    <div className="container-luxe py-14">
      {!filtered &&
        structuredData.map((data, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
        ))}

      <nav className="text-xs uppercase tracking-[0.18em] text-zinc-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-gold-300">Home</Link>
        <span className="mx-2">/</span>
        {category ? (
          <>
            <Link href="/shop" className="hover:text-gold-300">Shop</Link>
            <span className="mx-2">/</span>
            <span className="text-zinc-300">{category.name}</span>
          </>
        ) : (
          <span className="text-zinc-300">Shop</span>
        )}
      </nav>

      <header className="mb-10 mt-6 max-w-2xl">
        <h1 className="font-serif text-5xl font-light text-white sm:text-6xl">{heading}</h1>
        <p className="mt-4 text-zinc-400">
          {category?.description ?? "Inspired fragrances, results-driven skincare and wellness rituals — all in one place."}
        </p>
      </header>

      <ul className="mb-10 flex flex-wrap gap-x-8 gap-y-3 text-xs text-zinc-400">
        <li className="flex items-center gap-2"><Store className="h-4 w-4 text-gold-400" /> Pargo pickup or door delivery nationwide</li>
        {freeShippingThreshold > 0 && (
          <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-gold-400" /> Free delivery over {formatZAR(freeShippingThreshold)}</li>
        )}
        <li className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-gold-400" /> Card or Instant EFT via Yoco &amp; Payfast</li>
      </ul>

      <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">{filters}</aside>

        <div>
          <h2 className="sr-only">{category ? `All ${category.name.toLowerCase()}` : "All products"}</h2>
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

      {category?.content && !filtered && (
        <section className="prose-luxe mx-auto mt-24 max-w-3xl border-t border-ink-600 pt-16">
          {renderMarkdown(category.content)}
        </section>
      )}
    </div>
  );
}
