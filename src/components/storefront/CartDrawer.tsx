"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/components/storefront/CartProvider";
import { FreeShippingMeter } from "@/components/storefront/FreeShippingMeter";
import { ProductImage } from "@/components/storefront/ProductImage";
import { QuantityStepper } from "@/components/storefront/QuantityStepper";
import { formatZAR } from "@/lib/utils";

export function CartDrawer({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const { items, isOpen, close, subtotal, updateQuantity, removeItem } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Your bag">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md animate-slide-in flex-col border-l border-ink-500 bg-ink-900">
        <div className="flex items-center justify-between border-b border-ink-500 px-6 py-5">
          <h2 className="font-serif text-2xl text-white">Your Bag</h2>
          <button onClick={close} className="p-1 text-zinc-400 hover:text-gold-300" aria-label="Close bag">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <ShoppingBag className="h-10 w-10 text-gold-600" />
            <p className="font-serif text-xl text-zinc-200">Your bag is empty</p>
            <p className="text-sm text-zinc-500">Discover fragrances, skincare and wellness rituals.</p>
            <Link href="/shop" onClick={close} className="btn-gold mt-2">
              Explore the collection
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-ink-500 px-6 py-4">
              <FreeShippingMeter subtotal={subtotal} threshold={freeShippingThreshold} />
            </div>
            <ul className="scrollbar-thin flex-1 divide-y divide-ink-600 overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-4 py-5">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={close}
                    className="relative h-24 w-20 shrink-0 overflow-hidden bg-ink-700"
                  >
                    <ProductImage src={item.image} alt={item.name} sizes="80px" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <div>
                        <Link href={`/product/${item.slug}`} onClick={close} className="font-serif text-lg leading-tight text-white hover:text-gold-300">
                          {item.name}
                        </Link>
                        {item.variantLabel && <p className="mt-0.5 text-xs text-zinc-500">{item.variantLabel}</p>}
                      </div>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="self-start p-1 text-zinc-500 hover:text-rose-300"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <QuantityStepper
                        size="sm"
                        value={item.quantity}
                        max={Math.min(item.maxStock, 20)}
                        onChange={(q) => updateQuantity(item.variantId, q)}
                      />
                      <span className="text-sm font-medium text-gold-200">{formatZAR(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-4 border-t border-ink-500 px-6 py-6">
              <div className="flex items-center justify-between text-sm">
                <span className="uppercase tracking-[0.18em] text-zinc-400">Subtotal</span>
                <span className="font-serif text-2xl text-white">{formatZAR(subtotal)}</span>
              </div>
              <p className="text-xs text-zinc-500">Delivery and discounts are calculated at checkout.</p>
              <Link href="/checkout" onClick={close} className="btn-gold w-full">
                Secure Checkout
              </Link>
              <Link href="/cart" onClick={close} className="btn-outline w-full">
                View Bag
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
