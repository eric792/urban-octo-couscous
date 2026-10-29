import Image from "next/image";
import { cn, isOptimizableImage } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center bg-ink-700 font-serif text-gold-600", className)}>
        Zen Amour
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!isOptimizableImage(src)}
      className={cn("object-cover", className)}
    />
  );
}
