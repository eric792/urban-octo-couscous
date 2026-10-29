import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreditCard, RotateCcw, Store, Truck } from "lucide-react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { ProductPurchasePanel } from "@/components/storefront/ProductPurchasePanel";
import { StarRating } from "@/components/storefront/StarRating";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { STORE_NAME as STORE_NAME_TEXT } from "@/lib/constants";
import { breadcrumbJsonLd, productDescription, productJsonLd, productTitle, socialImage } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { formatDate, formatZAR, jsonLd, parseScentNotes } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const title = productTitle(product);
  const description = productDescription(product);
  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title, description, type: "website", url: `/product/${product.slug}`, images: [{ url: socialImage(product.images) }] },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, settings] = await Promise.all([
    getRelatedProducts(product.id, product.category.slug, 4),
    getSettings(),
  ]);
  const notes = parseScentNotes(product.scentNotes);

  const structuredData = [
    productJsonLd(product, settings),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: product.category.name, path: `/shop/${product.category.slug}` },
      { name: product.name, path: `/product/${product.slug}` },
    ]),
  ];
  const sizes = product.variants.map((v) => v.volume).filter(Boolean).join(" · ");
  const details = [
    ["Concentration", product.concentration],
    [product.concentration ? "Scent family" : "Type", product.scentFamily],
    ["Sizes", sizes || null],
  ].filter((d): d is [string, string] => Boolean(d[1]));

  return (
    <>
      {structuredData.map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
      ))}

      <div className="container-luxe py-10">
        <nav className="text-xs uppercase tracking-[0.18em] text-zinc-500" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-gold-300">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/shop/${product.category.slug}`} className="hover:text-gold-300">{product.category.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-300">{product.name}</span>
        </nav>

        <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <ProductGallery images={product.images} name={`${product.name}${product.concentration ? ` ${product.concentration}` : ""} by Zen Amour`} />

          <div className="lg:py-4">
            <p className="eyebrow">{product.category.name}</p>
            <h1 className="mt-3 font-serif text-5xl font-light leading-tight text-white sm:text-6xl">{product.name}</h1>
            {product.tagline && <p className="mt-3 text-lg text-zinc-400">{product.tagline}</p>}
            {product.rating !== null && (
              <a href="#reviews" className="mt-4 inline-flex items-center gap-3 text-sm text-zinc-400 hover:text-gold-300">
                <StarRating rating={product.rating} />
                {product.rating.toFixed(1)} · {product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"}
              </a>
            )}

            <div className="hairline my-8" />
            <ProductPurchasePanel product={product} />
            <div className="hairline my-8" />

            {notes.length > 0 && (
              <div className="mb-8">
                <h2 className="label">The Scent Pyramid</h2>
                <dl className="grid grid-cols-3 gap-3">
                  {notes.map((n) => (
                    <div key={n.tier} className="card p-4">
                      <dt className="text-[10px] uppercase tracking-[0.2em] text-gold-500">{n.tier}</dt>
                      <dd className="mt-2 font-serif text-lg leading-snug text-zinc-200">{n.notes}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {(details.length > 0 || product.inspiredBy) && (
              <div className="mb-8">
                <h2 className="label">Details</h2>
                <dl className="divide-y divide-ink-600 border-y border-ink-600 text-sm">
                  {details.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-6 py-3">
                      <dt className="text-zinc-500">{label}</dt>
                      <dd className="text-right text-zinc-200">{value}</dd>
                    </div>
                  ))}
                  {product.inspiredBy && (
                    <div className="flex justify-between gap-6 py-3">
                      <dt className="text-zinc-500">Inspired by</dt>
                      <dd className="text-right text-zinc-200">{product.inspiredBy}</dd>
                    </div>
                  )}
                </dl>
                {product.inspiredBy && (
                  <p className="mt-3 text-xs text-zinc-500">
                    {STORE_NAME_TEXT} is an independent brand and isn&apos;t affiliated with the owner of {product.inspiredBy}. The name is used only to describe the scent profile.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-4 text-[15px] leading-relaxed text-zinc-400">
              {product.description.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <ul className="mt-8 grid gap-3 text-sm text-zinc-400 sm:grid-cols-2">
              <li className="flex items-start gap-3"><Store className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />Collect from Pargo pickup points nationwide</li>
              <li className="flex items-start gap-3"><Truck className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />{settings.freeShippingThreshold > 0 ? `Free delivery over ${formatZAR(settings.freeShippingThreshold)}` : "Fast nationwide delivery"}</li>
              <li className="flex items-start gap-3"><CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />Secure card &amp; Instant EFT via Yoco or Payfast</li>
              <li className="flex items-start gap-3"><RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /><Link href="/shipping" className="hover:text-gold-300">Easy returns on unopened items</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <section id="reviews" className="border-t border-ink-600 bg-ink-800/30 py-20">
        <div className="container-luxe grid gap-12 lg:grid-cols-[280px_1fr]">
          <div>
            <p className="eyebrow">Reviews</p>
            <h2 className="mt-3 font-serif text-4xl font-light text-white">What clients say</h2>
            {product.rating !== null ? (
              <div className="mt-6">
                <p className="font-serif text-6xl text-gold-300">{product.rating.toFixed(1)}</p>
                <StarRating rating={product.rating} size="h-4 w-4" className="mt-2" />
                <p className="mt-2 text-sm text-zinc-500">Based on {product.reviewCount} verified reviews</p>
              </div>
            ) : (
              <p className="mt-6 text-sm text-zinc-500">No reviews yet — this piece is new to the collection.</p>
            )}
          </div>
          <div className="divide-y divide-ink-600">
            {product.reviews.length === 0 && (
              <p className="py-6 text-zinc-500">Be among the first to wear it. Reviews from verified buyers will appear here.</p>
            )}
            {product.reviews.map((r) => (
              <article key={r.id} className="py-6 first:pt-0">
                <div className="flex items-center justify-between">
                  <StarRating rating={r.rating} />
                  <time className="text-xs text-zinc-600">{formatDate(r.createdAt)}</time>
                </div>
                <p className="mt-3 text-zinc-300">{r.comment}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-zinc-500">{r.author} · Verified buyer</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-luxe py-20">
          <p className="eyebrow">You may also love</p>
          <h2 className="mb-10 mt-3 font-serif text-4xl font-light text-white">Complete the ritual</h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
