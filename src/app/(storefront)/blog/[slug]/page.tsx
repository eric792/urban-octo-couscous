import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductImage } from "@/components/storefront/ProductImage";
import { getFeaturedProducts, getPostBySlug } from "@/lib/catalog";
import { STORE_NAME } from "@/lib/constants";
import { renderMarkdown } from "@/lib/markdown";
import { absoluteUrl, formatDate, jsonLd } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Story not found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.excerpt, publishedTime: post.createdAt },
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const products = (await getFeaturedProducts(8)).slice(0, 3);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.createdAt,
    image: post.coverImage.startsWith("http") ? post.coverImage : absoluteUrl(post.coverImage),
    publisher: { "@type": "Organization", name: STORE_NAME },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };

  return (
    <article className="py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd) }} />
      <header className="container-luxe max-w-3xl text-center">
        <Link href="/blog" className="eyebrow hover:text-gold-300">The Journal</Link>
        <h1 className="mt-5 text-balance font-serif text-5xl font-light leading-tight text-white sm:text-6xl">{post.title}</h1>
        <p className="mt-5 text-sm uppercase tracking-[0.2em] text-zinc-500">{formatDate(post.createdAt)}</p>
      </header>
      <div className="container-luxe mt-12 max-w-5xl">
        <div className="relative aspect-[16/9] overflow-hidden bg-ink-700">
          <ProductImage src={post.coverImage} alt={post.title} priority sizes="(min-width: 1024px) 1024px, 100vw" />
        </div>
      </div>
      <div className="prose-luxe container-luxe mt-12 max-w-2xl">
        <p className="font-serif text-2xl leading-relaxed text-zinc-200">{post.excerpt}</p>
        {renderMarkdown(post.content)}
      </div>

      {products.length > 0 && (
        <section className="container-luxe mt-24 border-t border-ink-600 pt-16">
          <p className="eyebrow">Shop the story</p>
          <h2 className="mb-10 mt-3 font-serif text-4xl font-light text-white">Bestsellers</h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
