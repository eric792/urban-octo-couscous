"use client";

import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/storefront/CartProvider";
import { FreeShippingMeter } from "@/components/storefront/FreeShippingMeter";
import { ProductImage } from "@/components/storefront/ProductImage";
import { QuantityStepper } from "@/components/storefront/QuantityStepper";
import { formatZAR } from "@/lib/utils";

export function CartView({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const { items, ready, subtotal, updateQuantity, removeItem } = useCart();

  if (!ready) return <div className="h-64 animate-pulse bg-ink-800/60" />;

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-5 px-6 py-24 text-center">
        <ShoppingBag className="h-10 w-10 text-gold-600" />
        <h2 className="font-serif text-3xl text-white">Your bag is empty</h2>
        <p className="text-zinc-500">Find your next signature scent or skincare ritual.</p>
        <Link href="/shop" className="btn-gold mt-2">Shop the collection</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y divide-ink-600 border-y border-ink-600">
        {items.map((item) => (
          <li key={item.variantId} className="flex gap-5 py-6">
            <Link href={`/product/${item.slug}`} className="relative h-32 w-24 shrink-0 overflow-hidden bg-ink-700 sm:h-36 sm:w-28">
              <ProductImage src={item.image} alt={item.name} sizes="112px" />
            </Link>
            <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <Link href={`/product/${item.slug}`} className="font-serif text-2xl text-white hover:text-gold-300">{item.name}</Link>
                {item.variantLabel && <p className="mt-1 text-sm text-zinc-500">{item.variantLabel}</p>}
                <p className="mt-1 text-sm text-zinc-400">{formatZAR(item.price)}</p>
              </div>
              <div className="flex items-center justify-between gap-6 sm:justify-end">
                <QuantityStepper
                  value={item.quantity}
                  max={Math.min(item.maxStock, 20)}
                  onChange={(q) => updateQuantity(item.variantId, q)}
                />
                <span className="w-24 text-right font-medium text-gold-200">{formatZAR(item.price * item.quantity)}</span>
                <button onClick={() => removeItem(item.variantId)} className="p-2 text-zinc-500 hover:text-rose-300" aria-label={`Remove ${item.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="card h-fit space-y-6 p-7">
        <h2 className="font-serif text-2xl text-white">Summary</h2>
        <FreeShippingMeter subtotal={subtotal} threshold={freeShippingThreshold} />
        <div className="flex justify-between border-t border-ink-500 pt-5 text-sm">
          <span className="text-zinc-400">Subtotal</span>
          <span className="text-white">{formatZAR(subtotal)}</span>
        </div>
        <p className="text-xs text-zinc-500">Delivery options and discount codes are applied at checkout.</p>
        <Link href="/checkout" className="btn-gold w-full py-4">Secure Checkout</Link>
        <Link href="/shop" className="block text-center text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-gold-300">
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
