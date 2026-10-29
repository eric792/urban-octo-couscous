import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";
import { Hero } from "@/components/storefront/Hero";
import { NewsletterForm } from "@/components/storefront/NewsletterForm";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductImage } from "@/components/storefront/ProductImage";
import { SectionHeading } from "@/components/storefront/SectionHeading";
import { StarRating } from "@/components/storefront/StarRating";
import { ValueProps } from "@/components/storefront/ValueProps";
import { getCategories, getFeaturedProducts, getPublishedPosts, getTestimonials } from "@/lib/catalog";
import { LEGAL_NAME, STORE_NAME } from "@/lib/constants";
import { getSettings } from "@/lib/settings";
import { formatDate, getAppUrl, jsonLd } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: "Inspired Perfumes & Skincare in South Africa | Zen Amour" },
  description:
    "Inspired perfumes, results-driven skincare and wellness rituals at an everyday price. Pargo pickup or courier delivery across South Africa.",
  alternates: { canonical: "/" },
};

const CATEGORY_ART: Record<string, string> = {
  fragrances: "/images/products/amber-saffron-extrait.svg",
  skincare: "/images/products/niacinamide-glow-serum.svg",
  wellness: "/images/products/marine-collagen-elixir.svg",
};

export default async function HomePage() {
  const [settings, featured, categories, testimonials, posts] = await Promise.all([
    getSettings(),
    getFeaturedProducts(8),
    getCategories(),
    getTestimonials(3),
    getPublishedPosts(3),
  ]);

  const rated = featured.filter((p) => p.rating !== null);
  const avgRating = rated.length ? rated.reduce((s, p) => s + (p.rating ?? 0), 0) / rated.length : null;

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: STORE_NAME,
    legalName: LEGAL_NAME,
    url: getAppUrl(),
    areaServed: "ZA",
    sameAs: [settings.instagramUrl, settings.facebookUrl, settings.tiktokUrl].filter(Boolean),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(orgJsonLd) }} />

      <Hero leftImage="/images/products/oud-royale.svg" rightImage="/images/products/velvet-musk.svg" />
      <ValueProps freeShippingThreshold={settings.freeShippingThreshold} rating={avgRating} />

      {/* Shop by category */}
      {categories.length > 0 && (
      <section className="container-luxe py-24">
        <SectionHeading eyebrow="The Collections" title="Curated Rituals" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {categories.map((c) => (
            <Link key={c.id} href={`/shop/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-ink-700">
              <ProductImage
                src={CATEGORY_ART[c.slug] ?? null}
                alt={c.name}
                sizes="(min-width: 768px) 33vw, 100vw"
                className="transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8">
                <p className="eyebrow">{c.productCount} pieces</p>
                <h3 className="mt-2 font-serif text-4xl text-white">{c.name}</h3>
                {c.description && <p className="mt-2 max-w-xs text-sm text-zinc-400">{c.description}</p>}
                <span className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold-300">
                  Discover <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="border-t border-ink-600 bg-ink-800/30 py-24">
          <div className="container-luxe">
            <SectionHeading eyebrow="Bestsellers" title="Most Coveted" href="/shop" linkLabel="Shop all" />
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
              {featured.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 4} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brand promise */}
      <section className="container-luxe grid items-center gap-12 py-24 lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden bg-ink-700">
          <ProductImage src="/images/products/oud-royale-2.svg" alt="Oud Royale with its gift box" sizes="(min-width: 1024px) 50vw, 100vw" />
        </div>
        <div className="space-y-6">
          <p className="eyebrow">The Zen Amour Promise</p>
          <h2 className="font-serif text-4xl font-light leading-tight text-white sm:text-5xl">
            The scents you covet. <span className="italic text-gold-300">The price you deserve.</span>
          </h2>
          <p className="text-zinc-400">
            We study the world&apos;s most celebrated fragrance profiles and reinterpret them with premium oils, then
            pair them with skincare and wellness formulas built on proven actives — so luxury becomes a daily ritual,
            not a special occasion.
          </p>
          <ul className="space-y-4 pt-2">
            {[
              ["Extrait-strength concentrations", "Rich oil concentrations that last from morning meetings to evening plans."],
              ["Effective active percentages", "Niacinamide, vitamin C and hyaluronic acid at levels that make a difference."],
              ["Blended in South Africa", "Made for our climate, delivered to your nearest Pargo point."],
            ].map(([title, text]) => (
              <li key={title} className="flex gap-4">
                <span className="mt-2 h-px w-8 shrink-0 bg-gold-500" />
                <div>
                  <p className="font-medium text-white">{title}</p>
                  <p className="text-sm text-zinc-500">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/shop/fragrances" className="btn-outline mt-4">
            Find your signature
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="border-y border-ink-600 bg-ink-800/30 py-24">
          <div className="container-luxe">
            <div className="mb-12 text-center">
              <p className="eyebrow">Kind Words</p>
              <h2 className="mt-3 font-serif text-4xl font-light text-white sm:text-5xl">From Our Community</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.id} className="card flex flex-col p-8">
                  <Quote className="h-6 w-6 text-gold-600" />
                  <blockquote className="mt-5 flex-1 font-serif text-xl leading-relaxed text-zinc-200">“{t.comment}”</blockquote>
                  <figcaption className="mt-6 flex items-center justify-between border-t border-ink-500 pt-5 text-sm">
                    <div>
                      <p className="text-white">{t.author}</p>
                      <Link href={`/product/${t.product.slug}`} className="text-xs text-gold-500 hover:text-gold-300">
                        {t.product.name}
                      </Link>
                    </div>
                    <StarRating rating={t.rating} />
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Journal */}
      {posts.length > 0 && (
        <section className="container-luxe py-24">
          <SectionHeading eyebrow="The Journal" title="Rituals & Guides" href="/blog" linkLabel="Read the journal" />
          <div className="grid gap-8 md:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                <div className="relative aspect-[16/9] overflow-hidden bg-ink-700">
                  <ProductImage src={post.coverImage} alt={post.title} sizes="(min-width: 768px) 33vw, 100vw" className="transition duration-700 group-hover:scale-105" />
                </div>
                <p className="mt-5 text-xs uppercase tracking-[0.2em] text-zinc-500">{formatDate(post.createdAt)}</p>
                <h3 className="mt-2 font-serif text-2xl leading-snug text-white group-hover:text-gold-300">{post.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="relative overflow-hidden border-t border-ink-600 py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold-900/30 via-ink-900 to-ink-900" />
        <div className="container-luxe flex flex-col items-center text-center">
          <p className="eyebrow">The Inner Circle</p>
          <h2 className="mt-3 max-w-2xl font-serif text-4xl font-light text-white sm:text-5xl">
            Early access, private sales &amp; 10% off your first order
          </h2>
          <div className="mt-10 flex w-full justify-center">
            <NewsletterForm source="homepage" />
          </div>
        </div>
      </section>
    </>
  );
}
