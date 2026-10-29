"use client";

import { useEffect, useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/storefront/CartProvider";
import { QuantityStepper } from "@/components/storefront/QuantityStepper";
import { trackAddToCart, trackProductView } from "@/lib/tracking/pixels";
import { cn, formatZAR } from "@/lib/utils";
import type { ProductDetailDTO } from "@/types";

export function ProductPurchasePanel({ product }: { product: ProductDetailDTO }) {
  const { addItem } = useCart();
  const firstInStock = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstInStock?.id);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const variant = product.variants.find((v) => v.id === variantId) ?? firstInStock;

  useEffect(() => {
    if (!firstInStock) return;
    trackProductView({
      id: firstInStock.sku,
      name: product.name,
      price: firstInStock.price,
      category: product.category.name,
    });
    // Track once per product view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  if (!variant) return <p className="text-zinc-500">This product is currently unavailable.</p>;

  const soldOut = variant.stock <= 0;
  const maxQty = Math.max(1, Math.min(variant.stock, 20));

  const handleAdd = () => {
    addItem(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantLabel: variant.volume,
        price: variant.price,
        image: product.images[0] ?? null,
        maxStock: variant.stock,
      },
      quantity,
    );
    trackAddToCart({
      id: variant.sku,
      name: product.name,
      price: variant.price,
      quantity,
      category: product.category.name,
      variant: variant.volume,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="space-y-7">
      <div className="flex items-baseline gap-3">
        <span className="font-serif text-4xl text-white">{formatZAR(variant.price)}</span>
        {variant.comparePrice && variant.comparePrice > variant.price && (
          <>
            <span className="text-lg text-zinc-600 line-through">{formatZAR(variant.comparePrice)}</span>
            <span className="bg-gold-500/15 px-2 py-0.5 text-xs font-semibold text-gold-300">
              Save {Math.round((1 - variant.price / variant.comparePrice) * 100)}%
            </span>
          </>
        )}
      </div>

      {product.variants.length > 1 && (
        <div>
          <p className="label">Size</p>
          <div className="flex flex-wrap gap-3">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setVariantId(v.id);
                  setQuantity(1);
                }}
                className={cn(
                  "min-w-24 border px-5 py-3 text-sm transition",
                  v.id === variant.id
                    ? "border-gold-400 bg-gold-500/10 text-gold-200"
                    : "border-ink-500 text-zinc-300 hover:border-zinc-500",
                  v.stock <= 0 && "text-zinc-600 line-through",
                )}
                aria-pressed={v.id === variant.id}
              >
                <span className="block font-medium">{v.volume ?? "Standard"}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{formatZAR(v.price)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {!soldOut && <QuantityStepper value={quantity} max={maxQty} onChange={(q) => setQuantity(Math.max(1, Math.min(q, maxQty)))} />}
        <button type="button" onClick={handleAdd} disabled={soldOut} className="btn-gold flex-1 py-4">
          {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          {soldOut ? "Sold out" : added ? "Added to bag" : "Add to bag"}
        </button>
      </div>

      <p className="text-sm">
        {soldOut ? (
          <span className="text-zinc-500">This size is sold out — check back soon.</span>
        ) : variant.stock <= 5 ? (
          <span className="text-gold-300">Only {variant.stock} left — order soon.</span>
        ) : (
          <span className="flex items-center gap-2 text-emerald-300/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> In stock, ships in 1–2 working days
          </span>
        )}
      </p>
    </div>
  );
}
