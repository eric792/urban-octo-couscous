import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categoryPath, isFilteredView, ShopView, type ShopSearchParams } from "@/components/storefront/ShopView";
import { getCategories } from "@/lib/catalog";
import { STORE_NAME } from "@/lib/constants";
import { getSettings } from "@/lib/settings";

type Params = Promise<{ category: string }>;
type SearchParams = Promise<ShopSearchParams>;

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
  const [{ category: slug }, query] = await Promise.all([params, searchParams]);
  const category = (await getCategories()).find((c) => c.slug === slug);
  if (!category) return { title: "Category not found" };

  const title = category.seoTitle || `${category.heading || category.name} | ${STORE_NAME}`;
  const description = category.seoDescription || category.description || undefined;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: categoryPath(category.slug) },
    openGraph: { title, description, url: categoryPath(category.slug), images: [{ url: "/opengraph-image" }] },
    ...(isFilteredView(query) && { robots: { index: false, follow: true } }),
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ category: slug }, query] = await Promise.all([params, searchParams]);
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  return <ShopView category={category} categories={categories} params={query} freeShippingThreshold={settings.freeShippingThreshold} />;
}
