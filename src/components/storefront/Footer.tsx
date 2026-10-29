import Link from "next/link";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";
import { LEGAL_NAME } from "@/lib/constants";
import { whatsappLink } from "@/lib/utils";
import type { PublicSettings } from "@/types";

export function Footer({ settings }: { settings: PublicSettings }) {
  const socials = [
    settings.instagramUrl && { href: settings.instagramUrl, label: "Instagram", Icon: InstagramIcon },
    settings.facebookUrl && { href: settings.facebookUrl, label: "Facebook", Icon: FacebookIcon },
    settings.tiktokUrl && { href: settings.tiktokUrl, label: "TikTok", Icon: TikTokIcon },
    settings.whatsappNumber && { href: whatsappLink(settings.whatsappNumber), label: "WhatsApp", Icon: WhatsAppIcon },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof InstagramIcon }[];

  return (
    <footer className="border-t border-ink-500/80 bg-ink-950 py-16 text-sm text-zinc-400">
      <div className="container-luxe grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h4 className="mb-4 font-serif text-xl tracking-[0.3em] text-gold-400">ZEN AMOUR</h4>
          <p className="leading-relaxed text-zinc-500">
            Elevating daily rituals with accessible luxury formulas crafted for the discerning individual.
          </p>
          {socials.length > 0 && (
            <div className="mt-6 flex gap-3">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-500 text-zinc-400 transition hover:border-gold-500 hover:text-gold-300"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h5 className="mb-4 text-xs font-medium uppercase tracking-wider text-white">Shop</h5>
          <ul className="space-y-2.5">
            <li><Link href="/shop?category=fragrances" className="transition hover:text-gold-300">Alternative Fragrances</Link></li>
            <li><Link href="/shop?category=skincare" className="transition hover:text-gold-300">Skincare Essentials</Link></li>
            <li><Link href="/shop?category=wellness" className="transition hover:text-gold-300">Wellness &amp; Supplements</Link></li>
            <li><Link href="/blog" className="transition hover:text-gold-300">The Journal</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="mb-4 text-xs font-medium uppercase tracking-wider text-white">Customer Care</h5>
          <ul className="space-y-2.5">
            <li><Link href="/track-order" className="transition hover:text-gold-300">Track Your Order</Link></li>
            <li><Link href="/shipping" className="transition hover:text-gold-300">Shipping &amp; Returns</Link></li>
            <li><Link href="/contact" className="transition hover:text-gold-300">Contact Us</Link></li>
            <li><Link href="/privacy" className="transition hover:text-gold-300">Privacy (POPIA)</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="mb-4 text-xs font-medium uppercase tracking-wider text-white">Secure SA Checkout</h5>
          <p className="mb-4 text-zinc-500">
            Encrypted payments processed by Yoco &amp; Payfast in South African Rand (ZAR).
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] font-bold tracking-wider text-gold-400">
            <span className="border border-ink-500 bg-ink-800 px-2 py-1">YOCO</span>
            <span className="border border-ink-500 bg-ink-800 px-2 py-1">PAYFAST</span>
            <span className="border border-ink-500 bg-ink-800 px-2 py-1">VISA / MASTERCARD</span>
            <span className="border border-ink-500 bg-ink-800 px-2 py-1">INSTANT EFT</span>
          </div>
        </div>
      </div>
      <div className="container-luxe mt-12 border-t border-ink-700 pt-8 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} {LEGAL_NAME}. All rights reserved. Registered in South Africa.
      </div>
    </footer>
  );
}
