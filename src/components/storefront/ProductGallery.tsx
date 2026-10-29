"use client";

import { useState } from "react";
import { ProductImage } from "@/components/storefront/ProductImage";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const list = images.length ? images : [""];

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      {list.length > 1 && (
        <div className="flex gap-3 sm:flex-col">
          {list.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-24 w-20 overflow-hidden border bg-ink-700 transition",
                i === active ? "border-gold-400" : "border-transparent opacity-60 hover:opacity-100",
              )}
              aria-label={`Show image ${i + 1}`}
            >
              <ProductImage src={src} alt="" sizes="80px" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden bg-ink-700">
        <ProductImage src={list[active]} alt={name} priority sizes="(min-width: 1024px) 50vw, 100vw" />
      </div>
    </div>
  );
}
