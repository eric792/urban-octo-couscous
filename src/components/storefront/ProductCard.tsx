import Link from "next/link";
import { ProductImage } from "@/components/storefront/ProductImage";
import { QuickAddButton } from "@/components/storefront/QuickAddButton";
import { StarRating } from "@/components/storefront/StarRating";
import { formatZAR } from "@/lib/utils";
import type { ProductCardDTO } from "@/types";

export function ProductCard({ product, priority = false }: { product: ProductCardDTO; priority?: boolean }) {
  const soldOut = product.variants.every((v) => v.stock <= 0);
  const cheapest = product.variants.find((v) => v.price === product.minPrice);
  const onSale = cheapest?.comparePrice && cheapest.comparePrice > cheapest.price;
  const multiple = product.variants.length > 1;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-ink-700">
        <ProductImage
          src={product.images[0]}
          alt={`${product.name} — ${product.category.name.toLowerCase()} by Zen Amour`}
          priority={priority}
          className="transition duration-700 group-hover:scale-[1.04]"
        />
        {product.images[1] && (
          <div className="absolute inset-0 opacity-0 transition duration-700 group-hover:opacity-100">
            <ProductImage src={product.images[1]} alt="" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {soldOut && (
            <span className="bg-ink-900/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-300">Sold out</span>
          )}
          {!soldOut && onSale && (
            <span className="bg-gold-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-900">Sale</span>
          )}
        </div>
        {!soldOut && <QuickAddButton product={product} />}
      </div>
      <div className="mt-4 space-y-1.5">
        <p className="eyebrow text-[10px] text-gold-500">{product.category.name}</p>
        <h3 className="font-serif text-xl leading-tight text-white transition group-hover:text-gold-300">{product.name}</h3>
        {product.tagline && <p className="line-clamp-1 text-sm text-zinc-500">{product.tagline}</p>}
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-sm text-zinc-200">
            {multiple && <span className="text-zinc-500">From </span>}
            <span className="font-medium">{formatZAR(product.minPrice)}</span>
            {onSale && <span className="ml-2 text-zinc-600 line-through">{formatZAR(cheapest!.comparePrice)}</span>}
          </p>
          {product.rating !== null && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <StarRating rating={product.rating} size="h-3 w-3" />
              ({product.reviewCount})
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
