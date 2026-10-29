import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ProductImage } from "@/components/storefront/ProductImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPublishedPosts } from "@/lib/catalog";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "The Journal — Fragrance, Skincare & Wellness Guides",
  description: "Guides to layering fragrance, building a skincare routine and slowing down — from the Zen Amour team.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  const [lead, ...rest] = posts;

  return (
    <div className="container-luxe py-16">
      <p className="eyebrow">The Journal</p>
      <h1 className="mt-3 font-serif text-5xl font-light text-white sm:text-6xl">Rituals &amp; Guides</h1>
      <p className="mt-4 max-w-xl text-zinc-400">Thoughtful reading on scent, skin and slowing down.</p>

      {posts.length === 0 && (
        <EmptyState
          className="mt-14"
          icon={BookOpen}
          title="New stories are on their way"
          description="Our first guides to scent, skin and slowing down are being written."
          action={{ label: "Shop the collection", href: "/shop" }}
        />
      )}

      {lead && (
        <Link href={`/blog/${lead.slug}`} className="group mt-14 grid items-center gap-10 lg:grid-cols-2">
          <div className="relative aspect-[16/9] overflow-hidden bg-ink-700">
            <ProductImage src={lead.coverImage} alt={lead.title} priority sizes="(min-width: 1024px) 50vw, 100vw" className="transition duration-700 group-hover:scale-105" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{formatDate(lead.createdAt)}</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight text-white group-hover:text-gold-300">{lead.title}</h2>
            <p className="mt-4 text-zinc-400">{lead.excerpt}</p>
            <span className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-gold-400">Read the story →</span>
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <div className="mt-20 grid gap-10 md:grid-cols-3">
          {rest.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
              <div className="relative aspect-[16/9] overflow-hidden bg-ink-700">
                <ProductImage src={post.coverImage} alt={post.title} sizes="(min-width: 768px) 33vw, 100vw" className="transition duration-700 group-hover:scale-105" />
              </div>
              <p className="mt-5 text-xs uppercase tracking-[0.2em] text-zinc-500">{formatDate(post.createdAt)}</p>
              <h2 className="mt-2 font-serif text-2xl leading-snug text-white group-hover:text-gold-300">{post.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
