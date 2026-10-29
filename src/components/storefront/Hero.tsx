import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ProductImage } from "@/components/storefront/ProductImage";

export function Hero({ leftImage, rightImage }: { leftImage?: string; rightImage?: string }) {
  return (
    <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-4 text-center">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-ink-600 via-ink-900 to-black" />
      <div className="absolute inset-0 -z-10 bg-[url('/images/hero-texture.svg')] bg-cover bg-center opacity-60" />
      <div className="absolute left-1/2 top-1/2 -z-10 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/10 blur-3xl" />

      {leftImage && (
        <div className="pointer-events-none absolute -left-10 bottom-10 hidden h-[460px] w-[340px] -rotate-6 opacity-50 [mask-image:radial-gradient(closest-side,black_55%,transparent)] xl:block">
          <ProductImage src={leftImage} alt="" sizes="340px" priority />
        </div>
      )}
      {rightImage && (
        <div className="pointer-events-none absolute -right-10 top-16 hidden h-[460px] w-[340px] rotate-6 opacity-50 [mask-image:radial-gradient(closest-side,black_55%,transparent)] xl:block">
          <ProductImage src={rightImage} alt="" sizes="340px" priority />
        </div>
      )}

      <div className="mx-auto max-w-3xl animate-fade-up space-y-7 py-24">
        <h1 className="space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 font-sans text-[10px] font-normal uppercase tracking-[0.14em] text-gold-300 sm:text-[11px] sm:tracking-[0.25em]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Inspired perfumes, skincare &amp; wellness · South Africa
          </span>{" "}
          <span className="block text-balance font-serif text-5xl font-light leading-[1.05] tracking-wide text-white sm:text-6xl lg:text-7xl">
            Quiet Luxury Meets <span className="gold-text font-normal italic">Everyday Price</span>
          </span>
        </h1>
        <p className="mx-auto max-w-xl text-base font-light text-zinc-400 sm:text-lg">
          Discover inspired alternative fragrances, high-efficacy skincare and premium wellness rituals designed for
          modern elegance.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row">
          <Link href="/shop" className="btn-gold w-full sm:w-auto">
            Explore Collection
          </Link>
          <Link href="/shop/fragrances" className="btn-outline w-full sm:w-auto">
            Best Fragrances
          </Link>
        </div>
      </div>
    </section>
  );
}
