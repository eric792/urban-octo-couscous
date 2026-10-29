"use client";

import { Plus } from "lucide-react";
import { useCart } from "@/components/storefront/CartProvider";
import { trackAddToCart } from "@/lib/tracking/pixels";
import type { ProductCardDTO } from "@/types";

export function QuickAddButton({ product }: { product: ProductCardDTO }) {
  const { addItem } = useCart();
  const variant = product.variants.find((v) => v.stock > 0);
  if (!variant) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        addItem({
          variantId: variant.id,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          variantLabel: variant.volume,
          price: variant.price,
          image: product.images[0] ?? null,
          maxStock: variant.stock,
        });
        trackAddToCart({
          id: variant.sku,
          name: product.name,
          price: variant.price,
          quantity: 1,
          category: product.category.name,
          variant: variant.volume,
        });
      }}
      className="absolute bottom-3 left-3 right-3 flex translate-y-2 items-center justify-center gap-2 bg-ink-900/90 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-300 opacity-0 backdrop-blur transition group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100"
      aria-label={`Add ${product.name}${variant.volume ? ` ${variant.volume}` : ""} to bag`}
    >
      <Plus className="h-3.5 w-3.5" />
      Add {variant.volume ?? "to bag"}
    </button>
  );
}
