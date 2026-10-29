import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import type {
  BlogPostDTO,
  CategoryDTO,
  ProductCardDTO,
  ProductDetailDTO,
  ReviewDTO,
} from "@/types";

const CACHE = { tags: ["catalog"], revalidate: 300 };

const cardInclude = {
  category: { select: { name: true, slug: true } },
  variants: { orderBy: [{ sortOrder: "asc" }, { price: "asc" }] },
  reviews: { select: { rating: true } },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

function toCard(p: CardRow): ProductCardDTO {
  const variants = p.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    volume: v.volume,
    price: toNumber(v.price),
    comparePrice: v.comparePrice ? toNumber(v.comparePrice) : null,
    stock: v.stock,
  }));
  const ratings = p.reviews.map((r) => r.rating);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    tagline: p.tagline,
    images: p.images,
    category: p.category,
    variants,
    isFeatured: p.isFeatured,
    rating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    reviewCount: ratings.length,
    minPrice: variants.length ? Math.min(...variants.map((v) => v.price)) : 0,
    createdAt: p.createdAt.toISOString(),
  };
}

export const getCategories = unstable_cache(
  async (): Promise<CategoryDTO[]> => {
    const rows = await db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      productCount: c._count.products,
    }));
  },
  ["categories"],
  CACHE,
);

export const getFeaturedProducts = unstable_cache(
  async (limit: number = 8): Promise<ProductCardDTO[]> => {
    const rows = await db.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: cardInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toCard);
  },
  ["featured-products"],
  CACHE,
);

export type SortOption = "featured" | "newest" | "price-asc" | "price-desc" | "rating";

export interface ProductFilters {
  category?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  inStock?: boolean;
}

export const searchProducts = unstable_cache(
  async (filters: ProductFilters): Promise<ProductCardDTO[]> => {
    const where: Prisma.ProductWhereInput = { isActive: true };
    if (filters.category) where.category = { slug: filters.category };
    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q, mode: "insensitive" } },
        { tagline: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
        { scentNotes: { contains: filters.q, mode: "insensitive" } },
      ];
    }
    const rows = await db.product.findMany({ where, include: cardInclude });
    let products = rows.map(toCard);

    if (filters.minPrice !== undefined) products = products.filter((p) => p.minPrice >= filters.minPrice!);
    if (filters.maxPrice !== undefined) products = products.filter((p) => p.minPrice <= filters.maxPrice!);
    if (filters.inStock) products = products.filter((p) => p.variants.some((v) => v.stock > 0));

    const sorters: Record<SortOption, (a: ProductCardDTO, b: ProductCardDTO) => number> = {
      featured: (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.reviewCount - a.reviewCount,
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      "price-asc": (a, b) => a.minPrice - b.minPrice,
      "price-desc": (a, b) => b.minPrice - a.minPrice,
      rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
    };
    return products.sort(sorters[filters.sort ?? "featured"]);
  },
  ["search-products"],
  CACHE,
);

export const getProductBySlug = unstable_cache(
  async (slug: string): Promise<ProductDetailDTO | null> => {
    const p = await db.product.findFirst({
      where: { slug, isActive: true },
      include: {
        ...cardInclude,
        reviews: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { fullName: true } } },
        },
      },
    });
    if (!p) return null;
    const reviews: ReviewDTO[] = p.reviews.map((r) => {
      const [first, last] = r.user.fullName.split(" ");
      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        author: last ? `${first} ${last[0]}.` : first,
        createdAt: r.createdAt.toISOString(),
      };
    });
    return { ...toCard(p), description: p.description, scentNotes: p.scentNotes, reviews };
  },
  ["product-by-slug"],
  CACHE,
);

export const getRelatedProducts = unstable_cache(
  async (productId: string, categorySlug: string, limit: number = 4): Promise<ProductCardDTO[]> => {
    const rows = await db.product.findMany({
      where: { isActive: true, id: { not: productId }, category: { slug: categorySlug } },
      include: cardInclude,
      take: limit,
    });
    return rows.map(toCard);
  },
  ["related-products"],
  CACHE,
);

export const getTestimonials = unstable_cache(
  async (limit: number = 3) => {
    const rows = await db.review.findMany({
      where: { rating: 5 },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { fullName: true } }, product: { select: { name: true, slug: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      comment: r.comment,
      rating: r.rating,
      author: r.user.fullName.split(" ")[0],
      product: r.product,
    }));
  },
  ["testimonials"],
  CACHE,
);

const BLOG_CACHE = { tags: ["blog"], revalidate: 300 };

function toPost(p: {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  createdAt: Date;
}): BlogPostDTO {
  return { ...p, createdAt: p.createdAt.toISOString() };
}

export const getPublishedPosts = unstable_cache(
  async (limit?: number): Promise<BlogPostDTO[]> => {
    const rows = await db.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toPost);
  },
  ["published-posts"],
  BLOG_CACHE,
);

export const getPostBySlug = unstable_cache(
  async (slug: string): Promise<BlogPostDTO | null> => {
    const p = await db.blogPost.findFirst({ where: { slug, published: true } });
    return p ? toPost(p) : null;
  },
  ["post-by-slug"],
  BLOG_CACHE,
);
