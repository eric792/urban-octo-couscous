import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { categoryPath, isFilteredView, one, ShopView, type ShopSearchParams } from "@/components/storefront/ShopView";
import { getCategories } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";

type SearchParams = Promise<ShopSearchParams>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams;
  return {
    title: "Shop Inspired Perfumes, Skincare & Wellness",
    description: "Shop Zen Amour's inspired fragrances, skincare and wellness rituals. Pargo pickup or courier delivery anywhere in South Africa.",
    alternates: { canonical: "/shop" },
    ...(isFilteredView(params) && { robots: { index: false, follow: true } }),
  };
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  // Old ?category= links move permanently to the clean /shop/<category> URL.
  const legacyCategory = one(params.category);
  if (legacyCategory) {
    const rest = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const v = one(value);
      if (key !== "category" && v) rest.set(key, v);
    }
    permanentRedirect(`${categoryPath(encodeURIComponent(legacyCategory))}${rest.size ? `?${rest}` : ""}`);
  }

  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);
  return <ShopView category={null} categories={categories} params={params} freeShippingThreshold={settings.freeShippingThreshold} />;
}
