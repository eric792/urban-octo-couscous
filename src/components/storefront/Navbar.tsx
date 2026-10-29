"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/components/storefront/CartProvider";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Fragrances", href: "/shop?category=fragrances" },
  { label: "Skincare", href: "/shop?category=skincare" },
  { label: "Wellness", href: "/shop?category=wellness" },
  { label: "Shop All", href: "/shop" },
  { label: "Journal", href: "/blog" },
];

export function Navbar({ announcement }: { announcement: string | null }) {
  const { count, open, ready } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <>
      {announcement && (
        <div className="border-b border-gold-500/20 bg-gradient-to-r from-ink-900 via-gold-900/40 to-ink-900 px-4 py-2 text-center text-[10px] uppercase tracking-[0.12em] text-gold-200 sm:text-[11px] sm:tracking-[0.22em]">
          {announcement}
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-ink-500/60 bg-ink-900/80 backdrop-blur-md">
        <div className="container-luxe flex h-20 items-center justify-between gap-6">
          <button
            className="-ml-2 p-2 text-zinc-300 hover:text-gold-300 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <Link href="/" className="whitespace-nowrap font-serif text-xl font-semibold tracking-[0.22em] text-gold-400 sm:text-[26px] sm:tracking-[0.3em]">
            ZEN AMOUR
          </Link>

          <nav className="hidden items-center gap-8 text-xs uppercase tracking-[0.2em] text-zinc-300 md:flex" aria-label="Main">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-gold-300">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="p-2 text-zinc-300 transition hover:text-gold-300"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={open}
              className="relative p-2 text-zinc-300 transition hover:text-gold-300"
              aria-label={`Open bag, ${count} items`}
            >
              <ShoppingBag className="h-6 w-6" />
              {ready && count > 0 && (
                <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-ink-900">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-ink-500/60 bg-ink-900/95">
            <form onSubmit={submitSearch} className="container-luxe flex items-center gap-3 py-4">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search oud, serum, collagen…"
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                aria-label="Search products"
              />
              <button type="submit" className="btn-ghost">Search</button>
            </form>
          </div>
        )}

        <div
          className={cn(
            "overflow-hidden border-t border-ink-500/60 bg-ink-900 transition-[max-height] duration-300 md:hidden",
            menuOpen ? "max-h-96" : "max-h-0 border-t-0",
          )}
        >
          <nav className="container-luxe flex flex-col py-4" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-ink-600 py-3.5 text-sm uppercase tracking-[0.2em] text-zinc-300 last:border-0 hover:text-gold-300"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/track-order" className="py-3.5 text-sm uppercase tracking-[0.2em] text-zinc-500 hover:text-gold-300">
              Track your order
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
